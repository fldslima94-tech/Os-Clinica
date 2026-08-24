import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  Package, 
  CreditCard, 
  DollarSign, 
  AlertTriangle,
  Minus,
  Plus,
  Trash2,
  Sparkles,
  Receipt
} from 'lucide-react';
import { 
  Agendamento, 
  EstoqueInsumo, 
  FormaPagamento, 
  InsumoConsumido, 
  StatusPagamento 
} from '../types';
import { RECEITA_INSUMOS_PADRAO } from '../data/mockData';

interface CompleteProcedureModalProps {
  isOpen: boolean;
  onClose: () => void;
  agendamento: Agendamento | null;
  estoque: EstoqueInsumo[];
  onConfirmComplete: (
    agendamentoId: string, 
    insumosUsados: InsumoConsumido[], 
    pagamento: {
      valor: number;
      forma: FormaPagamento;
      status: StatusPagamento;
      observacao?: string;
    }
  ) => void;
}

export const CompleteProcedureModal: React.FC<CompleteProcedureModalProps> = ({
  isOpen,
  onClose,
  agendamento,
  estoque,
  onConfirmComplete,
}) => {
  const [insumosUsados, setInsumosUsados] = useState<InsumoConsumido[]>([]);
  const [valorFinal, setValorFinal] = useState<number>(0);
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('pix');
  const [statusPagamento, setStatusPagamento] = useState<StatusPagamento>('pago');
  const [observacaoPagamento, setObservacaoPagamento] = useState('');
  const [selectedInsumoToAdd, setSelectedInsumoToAdd] = useState('');

  useEffect(() => {
    if (agendamento) {
      setValorFinal(agendamento.valor_estimado || 0);
      setFormaPagamento(agendamento.forma_pagamento || 'pix');
      setStatusPagamento(agendamento.status_pagamento || 'pago');
      setObservacaoPagamento('');

      // Check if this procedure has a default recipe in mockData
      const receita = RECEITA_INSUMOS_PADRAO[agendamento.procedimento];
      if (receita) {
        const mapped: InsumoConsumido[] = receita.map(itemReceita => {
          const itemEstoque = estoque.find(e => e.nome_item === itemReceita.nome_item);
          return {
            insumo_id: itemEstoque?.id || `temp-${Math.random()}`,
            nome_item: itemReceita.nome_item,
            quantidade: itemReceita.quantidade,
            unidade_medida: itemReceita.unidade_medida,
            lote: itemEstoque?.lote || 'LOTE-PADRÃO',
          };
        });
        setInsumosUsados(mapped);
      } else {
        // Fallback or empty
        setInsumosUsados([]);
      }
    }
  }, [agendamento, estoque, isOpen]);

  if (!isOpen || !agendamento) return null;

  const handleAddInsumo = () => {
    if (!selectedInsumoToAdd) return;
    const item = estoque.find(e => e.id === selectedInsumoToAdd);
    if (!item) return;

    // Check if already in list
    const existingIndex = insumosUsados.findIndex(i => i.insumo_id === item.id);
    if (existingIndex >= 0) {
      const copy = [...insumosUsados];
      copy[existingIndex].quantidade += 1;
      setInsumosUsados(copy);
    } else {
      setInsumosUsados(prev => [
        ...prev,
        {
          insumo_id: item.id,
          nome_item: item.nome_item,
          quantidade: 1,
          unidade_medida: item.unidade_medida,
          lote: item.lote,
        }
      ]);
    }
    setSelectedInsumoToAdd('');
  };

  const handleUpdateQty = (index: number, delta: number) => {
    setInsumosUsados(prev => {
      const copy = [...prev];
      const newQty = copy[index].quantidade + delta;
      if (newQty <= 0) {
        return copy.filter((_, i) => i !== index);
      }
      copy[index].quantidade = newQty;
      return copy;
    });
  };

  const handleRemoveInsumo = (index: number) => {
    setInsumosUsados(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmComplete(
      agendamento.id,
      insumosUsados,
      {
        valor: valorFinal,
        forma: formaPagamento,
        status: statusPagamento,
        observacao: observacaoPagamento,
      }
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-600 text-white shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Finalizar Procedimento & Dar Baixa
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Paciente: <strong className="text-slate-800">{agendamento.paciente?.nome || 'Paciente'}</strong> • {agendamento.procedimento}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
          
          {/* Section 1: Insumos consumidos */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Package className="w-4 h-4 text-indigo-600" />
                <span>1. Baixa Automática de Insumos no Estoque</span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                {insumosUsados.length} {insumosUsados.length === 1 ? 'item vinculado' : 'itens vinculados'}
              </span>
            </div>

            {insumosUsados.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-slate-500 text-xs">
                Nenhum insumo selecionado para baixa automática neste procedimento.
              </div>
            ) : (
              <div className="space-y-2">
                {insumosUsados.map((insumo, idx) => {
                  const stockItem = estoque.find(e => e.id === insumo.insumo_id || e.nome_item === insumo.nome_item);
                  const isStockCritical = stockItem && (stockItem.quantidade - insumo.quantidade <= stockItem.alerta_minimo);

                  return (
                    <div 
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 text-xs truncate">
                          {insumo.nome_item}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span>Lote: {insumo.lote || 'N/A'}</span>
                          {stockItem && (
                            <span className={isStockCritical ? 'text-amber-700 font-medium' : 'text-slate-500'}>
                              • Saldo atual: {stockItem.quantidade} {stockItem.unidade_medida}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity stepper */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(idx, -1)}
                            className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100 cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-10 text-center font-mono font-bold text-xs text-slate-900">
                            {insumo.quantidade} {insumo.unidade_medida}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(idx, 1)}
                            className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveInsumo(idx)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Remover insumo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add extra supply selector */}
            <div className="flex gap-2 pt-1">
              <select
                value={selectedInsumoToAdd}
                onChange={(e) => setSelectedInsumoToAdd(e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-700"
              >
                <option value="">+ Adicionar outro insumo utilizado na sessão...</option>
                {estoque.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.nome_item} (Saldo: {item.quantidade} {item.unidade_medida})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddInsumo}
                disabled={!selectedInsumoToAdd}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                Adicionar
              </button>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section 2: Informações de Pagamento */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <span>2. Registro Financeiro & Meio de Pagamento</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Valor Cobrado (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-xs">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={valorFinal}
                    onChange={(e) => setValorFinal(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Forma de Pagamento
                </label>
                <select
                  value={formaPagamento}
                  onChange={(e) => setFormaPagamento(e.target.value as FormaPagamento)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 font-medium"
                >
                  <option value="pix">Pix (Transferência Instantânea)</option>
                  <option value="cartao_credito">Cartão de Crédito</option>
                  <option value="cartao_debito">Cartão de Débito</option>
                  <option value="dinheiro">Dinheiro em Espécie</option>
                  <option value="transferencia">Transferência / TED</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status do Pagamento
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStatusPagamento('pago')}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      statusPagamento === 'pago'
                        ? 'bg-green-50 text-green-700 border-green-300 shadow-2xs font-bold'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Pago / Liquidado
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusPagamento('pendente')}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      statusPagamento === 'pendente'
                        ? 'bg-amber-50 text-amber-700 border-amber-300 shadow-2xs font-bold'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Pendente / A Cobrar
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observação do Recibo (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Parcelado em 3x, comprovante salvo..."
                  value={observacaoPagamento}
                  onChange={(e) => setObservacaoPagamento(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-semibold rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Voltar
            </button>
            
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-sm flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar & Concluir Procedimento</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
