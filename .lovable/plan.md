

## Plano: Remover Limites de 1000 Linhas em Todas as Consultas

### O Problema

O Supabase tem um limite padrão de **1000 linhas** por consulta. Qualquer `.select()` sem `.limit()` explícito retorna no máximo 1000 registros. Isso significa que tabelas com mais de 1000 artigos (Constituição, Código Civil, CPC, etc.) ou dados acumulados ficam truncados silenciosamente.

### Consultas Afetadas (sem limite ou com limite baixo)

| Arquivo | Consulta | Problema |
|---------|----------|----------|
| `src/pages/Gamificacao.tsx` | `.from(tabela).select('numero, rotulo, caput')` | Sem limite — tabelas com >1000 artigos ficam cortadas |
| `src/pages/GeracaoAdmin.tsx` | `.from('artigo_ai_cache').select(...)` | Sem limite — cache pode ter milhares de entradas |
| `src/pages/GeracaoAdmin.tsx` | `.from(tabela).select('numero, caput')` | Sem limite — leis grandes cortadas |
| `src/pages/GeracaoAdmin.tsx` | `.from(tabela).select('numero')` (batch) | Sem limite — mesma situação |
| `src/pages/Radar360.tsx` | `.from('radar_proposicoes').select(...)` | Sem limite — pode ultrapassar 1000 PLs |
| `src/pages/Radar360.tsx` | `.from('radar_pl_headlines').select(...).in(...)` | Sem limite |
| `src/components/radar/ProposicoesPanel.tsx` | `.from('radar_proposicoes').select(...)` | Sem limite |
| `src/components/radar/ProposicoesPanel.tsx` | `.from('radar_pl_headlines').select(...)` | Sem limite |
| `src/pages/AdminMonitor.tsx` | `.from('legislacao_alteracoes').limit(200)` | 200 pode ser pouco |
| `src/hooks/useStudyStats.ts` | `.from('study_sessions').limit(500)` | 500 pode truncar dados de usuários ativos |
| `src/pages/SimuladoAdmin.tsx` | `.from('simulado_process_logs').select(...)` | Sem limite |
| `src/pages/SimuladoAdmin.tsx` | `.from('simulado_questoes').select(...)` | Sem limite |

### Consultas que JÁ estão OK

- `legislacaoService.ts` — usa `limit=10000` no fetch direto
- `sumulasService.ts` — usa `limit=10000`
- `noticiasService.ts` — `.limit(50)` intencional (últimas 50 notícias)
- `radarService.ts` — `.limit(50)` intencional

### Solução

Adicionar `.limit(10000)` em todas as consultas que podem retornar mais de 1000 linhas. Para consultas que são intencionalmente pequenas (`.maybeSingle()`, `.limit(1)`, etc.), manter como está.

### Arquivos a Alterar

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Gamificacao.tsx` | Adicionar `.limit(10000)` na query de artigos |
| `src/pages/GeracaoAdmin.tsx` | Adicionar `.limit(10000)` nas 3 queries sem limite |
| `src/pages/Radar360.tsx` | Adicionar `.limit(10000)` nas queries de proposições e headlines |
| `src/components/radar/ProposicoesPanel.tsx` | Adicionar `.limit(10000)` nas queries de proposições e headlines |
| `src/pages/AdminMonitor.tsx` | Aumentar `.limit(200)` → `.limit(10000)` em alterações |
| `src/hooks/useStudyStats.ts` | Aumentar `.limit(500)` → `.limit(10000)` em sessões |
| `src/pages/SimuladoAdmin.tsx` | Adicionar `.limit(10000)` nas queries de logs e questões |

