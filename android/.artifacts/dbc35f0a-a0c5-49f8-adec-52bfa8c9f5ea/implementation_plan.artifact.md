# Plano de Mitigação de GAPs Técnicos - Fase 1

Este plano foca em resolver os problemas de **Severidade Crítica e Alta** identificados na auditoria técnica, priorizando a estabilidade do código (Tipagem) e a observabilidade (Monitoramento).

## User Review Required

> [!IMPORTANT]
> **Sentry DSN**: Para habilitar o monitoramento de erros, você precisará criar uma conta gratuita no Sentry.io e me fornecer a "DSN". Vou deixar o código preparado, mas ele só enviará dados após você inserir essa chave.

> [!WARNING]
> **Refatoração de Tipos**: Vou remover os `as any` dos hooks financeiros. Isso pode revelar bugs ocultos no código que tratarei durante a execução.

## Proposed Changes

### 1. TypeScript & Core (Crítico)
Objetivo: Garantir que o TypeScript proteja as operações financeiras.

#### [MODIFY] [hooks/use-finance-data.ts](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/hooks/use-finance-data.ts)
- Corrigir as queries do Supabase para inferir tipos automaticamente de `Database["public"]["Tables"]`.
- Remover casts de `any[]` nos retornos das funções `useDebts` e `useGoals`.

#### [MODIFY] [pages/Accounts.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Accounts.tsx)
- Tipar corretamente o formulário de dívidas para evitar erros de nomes de campos (ex: `valor_total` vs `valorTotal`).

### 2. Observabilidade & Erros (Alto)
Objetivo: Saber quando o app quebra no celular do usuário.

#### [NEW] [lib/sentry.ts](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/lib/sentry.ts)
- Configuração básica do Sentry SDK para capturar exceções globais.

#### [MODIFY] [main.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/main.tsx)
- Inicializar o Sentry no ponto de entrada do app.

### 3. Edge Functions (Alto)
Objetivo: Tornar os endpoints de notificação mais seguros.

#### [MODIFY] [supabase/functions/notify-event/index.ts](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/supabase/functions/notify-event/index.ts)
- Implementar validação de schema para o objeto `payload`.
- Adicionar logs estruturados para debug no console do Supabase.

### 4. SEO & Metadados (Médio)
Objetivo: Melhorar o compartilhamento do app.

#### [MODIFY] [index.html](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/index.html)
- Corrigir a URL da `og:image` para uma imagem estática persistente (favicon/logo).
- Adicionar tags de `theme-color` consistentes.

## Verification Plan

### Automated Tests
- Executar `npm run build` para validar que as novas tipagens não quebraram o build.
- Rodar `vitest` para garantir que a lógica financeira (já testada) continua íntegra.

### Manual Verification
- Abrir a tela de Contas e salvar uma dívida: verificar se o tipo inferido no código bate com os campos do banco.
- Simular um erro manual (ex: `throw new Error()`) e verificar se o `ErrorBoundary` mostra o stack trace formatado.
