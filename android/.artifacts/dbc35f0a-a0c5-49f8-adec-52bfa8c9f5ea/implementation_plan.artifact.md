# Plano de Ação: Correção Estrutural de Notificações (Baseado na Auditoria)

Este plano resolve os GAPs identificados na auditoria técnica, focando na criação de canais de notificação, tratamento de foreground e metadados do manifesto.

## User Review Required

> [!IMPORTANT]
> **Canais de Notificação**: No Android 8+, as notificações só aparecem se estiverem vinculadas a um canal. Vou criar o canal "Padrao" automaticamente ao abrir o app.

## Proposed Changes

### 1. Configuração de Sistema (Android)
#### [MODIFY] [AndroidManifest.xml](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/android/app/src/main/AndroidManifest.xml)
- Definir `default_notification_channel_id` como "default".
- Definir `default_notification_color` como o tom de dourado do app (`#D4A017`).

### 2. Infraestrutura de Notificações
#### [MODIFY] [src/lib/native-push.ts](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/lib/native-push.ts)
- Criar o canal de notificação "default" via `PushNotifications.createChannel`.
- Adicionar listeners `pushNotificationReceived` e `pushNotificationActionPerformed` para garantir que o app responda a cliques e mensagens em foreground.

#### [MODIFY] [capacitor.config.ts](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/capacitor.config.ts)
- Remover a referência a ícone inexistente para evitar erros de renderização.

### 3. Backend (Edge Functions)
#### [MODIFY] [supabase/functions/send-fcm/index.ts](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/supabase/functions/send-fcm/index.ts)
- Incluir a chave `android` no payload do FCM para forçar o uso do canal `default` e prioridade alta.

## Verification Plan

### Manual Verification
1.  **Reiniciar o App**: Verificar se o log mostra `[Push] Notification channel created`.
2.  **Teste Local**: Clicar em "Testar Notificação (Local)" no perfil. A notificação deve aparecer com o ícone e cor corretos.
3.  **Teste de Push**: Enviar um push de teste pelo painel (ou botão de teste) e validar se ele aparece mesmo com o app aberto.
