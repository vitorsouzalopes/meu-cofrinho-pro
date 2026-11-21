# Push nativo, PremiumGate e painel admin de Premium

## 1. Teste do push nativo no APK
- Adicionar na tela "Notificações" um botão **"Testar lembrete diário"** e **"Testar aviso de streak"** que disparam, na hora, a mesma mensagem que o agendamento envia.
- Mostrar na tela o status do registro do aparelho (token salvo / sem permissão / erro).
- Você instala o APK, toca nos botões e confirma se chegou. Depois validamos o envio agendado no horário escolhido.
- Observação: o envio só funciona com a chave completa da conta de serviço do Firebase salva; se ainda estiver incompleta, o botão mostrará esse erro claramente.

## 2. Recursos Premium (bloqueados com CTA para /premium)
- Planejador: abas **Inteligência** e **Previsão**.
- **Exportar Relatório PDF** e exportação CSV.
- **Consultor IA**.
- Sugestões de investimento.
- Continua grátis: Hoje, desafios, despesas, contas, metas, histórico, ranking, perfil e notificações.
- Bloqueio em modo borrado com botão "Seja Premium" levando a /premium.

## 3. Tela admin /admin/premium
- Visível apenas para administradores (link no Perfil).
- Lista de usuários (nome, e-mail, data de cadastro, status Premium) com busca e filtro "só Premium".
- Chave liga/desliga para alternar Premium, com contador no topo.

## Detalhes técnicos
- Função de banco `admin_set_premium(user_id, value)` security definer checando `has_role(auth.uid(),'admin')`; política SELECT em profiles para admins. Usuários comuns não podem alterar `is_premium` (trigger que bloqueia mudança do campo por não-admin).
- Edge function `send-fcm` recebe `kind: 'daily'|'streak'` para o teste manual.
- `<PremiumGate blur>` envolvendo os componentes listados; rota `/admin/premium` em App.tsx.
