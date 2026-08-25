import React, { useState } from 'react';
import { 
  Shield, 
  ShieldCheck, 
  Key, 
  Users, 
  Eye, 
  EyeOff, 
  Save, 
  CheckCircle2, 
  AlertTriangle, 
  Sliders, 
  FileText, 
  Calendar, 
  DollarSign, 
  Package, 
  Building, 
  Sparkles, 
  Lock, 
  RefreshCw,
  HelpCircle,
  Zap,
  Info
} from 'lucide-react';
import { 
  UsuarioEquipe, 
  UserRole, 
  PermissoesCustomizadas, 
  ConfiguracaoCampos 
} from '../types';
import { 
  salvarPermissoesUsuario, 
  salvarConfiguracaoCampos,
  isUserAdminTotal 
} from '../services/firebaseService';

interface PermissionsManagementViewProps {
  usuarios: UsuarioEquipe[];
  currentUser: UsuarioEquipe;
  configuracaoCampos: ConfiguracaoCampos;
  onUpdateUserPermissions: (userId: string, permissoes: PermissoesCustomizadas, role?: UserRole) => void;
  onUpdateFieldConfig: (config: ConfiguracaoCampos) => void;
}

const DEFAULT_PRESETS: Record<string, PermissoesCustomizadas> = {
  admin_local: {
    financeiro: { verEntradas: true, verSaidas: true, verRecorrentes: true, excluir: false, verRelatorios: true },
    clientes: { criar: true, editar: true, excluir: false, verHistorico: true, preencherAnamnese: true },
    agenda: { verTodos: true, verPropria: true, criar: true, cancelar: true, finalizar: true },
    procedimentos: { verCustos: false, verMargem: false, criar: true, excluir: false, ajustarEstoque: true },
    bens: { gerenciar: true, excluir: false },
    estoque: { ajustar: true, excluir: false },
    orcamentos: { verTodos: true, responder: true, verEmails: true }
  },
  profissional: {
    financeiro: { verEntradas: false, verSaidas: false, verRecorrentes: false, excluir: false, verRelatorios: false },
    clientes: { criar: true, editar: true, excluir: false, verHistorico: true, preencherAnamnese: true },
    agenda: { verTodos: false, verPropria: true, criar: true, cancelar: false, finalizar: true },
    procedimentos: { verCustos: false, verMargem: false, criar: false, excluir: false, ajustarEstoque: false },
    bens: { gerenciar: false, excluir: false },
    estoque: { ajustar: false, excluir: false },
    orcamentos: { verTodos: false, responder: false, verEmails: false }
  },
  recepcao: {
    financeiro: { verEntradas: true, verSaidas: false, verRecorrentes: false, excluir: false, verRelatorios: false },
    clientes: { criar: true, editar: true, excluir: false, verHistorico: false, preencherAnamnese: false },
    agenda: { verTodos: true, verPropria: false, criar: true, cancelar: true, finalizar: true },
    procedimentos: { verCustos: false, verMargem: false, criar: false, excluir: false, ajustarEstoque: false },
    bens: { gerenciar: false, excluir: false },
    estoque: { ajustar: false, excluir: false },
    orcamentos: { verTodos: true, responder: true, verEmails: true }
  },
  cliente: {
    financeiro: { verEntradas: false, verSaidas: false, verRecorrentes: false, excluir: false, verRelatorios: false },
    clientes: { criar: false, editar: false, excluir: false, verHistorico: false, preencherAnamnese: false },
    agenda: { verTodos: false, verPropria: false, criar: false, cancelar: false, finalizar: false },
    procedimentos: { verCustos: false, verMargem: false, criar: false, excluir: false, ajustarEstoque: false },
    bens: { gerenciar: false, excluir: false },
    estoque: { ajustar: false, excluir: false },
    orcamentos: { verTodos: false, responder: false, verEmails: false }
  }
};

