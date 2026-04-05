
Do I know what the issue is? Sim.

Diagnóstico confirmado
- A Geração Global não está “girando” de forma persistente. Hoje ela depende de um loop no navegador em `src/pages/GeracaoAdmin.tsx` (`useEffect` com `while`), então não é um cron real. Se a aba parar/recarregar, o motor para.
- O worker está travando no mesmo item: `CF88_CONSTITUICAO_FEDERAL → Art. 64 [explicacao]`.
- Evidência lida no projeto:
  - Network: o `POST /functions/v1/gerar-global` respondeu `{ "rateLimited": true }`.
  - Logs da edge function: 3 respostas seguidas `Gemini 429` e depois `[tick] Rate limited`.
  - Banco: `geracao_global` continua com `total_processadas = 0`, `current_artigo = Art. 64`.
  - Cache: não existe registro salvo para `CF88 / Art. 64 / explicacao`.
- Ou seja: ele tenta o mesmo item, toma 429, volta sem avançar, e a fila fica aparentemente congelada.
- Há mais 3 problemas estruturais:
  1. `supabase/config.toml` não agenda `gerar-global`, então não existe cron real para manter a fila viva.
  2. O `tick` usa `.limit(200)`, então artigos acima do 200º podem nunca entrar na fila.
  3. A fila global cobre só 4 modos (`explicacao`, `exemplo`, `termos`, `sugerir_perguntas`), mas o painel exibe mais categorias; então “global” hoje não corresponde a “todas as funções”.

Plano de correção
1. Tornar a fila realmente server-side
- Remover a responsabilidade do frontend de ficar chamando `tick` em loop.
- Deixar o frontend apenas iniciar, pausar e consultar status.
- Agendar `gerar-global` via cron/schedule do projeto para rodar sozinho no servidor.

2. Reescrever o `gerar-global` para não travar no mesmo artigo
- Trocar o algoritmo atual por um cursor real de progresso.
- Processar o próximo item de forma determinística, sem depender do “primeiro uncached dentro dos 200 primeiros”.
- Ao tomar 429, salvar `cooldown_until` e sair.
- Na próxima execução agendada, respeitar esse cooldown e retomar automaticamente.
- Após algumas falhas no mesmo item, marcar erro e avançar para o próximo, em vez de bloquear a fila inteira.

3. Ampliar a tabela `geracao_global`
- Adicionar campos de controle como:
  - `cooldown_until`
  - `retry_count`
  - `last_error`
  - `last_success_at`
  - cursor/ponteiro do item atual
- Em “Retomar”, não resetar tudo para zero; recalcular pendências com base no cache já existente.

4. Alinhar escopo da fila com o painel
- Decidir quais modos entram de fato na Geração Global.
- Corrigir a inconsistência entre o card global e as categorias exibidas no admin.
- Se a intenção é “todas as funções de todas as leis”, expandir a fila para os modos reais do app, não só os 4 atuais.

5. Melhorar a visibilidade no admin
- Mostrar estados claros:
  - Rodando
  - Em cooldown por limite da IA
  - Pausado
  - Concluído
  - Com erro
- Exibir item atual, último erro e próxima tentativa.
- Assim o painel deixa de parecer travado quando estiver só aguardando o cooldown.

Arquivos
- `src/pages/GeracaoAdmin.tsx` — remover loop client-side e manter só controles + polling de status.
- `supabase/functions/gerar-global/index.ts` — reescrever o worker com cursor, cooldown e avanço seguro.
- `supabase/config.toml` — adicionar agendamento real da função.
- `supabase/migrations/...sql` — evoluir `geracao_global` para retries/cooldown/erro/cursor.

Resultado esperado
- O Art. 64 deixa de bloquear a fila inteira.
- Mesmo com 429, a fila entra em espera e volta a andar sozinha.
- Fechar ou recarregar a página não interrompe o processamento.
- O progresso mostrado no admin passa a refletir atividade real e contínua.
