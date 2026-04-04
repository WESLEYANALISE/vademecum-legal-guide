

## Plano: Corrigir Scraper da Resenha Diária

### Problema

O `fetchPage` no scraper aceita qualquer HTML > 200 chars como válido. O Planalto retorna ~6142 chars de navegação/menu mesmo sem o conteúdo real (que é carregado via JS). O parser então não encontra nenhum ato.

Além disso, não existe cron job configurado para rodar o scraper automaticamente.

### Solução

**1. Aumentar threshold de validação do HTML**

Mudar de 200 para **15.000 chars** no `fetchPage`. O HTML com conteúdo real tem 30-100K+ chars. Se o fetch direto retornar menos que isso, tentar Browserless (que renderiza JS).

**2. Forçar Browserless como fallback mais agressivo**

Quando o HTML direto for menor que 15K, não aceitar — ir direto para Browserless que renderiza o JavaScript e obtém o conteúdo completo.

**3. Adicionar cron job**

Configurar no `config.toml` para rodar o scraper 2x por dia (8h e 18h, horário de Brasília = 11:00 e 21:00 UTC).

### Arquivos a alterar

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/scrape-resenha-diaria/index.ts` | Aumentar threshold de 200 → 15000 no `fetchPage` |
| `supabase/config.toml` | Adicionar cron job para `scrape-resenha-diaria` 2x/dia |

### Resultado

Após a correção, o scraper vai detectar que o fetch direto retorna HTML incompleto, usar Browserless para obter o conteúdo real, e parsear as leis de abril corretamente. O cron garante execução automática.

