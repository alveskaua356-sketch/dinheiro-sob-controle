import {
  cloneElement,
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Wallet,
  LayoutDashboard,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  ChartNoAxesCombined,
  SlidersHorizontal,
  Tags,
  Plus,
  Search,
  Pencil,
  Trash2,
  LogOut,
  Moon,
  Sun,
  Bell,
  Check,
  ShieldCheck,
  Menu,
  X,
  LoaderCircle,
  TriangleAlert,
  TrendingUp,
  CalendarDays,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { FinanceProvider, useFinance } from "./context/FinanceContext";
import { LocaleProvider, useLocale, errorKey } from "./lib/i18n";
import { isSupabaseReady } from "./lib/supabaseClient";
import {
  today,
  monthNow,
  toCents,
  money,
  summary,
  filterTransactions,
  categoryTotals,
  monthSeries,
  balanceSeries,
  budgetStatus,
  progress,
} from "./lib/finance";

const NoticeContext = createContext(null);
function NoticeProvider({ children }) {
  const { t } = useLocale();
  const [notice, setNotice] = useState(null);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 6500);
    return () => clearTimeout(timer);
  }, [notice]);
  const notify = (message, type = "success") =>
    setNotice({ message, type, id: Date.now() });
  return (
    <NoticeContext.Provider value={notify}>
      {children}
      {notice && (
        <div
          key={notice.id}
          className={`toast ${notice.type}`}
          role={notice.type === "error" ? "alert" : "status"}
        >
          <span>
            {notice.type === "error" ? (
              <TriangleAlert size={19} />
            ) : (
              <Check size={19} />
            )}
          </span>
          {notice.message}
          <button aria-label={t("cancel")} onClick={() => setNotice(null)}>
            <X size={18} />
          </button>
        </div>
      )}
    </NoticeContext.Provider>
  );
}
const useNotice = () => useContext(NoticeContext);
function Brand() {
  const { t } = useLocale();
  return (
    <Link to="/" className="brand">
      <span className="brand-icon">
        <Wallet size={22} />
      </span>
      <span>
        {t("brand")}
        <small>{t("panel")}</small>
      </span>
    </Link>
  );
}
function Loading() {
  const { t } = useLocale();
  return (
    <div className="loading" role="status">
      <LoaderCircle className="spin" size={28} />
      {t("loading")}
    </div>
  );
}
function Empty({ text }) {
  return (
    <div className="empty">
      <Wallet size={25} />
      <p>{text}</p>
    </div>
  );
}
function Alert({ children }) {
  return (
    <div className="inline-alert" role="alert">
      <TriangleAlert size={19} />
      <span>{children}</span>
    </div>
  );
}
function Modal({ title, onClose, children }) {
  const ref = useRef();
  const { t } = useLocale();
  useEffect(() => {
    ref.current.showModal();
    return () => {
      ref.current?.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="modal-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-heading">
        <h2 id="modal-title">{title}</h2>
        <button
          className="icon-button"
          aria-label={t("cancel")}
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
function Field({ label, children, ...props }) {
  const id = useId();
  const control =
    children && ["select", "input"].includes(children.type)
      ? cloneElement(children, { "aria-labelledby": id })
      : children;
  return (
    <label className="field">
      <span id={id}>{label}</span>
      {control || <input aria-labelledby={id} {...props} />}
    </label>
  );
}
function FormActions({ busy, onClose, label }) {
  const { t } = useLocale();
  return (
    <div className="form-actions">
      <button
        className="button secondary"
        type="button"
        disabled={busy}
        onClick={onClose}
      >
        {t("cancel")}
      </button>
      <button className="button" disabled={busy}>
        {busy ? (
          <>
            <LoaderCircle size={17} className="spin" />
            {t("saving")}
          </>
        ) : (
          label || t("save")
        )}
      </button>
    </div>
  );
}
function ConfirmDelete({ onClose, onConfirm }) {
  const { t } = useLocale();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <Modal title={t("deleteTitle")} onClose={() => !busy && onClose()}>
      <p className="muted">{t("deleteBody")}</p>
      {error && <Alert>{error}</Alert>}
      <div className="form-actions">
        <button className="button secondary" disabled={busy} onClick={onClose}>
          {t("cancel")}
        </button>
        <button
          className="button danger"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onConfirm();
              onClose();
            } catch (e) {
              setError(t(errorKey(e)));
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? t("saving") : t("delete")}
        </button>
      </div>
    </Modal>
  );
}
function Landing() {
  const { t, locale, setLanguage } = useLocale();
  return (
    <div className="landing">
      <header className="landing-nav">
        <Brand />
        <div className="nav-actions">
          <select
            aria-label={t("language")}
            value={locale}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="pt-BR">PT</option>
            <option value="en-US">EN</option>
          </select>
          <Link className="button secondary" to="/login">
            {t("login")}
          </Link>
          <Link className="button" to="/cadastro">
            {t("register")}
          </Link>
        </div>
      </header>
      <main>
        <section className="hero">
          <div>
            <p className="eyebrow">{t("heroTag")}</p>
            <h1>{t("hero")}</h1>
            <p className="hero-body">{t("heroBody")}</p>
            <div className="hero-actions">
              <Link className="button large" to="/cadastro">
                {t("register")}
              </Link>
              <Link className="button secondary large" to="/login">
                {t("login")}
              </Link>
            </div>
            <p className="hero-foot">
              <ShieldCheck size={18} />
              {t("heroFooter")}
            </p>
          </div>
          <div className="hero-panel">
            <div className="hero-panel-top">
              <span className="brand-icon">
                <Wallet size={25} />
              </span>
              <span>{t("panel")}</span>
            </div>
            <h2>{t("landingCardTitle")}</h2>
            <p>{t("landingCardBody")}</p>
            <div className="hero-features">
              {[
                ["transactions", Wallet],
                ["budget", ChartNoAxesCombined],
                ["goals", Target],
              ].map(([key, Icon], i) => (
                <div key={key}>
                  <span className="feature-number">0{i + 1}</span>
                  <Icon size={21} />
                  <span>{t(key)}</span>
                  <Check size={18} />
                </div>
              ))}
            </div>
            <div className="hero-panel-foot">
              <ShieldCheck size={17} />
              {t("private")}
            </div>
          </div>
        </section>
        <section className="benefits">
          {[
            ["benefit1", "benefit1Body", ChartNoAxesCombined],
            ["benefit2", "benefit2Body", Wallet],
            ["benefit3", "benefit3Body", Target],
          ].map(([title, body, Icon]) => (
            <article key={title}>
              <span className="benefit-icon">
                <Icon size={25} />
              </span>
              <h3>{t(title)}</h3>
              <p>{t(body)}</p>
            </article>
          ))}
        </section>
        <section className="privacy-strip">
          <ShieldCheck size={32} />
          <div>
            <h2>{t("private")}</h2>
            <p>{t("privateBody")}</p>
          </div>
          <Link className="button" to="/cadastro">
            {t("register")}
          </Link>
        </section>
      </main>
      <footer>
        <Brand />
        <span>{t("footer")}</span>
      </footer>
    </div>
  );
}
function AuthPage({ mode = "login" }) {
  const { t, locale, setLanguage } = useLocale();
  const auth = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const emailRef = useRef();
  const title = {
    login: "login",
    signup: "register",
    reset: "reset",
    password: "newPassword",
  }[mode];
  async function submit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    const f = Object.fromEntries(new FormData(e.currentTarget));
    try {
      if (mode === "signup" || mode === "password") {
        if (f.password.length < 8) throw new Error("passwordShort");
        if (f.password !== f.confirm) throw new Error("passwordMismatch");
      }
      if (mode === "login") {
        await auth.signIn(f);
        navigate("/dashboard");
      }
      if (mode === "signup") {
        const result = await auth.signUp(f);
        if (result.session) navigate("/dashboard");
        else setMessage(t("checkEmail"));
      }
      if (mode === "reset") {
        await auth.resetPassword(f.email);
        setMessage(t("resetSent"));
      }
      if (mode === "password") {
        await auth.changePassword(f.password);
        setMessage(t("passwordChanged"));
        navigate("/dashboard");
      }
    } catch (err) {
      setError(t(errorKey(err)));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <div className="auth-nav">
        <Brand />
        <select
          value={locale}
          aria-label={t("language")}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="pt-BR">Português</option>
          <option value="en-US">English</option>
        </select>
      </div>
      <div className="auth-card">
        <p className="eyebrow">{t("panel")}</p>
        <h1>{t(title)}</h1>
        {!isSupabaseReady && <Alert>{t("notConfigured")}</Alert>}
        {error && <Alert>{error}</Alert>}
        {message && (
          <p className="success-message" role="status">
            {message}
          </p>
        )}
        {mode === "password" && auth.authReady && !auth.session && (
          <Alert>{t("authExpired")}</Alert>
        )}
        <form onSubmit={submit} className="form" aria-busy={busy}>
          {mode === "signup" && (
            <Field
              label={t("name")}
              name="name"
              autoComplete="name"
              required
              maxLength={100}
            />
          )}
          {mode !== "password" && (
            <Field label={t("email")}>
              <input
                ref={emailRef}
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
              />
            </Field>
          )}
          {mode !== "reset" && (
            <Field
              label={t("password")}
              name="password"
              type="password"
              minLength={mode === "login" ? 1 : 8}
              required
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
            />
          )}
          {(mode === "signup" || mode === "password") && (
            <>
              <Field
                label={t("confirmPassword")}
                name="confirm"
                type="password"
                minLength={8}
                autoComplete="new-password"
                required
              />
              <small className="muted">{t("signupHelp")}</small>
            </>
          )}
          <button
            className="button full"
            disabled={
              busy || !isSupabaseReady || (mode === "password" && !auth.session)
            }
          >
            {busy ? <LoaderCircle className="spin" size={18} /> : t(title)}
          </button>
        </form>
        {mode === "login" && (
          <div className="auth-links">
            <Link to="/recuperar-senha">{t("recover")}</Link>
            <button
              className="text-button"
              disabled={busy || !isSupabaseReady}
              onClick={async () => {
                const email = emailRef.current.value;
                if (!emailRef.current.reportValidity()) return;
                setBusy(true);
                setError("");
                try {
                  await auth.resend(email);
                  setMessage(t("confirmationSent"));
                } catch (e) {
                  setError(t(errorKey(e)));
                } finally {
                  setBusy(false);
                }
              }}
            >
              {t("resend")}
            </button>
          </div>
        )}
        <div className="auth-bottom">
          {mode === "login" ? (
            <>
              {t("noAccount")} <Link to="/cadastro">{t("register")}</Link>
            </>
          ) : (
            <Link to="/login">{t("backLogin")}</Link>
          )}
        </div>
      </div>
    </div>
  );
}
function Callback() {
  const { authReady, user, authError } = useAuth();
  const { t } = useLocale();
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(id);
  }, []);
  if (authReady && user) return <Navigate to="/dashboard" replace />;
  return (
    <div className="auth-page">
      <Brand />
      <div className="auth-card">
        {authError || timedOut ? (
          <>
            <Alert>{t("callbackFailed")}</Alert>
            <Link className="button" to="/login">
              {t("login")}
            </Link>
          </>
        ) : (
          <Loading />
        )}
      </div>
    </div>
  );
}
function Protected() {
  const { authReady, user, authError, recovery } = useAuth();
  const { t } = useLocale();
  if (!authReady) return <Loading />;
  if (authError)
    return (
      <div className="auth-page">
        <Alert>{t("loadError")}</Alert>
        <Link className="button" to="/login">
          {t("login")}
        </Link>
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  if (recovery) return <Navigate to="/redefinir-senha" replace />;
  if (!user.email_confirmed_at)
    return (
      <div className="auth-page">
        <Alert>{t("emailUnconfirmed")}</Alert>
        <Link className="button" to="/login">
          {t("login")}
        </Link>
      </div>
    );
  return <Outlet />;
}
const navigation = [
  ["dashboard", "/dashboard", LayoutDashboard],
  ["transactions", "/transacoes", Wallet],
  ["categories", "/categorias", Tags],
  ["goals", "/metas", Target],
  ["budget", "/orcamento", CalendarDays],
  ["reports", "/relatorios", ChartNoAxesCombined],
  ["settings", "/configuracoes", SlidersHorizontal],
];
function Shell() {
  const { user, signOut } = useAuth();
  const finance = useFinance();
  const { t, locale, categoryName, setLanguage } = useLocale();
  const notify = useNotice();
  const navigate = useNavigate();
  const location = useLocation();
  const [menu, setMenu] = useState(false),
    [alertsOpen, setAlertsOpen] = useState(false);
  const {
    settings,
    transactions,
    budgets,
    categories,
    loading,
    error,
    pending,
  } = finance;
  useEffect(() => {
    setMenu(false);
    setAlertsOpen(false);
  }, [location.pathname]);
  const title =
    navigation.find((r) => r[1] === location.pathname)?.[0] || "dashboard";
  const currentMonth = monthNow();
  const spent = categoryTotals(
    transactions.filter((r) => r.date.startsWith(currentMonth)),
    categories,
  );
  const alerts = budgets
    .filter(
      (b) =>
        b.month === currentMonth &&
        ["near", "over"].includes(
          budgetStatus(
            spent.find((c) => c.id === b.category_id)?.value || 0,
            b.limit_cents,
            b.alert_threshold,
          ),
        ),
    )
    .map((b) => ({
      ...b,
      name: categoryName(
        categories.find((c) => c.id === b.category_id) || { name: "" },
      ),
      status: budgetStatus(
        spent.find((c) => c.id === b.category_id)?.value || 0,
        b.limit_cents,
        b.alert_threshold,
      ),
    }));
  async function change(patch) {
    try {
      await finance.updateSettings(patch);
      if (patch.language) setLanguage(patch.language);
    } catch (e) {
      notify(t(errorKey(e)), "error");
    }
  }
  return (
    <div className={`app-shell ${settings.theme === "dark" ? "dark" : ""}`}>
      <aside className={`sidebar ${menu ? "open" : ""}`}>
        <Brand />
        <nav aria-label={t("panel")}>
          {navigation.map(([key, path, Icon]) => (
            <Link
              key={key}
              className={location.pathname === path ? "active" : ""}
              to={path}
              aria-current={location.pathname === path ? "page" : undefined}
            >
              <Icon size={20} />
              <span>{t(key)}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="user-info">
            <span className="avatar">
              {(settings.name || user.user_metadata?.name || user.email)
                .slice(0, 1)
                .toUpperCase()}
            </span>
            <div>
              <strong>
                {settings.name || user.user_metadata?.name || t("name")}
              </strong>
              <small>{user.email}</small>
            </div>
          </div>
          <button
            className="sidebar-logout"
            onClick={async () => {
              try {
                await signOut();
                navigate("/login");
              } catch (e) {
                notify(t(errorKey(e)), "error");
              }
            }}
          >
            <LogOut size={19} />
            {t("logout")}
          </button>
        </div>
      </aside>
      {menu && (
        <button
          className="mobile-backdrop"
          aria-label={t("cancel")}
          onClick={() => setMenu(false)}
        />
      )}
      <div className="main-area">
        <header className="topbar">
          <div className="topbar-title">
            <button
              className="icon-button mobile-menu"
              aria-label={t("panel")}
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              <Menu size={22} />
            </button>
            <span>{t("panel")}</span>
          </div>
          <div className="topbar-actions">
            <select
              aria-label={t("language")}
              value={locale}
              disabled={Boolean(pending) || loading || Boolean(error)}
              onChange={(e) => change({ language: e.target.value })}
            >
              <option value="pt-BR">PT</option>
              <option value="en-US">EN</option>
            </select>
            <button
              className="icon-button"
              aria-label={t("toggleTheme")}
              disabled={Boolean(pending) || loading || Boolean(error)}
              onClick={() =>
                change({ theme: settings.theme === "dark" ? "light" : "dark" })
              }
            >
              {settings.theme === "dark" ? (
                <Sun size={20} />
              ) : (
                <Moon size={20} />
              )}
            </button>
            {settings.notifications && (
              <button
                className="icon-button notification-button"
                aria-label={t("notifications")}
                aria-expanded={alertsOpen}
                onClick={() => setAlertsOpen(!alertsOpen)}
              >
                <Bell size={20} />
                {alerts.length > 0 && (
                  <span className="notification-count">{alerts.length}</span>
                )}
              </button>
            )}
          </div>
        </header>
        {alertsOpen && (
          <section className="alerts-panel" aria-label={t("notifications")}>
            <h3>{t("notifications")}</h3>
            {alerts.length ? (
              alerts.map((a) => (
                <Link key={a.id} to="/orcamento">
                  <TriangleAlert size={17} />
                  {a.name}: {t(a.status)}
                </Link>
              ))
            ) : (
              <p className="muted">{t("notificationsEmpty")}</p>
            )}
          </section>
        )}
        <main className="content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">
                {t("welcome")}
                {settings.name ? `, ${settings.name.split(" ")[0]}` : ""}
              </p>
              <h1>{t(title)}</h1>
              <p className="muted">
                {t(title === "reports" ? "reportBody" : "overviewBody")}
              </p>
            </div>
            {title === "dashboard" && !loading && !error && (
              <Link to="/transacoes?novo=1" className="button">
                <Plus size={18} />
                {t("newTransaction")}
              </Link>
            )}
          </div>
          {loading ? (
            <Loading />
          ) : error ? (
            <div className="card">
              <Alert>{t("loadError")}</Alert>
              <button className="button" onClick={finance.load}>
                {t("retry")}
              </button>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}
function PeriodFilter({ filters, setFilters }) {
  const { t } = useLocale();
  return (
    <div className="period-filter">
      <Field
        label={t("start")}
        type="date"
        value={filters.start}
        onChange={(e) => setFilters({ ...filters, start: e.target.value })}
      />
      <Field
        label={t("end")}
        type="date"
        value={filters.end}
        onChange={(e) => setFilters({ ...filters, end: e.target.value })}
      />
      <button
        className="text-button"
        onClick={() => setFilters({ start: "", end: "" })}
      >
        {t("all")}
      </button>
    </div>
  );
}
function Stat({ label, value, Icon, tone, caption }) {
  return (
    <article className={`stat card ${tone || ""}`}>
      <div className="stat-top">
        <span>{label}</span>
        <span className="stat-icon">
          <Icon size={19} />
        </span>
      </div>
      <strong>{value}</strong>
      <small>{caption}</small>
    </article>
  );
}
function Stats({ totals, balance }) {
  const { t, locale } = useLocale();
  const { settings } = useFinance();
  const fmt = (v) => money(v, locale, settings.currency);
  return (
    <div className="stats-grid">
      <Stat
        label={t("balance")}
        value={fmt(balance)}
        Icon={Wallet}
        tone="featured"
        caption={t("allTime")}
      />
      <Stat
        label={t("income")}
        value={fmt(totals.income)}
        Icon={ArrowUpRight}
        tone="income"
        caption={t("thisPeriod")}
      />
      <Stat
        label={t("expense")}
        value={fmt(totals.expenses)}
        Icon={ArrowDownRight}
        tone="expense"
        caption={t("thisPeriod")}
      />
      <Stat
        label={t("result")}
        value={fmt(totals.balance)}
        Icon={TrendingUp}
        caption={`${totals.count} ${t("count").toLowerCase()}`}
      />
    </div>
  );
}
function FinancialCharts({ rows, filters, balance = false, allRows }) {
  const { categories, settings } = useFinance();
  const { t, locale, categoryName } = useLocale();
  const fmt = (v) => money(v, locale, settings.currency);
  const data = balance
    ? balanceSeries(allRows, filters)
    : monthSeries(rows, filters.start, filters.end, locale);
  const pie = categoryTotals(rows, categories)
    .filter((c) => c.value > 0)
    .map((c) => ({ ...c, label: categoryName(c) }));
  return (
    <div className={`charts-grid ${balance ? "balance-only" : ""}`}>
      <section className="card chart-wide">
        <div className="section-heading">
          <h2>{t(balance ? "balanceEvolution" : "comparison")}</h2>
          <span className="chart-key">
            <i />
            {t(balance ? "balance" : "income")}
          </span>
        </div>
        {rows.length ? (
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              {balance ? (
                <AreaChart data={data}>
                  <defs>
                    <linearGradient
                      id="balanceGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#3d9b74"
                        stopOpacity={0.35}
                      />
                      <stop offset="100%" stopColor="#3d9b74" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) =>
                      new Intl.DateTimeFormat(locale, {
                        day: "numeric",
                        month: "short",
                      }).format(new Date(`${v}T12:00:00`))
                    }
                    tick={{ fill: "var(--muted)", fontSize: 12 }}
                  />
                  <YAxis
                    tickFormatter={(v) =>
                      new Intl.NumberFormat(locale, {
                        notation: "compact",
                      }).format(v / 100)
                    }
                    tick={{ fill: "var(--muted)", fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={fmt}
                    contentStyle={{
                      background: "var(--card)",
                      color: "var(--text)",
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                    }}
                  />
                  <Area
                    isAnimationActive={false}
                    name={t("balance")}
                    dataKey="balance"
                    stroke="#3d9b74"
                    strokeWidth={3}
                    fill="url(#balanceGradient)"
                  />
                </AreaChart>
              ) : (
                <BarChart data={data}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "var(--muted)", fontSize: 12 }}
                  />
                  <YAxis
                    tickFormatter={(v) =>
                      new Intl.NumberFormat(locale, {
                        notation: "compact",
                      }).format(v / 100)
                    }
                    tick={{ fill: "var(--muted)", fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={fmt}
                    contentStyle={{
                      background: "var(--card)",
                      color: "var(--text)",
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                    }}
                  />
                  <Legend />
                  <Bar
                    isAnimationActive={false}
                    name={t("income")}
                    dataKey="income"
                    fill="#3d9b74"
                    radius={[5, 5, 0, 0]}
                  />
                  <Bar
                    isAnimationActive={false}
                    name={t("expense")}
                    dataKey="expenses"
                    fill="#e4a33b"
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        ) : (
          <Empty text={t("emptyFilter")} />
        )}
      </section>
      {!balance && (
        <section className="card">
          <h2>{t("distribution")}</h2>
          {pie.length ? (
            <>
              <div className="chart donut">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      isAnimationActive={false}
                      data={pie}
                      dataKey="value"
                      nameKey="label"
                      innerRadius="62%"
                      outerRadius="85%"
                      paddingAngle={4}
                    >
                      {pie.map((c) => (
                        <Cell key={c.id} fill={c.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={fmt}
                      contentStyle={{
                        background: "var(--card)",
                        color: "var(--text)",
                        borderRadius: 12,
                        border: "1px solid var(--border)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="legend-list">
                {pie.map((c) => (
                  <li key={c.id}>
                    <span>
                      <i style={{ background: c.color }} />
                      {c.label}
                    </span>
                    <strong>{fmt(c.value)}</strong>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <Empty text={t("emptyExpenses")} />
          )}
        </section>
      )}
    </div>
  );
}
function Dashboard({ report = false }) {
  const { transactions, categories, settings } = useFinance();
  const { t, locale, categoryName } = useLocale();
  const [filters, setFilters] = useState({
    start: `${monthNow()}-01`,
    end: today(),
  });
  const invalid = filters.start && filters.end && filters.start > filters.end;
  const rows = invalid ? [] : filterTransactions(transactions, filters);
  const totals = summary(rows);
  const top = rows
    .filter((r) => r.type === "expense")
    .sort((a, b) => b.amount_cents - a.amount_cents)
    .slice(0, 5);
  const months = monthSeries(rows, filters.start, filters.end, locale);
  const fmt = (v) => money(v, locale, settings.currency);
  return (
    <div className="stack">
      <div className="card filter-card">
        <span className="filter-title">
          <CalendarDays size={18} />
          {t("period")}
        </span>
        <PeriodFilter filters={filters} setFilters={setFilters} />
      </div>
      {invalid && <Alert>{t("invalidRange")}</Alert>}
      <Stats totals={totals} balance={summary(transactions).balance} />
      {!transactions.length && <Empty text={t("emptyTransactions")} />}
      <FinancialCharts rows={rows} filters={filters} />
      {report && (
        <>
          <FinancialCharts
            rows={rows}
            filters={filters}
            balance
            allRows={transactions}
          />
          <div className="insight">
            <ShieldCheck size={23} />
            <p>
              {t(
                !rows.length
                  ? "reportInsightEmpty"
                  : totals.balance >= 0
                    ? "reportInsightPositive"
                    : "reportInsightNegative",
              )}
            </p>
          </div>
        </>
      )}
      <div className="bottom-grid">
        <section className="card">
          <h2>{t("topExpenses")}</h2>
          {top.length ? (
            <ul className="transaction-list">
              {top.map((row) => (
                <li key={row.id}>
                  <span className="list-icon">
                    <ArrowDownRight size={20} />
                  </span>
                  <div>
                    <strong>{row.description}</strong>
                    <small>
                      {categoryName(
                        categories.find((c) => c.id === row.category_id) || {
                          name: "",
                        },
                      )}
                    </small>
                  </div>
                  <strong className="negative">{fmt(row.amount_cents)}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <Empty text={t("emptyExpenses")} />
          )}
        </section>
        <section className="card">
          <h2>{t("monthlySummary")}</h2>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{t("month")}</th>
                  <th>{t("income")}</th>
                  <th>{t("expense")}</th>
                  <th>{t("result")}</th>
                </tr>
              </thead>
              <tbody>
                {months.map((m) => (
                  <tr key={m.key}>
                    <td>{m.label}</td>
                    <td>{fmt(m.income)}</td>
                    <td>{fmt(m.expenses)}</td>
                    <td className={m.balance >= 0 ? "positive" : "negative"}>
                      {fmt(m.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
function TransactionForm({ row, onClose }) {
  const { categories, mutate } = useFinance();
  const { t, categoryName } = useLocale();
  const notify = useNotice();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const f = Object.fromEntries(new FormData(e.currentTarget));
      const payload = {
        description: f.description.trim(),
        amount_cents: toCents(f.amount),
        type: f.type,
        category_id: f.category,
        date: f.date,
      };
      if (
        !payload.description ||
        !payload.amount_cents ||
        !payload.date ||
        !payload.category_id
      )
        throw new Error("invalidFields");
      await mutate("transactions", row ? "update" : "insert", payload, row?.id);
      notify(t(row ? "saved" : "added"));
      onClose();
    } catch (e) {
      setError(t(errorKey(e)));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={t(row ? "edit" : "newTransaction")}
      onClose={() => !busy && onClose()}
    >
      <form className="form" onSubmit={submit}>
        {error && <Alert>{error}</Alert>}
        <div className="form-grid">
          <Field label={t("type")}>
            <select name="type" defaultValue={row?.type || "expense"}>
              <option value="expense">{t("expenseSingle")}</option>
              <option value="income">{t("incomeSingle")}</option>
            </select>
          </Field>
          <Field
            label={t("amount")}
            name="amount"
            type="number"
            min="0.01"
            max="10000000000"
            step="0.01"
            defaultValue={row ? row.amount_cents / 100 : ""}
            required
          />
        </div>
        <Field
          label={t("description")}
          name="description"
          maxLength={200}
          placeholder={t("descriptionHint")}
          defaultValue={row?.description}
          required
        />
        <div className="form-grid">
          <Field label={t("category")}>
            <select
              name="category"
              defaultValue={row?.category_id || categories[0]?.id}
              required
            >
              <option value="" disabled>
                {t("category")}
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {categoryName(c)}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label={t("date")}
            name="date"
            type="date"
            defaultValue={row?.date || today()}
            required
          />
        </div>
        <FormActions busy={busy} onClose={onClose} />
      </form>
    </Modal>
  );
}
function Transactions() {
  const { transactions, categories, settings, mutate } = useFinance();
  const { t, locale, categoryName } = useLocale();
  const notify = useNotice();
  const location = useLocation();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    search: "",
    type: "",
    category: "",
    start: "",
    end: "",
  });
  const [page, setPage] = useState(1),
    [editing, setEditing] = useState(null),
    [deleting, setDeleting] = useState(null);
  useEffect(() => {
    if (new URLSearchParams(location.search).has("novo")) {
      setEditing({});
      navigate("/transacoes", { replace: true });
    }
  }, [location.search, navigate]);
  const invalid = filters.start && filters.end && filters.start > filters.end;
  const rows = (invalid ? [] : filterTransactions(transactions, filters)).sort(
    (a, b) =>
      b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at),
  );
  const pages = Math.max(1, Math.ceil(rows.length / 20));
  const safePage = Math.min(page, pages);
  const update = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setPage(1);
  };
  return (
    <div className="stack">
      <section className="card">
        <div className="section-heading">
          <h2>{t("transactions")}</h2>
          <button className="button" onClick={() => setEditing({})}>
            <Plus size={18} />
            {t("newTransaction")}
          </button>
        </div>
        <div className="transaction-filters">
          <Field label={t("search")}>
            <span className="search-input">
              <Search size={18} />
              <input
                value={filters.search}
                placeholder={t("description")}
                onChange={(e) => update("search", e.target.value)}
              />
            </span>
          </Field>
          <Field label={t("type")}>
            <select
              value={filters.type}
              onChange={(e) => update("type", e.target.value)}
            >
              <option value="">{t("all")}</option>
              <option value="income">{t("incomeSingle")}</option>
              <option value="expense">{t("expenseSingle")}</option>
            </select>
          </Field>
          <Field label={t("category")}>
            <select
              value={filters.category}
              onChange={(e) => update("category", e.target.value)}
            >
              <option value="">{t("all")}</option>
              {categories.map((c) => (
                <option value={c.id} key={c.id}>
                  {categoryName(c)}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label={t("start")}
            type="date"
            value={filters.start}
            onChange={(e) => update("start", e.target.value)}
          />
          <Field
            label={t("end")}
            type="date"
            value={filters.end}
            onChange={(e) => update("end", e.target.value)}
          />
        </div>
        <div className="filter-footer">
          <span>
            {rows.length} {t("filterCount")}
          </span>
          <button
            className="text-button"
            onClick={() => {
              setFilters({
                search: "",
                type: "",
                category: "",
                start: "",
                end: "",
              });
              setPage(1);
            }}
          >
            {t("clearFilters")}
          </button>
        </div>
        {invalid && <Alert>{t("invalidRange")}</Alert>}
        {rows.length ? (
          <>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>{t("description")}</th>
                    <th>{t("category")}</th>
                    <th>{t("date")}</th>
                    <th>{t("amount")}</th>
                    <th>{t("actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice((safePage - 1) * 20, safePage * 20).map((r) => (
                    <tr key={r.id}>
                      <td>
                        <strong>{r.description}</strong>
                        <small className={`type-label ${r.type}`}>
                          {t(
                            r.type === "income"
                              ? "incomeSingle"
                              : "expenseSingle",
                          )}
                        </small>
                      </td>
                      <td>
                        {categoryName(
                          categories.find((c) => c.id === r.category_id) || {
                            name: "",
                          },
                        )}
                      </td>
                      <td className="nowrap">
                        {new Intl.DateTimeFormat(locale).format(
                          new Date(`${r.date}T12:00:00`),
                        )}
                      </td>
                      <td
                        className={`nowrap ${r.type === "income" ? "positive" : "negative"}`}
                      >
                        {r.type === "expense" ? "-" : "+"}
                        {money(r.amount_cents, locale, settings.currency)}
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="icon-button"
                            aria-label={`${t("edit")}: ${r.description}`}
                            onClick={() => setEditing(r)}
                          >
                            <Pencil size={17} />
                          </button>
                          <button
                            className="icon-button negative"
                            aria-label={`${t("delete")}: ${r.description}`}
                            onClick={() => setDeleting(r)}
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <span>
                {t("page")} {safePage} {t("of")} {pages}
              </span>
              <button
                className="button secondary small"
                disabled={safePage === 1}
                onClick={() => setPage(safePage - 1)}
              >
                {t("previous")}
              </button>
              <button
                className="button secondary small"
                disabled={safePage === pages}
                onClick={() => setPage(safePage + 1)}
              >
                {t("next")}
              </button>
            </div>
          </>
        ) : (
          <Empty
            text={t(transactions.length ? "emptyFilter" : "emptyTransactions")}
          />
        )}
      </section>
      {editing && (
        <TransactionForm
          row={editing.id ? editing : null}
          onClose={() => setEditing(null)}
        />
      )}{" "}
      {deleting && (
        <ConfirmDelete
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            await mutate("transactions", "delete", null, deleting.id);
            notify(t("deleted"));
          }}
        />
      )}
    </div>
  );
}
function CategoryForm({ row, onClose }) {
  const { mutate } = useFinance();
  const { t, categoryName } = useLocale();
  const notify = useNotice();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const f = Object.fromEntries(new FormData(e.currentTarget));
      if (!f.name.trim()) throw new Error("invalidFields");
      await mutate(
        "categories",
        row ? "update" : "insert",
        { name: f.name.trim(), color: f.color, builtin_key: null },
        row?.id,
      );
      notify(t("saved"));
      onClose();
    } catch (e) {
      setError(t(errorKey(e)));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={t(row ? "editCategory" : "newCategory")}
      onClose={() => !busy && onClose()}
    >
      <form className="form" onSubmit={submit}>
        {error && <Alert>{error}</Alert>}
        <Field
          label={t("categoryName")}
          name="name"
          maxLength={60}
          defaultValue={row ? categoryName(row) : ""}
          placeholder={t("categoryHint")}
          required
        />
        <Field
          label={t("color")}
          name="color"
          type="color"
          defaultValue={row?.color || "#23845b"}
        />
        <FormActions busy={busy} onClose={onClose} />
      </form>
    </Modal>
  );
}
function Categories() {
  const { categories, mutate } = useFinance();
  const { t, categoryName } = useLocale();
  const notify = useNotice();
  const [editing, setEditing] = useState(null),
    [deleting, setDeleting] = useState(null);
  return (
    <div className="stack">
      <div className="section-heading">
        <span className="muted">
          {categories.length} {t("categories").toLowerCase()}
        </span>
        <button className="button" onClick={() => setEditing({})}>
          <Plus size={18} />
          {t("newCategory")}
        </button>
      </div>
      <div className="category-grid">
        {categories.map((c) => (
          <article className="card category-card" key={c.id}>
            <span
              className="category-icon"
              style={{ background: `${c.color}18`, color: c.color }}
            >
              <Tags size={24} />
            </span>
            <h2>{categoryName(c)}</h2>
            <div className="row-actions">
              <button
                className="icon-button"
                aria-label={`${t("edit")}: ${categoryName(c)}`}
                onClick={() => setEditing(c)}
              >
                <Pencil size={17} />
              </button>
              <button
                className="icon-button negative"
                aria-label={`${t("delete")}: ${categoryName(c)}`}
                onClick={() => setDeleting(c)}
              >
                <Trash2 size={17} />
              </button>
            </div>
          </article>
        ))}
      </div>
      {editing && (
        <CategoryForm
          row={editing.id ? editing : null}
          onClose={() => setEditing(null)}
        />
      )}{" "}
      {deleting && (
        <ConfirmDelete
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            await mutate("categories", "delete", null, deleting.id);
            notify(t("deleted"));
          }}
        />
      )}
    </div>
  );
}
function GoalForm({ row, onClose, contribution = false }) {
  const { mutate } = useFinance();
  const { t } = useLocale();
  const notify = useNotice();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const f = Object.fromEntries(new FormData(e.currentTarget));
      let payload;
      if (contribution) {
        const amount = toCents(f.amount);
        if (!amount) throw new Error("invalidAmount");
        payload = { amount_cents: amount };
      } else {
        payload = {
          title: f.title.trim(),
          target_cents: toCents(f.target),
          current_cents: toCents(f.current),
          deadline: f.deadline || null,
        };
        if (!payload.title || !payload.target_cents)
          throw new Error("invalidFields");
      }
      await mutate(
        "goals",
        contribution ? "contribute" : row ? "update" : "insert",
        payload,
        row?.id,
      );
      notify(t("saved"));
      onClose();
    } catch (e) {
      setError(t(errorKey(e)));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={t(contribution ? "progress" : row ? "editGoal" : "newGoal")}
      onClose={() => !busy && onClose()}
    >
      <form className="form" onSubmit={submit}>
        {error && <Alert>{error}</Alert>}
        {contribution ? (
          <Field
            label={t("contribution")}
            name="amount"
            type="number"
            min="0.01"
            max="10000000000"
            step="0.01"
            required
          />
        ) : (
          <>
            <Field
              label={t("goalTitle")}
              name="title"
              maxLength={120}
              defaultValue={row?.title}
              placeholder={t("goalHint")}
              required
            />
            <div className="form-grid">
              <Field
                label={t("target")}
                name="target"
                type="number"
                min="0.01"
                max="10000000000"
                step="0.01"
                defaultValue={row ? row.target_cents / 100 : ""}
                required
              />
              <Field
                label={t("current")}
                name="current"
                type="number"
                min="0"
                max="10000000000"
                step="0.01"
                defaultValue={row ? row.current_cents / 100 : 0}
                required
              />
            </div>
            <Field
              label={t("deadline")}
              name="deadline"
              type="date"
              defaultValue={row?.deadline || ""}
            />
          </>
        )}
        <p className="form-help">{t("goalNote")}</p>
        <FormActions busy={busy} onClose={onClose} />
      </form>
    </Modal>
  );
}
function Goals() {
  const { goals, settings, mutate } = useFinance();
  const { t, locale } = useLocale();
  const notify = useNotice();
  const [editing, setEditing] = useState(null),
    [deleting, setDeleting] = useState(null),
    [contributing, setContributing] = useState(null);
  return (
    <div className="stack">
      <div className="section-heading">
        <span className="muted">
          {goals.length} {t("goals").toLowerCase()}
        </span>
        <button className="button" onClick={() => setEditing({})}>
          <Plus size={18} />
          {t("newGoal")}
        </button>
      </div>
      {goals.length ? (
        <div className="goals-grid">
          {goals.map((g) => {
            const percent = progress(g.current_cents, g.target_cents);
            return (
              <article className="card goal-card" key={g.id}>
                <div className="section-heading">
                  <span className="benefit-icon">
                    <Target size={24} />
                  </span>
                  <div className="row-actions">
                    <button
                      className="icon-button"
                      aria-label={`${t("edit")}: ${g.title}`}
                      onClick={() => setEditing(g)}
                    >
                      <Pencil size={17} />
                    </button>
                    <button
                      className="icon-button negative"
                      aria-label={`${t("delete")}: ${g.title}`}
                      onClick={() => setDeleting(g)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
                <h2>{g.title}</h2>
                <small className="muted">
                  {g.deadline
                    ? new Intl.DateTimeFormat(locale).format(
                        new Date(`${g.deadline}T12:00:00`),
                      )
                    : t("noDeadline")}
                </small>
                <div className="goal-amount">
                  <strong>
                    {money(g.current_cents, locale, settings.currency)}
                  </strong>
                  <span>
                    {t("of")} {money(g.target_cents, locale, settings.currency)}
                  </span>
                </div>
                <div
                  className="progress-track"
                  role="progressbar"
                  aria-label={g.title}
                  aria-valuenow={Math.round(percent)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <span style={{ width: `${percent}%` }} />
                </div>
                <div className="goal-bottom">
                  <span>
                    {Math.round(percent)}%
                    {percent === 100 ? ` · ${t("goalReached")}` : ""}
                  </span>
                  <button
                    className="button secondary small"
                    onClick={() => setContributing(g)}
                  >
                    <Plus size={16} />
                    {t("progress")}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <Empty text={t("emptyGoals")} />
      )}{" "}
      {editing && (
        <GoalForm
          row={editing.id ? editing : null}
          onClose={() => setEditing(null)}
        />
      )}{" "}
      {contributing && (
        <GoalForm
          row={contributing}
          contribution
          onClose={() => setContributing(null)}
        />
      )}{" "}
      {deleting && (
        <ConfirmDelete
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            await mutate("goals", "delete", null, deleting.id);
            notify(t("deleted"));
          }}
        />
      )}
    </div>
  );
}
function BudgetForm({ row, category, month, onClose }) {
  const { mutate } = useFinance();
  const { t, categoryName } = useLocale();
  const notify = useNotice();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const f = Object.fromEntries(new FormData(e.currentTarget));
      const limit = toCents(f.limit);
      if (!limit) throw new Error("invalidAmount");
      await mutate(
        "budgets",
        row ? "update" : "insert",
        {
          category_id: category.id,
          month,
          limit_cents: limit,
          alert_threshold: Number(f.threshold),
        },
        row?.id,
      );
      notify(t("saved"));
      onClose();
    } catch (e) {
      setError(t(errorKey(e)));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={`${t("editBudget")} · ${categoryName(category)}`}
      onClose={() => !busy && onClose()}
    >
      <form className="form" onSubmit={submit}>
        {error && <Alert>{error}</Alert>}
        <Field
          label={t("limit")}
          name="limit"
          type="number"
          min="0.01"
          max="10000000000"
          step="0.01"
          defaultValue={row ? row.limit_cents / 100 : ""}
          required
        />
        <Field
          label={t("threshold")}
          name="threshold"
          type="number"
          min="1"
          max="100"
          step="1"
          defaultValue={row?.alert_threshold || 80}
          required
        />
        <FormActions busy={busy} onClose={onClose} />
      </form>
    </Modal>
  );
}
function Budget() {
  const { categories, budgets, transactions, settings, mutate } = useFinance();
  const { t, locale, categoryName } = useLocale();
  const notify = useNotice();
  const [month, setMonth] = useState(monthNow()),
    [editing, setEditing] = useState(null),
    [deleting, setDeleting] = useState(null);
  const totals = categoryTotals(
    transactions.filter((r) => r.date.startsWith(month)),
    categories,
  );
  const fmt = (v) => money(v, locale, settings.currency);
  return (
    <div className="stack">
      <div className="card filter-card">
        <p className="muted">{t("budgetNote")}</p>
        <Field
          label={t("month")}
          type="month"
          value={month}
          onChange={(e) => {
            if (e.target.value) setMonth(e.target.value);
          }}
        />
      </div>
      {!budgets.some((b) => b.month === month) && (
        <p className="muted">{t("emptyBudget")}</p>
      )}
      <div className="budget-grid">
        {totals.map((c) => {
          const b = budgets.find(
            (b) => b.month === month && b.category_id === c.id,
          );
          const limit = b?.limit_cents || 0;
          const status = budgetStatus(c.value, limit, b?.alert_threshold);
          return (
            <article className="card budget-card" key={c.id}>
              <div className="section-heading">
                <h2>
                  <i className="dot" style={{ background: c.color }} />
                  {categoryName(c)}
                </h2>
                <span className={`status-chip ${status}`}>{t(status)}</span>
              </div>
              <div className="budget-values">
                <span>
                  {t("spent")}
                  <strong>{fmt(c.value)}</strong>
                </span>
                <span>
                  {t("limit")}
                  <strong>{limit ? fmt(limit) : "—"}</strong>
                </span>
              </div>
              <div className={`progress-track ${status}`}>
                <span style={{ width: `${progress(c.value, limit)}%` }} />
              </div>
              <p className={status === "over" ? "negative" : "muted"}>
                {limit
                  ? `${t(c.value > limit ? "overAmount" : "remaining")}: ${fmt(Math.abs(limit - c.value))}`
                  : t("unset")}
              </p>
              <div className="row-actions">
                <button
                  className="button secondary small"
                  onClick={() => setEditing({ category: c, row: b })}
                >
                  <Pencil size={16} />
                  {t("editBudget")}
                </button>
                {b && (
                  <button
                    className="icon-button negative"
                    aria-label={`${t("removeBudget")}: ${categoryName(c)}`}
                    onClick={() => setDeleting(b)}
                  >
                    <Trash2 size={17} />
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
      {editing && (
        <BudgetForm
          {...editing}
          month={month}
          onClose={() => setEditing(null)}
        />
      )}{" "}
      {deleting && (
        <ConfirmDelete
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            await mutate("budgets", "delete", null, deleting.id);
            notify(t("deleted"));
          }}
        />
      )}
    </div>
  );
}
function Settings() {
  const { settings, updateSettings } = useFinance();
  const { t, setLanguage } = useLocale();
  const notify = useNotice();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const f = Object.fromEntries(new FormData(e.currentTarget));
      if (!f.name.trim()) throw new Error("invalidFields");
      await updateSettings({
        name: f.name.trim(),
        language: f.language,
        theme: f.theme,
        notifications: f.notifications === "on",
      });
      setLanguage(f.language);
      notify(t("saved"));
    } catch (e) {
      setError(t(errorKey(e)));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="settings-layout">
      <section className="card">
        <h2>{t("preferences")}</h2>
        <form
          key={`${settings.language}-${settings.theme}-${settings.name}-${settings.notifications}`}
          className="form"
          onSubmit={submit}
        >
          {error && <Alert>{error}</Alert>}
          <Field
            label={t("name")}
            name="name"
            maxLength={100}
            autoComplete="name"
            defaultValue={settings.name}
            required
          />
          <div className="form-grid">
            <Field label={t("language")}>
              <select name="language" defaultValue={settings.language}>
                <option value="pt-BR">Português do Brasil</option>
                <option value="en-US">English</option>
              </select>
            </Field>
            <Field label={t("theme")}>
              <select name="theme" defaultValue={settings.theme}>
                <option value="light">{t("light")}</option>
                <option value="dark">{t("dark")}</option>
              </select>
            </Field>
          </div>
          <Field label={t("currency")}>
            <select value="BRL" disabled>
              <option>BRL · R$</option>
            </select>
          </Field>
          <p className="form-help">{t("currencyHelp")}</p>
          <label className="checkbox-field">
            <input
              name="notifications"
              type="checkbox"
              defaultChecked={settings.notifications}
            />
            <span>
              {t("notifications")}
              <small>{t("notificationsHelp")}</small>
            </span>
          </label>
          <button className="button" disabled={busy}>
            {busy ? t("saving") : t("save")}
          </button>
        </form>
      </section>
      <aside className="card settings-note">
        <ShieldCheck size={32} />
        <h2>{t("private")}</h2>
        <p>{t("privateBody")}</p>
        <Link className="button secondary" to="/categorias">
          {t("categories")}
        </Link>
      </aside>
    </div>
  );
}
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FinanceProvider>
          <LocaleProvider>
            <NoticeProvider>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<AuthPage key="login" />} />
                <Route
                  path="/cadastro"
                  element={<AuthPage key="signup" mode="signup" />}
                />
                <Route
                  path="/recuperar-senha"
                  element={<AuthPage key="reset" mode="reset" />}
                />
                <Route
                  path="/redefinir-senha"
                  element={<AuthPage key="password" mode="password" />}
                />
                <Route path="/auth/callback" element={<Callback />} />
                <Route element={<Protected />}>
                  <Route element={<Shell />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/transacoes" element={<Transactions />} />
                    <Route path="/categorias" element={<Categories />} />
                    <Route path="/metas" element={<Goals />} />
                    <Route path="/orcamento" element={<Budget />} />
                    <Route
                      path="/relatorios"
                      element={<Dashboard key="reports" report />}
                    />
                    <Route path="/configuracoes" element={<Settings />} />
                  </Route>
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </NoticeProvider>
          </LocaleProvider>
        </FinanceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
export default App;
