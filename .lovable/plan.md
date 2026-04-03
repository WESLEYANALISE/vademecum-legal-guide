

## Plano: Extrair Capas dos PDFs do Google Drive

### Situação Atual
- **45 livros** sem `capa_livro` no banco (de 490 total)
- Todos têm link `download` do Google Drive (ex: `https://drive.google.com/file/d/1hko_t1lM4oa5IuvfeaBY2VYTmdKVa5tE/view`)
- A Edge Function atual tenta extrair do FlipHTML5, mas não funciona para todos

### Solução

Reescrever a Edge Function `extrair-capa-fliphtml5` para extrair a **primeira página do PDF** via Google Drive como imagem de capa.

#### Fluxo técnico:

1. Buscar os 45 livros sem `capa_livro`
2. Para cada um, converter o link do Drive para URL de download direto: `https://drive.google.com/uc?export=download&id={FILE_ID}`
3. Baixar o PDF
4. Usar a API do **Browserless** (já temos a key `BROWSERLESS_API_KEY`) para renderizar a primeira página do PDF como screenshot — OU usar uma abordagem mais simples: converter o link do Drive para preview de thumbnail via `https://drive.google.com/thumbnail?id={FILE_ID}&sz=w800`
5. Fazer upload da imagem para o bucket `biblioteca` no Storage
6. Atualizar `capa_livro` na tabela

#### Abordagem escolhida: Google Drive Thumbnail API

O Google Drive gera thumbnails automaticamente para PDFs. A URL é:
```
https://drive.google.com/thumbnail?id={FILE_ID}&sz=w800
```

Isso retorna uma imagem PNG da primeira página sem precisar baixar o PDF inteiro — é instantâneo e leve.

### Alterações

| Arquivo | O que muda |
|---------|-----------|
| `supabase/functions/extrair-capa-fliphtml5/index.ts` | Reescrever: extrair `FILE_ID` do link do Drive → buscar thumbnail → upload no Storage → atualizar `capa_livro` |

### Lógica de extração do FILE_ID

```typescript
// "https://drive.google.com/file/d/1hko_t1lM4oa5IuvfeaBY2VYTmdKVa5tE/view?usp=drivesdk"
const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
const fileId = match?.[1]; // "1hko_t1lM4oa5IuvfeaBY2VYTmdKVa5tE"
```

### Fallback

Se o thumbnail do Drive falhar (403/404), tenta o método FlipHTML5 atual como fallback (`{fliphtml5_url}/files/large/1.jpg`).

### Frontend

Nenhuma alteração necessária — o `capa_livro` já é usado no `renderAreaDetail()`. Após rodar a function, os 45 livros terão capa.

