# Correção do Ícone do App e Tela Preta no Inicialização

Este plano visa resolver dois problemas críticos: o ícone do aplicativo que não aparece corretamente e a tela preta que surge após o splash screen.

## User Review Required

> [!IMPORTANT]
> Identificamos que o Android está tentando carregar cores e fundos que não existem ou estão referenciados incorretamente (como tratar um arquivo de imagem como uma cor). Isso causa a falha visual (tela preta) na transição para o conteúdo do app.

## Proposta de Mudanças

### [Android Resources]

#### [MODIFY] [colors.xml](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/android/app/src/main/res/values/colors.xml)
- Adicionar as cores faltantes: `ic_launcher_background` (combinando com a marca) e `windowBackground`.
- Definir cores de contraste para o modo noturno.

#### [MODIFY] [styles.xml](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/android/app/src/main/res/values/styles.xml)
- Corrigir a referência de `android:windowBackground` para usar uma cor sólida em vez de um drawable que pode estar falhando.
- Ajustar o `postSplashScreenTheme` para garantir uma transição suave.

#### [MODIFY] [ic_launcher.xml](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml)
- Garantir que o ícone adaptativo aponte para os recursos corretos (`@drawable/ic_launcher_background`).

---

### [Capacitor Configuration]

#### [MODIFY] [capacitor.config.ts](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/capacitor.config.ts)
- Adicionar configurações explícitas para o plugin de Splash Screen.
- Definir `launchShowDuration: 0` e `launchAutoHide: true` para que o Capacitor gerencie a transição corretamente com o Android 12+.

---

### [Icon Generation]

#### [ACTION] Geração de Ícones Nativos
- Vou tentar novamente o comando `assets generate` com parâmetros específicos para garantir que a imagem `assets/logo.png` seja convertida nos formatos `mipmap` necessários (hdpi, xhdpi, etc).

## Plano de Verificação

### Automated Tests
- Executar `./gradlew assembleDebug` para validar se todos os recursos XML estão íntegros.

### Manual Verification
- Instalar o APK e verificar se o ícone do Cofrinho PRO aparece na lista de apps.
- Abrir o app e validar se a transição da Splash Screen para a tela de Login ocorre sem o flash de tela preta.
