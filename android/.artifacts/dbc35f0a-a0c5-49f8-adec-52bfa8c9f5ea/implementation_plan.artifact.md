# Correção de Navegação e Remoção de Resíduos (Vida Fit)

Identificamos que o aplicativo ainda apresenta falhas na navegação entre as páginas (Perfil e Metas) e resíduos visuais do projeto anterior. Vamos estabilizar o sistema de autenticação e limpar os componentes órfãos.

## User Review Required

> [!IMPORTANT]
> **Crash na Navegação**: O erro de "tela azul" ao trocar de página acontece porque a verificação de segurança (Notificações Push) estava rodando novamente em cada clique, causando um travamento. Vou mover essa verificação para o nível global do app para que rode apenas uma vez no login.

## Proposta de Mudanças

### [Core & Auth]

#### [MODIFY] [AuthContext.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/contexts/AuthContext.tsx)
- Adicionar o estado `pushStatus` e `pushChecked` ao contexto global.
- Realizar o registro do Push apenas uma vez após o login ser detectado.
- Isso permitirá que a troca de páginas (Dashboard -> Perfil) seja instantânea.

#### [MODIFY] [App.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/App.tsx)
- Simplificar o `ProtectedRoute` para ler o status do `AuthContext`.
- Remover a lógica redundante de chetagem que causava lentidão.

---

### [UI/UX - Correção de Dashboard]

#### [MODIFY] [Today.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Today.tsx)
- **CORREÇÃO CRÍTICA**: Remover erro de sintaxe onde o componente era exportado antes de ser definido.
- Garantir que as cores da marca (Dourado/Azul) sejam aplicadas corretamente.

#### [DELETE] [Index.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Index.tsx)
- Remover esta página que continha os desafios do "Vida Fit" e não está mais sendo usada nas rotas.

---

### [Nomenclatura]

#### [MODIFY] [Goals.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Goals.tsx)
- Revisar textos para garantir que não existam menções a "treinos" ou "saúde" (herança do Vida Fit).

## Plano de Verificação

### Manual Verification
- **Navegação**: Abrir o app -> Clicar em Metas -> Clicar em Perfil. A transição deve ser imediata.
- **Identidade**: Confirmar que o termo "Vida Fit" sumiu completamente de todas as telas.
- **Estabilidade**: Validar que o botão "Entrar sem sincronizar" só aparece se houver falha real de rede.
