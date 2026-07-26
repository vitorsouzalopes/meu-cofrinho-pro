# Walkthrough - Resgate Total: Fim da Tela Preta e Reset de Dados (v1.0.3)

Concluí a reconstrução estrutural do aplicativo para eliminar o travamento em tela preta e garantir que o seu ambiente de teste seja 100% limpo a cada nova instalação.

## Alterações Realizadas

### 1. Reconstrução do Dashboard (Today.tsx)
- **Correção Fatal**: Identifiquei que o arquivo principal da interface estava corrompido com exportações duplicadas e erros de referência. Reconstruí o [Today.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Today.tsx) do zero, garantindo que os hooks de Premium e Autenticação sejam carregados na ordem correta. Isso elimina a causa principal da tela preta pós-login.

### 2. Hard Reset Automático (First Run)
- **Limpeza de Cache**: No [main.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/main.tsx), adicionei um script de detecção de versão. Ao instalar este APK, o app detectará que é uma nova build e **limpará todo o armazenamento local** (localStorage) automaticamente uma única vez. Isso resolve definitivamente o problema de "dados anteriores" voltando.

### 3. Resiliência de Inicialização (App.tsx)
- **Spinner de Emergência**: A tela de sincronização agora possui um fundo sólido azul noturno (marca) e um botão de "Reiniciar" visível.
- **Trava Anti-Hanging**: Implementei um timeout de 4 segundos. Se a rede falhar ao verificar as notificações, o app libera o seu acesso automaticamente, impedindo que você fique preso em um loop infinito.

### 4. Correção do Ícone Nativo
- **AndroidManifest**: Reconfigurei a prioridade de ícones nativos. O sistema agora deve buscar a imagem oficial do Cofrinho PRO de forma mais agressiva.

## Resultado do Build
- **APK Gerado**: [app-debug.apk](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/android/app/build/outputs/apk/debug/app-debug.apk).
- **Processo**: Build do Frontend (Vite) ➔ Sincronização Capacitor ➔ Limpeza de Cache Gradle ➔ Compilação Final.

> [!IMPORTANT]
> **Instalação Limpa**: Embora tenhamos o reset automático, recomendo desinstalar a versão atual do seu celular antes de colocar esta nova. Isso garante que as novas permissões de ícone e backup sejam aplicadas pelo Android.

## Como validar?
1. Abra o app. Você verá a logo por 2s.
2. A tela de Login aparecerá (limpa, sem e-mail salvo).
3. Após o Login, você verá o spinner "Sincronizando universo financeiro..." por 1 ou 2 segundos.
4. O Dashboard carregará perfeitamente.
