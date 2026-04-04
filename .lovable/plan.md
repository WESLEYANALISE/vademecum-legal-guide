

## Plano: Compressão Paralela — Máximo de Imagens por Vez

### Situação Atual

O batch processa **1 imagem por vez** — o loop faz `await compressFile(file)` sequencialmente. Para 100 imagens, são 100 chamadas sequenciais.

### Solução

Processar **5 imagens em paralelo** no frontend usando `Promise.all` em lotes (chunks). Isso é seguro porque:
- Cada chamada à Edge Function é independente
- O TinyPNG suporta requisições paralelas (rate limit generoso)
- 5 paralelas = ~5x mais rápido sem arriscar 429

Não vamos além de 5 porque a Edge Function do Supabase tem limites de concorrência e cada chamada faz download + upload + 2 requests ao TinyPNG.

### Mudanças

| Arquivo | Mudança |
|---------|---------|
| `src/pages/CompressaoImagens.tsx` | Alterar `compressBatch` para processar em chunks de 5 com `Promise.all`; mostrar progresso (ex: "12/47") |

### Lógica do batch paralelo

```text
pending = [img1, img2, ..., img47]

chunk1 = [img1..img5]  → Promise.all → 5 simultâneas
chunk2 = [img6..img10] → Promise.all → 5 simultâneas
...
chunk10 = [img46..img47] → Promise.all → 2 simultâneas
```

Adicionar contador de progresso visível: "Comprimindo 12 de 47..."

