# Notificações Obrigatórias e Recuperação de Senha

Este plano visa implementar duas funcionalidades críticas de segurança e engajamento: a obrigatoriedade de notificações push para uso do app e o fluxo de recuperação de senha via Supabase.

## User Review Required

> [!IMPORTANT]
> **Notificações**: Se o usuário negar a permissão, ele ficará em uma tela de bloqueio.
> **Recuperação de Senha**: O link de reset enviado por e-mail precisará redirecionar o usuário de volta para o app ou para a URL de produção (Deep Link).

## Proposta de Mudanças

### [Autenticação e Recuperação]

#### [MODIFY] [Auth.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Auth.tsx)
- Adicionar estado `isResetPassword` para mostrar o formulário de "Esqueci minha senha".
- Implementar `supabase.auth.resetPasswordForEmail` para enviar o link de recuperação.
- Adicionar link "Esqueci minha senha" abaixo do formulário de Login.

#### [NEW] [ResetPassword.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/ResetPassword.tsx)
- Criar página para definir a nova senha após o usuário clicar no link do e-mail.

---

### [Notificações Push Obrigatórias]

#### [MODIFY] [native-push.ts](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/lib/native-push.ts)
- Retornar o status da permissão para controle da UI.

#### [NEW] [NotificationWall.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/components/NotificationWall.tsx)
- Tela de bloqueio que explica a necessidade das notificações e oferece link para as configurações do sistema.

#### [MODIFY] [App.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/App.tsx)
- Adicionar a rota `/reset-password`.
- Integrar a verificação de notificações no fluxo global do app.

## Plano de Verificação

### Manual Verification
- **Recuperação**: Solicitar reset -> Receber e-mail -> Clicar no link -> Alterar senha -> Logar com nova senha.
- **Notificações**: Negar permissão -> Ver tela de bloqueio -> Ativar nas configurações -> Ver app liberado.
