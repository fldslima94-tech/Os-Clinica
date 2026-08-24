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
  Lock,
  Eye,
  EyeOff,
  Download,
  FileSpreadsheet,
  Trash2
} from 'lucide-react';
import { TransacaoFinanceira, FormaPagamento, StatusPagamento, UsuarioEquipe } from '../types';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface FinancialViewProps {
  transacoes: TransacaoFinanceira[];
  onAddTransaction: (nova: Partial<TransacaoFinanceira>) => void;
  onUpdateTransactionStatus: (id: string, status: StatusPagamento) => void;
  onDeleteTransaction?: (id: string) => void;
  currentUser?: UsuarioEquipe;
}

export const FinancialView: React.FC<FinancialViewProps> = ({
  transacoes,
  onAddTransaction,
  onUpdateTransactionStatus,
  onDeleteTransaction,
  currentUser,
}) => {
  const isAdmin = !currentUser || currentUser.role === 'admin';
  const canViewFullFinancials = isAdmin || currentUser?.permissoes.ver_financeiro_completo;

  const [filterPeriod, setFilterPeriod] = useState<'hoje' | '7dias' | 'mes' | 'todos'>('mes');
  const [filterType, setFilterType] = useState<string>('todos');
  const [search, setSearch] = useState('');
  const [isNewTxModalOpen, setIsNewTxModalOpen] = useState(false);
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<TransacaoFinanceira | null>(null);
  const [txToDelete, setTxToDelete] = useState<TransacaoFinanceira | null>(null);

  // New Transaction Form State
  const [novoPacienteNome, setNovoPacienteNome] = useState('');
  const [novoProcedimento, setNovoProcedimento] = useState('');
  const [novoValor, setNovoValor] = useState<number>(0);
  const [novoTipo, setNovoTipo] = useState<'receita' | 'despesa'>('receita');
  const [novaForma, setNovaForma] = useState<FormaPagamento>('pix');
  const [novoStatus, setNovoStatus] = useState<StatusPagamento>('pago');
  const [novaObs, setNovaObs] = useState('');

  // Calculations
  const receitas = transacoes.filter(t => t.tipo === 'receita' && t.status === 'pago');
  const totalReceitas = receitas.reduce((acc, t) => acc + t.valor, 0);
  const totalCustosInsumos = receitas.reduce((acc, t) => acc + (t.custo_insumos || 0), 0);
  const lucroLiquido = totalReceitas - totalCustosInsumos;
  const margemLucro = totalReceitas > 0 ? ((lucroLiquido / totalReceitas) * 100).toFixed(1) : '100';

  const pendenteTotal = transacoes
    .filter(t => t.tipo === 'receita' && t.status === 'pendente')
    .reduce((acc, t) => acc + t.valor, 0);

  // Payment method totals
  const totalPix = transacoes.filter(t => t.forma_pagamento === 'pix' && t.status === 'pago').reduce((acc, t) => acc + t.valor, 0);
  const totalCredito = transacoes.filter(t => t.forma_pagamento === 'cartao_credito' && t.status === 'pago').reduce((acc, t) => acc + t.valor, 0);
  const totalDebito = transacoes.filter(t => t.forma_pagamento === 'cartao_debito' && t.status === 'pago').reduce((acc, t) => acc + t.valor, 0);
  const totalDinheiro = transacoes.filter(t => t.forma_pagamento === 'dinheiro' && t.status === 'pago').reduce((acc, t) => acc + t.valor, 0);

  const filteredTransacoes = transacoes.filter(t => {
    const matchesType = filterType === 'todos' || t.tipo === filterType;
    const q = search.toLowerCase();
    const matchesSearch = t.paciente_nome.toLowerCase().includes(q) || t.procedimento.toLowerCase().includes(q);
    return matchesType && matchesSearch;
  });

  const handleSaveTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoPacienteNome || novoValor <= 0) return;

    onAddTransaction({
      id: `tr-${Date.now()}`,
      paciente_nome: novoPacienteNome,
      procedimento: novoProcedimento || 'Procedimento Clínico',
      valor: novoValor,
      tipo: novoTipo,
      forma_pagamento: novaForma,
      status: novoStatus,
      data: new Date().toISOString(),
      observacao: novaObs,
    });

    setIsNewTxModalOpen(false);
    setNovoPacienteNome('');
    setNovoProcedimento('');
    setNovoValor(0);
    setNovaObs('');
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
    };
    return map[forma] || forma;
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Data', 'Tipo', 'Paciente / Favorecido', 'Procedimento', 'Valor (R$)', 'Custo Insumos (R$)', 'Forma Pagamento', 'Status', 'Observacao'];
    const rows = filteredTransacoes.map(t => [
      t.id,
      new Date(t.data).toLocaleDateString('pt-BR'),
      t.tipo.toUpperCase(),
      `"${t.paciente_nome.replace(/"/g, '""')}"`,
      `"${t.procedimento.replace(/"/g, '""')}"`,
      t.valor.toFixed(2),
      (t.custo_insumos || 0).toFixed(2),
      getFormaLabel(t.forma_pagamento),
      t.status.toUpperCase(),
      `"${(t.observacao || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_financeiro_esteticaos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Role Banner for Operator */}
      {!canViewFullFinancials && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold">Modo Operador (Recepção & Balcão)</p>
              <p className="text-amber-800 text-[11px] mt-0.5">
                Você tem permissão para receber pagamentos, registrar entradas e emitir recibos de pacientes. Métricas consolidadas de margem e DRE são visíveis apenas para Administradores.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-amber-100 border border-amber-300 text-amber-800 rounded-lg font-semibold text-[11px] shrink-0">
            Acesso Operacional
          </span>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Módulo Financeiro & Fechamento de Caixa
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Acompanhe faturamento por procedimento, formas de pagamento, margem líquida e emita recibos.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            title="Exportar dados para Excel (.CSV)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Exportar Excel / CSV</span>
          </button>

          <button
            onClick={() => setIsNewTxModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Lançar Entrada / Despesa</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Receita Liquidada</span>
            <div className="p-2 rounded-lg bg-green-50 text-green-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold font-mono text-slate-900">{formatCurrency(totalReceitas)}</p>
            <p className="text-[11px] text-green-700 font-medium mt-1">
              • {receitas.length} procedimentos pagos
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">A Receber / Pendente</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold font-mono text-amber-600">{formatCurrency(pendenteTotal)}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              Agendamentos a cobrar no balcão
            </p>
          </div>
        </div>

        {/* Custo de Insumos (Protegido para Operador) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Custo de Insumos</span>
            <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {canViewFullFinancials ? (
              <>
                <p className="text-2xl font-bold font-mono text-slate-700">{formatCurrency(totalCustosInsumos)}</p>
                <p className="text-[11px] text-slate-500 font-medium mt-1">
                  Produtos gastos nas sessões
                </p>
              </>
            ) : (
              <>
                <p className="text-base font-bold text-slate-400 flex items-center gap-1.5 mt-1">
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span>Restrito ao Admin</span>
                </p>
                <p className="text-[11px] text-slate-400 font-medium mt-1">
                  Custos protegidos por perfil
                </p>
              </>
            )}
          </div>
        </div>

        {/* Margem Líquida (Protegido para Operador) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Margem Líquida</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            {canViewFullFinancials ? (
              <>
                <p className="text-2xl font-bold font-mono text-indigo-600">{margemLucro}%</p>
                <p className="text-[11px] text-slate-500 font-medium mt-1">
                  Lucro líquido: {formatCurrency(lucroLiquido)}
                </p>
              </>
            ) : (
              <>
                <p className="text-base font-bold text-slate-400 flex items-center gap-1.5 mt-1">
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span>Restrito ao Admin</span>
                </p>
                <p className="text-[11px] text-slate-400 font-medium mt-1">
                  DRE protegido por perfil
                </p>
              </>
            )}
          </div>
        </div>

      </div>

      {/* Payment methods breakdown bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Distribuição por Meio de Pagamento (Liquidado)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-slate-500 font-medium">Pix</span>
            <p className="text-base font-bold font-mono text-slate-900 mt-0.5">{formatCurrency(totalPix)}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-slate-500 font-medium">Cartão de Crédito</span>
            <p className="text-base font-bold font-mono text-slate-900 mt-0.5">{formatCurrency(totalCredito)}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-slate-500 font-medium">Cartão de Débito</span>
            <p className="text-base font-bold font-mono text-slate-900 mt-0.5">{formatCurrency(totalDebito)}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-slate-500 font-medium">Dinheiro</span>
            <p className="text-base font-bold font-mono text-slate-900 mt-0.5">{formatCurrency(totalDinheiro)}</p>
          </div>
        </div>
      </div>

      {/* Transactions Table & Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Filters */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por paciente ou procedimento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 text-xs">
            {['todos', 'receita', 'despesa'].map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-colors cursor-pointer whitespace-nowrap ${
                  filterType === t
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {t === 'todos' ? 'Todas' : t === 'receita' ? 'Entradas (Procedimentos)' : 'Saídas (Despesas)'}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="p-3.5 pl-5">Data / Hora</th>
                <th className="p-3.5">Paciente / Destinatário</th>
                <th className="p-3.5">Procedimento / Motivo</th>
                <th className="p-3.5">Forma</th>
                <th className="p-3.5">Valor</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right pr-5">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredTransacoes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Nenhuma transação financeira encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredTransacoes.map(tx => {
                  const isIncome = tx.tipo === 'receita';
                  const dateFormatted = new Date(tx.data).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 pl-5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {dateFormatted}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900">
                        {tx.paciente_nome}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {tx.procedimento}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded-md text-[11px] text-slate-700 font-medium">
                          {getFormaLabel(tx.forma_pagamento)}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono font-bold whitespace-nowrap">
                        <span className={isIncome ? 'text-green-700' : 'text-red-600'}>
                          {isIncome ? '+' : '-'} {formatCurrency(tx.valor)}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <button
                          onClick={() => onUpdateTransactionStatus(tx.id, tx.status === 'pago' ? 'pendente' : 'pago')}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer capitalize ${
                            tx.status === 'pago'
                              ? 'bg-green-50 text-green-700 border-green-200/80 hover:bg-green-100'
                              : 'bg-amber-50 text-amber-700 border-amber-200/80 hover:bg-amber-100'
                          }`}
                        >
                          {tx.status}
                        </button>
                      </td>
                      <td className="p-3.5 text-right pr-5 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedTxForReceipt(tx)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Receipt className="w-3 h-3 text-indigo-600" />
                            <span>Recibo</span>
                          </button>

                          {isAdmin && onDeleteTransaction && (
                            <button
                              onClick={() => setTxToDelete(tx)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                              title="Excluir lançamento financeiro (Admin)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

      </div>

      {/* Modal: New Manual Transaction */}
      {isNewTxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Novo Lançamento Financeiro</h3>
              <button
                onClick={() => setIsNewTxModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tipo de Lançamento</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNovoTipo('receita')}
                    className={`py-2 rounded-lg font-bold border transition-colors cursor-pointer ${
                      novoTipo === 'receita'
                        ? 'bg-green-50 text-green-700 border-green-300 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    + Receita (Entrada)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNovoTipo('despesa')}
                    className={`py-2 rounded-lg font-bold border transition-colors cursor-pointer ${
                      novoTipo === 'despesa'
                        ? 'bg-red-50 text-red-700 border-red-300 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    - Despesa (Saída)
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Paciente / Fornecedor</label>
                <input
                  type="text"
                  required
                  placeholder="Nome da pessoa ou empresa..."
                  value={novoPacienteNome}
                  onChange={(e) => setNovoPacienteNome(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descrição / Procedimento</label>
                <input
                  type="text"
                  placeholder="Ex: Toxina Botulínica, Compra de Luvas..."
                  value={novoProcedimento}
                  onChange={(e) => setNovoProcedimento(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={novoValor || ''}
                    onChange={(e) => setNovoValor(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Forma</label>
                  <select
                    value={novaForma}
                    onChange={(e) => setNovaForma(e.target.value as FormaPagamento)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="pix">Pix</option>
                    <option value="cartao_credito">Cartão Crédito</option>
                    <option value="cartao_debito">Cartão Débito</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="transferencia">TED / Transf.</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observações</label>
                <input
                  type="text"
                  placeholder="Detalhes adicionais..."
                  value={novaObs}
                  onChange={(e) => setNovaObs(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewTxModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold cursor-pointer shadow-xs"
                >
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Digital Receipt (Recibo) */}
      {selectedTxForReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Recibo de Pagamento Clínico</h3>
              </div>
              <button
                onClick={() => setSelectedTxForReceipt(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Receipt Paper */}
            <div className="p-6 bg-slate-50/50 space-y-4 font-sans text-xs">
              <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
                
                {/* Clinic Brand */}
                <div className="text-center border-b border-slate-100 pb-4">
                  <h4 className="text-base font-bold text-slate-900">EstéticaOS Clínica Especializada</h4>
                  <p className="text-[11px] text-slate-500">CNPJ: 12.345.678/0001-90 • CRM/CRBM: 99482-SP</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Av. Paulista, 1000 - Jardins, São Paulo - SP</p>
                </div>

                {/* Receipt Title */}
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>RECIBO Nº #{selectedTxForReceipt.id.toUpperCase()}</span>
                  <span>{new Date(selectedTxForReceipt.data).toLocaleDateString('pt-BR')}</span>
                </div>

                {/* Values Box */}
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Recebemos de:</span>
                    <strong className="text-slate-900">{selectedTxForReceipt.paciente_nome}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Referente a:</span>
                    <span className="text-slate-800 font-semibold">{selectedTxForReceipt.procedimento}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Forma de Pagamento:</span>
                    <span className="text-slate-800">{getFormaLabel(selectedTxForReceipt.forma_pagamento)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 text-sm">
                    <span className="font-bold text-slate-800">VALOR TOTAL:</span>
                    <strong className="font-bold font-mono text-emerald-700">
                      {formatCurrency(selectedTxForReceipt.valor)}
                    </strong>
                  </div>
                </div>

                {/* Authentication stamp */}
                <div className="pt-3 text-center text-[10px] text-slate-400">
                  <p className="font-mono">Autenticação digital: {btoa(selectedTxForReceipt.id).substring(0, 16)}</p>
                  <p className="mt-1">Dra. Beatriz • Responsável Técnica</p>
                </div>

              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2 text-xs">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Recibo</span>
              </button>

              <button
                onClick={() => {
                  const text = `*RECIBO DE PAGAMENTO - EstéticaOS*\nPaciente: ${selectedTxForReceipt.paciente_nome}\nProcedimento: ${selectedTxForReceipt.procedimento}\nValor: ${formatCurrency(selectedTxForReceipt.valor)}\nForma: ${getFormaLabel(selectedTxForReceipt.forma_pagamento)}\nData: ${new Date(selectedTxForReceipt.data).toLocaleDateString('pt-BR')}\nObrigado pela preferência!`;
                  navigator.clipboard.writeText(text);
                  alert('Texto do recibo copiado para envio no WhatsApp!');
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Copiar p/ WhatsApp</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Delete Transaction Confirmation Modal */}
      {txToDelete && (
        <DeleteConfirmModal
          isOpen={!!txToDelete}
          onClose={() => setTxToDelete(null)}
          onConfirm={() => {
            if (txToDelete && onDeleteTransaction) {
              onDeleteTransaction(txToDelete.id);
            }
            setTxToDelete(null);
          }}
          title="Excluir Lançamento Financeiro"
          itemType="Lançamento Financeiro"
          itemName={`${txToDelete.tipo === 'receita' ? 'Receita' : 'Despesa'}: ${txToDelete.paciente_nome} - ${formatCurrency(txToDelete.valor)} (${txToDelete.procedimento})`}
          description="A exclusão deste lançamento removerá este registro contábil do histórico financeiro e recalculará os saldos da clínica."
        />
      )}

    </div>
  );
};
