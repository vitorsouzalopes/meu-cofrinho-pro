# Correção de Sincronização de Build e Erro de Push

Identificamos que os botões administrativos (Limpar Dados, etc.) ainda aparecem no APK porque o build do frontend (Vite) não foi atualizado antes da geração do APK. Além disso, vamos investigar e tratar o erro na função de push.

## User Review Required

> [!IMPORTANT]
> Vou forçar uma reconstrução completa do aplicativo (Frontend + Capacitor + Android) para garantir que as remoções de código que fizemos estejam presentes no seu dispositivo.

## Proposta de Mudanças

### [Build & Sincronização]

#### [ACTION] Reconstrução Completa
1. Executar `npm run build` para atualizar os arquivos em `dist/`.
2. Executar `npx cap copy android` para sincronizar o código novo com o projeto nativo.
3. Gerar um novo APK.

### [Notificações Push]

#### [MODIFY] [TelegramSettings.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/TelegramSettings.tsx)
- Melhorar o tratamento de erro no `triggerTest`.
- Adicionar logs para identificar se o erro vem de falta de permissão ou falha na Edge Function.

---

### [Limpeza de Código]

#### [MODIFY] [Profile.tsx](file:///C:/Users/vitor/StudioProjects/meu-cofrinho-pro/src/pages/Profile.tsx)
- Remover importação não utilizada do ícone `Trash2`.

## Plano de Verificação

### Automated Tests
- Validar se o comando de build do Vite termina com sucesso.
- Gerar o APK e verificar o log de compilação.

### Manual Verification
- Instalar o novo APK e confirmar que os botões "Limpar Dados..." sumiram.
- Tentar enviar o push de teste e observar os novos logs/mensagens de erro.
