# Teste de Fluxo Completo e Restrição Premium

Este plano visa validar as novas funcionalidades (Modo Simples, Dinheiro Livre, Metas) e garantir que o acesso ao Consultor IA e outras funções avançadas esteja corretamente restrito ao plano Premium.

## User Review Required

> [!IMPORTANT]
> Atualmente, o acesso ao Consultor IA está aberto para todos os usuários. Vou implementar uma trava que redireciona usuários gratuitos para a página de upgrade, permitindo apenas Admins e assinantes Premium.

## Proposta de Mudanças

### [Premium & Restrições]

#### [MODIFY] [AIConsultant.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/AIConsultant.tsx)
- Integrar o hook `usePremium`.
- Se o usuário não for Premium, exibir um card de bloqueio com link para a página `/premium` em vez da interface de chat.

#### [MODIFY] [Profile.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Profile.tsx)
- Adicionar um badge visual de "Pro" ou "Free" no cabeçalho do perfil para que o usuário saiba seu status atual.

---

### [Validação de Fluxo]

#### [VERIFY] Lógica de Dinheiro Livre
- Garantir que no Dashboard (`Today.tsx`), o valor exibido como "Dinheiro Livre" subtraia corretamente:
    - Renda Total (Salário + Extras)
    - Contas Mensais (Pagas e Pendentes)
    - Dívidas (Parcelas do mês)
    - Metas (Reserva mensal para objetivos)

#### [VERIFY] Metas e Dívidas
- Testar se a criação de meta com "Prazo" reflete no valor mensal e, consequentemente, no "Dinheiro Livre".
- Validar se as nomenclaturas "Acelerado" e "Equilibrado" estão consistentes nos relatórios.

## Plano de Verificação

### Automated Tests
- Simular diferentes cenários de renda e gastos para garantir que o "Dinheiro Livre" nunca fique negativo sem aviso.

### Manual Verification
- Acessar o Consultor IA com uma conta sem privilégios (Free) e validar o bloqueio.
- Alternar entre Modo Simples e Avançado no Perfil e verificar as mudanças no Dashboard.
