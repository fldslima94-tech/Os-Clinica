import React, { useState, useEffect } from 'react';
import { 
  MOCK_PACIENTES, 
  MOCK_AGENDAMENTOS, 
  MOCK_ESTOQUE, 
  MOCK_TRANSACOES, 
  MOCK_USUARIOS, 
  MOCK_ALERTAS_RETORNO, 
  MOCK_PROCEDIMENTOS, 
  MOCK_ORCAMENTOS,
  MOCK_AVISOS,
  RECEITA_INSUMOS_PADRAO
} from './data/mockData';
import { 
  Paciente, 
  Agendamento, 
  EstoqueInsumo, 
  TabType, 
  StatusAgendamento, 
  TransacaoFinanceira, 
  InsumoConsumido, 
  FormaPagamento, 
  StatusPagamento, 
  UsuarioEquipe, 
  UserRole, 
  AlertaRetornoPos, 
  ProcedimentoClinico, 
  SolicitacaoOrcamento,
  AvisoQuadro
} from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MobileNavigation } from './components/MobileNavigation';
import { DashboardView } from './components/DashboardView';
import { AppointmentsView } from './components/AppointmentsView';
import { PatientsView } from './components/PatientsView';
import { InventoryView } from './components/InventoryView';
import { FinancialView } from './components/FinancialView';
import { WhatsAppAutomationView } from './components/WhatsAppAutomationView';
import { PostCareReturnView } from './components/PostCareReturnView';
import { SupabaseGuideView } from './components/SupabaseGuideView';
import { UsersManagementView } from './components/UsersManagementView';
import { PatientPortalView } from './components/PatientPortalView';
import { NoticeBoardView } from './components/NoticeBoardView';
import { LoginView } from './components/LoginView';
import { UrgentAlertPopupModal } from './components/UrgentAlertPopupModal';
import { SwitchUserPasswordModal } from './components/SwitchUserPasswordModal';
import { NewAppointmentModal } from './components/NewAppointmentModal';
import { NewPatientModal } from './components/NewPatientModal';
import { NewInventoryModal } from './components/NewInventoryModal';
import { ProcedureModal } from './components/ProcedureModal';
import { NewUserModal } from './components/NewUserModal';
import { EditUserModal } from './components/EditUserModal';
import { PatientDetailsModal } from './components/PatientDetailsModal';
import { SqlAndArchitectureModal } from './components/SqlAndArchitectureModal';
import { CompleteProcedureModal } from './components/CompleteProcedureModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { TreatmentPackagesModal } from './components/TreatmentPackagesModal';
import { CheckCircle2, AlertCircle } from 'lucide-react';

// Storage Helper
const getStoredData = <T,>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(`esteticaos_${key}`);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.warn(`Erro ao carregar chave ${key} do localStorage`, e);
    return fallback;
  }
};

