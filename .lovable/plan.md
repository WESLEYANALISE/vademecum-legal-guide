

## Plano: Integrar `legislacao_alteracoes` no Overlay de Novidades

### Problema

A aba "Novidades" dentro da legislação (ex: ECA) só mostra alterações que estão **embutidas no texto dos artigos** — parênteses como "(Incluído pela Lei nº 15.240, de 2025)". Ela **não consulta** a tabela `legislacao_alteracoes`, que é alimentada pelo sistema de monitoramento automático (`monitorar-legislacao`).

Resultado: quando a Edge Function detecta uma alteração e grava em `legislacao_alteracoes`, ela **não aparece** na aba Novidades.

### Solução

Combinar as duas fontes de dados na aba Novidades:

1. **Fonte 1 (atual)**: Parsing dos parênteses de modificação no texto dos artigos
2. **Fonte 2 (nova)**: Query à tabela `legislacao_alteracoes` filtrando por `tabela_nome`

As alterações da tabela serão mescladas com as parseadas, desduplicadas por `artigo_numero`, e exibidas juntas — priorizando a versão da tabela (mais atualizada) quando houver conflito.

Alterações vindas do monitoramento terão um badge "Monitoramento em tempo real" para diferenciá-las.

### Arquivo

| Arquivo | Mudança |
|---------|---------|
| `src/pages/CategoriaLegislacao.tsx` | Na seção `novidadesContent`: adicionar `useEffect` para buscar `legislacao_alteracoes` por `tabela_nome`, mesclar com items parseados, desduplicar |

### Fluxo

```text
Novidades overlay abre
  ├─ Fonte 1: parse dos artigos carregados (atual, síncrono)
  ├─ Fonte 2: SELECT * FROM legislacao_alteracoes WHERE tabela_nome = ?
  ├─ Merge: unir por artigo_numero, priorizar fonte 2
  └─ Renderizar lista unificada agrupada por ano
```

