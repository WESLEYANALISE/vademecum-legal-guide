

## Plano: Corrigir Busca de Capa da Amazon + Modelo Gemini Deprecado

### Problemas Encontrados

1. **Modelo `gemini-2.0-flash` deprecado**: A função `cleanChapterMarkdown` (linha 581) ainda usa `gemini-2.0-flash`, que retorna erro 404. Todas as limpezas de markdown falham silenciosamente e o livro fica com texto OCR bruto.

2. **Código quebrado**: A função `cleanChapterMarkdown` está com a estrutura quebrada — o bloco `resumeCleaning` foi inserido no meio dela (entre linhas 600-702), partindo o corpo da função em dois pedaços desconectados.

3. **Amazon bloqueia scraping**: O fetch direto para `amazon.com.br` de uma Edge Function retorna CAPTCHA/página de bloqueio, impossibilitando extrair a imagem de capa.

### Solução

#### 1. Corrigir modelo Gemini
- Trocar `gemini-2.0-flash` por `gemini-2.5-flash` na função `cleanChapterMarkdown`

#### 2. Corrigir estrutura do código
- Reorganizar o arquivo para que `cleanChapterMarkdown` tenha seu corpo completo e fechado corretamente, seguido de `resumeCleaning` como função separada

#### 3. Buscar capa via Google Books API (gratuita, sem bloqueio)
- Substituir o scraping da Amazon pela **Google Books API** que é gratuita, sem autenticação, e retorna capas em alta resolução
- Endpoint: `https://www.googleapis.com/books/v1/volumes?q={titulo}+inauthor:{autor}&langRestrict=pt&maxResults=1`
- Extrair `volumeInfo.imageLinks.thumbnail` e trocar `zoom=1` por `zoom=2` para resolução maior
- Baixar a imagem e salvar no bucket `biblioteca` como antes

### Alterações

| # | Arquivo | Mudança |
|---|---------|---------|
| 1 | `supabase/functions/processar-pdf/index.ts` | Corrigir estrutura quebrada do código; trocar modelo para `gemini-2.5-flash` em `cleanChapterMarkdown`; substituir scraping Amazon por Google Books API em `fetchAmazonCover` |

### Detalhes Técnicos

**Google Books API (sem chave necessária):**
```text
GET https://www.googleapis.com/books/v1/volumes?q=O+Caso+dos+Exploradores+de+Cavernas&langRestrict=pt&maxResults=1

Resposta → items[0].volumeInfo.imageLinks.thumbnail
→ URL da capa em ~128px
→ Trocar "zoom=1" por "zoom=2" para ~256px
→ Download → upload bucket → capa_url
```

**Estrutura corrigida:**
```text
cleanChapterMarkdown() { ... return completo }
resumeCleaning() { ... }
buildFallbackStructure() { ... }
fetchAmazonCover() → renomear para fetchBookCover() usando Google Books
downloadAndUploadCover() { ... }
```

