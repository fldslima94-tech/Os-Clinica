import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart3,
  Users,
  Sparkles,
  Calendar,
  Filter,
  Printer,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Award,
  Zap,
  Percent,
  Layers,
  ChevronRight,
  Scissors,
  Activity,
  CreditCard,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TransacaoFinanceira,
  ProcedimentoClinico,
  UsuarioEquipe,
  DespesaRecorrente,
} from '../types';

interface FinancialReportsViewProps {
  transacoes: TransacaoFinanceira[];
  procedimentos?: ProcedimentoClinico[];
  profissionais?: UsuarioEquipe[];
  despesasRecorrentes?: DespesaRecorrente[];
  className?: string;
}

const MONTH_NAMES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

const COLORS = [
  '#4f46e5', // indigo-600
  '#059669', // emerald-600
  '#0284c7', // sky-600
  '#d97706', // amber-600
  '#db2777', // pink-600
  '#7c3aed', // violet-600
  '#0d9488', // teal-600
  '#e11d48', // rose-600
];

const FORMA_COLORS: Record<string, string> = {
  pix: '#059669',
  cartao_credito: '#4f46e5',
  cartao_debito: '#0284c7',
  dinheiro: '#d97706',
  transferencia: '#7c3aed',
  boleto: '#64748b',
};

const FORMA_LABELS: Record<string, string> = {
  pix: 'Pix Instantâneo',
  cartao_credito: 'Cartão de Crédito',
  cartao_debito: 'Cartão de Débito',
  dinheiro: 'Dinheiro em Espécie',
  transferencia: 'Transferência Bancária',
  boleto: 'Boleto Bancário',
};

