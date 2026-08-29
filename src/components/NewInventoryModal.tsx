import React, { useState } from 'react';
import { 
  X, 
  Package, 
  AlertTriangle, 
  Tag,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { EstoqueInsumo, UnidadeMedida, ProcedimentoClinico } from '../types';
import { CurrencyInput } from './CurrencyInput';

interface NewInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (novoInsumo: Partial<EstoqueInsumo>) => void;
  onSaveInventory?: (novoInsumo: Partial<EstoqueInsumo>) => void;
  procedimentos?: ProcedimentoClinico[];
  procedimentosDisponiveis?: ProcedimentoClinico[];
}

export const NewInventoryModal: React.FC<NewInventoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onSaveInventory,
}) => {
  const [nomeItem, setNomeItem] = useState('');
  const [quantidade, setQuantidade] = useState<number>(10);
  const [unidadeMedida, setUnidadeMedida] = useState<UnidadeMedida>('unidade');
  const [alertaMinimo, setAlertaMinimo] = useState<number>(5);
  const [categoria, setCategoria] = useState('Injetáveis');
  const [marca, setMarca] = useState('');
  const [corTonalidade, setCorTonalidade] = useState('');
  const [lote, setLote] = useState('');
  const [validade, setValidade] = useState<string>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [custoUnitario, setCustoUnitario] = useState<number>(150);
  const [formError, setFormError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!nomeItem.trim()) {
      setFormError('Por favor, informe o nome do item / insumo.');
      return;
    }

    const saveFn = onSave || onSaveInventory;
    if (!saveFn) {
      console.error('Nenhuma função onSave/onSaveInventory repassada.');
      return;
    }

    // Salva o insumo independente de procedimento
    saveFn({
      nome_item: nomeItem.trim(),
      quantidade: Number(quantidade) || 0,
      unidade_medida: unidadeMedida,
      alerta_minimo: Number(alertaMinimo) || 5,
      categoria: categoria.trim() || 'Geral',
      marca: marca.trim() || undefined,
      cor_tonalidade: corTonalidade.trim() || undefined,
      lote: lote.trim() || undefined,
      validade: validade || undefined,
      custo_unitario: Number(custoUnitario) || 0,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Cadastrar Insumo & Item de Estoque
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Controle de saldo, lotes, validade e custo unitário
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

        {/* Error Alert */}
        {formError && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-700 text-xs font-semibold animate-in fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{formError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm max-h-[80vh] overflow-y-auto">
          
          {/* Nome do Item */}
          <div>
            <label className="font-bold text-slate-700 block mb-1.5 uppercase text-[11px] tracking-wide">
              Nome do Item / Insumo *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Toxina Botulínica 100U, Ácido Hialurônico Reticulado 1ml, Luvas Cirúrgicas"
              value={nomeItem}
              onChange={(e) => setNomeItem(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
            />
          </div>

          {/* Categoria e Lote */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1.5 flex items-center gap-1 uppercase text-[11px] tracking-wide">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                Categoria
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
              >
                <option value="Injetáveis">Injetáveis</option>
                <option value="Preenchedores">Preenchedores</option>
                <option value="Bioestimuladores">Bioestimuladores</option>
                <option value="Pigmento">Pigmento</option>
                <option value="Agulhas">Agulhas & Lâminas</option>
                <option value="Descartáveis">Descartáveis</option>
                <option value="Cosméticos">Cosméticos</option>
                <option value="Tópicos & Anestésicos">Tópicos & Anestésicos</option>
                <option value="Diluentes">Diluentes</option>
                <option value="Geral">Geral</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5 uppercase text-[11px] tracking-wide">
                Lote de Fabricação
              </label>
              <input
                type="text"
                placeholder="Ex: BTX-2026-098 ou LOT-441"
                value={lote}
                onChange={(e) => setLote(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Marca e Cor / Tonalidade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="font-bold text-slate-700 block mb-1 uppercase text-[11px] tracking-wide">
                Marca / Fabricante
              </label>
              <input
                type="text"
                placeholder="Ex: Allergan, Galderma, Rennova, Iron Works"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1 uppercase text-[11px] tracking-wide">
                Cor / Tonalidade {categoria === 'Pigmento' && <span className="text-amber-600 font-bold">*</span>}
              </label>
              <input
                type="text"
                placeholder="Ex: Castanho Escuro, Natural, 1.0ml"
                value={corTonalidade}
                onChange={(e) => setCorTonalidade(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-xs"
              />
            </div>
          </div>

          {/* DATA DE VALIDADE & CUSTO UNITÁRIO (CurrencyInput) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-amber-50/40 p-3.5 rounded-xl border border-amber-200/80 items-end">
            <div>
              <label className="font-bold text-amber-950 block mb-1 flex items-center gap-1.5 uppercase text-[11px] tracking-wide">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                Data de Validade *
              </label>
              <input
                type="date"
                required
                value={validade}
                onChange={(e) => setValidade(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-amber-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-semibold"
              />
              <p className="text-[10px] text-amber-700 mt-1 font-medium">Controle de vencimento para biossegurança</p>
            </div>

            <div>
              <CurrencyInput
                label="Custo Unitário"
                value={custoUnitario}
                onChange={(val) => setCustoUnitario(val)}
                placeholder="0,00"
              />
              <p className="text-[10px] text-slate-500 mt-1">Custo por {unidadeMedida}</p>
            </div>
          </div>

          {/* Quantidade, Unidade & Alerta Mínimo */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wide">
                Qtd em Estoque *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={quantidade}
                onChange={(e) => {
                  const raw = e.target.value.replace(',', '.');
                  setQuantidade(parseFloat(raw) || 0);
                }}
                className="w-full px-2.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wide">
                Unidade *
              </label>
              <select
                value={unidadeMedida}
                onChange={(e) => setUnidadeMedida(e.target.value as UnidadeMedida)}
                className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer text-xs"
              >
                <option value="unidade">Unidade (frasco)</option>
                <option value="seringa">Seringa</option>
                <option value="ml">ml</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1 uppercase text-[10px] tracking-wide">
                <AlertTriangle className="w-3 h-3 text-amber-500" />
                Alerta Mín. *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={alertaMinimo}
                onChange={(e) => {
                  const raw = e.target.value.replace(',', '.');
                  setAlertaMinimo(parseFloat(raw) || 1);
                }}
                className="w-full px-2.5 py-2.5 bg-amber-50/50 border border-amber-200/80 rounded-xl text-amber-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Package className="w-4 h-4" />
              <span>Salvar Insumo no Estoque</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
