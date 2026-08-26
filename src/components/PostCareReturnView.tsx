import React, { useState } from 'react';
import { 
  Calendar, 
  MessageCircle, 
  Clock, 
  CheckCircle2, 
  Phone, 
  Sparkles, 
  UserCheck, 
  AlertCircle, 
  Search,
  Send,
  ExternalLink,
  ShieldCheck,
  Check,
  ChevronRight,
  Filter,
  Trash2,
  Plus,
  Package,
  HeartHandshake,
  ShoppingBag,
  Tag,
  User,
  X
} from 'lucide-react';
import { AlertaRetornoPos, Paciente, UsuarioEquipe } from '../types';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface PostCareReturnViewProps {
  alertas: AlertaRetornoPos[];
  pacientes?: Paciente[];
  onUpdateAlertaStatus: (alertaId: string, status: 'pendente' | 'agendado' | 'contatado') => void;
  onDeleteAlerta?: (alertaId: string) => void;
  onAddAlerta?: (alerta: Partial<AlertaRetornoPos>) => void;
  onViewPatientByName?: (nome: string) => void;
  currentUser?: UsuarioEquipe;
}

export const PostCareReturnView: React.FC<PostCareReturnViewProps> = ({
  alertas,
  pacientes = [],
  onUpdateAlertaStatus,
  onDeleteAlerta,
  onAddAlerta,
  onViewPatientByName,
  currentUser,
}) => {
  const isAdmin = !currentUser || currentUser.role === 'admin' || currentUser.role === 'gestor';
  const [activeTipoTab, setActiveTipoTab] = useState<'todos' | 'retorno' | 'pos_venda'>('todos');
  const [filter, setFilter] = useState<'todos' | 'pendente' | 'contatado' | 'agendado'>('todos');
  const [search, setSearch] = useState('');
  const [alertaToDelete, setAlertaToDelete] = useState<AlertaRetornoPos | null>(null);

  // New Manual Alert Modal State
  const [isNewAlertModalOpen, setIsNewAlertModalOpen] = useState(false);
  const [novoPacienteNome, setNovoPacienteNome] = useState('');
  const [novoTelefone, setNovoTelefone] = useState('');
  const [novoTipo, setNovoTipo] = useState<'retorno' | 'pos_venda'>('retorno');
  const [novoItemNome, setNovoItemNome] = useState('');
  const [novosDias, setNovosDias] = useState<number>(15);
  const [novoMotivo, setNovoMotivo] = useState('');
  const [novaObservacao, setNovaObservacao] = useState('');

  const filteredAlertas = alertas.filter(a => {
    // Determine item type (default to 'retorno' if undefined)
    const itemTipo = a.tipo || (a.origem_venda === 'produto' ? 'pos_venda' : 'retorno');
    const matchesTipo = activeTipoTab === 'todos' || itemTipo === activeTipoTab;
    const matchesStatus = filter === 'todos' || a.status === filter;
    
    const q = search.toLowerCase();
    const matchesSearch = 
      a.paciente_nome.toLowerCase().includes(q) || 
      a.procedimento_origem.toLowerCase().includes(q) ||
      (a.produto_nome && a.produto_nome.toLowerCase().includes(q)) ||
      a.telefone.includes(q) ||
      a.motivo.toLowerCase().includes(q);

    return matchesTipo && matchesStatus && matchesSearch;
  });

  const totalCount = alertas.length;
  const retornosCount = alertas.filter(a => (a.tipo || 'retorno') === 'retorno').length;
  const posVendaCount = alertas.filter(a => a.tipo === 'pos_venda' || a.origem_venda === 'produto').length;

  const pendentesCount = alertas.filter(a => a.status === 'pendente').length;
  const contatadosCount = alertas.filter(a => a.status === 'contatado').length;
  const agendadosCount = alertas.filter(a => a.status === 'agendado').length;

  const handleSendWhatsApp = (alerta: AlertaRetornoPos) => {
    const primeiroNome = alerta.paciente_nome.split(' ')[0];
    const isPosVenda = alerta.tipo === 'pos_venda' || alerta.origem_venda === 'produto';
    
    let text = '';
    if (isPosVenda) {
      const itemDesc = alerta.produto_nome || alerta.procedimento_origem;
      text = encodeURIComponent(
        `Olá, ${primeiroNome}! Tudo bem? Aqui é da clínica EstéticaOS 🌸\n\nPassando para saber como está sua experiência com o produto *${itemDesc}* que você adquiriu conosco!\n\nQueremos garantir que esteja gostando dos resultados da sua rotina de home care. Teve alguma dúvida sobre o modo de uso ou gostaria de repor seus cuidados?\n\nQualquer dúvida estou à total disposição!`
      );
    } else {
      text = encodeURIComponent(
        `Olá, ${primeiroNome}! Tudo bem? Aqui é da clínica EstéticaOS 🌸\n\nNotamos que completou ${alerta.dias_apos} dias da realização do seu procedimento *${alerta.procedimento_origem}*.\n\nQueremos saber como está sua evolução e te convidar para sua consulta de revisão e avaliação: *${alerta.motivo}* com a nossa especialista.\n\nPodemos verificar os melhores horários para você esta semana?`
      );
    }

    const cleanPhone = alerta.telefone.replace(/\D/g, '');
    const url = `https://wa.me/55${cleanPhone}?text=${text}`;
    
    window.open(url, '_blank');
    onUpdateAlertaStatus(alerta.id, 'contatado');
  };

  const handleSelectPatientAutocomplete = (paciente: Paciente) => {
    setNovoPacienteNome(paciente.nome);
    setNovoTelefone(paciente.telefone || '');
  };

  const handleCreateNewAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoPacienteNome.trim() || !novoItemNome.trim()) return;

    if (onAddAlerta) {
      const d = new Date();
      d.setDate(d.getDate() + Number(novosDias));

      onAddAlerta({
        id: `alerta-${Date.now()}`,
        paciente_nome: novoPacienteNome.trim(),
        telefone: novoTelefone.trim() || '(11) 99999-9999',
        tipo: novoTipo,
        origem_venda: novoTipo === 'pos_venda' ? 'produto' : 'servico',
        procedimento_origem: novoItemNome.trim(),
        produto_nome: novoTipo === 'pos_venda' ? novoItemNome.trim() : undefined,
        data_procedimento: new Date().toISOString(),
        dias_apos: Number(novosDias),
        data_ideal_retorno: d.toISOString(),
        motivo: novoMotivo.trim() || (novoTipo === 'pos_venda' ? `Acompanhamento de Uso: ${novoItemNome}` : `Revisão de ${novosDias} dias`),
        observacao: novaObservacao.trim() || undefined,
        status: 'pendente',
        criado_em: new Date().toISOString(),
      });
    }

    setIsNewAlertModalOpen(false);
    setNovoPacienteNome('');
    setNovoTelefone('');
    setNovoItemNome('');
    setNovoMotivo('');
    setNovaObservacao('');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Central de Retornos Clínicos & Pós-Venda
            </h2>
            <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-indigo-200">
              Retenção & Pós-Procedimento 360°
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Acompanhe separadamente as revisões clínicas de procedimentos em cabine e o pós-venda de produtos / home care para maximizar a fidelização dos clientes.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-center min-w-[75px]">
            <span className="text-xs text-amber-700 font-bold block">{pendentesCount}</span>
            <span className="text-[10px] text-amber-800 uppercase font-semibold">Pendentes</span>
          </div>
          <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-center min-w-[75px]">
            <span className="text-xs text-blue-700 font-bold block">{contatadosCount}</span>
            <span className="text-[10px] text-blue-800 uppercase font-semibold">Em Contato</span>
          </div>
          <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-center min-w-[75px]">
            <span className="text-xs text-emerald-700 font-bold block">{agendadosCount}</span>
            <span className="text-[10px] text-emerald-800 uppercase font-semibold">Agendados</span>
          </div>

          {onAddAlerta && (
            <button
              type="button"
              onClick={() => {
                setNovoTipo('retorno');
                setNovosDias(15);
                setNovoMotivo('Revisão Clínica');
                setIsNewAlertModalOpen(true);
              }}
              className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ml-1"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Acompanhamento</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tabs (Retorno vs Pós-Venda) */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTipoTab('todos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTipoTab === 'todos'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>Todos os Acompanhamentos</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTipoTab === 'todos' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'}`}>
              {totalCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTipoTab('retorno')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTipoTab === 'retorno'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>🔵 Retornos Clínicos (Procedimentos)</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTipoTab === 'retorno' ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-800'}`}>
              {retornosCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTipoTab('pos_venda')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTipoTab === 'pos_venda'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-white text-purple-700 hover:bg-purple-50 border border-purple-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>🟣 Pós-Venda (Produtos & Home Care)</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeTipoTab === 'pos_venda' ? 'bg-purple-700 text-white' : 'bg-purple-100 text-purple-800'}`}>
              {posVendaCount}
            </span>
          </button>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5">
          {(['todos', 'pendente', 'contatado', 'agendado'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer whitespace-nowrap ${
                filter === tab
                  ? 'bg-slate-700 text-white shadow-2xs font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab === 'todos' ? 'Status: Todos' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente, procedimento, produto ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Alerts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAlertas.map(alerta => {
          const isPosVenda = alerta.tipo === 'pos_venda' || alerta.origem_venda === 'produto';
          const itemTitle = alerta.produto_nome || alerta.procedimento_origem;

          return (
            <div
              key={alerta.id}
              className={`bg-white rounded-2xl border p-5 shadow-sm transition-all flex flex-col justify-between ${
                isPosVenda
                  ? alerta.status === 'pendente' ? 'border-purple-300 bg-purple-50/20 ring-1 ring-purple-100' : 'border-purple-200'
                  : alerta.status === 'pendente' ? 'border-blue-300 bg-blue-50/20 ring-1 ring-blue-100' : 'border-slate-200'
              }`}
            >
              <div>
                {/* Header card with Case Badge */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 border ${
                      isPosVenda 
                        ? 'bg-purple-100 text-purple-800 border-purple-200' 
                        : 'bg-blue-100 text-blue-800 border-blue-200'
                    }`}>
                      {alerta.paciente_nome.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-tight">
                        {alerta.paciente_nome}
                      </h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{alerta.telefone}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                      alerta.status === 'pendente'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : alerta.status === 'contatado'
                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    }`}>
                      {alerta.status}
                    </span>

                    {isAdmin && onDeleteAlerta && (
                      <button
                        type="button"
                        onClick={() => setAlertaToDelete(alerta)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                        title="Excluir alerta (Admin)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Badge specifying the case: Retorno vs Pós-Venda */}
                <div className="mb-3">
                  {isPosVenda ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-100 border border-purple-200 text-purple-800 font-bold text-[11px]">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      <span>🟣 Pós-Venda de Produto / Home Care</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-100 border border-blue-200 text-blue-800 font-bold text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      <span>🔵 Retorno Clínico / Procedimento</span>
                    </div>
                  )}
                </div>

                {/* Details Box */}
                <div className="bg-white rounded-xl p-3 border border-slate-200/80 space-y-2 text-xs mb-4 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>{isPosVenda ? 'Produto Vendido:' : 'Procedimento Realizado:'}</span>
                    <span className="font-bold text-slate-900 text-right">{itemTitle}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Data da Venda/Sessão:</span>
                    <span className="font-medium text-slate-700">
                      {new Date(alerta.data_procedimento).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Prazo / Janela Ideal:</span>
                    <span className="font-semibold text-indigo-700">
                      {alerta.dias_apos} dias após
                    </span>
                  </div>

                  <div className={`p-2.5 rounded-lg border font-medium text-[11px] flex items-start gap-2 ${
                    isPosVenda
                      ? 'bg-purple-50/70 border-purple-200 text-purple-900'
                      : 'bg-blue-50/70 border-blue-200 text-blue-900'
                  }`}>
                    <HeartHandshake className="w-3.5 h-3.5 shrink-0 mt-0.5 text-indigo-600" />
                    <span>{alerta.motivo}</span>
                  </div>

                  {alerta.observacao && (
                    <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-100">
                      Obs: {alerta.observacao}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleSendWhatsApp(alerta)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  title="Disparar mensagem personalizada no WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{isPosVenda ? 'WhatsApp Pós-Venda' : 'WhatsApp Retorno'}</span>
                </button>

                {alerta.status !== 'agendado' ? (
                  <button
                    type="button"
                    onClick={() => onUpdateAlertaStatus(alerta.id, 'agendado')}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                    title="Marcar como atendido / agendado"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Concluído</span>
                  </button>
                ) : (
                  <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 px-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Atendido</span>
                  </span>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {filteredAlertas.length === 0 && (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-bold text-slate-700">
            Nenhum acompanhamento encontrado
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {activeTipoTab === 'pos_venda' 
              ? 'Não há acompanhamentos de pós-venda de produtos cadastrados.' 
              : activeTipoTab === 'retorno'
              ? 'Não há retornos clínicos de procedimentos pendentes.'
              : 'Todos os clientes já foram contatados ou atendidos pela recepção.'}
          </p>
        </div>
      )}

      {/* Delete Return Alert Confirmation Modal */}
      {alertaToDelete && (
        <DeleteConfirmModal
          isOpen={!!alertaToDelete}
          onClose={() => setAlertaToDelete(null)}
          onConfirm={() => {
            if (alertaToDelete && onDeleteAlerta) {
              onDeleteAlerta(alertaToDelete.id);
            }
            setAlertaToDelete(null);
          }}
          title="Excluir Alerta de Acompanhamento"
          itemType={alertaToDelete.tipo === 'pos_venda' ? 'Alerta de Pós-Venda' : 'Alerta de Retorno Clínico'}
          itemName={`${alertaToDelete.paciente_nome} - ${alertaToDelete.produto_nome || alertaToDelete.procedimento_origem} (${alertaToDelete.motivo})`}
          description="A exclusão removerá este lembrete de acompanhamento pós-atendimento da central."
        />
      )}

      {/* New Manual Alert Modal */}
      {isNewAlertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <HeartHandshake className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold">Novo Lembrete de Acompanhamento</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewAlertModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewAlert} className="p-5 space-y-4 text-xs">
              
              {/* Type Switch */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Tipo do Acompanhamento *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNovoTipo('retorno');
                      setNovoMotivo('Revisão Clínica & Retoque');
                    }}
                    className={`p-2.5 rounded-xl border text-left flex items-start gap-2 cursor-pointer transition-all ${
                      novoTipo === 'retorno'
                        ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-2xs font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Calendar className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span>🔵 Retorno Clínico</span>
                      <span className="block text-[10px] font-normal text-slate-500">Procedimento em cabine</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNovoTipo('pos_venda');
                      setNovoMotivo('Pós-Venda & Experiência Home Care');
                    }}
                    className={`p-2.5 rounded-xl border text-left flex items-start gap-2 cursor-pointer transition-all ${
                      novoTipo === 'pos_venda'
                        ? 'bg-purple-50 border-purple-300 text-purple-900 shadow-2xs font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <span>🟣 Pós-Venda de Produto</span>
                      <span className="block text-[10px] font-normal text-slate-500">Home care / Dermocosmético</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Patient Name with quick autocomplete chips */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nome do Cliente / Paciente *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mariana Vasconcelos"
                  value={novoPacienteNome}
                  onChange={(e) => setNovoPacienteNome(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />

                {pacientes.length > 0 && !novoPacienteNome && (
                  <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Clientes Recentes:</span>
                    {pacientes.slice(0, 3).map((p) => (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => handleSelectPatientAutocomplete(p)}
                        className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 hover:bg-indigo-100 hover:text-indigo-900 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                      >
                        {p.nome}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Telefone / WhatsApp *
                </label>
                <input
                  type="text"
                  required
                  placeholder="(11) 99999-9999"
                  value={novoTelefone}
                  onChange={(e) => setNovoTelefone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Item or Procedure */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {novoTipo === 'pos_venda' ? 'Nome do Produto Vendido *' : 'Procedimento Realizado *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={novoTipo === 'pos_venda' ? "Ex: Sérum Ácido Hialurônico 30ml" : "Ex: Toxina Botulínica Terço Superior"}
                  value={novoItemNome}
                  onChange={(e) => setNovoItemNome(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Days interval */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Prazo do Acompanhamento:
                </label>
                <div className="flex flex-wrap gap-2">
                  {[7, 15, 21, 30, 45, 60].map((dias) => (
                    <button
                      key={dias}
                      type="button"
                      onClick={() => setNovosDias(dias)}
                      className={`px-3 py-1.5 rounded-lg font-semibold border transition-all cursor-pointer ${
                        novosDias === dias
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {dias} dias
                    </button>
                  ))}
                </div>
              </div>

              {/* Motivo */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Motivo / Objetivo do Contato
                </label>
                <input
                  type="text"
                  placeholder="Ex: Verificar adaptação e evolução clínica"
                  value={novoMotivo}
                  onChange={(e) => setNovoMotivo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewAlertModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Cadastrar Acompanhamento</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
