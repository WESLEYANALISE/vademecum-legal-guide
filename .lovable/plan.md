

## Plano: Kanban Legislativo com Rastreamento em Tempo Real

### Visão Geral

Um painel Kanban que mostra o ciclo de vida de proposições legislativas em colunas visuais:

```text
┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ 📋 Tramitando│  │ 🗳️ Em Votação│  │ ✍️ Sanção    │  │ ✅ Publicada  │
│             │  │             │  │             │  │             │
│ ┌─────────┐ │  │ ┌─────────┐ │  │             │  │ ┌─────────┐ │
│ │PL 1234  │ │  │ │PLP 56   │ │  │             │  │ │Lei 15374│ │
│ │Altera CP│ │  │ │Altera..│ │  │             │  │ │Cria...  │ │
│ │⚖️ C.Penal│ │  │ │Aprovado│ │  │             │  │ │02/04/26 │ │
│ └─────────┘ │  │ └─────────┘ │  │             │  │ └─────────┘ │
└─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

### Problema Atual dos Dados

A tabela `radar_proposicoes` tem 8.334 registros, mas `situacao` e `ultima_tramitacao` estão todos `NULL`. Precisamos enriquecer esses dados pela API da Câmara para classificar em colunas.

### Solução Técnica

#### 1. Nova tabela `kanban_proposicoes` (migration)

Tabela dedicada para rastrear o status kanban de proposições monitoradas:

```sql
CREATE TABLE kanban_proposicoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_externo TEXT NOT NULL,
  sigla_tipo TEXT NOT NULL,         -- PL, PLP, PEC, MPV
  numero INTEGER NOT NULL,
  ano INTEGER NOT NULL,
  ementa TEXT,
  autor TEXT,
  lei_afetada TEXT,                 -- ex: 'CP_CODIGO_PENAL'
  status_kanban TEXT NOT NULL DEFAULT 'tramitando',  -- tramitando, votacao, sancao, publicada
  situacao_camara TEXT,             -- descrição da situação na API
  data_ultima_acao TIMESTAMPTZ,
  data_votacao TIMESTAMPTZ,
  resultado_votacao TEXT,           -- Aprovado, Rejeitado
  data_publicacao TIMESTAMPTZ,
  numero_lei_publicada TEXT,        -- ex: 'Lei nº 15.374'
  dados_json JSONB,
  atualizado_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE(id_externo)
);

ALTER TABLE kanban_proposicoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kanban_read" ON kanban_proposicoes FOR SELECT USING (true);
```

#### 2. Edge Function `atualizar-kanban` (nova)

- Busca tramitação detalhada na API da Câmara para cada proposição monitorada
- Classifica automaticamente em colunas com base no `despacho` e `situação`:
  - **Tramitando**: em análise nas comissões
  - **Em Votação**: pauta do plenário, votação agendada
  - **Sanção/Veto**: aprovada na Câmara, aguardando presidente
  - **Publicada**: sancionada e publicada no DOU
- Quando detecta status "Publicada", dispara atualização na tabela da lei afetada (ex: `CP_CODIGO_PENAL`) via `monitorar-legislacao`
- Cron job a cada 6 horas

#### 3. Nova página `KanbanLegislativo.tsx`

- **4 colunas** com scroll horizontal (swipe no mobile)
- Cards coloridos por tipo (PL=violet, PEC=sky, MPV=rose, PLP=amber) — mesmas cores já definidas no Radar
- Cada card mostra: tipo+número, ementa resumida, lei afetada (badge), data da última ação
- Filtro por lei afetada (ex: "Código Penal", "CLT")
- Ao clicar em um card → abre detalhe com timeline da tramitação
- **Realtime**: subscription no Supabase para `kanban_proposicoes` com `on('UPDATE')` para atualizar cards ao vivo
- Sem drag-and-drop (as colunas são determinadas automaticamente pelo status real)

#### 4. Integração com Radar 360

- Nova aba "Kanban" no Radar 360, ou link na página de Ferramentas
- Quando uma proposição muda para "Publicada", a Edge Function:
  1. Insere registro em `legislacao_alteracoes` (alimenta aba "Novidades")
  2. Invoca `monitorar-legislacao` para atualizar os artigos da lei afetada

### Layout Mobile

```text
┌──────────────────────────────┐
│  ← Voltar                    │
│  📊 Kanban Legislativo       │
├──────────────────────────────┤
│  [Filtrar por lei ▾]         │
│                              │
│  ← swipe horizontal →       │
│ ┌──────────┐┌──────────┐    │
│ │Tramitando ││Em Votação│    │
│ │    12     ││    3     │    │
│ │┌────────┐ ││┌────────┐│    │
│ ││PL 1234 │ │││PEC 45  ││    │
│ ││Altera  │ │││Reforma ││    │
│ ││C.Penal │ │││Tribut. ││    │
│ │└────────┘ ││└────────┘│    │
│ │┌────────┐ ││          │    │
│ ││PL 5678 │ ││          │    │
│ │└────────┘ ││          │    │
│ └──────────┘└──────────┘    │
└──────────────────────────────┘
```

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| `supabase/migrations/...` | Criar tabela `kanban_proposicoes` |
| `supabase/functions/atualizar-kanban/index.ts` | Edge Function para buscar tramitação e classificar status |
| `src/pages/KanbanLegislativo.tsx` | Nova página com o board Kanban |
| `src/services/radarService.ts` | Funções para fetch de dados kanban |
| `src/App.tsx` | Rota `/kanban-legislativo` |
| `src/pages/Radar360.tsx` ou `Ferramentas.tsx` | Link de acesso ao Kanban |

### Fluxo de Atualização Automática

```text
Cron (6h) → atualizar-kanban
  ├─ API Câmara: busca tramitação de cada PL monitorado
  ├─ Classifica status_kanban
  ├─ UPDATE kanban_proposicoes
  │   └─ Realtime → UI atualiza ao vivo
  └─ Se status = "publicada":
      ├─ INSERT legislacao_alteracoes (Novidades)
      └─ INVOKE monitorar-legislacao (atualiza artigos)
```

