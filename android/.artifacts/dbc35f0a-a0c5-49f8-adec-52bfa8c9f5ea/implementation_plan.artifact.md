# Implementação da Lógica "Dinheiro Disponível" e Modo Simples

Este plano visa simplificar radicalmente a experiência do usuário, focando no "Dinheiro Livre" após todas as obrigações e metas serem reservadas. Introduziremos o "Modo Simples" e automatizaremos o planejamento de metas e dívidas.

## User Review Required

> [!IMPORTANT]
> Precisaremos adicionar as colunas `ui_mode` na tabela `profiles` e `target_date` na tabela `goals` no Supabase. Como não posso executar SQL diretamente, assumirei que estas colunas estarão disponíveis ou usarei campos existentes de forma criativa (como o `is_auto` já presente em `goals`).

## Proposta de Mudanças

### [Core & Logic]

#### [MODIFY] [finance-utils.ts](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/lib/finance-utils.ts)
- Atualizar `calcularTotaisFinanceiros` para incluir metas.
- Nova fórmula: `Dinheiro Livre = Renda - (Contas + Dívidas + Metas)`.

---

### [UI/UX - Dashboard]

#### [MODIFY] [Today.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Today.tsx)
- Implementar o "Modo Simples" como visualização padrão.
- Novos Cards:
    - **Saldo Disponível Hoje**: Renda total menos gastos já pagos.
    - **Quanto posso gastar (Dinheiro Livre)**: O cálculo final da nova lógica.
    - **Resumo Rápido**: Próxima conta a vencer, número de metas e economia do mês.
- Remover termos técnicos como "Margem Líquida" ou "Sugestão de Distribuição" no modo simples.

---

### [Funcionalidades - Metas e Dívidas]

#### [MODIFY] [Goals.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Goals.tsx)
- No formulário de nova meta:
    - Substituir "Quanto por mês?" por "Prazo (meses)".
    - Calcular automaticamente: `Valor Total / Prazo`.
- Exibir a barra de progresso simplificada.

#### [MODIFY] [DebtPlanner.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/components/planner/DebtPlanner.tsx)
- Simplificar a exibição das estratégias.
- Mostrar comparativo direto: "Pagamento Normal" vs "Pagamento com Extra" (Tempo e Juros economizados).

---

### [Inteligência Artificial & Premium]

#### [NEW] [AIConsultant.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/AIConsultant.tsx)
- Criar interface de chat para o Consultor IA.
- Implementar a função "Posso comprar?", que analisa o "Dinheiro Livre" atual.

---

### [Nomenclatura]

#### Substituições Globais:
- "Saldo líquido projetado" -> "Dinheiro Livre"
- "Distribuição" -> "Seu planejamento"
- "Estratégia Hard/Mixed" -> "Plano de Quitação"

## Plano de Verificação

### Automated Tests
- Validar se o cálculo de `disponivel` no `finance-utils.ts` subtrai corretamente as metas.
- Verificar se a conversão de "Prazo" para "Valor Mensal" em `Goals.tsx` está correta.

### Manual Verification
- Testar a troca entre Modo Simples e Avançado (se implementado o toggle).
- Validar se a página inicial mostra a próxima conta corretamente.
