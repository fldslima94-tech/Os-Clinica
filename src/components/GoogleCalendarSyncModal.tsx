import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  LogOut,
  ExternalLink,
  Plus,
  Clock,
  User,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import {
  getStoredWorkspaceAuth,
  requestGoogleWorkspaceToken,
  clearWorkspaceAuth,
  GoogleWorkspaceAuthState,
  GOOGLE_CALENDAR_SCOPE
} from '../services/googleAuthService';
import {
  createCalendarEvent,
  listCalendarEvents,
  GoogleCalendarEvent
} from '../services/googleCalendarService';
import { Agendamento, Paciente } from '../types';

interface GoogleCalendarSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  agendamentos: Agendamento[];
  pacientes: Paciente[];
}

export const GoogleCalendarSyncModal: React.FC<GoogleCalendarSyncModalProps> = ({
  isOpen,
  onClose,
  agendamentos,
  pacientes
}) => {
  const [authState, setAuthState] = useState<GoogleWorkspaceAuthState>(getStoredWorkspaceAuth());
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [syncedIds, setSyncedIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('aura_synced_calendar_appointments');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    if (isOpen) {
      const auth = getStoredWorkspaceAuth();
      setAuthState(auth);
      if (auth.isConnected && auth.hasCalendarAccess) {
        carregarEventos();
      }
    }
  }, [isOpen]);

  const showFeedback = (type: 'success' | 'error' | 'info', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleConnectCalendar = async () => {
    setIsAuthenticating(true);
    try {
      await requestGoogleWorkspaceToken();
      const updated = getStoredWorkspaceAuth();
      setAuthState(updated);
      showFeedback('success', 'Google Calendar sincronizado com sucesso!');
      carregarEventos();
    } catch (err: any) {
      console.error('[handleConnectCalendar] Erro:', err);
      showFeedback('error', 'Falha ao conectar Google Calendar: ' + (err.message || 'Erro de autenticação'));
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDisconnect = () => {
    clearWorkspaceAuth();
    setAuthState(getStoredWorkspaceAuth());
    setUpcomingEvents([]);
    showFeedback('info', 'Desconectado da conta do Google.');
  };

  const carregarEventos = async () => {
    setIsLoadingEvents(true);
    try {
      const now = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 14);

      const events = await listCalendarEvents(now.toISOString(), nextWeek.toISOString());
      setUpcomingEvents(events);
    } catch (err: any) {
      console.error('[carregarEventos] Erro:', err);
      showFeedback('error', 'Erro ao carregar eventos da agenda Google.');
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const syncAppointmentToCalendar = async (ag: Agendamento) => {
    setSyncingId(ag.id);
    try {
      const paciente = pacientes.find(p => p.id === ag.paciente_id);
      const pacienteNome = paciente?.nome || 'Paciente';

      // Monta data início e fim
      const startDate = new Date(ag.data_hora);
      // Duração padrão 45 minutos
      const duracaoMin = ag.duracao_minutos || 45;
      const endDate = new Date(startDate.getTime() + duracaoMin * 60000);

      const eventPayload: GoogleCalendarEvent = {
        summary: `Atendimento: ${pacienteNome} - ${ag.procedimento}`,
        description: `Procedimento: ${ag.procedimento}\nProfissional: ${ag.profissional_nome || 'Equipe'}\nPaciente: ${pacienteNome} (${paciente?.telefone || 'sem telefone'})\nStatus no Sistema: ${ag.status}\nObservações: ${ag.observacoes || 'Nenhuma'}\n\nAgendado via Aura Estética App.`,
        start: {
          dateTime: startDate.toISOString(),
          timeZone: 'America/Sao_Paulo'
        },
        end: {
          dateTime: endDate.toISOString(),
          timeZone: 'America/Sao_Paulo'
        },
        location: 'Aura Estética Clínica'
      };

      const res = await createCalendarEvent(eventPayload);

      const nextSet = new Set(syncedIds);
      nextSet.add(ag.id);
      setSyncedIds(nextSet);
      localStorage.setItem('aura_synced_calendar_appointments', JSON.stringify(Array.from(nextSet)));

      showFeedback('success', `Agendamento de "${pacienteNome}" enviado para o Google Calendar!`);
      await carregarEventos();
    } catch (err: any) {
      console.error('[syncAppointmentToCalendar] Erro:', err);
      showFeedback('error', 'Falha ao sincronizar com Google Calendar: ' + (err.message || 'Erro'));
    } finally {
      setSyncingId(null);
    }
  };

  const syncAllPendingAppointments = async () => {
    setIsSyncingAll(true);
    let successCount = 0;
    try {
      const toSync = agendamentos.filter(ag => !syncedIds.has(ag.id) && ag.status !== 'cancelado').slice(0, 10);
      for (const ag of toSync) {
        try {
          const paciente = pacientes.find(p => p.id === ag.paciente_id);
          const pacienteNome = paciente?.nome || 'Paciente';

          const startDate = new Date(ag.data_hora);
          const duracaoMin = ag.duracao_minutos || 45;
          const endDate = new Date(startDate.getTime() + duracaoMin * 60000);

          await createCalendarEvent({
            summary: `Atendimento: ${pacienteNome} - ${ag.procedimento}`,
            description: `Procedimento: ${ag.procedimento}\nProfissional: ${ag.profissional_nome || 'Equipe'}\nPaciente: ${pacienteNome}`,
            start: { dateTime: startDate.toISOString(), timeZone: 'America/Sao_Paulo' },
            end: { dateTime: endDate.toISOString(), timeZone: 'America/Sao_Paulo' },
            location: 'Aura Estética Clínica'
          });
          successCount++;
        } catch (e) {
          console.warn('Erro ao sincronizar agendamento individual:', ag.id, e);
        }
      }

      const nextSet = new Set(syncedIds);
      toSync.forEach(ag => nextSet.add(ag.id));
      setSyncedIds(nextSet);
      localStorage.setItem('aura_synced_calendar_appointments', JSON.stringify(Array.from(nextSet)));

      showFeedback('success', `${successCount} agendamentos sincronizados com o Google Calendar com sucesso!`);
      await carregarEventos();
    } catch (err: any) {
      showFeedback('error', 'Falha parcial ao sincronizar lote com o Calendar.');
    } finally {
      setIsSyncingAll(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl max-w-2xl w-full p-6 animate-in fade-in zoom-in-95 space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Sincronização com Google Calendar
              </h3>
              <p className="text-xs text-slate-500">
                Envie consultas e retornos diretamente para a agenda do Google da clínica ou dos profissionais
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            ✕
          </button>
        </div>

        {/* Feedback alert */}
        {feedback && (
          <div
            className={`flex items-center justify-between p-3.5 rounded-xl text-xs font-semibold border ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : feedback.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-blue-50 text-blue-800 border-blue-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
              {feedback.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
              {feedback.type === 'info' && <CalendarIcon className="w-4 h-4 text-blue-600 shrink-0" />}
              <span>{feedback.message}</span>
            </div>
          </div>
        )}

        {/* Status Conexão */}
        <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2.5">
            {authState.isConnected && authState.hasCalendarAccess ? (
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
            )}
            <div>
              <span className="text-xs font-bold text-slate-800">
                {authState.isConnected && authState.hasCalendarAccess
                  ? 'Google Calendar Conectado'
                  : 'Google Calendar Desconectado'}
              </span>
              <span className="text-[11px] text-slate-400 block">
                {authState.isConnected && authState.hasCalendarAccess
                  ? 'Permissão ativa para gerenciar eventos na agenda principal'
                  : 'Conecte sua conta do Google para enviar os agendamentos'}
              </span>
            </div>
          </div>

          <div>
            {authState.isConnected && authState.hasCalendarAccess ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={carregarEventos}
                  disabled={isLoadingEvents}
                  className="p-1.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg text-xs"
                  title="Atualizar eventos"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingEvents ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={handleDisconnect}
                  className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-lg transition"
                >
                  Desconectar
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnectCalendar}
                disabled={isAuthenticating}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50"
              >
                <span>{isAuthenticating ? 'Conectando...' : 'Conectar Google'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Lista de Agendamentos para sincronizar */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold text-slate-700">Agendamentos Recentes da Clínica:</span>
            {authState.isConnected && authState.hasCalendarAccess && (
              <button
                onClick={syncAllPendingAppointments}
                disabled={isSyncingAll}
                className="text-blue-600 hover:text-blue-800 font-bold hover:underline disabled:opacity-50"
              >
                {isSyncingAll ? 'Sincronizando lote...' : 'Sincronizar Próximos 10 no Google'}
              </button>
            )}
          </div>

          {agendamentos.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              Nenhum agendamento cadastrado no sistema.
            </div>
          ) : (
            <div className="space-y-2">
              {agendamentos.slice(0, 15).map(ag => {
                const paciente = pacientes.find(p => p.id === ag.paciente_id);
                const isSynced = syncedIds.has(ag.id);
                const isSyncingThis = syncingId === ag.id;

                return (
                  <div
                    key={ag.id}
                    className="p-3 bg-white rounded-xl border border-slate-200 hover:border-blue-200 transition flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 truncate">
                          {paciente?.nome || 'Paciente'}
                        </span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                          {ag.procedimento}
                        </span>
                        {isSynced && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            Sincronizado
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-slate-400 text-[11px] mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {ag.data_hora ? new Date(ag.data_hora).toLocaleDateString('pt-BR') : ''}
                        </span>
                        {ag.profissional_nome && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            {ag.profissional_nome}
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      {authState.isConnected && authState.hasCalendarAccess ? (
                        <button
                          onClick={() => syncAppointmentToCalendar(ag)}
                          disabled={isSyncingThis}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                            isSynced
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-2xs'
                          } disabled:opacity-50`}
                        >
                          <CalendarIcon className={`w-3.5 h-3.5 ${isSyncingThis ? 'animate-spin' : ''}`} />
                          <span>{isSyncingThis ? 'Sincronizando...' : isSynced ? 'Reenviar' : 'Adicionar ao Google'}</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Conecte o Google</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="text-[11px] text-slate-400">
            {upcomingEvents.length > 0
              ? `${upcomingEvents.length} eventos futuros localizados no Google Calendar.`
              : 'Nenhum evento do Calendar sincronizado nesta sessão.'}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
