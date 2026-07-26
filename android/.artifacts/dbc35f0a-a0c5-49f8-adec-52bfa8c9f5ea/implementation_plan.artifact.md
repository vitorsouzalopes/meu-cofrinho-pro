# Remoção da Página "Vida Fit" e Correção do Perfil

Identificamos que o componente `VidaFit` e suas rotas ainda estão presentes no projeto, causando confusão na interface do **Cofrinho PRO**. Além disso, o crash na página de perfil (tela azul) é causado por uma falha de carregamento no hook `usePremium`.

## User Review Required

> [!IMPORTANT]
> Vou remover permanentemente todas as referências ao projeto "Vida Fit" (páginas, utilitários e testes).
> O crash na página de perfil acontece porque o app está tentando verificar o status Premium sem carregar as bibliotecas de Anúncios necessárias, causando uma "quebra" no renderizador.

## Proposta de Mudanças

### [Limpeza de Marca]

#### [DELETE] [VidaFit.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/VidaFit.tsx)
- Excluir o arquivo da página.

#### [DELETE] [vida-fit.ts](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/lib/vida-fit.ts)
- Excluir utilitários e testes relacionados.

#### [MODIFY] [App.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/App.tsx)
- Remover a rota `/vidafit`.
- Limpar importações órfãs.

---

### [UI/UX - Correção de Crash]

#### [MODIFY] [Profile.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Profile.tsx)
- Adicionar o hook `usePremium()` que estava faltando.
- Garantir que a renderização do badge "Pro Member" dependa de dados carregados.
- Isso resolverá a "tela azul/trava" ao abrir o perfil.

---

### [Navegação]

#### [MODIFY] [BottomNav.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/components/BottomNav.tsx)
- Garantir que o link para "Vida Fit" (se existir) seja removido do menu inferior.

## Plano de Verificação

### Manual Verification
- **Menu**: O link para "Vida Fit" deve ter sumido do menu.
- **Perfil**: Clicar no Perfil deve abrir a tela de configurações normalmente (sem travar).
- **Consistência**: O nome **Cofrinho PRO** deve ser o único visível.
