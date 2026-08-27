import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  User, 
  Plus, 
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Agendamento, Paciente, StatusAgendamento } from '../types';

interface CalendarGridViewProps {
  agendamentos: Agendamento[];
  pacientes: Paciente[];
  onOpenNewAppointment: (initialData?: Partial<Agendamento>) => void;
  onSelectAgendamento: (agendamento: Agendamento) => void;
  onViewPatient: (paciente: Paciente) => void;
  onUpdateStatus: (id: string, status: StatusAgendamento) => void;
}

const HOURS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', 
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
];

export const CalendarGridView: React.FC<CalendarGridViewProps> = ({
  agendamentos,
  pacientes,
  onOpenNewAppointment,
  onSelectAgendamento,
  onViewPatient,
  onUpdateStatus,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'semana' | 'dia'>('semana');

  // Helper to get week days around selectedDate (Monday to Saturday)
  const getWeekDays = (baseDate: Date) => {
    const d = new Date(baseDate);
    const day = d.getDay(); // 0 is Sun, 1 is Mon
    const diffToMonday = day === 0 ? -6 : 1 - day;
    
    const monday = new Date(d);
    monday.setDate(d.getDate() + diffToMonday);

    const weekDays: Date[] = [];
    for (let i = 0; i < 6; i++) { // Mon to Sat
      const current = new Date(monday);
      current.setDate(monday.getDate() + i);
      weekDays.push(current);
    }
    return weekDays;
  };

  const weekDays = getWeekDays(selectedDate);

  const navigateDate = (amount: number) => {
    const next = new Date(selectedDate);
    if (viewMode === 'semana') {
      next.setDate(next.getDate() + amount * 7);
    } else {
      next.setDate(next.getDate() + amount);
    }
    setSelectedDate(next);
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const isToday = (d: Date) => isSameDay(d, new Date());

  // Filter appointments for the active period
  const getAgendamentosForDayAndHour = (date: Date, hourStr: string) => {
    const hourNum = parseInt(hourStr.split(':')[0], 10);
    return agendamentos.filter(ag => {
      try {
        const agDate = new Date(ag.data_hora);
        return isSameDay(agDate, date) && agDate.getHours() === hourNum;
      } catch {
        return false;
      }
    });
  };

  const formatHeaderMonth = () => {
    return selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      
      {/* Calendar Controls Bar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
        
        {/* Navigation & Month title */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateDate(-1)}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => setSelectedDate(new Date())}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Hoje
          </button>

          <button
            onClick={() => navigateDate(1)}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Próximo"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <span className="text-sm font-bold text-slate-900 capitalize ml-2">
            {formatHeaderMonth()}
          </span>
        </div>

        {/* View mode switcher */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setViewMode('semana')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'semana'
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Grade Semanal
            </button>
            <button
              onClick={() => setViewMode('dia')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'dia'
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dia Detalhado
            </button>
          </div>

          <button
            onClick={onOpenNewAppointment}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Novo Horário</span>
          </button>
        </div>

      </div>

      {/* Weekly Grid View */}
      {viewMode === 'semana' && (
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            
            {/* Days header row */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
              <div className="p-3 border-r border-slate-200 text-center text-slate-400">
                Horário
              </div>
              {weekDays.map((day, idx) => {
                const dayIsToday = isToday(day);
                return (
                  <div 
                    key={idx} 
                    className={`p-3 text-center border-r border-slate-200 last:border-r-0 ${
                      dayIsToday ? 'bg-indigo-50/70 text-indigo-900' : ''
                    }`}
                  >
                    <p className="uppercase text-[10px] tracking-wider text-slate-400 font-bold">
                      {day.toLocaleDateString('pt-BR', { weekday: 'short' })}
                    </p>
                    <p className={`text-base font-bold mt-0.5 ${dayIsToday ? 'text-indigo-600' : 'text-slate-800'}`}>
                      {day.getDate()}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Hours and Slot Grid */}
            <div className="divide-y divide-slate-100">
              {HOURS.map((hour) => (
                <div key={hour} className="grid grid-cols-7 min-h-[72px]">
                  
                  {/* Time column */}
                  <div className="p-2.5 border-r border-slate-200 text-[11px] font-mono font-medium text-slate-400 text-center bg-slate-50/50 flex items-start justify-center">
                    {hour}
                  </div>

                  {/* Day Slots */}
                  {weekDays.map((day, dIdx) => {
                    const slotAgendamentos = getAgendamentosForDayAndHour(day, hour);
                    const dayIsToday = isToday(day);

                    return (
                      <div 
                        key={dIdx}
                        className={`p-1.5 border-r border-slate-200 last:border-r-0 relative group transition-colors ${
                          dayIsToday ? 'bg-indigo-50/20' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        {slotAgendamentos.length > 0 ? (
                          <div className="space-y-1">
                            {slotAgendamentos.map((ag) => {
                              const patient = ag.paciente || pacientes.find(p => p.id === ag.paciente_id);
                              const isConfirmed = ag.status === 'confirmado';
                              const isDone = ag.status === 'concluido';
                              const isPending = ag.status === 'pendente';

                              return (
                                <div
                                  key={ag.id}
                                  onClick={() => onSelectAgendamento(ag)}
                                  className={`p-2 rounded-lg text-xs cursor-pointer border shadow-2xs transition-transform hover:scale-[1.02] ${
                                    isConfirmed 
                                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
                                      : isDone 
                                      ? 'bg-slate-100 text-slate-700 border-slate-200' 
                                      : isPending 
                                      ? 'bg-amber-50 text-amber-900 border-amber-200' 
                                      : 'bg-red-50 text-red-800 border-red-200'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-1 mb-0.5">
                                    <span className="font-bold truncate text-[11px]">
                                      {patient?.nome || 'Paciente'}
                                    </span>
                                    <span className="text-[9px] px-1 py-0.2 rounded font-semibold capitalize shrink-0 bg-white/80">
                                      {ag.status}
                                    </span>
                                  </div>

                                  <p className="text-[10px] text-slate-600 truncate font-medium">
                                    {ag.procedimento}
                                  </p>

                                  {ag.valor_estimado && (
                                    <p className="text-[10px] font-mono font-bold mt-1 text-slate-800">
                                      R$ {ag.valor_estimado}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              const dStr = day.toISOString().split('T')[0];
                              onOpenNewAppointment({ data_hora: `${dStr}T${hour}:00` });
                            }}
                            className="w-full h-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 rounded text-[11px] font-medium transition-opacity cursor-pointer"
                          >
                            + Agendar
                          </button>
                        )}
                      </div>
                    );
                  })}

                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* Daily View */}
      {viewMode === 'dia' && (
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">
              Agenda de {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              {HOURS.reduce((acc, h) => acc + getAgendamentosForDayAndHour(selectedDate, h).length, 0)} agendamentos neste dia
            </span>
          </div>

          <div className="space-y-3">
            {HOURS.map((hour) => {
              const dayAgendamentos = getAgendamentosForDayAndHour(selectedDate, hour);
              return (
                <div key={hour} className="flex gap-4 items-start p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="w-16 font-mono font-bold text-xs text-slate-600 shrink-0 pt-1">
                    {hour}
                  </div>

                  <div className="flex-1">
                    {dayAgendamentos.length === 0 ? (
                      <div className="flex items-center justify-between text-xs text-slate-400 py-1">
                        <span>Horário livre</span>
                        <button
                          onClick={() => {
                            const dStr = selectedDate.toISOString().split('T')[0];
                            onOpenNewAppointment({ data_hora: `${dStr}T${hour}:00` });
                          }}
                          className="text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
                        >
                          + Agendar
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {dayAgendamentos.map((ag) => {
                          const patient = ag.paciente || pacientes.find(p => p.id === ag.paciente_id);
                          return (
                            <div 
                              key={ag.id}
                              className="p-3 bg-white rounded-lg border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-slate-900">
                                    {patient?.nome}
                                  </span>
                                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium capitalize bg-slate-100 text-slate-700 border border-slate-200">
                                    {ag.status}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 mt-0.5 font-medium">
                                  {ag.procedimento} • Duração: {ag.duracao_minutos || 45} min
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                {patient && (
                                  <button
                                    onClick={() => onViewPatient(patient)}
                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                                  >
                                    Prontuário
                                  </button>
                                )}
                                {ag.status !== 'concluido' && (
                                  <button
                                    onClick={() => onSelectAgendamento(ag)}
                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                                  >
                                    Finalizar / Baixar
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
