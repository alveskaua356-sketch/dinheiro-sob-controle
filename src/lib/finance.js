export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const monthNow = () => today().slice(0, 7);
export const toCents = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > 1e10)
    throw new Error("invalidAmount");
  return Math.round(number * 100);
};
export const money = (cents, locale = "pt-BR", currency = "BRL") =>
  new Intl.NumberFormat(locale, { style: "currency", currency }).format(
    cents / 100,
  );
export const filterTransactions = (rows, filters = {}) =>
  rows.filter(
    (row) =>
      (!filters.start || row.date >= filters.start) &&
      (!filters.end || row.date <= filters.end) &&
      (!filters.type || row.type === filters.type) &&
      (!filters.category || row.category_id === filters.category) &&
      (!filters.search ||
        row.description
          .toLocaleLowerCase()
          .includes(filters.search.toLocaleLowerCase())),
  );
export function summary(rows) {
  const income = rows
    .filter((r) => r.type === "income")
    .reduce((s, r) => s + r.amount_cents, 0);
  const expenses = rows
    .filter((r) => r.type === "expense")
    .reduce((s, r) => s + r.amount_cents, 0);
  return { income, expenses, balance: income - expenses, count: rows.length };
}
export function categoryTotals(rows, categories) {
  return categories.map((c) => ({
    ...c,
    value: rows
      .filter((r) => r.type === "expense" && r.category_id === c.id)
      .reduce((s, r) => s + r.amount_cents, 0),
  }));
}
export function monthSeries(rows, start, end, locale = "pt-BR") {
  const keys = rows.map((r) => r.date.slice(0, 7)).sort();
  const first = (start || keys[0] || today()).slice(0, 7);
  const last = (end || keys.at(-1) || today()).slice(0, 7);
  const data = [];
  let date = new Date(`${first}-01T12:00:00`);
  const lastDate = new Date(`${last}-01T12:00:00`);
  while (date <= lastDate && data.length < 1200) {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const total = summary(rows.filter((r) => r.date.startsWith(key)));
    data.push({
      key,
      label: new Intl.DateTimeFormat(locale, {
        month: "short",
        year: "2-digit",
      }).format(date),
      ...total,
    });
    date.setMonth(date.getMonth() + 1);
  }
  return data;
}
export function balanceSeries(allRows, filters = {}) {
  const selected = filterTransactions(allRows, filters).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  let balance = filters.start
    ? summary(allRows.filter((r) => r.date < filters.start)).balance
    : 0;
  const grouped = new Map();
  selected.forEach((r) => {
    balance += r.type === "income" ? r.amount_cents : -r.amount_cents;
    grouped.set(r.date, balance);
  });
  return Array.from(grouped, ([date, balance]) => ({ date, balance }));
}
export const budgetStatus = (spent, limit, threshold = 80) =>
  !limit
    ? "unset"
    : spent > limit
      ? "over"
      : (spent / limit) * 100 >= threshold
        ? "near"
        : "safe";
export const progress = (current, target) =>
  target > 0 ? Math.min(100, Math.max(0, (current / target) * 100)) : 0;
