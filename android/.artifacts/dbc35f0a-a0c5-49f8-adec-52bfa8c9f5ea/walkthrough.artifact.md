# Walkthrough - Atualização de Marca e Identidade Visual (v1.0)

Concluí as primeiras etapas da atualização da identidade visual do aplicativo. O nome foi padronizado para **Cofrinho PRO** e a tela de autenticação agora reflete o novo posicionamento inteligente do app.

## Alterações Realizadas

### 1. Padronização de Nome
O nome do aplicativo foi atualizado de "Meu Cofrinho Pro" para **Cofrinho PRO** nos seguintes arquivos de configuração:
- [strings.xml](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/android/app/src/main/res/values/strings.xml) (Título no Android)
- [manifest.json](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/public/manifest.json) (Título no PWA/Web)
- [capacitor.config.ts](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/capacitor.config.ts) (Configuração do Capacitor)

### 2. Nova Tela de Autenticação (Auth.tsx)
- **Logomarca**: Adicionado suporte para exibir a logomarca oficial. Implementei um sistema de fallback: se o arquivo `logo.png` não for encontrado, ele exibe um ícone elegante de carteira em dourado.
- **Slogan**: Incluído o novo texto: *"Seu planejamento financeiro inteligente começa aqui."*
- **Visual**: Ajustado o título para destacar o "PRO" em dourado.

### 3. Atualização de Cabeçalhos (Dashboard)
- O nome **Cofrinho PRO** agora aparece com o estilo correto (dourado) na página inicial ([Index.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Index.tsx)) e no resumo diário ([Today.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Today.tsx)).

## Próximas Etapas

> [!IMPORTANT]
> **Substituição de Ícones**: Para atualizar o ícone que aparece na grade de aplicativos do celular e na tela de abertura (Splash Screen), preciso que você salve a imagem que me enviou na pasta `public/` com o nome `logo.png`.

Assim que a imagem estiver na pasta, poderei gerar os recursos nativos do Android (mipmap/drawable) e compilar o APK final com a marca completa.

## Como validar agora?
Você pode rodar o app e verá a nova tela de Login e o nome atualizado. O ícone de login usará o fallback dourado enquanto a imagem não é detectada.
