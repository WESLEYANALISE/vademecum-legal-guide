

## Plano: Dashboard de Monitoramento de Usuários Online (Tempo Real)

### Visão Geral

Criar uma nova página de monitoramento que exibe usuários online em tempo real usando Supabase Realtime Presence. Três blocos: **Em tempo real**, **Últimos 5 minutos** e **Hoje**. Cada usuário mostra e-mail, tempo de cadastro e a página/função que está acessando.

### Arquitetura

O Supabase Realtime Presence permite rastrear quem está online sem tabela extra. Cada cliente se conecta a um canal de presença e publica seu estado (rota atual, e-mail, user_id). O admin escuta todas as presenças.

**Porém**, Presence só mostra quem está *agora*. Para "Últimos 5 minutos" e "Hoje", precisamos de uma tabela de log de atividade.

### 1. Tabela `user_activity_log` (nova migração)

```sql
CREATE TABLE public.user_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text,
  display_name text,
  current_route text,
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_last_seen ON user_activity_log (last_seen_at DESC);
CREATE UNIQUE INDEX idx_activity_user ON user_activity_log (user_id);

ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read all" ON user_activity_log
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users upsert own" ON user_activity_log
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### 2. Hook `usePresenceTracker` (novo)

- Arquivo: `src/hooks/usePresenceTracker.ts`
- Conecta ao canal Supabase Presence `online-users`
- Publica estado do usuário (e-mail, rota atual via `useLocation`)
- A cada 30s faz upsert na tabela `user_activity_log` com a rota atual e `last_seen_at = now()`
- Montado no `App.tsx` para todos os usuários logados

### 3. Página `AdminMonitorUsuarios` (nova)

- Arquivo: `src/pages/AdminMonitorUsuarios.tsx`
- Rota: `/admin-monitor-usuarios`
- Três cards/blocos:

| Bloco | Fonte | Lógica |
|-------|-------|--------|
| **Em tempo real** | Supabase Presence | Lista quem está no canal agora (bolinha verde pulsante) |
| **Últimos 5 min** | `user_activity_log WHERE last_seen_at > now() - 5min` | Query a cada 30s |
| **Hoje** | `user_activity_log WHERE last_seen_at > início do dia` | Query ao carregar |

- Cada linha mostra: avatar, display_name, e-mail, rota atual (ex: "Vade Mecum", "Biblioteca"), tempo de cadastro (calculado de `profiles.created_at`), indicador online/offline

### 4. Integração

- Adicionar rota no `App.tsx`
- Adicionar card no `AdminFuncoes.tsx` com ícone `Users` e link para `/admin-monitor-usuarios`
- O `usePresenceTracker` será montado no `App.tsx` apenas quando o usuário estiver logado

### Arquivos

| Arquivo | Ação |
|---------|------|
| Migração SQL | Criar tabela `user_activity_log` |
| `src/hooks/usePresenceTracker.ts` | Novo — tracker de presença + heartbeat |
| `src/pages/AdminMonitorUsuarios.tsx` | Nova página com os 3 blocos |
| `src/App.tsx` | Adicionar rota + montar hook |
| `src/pages/AdminFuncoes.tsx` | Adicionar card "Usuários Online" |

