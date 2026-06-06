import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Plus, Trash2, Edit2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Debt } from '@/financial/types';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

interface MultiDebtManagerProps {
  debts: Debt[];
  onDebtsChange: (debts: Debt[]) => void;
  totalIncome: number;
  currentExpenses: number;
}

export default function MultiDebtManager({
  debts,
  onDebtsChange,
  totalIncome,
  currentExpenses,
}: MultiDebtManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Debt>>({
    id: '',
    nome: '',
    banco: '',
    valorTotal: 0,
    valorParcela: 0,
    parcelasRestantes: 0,
    jurosMensal: 0,
    tipo: 'credito',
    vencimento: '',
    permiteAmortizacao: false,
    permiteQuitacao: true,
  });

  const totalDividas = debts.reduce((sum, d) => sum + d.valorTotal, 0);
  const totalParcelasFixas = debts.reduce((sum, d) => sum + d.valorParcela, 0);
  const disponivel = Math.max(0, totalIncome - currentExpenses - totalParcelasFixas);
  const maiorJuro = debts.length > 0 ? Math.max(...debts.map((d) => d.jurosMensal)) : 0;

  const handleAddOrUpdateDebt = () => {
    if (!formData.nome || !formData.banco || !formData.valorTotal) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    if (editingId) {
      // Atualizar
      const novaLista = debts.map((d) => (d.id === editingId ? { ...d, ...formData } : d)) as Debt[];
      onDebtsChange(novaLista);
      setEditingId(null);
    } else {
      // Adicionar
      const novaLista = [
        ...debts,
        {
          id: Date.now().toString(),
          ...formData,
        } as Debt,
      ];
      onDebtsChange(novaLista);
    }

    setFormData({
      id: '',
      nome: '',
      banco: '',
      valorTotal: 0,
      valorParcela: 0,
      parcelasRestantes: 0,
      jurosMensal: 0,
      tipo: 'credito',
      vencimento: '',
      permiteAmortizacao: false,
      permiteQuitacao: true,
    });
    setShowAddForm(false);
  };

  const handleDelete = (id: string) => {
    onDebtsChange(debts.filter((d) => d.id !== id));
  };

  const handleEdit = (debt: Debt) => {
    setFormData(debt);
    setEditingId(debt.id);
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormData({
      id: '',
      nome: '',
      banco: '',
      valorTotal: 0,
      valorParcela: 0,
      parcelasRestantes: 0,
      jurosMensal: 0,
      tipo: 'credito',
      vencimento: '',
      permiteAmortizacao: false,
      permiteQuitacao: true,
    });
  };

  return (
    <div className="space-y-4">
      {/* Status Summary */}
      <Card className="p-4 bg-card border-border">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total de Dívidas</p>
            <p className="font-bold text-destructive text-lg">{formatCurrency(totalDividas)}</p>
            <p className="text-xs text-muted-foreground mt-1">{debts.length} dívida(s) cadastrada(s)</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Valor Disponível</p>
            <p
              className={cn(
                'font-bold text-lg',
                disponivel > 0 ? 'text-emerald-accent' : 'text-destructive'
              )}
            >
              {formatCurrency(disponivel)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Após parcelas fixas</p>
          </div>
        </div>

        {disponivel <= 0 && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-xs text-destructive">
              Você não tem valor disponível para quitar dívidas. Redução de gastos necessária.
            </p>
          </div>
        )}

        {maiorJuro > 10 && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-2 mt-3">
            <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
            <p className="text-xs text-destructive">
              Você tem dívidas com taxa acima de 10% a.m. Priorize quitá-las.
            </p>
          </div>
        )}
      </Card>

      {/* Lista de Dívidas */}
      {debts.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground text-sm">Suas Dívidas</h3>
          {debts.map((debt) => (
            <Card key={debt.id} className="p-4 border-border bg-card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-foreground">{debt.nome}</h4>
                    <span className="px-2 py-0.5 bg-muted rounded text-xs text-muted-foreground">{debt.banco}</span>
                    {debt.jurosMensal > 10 && (
                      <span className="px-2 py-0.5 bg-destructive/20 rounded text-xs text-destructive font-medium">
                        ⚠ Alta Taxa
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{debt.tipo}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(debt)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    title="Editar dívida"
                  >
                    <Edit2 className="w-4 h-4 text-gold" />
                  </button>
                  <button
                    onClick={() => handleDelete(debt.id)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    title="Deletar dívida"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Valor Total</p>
                  <p className="font-semibold text-foreground">{formatCurrency(debt.valorTotal)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Parcela Mensal</p>
                  <p className="font-semibold text-foreground">{formatCurrency(debt.valorParcela)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Juros</p>
                  <p className={cn('font-semibold', debt.jurosMensal > 10 ? 'text-destructive' : 'text-foreground')}>
                    {debt.jurosMensal}% a.m.
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Parcelas Restantes</p>
                  <p className="font-semibold text-foreground">{debt.parcelasRestantes}</p>
                </div>
              </div>

              {debt.permiteAmortizacao && (
                <p className="text-xs text-emerald-accent mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Permite amortização
                </p>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card className="p-4 border-border bg-muted/20 space-y-4">
          <h3 className="font-semibold text-foreground">
            {editingId ? 'Editar Dívida' : 'Adicionar Nova Dívida'}
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Nome *</Label>
              <Input
                placeholder="Cartão Nubank"
                value={formData.nome || ''}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Banco *</Label>
              <Input
                placeholder="Nubank"
                value={formData.banco || ''}
                onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Valor Total *</Label>
              <Input
                type="number"
                placeholder="5000"
                value={formData.valorTotal || ''}
                onChange={(e) => setFormData({ ...formData, valorTotal: Number(e.target.value) })}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Parcela Mensal *</Label>
              <Input
                type="number"
                placeholder="500"
                value={formData.valorParcela || ''}
                onChange={(e) => setFormData({ ...formData, valorParcela: Number(e.target.value) })}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Juros Mensal (%) *</Label>
              <Input
                type="number"
                placeholder="12"
                step="0.1"
                value={formData.jurosMensal || ''}
                onChange={(e) => setFormData({ ...formData, jurosMensal: Number(e.target.value) })}
                className="bg-background border-border"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Parcelas Restantes *</Label>
              <Input
                type="number"
                placeholder="10"
                value={formData.parcelasRestantes || ''}
                onChange={(e) => setFormData({ ...formData, parcelasRestantes: Number(e.target.value) })}
                className="bg-background border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.permiteAmortizacao || false}
                onChange={(e) => setFormData({ ...formData, permiteAmortizacao: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-muted-foreground">Permite amortização?</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.permiteQuitacao || true}
                onChange={(e) => setFormData({ ...formData, permiteQuitacao: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-muted-foreground">Permite quitação antecipada?</span>
            </label>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAddOrUpdateDebt}
              className="flex-1 px-4 py-2 bg-emerald-accent text-white rounded-lg font-medium hover:bg-emerald-accent/90 transition-colors"
            >
              {editingId ? 'Atualizar' : 'Adicionar'}
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </Card>
      )}

      {/* Add Button */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full py-3 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:border-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Adicionar Dívida
        </button>
      )}
    </div>
  );
}
