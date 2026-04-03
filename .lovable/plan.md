

## Plano: Busca por Palavra-Chave com Tags no Catálogo

### Resumo
Renomear os dois modos de busca para **"Palavra-chave"** (busca por nome/tag da lei) e **"Nº do Artigo"** (busca por número/texto no banco). Adicionar um campo `tags` a cada lei no catálogo com palavras-chave populares que a pessoa usaria para encontrar aquela lei.

### Mudanças

**1. `src/data/leisCatalog.ts`** — Adicionar campo `tags: string[]` à interface e a cada entrada

Exemplos de tags:
- CF/88: `['constituição', 'carta magna', 'direitos fundamentais', 'CRFB']`
- CP: `['código penal', 'crime', 'pena', 'homicídio', 'furto', 'roubo']`
- CC: `['código civil', 'contrato', 'família', 'herança', 'propriedade', 'obrigações']`
- CLT: `['trabalhista', 'trabalho', 'emprego', 'férias', 'FGTS', 'demissão']`
- CDC: `['consumidor', 'defeito', 'propaganda enganosa', 'recall']`
- LD: `['drogas', 'tráfico', 'entorpecentes', 'lei antidrogas']`
- LMP: `['maria da penha', 'violência doméstica', 'mulher']`
- LGPD: `['dados pessoais', 'privacidade', 'proteção de dados']`
- ECA: `['criança', 'adolescente', 'menor', 'infância']`
- E assim por diante para todas as ~55 leis

**2. `src/components/vademecum/SearchOverlay.tsx`** — Ajustar modos e busca

- Renomear botões: "Buscar por Artigo" → **"Nº do Artigo"** | "Buscar por Lei" → **"Palavra-chave"**
- Modo padrão: `'lei'` (palavra-chave) em vez de `'artigo'`
- Incluir `tags` no fuzzy search: `keys: ['nome', 'sigla', 'descricao', 'tags']`
- Exibir as tags relevantes como badges abaixo do nome da lei nos resultados

**3. `src/hooks/useFuzzySearch.ts`** — Sem mudança necessária (Fuse.js já suporta arrays como keys)

### Detalhes Técnicos

O Fuse.js nativamente indexa arrays de strings — basta adicionar `'tags'` ao array de keys e ele fará match em qualquer elemento do array. Exemplo: pesquisar "tráfico" vai encontrar a Lei de Drogas porque `tags` contém `'tráfico'`.

O campo `tags` é adicionado à interface `LeiCatalogItem` como `tags?: string[]` para manter compatibilidade.

### Arquivos Editados

| Arquivo | Mudança |
|---------|---------|
| `src/data/leisCatalog.ts` | Adicionar `tags?: string[]` à interface + tags em todas as leis |
| `src/components/vademecum/SearchOverlay.tsx` | Renomear modos, incluir `tags` no fuzzy search, mostrar tags nos resultados |

