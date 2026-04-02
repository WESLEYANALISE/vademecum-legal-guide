

## Auditoria Completa do Vacatio — Diagnóstico e Melhorias

### 1. PROBLEMAS ENCONTRADOS

#### 1.1 API Keys Quebradas (URGENTE)
- **TinyPNG (TINIFY_API_KEY)**: Retorna 401 "Credentials are invalid" em todas as chamadas. A Edge Function `otimizar-imagem` falha em 100% das requisições e faz fallback lento para wsrv.nl.
- **Browserless (BROWSERLESS_API_KEY)**: Também inválida — impede scraping avançado. Já mitigado para notícias (fetch direto), mas outras funções que dependam dela vão falhar.
- **Impacto**: Todas as imagens que passam por `cdnImg()` (fora notícias) sofrem latência extra desnecessária.

#### 1.2 Notícias sem Conteúdo (73 de 194)
- 63 das 85 notícias do Migalhas estão com `conteudo` vazio — a correção recente do scraper provavelmente só se aplicou às novas inserções. As 63 antigas permanecem vazias.
- 10 notícias da Câmara também sem conteúdo.
- **Solução**: Criar uma action de "re-scrape" que busca o conteúdo das notícias existentes que estão vazias.

#### 1.3 Segurança — 39 Alertas do Linter
- **1 ERROR**: View `v_leis_catalogo` com SECURITY DEFINER — executa com permissões do criador, não do usuário.
- **36 WARN**: Políticas RLS com `USING (true)` ou `WITH CHECK (true)` — são as tabelas de legislação (dados públicos), então é **aceitável** para SELECT, mas INSERT/UPDATE/DELETE com `true` em tabelas como `radar_*`, `artigo_ai_cache`, `sumulas` permite que qualquer usuário autenticado modifique dados administrativos.
- **1 WARN**: Leaked password protection desativada.

#### 1.4 Índices Faltando
- `study_sessions` não tem índice em `user_id` — vai ficar lento quando houver muitos usuários.
- `noticias_camara` não tem índice em `data_publicacao` — a query principal ordena por essa coluna.
- `radar_proposicoes` com 8.334 linhas sem índice otimizado para buscas por tema/data.

#### 1.5 Duplicidade de Índice
- `artigo_ai_cache` tem DOIS índices unique equivalentes (`artigo_ai_cache_tabela_artigo_modo_uniq` e `artigo_ai_cache_tabela_nome_artigo_numero_modo_key`). Um pode ser removido.

### 2. MELHORIAS PROPOSTAS

#### 2.1 Eliminar `otimizar-imagem` para Imagens Públicas
A Edge Function `otimizar-imagem` é um proxy que sempre falha (TinyPNG 401). Já temos `newsImg()` para notícias. Proposta: criar um `cdnImg()` que vá direto ao `wsrv.nl` (igual ao `newsImg`), eliminando completamente a dependência do TinyPNG para uso geral. Mantém a Edge Function apenas se o TinyPNG for renovado.

#### 2.2 Re-scrape de Conteúdo Vazio
Adicionar uma action na Edge Function `scrape-noticias` que aceite `mode: "fill_empty"` — busca apenas notícias com conteúdo vazio e tenta extrair novamente.

#### 2.3 Segurança do Banco
- Restringir INSERT/UPDATE/DELETE nas tabelas administrativas (`artigo_ai_cache`, `narracoes_artigos`, `radar_*`, `sumulas`, `noticias_camara`, `resenha_diaria`) para `service_role` apenas (via `auth.role() = 'service_role'`).
- Manter SELECT público para dados de legislação (é o propósito do app).
- Habilitar Leaked Password Protection no dashboard Supabase.
- Corrigir a view `v_leis_catalogo` para usar SECURITY INVOKER.

#### 2.4 Índices de Performance
```text
CREATE INDEX idx_study_sessions_user ON study_sessions(user_id);
CREATE INDEX idx_noticias_data ON noticias_camara(data_publicacao DESC);
CREATE INDEX idx_radar_prop_tema ON radar_proposicoes(tema);
DROP INDEX artigo_ai_cache_tabela_nome_artigo_numero_modo_key; -- duplicado
```

#### 2.5 Dependências npm
Todas as dependências estão em versões recentes. Nenhuma está desatualizada de forma crítica. Destaques:
- `@supabase/supabase-js@2.101.1` — atualíssimo
- `react@18.3.1` — última da v18
- `vite@5.4.19` — última da v5
- Nenhuma vulnerabilidade conhecida nas versões atuais

### 3. PLANO DE IMPLEMENTAÇÃO

| Prioridade | Tarefa | Arquivos |
|------------|--------|----------|
| Alta | Trocar `cdnImg()` para ir direto ao wsrv.nl | `src/lib/cdnImg.ts` |
| Alta | Índices de performance | Migration SQL |
| Alta | Restringir RLS de tabelas admin | Migration SQL |
| Média | Re-scrape notícias vazias | `supabase/functions/scrape-noticias/index.ts` |
| Média | Corrigir view SECURITY DEFINER | Migration SQL |
| Média | Remover índice duplicado | Migration SQL |
| Baixa | Habilitar Leaked Password Protection | Dashboard Supabase (manual) |

### Detalhes Técnicos

**cdnImg.ts** — A função principal `cdnImg()` passará a usar `wsrv.nl` diretamente, igual ao `newsImg()`. Isso elimina a latência da Edge Function + TinyPNG 401 para TODAS as imagens do app.

**RLS** — As tabelas de legislação (CF88, CP, CC, etc.) mantêm SELECT público e INSERT/UPDATE/DELETE via service_role. Tabelas de dados do usuário (profiles, study_sessions, anotacoes) já estão corretas com `auth.uid()`.

**Notícias** — O modo `fill_empty` vai fazer SELECT das notícias com `conteudo = ''`, buscar o conteúdo via fetch direto e UPDATE em batch.

