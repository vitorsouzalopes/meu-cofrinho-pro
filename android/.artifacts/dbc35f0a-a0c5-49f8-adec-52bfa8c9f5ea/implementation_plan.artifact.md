# Plano de Correção: Notificações e Ícones (Fase 11)

Este plano corrige o erro de execução (`ReferenceError`) na tela de Perfil e otimiza o fluxo de permissão para garantir que o app avance após a concessão.

## User Review Required

> [!WARNING]
> **Troca de Ícones**: Vou substituir o ícone `ShieldAlert` por `AlertCircle`. Isso é para garantir que não haja erros de importação dependendo da versão da biblioteca instalada no seu ambiente.

## Proposed Changes

### 1. Correção de Erro de Execução (Bug Crítico)
Objetivo: Eliminar o erro "ShieldAlert is not defined" que trava o app.

#### [MODIFY] [Profile.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Profile.tsx) e [NotificationWall.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/components/NotificationWall.tsx)
- Substituir `ShieldAlert` por `AlertCircle` nas importações e no JSX.

### 2. Fluxo de Permissão (UX)
Objetivo: Garantir que o app saia da tela de bloqueio assim que o usuário permitir as notificações.

#### [MODIFY] [NotificationWall.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/components/NotificationWall.tsx)
- Garantir que `onRetry()` seja chamado de forma resiliente após o fechamento do diálogo nativo.
- Adicionar logs extras para depurar caso o Android demore a atualizar o estado da permissão.

### 3. Teste de Notificação Local
#### [MODIFY] [Profile.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Profile.tsx)
- Usar a nova ponte nativa (`NotificationPermission`) para validar a permissão antes de disparar o agendamento local. Isso unifica o comportamento do app.

## Verification Plan

### Manual Verification
1.  **Instalar novo APK**.
2.  Abrir a aba **Perfil**: O app não deve mais dar erro de tela preta/vermelha.
3.  Clicar em **"Diagnóstico"**: Validar se o ícone agora aparece corretamente.
4.  Refazer o fluxo de **NotificationWall**: Confirmar se, ao permitir, a tela some e a Dashboard aparece.
