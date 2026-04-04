

## Plano: Adicionar 40 Leis Faltantes ao Catálogo

### Abordagem

Todas as 40 leis serão encaixadas nas categorias existentes — sem criar categorias novas. A grande maioria entra em **lei-especial**, com 1-2 em **previdenciario**.

### Distribuição das 40 leis por categoria

**lei-especial** (~38 leis):
- LINDB (DL 4.657/1942)
- Crimes Hediondos (8.072/1990)
- Tortura (9.455/1997)
- Crimes Ambientais (9.605/1998)
- Racismo (7.716/1989)
- Lavagem de Dinheiro (9.613/1998)
- Processo Administrativo Federal (9.784/1999)
- LRF (LC 101/2000)
- LAI (12.527/2011)
- Ação Popular (4.717/1965)
- Contravenções Penais (DL 3.688/1941)
- LDB (9.394/1996)
- Lei Orgânica do MP (8.625/1993)
- Lei das S.A. (6.404/1976)
- Propriedade Industrial (9.279/1996)
- Direitos Autorais (9.610/1998)
- Anticorrupção Empresarial (12.846/2013)
- Concessões (8.987/1995)
- PPPs (11.079/2004)
- Habeas Data (9.507/1997)
- Mandado de Injunção (13.300/2016)
- Partidos Políticos (9.096/1995)
- Lei das Eleições (9.504/1997)
- Ficha Limpa (LC 135/2010)
- Crimes contra Sistema Financeiro (7.492/1986)
- Proteção de Testemunhas (9.807/1999)
- Parcelamento do Solo (6.766/1979)
- Alienação Parental (12.318/2010)
- Alimentos (5.478/1968)
- CADE/Antitruste (12.529/2011)
- Lei do SUS (8.080/1990)
- Biossegurança (11.105/2005)
- Crimes Informáticos (12.737/2012)
- Inelegibilidades (LC 64/1990)
- Lei Orgânica do TCU (8.443/1992)
- Liberdade Econômica (13.874/2019)
- Código de Ética do Servidor (Decreto 1.171/1994)
- Marco Legal das Startups (LC 182/2021)
- Reforma Tributária (LC 214/2025)

**previdenciario** (1 lei):
- LOAS — Assistência Social (8.742/1993)

### O que será feito

1. Adicionar as 40 entradas no array `LEIS_CATALOG` em `src/data/leisCatalog.ts`, cada uma com id, nome, sigla, descricao, tipo, tabela_nome, iconColor, url_planalto e tags de busca.

2. Criar uma **migration** no Supabase criando as 40 tabelas vazias (mesmo schema das existentes: id, numero/rotulo, texto, ordem_numero, titulo, capitulo) para que o app não quebre ao tentar buscar artigos.

3. O sublabel da categoria "Leis Especiais" no `CategoriasGrid.tsx` será atualizado de "Penais, Civis..." para "Penais, Civis, Admin..." para refletir a variedade.

### Arquivos a alterar

| Arquivo | Mudança |
|---------|---------|
| `src/data/leisCatalog.ts` | +40 entradas no LEIS_CATALOG |
| `src/components/vademecum/CategoriasGrid.tsx` | Atualizar sublabel de "Leis Especiais" |
| `supabase/migrations/XXXX_criar_tabelas_leis_faltantes.sql` | CREATE TABLE para as 40 novas leis |

### Observação

As tabelas serão criadas vazias. Para popular os artigos, será necessário rodar o pipeline de extração do Planalto (edge function `scrape-legislacao`) para cada lei — isso pode ser feito depois, lei por lei.