export const FinancialReportsView: React.FC<FinancialReportsViewProps> = ({
  transacoes = [],
  procedimentos = [],
  profissionais = [],
  despesasRecorrentes = [],
  className = '',
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'6m' | '12m' | 'ano_atual' | 'todos'>('12m');
  const [onlyPaid, setOnlyPaid] = useState<boolean>(true);
  const [selectedProfissionalFilter, setSelectedProfissionalFilter] = useState<string>('todos');
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');

  // 1. Filtragem Base de Transações
  const validTransacoes = useMemo(() => {
    return transacoes.filter((t) => {
      if (t.excluido) return false;
      if (onlyPaid && t.status !== 'pago') return false;
      if (selectedProfissionalFilter !== 'todos') {
        const profNome = t.profissional_nome || 'Não Atribuído';
        if (profNome !== selectedProfissionalFilter) return false;
      }
      return true;
    });
  }, [transacoes, onlyPaid, selectedProfissionalFilter]);

  // Formatação de Moeda
  const formatCurrency = (val: number) => {
    return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatNumber = (val: number) => {
    return (val || 0).toLocaleString('pt-BR');
  };

  // 2. Agrupamento Mensal para Gráfico de Faturamento
  const monthlyData = useMemo(() => {
    const map: Record<string, {
      mesKey: string;
      label: string;
      sortKey: number;
      entradas: number;
      saidas: number;
      custoInsumos: number;
      lucroLiquido: number;
      quantidadeAtendimentos: number;
    }> = {};

    const now = new Date();
    const currentYear = now.getFullYear();

    // Inicializar os últimos 12 meses caso período seja 12m ou ano_atual
    const monthsBack = selectedPeriod === '6m' ? 6 : selectedPeriod === '12m' ? 12 : 12;
    for (let i = monthsBack - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const mesKey = `${y}-${String(m + 1).padStart(2, '0')}`;
      const sortKey = y * 100 + (m + 1);
      map[mesKey] = {
        mesKey,
        label: `${MONTH_NAMES[m]}/${String(y).slice(2)}`,
        sortKey,
        entradas: 0,
        saidas: 0,
        custoInsumos: 0,
        lucroLiquido: 0,
        quantidadeAtendimentos: 0,
      };
    }

    validTransacoes.forEach((t) => {
      if (!t.data) return;
      const d = new Date(t.data);
      if (isNaN(d.getTime())) return;

      const y = d.getFullYear();
      const m = d.getMonth();
      const mesKey = `${y}-${String(m + 1).padStart(2, '0')}`;
      const sortKey = y * 100 + (m + 1);

      if (!map[mesKey]) {
        map[mesKey] = {
          mesKey,
          label: `${MONTH_NAMES[m]}/${String(y).slice(2)}`,
          sortKey,
          entradas: 0,
          saidas: 0,
          custoInsumos: 0,
          lucroLiquido: 0,
          quantidadeAtendimentos: 0,
        };
      }

      const isEntrada = t.tipo === 'entrada' || t.tipo === 'receita';
      const isSaida = t.tipo === 'saida' || t.tipo === 'despesa';

      if (isEntrada) {
        map[mesKey].entradas += Number(t.valor) || 0;
        map[mesKey].custoInsumos += Number(t.custo_insumos) || 0;
        map[mesKey].quantidadeAtendimentos += 1;
      } else if (isSaida) {
        map[mesKey].saidas += Number(t.valor) || 0;
      }
    });

    // Calcular Lucro Líquido
    const list = Object.values(map).map((item) => ({
      ...item,
      lucroLiquido: item.entradas - item.saidas,
      margemPercentual: item.entradas > 0 
        ? Math.round(((item.entradas - item.saidas) / item.entradas) * 100) 
        : 0,
    }));

    list.sort((a, b) => a.sortKey - b.sortKey);

    if (selectedPeriod === '6m') {
      return list.slice(-6);
    }
    if (selectedPeriod === 'ano_atual') {
      return list.filter((item) => Math.floor(item.sortKey / 100) === currentYear);
    }
    if (selectedPeriod === '12m') {
      return list.slice(-12);
    }
    return list;
  }, [validTransacoes, selectedPeriod]);

  // 3. Agrupamento por Procedimento (Lucratividade & Faturamento)
  const procedureProfitData = useMemo(() => {
    const map: Record<string, {
      nome: string;
      faturamento: number;
      custoInsumos: number;
      lucro: number;
      atendimentos: number;
      ticketMedio: number;
      margemLucro: number;
    }> = {};

    validTransacoes.forEach((t) => {
      const isEntrada = t.tipo === 'entrada' || t.tipo === 'receita';
      if (!isEntrada) return;

      const procNome = t.procedimento?.trim() || 'Outros / Avulsos';
      if (!map[procNome]) {
        map[procNome] = {
          nome: procNome,
          faturamento: 0,
          custoInsumos: 0,
          lucro: 0,
          atendimentos: 0,
          ticketMedio: 0,
          margemLucro: 0,
        };
      }

      const val = Number(t.valor) || 0;
      const custo = Number(t.custo_insumos) || 0;

      map[procNome].faturamento += val;
      map[procNome].custoInsumos += custo;
      map[procNome].lucro += (val - custo);
      map[procNome].atendimentos += 1;
    });

    const list = Object.values(map).map((item) => {
      const ticketMedio = item.atendimentos > 0 ? item.faturamento / item.atendimentos : 0;
      const margemLucro = item.faturamento > 0 ? Math.round((item.lucro / item.faturamento) * 100) : 0;
      return {
        ...item,
        ticketMedio,
        margemLucro,
      };
    });

    // Ordenar pelos procedimentos com maior faturamento
    return list.sort((a, b) => b.faturamento - a.faturamento);
  }, [validTransacoes]);

  // 4. Agrupamento por Profissional (Volume & Faturamento)
  const professionalPerformanceData = useMemo(() => {
    const map: Record<string, {
      profissional: string;
      faturamento: number;
      atendimentos: number;
      ticketMedio: number;
      percentualReceita: number;
    }> = {};

    let totalReceitaGeral = 0;

    validTransacoes.forEach((t) => {
      const isEntrada = t.tipo === 'entrada' || t.tipo === 'receita';
      if (!isEntrada) return;

      const prof = t.profissional_nome?.trim() || 'Clínica / Recepção';
      if (!map[prof]) {
        map[prof] = {
          profissional: prof,
          faturamento: 0,
          atendimentos: 0,
          ticketMedio: 0,
          percentualReceita: 0,
        };
      }

      const val = Number(t.valor) || 0;
      map[prof].faturamento += val;
      map[prof].atendimentos += 1;
      totalReceitaGeral += val;
    });

    const list = Object.values(map).map((item) => ({
      ...item,
      ticketMedio: item.atendimentos > 0 ? item.faturamento / item.atendimentos : 0,
      percentualReceita: totalReceitaGeral > 0 ? Math.round((item.faturamento / totalReceitaGeral) * 100) : 0,
    }));

    return list.sort((a, b) => b.faturamento - a.faturamento);
  }, [validTransacoes]);

  // 5. Agrupamento por Forma de Pagamento
  const paymentMethodsData = useMemo(() => {
    const map: Record<string, {
      forma: string;
      label: string;
      valor: number;
      quantidade: number;
    }> = {};

    validTransacoes.forEach((t) => {
      const isEntrada = t.tipo === 'entrada' || t.tipo === 'receita';
      if (!isEntrada) return;

      const formaKey = t.forma_pagamento || 'pix';
      if (!map[formaKey]) {
        map[formaKey] = {
          forma: formaKey,
          label: FORMA_LABELS[formaKey] || formaKey,
          valor: 0,
          quantidade: 0,
        };
      }

      map[formaKey].valor += Number(t.valor) || 0;
      map[formaKey].quantidade += 1;
    });

    return Object.values(map).sort((a, b) => b.valor - a.valor);
  }, [validTransacoes]);

  // 6. KPIs Gerais do Período
  const totalFaturamento = useMemo(() => {
    return validTransacoes
      .filter((t) => t.tipo === 'entrada' || t.tipo === 'receita')
      .reduce((acc, t) => acc + (Number(t.valor) || 0), 0);
  }, [validTransacoes]);

  const totalDespesas = useMemo(() => {
    return validTransacoes
      .filter((t) => t.tipo === 'saida' || t.tipo === 'despesa')
      .reduce((acc, t) => acc + (Number(t.valor) || 0), 0);
  }, [validTransacoes]);

  const totalCustoInsumos = useMemo(() => {
    return validTransacoes
      .filter((t) => t.tipo === 'entrada' || t.tipo === 'receita')
      .reduce((acc, t) => acc + (Number(t.custo_insumos) || 0), 0);
  }, [validTransacoes]);

  const lucroLiquidoGeral = totalFaturamento - totalDespesas;
  const margemLucroGeral = totalFaturamento > 0 ? Math.round((lucroLiquidoGeral / totalFaturamento) * 100) : 0;

  const totalAtendimentosCount = useMemo(() => {
    return validTransacoes.filter((t) => t.tipo === 'entrada' || t.tipo === 'receita').length;
  }, [validTransacoes]);

  const ticketMedioGeral = totalAtendimentosCount > 0 ? totalFaturamento / totalAtendimentosCount : 0;

  const topProcedimento = procedureProfitData[0] || null;
  const topProfissional = professionalPerformanceData[0] || null;

  // Lista de profissionais para filtro
  const availableProfessionals = useMemo(() => {
    const set = new Set<string>();
    transacoes.forEach((t) => {
      if (t.profissional_nome) set.add(t.profissional_nome);
    });
    return Array.from(set);
  }, [transacoes]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      
      {/* Header & Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Relatórios Financeiros & Performance
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                  Recharts Analytics
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Análise em tempo real de faturamento, rentabilidade por procedimento e volume por especialista
              </p>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          {/* Period Selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
            <button
              onClick={() => setSelectedPeriod('6m')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedPeriod === '6m' ? 'bg-white text-indigo-700 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              6 Meses
            </button>
            <button
              onClick={() => setSelectedPeriod('12m')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedPeriod === '12m' ? 'bg-white text-indigo-700 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              12 Meses
            </button>
            <button
              onClick={() => setSelectedPeriod('ano_atual')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedPeriod === 'ano_atual' ? 'bg-white text-indigo-700 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              Este Ano
            </button>
            <button
              onClick={() => setSelectedPeriod('todos')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                selectedPeriod === 'todos' ? 'bg-white text-indigo-700 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              Todos
            </button>
          </div>

          {/* Professional Filter */}
          {availableProfessionals.length > 0 && (
            <select
              value={selectedProfissionalFilter}
              onChange={(e) => setSelectedProfissionalFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="todos">Todos Profissionais</option>
              {availableProfessionals.map((prof) => (
                <option key={prof} value={prof}>
                  {prof}
                </option>
              ))}
            </select>
          )}

          {/* Only Paid Toggle */}
          <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyPaid}
              onChange={(e) => setOnlyPaid(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Apenas Pagos</span>
          </label>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="p-2 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            title="Imprimir Relatório"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Faturamento Bruto */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Faturamento Bruto</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-700 mt-2">
            {formatCurrency(totalFaturamento)}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-2 font-medium">
            <span>{totalAtendimentosCount} atendimentos realizados</span>
          </div>
        </div>

        {/* Despesas & Insumos */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Despesas & Saídas</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-rose-700 mt-2">
            {formatCurrency(totalDespesas)}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-2 font-medium">
            <span>Custo insumos: {formatCurrency(totalCustoInsumos)}</span>
          </div>
        </div>

        {/* Lucro Líquido Real */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Lucro Líquido de Caixa</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-bold mt-2 ${lucroLiquidoGeral >= 0 ? 'text-indigo-900' : 'text-rose-600'}`}>
            {formatCurrency(lucroLiquidoGeral)}
          </p>
          <div className="flex items-center gap-1 text-[11px] font-semibold mt-2">
            <span className={`px-1.5 py-0.5 rounded-md ${margemLucroGeral >= 50 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
              Margem: {margemLucroGeral}%
            </span>
            <span className="text-slate-400 font-normal">sobre a receita</span>
          </div>
        </div>

        {/* Ticket Médio & Destaque */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Ticket Médio por Cliente</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-900 mt-2">
            {formatCurrency(ticketMedioGeral)}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-2 truncate font-medium">
            <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate">Top: {topProcedimento?.nome || 'Nenhum'}</span>
          </div>
        </div>

      </div>

      {/* GRÁFICO 1: Evolução Mensal do Faturamento & Lucro */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Evolução Temporal: Faturamento vs. Despesas vs. Lucro Líquido
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Acompanhamento mês a mês das receitas geradas, custos operacionais e resultado líquido
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
              <button
                onClick={() => setChartType('area')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  chartType === 'area' ? 'bg-white text-indigo-700 shadow-2xs' : 'hover:text-slate-900'
                }`}
              >
                Área Suave
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  chartType === 'bar' ? 'bg-white text-indigo-700 shadow-2xs' : 'hover:text-slate-900'
                }`}
              >
                Barras Compostas
              </button>
            </div>
          </div>
        </div>

        {monthlyData.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            Nenhuma transação encontrada para o período selecionado.
          </div>
        ) : (
          <div className="h-[340px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorLucro" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorSaidas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e11d48" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#e11d48" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `R$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      fontSize: '12px',
                    }}
                    formatter={(val: any, name: string) => {
                      const labels: Record<string, string> = {
                        entradas: 'Faturamento (Receita)',
                        saidas: 'Despesas / Saídas',
                        lucroLiquido: 'Lucro Líquido',
                      };
                      return [formatCurrency(Number(val) || 0), labels[name] || name];
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    formatter={(value) => {
                      const map: Record<string, string> = {
                        entradas: 'Faturamento Bruto',
                        saidas: 'Despesas Operacionais',
                        lucroLiquido: 'Lucro Líquido Real',
                      };
                      return <span className="text-xs font-semibold text-slate-700">{map[value] || value}</span>;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="entradas"
                    stroke="#059669"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorEntradas)"
                  />
                  <Area
                    type="monotone"
                    dataKey="lucroLiquido"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorLucro)"
                  />
                  <Area
                    type="monotone"
                    dataKey="saidas"
                    stroke="#e11d48"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorSaidas)"
                  />
                </AreaChart>
              ) : (
                <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    tickFormatter={(val) => `R$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => formatCurrency(Number(val) || 0)}
                  />
                  <Legend
                    verticalAlign="top"
                    height={36}
                    formatter={(value) => {
                      const map: Record<string, string> = {
                        entradas: 'Faturamento Bruto',
                        saidas: 'Despesas Operacionais',
                        lucroLiquido: 'Lucro Líquido',
                      };
                      return <span className="text-xs font-semibold text-slate-700">{map[value] || value}</span>;
                    }}
                  />
                  <Bar dataKey="entradas" fill="#059669" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="saidas" fill="#e11d48" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="lucroLiquido" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 2 Column Layout: Procedimentos & Profissionais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* GRÁFICO 2: Comparativo de Lucro por Procedimento */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-indigo-600" />
                  Rentabilidade por Procedimento
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Comparativo entre receita total e margem de lucro líquido apurado
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                Top {Math.min(6, procedureProfitData.length)}
              </span>
            </div>

            {procedureProfitData.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                Nenhum procedimento com receita registrada.
              </div>
            ) : (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={procedureProfitData.slice(0, 6)}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis
                      type="number"
                      stroke="#64748b"
                      fontSize={11}
                      tickFormatter={(val) => `R$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                    />
                    <YAxis
                      dataKey="nome"
                      type="category"
                      stroke="#475569"
                      fontSize={11}
                      width={110}
                      tickLine={false}
                      tickFormatter={(name) => name.length > 15 ? `${name.slice(0, 14)}...` : name}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                      }}
                      formatter={(val: any, name: string) => {
                        const label = name === 'faturamento' ? 'Faturamento' : 'Lucro Estimado';
                        return [formatCurrency(Number(val)), label];
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      height={30}
                      formatter={(value) => (
                        <span className="text-xs font-semibold text-slate-700">
                          {value === 'faturamento' ? 'Faturamento Total' : 'Lucro Líquido'}
                        </span>
                      )}
                    />
                    <Bar dataKey="faturamento" fill="#0284c7" radius={[0, 4, 4, 0]} maxBarSize={16} />
                    <Bar dataKey="lucro" fill="#059669" radius={[0, 4, 4, 0]} maxBarSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Mini Table of Top Procedures */}
          {procedureProfitData.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                    <th className="pb-2">Procedimento</th>
                    <th className="pb-2 text-center">Atend.</th>
                    <th className="pb-2 text-right">Faturamento</th>
                    <th className="pb-2 text-right">Margem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {procedureProfitData.slice(0, 4).map((proc, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 text-slate-800 font-semibold truncate max-w-[150px]">
                        {proc.nome}
                      </td>
                      <td className="py-2 text-center text-slate-600 font-bold">
                        {proc.atendimentos}x
                      </td>
                      <td className="py-2 text-right text-emerald-700 font-bold">
                        {formatCurrency(proc.faturamento)}
                      </td>
                      <td className="py-2 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          proc.margemLucro >= 60 ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {proc.margemLucro}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* GRÁFICO 3: Volume & Faturamento por Profissional */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Volume & Receita por Profissional
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Distribuição de atendimentos e produtividade da equipe clínica
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                {professionalPerformanceData.length} Especialistas
              </span>
            </div>

            {professionalPerformanceData.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-xs">
                Nenhum atendimento atribuído a profissionais no período.
              </div>
            ) : (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={professionalPerformanceData}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="profissional"
                      stroke="#475569"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(name) => name.split(' ')[0]}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) => `R$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#d97706"
                      fontSize={11}
                      tickLine={false}
                      tickFormatter={(val) => `${val}x`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                      }}
                      formatter={(val: any, name: string) => {
                        if (name === 'faturamento') return [formatCurrency(Number(val)), 'Faturamento'];
                        return [`${val} atendimentos`, 'Volume de Sessões'];
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      height={30}
                      formatter={(value) => (
                        <span className="text-xs font-semibold text-slate-700">
                          {value === 'faturamento' ? 'Faturamento Gerado' : 'Qtd Atendimentos'}
                        </span>
                      )}
                    />
                    <Bar yAxisId="left" dataKey="faturamento" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar yAxisId="right" dataKey="atendimentos" fill="#d97706" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Mini Table of Professionals */}
          {professionalPerformanceData.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                    <th className="pb-2">Especialista</th>
                    <th className="pb-2 text-center">Atendimentos</th>
                    <th className="pb-2 text-right">Faturamento</th>
                    <th className="pb-2 text-right">Ticket Médio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {professionalPerformanceData.slice(0, 4).map((prof, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 text-slate-800 font-semibold truncate max-w-[150px]">
                        {prof.profissional}
                      </td>
                      <td className="py-2 text-center text-slate-600 font-bold">
                        {prof.atendimentos}
                      </td>
                      <td className="py-2 text-right text-indigo-700 font-bold">
                        {formatCurrency(prof.faturamento)}
                      </td>
                      <td className="py-2 text-right text-slate-600">
                        {formatCurrency(prof.ticketMedio)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* GRÁFICO 4: Distribuição por Forma de Pagamento */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              Mix de Formas de Pagamento & Liquidez
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Participação de Pix, Cartão de Crédito, Débito e Dinheiro no faturamento
            </p>
          </div>
        </div>

        {paymentMethodsData.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Nenhuma informação de pagamento registrada.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6">
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethodsData}
                    dataKey="valor"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {paymentMethodsData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={FORMA_COLORS[entry.forma] || COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => formatCurrency(Number(val))}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* List of Payment Badges */}
            <div className="space-y-2.5">
              {paymentMethodsData.map((item, idx) => {
                const perc = totalFaturamento > 0 ? Math.round((item.valor / totalFaturamento) * 100) : 0;
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: FORMA_COLORS[item.forma] || COLORS[idx % COLORS.length] }}
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800">{item.label}</p>
                        <p className="text-[11px] text-slate-400">{item.quantidade} transações</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-900">{formatCurrency(item.valor)}</p>
                      <p className="text-[11px] font-semibold text-indigo-600">{perc}% do total</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
