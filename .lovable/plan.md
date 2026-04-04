

## Plano: Garantir Extração e Preservação de Imagens no E-book

### Diagnóstico

O pipeline já extrai imagens corretamente durante o OCR (Mistral com `include_image_base64: true`), faz upload ao Storage e substitui as referências no markdown. O leitor também renderiza imagens via ReactMarkdown.

**Porém há dois riscos identificados:**

1. **Gemini pode remover imagens**: O prompt do `cleanEdgePages` instrui a IA a formatar o texto mas não menciona preservar imagens (`![...](url)`). O Gemini pode interpretar como artefato e remover.

2. **Imagens sem referência no markdown**: Caso o Mistral retorne uma imagem cujo `img.id` não aparece no markdown (ex: imagem embutida sem referência), ela é salva no Storage e na tabela `biblioteca_imagens` mas **não é inserida no markdown** — fica invisível no leitor.

### Solução

**1. Proteger imagens no prompt do Gemini** — Adicionar instrução explícita no prompt de limpeza:

```
PRESERVAR INTACTO (não alterar, não remover):
- Todas as referências a imagens: ![...](url)
- Tabelas
```

**2. Inserir imagens órfãs no markdown** — Quando uma imagem é extraída mas seu `img.id` não aparece no markdown da página, adicionar `![Imagem](url)` ao final do markdown daquela página.

### Arquivos a alterar

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/processar-pdf/index.ts` | (1) No prompt de `cleanEdgePages`, adicionar regra para preservar `![...](url)`. (2) No loop de extração de imagens (linha ~462), se `img.id` não existe no markdown, append a referência ao final da página. |

### Resultado

Todas as imagens extraídas pelo OCR serão visíveis no modo dinâmico — tanto as que já tinham referência no markdown quanto as que eram apenas embutidas no PDF sem referência textual.

