import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MessageCircle, 
  Calendar as CalendarIcon, 
  List, 
  AlertCircle, 
  Trash2, 
  User, 
  Users, 
  DollarSign, 
  FileText, 
  UserCheck, 
  Sparkles, 
  Columns,
  Store,
  ArrowRight
} from 'lucide-react';
import { Agendamento, Paciente, StatusAgendamento, UsuarioEquipe } from '../types';
import { CalendarGridView } from './CalendarGridView';

interface AppointmentsViewProps {
  agendamentos: Agendamento[];
  pacientes: Paciente[];
  profissionais?: UsuarioEquipe[];
  onOpenNewAppointment: (initialData?: Partial<Agendamento>) => void;
  onUpdateStatus: (id: string, status: StatusAgendamento) => void;
  onViewPatient: (paciente: Paciente) => void;
  onOpenCompleteModal?: (agendamento: Agendamento) => void;
  onOpenCheckInModal?: (agendamento: Agendamento) => void;
  onDeleteAppointment?: (id: string) => void;
  currentUser?: UsuarioEquipe;
  initialBalcaoMode?: boolean;
}

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({
  agendamentos,
  pacientes,
  profissionais = [],
  onOpenNewAppointment,
  onUpdateStatus,
  onViewPatient,
  onOpenCompleteModal,
  onOpenCheckInModal,
  onDeleteAppointment,
  currentUser,
  initialBalcaoMode = false,
}) => {
  const isAdmin = !currentUser || currentUser.role === 'admin';
  const [viewFormat, setViewFormat] = useState<'cards' | 'profissionais' | 'calendario' | 'balcao'>(initialBalcaoMode ? 'balcao' : 'cards');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [filterProfissional, setFilterProfissional] = useState<string>('todos');
  const [search, setSearch] = useState('');
  const [appointmentToDelete, setAppointmentToDelete] = useState<Agendamento | null>(null);
  const [selectedContratoAgendamento, setSelectedContratoAgendamento] = useState<Agendamento | null>(null);

  // Today filter for Balcão (00:00 to 23:59)
  const isToday = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const today = new Date();
      return (
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      );
    } catch {
      return false;
    }
  };

  const balcaoAgendamentos = agendamentos
    .filter(ag => isToday(ag.data_hora))
    .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());

  // Filter appointments for standard views
  const filtered = agendamentos.filter(ag => {
    const matchesStatus = filterStatus === 'todos' || ag.status === filterStatus;
    const matchesProfissional = filterProfissional === 'todos' || 
      ag.profissional_id === filterProfissional || 
      ag.profissional_nome === filterProfissional;
    
    const q = search.toLowerCase();
    const patientName = ag.paciente?.nome.toLowerCase() || '';
    const proc = ag.procedimento.toLowerCase();
    const profName = (ag.profissional_nome || '').toLowerCase();
    
    return matchesStatus && matchesProfissional && (patientName.includes(q) || proc.includes(q) || profName.includes(q));
  });

  const formatDateTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return {
        date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };
    } catch {
      return { date: '--/--', time: '--:--' };
    }
  };

  const handleConcludeClick = (ag: Agendamento) => {
    if (onOpenCompleteModal) {
      onOpenCompleteModal(ag);
    } else {
      onUpdateStatus(ag.id, 'concluido');
    }
  };

  const handleCheckInClick = (ag: Agendamento) => {
    if (onOpenCheckInModal) {
      onOpenCheckInModal(ag);
    } else {
      onUpdateStatus(ag.id, 'confirmado');
    }
  };

  // Get active list of professionals (either from props or inferred from appointments)
  const allProfissionaisList = profissionais.length > 0 ? profissionais : [
    { id: 'user-01', nome: 'Dra. Camila Vasconcelos', cargo: 'Admin / Biomédica Esteta', role: 'admin' as const, email: '', senha: '', telefone: '', status: 'ativo' as const },
    { id: 'user-02', nome: 'Dra. Larissa Souza', cargo: 'Especialista em Harmonização', role: 'operador' as const, email: '', senha: '', telefone: '', status: 'ativo' as const },
    { id: 'user-03', nome: 'Dr. Matheus Brandão', cargo: 'Dermatologia & Injetáveis', role: 'operador' as const, email: '', senha: '', telefone: '', status: 'ativo' as const },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Gestão de Agendamentos & Agenda por Profissional
            </h2>
            <span className="text-[11px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
              Multi-Profissional
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Visualize por profissional, cards gerais ou grade semanal, confirme chegadas com pagamento e retorno.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Toggle Views */}
          <div className="flex flex-wrap bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setViewFormat('balcao')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewFormat === 'balcao'
                  ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Balcão do Dia</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                viewFormat === 'balcao' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-800'
              }`}>
                {balcaoAgendamentos.length}
              </span>
            </button>
            <button
              onClick={() => setViewFormat('cards')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewFormat === 'cards'
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Geral (Cards)</span>
            </button>
            <button
              onClick={() => setViewFormat('profissionais')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewFormat === 'profissionais'
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Por Profissional</span>
            </button>
            <button
              onClick={() => setViewFormat('calendario')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewFormat === 'calendario'
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Grade Semanal</span>
            </button>
          </div>

          <button
            onClick={onOpenNewAppointment}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Agendamento</span>
          </button>
        </div>
      </div>

      {/* RENDER VIEW: BALCAO DO DIA, CALENDAR, CARDS OR PER-PROFESSIONAL */}
      {viewFormat === 'balcao' ? (
        /* VISÃO BALCÃO DO DIA (RECEPÇÃO RESUMIDA: 00:00 ÀS 23:59) */
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-indigo-300">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold">Balcão da Recepção — Atendimentos de Hoje</h3>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Vigência: 00:00 às 23:59
                  </span>
                </div>
                <p className="text-xs text-indigo-200 mt-0.5">
                  Visualização resumida e segura para recepcionistas: apenas Horário, Cliente, Profissional e Status.
                </p>
              </div>
            </div>

            <div className="text-right flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-1">
              <span className="text-xs text-indigo-200">Total Hoje</span>
              <span className="text-xl font-black text-white">{balcaoAgendamentos.length} Pacientes</span>
            </div>
          </div>

          {balcaoAgendamentos.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center shadow-xs">
              <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-800">Nenhum atendimento agendado para hoje</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Todos os horários do dia estão livres ou os agendamentos pertencem a outras datas do calendário.
              </p>
              <button
                onClick={onOpenNewAppointment}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Agendar Paciente para Hoje
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Horário</th>
                      <th className="py-3.5 px-4">Nome do Cliente</th>
                      <th className="py-3.5 px-4">Profissional Responsável</th>
                      <th className="py-3.5 px-4 text-center">Status</th>
                      <th className="py-3.5 px-4 text-right">Ação Balcão</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {balcaoAgendamentos.map((ag) => {
                      const dt = formatDateTime(ag.data_horario);
                      return (
                        <tr key={ag.id} className="hover:bg-slate-50/60 transition-colors">
                          {/* Horário */}
                          <td className="py-3.5 px-4 font-bold text-indigo-700 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-indigo-500" />
                              <span>{dt.time}</span>
                            </div>
                          </td>

                          {/* Nome do Cliente */}
                          <td className="py-3.5 px-4 font-semibold text-slate-800">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0">
                                {ag.paciente?.nome.charAt(0) || 'C'}
                              </div>
                              <div>
                                <span className="block font-bold text-slate-900">{ag.paciente?.nome || 'Cliente sem nome'}</span>
                                {ag.paciente && (
                                  <button
                                    onClick={() => onViewPatient(ag.paciente!)}
                                    className="text-[10px] text-indigo-600 hover:text-indigo-800 underline font-medium cursor-pointer"
                                  >
                                    Ver prontuário rápido
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Profissional */}
                          <td className="py-3.5 px-4 text-slate-700 font-medium whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              <span>{ag.profissional_nome || 'Profissional da Unidade'}</span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              ag.status === 'concluido'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : ag.status === 'confirmado'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : ag.status === 'cancelado'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {ag.status === 'concluido' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                              {ag.status === 'confirmado' && <CheckCircle2 className="w-3 h-3 text-blue-600" />}
                              {ag.status === 'cancelado' && <XCircle className="w-3 h-3 text-rose-600" />}
                              {ag.status === 'pendente' && <Clock className="w-3 h-3 text-amber-600" />}
                              <span className="capitalize">{ag.status}</span>
                            </span>
                          </td>

                          {/* Ações Rápidas */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              {ag.status !== 'concluido' && (
                                <button
                                  onClick={() => handleCheckInClick(ag)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                                  title="Check-In de Chegada, Registro de Pagamento e Agendamento de Retorno"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span>Check-In & Retorno</span>
                                </button>
                              )}

                              {ag.status !== 'concluido' && (
                                <button
                                  onClick={() => handleConcludeClick(ag)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                                  title="Concluir Procedimento e Baixar Insumos"
                                >
                                  <span>Concluir</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : viewFormat === 'calendario' ? (
        <CalendarGridView
          agendamentos={filtered}
          pacientes={pacientes}
          onOpenNewAppointment={onOpenNewAppointment}
          onSelectAgendamento={(ag) => handleConcludeClick(ag)}
          onViewPatient={onViewPatient}
          onUpdateStatus={onUpdateStatus}
        />
      ) : viewFormat === 'profissionais' ? (
        /* VISÃO SEPARADA POR PROFISSIONAL (COLUNAS / ABAS) */
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Agendas Separadas por Profissional</h3>
                <p className="text-xs text-slate-500">Acompanhe a fila de atendimentos e compromissos individuais de cada especialista</p>
              </div>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar paciente ou procedimento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Grid of Professional Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {allProfissionaisList.map((prof) => {
              const profAgendamentos = agendamentos.filter(ag => {
                const isThisProf = ag.profissional_id === prof.id || 
                  ag.profissional_nome === prof.nome ||
                  (!ag.profissional_id && !ag.profissional_nome && prof.role === 'admin');
                
                const q = search.toLowerCase();
                const patientName = ag.paciente?.nome.toLowerCase() || '';
                const proc = ag.procedimento.toLowerCase();
                return isThisProf && (patientName.includes(q) || proc.includes(q));
              });

              return (
                <div key={prof.id} className="bg-slate-50/70 rounded-xl border border-slate-200 p-4 flex flex-col h-full shadow-2xs">
                  
                  {/* Column Header */}
                  <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200 bg-white -mx-4 -mt-4 p-4 rounded-t-xl mb-3 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0 border border-indigo-200">
                        {prof.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 leading-tight">
                          {prof.nome}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {prof.cargo || 'Especialista Clínico'}
                        </p>
                      </div>
                    </div>

                    <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2 py-1 rounded-md border border-indigo-200/60 shrink-0">
                      {profAgendamentos.length} horários
                    </span>
                  </div>

                  {/* Appointments for this professional */}
                  <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-0.5">
                    {profAgendamentos.length === 0 ? (
                      <div className="text-center py-8 px-4 bg-white rounded-lg border border-dashed border-slate-200 text-slate-400 text-xs">
                        Nenhum agendamento para este profissional.
                        <button
                          onClick={onOpenNewAppointment}
                          className="block mx-auto mt-2 text-indigo-600 font-semibold hover:underline cursor-pointer"
                        >
                          + Agendar Horário
                        </button>
                      </div>
                    ) : (
                      profAgendamentos.map((ag) => {
                        const patient = ag.paciente || pacientes.find(p => p.id === ag.paciente_id);
                        const dt = formatDateTime(ag.data_hora);

                        return (
                          <div 
                            key={ag.id}
                            className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-2xs hover:border-indigo-300 transition-all space-y-2.5"
                          >
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                                {dt.date} às {dt.time}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                ag.status === 'confirmado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                ag.status === 'pendente' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                ag.status === 'concluido' ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                                'bg-rose-50 text-rose-600 border border-rose-200'
                              }`}>
                                {ag.status}
                              </span>
                            </div>

                            <div className="space-y-2">
                              {/* Nome do Cliente */}
                              <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  Cliente / Paciente
                                </div>
                                <div className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center justify-between mt-0.5">
                                  <span className="truncate">{patient?.nome || ag.paciente?.nome || 'Cliente'}</span>
                                  {patient && (
                                    <button
                                      onClick={() => onViewPatient(patient)}
                                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer shrink-0 ml-1"
                                    >
                                      Prontuário
                                    </button>
                                  )}
                                </div>
                                {patient?.telefone && (
                                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                    {patient.telefone}
                                  </div>
                                )}
                              </div>

                              {/* Procedimento */}
                              <div className="bg-indigo-50/60 p-2 rounded-lg border border-indigo-100">
                                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-indigo-600" />
                                  <span>Procedimento Agendado</span>
                                </div>
                                <p className="text-xs font-bold text-indigo-950 mt-0.5 leading-snug">
                                  {ag.procedimento}
                                </p>
                                {ag.valor_estimado ? (
                                  <p className="text-[11px] font-bold text-emerald-700 mt-1 font-mono">
                                    R$ {ag.valor_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </p>
                                ) : null}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                              {ag.status !== 'concluido' && (
                                <button
                                  onClick={() => handleCheckInClick(ag)}
                                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Confirmar Chegada, Pagamento e Retorno"
                                >
                                  <UserCheck className="w-3 h-3" />
                                  <span>Chegada & Pagto</span>
                                </button>
                              )}

                              {ag.status !== 'concluido' ? (
                                <button
                                  onClick={() => handleConcludeClick(ag)}
                                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Concluir</span>
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-400 font-medium italic">Atendimento Finalizado</span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* VISÃO EM CARDS COM FILTRO */
        <>
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrar por paciente, procedimento ou profissional..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Filter by Professional */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <label className="text-xs font-bold text-slate-600 whitespace-nowrap flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-indigo-600" />
                <span>Profissional:</span>
              </label>
              <select
                value={filterProfissional}
                onChange={(e) => setFilterProfissional(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
              >
                <option value="todos">Todos os Profissionais</option>
                {allProfissionaisList.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>

            {/* Filter by Status */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              {['todos', 'confirmado', 'pendente', 'concluido', 'cancelado'].map(st => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors cursor-pointer whitespace-nowrap ${
                    filterStatus === st
                      ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of Appointments */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(ag => {
              const patient = ag.paciente || pacientes.find(p => p.id === ag.paciente_id);
              const dt = formatDateTime(ag.data_hora);

              return (
                <div 
                  key={ag.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-mono font-semibold">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{dt.date} às {dt.time}</span>
                      </div>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium capitalize border ${
                        ag.status === 'confirmado' ? 'bg-green-50 text-green-700 border-green-200/60' :
                        ag.status === 'pendente' ? 'bg-amber-50 text-amber-700 border-amber-200/60' :
                        ag.status === 'concluido' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                        'bg-red-50 text-red-600 border-red-200'
                      }`}>
                        {ag.status}
                      </span>
                    </div>

                    <div className="mb-3">
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                        {ag.procedimento}
                      </h3>
                      {ag.valor_estimado && (
                        <p className="text-xs font-semibold text-slate-600 mt-0.5">
                          R$ {ag.valor_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      )}

                      {/* Profissional Designado */}
                      <div className="mt-2 flex items-center gap-1.5 bg-indigo-50/70 border border-indigo-100/80 px-2.5 py-1 rounded-md">
                        <User className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="text-xs font-bold text-indigo-900 truncate">
                          {ag.profissional_nome || 'Dra. Camila Vasconcelos (Admin)'}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 mb-3 space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                        <span className="truncate">{patient?.nome || 'Paciente'}</span>
                        {patient && (
                          <button
                            onClick={() => onViewPatient(patient)}
                            className="text-[11px] text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
                          >
                            Prontuário
                          </button>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>{patient?.telefone}</span>
                        {patient?.telefone && (
                          <a
                            href={`https://wa.me/55${patient.telefone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1 font-medium"
                          >
                            <MessageCircle className="w-3 h-3 text-emerald-600" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Contrato Vinculado se existir */}
                    {ag.contrato_vinculado && (
                      <div className="mb-3">
                        <button
                          onClick={() => setSelectedContratoAgendamento(ag)}
                          className="w-full text-left p-2 bg-purple-50/70 hover:bg-purple-100/70 border border-purple-200 rounded-lg text-xs font-semibold text-purple-900 flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <span className="flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-purple-600" />
                            <span>Contrato Vinculado</span>
                          </span>
                          <span className="text-[10px] bg-purple-200/80 text-purple-800 px-1.5 py-0.5 rounded font-bold">
                            Visualizar
                          </span>
                        </button>
                      </div>
                    )}

                    {ag.observacoes && (
                      <p className="text-xs text-slate-600 bg-amber-50/60 p-2.5 rounded-md border border-amber-100 mb-3 line-clamp-2">
                        {ag.observacoes}
                      </p>
                    )}
                  </div>

                  {/* Status Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1.5 text-xs">
                    <div className="flex items-center gap-1.5">
                      {ag.status !== 'concluido' && (
                        <button
                          onClick={() => handleCheckInClick(ag)}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                          title="Confirmar Chegada do Paciente, Lançar Pagamento e Agendar Retorno"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Chegada</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {ag.status !== 'confirmado' && ag.status !== 'concluido' && (
                        <button
                          onClick={() => onUpdateStatus(ag.id, 'confirmado')}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors cursor-pointer"
                          title="Confirmar"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                      {ag.status !== 'concluido' && (
                        <button
                          onClick={() => handleConcludeClick(ag)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold transition-colors cursor-pointer"
                          title="Concluir Procedimento e Baixar Insumos"
                        >
                          Concluir
                        </button>
                      )}
                      {ag.status !== 'cancelado' && ag.status !== 'concluido' && (
                        <button
                          onClick={() => onUpdateStatus(ag.id, 'cancelado')}
                          className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors cursor-pointer"
                          title="Cancelar"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                      {isAdmin && onDeleteAppointment && (
                        <button
                          onClick={() => setAppointmentToDelete(ag)}
                          className="p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                          title="Excluir Agendamento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modal Visualizador de Contrato */}
      {selectedContratoAgendamento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 bg-purple-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-700" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Contrato do Procedimento
                </h3>
              </div>
              <button
                onClick={() => setSelectedContratoAgendamento(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs text-slate-700 max-h-[60vh] overflow-y-auto">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <p><strong>Paciente:</strong> {selectedContratoAgendamento.paciente?.nome}</p>
                <p><strong>Procedimento:</strong> {selectedContratoAgendamento.procedimento}</p>
                <p><strong>Profissional:</strong> {selectedContratoAgendamento.profissional_nome || 'Dra. Camila Vasconcelos'}</p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
                {selectedContratoAgendamento.contrato_vinculado}
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedContratoAgendamento(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-slate-900"
              >
                Fechar Visualização
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Appointment Deletion */}
      {appointmentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Excluir Agendamento?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Esta ação removerá o horário agendado de <strong>{appointmentToDelete.paciente?.nome || 'Paciente'}</strong> permanentemente.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setAppointmentToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (onDeleteAppointment) onDeleteAppointment(appointmentToDelete.id);
                  setAppointmentToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
