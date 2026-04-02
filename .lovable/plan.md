

## Plano: Novo Logo + 10 Paletas Roxo/Vinho com Branco

### O Logo
A imagem enviada (V branco com balança da justiça sobre fundo vinho/roxo escuro) será copiada para `src/assets/logo-vacatio.jpeg`. As cores dominantes:
- **Fundo**: Vinho/roxo profundo ~HSL 340 65% 12%
- **Logo/Destaques**: Branco puro

### As 10 Paletas (derivadas do logo vinho + branco)

| # | Nome | Conceito |
|---|------|----------|
| 1 | **Vinho & Marfim** (padrão) | Fundo vinho escuro + destaques brancos/marfim — fiel ao logo |
| 2 | **Púrpura Noturna** | Roxo mais profundo/preto + branco suave |
| 3 | **Rubi Claro** | Vermelho rubi + branco luminoso |
| 4 | **Ameixa & Prata** | Ameixa escura + prata/cinza claro |
| 5 | **Bordô & Pérola** | Bordô clássico + pérola rosada |
| 6 | **Uva Imperial** | Roxo uva intenso + branco real |
| 7 | **Ébano & Neve** | Preto com subtom vinho + branco puro |
| 8 | **Grafite Violeta** | Cinza escuro com subtom violeta + branco |
| 9 | **Mogno & Creme** | Marrom avermelhado + creme suave |
| 10 | **Obsidiana Púrpura** | Preto profundo com nuance roxa + branco gelado |

### Diferença Chave vs Paletas Anteriores
- O **primary** (destaque principal) deixa de ser dourado/gold e passa a ser **branco/marfim** (alta luminosidade, baixa saturação)
- O **accent** e **copper** seguem tons claros (prata, marfim, pérola) em vez de dourado
- As paletas mantêm coerência com o logo branco sobre fundo escuro

### Arquivos a Editar

| # | Arquivo | Mudança |
|---|---------|---------|
| 1 | `src/assets/logo-vacatio.jpeg` | Substituir pelo novo logo (V branco) |
| 2 | `src/hooks/useTheme.tsx` | Substituir 10 paletas — primary/accent/copper mudam de gold para branco/marfim |
| 3 | `src/index.css` | Atualizar `:root` para a paleta padrão "Vinho & Marfim" |
| 4 | Memórias de estilo | Atualizar branding e paleta de cores |

### Detalhes Técnicos
- Estrutura `p()` com 18 parâmetros HSL mantida
- Default muda para `vinho-marfim`
- Primary: ~HSL `0 0% 95%` (marfim) em vez de `38 72% 48%` (dourado)
- Copper/accent: tons claros (prata, marfim) em vez de dourado

