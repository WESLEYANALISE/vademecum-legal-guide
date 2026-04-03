

## Plano: Corrigir Tipografia e Dimensões do Gerador de Post para Instagram

### Problema

Os slides estão sendo renderizados a **420×525px** e exportados com `scale: 3` (~1260×1575). Isso causa fontes minúsculas (9-23px no canvas) que ficam ilegíveis no Instagram. As boas práticas de tipografia para Instagram recomendam fontes muito maiores para leitura em telas mobile.

### Solução: Renderizar em Tamanho Real (1080×1350px)

Mudar o canvas de renderização para **1080×1350px** (o tamanho exato do Instagram 4:5). Assim as fontes são definidas em pixels reais e o export usa `scale: 1` (já está no tamanho certo). O preview no app continua escalado para caber na tela.

### Tipografia Instagram (baseada em pesquisa)

Segundo as boas práticas de tipografia para carrossel Instagram:

| Elemento | Tamanho atual | Novo tamanho (1080px) | Regra |
|----------|---------------|----------------------|-------|
| Título hero | 23px | 64px | ~6% da largura do slide |
| Subtítulo | 13px | 32px | Metade do título |
| Tag (categoria) | 9px | 22px | Lettering espaçado, caps |
| Título de seção | 17-18px | 48px | Hierarquia clara |
| Texto corpo | 12px | 30px | Mínimo 28px para mobile |
| Bullet items | 12px | 28px | Legível sem zoom |
| Descrição pequena | 10px | 24px | Menor permitido |
| Logo nome | 11px | 26px | Proporcional |
| Bottom bar | 10px | 22px | Discreto mas legível |
| CTA botão | 12px | 32px | Destaque |

### Regras de Conteúdo (limitação de texto por slide)

O prompt da IA também precisa ser ajustado para gerar **menos texto por slide**:

- **Título**: máximo 8 palavras
- **Corpo/texto**: máximo 3 linhas (~120 caracteres)
- **Bullets**: máximo 4 itens, cada um com máximo 12 palavras
- **Features**: máximo 3 cards por slide

### Mudanças Técnicas

**`src/pages/GeradorPost.tsx`:**
1. Mudar `SLIDE_W = 1080` e `SLIDE_H = 1350`
2. Ajustar `previewScale` para `280 / 1080` (~0.26)
3. Atualizar todas as fontes para os novos tamanhos
4. Padding proporcional: `36px → 90px`, `32px → 80px`
5. Export com `scale: 1` (já é 1080×1350)
6. Logo: 28px → 64px, gaps e margins proporcionais
7. Bottom bar height: 30px → 72px

**`supabase/functions/assistente-juridica/index.ts`:**
- Ajustar o prompt do modo `carrossel_post` para instruir a IA a gerar textos mais curtos (limites de palavras por campo)

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| `src/pages/GeradorPost.tsx` | Dimensões 1080×1350, fontes grandes, scale 1 |
| `supabase/functions/assistente-juridica/index.ts` | Prompt com limites de texto por slide |