const SYSTEM_FIELDS = [
  { id: 'cliente.cpf', label: 'CPF do Cliente', category: 'Clientes' },
  { id: 'cliente.data_nascimento', label: 'Data de Nascimento / Idade', category: 'Clientes' },
  { id: 'cliente.fototipo', label: 'Fototipo Fitzpatrick (Escala I a VI)', category: 'Clientes' },
  { id: 'cliente.alergias', label: 'Histórico de Alergias / Medicamentos', category: 'Clientes' },
  { id: 'cliente.queixa_principal', label: 'Queixa Principal & Observações', category: 'Clientes' },
  { id: 'procedimento.custoInsumos', label: 'Custo de Insumos / Custo Unitário', category: 'Procedimentos' },
  { id: 'procedimento.margem', label: 'Margem de Lucro Percentual', category: 'Procedimentos' },
  { id: 'procedimento.duracao_minutos', label: 'Duração em Minutos', category: 'Procedimentos' },
  { id: 'procedimento.contrato_padrao', label: 'Termo de Consentimento / Contrato', category: 'Procedimentos' },
  { id: 'insumo.lote', label: 'Número de Lote do Insumo', category: 'Estoque' },
  { id: 'insumo.marca', label: 'Marca / Fabricante', category: 'Estoque' },
  { id: 'insumo.cor_tonalidade', label: 'Cor / Tonalidade de Pigmento', category: 'Estoque' },
  { id: 'insumo.alerta_minimo', label: 'Ponto de Pedido / Alerta Mínimo', category: 'Estoque' },
  { id: 'agendamento.observacoes', label: 'Observações do Agendamento', category: 'Agenda' },
  { id: 'agendamento.forma_pagamento', label: 'Forma de Pagamento Prevista', category: 'Agenda' },
  { id: 'agendamento.status_pagamento', label: 'Status de Pagamento Inicial', category: 'Agenda' },
];

