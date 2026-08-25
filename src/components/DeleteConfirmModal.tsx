import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, ShieldAlert, FileText } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  title: string;
  itemName: string;
  itemType: string;
  description?: string;
  requireReason?: boolean;
  reasonPlaceholder?: string;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  itemType,
  description,
  requireReason = false,
  reasonPlaceholder = 'Ex: Lançamento duplicado, erro de digitação, estorno autorizado...',
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (requireReason && !reason.trim()) {
      setError(true);
      return;
    }
    onConfirm(reason.trim());
    setReason('');
    setError(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-red-100 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 bg-red-50/70 border-b border-red-100 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 border border-red-200">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-700 bg-red-100/80 px-2 py-0.5 rounded">
                Ação Administrativa
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                {title || 'Confirmar Exclusão'}
              </h3>
            </div>
          </div>

          <button
            onClick={() => {
              setReason('');
              setError(false);
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs text-slate-600">
          <p className="text-slate-700 text-sm">
            Você tem certeza que deseja excluir permanentemente o seguinte registro de <strong className="text-slate-900">{itemType}</strong>?
          </p>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-0.5">
              Identificação do Registro
            </p>
            <p className="text-sm font-bold text-slate-900 break-words">
              {itemName}
            </p>
          </div>

          {/* Reason Input for Audit (Mandatory for Financial) */}
          {requireReason && (
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-rose-500" />
                <span>Motivo da Exclusão (Obrigatório para Auditoria):</span>
                <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                required
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error && e.target.value.trim()) setError(false);
                }}
                placeholder={reasonPlaceholder}
                className={`w-full p-2.5 text-xs bg-slate-50 border rounded-xl focus:outline-none focus:ring-2 ${
                  error 
                    ? 'border-rose-400 focus:ring-rose-400/20 bg-rose-50/30' 
                    : 'border-slate-300 focus:ring-indigo-500/20 focus:border-indigo-500'
                }`}
              />
              {error && (
                <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Por favor, informe a justificativa ou motivo antes de excluir.
                </p>
              )}
            </div>
          )}

          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-900 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {description || 'Esta ação não poderá ser desfeita e todos os históricos associados a este registro serão excluídos com registro de auditoria.'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={() => {
              setReason('');
              setError(false);
              onClose();
            }}
            className="px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold rounded-xl text-xs shadow-sm transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Sim, Excluir Registro</span>
          </button>
        </div>

      </div>
    </div>
  );
};

