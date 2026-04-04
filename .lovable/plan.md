

## Plano: Capítulos na Formatação + Capas Instantâneas

### Problema 1: Livros formatados sem capítulos

Alguns livros (ex: "Direito financeiro" 52pg, "Preâmbulo constitucional" 25pg) terminam com apenas 1 capítulo genérico "Conteúdo" — o fallback, ou seja, o Gemini não conseguiu identificar capítulos.

**Causa raiz**: Para livros >60 páginas, o prompt envia apenas 500 caracteres por página (exceto as 15 primeiras). Mas mesmo livros menores podem falhar se o Gemini retornar JSON inválido ou `chapters: []`.

**Correção** em `supabase/functions/processar-pdf/index.ts`:

1. Aumentar o contexto do sumário: para livros grandes, enviar as **primeiras 25 páginas completas** (em vez de 15), pois muitos sumários vão até a página 20+
2. Para páginas após as 25, enviar os **primeiros 800 caracteres** (em vez de 500) — o título do capítulo geralmente aparece no topo da página
3. Adicionar retry: se o Gemini retornar apenas 1 capítulo para um livro com >15 páginas, tentar novamente com mais contexto (todas as páginas completas, limitado a ~100k tokens)
4. No prompt, enfatizar que o sumário/índice é a fonte principal e que DEVE haver múltiplos capítulos se o sumário listar múltiplos

### Problema 2: Capas demorando a carregar

**Causa raiz**: O `LivroCard` usa `cdnImg()` que redireciona TODAS as imagens pelo proxy `wsrv.nl`. Isso adiciona uma viagem extra desnecessária para capas que já estão no Supabase Storage (URL direta, CDN do Supabase).

**Correção** em `src/lib/cdnImg.ts` e `src/components/biblioteca/LivroCard.tsx`:

1. Criar uma função `directImg()` que detecta URLs do Supabase Storage e as usa diretamente, sem proxy
2. URLs do Supabase (`akaeinqkhdwzopfsckgg.supabase.co/storage`) já são públicas e rápidas — não precisam do wsrv.nl
3. Apenas URLs externas (outros domínios) continuam usando o proxy
4. Remover `loading="lazy"` dos cards visíveis na viewport inicial (primeiros 8-10 livros)
5. Adicionar `fetchpriority="high"` e `decoding="async"` nas imagens dos cards

### Detalhes Técnicos

**Lógica de detecção para pular proxy:**
```text
Se URL contém "supabase.co/storage" → usar URL direta
Senão → usar wsrv.nl como hoje
```

**Retry de estruturação com mais contexto:**
```text
1ª tentativa: primeiras 25 páginas completas + resto truncado a 800 chars
Se resultado = 1 capítulo e totalPages > 15:
  2ª tentativa: todas as páginas completas (até limite de tokens)
Se ainda 1 capítulo: aceitar fallback
```

### Arquivos a Alterar

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/processar-pdf/index.ts` | `structureWithGemini`: mais contexto inicial, retry se 1 capítulo |
| `src/lib/cdnImg.ts` | Nova função `directImg()` que pula proxy para URLs Supabase |
| `src/components/biblioteca/LivroCard.tsx` | Usar `directImg()` em vez de `cdnImg()`, otimizar atributos da tag `<img>` |
| `src/pages/BibliotecaAdmin.tsx` | Usar `directImg()` nos thumbnails |

