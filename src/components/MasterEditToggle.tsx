import React from 'react';
import { Zap } from 'lucide-react';
import { useMasterEditMode } from '../contexts/MasterEditModeContext';

export const MasterEditToggle: React.FC = () => {
  const { isMasterEditActive, toggleMasterEditMode, canUseMasterEdit } = useMasterEditMode();

  if (!canUseMasterEdit) return null;

  return (
    <button
      type="button"
      onClick={toggleMasterEditMode}
      className={`relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
        isMasterEditActive
          ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-2xs font-semibold'
          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
      }`}
      title="Ativar/Desativar modo de edição direta (Alt + E)"
    >
      <Zap className={`w-3.5 h-3.5 ${isMasterEditActive ? 'fill-current text-white' : 'text-amber-500'}`} />
      <span className="hidden sm:inline">{isMasterEditActive ? 'Edição Master' : 'Edição'}</span>
      <span className="sm:hidden">{isMasterEditActive ? 'Master' : 'Edição'}</span>
      {isMasterEditActive && (
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
      )}
    </button>
  );
};
