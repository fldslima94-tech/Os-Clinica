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
  Tag,
  Clock,
  Building2,
  History,
  FileCheck,
  X,
  AlertCircle,
  TrendingUp,
  Download,
  Check
} from 'lucide-react';
import { BemAtivo, UsuarioEquipe, CategoriaBem, EstadoConservacaoBem, HistoricoManutencaoItem } from '../types';
import { checkUserCustomPermission, isUserAdminTotal } from '../services/firebaseService';

interface AssetsViewProps {
  bens: BemAtivo[];
  onOpenNewBem: () => void;
  onEditBem: (bem: BemAtivo) => void;
  onDeleteBem: (id: string) => void;
  onSaveBem?: (bemData: Omit<BemAtivo, 'id'>, idToEdit?: string) => void;
  currentUser: UsuarioEquipe;
}

export const AssetsView: React.FC<AssetsViewProps> = ({
  bens,
  onOpenNewBem,
  onEditBem,
  onDeleteBem,
  onSaveBem,
  currentUser,
}) => {
  const isAdminTotal = isUserAdminTotal(currentUser);
  const canManage = isAdminTotal || checkUserCustomPermission(currentUser, 'bens', 'gerenciar') || currentUser.role === 'admin_local' || currentUser.role === 'gestor' || currentUser.role === 'admin';
  const canDelete = isAdminTotal || checkUserCustomPermission(currentUser, 'bens', 'excluir');

  const [search, setSearch] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todos');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('todos');
  const [manutencaoFiltro, setManutencaoFiltro] = useState<string>('todos');
  const [bemToDelete, setBemToDelete] = useState<BemAtivo | null>(null);

  // Modais de Manutenção
  const [bemForManutencao, setBemForManutencao] = useState<BemAtivo | null>(null);
  const [bemForHistorico, setBemForHistorico] = useState<BemAtivo | null>(null);

  // Form State para Registrar Nova Manutenção
  const [manutTipo, setManutTipo] = useState<'preventiva' | 'corretiva' | 'calibracao'>('preventiva');
  const [manutData, setManutData] = useState(new Date().toISOString().slice(0, 10));
  const [manutCusto, setManutCusto] = useState<number>(0);
  const [manutTecnico, setManutTecnico] = useState('');
  const [manutDescricao, setManutDescricao] = useState('');
  const [manutLaudoNome, setManutLaudoNome] = useState('');
  const [manutPeriodicidade, setManutPeriodicidade] = useState<number>(90);

  const agora = new Date();
  const hojeStr = agora.toISOString().slice(0, 10);
  const dataLimiteAlerta = new Date();
  dataLimiteAlerta.setDate(agora.getDate() + 15);
  const limiteAlertaStr = dataLimiteAlerta.toISOString().slice(0, 10);

  // Helper para identificar status de manutenção de um bem
  const getStatusManutencao = (bem: BemAtivo): 'em_dia' | 'alerta_proximo' | 'vencida' | 'em_manutencao' | 'nao_requer' => {
    if (!bem.requerManutencao) return 'nao_requer';
    if (bem.estado_conservacao === 'manutencao' || bem.statusManutencao === 'em_manutencao') {
      return 'em_manutencao';
    }
    if (!bem.dataProximaManutencao) return 'em_dia';

    if (bem.dataProximaManutencao < hojeStr) {
      return 'vencida';
    }
    if (bem.dataProximaManutencao <= limiteAlertaStr) {
      return 'alerta_proximo';
    }
    return 'em_dia';
  };

  const filteredBens = bens.filter(b => {
    const q = (search || '').toLowerCase().trim();
    const matchesSearch = !q || 
      (b.nome || '').toLowerCase().includes(q) || 
      (b.numero_serie && b.numero_serie.toLowerCase().includes(q)) ||
      (b.localizacao_sala && b.localizacao_sala.toLowerCase().includes(q)) ||
      (b.responsavel_nome && b.responsavel_nome.toLowerCase().includes(q)) ||
      (b.empresaTecnica && b.empresaTecnica.toLowerCase().includes(q));

    const matchesCat = categoriaFiltro === 'todos' || b.categoria === categoriaFiltro;
    const matchesEstado = estadoFiltro === 'todos' || b.estado_conservacao === estadoFiltro;

    const statusM = getStatusManutencao(b);
    const matchesManut = manutencaoFiltro === 'todos' || statusM === manutencaoFiltro;

    return matchesSearch && matchesCat && matchesEstado && matchesManut;
  });

  const totalPatrimonio = bens.reduce((acc, b) => acc + (b.valor_compra || b.valorCompra || 0), 0);
  const totalEquipamentos = bens.length;

  const manutençõesVencidas = bens.filter(b => getStatusManutencao(b) === 'vencida');
  const manutençõesProximas = bens.filter(b => getStatusManutencao(b) === 'alerta_proximo');
  const manutençõesEmAndamento = bens.filter(b => getStatusManutencao(b) === 'em_manutencao');
  const manutençõesEmDia = bens.filter(b => getStatusManutencao(b) === 'em_dia');

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

  const getManutencaoBadge = (bem: BemAtivo) => {
    const status = getStatusManutencao(bem);

    switch (status) {
      case 'vencida':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            Manutenção Vencida
          </span>
        );
      case 'alerta_proximo':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Atenção (Próxima)
          </span>
        );
      case 'em_manutencao':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <Wrench className="w-3.5 h-3.5 text-sky-600" />
            Em Manutenção
          </span>
        );
      case 'em_dia':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Manutenção em Dia
          </span>
        );
      default:
        return null;
    }
  };

  // Submeter Registro de Manutenção Realizada
  const handleSalvarManutencao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bemForManutencao || !onSaveBem) return;

    const dataExec = manutData ? new Date(manutData) : new Date();
    const dataExecStr = dataExec.toISOString().slice(0, 10);
    const periodicidade = Number(manutPeriodicidade) || bemForManutencao.periodicidadeDias || 90;

    const proxData = new Date(dataExec.getTime() + periodicidade * 86400000);
    const proxDataStr = proxData.toISOString().slice(0, 10);

    const novoHistorico: HistoricoManutencaoItem = {
      id: `hist-${Date.now()}`,
      dataRealizacao: dataExecStr,
      tipo: manutTipo,
      descricao: manutDescricao.trim() || `Manutenção ${manutTipo} realizada`,
      custo: Number(manutCusto) || 0,
      tecnicoEmpresa: manutTecnico.trim() || bemForManutencao.empresaTecnica || 'Assistência Técnica',
      laudoNome: manutLaudoNome.trim() || undefined,
      registradoPor: currentUser.nome || 'Administrador',
    };

    const historicoAtual = bemForManutencao.historicoManutencoes || [];

    const updatedData: Omit<BemAtivo, 'id'> = {
      ...bemForManutencao,
      requerManutencao: true,
      periodicidadeDias: periodicidade,
      dataUltimaManutencao: dataExecStr,
      dataProximaManutencao: proxDataStr,
      empresaTecnica: manutTecnico.trim() || bemForManutencao.empresaTecnica,
      statusManutencao: 'em_dia',
      estado_conservacao: 'excelente',
      historicoManutencoes: [novoHistorico, ...historicoAtual],
    };

    onSaveBem(updatedData, bemForManutencao.id);
    setBemForManutencao(null);
  };

  const handleOpenRegistrarManutencao = (bem: BemAtivo) => {
    setBemForManutencao(bem);
    setManutTipo('preventiva');
    setManutData(new Date().toISOString().slice(0, 10));
    setManutCusto(0);
    setManutTecnico(bem.empresaTecnica || '');
    setManutDescricao('');
    setManutLaudoNome('');
    setManutPeriodicidade(bem.periodicidadeDias || 90);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Patrimônio & Engenharia Clínica
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              Controle Preventivo 6.1
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Bens, Equipamentos & Manutenções
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Gestão do ciclo de vida, calibração periódica, alertas de vencimento e histórico técnico de laudos.
          </p>
        </div>

        {canManage && (
          <button
            onClick={onOpenNewBem}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Novo Bem</span>
          </button>
        )}
      </div>

      {/* Alerta de Manutenções Críticas / Urgentes (Banner Informativo) */}
      {(manutençõesVencidas.length > 0 || manutençõesProximas.length > 0) && (
        <div className="p-4 rounded-2xl border bg-gradient-to-r from-amber-50/90 via-rose-50/70 to-indigo-50/50 border-amber-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                Atenção ao Ciclo de Manutenção Preventiva
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Existem <strong>{manutençõesVencidas.length}</strong> equipamento(s) com revisão vencida e <strong>{manutençõesProximas.length}</strong> com revisão prevista para os próximos 15 dias.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {manutençõesVencidas.length > 0 && (
              <button
                onClick={() => setManutencaoFiltro('vencida')}
                className="px-3 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Ver Vencidos ({manutençõesVencidas.length})</span>
              </button>
            )}
            {manutençõesProximas.length > 0 && (
              <button
                onClick={() => setManutencaoFiltro('alerta_proximo')}
                className="px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Ver Próximos ({manutençõesProximas.length})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Patrimônio Total</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-1.5">
            {totalPatrimonio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {totalEquipamentos} equipamentos
          </p>
        </div>

        <div 
          onClick={() => setManutencaoFiltro('em_dia')}
          className={`p-4.5 rounded-2xl border transition-all cursor-pointer ${
            manutencaoFiltro === 'em_dia' ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-400/20' : 'bg-white border-slate-200 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span className="text-emerald-700 font-semibold">Em Dia</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-emerald-700 mt-1.5">
            {manutençõesEmDia.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Revisões calibradas
          </p>
        </div>

        <div 
          onClick={() => setManutencaoFiltro('alerta_proximo')}
          className={`p-4.5 rounded-2xl border transition-all cursor-pointer ${
            manutencaoFiltro === 'alerta_proximo' ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/20' : 'bg-white border-slate-200 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span className="text-amber-700 font-semibold">Atenção (Próximas)</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-bold text-amber-600 mt-1.5">
            {manutençõesProximas.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Nos próximos 15 dias
          </p>
        </div>

        <div 
          onClick={() => setManutencaoFiltro('vencida')}
          className={`p-4.5 rounded-2xl border transition-all cursor-pointer ${
            manutencaoFiltro === 'vencida' ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-400/20' : 'bg-white border-slate-200 hover:border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span className="text-rose-700 font-semibold">Vencidas</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-xl font-bold text-rose-600 mt-1.5">
            {manutençõesVencidas.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Requer intervenção
          </p>
        </div>

        <div 
          onClick={() => setManutencaoFiltro('em_manutencao')}
          className={`p-4.5 rounded-2xl border transition-all cursor-pointer ${
            manutencaoFiltro === 'em_manutencao' ? 'bg-sky-50/80 border-sky-300 ring-2 ring-sky-400/20' : 'bg-white border-slate-200 hover:border-sky-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span className="text-sky-700 font-semibold">Em Manutenção</span>
            <Wrench className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-xl font-bold text-sky-600 mt-1.5">
            {manutençõesEmAndamento.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Na assistência técnica
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome do bem, nº série, empresa técnica, sala ou responsável..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 lg:pb-0">
          <select
            value={manutencaoFiltro}
            onChange={(e) => setManutencaoFiltro(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="todos">Status Manutenção (Todos)</option>
            <option value="vencida">🚨 Vencidas ({manutençõesVencidas.length})</option>
            <option value="alerta_proximo">⚠️ Atenção 15d ({manutençõesProximas.length})</option>
            <option value="em_dia">✅ Em Dia ({manutençõesEmDia.length})</option>
            <option value="em_manutencao">🛠️ Na Assistência ({manutençõesEmAndamento.length})</option>
          </select>

          <select
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="todos">Todas as Categorias</option>
            <option value="laser">Lasers</option>
            <option value="dermografo">Dermógrafos</option>
            <option value="maca_mobiliario">Macas & Mobiliário</option>
            <option value="autoclave">Autoclaves</option>
            <option value="eletronico">Eletrônicos</option>
            <option value="outros">Outros</option>
          </select>

          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="todos">Estado de Conservação</option>
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
          <h3 className="text-base font-semibold text-slate-800">Nenhum equipamento encontrado</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Cadastre os equipamentos, lasers, dermógrafos e autoclaves para acompanhamento preventivo contínuo.
          </p>
          {canManage && (
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
            const statusManut = getStatusManutencao(bem);
            const historicoCount = bem.historicoManutencoes?.length || 0;

            return (
              <div
                key={bem.id}
                className={`bg-white rounded-2xl border shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between ${
                  statusManut === 'vencida' 
                    ? 'border-rose-300 ring-1 ring-rose-200' 
                    : statusManut === 'alerta_proximo' 
                    ? 'border-amber-300 ring-1 ring-amber-200' 
                    : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${catBadge.bg}`}>
                      {catBadge.label}
                    </span>
                    {getManutencaoBadge(bem)}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                    {bem.nome || bem.nomeBem}
                  </h3>

                  {bem.numero_serie && (
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                      S/N: {bem.numero_serie}
                    </p>
                  )}

                  <div className="mt-4 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-700">{bem.localizacao_sala || bem.localizacaoSala}</span>
                    </div>

                    {bem.responsavel_nome && (
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Responsável: <strong>{bem.responsavel_nome}</strong></span>
                      </div>
                    )}

                    {/* Ciclo de Manutenção Preventiva Box */}
                    {bem.requerManutencao && (
                      <div className={`mt-3 p-3 rounded-xl border text-xs space-y-1.5 ${
                        statusManut === 'vencida'
                          ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                          : statusManut === 'alerta_proximo'
                          ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}>
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="flex items-center gap-1.5">
                            <Wrench className="w-3.5 h-3.5 text-indigo-600" />
                            Ciclo ({bem.periodicidadeDias || 90} dias)
                          </span>
                          {bem.dataProximaManutencao && (
                            <span className={statusManut === 'vencida' ? 'text-rose-700 font-extrabold' : 'text-indigo-700'}>
                              Próxima: {new Date(bem.dataProximaManutencao).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>

                        {bem.dataUltimaManutencao && (
                          <div className="text-[11px] text-slate-500 flex items-center justify-between">
                            <span>Última revisão:</span>
                            <span>{new Date(bem.dataUltimaManutencao).toLocaleDateString('pt-BR')}</span>
                          </div>
                        )}

                        {bem.empresaTecnica && (
                          <div className="text-[11px] text-slate-600 flex items-center gap-1.5 truncate pt-1 border-t border-slate-200/60">
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{bem.empresaTecnica}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Valor Pago</span>
                      <span className="text-sm font-bold text-slate-900">
                        {(bem.valor_compra || bem.valorCompra || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {historicoCount > 0 && (
                        <button
                          onClick={() => setBemForHistorico(bem)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                          title="Ver Histórico de Manutenções"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>{historicoCount}</span>
                        </button>
                      )}

                      {canManage && (
                        <>
                          <button
                            onClick={() => onEditBem(bem)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Editar Dados do Bem"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {canDelete && (
                            <button
                              onClick={() => setBemToDelete(bem)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Excluir Bem"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Botão Rápido: Registrar Manutenção Realizada */}
                  {canManage && (
                    <button
                      onClick={() => handleOpenRegistrarManutencao(bem)}
                      className={`w-full py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                        statusManut === 'vencida'
                          ? 'bg-rose-600 hover:bg-rose-700 text-white'
                          : statusManut === 'alerta_proximo'
                          ? 'bg-amber-600 hover:bg-amber-700 text-white'
                          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                      }`}
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Registrar Manutenção Realizada</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: REGISTRAR MANUTENÇÃO REALIZADA (6.1) */}
      {/* ========================================================= */}
      {bemForManutencao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden my-6 animate-in fade-in zoom-in-95">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
                  <Wrench className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    Registrar Manutenção Realizada
                  </h3>
                  <p className="text-xs text-indigo-200 truncate max-w-xs">
                    {bemForManutencao.nome}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBemForManutencao(null)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSalvarManutencao} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo de Manutenção *
                  </label>
                  <select
                    value={manutTipo}
                    onChange={(e) => setManutTipo(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                  >
                    <option value="preventiva">Preventiva Periódica</option>
                    <option value="calibracao">Calibração Técnica / Óptica</option>
                    <option value="corretiva">Corretiva / Reparo de Falha</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data da Realização *
                  </label>
                  <input
                    type="date"
                    required
                    value={manutData}
                    onChange={(e) => setManutData(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Custo do Serviço (R$) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      R$
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0,00"
                      value={manutCusto}
                      onChange={(e) => setManutCusto(parseFloat(e.target.value) || 0)}
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nova Periodicidade (Dias)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={manutPeriodicidade}
                    onChange={(e) => setManutPeriodicidade(parseInt(e.target.value) || 90)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  Técnico / Empresa Responsável *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: MedLaser Engenharia Clínica - Eng. Roberto Alves"
                  value={manutTecnico}
                  onChange={(e) => setManutTecnico(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição do Serviço / Peças Trocadas *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ex: Troca de filtros ópticos, calibração de fluência em Joules, teste de segurança elétrica e higienização interna."
                  value={manutDescricao}
                  onChange={(e) => setManutDescricao(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  Identificação do Laudo / Certificado de Calibração
                </label>
                <input
                  type="text"
                  placeholder="Ex: Certificado_Calibracao_Lavieen_2025.pdf (Laudo 098/2025)"
                  value={manutLaudoNome}
                  onChange={(e) => setManutLaudoNome(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Atualização Automática do Ciclo</span>
                </div>
                <p className="text-[11px] text-emerald-700">
                  Ao salvar, a data da última manutenção será atualizada para <strong>{manutData}</strong>, a próxima manutenção será recalculada para <strong>+{manutPeriodicidade} dias</strong> e o status voltará para <strong>Em Dia</strong>.
                </p>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setBemForManutencao(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar & Salvar Manutenção</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: HISTÓRICO COMPLETO DE MANUTENÇÕES DO BEM */}
      {/* ========================================================= */}
      {bemForHistorico && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
                  <History className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    Histórico de Manutenções & Laudos
                  </h3>
                  <p className="text-xs text-indigo-200">
                    {bemForHistorico.nome} • S/N: {bemForHistorico.numero_serie || 'N/A'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBemForHistorico(null)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {(!bemForHistorico.historicoManutencoes || bemForHistorico.historicoManutencoes.length === 0) ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Wrench className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Nenhum registro de manutenção arquivado para este equipamento.</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
                    <span>Total de intervenções: <strong>{bemForHistorico.historicoManutencoes.length}</strong></span>
                    <span>
                      Custo acumulado:{' '}
                      <strong className="text-slate-900">
                        {bemForHistorico.historicoManutencoes
                          .reduce((acc, h) => acc + (h.custo || 0), 0)
                          .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </strong>
                    </span>
                  </div>

                  {bemForHistorico.historicoManutencoes.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md border ${
                            item.tipo === 'preventiva'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : item.tipo === 'calibracao'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {item.tipo}
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            {new Date(item.dataRealizacao).toLocaleDateString('pt-BR')}
                          </span>
                        </div>

                        <span className="text-xs font-bold text-slate-900">
                          {item.custo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed">
                        {item.descricao}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {item.tecnicoEmpresa}
                        </span>

                        {item.laudoNome && (
                          <span className="flex items-center gap-1 text-indigo-600 font-medium">
                            <FileCheck className="w-3 h-3" />
                            {item.laudoNome}
                          </span>
                        )}

                        <span>Registrado por: <strong>{item.registradoPor}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setBemForHistorico(null)}
                  className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer"
                >
                  Fechar Histórico
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {bemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Confirmar Exclusão de Ativo</h3>
            <p className="text-xs text-slate-600 mt-2">
              Tem certeza que deseja remover o bem <strong>{bemToDelete.nome}</strong>? Esta ação removerá o registro patrimonial e histórico técnico.
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
