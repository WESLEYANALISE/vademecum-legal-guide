

## Plano: Carregamento Instantâneo da Biblioteca

### Problema

A página Biblioteca demora a renderizar por dois motivos:

1. **Lazy loading** — `Biblioteca` é carregada com `lazy()` no App.tsx, o que causa um delay na primeira navegação (precisa baixar o chunk JS).
2. **4 consultas Supabase bloqueantes** — O menu inicial mostra skeletons enquanto aguarda as 4 queries retornarem (classicos, lideranca, estudos, fora_da_toga), apenas para exibir a contagem de livros.
3. **PageTransition com animação de slide** — aplica `opacity: 0.6` e `x: 3%` inicial, contribuindo para a sensação de lentidão.

### Solução

**1. Eager import em vez de lazy** (App.tsx)
- Trocar `const Biblioteca = lazy(...)` por `import Biblioteca from "./pages/Biblioteca.tsx"` — o chunk será incluído no bundle principal e não haverá delay de download.

**2. Mostrar o menu imediatamente, sem esperar as queries** (Biblioteca.tsx)
- Mudar `loading` inicial para `false` — renderizar as 4 categorias instantaneamente com contagem "..." enquanto os dados carregam.
- Quando as queries terminarem, atualizar as contagens in-place sem skeleton/flash.

**3. Remover animação de entrada no menu** (Biblioteca.tsx)
- O `renderMenu()` já usa `initial={false}`, mas a `PageTransition` wrapper ainda aplica slide. Usar `initial={false}` ou remover a PageTransition wrapper para esta rota específica, ou simplesmente tornar a transição mais rápida (duração 0).

### Arquivos Alterados

| Arquivo | Mudança |
|---------|---------|
| `src/App.tsx` | Eager import do Biblioteca |
| `src/pages/Biblioteca.tsx` | `loading` inicia como `false`; menu renderiza imediatamente com contagem placeholder; remover skeleton do menu |

