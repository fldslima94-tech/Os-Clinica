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
 * Helper para obter o rótulo (label) ativo de um campo, considerando renomeações do Admin Master
 */
export function getFieldLabel(
  campoId: string, 
  configuracaoCampos?: ConfiguracaoCampos, 
  fallbackLabel: string = ''
): string {
  if (configuracaoCampos?.labelsCustomizados?.[campoId]) {
    return configuracaoCampos.labelsCustomizados[campoId];
  }
  return fallbackLabel;
}

/**
 * Helper para obter o placeholder ativo de um campo, considerando customizações do Admin Master
 */
export function getFieldPlaceholder(
  campoId: string, 
  configuracaoCampos?: ConfiguracaoCampos, 
  fallbackPlaceholder: string = ''
): string {
  if (configuracaoCampos?.placeholdersCustomizados?.[campoId]) {
    return configuracaoCampos.placeholdersCustomizados[campoId];
  }
  return fallbackPlaceholder;
}

/**
 * Helper para checar se um campo está oculto/removido pelo Admin Master
 */
export function isFieldHidden(
  campoId: string, 
  configuracaoCampos?: ConfiguracaoCampos
): boolean {
  return configuracaoCampos?.camposOcultos?.includes(campoId) ?? false;
}

/**
 * Helper para checar se um campo é obrigatório pelo Admin Master
 */
export function isFieldMandatory(
  campoId: string, 
  configuracaoCampos?: ConfiguracaoCampos, 
  defaultRequired: boolean = false
): boolean {
  if (configuracaoCampos?.camposObrigatorios?.includes(campoId)) {
    return true;
  }
  return defaultRequired;
}

/**
 * FieldWrapper: Componente dinâmico de controle de visibilidade, renomeação,
 * obrigatoriedade e layout de campos pelo Admin Master.
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

  // Obter label customizado se o Admin Master tiver renomeado
  const activeLabel = configuracaoCampos?.labelsCustomizados?.[campoId] || label;
  
  // Obter texto de ajuda customizado se configurado
  const activeHelp = configuracaoCampos?.ajudaCustomizada?.[campoId] || helpText;

  const isMandatory = required || mandatoryList.includes(campoId);

  // Largura customizada definida pelo Admin
  const customWidth = configuracaoCampos?.larguraCampos?.[campoId];
  const widthClass = customWidth === 'full' 
    ? 'col-span-full' 
    : customWidth === 'third' 
      ? 'sm:col-span-1' 
      : '';

  return (
    <div className={`w-full ${widthClass} ${className}`}>
      {activeLabel && (
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          {activeLabel}
          {isMandatory && <span className="text-rose-500 ml-1 font-bold">*</span>}
        </label>
      )}
      {children}
      {activeHelp && (
        <p className="text-[11px] text-slate-400 mt-1">{activeHelp}</p>
      )}
    </div>
  );
};

