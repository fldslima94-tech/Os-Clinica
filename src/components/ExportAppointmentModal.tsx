import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Download,
  ExternalLink,
  Copy,
  Check,
  X,
  Sparkles,
  Clock,
  User,
  MapPin,
  Share2,
  CalendarCheck,
  CheckCircle2,
  Apple
} from 'lucide-react';
import { Agendamento, Paciente, ClinicaConfig } from '../types';
import {
  downloadIcsFile,
  getGoogleCalendarWebUrl,
  getOutlookWebUrl,
  getAppointmentShareSummary,
  getAppointmentStartAndEndDates
} from '../services/calendarExportService';

interface ExportAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agendamento?: Agendamento | null;
  agendamentosEmLote?: Agendamento[];
  pacientes: Paciente[];
  clinicaConfig?: ClinicaConfig;
  tituloLote?: string;
}

export const ExportAppointmentModal: React.FC<ExportAppointmentModalProps> = ({
  isOpen,
  onClose,
  agendamento,
  agendamentosEmLote,
  pacientes,
  clinicaConfig,
  tituloLote = 'Exportar Agendamentos em Lote'
}) => {
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const isBatchMode = !agendamento && !!agendamentosEmLote && agendamentosEmLote.length > 0;
  const paciente = agendamento
    ? pacientes.find(p => p.id === agendamento.paciente_id) || agendamento.paciente
    : null;

  const handleDownloadSingleIcs = () => {
    if (!agendamento) return;
    downloadIcsFile(agendamento, pacientes, clinicaConfig);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleDownloadBatchIcs = () => {
    if (!agendamentosEmLote || agendamentosEmLote.length === 0) return;
    downloadIcsFile(agendamentosEmLote, pacientes, clinicaConfig);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleOpenGoogleCalendar = () => {
    if (!agendamento) return;
    const url = getGoogleCalendarWebUrl(agendamento, paciente, clinicaConfig);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleOpenOutlook = () => {
    if (!agendamento) return;
    const url = getOutlookWebUrl(agendamento, paciente, clinicaConfig);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopySummary = async () => {
    if (!agendamento) return;
    const text = getAppointmentShareSummary(agendamento, paciente, clinicaConfig);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const { startDate } = agendamento ? getAppointmentStartAndEndDates(agendamento) : { startDate: new Date() };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50/70 via-white to-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {isBatchMode ? tituloLote : 'Exportar Agendamento'}
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                  .ICS Universal
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isBatchMode 
                  ? `Sincronize ${agendamentosEmLote?.length} consultas no Apple Calendar, Google Agenda ou Outlook.`
                  : 'Gere o arquivo de calendário para profissionais e pacientes.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5">
          
          {/* Card Resumo do Agendamento */}
          {agendamento && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Procedimento Clínico
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                    {agendamento.procedimento}
                  </h4>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                  agendamento.status === 'concluido' ? 'bg-emerald-100 text-emerald-800' :
                  agendamento.status === 'confirmado' ? 'bg-blue-100 text-blue-800' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  {agendamento.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/60">
                <div className="flex items-center gap-2 text-slate-700">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate"><strong>Paciente:</strong> {paciente?.nome || agendamento.paciente?.nome || 'Paciente'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    {startDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às {startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} ({agendamento.duracao_minutos || 45} min)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 sm:col-span-2">
                  <CalendarCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span className="truncate"><strong>Profissional:</strong> {agendamento.profissional_nome || 'Equipe Clínica'}</span>
                </div>
                {clinicaConfig?.endereco && (
                  <div className="flex items-center gap-2 text-slate-500 sm:col-span-2 text-[11px]">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{clinicaConfig.nome} • {clinicaConfig.endereco}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lote Summary */}
          {isBatchMode && (
            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-indigo-600" />
                  <span>Total de Agendamentos no Lote</span>
                </h4>
                <span className="text-xs font-bold bg-indigo-600 text-white px-2.5 py-0.5 rounded-full">
                  {agendamentosEmLote?.length} consultas
                </span>
              </div>
              <p className="text-xs text-indigo-800 leading-relaxed">
                Este arquivo único <strong>.ICS</strong> conterá todos os agendamentos selecionados com seus respectivos horários, nomes dos pacientes, procedimentos e profissionais responsáveis.
              </p>
            </div>
          )}

          {/* Opções de Exportação */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Escolha como deseja adicionar à agenda:
            </label>

            {/* OPÇÃO 1: BAIXAR ARQUIVO .ICS (Universal) */}
            <button
              onClick={isBatchMode ? handleDownloadBatchIcs : handleDownloadSingleIcs}
              className="w-full p-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold text-xs flex items-center justify-between transition-all shadow-sm cursor-pointer group"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">
                      {isBatchMode ? 'Baixar Arquivo .ICS com Todos os Agendamentos' : 'Baixar Arquivo .ICS (Universal)'}
                    </span>
                    <span className="text-[10px] bg-white/20 px-2 py-0.2 rounded-full font-semibold">
                      Recomendado
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-100 font-normal mt-0.5">
                    1 toque para abrir no <strong>Apple Calendar (iPhone/Mac)</strong>, <strong>Outlook</strong> ou importar no Google Agenda.
                  </p>
                </div>
              </div>

              {downloadSuccess ? (
                <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-500 text-white px-2 py-1 rounded-md shrink-0">
                  <Check className="w-3.5 h-3.5" /> Baixado!
                </span>
              ) : (
                <Download className="w-4 h-4 text-indigo-200 shrink-0" />
              )}
            </button>

            {/* Ações Específicas para Agendamento Individual */}
            {!isBatchMode && agendamento && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                
                {/* OPÇÃO 2: GOOGLE AGENDA WEB */}
                <button
                  onClick={handleOpenGoogleCalendar}
                  className="p-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-left transition-all cursor-pointer group flex items-center gap-3"
                  title="Abre o Google Agenda no navegador com a consulta pré-preenchida"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-800 block truncate">
                      Google Agenda
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate">
                      Abrir no navegador
                    </span>
                  </div>
                </button>

                {/* OPÇÃO 3: OUTLOOK WEB */}
                <button
                  onClick={handleOpenOutlook}
                  className="p-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-left transition-all cursor-pointer group flex items-center gap-3"
                  title="Abre o Outlook Calendar Web"
                >
                  <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-800 block truncate">
                      Microsoft Outlook
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate">
                      Abrir no Outlook Web
                    </span>
                  </div>
                </button>
              </div>
            )}

            {/* OPÇÃO 4: COPIAR RESUMO PARA COMPARTILHAR */}
            {!isBatchMode && agendamento && (
              <button
                onClick={handleCopySummary}
                className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between text-xs font-semibold text-slate-700"
              >
                <div className="flex items-center gap-2.5">
                  <Share2 className="w-4 h-4 text-slate-500" />
                  <span>Copiar mensagem de confirmação para WhatsApp</span>
                </div>
                {copied ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold">
                    <Check className="w-3.5 h-3.5" /> Copiado!
                  </span>
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>
            )}

          </div>

          {/* Dica de Compatibilidade */}
          <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
            <CalendarIcon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Como o paciente ou profissional usa o arquivo .ICS?</strong>
              <p className="mt-0.5 text-amber-800">
                Ao clicar ou receber o arquivo <code>.ics</code> no celular (iPhone ou Android) ou computador, o sistema operacional abre o aplicativo de agenda padrão com alerta configurado automaticamente (1 hora e 24 horas antes).
              </p>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
