

## Plano: Compressão Real com TinyPNG (Resize + Convert)

### Problema

A função atual faz `/shrink` (compressão lossless) e depois converte para WebP, mas **não redimensiona**. Uma capa de 1500x2000px continua enorme — só muda o formato. O site que você testou (176KB → 32KB = -82%) aplica **resize + compress + convert** juntos.

Pela documentação do TinyPNG, resize e convert podem ser combinados no mesmo POST ao `output URL`:

```text
POST /output/xxxxx
{
  "resize": { "method": "fit", "width": 800, "height": 1200 },
  "convert": { "type": "image/webp" }
}
```

Cada operação (resize, convert) conta como 1 compressão extra. Então: upload + resize + convert = 3 créditos por imagem.

### Mudanças na Edge Function `comprimir-imagens`

1. Após o `/shrink`, fazer um único POST ao `outputUrl` combinando `resize` + `convert` na mesma chamada (2 créditos em vez de 3)
2. Para imagens que já são WebP: aplicar apenas `resize` (sem convert)
3. Pular arquivos menores que 5KB
4. Usar `method: "fit"` com `width: 800, height: 1200` — suficiente para telas mobile (390px) e tablets

### Resultado esperado

De ~176KB para ~30-40KB (70-85% de redução), igual ao site que você testou.

### Arquivo a alterar

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/comprimir-imagens/index.ts` | Combinar resize+convert no POST ao output URL; skip <5KB; tratar WebP existente |

