import React, { useState } from 'react';
import { 
  MOCK_PACIENTES, 
  MOCK_AGENDAMENTOS, 
  MOCK_ESTOQUE, 
  MOCK_TRANSACOES,
  MOCK_USUARIOS,
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
  UserRole
} from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { AppointmentsView } from './components/AppointmentsView';
import { PatientsView } from './components/PatientsView';
import { InventoryView } from './components/InventoryView';
import { FinancialView } from './components/FinancialView';
import { WhatsAppAutomationView } from './components/WhatsAppAutomationView';
import { SupabaseGuideView } from './components/SupabaseGuideView';
import { UsersManagementView } from './components/UsersManagementView';
import { NewAppointmentModal } from './components/NewAppointmentModal';
import { NewPatientModal } from './components/NewPatientModal';
import { NewInventoryModal } from './components/NewInventoryModal';
import { NewUserModal } from './components/NewUserModal';
import { PatientDetailsModal } from './components/PatientDetailsModal';
import { SqlAndArchitectureModal } from './components/SqlAndArchitectureModal';
import { CompleteProcedureModal } from './components/CompleteProcedureModal';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  // Application State
  const [pacientes, setPacientes] = useState<Paciente[]>(MOCK_PACIENTES);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>(MOCK_AGENDAMENTOS);
  const [estoque, setEstoque] = useState<EstoqueInsumo[]>(MOCK_ESTOQUE);
  const [transacoes, setTransacoes] = useState<TransacaoFinanceira[]>(MOCK_TRANSACOES);
  const [usuarios, setUsuarios] = useState<UsuarioEquipe[]>(MOCK_USUARIOS);
  const [currentUser, setCurrentUser] = useState<UsuarioEquipe>(MOCK_USUARIOS[0]);

  // UI Navigation & Search State
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals State
  const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
  const [isNewPatientOpen, setIsNewPatientOpen] = useState(false);
  const [isNewInventoryOpen, setIsNewInventoryOpen] = useState(false);
  const [isNewUserOpen, setIsNewUserOpen] = useState(false);
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

  // --- HANDLERS ---

  // 1. Simple Update appointment status
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
      concluido: 'Procedimento finalizado!',
      cancelado: 'Agendamento cancelado.',
      pendente: 'Status alterado para pendente.',
    };
    showToast(statusLabels[novoStatus]);
  };

  // 2. Complete procedure with automatic inventory deduction & financial entry
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

    // 2. Mark appointment as completed with details
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
      custo_insumos: insumosUsados.length * 65, // Estimativa de custo de reposição
      observacao: pagamento.observacao,
    };

    setTransacoes(prev => [newTx, ...prev]);

    const insumoCount = insumosUsados.length;
    showToast(
      `Procedimento concluído! ${insumoCount > 0 ? `Baixa em ${insumoCount} insumo(s) e ` : ''}receita de R$ ${pagamento.valor.toFixed(2)} registrada.`
    );
  };

  // 3. Create new appointment
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

  // 4. Create new patient
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

  // 5. Update patient history and clinical records
  const handleUpdatePatientHistory = (
    pacienteId: string, 
    novoHistorico: string, 
    dadosExtras?: Partial<Paciente>
  ) => {
    setPacientes(prev =>
      prev.map(p => (p.id === pacienteId ? { ...p, historico_clinico: novoHistorico, ...(dadosExtras || {}) } : p))
    );
    // Also update populated reference in agendamentos
    setAgendamentos(prev =>
      prev.map(ag =>
        ag.paciente_id === pacienteId && ag.paciente
          ? { ...ag, paciente: { ...ag.paciente, historico_clinico: novoHistorico, ...(dadosExtras || {}) } }
          : ag
      )
    );
    showToast('Prontuário clínico atualizado com sucesso!');
  };

  // 6. Create new inventory item
  const handleSaveInventory = (novo: Partial<EstoqueInsumo>) => {
    const createdItem: EstoqueInsumo = {
      id: `est-${Date.now()}`,
      nome_item: novo.nome_item!,
      quantidade: novo.quantidade || 0,
      unidade_medida: novo.unidade_medida || 'unidade',
      alerta_minimo: novo.alerta_minimo || 5,
      categoria: novo.categoria || 'Geral',
      lote: novo.lote,
      criado_em: new Date().toISOString(),
    };

    setEstoque(prev => [createdItem, ...prev]);
    showToast(`Insumo "${createdItem.nome_item}" cadastrado no estoque!`);
  };

  // 7. Update inventory quantity
  const handleUpdateQuantity = (id: string, newQuantity: number) => {
    setEstoque(prev =>
      prev.map(item => (item.id === id ? { ...item, quantidade: newQuantity } : item))
    );
    showToast('Quantidade em estoque atualizada!');
  };

  // 8. Financial handlers
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

  const handleUpdateTransactionStatus = (id: string, status: StatusPagamento) => {
    setTransacoes(prev =>
      prev.map(t => (t.id === id ? { ...t, status } : t))
    );
    showToast(`Status da transação alterado para: ${status}`);
  };

  // 9. Mark WhatsApp Reminder Sent
  const handleMarkReminderSent = (agendamentoId: string) => {
    setAgendamentos(prev =>
      prev.map(a => (a.id === agendamentoId ? { ...a, lembrete_enviado: true } : a))
    );
  };

  // 10. User Management Handlers
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

  const handleSwitchUser = (user: UsuarioEquipe) => {
    setCurrentUser(user);
    showToast(`Perfil alternado para: ${user.nome} (${user.role === 'admin' ? 'Administrador' : 'Operador'})`, 'info');
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
        lowStockCount={lowStockCount}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        currentUser={currentUser}
        usuarios={usuarios}
        onSwitchUser={handleSwitchUser}
      />

      {/* Main Layout Body */}
      <div className="flex-1 flex flex-col lg:flex-row w-full">
        
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          lowStockCount={lowStockCount}
          pendingCount={pendingCount}
          currentUser={currentUser}
        />

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl">
          {activeTab === 'dashboard' && (
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

          {activeTab === 'agendamentos' && (
            <AppointmentsView
              agendamentos={agendamentos}
              pacientes={pacientes}
              onOpenNewAppointment={() => setIsNewAppointmentOpen(true)}
              onUpdateStatus={handleUpdateStatus}
              onViewPatient={(p) => setSelectedPatientForDetails(p)}
              onOpenCompleteModal={(ag) => setAppointmentToComplete(ag)}
            />
          )}

          {activeTab === 'pacientes' && (
            <PatientsView
              pacientes={pacientes}
              onOpenNewPatient={() => setIsNewPatientOpen(true)}
              onViewPatient={(p) => setSelectedPatientForDetails(p)}
            />
          )}

          {activeTab === 'estoque' && (
            <InventoryView
              estoque={estoque}
              onOpenNewInventory={() => setIsNewInventoryOpen(true)}
              onUpdateQuantity={handleUpdateQuantity}
            />
          )}

          {activeTab === 'financeiro' && (
            <FinancialView
              transacoes={transacoes}
              onAddTransaction={handleAddTransaction}
              onUpdateTransactionStatus={handleUpdateTransactionStatus}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'whatsapp' && (
            <WhatsAppAutomationView
              agendamentos={agendamentos}
              pacientes={pacientes}
              onMarkReminderSent={handleMarkReminderSent}
            />
          )}

          {activeTab === 'usuarios' && (
            <UsersManagementView
              usuarios={usuarios}
              currentUser={currentUser}
              onSwitchUser={handleSwitchUser}
              onOpenNewUser={() => setIsNewUserOpen(true)}
              onToggleUserStatus={handleToggleUserStatus}
              onOpenSqlGuide={() => setIsSqlModalOpen(true)}
            />
          )}

          {activeTab === 'supabase_guide' && (
            <SupabaseGuideView />
          )}
        </main>

      </div>

      {/* MODALS */}
      <NewAppointmentModal
        isOpen={isNewAppointmentOpen}
        onClose={() => setIsNewAppointmentOpen(false)}
        pacientes={pacientes}
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

      <NewUserModal
        isOpen={isNewUserOpen}
        onClose={() => setIsNewUserOpen(false)}
        onSaveUser={handleSaveUser}
      />

      <PatientDetailsModal
        paciente={selectedPatientForDetails}
        isOpen={!!selectedPatientForDetails}
        onClose={() => setSelectedPatientForDetails(null)}
        agendamentos={agendamentos}
        onUpdatePatientHistory={handleUpdatePatientHistory}
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
