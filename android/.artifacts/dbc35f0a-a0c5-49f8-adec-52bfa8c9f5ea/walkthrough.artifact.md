# Walkthrough - Integração de Anúncios e Facilitação de Testes

A integração com o **Google AdMob** foi concluída e o sistema de testes foi simplificado para permitir a validação rápida de anúncios e notificações push no ambiente Android.

## Alterações Realizadas

### 1. Configuração do Google AdMob
- **Manifesto**: Adicionado o ID de Aplicativo de Teste ao `AndroidManifest.xml`.
- **Plugin**: Instalada a dependência `@capacitor-community/admob` para controle programático dos anúncios.
- **Utilitário de Ads**: Criado o arquivo [ads.ts](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/lib/ads.ts) para gerenciar inicialização, banners e anúncios tela-cheia (intersticiais).

### 2. Monetização Inteligente (Today.tsx)
- O Dashboard ([Today.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Today.tsx)) agora verifica automaticamente se o usuário é Premium.
- **Usuários Free**: Visualizam um banner publicitário no rodapé (acima da navegação).
- **Usuários Pro**: Têm o banner removido automaticamente para uma experiência limpa.

### 3. Atalhos de Teste para Admin (Profile.tsx)
- Adicionados botões exclusivos para administradores no menu de [Perfil](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Profile.tsx):
    - **Testar Anúncio (Intersticial)**: Dispara imediatamente um anúncio de tela cheia para validar a conexão com o AdMob.
    - **Testar Push**: Atalho para a tela de notificações onde o botão de teste de servidor está localizado.

## Como Testar no Dispositivo

1.  **Anúncio**: Abra o Perfil e clique em "Testar Anúncio". Um anúncio de teste da Google deve cobrir a tela.
2.  **Banner**: No Dashboard, se sua conta for identificada como "Free Plan" (pode testar alterando seu status no Supabase ou usando uma conta nova), o banner aparecerá no rodapé.
3.  **Notificações**: Vá em Notificações (pelo atalho no Perfil) e clique em "Enviar Push de Teste". Você deve receber o alerta no sistema Android em poucos segundos.

> [!WARNING]
> Os anúncios exibidos são de **Teste**. Lembre-se de substituir o ID no console AdMob e no `AndroidManifest.xml` antes de subir o app oficialmente para a Google Play Store.

## Resultado do Build
- **APK Gerado**: [app-debug.apk](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/android/app/build/outputs/apk/debug/app-debug.apk).
- **Status**: Compilação concluída sem avisos de compatibilidade.
