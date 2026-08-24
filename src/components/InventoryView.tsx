import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Minus, 
  PlusCircle, 
  ShieldAlert, 
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { EstoqueInsumo } from '../types';

interface InventoryViewProps {
  estoque: EstoqueInsumo[];
  onOpenNewInventory: () => void;
  onUpdateQuantity: (id: string, newQuantity: number) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  estoque,
  onOpenNewInventory,
  onUpdateQuantity,
}) => {
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'todos' | 'criticos' | 'ok'>('todos');

  const filtered = estoque.filter(item => {
    const isCritical = item.quantidade <= item.alerta_minimo;
    if (filterMode === 'criticos' && !isCritical) return false;
    if (filterMode === 'ok' && isCritical) return false;

    const q = search.toLowerCase();
    return item.nome_item.toLowerCase().includes(q) || (item.categoria?.toLowerCase() || '').includes(q);
  });

  const criticalCount = estoque.filter(i => i.quantidade <= i.alerta_minimo).length;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Estoque de Insumos & Toxinas
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Controle de quantidades (ml, unidades, seringas) e disparo automático de alertas de compra.
          </p>
        </div>

        <button
          onClick={onOpenNewInventory}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Insumo</span>
        </button>
      </div>

      {/* Filter and Stats */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome do insumo ou lote..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterMode('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filterMode === 'todos'
                ? 'bg-slate-900 text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
            }`}
          >
            Todos ({estoque.length})
          </button>
          <button
            onClick={() => setFilterMode('criticos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1 ${
              filterMode === 'criticos'
                ? 'bg-amber-600 text-white font-semibold shadow-xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Críticos ({criticalCount})
          </button>
          <button
            onClick={() => setFilterMode('ok')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filterMode === 'ok'
                ? 'bg-green-700 text-white font-semibold shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
            }`}
          >
            Regulares ({estoque.length - criticalCount})
          </button>
        </div>
      </div>

      {/* Stock Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(item => {
          const isCritical = item.quantidade <= item.alerta_minimo;
          const percentage = Math.min(100, Math.round((item.quantidade / (item.alerta_minimo * 2 || 1)) * 100));

          return (
            <div
              key={item.id}
              className={`bg-white rounded-xl border p-5 shadow-sm transition-colors flex flex-col justify-between ${
                isCritical ? 'border-amber-300 ring-1 ring-amber-200/50' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                    {item.categoria || 'Insumo'}
                  </span>

                  {isCritical ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      Abaixo do Mínimo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200/60">
                      <CheckCircle2 className="w-3 h-3 text-green-600" />
                      Regular
                    </span>
                  )}
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-1 leading-snug">
                  {item.nome_item}
                </h3>

                {item.lote && (
                  <p className="text-[11px] text-slate-400 mb-3">
                    Lote: {item.lote} • Validade: {item.validade || 'Indefinida'}
                  </p>
                )}

                {/* Level Display */}
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 my-3">
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-xs text-slate-500 font-medium">Saldo Atual:</span>
                    <div className="text-right">
                      <span className={`text-xl font-bold font-mono ${isCritical ? 'text-amber-600' : 'text-slate-900'}`}>
                        {item.quantidade}
                      </span>
                      <span className="text-xs font-medium text-slate-500 ml-1">
                        {item.unidade_medida}
                      </span>
                    </div>
                  </div>

                  {/* Stock Bar */}
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCritical ? 'bg-amber-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.max(8, percentage)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-medium">
                    <span>Mínimo seguro: {item.alerta_minimo} {item.unidade_medida}</span>
                    <span>{percentage}% do ideal</span>
                  </div>
                </div>
              </div>

              {/* Quick Adjustment Controls */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-400 font-medium">Ajuste rápido:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantidade - 1))}
                    title="Dar baixa / Consumir 1"
                    disabled={item.quantidade <= 0}
                    className="p-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantidade + 1)}
                    title="Repor / Entrada de 1"
                    className="p-1.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors cursor-pointer border border-indigo-200/60"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantidade + 5)}
                    title="Entrada de +5 unidades"
                    className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    +5
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
