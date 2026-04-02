

## Plano: Corrigir extração de datas com sufixo ordinal na Resenha Diária

### Problema
O HTML do Planalto usa datas com sufixo ordinal: **"1º de abril de 2026"**. A regex de extração de datas espera `(\d{1,2})\s+de`, que não reconhece o `º` após o número. Resultado: nenhuma data é encontrada → nenhum ato é extraído → "No atos found".

Dados de março funcionavam porque usavam "28 de março", "31 de março" (sem ordinal). Mas "1º de abril" falha.

### Correção

**Arquivo:** `supabase/functions/scrape-resenha-diaria/index.ts`

1. **Regex de extração de datas (linha 85):** Adicionar `[ºª°]?` após `\d{1,2}` para aceitar sufixos ordinais:
   - De: `(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})`
   - Para: `(\d{1,2})[ºª°]?\s+de\s+(\w+)\s+de\s+(\d{4})`

2. **Regex de normalização (linha 34):** Mesma correção na função `normalizeDateToISO`:
   - De: `(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})`
   - Para: `(\d{1,2})[ºª°]?\s+de\s+(\w+)\s+de\s+(\d{4})`

3. **Deploy + invocar** a edge function para popular os dados de abril.

### Resultado esperado
As leis de 1º de abril (Decreto 12.918, Lei 15.371, Lei 15.370, Lei 15.369, Decreto 12.917) aparecerão na página "Leis do Dia".

