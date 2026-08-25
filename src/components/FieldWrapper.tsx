import React from 'react';
import { ConfiguracaoCampos } from '../types';

interface FieldWrapperProps {
  campoId: string;
  configuracaoCampos?: ConfiguracaoCampos;
  camposOcultos?: string[];
  camposObrigatorios?: string[];
  label?: string;
  required?: boolean;
  helpText?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * FieldWrapper: Componente dinâmico de controle de visibilidade e obrigatoriedade de campos
 * Permite ao `admin_total` ocultar ou tornar obrigatórios campos específicos no sistema.
 */
export const FieldWrapper: React.FC<FieldWrapperProps> = ({
  campoId,
  configuracaoCampos,
  camposOcultos = [],
  camposObrigatorios = [],
  label,
  required = false,
  helpText,
  className = '',
  children,
}) => {
  const hiddenList = configuracaoCampos?.camposOcultos || camposOcultos;
  const mandatoryList = configuracaoCampos?.camposObrigatorios || camposObrigatorios;

  // Se o campo estiver na lista de ocultos definida pelo admin_total, não renderiza nada
  if (hiddenList.includes(campoId)) {
    return null;
  }

  const isMandatory = required || mandatoryList.includes(campoId);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          {label}
          {isMandatory && <span className="text-rose-500 ml-1 font-bold">*</span>}
        </label>
      )}
      {children}
      {helpText && (
        <p className="text-[11px] text-slate-400 mt-1">{helpText}</p>
      )}
    </div>
  );
};
