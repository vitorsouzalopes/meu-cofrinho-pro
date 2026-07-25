# Walkthrough - Notificações Obrigatórias e Recuperação de Senha (v1.0)

Concluí a implementação das novas regras de acesso e segurança. Agora o **Cofrinho PRO** garante que o usuário esteja sempre conectado e notificado sobre seu planejamento financeiro.

## Alterações Realizadas

### 1. Notificações Push Obrigatórias
- **Trava de Acesso**: Implementei o componente [NotificationWall](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/components/NotificationWall.tsx). Se o usuário negar as notificações no nível do Android, o app bloqueia o uso e explica a importância dos alertas para o planejamento financeiro.
- **Link Direto**: Adicionado o plugin `capacitor-native-settings` para permitir que o usuário abra as configurações do celular com um toque para ativar os alertas.
- **Validação Global**: O `ProtectedRoute` no [App.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/App.tsx) agora verifica o status do push em cada carregamento.

### 2. Fluxo de Recuperação de Senha
- **"Esqueci minha senha"**: Adicionado link na tela de login ([Auth.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Auth.tsx)).
- **Envio de Reset**: Implementada a lógica que solicita ao Supabase o envio de um link seguro para o e-mail do usuário.
- **Página de Nova Senha**: Criada a página [ResetPassword.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/ResetPassword.tsx) onde o usuário define a nova senha após clicar no link do e-mail.

### 3. Build & Infraestrutura
- **Reconstrução Total**: Realizei o build completo do frontend (`npm run build`) e sincronização (`cap sync`) para garantir que os botões administrativos antigos sumissem definitivamente do APK.
- **Fix de Compilação**: Corrigi erros de versão do Kotlin e do AdMob forçando o uso do `play-services-ads:22.6.0`, que é estável com o setup atual de SDK 35.

## Resultado do Build
- **APK Gerado**: [app-debug.apk](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/android/app/build/outputs/apk/debug/app-debug.apk).
- **Status**: Compilação concluída com sucesso.

> [!TIP]
> **Teste do Push**: O erro "Edge Function returned a non-2xx status code" que você viu acontece quando o servidor Supabase tenta enviar para um token que não existe ou expirou. Ao usar o novo APK, o app registrará um novo token válido e o teste de envio deve funcionar.

## Próximos Passos
1. **Teste a Recuperação**: Clique em "Esqueci minha senha" e valide o recebimento do e-mail.
2. **Teste a Trava**: Tente desativar as notificações do app nas configurações do Android e veja se o bloqueio aparece corretamente.
