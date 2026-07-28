# Correção do Loop de Renderização e Travamento de Navegação (v1.1.1)

O aplicativo apresenta um travamento (tela azul) ao navegar porque identificamos um loop infinito de atualizações de estado no "coração" do sistema (`AuthContext`). Isso consome todo o processamento do celular e impede que as novas páginas sejam desenhadas.

## User Review Required

> [!IMPORTANT]
> **Loop Infinito**: Descobri que a função que verifica as notificações estava reiniciando a si mesma centenas de vezes por segundo. Vou quebrar esse loop e tornar a inicialização do app muito mais leve.

## Proposta de Mudanças

### [Core & Auth]

#### [MODIFY] [AuthContext.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/contexts/AuthContext.tsx)
- Remover a dependência circular na função `checkPushPermission`.
- Garantir que a verificação de notificações ocorra exatamente **uma vez** por login, sem reiniciar ao trocar de aba.
- Adicionar um "cadeado" (lock) para evitar múltiplas execuções simultâneas.

#### [MODIFY] [App.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/App.tsx)
- Simplificar o componente `ProtectedRoute`. Ele agora será 100% transparente: uma vez que o usuário logou, ele nunca mais mostrará a tela de carga azul ao trocar de aba (Hoje -> Metas -> Perfil).

---

### [UI/UX - Estabilização]

#### [MODIFY] [Today.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Today.tsx)
- Garantir que o Dashboard carregue seus dados de forma independente, sem travar o restante do app se o servidor estiver lento.

#### [MODIFY] [Goals.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Goals.tsx)
- Ajustar o estado inicial de `loading` para evitar flashes desnecessários.

---

### [Build & Deploy]

#### [ACTION] Build Limpo
- Executar `npm run build` e `cap sync`.
- Gerar o APK v1.1.1.

## Plano de Verificação

### Manual Verification
- **Navegação**: O teste principal será clicar nos botões do menu inferior e garantir que a página mude instantaneamente, sem nunca mais ver o carregador azul após o login inicial.
- **Login**: O spinner de sincronização deve aparecer apenas na entrada do app.
