

## Plano: Corrigir Detecção de Capítulos em Livros Grandes

### Diagnóstico

O problema está na função `structureWithGemini` no `processar-pdf/index.ts`. Para livros com mais de 60 páginas, ela envia apenas os **primeiros 200 caracteres** de cada página ao Gemini para identificar capítulos. Isso é insuficiente para:

1. **Páginas de Sumário** — o sumário de "Por que as Nações Fracassam" lista 15+ capítulos, o que facilmente ultrapassa 200 caracteres. O Gemini não consegue ver a lista completa.
2. **Páginas de início de capítulo** — o título do capítulo pode não estar nos primeiros 200 caracteres se houver cabeçalhos ou epígrafes antes.

Resultado: Gemini falha em identificar capítulos e o sistema cai no `buildFallbackStructure`, que cria um único capítulo genérico chamado "Conteúdo".

### Solução

Usar uma estratégia inteligente de envio:

1. **Páginas iniciais (1–15)**: enviar conteúdo completo (é onde fica o sumário)
2. **Demais páginas**: enviar os primeiros **500 caracteres** (captura títulos de capítulo que aparecem no topo da página)
3. **Aumentar `maxOutputTokens`** de 8192 para 16384 (livros com muitos capítulos/seções precisam de mais espaço no JSON de resposta)

Também adicionar uma action `restructure` para reprocessar a estrutura de livros já processados sem precisar refazer o OCR.

### Mudanças

**Arquivo: `supabase/functions/processar-pdf/index.ts`**

1. Alterar o bloco `isLargeBook` para enviar conteúdo completo das primeiras 15 páginas e 500 chars das demais
2. Aumentar `maxOutputTokens` para 16384
3. Adicionar action `restructure` no handler de JSON — recebe `livro_id`, busca o conteúdo existente do banco e roda apenas o `structureWithGemini` novamente, sem refazer OCR

### Detalhes Técnicos

```text
// Estratégia de envio para livros grandes:
if (isLargeBook) {
  pagesPayload = conteudo.map(p => {
    const isInitial = p.pagina <= 15;
    const text = isInitial ? p.markdown : p.markdown.slice(0, 500);
    return `--- Página ${p.pagina} ---\n${text}`;
  }).join("\n\n");
}
```

A action `restructure` permite corrigir livros já processados (como "Por que as Nações Fracassam") sem precisar reenviar o PDF:
```text
POST { action: "restructure", livro_id: "..." }
→ busca conteudo do banco
→ roda structureWithGemini com a nova lógica
→ atualiza estrutura_leitura
```

No frontend (`BibliotecaView.tsx`), adicionar um botão no card do livro para "Reindexar capítulos" que chama essa action.

### Arquivos Editados

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/processar-pdf/index.ts` | Estratégia de envio melhorada + action `restructure` + maxOutputTokens 16384 |
| `src/components/estudar/BibliotecaView.tsx` | Botão "Reindexar" no card do livro |

