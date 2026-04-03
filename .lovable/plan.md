

## Plano: Extrair Ilustração PNG Embutida dos PDFs (não apenas thumbnail)

### Problema

A função atual pega o **thumbnail do Google Drive** — que é uma foto da página inteira do PDF (com texto, margens, etc.). O que você quer é a **ilustração/PNG** que está embutida dentro da capa do PDF, isolada, sem o texto ao redor.

### Abordagem Técnica

PDFs armazenam imagens como objetos XObject do tipo Image dentro do stream binário. Para extraí-las, precisamos **baixar o PDF e parsear os objetos de imagem** embutidos.

**A melhor ferramenta para isso: `pdfimages` (poppler-utils)** — extrai todas as imagens embutidas de um PDF como arquivos separados.

#### Por que não dá para fazer na Edge Function?

Edge Functions rodam em Deno e não têm acesso a `pdfimages` nem a bibliotecas nativas de parsing de PDF binário. A extração de imagens embutidas exige parsing de baixo nível do formato PDF.

#### Solução: Script batch no sandbox + upload via API

1. **Script Python** que roda no sandbox:
   - Baixa cada PDF do Google Drive (via URL de download direto)
   - Usa `pdfimages` para extrair imagens embutidas da primeira página
   - Seleciona a **maior imagem** (que é a ilustração da capa)
   - Faz upload para o bucket `biblioteca` no Supabase Storage
   - Atualiza `capa_livro` na tabela

2. **Edge Function atualizada** para reprocessar livros específicos sob demanda (usando o mesmo método Drive thumbnail como fallback se o PDF não for acessível)

### Fluxo do Script

```text
Para cada livro com capa_livro LIKE '%capas-estudos%' (45 livros):
  1. Extrair FILE_ID do link download
  2. Baixar PDF: https://drive.google.com/uc?export=download&id={FILE_ID}
  3. Salvar em /tmp/livro_{id}.pdf
  4. Executar: pdfimages -f 1 -l 1 -png livro_{id}.pdf /tmp/img_{id}
  5. Pegar a maior imagem extraída (por tamanho de arquivo)
  6. Upload para Supabase Storage: capas-estudos/{id}.png
  7. UPDATE biblioteca_estudos SET capa_livro = URL WHERE id = {id}
```

### Alterações

| Arquivo/Ação | O que muda |
|-------------|-----------|
| Script Python (batch, rodado uma vez) | Baixa PDFs do Drive → `pdfimages` → upload → atualiza banco |
| `supabase/functions/extrair-capa-fliphtml5/index.ts` | Adicionar filtro para reprocessar os 45 livros que têm capas de thumbnail (não apenas `IS NULL`) |

### Sobre os 445 livros restantes

Os 445 livros que já têm capa do projeto original (`izspjvegxdfgkgibpyst.supabase.co`) — essas capas já são as ilustrações PNG corretas? Ou também precisam ser reprocessadas?

Se sim, o mesmo script pode processar todos os 490.

### Limitação possível

Alguns PDFs do Google Drive podem exigir confirmação de download (arquivos grandes). O script tratará isso automaticamente com o parâmetro `confirm=t` na URL.

