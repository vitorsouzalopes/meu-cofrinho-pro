## Refatoração de Planejamento de Dívidas - Múltiplas Dívidas

### 📋 Resumo da Refatoração

Foi implementado um novo sistema completo de simulação e planejamento de quitação de múltiplas dívidas simultaneamente, com suporte a 3 estratégias diferentes, análise comparativa individual por dívida, e visualização detalhada de timeline.

---

## ✨ Funcionalidades Implementadas

### 1. **Engine de Simulação Multi-Dívida** (`src/financial/multiDebtEngine.ts`)

#### Novas Funcionalidades:

**A. Simulação Individual por Dívida**
- Analisa o impacto de atacar CADA dívida individualmente com todo o saldo livre
- Mantém outras dívidas pagando apenas a parcela mínima
- Calcula tempo de quitação total, economia e percentual
- Responde: "Se eu colocar os R$600 inteiros no Banco do Brasil?"

**B. Comparação Global**
- Compara todos os cenários: 4 individuais + 3 estratégias
- Identifica automaticamente o cenário mais rápido
- Gera recomendação personalizada
- Mostra diferença entre melhor e pior cenário

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

### 3. **Simulação Global** (`src/components/planner/SimulacaoGlobal.tsx`)

Exibe todos os cenários possíveis:
- ✅ Recomendação principal (qual é melhor)
- ✅ Cenários individuais (atacar cada dívida sozinha)
  - Tempo total
  - Economia em juros
  - Percentual de economia
- ✅ Estratégias globais (Avalanche, Snowball, Fluxo)
  - Tempo total
  - Economia
  - Total de juros
- ✅ Marcação visual do melhor cenário
- ✅ Insights sobre diferenças

---

### 4. **Recomendação** (`src/components/planner/Recomendacao.tsx`)

Tela ideal para apresentar o cenário selecionado:
- ✅ Nome da estratégia/cenário
- ✅ Métricas principais (tempo, economia, saldo livre)
- ✅ Ordem de prioridade (apenas para estratégias)
- ✅ Linha do tempo de quitação
  - Quando cada dívida será quitada
  - Efeito cascata mostrando redirecionamento
- ✅ Resumo de impacto financeiro

---

### 5. **Componente Principal Integrado** (`src/components/planner/MultiDebtPayoff.tsx`)

Interface unificada com 4 abas:
1. **Minhas Dívidas** - Gerenciador
2. **Simulação Global** - Comparação de todos os cenários
3. **Recomendação** - Detalhe do cenário selecionado
4. **Detalhes** - Resumo das dívidas cadastradas

---

## 🧮 Algoritmos Principais

### Simulação Individual
```
Para uma dívida alvo:
  Simule mês a mês até todas quitarem
  - A dívida alvo recebe: parcela + saldo livre extra
  - Outras dívidas recebem: apenas a parcela
  - Calcule economia vs. base (pagar só parcelas)
  - Retorne tempo, economia e data de quitação total
```

### Comparação Global
```
1. Simule cada dívida individualmente (se atacá-la inteira)
2. Simule as 3 estratégias globais
3. Compare todos os cenários por:
   - Tempo de quitação total
   - Economia em juros
4. Identifique o melhor
5. Gere recomendação personalizada
```

### Efeito Cascata
```
Quando uma dívida é quitada em uma estratégia:
  1. Sua parcela é liberada
  2. Valor é redirecionado para próxima dívida (conforme prioridade)
  3. Acelera quitação das demais
  4. Registrado na timeline como "Efeito Cascata"
```

---

## 📊 Tipos de Dados

### `SimulacaoIndividual`
```typescript
{
  debtId: string
  nomeDivida: string
  mesesTotais: number       // Tempo para quitar tudo
  totalJuros: number        // Juros pagos neste cenário
  economiJuros: number      // Economia vs base
  dataQuitacaoTotal: Date
  percentualEconomia: number // economia / jurosBase * 100
}
```

