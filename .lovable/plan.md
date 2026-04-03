

## Plano: Corrigir Exibição de Leis/Decretos na Aba "Recentes" do Radar 360

### Problemas Identificados

1. **"Sem data"**: 9 leis ordinárias no banco possuem `data_publicacao` e `ementa` vazios (ex: Lei nº 15.366, 15.368, 15.370, 15.371). Elas aparecem agrupadas como "Sem data" sem informação útil.
2. **Título incompleto**: Os cards de leis sem ementa mostram apenas "Lei nº 15.371" sem nenhuma descrição.
3. **"DEcreto" com maiúsculas erradas**: Os dados da resenha vêm em ALL CAPS ("DECRETO Nº 12.909, DE 27 DE MARÇO DE 2026"). A função `normalizeCase` tem um bug na cadeia de `.replace()` que pode produzir "DEcreto" em vez de "Decreto".
4. **Título repetitivo nos decretos**: O titulo mostra o nome completo com data (ex: "Decreto nº 12.909, de 27 de março de 2026") e a ementa repete a mesma coisa.

### Solução

**1. Filtrar registros sem data/ementa** — No `useMemo` de `allRecentes`, excluir itens que não possuam `data_publicacao` nem `ementa` (registros incompletos não devem aparecer).

**2. Corrigir `normalizeCase`** — Reescrever para usar uma abordagem mais robusta: primeiro converter todo o texto para minúsculas, depois capitalizar a primeira letra e palavras-chave como "Lei", "Decreto", "Medida Provisória", etc.

**3. Limpar título dos atos da resenha** — Extrair apenas o tipo e número (ex: "DECRETO Nº 12.909, DE 27 DE MARÇO DE 2026" → "Decreto nº 12.909") removendo a parte da data que já aparece no agrupamento.

**4. Re-popular leis incompletas** — Invocar a Edge Function `popular-leis-ordinarias` para buscar ementa e data das 9 leis que estão vazias no banco.

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Radar360.tsx` | Corrigir `normalizeCase`, filtrar itens sem data, limpar títulos da resenha |
| Edge Function (invocar) | Re-rodar `popular-leis-ordinarias` para preencher dados faltantes |

