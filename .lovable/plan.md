

## Plano: Deduplicar Usuários Online e Mostrar E-mail

### Problema

O polling de presença em `AdminMonitorUsuarios.tsx` (linhas 134-148) empurra **todas** as entradas do `presenceState` sem deduplicar. Se um usuário tem múltiplas presenças (múltiplas abas, reconexões), ele aparece repetido. Além disso, mostra `display_name` ao invés do e-mail.

### Solução

**1. Deduplicar por `user_id` no polling de presença (linhas 134-148)**

Usar um `Map<string, PresenceUser>` para manter apenas a entrada mais recente de cada `user_id`:

```typescript
const poll = () => {
  const state = getPresenceState();
  const map = new Map<string, PresenceUser>();
  Object.values(state).forEach((presences: any[]) => {
    presences.forEach((p) => {
      const existing = map.get(p.user_id);
      if (!existing || new Date(p.online_at) > new Date(existing.online_at)) {
        map.set(p.user_id, { ... });
      }
    });
  });
  setRealtimeUsers(Array.from(map.values()));
};
```

**2. Mostrar e-mail no lugar do nome na lista de usuários**

Na renderização dos cards de usuário, exibir `user.email` como texto principal (truncado se necessário) em vez de `user.name`.

### Arquivos

| Arquivo | Ação |
|---------|------|
| `src/pages/AdminMonitorUsuarios.tsx` | Deduplicar presença por user_id; exibir e-mail como identificador principal |

