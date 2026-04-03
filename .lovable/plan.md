

## Plano: Biblioteca Admin com Todos os Livros + 3 Modos de Leitura

### Resumo

1. **BibliotecaAdmin** mostrará todos os livros das 4 bibliotecas (classicos, liderança, estudos, fora_da_toga — total ~767 livros), usando as capas já salvas no Supabase. Cada livro terá um botão para "formatar e-book" que dispara o pipeline existente de `processar-pdf` usando o `download` (Google Drive) do livro.

2. **LivroDetailSheet** (tela de detalhe ao clicar "Ler agora") oferecerá 3 modos de leitura em vez de um só botão.

### Parte 1 — BibliotecaAdmin mostra todos os livros

**Arquivo**: `src/pages/BibliotecaAdmin.tsx` (reescrever)

- Substituir o wrapper simples por uma página completa que:
  - Busca livros das 4 tabelas (`biblioteca_classicos`, `biblioteca_lideranca`, `biblioteca_estudos`, `biblioteca_fora_da_toga`)
  - Busca também `biblioteca_livros` (livros do usuário já processados) para saber quais já estão formatados
  - Exibe todos em lista única (ou agrupados por categoria), com a capa existente (`imagem`/`capa_livro`)
  - Cada livro mostra status: "Não formatado", "Processando...", ou "Pronto"
  - Botão para iniciar formatação: pega o `download` URL (Google Drive), envia para `processar-pdf` que faz OCR e cria o e-book no `biblioteca_livros`

**Fluxo de formatação em escala**:
```text
Livro (biblioteca_estudos) → botão "Formatar" → 
  download PDF do Drive → processar-pdf (OCR + IA) → 
  salva em biblioteca_livros → status "ready"
```

- A capa será a `capa_livro` / `imagem` já existente nas tabelas de origem (não precisa extrair de novo)

### Parte 2 — 3 Modos de Leitura no LivroDetailSheet

**Arquivo**: `src/components/biblioteca/LivroDetailSheet.tsx`

O botão "Ler agora" será substituído por 3 opções:

| Modo | Descrição | Implementação |
|------|-----------|---------------|
| **Empaginação** | Leitor atual FlipHTML5 (webview do link) | Abre `LeitorWebView` com o `link` do livro |
| **Na vertical** | Visualização direta do PDF em iframe | Abre `LeitorWebView` com o `download` URL convertido para visualização (`/preview`) |
| **Modo dinâmico** | E-book formatado (LeitorEbook) | Busca de `biblioteca_livros` pelo título/download, abre `LeitorEbook` |

- Se o livro ainda não foi formatado (não existe em `biblioteca_livros`), o botão "Modo dinâmico" mostrará "Formatar primeiro" e iniciará o processamento
- Os 3 botões ficam lado a lado (ou empilhados em mobile) com ícones distintos

**Arquivo**: `src/components/biblioteca/LivroDetailSheet.tsx`
- Adicionar prop `onReadMode: (livro, mode: 'fliphtml5' | 'vertical' | 'dinamico') => void`
- Renderizar 3 botões em vez de 1

**Arquivo**: `src/pages/Biblioteca.tsx`
- `handleRead` recebe o mode e age conforme:
  - `fliphtml5`: abre `LeitorWebView` com `livro.link`
  - `vertical`: abre `LeitorWebView` com URL do Drive em modo preview
  - `dinamico`: busca em `biblioteca_livros`, se existe abre `LeitorEbook`, senão inicia formatação

### Parte 3 — Conversão do URL do Drive para preview vertical

O Google Drive permite visualizar PDFs via:
```
https://drive.google.com/file/d/{FILE_ID}/preview
```
Isso será usado para o modo "Na vertical".

### Arquivos Alterados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/BibliotecaAdmin.tsx` | Reescrever: lista todos os livros das 4 bibliotecas com opção de formatar em e-book |
| `src/components/biblioteca/LivroDetailSheet.tsx` | 3 botões de modo de leitura em vez de 1 |
| `src/pages/Biblioteca.tsx` | `handleRead` suporta 3 modos; lógica de busca em `biblioteca_livros` para modo dinâmico |

