

## Inspeção Completa do App Vacatio — Problemas Encontrados

### 1. Sistemas de Toast Duplicados (Redundância)

O app carrega **dois sistemas de toast ao mesmo tempo** no `App.tsx`:
- `<Toaster />` — baseado em `@/hooks/use-toast.ts` (sistema custom com reducer)
- `<Sonner />` — baseado na lib `sonner`

Nenhuma página ou componente usa o `useToast()` custom — **todas usam `toast` do sonner**. O `<Toaster />` e todo o sistema em `src/hooks/use-toast.ts` + `src/components/ui/toaster.tsx` + `src/components/ui/use-toast.ts` são código morto.

**Correção**: Remover `<Toaster />` do `App.tsx` e os 3 arquivos do sistema custom de toast.

---

### 2. `sonner.tsx` importa `next-themes` (biblioteca inexistente)

O `src/components/ui/sonner.tsx` importa `useTheme` de `next-themes`, mas o app usa um `useTheme` custom em `src/hooks/useTheme.tsx`. O `next-themes` provavelmente funciona porque está como dependência instalada, mas é **desnecessário e semanticamente errado** — o tema real do app (paleta vinho/marfim) não é comunicado ao Sonner.

**Correção**: Substituir a importação de `next-themes` pelo `useTheme` do próprio projeto ou simplesmente fixar o tema como `"light"`.

---

### 3. Página Órfã: `GerarVideo.tsx`

O arquivo `src/pages/GerarVideo.tsx` existe mas **não tem rota no `App.tsx`** e nenhum componente importa ou navega para ele. É código morto.

**Correção**: Remover `src/pages/GerarVideo.tsx` e os 6 arquivos `.asset.json` em `src/assets/videos/`.

---

### 4. Segurança: 37 Políticas RLS com `USING (true)` para INSERT/UPDATE/DELETE

O linter do Supabase encontrou **37 tabelas com RLS policies excessivamente permissivas** — permitindo que qualquer usuário autenticado insira, atualize ou delete dados sem restrição. Isso inclui tabelas sensíveis como `biblioteca_livros`, `study_sessions`, `profiles`, etc.

**Risco**: Qualquer usuário autenticado pode modificar dados de outros usuários.

**Correção**: Revisar as policies e restringir INSERT/UPDATE/DELETE com `auth.uid() = user_id` onde aplicável.

---

### 5. Segurança: Proteção contra Senhas Vazadas Desabilitada

O Supabase reporta que a verificação de senhas vazadas (HaveIBeenPwned) está desativada.

**Correção**: Ativar em Dashboard > Auth > Settings.

---

### 6. Materialized View Exposta na API

Uma materialized view está acessível via API REST pública sem necessidade. Pode expor dados internos.

**Correção**: Remover da API ou adicionar RLS.

---

### 7. Preload de `brasaoImg` no Escopo Global

O `App.tsx` cria um `new Image()` no escopo global para pré-carregar `brasao-republica.png`. Isso funciona, mas o `decoding = 'sync'` força o browser a decodificar sincronamente — pode travar a thread principal em dispositivos lentos.

**Correção**: Mudar para `decoding = 'async'` ou remover.

---

### Resumo de Prioridades

| # | Problema | Severidade | Impacto |
|---|----------|-----------|---------|
| 1 | Toast duplicado (código morto) | Baixa | Performance/bundle |
| 2 | `next-themes` incorreto no sonner | Média | Tema inconsistente |
| 3 | `GerarVideo.tsx` órfão | Baixa | Bundle desnecessário |
| 4 | RLS permissiva em 37 tabelas | Alta | Segurança |
| 5 | Senhas vazadas desabilitado | Média | Segurança |
| 6 | Materialized view na API | Média | Segurança |
| 7 | `decoding: sync` no preload | Baixa | Performance |

### Arquivos a Alterar

| Arquivo | Ação |
|---------|------|
| `src/App.tsx` | Remover import/uso de `<Toaster />` |
| `src/components/ui/sonner.tsx` | Substituir `next-themes` |
| `src/hooks/use-toast.ts` | Deletar |
| `src/components/ui/toaster.tsx` | Deletar |
| `src/components/ui/use-toast.ts` | Deletar |
| `src/pages/GerarVideo.tsx` | Deletar |
| `src/assets/videos/*.asset.json` (6 arquivos) | Deletar |
| Supabase RLS policies | Migration para restringir as 37 policies |

