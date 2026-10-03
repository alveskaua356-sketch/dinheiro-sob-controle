import { createContext, useContext, useEffect, useState } from "react";
import { useFinance } from "../context/FinanceContext";
const dictionary = {
  brand: ["Dinheiro Sob Controle", "Dinheiro Sob Controle"],
  panel: ["Super Painel Financeiro", "Financial Dashboard"],
  dashboard: ["Visão geral", "Overview"],
  transactions: ["Movimentações", "Transactions"],
  goals: ["Metas", "Goals"],
  budget: ["Orçamento", "Budget"],
  reports: ["Relatórios", "Reports"],
  settings: ["Configurações", "Settings"],
  categories: ["Categorias", "Categories"],
  login: ["Entrar", "Sign in"],
  register: ["Criar conta", "Create account"],
  logout: ["Sair", "Sign out"],
  name: ["Nome", "Name"],
  email: ["E-mail", "Email"],
  password: ["Senha", "Password"],
  confirmPassword: ["Confirmar senha", "Confirm password"],
  recover: ["Esqueci minha senha", "Forgot password"],
  reset: ["Recuperar senha", "Reset password"],
  newPassword: ["Definir nova senha", "Set new password"],
  resend: ["Reenviar confirmação", "Resend confirmation"],
  hero: ["Seu dinheiro merece uma direção.", "Give your money a direction."],
  heroBody: [
    "Entenda seus gastos, planeje o mês e acompanhe suas metas. Tudo em um painel simples, feito para organizar sua vida financeira.",
    "Understand your spending, plan your month and track your goals. One simple dashboard to organize your financial life.",
  ],
  heroTag: [
    "CLAREZA PARA DECIDIR. CONTROLE PARA AVANÇAR.",
    "CLARITY TO DECIDE. CONTROL TO MOVE FORWARD.",
  ],
  heroFooter: [
    "O complemento prático do e-book Dinheiro Sob Controle.",
    "The practical companion to the Dinheiro Sob Controle ebook.",
  ],
  benefit1: ["Veja para onde vai seu dinheiro", "See where your money goes"],
  benefit1Body: [
    "Registre receitas e despesas e acompanhe os resultados com gráficos que fazem sentido.",
    "Record income and expenses and follow your results with clear charts.",
  ],
  benefit2: ["Planeje antes de gastar", "Plan before spending"],
  benefit2Body: [
    "Defina limites por categoria e receba alertas dentro do painel ao se aproximar do orçamento.",
    "Set category limits and receive in-app alerts as you approach your budget.",
  ],
  benefit3: ["Transforme planos em metas", "Turn plans into goals"],
  benefit3Body: [
    "Defina um objetivo, registre o valor guardado e acompanhe cada avanço.",
    "Set a target, record your savings and track every step forward.",
  ],
  private: ["Um espaço só seu", "A space of your own"],
  privateBody: [
    "Sua conta mantém suas movimentações, metas e preferências reunidas em um só lugar.",
    "Your account brings your transactions, goals and preferences together in one place.",
  ],
  landingCardTitle: [
    "Mais clareza em cada decisão",
    "More clarity in every decision",
  ],
  landingCardBody: [
    "Uma visão completa, do gasto de hoje ao objetivo de amanhã.",
    "A complete view, from today’s spending to tomorrow’s goals.",
  ],
  essentials: ["Essenciais", "Essentials"],
  debts: ["Dívidas e Parcelas", "Debt and installments"],
  leisure: ["Lazer e Compras", "Leisure and shopping"],
  future: ["Futuro", "Future"],
  back: ["Voltar", "Back"],
  backLogin: ["Voltar para entrar", "Back to sign in"],
  haveAccount: ["Já tem conta?", "Already have an account?"],
  noAccount: ["Ainda não tem conta?", "New here?"],
  signupHelp: [
    "Use pelo menos 8 caracteres na senha.",
    "Use at least 8 characters for your password.",
  ],
  checkEmail: [
    "Confira seu e-mail para confirmar a conta. Depois, volte para entrar.",
    "Check your email to confirm your account. Then return to sign in.",
  ],
  resetSent: [
    "Se este e-mail estiver cadastrado, você receberá as instruções de recuperação.",
    "If this email is registered, you will receive password reset instructions.",
  ],
  confirmationSent: [
    "Solicitação de confirmação enviada. Confira também a pasta de spam.",
    "Confirmation requested. Check your spam folder too.",
  ],
  passwordChanged: [
    "Senha atualizada. Você já pode acessar o painel.",
    "Password updated. You can now access your dashboard.",
  ],
  passwordMismatch: ["As senhas precisam ser iguais.", "Passwords must match."],
  passwordShort: [
    "Use uma senha com pelo menos 8 caracteres.",
    "Use a password with at least 8 characters.",
  ],
  loading: ["Carregando…", "Loading…"],
  saving: ["Salvando…", "Saving…"],
  save: ["Salvar", "Save"],
  saved: ["Alterações salvas.", "Changes saved."],
  added: ["Registro adicionado.", "Record added."],
  deleted: ["Registro excluído.", "Record deleted."],
  error: [
    "Não foi possível concluir. Tente novamente.",
    "Could not complete the action. Please try again.",
  ],
  notConfigured: [
    "O painel ainda está sendo preparado. O acesso às contas será liberado após a configuração do serviço.",
    "This dashboard is being prepared. Account access will be available after the service is configured.",
  ],
  loadError: [
    "Não foi possível carregar seus dados. Verifique sua conexão e tente novamente.",
    "Could not load your data. Check your connection and try again.",
  ],
  retry: ["Tentar novamente", "Try again"],
  invalidAmount: [
    "Informe um valor válido, maior que zero.",
    "Enter a valid amount greater than zero.",
  ],
  invalidFields: ["Confira os campos do formulário.", "Check the form fields."],
  invalidRange: [
    "A data inicial deve ser anterior ou igual à final.",
    "The start date must be on or before the end date.",
  ],
  signedOut: [
    "Sua sessão terminou. Entre novamente.",
    "Your session has ended. Sign in again.",
  ],
  emailUnconfirmed: [
    "Confirme seu e-mail antes de acessar o painel.",
    "Confirm your email before accessing the dashboard.",
  ],
  authInvalid: ["E-mail ou senha incorretos.", "Incorrect email or password."],
  authRate: [
    "Muitas tentativas. Aguarde um pouco e tente novamente.",
    "Too many attempts. Wait a moment and try again.",
  ],
  authExpired: [
    "Este link expirou ou não é válido. Solicite outro link.",
    "This link has expired or is invalid. Request another link.",
  ],
  authWeak: [
    "Esta senha não atende aos requisitos de segurança.",
    "This password does not meet the security requirements.",
  ],
  duplicate: [
    "Já existe um registro com esses dados.",
    "A record with these details already exists.",
  ],
  categoryUsed: [
    "Esta categoria está em uso em movimentações ou orçamentos. Edite esses registros antes de excluí-la.",
    "This category is used by transactions or budgets. Update those records before deleting it.",
  ],
  newTransaction: ["Nova movimentação", "New transaction"],
  income: ["Receitas", "Income"],
  expense: ["Despesas", "Expenses"],
  incomeSingle: ["Receita", "Income"],
  expenseSingle: ["Despesa", "Expense"],
  balance: ["Saldo atual", "Current balance"],
  result: ["Resultado do período", "Period result"],
  count: ["Movimentações", "Transactions"],
  allTime: ["Saldo de todas as movimentações", "Balance of all transactions"],
  thisPeriod: ["No período selecionado", "In the selected period"],
  period: ["Período", "Period"],
  month: ["Mês", "Month"],
  start: ["De", "From"],
  end: ["Até", "To"],
  all: ["Todos", "All"],
  evolution: ["Evolução financeira", "Financial trend"],
  distribution: ["Gastos por categoria", "Spending by category"],
  topExpenses: ["Maiores despesas", "Largest expenses"],
  monthlySummary: ["Resumo mensal", "Monthly summary"],
  balanceEvolution: ["Evolução do saldo", "Balance over time"],
  comparison: ["Receitas × despesas", "Income × expenses"],
  emptyTransactions: [
    "Sua história financeira começa aqui. Adicione sua primeira movimentação.",
    "Your financial story starts here. Add your first transaction.",
  ],
  emptyFilter: [
    "Nenhuma movimentação encontrada com estes filtros.",
    "No transactions match these filters.",
  ],
  emptyExpenses: [
    "Nenhuma despesa neste período.",
    "No expenses in this period.",
  ],
  emptyGoals: [
    "Qual é seu próximo objetivo? Crie sua primeira meta.",
    "What is your next target? Create your first goal.",
  ],
  emptyBudget: [
    "Nenhum limite definido para este mês.",
    "No spending limits set for this month.",
  ],
  search: ["Pesquisar descrição", "Search description"],
  type: ["Tipo", "Type"],
  category: ["Categoria", "Category"],
  date: ["Data", "Date"],
  description: ["Descrição", "Description"],
  amount: ["Valor", "Amount"],
  actions: ["Ações", "Actions"],
  edit: ["Editar", "Edit"],
  delete: ["Excluir", "Delete"],
  cancel: ["Cancelar", "Cancel"],
  add: ["Adicionar", "Add"],
  clearFilters: ["Limpar filtros", "Clear filters"],
  descriptionHint: [
    "Ex.: salário, mercado, aluguel",
    "E.g. salary, groceries, rent",
  ],
  deleteTitle: ["Excluir este registro?", "Delete this record?"],
  deleteBody: [
    "Essa ação não pode ser desfeita.",
    "This action cannot be undone.",
  ],
  goalTitle: ["Nome da meta", "Goal name"],
  goalHint: ["Ex.: reserva de emergência", "E.g. emergency fund"],
  target: ["Valor objetivo", "Target amount"],
  current: ["Valor já guardado", "Amount saved"],
  deadline: ["Prazo (opcional)", "Deadline (optional)"],
  noDeadline: ["Sem prazo", "No deadline"],
  newGoal: ["Criar meta", "Create goal"],
  editGoal: ["Editar meta", "Edit goal"],
  progress: ["Registrar progresso", "Record progress"],
  contribution: ["Valor a adicionar", "Amount to add"],
  goalReached: ["Meta alcançada", "Goal reached"],
  goalNote: [
    "O progresso da meta é um acompanhamento; não cria movimentações automaticamente.",
    "Goal progress is for tracking; it does not create transactions automatically.",
  ],
  newCategory: ["Criar categoria", "Create category"],
  editCategory: ["Editar categoria", "Edit category"],
  color: ["Cor", "Color"],
  categoryName: ["Nome da categoria", "Category name"],
  categoryHint: ["Ex.: saúde, educação", "E.g. health, education"],
  limit: ["Limite de gastos", "Spending limit"],
  spent: ["Utilizado", "Spent"],
  remaining: ["Disponível", "Remaining"],
  overAmount: ["Acima do limite", "Over budget"],
  threshold: ["Alertar a partir de (%)", "Alert at (%)"],
  safe: ["Dentro do orçamento", "Within budget"],
  near: ["Limite próximo", "Near the limit"],
  over: ["Limite ultrapassado", "Over the limit"],
  unset: ["Sem limite definido", "No limit set"],
  editBudget: ["Definir limite", "Set limit"],
  removeBudget: ["Remover limite", "Remove limit"],
  budgetNote: [
    "Os limites e os gastos são calculados por mês.",
    "Limits and spending are calculated by month.",
  ],
  preferences: ["Suas preferências", "Your preferences"],
  language: ["Idioma", "Language"],
  currency: ["Moeda", "Currency"],
  currencyHelp: [
    "Os valores são registrados em reais. A troca de moeda será disponibilizada com suporte próprio, sem conversão automática.",
    "Amounts are recorded in Brazilian reais. Other currencies will be available with dedicated support, without automatic conversion.",
  ],
  theme: ["Aparência", "Appearance"],
  light: ["Claro", "Light"],
  dark: ["Escuro", "Dark"],
  toggleTheme: ["Alternar tema", "Toggle theme"],
  notifications: ["Alertas no painel", "In-app alerts"],
  notificationsHelp: [
    "Mostra avisos do orçamento dentro do painel. Não envia e-mails ou notificações para o celular.",
    "Shows budget alerts within the dashboard. Does not send email or mobile notifications.",
  ],
  notificationsEmpty: [
    "Nenhum alerta de orçamento para este mês.",
    "No budget alerts for this month.",
  ],
  welcome: ["Bom ver você por aqui", "Good to see you"],
  overviewBody: [
    "Um olhar claro sobre o seu dinheiro.",
    "A clear view of your money.",
  ],
  reportBody: [
    "Entenda o período antes de planejar o próximo.",
    "Understand this period before planning the next.",
  ],
  reportInsightPositive: [
    "As receitas cobriram as despesas neste período.",
    "Income covered expenses in this period.",
  ],
  reportInsightNegative: [
    "As despesas superaram as receitas neste período. Revise as maiores categorias de gastos.",
    "Expenses exceeded income in this period. Review your largest spending categories.",
  ],
  reportInsightEmpty: [
    "Adicione movimentações para começar a acompanhar seus resultados.",
    "Add transactions to start tracking your results.",
  ],
  page: ["Página", "Page"],
  previous: ["Anterior", "Previous"],
  next: ["Próxima", "Next"],
  of: ["de", "of"],
  filterCount: ["registros encontrados", "records found"],
  footer: [
    "Organização financeira, um passo de cada vez.",
    "Financial organization, one step at a time.",
  ],
  callback: ["Confirmando seu acesso…", "Confirming your access…"],
  callbackFailed: [
    "Não foi possível confirmar o acesso. Tente entrar ou peça um novo e-mail.",
    "Could not confirm access. Try signing in or request a new email.",
  ],
};
const Context = createContext(null);
export function LocaleProvider({ children }) {
  const { settings } = useFinance();
  const [publicLanguage, setPublicLanguage] = useState(() => {
    try {
      return localStorage.getItem("dsc_language") === "en-US"
        ? "en-US"
        : "pt-BR";
    } catch {
      return "pt-BR";
    }
  });
  const locale = settings.user_id ? settings.language : publicLanguage;
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  const setLanguage = (value) => {
    setPublicLanguage(value);
    try {
      localStorage.setItem("dsc_language", value);
    } catch {
      /* preference storage is optional */
    }
  };
  const t = (key) => dictionary[key]?.[locale === "en-US" ? 1 : 0] || key;
  const categoryName = (category) =>
    category.builtin_key
      ? t(
          {
            essenciais: "essentials",
            dividas: "debts",
            lazer: "leisure",
            futuro: "future",
          }[category.builtin_key],
        )
      : category.name;
  return (
    <Context.Provider value={{ locale, t, setLanguage, categoryName }}>
      {children}
    </Context.Provider>
  );
}
export const useLocale = () => useContext(Context);
export function errorKey(error) {
  if (dictionary[error?.message]) return error.message;
  if (error?.code === "23505") return "duplicate";
  if (error?.code === "23503") return "categoryUsed";
  if (error?.code === "email_not_confirmed") return "emailUnconfirmed";
  if (error?.code === "invalid_credentials") return "authInvalid";
  if (error?.code === "weak_password") return "authWeak";
  if (/rate|too many/i.test(error?.message || "")) return "authRate";
  if (/expired|invalid.*token/i.test(error?.message || ""))
    return "authExpired";
  return "error";
}
