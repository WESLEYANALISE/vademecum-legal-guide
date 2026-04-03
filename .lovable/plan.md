

## Plano: Integrar Leis Ordinárias e Decretos no Radar 360 "Recentes"

### Objetivo

Quando o usuário acessar a aba "Recentes" do Radar 360, além das alterações do DOU (resenha_diaria), exibir também as **Leis Ordinárias** e **Decretos** mais recentes de 2026. Adicionalmente, criar um cron job que popula automaticamente essas tabelas para manter os dados atualizados.

### Mudanças

**1. Radar360.tsx — Exibir leis ordinárias e decretos na aba "Recentes"**

- Importar `fetchLeisOrdinariasPorAno` e `fetchDecretosPorAno` de `legislacaoService`
- No `useEffect` inicial, buscar as 10 leis ordinárias e 10 decretos mais recentes de 2026
- Na aba "Recentes", adicionar duas seções novas abaixo das alterações do DOU:
  - **"Leis Ordinárias Recentes"** — cards com ícone roxo, mostrando número, data e ementa
  - **"Decretos Recentes"** — cards com ícone verde, mostrando número, data e ementa
- Clicar em um card navega para `/legislacao/lei-ordinaria` ou `/legislacao/decreto` com o ID

**2. Cron Jobs — Popular automaticamente a cada 6 horas**

- Criar 2 cron jobs via SQL (`cron.schedule`):
  - `popular-leis-ordinarias` — invoca a Edge Function a cada 6h com `{ano: 2026}`
  - `popular-decretos` — invoca a Edge Function a cada 6h com `{ano: 2026}`
- As funções já fazem sync incremental (só buscam novas), então é seguro rodar periodicamente

**3. popular-decretos — Adicionar modo incremental (igual leis ordinárias)**

- A função `popular-decretos` atualmente parseia HTML de listagem. Adicionar lógica para detectar decretos já existentes e inserir apenas os novos (mesma estratégia de `popular-leis-ordinarias`).

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Radar360.tsx` | Buscar e exibir leis ordinárias + decretos recentes na aba "Recentes" |
| SQL (via insert) | 2 cron jobs para popular dados automaticamente |

### Layout na aba "Recentes"

```text
┌──────────────────────────────┐
│ 📅 03.04.2026  (2 atos)      │  ← Alterações DOU (existente)
│ ┌──────────────────────────┐ │
│ │ Lei 15.374 ...           │ │
│ └──────────────────────────┘ │
├──────────────────────────────┤
│ ⚖️ Leis Ordinárias Recentes  │  ← NOVA seção
│ ┌──────────────────────────┐ │
│ │ Lei nº 15.374  2.4.2026  │ │
│ │ Cria cargos efetivos...  │ │
│ └──────────────────────────┘ │
│ ┌──────────────────────────┐ │
│ │ Lei nº 15.373  ...       │ │
│ └──────────────────────────┘ │
├──────────────────────────────┤
│ 📋 Decretos Recentes         │  ← NOVA seção
│ ┌──────────────────────────┐ │
│ │ Decreto nº 12.888  ...   │ │
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

