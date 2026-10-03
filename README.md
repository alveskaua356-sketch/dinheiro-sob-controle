# Dinheiro Sob Controle

Super Painel Financeiro em React, com interface em português e inglês, tema claro/escuro e dados pessoais protegidos no Supabase.

## Estado da entrega

O código do painel e a migração do banco estão implementados. **A aplicação só pode receber clientes após configurar um projeto Supabase, aplicar a migração, publicar a aplicação e validar o fluxo com e-mails reais.** Não há modo de demonstração em produção, login local, pagamentos ou registros financeiros de exemplo.

## Recursos implementados

- Landing page e acesso por e-mail: cadastro, confirmação, login, logout, reenvio e recuperação de senha.
- Rotas protegidas, observação de mudanças de sessão e carregamento seguro ao trocar de conta.
- Dashboard com saldo geral, receitas, despesas, resultado do período, quantidade de movimentações, gastos por categoria, maiores despesas e resumo mensal.
- Movimentações: criar, editar, excluir, pesquisar, filtrar e paginar; armazenamento em centavos.
- Categorias: criar, renomear, mudar cor e excluir quando não estiverem em uso.
- Metas: criar, editar, excluir e registrar valor de progresso escolhido pelo usuário.
- Orçamentos mensais por categoria, limite, percentual de alerta e estados normal/próximo/ultrapassado.
- Relatórios filtrados e evolução do saldo, incluindo o saldo anterior ao período.
- Nome de exibição, idioma, tema e alertas dentro do painel. Os alertas não são push nem e-mail.
- BRL como única moeda habilitada; os formatadores recebem o código de moeda e o modelo está preparado para extensão sem fingir conversão.
- RLS em todas as tabelas, permissões por operação e chaves estrangeiras que impedem relacionar categorias de outro usuário.

## Preparar a infraestrutura

1. Crie ou escolha um projeto em https://supabase.com/dashboard.
2. Aplique `supabase/migrations/202610030001_initial.sql` no SQL Editor do projeto, **uma única vez**, ou use o Supabase CLI para aplicar a migração. O arquivo cria todas as tabelas, políticas, índices e categorias iniciais. Não cria dados financeiros.
3. Em Authentication, habilite cadastro por e-mail e confirmação de e-mail. Configure as regras de senha e limites de acesso conforme o serviço.
4. Em Authentication → URL Configuration, defina o endereço publicado como Site URL. Autorize exatamente estas URLs:
   - `https://SEU-DOMINIO/auth/callback`
   - `https://SEU-DOMINIO/redefinir-senha`
   Para testes locais, acrescente as versões com `http://localhost:5173` ou `http://127.0.0.1:5173`.
5. Configure um remetente SMTP autorizado no Supabase quando necessário para entregar e-mails aos clientes. Verifique restrições do remetente padrão e limites do plano antes de lançar. O painel não inventa envio de e-mail.
6. Configure no serviço de hospedagem as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` e gere um novo build. A chave publishable (ou anon legada) é pública por projeto; RLS garante a autorização. **Nunca use service_role, secret key, senha do banco ou access token em variáveis VITE_.**
7. A aplicação pode ser hospedada como site estático em Vercel ou Netlify: `npm ci`, build `npm run build`, saída `dist`. Os arquivos `vercel.json` e `public/_redirects` configuram as rotas. GitHub armazena o código; ele não provisiona o banco ou o remetente de e-mail.

Não é necessário editar o código para fornecer essas configurações. Sem elas, a landing funciona e o acesso às contas exibe uma mensagem de preparação; nenhum cadastro falso é criado.

## Desenvolvimento

Requer Node.js 22.12+.

```sh
npm ci
cp .env.example .env
npm run dev
```

Configure `.env` somente em ambiente privado. Ele está ignorado pelo Git. Para desenvolvimento, `npm run dev -- --host 127.0.0.1` usa apenas a interface local.

```sh
npm test
npx playwright install chromium
npm run test:browser
npm run build
```

- `npm test`: cálculos e testes reais de PostgreSQL com PGlite; aplica a migração e verifica isolamento, operações permitidas e negadas, anon, relacionamentos e restrições.
- `npm run test:browser`: fluxo de interface em Chromium, com respostas de backend interceptadas **apenas no teste**. Verifica CRUD, filtros, gráficos, preferências, responsividade, logout e bloqueio de rotas. Não prova entrega de e-mail nem disponibilidade do Supabase hospedado.
- GitHub Actions executa esses testes e o build em cada alteração.

## Validação antes de vender

Use duas contas de teste e dados claramente identificados como teste. Não registre informações de clientes durante a validação.

- [ ] Configuração real do Supabase aplicada e hospedagem conectada.
- [ ] Cadastro → recebimento do e-mail → confirmação → login.
- [ ] Receita → despesa → edição → exclusão → totais e gráficos atualizados.
- [ ] Atualizar página e acessar em outro navegador: dados mantidos.
- [ ] Categoria → edição → exclusão; impedir exclusão quando em uso.
- [ ] Meta → edição → progresso escolhido → exclusão.
- [ ] Orçamento → próximo do limite → acima do limite → troca de mês → remoção.
- [ ] Relatórios com períodos diferentes, totais, distribuição e saldo coerentes.
- [ ] Nome, idioma completo, tema e alertas persistidos.
- [ ] Recuperação: e-mail → link válido → nova senha → novo login.
- [ ] Logout → tentativa de acessar `/dashboard` bloqueada.
- [ ] Conta A e conta B: nenhuma leitura, edição, exclusão ou referência cruzada aos registros da outra conta, inclusive pela API.
- [ ] Verificar entrega e limites dos e-mails com destinatários autorizados.

## Limites e operação

- Confirmação e recuperação dependem de URLs de redirecionamento e remetente corretos no Supabase.
- Uma conta começa vazia. As quatro categorias iniciais são criadas no banco ao cadastrar; metas, limites e movimentações são do próprio usuário.
- A lista do usuário é lida em páginas para não perder dados pelo limite padrão da API. As métricas são calculadas no cliente; bases muito grandes podem exigir agregação no servidor no futuro.
- Alterar moeda não é conversão financeira. Outras moedas devem incluir regras de registro e migração antes de habilitar.
- Não há integração de compra ou controle de acesso por pagamento. Cadastro público não comprova compra do e-book.
