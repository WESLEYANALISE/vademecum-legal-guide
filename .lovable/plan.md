

## Plano: Buscar Capa para Livros Já Processados

### Situação Atual
- O código de busca de capa via Google Books API já existe e funciona (testei: a API retorna a capa corretamente para "O Caso dos Exploradores de Cavernas")
- O problema: a busca falhou silenciosamente durante o processamento original (provavelmente o título OCR com "11." no início confundiu o Gemini, ou timeout)
- O livro está com `capa_url: null` e `status: ready`

### Solução: Duas Mudanças

**1. Nova action `fetch_cover` na Edge Function `processar-pdf`**

Adicionar um handler para `body.action === "fetch_cover"` que:
- Busca o livro pelo ID
- Usa o `titulo` já limpo do banco (sem precisar de Gemini)
- Pesquisa direto na Google Books API com o título
- Baixa a capa e salva no Storage
- Atualiza `capa_url` no banco

Isso é mais simples e robusto que re-executar o Gemini, pois o título já está limpo no banco.

**2. Botão "Buscar capa" na BibliotecaView**

Para livros com `capa_url === null`, mostrar um ícone/botão clicável no lugar do ícone genérico de livro. Ao clicar:
- Chama `processar-pdf` com `{ action: "fetch_cover", livro_id: ... }`
- Mostra loading
- Atualiza a lista ao concluir

### Detalhes Técnicos

**Edge Function** — novo bloco no handler JSON:
```text
if (body.action === "fetch_cover") {
  // Busca titulo do banco
  // Limpa prefixos numéricos ("11. " → "")
  // Separa titulo e autor pelo " -- "
  // Google Books API direto (sem Gemini)
  // downloadAndUploadCover() (já existe)
  // UPDATE capa_url
}
```

**Frontend** — no card do livro, quando `!livro.capa_url`:
- Ícone de câmera/imagem clicável
- Ao clicar → fetch → refetch lista

**Também**: corrigir o `fetchBookCover` original para limpar prefixos numéricos do título antes de buscar (previne falhas futuras).

