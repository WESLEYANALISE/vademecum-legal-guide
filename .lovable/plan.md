

## Plano: Cache Agressivo Nível 3 — Biblioteca Instantânea

### O que é o "Nível 3"

Combinação de 3 camadas de cache para que a Biblioteca abra instantaneamente, mesmo após fechar e reabrir o app:

1. **Cache de dados em localStorage** — Os 4 catálogos de livros (clássicos, liderança, estudos, fora da toga) são salvos localmente. Na próxima visita, renderiza imediatamente com os dados salvos enquanto atualiza em background.

2. **Pré-carregamento de capas** — Assim que os dados chegam, as URLs das capas são pré-carregadas no cache do navegador usando `new Image()` em batch (10 por vez), para que quando o usuário scrollar, as imagens já estejam prontas.

3. **Service Worker para cache persistente de imagens** — Um Service Worker intercepta todas as requisições de imagem do Supabase Storage e as guarda no Cache API do navegador. Na segunda visita, as capas carregam do disco local (0ms de rede). Funciona inclusive offline.

### Como funciona para o usuário

```text
1ª visita: Dados vêm do Supabase → salva no localStorage + pré-carrega capas
2ª visita: Renderiza INSTANTANEAMENTE do localStorage → atualiza em background
           Capas carregam do cache do Service Worker (sem rede)
```

### Detalhes Técnicos

**Cache de dados (localStorage):**
- Chave: `vacatio_biblioteca_cache`
- Salva: `{ classicos, lideranca, estudos, foraDaToga, timestamp }`
- TTL: 1 hora (após isso, ainda mostra o cache mas busca dados novos)
- No `useEffect`, primeiro lê do localStorage e popula os estados. Depois faz o fetch normal e atualiza.

**Pré-carregamento de capas:**
- Função `preloadCovers(urls: string[])` que carrega em batches de 10
- Executada após os dados chegarem (tanto do cache quanto do fetch)

**Service Worker (com guards de segurança):**
- Arquivo `public/sw-cache.js` — intercepta apenas URLs de imagem do Supabase Storage
- Estratégia: Cache-First (se tem no cache, usa; senão busca e guarda)
- Registrado apenas em produção (NÃO em iframes do Lovable preview)
- Guard em `main.tsx`: não registra se `window.self !== window.top` ou se hostname contém `id-preview--`

### Arquivos a Alterar

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Biblioteca.tsx` | Ler/salvar dados no localStorage; pré-carregar capas |
| `public/sw-cache.js` | Novo: Service Worker cache-first para imagens Supabase |
| `src/main.tsx` | Registrar SW com guards de segurança |

