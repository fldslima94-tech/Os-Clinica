import React, { useState } from 'react';
import { 
  Tv, 
  Monitor, 
  ExternalLink, 
  Copy, 
  Check, 
  Maximize2, 
  Layers, 
  Sparkles, 
  Clock, 
  Sun, 
  Sunset, 
  Moon, 
  ShieldCheck, 
  X,
  Smartphone,
  Share2
} from 'lucide-react';
import { ClinicaConfig, UsuarioEquipe } from '../types';

interface SecondScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenInsideApp: () => void;
  clinicaConfig?: ClinicaConfig;
  currentUser?: UsuarioEquipe;
}

export const SecondScreenModal: React.FC<SecondScreenModalProps> = ({
  isOpen,
  onClose,
  onOpenInsideApp,
  clinicaConfig,
  currentUser,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const tvUrl = `${window.location.origin}${window.location.pathname}?mode=tv`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(tvUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleOpenNewWindow = () => {
    window.open(tvUrl, '_blank');
    onClose();
  };

  const handleStartInside = () => {
    onOpenInsideApp();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden text-slate-900 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white font-display">
                  Segunda Tela (TV Recepção)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Balcão do Dia
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Espelhamento limpo da agenda do dia por turnos para a TV da recepção.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Security & Feature Highlight */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-950 space-y-1">
              <p className="font-bold">Privacidade & Segurança Garantidas na Recepção</p>
              <p className="text-indigo-800 leading-relaxed">
                Nenhum valor financeiro, faturamento, custos ou dados confidenciais são mostrados nesta tela. O painel exibe apenas os horários, pacientes, procedimentos e profissionais organizados por turnos (<strong>Manhã, Tarde e Noite</strong>).
              </p>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Action 1: Open in New Tab / Screen */}
            <button
              type="button"
              onClick={handleOpenNewWindow}
              className="p-4 rounded-2xl border-2 border-indigo-600 bg-indigo-600/5 hover:bg-indigo-600/10 text-left transition-all group cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <ExternalLink className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                  Recomendado
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Abrir em Nova Janela
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Arraste para o segundo monitor ou Smart TV conectada via HDMI.
                </p>
              </div>
            </button>

            {/* Action 2: View inside this window */}
            <button
              type="button"
              onClick={handleStartInside}
              className="p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 text-left transition-all group cursor-pointer flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl bg-slate-800 text-white flex items-center justify-center">
                  <Maximize2 className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Exibir Nesta Janela
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ativa o modo apresentação de TV diretamente na aba atual.
                </p>
              </div>
            </button>
          </div>

          {/* Direct Smart TV Link Generator (Virtual Reception User link) */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <Tv className="w-4 h-4" />
                <span>Link Direto para Smart TV / Tablet da Recepção</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Acesso Direto</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={tvUrl}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer shadow-sm"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              💡 <strong>Como usar:</strong> Abra o navegador da Smart TV (LG webOS, Samsung Tizen, Android TV) e acerte a URL acima. A tela se manterá sincronizada em tempo real com o balcão.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
