## Refatoração de Planejamento de Dívidas - Múltiplas Dívidas

### 📋 Resumo da Refatoração

Foi implementado um novo sistema completo de simulação e planejamento de quitação de múltiplas dívidas simultaneamente, com suporte a 3 estratégias diferentes e visualização detalhada de timeline.

---

## ✨ Funcionalidades Implementadas

### 1. **Engine de Simulação Multi-Dívida** (`src/financial/multiDebtEngine.ts`)

#### Três Estratégias de Quitação:

- **Avalanche (Maior Juros)**
  - Prioriza dívidas com maior taxa de juros
  - Maximiza economia em juros futuros
  - Ideal para reduzir custos totais

- **Snowball (Menor Saldo)**
  - Prioriza dívidas com menor saldo
  - Gera vitórias rápidas e motivação psicológica
  - Melhor para manter consistência

- **Fluxo de Caixa (Maior Parcela)**
  - Prioriza dívidas com maior parcela mensal
  - Libera fluxo de caixa rapidamente quando quitada
  - Melhor para manter margem mensal

#### Cálculos para Cada Estratégia:

- ✅ Ordem de prioridade das dívidas
- ✅ Data estimada de quitação de cada dívida
- ✅ Data estimada de quitação total
- ✅ Economia estimada de juros (comparado a pagar apenas o mínimo)
- ✅ Efeito cascata das parcelas liberadas
- ✅ Timeline detalhada mês a mês

---

### 2. **Gerenciador de Dívidas** (`src/components/planner/MultiDebtManager.tsx`)

Interface para:
- ✅ Adicionar novas dívidas
- ✅ Editar dívidas existentes
- ✅ Remover dívidas
- ✅ Visualizar resumo (total de dívidas, valor disponível, alertas)

**Campos para cada dívida:**
- Nome e Banco
- Valor Total e Parcela Mensal
- Taxa de Juros Mensal (%)
- Parcelas Restantes
- Opções de amortização e quitação antecipada

---

### 3. **Comparador de Estratégias** (`src/components/planner/StrategyComparison.tsx`)

Exibe:
- ✅ Cards comparativos para cada estratégia
- ✅ Metrics principais (tempo, total pago, juros, economia)
- ✅ Prioridade e motivo de cada dívida
- ✅ Datas de quitação estimadas
- ✅ Efeito cascata (quando liberar parcelas para próximas dívidas)
- ✅ Timeline completa com detalhes mês a mês
- ✅ Recomendações automáticas

---

### 4. **Timeline Visual** (`src/components/planner/DebtTimeline.tsx`)

Visualização intuitiva com:
- ✅ Linha do tempo de quitação
- ✅ Eventos de quitação e efeito cascata
- ✅ Datas estimadas com contagem de dias
- ✅ Detalhes de cada dívida (juros economizados, parcelas quitadas)
- ✅ Resumo de economia total

---

### 5. **Componente Principal** (`src/components/planner/MultiDebtPayoff.tsx`)

Interface unificada que integra:
- ✅ Abas: Minhas Dívidas | Comparar Estratégias | Timeline
- ✅ Seleção de estratégia
- ✅ Visualização de cenário financeiro
- ✅ Resumo rápido dos resultados

---

### 6. **Integração** (`src/pages/Planner.tsx`)

- ✅ Substituído componente `DebtPayoff` pelo novo `MultiDebtPayoff`
- ✅ Mantém compatibilidade com fluxo existente

---

## 🧮 Algoritmos Principais

### Simulação Mês a Mês

```
Para cada mês até quitação de todas as dívidas:
  1. Aplicar juros em todas as dívidas ativas
  2. Ordenar dívidas conforme estratégia
  3. Distribuir valor disponível entre dívidas por ordem
  4. Registrar pagamentos, juros e saldos na timeline
  5. Marcar dívidas quitadas
```

### Cálculo de Economia de Juros

```
Economia = Juros_base - Juros_simulados

Onde:
  Juros_base = Juros se pagasse apenas a parcela mínima
  Juros_simulados = Juros com pagamento extra distribuído
```

### Efeito Cascata

```
Quando uma dívida é quitada:
  1. Sua parcela é liberada
  2. Valor é redirecionado para próxima dívida (conforme estratégia)
  3. Acelera quitação das demais
  4. Registrado na timeline como "Efeito Cascata"
```

---

## 📊 Tipos de Dados

### `StrategyResult`
Contém resultado completo de uma simulação:
```typescript
{
  estrategia: 'avalanche' | 'snowball' | 'fluxo-caixa'
  prioridade: []       // Ordem de quitação
  timeline: []         // Detalhes mês a mês
  datasQuitacao: Map   // Quando cada dívida será quitada
  dataQuitacaoTotal: Date
  totalPago: number
  totalJuros: number
  economiJuros: number // Economia comparado à base
  mesesTotais: number
  efeitos: {}          // Juros economizados por dívida
}
```

### `MonthlyPayment`
Detalhe de cada mês na timeline:
```typescript
{
  mes: number
  data: Date
  debtId: string
  nomeDivida: string
  pagamento: number    // Valor pago neste mês
  juros: number        // Juros aplicados
  saldoAnterior: number
  saldoPos: number     // Saldo após pagamento
  quitar: boolean      // Se foi quitada este mês
}
```

---

## 🎯 Diferenciais

1. **Múltiplas Dívidas**: Simula pagamento simultâneo de várias dívidas
2. **3 Estratégias**: Cada uma otimizada para objetivo diferente
3. **Efeito Cascata**: Mostra como liberar parcelas acelera quitação
4. **Timeline Visual**: Linha do tempo intuitiva com datas exatas
5. **Comparação Automática**: Identifica melhor estratégia para cada situação
6. **Economia Calculada**: Mostra quanto economiza vs. pagar apenas mínimo

---

## 🔄 Fluxo de Uso

1. Usuário acessa aba "Minhas Dívidas"
2. Adiciona todas suas dívidas
3. Sistema calcula valor disponível (Renda - Gastos Fixos)
4. Usuário clica em "Comparar"
5. Sistema simula 3 estratégias automaticamente
6. Usuário seleciona uma estratégia
7. Clica em "Timeline" para ver detalhes de quitação
8. Visualiza quando cada dívida será quitada e economia total

---

## 📁 Arquivos Criados/Modificados

### Criados:
- `src/financial/multiDebtEngine.ts` - Motor de simulação
- `src/components/planner/MultiDebtManager.tsx` - Gerenciador de dívidas
- `src/components/planner/StrategyComparison.tsx` - Comparador de estratégias
- `src/components/planner/DebtTimeline.tsx` - Timeline visual
- `src/components/planner/MultiDebtPayoff.tsx` - Componente principal

### Modificados:
- `src/pages/Planner.tsx` - Integração do novo componente

---

## 🚀 Próximas Melhorias Sugeridas

1. Persistência de dívidas no Supabase
2. Integração com histórico real de pagamentos
3. Alertas de data próxima de vencimento
4. Exportar simulação como PDF
5. Sugestões automáticas baseadas em padrões
6. Simulação de renda extra redirecionada
7. Suporte para dívidas com parcelamento variável

---

## ✅ Testes Recomendados

- [ ] Adicionar uma dívida e simular
- [ ] Comparar as 3 estratégias
- [ ] Verificar se economia de juros é maior que 0
- [ ] Testar com múltiplas dívidas (3+)
- [ ] Validar datas de quitação
- [ ] Confirmar efeito cascata aparece
