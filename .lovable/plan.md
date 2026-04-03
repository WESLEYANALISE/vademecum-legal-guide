

## Plano: Corrigir Imagens de Notícias e Garantir Frescor do Cache

### Problema Identificado

1. **Imagem errada no banner**: O scraper da Câmara associa imagens por índice posicional na listagem (regex `g-chamada__imagem`), mas às vezes os índices desalinham — a imagem `relatorios-de-participacao-popular` não tem nada a ver com a notícia sobre creches rurais. O código prioriza a imagem da lista sobre a `og:image` do artigo (linha 268: `item.imagemUrl || parseCamaraArticleImage()`).

2. **Bug no cache**: `lastFetchTime` nunca é atualizado após o fetch (permanece 0), causando refetches desnecessários a cada navegação.

### Correções

**Arquivo: `supabase/functions/scrape-noticias/index.ts`**
- Inverter prioridade de imagem: usar `og:image` do artigo como fonte primária, fallback para imagem da lista
- Isso garante que a imagem do banner corresponda à notícia real

```text
Antes:  const imagemUrl = item.imagemUrl || parseCamaraArticleImage(articleHtml)
Depois: const imagemUrl = parseCamaraArticleImage(articleHtml) || item.imagemUrl
```

**Arquivo: `src/services/noticiasService.ts`**
- Setar `lastFetchTime = Date.now()` após fetch bem-sucedido
- Garantir que o cache é funcional (5 min) sem refetches desnecessários

### Impacto

- As próximas execuções do cron (a cada 10 min) já vão gravar as imagens corretas via `og:image`
- O banner sempre mostrará a notícia mais recente com a imagem correta do artigo

