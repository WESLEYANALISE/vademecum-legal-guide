

## Plano: Gerador de Posts Instagram Carrossel

### Resumo

Nova funcionalidade "Gerador de Post" acessível via Ferramentas. O usuário seleciona um artigo de lei e a IA gera um carrossel de imagens Instagram (1080×1350px — formato 4:5) com conteúdo educativo viral, usando a paleta vinho/marfim do Vacatio.

### Fluxo do Usuário

1. Acessar via Ferramentas → "Gerador de Post"
2. Selecionar lei (ex: CLT, CP, CF/88)
3. Selecionar artigo específico
4. Clicar "Gerar Carrossel"
5. A IA gera o conteúdo (título viral, slides explicativos, CTA final)
6. Preview dos slides renderizados em canvas
7. Botão para baixar cada slide como PNG ou todos como ZIP

### Edge Function: novo modo `carrossel_post` na `assistente-juridica`

Recebe `{ mode: 'carrossel_post', tabelaNome, artigoNumero }` e retorna JSON com:

```json
{
  "titulo_viral": "CLT na OAB: O que você não pode confundir!",
  "slides": [
    {
      "tipo": "capa",
      "titulo": "CLT na OAB: O que você não pode confundir!",
      "subtitulo": "Art. 2º e Art. 3º"
    },
    {
      "tipo": "comparacao",
      "titulo_esquerda": "EMPREGADOR (Art. 2º)",
      "itens_esquerda": ["Assume os riscos...", "Dirige a prestação..."],
      "titulo_direita": "EMPREGADO (Art. 3º)",
      "itens_direita": ["Pessoa Física", "Não Eventualidade", ...]
    },
    {
      "tipo": "destaque",
      "titulo": "Nota de Alerta Jurídico",
      "texto": "Responsabilidade solidária..."
    },
    {
      "tipo": "cta",
      "texto_engajamento": "Você já domina os requisitos...",
      "texto_salvar": "Salve para revisar antes da prova!"
    }
  ]
}
```

### Frontend: `src/pages/GeradorPost.tsx`

- Seletor de lei + artigo (reutilizando `LEIS_CATALOG` e `fetchArtigosLei`)
- Renderização dos slides via **HTML/CSS com refs** + `html2canvas` para exportar PNG (mesma lib já usada no MindMapPdfExport)
- Dimensão de cada slide: **1080×1350px** (ratio 4:5 Instagram)
- Paleta: fundo marfim `hsl(40, 15%, 92%)`, textos vinho `hsl(340, 55%, 12%)`, acentos dourados `#B8860B`
- Logo Vacatio no canto superior de cada slide
- Tipografia: serif para títulos (Georgia/Playfair), sans para corpo

### Formato Visual (baseado na imagem de referência)

- **Slide 1 (Capa)**: Título viral grande, ícone temático, nome da lei
- **Slides 2-4 (Conteúdo)**: Colunas comparativas, bullet points com ícones, destaques em cards dourados
- **Slide Final (CTA)**: Pergunta de engajamento + "Salve para revisar"

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| `src/pages/GeradorPost.tsx` | Nova página com seletor + renderizador de slides + export PNG |
| `src/pages/Ferramentas.tsx` | Adicionar item "Gerador de Post" na lista |
| `src/App.tsx` | Rota `/gerador-post` |
| `supabase/functions/assistente-juridica/index.ts` | Novo modo `carrossel_post` com prompt especializado |

### Detalhes Técnicos

- `html2canvas` já é dependência do projeto (usada em `MindMapPdfExport.ts`)
- Cada slide é um `div` oculto de 1080×1350px renderizado via `html2canvas` com `scale: 2` para alta resolução
- O download usa `canvas.toBlob()` → `URL.createObjectURL()` → link download
- O prompt da IA instrui a gerar exatamente 4-6 slides em formato JSON estruturado

