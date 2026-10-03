import test from "node:test";
import assert from "node:assert/strict";
import {
  summary,
  filterTransactions,
  categoryTotals,
  balanceSeries,
  monthSeries,
  toCents,
  budgetStatus,
  progress,
} from "../src/lib/finance.js";
const rows = [
  {
    id: "a",
    description: "Salary",
    type: "income",
    amount_cents: 300000,
    date: "2026-09-01",
    category_id: "a",
  },
  {
    id: "b",
    description: "Rent",
    type: "expense",
    amount_cents: 100000,
    date: "2026-10-01",
    category_id: "a",
  },
  {
    id: "c",
    description: "Food",
    type: "expense",
    amount_cents: 1234,
    date: "2026-10-03",
    category_id: "b",
  },
];
test("money remains exact in cents and rejects invalid amounts", () => {
  assert.equal(toCents("12.34"), 1234);
  assert.equal(toCents("0.29"), 29);
  assert.throws(() => toCents("-1"));
  assert.throws(() => toCents("x"));
});
test("summaries update after add, edit and delete", () => {
  assert.deepEqual(summary(rows), {
    income: 300000,
    expenses: 101234,
    balance: 198766,
    count: 3,
  });
  assert.equal(
    summary([...rows, { type: "income", amount_cents: 1000 }]).balance,
    199766,
  );
  assert.equal(
    summary(rows.map((r) => (r.id === "c" ? { ...r, amount_cents: 2000 } : r)))
      .balance,
    198000,
  );
  assert.equal(summary(rows.filter((r) => r.id !== "c")).balance, 200000);
});
test("inclusive period, description, type and category filters compose", () => {
  assert.equal(
    filterTransactions(rows, {
      start: "2026-10-03",
      end: "2026-10-03",
      search: "FOOD",
      type: "expense",
      category: "b",
    }).length,
    1,
  );
  assert.equal(filterTransactions(rows, { start: "2026-10-04" }).length, 0);
});
test("category distributions and charts use filtered rows", () => {
  const selected = filterTransactions(rows, { start: "2026-10-03" });
  assert.equal(
    categoryTotals(selected, [{ id: "a" }, { id: "b" }])[0].value,
    0,
  );
  assert.equal(categoryTotals(selected, [{ id: "b" }])[0].value, 1234);
  assert.equal(
    monthSeries(selected, "2026-10-03", "2026-10-31")[0].expenses,
    1234,
  );
});
test("balance chart carries opening balance before the selected period", () => {
  assert.deepEqual(
    balanceSeries(rows, { start: "2026-10-01", end: "2026-10-03" }),
    [
      { date: "2026-10-01", balance: 200000 },
      { date: "2026-10-03", balance: 198766 },
    ],
  );
});
test("monthly budgets distinguish unset, safe, near and over", () => {
  assert.equal(budgetStatus(100, 0), "unset");
  assert.equal(budgetStatus(79, 100), "safe");
  assert.equal(budgetStatus(80, 100), "near");
  assert.equal(budgetStatus(100, 100), "near");
  assert.equal(budgetStatus(101, 100), "over");
  assert.equal(progress(150, 100), 100);
});
