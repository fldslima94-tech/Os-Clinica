import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  Receipt, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Printer, 
  Share2, 
  MessageCircle, 
  X, 
  ShieldCheck, 
  Calendar, 
  Download, 
  Trash2,
  RefreshCw,
  AlertTriangle,
  FileText,
  Building,
  Sparkles,
  Info,
  Edit3,
  Save
} from 'lucide-react';
import { 
  TransacaoFinanceira, 
  FormaPagamento, 
  StatusPagamento, 
  UsuarioEquipe, 
  DespesaRecorrente,
  Fornecedor
} from '../types';
import { checkUserCustomPermission } from '../services/firebaseService';

interface FinancialViewProps {
  transacoes: TransacaoFinanceira[];
  despesasRecorrentes?: DespesaRecorrente[];
  fornecedores?: Fornecedor[];
  onAddTransaction: (nova: Partial<TransacaoFinanceira>) => void;
  onUpdateTransactionStatus: (id: string, status: StatusPagamento) => void;
  onSoftDeleteTransaction?: (id: string, motivo: string) => void;
  onAddDespesaRecorrente?: (nova: Omit<DespesaRecorrente, 'id'>) => void;
  onUpdateDespesaRecorrente?: (despesa: DespesaRecorrente) => void;
  onDeleteDespesaRecorrente?: (id: string) => void;
  onToggleDespesaRecorrenteStatus?: (id: string) => void;
  currentUser?: UsuarioEquipe;
}

