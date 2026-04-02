

## Plano: Adicionar categorias "Leis Especiais" e "Previdenciário"

### Resumo
Criar dois novos tipos de legislação (`lei-especial` e `previdenciario`) no catálogo, adicionar as 20 leis faltantes + leis previdenciárias, e atualizar todos os pontos da UI que listam categorias.

### Novas leis a cadastrar

**Leis Especiais (20 leis):**

| Lei | Sigla | Tabela |
|-----|-------|--------|
| Lei de Execução Penal (7.210/84) | LEP | LEP_EXECUCAO_PENAL |
| Maria da Penha (11.340/06) | LMP | LMP_MARIA_PENHA |
| Lei de Drogas (11.343/06) | LD | LD_LEI_DROGAS |
| Organização Criminosa (12.850/13) | LOC | LOC_ORGANIZACAO_CRIMINOSA |
| Abuso de Autoridade (13.869/19) | LAA | LAA_ABUSO_AUTORIDADE |
| Interceptação Telefônica (9.296/96) | LIT | LIT_INTERCEPTACAO_TELEFONICA |
| Servidores Federais (8.112/90) | L8112 | L8112_SERVIDORES_FEDERAIS |
| Improbidade Administrativa (8.429/92) | LIA | LIA_IMPROBIDADE_ADMINISTRATIVA |
| Nova Lei de Licitações (14.133/21) | NLL | NLL_LICITACOES |
| Mandado de Segurança (12.016/09) | LMS | LMS_MANDADO_SEGURANCA |
| Ação Civil Pública (7.347/85) | LACP | LACP_ACAO_CIVIL_PUBLICA |
| Juizados Especiais (9.099/95) | LJE | LJE_JUIZADOS_ESPECIAIS |
| LGPD (13.709/18) | LGPD | LGPD_PROTECAO_DADOS |
| Marco Civil da Internet (12.965/14) | MCI | MCI_MARCO_CIVIL_INTERNET |
| Lei de Falências (11.101/05) | LF | LF_FALENCIAS |
| Lei de Arbitragem (9.307/96) | LA | LA_ARBITRAGEM |
| Lei do Inquilinato (8.245/91) | LI | LI_INQUILINATO |
| Lei de Registros Públicos (6.015/73) | LRP | LRP_REGISTROS_PUBLICOS |
| LOMAN (LC 35/79) | LOMAN | LOMAN_LEI_ORGANICA_MAGISTRATURA |
| Lei Antiterrorismo (13.260/16) | LAT | LAT_ANTITERRORISMO |

**Previdenciário (leis do direito previdenciário):**

| Lei | Sigla | Tabela |
|-----|-------|--------|
| Lei de Benefícios da Previdência (8.213/91) | LBPS | LBPS_BENEFICIOS_PREVIDENCIA |
| Lei do Custeio da Seguridade (8.212/91) | LCSS | LCSS_CUSTEIO_SEGURIDADE |
| Lei da Previdência Complementar (LC 109/01) | LPC | LPC_PREVIDENCIA_COMPLEMENTAR |

### Arquivos a modificar

1. **`src/data/leisCatalog.ts`** — Adicionar as 23 novas leis com `tipo: 'lei-especial'` ou `tipo: 'previdenciario'`

2. **`src/services/legislacaoService.ts`** — Adicionar `'lei-especial'` e `'previdenciario'` ao array de `getTodosOsTipos()`

3. **`src/components/vademecum/CategoriasGrid.tsx`** — Adicionar dois novos cards:
   - Leis Especiais (ícone `BookMarked`, gradiente roxo/índigo)
   - Previdenciário (ícone `HeartPulse`, gradiente teal)

4. **`src/pages/CategoriaLegislacao.tsx`** — Adicionar entradas em `TIPO_CONFIG` para os dois novos tipos (renderizam como lista de leis, igual códigos/estatutos)

5. **`src/components/vademecum/DesktopSidebar.tsx`** — Adicionar os dois tipos ao menu lateral desktop

6. **`src/components/vademecum/LegislacaoTab.tsx`** — Adicionar labels para os novos tipos

7. **`src/pages/ExplicacaoLei.tsx`** e **`src/pages/NarracaoLei.tsx`** — Adicionar grupos para as novas categorias

8. **`src/services/explicacaoWorker.ts`** — Incluir os novos tipos no filtro de leis

### Observações
- As tabelas no Supabase (ex: `LEP_EXECUCAO_PENAL`) ainda não existem — serão criadas depois via migration + scraping do Planalto. Por enquanto, o catálogo ficará registrado e os cards aparecerão na UI, mas sem artigos até popular os dados.
- Nenhuma lógica especial é necessária para esses tipos (não são como `lei-ordinaria` que filtra por ano) — funcionam como `codigo`/`estatuto`, listando as leis do catálogo.

