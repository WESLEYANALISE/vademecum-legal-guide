

## Plano: Melhorias no Monitor de Usuários

### O que muda

1. **Filtrar admin**: O e-mail `wn7corporation@gmail.com` será excluído de todas as listas (realtime, últimos 5 min, hoje, ontem, rank). O admin não aparecerá como "online".

2. **Novo card "Ontem"**: Adicionar um 4º card na linha superior mostrando usuários que acessaram ontem (das 00:00 às 23:59 do dia anterior). Layout passa de `grid-cols-3` para `grid-cols-2 grid-cols-4` responsivo (2 colunas em 2 linhas, ou 4 em uma linha no desktop).

3. **Tela de detalhe do usuário**: Ao clicar em um usuário dentro de qualquer card expandido, abrir um painel com:
   - Total de acessos (contagem de registros na `user_activity_log`)
   - Primeiro acesso (data mais antiga)
   - Último acesso
   - Se é **recorrente** (acessou em mais de 1 dia distinto)
   - Quantos dias distintos acessou
   - Rotas mais visitadas (top 5)

### Detalhes técnicos

**Filtragem admin**: Constante `ADMIN_EMAIL = 'wn7corporation@gmail.com'` no topo. Filtrar em:
- `realtimeUsers` (excluir do array de presença)
- Cada query de `user_activity_log` via `.neq('email', ADMIN_EMAIL)`

**Card "Ontem"**: Nova query com `.gte('last_seen_at', startOfYesterday)` e `.lt('last_seen_at', startOfToday)`. Ícone `CalendarDays`, gradiente laranja.

**Detalhe do usuário**: Novo estado `selectedUser: string | null` (user_id). Ao selecionar, faz 1 query:
```sql
SELECT current_route, last_seen_at 
FROM user_activity_log 
WHERE user_id = '<id>' 
ORDER BY last_seen_at DESC
```
Calcula no frontend: total de registros, dias distintos, primeiro/último acesso, top rotas. Exibe badge "Recorrente" (>1 dia) ou "Novo" (1 dia só).

### Arquivos

| Arquivo | Ação |
|---------|------|
| `src/pages/AdminMonitorUsuarios.tsx` | Filtrar admin, adicionar card Ontem, adicionar tela de detalhe por usuário |

