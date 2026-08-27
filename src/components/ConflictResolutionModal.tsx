import React, { useState } from 'react';
import { 
  X, 
  AlertOctagon, 
  ArrowLeftRight, 
  Check, 
  Cloud, 
  HardDrive, 
  RefreshCw, 
  ShieldAlert, 
  Layers, 
  FileText, 
  HeartPulse, 
  User,
  Sparkles
} from 'lucide-react';
import { useConnectionStatus } from '../contexts/ConnectionStatusContext';
import { SyncConflict } from '../services/offlineSyncService';

interface ConflictResolutionModalProps {
  conflict: SyncConflict | null;
  onClose: () => void;
}

export const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({
  conflict,
  onClose,
}) => {
  const { resolveConflict, isSyncing } = useConnectionStatus();
  const [resolutionChoice, setResolutionChoice] = useState<'keep_local' | 'keep_remote' | 'merge'>('merge');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!conflict) return null;

  const handleConfirmResolution = async () => {
    setIsSubmitting(true);
    try {
      await resolveConflict(conflict.id, resolutionChoice);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const local = conflict.localData || {};
  const remote = conflict.remoteData || {};

  // Formata valores para exibição amigável
  const renderValue = (val: any) => {
    if (val === undefined || val === null) return <span className="text-slate-400 italic">Não informado</span>;
    if (typeof val === 'boolean') return val ? <span className="text-emerald-700 font-bold">Sim</span> : <span className="text-slate-600">Não</span>;
    if (Array.isArray(val)) {
      if (val.length === 0) return <span className="text-slate-400 italic">Nenhum registro</span>;
      return <span className="text-slate-700 font-mono text-xs">{val.length} item(ns)</span>;
    }
    if (typeof val === 'object') return <span className="text-slate-700 text-xs truncate">{JSON.stringify(val)}</span>;
    return <span className="text-slate-800 font-medium">{String(val)}</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-4">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-rose-100 bg-gradient-to-r from-rose-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-600 text-white shadow-xs">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Conflito de Dados Detectado
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/30 text-rose-200 border border-rose-400/40">
                  {conflict.entityType.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-rose-200 mt-0.5">
                {conflict.entityTitle} • Modificado concorrentemente na nuvem e localmente
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">O que aconteceu?</strong>
              <span>
                Você editou a ficha/anamnese deste paciente no dispositivo enquanto estava offline ou antes que uma alteração realizada por outro usuário na nuvem fosse recebida. Escolha como deseja resolver esta divergência.
              </span>
            </div>
          </div>

          {/* Comparativo Lado a Lado dos Campos em Conflito */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
              <span>Comparação de Dados (Local vs. Nuvem)</span>
            </h4>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <div className="grid grid-cols-3 bg-slate-100 border-b border-slate-200 p-2.5 text-xs font-bold text-slate-700">
                <div>Campo</div>
                <div className="flex items-center gap-1.5 text-indigo-700">
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>Sua Versão Local (IndexedDB)</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700">
                  <Cloud className="w-3.5 h-3.5" />
                  <span>Versão Remota (Nuvem Firestore)</span>
                </div>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {conflict.conflictFields.length > 0 ? (
                  conflict.conflictFields.map(field => (
                    <div key={field} className="grid grid-cols-3 p-3 hover:bg-slate-50 transition-colors">
                      <div className="font-semibold text-slate-700 capitalize">
                        {field.replace(/_/g, ' ')}
                      </div>
                      <div className="pr-2 bg-indigo-50/40 p-1.5 rounded-lg border border-indigo-100/60">
                        {renderValue(local[field])}
                      </div>
                      <div className="pl-2 bg-emerald-50/40 p-1.5 rounded-lg border border-emerald-100/60">
                        {renderValue(remote[field])}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="grid grid-cols-3 p-3">
                    <div className="font-semibold text-slate-700">Registro Completo</div>
                    <div className="pr-2">{JSON.stringify(local)}</div>
                    <div className="pl-2">{JSON.stringify(remote)}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Opções de Resolução */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Selecione a Estratégia de Resolução</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              
              {/* Opção 1: Mesclar Automaticamente */}
              <label
                onClick={() => setResolutionChoice('merge')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  resolutionChoice === 'merge'
                    ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Mesclar Automaticamente
                    </span>
                    <input
                      type="radio"
                      name="conflict_resolution"
                      checked={resolutionChoice === 'merge'}
                      onChange={() => setResolutionChoice('merge')}
                      className="text-indigo-600"
                    />
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Combina os históricos, preserva todas as fichas de anamnese e sessões de treinos de ambas as fontes.
                  </p>
                </div>
                <span className="mt-2 inline-block px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded-md w-fit">
                  Recomendado
                </span>
              </label>

              {/* Opção 2: Manter Local */}
              <label
                onClick={() => setResolutionChoice('keep_local')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  resolutionChoice === 'keep_local'
                    ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-slate-700" />
                      Manter Versão Local
                    </span>
                    <input
                      type="radio"
                      name="conflict_resolution"
                      checked={resolutionChoice === 'keep_local'}
                      onChange={() => setResolutionChoice('keep_local')}
                      className="text-indigo-600"
                    />
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Sobrescreve a versão da nuvem com as alterações digitadas neste dispositivo.
                  </p>
                </div>
              </label>

              {/* Opção 3: Usar Versão da Nuvem */}
              <label
                onClick={() => setResolutionChoice('keep_remote')}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  resolutionChoice === 'keep_remote'
                    ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                      Aceitar Versão da Nuvem
                    </span>
                    <input
                      type="radio"
                      name="conflict_resolution"
                      checked={resolutionChoice === 'keep_remote'}
                      onChange={() => setResolutionChoice('keep_remote')}
                      className="text-indigo-600"
                    />
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Descarta as edições locais pendentes e mantém a cópia que já está salva na nuvem.
                  </p>
                </div>
              </label>

            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Decidir Depois
          </button>

          <button
            type="button"
            disabled={isSubmitting || isSyncing}
            onClick={handleConfirmResolution}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs cursor-pointer"
          >
            {isSubmitting || isSyncing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>Aplicar Resolução e Sincronizar</span>
          </button>
        </div>

      </div>
    </div>
  );
};
