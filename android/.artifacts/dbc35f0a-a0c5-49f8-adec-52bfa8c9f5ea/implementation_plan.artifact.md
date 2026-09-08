# Plano de Implementação: Correção de Notificações e Permissões (Auditoria Final)

Este plano implementa as recomendações da auditoria técnica para resolver a falha crítica de permissões no Android 13+ e aumentar a confiabilidade do sistema de Push e Notificações Locais.

## User Review Required

> [!IMPORTANT]
> **Ponte Nativa**: Vou adicionar código Java ao projeto Android. Isso requer que o projeto seja sincronizado e recompilado.
> **Política de Bloqueio**: A auditoria recomenda não bloquear o app se o usuário negar notificações. Vou ajustar a `NotificationWall.tsx` para permitir "Continuar sem Notificações", priorizando a experiência do usuário.

## Proposed Changes

### 1. Camada Nativa (Android)
Objetivo: Forçar o diálogo de permissão real do Android 13+.

#### [NEW] [NotificationPermissionPlugin.java](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/android/app/src/main/java/com/meucofrinho/app/NotificationPermissionPlugin.java)
- Implementar plugin Capacitor customizado que utiliza `ActivityResultLauncher` para pedir `POST_NOTIFICATIONS`.

#### [MODIFY] [MainActivity.java](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/android/app/src/main/java/com/meucofrinho/app/MainActivity.java)
- Registrar o novo plugin na inicialização da Activity.

#### [MODIFY] [AndroidManifest.xml](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/android/app/src/main/AndroidManifest.xml)
- Adicionar permissão `android.permission.SCHEDULE_EXACT_ALARM` para garantir que lembretes de contas não atrasem.

### 2. Infraestrutura TypeScript
Objetivo: Unificar a fonte de verdade das permissões.

#### [NEW] [src/lib/native-notification-permission.ts](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/lib/native-notification-permission.ts)
- Criar API wrapper para o plugin Java.

#### [MODIFY] [src/lib/native-push.ts](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/lib/native-push.ts)
- Implementar `Promise` que aguarda o evento de registro do Firebase com timeout de 10 segundos.

### 3. Interface e UX
Objetivo: Tornar o app menos intrusivo e mais resiliente.

#### [MODIFY] [src/components/NotificationWall.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/components/NotificationWall.tsx)
- Adicionar opção de "Pular" ou "Ver depois".
- Usar a nova ponte nativa para disparar o pedido de permissão.

#### [MODIFY] [src/pages/Today.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Today.tsx)
- Disparar o agendamento de lembretes assim que o status mudar para `granted`.

### 4. Configuração e Testes
#### [MODIFY] [capacitor.config.ts](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/capacitor.config.ts)
- Configurar `presentationOptions: ["badge", "sound", "alert"]` para exibir notificações mesmo com o app aberto.

#### [MODIFY] [playwright.config.ts](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/playwright.config.ts)
- Corrigir importação de pacotes inexistentes.

## Verification Plan

### Automated Tests
- Executar `npm test` para garantir que as utilidades financeiras continuam funcionando.
- Rodar `npx tsc --noEmit` para validar os tipos da nova ponte nativa.

### Manual Verification
1.  **Cold Boot** no emulador.
2.  Desinstalar versão antiga.
3.  Fazer login e confirmar se o **diálogo oficial do Android** ("Permitir que Cofrinho Pro envie notificações?") aparece.
4.  Testar agendamento de conta e verificar no `adb shell dumpsys alarm` se o alarme foi criado.
