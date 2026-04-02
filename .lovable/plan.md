

## Plano: Novo Logo + 10 Paletas Baseadas no Logo

### O Logo
A imagem enviada (V dourado com balança da justiça sobre fundo bordô/marsala) será copiada para `src/assets/logo-vacatio.jpeg`, substituindo o logo atual. As cores dominantes do logo são:
- **Bordô/Marsala**: ~HSL 340 60% 18%
- **Dourado**: ~HSL 42 70% 55%

### As 10 Paletas (todas derivadas do logo)

| # | Nome | Conceito |
|---|------|----------|
| 1 | **Marsala & Ouro** (padrão) | Fundo bordô escuro + destaques dourados — fiel ao logo |
| 2 | **Vinho Noturno** | Bordô mais profundo/preto + ouro suave |
| 3 | **Rubi Imperial** | Vermelho rubi vibrante + ouro intenso |
| 4 | **Mogno & Champanhe** | Marrom avermelhado quente + dourado champanhe claro |
| 5 | **Carmesim & Bronze** | Vermelho escuro + bronze metálico |
| 6 | **Borgonha Clássica** | Borgonha pura + ouro antigo |
| 7 | **Ébano & Ouro** | Preto puro elegante + ouro do logo |
| 8 | **Grafite Bordeaux** | Cinza escuro com subtom bordô + ouro |
| 9 | **Terracota & Mel** | Terracota quente + mel dourado |
| 10 | **Obsidiana Régia** | Preto profundo com nuance roxa + ouro real |

### Arquivos a Editar

| # | Arquivo | Mudança |
|---|---------|---------|
| 1 | `src/assets/logo-vacatio.jpeg` | Substituir pelo novo logo enviado |
| 2 | `src/hooks/useTheme.tsx` | Substituir as 16 paletas atuais por 10 novas derivadas do logo |
| 3 | `mem://style/branding/logo` | Atualizar memória do logo |
| 4 | `mem://style/color-palette/gray-yellow-default` | Atualizar para marsala+ouro |

### Detalhes Técnicos
- Todas as paletas mantêm a estrutura `p()` existente (18 parâmetros HSL)
- O default muda de `grafite-dourado` para `marsala-ouro`
- Referências ao logo em `SideMenu.tsx`, `DesktopSidebar.tsx`, `HeroCarousel.tsx`, `Index.tsx` já importam de `@/assets/logo-vacatio.jpeg` — não precisam mudar

