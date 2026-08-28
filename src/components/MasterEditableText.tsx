import React, { useState } from 'react';
import { Edit2, Check, X, Trash2 } from 'lucide-react';
import { useMasterEditMode } from '../contexts/MasterEditModeContext';

interface MasterEditableTextProps {
  collectionName: string;
  documentId: string;
  fieldKey: string;
  value: string | number;
  type?: 'text' | 'number';
  className?: string;
  allowDelete?: boolean;
  deleteLabel?: string;
  onDeleted?: () => void;
  children?: React.ReactNode;
}

export const MasterEditableText: React.FC<MasterEditableTextProps> = ({
  collectionName,
  documentId,
  fieldKey,
  value,
  type = 'text',
  className = '',
  allowDelete = false,
  deleteLabel,
  onDeleted,
  children,
}) => {
  const { isMasterEditActive, masterRenameField, masterDeleteRecord } = useMasterEditMode();
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState<string>(String(value || ''));
  const [isSaving, setIsSaving] = useState(false);

  if (!isMasterEditActive) {
    return <>{children || value}</>;
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSaving(true);
    const finalVal = type === 'number' ? parseFloat(tempValue) || 0 : tempValue.trim();
    const ok = await masterRenameField(collectionName, documentId, fieldKey, finalVal);
    setIsSaving(false);
    if (ok) setIsEditing(false);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await masterDeleteRecord(collectionName, documentId, deleteLabel || String(value));
    if (ok && onDeleted) onDeleted();
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSave} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 z-20">
        <input
          type={type}
          autoFocus
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          className="px-2 py-0.5 text-xs bg-amber-50 border-2 border-amber-400 rounded-lg text-slate-900 font-bold focus:outline-none shadow-xs"
        />
        <button
          type="submit"
          disabled={isSaving}
          className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md cursor-pointer"
          title="Salvar alteração"
        >
          <Check className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md cursor-pointer"
          title="Cancelar"
        >
          <X className="w-3 h-3" />
        </button>
      </form>
    );
  }

  return (
    <span className={`group/master relative inline-flex items-center gap-1.5 p-0.5 rounded-lg border border-dashed border-amber-300 bg-amber-50/40 hover:bg-amber-100/60 transition-all ${className}`}>
      <span>{children || value}</span>
      <span className="opacity-0 group-hover/master:opacity-100 inline-flex items-center gap-1 transition-opacity">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setTempValue(String(value || ''));
            setIsEditing(true);
          }}
          className="p-1 rounded bg-amber-500 hover:bg-amber-600 text-white cursor-pointer shadow-2xs"
          title={`[Master] Renomear ${fieldKey}`}
        >
          <Edit2 className="w-2.5 h-2.5" />
        </button>
        {allowDelete && (
          <button
            type="button"
            onClick={handleDelete}
            className="p-1 rounded bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-2xs"
            title="[Master] Excluir Registro Definitivamente"
          >
            <Trash2 className="w-2.5 h-2.5" />
          </button>
        )}
      </span>
    </span>
  );
};
