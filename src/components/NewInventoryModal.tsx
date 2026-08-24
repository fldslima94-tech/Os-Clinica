import React, { useState } from 'react';
import { 
  X, 
  Package, 
  AlertTriangle, 
  Layers, 
  Tag
} from 'lucide-react';
import { EstoqueInsumo, UnidadeMedida } from '../types';

interface NewInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveInventory: (novoInsumo: Partial<EstoqueInsumo>) => void;
}

export const NewInventoryModal: React.FC<NewInventoryModalProps> = ({
  isOpen,
  onClose,
  onSaveInventory,
}) => {
  const [nomeItem, setNomeItem] = useState('');
  const [quantidade, setQuantidade] = useState<number>(10);
  const [unidadeMedida, setUnidadeMedida] = useState<UnidadeMedida>('unidade');
  const [alertaMinimo, setAlertaMinimo] = useState<number>(5);
  const [categoria, setCategoria] = useState('Injetáveis');
  const [lote, setLote] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeItem.trim()) return;

    onSaveInventory({
      nome_item: nomeItem.trim(),
      quantidade: Number(quantidade) || 0,
      unidade_medida: unidadeMedida,
      alerta_minimo: Number(alertaMinimo) || 5,
      categoria: categoria.trim() || undefined,
      lote: lote.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500 text-white">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Cadastrar Insumo no Estoque
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Toxinas, preenchedores, descartáveis e anestésicos
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          
          {/* Nome do Item */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1.5">
              Nome do Item / Produto *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Toxina Botulínica 100U ou Ácido Hialurônico 1ml"
              value={nomeItem}
              onChange={(e) => setNomeItem(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1.5 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              Categoria
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="Injetáveis">Injetáveis</option>
              <option value="Preenchedores">Preenchedores</option>
              <option value="Bioestimuladores">Bioestimuladores</option>
              <option value="Descartáveis">Descartáveis</option>
              <option value="Tópicos & Anestésicos">Tópicos & Anestésicos</option>
              <option value="Diluentes">Diluentes</option>
            </select>
          </div>

          {/* Quantidade & Unidade */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">
                Quantidade Inicial *
              </label>
              <input
                type="number"
                min="0"
                required
                value={quantidade}
                onChange={(e) => setQuantidade(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">
                Unidade de Medida *
              </label>
              <select
                value={unidadeMedida}
                onChange={(e) => setUnidadeMedida(e.target.value as UnidadeMedida)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="unidade">Unidade (frasco/caixa)</option>
                <option value="seringa">Seringa</option>
                <option value="ml">ml (mililitros)</option>
              </select>
            </div>
          </div>

          {/* Alerta Mínimo & Lote */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Alerta Mínimo *
              </label>
              <input
                type="number"
                min="1"
                required
                value={alertaMinimo}
                onChange={(e) => setAlertaMinimo(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-amber-50/50 border border-amber-200/80 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
              />
              <p className="text-[10px] text-slate-400 mt-1">Dispara alerta no balcão</p>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">
                Lote (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: BTX-2025-01"
                value={lote}
                onChange={(e) => setLote(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg font-semibold shadow-sm transition-colors cursor-pointer"
            >
              Salvar Insumo
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
