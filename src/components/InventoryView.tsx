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
  ArrowUpRight,
  Clock,
  DollarSign,
  Tag,
  Edit2,
  Trash2,
  Lock,
  Layers,
  Check,
  Eye,
  SlidersHorizontal,
  Info,
  Calendar,
  Link as LinkIcon
} from 'lucide-react';
import { EstoqueInsumo, ProcedimentoClinico, UsuarioEquipe } from '../types';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface InventoryViewProps {
  estoque: EstoqueInsumo[];
  procedimentos: ProcedimentoClinico[];
  currentUser: UsuarioEquipe;
  onOpenNewInventory: () => void;
  onOpenNewProcedure: () => void;
  onEditProcedure: (proc: ProcedimentoClinico) => void;
  onDeleteProcedure: (id: string) => void;
  onDeleteInventoryItem?: (id: string) => void;
  onUpdateQuantity: (id: string, newQuantity: number) => void;
  onToggleProcedureStatus?: (id: string) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  estoque,
  procedimentos,
  currentUser,
  onOpenNewInventory,
  onOpenNewProcedure,
  onEditProcedure,
  onDeleteProcedure,
  onDeleteInventoryItem,
  onUpdateQuantity,
  onToggleProcedureStatus,
}) => {
  const isAdmin = currentUser.role === 'admin';
  const [currentTab, setCurrentTab] = useState<'procedimentos' | 'insumos'>('procedimentos');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('todos');
  const [filterMode, setFilterMode] = useState<'todos' | 'criticos' | 'vencimento' | 'ok'>('todos');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<EstoqueInsumo | null>(null);

  // Helper to check validity status
  const getValidadeStatus = (validadeStr?: string) => {
    if (!validadeStr) return { status: 'none', label: 'Indefinida', color: 'text-slate-400 bg-slate-100' };
    const now = new Date();
    const exp = new Date(validadeStr);
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'expired', label: 'Vencido', color: 'text-rose-700 bg-rose-50 border-rose-200' };
    }
    if (diffDays <= 60) {
      return { status: 'warning', label: `Vence em ${diffDays}d`, color: 'text-amber-700 bg-amber-50 border-amber-200' };
    }
    return { status: 'ok', label: 'Validade OK', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  };

  // Categories present in procedures
  const procedureCategories = ['todos', ...Array.from(new Set(procedimentos.map(p => p.categoria)))];

  // Insumos filtering
  const filteredInsumos = estoque.filter(item => {
    const isCritical = item.quantidade <= item.alerta_minimo;
    const valStatus = getValidadeStatus(item.validade);

    if (filterMode === 'criticos' && !isCritical) return false;
    if (filterMode === 'vencimento' && valStatus.status !== 'expired' && valStatus.status !== 'warning') return false;
    if (filterMode === 'ok' && (isCritical || valStatus.status === 'expired')) return false;

    const q = search.toLowerCase();
    return (
      item.nome_item.toLowerCase().includes(q) ||
      (item.categoria?.toLowerCase() || '').includes(q) ||
      (item.procedimento_vinculado_nome?.toLowerCase() || '').includes(q) ||
      (item.lote?.toLowerCase() || '').includes(q)
    );
  });

  // Procedimentos filtering
  const filteredProcedimentos = procedimentos.filter(proc => {
    if (categoryFilter !== 'todos' && proc.categoria !== categoryFilter) return false;
    const q = search.toLowerCase();
    return (
      proc.nome.toLowerCase().includes(q) ||
      proc.categoria.toLowerCase().includes(q) ||
      proc.descricao.toLowerCase().includes(q)
    );
  });

  const criticalCount = estoque.filter(i => i.quantidade <= i.alerta_minimo).length;
  const expiringCount = estoque.filter(i => {
    const s = getValidadeStatus(i.validade);
    return s.status === 'expired' || s.status === 'warning';
  }).length;

  const handleDeleteProcedureClick = (id: string) => {
    if (deleteConfirmId === id) {
      onDeleteProcedure(id);
      setDeleteConfirmId(null);
    } else {
      setDeleteConfirmId(id);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Module Selector */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Catálogo de Procedimentos & Estoque
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Gerencie todos os serviços que a clínica oferta e o controle de insumos e toxinas.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2 w-full md:w-auto">
          {currentTab === 'procedimentos' ? (
            <button
              onClick={onOpenNewProcedure}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-sm w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Procedimento</span>
            </button>
          ) : (
            <button
              onClick={onOpenNewInventory}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-sm w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Insumo</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => {
            setCurrentTab('procedimentos');
            setSearch('');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            currentTab === 'procedimentos'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Procedimentos Ofertados ({procedimentos.length})</span>
        </button>

        <button
          onClick={() => {
            setCurrentTab('insumos');
            setSearch('');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            currentTab === 'insumos'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Package className="w-4 h-4 text-amber-500" />
          <span>Insumos em Estoque ({estoque.length})</span>
          {criticalCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] bg-rose-500 text-white rounded-full font-bold">
              {criticalCount}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: PROCEDIMENTOS OFERTADOS PELA CLÍNICA */}
      {currentTab === 'procedimentos' && (
        <div className="space-y-6">
          
          {/* Filters & Search */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome do procedimento, categoria, benefício..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Categories filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-thin">
              {procedureCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'todos' ? 'Todas Categorias' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Procedures Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProcedimentos.map(proc => {
              const isDeleting = deleteConfirmId === proc.id;

              return (
                <div
                  key={proc.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 shadow-sm overflow-hidden flex flex-col justify-between ${
                    !proc.ativo ? 'opacity-70 bg-slate-50/70 border-slate-200' : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'
                  }`}
                >
                  {/* Card Header & Image if exists */}
                  <div>
                    {proc.imagem_url && (
                      <div className="h-36 w-full relative overflow-hidden bg-slate-100">
                        <img
                          src={proc.imagem_url}
                          alt={proc.nome}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-slate-950/60 to-transparent" />
                        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-white uppercase tracking-wider bg-slate-900/80 px-2 py-0.5 rounded backdrop-blur-xs">
                            {proc.categoria}
                          </span>
                          <span className="text-xs font-bold text-white bg-indigo-600 px-2 py-0.5 rounded">
                            {proc.duracao_minutos} min
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="p-5 space-y-3">
                      {!proc.imagem_url && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                            {proc.categoria}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {proc.duracao_minutos} min
                          </span>
                        </div>
                      )}

                      <div>
                        <h3 className="text-base font-bold text-slate-900 leading-snug">
                          {proc.nome}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {proc.descricao}
                        </p>
                      </div>

                      {/* Price Section & 3-Tier Variations */}
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Valor Base / Tabela</span>
                            <div className="flex items-baseline gap-2">
                              <span className="text-lg font-extrabold text-slate-900 font-mono">
                                R$ {proc.valor_tabela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                              {proc.valor_promocional && (
                                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  Promo: R$ {proc.valor_promocional.toLocaleString('pt-BR')}
                                </span>
                              )}
                            </div>
                          </div>

                          {proc.destaque_portal && (
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-lg text-center" title="Visível no Portal do Paciente">
                              🌐 Portal
                            </span>
                          )}
                        </div>

                        {/* 3 Tabelas de Variações de Preço */}
                        {proc.variacoes && proc.variacoes.length > 0 && (
                          <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
                            <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wide flex items-center gap-1">
                              <Layers className="w-3 h-3 text-indigo-600" />
                              Tabela de 3 Variações de Valores:
                            </span>
                            <div className="grid grid-cols-1 gap-1">
                              {proc.variacoes.map((v, i) => (
                                <div key={v.id || i} className="flex items-center justify-between text-[11px] bg-white px-2.5 py-1 rounded-lg border border-slate-200/70">
                                  <div className="flex items-center gap-1.5 truncate pr-1">
                                    <span className="w-3.5 h-3.5 rounded-full bg-indigo-100 text-indigo-700 text-[9px] font-bold flex items-center justify-center shrink-0">
                                      {i + 1}
                                    </span>
                                    <span className="font-semibold text-slate-700 truncate">{v.nome}</span>
                                    {v.duracao_minutos && (
                                      <span className="text-[10px] text-slate-400">({v.duracao_minutos}m)</span>
                                    )}
                                  </div>
                                  <span className="font-bold text-emerald-700 font-mono whitespace-nowrap">
                                    R$ {v.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Insumos vinculados tag list */}
                      {proc.insumos_vinculados && proc.insumos_vinculados.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <Package className="w-3 h-3 text-slate-400" />
                            Insumos Vinculados ({proc.insumos_vinculados.length})
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {proc.insumos_vinculados.map((ins, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 font-medium truncate max-w-[200px]"
                              >
                                {ins.quantidade} {ins.unidade_medida} • {ins.nome_item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        proc.ativo ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {proc.ativo ? 'Disponível' : 'Inativo'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isAdmin ? (
                        <>
                          <button
                            onClick={() => onEditProcedure(proc)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-white rounded-lg border border-slate-200 transition-colors cursor-pointer text-xs font-semibold inline-flex items-center gap-1"
                            title="Editar procedimento"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Editar</span>
                          </button>

                          {isDeleting ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleDeleteProcedureClick(proc.id)}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-bold cursor-pointer"
                              >
                                Confirmar Exclusão
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-1.5 py-1 bg-slate-200 text-slate-700 rounded text-[11px] cursor-pointer"
                              >
                                X
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleDeleteProcedureClick(proc.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                              title="Excluir procedimento do catálogo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          Apenas Admin altera
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

          {filteredProcedimentos.length === 0 && (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
              <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">Nenhum procedimento encontrado</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Tente ajustar os filtros de busca ou clique no botão acima para cadastrar novos procedimentos ofertados pela clínica.
              </p>
            </div>
          )}

        </div>
      )}

      {/* TAB 2: INSUMOS E PRODUTOS EM ESTOQUE */}
      {currentTab === 'insumos' && (
        <div className="space-y-6">
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

            <div className="flex items-center gap-2 flex-wrap">
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
                Saldo Crítico ({criticalCount})
              </button>
              {expiringCount > 0 && (
                <button
                  onClick={() => setFilterMode('vencimento')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer inline-flex items-center gap-1 ${
                    filterMode === 'vencimento'
                      ? 'bg-rose-700 text-white font-semibold shadow-xs'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Vencimento Próximo ({expiringCount})
                </button>
              )}
              <button
                onClick={() => setFilterMode('ok')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  filterMode === 'ok'
                    ? 'bg-green-700 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                }`}
              >
                Regulares
              </button>
            </div>
          </div>

          {/* Stock Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInsumos.map(item => {
              const isCritical = item.quantidade <= item.alerta_minimo;
              const valStatus = getValidadeStatus(item.validade);
              const percentage = Math.min(100, Math.round((item.quantidade / (item.alerta_minimo * 2 || 1)) * 100));

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-xl border p-5 shadow-sm transition-colors flex flex-col justify-between ${
                    valStatus.status === 'expired' 
                      ? 'border-rose-300 ring-1 ring-rose-200/50 bg-rose-50/10' 
                      : isCritical 
                        ? 'border-amber-300 ring-1 ring-amber-200/50' 
                        : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                        {item.categoria || 'Insumo'}
                      </span>

                      <div className="flex items-center gap-1.5">
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

                        {isAdmin && onDeleteInventoryItem && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setItemToDelete(item);
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                            title="Excluir insumo do estoque (Admin)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 mb-1 leading-snug">
                      {item.nome_item}
                    </h3>

                    {/* VALIDADE & LOTE BADGES */}
                    <div className="flex flex-wrap items-center gap-1.5 my-2">
                      {item.validade && (
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${valStatus.color}`}>
                          <Calendar className="w-3 h-3" />
                          Val: {new Date(item.validade + 'T00:00:00').toLocaleDateString('pt-BR')} ({valStatus.label})
                        </span>
                      )}
                      {item.lote && (
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          Lote: {item.lote}
                        </span>
                      )}
                    </div>

                    {/* VÍNCULO COM PROCEDIMENTOS & CONSUMO POR PROCEDIMENTO */}
                    {(item.procedimento_vinculado_nome || (item.procedimentos_vinculados && item.procedimentos_vinculados.length > 0)) && (
                      <div className="bg-indigo-50/60 p-2.5 rounded-lg border border-indigo-100/80 mb-3 space-y-1">
                        <div className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1">
                          <LinkIcon className="w-3 h-3 text-indigo-600" />
                          Procedimento Vinculado:
                        </div>
                        {item.procedimento_vinculado_nome && (
                          <div className="flex items-center justify-between text-xs text-indigo-950 font-medium">
                            <span className="truncate pr-1">🎯 {item.procedimento_vinculado_nome}</span>
                            <span className="font-bold text-indigo-700 whitespace-nowrap bg-white px-1.5 py-0.5 rounded text-[10px] border border-indigo-200">
                              Usa: {item.quantidade_por_procedimento || 1} {item.unidade_medida}/sessão
                            </span>
                          </div>
                        )}
                        {item.procedimentos_vinculados && item.procedimentos_vinculados.length > 0 && (
                          <div className="space-y-0.5 pt-1">
                            {item.procedimentos_vinculados
                              .filter(pv => pv.procedimento_nome !== item.procedimento_vinculado_nome)
                              .map(pv => (
                                <div key={pv.procedimento_id} className="flex items-center justify-between text-[11px] text-slate-600">
                                  <span className="truncate pr-1">• {pv.procedimento_nome}</span>
                                  <span className="text-[10px] font-semibold text-slate-500">
                                    {pv.quantidade_por_procedimento} {pv.unidade_medida || item.unidade_medida}
                                  </span>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Level Display */}
                    <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 my-2">
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
      )}

      {/* Delete Inventory Item Confirmation Modal */}
      {itemToDelete && (
        <DeleteConfirmModal
          isOpen={!!itemToDelete}
          onClose={() => setItemToDelete(null)}
          onConfirm={() => {
            if (itemToDelete && onDeleteInventoryItem) {
              onDeleteInventoryItem(itemToDelete.id);
            }
            setItemToDelete(null);
          }}
          title="Excluir Insumo do Estoque"
          itemType="Insumo de Estoque"
          itemName={`${itemToDelete.nome_item} (${itemToDelete.quantidade} ${itemToDelete.unidade_medida})`}
          description="A exclusão deste insumo removerá seu saldo e rastreabilidade de lote do catálogo de estoque da clínica."
        />
      )}

    </div>
  );
};

