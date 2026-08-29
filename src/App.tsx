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
  MOCK_CLINICA_CONFIG,
  MOCK_DESPESAS_RECORRENTES,
  MOCK_BENS_PATRIMONIAIS,
  MOCK_FORNECEDORES
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
  AvisoQuadro,
  ClinicaConfig,
  DespesaRecorrente,
  BemPatrimonial,
  BemAtivo,
  ConfiguracaoCampos,
  PermissoesCustomizadas,
  Fornecedor,
  AnamneseCompleta
} from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MobileNavigation } from './components/MobileNavigation';
import { DashboardView } from './components/DashboardView';
import { AppointmentsView } from './components/AppointmentsView';
import { PatientsView } from './components/PatientsView';
import { SuppliersView } from './components/SuppliersView';
import { InventoryView } from './components/InventoryView';
import { FinancialView } from './components/FinancialView';
import { WhatsAppAutomationView } from './components/WhatsAppAutomationView';
import { PostCareReturnView } from './components/PostCareReturnView';
import { SupabaseGuideView } from './components/SupabaseGuideView';
import { UsersManagementView } from './components/UsersManagementView';
import { PatientPortalView } from './components/PatientPortalView';
import { NoticeBoardView } from './components/NoticeBoardView';
import { AssetsView } from './components/AssetsView';
import { PermissionsManagementView } from './components/PermissionsManagementView';
import { UserProfileView } from './components/UserProfileView';
import { LoginView } from './components/LoginView';
import { GeminiChatbotView } from './components/GeminiChatbotView';
import { MapsGroundingView } from './components/MapsGroundingView';
import { ImageStudioAIView } from './components/ImageStudioAIView';
import { UrgentAlertPopupModal } from './components/UrgentAlertPopupModal';
import { SwitchUserPasswordModal } from './components/SwitchUserPasswordModal';
import { NewAppointmentModal } from './components/NewAppointmentModal';
import { NewPatientModal } from './components/NewPatientModal';
import { AnamneseCompletaModal } from './components/AnamneseCompletaModal';
import { NewSupplierModal } from './components/NewSupplierModal';
import { NewInventoryModal } from './components/NewInventoryModal';
import { ProcedureModal } from './components/ProcedureModal';
import { NewUserModal } from './components/NewUserModal';
import { EditUserModal } from './components/EditUserModal';
import { PatientDetailsModal } from './components/PatientDetailsModal';
import { SqlAndArchitectureModal } from './components/SqlAndArchitectureModal';
import { CompleteProcedureModal } from './components/CompleteProcedureModal';
import { CheckInPaymentAndReturnModal } from './components/CheckInPaymentAndReturnModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { DatabaseMasterView } from './components/DatabaseMasterView';
import { TreatmentPackagesModal } from './components/TreatmentPackagesModal';
import { ClinicSettingsModal } from './components/ClinicSettingsModal';
import { UserProfileAvatarModal } from './components/UserProfileAvatarModal';
import { NewAssetModal } from './components/NewAssetModal';
import { ConflictResolutionModal } from './components/ConflictResolutionModal';
import { MasterEditProvider } from './contexts/MasterEditModeContext';
import { MasterEditModal } from './components/MasterEditModal';
import { useConnectionStatus } from './contexts/ConnectionStatusContext';
import { CheckCircle2, AlertCircle, Cloud } from 'lucide-react';
import { 
  seedInitialFirestoreData, 
  subscribeToCollection, 
  saveDocument, 
  removeDocument, 
  excluirUsuario,
  isUserAdminTotal,
  isUserAdminLocalOrTotal,
  executeAtomicCheckout,
  softDeleteTransacao,
  onFirebaseAuthStateChange,
  logoutFirebase,
  ensureSuperAdminInFirestore,
  SUPER_ADMIN_EMAILS,
  COLLECTIONS 
} from './services/firebaseService';

// Storage keys for persistent session and navigation state
const STORAGE_AUTH_KEY = 'aura_auth_session';
const STORAGE_USER_KEY = 'aura_current_user';
const STORAGE_TAB_KEY = 'aura_active_tab';

// Helper functions for initial load
function getInitialTab(userRole?: string): TabType {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const tabFromUrl = params.get('tab') as TabType;
    if (tabFromUrl) return tabFromUrl;

    const tabFromStorage = localStorage.getItem(STORAGE_TAB_KEY) as TabType;
    if (tabFromStorage) return tabFromStorage;
  }
  return userRole === 'cliente' ? 'portal_paciente' : 'dashboard';
}

function getInitialUser(): UsuarioEquipe {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_USER_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) {
          if (isUserAdminTotal(parsed)) {
            return {
              ...parsed,
              role: 'admin_total',
              permissoes: {
                ver_financeiro_completo: true,
                emitir_recibo: true,
                editar_prontuario_clinico: true,
                gerenciar_estoque_custos: true,
                configuracoes_sistema: true,
                visualizar_bens_ativos: true,
              },
              permissoesCustomizadas: {
                financeiro: { verEntradas: true, verSaidas: true, verRecorrentes: true, excluir: true, verRelatorios: true },
                clientes: { criar: true, editar: true, excluir: true, verHistorico: true, preencherAnamnese: true },
                agenda: { verTodos: true, verPropria: true, criar: true, cancelar: true, finalizar: true },
                procedimentos: { verCustos: true, verMargem: true, criar: true, excluir: true, ajustarEstoque: true },
                bens: { visualizar: true, cadastrar: true, editar: true, gerenciar: true, excluir: true, manutencao: true },
                estoque: { ajustar: true, excluir: true },
                orcamentos: { verTodos: true, responder: true, verEmails: true }
              }
            };
          }
          return parsed;
        }
      } catch (e) {
        console.warn('Erro ao carregar usuário salvo:', e);
      }
    }
  }
  return MOCK_USUARIOS[0];
}

function getInitialAuthState(): boolean {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(STORAGE_AUTH_KEY) === 'true';
  }
  return false;
}

function getInitialPatientIdFromUrl(): string | null {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    return params.get('pacienteId');
  }
  return null;
}

