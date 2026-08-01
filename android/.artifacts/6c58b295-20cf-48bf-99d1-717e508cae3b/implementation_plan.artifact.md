# Configuração de Anúncios Reais (AdMob)

Este plano detalha a transição dos IDs de teste para os IDs de produção da AdMob fornecidos pelo usuário, preparando o aplicativo para o lançamento na Play Store.

## Mudanças Propostas

### 1. Android Manifest
#### [MODIFY] [AndroidManifest.xml](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/android/app/src/main/AndroidManifest.xml)
- Substituir o App ID de teste pelo ID real: `ca-app-pub-2069353543110701~5558799613`.

### 2. Biblioteca de Anúncios (Web/Capacitor)
#### [MODIFY] [ads.ts](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/lib/ads.ts)
- Atualizar `BANNER_ID` com o ID real: `ca-app-pub-2069353543110701/8184697025`.
- Alterar `initializeForTesting` para `false`.
- Alterar `isTesting` para `false` na exibição do banner.
- Adicionar suporte para carregar o App ID da configuração (opcional, mas recomendado).

### 3. Configuração do Capacitor
#### [MODIFY] [capacitor.config.ts](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/capacitor.config.ts)
- Adicionar a configuração do plugin AdMob com o App ID real para garantir consistência entre as plataformas.

## Plano de Verificação

### Verificação Manual
1.  **Build**: Executar `npm run build:android` para atualizar os assets web.
2.  **Execução**: Rodar o app no emulador ou dispositivo físico.
    - **Nota**: Anúncios reais podem demorar algumas horas para começar a aparecer após a configuração e geralmente não aparecem bem em emuladores (o Google pode bloquear a conta se houver cliques falsos). O ideal é testar com um dispositivo físico e **não clicar** nos próprios anúncios.
3.  **Logs**: Verificar no Logcat se a inicialização do AdMob ocorre sem erros de "App ID mismatch".
