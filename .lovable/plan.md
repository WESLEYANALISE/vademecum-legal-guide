
Objetivo: corrigir de vez o rodapé do artigo para que os botões Narrar, Estudar, Praticar, Anotações e Perguntar apareçam sempre no bottom sheet.

Diagnóstico
- O problema está em `src/components/vademecum/ArtigoBottomSheet.tsx`.
- O rodapé hoje está renderizado como `absolute bottom-0 ...` fora da cadeia principal de layout do `Tabs`.
- Ao mesmo tempo, a aba `artigo` tem rolagem dupla:
  - `TabsContent` com `overflow-y-auto`
  - um container interno com `h-full overflow-y-auto`
- Essa combinação faz o conteúdo ocupar toda a altura útil e o rodapé acabar sendo empurrado/clippado na borda inferior do sheet.

Implementação
1. Reestruturar o layout do sheet
- Manter o container principal do sheet como `flex flex-col`.
- Ajustar o `Tabs` para `flex-1 min-h-0 flex flex-col overflow-hidden`.
- Colocar o rodapé de ações como irmão direto do `Tabs`, dentro do mesmo sheet, usando `shrink-0` em vez de `absolute`.

2. Simplificar a rolagem da aba artigo
- Deixar apenas uma área scrollável real.
- Manter `TabsContent value="artigo"` como a área de rolagem principal com `flex-1 min-h-0 overflow-y-auto`.
- Remover do container interno do artigo o `h-full overflow-y-auto`, deixando-o como wrapper normal.
- Preservar `pb-24` ou equivalente para respiro visual acima do rodapé/FABs.

3. Ajustar o rodapé
- Trocar:
  - `absolute bottom-0 left-0 right-0 ...`
- Por algo no fluxo:
  - `shrink-0 border-t ...`
- Manter safe area no mobile:
  - `pb-[env(safe-area-inset-bottom)]`
- Manter o mesmo visual e os mesmos botões, sem mudar o comportamento funcional.

4. Ajustar FABs flutuantes
- Como o rodapé voltará a ocupar espaço real, revisar o offset dos FABs:
  - hoje usam `bottom-20` no tab artigo
- Ajustar para não sobrepor o novo rodapé visível.

Arquivos a editar
- `src/components/vademecum/ArtigoBottomSheet.tsx`

Resultado esperado
- Ao abrir qualquer artigo em `/legislacao/codigo`, o rodapé aparece fixo dentro do sheet.
- Os botões Narrar, Estudar, Praticar, Anotações e Perguntar ficam sempre visíveis na aba “Artigo”.
- A rolagem do texto continua funcionando sem esconder o rodapé.

Detalhe técnico
```text
Antes
Sheet
├─ Header
├─ Tabs
│  └─ TabsContent (scroll)
│     └─ inner div (scroll)
└─ Footer absolute (fora do fluxo visual)

Depois
Sheet (flex column)
├─ Header
├─ Tabs (flex-1 min-h-0 overflow-hidden)
│  └─ TabsContent artigo (scroll único)
└─ Footer shrink-0 (visível no fluxo)
```
