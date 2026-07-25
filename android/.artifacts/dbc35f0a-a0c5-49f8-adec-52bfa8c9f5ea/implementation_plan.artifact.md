# Atualização de Marca e Identidade Visual (v1.0)

Este plano visa atualizar a identidade visual do aplicativo em todos os pontos de contato: ícone do app, splash screen, tela de autenticação e descrições institucionais.

## User Review Required

> [!IMPORTANT]
> Recebi a nova logomarca. Para aplicá-la corretamente como ícone do Android e Splash Screen, precisarei que o arquivo de imagem (ex: `logo.png`) esteja presente na pasta `public/` ou `src/assets/`. Se você puder me informar o nome do arquivo que salvou no projeto, eu farei a substituição automática.

## Proposta de Mudanças

### [Android Resources]

#### [MODIFY] [strings.xml](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/android/app/src/main/res/values/strings.xml)
- Padronizar o nome para **Cofrinho PRO** (mantendo a consistência com a nova logomarca).
- Adicionar a nova descrição curta do app.

---

### [UI/UX - Web & Capacitor]

#### [MODIFY] [Auth.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Auth.tsx)
- Substituir o ícone genérico `Wallet` pela nova logomarca.
- Incluir a descrição: "Seu planejamento financeiro inteligente começa aqui" abaixo do título.
- Ajustar o layout para destacar a identidade visual Premium (dourado/prata).

#### [MODIFY] [Index.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Index.tsx) (Dashboard)
- Atualizar o cabeçalho para refletir o novo nome **Cofrinho PRO**.

---

### [Assets & Icons]

#### [NEW] [Manifest & PWA](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/public/manifest.json)
- Atualizar o `short_name` e `name` no manifesto da web.

## Plano de Verificação

### Automated Tests
- Validar se o build do APK continua funcionando após a alteração dos recursos de string.

### Manual Verification
- Verificar se a tela de Login/Cadastro exibe a nova logomarca e a descrição corretamente.
- Confirmar se o nome do app no launcher do Android mudou para "Cofrinho PRO".
