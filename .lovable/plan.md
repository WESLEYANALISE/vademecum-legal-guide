

## Diagnóstico: Só veio a ementa

O pipeline tem **duas etapas**:
1. `scrape-resenha-diaria` — raspa a página do Planalto e insere os registros com **ementa, URL e data** apenas
2. `popular-texto-resenha` — pega cada registro sem `texto_completo`, acessa a URL da lei, extrai o texto integral e gera a explicação via Gemini

**O problema**: só a etapa 1 está no cron. A etapa 2 (`popular-texto-resenha`) nunca é chamada automaticamente. As 4 leis do dia 6 estão no banco mas com `texto_completo = NULL` e `explicacao = NULL`.

## Plano

### 1. Encadear as duas etapas no cron

Modificar `scrape-resenha-diaria` para, ao final do scraping bem-sucedido, chamar automaticamente `popular-texto-resenha` via fetch interno (self-call para a edge function). Assim, toda vez que o cron roda e encontra novos atos, o texto completo e explicação são gerados na sequência.

### 2. Adicionar cron dedicado para `popular-texto-resenha`

Como backup, criar um segundo cron job que roda 30 minutos após cada execução do scraper, garantindo que registros pendentes sejam processados mesmo se o encadeamento falhar.

Schedule: `30 7,10,13,16,19,22 * * *` (30 min após cada scrape)

### 3. Executar `popular-texto-resenha` agora

Chamar manualmente para preencher texto_completo e explicação das 4 leis do dia 6 que já estão no banco.

### Arquivos

| Arquivo | Ação |
|---------|------|
| `supabase/functions/scrape-resenha-diaria/index.ts` | Adicionar chamada a `popular-texto-resenha` ao final |
| SQL (via insert) | Criar cron job para `popular-texto-resenha` a cada 3h (offset 30min) |
| Manual | Executar `popular-texto-resenha` agora via curl |

