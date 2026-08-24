import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Clock, 
  Search, 
  CheckCircle2, 
  Hourglass, 
  XCircle, 
  Check, 
  User, 
  Phone, 
  MessageCircle, 
  Sparkles, 
  Filter,
  LayoutGrid,
  List
} from 'lucide-react';
import { Agendamento, Paciente, StatusAgendamento, UsuarioEquipe } from '../types';
import { CalendarGridView } from './CalendarGridView';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { Trash2 } from 'lucide-react';

interface AppointmentsViewProps {
  agendamentos: Agendamento[];
  pacientes: Paciente[];
  onOpenNewAppointment: () => void;
  onUpdateStatus: (id: string, status: StatusAgendamento) => void;
  onViewPatient: (paciente: Paciente) => void;
  onOpenCompleteModal?: (agendamento: Agendamento) => void;
  onDeleteAppointment?: (id: string) => void;
  currentUser?: UsuarioEquipe;
}

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({
  agendamentos,
  pacientes,
  onOpenNewAppointment,
  onUpdateStatus,
  onViewPatient,
  onOpenCompleteModal,
  onDeleteAppointment,
  currentUser,
}) => {
  const isAdmin = !currentUser || currentUser.role === 'admin';
  const [viewFormat, setViewFormat] = useState<'cards' | 'calendario'>('cards');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [search, setSearch] = useState('');
  const [appointmentToDelete, setAppointmentToDelete] = useState<Agendamento | null>(null);

  const filtered = agendamentos.filter(ag => {
    const matchesStatus = filterStatus === 'todos' || ag.status === filterStatus;
    const q = search.toLowerCase();
    const patientName = ag.paciente?.nome.toLowerCase() || '';
    const proc = ag.procedimento.toLowerCase();
    return matchesStatus && (patientName.includes(q) || proc.includes(q));
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

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Gestão de Agendamentos & Calendário
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Visualize por cards ou grade de horários diária/semanal, confirme presenças e baixe insumos.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Toggle Cards vs Grade Calendário */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setViewFormat('cards')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewFormat === 'cards'
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Lista / Cards</span>
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
            <span>Novo Horário</span>
          </button>
        </div>
      </div>

      {/* RENDER VIEW: CALENDAR OR CARDS */}
      {viewFormat === 'calendario' ? (
        <CalendarGridView
          agendamentos={agendamentos}
          pacientes={pacientes}
          onOpenNewAppointment={onOpenNewAppointment}
          onSelectAgendamento={(ag) => handleConcludeClick(ag)}
          onViewPatient={onViewPatient}
          onUpdateStatus={onUpdateStatus}
        />
      ) : (
        <>
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrar por paciente ou procedimento..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

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

                    {ag.observacoes && (
                      <p className="text-xs text-slate-600 bg-amber-50/60 p-2.5 rounded-md border border-amber-100 mb-3 line-clamp-2">
                        {ag.observacoes}
                      </p>
                    )}
                  </div>

                  {/* Status Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
                    <span className="text-[11px] text-slate-400 font-medium">Ações:</span>
                    <div className="flex items-center gap-1.5">
                      {ag.status !== 'confirmado' && (
                        <button
                          onClick={() => onUpdateStatus(ag.id, 'confirmado')}
                          className="px-2.5 py-1 bg-green-50 text-green-700 hover:bg-green-100 rounded-md font-semibold transition-colors cursor-pointer border border-green-200/60"
                        >
                          Confirmar
                        </button>
                      )}
                      {ag.status !== 'concluido' && (
                        <button
                          onClick={() => handleConcludeClick(ag)}
                          className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md font-semibold transition-colors cursor-pointer border border-indigo-200/60 flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                          <span>Concluir & Baixar</span>
                        </button>
                      )}
                      {ag.status !== 'cancelado' && (
                        <button
                          onClick={() => onUpdateStatus(ag.id, 'cancelado')}
                          className="px-2 py-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md font-medium transition-colors cursor-pointer"
                        >
                          Cancelar
                        </button>
                      )}
                      {isAdmin && onDeleteAppointment && (
                        <button
                          onClick={() => setAppointmentToDelete(ag)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer ml-1"
                          title="Excluir agendamento do sistema (Admin)"
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

      {/* Delete Appointment Confirmation Modal */}
      {appointmentToDelete && (
        <DeleteConfirmModal
          isOpen={!!appointmentToDelete}
          onClose={() => setAppointmentToDelete(null)}
          onConfirm={() => {
            if (appointmentToDelete && onDeleteAppointment) {
              onDeleteAppointment(appointmentToDelete.id);
            }
            setAppointmentToDelete(null);
          }}
          title="Excluir Agendamento"
          itemType="Agendamento da Agenda"
          itemName={`${appointmentToDelete.paciente?.nome || 'Paciente'} - ${appointmentToDelete.procedimento} (${formatDateTime(appointmentToDelete.data_hora).date} às ${formatDateTime(appointmentToDelete.data_hora).time})`}
          description="A exclusão deste agendamento liberará o horário na grade e removerá este atendimento do histórico."
        />
      )}

    </div>
  );
};
