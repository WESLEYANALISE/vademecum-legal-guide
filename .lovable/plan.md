

## Plano: Checkout Interno com Cartão, PIX e Parcelamento

### O que muda

Em vez de redirecionar para o Asaas, o app terá sua própria tela de checkout (igual à imagem de referência). O pagamento será processado via API direta do Asaas.

### Regras de negócio

- **Mensal (R$ 21,90)**: Apenas cartão de crédito. Assinatura recorrente (MONTHLY). Sem opção de parcelas nem PIX.
- **Anual (R$ 119,90)**: Cartão de crédito + PIX.
  - Cartão: permite parcelamento de 2x a 12x (valor da parcela = R$ 119,90 / nº parcelas).
  - PIX: pagamento à vista, exibe QR Code + código copia-e-cola.

### Fluxo

```text
Tela Assinatura (planos)
  └─ Clica "Assinar Mensal" ou "Assinar Anual"
       └─ Abre tela de Checkout interna
            ├─ Abas: [Cartão] [PIX] (PIX só aparece no anual)
            │
            ├─ Formulário Cartão:
            │   ├─ Número do cartão
            │   ├─ Nome no cartão
            │   ├─ Validade (MM/AA) + CVV
            │   ├─ CPF do titular
            │   ├─ CEP → busca ViaCEP → preenche endereço
            │   ├─ Parcelas (dropdown, só no anual: 1x a 12x)
            │   └─ Botão "Pagar R$ XX,XX"
            │
            └─ Tela PIX (só anual):
                ├─ QR Code (imagem base64)
                ├─ Código copia-e-cola
                └─ Polling de status até confirmar
```

### Implementação

**1. Nova Edge Function `processar-pagamento`**

Substitui a lógica atual de `criar-assinatura`. Recebe os dados do checkout e processa o pagamento diretamente na API do Asaas:

- Cria/reutiliza o customer no Asaas (com CPF, email, postalCode, addressNumber)
- **Mensal + Cartão**: `POST /v3/subscriptions` com `billingType: CREDIT_CARD`, `cycle: MONTHLY`, passando `creditCard` e `creditCardHolderInfo`
- **Anual + Cartão à vista**: `POST /v3/payments` com `billingType: CREDIT_CARD`, passando `creditCard` e `creditCardHolderInfo`
- **Anual + Cartão parcelado**: `POST /v3/payments` com `installmentCount` e `totalValue: 119.90`
- **Anual + PIX**: `POST /v3/payments` com `billingType: PIX`, depois `GET /v3/payments/{id}/pixQrCode` para obter QR Code

Campos obrigatórios para o Asaas `creditCardHolderInfo`:
- `name`, `email`, `cpfCnpj`, `postalCode`, `addressNumber`, `phone`

O `remoteIp` do cliente é enviado pelo frontend (via header ou body).

**2. Tela de Checkout (`src/pages/Assinatura.tsx`)**

Ao clicar em "Assinar", navega para uma view de checkout (dentro do mesmo componente, usando estado):

- **Abas Cartão / PIX** (PIX oculta no mensal)
- Formulário com máscara para cartão (XXXX XXXX XXXX XXXX), CPF (XXX.XXX.XXX-XX), CEP (XXXXX-XXX)
- CEP consulta `viacep.com.br/ws/{cep}/json/` e preenche cidade/estado/rua automaticamente
- Seletor de parcelas (1x a 12x) para plano anual com cartão — exibe valor por parcela
- No PIX: exibe QR Code como imagem + campo copiável do payload, com polling a cada 5s no status do pagamento
- Rodapé: "Criptografia SSL · Asaas"

**3. Cálculo de parcelas**

O Asaas não cobra juros do comprador no parcelamento padrão — a taxa é do lojista. Então as parcelas serão sem juros para o usuário:
- 1x = R$ 119,90
- 2x = R$ 59,95
- ...
- 12x = R$ 9,99

### Detalhes técnicos

- O `remoteIp` do cliente é capturado no frontend e enviado ao edge function (obrigatório para pagamentos com cartão no Asaas)
- O CEP é consultado via `fetch('https://viacep.com.br/ws/{cep}/json/')` direto do frontend
- O status do pagamento PIX usa polling (`GET /v3/payments/{id}`) verificando se `status === 'RECEIVED'`
- Os dados do cartão nunca são armazenados — passam direto para o Asaas via edge function

### Arquivos

| Arquivo | Ação |
|---------|------|
| `supabase/functions/processar-pagamento/index.ts` | Nova EF: cria customer, processa cartão/PIX, retorna resultado |
| `src/pages/Assinatura.tsx` | Reescrever com tela de checkout integrada (formulário cartão, PIX, parcelas) |
| `supabase/functions/criar-assinatura/index.ts` | Será substituída pela nova função |

