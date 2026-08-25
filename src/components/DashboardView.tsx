import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Hourglass, 
  AlertTriangle, 
  Plus, 
  Package, 
  User, 
  Sparkles, 
  DoorOpen,
  Filter,
  Check,
  ArrowRight,
  UserCheck,
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { Agendamento, EstoqueInsumo, Paciente, StatusAgendamento, UsuarioEquipe } from '../types';

interface DashboardViewProps {
  agendamentos: Agendamento[];
  estoque: EstoqueInsumo[];
  pacientes: Paciente[];
  profissionais?: UsuarioEquipe[];
  onOpenNewAppointment: () => void;
  onOpenNewPatient: () => void;
  onOpenNewInventory: () => void;
  onUpdateStatus: (agendamentoId: string, novoStatus: StatusAgendamento) => void;
  onViewPatient: (paciente: Paciente) => void;
  onGoToEstoque: () => void;
  onOpenCompleteModal?: (agendamento: Agendamento) => void;
  onOpenCheckInModal?: (agendamento: Agendamento) => void;
  searchQuery: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  agendamentos,
  estoque,
  pacientes,
  profissionais = [],
  onOpenNewAppointment,
  onOpenNewPatient,
  onOpenNewInventory,
  onUpdateStatus,
  onViewPatient,
  onGoToEstoque,
  onOpenCompleteModal,
  onOpenCheckInModal,
  searchQuery,
}) => {
  const [statusFilter, setStatusFilter] = useState<'todos' | StatusAgendamento>('todos');
  const [selectedProfissional, setSelectedProfissional] = useState<string>('todos');
  const [modoDetalhado, setModoDetalhado] = useState<boolean>(false);

  // Filter ONLY appointments of the CURRENT DAY (00:00 to 23:59)
  const todayDateStr = new Date().toISOString().slice(0, 10);
  
  const todayAppointments = agendamentos.filter(ag => {
    try {
      const agDateStr = new Date(ag.data_hora).toISOString().slice(0, 10);
      return agDateStr === todayDateStr;
    } catch {
      return false;
    }
  });

  // Filter by search, status, and professional
  const filteredTodayAgendamentos = todayAppointments.filter(ag => {
    const matchesStatus = statusFilter === 'todos' || ag.status === statusFilter;
    const matchesProf = selectedProfissional === 'todos' || 
      ag.profissional_id === selectedProfissional || 
      ag.profissional_nome === selectedProfissional;

    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesStatus && matchesProf;

    const patient = pacientes.find(p => p.id === ag.paciente_id) || ag.paciente;
    const patientName = patient?.nome.toLowerCase() || '';
    const profName = (ag.profissional_nome || '').toLowerCase();

    return matchesStatus && matchesProf && (patientName.includes(query) || profName.includes(query));
  });

  // KPI Metrics for Today
  const totalToday = todayAppointments.length;
  const inWaitingRoom = todayAppointments.filter(a => a.status === 'em_espera').length;
  const inProcedure = todayAppointments.filter(a => a.status === 'em_atendimento').length;
  const confirmedCount = todayAppointments.filter(a => a.status === 'confirmado').length;
  const completedToday = todayAppointments.filter(a => a.status === 'concluido').length;

  const lowStockItems = estoque.filter(item => item.quantidade <= item.alerta_minimo);

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '--:--';
    }
  };

  const getStatusBadge = (status: StatusAgendamento) => {
    switch (status) {
      case 'em_atendimento':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-300 animate-pulse">
            <DoorOpen className="w-3.5 h-3.5 text-indigo-700" />
            Em Procedimento (Sala)
          </span>
        );
      case 'em_espera':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            Na Recepção (Chegou)
          </span>
        );
      case 'confirmado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Confirmado
          </span>
        );
      case 'pendente':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Hourglass className="w-3.5 h-3.5 text-amber-600" />
            Aguardando Confirmação
          </span>
        );
      case 'concluido':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <Check className="w-3.5 h-3.5 text-slate-500" />
            Concluído
          </span>
        );
      case 'cancelado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200">
            <XCircle className="w-3.5 h-3.5 text-red-500" />
            Cancelado
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Welcome & Reception Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Balcão do Dia (Hoje)
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Painel de Recepção & Balcão de Atendimento
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Filtragem estrita dos atendimentos do dia. Lista otimizada sem exposição de telefones ou valores na recepção.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setModoDetalhado(!modoDetalhado)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            {modoDetalhado ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{modoDetalhado ? 'Ocultar Detalhes' : 'Ver Detalhes'}</span>
          </button>

          <button
            onClick={onOpenNewAppointment}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Agendamento</span>
          </button>
        </div>
      </div>

      {/* Real-time Queue Banner */}
      {(inWaitingRoom > 0 || inProcedure > 0) && (
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-indigo-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
              <DoorOpen className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Fluxo de Recepção & Salas no Momento
              </h3>
              <p className="text-xs text-indigo-200 font-normal mt-0.5">
                {inWaitingRoom} cliente(s) aguardando no sofá da recepção e {inProcedure} em procedimento na sala.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Agendado Hoje</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{totalToday}</p>
          <p className="text-[11px] text-slate-400 mt-1">Horários do dia</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs">
          <div className="flex items-center justify-between text-amber-800 text-xs font-medium">
            <span>Na Recepção (Aguardando)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
          </div>
          <p className="text-2xl font-bold text-amber-900 mt-2">{inWaitingRoom}</p>
          <p className="text-[11px] text-amber-700 mt-1">Prontos para entrar em sala</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-indigo-200 bg-indigo-50/20 shadow-xs">
          <div className="flex items-center justify-between text-indigo-800 text-xs font-medium">
            <span>Em Sala (Atendimento)</span>
            <DoorOpen className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-indigo-900 mt-2">{inProcedure}</p>
          <p className="text-[11px] text-indigo-700 mt-1">Sendo atendidos agora</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-medium">
            <span>Concluídos Hoje</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-900 mt-2">{completedToday}</p>
          <p className="text-[11px] text-emerald-700 mt-1">Finalizados com sucesso</p>
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Filtro por Profissional:
            </span>
            <select
              value={selectedProfissional}
              onChange={(e) => setSelectedProfissional(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="todos">Todos os Profissionais</option>
              {profissionais.map(p => (
                <option key={p.id} value={p.nome}>{p.nome} ({p.cargo})</option>
              ))}
            </select>
          </div>

          {/* Status Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setStatusFilter('todos')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                statusFilter === 'todos' ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({totalToday})
            </button>
            <button
              onClick={() => setStatusFilter('em_espera')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                statusFilter === 'em_espera' ? 'bg-amber-500 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Recepção ({inWaitingRoom})
            </button>
            <button
              onClick={() => setStatusFilter('em_atendimento')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                statusFilter === 'em_atendimento' ? 'bg-indigo-700 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Em Sala ({inProcedure})
            </button>
            <button
              onClick={() => setStatusFilter('concluido')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                statusFilter === 'concluido' ? 'bg-slate-700 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Concluídos ({completedToday})
            </button>
          </div>
        </div>

        {/* Clean Summary Table (Balcão do Dia) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Horário</th>
                <th className="py-3 px-4">Nome do Cliente</th>
                <th className="py-3 px-4">Profissional Responsável</th>
                {modoDetalhado && <th className="py-3 px-4">Procedimento</th>}
                <th className="py-3 px-4">Status no Balcão</th>
                <th className="py-3 px-4 text-center">Ações Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredTodayAgendamentos.length === 0 ? (
                <tr>
                  <td colSpan={modoDetalhado ? 6 : 5} className="py-12 text-center text-slate-400">
                    <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-slate-600">Nenhum atendimento agendado para hoje com este filtro.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Use o botão "Novo Agendamento" para incluir horários de hoje.</p>
                  </td>
                </tr>
              ) : (
                filteredTodayAgendamentos.map((ag) => {
                  const patient = pacientes.find(p => p.id === ag.paciente_id) || ag.paciente;
                  const patientName = patient?.nome || 'Cliente';

                  return (
                    <tr key={ag.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Horário */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="text-sm">{formatTime(ag.data_hora)}</span>
                        </div>
                      </td>

                      {/* Nome do Cliente */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => patient && onViewPatient(patient)}
                          className="font-bold text-slate-900 hover:text-indigo-600 text-left transition-colors cursor-pointer block"
                        >
                          {patientName}
                        </button>
                        {ag.numero_sessao && ag.total_sessoes_pacote && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            Sessão {ag.numero_sessao} de {ag.total_sessoes_pacote}
                          </span>
                        )}
                      </td>

                      {/* Profissional */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-700">
                          {ag.profissional_nome || 'Equipe Geral'}
                        </span>
                      </td>

                      {/* Procedimento (Apenas se Modo Detalhado ativo) */}
                      {modoDetalhado && (
                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {ag.procedimento}
                        </td>
                      )}

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {getStatusBadge(ag.status)}
                      </td>

                      {/* Ações Rápidas */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {ag.status === 'confirmado' && (
                            <button
                              onClick={() => onUpdateStatus(ag.id, 'em_espera')}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                              title="Marcar chegada do paciente na recepção"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Chegou</span>
                            </button>
                          )}

                          {ag.status === 'em_espera' && (
                            <button
                              onClick={() => onUpdateStatus(ag.id, 'em_atendimento')}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                              title="Chamar para sala de atendimento"
                            >
                              <DoorOpen className="w-3.5 h-3.5" />
                              <span>Chamar Sala</span>
                            </button>
                          )}

                          {ag.status === 'em_atendimento' && (
                            <button
                              onClick={() => onOpenCompleteModal ? onOpenCompleteModal(ag) : onUpdateStatus(ag.id, 'concluido')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                              title="Concluir procedimento e debitar insumos"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Finalizar & Retorno</span>
                            </button>
                          )}

                          {ag.status === 'concluido' && (
                            <span className="text-[11px] text-slate-400 font-semibold">
                              Finalizado
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Stock Warning Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-rose-900">
                {lowStockItems.length} insumo(s) abaixo do estoque mínimo
              </h4>
              <p className="text-[11px] text-rose-700">
                {lowStockItems.map(i => i.nome_item).slice(0, 3).join(', ')}
              </p>
            </div>
          </div>
          <button
            onClick={onGoToEstoque}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Ver Estoque
          </button>
        </div>
      )}
    </div>
  );
};
