

## Plano: Tela de Assinaturas com Asaas

### O que será construído

Uma página `/assinatura` com dois cards de plano (Mensal R$ 21,90 e Anual R$ 119,90), design premium seguindo a paleta do app. Ao escolher um plano, o usuário será redirecionado para o checkout do Asaas.

### O que preciso de você (Asaas)

Para integrar o Asaas, preciso que você forneça:

1. **API Key do Asaas** — chave de acesso à API (sandbox ou produção). Encontra-se no painel Asaas em **Configurações → Integrações → Gerar nova chave API**.
2. **Ambiente** — confirmar se vamos usar **sandbox** (testes) ou **produção**.

Com a API Key, vou criar uma Edge Function que:
- Cria o cliente no Asaas (se não existir)
- Cria a assinatura (mensal ou anual)
- Retorna o link de pagamento para o usuário

### Arquitetura

```text
┌──────────────┐    ┌─────────────────────┐    ┌──────────┐
│  Página      │───▶│ EF: criar-assinatura │───▶│ Asaas API│
│  /assinatura │    │ (cria cliente +      │    │          │
│              │◀───│  assinatura, retorna │◀───│          │
│              │    │  link pagamento)     │    │          │
└──────────────┘    └─────────────────────┘    └──────────┘
```

### Implementação

**1. Tabela `assinaturas`** — registrar assinaturas localmente:
- `user_id`, `asaas_customer_id`, `asaas_subscription_id`, `plano` (mensal/anual), `status`, `created_at`

**2. Edge Function `criar-assinatura`**
- Recebe `plano` (mensal/anual) e dados do usuário autenticado
- Cria customer no Asaas (nome + email)
- Cria subscription com billing type (CREDIT_CARD ou BOLETO ou PIX)
- Retorna URL de pagamento do Asaas

**3. Página `src/pages/Assinatura.tsx`**
- Header com botão voltar
- Dois cards: Mensal (R$ 21,90/mês) e Anual (R$ 119,90/ano, destaque "economia de 54%")
- Botão "Assinar" em cada card redireciona para o checkout do Asaas
- Badge "Mais popular" no plano anual

**4. Rota no App.tsx** — `/assinatura` protegida

### Arquivos

| Arquivo | Ação |
|---------|------|
| Migration SQL | Criar tabela `assinaturas` |
| `supabase/functions/criar-assinatura/index.ts` | Nova EF para integrar Asaas |
| `src/pages/Assinatura.tsx` | Nova página de planos |
| `src/App.tsx` | Adicionar rota `/assinatura` |

### Próximo passo

Me envie a **API Key do Asaas** (sandbox ou produção) para eu configurar como secret e implementar tudo.

