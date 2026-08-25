import React, { useState } from 'react';
import { 
  Shield, 
  Plus, 
  Search, 
  Filter, 
  Layers, 
  Calendar, 
  DollarSign, 
  MapPin, 
  User, 
  FileText, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertTriangle, 
  Wrench, 
  Sparkles,
  Zap,
  Tag
} from 'lucide-react';
import { BemAtivo, UsuarioEquipe, CategoriaBem, EstadoConservacaoBem } from '../types';

interface AssetsViewProps {
  bens: BemAtivo[];
  onOpenNewBem: () => void;
  onEditBem: (bem: BemAtivo) => void;
  onDeleteBem: (id: string) => void;
  currentUser: UsuarioEquipe;
}

export const AssetsView: React.FC<AssetsViewProps> = ({
  bens,
  onOpenNewBem,
  onEditBem,
  onDeleteBem,
  currentUser,
}) => {
  const isGestor = currentUser.role === 'gestor' || currentUser.role === 'admin';
  const [search, setSearch] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todos');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('todos');
  const [selectedBemDetails, setSelectedBemDetails] = useState<BemAtivo | null>(null);
  const [bemToDelete, setBemToDelete] = useState<BemAtivo | null>(null);

  const filteredBens = bens.filter(b => {
    const q = search.toLowerCase().trim();
    const matchesSearch = !q || 
      b.nome.toLowerCase().includes(q) || 
      (b.numero_serie && b.numero_serie.toLowerCase().includes(q)) ||
      (b.localizacao_sala && b.localizacao_sala.toLowerCase().includes(q)) ||
      (b.responsavel_nome && b.responsavel_nome.toLowerCase().includes(q));

    const matchesCat = categoriaFiltro === 'todos' || b.categoria === categoriaFiltro;
    const matchesEstado = estadoFiltro === 'todos' || b.estado_conservacao === estadoFiltro;

    return matchesSearch && matchesCat && matchesEstado;
  });

  const totalPatrimonio = bens.reduce((acc, b) => acc + (b.valor_compra || 0), 0);
  const totalEquipamentos = bens.length;
  const emManutencao = bens.filter(b => b.estado_conservacao === 'manutencao').length;
  const emExcelenteEstado = bens.filter(b => b.estado_conservacao === 'excelente').length;

  const getCategoriaBadge = (cat: CategoriaBem) => {
    switch (cat) {
      case 'laser':
        return { label: 'Laser & Alta Potência', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'dermografo':
        return { label: 'Dermógrafo & Micropigmentação', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'maca_mobiliario':
        return { label: 'Maca & Mobiliário', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'autoclave':
        return { label: 'Autoclave & Esterilização', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'eletronico':
        return { label: 'Eletrônico & TI', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      default:
        return { label: 'Equipamento Geral', bg: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  const getEstadoBadge = (estado: EstadoConservacaoBem) => {
    switch (estado) {
      case 'excelente':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Excelente
          </span>
        );
      case 'bom':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            Bom
          </span>
        );
      case 'regular':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Regular
          </span>
        );
      case 'manutencao':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
            <Wrench className="w-3.5 h-3.5 text-rose-600" />
            Em Manutenção
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Patrimônio do Studio
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Bens, Equipamentos & Ativos
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Controle de lasers, dermógrafos, macas cirúrgicas, autoclaves e histórico de garantias.
          </p>
        </div>

        {isGestor && (
          <button
            onClick={onOpenNewBem}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Novo Bem</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Patrimônio Total</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {totalPatrimonio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Valor de aquisição acumulado
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total de Itens Ativos</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">
            {totalEquipamentos} bens
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Cadastrados no studio
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Excelente Estado</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">
            {emExcelenteEstado} itens
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Operação 100% calibrada
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Em Manutenção</span>
            <Wrench className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-700 mt-2">
            {emManutencao} itens
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Requer atenção técnica
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome do bem, nº de série, sala ou responsável..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 md:pb-0">
          <select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="todos">Todas as Categorias</option>
            <option value="laser">Lasers</option>
            <option value="dermografo">Dermógrafos</option>
            <option value="maca_mobiliario">Macas e Mobiliário</option>
            <option value="autoclave">Autoclaves</option>
            <option value="eletronico">Eletrônicos</option>
            <option value="outros">Outros</option>
          </select>

          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="todos">Todos os Estados</option>
            <option value="excelente">Excelente</option>
            <option value="bom">Bom</option>
            <option value="regular">Regular</option>
            <option value="manutencao">Em Manutenção</option>
          </select>
        </div>
      </div>

      {/* Asset Cards Grid */}
      {filteredBens.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">Nenhum bem patrimonial encontrado</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Cadastre os equipamentos, dermógrafos, macas e aparelhos do seu studio para controle de garantias e notas fiscais.
          </p>
          {isGestor && (
            <button
              onClick={onOpenNewBem}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Cadastrar Primeiro Bem
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBens.map((bem) => {
            const catBadge = getCategoriaBadge(bem.categoria);
            return (
              <div
                key={bem.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${catBadge.bg}`}>
                      {catBadge.label}
                    </span>
                    {getEstadoBadge(bem.estado_conservacao)}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                    {bem.nome}
                  </h3>

                  {bem.numero_serie && (
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                      S/N: {bem.numero_serie}
                    </p>
                  )}

                  <div className="mt-4 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-700">{bem.localizacao_sala}</span>
                    </div>

                    {bem.responsavel_nome && (
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Responsável: <strong>{bem.responsavel_nome}</strong></span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Aquisição: {new Date(bem.data_aquisicao).toLocaleDateString('pt-BR')}</span>
                    </div>

                    {bem.garantia_ate && (
                      <div className="flex items-center gap-2 text-indigo-700 font-medium">
                        <Shield className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>Garantia até: {new Date(bem.garantia_ate).toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                  </div>

                  {bem.observacoes && (
                    <div className="mt-3.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 line-clamp-2">
                      {bem.observacoes}
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Valor Pago</span>
                    <span className="text-sm font-bold text-slate-900">
                      {bem.valor_compra.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>

                  {isGestor && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onEditBem(bem)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="Editar Bem"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setBemToDelete(bem)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Excluir Bem"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {bemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Confirmar Exclusão de Ativo</h3>
            <p className="text-xs text-slate-600 mt-2">
              Tem certeza que deseja remover o bem <strong>{bemToDelete.nome}</strong>? Esta ação removerá o registro patrimonial.
            </p>
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setBemToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onDeleteBem(bemToDelete.id);
                  setBemToDelete(null);
                }}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors cursor-pointer"
              >
                Sim, Excluir Bem
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
