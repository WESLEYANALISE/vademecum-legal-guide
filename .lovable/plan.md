

## Plano: Redesign do fluxo "Questões" no Estudar

### Visão Geral

Quando o usuário clicar em "Questões" no menu do Estudar, em vez de ir direto para a lista de leis, será aberto um **dashboard de questões** com estatísticas, opções de ação (Praticar, Progresso, Reforço, Cadernos) e a Dra. Arabella com análise personalizada. Ao clicar em "Praticar", abre um **grid de disciplinas/categorias** agrupando as leis por tipo (Constitucional, Penal, Civil, etc.) com ícones e porcentagens de progresso.

### Fluxo de Navegação

```text
Menu Estudar
  └─ Questões → Dashboard de Questões (novo)
       ├─ Praticar → Grid de Categorias (novo)
       │    └─ Ex: "Penal" → Lista de leis penais (CP, CPP, CPM, etc.)
       │         └─ Seleciona lei → Lista de artigos (existente)
       ├─ Progresso → DesempenhoView (existente)
       ├─ Reforço → Artigos fracos (< 40% acerto)
       └─ Cadernos → (placeholder futuro)
```

### O que será feito

**1. Nova view `questoes-dashboard`** — tela principal após clicar em Questões:

- **Header gradiente** com ícone circular, título "Questões", contagem total de questões disponíveis (somatório de artigos × 40)
- **Barra de stats** horizontal com 4 métricas: Respondidas, Acertos %, Erros %, Total Questões
- **Grid 2×2** com cards: Praticar (vai para categorias), Progresso (vai para DesempenhoView), Reforço (filtra artigos fracos), Cadernos (placeholder)
- **Seção Dra. Arabella** — avatar + balão de texto com análise gerada a partir dos `lawStats` e `articleStats` do usuário (texto dinâmico local, sem chamada de IA). Exemplo: "Parabéns! Você já estudou X questões. Seu ponto forte é Direito Penal (85%). Sugiro reforçar Constitucional (32%)."
- Botão "Ver análise completa" que navega para Progresso/Desempenho

**2. Nova view `select-categoria`** — grid de categorias por disciplina:

- **Busca** no topo: "Buscar disciplina..."
- **Tabs**: Principais, Frequentes, Extras
- **Grid 2 colunas** com cards contendo:
  - Ícone representativo da área (balança para Constitucional, martelo para Penal, etc.)
  - Nome da categoria
  - Badge com % de acerto
  - Subtexto "X/Y feitas"
- As categorias agrupam leis pelo campo `tipo` do `LEIS_CATALOG`:
  - Constitucional = `constituicao`
  - Penal = leis com tags penais (CP, CPP, CPM, LEP, etc.)
  - Civil = CC, CPC
  - Trabalhista = CLT
  - Tributário = CTN, LRF
  - Administrativo = L8112, LIA, NLL, LPAF
  - Consumidor = CDC
  - Ambiental = Código Florestal, LCA
  - Eleitoral = CE, LPP, LEle, LFL
  - E demais agrupamentos

**3. Ao selecionar uma categoria** → lista as leis daquela categoria no formato de grid com cards (igual imagem 168), com ícone, nome, progresso. Ao clicar numa lei → fluxo existente de seleção de artigo.

### Detalhes Técnicos

**Arquivo `src/pages/Estudar.tsx`**:
- Adicionar novas views ao type: `'questoes-dashboard' | 'select-categoria' | 'select-lei-categoria'`
- Quando `handleSelectMode('questoes')` → `setView('questoes-dashboard')` em vez de `'select-lei'`
- Implementar as 3 novas views inline no componente
- Lógica da Dra. Arabella: gerar texto dinâmico baseado em `lawStats`, `totalQuestions`, `avgPct`, identificando ponto forte e fraco

**Mapeamento de categorias** — array estático com:
```typescript
const CATEGORIAS = [
  { id: 'constitucional', label: 'Constitucional', icon: Landmark, tipos: ['constituicao'], gradient: '...' },
  { id: 'penal', label: 'Penal', icon: Gavel, tipos: ['codigo'], tabelas: ['CP_...', 'CPP_...', 'CPM_...'] },
  // ...
];
```

**Stats por categoria** — agregar `lawStats` por categoria para calcular total feitas e % acerto.

**Paleta de cores** — usar os gradientes do tema existente (primary, card, border, etc.) e os gradientes já usados no menu (rose, amber, purple, emerald).

### Arquivos

| Arquivo | Ação |
|---------|------|
| `src/pages/Estudar.tsx` | Adicionar 3 novas views (dashboard, categorias, leis por categoria) com toda a lógica e UI |

