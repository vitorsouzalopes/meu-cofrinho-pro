# Correção Crítica de Crash (Fim da Tela Preta) e Reset de Dados

Descobri o erro exato que estava mantendo o aplicativo em tela preta: o arquivo do Dashboard (`Today.tsx`) estava com uma falha de sintaxe grave (definições duplicadas e exportação antes da hora), o que fazia o React "quebrar" assim que você logava. Além disso, vamos forçar a limpeza de dados antigos.

## User Review Required

> [!IMPORTANT]
> O arquivo `Today.tsx` foi corrompido em uma das edições anteriores, o que causava o travamento total após o login. Vou reconstruí-lo de forma limpa. Também vou adicionar um script de "Primeira Execução" que limpará seu cache local automaticamente nesta atualização.

## Proposta de Mudanças

### [UI/UX - Correção de Bug Fatal]

#### [MODIFY] [Today.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Today.tsx)
- Remover definições duplicadas do componente.
- Corrigir a ordem de exportação.
- Garantir que todos os hooks (`useAuth`, `usePremium`, `useDebts`) sejam chamados corretamente no início.
- Isso removerá o crash que causava a tela preta após o login.

---

### [Core & Inicialização]

#### [MODIFY] [main.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/main.tsx)
- Adicionar uma lógica de **"Hard Reset"**: Se o app for aberto e não encontrar a chave `v1_init`, ele limpará todo o `localStorage` e recarregará. Isso resolverá o problema de "dados anteriores" voltando.
- Tornar o `renderApp` mais resiliente a falhas no serviço de atualização.

#### [MODIFY] [App.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/App.tsx)
- Simplificar o `ProtectedRoute`.
- Adicionar um `console.log` visível para facilitar o debug se algo falhar na inicialização.

---

### [Android Resources]

#### [ACTION] Limpeza de Cache de Build
- Rodar um comando para limpar os caches do Gradle antes de gerar o novo APK.

## Plano de Verificação

### Manual Verification
- **Abertura**: O app deve abrir a tela de Login sem dados salvos (Reset automático).
- **Pós-Login**: O Dashboard deve carregar instantaneamente, sem loop de tela preta.
- **Identidade**: O ícone do app deve ser validado novamente após o build limpo.
