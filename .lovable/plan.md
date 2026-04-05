

## Plano: Geração Global com Cron Job Persistente

### Problema Atual
A geração roda no navegador (client-side). Se o usuário fechar a aba, tudo para. Não há visão consolidada de pendências globais.

### Solução

Criar um sistema server-side com uma tabela de controle + edge function que se auto-invoca até processar tudo.

### Arquitetura

```text
┌─────────────┐    ┌──────────────────┐    ┌────────────────────┐
│  UI (Admin)  │───▶│ geracao_global    │◀──▶│ EF: gerar-global   │
│  Botão Play  │    │ (tabela status)  │    │ (processa 1 item,  │
│  + progresso │    │                  │    │  re-invoca a si)   │
└─────────────┘    └──────────────────┘    └────────────────────┘
```

### 1. Nova tabela: `geracao_global`

```sql
create table public.geracao_global (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'idle', -- idle | running | paused | done
  modos text[] not null default '{"explicacao","exemplo","termos","quiz","flashcard","grifos"}',
  total_pendentes int not null default 0,
  total_processadas int not null default 0,
  total_erros int not null default 0,
  current_tabela text,
  current_artigo text,
  current_modo text,
  started_at timestamptz,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);
-- Apenas 1 linha (singleton)
insert into geracao_global (id) values (gen_random_uuid());
```

### 2. Nova Edge Function: `gerar-global`

- **POST com action: "start"** → Calcula total pendente (todas as leis × modos, menos o que já existe em `artigo_ai_cache`), atualiza a tabela para `running`, e se auto-invoca para processar o primeiro item.
- **POST com action: "stop"** → Atualiza status para `paused`.
- **POST com action: "tick"** → Pega o próximo item pendente (query: artigos sem cache para o modo atual), gera via Gemini, salva no `artigo_ai_cache`, incrementa `total_processadas`, atualiza `current_*`. Se status ainda for `running`, se auto-invoca novamente (com delay de 2s). Se não houver mais pendentes, marca `done`.
- **GET** → Retorna o estado atual da tabela.

A auto-invocação usa `fetch` para chamar a si mesma, garantindo que o processamento continua mesmo sem o navegador aberto.

### 3. UI no GeracaoAdmin

Adicionar um card "Geração Global" acima da lista de leis com:
- Total pendente / total processado / erros
- Barra de progresso
- Indicação do item atual (lei + artigo + modo)
- Botão **Iniciar** (chama `gerar-global` com action: "start")
- Botão **Parar** (chama com action: "stop")
- Polling a cada 3s via `useQuery` + `refetchInterval` para atualizar o progresso em tempo real
- Se o usuário sair e voltar, o polling mostra o progresso atual do cron que continua rodando no servidor

### 4. Lógica do "tick"

```text
1. SELECT status FROM geracao_global → se não for 'running', para
2. Para cada tabela no catálogo, para cada modo:
   - Busca 1 artigo que NÃO tenha cache (LEFT JOIN artigo_ai_cache)
   - Se encontrar, gera o conteúdo, salva, atualiza contadores
   - Se auto-invoca com action: "tick"
   - return
3. Se nenhum pendente encontrado → status = 'done'
```

### Arquivos

| Arquivo | Ação |
|---------|------|
| Migration SQL | Criar tabela `geracao_global` |
| `supabase/functions/gerar-global/index.ts` | Nova edge function com start/stop/tick |
| `src/pages/GeracaoAdmin.tsx` | Adicionar card de Geração Global com controles e polling |

