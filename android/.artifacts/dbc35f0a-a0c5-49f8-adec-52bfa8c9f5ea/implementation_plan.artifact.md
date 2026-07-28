# Correção Definitiva de Navegação e Estabilidade (v1.1.0)

O aplicativo apresenta travamentos (tela azul/carregamento infinito) ao navegar entre páginas porque o sistema de segurança tenta revalidar as permissões de notificação push em cada clique. Vamos desacoplar totalmente essa verificação da navegação das páginas.

## User Review Required

> [!IMPORTANT]
> **Mudança de Fluxo**: A verificação de notificações deixará de ser um "bloqueio de tela" em cada página. Ela ocorrerá apenas uma vez no login. Se você já estiver logado, o app abrirá instantaneamente e fará qualquer checagem necessária em segundo plano.

## Proposta de Mudanças

### [Core & Auth]

#### [MODIFY] [AuthContext.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/contexts/AuthContext.tsx)
- Estabilizar a função `checkPushPermission` com `useCallback`.
- Garantir que o estado `pushChecked` seja persistente durante a navegação entre rotas.
- Adicionar logs detalhados para monitorar a transição de estados.

#### [MODIFY] [App.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/App.tsx)
- **Simplificar `ProtectedRoute`**: Remover a trava de `pushChecked`. O protetor agora só verificará se existe uma sessão ativa.
- **Sincronização em Background**: A checagem de notificações será movida para o `AppContent`, rodando silenciosamente enquanto o usuário já vê o Dashboard.

---

### [UI/UX - Navegação Fluida]

#### [MODIFY] [Today.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Today.tsx)
- Remover qualquer lógica de bloqueio de renderização que dependa de carregamento de anúncios ou push.
- Adicionar tratamento de erro (`error boundary` simulado) para evitar que falhas em hooks de terceiros travem a página.

#### [MODIFY] [Goals.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Goals.tsx)
- Otimizar o carregamento de dados para ser não-bloqueante.

---

### [Limpeza de Build]

#### [ACTION] Reconstrução Forçada
- Vou executar uma limpeza profunda nos diretórios de build (`dist`, `android/app/build`).
- Sincronizar o Capacitor para garantir que o menu "Vida Fit" sumiu definitivamente do código nativo.

## Plano de Verificação

### Manual Verification
- **Login**: O app deve entrar no Dashboard imediatamente após digitar a senha.
- **Navegação**: Clicar em Metas e Perfil deve mudar a tela em menos de 300ms, sem mostrar o carregador azul.
- **Push**: Validar que a permissão é solicitada apenas se o usuário ainda não tiver respondido.
