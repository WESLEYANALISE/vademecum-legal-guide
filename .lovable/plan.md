

## Plano: Auditoria de Compatibilidade Cross-Browser + iFrame + Auth

### Problemas Identificados

**1. Sem polyfills para navegadores antigos**
O projeto usa `target: ES2020` e Vite sem nenhum plugin de compatibilidade. Safari 12-14 (iOS antigo), Chrome antigo e navegadores WebView podem quebrar com syntax moderna (optional chaining, nullish coalescing, etc).

**2. Auth quebra em iFrame (Safari ITP)**
O Supabase client usa `localStorage` para sessão. Em iFrames no Safari, o ITP (Intelligent Tracking Prevention) bloqueia acesso a cookies e storage de terceiros, fazendo a autenticação falhar silenciosamente.

**3. Sem meta tags de compatibilidade**
Faltam tags essenciais como `X-UA-Compatible` e `apple-mobile-web-app-capable` no `index.html`.

**4. Sem `.browserslistrc`**
O projeto não declara quais navegadores suporta.

---

### O que será feito

**1. Instalar `@vitejs/plugin-legacy` para compatibilidade cross-browser**

Plugin oficial do Vite que gera bundles separados para navegadores modernos e antigos:

- Targets: `chrome >= 64, safari >= 12, firefox >= 67, edge >= 79, iOS >= 12`
- `modernPolyfills: true` — injeta polyfills para navegadores modernos que faltam APIs
- Gera automaticamente um bundle legado com Babel + SystemJS para navegadores que não suportam ESM

**2. Configurar Supabase Auth para funcionar em iFrame**

Trocar o `storage` do Supabase client para um wrapper que tenta `localStorage` primeiro e faz fallback para `memoryStorage` se bloqueado (Safari iFrame). Adicionar também:
- `flowType: 'pkce'` — mais seguro e funciona melhor cross-origin
- `detectSessionInUrl: true`

**3. Adicionar meta tags de compatibilidade no `index.html`**

```html
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="format-detection" content="telephone=no" />
```

**4. Criar `.browserslistrc` na raiz**

```text
chrome >= 64
safari >= 12
firefox >= 67
edge >= 79
iOS >= 12
```

**5. Adicionar `terser` como dependência**

O `@vitejs/plugin-legacy` precisa do `terser` para minificar o bundle legado.

---

### Detalhes Técnicos

**`vite.config.ts`** — adicionar plugin legacy:
```typescript
import legacy from '@vitejs/plugin-legacy';

plugins: [
  react(),
  legacy({
    targets: ['chrome >= 64', 'safari >= 12', 'firefox >= 67', 'edge >= 79', 'iOS >= 12'],
    modernPolyfills: true,
  }),
  mode === 'development' && componentTagger(),
].filter(Boolean),
```

**`src/integrations/supabase/client.ts`** — storage com fallback:
```typescript
const safeStorage = (() => {
  try {
    localStorage.setItem('__test__', '1');
    localStorage.removeItem('__test__');
    return localStorage;
  } catch {
    // Fallback para memory storage (iFrame Safari ITP)
    const store: Record<string, string> = {};
    return {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; },
    };
  }
})();

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: safeStorage,
    persistSession: true,
    autoRefreshToken: true,
    flowType: 'pkce',
    detectSessionInUrl: true,
  }
});
```

### Arquivos

| Arquivo | Ação |
|---------|------|
| `vite.config.ts` | Adicionar `@vitejs/plugin-legacy` |
| `src/integrations/supabase/client.ts` | Storage com fallback + PKCE |
| `index.html` | Meta tags de compatibilidade |
| `.browserslistrc` | Criar com targets |
| `package.json` | Instalar `@vitejs/plugin-legacy` e `terser` |

