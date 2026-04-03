

## Plano: Padronizar Botão "Voltar" em Todas as Páginas com Cabeçalho Colorido

### Problema

O botão de voltar tem formatos diferentes em cada página:
- **CategoriaLegislacao**: texto simples branco/80 sem fundo ("Voltar ao início")
- **Ferramentas, Estudar, GeradorPost, Radar360**: texto simples branco/80 sem fundo ("Voltar")
- **Resumos**: com fundo `bg-primary-foreground/15` e `rounded-lg` ("Voltar")
- **Gamificacao**: texto simples ("Voltar" ou "Anterior")
- **LeitorEbook**: caixa escura isolada com seta + texto separado

### Solução

Criar um padrão único: **botão com fundo semitransparente, bordas arredondadas, texto "Voltar"** — visualmente clicável, consistente em todas as páginas.

### Design Padrão

```
className="flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm
           text-white font-medium transition-all text-sm px-3 py-1.5 rounded-lg"
```

- Seta `ArrowLeft` (w-4 h-4) + texto **"Voltar"** (sempre igual)
- Fundo semitransparente branco (`bg-white/15`) com blur
- Hover mais claro (`bg-white/25`)
- Bordas arredondadas (`rounded-lg`)

### Páginas a Alterar

| Página | Mudança |
|--------|---------|
| `src/pages/CategoriaLegislacao.tsx` | ~6 botões: trocar "Voltar ao início"/"Voltar aos anos"/"Voltar aos tribunais" → "Voltar" com novo estilo |
| `src/pages/Ferramentas.tsx` | Aplicar fundo ao botão |
| `src/pages/Estudar.tsx` | Aplicar fundo ao botão |
| `src/pages/GeradorPost.tsx` | Aplicar fundo ao botão |
| `src/pages/Radar360.tsx` | Aplicar fundo ao botão |
| `src/pages/Gamificacao.tsx` | Aplicar fundo, texto fixo "Voltar" |
| `src/pages/Resumos.tsx` | Ajustar para usar `bg-white/15` em vez de `bg-primary-foreground/15` (consistência) |

O LeitorEbook mantém seu próprio padrão (cabeçalho de leitura com título do livro, contexto diferente).

