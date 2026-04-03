

## Plano: Lista na Área de Estudos + Extração de Capas dos PDFs

### Problema Atual

1. Quando o usuário clica em uma área (ex: "Direito Administrativo"), os livros aparecem em **grid 3 colunas** — o pedido é que seja em **lista** (mesmo padrão das categorias e áreas).
2. **45 de 490 livros** não têm `capa_livro` no banco. Os links apontam para FlipHTML5 (ex: `https://online.fliphtml5.com/zmzll/rjbr/`), que armazena thumbnails de páginas em URLs previsíveis.

### Solução

#### 1. Área Detail em Lista

Trocar o `grid grid-cols-3` do `renderAreaDetail()` por uma lista vertical com capa à esquerda (mesmo layout das áreas/categorias):

```
[Capa 60px] | Título do livro
            | Sobre (1 linha)       [>]
```

Com shimmer animation no hover, igual aos outros itens de lista.

**Arquivo**: `src/pages/Biblioteca.tsx` — função `renderAreaDetail()`

#### 2. Edge Function para Extrair Capas

Nova Edge Function `extrair-capa-fliphtml5`:
- Recebe o `id` do livro e a URL do FlipHTML5
- Constrói a URL do thumbnail: `{fliphtml5_url}/files/large/1.jpg`
- Baixa a imagem e faz upload para o bucket `CAPAS` no Supabase Storage (caminho: `biblioteca-estudos/{id}-{timestamp}.webp`)
- Atualiza `capa_livro` na tabela `biblioteca_estudos`

Pode processar em batch (todos os 45 sem capa de uma vez).

#### 3. Fallback no Frontend

Para livros sem capa ainda não processada, usar o proxy wsrv.nl para tentar construir a URL do thumbnail FlipHTML5 diretamente no frontend:

```typescript
const getCapaUrl = (livro: LivroUnificado) => {
  if (livro.capa) return cdnImg(livro.capa, 300);
  if (livro.link?.includes('fliphtml5.com')) {
    const base = livro.link.replace(/\/$/, '');
    return `${base}/files/large/1.jpg`;
  }
  return '';
};
```

### Alterações por Arquivo

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/Biblioteca.tsx` | `renderAreaDetail()` → layout lista vertical com capa, título, sinopse e chevron |
| `src/components/biblioteca/LivroCard.tsx` | Sem alteração (usado apenas em grid de outras categorias) |
| `supabase/functions/extrair-capa-fliphtml5/index.ts` | Nova Edge Function para batch-extrair capas e salvar no Storage |

### Fluxo

```text
Estudos → Direito Penal (lista) → [Livro em lista com capa]
                                      ↓ click
                                   LivroDetailSheet (slide)
```

A Edge Function roda uma vez para preencher as 45 capas faltantes. Depois, todos os livros terão `capa_livro` e o fallback FlipHTML5 serve como segurança.

