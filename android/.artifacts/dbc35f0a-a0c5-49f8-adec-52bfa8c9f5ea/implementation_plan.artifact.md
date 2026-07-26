# Correção de Erro Crítico (Tela Preta) e Ícone do App

Identificamos um erro técnico grave (ReferenceError) na página inicial que causava o travamento total do aplicativo (tela preta) após o login. Além disso, vamos forçar a atualização dos ícones nativos para que a marca **Cofrinho PRO** apareça corretamente no celular.

## User Review Required

> [!IMPORTANT]
> Descobri que o app estava tentando usar variáveis de "Plano Premium" na tela inicial sem carregá-las corretamente, o que fazia o código "quebrar" e travar em uma tela escura. Vou corrigir isso e simplificar a inicialização.

## Proposta de Mudanças

### [UI/UX - Correção de Bug]

#### [MODIFY] [Today.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Today.tsx)
- Corrigir a falta da chamada ao hook `usePremium()`.
- Garantir que as variáveis `isPremium` e `premiumLoading` estejam disponíveis antes de inicializar os anúncios.
- Isso removerá o "loop infinito" de tela preta.

---

### [Core & Estabilidade]

#### [MODIFY] [App.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/App.tsx)
- Adicionar um botão de "Reiniciar App" na tela de sincronização caso ela demore mais que o esperado.
- Melhorar os logs de erro para que apareçam no console do desenvolvedor.

---

### [Android Resources (Ícone)]

#### [ACTION] Substituição Forçada de Ícones
- Vou configurar o Android para usar o ícone clássico (`ic_launcher.png`) como prioridade caso o ícone adaptativo falhe.
- Garantir que as referências no `AndroidManifest.xml` estejam sólidas.

## Plano de Verificação

### Manual Verification
- **Abertura**: O app deve abrir a tela de Login normalmente.
- **Pós-Login**: O spinner de sincronização deve aparecer brevemente e levar direto ao Dashboard (sem tela preta).
- **Ícone**: O ícone do porquinho dourado deve aparecer na lista de aplicativos.
