

## Plano: Capa da Amazon + Limpeza de Páginas Desnecessárias com IA

### Problema Atual
1. A capa do livro usa a primeira imagem extraída pelo OCR (geralmente ruim ou inexistente)
2. O conteúdo inclui páginas desnecessárias: biografia do autor, copyright, avisos de pirataria, folha de rosto — o leitor deveria começar direto no conteúdo principal (após o sumário)

### Solução

#### 1. Buscar capa na Amazon via Gemini
- Após o OCR, usar o título do livro + autor (extraído pelo Gemini na fase de structuring) para montar uma query de busca
- Chamar a API do Google Custom Search (ou scraping simples da Amazon) para encontrar a capa
- **Abordagem escolhida**: Usar Gemini para extrair título e autor exatos do conteúdo OCR, depois buscar na Amazon via fetch com User-Agent de navegador, parseando o HTML para encontrar a imagem de capa do produto mais relevante
- Baixar a imagem, fazer upload no bucket `biblioteca` e salvar como `capa_url`

#### 2. Limpeza de "lixo" com Gemini
- Na fase de structuring (quando Gemini já analisa o conteúdo), adicionar ao prompt instruções para marcar quais páginas são "descartáveis" (copyright, pirataria, biografia, folha de rosto, páginas em branco)
- O JSON retornado pelo Gemini incluirá um campo `content_start_page` indicando onde começa o conteúdo principal
- As páginas antes de `content_start_page` serão agrupadas no capítulo "Páginas Iniciais" mas o leitor começará automaticamente no primeiro capítulo real
- Páginas marcadas como descartáveis terão seu markdown esvaziado (removidas do fluxo de leitura)

### Alterações por Arquivo

| # | Arquivo | Mudança |
|---|---------|---------|
| 1 | `supabase/functions/processar-pdf/index.ts` | Adicionar `fetchAmazonCover()` após OCR; modificar prompt do Gemini structuring para marcar `skip_pages` e `content_start_page`; filtrar páginas descartáveis |
| 2 | `src/components/estudar/LeitorEbook.tsx` | Começar na página do `content_start_page` (não na página 0) quando for primeira leitura |
| 3 | `src/components/estudar/BibliotecaView.tsx` | Nenhuma mudança necessária (já exibe `capa_url`) |

### Detalhes Técnicos

**Busca de capa na Amazon:**
```
1. Gemini extrai título + autor do conteúdo OCR
2. Fetch para: https://www.amazon.com.br/s?k={titulo}+{autor}&i=stripbooks
3. Parsear HTML para encontrar a primeira imagem de produto (.s-image)
4. Download da imagem → upload no bucket biblioteca → salvar capa_url
5. Fallback: manter capa da primeira página OCR se Amazon falhar
```

**Prompt de structuring atualizado:**
- Adiciona campo `skip_pages: number[]` — páginas de copyright, pirataria, biografia desnecessária
- Adiciona campo `content_start_page: number` — onde começa o conteúdo real (após sumário)
- O capítulo "Páginas Iniciais" continua existindo mas o leitor pula automaticamente

**Leitor:**
- Quando `ultima_pagina === 0` (primeira leitura), posicionar no índice correspondente ao `content_start_page` da `estrutura_leitura`

