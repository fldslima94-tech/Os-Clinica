import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Calendar,
  Filter,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Layers,
  ChevronDown,
  BarChart2,
  PieChart,
  Sparkles,
  Info,
  CalendarRange
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
  Legend
} from 'recharts';
import { TransacaoFinanceira } from '../types';

interface FinancialEvolutionChartProps {
  transacoes: TransacaoFinanceira[];
  className?: string;
}

type PeriodPreset = '3m' | '6m' | '12m' | 'ano_atual' | 'custom';
type ChartStyle = 'composed' | 'area' | 'bars';

const MONTH_NAMES_PT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

export const FinancialEvolutionChart: React.FC<FinancialEvolutionChartProps> = ({
  transacoes = [],
  className = '',
}) => {
  // Preset or custom date range
  const [preset, setPreset] = useState<PeriodPreset>('6m');
  const [chartStyle, setChartStyle] = useState<ChartStyle>('composed');

  // Custom date inputs
  const today = new Date();
  const defaultStart = new Date(today.getFullYear(), today.getMonth() - 5, 1);
  const [customStartDate, setCustomStartDate] = useState<string>(
    defaultStart.toISOString().split('T')[0]
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    today.toISOString().split('T')[0]
  );

  // Currency Formatter
  const formatCurrency = (val: number | undefined) => {
    return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // 1. Calculate effective start and end dates based on filter
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    if (preset === '3m') {
      start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    } else if (preset === '6m') {
      start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    } else if (preset === '12m') {
      start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    } else if (preset === 'ano_atual') {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    } else {
      // custom
      start = customStartDate ? new Date(customStartDate + 'T00:00:00') : new Date(now.getFullYear(), 0, 1);
      end = customEndDate ? new Date(customEndDate + 'T23:59:59') : new Date();
    }

    return { startDate: start, endDate: end };
  }, [preset, customStartDate, customEndDate]);

  // 2. Aggregate monthly data from non-deleted paid/all transactions within range
  const { chartData, totals, bestMonth, worstMonth } = useMemo(() => {
    const active = transacoes.filter(t => !t.excluido);
    
    // Map of Year-Month -> Aggregated numbers
    const monthlyMap: Record<string, {
      mesKey: string;
      label: string;
      sortKey: number;
      receitas: number;
      despesas: number;
      saldoLiquido: number;
      quantidadeReceitas: number;
      quantidadeDespesas: number;
    }> = {};

    // Helper to generate all months in interval so chart has continuous timeline
    const cur = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

    while (cur <= endMonth) {
      const y = cur.getFullYear();
      const m = cur.getMonth();
      const mesKey = `${y}-${String(m + 1).padStart(2, '0')}`;
      const sortKey = y * 100 + (m + 1);
      const label = `${MONTH_NAMES_PT[m]}/${String(y).slice(-2)}`;

      monthlyMap[mesKey] = {
        mesKey,
        label,
        sortKey,
        receitas: 0,
        despesas: 0,
        saldoLiquido: 0,
        quantidadeReceitas: 0,
        quantidadeDespesas: 0,
      };

      cur.setMonth(cur.getMonth() + 1);
    }

    // Process transactions
    active.forEach(t => {
      if (!t.data) return;
      const tDate = new Date(t.data);
      if (tDate < startDate || tDate > endDate) return;

      const y = tDate.getFullYear();
      const m = tDate.getMonth();
      const mesKey = `${y}-${String(m + 1).padStart(2, '0')}`;

      if (!monthlyMap[mesKey]) {
        const sortKey = y * 100 + (m + 1);
        const label = `${MONTH_NAMES_PT[m]}/${String(y).slice(-2)}`;
        monthlyMap[mesKey] = {
          mesKey,
          label,
          sortKey,
          receitas: 0,
          despesas: 0,
          saldoLiquido: 0,
          quantidadeReceitas: 0,
          quantidadeDespesas: 0,
        };
      }

      const val = Number(t.valor) || 0;
      const isEntrada = t.tipo === 'entrada' || t.tipo === 'receita';
      const isSaida = t.tipo === 'saida' || t.tipo === 'despesa';

      if (isEntrada) {
        monthlyMap[mesKey].receitas += val;
        monthlyMap[mesKey].quantidadeReceitas += 1;
      } else if (isSaida) {
        monthlyMap[mesKey].despesas += val;
        monthlyMap[mesKey].quantidadeDespesas += 1;
      }
    });

    // Compute net balance and sort
    const dataList = Object.values(monthlyMap)
      .map(item => ({
        ...item,
        saldoLiquido: item.receitas - item.despesas,
        margemPercentual: item.receitas > 0 ? ((item.receitas - item.despesas) / item.receitas) * 100 : 0
      }))
      .sort((a, b) => a.sortKey - b.sortKey);

    // Compute Totals
    const totReceitas = dataList.reduce((acc, m) => acc + m.receitas, 0);
    const totDespesas = dataList.reduce((acc, m) => acc + m.despesas, 0);
    const totSaldo = totReceitas - totDespesas;
    const margemMedia = totReceitas > 0 ? (totSaldo / totReceitas) * 100 : 0;

    // Find Best Month for Revenue
    let best = dataList[0];
    let worst = dataList[0];
    dataList.forEach(item => {
      if (!best || item.receitas > best.receitas) best = item;
      if (!worst || item.saldoLiquido < worst.saldoLiquido) worst = item;
    });

    return {
      chartData: dataList,
      totals: {
        totalReceitas: totReceitas,
        totalDespesas: totDespesas,
        saldoLiquido: totSaldo,
        margemMedia,
        mediaMensalReceita: dataList.length > 0 ? totReceitas / dataList.length : 0,
        mediaMensalDespesa: dataList.length > 0 ? totDespesas / dataList.length : 0,
      },
      bestMonth: best,
      worstMonth: worst,
    };
  }, [transacoes, startDate, endDate]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0]?.payload;
    if (!data) return null;

    const rec = data.receitas || 0;
    const desp = data.despesas || 0;
    const saldo = data.saldoLiquido || 0;
    const margem = data.margemPercentual || 0;

    return (
      <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-2xl border border-slate-700 text-xs min-w-[210px] space-y-2">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="font-bold text-slate-200 uppercase tracking-wider">{data.label}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            saldo >= 0 ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-rose-950 text-rose-300 border border-rose-800'
          }`}>
            {saldo >= 0 ? 'Superávit' : 'Déficit'}
          </span>
        </div>

        <div className="space-y-1.5 font-medium">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"></span>
              Receitas:
            </span>
            <span className="font-bold">{formatCurrency(rec)}</span>
          </div>

          <div className="flex items-center justify-between text-rose-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block"></span>
              Despesas:
            </span>
            <span className="font-bold">{formatCurrency(desp)}</span>
          </div>

          <div className="flex items-center justify-between pt-1.5 border-t border-slate-800 font-bold text-slate-100">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block"></span>
              Resultado Líquido:
            </span>
            <span className={saldo >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
              {formatCurrency(saldo)}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
            <span>Margem Líquida:</span>
            <span className="font-bold text-slate-300">{margem.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-6 ${className}`}>
      
      {/* Header with Title & Filter Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Evolução Financeira Mensal (Receitas vs. Despesas)
              </h3>
              <p className="text-xs text-slate-500">
                Acompanhamento temporal do fluxo de receitas, custos operacionais e margem de fechamento.
              </p>
            </div>
          </div>
        </div>

        {/* Date Range Selector & View Toggle */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          
          {/* Preset Buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setPreset('3m')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                preset === '3m' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3 Meses
            </button>
            <button
              type="button"
              onClick={() => setPreset('6m')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                preset === '6m' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              6 Meses
            </button>
            <button
              type="button"
              onClick={() => setPreset('12m')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                preset === '12m' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              12 Meses
            </button>
            <button
              type="button"
              onClick={() => setPreset('ano_atual')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                preset === 'ano_atual' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ano {today.getFullYear()}
            </button>
            <button
              type="button"
              onClick={() => setPreset('custom')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                preset === 'custom' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Personalizado</span>
            </button>
          </div>

          {/* Chart Style Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setChartStyle('composed')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                chartStyle === 'composed' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Visão Composta (Barras + Linha de Lucro)"
            >
              Misto
            </button>
            <button
              type="button"
              onClick={() => setChartStyle('area')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                chartStyle === 'area' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Área Suave"
            >
              Área
            </button>
            <button
              type="button"
              onClick={() => setChartStyle('bars')}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                chartStyle === 'bars' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Barras Lado a Lado"
            >
              Barras
            </button>
          </div>

        </div>

      </div>

      {/* Custom Date Pickers (Shown if 'custom' preset is active) */}
      {preset === 'custom' && (
        <div className="flex flex-wrap items-center gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CalendarRange className="w-4 h-4 text-indigo-600" />
            <span className="font-bold">Intervalo de Datas:</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-slate-500 font-medium">De:</label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-slate-500 font-medium">Até:</label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Mini Performance Cards for Filtered Range */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl">
          <div className="flex items-center justify-between text-emerald-800 text-[11px] font-bold uppercase">
            <span>Receitas do Período</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
          <p className="text-lg sm:text-xl font-black text-emerald-700 mt-1">
            {formatCurrency(totals.totalReceitas)}
          </p>
          <span className="text-[10px] text-emerald-600/80 font-medium">
            Média: {formatCurrency(totals.mediaMensalReceita)}/mês
          </span>
        </div>

        <div className="p-3 bg-rose-50/60 border border-rose-100 rounded-xl">
          <div className="flex items-center justify-between text-rose-800 text-[11px] font-bold uppercase">
            <span>Despesas do Período</span>
            <ArrowDownRight className="w-3.5 h-3.5" />
          </div>
          <p className="text-lg sm:text-xl font-black text-rose-700 mt-1">
            {formatCurrency(totals.totalDespesas)}
          </p>
          <span className="text-[10px] text-rose-600/80 font-medium">
            Média: {formatCurrency(totals.mediaMensalDespesa)}/mês
          </span>
        </div>

        <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl">
          <div className="flex items-center justify-between text-indigo-800 text-[11px] font-bold uppercase">
            <span>Resultado Líquido</span>
            <DollarSign className="w-3.5 h-3.5" />
          </div>
          <p className={`text-lg sm:text-xl font-black mt-1 ${totals.saldoLiquido >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>
            {formatCurrency(totals.saldoLiquido)}
          </p>
          <span className="text-[10px] text-indigo-600/80 font-medium">
            Margem Líquida: {totals.margemMedia.toFixed(1)}%
          </span>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between text-slate-600 text-[11px] font-bold uppercase">
            <span>Melhor Faturamento</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <p className="text-lg sm:text-xl font-black text-slate-800 mt-1">
            {bestMonth ? formatCurrency(bestMonth.receitas) : 'R$ 0,00'}
          </p>
          <span className="text-[10px] text-slate-500 font-medium">
            {bestMonth ? `Recorde em ${bestMonth.label}` : 'Sem dados'}
          </span>
        </div>
      </div>

      {/* Recharts Canvas */}
      <div className="w-full h-[280px] sm:h-[340px] pt-2">
        {chartData.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs">
            <BarChart2 className="w-8 h-8 mb-2 opacity-40" />
            <span>Nenhum dado financeiro para o período selecionado.</span>
          </div>
        ) : chartStyle === 'area' ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `R$ ${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ paddingBottom: 15, fontSize: 11, fontWeight: 600 }}
              />
              <Area
                type="monotone"
                dataKey="receitas"
                name="Receitas"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorReceitas)"
              />
              <Area
                type="monotone"
                dataKey="despesas"
                name="Despesas"
                stroke="#f43f5e"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorDespesas)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : chartStyle === 'bars' ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `R$ ${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ paddingBottom: 15, fontSize: 11, fontWeight: 600 }}
              />
              <Bar dataKey="receitas" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="despesas" name="Despesas" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRecComposed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.9} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `R$ ${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ paddingBottom: 15, fontSize: 11, fontWeight: 600 }}
              />
              <Bar dataKey="receitas" name="Receitas" fill="url(#colorRecComposed)" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Bar dataKey="despesas" name="Despesas" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={28} />
              <Line
                type="monotone"
                dataKey="saldoLiquido"
                name="Resultado Líquido"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ r: 4, fill: '#6366f1', stroke: '#ffffff', strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  );
};
