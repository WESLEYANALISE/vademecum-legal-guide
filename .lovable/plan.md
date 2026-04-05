

## Plano: Tela de Landing + Redesign da Autenticação

### Visão Geral

Criar duas telas no fluxo de autenticação, inspiradas nas imagens de referência:

1. **Landing Page** (`/auth`) — Tela inicial com imagem da Themis ao fundo (na paleta vinho do app), logo, headline, botão "Iniciar Agora", benefícios e preview de funcionalidades
2. **Tela de Login/Cadastro** — Desliza da direita para a esquerda ao clicar "Iniciar Agora", com imagem da Themis no topo, logo abaixo, abas Entrar/Cadastrar e formulário

### Estrutura

O `Auth.tsx` atual será refatorado em dois estados internos: `screen: 'landing' | 'auth'`.

- **Estado `landing`**: Mostra a landing page completa
- **Estado `auth`**: Mostra o formulário de autenticação com animação slide-in

Não será criada uma rota separada — tudo fica em `/auth`.

### Detalhes da Landing Page

- **Fundo**: Imagem `themis-bg.jpg` cobrindo toda a tela, com overlay gradiente escuro (vinho/background) de baixo para cima
- **Logo**: `logo-vacatio.jpeg` centralizado no topo, arredondado
- **Nome**: "Vacatio" + subtítulo "Vade Mecum 2026"
- **Headline**: "Tudo para você **estudar Direito** em um **só lugar**." com palavras-chave destacadas na cor primary (sublinhadas)
- **Descrição**: "Leis, resumos, flashcards, questões, audioaulas e muito mais, tudo em um só lugar para você **dominar o Direito**."
- **Botão CTA**: "Iniciar Agora →" com ícone, estilo primary, rounded-full, tamanho grande
- **Link secundário**: "▷ Ver demonstração" (sem ação por agora)
- **Social proof**: "⭐ +10.000 alunos já estudam com a gente"
- **Cards de preview** na parte inferior: 3 cards horizontais (Biblioteca, Vade Mecum, Videoaulas) com gradiente escuro e ícones

### Detalhes da Tela de Autenticação

- **Transição**: `AnimatePresence` com slide da direita para a esquerda (x: 100% → 0)
- **Topo**: Imagem da Themis ocupando ~35% superior com gradiente fade para o fundo
- **Botão voltar**: Seta no canto superior esquerdo (círculo primary) para retornar à landing
- **Logo + nome**: Centralizados abaixo da imagem
- **Abas**: Entrar / Cadastrar com estilo de pills (aba ativa em primary/vermelho-vinho)
- **Formulário**: Mantém toda a lógica atual (login, signup, forgot password) sem alterações
- **Inputs**: Estilo clean com placeholder e ícone à direita (ao invés da esquerda)

### Arquivos a alterar

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Auth.tsx` | Refatorar completamente: adicionar estado `screen`, criar seção landing e redesenhar seção auth |

### Paleta de cores utilizada

- Fundo/overlay: `background` (vinho escuro)
- Destaques: `primary` (marfim/amarelo)
- Texto: `foreground` (claro)
- Cards: gradientes escuros com opacidade

