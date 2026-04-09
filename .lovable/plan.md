

## Diagnóstico: Por que só tem leis do dia 6

### Causa raiz

O cron **está rodando** a cada 3 horas, mas **todas as estratégias de fetch falham**:

1. **Fetch direto**: retorna apenas 6282 chars (shell HTML sem conteúdo — a página do Planalto é renderizada via JavaScript)
2. **Proxies CORS** (allorigins, corsproxy): retornam o mesmo shell vazio
3. **Browserless**: retorna erro 500 — `"Attempted to use detached Frame"` — bug do Browserless com a página do Planalto

O dia 6 entrou no banco porque nesse dia o scraper foi executado manualmente com sucesso (provavelmente via chamada direta quando o Browserless ainda funcionava). Desde então, nenhuma execução conseguiu buscar o conteúdo da página.

A página do Planalto (abril-resenha-diaria) **já tem dados dos dias 7, 8 e 9**, mas o scraper não consegue lê-los.

### Solução

Usar a **API do Google Cache/Webcache** ou, mais confiável, usar o **Browserless `/scrape` endpoint** (em vez do `/content`) que é mais estável. Mas a solução mais robusta: **usar fetch com o Google Translate como proxy** (técnica clássica para páginas JS-rendered) OU simplesmente usar a **API do Jina Reader** (`https://r.jina.ai/URL`) que renderiza JS e retorna texto limpo.

A abordagem mais simples e confiável: adicionar o **Jina Reader** como estratégia prioritária. É gratuito, renderiza JS, e retorna HTML limpo.

### Plano

| Arquivo | Ação |
|---------|------|
| `supabase/functions/scrape-resenha-diaria/index.ts` | Adicionar Jina Reader como estratégia 1.5 (após fetch direto, antes dos proxies CORS). URL: `https://r.jina.ai/{url}` com header `Accept: text/html`. Também corrigir Browserless para usar endpoint `/scrape` em vez de `/content` |

### Detalhes técnicos

**Nova estratégia Jina Reader** (inserir após o fetch direto):
```typescript
// Strategy 1.5: Jina Reader (renders JS)
try {
  const jinaUrl = `https://r.jina.ai/${url}`;
  const resp = await fetch(jinaUrl, {
    headers: { "Accept": "text/html", "X-Return-Format": "html" }
  });
  if (resp.ok) {
    const t = await resp.text();
    if (hasContent(t)) return t;
  }
} catch (e) { console.log(`Jina failed: ${e}`); }
```

**Corrigir Browserless**: mudar de `/content` para `/scrape` endpoint com seletores CSS específicos para a tabela de resenha, evitando o erro de "detached frame".

**Executar manualmente** após o deploy para trazer os dias 7, 8 e 9 imediatamente.

