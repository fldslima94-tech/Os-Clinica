import React, { useState, useMemo } from 'react';
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
  UserCheck, 
  Eye, 
  EyeOff, 
  Wrench, 
  ShieldAlert,
  RotateCcw,
  Undo2,
  Tv,
  Users,
  Activity,
  Layers,
  Sparkle
} from 'lucide-react';
import { Agendamento, EstoqueInsumo, Paciente, StatusAgendamento, UsuarioEquipe, BemAtivo } from '../types';

interface DashboardViewProps {
  agendamentos: Agendamento[];
  estoque: EstoqueInsumo[];
  pacientes: Paciente[];
  bens?: BemAtivo[];
  profissionais?: UsuarioEquipe[];
  currentUser?: UsuarioEquipe;
  onOpenNewAppointment: () => void;
  onOpenNewPatient: () => void;
  onOpenNewInventory: () => void;
  onUpdateStatus: (agendamentoId: string, novoStatus: StatusAgendamento) => void;
  onViewPatient: (paciente: Paciente) => void;
  onGoToEstoque: () => void;
  onGoToBens?: () => void;
  onOpenCompleteModal?: (agendamento: Agendamento) => void;
  onOpenCheckInModal?: (agendamento: Agendamento) => void;
  onOpenSecondScreenModal?: () => void;
  searchQuery: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  agendamentos,
  estoque,
  pacientes,
  bens = [],
  profissionais = [],
  currentUser,
  onOpenNewAppointment,
  onOpenNewPatient,
  onOpenNewInventory,
  onUpdateStatus,
  onViewPatient,
  onGoToEstoque,
  onGoToBens,
  onOpenCompleteModal,
  onOpenCheckInModal,
  onOpenSecondScreenModal,
  searchQuery,
}) => {
  const [statusFilter, setStatusFilter] = useState<'todos' | StatusAgendamento>('todos');
  const [selectedProfissional, setSelectedProfissional] = useState<string>('todos');
  const [modoDetalhado, setModoDetalhado] = useState<boolean>(false);

  // Filter ONLY appointments of the CURRENT DAY (00:00 to 23:59)
  const todayDateStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  
  const todayAppointments = useMemo(() => {
    return agendamentos.filter(ag => {
      try {
        const agDateStr = new Date(ag.data_hora).toISOString().slice(0, 10);
        return agDateStr === todayDateStr;
      } catch {
        return false;
      }
    });
  }, [agendamentos, todayDateStr]);

  // Filter by search, status, and professional
  const filteredTodayAgendamentos = useMemo(() => {
    return todayAppointments.filter(ag => {
      const matchesStatus = statusFilter === 'todos' || ag.status === statusFilter;
      const matchesProf = selectedProfissional === 'todos' || 
        ag.profissional_id === selectedProfissional || 
        ag.profissional_nome === selectedProfissional;

      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchesStatus && matchesProf;

      const patient = pacientes.find(p => p.id === ag.paciente_id) || ag.paciente;
      const patientName = (patient?.nome || '').toLowerCase();
      const profName = (ag.profissional_nome || '').toLowerCase();

      return matchesStatus && matchesProf && (patientName.includes(query) || profName.includes(query));
    });
  }, [todayAppointments, statusFilter, selectedProfissional, searchQuery, pacientes]);

  // KPI Metrics for Today
  const totalToday = todayAppointments.length;
  const inWaitingRoom = useMemo(() => todayAppointments.filter(a => a.status === 'em_espera').length, [todayAppointments]);
  const inProcedure = useMemo(() => todayAppointments.filter(a => a.status === 'em_atendimento').length, [todayAppointments]);
  const confirmedCount = useMemo(() => todayAppointments.filter(a => a.status === 'confirmado').length, [todayAppointments]);
  const completedToday = useMemo(() => todayAppointments.filter(a => a.status === 'concluido').length, [todayAppointments]);

  const lowStockItems = useMemo(() => estoque.filter(item => item.quantidade <= item.alerta_minimo), [estoque]);

  // Alertas de Manutenção Preventiva de Equipamentos
  const { equipamentosManutVencida, equipamentosManutProxima, equipamentosEmManutencao, totalAlertasManutencao } = useMemo(() => {
    const hojeDashboardStr = new Date().toISOString().slice(0, 10);
    const limite15d = new Date();
    limite15d.setDate(limite15d.getDate() + 15);
    const limite15dStr = limite15d.toISOString().slice(0, 10);

    const vencida = bens.filter(b => 
      b.requerManutencao && 
      b.dataProximaManutencao && 
      b.dataProximaManutencao < hojeDashboardStr &&
      b.estado_conservacao !== 'manutencao'
    );

    const proxima = bens.filter(b => 
      b.requerManutencao && 
      b.dataProximaManutencao && 
      b.dataProximaManutencao >= hojeDashboardStr && 
      b.dataProximaManutencao <= limite15dStr &&
      b.estado_conservacao !== 'manutencao'
    );

    const emManut = bens.filter(b => 
      b.estado_conservacao === 'manutencao' || b.statusManutencao === 'em_manutencao'
    );

    return {
      equipamentosManutVencida: vencida,
      equipamentosManutProxima: proxima,
      equipamentosEmManutencao: emManut,
      totalAlertasManutencao: vencida.length + proxima.length + emManut.length
    };
  }, [bens]);

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
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Balcão do Dia
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 capitalize mt-0.5">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setModoDetalhado(!modoDetalhado)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
          >
            {modoDetalhado ? <EyeOff className="w-3.5 h-3.5 text-slate-500" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
            <span>{modoDetalhado ? 'Ocultar Detalhes' : 'Ver Detalhes'}</span>
          </button>

          {onOpenSecondScreenModal && (
            <button
              type="button"
              onClick={onOpenSecondScreenModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/80 rounded-xl transition-colors cursor-pointer"
            >
              <Tv className="w-3.5 h-3.5 text-purple-600" />
              <span>Transmitir TV</span>
            </button>
          )}

          <button
            onClick={onOpenNewAppointment}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Agendamento</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Hoje</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900 mt-3">{totalToday}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Na Recepção</span>
            <span className={`w-2 h-2 rounded-full ${inWaitingRoom > 0 ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'}`} />
          </div>
          <p className="text-3xl font-bold text-amber-600 mt-3">{inWaitingRoom}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Em Atendimento</span>
            <DoorOpen className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-3xl font-bold text-indigo-600 mt-3">{inProcedure}</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Concluídos</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-emerald-600 mt-3">{completedToday}</p>
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        
        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">
              Profissional:
            </span>
            <select
              value={selectedProfissional}
              onChange={(e) => setSelectedProfissional(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="todos">Todos os Profissionais</option>
              {profissionais.map(p => (
                <option key={p.id} value={p.nome}>{p.nome}</option>
              ))}
            </select>
          </div>

          {/* Status Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setStatusFilter('todos')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'todos' ? 'bg-slate-900 text-white shadow-2xs font-semibold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({totalToday})
            </button>
            <button
              onClick={() => setStatusFilter('em_espera')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'em_espera' ? 'bg-amber-600 text-white shadow-2xs font-semibold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Recepção ({inWaitingRoom})
            </button>
            <button
              onClick={() => setStatusFilter('em_atendimento')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'em_atendimento' ? 'bg-indigo-600 text-white shadow-2xs font-semibold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Em Atendimento ({inProcedure})
            </button>
            <button
              onClick={() => setStatusFilter('concluido')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'concluido' ? 'bg-emerald-600 text-white shadow-2xs font-semibold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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

                      {/* Ações Rápidas & Controle de Status */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {ag.status === 'pendente' && (
                            <>
                              <button
                                onClick={() => onUpdateStatus(ag.id, 'em_espera')}
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                                title="Marcar chegada rápida na recepção"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Chegou</span>
                              </button>
                              {onOpenCheckInModal && (
                                <button
                                  onClick={() => onOpenCheckInModal(ag)}
                                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                  title="Check-In com Pagamento e Agendamento de Retorno"
                                >
                                  <span>Check-In</span>
                                </button>
                              )}
                            </>
                          )}

                          {ag.status === 'confirmado' && (
                            <>
                              <button
                                onClick={() => onUpdateStatus(ag.id, 'em_espera')}
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                                title="Marcar chegada rápida na recepção"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Chegou</span>
                              </button>
                              {onOpenCheckInModal && (
                                <button
                                  onClick={() => onOpenCheckInModal(ag)}
                                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                  title="Check-In com Pagamento e Agendamento de Retorno"
                                >
                                  <span>Check-In</span>
                                </button>
                              )}
                            </>
                          )}

                          {ag.status === 'em_espera' && (
                            <>
                              <button
                                onClick={() => onUpdateStatus(ag.id, 'em_atendimento')}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                                title="Chamar para sala de atendimento"
                              >
                                <DoorOpen className="w-3.5 h-3.5" />
                                <span>Chamar Sala</span>
                              </button>

                              <button
                                onClick={() => onOpenCompleteModal ? onOpenCompleteModal(ag) : onUpdateStatus(ag.id, 'concluido')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                                title="Finalizar atendimento e registrar no caixa"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Finalizar</span>
                              </button>

                              <button
                                onClick={() => onUpdateStatus(ag.id, 'confirmado')}
                                className="p-1 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-md border border-slate-200 transition-colors cursor-pointer"
                                title="Desfazer chegada (retornar para agendado)"
                              >
                                <Undo2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {ag.status === 'em_atendimento' && (
                            <>
                              <button
                                onClick={() => onOpenCompleteModal ? onOpenCompleteModal(ag) : onUpdateStatus(ag.id, 'concluido')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                                title="Concluir procedimento e debitar insumos"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Finalizar</span>
                              </button>

                              {/* Botão de Retorno caso tenha chamado o cliente errado */}
                              <button
                                onClick={() => onUpdateStatus(ag.id, 'em_espera')}
                                className="px-2 py-1 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 rounded-lg text-xs font-semibold transition-all border border-slate-300 flex items-center gap-1 cursor-pointer"
                                title="Chamou errado? Retornar para fila de espera na recepção"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                                <span>Voltar p/ Espera</span>
                              </button>
                            </>
                          )}

                          {ag.status === 'concluido' && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-slate-400 font-semibold">
                                Finalizado
                              </span>
                              <button
                                onClick={() => onUpdateStatus(ag.id, 'em_atendimento')}
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md border border-slate-200 transition-colors cursor-pointer"
                                title="Reabrir atendimento (retornar para em sala)"
                              >
                                <RotateCcw className="w-3 h-3" />
                              </button>
                            </div>
                          )}

                          {ag.status === 'cancelado' && (
                            <button
                              onClick={() => onUpdateStatus(ag.id, 'confirmado')}
                              className="px-2 py-0.5 text-[11px] text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded border border-slate-200 transition-colors cursor-pointer flex items-center gap-1"
                              title="Reativar agendamento"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Reativar</span>
                            </button>
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

      {/* Maintenance Preventive Alerts */}
      {totalAlertasManutencao > 0 && (
        <div className="bg-white border border-amber-200 rounded-3xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-semibold text-slate-900">
                  Manutenção preventiva necessária ({totalAlertasManutencao} equipamentos)
                </h4>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {equipamentosManutVencida.length > 0 && (
                  <span className="text-rose-600 font-medium mr-2">
                    Vencidas: {equipamentosManutVencida.map(e => e.nome).slice(0, 2).join(', ')}
                  </span>
                )}
                {equipamentosManutProxima.length > 0 && (
                  <span className="text-amber-700 font-medium">
                    Próximas: {equipamentosManutProxima.map(e => e.nome).slice(0, 2).join(', ')}
                  </span>
                )}
              </p>
            </div>
          </div>
          
          {onGoToBens && (
            <button
              onClick={onGoToBens}
              className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-semibold transition-colors shrink-0 cursor-pointer"
            >
              Ver Equipamentos
            </button>
          )}
        </div>
      )}

      {/* Low Stock Warning Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-white border border-rose-200 rounded-3xl p-5 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-slate-900">
                {lowStockItems.length} insumos com estoque baixo
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {lowStockItems.map(i => i.nome_item).slice(0, 3).join(', ')}
              </p>
            </div>
          </div>
          <button
            onClick={onGoToEstoque}
            className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Ver Estoque
          </button>
        </div>
      )}
    </div>
  );
};
