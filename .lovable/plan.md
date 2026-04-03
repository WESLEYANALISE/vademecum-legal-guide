

## Plano: Fundos com Contraste e Legibilidade

### Problema
Os fundos `.jpg` com ornamentos (colunas, molduras douradas) poluem o slide e sobrepõem o texto. Em slides claros, o texto branco sobre fundo branco fica ilegível.

### Solução
Remover todas as 10 imagens `.jpg` de fundo e substituir por **fundos CSS puros** — gradientes, cores sólidas e padrões sutis que garantem contraste perfeito com o texto.

### Novo Sistema de Fundos (CSS puro, sem imagens)

| Tipo | Fundo | Texto | Lógica |
|------|-------|-------|--------|
| **hero** | Gradiente vinho escuro (`hsl(340,55%,12%)` → `hsl(340,45%,18%)`) | Branco + Dourado | Fundo escuro = texto claro |
| **problema** | Vinho sólido profundo (`hsl(340,30%,8%)`) | Branco | Escuro = legível |
| **solucao** | Gradiente diagonal vinho→dourado sutil | Branco | Escuro = legível |
| **features** | Marfim claro (`hsl(40,15%,95%)`) com borda dourada sutil no topo | **Vinho escuro** | Claro = texto escuro |
| **detalhes** | Vinho médio (`hsl(340,40%,15%)`) | Branco | Escuro |
| **passos** | Marfim claro (`hsl(40,20%,93%)`) | **Vinho escuro** | Claro = texto escuro |
| **cta** | Gradiente vinho→dourado (165deg) | Branco + botão dourado | Escuro |

Cada slide terá uma **overlay semi-transparente** sobre o fundo para garantir legibilidade mesmo com decorações sutis (linhas finas, bordas douradas opacas tipo `0.08`).

### Mudanças no `GeradorPost.tsx`

1. **Remover** todas as importações de `bg-*.jpg` e o `BG_MAP`
2. **Substituir** `backgroundImage: url(...)` por `background` com gradientes CSS
3. **Adicionar** decorações sutis via CSS (bordas douradas finas, linhas divisórias) em vez de imagens
4. **Corrigir** a lógica de cor do texto: slides claros SEMPRE usam texto vinho escuro, slides escuros SEMPRE usam texto branco
5. **Adicionar** `textShadow` sutil em slides escuros para reforçar legibilidade

### Decorações Sutis (CSS, não imagens)
- Linha dourada fina no topo (2px, cor `#B8860B` com opacity 0.3)
- Borda interna sutil (`box-shadow: inset 0 0 0 1px rgba(184,134,11,0.15)`)
- Cantos com pequeno detalhe dourado via `border` nos slides escuros

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| `src/pages/GeradorPost.tsx` | Remover imports de imagens, usar CSS backgrounds, corrigir contraste |
| `src/assets/carousel-bg/*.jpg` | **Deletar** todas as 10 imagens |

