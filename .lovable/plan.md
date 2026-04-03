

## Plano: Abrir Detalhe de Lei/Decreto com Slide da Direita no Radar 360

### Problema

Os cards de leis ordinárias e decretos na aba "Recentes" não são clicáveis. O usuário quer que ao clicar, abra uma tela de detalhe deslizando da direita para a esquerda.

### Solução

Adicionar estado para armazenar o item selecionado e renderizar o `LeiOrdinariaDetail` com animação de slide-in, igual ao padrão usado em `CategoriaLegislacao.tsx` e `Novidades.tsx`.

### Mudanças em `src/pages/Radar360.tsx`

1. **Importar** `LeiOrdinariaDetail` e `PageTransition`
2. **Novo estado**: `selectedLei: LeiOrdinaria | null`
3. **Guardar dados originais**: Manter referência às leis/decretos originais (`leisRecentes` e `decretosRecentes`) para poder buscar o objeto completo ao clicar
4. **onClick nos cards**: Quando o `source` for `'lei'` ou `'decreto'`, buscar o objeto `LeiOrdinaria` correspondente pelo ID e setar no estado. Cards da `resenha` (que não têm texto completo) não abrem detalhe.
5. **Renderização condicional**: Se `selectedLei` estiver setado, renderizar `LeiOrdinariaDetail` envolvido em `PageTransition` (slide da direita para esquerda), com `onBack` fechando o detalhe
6. **Cursor pointer + ChevronRight**: Adicionar indicador visual de que o card é clicável (apenas para leis/decretos)

### Layout

```text
Radar 360 → clica em "Lei nº 15.374"
  ┌──────────────────────────┐
  │  ← Voltar                │  ← slide-in da direita
  │  ⚖️ Lei nº 15.374        │
  │  Ementa completa...      │
  │  📋 Artigos (12)         │
  │  Art. 1º ...             │
  │  Art. 2º ...             │
  └──────────────────────────┘
```

### Arquivo

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Radar360.tsx` | Estado `selectedLei`, onClick nos cards, renderização condicional com `LeiOrdinariaDetail` + `PageTransition` |

