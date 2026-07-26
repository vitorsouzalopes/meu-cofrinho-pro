# Correção de Tela Preta Pós-Login e Estabilização de Inicialização

O aplicativo está apresentando uma tela preta após o login, provavelmente devido a um loop de carregamento ou falha na checagem de notificações push. Além disso, vamos desativar o backup do Android para garantir que novos testes comecem com o estado limpo e corrigir o problema do ícone.

## User Review Required

> [!IMPORTANT]
> **Limpeza de Dados**: Vou desativar `android:allowBackup` e `android:fullBackupContent` no Manifesto. Isso fará com que, ao desinstalar e reinstalar o app, os dados locais sejam realmente apagados, permitindo um teste "do zero".

## Proposta de Mudanças

### [Android Infrastructure]

#### [MODIFY] [AndroidManifest.xml](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/android/app/src/main/AndroidManifest.xml)
- Definir `android:allowBackup="false"` para evitar persistência de dados antigos entre instalações durante esta fase de teste.
- Garantir que o `icon` e `roundIcon` estejam apontando corretamente para `@mipmap/ic_launcher`.

---

### [App Logic & UI]

#### [MODIFY] [App.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/App.tsx)
- Corrigir a lógica do `ProtectedRoute`:
    - Adicionar um estado `hasInitializedPush` para evitar re-execuções.
    - Melhorar o fallback do spinner para garantir que ele seja renderizado em um container com fundo sólido, evitando a transparência que pode parecer uma "tela preta".
- Ajustar o tempo de ocultação do Splash Screen para ocorrer apenas após o primeiro render do conteúdo.

#### [MODIFY] [Auth.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Auth.tsx)
- Adicionar um botão temporário "Limpar Dados Locais" na tela de login para facilitar os seus testes de "instalação limpa".

---

### [Icon Fix]

#### [ACTION] Geração Manual de Ícones
- Vou tentar copiar a logo diretamente para os recursos de ícone principais, contornando o erro de geração automática.

## Plano de Verificação

### Manual Verification
- **Abertura**: O app deve mostrar a logo e carregar a tela de Login.
- **Login**: Após logar, o app deve mostrar o spinner "Sincronizando..." e em seguida o Dashboard.
- **Fresh Install**: Desinstalar e instalar deve resultar em um app deslogado (sem dados anteriores).