export const FinancialView: React.FC<FinancialViewProps> = ({
  transacoes,
  despesasRecorrentes = [],
  fornecedores = [],
  onAddTransaction,
  onUpdateTransactionStatus,
  onSoftDeleteTransaction,
  onAddDespesaRecorrente,
  onUpdateDespesaRecorrente,
  onDeleteDespesaRecorrente,
  onToggleDespesaRecorrenteStatus,
  currentUser,
}) => {
  const isGestor = !currentUser || currentUser.role === 'admin_total' || currentUser.role === 'admin_local' || currentUser.role === 'gestor' || currentUser.role === 'admin';
  const canDelete = checkUserCustomPermission(currentUser, 'financeiro', 'excluir');
  const canViewEntradas = checkUserCustomPermission(currentUser, 'financeiro', 'verEntradas');
  const canViewSaidas = checkUserCustomPermission(currentUser, 'financeiro', 'verSaidas');
  const canViewRecorrentes = checkUserCustomPermission(currentUser, 'financeiro', 'verRecorrentes');
  const canViewFullFinancials = isGestor || checkUserCustomPermission(currentUser, 'financeiro', 'verRelatorios');

  // Active Financial Tab: 'entradas' | 'saidas' | 'recorrentes'
  const [activeFinTab, setActiveFinTab] = useState<'entradas' | 'saidas' | 'recorrentes'>('entradas');
  const [filterPeriod, setFilterPeriod] = useState<'hoje' | '7dias' | 'mes' | 'todos'>('mes');
  const [search, setSearch] = useState('');
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState(false);
  const [isNewRecorrenteModalOpen, setIsNewRecorrenteModalOpen] = useState(false);
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<TransacaoFinanceira | null>(null);

  // Soft Delete Audit Modal State
  const [txToDelete, setTxToDelete] = useState<TransacaoFinanceira | null>(null);
  const [motivoExclusao, setMotivoExclusao] = useState('');
  const [showAuditDeleted, setShowAuditDeleted] = useState(false);

  // New Transaction Form State
  const [novoPacienteNome, setNovoPacienteNome] = useState('');
  const [novoProcedimento, setNovoProcedimento] = useState('');
  const [novoValor, setNovoValor] = useState<number>(0);
  const [novoTipo, setNovoTipo] = useState<'entrada' | 'saida'>('entrada');
  const [novaCategoria, setNovaCategoria] = useState('atendimento');
  const [novaForma, setNovaForma] = useState<FormaPagamento>('pix');
  const [novoStatus, setNovoStatus] = useState<StatusPagamento>('pago');
  const [novaObs, setNovaObs] = useState('');

  // New Despesa Recorrente Form State
  const [recDescricao, setRecDescricao] = useState('');
  const [recCategoria, setRecCategoria] = useState<DespesaRecorrente['categoria']>('aluguel');
  const [recValor, setRecValor] = useState<number>(0);
  const [recDiaVencimento, setRecDiaVencimento] = useState<number>(10);
  const [recForma, setRecForma] = useState<FormaPagamento>('boleto');

  // Edit Recurring Expense State
  const [editingDespesa, setEditingDespesa] = useState<DespesaRecorrente | null>(null);
  const [editDescricao, setEditDescricao] = useState('');
  const [editCategoria, setEditCategoria] = useState<DespesaRecorrente['categoria']>('aluguel');
  const [editValor, setEditValor] = useState<number>(0);
  const [editDiaVencimento, setEditDiaVencimento] = useState<number>(10);
  const [editForma, setEditForma] = useState<FormaPagamento>('boleto');
  const [editRecorrencia, setEditRecorrencia] = useState<'mensal' | 'anual' | 'semanal'>('mensal');
  const [editStatus, setEditStatus] = useState<'ativo' | 'inativo'>('ativo');
  const [editObs, setEditObs] = useState('');
  const [despesaToDelete, setDespesaToDelete] = useState<DespesaRecorrente | null>(null);

  // Filter Active (Non-deleted) vs Soft-deleted Transactions
  const activeTransacoes = transacoes.filter(t => !t.excluido);
  const deletedTransacoes = transacoes.filter(t => t.excluido);

  // KPI Calculations (Only Non-Deleted & Paid count)
  const entradas = activeTransacoes.filter(t => (t.tipo === 'entrada' || t.tipo === 'receita') && t.status === 'pago');
  const totalEntradas = entradas.reduce((acc, t) => acc + t.valor, 0);

  const saidas = activeTransacoes.filter(t => (t.tipo === 'saida' || t.tipo === 'despesa') && t.status === 'pago');
  const totalSaidas = saidas.reduce((acc, t) => acc + t.valor, 0);

  const saldoLiquidoCaixa = totalEntradas - totalSaidas;

  const totalRecorrenteMensal = despesasRecorrentes
    .filter(d => d.status === 'ativo')
    .reduce((acc, d) => acc + d.valor, 0);

  // Filtered List based on Current Tab and Search
  const displayList = (showAuditDeleted ? transacoes : activeTransacoes).filter(t => {
    const isEntrada = t.tipo === 'entrada' || t.tipo === 'receita';
    const isSaida = t.tipo === 'saida' || t.tipo === 'despesa';

    const matchesTab = activeFinTab === 'entradas' ? isEntrada : activeFinTab === 'saidas' ? isSaida : true;
    const q = search.toLowerCase().trim();
    const matchesSearch = !q || 
      t.paciente_nome.toLowerCase().includes(q) || 
      t.procedimento.toLowerCase().includes(q) ||
      (t.profissional_nome && t.profissional_nome.toLowerCase().includes(q));

    return matchesTab && matchesSearch;
  });

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoPacienteNome || novoValor <= 0) return;

    onAddTransaction({
      id: `tx-${Date.now()}`,
      paciente_nome: novoPacienteNome,
      procedimento: novoProcedimento || (novoTipo === 'entrada' ? 'Procedimento Estético' : 'Despesa Operacional'),
      valor: Number(novoValor),
      tipo: novoTipo,
      categoria: novaCategoria,
      forma_pagamento: novaForma,
      status: novoStatus,
      data: new Date().toISOString(),
      observacao: novaObs.trim() || undefined,
      excluido: false,
    });

    setIsNewTxModalOpen(false);
    setNovoPacienteNome('');
    setNovoProcedimento('');
    setNovoValor(0);
    setNovaObs('');
  };

  const handleSaveRecorrente = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recDescricao.trim() || recValor <= 0 || !onAddDespesaRecorrente) return;

    onAddDespesaRecorrente({
      descricao: recDescricao.trim(),
      categoria: recCategoria,
      valor: Number(recValor),
      dia_vencimento: Number(recDiaVencimento),
      recorrencia: 'mensal',
      status: 'ativo',
      forma_pagamento_preferencial: recForma,
    });

    setIsNewRecorrenteModalOpen(false);
    setRecDescricao('');
    setRecValor(0);
  };

  const handleStartEditDespesa = (desp: DespesaRecorrente) => {
    setEditingDespesa(desp);
    setEditDescricao(desp.descricao);
    setEditCategoria(desp.categoria);
    setEditValor(desp.valor);
    setEditDiaVencimento(desp.dia_vencimento);
    setEditForma(desp.forma_pagamento_preferencial);
    setEditRecorrencia(desp.recorrencia || 'mensal');
    setEditStatus(desp.status);
    setEditObs(desp.observacoes || '');
  };

  const handleSaveEditDespesa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDespesa || !editDescricao.trim() || editValor <= 0 || !onUpdateDespesaRecorrente) return;

    const updated: DespesaRecorrente = {
      ...editingDespesa,
      descricao: editDescricao.trim(),
      categoria: editCategoria,
      valor: Number(editValor),
      dia_vencimento: Number(editDiaVencimento),
      forma_pagamento_preferencial: editForma,
      recorrencia: editRecorrencia,
      status: editStatus,
      observacoes: editObs.trim() || undefined,
    };

    onUpdateDespesaRecorrente(updated);
    setEditingDespesa(null);
  };

  const handleConfirmDeleteDespesa = () => {
    if (!despesaToDelete || !onDeleteDespesaRecorrente) return;
    onDeleteDespesaRecorrente(despesaToDelete.id);
    setDespesaToDelete(null);
  };

  const handleConfirmSoftDelete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txToDelete || !motivoExclusao.trim() || !onSoftDeleteTransaction) return;

    onSoftDeleteTransaction(txToDelete.id, motivoExclusao.trim());
    setTxToDelete(null);
    setMotivoExclusao('');
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const getFormaLabel = (forma: FormaPagamento) => {
    const map: Record<FormaPagamento, string> = {
      pix: 'Pix Instantâneo',
      cartao_credito: 'Cartão de Crédito',
      cartao_debito: 'Cartão de Débito',
      dinheiro: 'Dinheiro em Espécie',
      transferencia: 'Transferência / TED',
      boleto: 'Boleto Bancário',
    };
    return map[forma] || forma;
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Fluxo de Caixa & Gestão
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Módulo Financeiro Reestruturado
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Controle transparente de entradas de procedimentos, saídas operacionais e despesas fixas recorrentes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsNewTxModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Entradas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total de Entradas (Receitas)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">
            {formatCurrency(totalEntradas)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {entradas.length} atendimentos e vendas pagos
          </p>
        </div>

        {/* Total Saídas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total de Saídas (Despesas)</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-700 mt-2">
            {formatCurrency(totalSaidas)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {saidas.length} compras e comissões pagas
          </p>
        </div>

        {/* Saldo Líquido de Caixa */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Saldo Líquido em Caixa</span>
            <DollarSign className="w-4 h-4 text-indigo-600" />
          </div>
          <p className={`text-2xl font-bold mt-2 ${saldoLiquidoCaixa >= 0 ? 'text-indigo-900' : 'text-rose-600'}`}>
            {formatCurrency(saldoLiquidoCaixa)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Entradas quitadas menos saídas
          </p>
        </div>

        {/* Despesas Recorrentes Fixas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Despesas Recorrentes / Mês</span>
            <RefreshCw className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-900 mt-2">
            {formatCurrency(totalRecorrenteMensal)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {despesasRecorrentes.filter(d => d.status === 'ativo').length} contas fixas ativas
          </p>
        </div>
      </div>

      {/* 3 Main Tabs: Entradas, Saídas, Despesas Recorrentes */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Navigation Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setActiveFinTab('entradas')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeFinTab === 'entradas' 
                  ? 'bg-white text-emerald-700 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>1. Entradas ({entradas.length})</span>
            </button>

            <button
              onClick={() => setActiveFinTab('saidas')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeFinTab === 'saidas' 
                  ? 'bg-white text-rose-700 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>2. Saídas ({saidas.length})</span>
            </button>

            <button
              onClick={() => setActiveFinTab('recorrentes')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeFinTab === 'recorrentes' 
                  ? 'bg-white text-amber-700 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>3. Despesas Recorrentes ({despesasRecorrentes.length})</span>
            </button>
          </div>

          {/* Search & Audit Toggle */}
          <div className="flex items-center gap-3">
            {activeFinTab !== 'recorrentes' && (
              <>
                <div className="relative flex-1 md:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar favorecido ou procedimento..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showAuditDeleted}
                    onChange={(e) => setShowAuditDeleted(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Ver Excluídos (Auditoria)</span>
                </label>
              </>
            )}

            {activeFinTab === 'recorrentes' && (
              <button
                onClick={() => setIsNewRecorrenteModalOpen(true)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Despesa Fixa</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab 1 & 2: Entradas / Saídas Table */}
        {activeFinTab !== 'recorrentes' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">{activeFinTab === 'entradas' ? 'Cliente / Paciente' : 'Favorecido / Fornecedor'}</th>
                  <th className="py-3 px-4">Procedimento / Descrição</th>
                  <th className="py-3 px-4">Forma de Pagamento</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Valor Líquido</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {displayList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Nenhum lançamento financeiro encontrado nesta visualização.
                    </td>
                  </tr>
                ) : (
                  displayList.map((tx) => {
                    const isDeleted = tx.excluido;
                    return (
                      <tr 
                        key={tx.id} 
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isDeleted ? 'bg-rose-50/40 text-slate-400' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-medium text-slate-600 whitespace-nowrap">
                          {new Date(tx.data).toLocaleDateString('pt-BR')}
                        </td>

                        <td className="py-3 px-4">
                          <span className={`font-bold ${isDeleted ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            {tx.paciente_nome || 'Consumidor Final'}
                          </span>
                          {tx.profissional_nome && (
                            <span className="block text-[11px] text-slate-500 font-normal">
                              Prof.: {tx.profissional_nome}
                            </span>
                          )}
                          {isDeleted && (
                            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              Excluído por: {tx.excluido_por || 'Usuário'} ({tx.motivo_exclusao})
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span className={isDeleted ? 'line-through text-slate-400' : 'text-slate-700'}>
                            {tx.procedimento}
                          </span>
                          {tx.observacao && (
                            <span className="block text-[10px] text-slate-400 truncate max-w-xs">
                              {tx.observacao}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                            {getFormaLabel(tx.forma_pagamento)}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          {isDeleted ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                              Cancelado / Estornado
                            </span>
                          ) : tx.status === 'pago' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Quitado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Pendente
                            </span>
                          )}
                        </td>

                        <td className={`py-3 px-4 text-right font-bold ${
                          isDeleted 
                            ? 'line-through text-slate-400' 
                            : tx.tipo === 'entrada' || tx.tipo === 'receita'
                            ? 'text-emerald-700'
                            : 'text-rose-700'
                        }`}>
                          {isDeleted ? 'R$ 0,00' : formatCurrency(tx.valor)}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setSelectedTxForReceipt(tx)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title="Emitir Recibo"
                            >
                              <Receipt className="w-4 h-4" />
                            </button>

                            {!isDeleted && canDelete && (
                              <button
                                onClick={() => setTxToDelete(tx)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Excluir Lançamento (Soft Delete c/ Auditoria)"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Despesas Recorrentes List */}
        {activeFinTab === 'recorrentes' && (
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {despesasRecorrentes.map((desp) => (
                <div 
                  key={desp.id}
                  className="bg-slate-50 rounded-2xl border border-slate-200 p-4 flex flex-col justify-between hover:shadow-xs transition-shadow"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                        {desp.categoria.toUpperCase()}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        desp.status === 'ativo' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {desp.status === 'ativo' ? 'Ativo Mensal' : 'Inativo'}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                      {desp.descricao}
                    </h4>

                    <div className="mt-3 space-y-1 text-xs text-slate-600">
                      <p>Vencimento todo <strong>dia {desp.dia_vencimento}</strong> de cada mês</p>
                      <p>Forma de Pgto: <strong>{getFormaLabel(desp.forma_pagamento_preferencial)}</strong></p>
                      {desp.observacoes && (
                        <p className="text-[11px] text-slate-500 italic line-clamp-1">
                          {desp.observacoes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                    <span className="text-base font-bold text-rose-700">
                      {formatCurrency(desp.valor)}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleStartEditDespesa(desp)}
                        className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1 border border-slate-200 bg-white"
                        title="Editar Valores e Dados da Despesa"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      {onToggleDespesaRecorrenteStatus && (
                        <button
                          type="button"
                          onClick={() => onToggleDespesaRecorrenteStatus(desp.id)}
                          className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                        >
                          {desp.status === 'ativo' ? 'Pausar' : 'Ativar'}
                        </button>
                      )}

                      {onDeleteDespesaRecorrente && canDelete && (
                        <button
                          type="button"
                          onClick={() => setDespesaToDelete(desp)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Excluir Despesa Recorrente"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Recurring Expense Modal */}
      {editingDespesa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 bg-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-300" />
                <h3 className="text-base font-bold">Editar Despesa Recorrente</h3>
              </div>
              <button 
                type="button"
                onClick={() => setEditingDespesa(null)} 
                className="text-indigo-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditDespesa} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição da Conta / Despesa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Aluguel da Clínica, Enel Energia, Internet Fibra..."
                  value={editDescricao}
                  onChange={(e) => setEditDescricao(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={editCategoria}
                    onChange={(e) => setEditCategoria(e.target.value as DespesaRecorrente['categoria'])}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="aluguel">Aluguel / Imóvel</option>
                    <option value="energia">Energia Elétrica</option>
                    <option value="internet">Internet / Telefonia</option>
                    <option value="software">Sistemas & Software</option>
                    <option value="contabilidade">Contabilidade</option>
                    <option value="marketing">Marketing & Tráfego</option>
                    <option value="manutencao">Manutenção Predial</option>
                    <option value="limpeza">Limpeza & Higiene</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dia de Vencimento (1 a 31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={editDiaVencimento}
                    onChange={(e) => setEditDiaVencimento(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Valor Mensal (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={editValor || ''}
                    onChange={(e) => setEditValor(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-rose-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={editForma}
                    onChange={(e) => setEditForma(e.target.value as FormaPagamento)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="boleto">Boleto Bancário</option>
                    <option value="pix">Pix Instantâneo</option>
                    <option value="cartao_credito">Cartão de Crédito</option>
                    <option value="cartao_debito">Cartão de Débito</option>
                    <option value="transferencia">Transferência Bancária</option>
                    <option value="dinheiro">Dinheiro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Recorrência
                  </label>
                  <select
                    value={editRecorrencia}
                    onChange={(e) => setEditRecorrencia(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="mensal">Mensal</option>
                    <option value="anual">Anual</option>
                    <option value="semanal">Semanal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo / Pausado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observações Internas (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Código do cliente na concessionária, link do portal, etc..."
                  value={editObs}
                  onChange={(e) => setEditObs(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingDespesa(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Recurring Expense Confirmation Modal */}
      {despesaToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              Excluir Despesa Recorrente?
            </h3>
            
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Você está prestes a excluir o item recorrente <strong>"{despesaToDelete.descricao}"</strong> no valor de <strong>{formatCurrency(despesaToDelete.valor)}</strong>. Esta ação removerá a conta das projeções automáticas.
            </p>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDespesaToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteDespesa}
                className="px-5 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Soft Delete Audit Modal */}
      {txToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              Exclusão com Auditoria Obrigatória
            </h3>
            
            <p className="text-xs text-slate-600 mt-1">
              Você está excluindo o lançamento de <strong>{formatCurrency(txToDelete.valor)}</strong> ({txToDelete.paciente_nome || txToDelete.procedimento}).
            </p>

            <form onSubmit={handleConfirmSoftDelete} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Motivo da Exclusão / Cancelamento *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ex: Lançamento duplicado por engano na recepção / Cliente solicitou estorno de procedimento não realizado..."
                  value={motivoExclusao}
                  onChange={(e) => setMotivoExclusao(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  O registro não será apagado do banco de dados (Soft Delete), mas seu valor financeiro será anulado nos relatórios.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setTxToDelete(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Confirmar Exclusão</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Transaction Modal */}
      {isNewTxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold">Novo Lançamento no Caixa</h3>
              <button onClick={() => setIsNewTxModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="p-6 space-y-4">
              <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setNovoTipo('entrada')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    novoTipo === 'entrada' ? 'bg-emerald-600 text-white' : 'text-slate-600'
                  }`}
                >
                  Entrada (Receita)
                </button>
                <button
                  type="button"
                  onClick={() => setNovoTipo('saida')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    novoTipo === 'saida' ? 'bg-rose-600 text-white' : 'text-slate-600'
                  }`}
                >
                  Saída (Despesa)
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    {novoTipo === 'entrada' ? 'Nome do Paciente / Cliente *' : 'Favorecido / Fornecedor *'}
                  </label>
                </div>
                <input
                  type="text"
                  required
                  placeholder={novoTipo === 'entrada' ? "Ex: Mariana Vasconcelos Ribeiro" : "Ex: Allergan Aesthetics / Distribuidora Med"}
                  value={novoPacienteNome}
                  onChange={(e) => setNovoPacienteNome(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />

                {/* Fornecedores quick select chips if Saída */}
                {novoTipo === 'saida' && fornecedores.length > 0 && (
                  <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Fornecedores:</span>
                    {fornecedores.slice(0, 4).map((f) => (
                      <button
                        type="button"
                        key={f.id}
                        onClick={() => {
                          setNovoPacienteNome(f.nome_fantasia || f.razao_social);
                          if (f.categoria === 'insumos') setNovaCategoria('insumos');
                          if (f.categoria === 'equipamentos') setNovaCategoria('equipamentos');
                          if (f.categoria === 'manutencao') setNovaCategoria('manutencao');
                        }}
                        className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                      >
                        {f.nome_fantasia || f.razao_social}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição do Procedimento / Despesa
                </label>
                <input
                  type="text"
                  placeholder="Ex: Aplicação de Toxina Botulínica / Compra de Insumos"
                  value={novoProcedimento}
                  onChange={(e) => setNovoProcedimento(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={novoValor || ''}
                    onChange={(e) => setNovoValor(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={novaForma}
                    onChange={(e) => setNovaForma(e.target.value as FormaPagamento)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="pix">Pix Instantâneo</option>
                    <option value="cartao_credito">Cartão de Crédito</option>
                    <option value="cartao_debito">Cartão de Débito</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="boleto">Boleto Bancário</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewTxModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs"
                >
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Recurring Expense Modal */}
      {isNewRecorrenteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 bg-amber-900 text-white flex items-center justify-between">
              <h3 className="text-base font-bold">Nova Despesa Fixa Recorrente</h3>
              <button onClick={() => setIsNewRecorrenteModalOpen(false)} className="text-amber-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecorrente} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição da Conta / Despesa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Aluguel da Clínica, Enel Energia, Internet Fibra..."
                  value={recDescricao}
                  onChange={(e) => setRecDescricao(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={recCategoria}
                    onChange={(e) => setRecCategoria(e.target.value as DespesaRecorrente['categoria'])}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="aluguel">Aluguel / Imóvel</option>
                    <option value="energia">Energia Elétrica</option>
                    <option value="internet">Internet / Telefonia</option>
                    <option value="software">Sistemas & Software</option>
                    <option value="contabilidade">Contabilidade</option>
                    <option value="marketing">Marketing & Tráfego</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dia de Vencimento (1 a 31)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={recDiaVencimento}
                    onChange={(e) => setRecDiaVencimento(parseInt(e.target.value) || 10)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Valor Mensal Estimado (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={recValor || ''}
                  onChange={(e) => setRecValor(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewRecorrenteModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-xs"
                >
                  Cadastrar Recorrência
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recibo Modal */}
      {selectedTxForReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-600" />
                Comprovante de Recibo
              </h3>
              <button onClick={() => setSelectedTxForReceipt(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 font-mono">
              <div className="flex justify-between border-b border-dashed pb-2">
                <span>Nº RECIBO:</span>
                <span className="font-bold">{selectedTxForReceipt.id}</span>
              </div>
              <div className="flex justify-between">
                <span>CLIENTE:</span>
                <span className="font-bold">{selectedTxForReceipt.paciente_nome}</span>
              </div>
              <div className="flex justify-between">
                <span>SERVIÇO:</span>
                <span>{selectedTxForReceipt.procedimento}</span>
              </div>
              <div className="flex justify-between">
                <span>DATA:</span>
                <span>{new Date(selectedTxForReceipt.data).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex justify-between">
                <span>PAGAMENTO:</span>
                <span>{getFormaLabel(selectedTxForReceipt.forma_pagamento)}</span>
              </div>
              <div className="flex justify-between border-t border-dashed pt-2 text-sm font-bold text-slate-900">
                <span>TOTAL PAGO:</span>
                <span className="text-emerald-700">{formatCurrency(selectedTxForReceipt.valor)}</span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Recibo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
