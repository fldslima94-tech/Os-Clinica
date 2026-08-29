import React, { useState, useEffect, useMemo } from 'react';
import {
  Database,
  Search,
  Plus,
  Trash2,
  Edit3,
  RefreshCw,
  FolderTree,
  FileText,
  Calendar,
  Layers,
  Package,
  DollarSign,
  Users,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  X,
  Save,
  Tag,
  History,
  Clock,
  User,
  Filter,
  Eye,
  Lock,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import {
  UsuarioEquipe,
  Paciente,
  Agendamento,
  Procedimento,
  ItemEstoque,
  LancamentoFinanceiro,
  Fornecedor,
  AtivoPatrimonial,
  AvisoMural,
  ClinicaConfig,
  PlanoTratamento
} from '../types';
import {
  COLLECTIONS,
  deleteRecordMaster,
  updateRecordMaster,
  createRecordMaster,
  batchRenameCategory,
  batchDeleteCategory,
  deletePatientClinicalHistoryItem,
  wipeDatabaseAndResetToProduction
} from '../services/firebaseService';

interface DatabaseMasterViewProps {
  currentUser: UsuarioEquipe;
  pacientes: Paciente[];
  agendamentos: Agendamento[];
  procedimentos: Procedimento[];
  estoque: ItemEstoque[];
  financeiro: LancamentoFinanceiro[];
  fornecedores: Fornecedor[];
  ativos: AtivoPatrimonial[];
  avisos: AvisoMural[];
  usuarios: UsuarioEquipe[];
  clinicaConfig: ClinicaConfig;
  onRefreshData?: () => void;
  onUpdatePaciente?: (p: Paciente) => void;
}

type MasterCollectionType =
  | 'agendamentos'
  | 'procedimentos'
  | 'categorias'
  | 'historicos_clinicos'
  | 'estoque'
  | 'financeiro'
  | 'pacientes'
  | 'fornecedores'
  | 'ativos'
  | 'avisos'
  | 'usuarios';

export const DatabaseMasterView: React.FC<DatabaseMasterViewProps> = ({
  currentUser,
  pacientes,
  agendamentos,
  procedimentos,
  estoque,
  financeiro,
  fornecedores,
  ativos,
  avisos,
  usuarios,
  clinicaConfig,
  onRefreshData,
  onUpdatePaciente,
}) => {
  const [activeCollection, setActiveCollection] = useState<MasterCollectionType>('agendamentos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  
  // Feedback e Loading
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Modais de Ação Master
  const [editModalItem, setEditModalItem] = useState<{ collection: string; data: any } | null>(null);
  const [createModalCollection, setCreateModalCollection] = useState<string | null>(null);
  const [createFormData, setCreateFormData] = useState<any>({});
  
  // Modal de Exclusão com Confirmação Total
  const [deleteConfirm, setDeleteConfirm] = useState<{
    collection: string;
    id: string;
    title: string;
    subtitle?: string;
    onConfirm: () => Promise<void>;
  } | null>(null);

  // Gerenciamento de Categorias em Lote
  const [categoryModal, setCategoryModal] = useState<{
    type: 'rename' | 'delete' | 'add';
    collection: 'procedimentos' | 'estoque' | 'financeiro';
    categoryName?: string;
  } | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [fallbackCategoryName, setFallbackCategoryName] = useState('Geral');

  // Seleção de Paciente para Auditoria de Históricos Clínicos
  const [selectedPatientId, setSelectedPatientId] = useState<string>(pacientes[0]?.id || '');

  // Modal de Limpeza Total / Reset de Produção
  const [isWipeModalOpen, setIsWipeModalOpen] = useState(false);
  const [wipeConfirmInput, setWipeConfirmInput] = useState('');

  const showStatus = (type: 'success' | 'error' | 'info', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleWipeDatabase = async () => {
    if (wipeConfirmInput.trim().toUpperCase() !== 'LIMPAR') {
      showStatus('error', 'Digite exatamente a palavra "LIMPAR" para autorizar a remoção total.');
      return;
    }

    try {
      setIsProcessing(true);
      const res = await wipeDatabaseAndResetToProduction();
      setIsWipeModalOpen(false);
      setWipeConfirmInput('');
      if (res.success) {
        showStatus('success', 'Banco limpo com sucesso! Mocks removidos e Super Admin preservado para produção.');
        if (onRefreshData) onRefreshData();
      } else {
        showStatus('error', `Falha na limpeza do banco: ${res.message}`);
      }
    } catch (err: any) {
      showStatus('error', `Erro ao limpar banco: ${err?.message || 'Falha desconhecida'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Categorias únicas por coleção
  const procedureCategories = useMemo(() => {
    const cats = new Set<string>();
    procedimentos.forEach(p => { if (p.categoria) cats.add(p.categoria); });
    return Array.from(cats);
  }, [procedimentos]);

  const estoqueCategories = useMemo(() => {
    const cats = new Set<string>();
    estoque.forEach(e => { if (e.categoria) cats.add(e.categoria); });
    return Array.from(cats);
  }, [estoque]);

  const financialCategories = useMemo(() => {
    const cats = new Set<string>();
    financeiro.forEach(f => { if (f.categoria) cats.add(f.categoria); });
    return Array.from(cats);
  }, [financeiro]);

  // Paciente selecionado para inspeção e exclusão de históricos
  const currentPatient = useMemo(() => {
    return pacientes.find(p => p.id === selectedPatientId) || pacientes[0];
  }, [pacientes, selectedPatientId]);

  // Filtragem de Agendamentos
  const filteredAgendamentos = useMemo(() => {
    return agendamentos.filter(a => {
      const matchSearch =
        a.paciente_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.procedimento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.profissional_nome?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = selectedCategoryFilter === 'ALL' || a.status === selectedCategoryFilter;
      return matchSearch && matchCat;
    });
  }, [agendamentos, searchTerm, selectedCategoryFilter]);

  // Filtragem de Procedimentos
  const filteredProcedimentos = useMemo(() => {
    return procedimentos.filter(p => {
      const matchSearch =
        p.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.categoria?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = selectedCategoryFilter === 'ALL' || p.categoria === selectedCategoryFilter;
      return matchSearch && matchCat;
    });
  }, [procedimentos, searchTerm, selectedCategoryFilter]);

  // Filtragem de Estoque
  const filteredEstoque = useMemo(() => {
    return estoque.filter(e => {
      const matchSearch =
        e.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.categoria?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.id?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = selectedCategoryFilter === 'ALL' || e.categoria === selectedCategoryFilter;
      return matchSearch && matchCat;
    });
  }, [estoque, searchTerm, selectedCategoryFilter]);

  // Filtragem de Financeiro
  const filteredFinanceiro = useMemo(() => {
    return financeiro.filter((f: any) => {
      if (!f) return false;
      const desc = (f.descricao || f.procedimento || f.motivo || f.observacao || '').toLowerCase();
      const cat = (f.categoria || '').toLowerCase();
      const pac = (f.paciente_nome || f.paciente || f.nome_paciente || f.fornecedor || '').toLowerCase();
      const id = (f.id || '').toLowerCase();
      const query = (searchTerm || '').toLowerCase();

      const matchSearch = !query || desc.includes(query) || cat.includes(query) || pac.includes(query) || id.includes(query);
      const matchCat = selectedCategoryFilter === 'ALL' || f.categoria === selectedCategoryFilter;
      return matchSearch && matchCat;
    });
  }, [financeiro, searchTerm, selectedCategoryFilter]);

  // -------------------------------------------------------------
  // HANDLERS MASTER: EXCLUSÃO DIRETA
  // -------------------------------------------------------------
  const handleDeleteRecord = async (collectionName: string, id: string, title: string) => {
    setDeleteConfirm({
      collection: collectionName,
      id,
      title,
      subtitle: `Coleção: ${collectionName.toUpperCase()} | ID: ${id}`,
      onConfirm: async () => {
        setIsProcessing(true);
        const ok = await deleteRecordMaster(collectionName, id);
        setIsProcessing(false);
        setDeleteConfirm(null);
        if (ok) {
          showStatus('success', `Registro [${title}] apagado com sucesso do banco de dados.`);
          if (onRefreshData) onRefreshData();
        } else {
          showStatus('error', `Falha ao apagar registro [${title}]. Verifique as permissões de gravação.`);
        }
      }
    });
  };

  // Exclusão de item de histórico clínico
  const handleDeleteHistoryItem = async (
    patient: Paciente,
    itemType: 'evolucao' | 'anamnese' | 'foto' | 'procedimento_texto',
    itemId: string,
    itemTitle: string
  ) => {
    setDeleteConfirm({
      collection: 'pacientes.historico',
      id: itemId,
      title: `Item de Histórico: ${itemTitle}`,
      subtitle: `Paciente: ${patient.nome} (${patient.cpf || patient.telefone || 'Sem doc'})`,
      onConfirm: async () => {
        setIsProcessing(true);
        const updated = await deletePatientClinicalHistoryItem(patient, itemType, itemId);
        setIsProcessing(false);
        setDeleteConfirm(null);
        if (updated) {
          showStatus('success', `Histórico [${itemTitle}] excluído com sucesso do prontuário.`);
          if (onUpdatePaciente) onUpdatePaciente(updated);
          if (onRefreshData) onRefreshData();
        } else {
          showStatus('error', `Erro ao remover histórico do prontuário.`);
        }
      }
    });
  };

  // -------------------------------------------------------------
  // HANDLERS MASTER: EDIÇÃO E SALVAMENTO
  // -------------------------------------------------------------
  const handleSaveEditedRecord = async () => {
    if (!editModalItem) return;
    setIsProcessing(true);
    const ok = await updateRecordMaster(editModalItem.collection, editModalItem.data.id, editModalItem.data);
    setIsProcessing(false);
    if (ok) {
      showStatus('success', `Documento [${editModalItem.data.id}] atualizado no banco com sucesso.`);
      setEditModalItem(null);
      if (onRefreshData) onRefreshData();
    } else {
      showStatus('error', `Falha ao atualizar documento no banco.`);
    }
  };

  // -------------------------------------------------------------
  // HANDLERS MASTER: CRIAÇÃO DIRETA
  // -------------------------------------------------------------
  const handleCreateRecord = async () => {
    if (!createModalCollection) return;
    setIsProcessing(true);
    const newId = await createRecordMaster(createModalCollection, createFormData);
    setIsProcessing(false);
    if (newId) {
      showStatus('success', `Novo registro criado com ID [${newId}] com sucesso.`);
      setCreateModalCollection(null);
      setCreateFormData({});
      if (onRefreshData) onRefreshData();
    } else {
      showStatus('error', `Erro ao criar novo registro.`);
    }
  };

  // -------------------------------------------------------------
  // HANDLERS MASTER: CATEGORIAS EM LOTE
  // -------------------------------------------------------------
  const handleExecuteCategoryAction = async () => {
    if (!categoryModal) return;
    setIsProcessing(true);

    const targetCollection =
      categoryModal.collection === 'procedimentos'
        ? COLLECTIONS.PROCEDIMENTOS
        : categoryModal.collection === 'estoque'
        ? COLLECTIONS.ESTOQUE
        : COLLECTIONS.FINANCEIRO;

    if (categoryModal.type === 'rename') {
      if (!categoryModal.categoryName || !newCategoryName.trim()) {
        showStatus('error', 'Nome da categoria inválido.');
        setIsProcessing(false);
        return;
      }
      const res = await batchRenameCategory(targetCollection, categoryModal.categoryName, newCategoryName.trim());
      setIsProcessing(false);
      setCategoryModal(null);
      setNewCategoryName('');
      if (res.success) {
        showStatus('success', `Categoria renomeada para "${newCategoryName}". ${res.updatedCount} itens sincronizados.`);
        if (onRefreshData) onRefreshData();
      } else {
        showStatus('error', 'Erro ao renomear categoria em lote.');
      }
    } else if (categoryModal.type === 'delete') {
      if (!categoryModal.categoryName) {
        setIsProcessing(false);
        return;
      }
      const res = await batchDeleteCategory(targetCollection, categoryModal.categoryName, fallbackCategoryName.trim() || 'Geral');
      setIsProcessing(false);
      setCategoryModal(null);
      if (res.success) {
        showStatus('success', `Categoria "${categoryModal.categoryName}" removida. ${res.updatedCount} itens reclassificados como "${fallbackCategoryName}".`);
        if (onRefreshData) onRefreshData();
      } else {
        showStatus('error', 'Erro ao apagar categoria.');
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* HEADER MASTER BANNER */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-rose-950 text-white rounded-2xl p-6 shadow-xl border border-rose-900/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30">
                <Database className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Painel Master: Edição & Banco de Dados
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500 text-white uppercase tracking-wider">
                  Acesso Total Master
                </span>
              </h1>
            </div>
            <p className="text-sm text-slate-300 max-w-3xl">
              Gerencie, edite e apague diretamente todas as tabelas e registros do sistema: agendamentos, procedimentos cadastrados, categorias em lote, históricos clínicos detalhados e parâmetros de banco.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={() => {
                if (onRefreshData) onRefreshData();
                showStatus('info', 'Sincronizando todas as coleções do banco de dados em tempo real...');
              }}
              disabled={isProcessing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition shadow-sm cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin text-rose-400' : ''}`} />
              Sincronizar Banco
            </button>

            <button
              onClick={() => {
                setWipeConfirmInput('');
                setIsWipeModalOpen(true);
              }}
              disabled={isProcessing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black border border-rose-500 transition shadow-md cursor-pointer"
              title="Limpar todos os dados e cadastros de teste preservando o Super Admin"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Limpar Dados / Reset Produção
            </button>
          </div>
        </div>

        {/* STATUS ALERT NOTIFICATION */}
        {statusMessage && (
          <div className={`mt-4 p-3 rounded-xl flex items-center justify-between gap-3 text-xs font-semibold border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/80 text-emerald-200 border-emerald-700'
              : statusMessage.type === 'error'
              ? 'bg-rose-950/80 text-rose-200 border-rose-700'
              : 'bg-indigo-950/80 text-indigo-200 border-indigo-700'
          }`}>
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {statusMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400" />}
              {statusMessage.type === 'info' && <Sparkles className="w-4 h-4 text-indigo-400" />}
              <span>{statusMessage.text}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* NAVEGAÇÃO DE ABAS MASTER */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {[
          { id: 'agendamentos', label: 'Agendamentos', icon: Calendar, count: agendamentos.length },
          { id: 'procedimentos', label: 'Procedimentos & Preços', icon: Sparkles, count: procedimentos.length },
          { id: 'categorias', label: 'Gestão de Categorias', icon: FolderTree, count: procedureCategories.length + estoqueCategories.length },
          { id: 'historicos_clinicos', label: 'Históricos & Prontuários', icon: History, count: pacientes.length },
          { id: 'estoque', label: 'Insumos & Estoque', icon: Package, count: estoque.length },
          { id: 'financeiro', label: 'Tabela Financeira', icon: DollarSign, count: financeiro.length },
          { id: 'pacientes', label: 'Tabela Pacientes', icon: Users, count: pacientes.length },
          { id: 'usuarios', label: 'Tabela Usuários/Equipe', icon: ShieldCheck, count: usuarios.length },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeCollection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveCollection(tab.id as MasterCollectionType);
                setSearchTerm('');
                setSelectedCategoryFilter('ALL');
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                isActive
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-rose-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                isActive ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-500'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 1. ABA: AGENDAMENTOS (EDITAR / APAGAR / NOVO) */}
      {/* ========================================================================= */}
      {activeCollection === 'agendamentos' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por paciente, procedimento ou ID..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <select
                value={selectedCategoryFilter}
                onChange={e => setSelectedCategoryFilter(e.target.value)}
                className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              >
                <option value="ALL">Todos os Status</option>
                <option value="agendado">Agendado</option>
                <option value="confirmado">Confirmado</option>
                <option value="em_espera">Na Recepção</option>
                <option value="em_atendimento">Em Atendimento</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            <button
              onClick={() => {
                setCreateModalCollection(COLLECTIONS.AGENDAMENTOS);
                setCreateFormData({
                  paciente_nome: '',
                  procedimento: '',
                  data_hora: new Date().toISOString().slice(0, 16),
                  status: 'agendado',
                  valor_estimado: 0,
                  profissional_nome: currentUser.nome
                });
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Inserir Agendamento Master
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">ID / Data</th>
                  <th className="py-3 px-4">Paciente</th>
                  <th className="py-3 px-4">Procedimento</th>
                  <th className="py-3 px-4">Profissional</th>
                  <th className="py-3 px-4">Valor</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações Master</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAgendamentos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Nenhum agendamento encontrado no banco de dados.
                    </td>
                  </tr>
                ) : (
                  filteredAgendamentos.map(ag => (
                    <tr key={ag.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <div className="font-mono text-[10px] text-slate-400 font-bold">{ag.id}</div>
                        <div className="font-semibold text-slate-800">
                          {new Date(ag.data_hora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {ag.paciente_nome}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800">{ag.procedimento}</span>
                        {(ag.procedimento.toLowerCase().includes('retorno') || ag.procedimento.toLowerCase().includes('revisão')) && (
                          <span className="ml-1.5 px-1.5 py-0.2 rounded text-[9px] bg-purple-100 text-purple-800 font-extrabold">
                            Retorno
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {ag.profissional_nome || '-'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                        R$ {(ag.valor_estimado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                          {ag.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => setEditModalItem({ collection: COLLECTIONS.AGENDAMENTOS, data: { ...ag } })}
                          className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition"
                          title="Editar Agendamento no Banco"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(COLLECTIONS.AGENDAMENTOS, ag.id, `Agendamento de ${ag.paciente_nome} (${ag.procedimento})`)}
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition"
                          title="Apagar Agendamento do Banco"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ABA: PROCEDIMENTOS (EDITAR / APAGAR / CRIAR / VALORES) */}
      {/* ========================================================================= */}
      {activeCollection === 'procedimentos' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar procedimento por nome ou categoria..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <select
                value={selectedCategoryFilter}
                onChange={e => setSelectedCategoryFilter(e.target.value)}
                className="text-xs py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
              >
                <option value="ALL">Todas as Categorias</option>
                {procedureCategories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setCreateModalCollection(COLLECTIONS.PROCEDIMENTOS);
                setCreateFormData({
                  nome: '',
                  categoria: procedureCategories[0] || 'Geral',
                  preco: 0,
                  duracao_minutos: 60,
                  descricao: ''
                });
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Novo Procedimento Master
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs text-slate-600 border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Nome do Procedimento</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Preço Base</th>
                  <th className="py-3 px-4">Duração</th>
                  <th className="py-3 px-4">Descrição / Insumos</th>
                  <th className="py-3 px-4 text-right">Ações Master</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProcedimentos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Nenhum procedimento encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredProcedimentos.map(proc => (
                    <tr key={proc.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {proc.nome}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 font-bold text-[10px]">
                          {proc.categoria}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                        R$ {(proc.preco || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {proc.duracao_minutos} min
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate" title={proc.descricao}>
                        {proc.descricao || 'Sem descrição cadastrada'}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => setEditModalItem({ collection: COLLECTIONS.PROCEDIMENTOS, data: { ...proc } })}
                          className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition"
                          title="Editar Procedimento no Banco"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(COLLECTIONS.PROCEDIMENTOS, proc.id, `Procedimento: ${proc.nome}`)}
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition"
                          title="Apagar Procedimento do Banco"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ABA: GESTÃO DE CATEGORIAS EM LOTE (ALTERAR / APAGAR / UNIFICAR) */}
      {/* ========================================================================= */}
      {activeCollection === 'categorias' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CATEGORIAS DE PROCEDIMENTOS */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                <FolderTree className="w-4 h-4 text-indigo-600" />
                <span>Categorias de Procedimentos ({procedureCategories.length})</span>
              </div>
              <button
                onClick={() => {
                  setCategoryModal({ type: 'add', collection: 'procedimentos' });
                  setNewCategoryName('');
                }}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold"
              >
                + Nova Categoria
              </button>
            </div>

            <div className="space-y-2">
              {procedureCategories.map(cat => (
                <div key={cat} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-xs font-bold text-slate-800">{cat}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ({procedimentos.filter(p => p.categoria === cat).length} procedimentos)
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setCategoryModal({ type: 'rename', collection: 'procedimentos', categoryName: cat });
                        setNewCategoryName(cat);
                      }}
                      className="p-1.5 rounded-lg bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 text-xs font-medium"
                      title="Renomear Categoria em todos os procedimentos"
                    >
                      <Edit3 className="w-3 h-3 text-amber-600" />
                    </button>
                    <button
                      onClick={() => {
                        setCategoryModal({ type: 'delete', collection: 'procedimentos', categoryName: cat });
                        setFallbackCategoryName('Geral');
                      }}
                      className="p-1.5 rounded-lg bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 text-xs font-medium"
                      title="Apagar Categoria e Reclassificar Itens"
                    >
                      <Trash2 className="w-3 h-3 text-rose-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CATEGORIAS DE ESTOQUE / INSUMOS */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <Package className="w-4 h-4 text-emerald-600" />
                <span>Categorias de Estoque & Insumos ({estoqueCategories.length})</span>
              </div>
            </div>

            <div className="space-y-2">
              {estoqueCategories.map(cat => (
                <div key={cat} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-xs font-bold text-slate-800">{cat}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ({estoque.filter(e => e.categoria === cat).length} itens)
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setCategoryModal({ type: 'rename', collection: 'estoque', categoryName: cat });
                        setNewCategoryName(cat);
                      }}
                      className="p-1.5 rounded-lg bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 text-xs font-medium"
                      title="Renomear Categoria de Estoque"
                    >
                      <Edit3 className="w-3 h-3 text-amber-600" />
                    </button>
                    <button
                      onClick={() => {
                        setCategoryModal({ type: 'delete', collection: 'estoque', categoryName: cat });
                        setFallbackCategoryName('Geral');
                      }}
                      className="p-1.5 rounded-lg bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 text-xs font-medium"
                      title="Apagar Categoria de Estoque"
                    >
                      <Trash2 className="w-3 h-3 text-rose-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ABA: HISTÓRICOS CLÍNICOS & PRONTUÁRIOS DETALHADOS (EXCLUSÃO SELETIVA) */}
      {/* ========================================================================= */}
      {activeCollection === 'historicos_clinicos' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-rose-600" />
                Auditoria & Exclusão de Históricos Clínicos de Procedimentos
              </h2>
              <p className="text-xs text-slate-500">
                Selecione o paciente para auditar e apagar evoluções específicas, fichas de anamnese ou fotos de antes/depois.
              </p>
            </div>

            {/* SELETOR DE PACIENTE */}
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <select
                value={selectedPatientId}
                onChange={e => setSelectedPatientId(e.target.value)}
                className="text-xs font-bold py-2 px-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white max-w-xs"
              >
                {pacientes.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nome} ({p.cpf || p.telefone || 'Sem doc'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {currentPatient && (
            <div className="space-y-6">
              {/* CARTÃO RESUMO PACIENTE */}
              <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-rose-400 font-bold uppercase tracking-wider">Prontuário Ativo</div>
                  <h3 className="text-base font-black text-white">{currentPatient.nome}</h3>
                  <p className="text-xs text-slate-300">
                    CPF: {currentPatient.cpf || '-'} | Tel: {currentPatient.telefone || '-'} | Email: {currentPatient.email || '-'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-mono">
                    ID: {currentPatient.id}
                  </span>
                </div>
              </div>

              {/* 1. SEÇÃO DE EVOLUÇÕES CLÍNICAS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    Evoluções & Procedimentos Registrados ({currentPatient.evolucoes_retornos?.length || 0})
                  </h4>
                </div>

                {(!currentPatient.evolucoes_retornos || currentPatient.evolucoes_retornos.length === 0) ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-400">
                    Nenhuma evolução clínica registrada para este paciente.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentPatient.evolucoes_retornos.map((ev: any) => (
                      <div key={ev.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{ev.procedimento || 'Procedimento'}</span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              Data: {new Date(ev.data).toLocaleDateString('pt-BR')} por {ev.profissional || 'Profissional'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                            {ev.observacoes || ev.descricao || 'Sem anotações clínicas.'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteHistoryItem(currentPatient, 'evolucao', ev.id, `Evolução de ${ev.procedimento} em ${ev.data}`)}
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition shrink-0"
                          title="Apagar esta evolução clínica do histórico"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. SEÇÃO DE ANAMNESES REGISTRADAS */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Fichas de Anamnese & Termos ({currentPatient.anamneses_completas?.length || (currentPatient.ficha_anamnese ? 1 : 0)})
                </h4>

                {(!currentPatient.anamneses_completas || currentPatient.anamneses_completas.length === 0) && !currentPatient.ficha_anamnese ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-400">
                    Nenhuma ficha de anamnese arquivada para este paciente.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentPatient.anamneses_completas?.map((an: any) => (
                      <div key={an.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                        <div>
                          <span className="text-xs font-bold text-slate-800">
                            Ficha de Anamnese - {new Date(an.data_preenchimento || an.data).toLocaleDateString('pt-BR')}
                          </span>
                          <p className="text-[11px] text-slate-500">
                            Preenchida por: {an.responsavel_preenchimento || 'Clínica'} | Status: Assinada
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteHistoryItem(currentPatient, 'anamnese', an.id, `Ficha Anamnese de ${an.data_preenchimento || an.data}`)}
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition"
                          title="Apagar Ficha de Anamnese"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. SEÇÃO DE FOTOS ANTES / DEPOIS */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase text-slate-700 tracking-wider flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-amber-600" />
                  Galeria de Fotos Clínicas & Comparativos ({currentPatient.fotos_antes_depois?.length || 0})
                </h4>

                {(!currentPatient.fotos_antes_depois || currentPatient.fotos_antes_depois.length === 0) ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-400">
                    Nenhuma fotografia clínica salva.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {currentPatient.fotos_antes_depois.map((foto: any) => (
                      <div key={foto.id} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                        <img
                          src={foto.url}
                          alt="Foto Clínica"
                          className="w-full h-28 object-cover"
                        />
                        <div className="p-1.5 bg-white text-[10px] truncate text-slate-700 font-medium">
                          {foto.tipo === 'antes' ? '📸 Antes' : '✨ Depois'} - {foto.data ? new Date(foto.data).toLocaleDateString('pt-BR') : ''}
                        </div>
                        <button
                          onClick={() => handleDeleteHistoryItem(currentPatient, 'foto', foto.id, `Foto ${foto.tipo}`)}
                          className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-rose-600 text-white opacity-90 hover:opacity-100 transition shadow-sm"
                          title="Apagar Foto do Histórico"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. ABA: INSUMOS & ESTOQUE */}
      {/* ========================================================================= */}
      {activeCollection === 'estoque' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar insumo por nome, categoria ou ID..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            <button
              onClick={() => {
                setCreateModalCollection(COLLECTIONS.ESTOQUE);
                setCreateFormData({
                  nome: '',
                  categoria: estoqueCategories[0] || 'Insumos',
                  quantidade_atual: 10,
                  quantidade_minima: 2,
                  unidade_medida: 'un',
                  custo_unitario: 0
                });
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition"
            >
              <Plus className="w-4 h-4" />
              Novo Insumo Master
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Nome do Insumo</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Qtd Atual</th>
                  <th className="py-3 px-4">Qtd Mínima</th>
                  <th className="py-3 px-4">Custo Unitário</th>
                  <th className="py-3 px-4 text-right">Ações Master</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEstoque.map(item => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{item.nome}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                        {item.categoria}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {item.quantidade_atual} {item.unidade_medida}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {item.quantidade_minima} {item.unidade_medida}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                      R$ {(item.custo_unitario || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => setEditModalItem({ collection: COLLECTIONS.ESTOQUE, data: { ...item } })}
                        className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteRecord(COLLECTIONS.ESTOQUE, item.id, `Insumo: ${item.nome}`)}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. ABA: FINANCEIRO */}
      {/* ========================================================================= */}
      {activeCollection === 'financeiro' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar lançamento financeiro..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            <button
              onClick={() => {
                setCreateModalCollection(COLLECTIONS.FINANCEIRO);
                setCreateFormData({
                  descricao: '',
                  tipo: 'receita',
                  valor: 0,
                  data: new Date().toISOString().slice(0, 10),
                  categoria: 'Procedimentos',
                  status: 'pago',
                  forma_pagamento: 'pix'
                });
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition"
            >
              <Plus className="w-4 h-4" />
              Novo Lançamento Master
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Valor</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações Master</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFinanceiro.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Nenhum lançamento financeiro encontrado no banco.
                    </td>
                  </tr>
                ) : (
                  filteredFinanceiro.map((fin: any) => {
                    const isIncome = fin.tipo === 'receita' || fin.tipo === 'entrada';
                    const desc = fin.descricao || fin.procedimento || (fin.paciente_nome ? `Atendimento - ${fin.paciente_nome}` : 'Lançamento sem descrição');
                    const rawDate = fin.data || fin.data_pagamento || fin.data_vencimento || fin.criado_em || fin.created_at;
                    let formattedDate = '—';
                    if (rawDate) {
                      try {
                        const parsed = new Date(rawDate);
                        if (!isNaN(parsed.getTime())) {
                          formattedDate = parsed.toLocaleDateString('pt-BR');
                        }
                      } catch {
                        formattedDate = String(rawDate);
                      }
                    }

                    return (
                      <tr key={fin.id || Math.random().toString()} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <div>{desc}</div>
                          {fin.paciente_nome && (
                            <div className="text-[10px] text-slate-400 font-normal">Paciente: {fin.paciente_nome}</div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isIncome ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {isIncome ? 'ENTRADA' : 'SAÍDA'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">
                          {fin.categoria || 'Geral'}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{formattedDate}</td>
                        <td className={`py-3 px-4 font-mono font-bold ${isIncome ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {isIncome ? '+' : '-'} R$ {(Number(fin.valor) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                            fin.status === 'pago' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {(fin.status || 'pendente').toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => setEditModalItem({ collection: COLLECTIONS.FINANCEIRO, data: { ...fin } })}
                            title="Editar lançamento master"
                            className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition inline-flex items-center justify-center"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRecord(COLLECTIONS.FINANCEIRO, fin.id, `Lançamento: ${desc}`)}
                            title="Excluir lançamento master"
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition inline-flex items-center justify-center"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. ABA: PACIENTES */}
      {/* ========================================================================= */}
      {activeCollection === 'pacientes' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar paciente por nome, CPF ou telefone..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Nome do Paciente</th>
                  <th className="py-3 px-4">CPF</th>
                  <th className="py-3 px-4">Telefone</th>
                  <th className="py-3 px-4">Históricos Gravados</th>
                  <th className="py-3 px-4 text-right">Ações Master</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pacientes.filter(p => p.nome.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{p.nome}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{p.cpf || '-'}</td>
                    <td className="py-3 px-4">{p.telefone || '-'}</td>
                    <td className="py-3 px-4 text-[11px] text-slate-500">
                      {p.evolucoes_retornos?.length || 0} evoluções • {p.fotos_antes_depois?.length || 0} fotos
                    </td>
                    <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => setEditModalItem({ collection: COLLECTIONS.PACIENTES, data: { ...p } })}
                        className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteRecord(COLLECTIONS.PACIENTES, p.id, `Paciente: ${p.nome}`)}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. ABA: USUÁRIOS */}
      {/* ========================================================================= */}
      {activeCollection === 'usuarios' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Nome do Usuário</th>
                  <th className="py-3 px-4">Email de Acesso</th>
                  <th className="py-3 px-4">Perfil / Cargo</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações Master</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuarios.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{u.nome}</td>
                    <td className="py-3 px-4 font-mono">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                        {u.perfil}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        u.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {u.ativo ? 'ATIVO' : 'INATIVO'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => setEditModalItem({ collection: COLLECTIONS.USUARIOS, data: { ...u } })}
                        className="p-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteRecord(COLLECTIONS.USUARIOS, u.id, `Usuário: ${u.nome}`)}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE EDIÇÃO DIRETA NO BANCO */}
      {/* ========================================================================= */}
      {editModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Edit3 className="w-4 h-4 text-rose-600" />
                <span>Edição Direta no Banco [{editModalItem.collection.toUpperCase()}]</span>
              </div>
              <button onClick={() => setEditModalItem(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto p-1">
              {Object.keys(editModalItem.data)
                .filter(k => !['evolucoes_retornos', 'anamneses_completas', 'fotos_antes_depois'].includes(k))
                .map(key => (
                  <div key={key} className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 uppercase">{key}</label>
                    {typeof editModalItem.data[key] === 'boolean' ? (
                      <select
                        value={editModalItem.data[key] ? 'true' : 'false'}
                        onChange={e => setEditModalItem({
                          ...editModalItem,
                          data: { ...editModalItem.data, [key]: e.target.value === 'true' }
                        })}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-slate-50"
                      >
                        <option value="true">Verdadeiro (True)</option>
                        <option value="false">Falso (False)</option>
                      </select>
                    ) : typeof editModalItem.data[key] === 'number' ? (
                      <input
                        type="number"
                        step="any"
                        value={editModalItem.data[key]}
                        onChange={e => setEditModalItem({
                          ...editModalItem,
                          data: { ...editModalItem.data, [key]: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-slate-50 font-mono"
                      />
                    ) : (
                      <input
                        type="text"
                        value={editModalItem.data[key] || ''}
                        disabled={key === 'id'}
                        onChange={e => setEditModalItem({
                          ...editModalItem,
                          data: { ...editModalItem.data, [key]: e.target.value }
                        })}
                        className={`w-full text-xs p-2 rounded-lg border border-slate-300 ${key === 'id' ? 'bg-slate-100 font-mono text-slate-500' : 'bg-slate-50'}`}
                      />
                    )}
                  </div>
                ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditModalItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEditedRecord}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                Gravar Alterações Master
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE CRIAÇÃO MASTER */}
      {/* ========================================================================= */}
      {createModalCollection && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Plus className="w-4 h-4 text-rose-600" />
                <span>Novo Documento [{createModalCollection.toUpperCase()}]</span>
              </div>
              <button onClick={() => setCreateModalCollection(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto p-1">
              {Object.keys(createFormData).map(key => (
                <div key={key} className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase">{key}</label>
                  {typeof createFormData[key] === 'number' ? (
                    <input
                      type="number"
                      step="any"
                      value={createFormData[key]}
                      onChange={e => setCreateFormData({ ...createFormData, [key]: parseFloat(e.target.value) || 0 })}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-slate-50 font-mono"
                    />
                  ) : (
                    <input
                      type="text"
                      value={createFormData[key] || ''}
                      onChange={e => setCreateFormData({ ...createFormData, [key]: e.target.value })}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-slate-50"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setCreateModalCollection(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateRecord}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                Criar no Banco de Dados
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DEFINITIVA */}
      {/* ========================================================================= */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 max-w-md w-full p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">
                Confirmar Exclusão Definitiva?
              </h3>
              <p className="text-xs font-bold text-rose-700">
                {deleteConfirm.title}
              </p>
              {deleteConfirm.subtitle && (
                <p className="text-[11px] text-slate-500 font-mono">
                  {deleteConfirm.subtitle}
                </p>
              )}
            </div>

            <p className="text-xs text-slate-600 bg-rose-50/50 p-3 rounded-xl border border-rose-100 text-left">
              ⚠️ Esta operação remove o registro de forma direta e definitiva no banco de dados Firestore.
            </p>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
              <button
                onClick={deleteConfirm.onConfirm}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Sim, Apagar Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE GERENCIAMENTO DE CATEGORIA */}
      {/* ========================================================================= */}
      {categoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <FolderTree className="w-4 h-4 text-indigo-600" />
                <span>
                  {categoryModal.type === 'rename' ? 'Renomear Categoria em Lote' : 'Excluir / Reclassificar Categoria'}
                </span>
              </div>
              <button onClick={() => setCategoryModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {categoryModal.type === 'rename' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Nome Atual</label>
                  <input
                    type="text"
                    disabled
                    value={categoryModal.categoryName || ''}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 font-bold mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Novo Nome da Categoria</label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    placeholder="Ex.: Harmonização Facial, Fios de PDO..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-indigo-500 font-bold mt-1"
                  />
                </div>
              </div>
            )}

            {categoryModal.type === 'delete' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Você está removendo a categoria <strong className="text-rose-600">{categoryModal.categoryName}</strong>. Defina para qual categoria os itens existentes serão movidos:
                </p>
                <div>
                  <label className="text-xs font-bold text-slate-700">Nova Categoria de Destino (Fallback)</label>
                  <input
                    type="text"
                    value={fallbackCategoryName}
                    onChange={e => setFallbackCategoryName(e.target.value)}
                    placeholder="Ex.: Geral ou Outros"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-bold mt-1"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setCategoryModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleExecuteCategoryAction}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Confirmar Atualização em Lote
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE LIMPEZA TOTAL / RESET DE PRODUÇÃO */}
      {isWipeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-rose-200 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl border border-rose-200 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900">
                  Limpar Todos os Dados e Iniciar Produção
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Esta operação apagará todos os dados fictícios e registros de teste de todas as coleções do Firestore (pacientes, agendamentos, transações, estoque, histórico, bens, avisos).
                </p>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>O Administrador Master (Fabio Lima / fabio@teste.com) será preservado com permissão total de acesso.</span>
              </div>
              <p className="text-[11px] text-rose-700">
                Para confirmar a exclusão irreversível dos dados de teste, digite <strong className="font-mono font-bold text-rose-900">LIMPAR</strong> abaixo:
              </p>
              <input
                type="text"
                value={wipeConfirmInput}
                onChange={(e) => setWipeConfirmInput(e.target.value)}
                placeholder='Digite LIMPAR para confirmar'
                className="w-full text-xs font-mono font-bold uppercase p-2.5 rounded-lg border border-rose-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsWipeModalOpen(false);
                  setWipeConfirmInput('');
                }}
                disabled={isProcessing}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleWipeDatabase}
                disabled={isProcessing || wipeConfirmInput.trim().toUpperCase() !== 'LIMPAR'}
                className={`flex items-center gap-2 px-5 py-2 text-xs font-black text-white rounded-xl transition shadow-sm cursor-pointer ${
                  wipeConfirmInput.trim().toUpperCase() === 'LIMPAR'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Limpando Coleções...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Executar Limpeza do Banco</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
