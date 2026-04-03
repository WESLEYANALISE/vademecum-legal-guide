

## Plano: Reorganizar Gamificação com Trilhas por Categoria (estilo Duolingo)

### Visão Geral

Substituir o fluxo atual (menu de jogo → lista plana de leis → artigos) por uma navegação organizada em **categorias com abas** e **trilhas visuais** estilo jogo de progressão (Duolingo path).

### Fluxo de Navegação

```text
┌─────────────────────────────────┐
│  Gamificação                    │
│  [Forca] [Caça-Palavras] [Cruz] │  ← menu de alternância (tabs)
├─────────────────────────────────┤
│  Categorias (tabs horizontais): │
│  [Constituição] [Códigos] [Est] │
│  [Leis Especiais] [Previdenc.]  │
├─────────────────────────────────┤
│  Trilha de Leis (snake path):   │
│     ⬤ Código Penal              │
│       ╲                         │
│         ⬤ Código Civil          │
│       ╱                         │
│     ⬤ CPC                      │
│       ╲                         │
│         ⬤ CPP                   │
└─────────────────────────────────┘
         │ clica numa lei
         ▼
┌─────────────────────────────────┐
│  Código Penal — Trilha Artigos  │
│     ⬤ Art. 1                   │
│       ╲                         │
│         ⬤ Art. 2               │
│  (mesmo ArtigoTrail atual)      │
│  → clica → gera jogo           │
└─────────────────────────────────┘
```

### Design Visual — Trilha de Leis

Reutilizar o padrão do `ArtigoTrail` existente (nós circulares com linhas SVG conectando em zigue-zague) para a lista de leis dentro de cada categoria. Cada nó mostra a **sigla** e o **nome** da lei. Não precisa de biblioteca externa — o `ArtigoTrail` já implementa o visual de trilha com animações.

### Implementação

**1. Refatorar `Gamificacao.tsx`**:
- Remover a `view === 'menu'` (seleção de jogo separada). O jogo é escolhido por **abas no topo** (Forca / Caça-Palavras / Cruzadas), sempre visível
- Adicionar segundo nível de abas para **categorias**: Constituição, Códigos, Estatutos, Leis Especiais, Previdenciário (usando `LEIS_CATALOG` agrupado por `tipo`)
- Na área principal, renderizar uma trilha de leis (estilo snake path) filtrada pela categoria ativa
- Ao clicar numa lei → abrir trilha de artigos (componente `ArtigoTrail` existente)

**2. Criar `LeiTrail.tsx`** (novo componente):
- Componente de trilha visual para leis, reutilizando a mesma lógica do `ArtigoTrail` (nós SVG em zigue-zague, animações framer-motion)
- Cada nó mostra: sigla da lei (dentro do círculo) + nome abaixo
- Recebe `leis: LeiCompacta[]` e `onSelect: (lei) => void`

**3. Fluxo de views simplificado**:
- `select-lei`: mostra tabs de jogo + tabs de categoria + trilha de leis
- `select-artigo`: mostra trilha de artigos (ArtigoTrail existente)
- `playing`: mostra o jogo

### Arquivo

| Arquivo | Mudança |
|---------|---------|
| `src/components/gamificacao/LeiTrail.tsx` | Novo — trilha visual de leis (snake path com nós) |
| `src/pages/Gamificacao.tsx` | Refatorar: tabs de jogo + tabs de categoria + trilha de leis como tela inicial |