export const PermissionsManagementView: React.FC<PermissionsManagementViewProps> = ({
  usuarios,
  currentUser,
  configuracaoCampos,
  onUpdateUserPermissions,
  onUpdateFieldConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'permissoes' | 'campos'>('permissoes');
  const [selectedUserId, setSelectedUserId] = useState<string>(
    usuarios.find(u => u.role !== 'admin_total')?.id || usuarios[0]?.id || ''
  );
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin_local');
  const [currentPermissions, setCurrentPermissions] = useState<PermissoesCustomizadas>(
    DEFAULT_PRESETS.admin_local
  );
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Field Visibility State
  const [hiddenFields, setHiddenFields] = useState<string[]>(configuracaoCampos.camposOcultos || []);
  const [mandatoryFields, setMandatoryFields] = useState<string[]>(configuracaoCampos.camposObrigatorios || []);
  const [isSavingFields, setIsSavingFields] = useState(false);
  const [savedFieldsSuccess, setSavedFieldsSuccess] = useState(false);

  const selectedUser = usuarios.find(u => u.id === selectedUserId);

  // When selected user changes, initialize form
  const handleSelectUser = (user: UsuarioEquipe) => {
    setSelectedUserId(user.id);
    setSelectedRole(user.role);
    if (user.permissoesCustomizadas) {
      setCurrentPermissions(JSON.parse(JSON.stringify(user.permissoesCustomizadas)));
    } else {
      const presetKey = user.role in DEFAULT_PRESETS ? user.role : 'admin_local';
      setCurrentPermissions(JSON.parse(JSON.stringify(DEFAULT_PRESETS[presetKey])));
    }
  };

  const applyPreset = (presetKey: keyof typeof DEFAULT_PRESETS) => {
    setCurrentPermissions(JSON.parse(JSON.stringify(DEFAULT_PRESETS[presetKey])));
    setSelectedRole(presetKey as UserRole);
  };

  const togglePermission = (modulo: keyof PermissoesCustomizadas, acao: string) => {
    setCurrentPermissions(prev => ({
      ...prev,
      [modulo]: {
        ...(prev as any)[modulo],
        [acao]: !(prev as any)[modulo][acao]
      }
    }));
  };

  const handleSavePermissions = async () => {
    if (!selectedUserId) return;
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      await salvarPermissoesUsuario(selectedUserId, currentPermissions, selectedRole);
      onUpdateUserPermissions(selectedUserId, currentPermissions, selectedRole);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Erro ao salvar permissões:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleFieldHidden = (fieldId: string) => {
    setHiddenFields(prev => 
      prev.includes(fieldId) ? prev.filter(f => f !== fieldId) : [...prev, fieldId]
    );
  };

  const handleToggleFieldMandatory = (fieldId: string) => {
    setMandatoryFields(prev => 
      prev.includes(fieldId) ? prev.filter(f => f !== fieldId) : [...prev, fieldId]
    );
  };

  const handleSaveFieldsConfig = async () => {
    setIsSavingFields(true);
    setSavedFieldsSuccess(false);

    const updatedConfig: ConfiguracaoCampos = {
      clinicaId: currentUser.clinica_id || 'config_matriz',
      camposOcultos: hiddenFields,
      camposObrigatorios: mandatoryFields,
      atualizadoPor: currentUser.nome,
    };

    try {
      await salvarConfiguracaoCampos(currentUser.clinica_id || 'config_matriz', updatedConfig);
      onUpdateFieldConfig(updatedConfig);
      setSavedFieldsSuccess(true);
      setTimeout(() => setSavedFieldsSuccess(false), 3000);
    } catch (err) {
      console.error('Erro ao salvar campos:', err);
    } finally {
      setIsSavingFields(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                  Painel de Controle Master • Super Admin
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300">
                  Acesso Total Irrestrito
                </span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight mt-1">
                Gestão Granular de Permissões & Visibilidade de Campos
              </h2>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                Defina com precisão o que cada nível hierárquico pode visualizar, criar, editar e excluir no sistema.
              </p>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex bg-white/10 p-1 rounded-xl border border-white/10 shrink-0">
            <button
              onClick={() => setActiveTab('permissoes')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'permissoes'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-indigo-200 hover:text-white hover:bg-white/5'
              }`}
            >
              <Key className="w-4 h-4" />
              <span>Matriz de Permissões</span>
            </button>
            <button
              onClick={() => setActiveTab('campos')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'campos'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-indigo-200 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Campos & Telas</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: MATRIZ DE PERMISSÕES */}
      {activeTab === 'permissoes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* User Selector List */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Selecione o Usuário / Perfil</span>
              </h3>

              <div className="space-y-2">
                {usuarios.map(user => {
                  const isSelected = user.id === selectedUserId;
                  const isTotal = user.role === 'admin_total';

                  return (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar_url || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80'}
                          alt={user.nome}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {user.nome}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {user.cargo || user.role}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isTotal ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            👑 Master
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                            {user.role}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Role Presets */}
            {selectedUser && selectedUser.role !== 'admin_total' && (
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Aplicar Modelo Predefinido</span>
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Carregue um conjunto padrão de permissões e personalize as chaves conforme a necessidade da unidade.
                </p>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset('admin_local')}
                    className="p-2 text-[11px] font-semibold bg-white border border-slate-200 hover:border-indigo-400 rounded-xl text-slate-700 hover:text-indigo-600 transition-colors text-left"
                  >
                    🏢 Admin Local (Gestor)
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('profissional')}
                    className="p-2 text-[11px] font-semibold bg-white border border-slate-200 hover:border-indigo-400 rounded-xl text-slate-700 hover:text-indigo-600 transition-colors text-left"
                  >
                    👩‍⚕️ Profissional / Esteta
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('recepcao')}
                    className="p-2 text-[11px] font-semibold bg-white border border-slate-200 hover:border-indigo-400 rounded-xl text-slate-700 hover:text-indigo-600 transition-colors text-left"
                  >
                    🛎️ Recepção / Caixa
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('cliente')}
                    className="p-2 text-[11px] font-semibold bg-white border border-slate-200 hover:border-indigo-400 rounded-xl text-slate-700 hover:text-indigo-600 transition-colors text-left"
                  >
                    👤 Cliente / Portal
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Permissions Matrix Detail */}
          <div className="lg:col-span-8 space-y-4">
            {selectedUser ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
                
                {/* User Header & Role Setting */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Permissões de {selectedUser.nome}
                    </h3>
                    <p className="text-xs text-slate-500">
                      E-mail: {selectedUser.email} • ID: {selectedUser.id}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-slate-600">
                      Nível de Acesso:
                    </label>
                    <select
                      value={selectedRole}
                      disabled={selectedUser.role === 'admin_total'}
                      onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                      className="px-3 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="admin_total">Admin Total (Super Master)</option>
                      <option value="admin_local">Admin Local (Gestor)</option>
                      <option value="profissional">Profissional / Especialista</option>
                      <option value="recepcao">Recepção & Atendimento</option>
                      <option value="cliente">Cliente / Paciente</option>
                    </select>
                  </div>
                </div>

                {selectedUser.role === 'admin_total' && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Usuário com Acesso Admin Total Irrestrito</p>
                      <p className="text-amber-800 mt-0.5 leading-relaxed">
                        Este usuário é o Administrador Master do sistema. Todas as permissões de leitura, gravação, exclusão e visualização de custos e auditorias estão permanentemente ativas.
                      </p>
                    </div>
                  </div>
                )}

                {/* MODULE 1: FICHAS DE CLIENTES */}
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Fichas de Clientes & Prontuários
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                    <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 cursor-pointer hover:border-slate-300">
                      <span>Criar Novo Cliente</span>
                      <input
                        type="checkbox"
                        checked={currentPermissions.clientes?.criar ?? true}
                        onChange={() => togglePermission('clientes', 'criar')}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                    </label>
                    <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 cursor-pointer hover:border-slate-300">
                      <span>Editar Dados do Cliente</span>
                      <input
                        type="checkbox"
                        checked={currentPermissions.clientes?.editar ?? true}
                        onChange={() => togglePermission('clientes', 'editar')}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                    </label>
                    <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 cursor-pointer hover:border-slate-300">
                      <span>Ver Histórico Completo</span>
                      <input
                        type="checkbox"
                        checked={currentPermissions.clientes?.verHistorico ?? true}
                        onChange={() => togglePermission('clientes', 'verHistorico')}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                    </label>
                    <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 cursor-pointer hover:border-slate-300">
                      <span>Preencher Anamnese</span>
                      <input
                        type="checkbox"
                        checked={currentPermissions.clientes?.preencherAnamnese ?? true}
                        onChange={() => togglePermission('clientes', 'preencherAnamnese')}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                    </label>
                    <label className="flex items-center justify-between p-2.5 bg-rose-50/50 rounded-lg border border-rose-200 text-xs text-rose-800 cursor-pointer hover:border-rose-300">
                      <span className="font-semibold">Excluir Ficha (pode_excluir)</span>
                      <input
                        type="checkbox"
                        checked={currentPermissions.clientes?.excluir ?? false}
                        onChange={() => togglePermission('clientes', 'excluir')}
                        className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                {/* MODULE 2: AGENDA */}
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Agenda de Atendimentos
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                    <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 cursor-pointer hover:border-slate-300">
                      <span>Ver Todos Agendamentos</span>
                      <input
                        type="checkbox"
                        checked={currentPermissions.agenda?.verTodos ?? true}
                        onChange={() => togglePermission('agenda', 'verTodos')}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                    </label>
                    <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 cursor-pointer hover:border-slate-300">
                      <span>Criar Agendamento</span>
                      <input
                        type="checkbox"
                        checked={currentPermissions.agenda?.criar ?? true}
                        onChange={() => togglePermission('agenda', 'criar')}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                    </label>
                    <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 cursor-pointer hover:border-slate-300">
                      <span>Finalizar Atendimento</span>
                      <input
                        type="checkbox"
                        checked={currentPermissions.agenda?.finalizar ?? true}
                        onChange={() => togglePermission('agenda', 'finalizar')}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                    </label>
                    <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 cursor-pointer hover:border-slate-300">
                      <span>Cancelar Agendamento</span>
                      <input
                        type="checkbox"
                        checked={currentPermissions.agenda?.cancelar ?? true}
                        onChange={() => togglePermission('agenda', 'cancelar')}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                {/* MODULE 3: FINANCEIRO */}
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Módulo Financeiro & Caixa
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                    <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 cursor-pointer hover:border-slate-300">
                      <span>Visualizar Entradas</span>
                      <input
                        type="checkbox"
                        checked={currentPermissions.financeiro?.verEntradas ?? false}
                        onChange={() => togglePermission('financeiro', 'verEntradas')}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                      />
                    </label>
                    <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 cursor-pointer hover:border-slate-300">
                      <span>Visualizar Saídas & Despesas</span>
                      <input
                        type="checkbox"
                        checked={currentPermissions.financeiro?.verSaidas ?? false}
                        onChange={() => togglePermission('financeiro', 'verSaidas')}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                      />
                    </label>
                    <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 cursor-pointer hover:border-slate-300">
                      <span>Despesas Recorrentes</span>
                      <input
                        type="checkbox"
                        checked={currentPermissions.financeiro?.verRecorrentes ?? false}
                        onChange={() => togglePermission('financeiro', 'verRecorrentes')}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                      />
                    </label>
                    <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 cursor-pointer hover:border-slate-300">
                      <span>Relatórios Consolidados</span>
                      <input
                        type="checkbox"
                        checked={currentPermissions.financeiro?.verRelatorios ?? false}
                        onChange={() => togglePermission('financeiro', 'verRelatorios')}
                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                      />
                    </label>
                    <label className="flex items-center justify-between p-2.5 bg-rose-50/50 rounded-lg border border-rose-200 text-xs text-rose-800 cursor-pointer hover:border-rose-300">
                      <span className="font-semibold">Excluir Lançamentos (Auditoria)</span>
                      <input
                        type="checkbox"
                        checked={currentPermissions.financeiro?.excluir ?? false}
                        onChange={() => togglePermission('financeiro', 'excluir')}
                        className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                {/* MODULE 4: PROCEDIMENTOS & INSUMOS */}
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Procedimentos & Catálogo Clínico
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                    <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 cursor-pointer hover:border-slate-300">
                      <span>Criar Procedimentos</span>
                      <input
                        type="checkbox"
                        checked={currentPermissions.procedimentos?.criar ?? true}
                        onChange={() => togglePermission('procedimentos', 'criar')}
                        className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                      />
                    </label>
                    <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 cursor-pointer hover:border-slate-300">
                      <span>Ver Custos de Insumos</span>
                      <input
                        type="checkbox"
                        checked={currentPermissions.procedimentos?.verCustos ?? false}
                        onChange={() => togglePermission('procedimentos', 'verCustos')}
                        className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                      />
                    </label>
                    <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 cursor-pointer hover:border-slate-300">
                      <span>Ver Margem de Lucro</span>
                      <input
                        type="checkbox"
                        checked={currentPermissions.procedimentos?.verMargem ?? false}
                        onChange={() => togglePermission('procedimentos', 'verMargem')}
                        className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                      />
                    </label>
                    <label className="flex items-center justify-between p-2.5 bg-rose-50/50 rounded-lg border border-rose-200 text-xs text-rose-800 cursor-pointer hover:border-rose-300">
                      <span className="font-semibold">Excluir Procedimentos</span>
                      <input
                        type="checkbox"
                        checked={currentPermissions.procedimentos?.excluir ?? false}
                        onChange={() => togglePermission('procedimentos', 'excluir')}
                        className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                {/* MODULE 5: BENS & ATIVOS */}
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Bens & Patrimônio da Clínica
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                    <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 cursor-pointer hover:border-slate-300">
                      <span>Gerenciar e Cadastrar Bens</span>
                      <input
                        type="checkbox"
                        checked={currentPermissions.bens?.gerenciar ?? false}
                        onChange={() => togglePermission('bens', 'gerenciar')}
                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      />
                    </label>
                    <label className="flex items-center justify-between p-2.5 bg-rose-50/50 rounded-lg border border-rose-200 text-xs text-rose-800 cursor-pointer hover:border-rose-300">
                      <span className="font-semibold">Excluir Bens e Ativos</span>
                      <input
                        type="checkbox"
                        checked={currentPermissions.bens?.excluir ?? false}
                        onChange={() => togglePermission('bens', 'excluir')}
                        className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                {/* MODULE 6: ORÇAMENTOS & CONTATOS */}
                <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Portal & Solicitações de Orçamento
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                    <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 cursor-pointer hover:border-slate-300">
                      <span>Ver Todas Solicitações</span>
                      <input
                        type="checkbox"
                        checked={currentPermissions.orcamentos?.verTodos ?? true}
                        onChange={() => togglePermission('orcamentos', 'verTodos')}
                        className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                      />
                    </label>
                    <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 cursor-pointer hover:border-slate-300">
                      <span>Responder Orçamentos</span>
                      <input
                        type="checkbox"
                        checked={currentPermissions.orcamentos?.responder ?? true}
                        onChange={() => togglePermission('orcamentos', 'responder')}
                        className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                      />
                    </label>
                    <label className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 cursor-pointer hover:border-slate-300">
                      <span>Ver E-mails de Contato</span>
                      <input
                        type="checkbox"
                        checked={currentPermissions.orcamentos?.verEmails ?? true}
                        onChange={() => togglePermission('orcamentos', 'verEmails')}
                        className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                {/* Save Bar */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    {savedSuccess && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 animate-in fade-in">
                        <CheckCircle2 className="w-4 h-4" />
                        Permissões salvas no Firestore com sucesso!
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleSavePermissions}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{isSaving ? 'Salvando...' : 'Salvar Alterações de Permissão'}</span>
                  </button>
                </div>

              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400">
                <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-semibold">Selecione um usuário na coluna lateral para gerenciar suas permissões.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: CONFIGURAÇÃO DE CAMPOS E VISIBILIDADE */}
      {activeTab === 'campos' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Controle de Visibilidade & Obrigatoriedade de Campos
              </h3>
              <p className="text-xs text-slate-500">
                Oculte campos dispensáveis para simplificar formulários ou defina campos que devem ser obrigatórios na clínica.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSaveFieldsConfig}
              disabled={isSavingFields}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSavingFields ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSavingFields ? 'Salvando...' : 'Salvar Configuração de Telas'}</span>
            </button>
          </div>

          {savedFieldsSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Configurações de campos atualizadas no banco de dados com sucesso!</span>
            </div>
          )}

          {/* Group fields by category */}
          {['Clientes', 'Procedimentos', 'Estoque', 'Agenda'].map(category => {
            const categoryFields = SYSTEM_FIELDS.filter(f => f.category === category);

            return (
              <div key={category} className="p-5 rounded-xl bg-slate-50/70 border border-slate-200 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Formulários de {category}
                  </h4>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categoryFields.map(field => {
                    const isHidden = hiddenFields.includes(field.id);
                    const isMandatory = mandatoryFields.includes(field.id);

                    return (
                      <div
                        key={field.id}
                        className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                          isHidden 
                            ? 'bg-slate-100/80 border-slate-300 opacity-60' 
                            : 'bg-white border-slate-200 shadow-2xs'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            {field.label}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            ID: {field.id}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Toggle Mandatory */}
                          <button
                            type="button"
                            disabled={isHidden}
                            onClick={() => handleToggleFieldMandatory(field.id)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer ${
                              isMandatory
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                            title="Tornar campo obrigatório com asterisco"
                          >
                            {isMandatory ? '★ Obrigatório' : 'Opcional'}
                          </button>

                          {/* Toggle Visibility */}
                          <button
                            type="button"
                            onClick={() => handleToggleFieldHidden(field.id)}
                            className={`p-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                              isHidden
                                ? 'bg-slate-200 border-slate-300 text-slate-600'
                                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            }`}
                            title={isHidden ? 'Campo está oculto na interface' : 'Campo está visível'}
                          >
                            {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            <span className="text-[11px]">{isHidden ? 'Oculto' : 'Visível'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