export default function App() {
  // Application State with localStorage Persistence
  const [pacientes, setPacientes] = useState<Paciente[]>(() => 
    getStoredData<Paciente[]>('pacientes', MOCK_PACIENTES)
  );
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>(() => 
    getStoredData<Agendamento[]>('agendamentos', MOCK_AGENDAMENTOS)
  );
  const [estoque, setEstoque] = useState<EstoqueInsumo[]>(() => 
    getStoredData<EstoqueInsumo[]>('estoque', MOCK_ESTOQUE)
  );
  const [procedimentos, setProcedimentos] = useState<ProcedimentoClinico[]>(() =>
    getStoredData<ProcedimentoClinico[]>('procedimentos', MOCK_PROCEDIMENTOS)
  );
  const [orcamentos, setOrcamentos] = useState<SolicitacaoOrcamento[]>(() =>
    getStoredData<SolicitacaoOrcamento[]>('orcamentos', MOCK_ORCAMENTOS)
  );
  const [transacoes, setTransacoes] = useState<TransacaoFinanceira[]>(() => 
    getStoredData<TransacaoFinanceira[]>('transacoes', MOCK_TRANSACOES)
  );
  const [usuarios, setUsuarios] = useState<UsuarioEquipe[]>(() => 
    getStoredData<UsuarioEquipe[]>('usuarios', MOCK_USUARIOS)
  );
  const [avisos, setAvisos] = useState<AvisoQuadro[]>(() => 
    getStoredData<AvisoQuadro[]>('avisos', MOCK_AVISOS)
  );
  const [alertasRetorno, setAlertasRetorno] = useState<AlertaRetornoPos[]>(() => 
    getStoredData<AlertaRetornoPos[]>('alertas_retorno', MOCK_ALERTAS_RETORNO)
  );
  const [currentUser, setCurrentUser] = useState<UsuarioEquipe>(() => 
    getStoredData<UsuarioEquipe>('currentUser', MOCK_USUARIOS[0])
  );
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => 
    getStoredData<boolean>('isAuthenticated', true)
  );

  // Quadro de Avisos / Pop-up Alerts State
  const [activePopupAviso, setActivePopupAviso] = useState<AvisoQuadro | null>(null);
  const [isPopupModalOpen, setIsPopupModalOpen] = useState(false);
  const [acknowledgedAvisos, setAcknowledgedAvisos] = useState<string[]>(() => 
    getStoredData<string[]>('acknowledged_avisos', [])
  );

  // Switch User with Password Modal State
  const [isSwitchUserModalOpen, setIsSwitchUserModalOpen] = useState(false);
  const [switchTargetUser, setSwitchTargetUser] = useState<UsuarioEquipe | null>(null);

  // UI Navigation & Search State
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const initialUser = getStoredData<UsuarioEquipe>('currentUser', MOCK_USUARIOS[0]);
    return initialUser.role === 'cliente' ? 'portal_paciente' : 'dashboard';
  });
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals State
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [patientForPackages, setPatientForPackages] = useState<Paciente | null>(null);
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [isNewPatientOpen, setIsNewPatientOpen] = useState(false);
  const [isNewInventoryOpen, setIsNewInventoryOpen] = useState(false);
  const [isNewProcedureOpen, setIsNewProcedureOpen] = useState(false);
  const [procedureToEdit, setProcedureToEdit] = useState<ProcedimentoClinico | null>(null);
  const [isNewUserOpen, setIsNewUserOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UsuarioEquipe | null>(null);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [selectedPatientForDetails, setSelectedPatientForDetails] = useState<Paciente | null>(null);
  const [appointmentToComplete, setAppointmentToComplete] = useState<Agendamento | null>(null);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Auto-persist state changes into localStorage
  useEffect(() => {
    try {
      localStorage.setItem('esteticaos_pacientes', JSON.stringify(pacientes));
    } catch (e) {}
  }, [pacientes]);

  useEffect(() => {
    try {
      localStorage.setItem('esteticaos_agendamentos', JSON.stringify(agendamentos));
    } catch (e) {}
  }, [agendamentos]);

  useEffect(() => {
    try {
      localStorage.setItem('esteticaos_estoque', JSON.stringify(estoque));
    } catch (e) {}
  }, [estoque]);

  useEffect(() => {
    try {
      localStorage.setItem('esteticaos_procedimentos', JSON.stringify(procedimentos));
    } catch (e) {}
  }, [procedimentos]);

  useEffect(() => {
    try {
      localStorage.setItem('esteticaos_orcamentos', JSON.stringify(orcamentos));
    } catch (e) {}
  }, [orcamentos]);

  useEffect(() => {
    try {
      localStorage.setItem('esteticaos_transacoes', JSON.stringify(transacoes));
    } catch (e) {}
  }, [transacoes]);

  useEffect(() => {
    try {
      localStorage.setItem('esteticaos_usuarios', JSON.stringify(usuarios));
    } catch (e) {}
  }, [usuarios]);

  useEffect(() => {
    try {
      localStorage.setItem('esteticaos_avisos', JSON.stringify(avisos));
    } catch (e) {}
  }, [avisos]);

  useEffect(() => {
    try {
      localStorage.setItem('esteticaos_alertas_retorno', JSON.stringify(alertasRetorno));
    } catch (e) {}
  }, [alertasRetorno]);

  useEffect(() => {
    try {
      localStorage.setItem('esteticaos_currentUser', JSON.stringify(currentUser));
    } catch (e) {}
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem('esteticaos_isAuthenticated', JSON.stringify(isAuthenticated));
    } catch (e) {}
  }, [isAuthenticated]);

  useEffect(() => {
    try {
      localStorage.setItem('esteticaos_acknowledged_avisos', JSON.stringify(acknowledgedAvisos));
    } catch (e) {}
  }, [acknowledgedAvisos]);

  // Role-based Access Control Route Guard
  useEffect(() => {
    if (currentUser.role === 'cliente') {
      if (activeTab !== 'portal_paciente' && activeTab !== 'quadro_avisos') {
        setActiveTab('portal_paciente');
      }
    } else if (currentUser.role === 'operador') {
      if (activeTab === 'usuarios' || activeTab === 'supabase_guide') {
        setActiveTab('dashboard');
      }
    }
  }, [currentUser.role, activeTab]);

  // Check for auto-triggering Urgent Alert Pop-ups on screen
  useEffect(() => {
    if (!isAuthenticated) return;

    // Find any unacknowledged aviso with exibir_popup: true targeted to current user
    const urgentPopupAviso = avisos.find(a => {
      if (!a.ativo || !a.exibir_popup) return false;
      // Target check
      if (a.destinatarios !== 'todos' && a.destinatarios !== currentUser.role) return false;
      // Check if user already acknowledged
      const userAcknowledged = acknowledgedAvisos.includes(`${currentUser.id}_${a.id}`);
      return !userAcknowledged;
    });

    if (urgentPopupAviso) {
      setActivePopupAviso(urgentPopupAviso);
      setIsPopupModalOpen(true);
    }
  }, [isAuthenticated, currentUser.id, currentUser.role, avisos, acknowledgedAvisos]);

  // Count unread / relevant notices for current user
  const unreadNoticesCount = avisos.filter(a => {
    if (!a.ativo) return false;
    if (a.destinatarios !== 'todos' && a.destinatarios !== currentUser.role && currentUser.role !== 'admin') return false;
    return !acknowledgedAvisos.includes(`${currentUser.id}_${a.id}`);
  }).length;

  // --- NOTICE BOARD HANDLERS ---
  const handleAddAviso = (novoAviso: Omit<AvisoQuadro, 'id' | 'data_criacao' | 'lido_por'>) => {
    const created: AvisoQuadro = {
      ...novoAviso,
      id: `aviso-${Date.now()}`,
      data_criacao: new Date().toISOString(),
      lido_por: [currentUser.id],
    };

    setAvisos(prev => [created, ...prev]);
    showToast('Novo comunicado publicado no Quadro de Avisos!');

    if (created.exibir_popup) {
      setActivePopupAviso(created);
      setIsPopupModalOpen(true);
    }
  };

  const handleDeleteAviso = (id: string) => {
    if (currentUser.role !== 'admin') {
      showToast('Apenas administradores podem remover avisos do mural.', 'info');
      return;
    }
    setAvisos(prev => prev.filter(a => a.id !== id));
    showToast('Aviso removido do mural.');
  };

  const handleAcknowledgeAviso = (avisoId: string) => {
    const ackKey = `${currentUser.id}_${avisoId}`;
    if (!acknowledgedAvisos.includes(ackKey)) {
      setAcknowledgedAvisos(prev => [...prev, ackKey]);
    }
  };

  const handleTriggerPopup = (aviso: AvisoQuadro) => {
    setActivePopupAviso(aviso);
    setIsPopupModalOpen(true);
  };

  // --- PROCEDURE MANAGEMENT ---
  const handleSaveProcedure = (procData: Omit<ProcedimentoClinico, 'id' | 'criado_em'> & { id?: string }) => {
    if (procData.id) {
      setProcedimentos(prev => prev.map(p => p.id === procData.id ? { 
        ...p, 
        ...procData,
        cadastrado_por_admin: p.cadastrado_por_admin ?? (currentUser.role === 'admin')
      } as ProcedimentoClinico : p));
      showToast('Procedimento atualizado com sucesso!');
    } else {
      const newProc: ProcedimentoClinico = {
        ...procData,
        id: `proc-${Date.now()}`,
        cadastrado_por_admin: currentUser.role === 'admin',
        criado_por_usuario_id: currentUser.id,
        criado_por_nome: `${currentUser.nome} (${currentUser.role === 'admin' ? 'Admin' : 'Operador'})`,
        criado_em: new Date().toISOString(),
      };
      setProcedimentos(prev => [newProc, ...prev]);
      showToast('Novo procedimento cadastrado no catálogo!');
    }
  };

  const handleDeleteProcedure = (id: string) => {
    if (currentUser.role !== 'admin') {
      showToast('Apenas administradores podem excluir procedimentos.', 'info');
      return;
    }
    setProcedimentos(prev => prev.filter(p => p.id !== id));
    showToast('Procedimento removido do catálogo com sucesso.');
  };

  // --- QUOTES (PORTAL DO PACIENTE) ---
  const handleCriarOrcamento = (novoOrcamentoData: Omit<SolicitacaoOrcamento, 'id' | 'data_solicitacao'>) => {
    const newQuote: SolicitacaoOrcamento = {
      ...novoOrcamentoData,
      id: `orc-${Date.now()}`,
      data_solicitacao: new Date().toISOString(),
    };
    setOrcamentos(prev => [newQuote, ...prev]);
    showToast('Solicitação de orçamento enviada com sucesso!');
  };

  const handleAtualizarStatusOrcamento = (id: string, status: SolicitacaoOrcamento['status'], resposta?: string) => {
    setOrcamentos(prev => prev.map(o => o.id === id ? { ...o, status, resposta_clinica: resposta || o.resposta_clinica } : o));
    showToast('Status do orçamento atualizado!');
  };

  const handleConverterOrcamentoEmAgendamento = (orc: SolicitacaoOrcamento) => {
    setActiveTab('agendamentos');
    setIsNewAppointmentOpen(true);
    showToast(`Iniciando agendamento para ${orc.paciente_nome}`);
  };

  const handleDeleteOrcamento = (id: string) => {
    const target = orcamentos.find(o => o.id === id);
    setOrcamentos(prev => prev.filter(o => o.id !== id));
    showToast(`Orçamento de "${target?.paciente_nome || 'Paciente'}" excluído com sucesso.`);
  };

  // --- APPOINTMENTS & INVENTORY HANDLERS ---
  const handleUpdateStatus = (agendamentoId: string, novoStatus: StatusAgendamento) => {
    if (novoStatus === 'concluido') {
      const ag = agendamentos.find(a => a.id === agendamentoId);
      if (ag) {
        setAppointmentToComplete(ag);
        return;
      }
    }

    setAgendamentos(prev =>
      prev.map(ag => (ag.id === agendamentoId ? { ...ag, status: novoStatus } : ag))
    );

    const statusLabels: Record<StatusAgendamento, string> = {
      confirmado: 'Agendamento confirmado com sucesso!',
      em_espera: 'Paciente colocado na Sala de Espera (Recepção).',
      em_atendimento: 'Paciente chamado para a Sala de Procedimento!',
      concluido: 'Procedimento finalizado!',
      cancelado: 'Agendamento cancelado.',
      pendente: 'Status alterado para pendente.',
    };
    showToast(statusLabels[novoStatus]);
  };

  const handleConfirmCompleteProcedure = (
    agendamentoId: string,
    insumosUsados: InsumoConsumido[],
    pagamento: {
      valor: number;
      forma: FormaPagamento;
      status: StatusPagamento;
      observacao?: string;
    }
  ) => {
    const targetAgendamento = agendamentos.find(a => a.id === agendamentoId);
    if (!targetAgendamento) return;

    const patient = targetAgendamento.paciente || pacientes.find(p => p.id === targetAgendamento.paciente_id);

    // 1. Deduct supplies from inventory
    if (insumosUsados.length > 0) {
      setEstoque(prevEstoque => {
        return prevEstoque.map(item => {
          const used = insumosUsados.find(u => u.insumo_id === item.id || u.nome_item === item.nome_item);
          if (used) {
            const newQty = Math.max(0, item.quantidade - used.quantidade);
            return { ...item, quantidade: newQty };
          }
          return item;
        });
      });
    }

    // 2. Mark appointment as completed
    setAgendamentos(prev =>
      prev.map(ag =>
        ag.id === agendamentoId
          ? {
              ...ag,
              status: 'concluido',
              insumos_consumidos: insumosUsados,
              valor_estimado: pagamento.valor,
              forma_pagamento: pagamento.forma,
              status_pagamento: pagamento.status,
            }
          : ag
      )
    );

    // 3. Register transaction in Financial module
    const newTx: TransacaoFinanceira = {
      id: `tx-${Date.now()}`,
      agendamento_id: agendamentoId,
      paciente_id: targetAgendamento.paciente_id,
      paciente_nome: patient?.nome || 'Paciente',
      procedimento: targetAgendamento.procedimento,
      valor: pagamento.valor,
      tipo: 'receita',
      forma_pagamento: pagamento.forma,
      status: pagamento.status,
      data: new Date().toISOString(),
      custo_insumos: insumosUsados.length * 65,
      observacao: pagamento.observacao,
    };

    setTransacoes(prev => [newTx, ...prev]);

    const insumoCount = insumosUsados.length;
    showToast(
      `Procedimento concluído! ${insumoCount > 0 ? `Baixa em ${insumoCount} insumo(s) e ` : ''}receita de R$ ${pagamento.valor.toFixed(2)} registrada.`
    );
  };

  const handleSaveAppointment = (novo: Partial<Agendamento>) => {
    const patientObj = pacientes.find(p => p.id === novo.paciente_id);
    const createdAgendamento: Agendamento = {
      id: `ag-${Date.now()}`,
      paciente_id: novo.paciente_id!,
      data_hora: novo.data_hora || new Date().toISOString(),
      procedimento: novo.procedimento || 'Procedimento Estético',
      status: novo.status || 'confirmado',
      criado_em: new Date().toISOString(),
      duracao_minutos: novo.duracao_minutos || 45,
      valor_estimado: novo.valor_estimado,
      observacoes: novo.observacoes,
      paciente: patientObj,
    };

    setAgendamentos(prev => [createdAgendamento, ...prev]);
    showToast(`Agendamento de ${patientObj?.nome || 'paciente'} registrado!`);
  };

  const handleSavePatient = (novo: Partial<Paciente>) => {
    const createdPatient: Paciente = {
      id: `pac-${Date.now()}`,
      nome: novo.nome!,
      telefone: novo.telefone!,
      data_nascimento: novo.data_nascimento || '',
      historico_clinico: novo.historico_clinico || '',
      criado_em: new Date().toISOString(),
      email: novo.email,
      cpf: novo.cpf,
      alergias: novo.alergias,
      medicacoes: novo.medicacoes,
      fototipo: novo.fototipo || 'Fototipo III',
      fotos_antes_depois: [],
      termo_consentimento: { assinado: false },
    };

    setPacientes(prev => [createdPatient, ...prev]);
    showToast(`Paciente ${createdPatient.nome} cadastrado(a) com sucesso!`);
  };

  const handleDeletePatient = (id: string) => {
    if (currentUser.role !== 'admin') {
      showToast('Apenas administradores têm permissão para excluir pacientes.', 'info');
      return;
    }
    const patientName = pacientes.find(p => p.id === id)?.nome || 'Paciente';
    setPacientes(prev => prev.filter(p => p.id !== id));
    setAgendamentos(prev => prev.filter(a => a.paciente_id !== id));
    if (selectedPatientForDetails?.id === id) {
      setSelectedPatientForDetails(null);
    }
    if (patientForPackages?.id === id) {
      setPatientForPackages(null);
    }
    showToast(`Cadastro de ${patientName} e registros vinculados foram excluídos com sucesso.`);
  };

  const handleUpdatePatientHistory = (
    pacienteId: string, 
    novoHistorico: string, 
    dadosExtras?: Partial<Paciente>
  ) => {
    setPacientes(prev =>
      prev.map(p => (p.id === pacienteId ? { ...p, historico_clinico: novoHistorico, ...(dadosExtras || {}) } : p))
    );
    setAgendamentos(prev =>
      prev.map(ag =>
        ag.paciente_id === pacienteId && ag.paciente
          ? { ...ag, paciente: { ...ag.paciente, historico_clinico: novoHistorico, ...(dadosExtras || {}) } }
          : ag
      )
    );
    showToast('Prontuário clínico atualizado com sucesso!');
  };

  const handleSaveInventory = (novo: Partial<EstoqueInsumo>) => {
    const createdItem: EstoqueInsumo = {
      id: `est-${Date.now()}`,
      nome_item: novo.nome_item!,
      quantidade: novo.quantidade || 0,
      unidade_medida: novo.unidade_medida || 'unidade',
      alerta_minimo: novo.alerta_minimo || 5,
      categoria: novo.categoria || 'Geral',
      lote: novo.lote,
      validade: novo.validade,
      custo_unitario: novo.custo_unitario,
      procedimento_vinculado_id: novo.procedimento_vinculado_id,
      procedimento_vinculado_nome: novo.procedimento_vinculado_nome,
      quantidade_por_procedimento: novo.quantidade_por_procedimento,
      procedimentos_vinculados: novo.procedimentos_vinculados,
      criado_em: new Date().toISOString(),
    };

    setEstoque(prev => [createdItem, ...prev]);
    showToast(`Insumo "${createdItem.nome_item}" cadastrado no estoque!`);
  };

  const handleDeleteInventoryItem = (id: string) => {
    if (currentUser.role !== 'admin') {
      showToast('Apenas administradores têm permissão para excluir insumos do estoque.', 'info');
      return;
    }
    const item = estoque.find(i => i.id === id);
    setEstoque(prev => prev.filter(i => i.id !== id));
    showToast(`Insumo "${item?.nome_item || 'Item'}" removido do estoque com sucesso.`);
  };

  const handleUpdateQuantity = (id: string, newQuantity: number) => {
    setEstoque(prev =>
      prev.map(item => (item.id === id ? { ...item, quantidade: newQuantity } : item))
    );
    showToast('Quantidade em estoque atualizada!');
  };

  const handleAddTransaction = (nova: Partial<TransacaoFinanceira>) => {
    const created: TransacaoFinanceira = {
      id: nova.id || `tx-${Date.now()}`,
      paciente_nome: nova.paciente_nome || 'Cliente / Fornecedor',
      procedimento: nova.procedimento || 'Lançamento Manual',
      valor: nova.valor || 0,
      tipo: nova.tipo || 'receita',
      forma_pagamento: nova.forma_pagamento || 'pix',
      status: nova.status || 'pago',
      data: nova.data || new Date().toISOString(),
      observacao: nova.observacao,
    };
    setTransacoes(prev => [created, ...prev]);
    showToast('Lançamento financeiro registrado com sucesso!');
  };

  const handleDeleteTransaction = (id: string) => {
    if (currentUser.role !== 'admin') {
      showToast('Apenas administradores têm permissão para excluir lançamentos financeiros.', 'info');
      return;
    }
    setTransacoes(prev => prev.filter(t => t.id !== id));
    showToast('Lançamento financeiro excluído com sucesso.');
  };

  const handleDeleteAppointment = (id: string) => {
    if (currentUser.role !== 'admin') {
      showToast('Apenas administradores têm permissão para excluir agendamentos.', 'info');
      return;
    }
    setAgendamentos(prev => prev.filter(a => a.id !== id));
    showToast('Agendamento excluído da agenda com sucesso.');
  };

  const handleUpdateTransactionStatus = (id: string, status: StatusPagamento) => {
    setTransacoes(prev =>
      prev.map(t => (t.id === id ? { ...t, status } : t))
    );
    showToast(`Status da transação alterado para: ${status}`);
  };

  const handleMarkReminderSent = (agendamentoId: string) => {
    setAgendamentos(prev =>
      prev.map(a => (a.id === agendamentoId ? { ...a, lembrete_enviado: true } : a))
    );
  };

  const handleUpdateAlertaStatus = (alertaId: string, status: 'pendente' | 'agendado' | 'contatado') => {
    setAlertasRetorno(prev =>
      prev.map(a => (a.id === alertaId ? { ...a, status } : a))
    );
    showToast(`Status do alerta atualizado para "${status}"!`);
  };

  const handleDeleteAlertaRetorno = (alertaId: string) => {
    if (currentUser.role !== 'admin') {
      showToast('Apenas administradores têm permissão para excluir alertas de retorno.', 'info');
      return;
    }
    const alerta = alertasRetorno.find(a => a.id === alertaId);
    setAlertasRetorno(prev => prev.filter(a => a.id !== alertaId));
    showToast(`Alerta de retorno de "${alerta?.paciente_nome || 'Paciente'}" excluído com sucesso.`);
  };

  const handleUpdatePacienteObj = (updatedPaciente: Paciente) => {
    setPacientes(prev =>
      prev.map(p => (p.id === updatedPaciente.id ? updatedPaciente : p))
    );
    if (selectedPatientForDetails?.id === updatedPaciente.id) {
      setSelectedPatientForDetails(updatedPaciente);
    }
    if (patientForPackages?.id === updatedPaciente.id) {
      setPatientForPackages(updatedPaciente);
    }
    showToast('Pacote de sessões do paciente atualizado com sucesso!');
  };

  // --- USER MANAGEMENT & AUTHENTICATION WITH PASSWORD PROTECTION ---
  const handleSaveUser = (novo: Omit<UsuarioEquipe, 'id' | 'created_at'>) => {
    const created: UsuarioEquipe = {
      ...novo,
      id: `usr-${Date.now()}`,
      created_at: new Date().toISOString(),
      ultimo_acesso: 'Agora',
    };
    setUsuarios(prev => [created, ...prev]);
    showToast(`Novo usuário ${created.nome} cadastrado com sucesso!`);
  };

  const handleUpdateUser = (updated: UsuarioEquipe) => {
    setUsuarios(prev =>
      prev.map(u => (u.id === updated.id ? updated : u))
    );
    if (currentUser.id === updated.id) {
      setCurrentUser(updated);
    }
    showToast(`Dados de ${updated.nome} atualizados com sucesso!`);
  };

  // User Switching requiring password
  const handleRequestSwitchUser = (targetUser?: UsuarioEquipe) => {
    setSwitchTargetUser(targetUser || null);
    setIsSwitchUserModalOpen(true);
  };

  const handleConfirmSwitchUser = (user: UsuarioEquipe) => {
    setCurrentUser(user);
    const roleLabel = user.role === 'admin' ? 'Admin' : user.role === 'operador' ? 'Operador' : 'Cliente';
    showToast(`Sessão autenticada para: ${user.nome} (${roleLabel})`, 'info');
  };

  const handleLoginSuccess = (user: UsuarioEquipe) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    const roleLabel = user.role === 'admin' ? 'Admin' : user.role === 'operador' ? 'Operador' : 'Cliente';
    showToast(`Bem-vindo(a), ${user.nome}! Acesso concedido como ${roleLabel}.`);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    showToast('Sessão encerrada com sucesso. Faça login para continuar.', 'info');
  };

  const handleToggleUserStatus = (userId: string) => {
    setUsuarios(prev =>
      prev.map(u => {
        if (u.id === userId) {
          const novoStatus = u.status === 'ativo' ? 'inativo' : 'ativo';
          return { ...u, status: novoStatus };
        }
        return u;
      })
    );
    showToast('Status do usuário atualizado.');
  };

  const handleDeleteUser = (userId: string) => {
    if (currentUser.role !== 'admin') {
      showToast('Apenas administradores têm permissão para excluir usuários.', 'info');
      return;
    }
    if (currentUser.id === userId) {
      showToast('Não é possível excluir o usuário ativo da sessão atual.', 'info');
      return;
    }
    const user = usuarios.find(u => u.id === userId);
    setUsuarios(prev => prev.filter(u => u.id !== userId));
    showToast(`Usuário "${user?.nome || 'Usuário'}" excluído do sistema.`);
  };

  // If user is not authenticated, display full secure Login screen
  if (!isAuthenticated) {
    return (
      <div className="antialiased">
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-800 text-xs sm:text-sm font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMessage.text}</span>
            </div>
          </div>
        )}
        <LoginView usuarios={usuarios} onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  // Quick stats calculations
  const lowStockCount = estoque.filter(i => i.quantidade <= i.alerta_minimo).length;
  const pendingCount = agendamentos.filter(a => a.status === 'pendente').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2.5 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-800 text-xs sm:text-sm font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewAppointment={() => setIsNewAppointmentOpen(true)}
        onOpenSqlGuide={() => setIsSqlModalOpen(true)}
        onOpenGlobalSearch={() => setIsGlobalSearchOpen(true)}
        onOpenNoticeBoard={() => setActiveTab('quadro_avisos')}
        unreadNoticesCount={unreadNoticesCount}
        lowStockCount={lowStockCount}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        currentUser={currentUser}
        usuarios={usuarios}
        onRequestSwitchUser={handleRequestSwitchUser}
        onLogout={handleLogout}
      />

      {/* Main Layout Body */}
      <div className="flex-1 flex flex-col lg:flex-row w-full relative">
        
        {/* Left Sidebar (Desktop) */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          lowStockCount={lowStockCount}
          pendingCount={pendingCount}
          currentUser={currentUser}
          unreadNoticesCount={unreadNoticesCount}
          onLogout={handleLogout}
        />

        {/* Mobile Navigation (Bottom Bar + Drawer) */}
        <MobileNavigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          lowStockCount={lowStockCount}
          pendingCount={pendingCount}
          currentUser={currentUser}
          unreadNoticesCount={unreadNoticesCount}
          onRequestSwitchUser={() => handleRequestSwitchUser()}
          onLogout={handleLogout}
        />

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl pb-24 lg:pb-8">
          
          {activeTab === 'dashboard' && currentUser.role !== 'cliente' && (
            <DashboardView
              agendamentos={agendamentos}
              estoque={estoque}
              pacientes={pacientes}
              onOpenNewAppointment={() => setIsNewAppointmentOpen(true)}
              onOpenNewPatient={() => setIsNewPatientOpen(true)}
              onOpenNewInventory={() => setIsNewInventoryOpen(true)}
              onUpdateStatus={handleUpdateStatus}
              onViewPatient={(p) => setSelectedPatientForDetails(p)}
              onGoToEstoque={() => setActiveTab('estoque')}
              onOpenCompleteModal={(ag) => setAppointmentToComplete(ag)}
              searchQuery={searchQuery}
            />
          )}

          {activeTab === 'agendamentos' && currentUser.role !== 'cliente' && (
            <AppointmentsView
              agendamentos={agendamentos}
              pacientes={pacientes}
              onOpenNewAppointment={() => setIsNewAppointmentOpen(true)}
              onUpdateStatus={handleUpdateStatus}
              onViewPatient={(p) => setSelectedPatientForDetails(p)}
              onOpenCompleteModal={(ag) => setAppointmentToComplete(ag)}
              onDeleteAppointment={handleDeleteAppointment}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'pacientes' && currentUser.role !== 'cliente' && (
            <PatientsView
              pacientes={pacientes}
              onOpenNewPatient={() => setIsNewPatientOpen(true)}
              onViewPatient={(p) => setSelectedPatientForDetails(p)}
              onOpenPackages={(p) => setPatientForPackages(p)}
              onDeletePatient={handleDeletePatient}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'estoque' && currentUser.role !== 'cliente' && (
            <InventoryView
              estoque={estoque}
              procedimentos={procedimentos}
              onOpenNewInventory={() => setIsNewInventoryOpen(true)}
              onOpenNewProcedure={() => {
                setProcedureToEdit(null);
                setIsNewProcedureOpen(true);
              }}
              onEditProcedure={(proc) => {
                setProcedureToEdit(proc);
                setIsNewProcedureOpen(true);
              }}
              onDeleteProcedure={handleDeleteProcedure}
              onDeleteInventoryItem={handleDeleteInventoryItem}
              onUpdateQuantity={handleUpdateQuantity}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'portal_paciente' && (
            <PatientPortalView
              procedimentos={procedimentos}
              orçamentos={orcamentos}
              onCriarOrcamento={handleCriarOrcamento}
              onAtualizarStatusOrcamento={handleAtualizarStatusOrcamento}
              onConverterEmAgendamento={handleConverterOrcamentoEmAgendamento}
              onDeleteOrcamento={handleDeleteOrcamento}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'quadro_avisos' && (
            <NoticeBoardView
              avisos={avisos}
              currentUser={currentUser}
              onAddAviso={handleAddAviso}
              onDeleteAviso={handleDeleteAviso}
              onTriggerPopup={handleTriggerPopup}
            />
          )}

          {activeTab === 'financeiro' && currentUser.role !== 'cliente' && (
            <FinancialView
              transacoes={transacoes}
              onAddTransaction={handleAddTransaction}
              onUpdateTransactionStatus={handleUpdateTransactionStatus}
              onDeleteTransaction={handleDeleteTransaction}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'whatsapp' && currentUser.role !== 'cliente' && (
            <WhatsAppAutomationView
              agendamentos={agendamentos}
              pacientes={pacientes}
              onMarkReminderSent={handleMarkReminderSent}
            />
          )}

          {activeTab === 'retorno_pos' && currentUser.role !== 'cliente' && (
            <PostCareReturnView
              alertas={alertasRetorno}
              onUpdateAlertaStatus={handleUpdateAlertaStatus}
              onDeleteAlerta={handleDeleteAlertaRetorno}
              currentUser={currentUser}
              onViewPatientByName={(nome) => {
                const found = pacientes.find(p => p.nome.toLowerCase() === nome.toLowerCase());
                if (found) {
                  setSelectedPatientForDetails(found);
                } else {
                  setActiveTab('pacientes');
                }
              }}
            />
          )}

          {activeTab === 'usuarios' && currentUser.role === 'admin' && (
            <UsersManagementView
              usuarios={usuarios}
              currentUser={currentUser}
              onSwitchUser={(u) => handleRequestSwitchUser(u)}
              onOpenNewUser={() => setIsNewUserOpen(true)}
              onOpenEditUser={(user) => setUserToEdit(user)}
              onDeleteUser={handleDeleteUser}
              onToggleUserStatus={handleToggleUserStatus}
              onOpenSqlGuide={() => setIsSqlModalOpen(true)}
            />
          )}

          {activeTab === 'supabase_guide' && currentUser.role === 'admin' && (
            <SupabaseGuideView />
          )}
        </main>

      </div>

      {/* POP-UP ALERTS MODAL */}
      <UrgentAlertPopupModal
        isOpen={isPopupModalOpen}
        onClose={() => setIsPopupModalOpen(false)}
        aviso={activePopupAviso}
        onAcknowledge={handleAcknowledgeAviso}
        onOpenNoticeBoard={() => setActiveTab('quadro_avisos')}
        currentUser={currentUser}
      />

      {/* SWITCH USER PASSWORD MODAL */}
      <SwitchUserPasswordModal
        isOpen={isSwitchUserModalOpen}
        onClose={() => setIsSwitchUserModalOpen(false)}
        usuarios={usuarios}
        targetUser={switchTargetUser}
        onConfirmSwitch={handleConfirmSwitchUser}
      />

      {/* MODALS */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        pacientes={pacientes}
        agendamentos={agendamentos}
        estoque={estoque}
        setActiveTab={setActiveTab}
        onViewPatient={(p) => setSelectedPatientForDetails(p)}
        onOpenNewAppointment={() => setIsNewAppointmentOpen(true)}
        onOpenNewPatient={() => setIsNewPatientOpen(true)}
        onOpenNewInventory={() => setIsNewInventoryOpen(true)}
      />

      {patientForPackages && (
        <TreatmentPackagesModal
          isOpen={!!patientForPackages}
          onClose={() => setPatientForPackages(null)}
          paciente={patientForPackages}
          onUpdatePaciente={handleUpdatePacienteObj}
          currentUser={currentUser}
          procedimentos={procedimentos}
        />
      )}

      <NewAppointmentModal
        isOpen={isNewAppointmentOpen}
        onClose={() => setIsNewAppointmentOpen(false)}
        pacientes={pacientes}
        procedimentos={procedimentos}
        onSaveAppointment={handleSaveAppointment}
        onOpenNewPatient={() => setIsNewPatientOpen(true)}
      />

      <NewPatientModal
        isOpen={isNewPatientOpen}
        onClose={() => setIsNewPatientOpen(false)}
        onSavePatient={handleSavePatient}
      />

      <NewInventoryModal
        isOpen={isNewInventoryOpen}
        onClose={() => setIsNewInventoryOpen(false)}
        onSaveInventory={handleSaveInventory}
      />

      <ProcedureModal
        isOpen={isNewProcedureOpen}
        onClose={() => {
          setIsNewProcedureOpen(false);
          setProcedureToEdit(null);
        }}
        onSave={handleSaveProcedure}
        procedimentoToEdit={procedureToEdit}
        estoqueDisponivel={estoque}
      />

      <NewUserModal
        isOpen={isNewUserOpen}
        onClose={() => setIsNewUserOpen(false)}
        onSaveUser={handleSaveUser}
      />

      <EditUserModal
        isOpen={!!userToEdit}
        usuario={userToEdit}
        onClose={() => setUserToEdit(null)}
        onSaveUser={handleUpdateUser}
      />

      <PatientDetailsModal
        paciente={selectedPatientForDetails}
        isOpen={!!selectedPatientForDetails}
        onClose={() => setSelectedPatientForDetails(null)}
        agendamentos={agendamentos}
        onUpdatePatientHistory={handleUpdatePatientHistory}
        onDeletePatient={handleDeletePatient}
        currentUser={currentUser}
      />

      <CompleteProcedureModal
        isOpen={!!appointmentToComplete}
        onClose={() => setAppointmentToComplete(null)}
        agendamento={appointmentToComplete}
        estoque={estoque}
        onConfirmComplete={handleConfirmCompleteProcedure}
      />

      <SqlAndArchitectureModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
      />

    </div>
  );
}
