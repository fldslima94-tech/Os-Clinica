import React from 'react';
import { ClientWebsiteView } from './ClientWebsiteView';
import { 
  ProcedimentoClinico, 
  SolicitacaoOrcamento, 
  UsuarioEquipe, 
  ClinicaConfig,
  Agendamento
} from '../types';

interface PatientPortalViewProps {
  procedimentos: ProcedimentoClinico[];
  orçamentos: SolicitacaoOrcamento[];
  agendamentos?: Agendamento[];
  onCriarOrcamento: (novoOrcamento: Omit<SolicitacaoOrcamento, 'id' | 'data_solicitacao'>) => void;
  onAtualizarStatusOrcamento?: (id: string, status: SolicitacaoOrcamento['status'], resposta?: string) => void;
  onConverterEmAgendamento?: (orcamento: SolicitacaoOrcamento) => void;
  onDeleteOrcamento?: (id: string) => void;
  onCriarAgendamento?: (novoAgendamento: any) => void;
  currentUser: UsuarioEquipe;
  clinicaConfig?: ClinicaConfig;
  profissionais?: UsuarioEquipe[];
  onGoToAgendaSemanal?: (targetDate?: string) => void;
  onReturnToAdmin?: () => void;
  onAtualizarProcedimento?: (procedimento: ProcedimentoClinico) => void;
  onAtualizarClinicaConfig?: (config: ClinicaConfig) => void;
}

export const PatientPortalView: React.FC<PatientPortalViewProps> = (props) => {
  return <ClientWebsiteView {...props} />;
};
