# Guia de Configuração do Servidor (Supabase & Firebase)

Para que as notificações do Cofrinho PRO funcionem, você precisa garantir que o servidor do Supabase tenha as credenciais do seu projeto Firebase e que as funções estejam publicadas.

## 1. Publicar as Funções (Edge Functions)

No terminal do seu computador (dentro da pasta raiz do projeto), execute:

```bash
# Se ainda não estiver logado
npx supabase login

# Publicar as funções atualizadas
npx supabase functions deploy notify-event --project-ref vevhbkqaigbmlurgpyph
npx supabase functions deploy send-fcm --project-ref vevhbkqaigbmlurgpyph
```

---

## 2. Configurar os Segredos (Secrets)

O servidor precisa saber como falar com o Firebase. Você precisará do arquivo JSON da sua **Conta de Serviço do Firebase** (gerado no Console do Firebase > Configurações do Projeto > Contas de Serviço).

Copie o conteúdo desse JSON e rode o seguinte comando:

```bash
npx supabase secrets set FCM_SERVICE_ACCOUNT_JSON='COLE_O_CONTEUDO_DO_JSON_AQUI' --project-ref vevhbkqaigbmlurgpyph
```

> [!CAUTION]
> Certifique-se de envolver o JSON com aspas simples (`'`) para evitar erros no terminal.

---

## 3. Verificar no Painel Supabase

1.  Acesse [database.new](https://supabase.com/dashboard).
2.  Vá em **Edge Functions**.
3.  Verifique se `notify-event` e `send-fcm` aparecem na lista.
4.  Clique em uma delas e vá em **Settings** para confirmar se a variável `FCM_SERVICE_ACCOUNT_JSON` está lá.

---

## Como testar após configurar?

1.  Abra o App no celular.
2.  Vá em **Perfil > Diagnóstico do Sistema**.
3.  Se o diagnóstico der "Verde" ✅, tente o botão **"Enviar Push de Teste"** na tela de Notificações.