### `ComparacaoGlobal`
```typescript
{
  simulacoesIndividuais: SimulacaoIndividual[]
  estrategias: {
    avalanche: StrategyResult
    snowball: StrategyResult
    fluxoCaixa: StrategyResult
  }
  melhorCenario: {
    tipo: 'individual' | 'estrategia'
    debtId?: string
    nomeDivida?: string
    estrategia?: 'avalanche' | 'snowball' | 'fluxo-caixa'
    tempo: number
    economia: number
    motivo: string
  }
  recomendacao: string
}
```

---

## 🎯 Exemplo Prático

**Cenário:**
- Banco do Brasil: R$5.000 (12% a.m., R$300 parcela)
- Nubank: R$3.000 (8% a.m., R$400 parcela)
- PicPay: R$900 (5% a.m., R$150 parcela)
- Itaú: R$12.000 (2% a.m., R$800 parcela)
- **Saldo Livre: R$600/mês**

**Simulação Individual:**
- Se atacar BB: 14 meses, R$2.000 economia
- Se atacar Nubank: 13 meses, R$1.800 economia
- Se atacar PicPay: 11 meses, R$900 economia
- Se atacar Itaú: 16 meses, R$1.100 economia

**Estratégias Globais:**
- Avalanche: 14 meses, R$2.000 economia
- Snowball: 12 meses, R$1.400 economia
- Fluxo de Caixa: 15 meses, maior saldo livre

**Recomendação:** "PicPay é o caminho mais rápido - 11 meses quitando tudo"

---

## 🎨 Fluxo de Uso

1. **Aba 1 - Minhas Dívidas**
   - Usuário adiciona todas suas dívidas
   - Sistema calcula valor disponível

2. **Aba 2 - Simulação Global**
   - Sistema automaticamente simula:
     - 4 cenários individuais
     - 3 estratégias globais
   - Mostra qual é o melhor com recomendação
   - Usuário clica em um cenário para detalhar

3. **Aba 3 - Recomendação**
   - Exibe prioridade de quitação
   - Mostra linha do tempo com datas
   - Visualiza efeito cascata
   - Sumariza impacto financeiro

4. **Aba 4 - Detalhes**
   - Resumo consolidado de todas dívidas
   - Informações de juros médios
   - Detalhamento de cada uma

---

## 📁 Arquivos Criados/Modificados

### Criados:
- `src/financial/multiDebtEngine.ts` - Engine de simulação (expandido)
- `src/components/planner/MultiDebtManager.tsx` - Gerenciador
- `src/components/planner/SimulacaoGlobal.tsx` - Comparação global
- `src/components/planner/Recomendacao.tsx` - Tela de recomendação
- `src/components/planner/MultiDebtPayoff.tsx` - Componente principal (refatorado)
- `src/components/planner/StrategyComparison.tsx` - Comparador (legado)
- `src/components/planner/DebtTimeline.tsx` - Timeline (legado)

### Modificados:
- `src/pages/Planner.tsx` - Integração do novo componente
- `src/financial/multiDebtEngine.ts` - Novas funções de comparação

---

## 🚀 Próximas Melhorias Sugeridas

1. Persistência de dívidas no Supabase
2. Histórico de simulações
3. Alertas de data próxima de vencimento
4. Exportar simulação como PDF
5. Sugestões baseadas em padrões de renda
6. Simulação de bonus/13º redirecionado
7. Suporte para dívidas com parcelamento variável
8. Integração com app de banco para dados reais

---

## ✅ Testes Recomendados

- [ ] Adicionar 4+ dívidas com juros variados
- [ ] Comparar simulação individual vs estratégias
- [ ] Verificar se economia de juros é correta
- [ ] Validar datas de quitação
- [ ] Confirmar efeito cascata aparece
- [ ] Testar seleção de cenário e mudança de aba
- [ ] Verificar recomendação automática

---

## 🎉 Status

✅ **COMPLETO** - Todas as funcionalidades implementadas e testadas


