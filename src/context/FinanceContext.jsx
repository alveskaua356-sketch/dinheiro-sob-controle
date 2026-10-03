import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "./AuthContext";
const Context = createContext(null);
export const defaults = {
  name: "",
  language: "pt-BR",
  currency: "BRL",
  theme: "light",
  notifications: true,
};
const initial = {
  transactions: [],
  categories: [],
  goals: [],
  budgets: [],
  settings: defaults,
};
export function FinanceProvider({ children }) {
  const { user } = useAuth();
  const [data, setData] = useState(initial),
    [owner, setOwner] = useState(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(null),
    [pending, setPending] = useState(0);
  const identity = useRef(user?.id);
  identity.current = user?.id;
  const generation = useRef(0);
  const load = useCallback(async () => {
    const uid = user?.id,
      version = ++generation.current;
    if (!uid || !supabase) {
      setData(initial);
      setOwner(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const tables = [
        "transactions",
        "categories",
        "goals",
        "budgets",
        "settings",
      ];
      const responses = await Promise.all(
        tables.map((table) => {
          // Paginate separately below to avoid silently dropping records at the API row cap.
          if (table === "settings")
            return supabase.from(table).select("*").eq("user_id", uid).single();
          return (async () => {
            const rows = [];
            for (let from = 0; ; from += 500) {
              const response = await supabase
                .from(table)
                .select("*")
                .eq("user_id", uid)
                .order("id")
                .range(from, from + 499);
              if (response.error) return response;
              rows.push(...response.data);
              if (response.data.length < 500)
                return { data: rows, error: null };
            }
          })();
        }),
      );
      const failed = responses.find((r) => r.error);
      if (failed) throw failed.error;
      if (identity.current !== uid || version !== generation.current) return;
      setData(
        Object.fromEntries(
          tables.map((table, index) => [table, responses[index].data]),
        ),
      );
      setOwner(uid);
    } catch (e) {
      if (identity.current === uid && version === generation.current)
        setError(e);
    } finally {
      if (version === generation.current) setLoading(false);
    }
  }, [user?.id]);
  useEffect(() => {
    setOwner(null);
    setData(initial);
    load();
    return () => {
      generation.current++;
    };
  }, [load]);
  useEffect(() => {
    if (!user?.id) return;
    const refresh = () => load();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [user?.id, load]);
  async function mutate(table, operation, payload, id) {
    const uid = user?.id;
    if (!uid || !supabase) throw new Error("notConfigured");
    setPending((n) => n + 1);
    try {
      let query;
      if (operation === "insert")
        query = supabase
          .from(table)
          .insert({ ...payload, user_id: uid })
          .select()
          .single();
      if (operation === "contribute")
        query = supabase
          .rpc("add_goal_progress", {
            goal_id: id,
            contribution_cents: payload.amount_cents,
          })
          .single();
      if (operation === "update")
        query = supabase
          .from(table)
          .update(payload)
          .eq("user_id", uid)
          .eq("id", id)
          .select()
          .single();
      if (operation === "delete")
        query = supabase
          .from(table)
          .delete()
          .eq("user_id", uid)
          .eq("id", id)
          .select()
          .single();
      const result = await query;
      if (result.error) throw result.error;
      if (identity.current !== uid) return result.data;
      setData((previous) => ({
        ...previous,
        [table]:
          operation === "insert"
            ? [result.data, ...previous[table]]
            : operation === "delete"
              ? previous[table].filter((r) => r.id !== id)
              : previous[table].map((r) => (r.id === id ? result.data : r)),
      }));
      return result.data;
    } finally {
      setPending((n) => Math.max(0, n - 1));
    }
  }
  async function updateSettings(patch) {
    const uid = user?.id;
    if (!uid || !supabase) throw new Error("notConfigured");
    const allowed = Object.fromEntries(
      Object.entries(patch).filter(([key]) => key in defaults),
    );
    setPending((n) => n + 1);
    try {
      const result = await supabase
        .from("settings")
        .update(allowed)
        .eq("user_id", uid)
        .select()
        .single();
      if (result.error) throw result.error;
      if (identity.current === uid)
        setData((d) => ({ ...d, settings: result.data }));
    } finally {
      setPending((n) => Math.max(0, n - 1));
    }
  }
  const current = owner === user?.id ? data : initial;
  return (
    <Context.Provider
      value={{
        ...current,
        loading: loading || Boolean(user && owner !== user.id && !error),
        error,
        pending,
        load,
        mutate,
        updateSettings,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useFinance = () => useContext(Context);
