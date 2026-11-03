# Inventário de Tracking, SDKs e Consentimento — Cofrinho Pro

## 1. Visão Geral
Este documento apresenta o inventário completo de SDKs, ferramentas de rastreamento, armazenamento e análise integradas no Cofrinho Pro, especificando finalidade, dados tratados, base legal (LGPD/GDPR) e mecanismo de consentimento.

---

## 2. Inventário de SDKs e Tecnologias

| Fornecedor / SDK | Finalidade | Dados Tratados | Base Legal | Inicialização | Desativação / Consentimento |
|---|---|---|---|---|---|
| **Supabase** (Auth / DB) | Autenticação de usuários e persistência de dados financeiros | ID de usuário, e-mail, registros financeiros e perfis | Execução de contrato (Art. 7º, V, LGPD) | Na inicialização do app | Requer exclusão de conta ou logout |
| **Google AdMob** (Anúncios) | Exibição de anúncios no plano Free | Identificadores de dispositivo, dados de uso para publicidade | Consentimento (Art. 7º, I, LGPD / GDPR UMP) | Sob demanda (ao carregar banners/intersticiais) | Gerenciado via **Google UMP Consent Form** (`AdMob.requestConsentInfo`) |
| **Firebase Cloud Messaging** (FCM) | Envio de notificações push transacionais | Token FCM do dispositivo, plataforma e user-agent | Execução de contrato / Consentimento (Art. 7º, V ou I) | Opcional (após consentimento do usuário) | O usuário pode desativar nas configurações do app ou recusar o prompt inicial (`skipPush`) |
| **Firebase Crashlytics / Perf** | Monitoramento de erros e performance | Relatórios de crash, stack traces e métricas de desempenho | Legítimo interesse (Art. 7º, IX, LGPD) / Segurança | Na inicialização nativa | Integrado ao ciclo de vida do app |
| **SafeStorage / LocalStorage** | Armazenamento local de preferências de UI | Modo simples/avançado, estado de sessão | Execução de contrato (Art. 7º, V, LGPD) | Na inicialização | Limpeza de dados do navegador / app |

---

## 3. Mecanismo de Consentimento
- **Anúncios (AdMob):** Utiliza o fluxo regulatório do **Google User Messaging Platform (UMP)**, exibindo o formulário oficial de consentimento GDPR/LGPD antes de inicializar a exibição de anúncios personalizados.
- **Notificações Push:** O usuário passa explicitamente pelo componente `NotificationWall`, onde pode conceder permissão ou clicar em "Continuar sem notificações" (`skipPush`), garantindo que o push nunca seja obrigatório.
