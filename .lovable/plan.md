

## Plano: Corrigir Edge Function e Popular Kanban com Proposições em Todos os Estágios

### Problema

1. **Edge Function timeout**: tenta processar 50 itens com 3 chamadas de API cada (detalhe + tramitações + autores), excedendo o tempo limite
2. **Seed inadequado**: só puxou 100 PLs recentes do `radar_proposicoes` — todos novos, todos "tramitando"
3. **Faltam proposições em estágios avançados**: não há itens em votação, sanção ou publicados

### Solução

#### 1. Reescrever Edge Function `atualizar-kanban`

- **Processar apenas 10 itens por execução** (em vez de 50) para caber no timeout
- **Pular chamada de autores** no primeiro pass — preencher depois
- **Adicionar logs** com `console.log` para debug
- **Buscar proposições em estágios avançados** diretamente da API da Câmara no seed:
  - Consultar `situacaoId=1257` (Transformada em Lei) para pegar publicadas
  - Consultar `situacaoId=918` (Aguardando Sanção) para sanção
  - Consultar `tramitacaoSenado=true` ou `codSituacao` para votação

#### 2. Novo seed inteligente — buscar da API da Câmara

Em vez de só puxar do `radar_proposicoes` (que não tem situação), buscar diretamente da API com filtros por situação:

```text
API Câmara → /proposicoes?ano=2025&ano=2026&siglaTipo=PL,PLP,PEC,MPV
  &situacaoId=1257  → Publicadas (transformadas em lei)
  &situacaoId=918   → Sanção/Veto
  &situacaoId=1141  → Votação/Plenário
  &itens=30 cada
```

Isso garante diversidade de status nas colunas.

#### 3. Processar em lotes menores

```text
Execução 1: Seed (busca API Câmara por situação) → insere ~100 itens
Execução 2+: Atualiza 10 itens por vez (os mais antigos primeiro)
```

#### 4. Adicionar botão "Atualizar" no Kanban UI

O botão já existe mas chama a edge function que timeouta. Ajustar para chamar em lotes menores e mostrar progresso.

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/atualizar-kanban/index.ts` | Reescrever: seed inteligente via API, processar 10 itens por vez, logs |
| `src/pages/KanbanLegislativo.tsx` | Melhorar feedback do refresh, mostrar loading por coluna |

### Fluxo do novo seed

```text
1ª chamada (kanban vazio):
  ├─ Busca API: PL/PLP/PEC transformados em lei (2025-2026) → coluna "publicada"
  ├─ Busca API: Aguardando sanção → coluna "sancao"
  ├─ Busca API: Em votação/plenário → coluna "votacao"
  ├─ Busca API: Em tramitação (recentes) → coluna "tramitando"
  └─ INSERT kanban_proposicoes com status já classificado

Chamadas seguintes:
  ├─ Pega 10 itens não-publicados mais antigos
  ├─ API: detalhe + tramitações (2 calls por item = 20 calls)
  ├─ Classifica e UPDATE
  └─ Retorna resultado
```

