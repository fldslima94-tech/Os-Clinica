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
      className={`relative inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs border ${
        isMasterEditActive
          ? 'bg-amber-400 hover:bg-amber-500 text-slate-950 border-amber-500 ring-2 ring-amber-400/40 animate-pulse'
          : 'bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-900 border-slate-200'
      }`}
      title="Ativar/Desativar modo de edição e exclusão irrestrita de dados (Alt + E)"
    >
      <Zap className={`w-3.5 h-3.5 ${isMasterEditActive ? 'fill-slate-950 text-slate-950' : 'text-amber-600'}`} />
      <span className="hidden sm:inline">{isMasterEditActive ? 'Modo Edição Master: ATIVO' : 'Modo Edição Master'}</span>
      <span className="sm:hidden">{isMasterEditActive ? 'Master: ON' : 'Master'}</span>
      <span className={`w-2 h-2 rounded-full ${isMasterEditActive ? 'bg-rose-600 animate-ping' : 'bg-slate-400'}`} />
    </button>
  );
};
