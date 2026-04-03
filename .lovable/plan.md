

## Plano: Biblioteca de Leitura

### Visão Geral

Nova página `/biblioteca` acessível via Ferramentas, exibindo livros organizados por categoria em carrosséis horizontais. Cada livro abre um leitor FlipHTML5 embutido (iframe/webview) dentro do app.

### Dados Disponíveis

| Tabela | Qtd | Nome da seção | Campos-chave |
|--------|-----|---------------|-------------|
| `biblioteca_classicos` | 29 | Clássicos | livro, autor, imagem, download, link |
| `biblioteca_estudos` | 490 | Estudos | tema (=livro), area, capa_livro, download, link |
| `biblioteca_fora_da_toga` | 285 | Fora da Toga | livro, autor, capa_livro, download, link |
| `biblioteca_lideranca` | 10 | Liderança | livro, autor, imagem, download, link |

Os links de leitura (`link`) são URLs FlipHTML5 (ex: `https://online.fliphtml5.com/zmzll/axkb/`). Os links de download são Google Drive.

### Fluxo

```text
Ferramentas → Biblioteca
  ┌─────────────────────────────────────┐
  │  🔙  Biblioteca de Leitura          │
  ├─────────────────────────────────────┤
  │  ── Clássicos ──────────────────▶   │
  │  [capa] [capa] [capa] ...           │
  │                                     │
  │  ── Liderança ──────────────────▶   │
  │  [capa] [capa] [capa] ...           │
  │                                     │
  │  ── Estudos (por área) ─────────▶   │
  │  [capa] [capa] [capa] ...           │
  │                                     │
  │  ── Fora da Toga ───────────────▶   │
  │  [capa] [capa] [capa] ...           │
  └─────────────────────────────────────┘

Ao clicar num livro → Sheet/overlay com:
  - Capa grande, título, autor, sinopse
  - Botão "Ler agora" → abre leitor iframe
  - Botão "Download" → abre link Drive
```

### Componentes

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/Biblioteca.tsx` | Página principal com carrosséis por categoria. Usa `DesktopPageLayout`. Busca dados das 4 tabelas no Supabase. |
| `src/components/biblioteca/LivroCard.tsx` | Card de capa do livro (imagem, título, autor) para o carrossel |
| `src/components/biblioteca/LivroDetailSheet.tsx` | Sheet com detalhes do livro + botões Ler/Download |
| `src/components/biblioteca/LeitorWebView.tsx` | Overlay fullscreen com iframe apontando para o `link` FlipHTML5. Botão fechar no topo. Responsivo (100vw × 100vh). |

### Detalhes Técnicos

- **Carrossel**: Scroll horizontal nativo com `overflow-x-auto snap-x` (leve, sem dependência extra). Cards com `snap-start`.
- **Leitor embutido**: `<iframe src={link} className="w-full h-full" allowFullScreen />` dentro de um overlay fullscreen (`fixed inset-0 z-50`). FlipHTML5 já é responsivo nativamente.
- **Estudos**: Agrupados por `area` (20 áreas). Cada área vira uma seção de carrossel.
- **Imagem de capa**: Usa `imagem` (classicos/lideranca) ou `capa_livro` (estudos/fora_da_toga) com fallback para placeholder.
- **Normalização**: Uma interface `LivroUnificado` para unificar os schemas diferentes das 4 tabelas.

### Alterações em Arquivos Existentes

- **`src/pages/Ferramentas.tsx`**: Adicionar item "Biblioteca" no array `TOOLS` com `navigate('/biblioteca')`
- **`src/App.tsx`**: Adicionar rota lazy `/biblioteca`

### Sem alterações no banco de dados

As tabelas já existem com RLS pública de leitura. Nenhuma migration necessária.

