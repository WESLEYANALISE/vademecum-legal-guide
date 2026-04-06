

## Plano: Sistema de Paywall Premium (Freemium)

### Visão Geral

Criar um hook central `useSubscription` que verifica se o usuário tem assinatura ativa na tabela `assinaturas`, e um componente `PremiumGate` (card flutuante) que bloqueia funcionalidades premium com botão "Ver planos". Implementar contadores de uso mensal para funcionalidades com limite gratuito (3/mês).

### Regras de negócio

**Funcionalidades 100% bloqueadas (só assinantes):**
- Favoritar artigos
- Anotações
- Perguntar (assistente IA)
- Playlist de narrações
- Radar Legislativo (overlay na legislação)

**Funcionalidades com limite de 3 usos/mês (total, não por lei):**
- Praticar questões (3 artigos/mês)
- Explicação, Exemplo e Termos (3 artigos/mês no total entre os três)
- Narração (3 artigos/mês)

**Biblioteca (livros):**
- Clássicos: limite de 2 livros
- Liderança: limite de 1 livro
- Fora da Toga: limite de 1 livro
- Estudos: 2 livros por área do Direito
- Assinantes: tudo liberado

**Desktop:** acesso liberado para todos (não bloqueado)

### Implementação

**1. Tabela `premium_usage` (migration)**

Rastreia o uso mensal de funcionalidades gratuitas:

```sql
CREATE TABLE public.premium_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  feature text NOT NULL, -- 'questoes', 'explicacao', 'narracao'
  ref_key text,          -- ex: 'CP_Art. 1' para saber qual artigo
  used_at timestamptz DEFAULT now()
);
ALTER TABLE public.premium_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own usage" ON public.premium_usage
  FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_premium_usage_user_month 
  ON public.premium_usage(user_id, feature, used_at);
```

**2. Hook `useSubscription` (`src/hooks/useSubscription.ts`)**

- Consulta `assinaturas` WHERE `user_id = auth.uid()` AND `status = 'active'`
- Retorna `{ isPremium, loading, plano }`
- Cached no contexto para não re-consultar em cada componente

**3. Hook `usePremiumUsage` (`src/hooks/usePremiumUsage.ts`)**

- Conta usos do mês atual por feature
- Retorna `{ canUse(feature), usageCount(feature), registerUsage(feature, ref) }`
- Limites: questoes=3, explicacao=3, narracao=3

**4. Componente `PremiumGate` (`src/components/PremiumGate.tsx`)**

Card flutuante/modal com:
- Ícone de coroa dourada
- "Funcionalidade Premium"
- Descrição contextual
- Botão "Ver planos" → navega para `/assinatura`
- Aparece ao clicar em funcionalidade bloqueada

**5. Integrações nos componentes existentes**

| Local | O que muda |
|-------|-----------|
| `ArtigoBottomSheet.tsx` | Favoritar, Anotações, Perguntar → verifica `isPremium`, senão mostra `PremiumGate` |
| `ArtigoBottomSheet.tsx` | Abas Explicação/Exemplo/Termos → verifica limite mensal, senão mostra gate |
| `CategoriaLegislacao.tsx` | Botões Favoritos, Playlist, Anotações, Radar → verifica `isPremium` |
| `QuizView.tsx` / fluxo Questões | Antes de iniciar, verifica limite de 3 artigos/mês |
| Narração (no ArtigoBottomSheet) | Verifica limite de 3/mês antes de gerar |
| `Biblioteca.tsx` | Limita livros visíveis por categoria para não-assinantes |

### Arquivos

| Arquivo | Ação |
|---------|------|
| Migration SQL | Criar tabela `premium_usage` |
| `src/hooks/useSubscription.ts` | Novo hook: verifica assinatura ativa |
| `src/hooks/usePremiumUsage.ts` | Novo hook: contagem de uso mensal |
| `src/components/PremiumGate.tsx` | Novo componente: card flutuante de bloqueio |
| `src/components/vademecum/ArtigoBottomSheet.tsx` | Gating em favoritar, anotações, perguntar, explicação/exemplo/termos |
| `src/pages/CategoriaLegislacao.tsx` | Gating em favoritos, playlist, anotações, radar |
| `src/pages/Biblioteca.tsx` | Limitar livros por categoria |
| `src/pages/Estudar.tsx` | Gating em questões (limite 3/mês) |

