

## Plano: Cache Universal de Imagens — Todas as Capas e Imagens do App

### Situação Atual

O Service Worker (`sw-cache.js`) só cacheia URLs de `supabase.co/storage` e `wsrv.nl`. Há 3 problemas restantes:

1. **`LivroDetailSheet.tsx`** ainda usa `cdnImg()` (proxy desnecessário) em vez de `directImg()`
2. **`DesktopNewsSidebar.tsx`** e **`DesktopNewsCarousel.tsx`** usam `cdnImg()` — passam pelo proxy wsrv.nl mesmo para URLs Supabase
3. **Imagens locais** (áreas de Direito, capas de categorias) — são assets estáticos do Vite, já cacheados pelo navegador, mas o SW não os guarda no Cache API para acesso offline/instantâneo
4. **Fotos de deputados** (`autor_foto` no Radar) — URLs externas sem cache

### O que muda

| Arquivo | Mudança |
|---------|---------|
| `public/sw-cache.js` | Expandir para cachear TODAS as imagens (qualquer request com content-type image/* ou extensão .jpg/.png/.webp/.svg) |
| `src/components/biblioteca/LivroDetailSheet.tsx` | Trocar `cdnImg` por `directImg` |
| `src/components/vademecum/DesktopNewsSidebar.tsx` | Trocar `cdnImg` por `directImg` |
| `src/components/vademecum/DesktopNewsCarousel.tsx` | Trocar `cdnImg` por `directImg` |

### Service Worker v3 — Cache universal de imagens

Em vez de filtrar por domínio, o SW passa a cachear qualquer requisição de imagem:

```text
Estratégia: Cache-First para QUALQUER URL que:
  - Contenha extensão .jpg/.jpeg/.png/.webp/.svg/.gif/.avif
  - OU seja de supabase.co/storage
  - OU seja de wsrv.nl
  
Exceções: NÃO cachear requests do próprio app (HTML, JS, CSS)
```

Isso cobre automaticamente: capas de livros, áreas de Direito, fotos de deputados, notícias, brasão, logo — tudo.

### Substituição cdnImg → directImg

`cdnImg` e `directImg` fazem exatamente a mesma coisa no código atual. A diferença é semântica, mas o importante é que para URLs do Supabase, ambas retornam a URL direta sem proxy. Os 3 arquivos que ainda usam `cdnImg` serão atualizados para `directImg` por consistência.

