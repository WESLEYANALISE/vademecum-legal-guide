
## Plano: Pré-gerar todo conteúdo IA via Cron Jobs (carregamento instantâneo)

### Problema Atual
Quando o usuário clica num PL, a análise é gerada **on-demand** — chamando a edge function `assistente-juridica` no momento do clique. O cron `popular-radar-proposicoes` já gera headlines + análises, mas apenas **5 por execução** (a cada 3h). Com centenas de PLs, muitos ficam sem análise pré-gerada.

O mesmo acontece em outras áreas: explicações de artigos, mapas mentais, perguntas sugeridas — todos gerados sob demanda pelo `explicacaoWorker` (que roda manualmente no painel admin).

### Solução: Pipeline de pré-geração em background

#### 1. Aumentar o cap de geração no cron de proposições
**Arquivo:** `supabase/functions/popular-radar-proposicoes/index.ts`
- Aumentar o limite de `5` para `15` por execução incremental (linha 421)
- Adicionar um **segundo cron job dedicado** só para headlines/análises (`only_headlines: true`) que roda a cada 1h, processando 20 PLs por vez
- Resultado: ~480 PLs/dia processados automaticamente

#### 2. Criar edge function `popular-explicacoes` para pré-gerar explicações de artigos
**Novo arquivo:** `supabase/functions/popular-explicacoes/index.ts`
- Recebe parâmetro `tabela` (ex: `CF88_CONSTITUICAO_FEDERAL`)
- Busca artigos que **não têm** cache em `artigo_ai_cache` para os modos: `explicacao`, `exemplo`, `termos`, `sugerir_perguntas`
- Gera em lotes de 5 com delay de 2s, limitado a 10 artigos por execução
- Cron jobs escalonados para cada lei principal (CF88, CP, CC, CPC, CPP, CLT, CDC, CTN, ECA, CTB)

#### 3. Criar edge function `popular-explicacoes-resenha` para pré-gerar explicações das Leis do Dia
**Arquivo:** Já existe parcialmente em `popular-texto-resenha` — expandir para gerar explicação IA automaticamente junto com o texto completo (já faz isso, mas verificar se está no cron)

#### 4. Ajustar o frontend para exibir conteúdo cached instantaneamente
**Arquivo:** `src/components/radar/PLAnaliseSheet.tsx`
- Se a análise já existe no cache, mostrar imediatamente sem skeleton/spinner
- Só mostrar loading se realmente precisar gerar

#### 5. Novos cron jobs
**Migration SQL** — Adicionar:
- `popular-pl-headlines-1h`: a cada 1h, gera headlines + análises para 20 PLs pendentes
- `popular-explicacoes-cf88`: diário, pré-gera explicações da CF88
- `popular-explicacoes-codigos`: diário, pré-gera explicações dos códigos principais
- `popular-pl-backfill-authors`: a cada 6h, preenche autores faltantes

#### 6. Registrar tudo no Monitoramento
**Arquivo:** `supabase/functions/admin-monitor/index.ts`
- Adicionar as novas functions na lista de `edgeFunctions`

### Arquivos a Editar/Criar

| # | Arquivo | Mudança |
|---|---------|---------|
| 1 | `supabase/functions/popular-radar-proposicoes/index.ts` | Aumentar cap de 5→15 no incremental |
| 2 | `supabase/functions/popular-explicacoes/index.ts` | **Novo** — pré-gera explicação/exemplo/termos/perguntas por lei |
| 3 | `supabase/functions/admin-monitor/index.ts` | Registrar nova function |
| 4 | `src/components/radar/PLAnaliseSheet.tsx` | Exibir cache instantâneo sem skeleton desnecessário |
| 5 | Migration SQL | 3 novos cron jobs |

### Resultado Esperado
- PLs: análise e headline já prontas quando o usuário clicar — carregamento instantâneo
- Artigos de lei: explicações, exemplos e termos pré-gerados para as 10 leis mais acessadas
- Monitoramento: todas as functions listadas no painel admin
