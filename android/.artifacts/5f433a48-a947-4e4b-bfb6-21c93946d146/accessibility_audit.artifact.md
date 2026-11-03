# Relatório de Auditoria de Acessibilidade (WCAG 2.2 AA) — Cofrinho Pro

## 1. Escopo e Diretrizes
Esta auditoria avalia o Cofrinho Pro frente às diretrizes **WCAG 2.2 Nível AA** (Web Content Accessibility Guidelines), cobrindo navegação por teclado, contraste de cores, suporte a leitores de tela, rotulagem de formulários e gerenciamento de foco em modais.

---

## 2. Critérios Avaliados

| Critério WCAG 2.2 | Status | Observações / Evidências no Código |
|---|---|---|
| **1.4.3 Contraste (Mínimo)** | **Aprovado** | Paleta de cores baseada em `#0A0E1A` (Dark Background), textos primários em branco/cinza claro e destaque em `#D4A017` (Gold), atendendo à proporção mínima de 4.5:1 para texto normal. |
| **2.1.1 Teclado** | **Aprovado** | Todos os elementos interativos (botões, inputs, abas e diálogos) são navegáveis via tecla `Tab`. |
| **2.4.7 Foco Visível** | **Aprovado** | Utilização de anéis de foco (`focus-visible`) nativos do Tailwind e componentes Shadcn UI em botões e campos de entrada. |
| **3.3.2 Rótulos ou Instruções** | **Aprovado** | Formulários de autenticação (`Auth.tsx`), perfis (`Profile.tsx`) e modais possuem `aria-label` e rótulos descritivos associados aos inputs. |
| **2.4.3 Ordem de Foco** | **Aprovado** | Modais utilizam gerenciamento de foco rigoroso via Radix UI / Shadcn UI (`DialogContent`), retendo o foco dentro do modal enquanto aberto. |
| **1.1.1 Conteúdo Não Textual** | **Aprovado** | Imagens informativas e logotipos possuem texto alternativo adequado (`alt="Cofrinho PRO"`). |

---

## 3. Conclusão da Auditoria
O aplicativo atinge um elevado padrão de acessibilidade, garantindo que usuários com deficiência visual, motora ou auditiva possam navegar, preencher formulários e gerenciar suas finanças com segurança e autonomia.
