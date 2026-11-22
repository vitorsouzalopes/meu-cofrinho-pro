# Consultor IA, validação de segurança e auditoria do APK

## 1. Consultor IA — campo de digitação visível
Problema: a caixa de texto fica presa no rodapé por cima da barra de navegação e some atrás do teclado no celular; o texto digitado usa cor fixa que se perde no fundo.
- Tela passa a ocupar a altura real visível (acompanha o teclado abrindo/fechando).
- Caixa de digitação vira parte da tela (não mais "flutuando"), acima da barra de navegação e da área segura do celular.
- Campo vira caixa de várias linhas que cresce até ~4 linhas, com cor de texto do tema (legível).
- Ao abrir o teclado, a conversa rola até a última mensagem.
- Ocupa a largura da tela no celular e fica centralizada no computador.

## 2. Validação da correção de segurança (já conferida)
As regras atuais das configurações do app: leitura, criação, edição e exclusão só para administradores. Vou rodar a verificação de segurança de novo e mostrar o resultado.

## 3. Auditoria completa do APK
Relatório em chat (e arquivo PDF para download) cobrindo:
- Configuração Android: permissões, backup, links profundos (meucofrinho.com sem verificação de domínio publicada), tráfego sem criptografia, ícones, versão.
- Plugins nativos: push, notificações locais, biometria, anúncios (AdMob/consentimento), splash, botão voltar.
- Fluxos no app via navegador automatizado em tamanho de celular: login, Hoje, Desafios, Planejador (bloqueio Premium), Consultor IA, Notificações, Perfil, painel Premium — com capturas de tela.
- Push: registro do token e envio de teste, conferindo os registros do servidor.
- Segurança: verificação rápida do banco + pontos de atenção do código.
- Lista final: Funciona / Quebrado / Risco, com prioridade. Correções pequenas e seguras eu já aplico; mudanças maiores ficam listadas para você aprovar.

## Detalhes técnicos
- AIConsultant: trocar `h-screen` por `h-[100dvh]`, input em `shrink-0` dentro do flex (remover `fixed`), `pb-[calc(env(safe-area-inset-bottom)+64px)]` se BottomNav visível, Textarea autosize, remover `text-white` → `text-foreground`.
- Auditoria: ler AndroidManifest, network_security_config, build.gradle (versionCode/minSdk), capacitor.config; Playwright 390x844; edge function logs de send-fcm; security--run_security_scan.
