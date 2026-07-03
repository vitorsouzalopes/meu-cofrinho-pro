## Diagnóstico

A aba **Previsão** (`ForecastReport.tsx`) já está correta: simula todas as dívidas individualmente (Normal / Hard / Mista), lista cada uma em card próprio e possui dois botões "Gerar Relatório PDF" (topo do card de controles e no final da lista). O exportador nativo `src/lib/forecast-pdf.ts` usa `jspdf` + `jspdf-autotable` (ambos instalados).

O conceito de "Dívida prioritária" que ainda aparece na tela vem da aba **IA** (`SmartDebtDashboard.tsx`) — que mostra um card grande "Dívida prioritária" no topo. É essa a fonte da percepção "só simula uma dívida".

## Mudanças

### 1. `src/components/planner/SmartDebtDashboard.tsx` — remover conceito de prioridade
- Remover o card **"Dívida prioritária"** (linhas 88-116).
- Substituir por uma lista/grade com **todas as dívidas ranqueadas** pelo `smartPriority` (posição, nome, banco, juros, parcela, restante, score) — sem destacar uma como "a" prioritária.
- Trocar o título para "Ranking de dívidas" (mantém utilidade de ordenação sem eleger uma).
- Manter Sugestões IA, Previsão do mês e Comparativo de estratégias intactos.

### 2. `src/components/planner/ForecastReport.tsx` — garantir botão PDF sempre visível e funcional
- Manter o botão do topo (dentro do card de controles) e também o botão permanente após a lista de dívidas.
- Adicionar `type="button"` nos dois botões (evita submit acidental dentro de forms wrappers).
- Envolver `handleExportPDF` com try/catch já existe; adicionar `console.log` do payload antes do `exportForecastPDF` para diagnosticar caso o toast de erro apareça.
- Verificar que a lista `debtSimulations.map(...)` já renderiza 100% das dívidas (já está correto, apenas confirmação).

### 3. `src/lib/forecast-pdf.ts` — robustez
- Fallback para o import dinâmico do `jspdf-autotable`: além de `default` / `autoTable`, tentar chamar via `autoTable(doc, ...)` e, se indisponível, cair para `(doc as any).autoTable(...)` (a v5 registra no protótipo).
- Sanitizar valores `Infinity`/`NaN` em `duration()` e `fmt()` para evitar exceção que aborte a geração.

### 4. Verificação
- Rodar tsgo/build automático da plataforma.
- Abrir aba Previsão com dívidas cadastradas: confirmar lista completa e clique no botão gera o arquivo `Relatorio-Dividas-YYYY-MM-DD.pdf`.
- Abrir aba IA: confirmar que o card "Dívida prioritária" sumiu e todas aparecem no ranking.

## Fora de escopo
- Reescrita das estratégias `avalanche` / `snowball` / `smart` (mantidas apenas como ordenação).
- Alterações em `MultiDebtPayoff` (aba Quitar) — já lista todas as dívidas.
