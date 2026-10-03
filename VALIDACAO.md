# Validação — 3 de outubro de 2026

## Verificado nesta entrega

- Build de produção concluído.
- 7 testes automatizados de cálculos e PostgreSQL/PGlite aprovados.
- 3 testes de interface em Chromium com backend isolado aprovados: fluxo completo, celular e recuperação/reenvio.
- 1 teste em Chromium sem backend configurado aprovado: cadastro/login desabilitados e dashboard deslogado bloqueado.
- Auditoria das dependências de produção: zero vulnerabilidades conhecidas na execução desta entrega.
- Revisão visual em 1280px e 390px, incluindo tema escuro.

O teste do banco aplica a migração em PostgreSQL local via PGlite e exercita políticas RLS reais, permissões por operação, escrita própria, escrita negada, leitura negada, mudança de dono negada, acesso anon negado, referência a categoria de outra conta negada e progresso de metas atômico.

O teste de interface usa contas e valores explicitamente de teste e intercepta as respostas de rede somente durante sua execução. Isso permite testar a interface sem usar dados de clientes. **Não equivale a testar o Supabase hospedado ou a entrega de e-mails.** O frontend de produção não contém fallback de login ou finanças locais.

## Fluxo de interface coberto

Cadastro e instrução de confirmação → login com sessão de teste confirmada → dashboard → receita → despesa → edição → filtros → persistência após atualização → categorias (criar, editar, excluir) → metas (criar, editar, progresso, excluir) → orçamento (limite, alerta, troca de mês, remoção) → relatórios e caminhos SVG dos gráficos → preferências e idioma → tema escuro → excluir despesa → logout → acesso deslogado negado.

Recuperação e reenvio exibem estados de solicitação; link de recuperação sem sessão é bloqueado. O recebimento, confirmação real e redefinição através de link entregue pelo serviço continuam pendentes.

## Pendências externas para liberação

1. Projeto Supabase do proprietário provisionado e migração aplicada.
2. Chave pública/URL configuradas na hospedagem, com as URLs de retorno corretas.
3. Remetente de e-mails configurado e entrega real validada.
4. Site publicado em hospedagem escolhida.
5. Repetir o fluxo completo com duas contas reais de teste, em navegadores diferentes.

O acesso do GitHub não inclui acesso ao Supabase, ao provedor de e-mail ou à hospedagem. Esta entrega é o código implementado e testado localmente; **não é um serviço publicado e liberado para compradores**. O cadastro não comprova compra: não foi solicitada nem implementada integração com pagamento.
