# Configuração e Teste de Anúncios (AdMob) e Notificações Push

Este plano visa habilitar a exibição de anúncios via Google AdMob e facilitar o teste tanto de anúncios quanto de notificações push no ambiente nativo Android.

## User Review Required

> [!IMPORTANT]
> Vou configurar o AdMob com um **ID de Aplicativo de Teste** da Google (`ca-app-pub-3940256099942544~3347511713`). Quando você for para produção, precisará substituir este ID no `AndroidManifest.xml` pelo seu ID real do console AdMob.

## Proposta de Mudanças

### [Anúncios - AdMob]

#### [MODIFY] [AndroidManifest.xml](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/android/app/src/main/AndroidManifest.xml)
- Adicionar o `meta-data` obrigatório para o Google Ads dentro da tag `<application>`.

#### [MODIFY] [package.json](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/package.json)
- Adicionar a dependência `@capacitor-community/admob` para permitir o controle via TypeScript.

#### [NEW] [src/lib/ads.ts](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/lib/ads.ts)
- Criar um utilitário para inicializar o AdMob e exibir banners ou anúncios intersticiais (tela cheia) de teste.

---

### [Interface de Teste]

#### [MODIFY] [Profile.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Profile.tsx)
- No menu de administrador (apenas para você), adicionar botões para:
    - **Testar Anúncio Intersticial**: Exibe um anúncio de tela cheia imediatamente.
    - **Testar Notificação Push**: Link rápido para a página de configurações de notificações onde já existe o botão de teste.

#### [MODIFY] [Today.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Today.tsx)
- Se o usuário for do plano **Gratuito**, carregar e exibir um banner de anúncio no rodapé ou entre os cards de resumo.

## Plano de Verificação

### Automated Tests
- Validar se o plugin do AdMob inicializa sem erros no logcat.

### Manual Verification
- Clicar no botão "Testar Anúncio" no Perfil e verificar se o anúncio de teste da Google aparece.
- Usar o botão "Enviar Push de Teste" na página de Notificações e validar o recebimento no dispositivo Android.
