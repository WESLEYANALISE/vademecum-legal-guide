

## Plano: Painel esquerdo animado na tela de autenticação (Desktop)

### O que será feito

Redesenhar o layout desktop do `AuthFormScreen` para um **split-screen**:

- **Lado esquerdo (50%)**: Fundo escuro com imagem de fundo (Themis) + overlay. Sobre ele:
  - Logo + "Vacatio — Vade Mecum 2026"
  - Texto: "Toda a legislação brasileira comentada e explicada"
  - **Cascata animada** de siglas/nomes das leis (CF/88, CP, CC, CPC, CLT, ECA, etc.) descendo continuamente com `framer-motion`, cada item aparecendo em sequência com fade-in e translateY, desvanecendo suavemente no final (gradient mask)

- **Lado direito (50%)**: O card de formulário (login/cadastro) centralizado, como está hoje

### Animação da cascata

- Importar `LEIS_CATALOG` de `src/data/leisCatalog.ts`
- Exibir siglas + nome curto em colunas, animando com `motion.div` e `staggerChildren`
- Cada item entra com `opacity: 0 → 1` e `y: 20 → 0`, em sequência (delay incremental de ~0.08s)
- O container terá um `mask-image` CSS com gradiente vertical para sumir suavemente no topo e no fundo
- Loop infinito: ao terminar a lista, reinicia com `key` ou repeat

### Arquivos

| Arquivo | Ação |
|---------|------|
| `src/pages/Auth.tsx` | Reescrever o bloco desktop do `AuthFormScreen` com layout split + cascata animada |

Nenhum arquivo novo necessário — usa `LEIS_CATALOG` existente e `framer-motion` já instalado.

