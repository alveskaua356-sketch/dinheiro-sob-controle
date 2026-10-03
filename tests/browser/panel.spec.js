import { test, expect } from "@playwright/test";
// Only these browser tests intercept the backend. They do not validate delivery of real emails.
const user = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "qa@example.test",
  email_confirmed_at: "2026-10-03T12:00:00Z",
  aud: "authenticated",
  role: "authenticated",
  user_metadata: { name: "Teste" },
};
const date = new Date();
const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
const day = `${month}-${String(date.getDate()).padStart(2, "0")}`;
async function backend(page) {
  const tables = {
    settings: {
      user_id: user.id,
      name: "Teste",
      language: "pt-BR",
      theme: "light",
      currency: "BRL",
      notifications: true,
    },
    categories: [
      {
        id: "cat-a",
        user_id: user.id,
        name: "Essenciais",
        builtin_key: "essenciais",
        color: "#164e3b",
      },
      {
        id: "cat-b",
        user_id: user.id,
        name: "Futuro",
        builtin_key: "futuro",
        color: "#588bbd",
      },
    ],
    transactions: [],
    goals: [],
    budgets: [],
  };
  const token = `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600, role: "authenticated" })).toString("base64url")}.test-signature`;
  let count = 1;
  await page.route("https://dsc-test.supabase.co/**", async (route) => {
    const request = route.request(),
      url = new URL(request.url()),
      method = request.method();
    let body = request.postDataJSON();
    const fulfill = (data, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(data),
        headers: {
          "access-control-allow-origin": "*",
          "content-range": "0-99/100",
        },
      });
    if (url.pathname.includes("/auth/v1/signup"))
      return fulfill({ user, session: null });
    if (url.pathname.includes("/auth/v1/token"))
      return fulfill({
        access_token: token,
        refresh_token: "refresh-test",
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: "bearer",
        user,
      });
    if (url.pathname.includes("/auth/v1/logout")) return fulfill({});
    if (
      url.pathname.includes("/auth/v1/recover") ||
      url.pathname.includes("/auth/v1/resend")
    )
      return fulfill({});
    if (url.pathname.includes("/auth/v1/user")) return fulfill(user);
    if (url.pathname.endsWith("/rpc/add_goal_progress")) {
      const goal = tables.goals.find((g) => g.id === body.goal_id);
      goal.current_cents += body.contribution_cents;
      return fulfill(goal);
    }
    const table = url.pathname.split("/").at(-1);
    if (!(table in tables))
      return fulfill({ message: "unknown test route" }, 400);
    if (method === "GET") return fulfill(tables[table]);
    const id = url.searchParams.get("id")?.replace("eq.", "");
    if (table === "settings") {
      tables.settings = { ...tables.settings, ...body };
      return fulfill(tables.settings);
    }
    if (method === "POST") {
      if (Array.isArray(body)) body = body[0];
      const item = {
        ...body,
        id: `row-${count++}`,
        created_at: new Date().toISOString(),
      };
      tables[table].push(item);
      return fulfill(item);
    }
    const current = tables[table].find((r) => r.id === id);
    if (method === "PATCH") {
      Object.assign(current, body);
      return fulfill(current);
    }
    if (method === "DELETE") {
      tables[table] = tables[table].filter((r) => r.id !== id);
      return fulfill(current);
    }
    return fulfill({});
  });
  return tables;
}
async function login(page) {
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill(user.email);
  await page.getByLabel("Senha", { exact: true }).fill("strong-test-password");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Visão geral", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Sua história financeira começa aqui.", { exact: false }),
  ).toBeVisible();
}
async function transaction(page, type, description, amount) {
  await page
    .getByRole("button", { name: "Nova movimentação", exact: true })
    .click();
  const modal = page.getByRole("dialog");
  await modal.getByLabel("Tipo", { exact: true }).selectOption(type);
  await modal.getByLabel("Valor", { exact: true }).fill(amount);
  await modal.getByLabel("Descrição", { exact: true }).fill(description);
  await modal.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(modal).not.toBeVisible();
}
async function confirm(page) {
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Excluir", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
}
test("complete UI flow with isolated test backend; no production simulation", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const data = await backend(page);
  await page.goto("/cadastro");
  await page.getByLabel("Nome", { exact: true }).fill("Teste");
  await page.getByLabel("E-mail", { exact: true }).fill(user.email);
  await page.getByLabel("Senha", { exact: true }).fill("strong-test-password");
  await page.getByLabel("Confirmar senha").fill("strong-test-password");
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await expect(
    page.getByText("Confira seu e-mail para confirmar a conta.", {
      exact: false,
    }),
  ).toBeVisible();
  await login(page);
  await page.getByRole("link", { name: "Movimentações", exact: true }).click();
  await transaction(page, "income", "Receita de teste", "3000");
  await transaction(page, "expense", "Despesa de teste", "250");
  await page
    .getByRole("button", { name: "Editar: Despesa de teste", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Valor", { exact: true })
    .fill("300");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Salvar", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Despesa de teste", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Pesquisar descrição", { exact: true }).fill("Receita");
  await expect(
    page.getByText("Despesa de teste", { exact: true }),
  ).not.toBeVisible();
  await page.getByRole("button", { name: "Limpar filtros" }).click();
  await page.getByRole("link", { name: "Categorias", exact: true }).click();
  await page
    .getByRole("button", { name: "Criar categoria", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Nome da categoria")
    .fill("Categoria teste");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Salvar", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Categoria teste", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Editar: Categoria teste", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Nome da categoria")
    .fill("Categoria revisada");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Salvar", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Categoria revisada", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Excluir: Categoria revisada", exact: true })
    .click();
  await confirm(page);
  await page.getByRole("link", { name: "Metas", exact: true }).click();
  await page.getByRole("button", { name: "Criar meta", exact: true }).click();
  await page.getByLabel("Nome da meta").fill("Reserva teste");
  await page.getByLabel("Valor objetivo").fill("1000");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Salvar", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Reserva teste", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Registrar progresso", exact: true })
    .click();
  await page.getByLabel("Valor a adicionar").fill("250");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Salvar", exact: true })
    .click();
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "25",
  );
  await page
    .getByRole("button", { name: "Editar: Reserva teste", exact: true })
    .click();
  await page.getByLabel("Valor objetivo").fill("2000");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Salvar", exact: true })
    .click();
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "13",
  );
  await page.getByRole("link", { name: "Orçamento", exact: true }).click();
  await page
    .getByRole("button", { name: "Definir limite", exact: true })
    .first()
    .click();
  await page.getByLabel("Limite de gastos").fill("200");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Salvar", exact: true })
    .click();
  await expect(
    page.getByText("Limite ultrapassado", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Mês", { exact: true }).fill("2020-01");
  await expect(
    page.getByText("Nenhum limite definido para este mês."),
  ).toBeVisible();
  await page.getByLabel("Mês", { exact: true }).fill(month);
  await page
    .getByRole("button", { name: "Alertas no painel", exact: true })
    .click();
  await expect(page.locator(".alerts-panel")).toContainText(
    "Limite ultrapassado",
  );
  await page
    .getByRole("button", { name: "Alertas no painel", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Remover limite: Essenciais", exact: true })
    .click();
  await confirm(page);
  await expect(
    page.getByText("Nenhum limite definido para este mês."),
  ).toBeVisible();
  await page.getByRole("link", { name: "Relatórios", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Evolução do saldo" }),
  ).toBeVisible();
  await expect(page.locator(".recharts-wrapper")).toHaveCount(3);
  await expect(
    page.locator(".recharts-bar-rectangle path").first(),
  ).toBeVisible();
  await expect(page.locator(".recharts-pie-sector path").first()).toBeVisible();
  await page.getByLabel("De", { exact: true }).fill("2099-01-01");
  await page.getByLabel("Até", { exact: true }).fill("2099-12-31");
  await expect(
    page
      .getByText("Nenhuma movimentação encontrada com estes filtros.")
      .first(),
  ).toBeVisible();
  await page.getByRole("link", { name: "Configurações", exact: true }).click();
  await page.getByLabel("Nome", { exact: true }).fill("Nome atualizado");
  await page.getByLabel("Idioma", { exact: true }).last().selectOption("en-US");
  await page.getByLabel("Aparência", { exact: true }).selectOption("dark");
  await page.getByRole("checkbox", { name: /Alertas no painel/ }).uncheck();
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your preferences" }),
  ).toBeVisible();
  await expect(page.locator(".app-shell")).toHaveClass(/dark/);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Your preferences" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Overview", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Overview", exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: "/tmp/dsc-desktop.png", fullPage: true });
  await page.getByRole("link", { name: "Transactions", exact: true }).click();
  await page
    .getByRole("button", { name: "Delete: Despesa de teste", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await expect(
    page.getByText("Despesa de teste", { exact: true }),
  ).not.toBeVisible();
  await page.getByRole("link", { name: "Goals", exact: true }).click();
  await page
    .getByRole("button", { name: "Delete: Reserva teste", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await expect(
    page.getByText("What is your next target?", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/login/);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/login/);
  expect(data.transactions).toHaveLength(1);
  expect(errors).toEqual([]);
});
test("mobile landing and protected routes", async ({ page }) => {
  await backend(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Seu dinheiro merece uma direção." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "/tmp/dsc-mobile-landing.png",
    fullPage: true,
  });
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/login/);
  await login(page);
  await page
    .getByRole("button", { name: "Super Painel Financeiro", exact: true })
    .click();
  await page.getByRole("link", { name: "Movimentações", exact: true }).click();
  await transaction(page, "expense", "Teste celular", "20");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "/tmp/dsc-mobile.png", fullPage: true });
});
test("password reset request and confirmation resend show honest states", async ({
  page,
}) => {
  await backend(page);
  await page.goto("/recuperar-senha");
  await page.getByLabel("E-mail", { exact: true }).fill(user.email);
  await page
    .getByRole("button", { name: "Recuperar senha", exact: true })
    .click();
  await expect(
    page.getByText("Se este e-mail estiver cadastrado,", { exact: false }),
  ).toBeVisible();
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill(user.email);
  await page.getByRole("button", { name: "Reenviar confirmação" }).click();
  await expect(
    page.getByText("Solicitação de confirmação enviada.", { exact: false }),
  ).toBeVisible();
  await page.goto("/redefinir-senha");
  await expect(
    page.getByText("Este link expirou ou não é válido.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Definir nova senha", exact: true }),
  ).toBeDisabled();
});
