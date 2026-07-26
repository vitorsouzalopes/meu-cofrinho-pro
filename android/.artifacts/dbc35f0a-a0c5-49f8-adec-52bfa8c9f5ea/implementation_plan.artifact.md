# Correção Definitiva de Navegação e Carregamento (v1.0.8)

O aplicativo está apresentando uma falha de carregamento (tela azul) ao navegar para "Metas" ou "Perfil". Isso ocorre devido a um conflito entre os estados de checagem de notificações e a transição de rotas. Vamos desacoplar a segurança da navegação e garantir fluidez total.

## User Review Required

> [!IMPORTANT]
> **Otimização de Segurança**: Vou alterar o `ProtectedRoute` para que a tela de "Sincronizando..." apareça **apenas uma vez** por sessão. Assim que você logar e o app conferir as notificações (ou der o tempo limite), ele nunca mais bloqueará sua navegação entre abas.

## Proposta de Mudanças

### [Core & Auth]

#### [MODIFY] [AuthContext.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/contexts/AuthContext.tsx)
- Adicionar um mecanismo de **Timeout de Força Bruta** diretamente no Contexto.
- Se o Android não responder sobre a permissão de notificações em **2 segundos**, o `pushChecked` será forçado para `true`. Isso garante que o app continue funcionando mesmo em dispositivos com falhas no plugin.

---

### [UI/UX - Navegação]

#### [MODIFY] [App.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/App.tsx)
- Refatorar o `ProtectedRoute` para ser "pass-through": ele só bloqueia o acesso inicial.
- Uma vez que o usuário está "dentro", a troca de rotas (Metas, Perfil, etc) não dispara mais a tela de carga.

#### [MODIFY] [BottomNav.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/components/BottomNav.tsx)
- Garantir que a troca de abas não cause re-renders pesados que possam simular um travamento.

---

### [Estabilidade]

#### [MODIFY] [Today.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Today.tsx)
- Verificar e remover qualquer dependência circular ou efeito colateral que possa travar a renderização ao voltar para a home.

## Plano de Verificação

### Manual Verification
- **Teste de Stress**: Abrir o app -> Logar -> Clicar repetidamente em Metas, Perfil e Hoje. A troca deve ser fluida e sem spinners.
- **Teste de Timeout**: Desativar a internet e tentar abrir o app. O spinner deve aparecer por no máximo 2s e então liberar o acesso ao que for possível (ou tela de erro amigável).
