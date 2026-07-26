# Correção Crítica de Inicialização e Reset de Dados (v1.0.4)

Identificamos que o aplicativo fica preso na tela de "Sincronizando..." devido a uma falha na lógica de verificação de notificações push e uma persistência de dados antigos. Vamos realizar um "Hard Reset" para limpar o ambiente de teste e simplificar a inicialização.

## User Review Required

> [!IMPORTANT]
> **Reset de Dados**: Vou forçar uma limpeza completa do armazenamento local para que o aplicativo abra como se tivesse sido instalado pela primeira vez. Isso apagará o login anterior.
> **Sincronização**: Vou reduzir o tempo de espera da sincronização e garantir que o app abra mesmo se a verificação de notificações falhar, evitando o travamento.

## Proposta de Mudanças

### [Core & Inicialização]

#### [MODIFY] [main.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/main.tsx)
- Atualizar a chave de reset para `v1.0.4_final_reset`.
- Garantir que a limpeza ocorra antes de qualquer carregamento do Supabase ou do React.

#### [MODIFY] [App.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/App.tsx)
- **Simplificar `ProtectedRoute`**:
    - Se estiver no modo web, pular a checagem de push imediatamente.
    - Se no modo nativo, tentar registrar o push mas não bloquear o app por mais de 2 segundos.
    - Adicionar um botão "Entrar Manualmente" caso o carregamento automático trave.

#### [MODIFY] [native-push.ts](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/lib/native-push.ts)
- Adicionar um mecanismo de proteção para que a função nunca fique "pendente" para sempre.

---

### [UI/UX - Melhoria de Feedback]

#### [MODIFY] [Today.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Today.tsx)
- Adicionar logs de carregamento para sabermos exatamente em qual parte da sincronização financeira o app está.

## Plano de Verificação

### Manual Verification
- **Abertura**: O app deve mostrar a logo e, em seguida, a tela de Login (vazia).
- **Pós-Login**: O spinner de sincronização deve durar no máximo 2 segundos e levar ao Dashboard.
- **Botão de Emergência**: Se travar, o botão na tela de carga deve permitir entrar no app.
