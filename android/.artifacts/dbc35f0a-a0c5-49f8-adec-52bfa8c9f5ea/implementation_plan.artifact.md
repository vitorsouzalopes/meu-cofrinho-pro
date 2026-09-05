# Plano de Mitigação de GAPs Técnicos - Fase 2

Este plano foca em **Experiência do Usuário (UX)** e **Acessibilidade**, garantindo que o app funcione offline e seja inclusivo.

## User Review Required

> [!IMPORTANT]
> **Cache Offline**: Vou ativar o cache agressivo para arquivos JavaScript e CSS. Isso significa que o app carregará instantaneamente, mas mudanças no código podem demorar um "refresh" para aparecer (o Service Worker cuidará disso).

## Proposed Changes

### 1. PWA & Offline (Médio)
Objetivo: Permitir que o usuário abra o app e veja seus dados mesmo sem internet.

#### [MODIFY] [public/service-worker.js](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/public/service-worker.js)
- Implementar estratégia `Stale-While-Revalidate` para assets (JS, CSS, HTML).
- Garantir que o `index.html` seja servido do cache como fallback quando offline.
- Adicionar pre-caching das rotas principais.

### 2. Acessibilidade & A11y (Médio)
Objetivo: Garantir que leitores de tela e navegação por teclado funcionem perfeitamente.

#### [MODIFY] [src/components/BottomNav.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/components/BottomNav.tsx)
- Adicionar `aria-label` em cada botão de navegação.
- Melhorar o contraste visual dos ícones inativos.

#### [MODIFY] [src/pages/Auth.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Auth.tsx)
- Adicionar labels acessíveis nos campos de input e botões de alternância (Login/Cadastro).

### 3. Performance & Imagens (Baixo)
Objetivo: Reduzir o tempo de carregamento inicial.

#### [MODIFY] [index.html](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/index.html)
- Adicionar `rel="preconnect"` para o domínio do Supabase.
- Otimizar o carregamento das fontes.

## Verification Plan

### Automated Tests
- Simular modo offline no Chrome DevTools e verificar se o app carrega.
- Executar auditoria de Acessibilidade (Lighthouse) e garantir pontuação acima de 90.

### Manual Verification
- Testar a navegação pelo teclado (Tab) em toda a página de login.
- Abrir o app no emulador com modo avião ativado.
