

## Diagnóstico Completo do Projeto

### Problemas Encontrados

---

#### 1. CRÍTICO — Prefetch tentando buscar 18 tabelas inexistentes

O `prefetchAllArtigos()` executa automaticamente 500ms após o carregamento da página e tenta buscar dados de **todas as 65+ leis** do catálogo. Das 23 leis novas adicionadas, apenas **5 tabelas existem** no banco (LEP, LMP, LD, LOC, LAA). As outras 18 geram requisições HTTP que retornam erro 404/400, desperdiçando banda e poluindo logs.

**Tabelas que NÃO existem ainda:**
LIT, L8112, LIA, NLL, LMS, LACP, LJE, LGPD, MCI, LF, LA, LI, LRP, LOMAN, LAT, LBPS, LCSS, LPC

**Correção:** Criar as 18 tabelas faltantes via migration + scraping, OU filtrar o prefetch para ignorar tabelas que ainda não foram populadas.

---

#### 2. MODERADO — `buscar_artigos_global` (RPC) não inclui as novas tabelas

A função SQL `buscar_artigos_global` tem um array hardcoded `all_tables` que lista apenas as tabelas originais (CF88, CP, CC, etc.). As 23 novas leis (lei-especial + previdenciário) **nunca aparecem nos resultados de busca global**.

**Correção:** Atualizar a função SQL para incluir as novas tabelas no array.

---

#### 3. MENOR — Warning de `ref` no `Skeleton` dentro de `RadarLegislacaoContent`

O componente `Skeleton` é um function component simples (sem `forwardRef`). Algo no `RadarLegislacaoContent` está passando um `ref` para ele, causando o warning repetido no console. Não quebra funcionalidade, mas polui os logs.

**Correção:** Adicionar `React.forwardRef` ao `Skeleton` component.

---

#### 4. MODERADO — `RadarLegislacaoContent` não referencia as novas leis especiais

O mapa `LEI_REFS` em `RadarLegislacaoContent.tsx` (que mapeia leis para termos de busca no Radar) não inclui nenhuma das 23 novas leis. PLs que mencionem Maria da Penha, LGPD, Lei de Drogas, etc. não serão detectados como relevantes.

**Correção:** Adicionar entradas para as novas leis no `LEI_REFS`.

---

#### 5. PERFORMANCE — Prefetch agressivo com 65+ leis simultâneas

O prefetch usa concurrency 4, mas agora o catálogo tem ~65 leis. São 65 requisições HTTP de até 2000 linhas cada, disparadas 500ms após o login. Isso pode sobrecarregar a rede, especialmente em conexões móveis.

**Correção:** Priorizar as leis mais usadas (CF, CP, CC, CPC, CPP, CLT, CDC) e postergar as demais. Ou usar um prefetch sob demanda.

---

### Plano de Correção

| Passo | Arquivo | Ação |
|-------|---------|------|
| 1 | Migration SQL | Criar as 18 tabelas faltantes (LIT, L8112, LIA, NLL, LMS, LACP, LJE, LGPD, MCI, LF, LA, LI, LRP, LOMAN, LAT, LBPS, LCSS, LPC) com RLS |
| 2 | Edge Function `scrape-legislacao` | Invocar scraping para cada uma das 18 leis |
| 3 | Migration SQL | Atualizar `buscar_artigos_global` para incluir as novas tabelas |
| 4 | `src/components/ui/skeleton.tsx` | Adicionar `React.forwardRef` |
| 5 | `RadarLegislacaoContent.tsx` | Adicionar as novas leis ao `LEI_REFS` |
| 6 | `src/services/legislacaoService.ts` | Otimizar prefetch: priorizar top 10 leis, postergar o resto |

### Observação
O passo 1+2 é o mais trabalhoso (criar 18 tabelas + scraping). Recomendo fazer em lotes de 5, como fizemos antes.

