# Plano de Mitigação de GAPs Técnicos - Fase 3

Este plano foca na **Qualidade de Software (E2E)**, **SEO Dinâmico** e **Higiene de Segurança**, preparando o app para um lançamento profissional.

## User Review Required

> [!IMPORTANT]
> **Playwright E2E**: Vou configurar o ambiente de testes para que você possa rodar `npx playwright test` no futuro. Isso garante que mudanças no código não quebrem o login ou o cadastro de contas principais.

> [!NOTE]
> **SEO Dinâmico**: O título da aba do navegador agora mudará conforme você navega (ex: "Metas | Cofrinho PRO" em vez de apenas "Cofrinho PRO").

## Proposed Changes

### 1. Testes de Interface (E2E) - Severidade Média
Objetivo: Automatizar a verificação dos fluxos críticos para evitar regressões.

#### [NEW] [tests/auth.spec.ts](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/tests/auth.spec.ts)
- Criar teste Playwright para o fluxo de login e navegação básica.
- Verificar se a tela de erro (ErrorBoundary) não é disparada em condições normais.

### 2. SEO Dinâmico & UX - Severidade Média
Objetivo: Melhorar a indexação e a experiência de multi-abas no navegador.

#### [MODIFY] [src/App.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/App.tsx)
- Envolver o app com `HelmetProvider`.

#### [MODIFY] [src/pages/Today.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Today.tsx), [src/pages/Goals.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Goals.tsx), etc.
- Adicionar componente `Helmet` para definir títulos dinâmicos em cada página.

### 3. Segurança & Armazenamento - Severidade Média
Objetivo: Sanitizar o uso de dados locais.

#### [NEW] [src/lib/safe-storage.ts](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/lib/safe-storage.ts)
- Wrapper para `localStorage` com tratamento de erro e prefixo consistente.
- Garantir que dados sensíveis não sejam persistidos desnecessariamente.

### 4. Performance de Imagens - Severidade Baixa
Objetivo: Reduzir consumo de dados e acelerar o render.

#### [MODIFY] [src/pages/Auth.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Auth.tsx)
- Otimizar a tag da logo com `fetchpriority="high"` e `loading="eager"`.
- Adicionar `decoding="async"` para imagens secundárias.

## Verification Plan

### Automated Tests
- Executar `npx playwright test` (se as dependências estiverem prontas no ambiente).
- Validar se o build de produção (`npm run build`) mantém os chunks separados conforme Fase 1.

### Manual Verification
- Navegar pelo app e observar a mudança no título da aba do navegador.
- Verificar se a logo do app carrega sem "piscar" (layout shift) durante o login.
