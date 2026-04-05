
Diagnóstico

O problema está no `src/components/estudar/QuizView.tsx`: o componente tenta achar questões prontas em `artigo_ai_cache` com `modo = 'questoes'`, mas o fluxo real de Questões usa a tabela `study_questions` (isso já está consistente na edge function `supabase/functions/gerar-estudo/index.ts`).  
Resultado: o cache local sempre “falha”, o componente entra em `generating = true` e mostra “Gerando questões com IA...” mesmo quando o artigo já foi gerado antes.

Plano de ajuste

1. Corrigir a fonte do cache no `QuizView`
- Trocar a leitura de `artigo_ai_cache` por `study_questions`.
- Ler o campo `questions` diretamente, sem `JSON.parse`, porque ele já vem como JSON.

2. Ir direto para o countdown quando já existir cache
- Se `study_questions.questions` vier com array válido, preencher `questions`, desligar loading e iniciar `setCountdown(3)` imediatamente.
- Nesse caminho, não ativar `generating`.

3. Mostrar “Gerando com IA” só quando realmente estiver gerando
- Só ativar `generating` depois de confirmar que não há cache em `study_questions`.
- Manter a invoke de `gerar-estudo` apenas nesse cenário.

4. Adicionar uma proteção extra com o retorno da edge function
- Aproveitar `res.data?.cached` da `gerar-estudo` como fallback de segurança.
- Se por algum motivo a função devolver conteúdo já cacheado, pular qualquer estado visual de geração e ir direto para `3, 2, 1`.

5. Resetar estados transitórios ao abrir outro artigo
- Ao carregar um novo artigo, resetar `countdown`, `currentIdx`, `answered`, `results` e `finished`.
- Isso evita resquícios visuais entre uma tentativa e outra.

6. Pequeno cleanup visual no mesmo arquivo
- Ajustar o texto do artigo na tela de loading/countdown para evitar casos como `Art. Art. 1`, já que o número parece vir prefixado em alguns cenários.

Escopo técnico

Arquivo principal:
- `src/components/estudar/QuizView.tsx`

Sem necessidade de alterar:
- `supabase/functions/gerar-estudo/index.ts` (o backend já está lendo e salvando em `study_questions` corretamente)

Resultado esperado

- Artigos já gerados, como o art. 1 do Código Penal, não mostrarão mais “Gerando questões com IA...”.
- Ao abrir novamente, irão direto para `3, 2, 1, Praticar`.
- A animação de geração ficará restrita apenas a artigos realmente inéditos, sem cache.

Validação

- Abrir um artigo já gerado: deve entrar direto no countdown.
- Abrir um artigo nunca gerado: pode mostrar geração, depois countdown.
- Reabrir o primeiro artigo logo em seguida: não deve mais aparecer a animação de IA.
