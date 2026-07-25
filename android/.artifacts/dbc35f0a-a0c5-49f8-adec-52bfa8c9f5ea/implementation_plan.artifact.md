# Correção Definitiva: Tela Preta e Ícone do App

Identificamos que o aplicativo fica em tela preta porque o plugin de Splash Screen do Capacitor não está instalado no `package.json`, impedindo que o app oculte a tela de carregamento nativa. Além disso, vamos consolidar a inicialização para evitar loops de redirecionamento.

## User Review Required

> [!IMPORTANT]
> Vou instalar o plugin `@capacitor/splash-screen`. Isso é essencial para que o código JavaScript consiga dizer ao Android: "Já carreguei, pode esconder a logo de abertura".

## Proposta de Mudanças

### [Dependências e Build]

#### [ACTION] Instalação de Plugins
- Instalar `@capacitor/splash-screen` (versão compatível com Capacitor 4).
- Rodar `npx cap sync android`.

---

### [Core & Inicialização]

#### [MODIFY] [App.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/App.tsx)
- Importar e chamar `SplashScreen.hide()` assim que o componente principal for montado.
- Remover chamadas duplicadas de `registerNativePush` para evitar conflitos de estado.
- Garantir que o `ProtectedRoute` mostre um spinner visível em vez de uma tela vazia durante a checagem de notificações.

#### [MODIFY] [native-push.ts](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/lib/native-push.ts)
- Adicionar logs extras para debug no Logcat.

---

### [Android Resources (Ícone)]

#### [MODIFY] [AndroidManifest.xml](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/android/app/src/main/AndroidManifest.xml)
- Temporariamente desativar o ícone adaptativo se ele continuar falhando, ou garantir que a cor de fundo seja aplicada globalmente.

#### [ACTION] Geração de Ícones
- Vou tentar uma abordagem simplificada de cópia de arquivos para garantir que pelo menos o ícone principal apareça.

## Plano de Verificação

### Manual Verification
- **Abertura**: O app deve mostrar a logo por 2 segundos e então abrir a tela de Login ou Dashboard.
- **Login**: Após clicar em "Entrar", deve aparecer o spinner e logo em seguida o Dashboard (ou a trava de notificação).
- **Ícone**: O ícone do app deve aparecer na grade de aplicativos do Android.
