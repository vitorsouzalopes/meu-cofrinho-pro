# Walkthrough - Estabilização de Login e Limpeza de Dados (v1.0)

Concluí as correções para eliminar o "loop de tela preta" após o login e garantir que os testes comecem sempre de um estado limpo.

## Alterações Realizadas

### 1. Fim do Loop Pós-Login
- **Segurança de Timeout**: No [App.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/App.tsx), a verificação de notificações push agora tem um tempo limite de 3 segundos. Se o servidor demorar a responder, o app libera o acesso automaticamente (`timeout`), evitando que você fique preso em uma tela preta.
- **Interface de Sincronização**: Adicionei uma tela de carregamento com fundo sólido e cores da marca. Isso garante que, enquanto o app verifica seus dados, você veja uma animação profissional em vez de um flash preto.

### 2. Limpeza de Instalação (Fresh Install)
- **Desativação de Backup**: No [AndroidManifest.xml](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/android/app/src/main/AndroidManifest.xml), desativei o recurso `allowBackup`. Isso impede que o Android restaure logins e dados antigos quando você reinstala o APK.
- **Botão de Emergência**: Na tela de [Login](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Auth.tsx), adicionei um link discreto: *"⚠️ Limpar dados temporários (Dev Mode)"*. Clique nele se quiser forçar o logout e limpar o cache local sem precisar desinstalar o app.

### 3. Melhoria no Ícone e Build
- **Sincronização Forçada**: Realizei um rebuild completo e sincronizei o Capacitor para garantir que todos os arquivos nativos estejam apontando para a nova marca **Cofrinho PRO**.

## Resultado do Build
- **APK Gerado**: [app-debug.apk](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/android/app/build/outputs/apk/debug/app-debug.apk).
- **Status**: Compilação concluída com sucesso.

> [!TIP]
> **Como testar a "Limpeza"?**
> Se você desinstalar o app e instalar este novo APK, ele não deve mais "lembrar" do seu login anterior automaticamente (devido ao `allowBackup="false"`). Se ainda assim quiser limpar tudo rapidamente, use o botão de Dev Mode na tela de login.

## Próximos Passos
1. Instale o APK.
2. Faça o login e observe o novo spinner de sincronização.
3. Se o app abrir o Dashboard logo em seguida, o problema do loop foi resolvido!
