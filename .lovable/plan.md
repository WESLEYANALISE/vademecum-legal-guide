

## Plano: Corrigir Monitoramento em Tempo Real

### Problema

O tracker de presença (`usePresenceTracker`) publica no canal `online-users`. O monitor admin escuta no canal `online-users-monitor` — um canal completamente diferente e vazio. Por isso "Em tempo real" sempre mostra 0.

### Solução

Mudar o monitor para escutar o mesmo canal `online-users`, mas **sem chamar `.track()`** — apenas ouvindo. O erro anterior ("cannot add presence callbacks after subscribe") acontecia porque o Supabase não permite dois objetos de canal com o mesmo nome no mesmo cliente. A solução é:

1. No `AdminMonitorUsuarios.tsx`, usar o canal `online-users` com uma **key de presença diferente** (ex: `monitor-{random}`) para que o Supabase trate como uma instância separada mas conectada ao mesmo tópico.

Na verdade, o Supabase não permite dois canais com o mesmo nome no mesmo cliente. A abordagem correta é:

**Opção escolhida**: O monitor vai se juntar ao canal `online-users` fazendo `.track()` com seus próprios dados (marcado como admin/monitor), e assim consegue ver todos os outros participantes via `presenceState()`. Porém, para evitar o erro de canal duplicado, o `usePresenceTracker` no `App.tsx` precisa ser desativado quando o usuário está na página de monitoramento, OU o monitor reutiliza o canal existente.

**Melhor abordagem**: Usar o canal com um sufixo único no tracker E no monitor, ambos apontando para o mesmo canal Supabase. O problema real é que o Supabase SDK não permite criar dois objetos `channel('online-users')` no mesmo cliente. Então:

- Mudar o monitor para usar `online-users` como nome do canal
- Remover o canal do tracker antes de criar o do monitor (ou vice-versa)

**Abordagem final mais simples**: Mudar o `usePresenceTracker` para expor o canal/state globalmente, e o monitor consome esse state ao invés de criar um segundo canal.

### Implementação

| Arquivo | Mudança |
|---------|---------|
| `src/hooks/usePresenceTracker.ts` | Exportar um store/ref global com o `presenceState` atualizado em cada sync |
| `src/pages/AdminMonitorUsuarios.tsx` | Importar o state de presença do hook ao invés de criar canal próprio. Usar polling do state a cada 2s para manter atualizado |

**Detalhes técnicos:**

1. **`usePresenceTracker.ts`**: Adicionar uma variável global `presenceStateRef` que é atualizada no callback de `sync`. Exportar uma função `getPresenceState()` e o próprio `channelRef` para que o monitor possa acessar.

2. **`AdminMonitorUsuarios.tsx`**: Ao invés de criar um canal separado, usar `setInterval` de 2s que chama `getPresenceState()` do tracker e atualiza a lista de usuários em tempo real. Isso elimina completamente o conflito de canais duplicados.

### Resultado

O bloco "Em tempo real" vai mostrar corretamente todos os usuários conectados, incluindo o próprio admin.

