

## Plano: Carrossel Hero só com Notícias

### Mudança
Simplificar o `HeroCarousel.tsx` para exibir **apenas slides de notícias** do cache, removendo os `FEATURE_SLIDES` estáticos.

### Detalhes

**Arquivo: `src/components/vademecum/HeroCarousel.tsx`**

1. Remover o array `FEATURE_SLIDES` e imports não utilizados (`Search`, `BookOpen`, `StickyNote`, `MessageCircle`, `Radio`, `Mic`, `Brain`, `Sparkles`, `heroImage`, `camaraHero`, `senadoHero`)
2. Construir slides diretamente do `getNoticiasCache()` — cada notícia com imagem vira um slide
3. Manter o fallback placeholder enquanto o cache carrega (skeleton)
4. Ao clicar num slide de notícia → navegar para `/noticias` com `state: { noticiaId }`
5. Manter logo Vacatio, botão Novidades e dots intactos

