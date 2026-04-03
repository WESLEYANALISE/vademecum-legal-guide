

## Plano: Redesign Completo do Gerador de Post com Design System Profissional

### Resumo

Reescrever o `GeradorPost.tsx` e o prompt da Edge Function para gerar carrosséis Instagram com o design system profissional descrito nas instruções: progress bar, seta de swipe, alternância light/dark, tipografia Playfair Display + DM Sans, e paleta derivada da cor vinho do Vacatio. Adicionar seletor de **tipo de conteúdo** (Curiosidade, Explicação, Resumo pra Prova, Dica Prática, Comparação).

### Paleta Derivada (da cor vinho `hsl(340, 55%, 12%)`)

| Token | Valor | Uso |
|-------|-------|-----|
| BRAND_PRIMARY | `hsl(340, 55%, 22%)` | Ícones, tags, progress bar |
| BRAND_LIGHT | `hsl(340, 40%, 45%)` | Tags em fundo escuro |
| BRAND_DARK | `hsl(340, 55%, 12%)` | CTA, gradiente |
| LIGHT_BG | `hsl(40, 15%, 95%)` | Fundo slides claros |
| LIGHT_BORDER | `hsl(40, 10%, 88%)` | Divisores |
| DARK_BG | `hsl(340, 30%, 8%)` | Fundo slides escuros |
| Gradiente | `linear-gradient(165deg, DARK 0%, PRIMARY 50%, LIGHT 100%)` | Slides CTA/solução |

### Tipos de Conteúdo (novo seletor)

1. **Curiosidade** — "Você sabia que..." com fatos surpreendentes sobre o artigo
2. **Explicação** — Explicação didática com exemplos
3. **Resumo pra Prova** — Pontos-chave para OAB/concursos
4. **Dica Prática** — Aplicação no dia-a-dia
5. **Comparação** — Antes vs Depois / Artigo X vs Y

### Mudanças

**1. `src/pages/GeradorPost.tsx` — Reescrita completa**

- Adicionar seletor de "Tipo de conteúdo" com as 5 opções acima (radio group ou select)
- Enviar o `tipoConteudo` na chamada da Edge Function
- Novo `SlideRenderer` com o design system completo:
  - Cada slide renderizado a 420px de largura (ratio 4:5 = 525px)
  - Progress bar em cada slide (track + fill + counter "1/7")
  - Seta de swipe na borda direita (exceto último slide)
  - Alternância LIGHT_BG / DARK_BG / Gradiente entre slides
  - Logo lockup (logo Vacatio + "Vacatio" + handle) no primeiro e último slides
  - Tag/categoria (ex: "CURIOSIDADE JURÍDICA") uppercase acima dos títulos
  - Tipografia: Google Fonts Playfair Display (títulos) + DM Sans (corpo)
  - Componentes reutilizáveis: feature list, numbered steps, quote box, tag pills, CTA button
- Para export PNG: manter `html2canvas` com `scale: Math.ceil(1080/420)` = scale 3 para alta resolução
- Os slides off-screen para export ficam a 420x525px (não 1080x1350) e o scale do html2canvas faz o upscale

**2. `supabase/functions/assistente-juridica/index.ts` — Prompt atualizado**

- Receber `tipoConteudo` no body
- Novo prompt com tipos de slides expandidos baseados no design system:
  - `hero` (capa com hook viral)
  - `problema` (pain point, fundo escuro)
  - `solucao` (fundo gradiente, resposta)
  - `features` (lista de features/pontos com ícones)
  - `detalhes` (profundidade, fundo escuro)
  - `passos` (how-to numerado)
  - `cta` (call to action final)
- O prompt adapta o conteúdo ao `tipoConteudo` selecionado
- Gerar 5-7 slides seguindo a sequência narrativa (hook → problema → solução → detalhes → CTA)
- Cada slide inclui `tag` (label uppercase), `bg` (light/dark/gradient), e conteúdo específico

**Novo formato JSON dos slides:**
```json
{
  "titulo_viral": "...",
  "slides": [
    { "tipo": "hero", "bg": "light", "tag": "CURIOSIDADE JURÍDICA", "titulo": "...", "subtitulo": "..." },
    { "tipo": "problema", "bg": "dark", "tag": "O PROBLEMA", "titulo": "...", "itens": ["..."] },
    { "tipo": "solucao", "bg": "gradient", "tag": "A RESPOSTA", "titulo": "...", "texto": "...", "citacao": "..." },
    { "tipo": "features", "bg": "light", "tag": "PONTOS-CHAVE", "titulo": "...", "features": [{"icone": "...", "label": "...", "desc": "..."}] },
    { "tipo": "passos", "bg": "light", "tag": "COMO APLICAR", "titulo": "...", "passos": [{"titulo": "...", "desc": "..."}] },
    { "tipo": "cta", "bg": "gradient", "tag": "SALVE ESTE POST", "texto_engajamento": "...", "cta_texto": "..." }
  ]
}
```

### Arquivos Editados

| Arquivo | Mudança |
|---------|---------|
| `src/pages/GeradorPost.tsx` | Reescrita completa com novo design system e seletor de tipo |
| `supabase/functions/assistente-juridica/index.ts` | Prompt expandido com novos tipos de slides e `tipoConteudo` |

### Detalhes Tecnicoss

- Google Fonts (Playfair Display + DM Sans) carregadas via `@import` no `<style>` embutido nos slides ou via `<link>` no index.html
- O preview no app mostra os slides a ~350px de largura (escala proporcional) com navegação por setas
- O export usa `html2canvas` com `scale: 3` nos divs de 420x525px, resultando em PNGs de ~1260x1575px (suficiente para Instagram 1080x1350)
- A progress bar e seta são renderizados como parte do slide HTML, não como overlay do app