export default function App() {
  // Global Offline Sync & Connection Status Hook
  const {
    isOnline,
    isSyncing,
    queueOfflineMutation,
    syncSingleUser,
    selectedConflict,
    setSelectedConflict
  } = useConnectionStatus();

  // Application State synchronized in Real-Time via Cloud Firestore
  const [clinicaConfig, setClinicaConfig] = useState<ClinicaConfig>(MOCK_CLINICA_CONFIG);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [estoque, setEstoque] = useState<EstoqueInsumo[]>([]);
  const [bensPatrimoniais, setBensPatrimoniais] = useState<BemPatrimonial[]>([]);
  const [procedimentos, setProcedimentos] = useState<ProcedimentoClinico[]>([]);
  const [orcamentos, setOrcamentos] = useState<SolicitacaoOrcamento[]>([]);
  const [transacoes, setTransacoes] = useState<TransacaoFinanceira[]>([]);
  const [despesasRecorrentes, setDespesasRecorrentes] = useState<DespesaRecorrente[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioEquipe[]>([MOCK_USUARIOS[0], MOCK_USUARIOS[1]]);
  const [avisos, setAvisos] = useState<AvisoQuadro[]>([]);
  const [alertasRetorno, setAlertasRetorno] = useState<AlertaRetornoPos[]>([]);
  const [configuracaoCampos, setConfiguracaoCampos] = useState<ConfiguracaoCampos>({
    clinicaId: 'config_matriz',
    camposOcultos: [],
    camposObrigatorios: [],
  });
  
  // Persistent Auth & Navigation State
  const [currentUser, setCurrentUser] = useState<UsuarioEquipe>(getInitialUser);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(getInitialAuthState);
  const [activeTab, setActiveTabState] = useState<TabType>(() => getInitialTab(getInitialUser().role));

  // Quadro de Avisos / Pop-up Alerts State
  const [activePopupAviso, setActivePopupAviso] = useState<AvisoQuadro | null>(null);
  const [isPopupModalOpen, setIsPopupModalOpen] = useState(false);
  const [acknowledgedAvisos, setAcknowledgedAvisos] = useState<string[]>([]);

  // Switch User with Password Modal State
  const [isSwitchUserModalOpen, setIsSwitchUserModalOpen] = useState(false);
  const [switchTargetUser, setSwitchTargetUser] = useState<UsuarioEquipe | null>(null);

  // Centralized navigation handler with browser history stack (pushState) and storage sync
  const navigateToTab = (newTab: TabType, pushToHistory = true, extraParams?: Record<string, string | null>) => {
    setActiveTabState(newTab);
    try {
      localStorage.setItem(STORAGE_TAB_KEY, newTab);
    } catch (e) {
      // quota or private mode fallback
    }

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', newTab);
      if (extraParams) {
        Object.entries(extraParams).forEach(([k, v]) => {
          if (v === null || v === undefined) {
            url.searchParams.delete(k);
          } else {
            url.searchParams.set(k, v);
          }
        });
      }
      if (pushToHistory) {
        window.history.pushState({ tab: newTab, ...extraParams }, '', url.toString());
      } else {
        window.history.replaceState({ tab: newTab, ...extraParams }, '', url.toString());
      }
    }
  };

  const setActiveTab = (tab: TabType) => {
    navigateToTab(tab, true);
  };
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals State
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isClinicSettingsOpen, setIsClinicSettingsOpen] = useState(false);
  const [isUserAvatarModalOpen, setIsUserAvatarModalOpen] = useState(false);
  const [patientForPackages, setPatientForPackages] = useState<Paciente | null>(null);
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [isNewPatientOpen, setIsNewPatientOpen] = useState(false);
  const [isNewSupplierOpen, setIsNewSupplierOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<Fornecedor | null>(null);
  const [isNewInventoryOpen, setIsNewInventoryOpen] = useState(false);
  const [isNewProcedureOpen, setIsNewProcedureOpen] = useState(false);
  const [procedureToEdit, setProcedureToEdit] = useState<ProcedimentoClinico | null>(null);
  const [isNewUserOpen, setIsNewUserOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UsuarioEquipe | null>(null);
  const [isNewAssetOpen, setIsNewAssetOpen] = useState(false);
  const [assetToEdit, setAssetToEdit] = useState<BemAtivo | null>(null);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [isAnamneseModalOpen, setIsAnamneseModalOpen] = useState(false);
  const [selectedPatientForAnamnese, setSelectedPatientForAnamnese] = useState<Paciente | null>(null);
  const [selectedPatientForDetails, setSelectedPatientForDetails] = useState<Paciente | null>(null);
  const [appointmentToComplete, setAppointmentToComplete] = useState<Agendamento | null>(null);
  const [appointmentToCheckIn, setAppointmentToCheckIn] = useState<Agendamento | null>(null);
  const [appointmentInitialData, setAppointmentInitialData] = useState<Partial<Agendamento> | null>(null);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Role-based Access Control Route Guard
  useEffect(() => {
    if (currentUser.role === 'cliente') {
      if (activeTab !== 'portal_paciente' && activeTab !== 'quadro_avisos') {
        setActiveTab('portal_paciente');
      }
    } else if (currentUser.role === 'recepcao' || currentUser.role === 'operador') {
      if (activeTab === 'usuarios' || activeTab === 'supabase_guide') {
        setActiveTab('dashboard');
      }
    }
  }, [currentUser.role, activeTab]);

  // Firebase Cloud Firestore Real-Time Synchronizations (onSnapshot)
  useEffect(() => {
    // Auto-heal super admin master credentials in Firestore
    ensureSuperAdminInFirestore();

    // Real-Time onSnapshot Collection Subscriptions
    const unsubClinica = subscribeToCollection<ClinicaConfig>(
      COLLECTIONS.CLINICA_CONFIG,
      (data) => {
        if (data && data.length > 0) {
          setClinicaConfig(data[0]);
        }
      },
      [MOCK_CLINICA_CONFIG]
    );

    const unsubPacientes = subscribeToCollection<Paciente>(
      COLLECTIONS.PACIENTES, 
      (data) => setPacientes(data), 
      []
    );

    const unsubFornecedores = subscribeToCollection<Fornecedor>(
      COLLECTIONS.FORNECEDORES, 
      (data) => setFornecedores(data), 
      []
    );

    const unsubAgendamentos = subscribeToCollection<Agendamento>(
      COLLECTIONS.AGENDAMENTOS, 
      (data) => setAgendamentos(data), 
      []
    );

    const unsubEstoque = subscribeToCollection<EstoqueInsumo>(
      COLLECTIONS.ESTOQUE, 
      (data) => setEstoque(data), 
      []
    );

    const unsubBens = subscribeToCollection<BemPatrimonial>(
      COLLECTIONS.BENS, 
      (data) => setBensPatrimoniais(data), 
      []
    );

    const unsubProcedimentos = subscribeToCollection<ProcedimentoClinico>(
      COLLECTIONS.PROCEDIMENTOS, 
      (data) => setProcedimentos(data), 
      []
    );

    const unsubOrcamentos = subscribeToCollection<SolicitacaoOrcamento>(
      COLLECTIONS.ORCAMENTOS, 
      (data) => setOrcamentos(data), 
      []
    );

    const unsubTransacoes = subscribeToCollection<TransacaoFinanceira>(
      COLLECTIONS.TRANSACOES, 
      (data) => setTransacoes(data), 
      []
    );

    const unsubDespesas = subscribeToCollection<DespesaRecorrente>(
      COLLECTIONS.DESPESAS_RECORRENTES, 
      (data) => setDespesasRecorrentes(data), 
      []
    );

    const unsubUsuarios = subscribeToCollection<UsuarioEquipe>(
      COLLECTIONS.USUARIOS, 
      (data) => {
        if (!data || data.length === 0) {
          setUsuarios([MOCK_USUARIOS[0], MOCK_USUARIOS[1]]);
          return;
        }

        // Sanitize and self-heal Super Admin permissions across database versions
        const sanitized = data.map(u => {
          const isSuper =
            isUserAdminTotal(u) ||
            u.id === 'user-super-admin' ||
            u.email?.toLowerCase() === 'fldslima94@gmail.com' ||
            u.email?.toLowerCase() === 'fabio@teste.com' ||
            u.nome?.toLowerCase().includes('fabio lima');

          if (isSuper && u.role !== 'admin_total') {
            const fixedSuperAdmin: UsuarioEquipe = {
              ...u,
              role: 'admin_total',
              cargo: 'Super Admin (Master)',
              profissao: u.profissao || 'Proprietário & Administrador Geral',
              permissoes: {
                ver_financeiro_completo: true,
                emitir_recibo: true,
                editar_prontuario_clinico: true,
                gerenciar_estoque_custos: true,
                configuracoes_sistema: true,
                visualizar_bens_ativos: true,
              },
              permissoesCustomizadas: {
                financeiro: { verEntradas: true, verSaidas: true, verRecorrentes: true, excluir: true, verRelatorios: true },
                clientes: { criar: true, editar: true, excluir: true, verHistorico: true, preencherAnamnese: true },
                agenda: { verTodos: true, verPropria: true, criar: true, cancelar: true, finalizar: true },
                procedimentos: { verCustos: true, verMargem: true, criar: true, excluir: true, ajustarEstoque: true },
                bens: { visualizar: true, cadastrar: true, editar: true, gerenciar: true, excluir: true, manutencao: true },
                estoque: { ajustar: true, excluir: true },
                orcamentos: { verTodos: true, responder: true, verEmails: true }
              }
            };
            saveDocument(COLLECTIONS.USUARIOS, fixedSuperAdmin);
            return fixedSuperAdmin;
          }
          return u;
        });

        // Ensure user-super-admin always exists in list
        const hasSuper = sanitized.some(u => isUserAdminTotal(u) || u.id === 'user-super-admin');
        const finalList = hasSuper ? sanitized : [MOCK_USUARIOS[0], ...sanitized];
        setUsuarios(finalList);

        // Keep active currentUser in sync with real-time updates from database
        setCurrentUser(prevUser => {
          const activeInDb = finalList.find(u => 
            u.id === prevUser.id || 
            (Boolean(u.email) && Boolean(prevUser.email) && u.email.toLowerCase() === prevUser.email.toLowerCase()) ||
            (isUserAdminTotal(prevUser) && isUserAdminTotal(u))
          );
          if (activeInDb) {
            try {
              localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(activeInDb));
            } catch (e) {
              // ignore
            }
            return activeInDb;
          }
          return prevUser;
        });
      }, 
      [MOCK_USUARIOS[0], MOCK_USUARIOS[1]]
    );

    const unsubAvisos = subscribeToCollection<AvisoQuadro>(
      COLLECTIONS.AVISOS, 
      (data) => setAvisos(data), 
      []
    );

    const unsubAlertas = subscribeToCollection<AlertaRetornoPos>(
      COLLECTIONS.ALERTAS_RETORNO, 
      (data) => setAlertasRetorno(data), 
      []
    );

    const unsubConfigCampos = subscribeToCollection<ConfiguracaoCampos>(
      COLLECTIONS.CONFIGURACOES_CAMPOS,
      (data) => {
        if (data && data.length > 0) {
          setConfiguracaoCampos(data[0]);
        }
      },
      [{ clinicaId: 'config_matriz', camposOcultos: [], camposObrigatorios: [] }]
    );

    return () => {
      unsubClinica();
      unsubPacientes();
      unsubFornecedores();
      unsubAgendamentos();
      unsubEstoque();
      unsubBens();
      unsubProcedimentos();
      unsubOrcamentos();
      unsubTransacoes();
      unsubDespesas();
      unsubUsuarios();
      unsubAvisos();
      unsubAlertas();
      unsubConfigCampos();
    };
  }, []);

  // Listen to browser popstate (Back/Forward history buttons) and sync active tab & deep links
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = (event.state?.tab || params.get('tab') || 'dashboard') as TabType;
      const pacienteIdParam = event.state?.pacienteId || params.get('pacienteId');

      setActiveTabState(tabParam);
      try {
        localStorage.setItem(STORAGE_TAB_KEY, tabParam);
      } catch (e) {
        // ignore
      }

      if (pacienteIdParam) {
        const found = pacientes.find(p => p.id === pacienteIdParam);
        if (found) {
          setSelectedPatientForDetails(found);
        }
      } else {
        setSelectedPatientForDetails(null);
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Ensure the current URL query params reflect the active tab on page load
    const currentParams = new URLSearchParams(window.location.search);
    if (!currentParams.get('tab') && activeTab) {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', activeTab);
      window.history.replaceState({ tab: activeTab }, '', url.toString());
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab, pacientes]);

  // Deep linking: auto-open patient details if pacienteId is in the URL and patients are loaded
  useEffect(() => {
    const initialPatientId = getInitialPatientIdFromUrl();
    if (initialPatientId && pacientes.length > 0 && !selectedPatientForDetails) {
      const found = pacientes.find(p => p.id === initialPatientId);
      if (found) {
        setSelectedPatientForDetails(found);
      }
    }
  }, [pacientes]);

  // Firebase Auth real-time session listener (keeps user logged in across page reloads)
  useEffect(() => {
    const unsubscribe = onFirebaseAuthStateChange((fbUser) => {
      if (fbUser) {
        setIsAuthenticated(true);
        try {
          localStorage.setItem(STORAGE_AUTH_KEY, 'true');
        } catch (e) {
          // ignore
        }

        const cleanEmail = (fbUser.email || '').toLowerCase().trim();
        const isSuper = SUPER_ADMIN_EMAILS.includes(cleanEmail) || cleanEmail.includes('fabio');

        if (isSuper) {
          setCurrentUser(prev => {
            const updated: UsuarioEquipe = {
              ...prev,
              email: cleanEmail,
              nome: fbUser.displayName || prev.nome || 'Fabio Lima',
              nomeCompleto: fbUser.displayName || prev.nomeCompleto || 'Fabio Lima',
              role: 'admin_total',
              cargo: 'Super Admin (Master)',
              profissao: prev.profissao || 'Proprietário & Administrador Geral',
              permissoes: {
                ver_financeiro_completo: true,
                emitir_recibo: true,
                editar_prontuario_clinico: true,
                gerenciar_estoque_custos: true,
                configuracoes_sistema: true,
                visualizar_bens_ativos: true,
              },
              permissoesCustomizadas: {
                financeiro: { verEntradas: true, verSaidas: true, verRecorrentes: true, excluir: true, verRelatorios: true },
                clientes: { criar: true, editar: true, excluir: true, verHistorico: true, preencherAnamnese: true },
                agenda: { verTodos: true, verPropria: true, criar: true, cancelar: true, finalizar: true },
                procedimentos: { verCustos: true, verMargem: true, criar: true, excluir: true, ajustarEstoque: true },
                bens: { visualizar: true, cadastrar: true, editar: true, gerenciar: true, excluir: true, manutencao: true },
                estoque: { ajustar: true, excluir: true },
                orcamentos: { verTodos: true, responder: true, verEmails: true }
              }
            };
            try {
              localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(updated));
            } catch (e) {}
            return updated;
          });
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Avisos exibidos exclusivamente na aba correspondente (Mural de Avisos), sem pop-up intrusivo ao abrir o app
  // Conforme solicitação do usuário: "Avisos não devem aparecer ao abrir o app apenas na aba correspondente"

  // Unread Notices count
  const unreadNoticesCount = avisos.filter(a => {
    if (!a.ativo) return false;
    if (a.destinatarios !== 'todos' && a.destinatarios !== currentUser.role) return false;
    return !acknowledgedAvisos.includes(`${currentUser.id}_${a.id}`);
  }).length;

  const handleAcknowledgeAviso = (avisoId: string) => {
    const key = `${currentUser.id}_${avisoId}`;
    if (!acknowledgedAvisos.includes(key)) {
      setAcknowledgedAvisos(prev => [...prev, key]);
    }
  };

  const handleTriggerPopup = (aviso: AvisoQuadro) => {
    setActivePopupAviso(aviso);
    setIsPopupModalOpen(true);
  };

  const handleUpdateStatus = (agendamentoId: string, novoStatus: StatusAgendamento) => {
    const ag = agendamentos.find(a => a.id === agendamentoId);
    if (ag) {
      const updated = { ...ag, status: novoStatus };
      setAgendamentos(prev => prev.map(a => (a.id === agendamentoId ? updated : a)));
      saveDocument(COLLECTIONS.AGENDAMENTOS, updated);
      showToast(`Status atualizado para: ${novoStatus.replace('_', ' ').toUpperCase()}`);
    }
  };

  // Procedure completion with Atomic Inventory debit and Financial creation
  const handleSaveProcedureCompletion = async (
    targetAgendamentoOrId: Agendamento | string,
    insumosUsados: InsumoConsumido[],
    pagamento: { valor: number; forma: FormaPagamento; status: StatusPagamento; observacao?: string },
    dataRetornoSugerida?: string,
    termoAssinado?: boolean
  ) => {
    const targetAgendamento = (typeof targetAgendamentoOrId === 'object' && targetAgendamentoOrId ? targetAgendamentoOrId : null)
      || (typeof targetAgendamentoOrId === 'string' ? agendamentos.find(a => a.id === targetAgendamentoOrId) : null)
      || appointmentToComplete;

    if (!targetAgendamento) return;

    const patient = pacientes.find(p => p.id === targetAgendamento.paciente_id) || targetAgendamento.paciente;

    // Se já foi pago e liquidado no Check-In, NÃO gera nova receita duplicada no caixa
    const jaLancadoNoCheckIn = Boolean(targetAgendamento.pagamento_registrado_no_caixa === true);
    const valorALancar = jaLancadoNoCheckIn ? 0 : (Number(pagamento.valor) || Number(targetAgendamento.valor_estimado) || 0);

    // Normalize supplies array with both quantidade and quantidade_utilizada
    const normalizedSupplies: InsumoConsumido[] = insumosUsados.map(i => ({
      ...i,
      quantidade: i.quantidade || i.quantidade_utilizada || 1,
      quantidade_utilizada: i.quantidade_utilizada || i.quantidade || 1,
    }));

    const updatedCompletedAgendamento: Agendamento = {
      ...targetAgendamento,
      status: 'concluido' as StatusAgendamento,
      valor_estimado: pagamento.valor || targetAgendamento.valor_estimado,
      forma_pagamento: pagamento.forma,
      status_pagamento: pagamento.status,
      insumos_utilizados: normalizedSupplies,
      insumos_consumidos: normalizedSupplies,
      concluido_em: new Date().toISOString(),
      observacoes: pagamento.observacao 
        ? `${targetAgendamento.observacoes ? targetAgendamento.observacoes + ' | ' : ''}Checkout: ${pagamento.observacao}`
        : targetAgendamento.observacoes,
    };

    // 1. Atualização otimista no estado
    setAgendamentos(prev =>
      prev.map(a => (a.id === targetAgendamento.id ? updatedCompletedAgendamento : a))
    );

    // 2. Débito otimista de estoque
    setEstoque(prev =>
      prev.map(item => {
        const consumed = normalizedSupplies.find(c => c.insumo_id === item.id);
        if (consumed) {
          const qtyToDeduct = consumed.quantidade_utilizada || consumed.quantidade || 0;
          return {
            ...item,
            quantidade: Math.max(0, item.quantidade - qtyToDeduct),
          };
        }
        return item;
      })
    );

    // 3. Se valorALancar > 0, atualiza transações localmente
    if (valorALancar > 0) {
      const newTx: TransacaoFinanceira = {
        id: `tx-${Date.now()}`,
        agendamento_id: targetAgendamento.id,
        paciente_id: targetAgendamento.paciente_id,
        paciente_nome: patient?.nome || 'Cliente',
        procedimento: targetAgendamento.procedimento,
        valor: valorALancar,
        tipo: 'entrada',
        categoria: 'atendimento',
        forma_pagamento: pagamento.forma,
        status: pagamento.status,
        data: new Date().toISOString(),
        profissional_nome: targetAgendamento.profissional_nome || currentUser.nome,
        observacao: pagamento.observacao || 'Recebido na finalização do procedimento',
        excluido: false,
      };
      setTransacoes(prev => [newTx, ...prev]);
    }

    // 4. Executa checkout atômico no Firestore
    try {
      await executeAtomicCheckout({
        agendamentoId: targetAgendamento.id,
        pacienteId: targetAgendamento.paciente_id,
        pacienteNome: patient?.nome || 'Cliente',
        procedimentoNome: targetAgendamento.procedimento,
        profissionalId: targetAgendamento.profissional_id,
        profissionalNome: targetAgendamento.profissional_nome || currentUser.nome,
        valorPago: valorALancar,
        formaPagamento: pagamento.forma,
        statusPagamento: pagamento.status,
        insumosConsumidos: normalizedSupplies,
        observacoes: pagamento.observacao,
        transacao: valorALancar > 0 ? {
          agendamento_id: targetAgendamento.id,
          paciente_id: targetAgendamento.paciente_id,
          paciente_nome: patient?.nome || 'Cliente',
          procedimento: targetAgendamento.procedimento,
          valor: valorALancar,
          tipo: 'entrada',
          categoria: 'atendimento',
          forma_pagamento: pagamento.forma,
          status: pagamento.status,
          profissional_nome: targetAgendamento.profissional_nome || currentUser.nome,
          observacao: pagamento.observacao || 'Recebido na finalização do procedimento',
        } : undefined
      });
    } catch (err) {
      console.warn('[executeAtomicCheckout error in handleSaveProcedureCompletion]', err);
    }

    // Se Retorno for sugerido, agenda diretamente
    if (dataRetornoSugerida) {
      const returnAgendamento: Agendamento = {
        id: `ag-retorno-${Date.now()}`,
        paciente_id: targetAgendamento.paciente_id,
        data_hora: dataRetornoSugerida,
        procedimento: `Retorno & Avaliação: ${targetAgendamento.procedimento}`,
        status: 'confirmado',
        criado_em: new Date().toISOString(),
        duracao_minutos: 30,
        valor_estimado: 0,
        profissional_nome: targetAgendamento.profissional_nome,
        observacoes: 'Retorno clínico pós-procedimento agendado automaticamente no checkout.',
        paciente: patient,
      };

      setAgendamentos(prev => [returnAgendamento, ...prev]);
      saveDocument(COLLECTIONS.AGENDAMENTOS, returnAgendamento);
      showToast(`Procedimento concluído e Retorno de ${patient?.nome} agendado com sucesso!`);
    } else {
      showToast(`Procedimento concluído com baixa em ${normalizedSupplies.length} insumo(s) e caixa atualizado.`);
    }

    setAppointmentToComplete(null);
  };

  const handleConfirmCheckIn = async (data: {
    agendamentoId: string;
    pagamento: {
      valor: number;
      forma: FormaPagamento;
      status: StatusPagamento;
      observacao?: string;
    };
    agendarRetorno: boolean;
    dadosRetorno?: {
      data_hora: string;
      procedimento: string;
      duracao_minutos: number;
      profissional_id?: string;
      profissional_nome?: string;
      observacoes?: string;
    };
  }) => {
    const ag = agendamentos.find(a => a.id === data.agendamentoId);
    if (!ag) return;
    const patientObj = ag.paciente || pacientes.find(p => p.id === ag.paciente_id);

    const isPagoAgora = data.pagamento.status === 'pago' && Number(data.pagamento.valor) > 0;

    // 1. Atualizar agendamento para 'em_espera' na recepção com status de pagamento
    const updatedAg: Agendamento = {
      ...ag,
      status: 'em_espera',
      forma_pagamento: data.pagamento.forma,
      status_pagamento: data.pagamento.status,
      valor_estimado: data.pagamento.valor || ag.valor_estimado,
      pagamento_registrado_no_caixa: isPagoAgora, // Flag de controle anti-duplicação
    };
    setAgendamentos(prev => prev.map(a => a.id === ag.id ? updatedAg : a));
    await saveDocument(COLLECTIONS.AGENDAMENTOS, updatedAg);

    // 2. Registrar transação financeira caso valor positivo (Lançamento único)
    if (isPagoAgora) {
      const novaTx: TransacaoFinanceira = {
        id: `tx-checkin-${Date.now()}`,
        agendamento_id: ag.id,
        paciente_id: ag.paciente_id,
        paciente_nome: patientObj?.nome || 'Cliente',
        procedimento: ag.procedimento,
        valor: data.pagamento.valor,
        tipo: 'entrada',
        categoria: 'atendimento',
        forma_pagamento: data.pagamento.forma,
        status: 'pago',
        data: new Date().toISOString(),
        profissional_nome: ag.profissional_nome || currentUser.nome,
        observacao: data.pagamento.observacao || 'Recebido no Check-in (Balcão)',
        excluido: false,
      };
      setTransacoes(prev => [novaTx, ...prev.filter(t => t.id !== novaTx.id)]);
      await saveDocument(COLLECTIONS.TRANSACOES, novaTx);
    }

    // 3. Agendar retorno caso solicitado
    if (data.agendarRetorno && data.dadosRetorno) {
      const returnAg: Agendamento = {
        id: `ag-retorno-${Date.now()}`,
        paciente_id: ag.paciente_id,
        data_hora: data.dadosRetorno.data_hora,
        procedimento: data.dadosRetorno.procedimento,
        status: 'confirmado',
        criado_em: new Date().toISOString(),
        duracao_minutos: data.dadosRetorno.duracao_minutos || 30,
        valor_estimado: 0,
        profissional_id: data.dadosRetorno.profissional_id || ag.profissional_id,
        profissional_nome: data.dadosRetorno.profissional_nome || ag.profissional_nome,
        observacoes: data.dadosRetorno.observacoes || 'Retorno agendado durante o check-in na recepção.',
        paciente: patientObj,
      };
      setAgendamentos(prev => [returnAg, ...prev]);
      await saveDocument(COLLECTIONS.AGENDAMENTOS, returnAg);
      showToast(`Check-in de ${patientObj?.nome || 'paciente'} confirmado e retorno agendado com sucesso!`);
    } else {
      showToast(`Check-in de ${patientObj?.nome || 'paciente'} confirmado com sucesso!`);
    }

    setAppointmentToCheckIn(null);
  };

  const handleSaveAppointment = (novo: Partial<Agendamento>) => {
    if (!novo.paciente_id) {
      showToast('Selecione um paciente para o agendamento.', 'info');
      return;
    }

    const patientObj = pacientes.find(p => p.id === novo.paciente_id);
    const createdAgendamento: Agendamento = {
      id: `ag-${Date.now()}`,
      paciente_id: novo.paciente_id,
      data_hora: novo.data_hora || new Date().toISOString(),
      procedimento: novo.procedimento || 'Procedimento Estético',
      status: novo.status || 'confirmado',
      criado_em: new Date().toISOString(),
      duracao_minutos: novo.duracao_minutos || 45,
      valor_estimado: novo.valor_estimado,
      observacoes: novo.observacoes,
      profissional_id: novo.profissional_id || currentUser?.id,
      profissional_nome: novo.profissional_nome || currentUser?.nome || 'Profissional Clínico',
      profissional_cargo: novo.profissional_cargo || currentUser?.cargo,
      contrato_vinculado: novo.contrato_vinculado,
      contrato_assinado: novo.contrato_assinado ?? false,
      paciente: patientObj || {
        id: novo.paciente_id,
        nome: 'Paciente',
        telefone: '',
        historico_clinico: '',
        criado_em: new Date().toISOString(),
      },
    };

    setAgendamentos(prev => [createdAgendamento, ...prev]);

    queueOfflineMutation({
      entityType: 'agendamento',
      entityId: createdAgendamento.id,
      entityTitle: `Agendamento: ${patientObj?.nome || 'Paciente'} - ${createdAgendamento.procedimento}`,
      action: 'create',
      payload: createdAgendamento,
    });

    saveDocument(COLLECTIONS.AGENDAMENTOS, createdAgendamento);

    showToast(`Agendamento de "${patientObj?.nome || 'Paciente'}" registrado e sincronizado no banco de dados!`);
  };

  const handleSavePatient = (novo: Partial<Paciente>) => {
    if (!novo.nome || !novo.telefone) {
      showToast('Nome e Telefone são obrigatórios para o cadastro.', 'info');
      return;
    }

    const createdPatient: Paciente = {
      id: novo.id || `pac-${Date.now()}`,
      nome: novo.nome.trim(),
      telefone: novo.telefone.trim(),
      data_nascimento: novo.data_nascimento || '',
      endereco: novo.endereco?.trim() || undefined,
      profissao: novo.profissao?.trim() || undefined,
      contato_emergencia: novo.contato_emergencia,
      historico_clinico: novo.historico_clinico || 'Ficha clínica inicial cadastrada.',
      criado_em: new Date().toISOString(),
      email: novo.email?.trim() || undefined,
      cpf: novo.cpf?.trim() || undefined,
      alergias: novo.alergias?.trim() || undefined,
      medicacoes: novo.medicacoes?.trim() || undefined,
      fototipo: novo.fototipo || 'Fototipo III',
      fotos_antes_depois: [],
      evolucoes_retornos: [],
      anamneses_completas: novo.anamneses_completas || [],
      termo_consentimento: { assinado: false },
    };

    setPacientes(prev => [createdPatient, ...prev]);
    queueOfflineMutation({
      entityType: 'paciente',
      entityId: createdPatient.id,
      entityTitle: `Cadastro de Cliente: ${createdPatient.nome}`,
      action: 'create',
      payload: createdPatient,
    });
    saveDocument(COLLECTIONS.PACIENTES, createdPatient);
    showToast(`Ficha do cliente "${createdPatient.nome}" cadastrada e gravada no banco em tempo real!`);
  };

  const handleSaveNovaAnamneseCompletaGlobal = async (novaAnamnese: AnamneseCompleta) => {
    let target = pacientes.find(p => p.id === novaAnamnese.clienteId);

    if (!target) {
      // 1. Monta o objeto completo do paciente com a anamnese vinculada
      const dp = novaAnamnese.dadosPessoais || ({} as any);
      const sg = novaAnamnese.saudeGeral || ({} as any);
      const nomeFinal = (dp.nomeCompleto || 'Cliente').trim();
      const telefoneFinal = (dp.telefone || '').trim();

      const newPac: Paciente = {
        id: novaAnamnese.clienteId || `pac-${Date.now()}`,
        nome: nomeFinal,
        telefone: telefoneFinal,
        data_nascimento: dp.dataNascimento,
        email: dp.email?.trim() || undefined,
        cpf: dp.cpf?.trim() || undefined,
        endereco: dp.endereco?.trim() || undefined,
        profissao: dp.profissao?.trim() || undefined,
        contato_emergencia: dp.contatoEmergencia,
        alergias: sg.possuiAlergias ? sg.detalhesAlergias : undefined,
        medicacoes: sg.usoAcidos ? sg.detalhesAcidos : undefined,
        historico_clinico: `[Anamnese Inicial: ${novaAnamnese.procedimentoNome || 'Avaliação'} realizada em ${new Date().toLocaleDateString('pt-BR')}]`,
        criado_em: new Date().toISOString(),
        anamneses_completas: [novaAnamnese],
        fotos_antes_depois: novaAnamnese.fotoPacienteUrl ? [{
          id: `foto-${Date.now()}`,
          titulo: 'Foto Inicial Anamnese',
          data: new Date().toISOString().split('T')[0],
          foto_antes_url: novaAnamnese.fotoPacienteUrl,
          procedimento_nome: novaAnamnese.procedimentoNome || 'Avaliação',
        }] : [],
        evolucoes_retornos: [],
        termo_consentimento: {
          assinado: true,
          data_assinatura: novaAnamnese.assinadoEm || new Date().toISOString(),
          assinatura_base64: novaAnamnese.assinaturaUrl,
          nome_paciente_declarado: dp.nomeCompleto || nomeFinal,
          cpf_declarado: dp.cpf,
        },
      };

      // 2. Atualização otimista no estado e persistência imediata no Firestore
      setPacientes(prev => [newPac, ...prev.filter(p => p.id !== newPac.id)]);
      await saveDocument(COLLECTIONS.PACIENTES, newPac);
      
      showToast(`Cadastro e Anamnese de "${newPac.nome}" concluídos com sucesso!`);
    } else {
      const existing = target.anamneses_completas || [];
      const dp = novaAnamnese.dadosPessoais || ({} as any);
      const sg = novaAnamnese.saudeGeral || ({} as any);
      const dataFormatada = novaAnamnese.criadoEm ? new Date(novaAnamnese.criadoEm).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR');

      const updated: Paciente = {
        ...target,
        anamneses_completas: [novaAnamnese, ...existing],
        alergias: sg.possuiAlergias ? sg.detalhesAlergias : target.alergias,
        medicacoes: sg.usoAcidos ? sg.detalhesAcidos : target.medicacoes,
        profissao: dp.profissao || target.profissao,
        endereco: dp.endereco || target.endereco,
        contato_emergencia: dp.contatoEmergencia || target.contato_emergencia,
        historico_clinico: `${target.historico_clinico || ''}\n[Anamnese Completa: ${novaAnamnese.procedimentoNome || 'Avaliação'} realizada em ${dataFormatada}]`.trim(),
        termo_consentimento: {
          assinado: true,
          data_assinatura: novaAnamnese.assinadoEm || new Date().toISOString(),
          assinatura_base64: novaAnamnese.assinaturaUrl,
          nome_paciente_declarado: dp.nomeCompleto || target.nome,
          cpf_declarado: dp.cpf || target.cpf,
        },
      };

      setPacientes(prev => prev.map(p => p.id === target.id ? updated : p));
      await saveDocument(COLLECTIONS.PACIENTES, updated);
      showToast(`Anamnese de "${target.nome}" gravada e sincronizada com sucesso!`);

      if (selectedPatientForDetails?.id === target.id) {
        setSelectedPatientForDetails(updated);
      }
    }

    setIsAnamneseModalOpen(false);
    setSelectedPatientForAnamnese(null);
  };

  const handleSaveSupplier = (novo: Partial<Fornecedor>) => {
    if (!novo.razao_social || !novo.telefone) {
      showToast('Razão Social e Telefone são obrigatórios para o cadastro de fornecedor.', 'info');
      return;
    }

    if (novo.id) {
      setFornecedores(prev => prev.map(f => f.id === novo.id ? { ...f, ...novo } as Fornecedor : f));
      saveDocument(COLLECTIONS.FORNECEDORES, novo as Fornecedor);
      showToast(`Fornecedor "${novo.razao_social || novo.nome_fantasia}" atualizado com sucesso!`);
    } else {
      const createdSupplier: Fornecedor = {
        id: `forn-${Date.now()}`,
        razao_social: novo.razao_social.trim(),
        nome_fantasia: novo.nome_fantasia?.trim() || undefined,
        cnpj_cpf: novo.cnpj_cpf?.trim() || undefined,
        telefone: novo.telefone.trim(),
        email: novo.email?.trim() || undefined,
        categoria: novo.categoria || 'insumos',
        contato_responsavel: novo.contato_responsavel?.trim() || undefined,
        endereco: novo.endereco?.trim() || undefined,
        cidade_uf: novo.cidade_uf?.trim() || undefined,
        pix_chave: novo.pix_chave?.trim() || undefined,
        banco_dados: novo.banco_dados?.trim() || undefined,
        observacoes: novo.observacoes?.trim() || undefined,
        status: novo.status || 'ativo',
        criado_em: new Date().toISOString(),
      };

      setFornecedores(prev => [createdSupplier, ...prev]);
      saveDocument(COLLECTIONS.FORNECEDORES, createdSupplier);
      showToast(`Fornecedor "${createdSupplier.razao_social}" cadastrado com sucesso!`);
    }
  };

  const handleDeleteSupplier = (id: string, motivo?: string) => {
    const target = fornecedores.find(f => f.id === id);
    setFornecedores(prev => prev.filter(f => f.id !== id));
    removeDocument(COLLECTIONS.FORNECEDORES, id);
    showToast(`Fornecedor "${target?.razao_social || 'Fornecedor'}" excluído.`);
  };

  const handleDeletePatient = (id: string) => {
    const isMasterOrGestor = isUserAdminTotal(currentUser) || isUserAdminLocalOrTotal(currentUser) || currentUser.role === 'admin_master' || currentUser.role === 'admin_total' || currentUser.role === 'admin' || currentUser.role === 'gestor';
    if (!isMasterOrGestor) {
      showToast('Apenas o Admin Master ou Gestores têm permissão para excluir fichas de clientes.', 'info');
      return;
    }
    const patientName = pacientes.find(p => p.id === id)?.nome || 'Cliente';
    setPacientes(prev => prev.filter(p => p.id !== id));
    setAgendamentos(prev => prev.filter(a => a.paciente_id !== id));
    removeDocument(COLLECTIONS.PACIENTES, id);

    if (selectedPatientForDetails?.id === id) {
      setSelectedPatientForDetails(null);
    }
    if (patientForPackages?.id === id) {
      setPatientForPackages(null);
    }
    showToast(`Ficha de ${patientName} e registros vinculados foram excluídos.`);
  };

  const handleUpdatePatientHistory = (
    pacienteId: string, 
    novoHistorico: string, 
    dadosExtras?: Partial<Paciente>
  ) => {
    const target = pacientes.find(p => p.id === pacienteId);
    if (target) {
      const updated: Paciente = { ...target, historico_clinico: novoHistorico, ...(dadosExtras || {}) };
      setPacientes(prev => prev.map(p => p.id === pacienteId ? updated : p));
      
      queueOfflineMutation({
        entityType: 'paciente',
        entityId: pacienteId,
        entityTitle: `Prontuário & Evolução: ${target.nome}`,
        action: 'update',
        payload: updated,
      });

      if (isOnline) {
        saveDocument(COLLECTIONS.PACIENTES, updated);
        showToast('Ficha clínica e evoluções salvas e sincronizadas com a nuvem!');
      } else {
        showToast('Ficha clínica salva localmente no dispositivo (IndexedDB). Sincronizará quando houver conexão.', 'info');
      }

      if (selectedPatientForDetails?.id === pacienteId) {
        setSelectedPatientForDetails(updated);
      }
    }
    setAgendamentos(prev =>
      prev.map(ag =>
        ag.paciente_id === pacienteId && ag.paciente
          ? { ...ag, paciente: { ...ag.paciente, historico_clinico: novoHistorico, ...(dadosExtras || {}) } }
          : ag
      )
    );
  };

  const handleUpdatePacienteObj = (updatedPaciente: Paciente) => {
    setPacientes(prev =>
      prev.map(p => (p.id === updatedPaciente.id ? updatedPaciente : p))
    );
    saveDocument(COLLECTIONS.PACIENTES, updatedPaciente);

    if (selectedPatientForDetails?.id === updatedPaciente.id) {
      setSelectedPatientForDetails(updatedPaciente);
    }
    if (patientForPackages?.id === updatedPaciente.id) {
      setPatientForPackages(updatedPaciente);
    }
    showToast('Pacote de sessões do cliente atualizado com sucesso!');
  };

  const handleSaveInventory = (novo: Partial<EstoqueInsumo>) => {
    const createdItem: EstoqueInsumo = {
      id: novo.id || `est-${Date.now()}`,
      nome_item: novo.nome_item || 'Novo Insumo',
      quantidade: Number(novo.quantidade) || 0,
      unidade_medida: novo.unidade_medida || 'unidade',
      alerta_minimo: Number(novo.alerta_minimo) || 5,
      categoria: novo.categoria || 'Geral',
      lote: novo.lote || undefined,
      validade: novo.validade || undefined,
      custo_unitario: novo.custo_unitario !== undefined ? Number(novo.custo_unitario) : undefined,
      marca: novo.marca || undefined,
      tom_cor: novo.tom_cor || undefined,
      cor_tonalidade: novo.cor_tonalidade || undefined,
      procedimento_vinculado_id: novo.procedimento_vinculado_id || undefined,
      procedimento_vinculado_nome: novo.procedimento_vinculado_nome || undefined,
      quantidade_por_procedimento: novo.quantidade_por_procedimento !== undefined ? Number(novo.quantidade_por_procedimento) : undefined,
      procedimentos_vinculados: novo.procedimentos_vinculados || undefined,
      criado_em: new Date().toISOString(),
    };

    setEstoque(prev => [createdItem, ...prev]);
    saveDocument(COLLECTIONS.ESTOQUE, createdItem);
    showToast(`Insumo "${createdItem.nome_item}" cadastrado no estoque com sucesso!`);
  };

  const handleDeleteInventoryItem = (id: string) => {
    const isMasterOrGestor = isUserAdminTotal(currentUser) || isUserAdminLocalOrTotal(currentUser) || currentUser.role === 'admin_master' || currentUser.role === 'admin_total' || currentUser.role === 'admin' || currentUser.role === 'gestor';
    if (!isMasterOrGestor) {
      showToast('Apenas o Admin Master ou Gestores têm permissão para excluir insumos.', 'info');
      return;
    }
    const item = estoque.find(i => i.id === id);
    setEstoque(prev => prev.filter(i => i.id !== id));
    removeDocument(COLLECTIONS.ESTOQUE, id);
    showToast(`Insumo "${item?.nome_item || 'Item'}" removido com sucesso.`);
  };

  const handleUpdateQuantity = (id: string, newQuantity: number) => {
    const item = estoque.find(i => i.id === id);
    if (item) {
      const updated = { ...item, quantidade: newQuantity };
      setEstoque(prev => prev.map(i => (i.id === id ? updated : i)));
      saveDocument(COLLECTIONS.ESTOQUE, updated);
    }
    showToast('Quantidade em estoque atualizada!');
  };

  // Financial Handlers
  const handleAddTransaction = (nova: Partial<TransacaoFinanceira>) => {
    const rawTipo = nova.tipo || 'entrada';
    const standardizedTipo: 'entrada' | 'saida' = (rawTipo === 'receita' || rawTipo === 'entrada') ? 'entrada' : 'saida';

    const created: TransacaoFinanceira = {
      id: nova.id || `tx-${Date.now()}`,
      paciente_nome: nova.paciente_nome || 'Cliente / Fornecedor',
      procedimento: nova.procedimento || 'Lançamento Manual',
      valor: nova.valor || 0,
      tipo: standardizedTipo,
      forma_pagamento: nova.forma_pagamento || 'pix',
      status: nova.status || 'pago',
      data: nova.data || new Date().toISOString(),
      observacao: nova.observacao,
      excluido: false,
    };
    setTransacoes(prev => [created, ...prev]);
    saveDocument(COLLECTIONS.TRANSACOES, created);
    showToast('Lançamento financeiro registrado com sucesso!');
  };

  const handleSoftDeleteTransaction = async (id: string, motivo: string) => {
    await softDeleteTransacao(id, motivo, currentUser.nome);
    setTransacoes(prev =>
      prev.map(t =>
        t.id === id
          ? {
              ...t,
              excluido: true,
              motivo_exclusao: motivo,
              excluido_por: currentUser.nome,
              data_exclusao: new Date().toISOString(),
            }
          : t
      )
    );
    showToast('Lançamento cancelado com auditoria de exclusão registrada.');
  };

  const handleAddDespesaRecorrente = (nova: Omit<DespesaRecorrente, 'id'>) => {
    const created: DespesaRecorrente = {
      ...nova,
      id: `rec-${Date.now()}`,
    };
    setDespesasRecorrentes(prev => [created, ...prev]);
    saveDocument(COLLECTIONS.DESPESAS_RECORRENTES, created);
    showToast(`Despesa recorrente "${created.descricao}" cadastrada!`);
  };

  const handleUpdateDespesaRecorrente = (updated: DespesaRecorrente) => {
    setDespesasRecorrentes(prev =>
      prev.map(d => (d.id === updated.id ? updated : d))
    );
    saveDocument(COLLECTIONS.DESPESAS_RECORRENTES, updated);
    showToast(`Despesa recorrente "${updated.descricao}" atualizada com sucesso!`);
  };

  const handleDeleteDespesaRecorrente = (id: string) => {
    const target = despesasRecorrentes.find(d => d.id === id);
    setDespesasRecorrentes(prev => prev.filter(d => d.id !== id));
    removeDocument(COLLECTIONS.DESPESAS_RECORRENTES, id);
    showToast(`Despesa recorrente "${target?.descricao || ''}" excluída.`);
  };

  const handleToggleDespesaRecorrenteStatus = (id: string) => {
    const target = despesasRecorrentes.find(d => d.id === id);
    if (target) {
      const updated: DespesaRecorrente = {
        ...target,
        status: target.status === 'ativo' ? 'inativo' : 'ativo'
      };
      setDespesasRecorrentes(prev =>
        prev.map(d => (d.id === id ? updated : d))
      );
      saveDocument(COLLECTIONS.DESPESAS_RECORRENTES, updated);
      showToast('Status da despesa recorrente atualizado.');
    }
  };

  // Asset Management Handlers
  const handleSaveBem = (bemData: Omit<BemAtivo, 'id'>, idToEdit?: string) => {
    if (idToEdit) {
      const updated: BemAtivo = {
        ...bemData,
        id: idToEdit,
        criado_em: bensPatrimoniais.find(b => b.id === idToEdit)?.criado_em || new Date().toISOString()
      };
      setBensPatrimoniais(prev => prev.map(b => (b.id === idToEdit ? updated : b)));
      saveDocument(COLLECTIONS.BENS, updated);
      showToast(`Equipamento "${updated.nome}" atualizado com sucesso!`);
    } else {
      const created: BemAtivo = {
        ...bemData,
        id: `bem-${Date.now()}`,
        criado_em: new Date().toISOString(),
      };
      setBensPatrimoniais(prev => [created, ...prev]);
      saveDocument(COLLECTIONS.BENS, created);
      showToast(`Equipamento "${created.nome}" registrado no patrimônio!`);
    }
    setIsNewAssetOpen(false);
    setAssetToEdit(null);
  };

  const handleUpdateStatusBemPatrimonial = (id: string, status: BemAtivo['status']) => {
    setBensPatrimoniais(prev =>
      prev.map(b => (b.id === id ? { ...b, status } : b))
    );
    const target = bensPatrimoniais.find(b => b.id === id);
    if (target) {
      saveDocument(COLLECTIONS.BENS, { ...target, status });
    }
    showToast(`Status do equipamento atualizado.`);
  };

  const handleDeleteBemPatrimonial = (id: string) => {
    const item = bensPatrimoniais.find(b => b.id === id);
    setBensPatrimoniais(prev => prev.filter(b => b.id !== id));
    removeDocument(COLLECTIONS.BENS, id);
    showToast(`Equipamento "${item?.nome || 'Ativo'}" removido do patrimônio.`);
  };

  // User Profile & Avatar Handlers
  const handleUpdateAvatar = (newAvatarUrl: string, newName?: string) => {
    const updated: UsuarioEquipe = {
      ...currentUser,
      avatar_url: newAvatarUrl,
      ...(newName ? { nome: newName } : {}),
    };
    setCurrentUser(updated);
    setUsuarios(prev => prev.map(u => (u.id === updated.id ? updated : u)));
    saveDocument(COLLECTIONS.USUARIOS, updated);
    showToast('Foto de perfil e dados atualizados com sucesso!');
  };

  const handleSaveClinicConfig = (newConfig: ClinicaConfig) => {
    setClinicaConfig(newConfig);
    saveDocument(COLLECTIONS.CLINICA_CONFIG, newConfig);
    showToast('Identidade visual e dados da clínica salvos com sucesso!');
  };

  const handleDeleteAppointment = (id: string) => {
    const isMasterOrGestor = isUserAdminTotal(currentUser) || isUserAdminLocalOrTotal(currentUser) || currentUser.role === 'admin_master' || currentUser.role === 'admin_total' || currentUser.role === 'admin' || currentUser.role === 'gestor';
    if (!isMasterOrGestor) {
      showToast('Apenas o Admin Master ou Gestores têm permissão para excluir agendamentos.', 'info');
      return;
    }
    setAgendamentos(prev => prev.filter(a => a.id !== id));
    removeDocument(COLLECTIONS.AGENDAMENTOS, id);
    showToast('Agendamento excluído da agenda.');
  };

  const handleUpdateTransactionStatus = (id: string, status: StatusPagamento) => {
    const t = transacoes.find(tx => tx.id === id);
    if (t) {
      const updated = { ...t, status };
      setTransacoes(prev => prev.map(tx => (tx.id === id ? updated : tx)));
      saveDocument(COLLECTIONS.TRANSACOES, updated);
    }
    showToast(`Status da transação alterado para: ${status}`);
  };

  const handleMarkReminderSent = (agendamentoId: string) => {
    const ag = agendamentos.find(a => a.id === agendamentoId);
    if (ag) {
      const updated = { ...ag, lembrete_enviado: true };
      setAgendamentos(prev => prev.map(a => (a.id === agendamentoId ? updated : a)));
      saveDocument(COLLECTIONS.AGENDAMENTOS, updated);
    }
  };

  const handleUpdateAlertaStatus = (alertaId: string, status: 'pendente' | 'agendado' | 'contatado') => {
    const al = alertasRetorno.find(a => a.id === alertaId);
    if (al) {
      const updated = { ...al, status };
      setAlertasRetorno(prev => prev.map(a => (a.id === alertaId ? updated : a)));
      saveDocument(COLLECTIONS.ALERTAS_RETORNO, updated);
    }
    showToast(`Status do alerta atualizado para "${status}"!`);
  };

  const handleSaveAlertaRetorno = (novoAlerta: Partial<AlertaRetornoPos>) => {
    const created: AlertaRetornoPos = {
      id: novoAlerta.id || `alerta-${Date.now()}`,
      paciente_id: novoAlerta.paciente_id || '',
      paciente_nome: novoAlerta.paciente_nome || 'Cliente',
      telefone: novoAlerta.telefone || '',
      tipo: novoAlerta.tipo || (novoAlerta.origem_venda === 'produto' ? 'pos_venda' : 'retorno'),
      origem_venda: novoAlerta.origem_venda || (novoAlerta.tipo === 'pos_venda' ? 'produto' : 'servico'),
      procedimento_origem: novoAlerta.procedimento_origem || novoAlerta.produto_nome || 'Procedimento',
      produto_nome: novoAlerta.produto_nome,
      data_procedimento: novoAlerta.data_procedimento || new Date().toISOString(),
      dias_apos: Number(novoAlerta.dias_apos) || 15,
      data_ideal_retorno: novoAlerta.data_ideal_retorno || (() => {
        const d = new Date();
        d.setDate(d.getDate() + (Number(novoAlerta.dias_apos) || 15));
        return d.toISOString();
      })(),
      motivo: novoAlerta.motivo || (novoAlerta.tipo === 'pos_venda' ? 'Acompanhamento Pós-Venda & Cuidados' : 'Revisão Clínica / Retorno'),
      observacao: novoAlerta.observacao,
      status: 'pendente',
      criado_em: new Date().toISOString(),
    };

    setAlertasRetorno(prev => [created, ...prev]);
    saveDocument(COLLECTIONS.ALERTAS_RETORNO, created);
    showToast(`Lembrete de ${created.tipo === 'pos_venda' ? 'Pós-Venda' : 'Retorno'} cadastrado com sucesso!`);
  };

  const handleDeleteAlertaRetorno = (alertaId: string) => {
    const isMasterOrGestor = isUserAdminTotal(currentUser) || isUserAdminLocalOrTotal(currentUser) || currentUser.role === 'admin_master' || currentUser.role === 'admin_total' || currentUser.role === 'admin' || currentUser.role === 'gestor';
    if (!isMasterOrGestor) {
      showToast('Apenas o Admin Master ou Gestores têm permissão para excluir alertas de retorno.', 'info');
      return;
    }
    const alerta = alertasRetorno.find(a => a.id === alertaId);
    setAlertasRetorno(prev => prev.filter(a => a.id !== alertaId));
    removeDocument(COLLECTIONS.ALERTAS_RETORNO, alertaId);
    showToast(`Alerta de retorno excluído com sucesso.`);
  };

  // Procedures Catalog Handlers
  const handleSaveProcedure = (novo: Partial<ProcedimentoClinico>, idToEdit?: string) => {
    const targetId = idToEdit || procedureToEdit?.id;
    if (targetId) {
      const existing = procedimentos.find(p => p.id === targetId) || procedureToEdit;
      const val = novo.valor_tabela ?? novo.preco_sugerido ?? existing?.valor_tabela ?? existing?.preco_sugerido ?? 0;
      const updated: ProcedimentoClinico = {
        ...existing,
        ...novo,
        id: targetId,
        nome: novo.nome || existing?.nome || 'Procedimento',
        categoria: novo.categoria || existing?.categoria || 'Injetáveis & Harmonização',
        descricao: novo.descricao ?? existing?.descricao ?? '',
        preco_sugerido: val,
        valor_tabela: val,
        duracao_minutos: novo.duracao_minutos ?? existing?.duracao_minutos ?? 45,
        dias_retorno_padrao: novo.dias_retorno_padrao ?? existing?.dias_retorno_padrao ?? 15,
      } as ProcedimentoClinico;
      setProcedimentos(prev => prev.map(p => (p.id === targetId ? updated : p)));
      saveDocument(COLLECTIONS.PROCEDIMENTOS, updated);
      showToast(`Procedimento "${updated.nome}" atualizado com sucesso!`);
    } else {
      const val = novo.valor_tabela ?? novo.preco_sugerido ?? 0;
      const created: ProcedimentoClinico = {
        id: `proc-${Date.now()}`,
        nome: novo.nome || 'Novo Procedimento',
        categoria: novo.categoria || 'Injetáveis & Harmonização',
        descricao: novo.descricao || '',
        preco_sugerido: val,
        valor_tabela: val,
        valor_promocional: novo.valor_promocional,
        duracao_minutos: novo.duracao_minutos || 45,
        dias_retorno_padrao: novo.dias_retorno_padrao || 15,
        instrucoes_cuidados: novo.instrucoes_cuidados || novo.cuidados_pos || '',
        cuidados_pos: novo.cuidados_pos || novo.instrucoes_cuidados || '',
        contraindicacoes: novo.contraindicacoes,
        areas_aplicacao: novo.areas_aplicacao,
        indicacoes: novo.indicacoes,
        imagem_url: novo.imagem_url,
        destaque_portal: novo.destaque_portal ?? true,
        ativo: novo.ativo ?? true,
        insumos_vinculados: novo.insumos_vinculados,
        exige_contrato: novo.exige_contrato ?? true,
        contrato_padrao: novo.contrato_padrao,
      };
      setProcedimentos(prev => [created, ...prev]);
      saveDocument(COLLECTIONS.PROCEDIMENTOS, created);
      showToast(`Procedimento "${created.nome}" cadastrado no catálogo!`);
    }
    setIsNewProcedureOpen(false);
    setProcedureToEdit(null);
  };

  const handleDeleteProcedure = (id: string) => {
    const isMasterOrGestor = isUserAdminTotal(currentUser) || isUserAdminLocalOrTotal(currentUser) || currentUser.role === 'admin_master' || currentUser.role === 'admin_total' || currentUser.role === 'admin' || currentUser.role === 'gestor';
    if (!isMasterOrGestor) {
      showToast('Apenas o Admin Master ou Gestores podem remover procedimentos do catálogo.', 'info');
      return;
    }
    setProcedimentos(prev => prev.filter(p => p.id !== id));
    removeDocument(COLLECTIONS.PROCEDIMENTOS, id);
    showToast('Procedimento excluído do catálogo.');
  };

  // Quotes / Patient Portal Handlers
  const handleCriarOrcamento = (novo: Omit<SolicitacaoOrcamento, 'id' | 'data_solicitacao' | 'status'>) => {
    const created: SolicitacaoOrcamento = {
      ...novo,
      id: `orc-${Date.now()}`,
      data_solicitacao: new Date().toISOString(),
      status: 'pendente',
    };
    setOrcamentos(prev => [created, ...prev]);
    saveDocument(COLLECTIONS.ORCAMENTOS, created);
    showToast('Orçamento enviado com sucesso!');
  };

  const handleAtualizarStatusOrcamento = (id: string, status: SolicitacaoOrcamento['status'], observacoes?: string) => {
    const target = orcamentos.find(o => o.id === id);
    if (target) {
      const updated = { ...target, status, ...(observacoes ? { observacoes } : {}) };
      setOrcamentos(prev => prev.map(o => (o.id === id ? updated : o)));
      saveDocument(COLLECTIONS.ORCAMENTOS, updated);
      showToast(`Status do orçamento atualizado para: ${status.toUpperCase()}`);
    }
  };

  const handleConverterOrcamentoEmAgendamento = (orcamento: SolicitacaoOrcamento, dataHora: string) => {
    let patient = pacientes.find(p => p.telefone === orcamento.paciente_telefone);
    if (!patient) {
      patient = {
        id: `pac-${Date.now()}`,
        nome: orcamento.paciente_nome,
        telefone: orcamento.paciente_telefone,
        email: orcamento.paciente_email,
        data_nascimento: '',
        historico_clinico: `Cadastrado via orçamento online para ${orcamento.procedimento_nome}.`,
        criado_em: new Date().toISOString(),
        termo_consentimento: { assinado: false },
      };
      setPacientes(prev => [patient!, ...prev]);
      saveDocument(COLLECTIONS.PACIENTES, patient);
    }

    const createdAgendamento: Agendamento = {
      id: `ag-${Date.now()}`,
      paciente_id: patient.id,
      data_hora: dataHora,
      procedimento: orcamento.procedimento_nome || 'Procedimento Solicitado',
      status: 'confirmado',
      criado_em: new Date().toISOString(),
      duracao_minutos: 60,
      valor_estimado: orcamento.valor_total || 0,
      observacoes: `Convertido do orçamento nº ${orcamento.id}.`,
      paciente: patient,
      profissional_id: currentUser.id || 'user-01',
      profissional_nome: currentUser.nome || 'Profissional Responsável',
    };

    setAgendamentos(prev => [createdAgendamento, ...prev]);
    saveDocument(COLLECTIONS.AGENDAMENTOS, createdAgendamento);

    handleAtualizarStatusOrcamento(orcamento.id, 'agendado');
    showToast(`Orçamento convertido em agendamento para ${patient.nome}!`);
  };

  const handleDeleteOrcamento = (id: string) => {
    setOrcamentos(prev => prev.filter(o => o.id !== id));
    removeDocument(COLLECTIONS.ORCAMENTOS, id);
    showToast('Orçamento excluído.');
  };

  // AI & Image Studio Gallery Handler
  const handleSaveAIToPatientGallery = (pacienteId: string, imageUrl: string, caption: string) => {
    const target = pacientes.find(p => p.id === pacienteId);
    if (!target) return;

    const novaFoto = {
      id: `ai-foto-${Date.now()}`,
      titulo: caption || 'Simulação Estética IA',
      data: new Date().toISOString().split('T')[0],
      foto_depois_url: imageUrl,
      procedimento_nome: 'Simulação Estética Generativa',
      legenda: caption,
      criado_em: new Date().toISOString()
    };

    const updated: Paciente = {
      ...target,
      fotos_antes_depois: [novaFoto, ...(target.fotos_antes_depois || [])]
    };

    setPacientes(prev => prev.map(p => p.id === pacienteId ? updated : p));
    saveDocument(COLLECTIONS.PACIENTES, updated);
    showToast(`Imagem IA vinculada ao prontuário de ${target.nome}!`);
  };

  // Maps Grounding Add Supplier Handler
  const handleAddSupplierFromMaps = (novo: Partial<Fornecedor>) => {
    const created: Fornecedor = {
      id: `forn-maps-${Date.now()}`,
      nome_empresa: novo.nome_empresa || 'Fornecedor Localizado',
      razao_social: novo.razao_social || novo.nome_empresa || 'Fornecedor Localizado',
      telefone: novo.telefone || '(11) 99999-0000',
      endereco: novo.endereco || '',
      site: novo.site || '',
      categoria: novo.categoria || 'insumos_injetaveis',
      status: 'ativo',
      observacoes: novo.observacoes || 'Fornecedor salvo a partir do Google Maps Grounding.',
      criado_em: new Date().toISOString()
    };

    setFornecedores(prev => [created, ...prev]);
    saveDocument(COLLECTIONS.FORNECEDORES, created);
    showToast(`Fornecedor "${created.nome_empresa}" cadastrado com sucesso!`);
  };

  // Notice Board Handlers
  const handleAddAviso = (novo: Omit<AvisoQuadro, 'id' | 'data_publicacao'>) => {
    const created: AvisoQuadro = {
      ...novo,
      id: `aviso-${Date.now()}`,
      data_publicacao: new Date().toISOString(),
    };
    setAvisos(prev => [created, ...prev]);
    saveDocument(COLLECTIONS.AVISOS, created);
    showToast('Aviso publicado no mural da clínica!');
  };

  const handleDeleteAviso = (id: string) => {
    setAvisos(prev => prev.filter(a => a.id !== id));
    removeDocument(COLLECTIONS.AVISOS, id);
    showToast('Aviso removido do mural.');
  };

  // User Management Handlers
  const handleSaveUser = (novo: Omit<UsuarioEquipe, 'id' | 'created_at'>) => {
    const cleanEmail = (novo.email || '').trim().toLowerCase();
    const created: UsuarioEquipe = {
      ...novo,
      email: cleanEmail,
      id: `usr-${Date.now()}`,
      created_at: new Date().toISOString(),
      ultimo_acesso: 'Agora',
    };
    setUsuarios(prev => [created, ...prev]);
    saveDocument(COLLECTIONS.USUARIOS, created);
    saveDocument(COLLECTIONS.PERFIS, created);
    showToast(`Novo usuário ${created.nome} cadastrado e sincronizado no banco de dados!`);
  };

  const handleUpdateUser = (updated: UsuarioEquipe) => {
    const cleanEmail = (updated.email || '').trim().toLowerCase();
    const sanitized = { ...updated, email: cleanEmail };
    setUsuarios(prev =>
      prev.map(u => (u.id === sanitized.id ? sanitized : u))
    );
    saveDocument(COLLECTIONS.USUARIOS, sanitized);
    saveDocument(COLLECTIONS.PERFIS, sanitized);
    if (currentUser.id === sanitized.id) {
      setCurrentUser(sanitized);
    }
    showToast(`Dados de ${sanitized.nome} atualizados e sincronizados!`);
  };

  const handleRequestSwitchUser = (targetUser?: UsuarioEquipe) => {
    setSwitchTargetUser(targetUser || null);
    setIsSwitchUserModalOpen(true);
  };

  // Patient Details Modal Deep Linking Handlers
  const handleOpenPatientDetails = (paciente: Paciente, pushHistory = true) => {
    setSelectedPatientForDetails(paciente);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'pacientes');
      url.searchParams.set('pacienteId', paciente.id);
      if (pushHistory) {
        window.history.pushState({ tab: 'pacientes', pacienteId: paciente.id }, '', url.toString());
      } else {
        window.history.replaceState({ tab: 'pacientes', pacienteId: paciente.id }, '', url.toString());
      }
      try {
        localStorage.setItem(STORAGE_TAB_KEY, 'pacientes');
      } catch (e) {
        // ignore
      }
    }
  };

  const handleClosePatientDetails = (pushHistory = false) => {
    setSelectedPatientForDetails(null);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('pacienteId');
      if (pushHistory) {
        window.history.pushState({ tab: activeTab }, '', url.toString());
      } else {
        window.history.replaceState({ tab: activeTab }, '', url.toString());
      }
    }
  };

  const handleConfirmSwitchUser = (user: UsuarioEquipe) => {
    const isSuper = isUserAdminTotal(user) || user.id === 'user-super-admin' || user.email?.toLowerCase() === 'fldslima94@gmail.com' || user.email?.toLowerCase() === 'fabio@teste.com' || user.nome?.toLowerCase().includes('fabio lima');
    const userToSet = isSuper ? { ...user, role: 'admin_total' as UserRole, cargo: 'Super Admin (Master)' } : user;
    setCurrentUser(userToSet);
    try {
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userToSet));
    } catch (e) {
      // ignore
    }
    const roleLabel = isSuper
      ? 'Super Admin (Master)'
      : user.role === 'admin_local' || user.role === 'gestor' || user.role === 'admin'
      ? 'Gestor'
      : user.role === 'profissional'
      ? 'Profissional'
      : user.role === 'recepcao' || user.role === 'operador'
      ? 'Recepção'
      : 'Cliente';
    showToast(`Sessão autenticada para: ${user.nome} (${roleLabel})`, 'info');
  };

  const handleLoginSuccess = (user: UsuarioEquipe) => {
    const isSuper = isUserAdminTotal(user) || user.id === 'user-super-admin' || user.email?.toLowerCase() === 'fldslima94@gmail.com' || user.email?.toLowerCase() === 'fabio@teste.com' || user.nome?.toLowerCase().includes('fabio lima');
    const userToSet = isSuper ? { ...user, role: 'admin_total' as UserRole, cargo: 'Super Admin (Master)' } : user;
    setCurrentUser(userToSet);
    setIsAuthenticated(true);
    try {
      localStorage.setItem(STORAGE_AUTH_KEY, 'true');
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userToSet));
    } catch (e) {
      // ignore
    }
    
    const targetTab: TabType = userToSet.role === 'cliente' ? 'portal_paciente' : 'dashboard';
    navigateToTab(targetTab, true);

    const roleLabel = isSuper
      ? 'Super Admin (Master)'
      : user.role === 'admin_local' || user.role === 'gestor' || user.role === 'admin'
      ? 'Gestor'
      : user.role === 'profissional'
      ? 'Profissional'
      : user.role === 'recepcao' || user.role === 'operador'
      ? 'Recepção'
      : 'Cliente';
    showToast(`Bem-vindo(a), ${user.nome}! Acesso concedido como ${roleLabel}.`);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem(STORAGE_AUTH_KEY);
      localStorage.removeItem(STORAGE_USER_KEY);
      localStorage.removeItem(STORAGE_TAB_KEY);
    } catch (e) {
      // ignore
    }

    // Sign out from Firebase Auth if logged in
    logoutFirebase().catch(e => console.warn('[Firebase Auth] Erro ao deslogar:', e));

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.search = '';
      window.history.replaceState({}, '', url.toString());
    }
    showToast('Sessão encerrada com sucesso.', 'info');
  };

  const handleToggleUserStatus = (userId: string) => {
    const target = usuarios.find(u => u.id === userId);
    if (target) {
      const novoStatus = target.status === 'ativo' ? 'inativo' : 'ativo';
      const updated: UsuarioEquipe = { ...target, status: novoStatus };
      setUsuarios(prev => prev.map(u => (u.id === userId ? updated : u)));
      saveDocument(COLLECTIONS.USUARIOS, updated);
      showToast('Status do usuário atualizado.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const isSuperAdmin = isUserAdminTotal(currentUser) || currentUser.role === 'admin_total' || currentUser.role === 'admin';
    const isGestor = isSuperAdmin || currentUser.role === 'admin_local' || currentUser.role === 'gestor';
    
    if (!isGestor) {
      showToast('Apenas o Super Admin ou Gestores têm permissão para excluir usuários.', 'info');
      return;
    }
    if (currentUser.id === userId) {
      showToast('Não é possível excluir o usuário ativo da sessão atual.', 'info');
      return;
    }
    const user = usuarios.find(u => u.id === userId);
    setUsuarios(prev => prev.filter(u => u.id !== userId));
    await excluirUsuario(userId);
    showToast(`Usuário "${user?.nome || 'Usuário'}" excluído do sistema com sucesso.`);
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
  const pendingCount = agendamentos.filter(a => a.status === 'pendente' || a.status === 'em_espera').length;

  const hojeStrApp = new Date().toISOString().slice(0, 10);
  const limite15dApp = new Date();
  limite15dApp.setDate(limite15dApp.getDate() + 15);
  const limite15dAppStr = limite15dApp.toISOString().slice(0, 10);

  const manutencaoAlertCount = bensPatrimoniais.filter(b => 
    b.requerManutencao && 
    (b.estado_conservacao === 'manutencao' || b.statusManutencao === 'em_manutencao' || (b.dataProximaManutencao && b.dataProximaManutencao <= limite15dAppStr))
  ).length;

  return (
    <MasterEditProvider currentUser={currentUser}>
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
        manutencaoAlertCount={manutencaoAlertCount}
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
          clinicaConfig={clinicaConfig}
          onOpenClinicSettings={() => setIsClinicSettingsOpen(true)}
          onOpenUserAvatarModal={() => setIsUserAvatarModalOpen(true)}
          onLogout={handleLogout}
        />

        {/* Mobile Navigation */}
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
              bens={bensPatrimoniais}
              profissionais={usuarios}
              transacoes={transacoes}
              despesasRecorrentes={despesasRecorrentes}
              onOpenNewAppointment={() => {
                setAppointmentInitialData(null);
                setIsNewAppointmentOpen(true);
              }}
              onOpenNewPatient={() => setIsNewPatientOpen(true)}
              onOpenNewInventory={() => setIsNewInventoryOpen(true)}
              onUpdateStatus={handleUpdateStatus}
              onViewPatient={(p) => handleOpenPatientDetails(p)}
              onGoToEstoque={() => setActiveTab('estoque')}
              onGoToBens={() => setActiveTab('bens')}
              onGoToFinancial={() => setActiveTab('financeiro')}
              onOpenCompleteModal={(ag) => setAppointmentToComplete(ag)}
              onOpenCheckInModal={(ag) => setAppointmentToCheckIn(ag)}
              searchQuery={searchQuery}
            />
          )}

          {activeTab === 'agendamentos' && currentUser.role !== 'cliente' && (
            <AppointmentsView
              agendamentos={agendamentos}
              pacientes={pacientes}
              profissionais={usuarios}
              onOpenNewAppointment={(initialData) => {
                setAppointmentInitialData(initialData || null);
                setIsNewAppointmentOpen(true);
              }}
              onUpdateStatus={handleUpdateStatus}
              onViewPatient={(p) => handleOpenPatientDetails(p)}
              onOpenCompleteModal={(ag) => setAppointmentToComplete(ag)}
              onOpenCheckInModal={(ag) => setAppointmentToCheckIn(ag)}
              onDeleteAppointment={handleDeleteAppointment}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'pacientes' && currentUser.role !== 'cliente' && (
            <PatientsView
              pacientes={pacientes}
              onOpenNewPatient={() => setIsNewPatientOpen(true)}
              onOpenNewAnamnese={() => {
                setSelectedPatientForAnamnese(null);
                setIsAnamneseModalOpen(true);
              }}
              onViewPatient={(p) => handleOpenPatientDetails(p)}
              onOpenPackages={(p) => setPatientForPackages(p)}
              onDeletePatient={handleDeletePatient}
              onGoToSuppliers={() => setActiveTab('fornecedores')}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'fornecedores' && currentUser.role !== 'cliente' && (
            <SuppliersView
              fornecedores={fornecedores}
              transacoes={transacoes}
              onOpenNewSupplier={() => {
                setSupplierToEdit(null);
                setIsNewSupplierOpen(true);
              }}
              onEditSupplier={(forn) => {
                setSupplierToEdit(forn);
                setIsNewSupplierOpen(true);
              }}
              onDeleteSupplier={handleDeleteSupplier}
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

          {(activeTab === 'patrimonio' || activeTab === 'bens') && currentUser.role !== 'cliente' && (
            <AssetsView
              bens={bensPatrimoniais}
              onOpenNewBem={() => {
                setAssetToEdit(null);
                setIsNewAssetOpen(true);
              }}
              onEditBem={(bem) => {
                setAssetToEdit(bem);
                setIsNewAssetOpen(true);
              }}
              onDeleteBem={handleDeleteBemPatrimonial}
              onSaveBem={handleSaveBem}
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
              despesasRecorrentes={despesasRecorrentes}
              fornecedores={fornecedores}
              procedimentos={procedimentos}
              profissionais={usuarios}
              onAddTransaction={handleAddTransaction}
              onUpdateTransactionStatus={handleUpdateTransactionStatus}
              onSoftDeleteTransaction={handleSoftDeleteTransaction}
              onAddDespesaRecorrente={handleAddDespesaRecorrente}
              onUpdateDespesaRecorrente={handleUpdateDespesaRecorrente}
              onDeleteDespesaRecorrente={handleDeleteDespesaRecorrente}
              onToggleDespesaRecorrenteStatus={handleToggleDespesaRecorrenteStatus}
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

          {activeTab === 'gemini_copilot' && (
            <GeminiChatbotView currentUser={currentUser} />
          )}

          {activeTab === 'studio_ia_imagem' && (
            <ImageStudioAIView
              currentUser={currentUser}
              pacientes={pacientes}
              onSaveToPatientGallery={handleSaveAIToPatientGallery}
            />
          )}

          {activeTab === 'maps_grounding' && (
            <MapsGroundingView
              currentUser={currentUser}
              onAddFornecedor={handleAddSupplierFromMaps}
            />
          )}

          {activeTab === 'retorno_pos' && currentUser.role !== 'cliente' && (
            <PostCareReturnView
              alertas={alertasRetorno}
              pacientes={pacientes}
              onUpdateAlertaStatus={handleUpdateAlertaStatus}
              onDeleteAlerta={handleDeleteAlertaRetorno}
              onAddAlerta={handleSaveAlertaRetorno}
              currentUser={currentUser}
              onViewPatientByName={(nome) => {
                const found = pacientes.find(p => p.nome.toLowerCase() === nome.toLowerCase());
                if (found) {
                  handleOpenPatientDetails(found);
                } else {
                  setActiveTab('pacientes');
                }
              }}
            />
          )}

          {(activeTab === 'usuarios' || activeTab === 'equipe') && (isUserAdminLocalOrTotal(currentUser)) && (
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

          {activeTab === 'banco_dados' && (isUserAdminTotal(currentUser)) && (
            <DatabaseMasterView
              currentUser={currentUser}
              pacientes={pacientes}
              agendamentos={agendamentos}
              procedimentos={procedimentos}
              estoque={estoque}
              financeiro={transacoes}
              fornecedores={fornecedores}
              ativos={bensPatrimoniais}
              avisos={avisos}
              usuarios={usuarios}
              clinicaConfig={clinicaConfig}
              onRefreshData={() => {
                showToast('Dados sincronizados com o banco com sucesso!');
              }}
              onUpdatePaciente={(updatedP) => {
                setPacientes(prev => prev.map(p => p.id === updatedP.id ? updatedP : p));
              }}
            />
          )}

          {activeTab === 'permissoes' && (isUserAdminTotal(currentUser)) && (
            <PermissionsManagementView
              usuarios={usuarios}
              currentUser={currentUser}
              configuracaoCampos={configuracaoCampos}
              onUpdateUserPermissions={(userId, perms, role) => {
                setUsuarios(prev => prev.map(u => u.id === userId ? { 
                  ...u, 
                  permissoesCustomizadas: perms, 
                  ...(role ? { role, cargo: role } : {}) 
                } : u));
                if (currentUser.id === userId) {
                  setCurrentUser(prev => ({ 
                    ...prev, 
                    permissoesCustomizadas: perms, 
                    ...(role ? { role, cargo: role } : {}) 
                  }));
                }
                showToast('Permissões do usuário atualizadas com sucesso!');
              }}
              onUpdateFieldConfig={(newConf) => {
                setConfiguracaoCampos(newConf);
                showToast('Configurações de visibilidade de campos atualizadas!');
              }}
              onDeleteUser={handleDeleteUser}
            />
          )}

          {activeTab === 'perfil' && (
            <UserProfileView
              currentUser={currentUser}
              onUpdateCurrentUser={(updated) => {
                const newObj = { ...currentUser, ...updated };
                setCurrentUser(newObj);
                setUsuarios(prev => prev.map(u => u.id === newObj.id ? newObj : u));
                showToast('Perfil atualizado com sucesso!');
              }}
            />
          )}

          {activeTab === 'supabase_guide' && (currentUser.role === 'admin_total' || currentUser.role === 'admin_local' || currentUser.role === 'admin' || currentUser.role === 'gestor') && (
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

      {/* USER PROFILE AVATAR MODAL */}
      <UserProfileAvatarModal
        isOpen={isUserAvatarModalOpen}
        onClose={() => setIsUserAvatarModalOpen(false)}
        currentUser={currentUser}
        onUpdateAvatar={handleUpdateAvatar}
      />

      {/* CLINIC LOGO AND SETTINGS MODAL */}
      <ClinicSettingsModal
        isOpen={isClinicSettingsOpen}
        onClose={() => setIsClinicSettingsOpen(false)}
        config={clinicaConfig}
        onSaveConfig={handleSaveClinicConfig}
      />

      {/* MODALS */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        agendamentos={agendamentos}
        pacientes={pacientes}
        estoque={estoque}
        procedimentos={procedimentos}
        orcamentos={orcamentos}
        transacoes={transacoes}
        onNavigate={(tab) => setActiveTab(tab)}
        onSelectPatient={(p) => handleOpenPatientDetails(p)}
      />

      <NewAppointmentModal
        isOpen={isNewAppointmentOpen}
        onClose={() => {
          setIsNewAppointmentOpen(false);
          setAppointmentInitialData(null);
        }}
        pacientes={pacientes}
        procedimentos={procedimentos}
        profissionais={usuarios}
        initialData={appointmentInitialData}
        onSave={handleSaveAppointment}
        onSaveAppointment={handleSaveAppointment}
        onOpenNewPatient={() => setIsNewPatientOpen(true)}
      />

      <NewPatientModal
        isOpen={isNewPatientOpen}
        onClose={() => setIsNewPatientOpen(false)}
        onSave={handleSavePatient}
        onSavePatient={handleSavePatient}
        onOpenAnamneseCompleta={() => {
          setIsNewPatientOpen(false);
          setSelectedPatientForAnamnese(null);
          setIsAnamneseModalOpen(true);
        }}
        configuracaoCampos={configuracaoCampos}
        currentUser={currentUser}
      />

      <AnamneseCompletaModal
        isOpen={isAnamneseModalOpen}
        onClose={() => {
          setIsAnamneseModalOpen(false);
          setSelectedPatientForAnamnese(null);
        }}
        paciente={selectedPatientForAnamnese}
        currentUser={currentUser}
        onSave={handleSaveNovaAnamneseCompletaGlobal}
      />

      <NewSupplierModal
        isOpen={isNewSupplierOpen}
        onClose={() => {
          setIsNewSupplierOpen(false);
          setSupplierToEdit(null);
        }}
        onSave={handleSaveSupplier}
        onSaveSupplier={handleSaveSupplier}
        fornecedorToEdit={supplierToEdit}
        currentUser={currentUser}
      />

      <NewInventoryModal
        isOpen={isNewInventoryOpen}
        onClose={() => setIsNewInventoryOpen(false)}
        procedimentos={procedimentos}
        onSave={handleSaveInventory}
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
        onSave={handleSaveUser}
        onSaveUser={handleSaveUser}
      />

      <EditUserModal
        isOpen={!!userToEdit}
        onClose={() => setUserToEdit(null)}
        user={userToEdit}
        usuario={userToEdit}
        onSave={handleUpdateUser}
        onSaveUser={handleUpdateUser}
      />

      <PatientDetailsModal
        isOpen={!!selectedPatientForDetails}
        onClose={() => handleClosePatientDetails()}
        paciente={selectedPatientForDetails}
        agendamentos={agendamentos}
        profissionais={usuarios}
        clinicaConfig={clinicaConfig}
        onUpdatePatientHistory={handleUpdatePatientHistory}
        onDeletePatient={handleDeletePatient}
        currentUser={currentUser}
      />

      <TreatmentPackagesModal
        isOpen={!!patientForPackages}
        onClose={() => setPatientForPackages(null)}
        paciente={patientForPackages}
        procedimentos={procedimentos}
        onUpdatePaciente={handleUpdatePacienteObj}
        onScheduleSession={(sessaoInfo) => {
          setPatientForPackages(null);
          setAppointmentInitialData({
            paciente_id: sessaoInfo.pacienteId,
            procedimento: sessaoInfo.procedimento,
            observacoes: sessaoInfo.observacoes,
            valor_estimado: sessaoInfo.valor,
          });
          setIsNewAppointmentOpen(true);
        }}
        currentUser={currentUser}
      />

      <CompleteProcedureModal
        isOpen={!!appointmentToComplete}
        onClose={() => setAppointmentToComplete(null)}
        agendamento={appointmentToComplete}
        estoque={estoque}
        onConfirmComplete={handleSaveProcedureCompletion}
        onComplete={handleSaveProcedureCompletion}
        onSaveAlertaRetorno={handleSaveAlertaRetorno}
      />

      <CheckInPaymentAndReturnModal
        isOpen={!!appointmentToCheckIn}
        onClose={() => setAppointmentToCheckIn(null)}
        agendamento={appointmentToCheckIn}
        profissionais={usuarios}
        onConfirmCheckIn={handleConfirmCheckIn}
      />

      <NewAssetModal
        isOpen={isNewAssetOpen}
        onClose={() => {
          setIsNewAssetOpen(false);
          setAssetToEdit(null);
        }}
        onSave={handleSaveBem}
        bemToEdit={assetToEdit}
        profissionais={usuarios}
      />

      <SqlAndArchitectureModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
      />

      {/* Modal Global de Resolução de Conflitos de Sincronização */}
      <ConflictResolutionModal
        conflict={selectedConflict}
        onClose={() => setSelectedConflict(null)}
      />

      {/* Modal Dinâmico Universal de Edição Master */}
      <MasterEditModal />
    </div>
  </MasterEditProvider>
  );
}
