import React, { useState, useEffect } from 'react';
import { X, Save, ShieldAlert } from 'lucide-react';
import { useMasterEditMode } from '../contexts/MasterEditModeContext';

export const MasterEditModal: React.FC = () => {
  const { modalState, closeMasterEditModal, onSaveModal } = useMasterEditMode();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (modalState.isOpen) {
      setFormData(modalState.currentData || {});
    }
  }, [modalState]);

  if (!modalState.isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onSaveModal(formData);
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl border-2 border-amber-400 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
        <div className="p-4 bg-gradient-to-r from-amber-500 via-amber-600 to-slate-900 text-slate-950 flex items-center justify-between font-bold">
          <div className="flex items-center gap-2 text-white">
            <ShieldAlert className="w-5 h-5 text-amber-300" />
            <div>
              <h3 className="text-sm font-black">{modalState.title || 'Edição Master de Registro'}</h3>
              <p className="text-[10px] text-amber-200">Coleção: {modalState.collectionName} | ID: {modalState.documentId}</p>
            </div>
          </div>
          <button onClick={closeMasterEditModal} className="p-1 rounded-lg text-white/80 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
          {modalState.fieldsToEdit.map((field) => (
            <div key={field.key} className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                {field.label} ({field.key})
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  rows={3}
                  value={formData[field.key] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none text-xs"
                />
              ) : field.type === 'select' ? (
                <select
                  value={formData[field.key] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 font-semibold cursor-pointer"
                >
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type || 'text'}
                  value={formData[field.key] !== undefined ? formData[field.key] : ''}
                  onChange={(e) => setFormData({ ...formData, [field.key]: field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-xs sm:text-sm font-medium"
                />
              )}
            </div>
          ))}

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={closeMasterEditModal}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
