

## Plano: Monitoramento Diário de Alterações Legislativas

### Como funciona

Uma Edge Function nova (`monitorar-legislacao`) vai, para cada lei do catálogo:

1. Buscar o HTML atual do Planalto (`url_planalto`)
2. Parsear os artigos (reutilizando a lógica do `scrape-legislacao`)
3. Comparar com o que já está no banco (quantidade de artigos, textos dos artigos)
4. Registrar diferenças encontradas numa tabela `legislacao_alteracoes`

### Tabela nova: `legislacao_alteracoes`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid PK | |
| tabela_nome | text | Ex: CP_CODIGO_PENAL |
| tipo_alteracao | text | `artigo_novo`, `artigo_revogado`, `texto_alterado`, `contagem_diferente` |
| artigo_numero | text | Ex: "Art. 121" |
| texto_anterior | text | Trecho antigo (ou null se novo) |
| texto_atual | text | Trecho novo (ou null se revogado) |
| detectado_em | timestamptz | Quando foi detectado |
| revisado | boolean | Se o admin já viu |

### Edge Function: `monitorar-legislacao`

- Recebe `{ tabela_nome, url_planalto }` opcionalmente (para rodar uma lei específica) ou roda todas
- Busca HTML do Planalto → parseia artigos
- Busca artigos atuais do banco (`SELECT numero, texto FROM tabela`)
- Compara:
  - Artigos no Planalto que não existem no banco → `artigo_novo`
  - Artigos no banco que não existem no Planalto → `artigo_revogado`
  - Artigos com texto diferente → `texto_alterado`
- Insere diferenças na tabela `legislacao_alteracoes`
- Retorna resumo: `{ total_leis_verificadas, alteracoes_encontradas, detalhes[] }`

### Cron Job

Rodar diariamente às 04:00 (horário de baixo tráfego). Processa ~5 leis por execução para não estourar timeout, com auto-enfileiramento para as demais.

### Painel no Admin

Nova seção no `AdminMonitor.tsx` ou página dedicada `/admin-monitor-leis` com:

- Lista de alterações detectadas com filtro por lei e tipo
- Badge mostrando quantidade de alterações não revisadas
- Botão "Verificar agora" para rodar manualmente uma lei específica
- Botão "Aplicar" que chama `scrape-legislacao` para atualizar o banco com a versão nova
- Botão "Ignorar" para marcar como revisado sem alterar

### Arquivos

| Arquivo | Mudança |
|---------|---------|
| Migração SQL | Criar tabela `legislacao_alteracoes` com RLS |
| `supabase/functions/monitorar-legislacao/index.ts` | Nova Edge Function com lógica de comparação |
| `src/pages/AdminMonitor.tsx` | Adicionar seção de alterações legislativas |
| Cron job SQL | Agendar execução diária |

### Detalhes Técnicos

A lógica de parsing será extraída do `scrape-legislacao` e copiada para a nova função (Edge Functions não compartilham módulos facilmente). A comparação usa normalização de whitespace antes de diff para evitar falsos positivos. Para leis grandes (CF/88, CC), o texto é comparado artigo a artigo via hash MD5 para performance.

