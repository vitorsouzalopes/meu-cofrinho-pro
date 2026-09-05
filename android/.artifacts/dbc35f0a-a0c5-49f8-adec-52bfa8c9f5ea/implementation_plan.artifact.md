# Plano de Diagnóstico e Recuperação de Notificações (Fase 5)

Este plano visa resolver os erros de "Edge Functions" ao testar notificações, fornecendo ferramentas de depuração diretamente no app e instruções de configuração do servidor.

## User Review Required

> [!IMPORTANT]
> **Ação Manual Necessária**: Para as notificações funcionarem, você precisará rodar alguns comandos no seu terminal usando a Supabase CLI. Vou fornecer o manual exato.

## Proposed Changes

### 1. Ferramenta de Diagnóstico no App
Objetivo: Identificar se o problema é no celular (token) ou no servidor (Edge Functions).

#### [MODIFY] [src/pages/Profile.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Profile.tsx)
- Adicionar a função `runDiagnostic` que testa:
  1. Conectividade com a internet.
  2. Validade do Token de Notificação local.
  3. Chamada de "ping" para a Edge Function.

### 2. Melhoria na Resiliência das Funções
Objetivo: Retornar erros legíveis em vez de 500 generoso.

#### [MODIFY] [supabase/functions/send-fcm/index.ts](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/supabase/functions/send-fcm/index.ts)
- Adicionar logs de "Fase de Inicialização" para identificar se o erro ocorre no parse do JSON da conta de serviço do Google.

### 3. Manual de Configuração (Checklist)
#### [NEW] [SUPABASE_SETUP.artifact.md](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/android/.artifacts/dbc35f0a-a0c5-49f8-adec-52bfa8c9f5ea/SUPABASE_SETUP.artifact.md)
- Guia passo a passo com os comandos `supabase functions deploy` e `supabase secrets set`.

## Verification Plan

### Manual Verification
- Clicar no novo botão **"Diagnóstico do Sistema"** no Perfil.
- Verificar se o logcat mostra: `[Diagnostic] Function notify-event reachable: true`.
- Confirmar se o `token` do FCM está sendo enviado para a tabela `fcm_tokens` no banco de dados.
