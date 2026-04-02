

## Plano: Corrigir Capas Lentas, Capas no Hero e Conteúdo Vazio

### Diagnóstico

**Problema 1 — Capas lentas**: A Edge Function `otimizar-imagem` tenta TinyPNG que retorna 401 (API key inválida), depois faz fallback para `wsrv.nl` via redirect 302. Esse fluxo Edge Function → TinyPNG fail → redirect adiciona latência desnecessária a cada imagem.

**Problema 2 — Capas não aparecem no Hero**: Consequência do problema 1. As imagens passam pelo proxy `cdnImg()` que é lento demais; o carrossel renderiza mas as imagens demoram a carregar ou falham.

**Problema 3 — Conteúdo vazio**: A Browserless API key está inválida (401). O scraper lista os artigos do Migalhas via fetch direto (funciona), mas ao buscar o conteúdo individual de cada artigo via Browserless, falha. Resultado: `conteudo` = vazio em **todas** as 10 notícias recentes.

### Solução

**1. Imagens — Eliminar proxy para notícias (carregamento instantâneo)**

Em `HeroCarousel.tsx` e `Noticias.tsx`, usar a URL original da imagem diretamente em vez de `cdnImg()`. As imagens do Migalhas já são otimizadas pelo CDN deles. Opcionalmente, usar `wsrv.nl` diretamente (sem Edge Function intermediária) para resize/webp.

Criar helper `newsImg()` em `cdnImg.ts`:
```text
export const newsImg = (url: string, w = 640) =>
  `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${w}&q=80&output=webp`;
```

Trocar `cdnImg()` por `newsImg()` apenas nos componentes de notícias (HeroCarousel e Noticias).

**2. Conteúdo Migalhas — Extrair sem Browserless**

O Migalhas é um SPA Angular mas o conteúdo dos artigos também está embutido como JSON no HTML (mesmo padrão da lista). Alterar `scrapeMigalhas` para:
- Fazer `fetch()` direto em cada artigo (sem Browserless)
- Extrair o JSON embutido no `<script>` tag (padrão `LEITURA` com `&q;`)
- Fallback: extrair `og:description` do HTML estático

Isso elimina a dependência do Browserless para o Migalhas completamente.

### Arquivos Editados

| Arquivo | Mudança |
|---------|---------|
| `src/lib/cdnImg.ts` | Adicionar `newsImg()` que vai direto ao wsrv.nl |
| `src/components/vademecum/HeroCarousel.tsx` | Trocar `cdnImg` por `newsImg` |
| `src/pages/Noticias.tsx` | Trocar `cdnImg` por `newsImg` |
| `supabase/functions/scrape-noticias/index.ts` | Migalhas: fetch direto em vez de Browserless para conteúdo dos artigos |

