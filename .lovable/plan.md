

## Plano: Adicionar Card "Acesso Desktop" ao lado do Radar de Leis 360°

### Visão Geral

Transformar a barra do "Radar de Leis 360°" em uma linha com dois cards lado a lado: o Radar (maior, ~60% da largura) e um novo card "Acesso Desktop" (~40%). O card Desktop mostra vantagens da versão desktop e só aparece em mobile/tablet (< 1024px).

### O que será feito

**1. Reestruturar o layout do Radar de Leis 360°**

Ambos os locais onde o Radar aparece (mobile e desktop layout) serão ajustados para exibir dois cards lado a lado com `flex` e `gap`.

**2. Criar o card "Acesso Desktop"**

Card com ícone de monitor, título "Versão Desktop", breve descrição das vantagens (tela ampla, multitarefas, atalhos). Estilo similar ao Radar mas com gradiente diferenciado (ex: azul/índigo). Ao clicar, pode abrir um sheet ou redirecionar para a URL publicada.

**3. Visibilidade apenas mobile/tablet**

Toda a linha com os dois cards só aparece em telas < 1024px. No desktop, o Radar já aparece na barra superior, então o card Desktop não é necessário.

### Layout Visual

```text
┌──────────────────────┐ ┌───────────────┐
│ 🔴 Radar de Leis 360°│ │ 🖥 Desktop    │
│      (flex-[3])      │ │  (flex-[2])   │
└──────────────────────┘ └───────────────┘
```

### Detalhes Técnicos

**Mobile (dentro do `activeTab === 'legislacao'`)** — linha ~450-488:
- Trocar `flex justify-center` por `flex gap-3`
- Radar: de `w-[280px]` para `flex-[3]` (maior)
- Novo card Desktop: `flex-[2]`, gradiente azul, ícone `Monitor`, texto "Versão Desktop" com subtítulo curto

**Desktop layout (linha ~255-290)**:
- Manter apenas o Radar (o card Desktop não aparece em desktop)

### Arquivos

| Arquivo | Ação |
|---------|------|
| `src/pages/Index.tsx` | Adicionar card Desktop ao lado do Radar na seção mobile; ajustar proporções |

