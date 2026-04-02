

## Plano: Perfil, Suporte por Email, Sobre o App

### Resumo
1. Criar página `/perfil` com dados do usuário e opção de excluir conta (com confirmação)
2. Ajustar botão "Suporte" para abrir formulário de contato que envia email ao admin (`wn7corporation@gmail.com`)
3. Remover "Ajuda" do menu lateral
4. Criar página `/sobre` com informações detalhadas do app

### Mudanças

**1. Nova página `src/pages/Perfil.tsx`**
- Header com botão voltar
- Card com avatar, nome (display_name), email, data de criação
- Opção de editar nome de exibição
- Botão "Excluir Conta" em vermelho
- AlertDialog de confirmação flutuante: "Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita."
- Ao confirmar: chama `supabase.rpc` ou `supabase.auth.admin.deleteUser` — como não temos acesso admin no client, a exclusão será feita via Edge Function dedicada

**2. Nova Edge Function `supabase/functions/excluir-conta/index.ts`**
- Valida o JWT do usuário
- Usa `service_role` para deletar o usuário via `supabase.auth.admin.deleteUser(userId)`
- Retorna sucesso → frontend faz signOut e redireciona para `/auth`

**3. Nova Edge Function `supabase/functions/enviar-suporte/index.ts`**
- Recebe `{ assunto, mensagem }` do usuário autenticado
- Envia email para `wn7corporation@gmail.com` usando a API do Resend (ou simplesmente salva numa tabela `mensagens_suporte` para o admin visualizar no painel)
- Como não há serviço de email configurado, a abordagem mais simples será salvar numa tabela `mensagens_suporte` que o admin pode consultar

**4. Tabela `mensagens_suporte`** (migration)
- `id uuid`, `user_id uuid`, `email text`, `assunto text`, `mensagem text`, `created_at timestamp`
- RLS: usuário pode inserir apenas com seu próprio `user_id`; admin pode ler tudo

**5. Nova página `src/pages/SobreApp.tsx`**
- Página completa com informações sobre o Vacatio
- O que é, para quem serve, funcionalidades principais
- Versão, créditos, links úteis

**6. Atualizar menus laterais (`SideMenu.tsx` + `DesktopSidebar.tsx`)**
- Botão "Perfil" → navega para `/perfil`
- Botão "Suporte" → abre sheet/dialog com formulário (assunto + mensagem) que salva na tabela
- Remover item "Ajuda" da seção Configurações
- Item "Sobre o App" → navega para `/sobre`

**7. Atualizar `App.tsx`**
- Adicionar rotas `/perfil` e `/sobre` (lazy loaded, protegidas)

### Detalhes Técnicos

**Perfil** — busca dados de `profiles` (display_name, avatar_url, created_at) + `user.email` do auth context.

**Exclusão de conta** — Edge Function com `createClient` usando `SUPABASE_SERVICE_ROLE_KEY`:
```text
const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
```

**Suporte** — insert direto na tabela via client SDK com RLS policy de insert.

**Sobre o App** — página estática com conteúdo descritivo do Vacatio, sem necessidade de banco de dados.

