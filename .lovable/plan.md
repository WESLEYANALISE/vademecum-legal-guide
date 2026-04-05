

## Plano: Otimização para Deploy na Vercel

### Visão Geral

Configurar o projeto Vite/React SPA para funcionar perfeitamente na Vercel, com deep linking, analytics, speed insights e headers de cache otimizados.

### O que será feito

**1. Arquivo `vercel.json` (SPA Rewrites + Headers de Cache)**

Criar o arquivo na raiz do projeto com:
- Rewrite de todas as rotas para `index.html` (essencial para SPA com React Router)
- Headers de cache para assets estáticos (JS, CSS, imagens, fontes) com `max-age` de 1 ano (imutáveis pois Vite gera hashes nos nomes)
- Header `X-Content-Type-Options: nosniff` para segurança

**2. Instalar `@vercel/analytics`**

Pacote oficial para rastrear visitantes, pageviews e origens de tráfego no dashboard da Vercel. Gratuito em todos os planos.

- Instalar o pacote
- Adicionar `<Analytics />` no `App.tsx`

**3. Instalar `@vercel/speed-insights`**

Pacote que coleta métricas de Core Web Vitals (LCP, FID, CLS, TTFB) dos usuários reais e exibe no dashboard.

- Instalar o pacote
- Adicionar `<SpeedInsights />` no `App.tsx`

### Detalhes Técnicos

**`vercel.json`** (novo arquivo na raiz):
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/sw-cache.js",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache" }
      ]
    }
  ]
}
```

**`App.tsx`** — adicionar no componente `App`:
```tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

// Dentro do JSX do App:
<Analytics />
<SpeedInsights />
```

### Arquivos

| Arquivo | Ação |
|---------|------|
| `vercel.json` | Criar — rewrites SPA + headers de cache |
| `src/App.tsx` | Adicionar componentes Analytics e SpeedInsights |
| `package.json` | Instalar `@vercel/analytics` e `@vercel/speed-insights` |

