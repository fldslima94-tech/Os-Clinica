import React, { useState, useEffect } from 'react';
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
  Info,
  ArrowUp,
  ArrowDown,
  Edit3,
  RotateCcw,
  Plus,
  Trash2,
  Maximize2,
  Columns,
  Grid,
  Search,
  Check,
  X,
  Layers,
  LayoutGrid,
  User,
  Briefcase
} from 'lucide-react';
import { 
  UsuarioEquipe, 
  UserRole, 
  PermissoesCustomizadas, 
  ConfiguracaoCampos,
  CampoPersonalizado
} from '../types';
import { 
  salvarPermissoesUsuario, 
  salvarConfiguracaoCampos,
  isUserAdminTotal 
} from '../services/firebaseService';
import { 
  DEFAULT_SYSTEM_FIELDS, 
  SYSTEM_MODULES, 
  SystemFieldDefinition 
} from '../data/systemFields';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface PermissionsManagementViewProps {
  usuarios: UsuarioEquipe[];
  currentUser: UsuarioEquipe;
  configuracaoCampos: ConfiguracaoCampos;
  onUpdateUserPermissions: (userId: string, permissoes: PermissoesCustomizadas, role?: UserRole) => void;
  onUpdateFieldConfig: (config: ConfiguracaoCampos) => void;
  onDeleteUser?: (userId: string) => void;
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

export const PermissionsManagementView: React.FC<PermissionsManagementViewProps> = ({
  usuarios,
  currentUser,
  configuracaoCampos,
  onUpdateUserPermissions,
  onUpdateFieldConfig,
  onDeleteUser,
}) => {
  const [activeTab, setActiveTab] = useState<'permissoes' | 'campos'>('campos');
  const [selectedUser, setSelectedUser] = useState<UsuarioEquipe | null>(null);
  const [activePresetRole, setActivePresetRole] = useState<UserRole>('recepcao');
  const [customPerms, setCustomPerms] = useState<PermissoesCustomizadas>(
    DEFAULT_PRESETS.recepcao
  );
  const [userToDelete, setUserToDelete] = useState<UsuarioEquipe | null>(null);

  const isSuperAdmin = isUserAdminTotal(currentUser) || currentUser.role === 'admin_total' || currentUser.role === 'admin';

  // Field Customization state
  const [selectedModule, setSelectedModule] = useState<string>('Clientes');
  const [hiddenFields, setHiddenFields] = useState<string[]>(configuracaoCampos.camposOcultos || []);
  const [mandatoryFields, setMandatoryFields] = useState<string[]>(configuracaoCampos.camposObrigatorios || []);
  const [labelsCustomizados, setLabelsCustomizados] = useState<Record<string, string>>(configuracaoCampos.labelsCustomizados || {});
  const [ajudaCustomizada, setAjudaCustomizada] = useState<Record<string, string>>(configuracaoCampos.ajudaCustomizada || {});
  const [placeholdersCustomizados, setPlaceholdersCustomizados] = useState<Record<string, string>>(configuracaoCampos.placeholdersCustomizados || {});
  const [ordemCampos, setOrdemCampos] = useState<Record<string, string[]>>(configuracaoCampos.ordemCampos || {});
  const [larguraCampos, setLarguraCampos] = useState<Record<string, 'half' | 'full' | 'third'>>(configuracaoCampos.larguraCampos || {});
  const [camposPersonalizados, setCamposPersonalizados] = useState<CampoPersonalizado[]>(configuracaoCampos.camposPersonalizados || []);

  // Modal / Inline Edit states
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editLabelValue, setEditLabelValue] = useState('');
  const [editHelpValue, setEditHelpValue] = useState('');
  const [editPlaceholderValue, setEditPlaceholderValue] = useState('');

  // New Custom Field Modal
  const [isAddingCustomField, setIsAddingCustomField] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'number' | 'select' | 'date' | 'boolean' | 'textarea'>('text');
  const [newFieldOptions, setNewFieldOptions] = useState('');
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState('');
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [newFieldWidth, setNewFieldWidth] = useState<'half' | 'full' | 'third'>('half');

  // Preview Drawer
  const [showLivePreview, setShowLivePreview] = useState(false);

  // Feedback states
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isSavingFields, setIsSavingFields] = useState(false);
  const [savedUserSuccess, setSavedUserSuccess] = useState(false);
  const [savedFieldsSuccess, setSavedFieldsSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Sync state when props change
  useEffect(() => {
    setHiddenFields(configuracaoCampos.camposOcultos || []);
    setMandatoryFields(configuracaoCampos.camposObrigatorios || []);
    setLabelsCustomizados(configuracaoCampos.labelsCustomizados || {});
    setAjudaCustomizada(configuracaoCampos.ajudaCustomizada || {});
    setPlaceholdersCustomizados(configuracaoCampos.placeholdersCustomizados || {});
    setOrdemCampos(configuracaoCampos.ordemCampos || {});
    setLarguraCampos(configuracaoCampos.larguraCampos || {});
    setCamposPersonalizados(configuracaoCampos.camposPersonalizados || []);
  }, [configuracaoCampos]);

  // Load user permissions when selected
  useEffect(() => {
    if (selectedUser) {
      setActivePresetRole(selectedUser.role || 'recepcao');
      if (selectedUser.permissoesCustomizadas) {
        setCustomPerms(selectedUser.permissoesCustomizadas);
      } else if (DEFAULT_PRESETS[selectedUser.role]) {
        setCustomPerms(DEFAULT_PRESETS[selectedUser.role]);
      } else {
        setCustomPerms(DEFAULT_PRESETS.recepcao);
      }
    }
  }, [selectedUser]);

  const isAdminTotal = isUserAdminTotal(currentUser);

  if (!isAdminTotal) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-xs max-w-lg mx-auto my-12">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4 text-amber-600">
          <Lock className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">Acesso Restrito ao Super Admin Master</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          O Painel de Controle de Permissões e Customização Livre de Layout de Campos é restrito exclusivamente ao usuário com nível <strong>Super Admin Master (admin_total)</strong>.
        </p>
      </div>
    );
  }

  // Get current ordered fields for the selected module
  const getOrderedFieldsForModule = (moduleName: string) => {
    const defaultFields = DEFAULT_SYSTEM_FIELDS.filter(f => f.category === moduleName);
    const customFields = camposPersonalizados.filter(f => f.categoria === moduleName);

    const allCombined = [
      ...defaultFields.map(f => ({
        id: f.id,
        defaultLabel: f.defaultLabel,
        category: f.category,
        description: f.description,
        defaultRequired: f.defaultRequired,
        defaultWidth: f.defaultWidth || 'half',
        type: f.type || 'text',
        isCustom: false,
      })),
      ...customFields.map(f => ({
        id: f.id,
        defaultLabel: f.label,
        category: f.categoria,
        description: `Campo personalizado (${f.tipo})`,
        defaultRequired: f.obrigatorio,
        defaultWidth: f.largura || 'half',
        type: f.tipo,
        isCustom: true,
        opcoes: f.opcoes,
      }))
    ];

    const savedOrder = ordemCampos[moduleName];
    if (!savedOrder || savedOrder.length === 0) {
      return allCombined;
    }

    // Sort according to saved order, putting any unlisted fields at the end
    const sorted = [...allCombined].sort((a, b) => {
      const idxA = savedOrder.indexOf(a.id);
      const idxB = savedOrder.indexOf(b.id);
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });

    return sorted;
  };

  const activeModuleFields = getOrderedFieldsForModule(selectedModule);
  const filteredModuleFields = activeModuleFields.filter(f => {
    if (!f) return false;
    const label = labelsCustomizados[f.id] || f.defaultLabel || '';
    const term = (searchTerm || '').toLowerCase().trim();
    return !term || label.toLowerCase().includes(term) || (f.id || '').toLowerCase().includes(term);
  });

  // Reorder field up
  const handleMoveFieldUp = (index: number) => {
    if (index <= 0) return;
    const currentOrder = activeModuleFields.map(f => f.id);
    const temp = currentOrder[index];
    currentOrder[index] = currentOrder[index - 1];
    currentOrder[index - 1] = temp;

    setOrdemCampos(prev => ({
      ...prev,
      [selectedModule]: currentOrder
    }));
  };

  // Reorder field down
  const handleMoveFieldDown = (index: number) => {
    if (index >= activeModuleFields.length - 1) return;
    const currentOrder = activeModuleFields.map(f => f.id);
    const temp = currentOrder[index];
    currentOrder[index] = currentOrder[index + 1];
    currentOrder[index + 1] = temp;

    setOrdemCampos(prev => ({
      ...prev,
      [selectedModule]: currentOrder
    }));
  };

  // Toggle Visibility (Remove / Hide)
  const handleToggleFieldHidden = (fieldId: string) => {
    setHiddenFields(prev => 
      prev.includes(fieldId) ? prev.filter(id => id !== fieldId) : [...prev, fieldId]
    );
  };

  // Toggle Mandatory
  const handleToggleFieldMandatory = (fieldId: string) => {
    setMandatoryFields(prev => 
      prev.includes(fieldId) ? prev.filter(id => id !== fieldId) : [...prev, fieldId]
    );
  };

  // Open Rename / Edit Modal
  const handleStartRename = (field: any) => {
    setEditingFieldId(field.id);
    setEditLabelValue(labelsCustomizados[field.id] || field.defaultLabel);
    setEditHelpValue(ajudaCustomizada[field.id] || '');
    setEditPlaceholderValue(placeholdersCustomizados[field.id] || '');
  };

  // Save Rename / Custom Properties
  const handleSaveRename = () => {
    if (!editingFieldId) return;

    setLabelsCustomizados(prev => {
      const copy = { ...prev };
      if (editLabelValue.trim()) {
        copy[editingFieldId] = editLabelValue.trim();
      } else {
        delete copy[editingFieldId];
      }
      return copy;
    });

    setAjudaCustomizada(prev => {
      const copy = { ...prev };
      if (editHelpValue.trim()) {
        copy[editingFieldId] = editHelpValue.trim();
      } else {
        delete copy[editingFieldId];
      }
      return copy;
    });

    setPlaceholdersCustomizados(prev => {
      const copy = { ...prev };
      if (editPlaceholderValue.trim()) {
        copy[editingFieldId] = editPlaceholderValue.trim();
      } else {
        delete copy[editingFieldId];
      }
      return copy;
    });

    setEditingFieldId(null);
  };

  // Change Field Width
  const handleChangeFieldWidth = (fieldId: string, width: 'half' | 'full' | 'third') => {
    setLarguraCampos(prev => ({
      ...prev,
      [fieldId]: width
    }));
  };

  // Reset Individual Field to Default
  const handleResetIndividualField = (fieldId: string) => {
    setLabelsCustomizados(prev => {
      const copy = { ...prev };
      delete copy[fieldId];
      return copy;
    });
    setAjudaCustomizada(prev => {
      const copy = { ...prev };
      delete copy[fieldId];
      return copy;
    });
    setPlaceholdersCustomizados(prev => {
      const copy = { ...prev };
      delete copy[fieldId];
      return copy;
    });
    setHiddenFields(prev => prev.filter(id => id !== fieldId));
    setMandatoryFields(prev => prev.filter(id => id !== fieldId));
    setLarguraCampos(prev => {
      const copy = { ...prev };
      delete copy[fieldId];
      return copy;
    });
  };

  // Reset entire module / section to defaults
  const handleResetSection = () => {
    if (!confirm(`Deseja realmente redefinir todos os campos da seção "${selectedModule}" para os padrões originais de fábrica?`)) {
      return;
    }

    const defaultFields = DEFAULT_SYSTEM_FIELDS.filter(f => f.category === selectedModule).map(f => f.id);

    setHiddenFields(prev => prev.filter(id => !defaultFields.includes(id)));
    setMandatoryFields(prev => prev.filter(id => !defaultFields.includes(id)));

    setLabelsCustomizados(prev => {
      const copy = { ...prev };
      defaultFields.forEach(id => delete copy[id]);
      return copy;
    });

    setAjudaCustomizada(prev => {
      const copy = { ...prev };
      defaultFields.forEach(id => delete copy[id]);
      return copy;
    });

    setPlaceholdersCustomizados(prev => {
      const copy = { ...prev };
      defaultFields.forEach(id => delete copy[id]);
      return copy;
    });

    setLarguraCampos(prev => {
      const copy = { ...prev };
      defaultFields.forEach(id => delete copy[id]);
      return copy;
    });

    setOrdemCampos(prev => {
      const copy = { ...prev };
      delete copy[selectedModule];
      return copy;
    });
  };

  // Reset all application layout to factory defaults
  const handleResetAllToFactory = () => {
    if (!confirm('ATENÇÃO: Deseja realmente redefinir TODOS os campos, formulários e layouts de toda a clínica para o Padrão de Fábrica?')) {
      return;
    }

    setHiddenFields([]);
    setMandatoryFields([]);
    setLabelsCustomizados({});
    setAjudaCustomizada({});
    setPlaceholdersCustomizados({});
    setOrdemCampos({});
    setLarguraCampos({});
    setCamposPersonalizados([]);
  };

  // Add new Custom Field
  const handleCreateCustomField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldName.trim()) return;

    const newId = `custom_${selectedModule.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newField: CampoPersonalizado = {
      id: newId,
      categoria: selectedModule,
      label: newFieldName.trim(),
      tipo: newFieldType,
      opcoes: newFieldType === 'select' ? newFieldOptions.split(',').map(s => s.trim()).filter(Boolean) : undefined,
      placeholder: newFieldPlaceholder.trim() || undefined,
      obrigatorio: newFieldRequired,
      largura: newFieldWidth,
      criadoEm: new Date().toISOString(),
    };

    setCamposPersonalizados(prev => [...prev, newField]);

    if (newFieldRequired) {
      setMandatoryFields(prev => [...prev, newId]);
    }

    // Add to order
    const currentOrder = activeModuleFields.map(f => f.id);
    setOrdemCampos(prev => ({
      ...prev,
      [selectedModule]: [...currentOrder, newId]
    }));

    // Reset modal
    setNewFieldName('');
    setNewFieldType('text');
    setNewFieldOptions('');
    setNewFieldPlaceholder('');
    setNewFieldRequired(false);
    setNewFieldWidth('half');
    setIsAddingCustomField(false);
  };

  // Delete custom field
  const handleDeleteCustomField = (fieldId: string) => {
    if (!confirm('Deseja realmente remover este campo personalizado do formulário?')) return;
    setCamposPersonalizados(prev => prev.filter(f => f.id !== fieldId));
    setHiddenFields(prev => prev.filter(id => id !== fieldId));
    setMandatoryFields(prev => prev.filter(id => id !== fieldId));
    setOrdemCampos(prev => {
      const copy = { ...prev };
      if (copy[selectedModule]) {
        copy[selectedModule] = copy[selectedModule].filter(id => id !== fieldId);
      }
      return copy;
    });
  };

  // Save all fields configuration to Firestore
  const handleSaveFieldsConfig = async () => {
    setIsSavingFields(true);
    setSavedFieldsSuccess(false);

    const updatedConfig: ConfiguracaoCampos = {
      ...configuracaoCampos,
      clinicaId: configuracaoCampos.clinicaId || 'config_matriz',
      camposOcultos: hiddenFields,
      camposObrigatorios: mandatoryFields,
      labelsCustomizados,
      ajudaCustomizada,
      placeholdersCustomizados,
      ordemCampos,
      larguraCampos,
      camposPersonalizados,
      atualizadoPor: currentUser.nome || currentUser.email || 'Super Admin',
      atualizadoEm: new Date().toISOString(),
    };

    const res = await salvarConfiguracaoCampos(configuracaoCampos.clinicaId || 'config_matriz', updatedConfig);
    setIsSavingFields(false);

    if (res.success) {
      setSavedFieldsSuccess(true);
      onUpdateFieldConfig(updatedConfig);
      setTimeout(() => setSavedFieldsSuccess(false), 4000);
    } else {
      alert(`Erro ao salvar configuração: ${res.error}`);
    }
  };

  // Save User Permissions
  const handleSaveUserPermissions = async () => {
    if (!selectedUser) return;
    setIsSavingUser(true);
    setSavedUserSuccess(false);

    const res = await salvarPermissoesUsuario(selectedUser.id, customPerms, activePresetRole);
    setIsSavingUser(false);

    if (res.success) {
      setSavedUserSuccess(true);
      onUpdateUserPermissions(selectedUser.id, customPerms, activePresetRole);
      setTimeout(() => setSavedUserSuccess(false), 3000);
    } else {
      alert(`Erro ao salvar permissões: ${res.error}`);
    }
  };

  const getModuleIcon = (iconName: string) => {
    switch (iconName) {
      case 'User': return <User className="w-4 h-4" />;
      case 'FileText': return <FileText className="w-4 h-4" />;
      case 'Calendar': return <Calendar className="w-4 h-4" />;
      case 'Sparkles': return <Sparkles className="w-4 h-4" />;
      case 'Package': return <Package className="w-4 h-4" />;
      case 'Building': return <Building className="w-4 h-4" />;
      case 'Briefcase': return <Briefcase className="w-4 h-4" />;
      case 'DollarSign': return <DollarSign className="w-4 h-4" />;
      default: return <Sliders className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-150">
      
      {/* Header Master */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shadow-inner">
            <Sliders className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-tight text-white">
                Painel Master: Layout de Telas & Permissões
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 border border-amber-400">
                Super Admin
              </span>
            </div>
            <p className="text-xs text-indigo-200 font-medium mt-0.5">
              Personalização irrestrita de campos: remova, renomeie, redefina e reorganize a disposição dos formulários da clínica.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/80 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('campos')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'campos'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Layout & Campos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('permissoes')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'permissoes'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Matriz de Permissões</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: GESTOR DE LAYOUT, CAMPOS, NOMES, ORDEM & LARGURAS */}
      {/* ======================================================== */}
      {activeTab === 'campos' && (
        <div className="space-y-6">

          {/* Module Selector Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                Selecione o Módulo / Tela para Personalizar o Layout:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowLivePreview(!showLivePreview)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                    showLivePreview 
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{showLivePreview ? 'Ocultar Prévia ao Vivo' : 'Ver Prévia ao Vivo'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {SYSTEM_MODULES.map(module => {
                const isSelected = selectedModule === module.id;
                const fieldsCount = getOrderedFieldsForModule(module.id).length;
                const hiddenCount = getOrderedFieldsForModule(module.id).filter(f => hiddenFields.includes(f.id)).length;

                return (
                  <button
                    key={module.id}
                    type="button"
                    onClick={() => setSelectedModule(module.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-500/20'
                        : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-white/20 text-white' : 'bg-white border border-slate-200 text-indigo-600'}`}>
                        {getModuleIcon(module.icon)}
                      </div>
                      {hiddenCount > 0 && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-amber-400 text-slate-950' : 'bg-amber-100 text-amber-800'}`}>
                          {hiddenCount} oculto{hiddenCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold truncate">{module.id}</h4>
                      <p className={`text-[10px] truncate ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                        {fieldsCount} campos
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Toolbar & Search */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={`Pesquisar campos em ${selectedModule}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Quick Actions Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddingCustomField(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Campo Extra</span>
              </button>

              <button
                type="button"
                onClick={handleResetSection}
                title="Restaura nomes, ordem e visibilidade desta tela"
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Redefinir Seção</span>
              </button>

              <button
                type="button"
                onClick={handleResetAllToFactory}
                title="Restaura todas as telas do sistema para o padrão de fábrica"
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border border-rose-200"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Padrão de Fábrica</span>
              </button>

              <button
                type="button"
                onClick={handleSaveFieldsConfig}
                disabled={isSavingFields}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSavingFields ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{isSavingFields ? 'Gravando Layout...' : 'Salvar Alterações de Layout'}</span>
              </button>
            </div>

          </div>

          {/* Success Banner */}
          {savedFieldsSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center justify-between gap-3 animate-in fade-in shadow-xs">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  Layout e configurações de campos salvos com sucesso! Todas as alterações de nomes, ordem, visibilidade e novos campos já estão ativas em toda a clínica.
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 font-bold uppercase">
                Sincronizado
              </span>
            </div>
          )}

          {/* Live Preview Panel (if enabled) */}
          {showLivePreview && (
            <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4 animate-in slide-in-from-top-4 duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                    Prévia em Tempo Real da Tela: {selectedModule}
                  </h4>
                </div>
                <span className="text-[11px] text-slate-400">
                  Mostra como o formulário ficará para a equipe com a ordem, renomeações e larguras ativas
                </span>
              </div>

              <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeModuleFields.filter(f => !hiddenFields.includes(f.id)).map((field, idx) => {
                    const activeLabel = labelsCustomizados[field.id] || field.defaultLabel;
                    const isMandatory = mandatoryFields.includes(field.id) || field.defaultRequired;
                    const customWidth = larguraCampos[field.id] || field.defaultWidth;
                    const placeholder = placeholdersCustomizados[field.id] || `Exemplo de preenchimento para ${activeLabel}...`;
                    const help = ajudaCustomizada[field.id];

                    const widthCol = customWidth === 'full' ? 'sm:col-span-2' : 'sm:col-span-1';

                    return (
                      <div key={field.id} className={`${widthCol} space-y-1.5`}>
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-200 flex items-center gap-1">
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-indigo-400 font-mono">
                              {idx + 1}º
                            </span>
                            <span>{activeLabel}</span>
                            {isMandatory && <span className="text-rose-400 font-bold">*</span>}
                          </label>
                          {customWidth === 'full' && (
                            <span className="text-[10px] text-slate-500 font-mono">100% Linha</span>
                          )}
                        </div>

                        {field.type === 'textarea' ? (
                          <textarea
                            disabled
                            placeholder={placeholder}
                            rows={2}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300 placeholder-slate-600 resize-none opacity-80"
                          />
                        ) : (
                          <input
                            type="text"
                            disabled
                            placeholder={placeholder}
                            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300 placeholder-slate-600 opacity-80"
                          />
                        )}

                        {help && <p className="text-[10px] text-indigo-300">{help}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Fields Management List */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Campos Configurados para: <strong>{selectedModule}</strong></span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {filteredModuleFields.length} campos
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Use os botões de seta para <strong>reorganizar a ordem</strong>, clique no lápis para <strong>renomear rótulos</strong>, alterne a <strong>visibilidade</strong> e ajuste a <strong>largura no grid</strong>.
                </p>
              </div>
            </div>

            {filteredModuleFields.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500">
                <p className="text-xs font-semibold">Nenhum campo encontrado para os termos da busca.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredModuleFields.map((field, index) => {
                  const isHidden = hiddenFields.includes(field.id);
                  const isMandatory = mandatoryFields.includes(field.id) || field.defaultRequired;
                  const isRenamed = Boolean(labelsCustomizados[field.id]);
                  const activeLabel = labelsCustomizados[field.id] || field.defaultLabel;
                  const currentWidth = larguraCampos[field.id] || field.defaultWidth || 'half';
                  const isEditingThis = editingFieldId === field.id;

                  return (
                    <div
                      key={field.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isHidden
                          ? 'bg-slate-100/70 border-slate-300 opacity-60'
                          : isRenamed
                            ? 'bg-indigo-50/30 border-indigo-200 shadow-2xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      {/* View Row */}
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        
                        {/* Left: Order, Info & Badges */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          
                          {/* Position Badge & Reorder Arrows */}
                          <div className="flex items-center gap-1 shrink-0 bg-slate-100 p-1 rounded-lg border border-slate-200">
                            <span className="w-7 text-center text-xs font-black text-slate-700">
                              {index + 1}º
                            </span>
                            <div className="flex flex-col gap-0.5">
                              <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => handleMoveFieldUp(index)}
                                className="p-1 rounded hover:bg-white text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                                title="Mover para cima no formulário"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={index === filteredModuleFields.length - 1}
                                onClick={() => handleMoveFieldDown(index)}
                                className="p-1 rounded hover:bg-white text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                                title="Mover para baixo no formulário"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Field Names & Description */}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                {activeLabel}
                              </h4>

                              {isRenamed && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                                  <Edit3 className="w-2.5 h-2.5" />
                                  Original: {field.defaultLabel}
                                </span>
                              )}

                              {field.isCustom && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  Personalizado
                                </span>
                              )}

                              <span className="text-[10px] text-slate-400 font-mono">
                                ID: {field.id}
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                              {field.description}
                              {ajudaCustomizada[field.id] && (
                                <span className="text-indigo-600 font-semibold ml-1.5">
                                  • Ajuda: "{ajudaCustomizada[field.id]}"
                                </span>
                              )}
                              {placeholdersCustomizados[field.id] && (
                                <span className="text-slate-400 ml-1.5">
                                  • Placeholder: "{placeholdersCustomizados[field.id]}"
                                </span>
                              )}
                            </p>
                          </div>

                        </div>

                        {/* Right: Controls & Toggles */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          
                          {/* Width Selector */}
                          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
                            <button
                              type="button"
                              onClick={() => handleChangeFieldWidth(field.id, 'half')}
                              className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                                currentWidth === 'half' ? 'bg-white text-indigo-700 shadow-2xs font-black' : 'text-slate-500 hover:text-slate-800'
                              }`}
                              title="Largura: 50% (Meia Coluna)"
                            >
                              50%
                            </button>
                            <button
                              type="button"
                              onClick={() => handleChangeFieldWidth(field.id, 'full')}
                              className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                                currentWidth === 'full' ? 'bg-white text-indigo-700 shadow-2xs font-black' : 'text-slate-500 hover:text-slate-800'
                              }`}
                              title="Largura: 100% (Linha Inteira)"
                            >
                              100%
                            </button>
                          </div>

                          {/* Rename Button */}
                          <button
                            type="button"
                            onClick={() => handleStartRename(field)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                            title="Renomear rótulo e personalizar textos"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Renomear</span>
                          </button>

                          {/* Toggle Mandatory */}
                          <button
                            type="button"
                            disabled={isHidden}
                            onClick={() => handleToggleFieldMandatory(field.id)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                              isMandatory
                                ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-2xs'
                                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                            }`}
                            title="Tornar campo obrigatório no preenchimento"
                          >
                            {isMandatory ? '★ Obrigatório' : 'Opcional'}
                          </button>

                          {/* Toggle Visibility (Remove / Hide) */}
                          <button
                            type="button"
                            onClick={() => handleToggleFieldHidden(field.id)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                              isHidden
                                ? 'bg-slate-200 border-slate-300 text-slate-700 shadow-inner'
                                : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 shadow-2xs'
                            }`}
                            title={isHidden ? 'Campo está oculto/removido do layout' : 'Campo está visível no layout'}
                          >
                            {isHidden ? <EyeOff className="w-3.5 h-3.5 text-slate-600" /> : <Eye className="w-3.5 h-3.5 text-emerald-600" />}
                            <span>{isHidden ? 'Oculto' : 'Visível'}</span>
                          </button>

                          {/* Reset Individual Button */}
                          {(isRenamed || isHidden || isMandatory !== field.defaultRequired || currentWidth !== field.defaultWidth) && !field.isCustom && (
                            <button
                              type="button"
                              onClick={() => handleResetIndividualField(field.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Redefinir este campo para o padrão original"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete if Custom Field */}
                          {field.isCustom && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomField(field.id)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                              title="Excluir este campo personalizado"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                        </div>

                      </div>

                      {/* Inline Rename Form if currently editing */}
                      {isEditingThis && (
                        <div className="mt-4 pt-3.5 border-t border-indigo-100 bg-indigo-50/50 p-4 rounded-xl space-y-3 animate-in fade-in">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                              <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                              Personalizar Rótulo & Textos do Campo
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              Padrão: {field.defaultLabel}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Rótulo do Campo (Label)
                              </label>
                              <input
                                type="text"
                                value={editLabelValue}
                                onChange={(e) => setEditLabelValue(e.target.value)}
                                placeholder={field.defaultLabel}
                                className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Texto de Placeholder (Exemplo)
                              </label>
                              <input
                                type="text"
                                value={editPlaceholderValue}
                                onChange={(e) => setEditPlaceholderValue(e.target.value)}
                                placeholder="Ex: Digite o valor..."
                                className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                Texto de Ajuda / Subtítulo
                              </label>
                              <input
                                type="text"
                                value={editHelpValue}
                                onChange={(e) => setEditHelpValue(e.target.value)}
                                placeholder="Orientações adicionais..."
                                className="w-full px-3 py-1.5 bg-white border border-indigo-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingFieldId(null)}
                              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveRename}
                              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Aplicar Renomeação</span>
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: MATRIZ DE PERMISSÕES POR USUÁRIO / CARGO */}
      {/* ======================================================== */}
      {activeTab === 'permissoes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column: User Selection */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                Usuários da Clínica ({usuarios.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Selecione um colaborador para inspecionar ou ajustar privilégios
              </p>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {usuarios.map(u => {
                const isSelected = selectedUser?.id === u.id;
                const isUserSuperAdmin = isUserAdminTotal(u);

                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setSelectedUser(u)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isUserSuperAdmin 
                          ? 'bg-amber-500 text-slate-950 font-black ring-2 ring-amber-300' 
                          : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {u.nome ? u.nome.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {u.nome || u.email}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate">{u.email}</p>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                      isUserSuperAdmin
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : u.role === 'admin_local'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-slate-200 text-slate-700'
                    }`}>
                      {u.role || 'recepcao'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Permissions Matrix Editor */}
          <div className="lg:col-span-2 space-y-4">
            {selectedUser ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
                
                {/* User Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                      {selectedUser.nome ? selectedUser.nome.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        {selectedUser.nome || selectedUser.email}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Configurando permissões do usuário • Nível Atual: <strong>{activePresetRole}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {onDeleteUser && isSuperAdmin && selectedUser.id !== currentUser.id && (
                      <button
                        type="button"
                        onClick={() => setUserToDelete(selectedUser)}
                        className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        title="Excluir usuário do sistema (Super Admin)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Excluir Usuário</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleSaveUserPermissions}
                      disabled={isSavingUser}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSavingUser ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>{isSavingUser ? 'Gravando...' : 'Salvar Permissões do Usuário'}</span>
                    </button>
                  </div>
                </div>

                {savedUserSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Permissões do usuário gravadas com sucesso no Firestore!</span>
                  </div>
                )}

                {/* Role Preset Selector */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Cargo / Modelo de Permissões Rápido:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['admin_local', 'profissional', 'recepcao', 'cliente'] as UserRole[]).map(role => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => {
                          setActivePresetRole(role);
                          if (DEFAULT_PRESETS[role]) {
                            setCustomPerms(DEFAULT_PRESETS[role]);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          activePresetRole === role
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {role === 'admin_local' && 'Admin Local (Gestor)'}
                        {role === 'profissional' && 'Profissional Clínico'}
                        {role === 'recepcao' && 'Recepção / Atendimento'}
                        {role === 'cliente' && 'Acesso Cliente'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Granular Permissions Table */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Matriz Detalhada de Ações por Módulo:
                  </h4>

                  {/* Modules grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Financeiro */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                        <DollarSign className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold text-slate-900">Módulo Financeiro</span>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(customPerms.financeiro?.verEntradas)}
                            onChange={(e) => setCustomPerms(prev => ({ ...prev, financeiro: { ...prev.financeiro, verEntradas: e.target.checked } }))}
                            className="rounded text-indigo-600"
                          />
                          <span>Ver Entradas / Faturamento</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(customPerms.financeiro?.verSaidas)}
                            onChange={(e) => setCustomPerms(prev => ({ ...prev, financeiro: { ...prev.financeiro, verSaidas: e.target.checked } }))}
                            className="rounded text-indigo-600"
                          />
                          <span>Ver Despesas / Saídas</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(customPerms.financeiro?.verRelatorios)}
                            onChange={(e) => setCustomPerms(prev => ({ ...prev, financeiro: { ...prev.financeiro, verRelatorios: e.target.checked } }))}
                            className="rounded text-indigo-600"
                          />
                          <span>Ver Relatórios e DRE</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-rose-700 font-semibold">
                          <input
                            type="checkbox"
                            checked={Boolean(customPerms.financeiro?.excluir)}
                            onChange={(e) => setCustomPerms(prev => ({ ...prev, financeiro: { ...prev.financeiro, excluir: e.target.checked } }))}
                            className="rounded text-rose-600"
                          />
                          <span>Permitir Excluir Lançamentos</span>
                        </label>
                      </div>
                    </div>

                    {/* Clientes */}
                    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                        <User className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-bold text-slate-900">Fichas & Clientes</span>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(customPerms.clientes?.criar)}
                            onChange={(e) => setCustomPerms(prev => ({ ...prev, clientes: { ...prev.clientes, criar: e.target.checked } }))}
                            className="rounded text-indigo-600"
                          />
                          <span>Cadastrar Novos Clientes</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(customPerms.clientes?.editar)}
                            onChange={(e) => setCustomPerms(prev => ({ ...prev, clientes: { ...prev.clientes, editar: e.target.checked } }))}
                            className="rounded text-indigo-600"
                          />
                          <span>Editar Fichas e Dados</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(customPerms.clientes?.preencherAnamnese)}
                            onChange={(e) => setCustomPerms(prev => ({ ...prev, clientes: { ...prev.clientes, preencherAnamnese: e.target.checked } }))}
                            className="rounded text-indigo-600"
                          />
                          <span>Preencher Anamnese & Evoluções</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-rose-700 font-semibold">
                          <input
                            type="checkbox"
                            checked={Boolean(customPerms.clientes?.excluir)}
                            onChange={(e) => setCustomPerms(prev => ({ ...prev, clientes: { ...prev.clientes, excluir: e.target.checked } }))}
                            className="rounded text-rose-600"
                          />
                          <span>Excluir Clientes</span>
                        </label>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-xs text-slate-400">
                <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-semibold">Selecione um usuário na coluna lateral para gerenciar suas permissões.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CRIAR CAMPO PERSONALIZADO */}
      {/* ======================================================== */}
      {isAddingCustomField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Plus className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm sm:text-base font-bold">Criar Novo Campo Personalizado</h3>
                  <p className="text-xs text-slate-400">Adicionar à tela de {selectedModule}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingCustomField(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomField} className="p-6 space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Nome / Rótulo do Campo *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ex: Indicação / Como conheceu, Redes Sociais, Altura, etc."
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Tipo de Dado
                  </label>
                  <select
                    value={newFieldType}
                    onChange={(e) => setNewFieldType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold cursor-pointer"
                  >
                    <option value="text">Texto Curto</option>
                    <option value="textarea">Texto Longo (Área de Texto)</option>
                    <option value="number">Número</option>
                    <option value="date">Data</option>
                    <option value="select">Seleção de Opções (Dropdown)</option>
                    <option value="boolean">Sim / Não (Caixa de Seleção)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Largura no Grid
                  </label>
                  <select
                    value={newFieldWidth}
                    onChange={(e) => setNewFieldWidth(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold cursor-pointer"
                  >
                    <option value="half">50% (Meia Coluna)</option>
                    <option value="full">100% (Linha Inteira)</option>
                  </select>
                </div>
              </div>

              {newFieldType === 'select' && (
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Opções da Lista (separadas por vírgula)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Opção 1, Opção 2, Opção 3"
                    value={newFieldOptions}
                    onChange={(e) => setNewFieldOptions(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Exemplo de Preenchimento (Placeholder)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Digite aqui..."
                  value={newFieldPlaceholder}
                  onChange={(e) => setNewFieldPlaceholder(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 text-xs">
                  <input
                    type="checkbox"
                    checked={newFieldRequired}
                    onChange={(e) => setNewFieldRequired(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Tornar este campo obrigatório no preenchimento</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingCustomField(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors cursor-pointer text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Criar Campo na Tela</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal for Super Admin */}
      {userToDelete && (
        <DeleteConfirmModal
          isOpen={!!userToDelete}
          onClose={() => setUserToDelete(null)}
          onConfirm={() => {
            if (userToDelete && onDeleteUser) {
              onDeleteUser(userToDelete.id);
              if (selectedUser?.id === userToDelete.id) {
                setSelectedUser(null);
              }
            }
            setUserToDelete(null);
          }}
          title="Excluir Usuário com Acesso ao Sistema"
          itemType="Usuário do Sistema"
          itemName={`${userToDelete.nome || userToDelete.email} (${userToDelete.email}) - Cargo: ${userToDelete.cargo || userToDelete.role}`}
          description={`Tem certeza que deseja excluir o usuário "${userToDelete.nome || userToDelete.email}"? Esta ação revogará permanentemente o login (${userToDelete.email}) e removerá todos os privilégios de acesso ao sistema.`}
        />
      )}

    </div>
  );
};
