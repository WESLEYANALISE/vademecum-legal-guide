
Diagnóstico confirmado

- Sim, eu sei qual é o problema.
- O backend está escrevendo status: no banco há registro recente em `cleaning:80`, então o problema não é só “não processou”.
- O que está quebrando a visualização é a combinação de 3 pontos:
  1. `src/pages/BibliotecaAdmin.tsx`: o polling é iniciado, mas o `useEffect` limpa o intervalo a cada atualização de `ebookMap` e não zera `pollRef`; depois da primeira atualização ele para de consultar.
  2. `BibliotecaAdmin` usa só `titulo` como chave e não prioriza o registro mais recente; tentativas antigas (`ready/error`) podem sobrescrever a atual.
  3. O fluxo de “retomar limpeza” existe em `BibliotecaView`, mas não no admin; se o job travar em `cleaning:*`, ele fica congelado. E hoje o `resumeCleaning()` ainda tem bug com variáveis indefinidas.

Plano de correção

1. Corrigir o polling do Admin
- Reescrever o efeito de polling para depender de `hasProcessing` e manter o intervalo vivo durante todo o processamento.
- No cleanup, limpar e também zerar `pollRef.current = null`.
- Assim a porcentagem continuará atualizando em vez de parar após a primeira leitura.

2. Fazer o status aparecer imediatamente ao clicar em “Formatar”
- Em `handleFormat`, usar o `livro_id` retornado pela Edge Function e injetar localmente o status inicial `ocr`.
- Resultado: o card já troca para progresso logo após o clique, sem esperar a próxima rodada de polling.

3. Tornar o mapeamento de status determinístico
- Em `refreshEbooks`, buscar também `created_at` e ordenar do mais recente para o mais antigo.
- Ao montar o mapa, manter só o registro mais novo por título normalizado.
- Isso evita que tentativas antigas com `error`/`ready` escondam o processamento atual.

4. Levar o auto-resume também para `BibliotecaAdmin`
- Reaproveitar a lógica já existente em `src/components/estudar/BibliotecaView.tsx`.
- Se um livro ficar tempo demais no mesmo `cleaning:*`, disparar `action: "resume"` automaticamente.
- Isso resolve o caso “começa e depois para”.

5. Corrigir a Edge Function de retomada
- Em `supabase/functions/processar-pdf/index.ts`, remover/corrigir o log quebrado de `resumeCleaning()` que usa variáveis inexistentes.
- Garantir que a retomada finalize com `ready` ou `error`, nunca falhe silenciosamente.
- Adicionar logs finais mais claros para confirmar quando a retomada concluiu.

6. Ajustar o restante do app para reconhecer todos os estados intermediários
- Em `src/pages/Biblioteca.tsx`, o “modo dinâmico” hoje só entende `processing`.
- Atualizar para também tratar `ocr`, `structuring` e `cleaning:*` como “em processamento”, evitando duplicar formatações.

Arquivos a alterar

- `src/pages/BibliotecaAdmin.tsx`
  - polling robusto
  - status otimista após clique
  - deduplicação por registro mais recente
  - auto-resume de jobs travados
- `src/components/estudar/BibliotecaView.tsx`
  - opcionalmente extrair helper compartilhado de status/resume
- `src/pages/Biblioteca.tsx`
  - reconhecer todos os status intermediários no “modo dinâmico”
- `supabase/functions/processar-pdf/index.ts`
  - corrigir `resumeCleaning()`
  - reforçar logs e finalização

Detalhes técnicos

```text
Clique em "Formatar"
  → processar-pdf retorna livro_id
  → Admin já marca localmente como ocr (10%)
  → polling contínuo busca status mais recente
  → ocr → structuring → cleaning:10/50/80 → ready
  → se travar em cleaning:* por 30s, Admin chama resume
```

Critérios de aceite

- Ao clicar em “Formatar”, o card troca imediatamente de botão para progresso.
- A porcentagem não some após a primeira atualização.
- Livros repetidos/tentativas antigas não sobrescrevem o status atual.
- Se travar em `cleaning:*`, o Admin retoma sozinho.
- No “modo dinâmico”, o usuário vê “ainda formatando” para qualquer status intermediário.
