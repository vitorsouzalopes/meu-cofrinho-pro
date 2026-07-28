# Implementação de Notificações Push Obrigatórias (v1.3.0)

Conforme solicitado, vamos tornar as notificações push **obrigatórias** para o funcionamento do Cofrinho PRO. O usuário será bloqueado por uma tela informativa imediatamente após o login e só poderá acessar o Dashboard após conceder a permissão.

## User Review Required

> [!IMPORTANT]
> **Regra de Bloqueio**: Se o usuário negar as notificações ou se elas estiverem desativadas no sistema, o app exibirá o "Muro de Notificações". O acesso ao Dashboard, Metas e Perfil ficará bloqueado até que o status seja alterado para "Concedido".

## Proposta de Mudanças

### [UI/UX - Muro de Notificações]

#### [MODIFY] [NotificationWall.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/components/NotificationWall.tsx)
- Adicionar inteligência ao botão principal:
    - Se a permissão nunca foi pedida, o botão aciona o pedido oficial do Android.
    - Se a permissão foi negada anteriormente, o botão abre as configurações do sistema para ativação manual.
- Melhorar o feedback visual para indicar que esta é uma etapa obrigatória.

---

### [Arquitetura de Segurança]

#### [MODIFY] [App.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/App.tsx)
- Atualizar o `ProtectedLayout` para verificar rigorosamente o `pushStatus`.
- Se o status for diferente de `granted` (em dispositivos nativos), renderizar o `NotificationWall` em vez das páginas do app.

#### [MODIFY] [AuthContext.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/contexts/AuthContext.tsx)
- Garantir que a checagem de push seja re-executada ao clicar no botão "Tentar Novamente" do muro.

---

### [Lógica de Negócio]

#### [VERIFY] Notificações de Contas
- Validar se o registro do token FCM (Firebase Cloud Messaging) está ocorrendo corretamente no banco de dados após a aprovação do usuário.

## Plano de Verificação

### Manual Verification
- **Fluxo de Primeiro Acesso**: Login -> Ver tela de bloqueio -> Clicar em Permitir -> Dashboard aberto.
- **Fluxo de Recusa**: Login -> Ver tela de bloqueio -> Negar -> Permanecer bloqueado com instruções para ativar nas configurações.
- **Persistência**: Fechar e abrir o app; se a permissão estiver ativa, deve ir direto para o Dashboard.
