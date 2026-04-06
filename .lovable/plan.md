

## Por que as leis do dia 6 não apareceram

**Diagnóstico:**

1. **O cron nunca executou.** Os logs da edge function `scrape-resenha-diaria` estão vazios — nenhuma execução recente. O `supabase/config.toml` define o schedule como `"0 11,21 * * *"` (8h e 18h Brasília), mas o cron do Supabase depende de `pg_cron` + `pg_net` configurados corretamente e da função estar deployada com o schedule ativo. É provável que o cron nunca tenha sido ativado via SQL (`cron.schedule`).

2. **Os dados mais recentes no banco são de 2 de abril** (`data_dou: 2026-04-02`), inseridos em 4 de abril. As leis do dia 6 (Lei 15.377, 15.376, 15.375, Decreto 12.919) estão no site do Planalto mas nunca foram coletadas.

3. **O `config.toml` schedule NÃO cria cron jobs automaticamente** em projetos Supabase externos — ele só funciona no CLI local. Para o Supabase hospedado, é preciso criar o job via SQL usando `cron.schedule` + `net.http_post`.

## Plano

### 1. Criar cron job real via SQL

Usar `pg_cron` + `pg_net` para chamar a edge function a cada 3 horas, começando às 4h Brasília (7h UTC): `0 7,10,13,16,19,22 * * *`

```sql
select cron.schedule(
  'scrape-resenha-diaria-3h',
  '0 7,10,13,16,19,22 * * *',
  $$
  select net.http_post(
    url:='https://akaeinqkhdwzopfsckgg.supabase.co/functions/v1/scrape-resenha-diaria',
    headers:='{"Content-Type":"application/json","Authorization":"Bearer <anon_key>"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);
```

### 2. Atualizar `supabase/config.toml`

Mudar o schedule para refletir a nova frequência (documentação):
```
[functions.scrape-resenha-diaria]
schedule = "0 7,10,13,16,19,22 * * *"
```

### 3. Executar manualmente agora

Chamar a edge function via `curl_edge_functions` para trazer as leis do dia 6 imediatamente.

### Arquivos

| Arquivo | Ação |
|---------|------|
| SQL (via insert tool) | Criar cron job `pg_cron` real |
| `supabase/config.toml` | Atualizar schedule para 3h |

