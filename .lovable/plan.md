

## Análise de Performance: Transições Lentas e Carregamento

### Problemas Identificados

#### 1. `PageTransition` com `initial={{ x: '100%' }}` bloqueia conteúdo
A animação slide-in do Framer Motion começa com o conteúdo 100% fora da tela. A spring animation com `mass: 0.8` leva ~400-500ms para completar. Durante esse tempo, o conteúdo é invisível — dando sensação de "travamento".

#### 2. `lazy()` + `Suspense` exibe spinner antes de cada página
Todas as páginas (exceto Index/Auth) usam `lazy()`. Na primeira visita, o JS precisa ser baixado antes de renderizar. O `LazyFallback` mostra um spinner Loader2, criando um "flash de carregamento" perceptível.

#### 3. Carregamento de artigos em cascata (waterfall)
Ao selecionar uma lei em CategoriaLegislacao:
1. O JS do chunk é baixado (lazy) → spinner
2. PageTransition anima → invisível por ~400ms  
3. `getCachedArtigos()` verifica cache → se vazio, `fetchArtigosInstant()` faz request HTTP → outro spinner
4. Depois `fetchArtigosPaginado()` busca o restante

São 3 etapas sequenciais antes do usuário ver conteúdo.

#### 4. Prefetch agressivo mas não direcionado
O `prefetchAllArtigos()` busca 65+ tabelas em paralelo, mas sem priorizar a tabela que o usuário vai acessar. Se o cache já estiver populado, o acesso é instantâneo. Se não, o usuário espera.

---

### Plano de Correção

#### Etapa 1: Eliminar a animação bloqueante do PageTransition
- Trocar `initial={{ x: '100%' }}` por `initial={{ opacity: 0.6, x: '3%' }}` — um micro-slide de 3% com fade
- Reduzir a duração para ~150ms com `type: 'tween'` em vez de spring
- O conteúdo fica visível quase imediatamente

#### Etapa 2: Preload dos chunks mais usados
- Adicionar `<link rel="modulepreload">` para CategoriaLegislacao no `index.html`, ou
- Usar `import()` eager no `Index.tsx` quando o usuário está na home (preload em idle):
  ```ts
  requestIdleCallback(() => import('./pages/CategoriaLegislacao.tsx'));
  ```
- Isso elimina o tempo de download do chunk quando o usuário navega

#### Etapa 3: Skeleton instantâneo em vez de spinner
- No `LazyFallback`, substituir o spinner por um skeleton layout que imita a estrutura da página de legislação (header + cards)
- Cria a percepção de que a página já carregou

#### Etapa 4: Prefetch inteligente baseado em navegação
- Quando o usuário está na home, já iniciar o prefetch da tabela mais provável (CF88, CP, CC)
- Quando estiver em `/legislacao/codigo`, prefetchar todas as tabelas daquele tipo específico com prioridade máxima
- Usar `navigator.connection` para ajustar concorrência (2 em 3G, 6 em Wi-Fi)

#### Etapa 5: Índice do banco — verificar se as tabelas têm índice em `ordem_numero`
- Criar migration SQL adicionando `CREATE INDEX IF NOT EXISTS` em `ordem_numero` para as tabelas de artigos mais usadas
- Isso acelera as queries `ORDER BY ordem_numero ASC` que são feitas em cada fetch

---

### Arquivos a Editar

| # | Arquivo | Mudança |
|---|---------|---------|
| 1 | `src/components/PageTransition.tsx` | Micro-slide + fade rápido (~150ms) |
| 2 | `src/App.tsx` | Preload dos chunks críticos com `requestIdleCallback`; skeleton no LazyFallback |
| 3 | `src/pages/Index.tsx` | Prefetch direcionado dos chunks de legislação |
| 4 | `src/services/legislacaoService.ts` | Priorizar prefetch por tipo da categoria atual |
| 5 | Migration SQL | Índices em `ordem_numero` nas top 10 tabelas |

### Resultado Esperado
- Transição de página: de ~500ms para ~150ms percebidos
- Primeira visita a uma lei: de spinner + slide para skeleton instantâneo com conteúdo em ~200ms (se cache hit) ou ~500ms (se fetch necessário, mas com skeleton visível)

