import React from 'react';
import { 
  AlertTriangle, 
  X, 
  CheckCircle2, 
  Bell, 
  ShieldAlert, 
  Clock, 
  User, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { AvisoQuadro, UsuarioEquipe } from '../types';

interface UrgentAlertPopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  aviso: AvisoQuadro | null;
  onAcknowledge: (avisoId: string) => void;
  onOpenNoticeBoard?: () => void;
  currentUser?: UsuarioEquipe;
}

export const UrgentAlertPopupModal: React.FC<UrgentAlertPopupModalProps> = ({
  isOpen,
  onClose,
  aviso,
  onAcknowledge,
  onOpenNoticeBoard,
  currentUser,
}) => {
  if (!isOpen || !aviso) return null;

  const handleDismiss = () => {
    onAcknowledge(aviso.id);
    onClose();
  };

  const getPriorityStyle = () => {
    switch (aviso.prioridade) {
      case 'urgente':
        return {
          bg: 'bg-rose-50',
          border: 'border-rose-200',
          text: 'text-rose-800',
          badge: 'bg-rose-600 text-white',
          iconBg: 'bg-rose-100 text-rose-600',
          headerBg: 'from-rose-600 to-red-700',
        };
      case 'importante':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-800',
          badge: 'bg-amber-500 text-slate-900',
          iconBg: 'bg-amber-100 text-amber-600',
          headerBg: 'from-amber-600 to-orange-600',
        };
      default:
        return {
          bg: 'bg-indigo-50',
          border: 'border-indigo-200',
          text: 'text-indigo-800',
          badge: 'bg-indigo-600 text-white',
          iconBg: 'bg-indigo-100 text-indigo-600',
          headerBg: 'from-indigo-600 to-blue-700',
        };
    }
  };

  const style = getPriorityStyle();

  // Format date
  const dateFormatted = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(aviso.data_criacao));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200"
        role="alertdialog"
        aria-modal="true"
      >
        {/* Urgent Header Banner */}
        <div className={`bg-gradient-to-r ${style.headerBg} p-5 text-white relative`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 border border-white/30 shadow-sm animate-pulse">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white text-slate-900 shadow-2xs">
                    {aviso.prioridade === 'urgente' ? '🔴 Alerta Urgente em Tela' : '🔔 Comunicado Importante'}
                  </span>
                  <span className="text-xs text-white/80 flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    {dateFormatted}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1 leading-snug">
                  Quadro de Avisos da Clínica
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-black/20 hover:bg-black/30 text-white/80 hover:text-white transition-colors cursor-pointer"
              title="Fechar Pop-up"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {aviso.titulo}
            </h4>
            <div className={`p-4 rounded-xl ${style.bg} border ${style.border} text-slate-800 text-sm leading-relaxed whitespace-pre-line font-medium shadow-2xs`}>
              {aviso.mensagem}
            </div>
          </div>

          {/* Author and Target Info */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Publicado por: <strong>{aviso.autor_nome}</strong></span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 font-bold uppercase text-slate-700">
                {aviso.autor_role === 'admin' ? 'Admin' : aviso.autor_role === 'operador' ? 'Operador' : 'Cliente'}
              </span>
            </div>

            <div className="text-[11px] text-slate-400">
              Destinatários: <strong className="uppercase">{aviso.destinatarios}</strong>
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          {onOpenNoticeBoard && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenNoticeBoard();
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Abrir Quadro de Avisos Completo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleDismiss}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Estou Ciente / Entendido</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
