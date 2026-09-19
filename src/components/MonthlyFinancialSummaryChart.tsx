import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Calendar,
  Percent,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  ExternalLink,
  Wallet,
  Activity,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Layers,
  LineChart as LineChartIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import { TransacaoFinanceira, DespesaRecorrente } from '../types';

interface MonthlyFinancialSummaryChartProps {
  transacoes: TransacaoFinanceira[];
  despesasRecorrentes?: DespesaRecorrente[];
  selectedMonth?: number;
  selectedYear?: number;
  onGoToFinancial?: () => void;
  className?: string;
}

type PeriodPreset = '6m' | '12m' | 'ano_atual';

const MONTH_NAMES_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

const MONTH_NAMES_FULL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const formatBRL = (val: number | undefined) => {
  return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatCompactBRL = (val: number) => {
  if (Math.abs(val) >= 1000000) {
    return `R$ ${(val / 1000000).toFixed(1)}M`;
  }
  if (Math.abs(val) >= 1000) {
    return `R$ ${(val / 1000).toFixed(0)}k`;
  }
  return `R$ ${val}`;
};

// Tooltip customizado para o Recharts, mantido fora do componente para preservar identidade de renderização
const MonthlySummaryCustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  const rec = data.receitas || 0;
  const desp = data.despesas || 0;
  const saldo = data.saldoLiquido || 0;
  const margem = data.margemPercentual || 0;
  const tendenciaRecorrente = data.tendenciaRecorrente || 0;
  const isSuperavit = saldo >= 0;
  const isProj = Boolean(data.isProjection);

  return (
    <div className="bg-slate-900/95 text-white p-3.5 rounded-xl shadow-2xl border border-slate-700/80 text-xs min-w-[240px] backdrop-blur-md space-y-2">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-100 uppercase tracking-wider">{data.fullLabel || label}</span>
          {isProj && (
            <span className="px-1.5 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-wider bg-purple-500/25 text-purple-300 border border-purple-400/40">
              Projeção
            </span>
          )}
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold whitespace-nowrap ${
          isSuperavit
            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
            : 'bg-rose-950 text-rose-300 border border-rose-800'
        }`}>
          {isSuperavit ? 'Superávit' : 'Déficit'}
        </span>
      </div>

      <div className="space-y-1.5 font-medium">
        <div className="flex items-center justify-between text-emerald-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block shrink-0" />
            {isProj ? 'Receita Estimada:' : 'Receitas:'}
          </span>
          <span className="font-bold font-mono">{formatBRL(rec)}</span>
        </div>

        <div className="flex items-center justify-between text-rose-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block shrink-0" />
            {isProj ? 'Despesa Projetada:' : 'Despesas:'}
          </span>
          <span className="font-bold font-mono">{formatBRL(desp)}</span>
        </div>

        {tendenciaRecorrente > 0 && (
          <div className="flex items-center justify-between text-purple-300 pt-0.5">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-purple-400 inline-block shrink-0" />
              Tendência Recorrente:
            </span>
            <span className="font-bold font-mono text-purple-200">{formatBRL(tendenciaRecorrente)}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-1.5 border-t border-slate-800 font-bold">
          <span className="flex items-center gap-1.5 text-slate-200">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            {isProj ? 'Saldo Projetado:' : 'Saldo do Mês:'}
          </span>
          <span className={`font-mono ${isSuperavit ? 'text-emerald-300' : 'text-rose-300'}`}>
            {isSuperavit ? '+' : ''}{formatBRL(saldo)}
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5 border-t border-slate-800/60">
          <span>Margem Operacional:</span>
          <span className={`font-bold font-mono ${margem >= 20 ? 'text-emerald-400' : margem >= 0 ? 'text-amber-300' : 'text-rose-400'}`}>
            {margem.toFixed(1)}%
          </span>
        </div>

        {isProj && tendenciaRecorrente > 0 && rec > 0 && (
          <div className="flex items-center justify-between text-[10px] text-purple-300 pt-0.5">
            <span>Cobertura de Custos Fixos:</span>
            <span className="font-bold font-mono text-white">
              {((rec / tendenciaRecorrente) * 100).toFixed(0)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export const MonthlyFinancialSummaryChart: React.FC<MonthlyFinancialSummaryChartProps> = ({
  transacoes = [],
  despesasRecorrentes = [],
  selectedMonth,
  selectedYear,
  onGoToFinancial,
  className = '',
}) => {
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('6m');
  const [onlyPaid, setOnlyPaid] = useState<boolean>(true);
  const [showProjection, setShowProjection] = useState<boolean>(true);
  const [showTrendLine, setShowTrendLine] = useState<boolean>(true);

  // 1. Calcula o compromisso mensal com base nas despesas recorrentes cadastradas e ativas
  const { totalRecorrenteMensal, totalRecorrentesAtivas } = useMemo(() => {
    const ativas = despesasRecorrentes.filter(d => d.status === 'ativo');
    let total = 0;

    ativas.forEach(d => {
      const val = Number(d.valor) || 0;
      let mensalVal = val;
      if (d.recorrencia === 'semanal') mensalVal = val * (52 / 12);
      else if (d.recorrencia === 'anual') mensalVal = val / 12;

      total += mensalVal;
    });

    return {
      totalRecorrenteMensal: Math.round(total * 100) / 100,
      totalRecorrentesAtivas: ativas.length,
    };
  }, [despesasRecorrentes]);

  // 2. Determina a lista de meses históricos + projeção de 3 meses futuros
  const chartData = useMemo(() => {
    const now = new Date();
    const currentRefYear = selectedYear ?? now.getFullYear();
    const currentRefMonth = selectedMonth ?? now.getMonth();

    const historicalMonths: { year: number; month: number; key: string; label: string; fullLabel: string }[] = [];

    if (periodPreset === 'ano_atual') {
      // Todos os 12 meses do ano selecionado (ou ano atual)
      for (let m = 0; m < 12; m++) {
        const key = `${currentRefYear}-${String(m + 1).padStart(2, '0')}`;
        historicalMonths.push({
          year: currentRefYear,
          month: m,
          key,
          label: MONTH_NAMES_SHORT[m],
          fullLabel: `${MONTH_NAMES_FULL[m]} de ${currentRefYear}`
        });
      }
    } else {
      const count = periodPreset === '6m' ? 6 : 12;
      // Retroage 'count' meses a partir do mês de referência
      for (let i = count - 1; i >= 0; i--) {
        const d = new Date(currentRefYear, currentRefMonth - i, 1);
        const y = d.getFullYear();
        const m = d.getMonth();
        const key = `${y}-${String(m + 1).padStart(2, '0')}`;
        historicalMonths.push({
          year: y,
          month: m,
          key,
          label: `${MONTH_NAMES_SHORT[m]}/${String(y).slice(-2)}`,
          fullLabel: `${MONTH_NAMES_FULL[m]} de ${y}`
        });
      }
    }

    // Agrupa transações históricas pelos meses calculados
    const map = new Map<string, { receitas: number; despesas: number; count: number }>();
    historicalMonths.forEach(m => map.set(m.key, { receitas: 0, despesas: 0, count: 0 }));

    let totalRecHistVal = 0;
    let monthsWithRevenueCount = 0;
    let totalDespHistVal = 0;
    let monthsWithExpenseCount = 0;

    transacoes.forEach(t => {
      if (t.excluido) return;
      if (onlyPaid && t.status !== 'pago') return;

      try {
        const d = new Date(t.data);
        const y = d.getFullYear();
        const m = d.getMonth();
        const key = `${y}-${String(m + 1).padStart(2, '0')}`;

        if (map.has(key)) {
          const entry = map.get(key)!;
          const val = Number(t.valor) || 0;
          const isReceita = t.tipo === 'entrada' || t.tipo === 'receita';
          const isDespesa = t.tipo === 'saida' || t.tipo === 'despesa';

          if (isReceita) {
            entry.receitas += val;
            entry.count += 1;
          } else if (isDespesa) {
            entry.despesas += val;
            entry.count += 1;
          }
        }
      } catch {
        // Ignora data inválida
      }
    });

    const historicalDataPoints = historicalMonths.map(m => {
      const entry = map.get(m.key) || { receitas: 0, despesas: 0, count: 0 };
      const rec = entry.receitas;
      const desp = entry.despesas;
      const saldo = rec - desp;
      const margem = rec > 0 ? (saldo / rec) * 100 : 0;
      const isSelected = selectedMonth !== undefined && selectedYear !== undefined && m.month === selectedMonth && m.year === selectedYear;

      if (rec > 0) {
        totalRecHistVal += rec;
        monthsWithRevenueCount += 1;
      }
      if (desp > 0) {
        totalDespHistVal += desp;
        monthsWithExpenseCount += 1;
      }

      return {
        key: m.key,
        label: m.label,
        fullLabel: m.fullLabel,
        receitas: Math.round(rec * 100) / 100,
        despesas: Math.round(desp * 100) / 100,
        saldoLiquido: Math.round(saldo * 100) / 100,
        margemPercentual: Math.round(margem * 10) / 10,
        tendenciaRecorrente: totalRecorrenteMensal > 0 ? totalRecorrenteMensal : (desp > 0 ? desp : 0),
        count: entry.count,
        isSelected,
        isProjection: false
      };
    });

    // Se a projeção de 3 meses estiver desativada, retorna apenas o histórico
    if (!showProjection) {
      return historicalDataPoints;
    }

    // Calcula parâmetros de estimativa para os próximos 3 meses
    // Média móvel de receita (com base nos últimos meses com movimentação)
    const mediaReceitaMensal = monthsWithRevenueCount > 0 
      ? Math.round((totalRecHistVal / monthsWithRevenueCount) * 100) / 100 
      : 0;

    // Custos variáveis históricos médios (além da base recorrente)
    const mediaDespesasMensal = monthsWithExpenseCount > 0
      ? Math.round((totalDespHistVal / monthsWithExpenseCount) * 100) / 100
      : 0;

    const mediaCustoVariavel = Math.max(0, mediaDespesasMensal - totalRecorrenteMensal);

    // Constrói os próximos 3 meses a partir do mês atual
    const projectionDataPoints = [];
    const baseDateYear = selectedYear ?? now.getFullYear();
    const baseDateMonth = selectedMonth ?? now.getMonth();

    for (let step = 1; step <= 3; step++) {
      const projDate = new Date(baseDateYear, baseDateMonth + step, 1);
      const py = projDate.getFullYear();
      const pm = projDate.getMonth();
      const pKey = `${py}-${String(pm + 1).padStart(2, '0')}`;

      // Verifica se já existem transações agendadas/programadas para este mês futuro
      let receitasAgendadasFuturas = 0;
      let despesasAgendadasFuturas = 0;
      transacoes.forEach(t => {
        if (t.excluido) return;
        try {
          const td = new Date(t.data);
          if (td.getFullYear() === py && td.getMonth() === pm) {
            const val = Number(t.valor) || 0;
            if (t.tipo === 'entrada' || t.tipo === 'receita') receitasAgendadasFuturas += val;
            if (t.tipo === 'saida' || t.tipo === 'despesa') despesasAgendadasFuturas += val;
          }
        } catch {
          // data inválida
        }
      });

      // Receita projetada: maior valor entre o já agendado e a média histórica
      const projRec = Math.max(receitasAgendadasFuturas, mediaReceitaMensal);

      // Despesa projetada: base recorrente obrigatória + média variável (ou despesas futuras agendadas)
      const despesaBase = totalRecorrenteMensal > 0
        ? totalRecorrenteMensal + mediaCustoVariavel
        : (mediaDespesasMensal > 0 ? mediaDespesasMensal : 0);

      const projDesp = Math.max(despesasAgendadasFuturas, despesaBase);
      const projSaldo = projRec - projDesp;
      const projMargem = projRec > 0 ? (projSaldo / projRec) * 100 : 0;

      projectionDataPoints.push({
        key: pKey,
        label: `${MONTH_NAMES_SHORT[pm]}/${String(py).slice(-2)}*`,
        fullLabel: `${MONTH_NAMES_FULL[pm]} de ${py} (Projeção)`,
        receitas: Math.round(projRec * 100) / 100,
        despesas: Math.round(projDesp * 100) / 100,
        saldoLiquido: Math.round(projSaldo * 100) / 100,
        margemPercentual: Math.round(projMargem * 10) / 10,
        tendenciaRecorrente: totalRecorrenteMensal > 0 ? totalRecorrenteMensal : projDesp,
        count: 0,
        isSelected: false,
        isProjection: true
      });
    }

    return [...historicalDataPoints, ...projectionDataPoints];
  }, [
    transacoes,
    despesasRecorrentes,
    totalRecorrenteMensal,
    periodPreset,
    onlyPaid,
    showProjection,
    selectedMonth,
    selectedYear
  ]);

  // 3. Métricas consolidadas e análise de projeção dos próximos 3 meses
  const summaryMetrics = useMemo(() => {
    let totalRec = 0;
    let totalDesp = 0;
    let melhorMes = { label: '', receitas: 0 };

    // Apenas meses históricos para métricas realizadas
    chartData.filter(item => !item.isProjection).forEach(item => {
      totalRec += item.receitas;
      totalDesp += item.despesas;
      if (item.receitas > melhorMes.receitas) {
        melhorMes = { label: item.fullLabel, receitas: item.receitas };
      }
    });

    const saldoTotal = totalRec - totalDesp;
    const margemMedia = totalRec > 0 ? (saldoTotal / totalRec) * 100 : 0;
    const isSaudavel = saldoTotal >= 0;

    // Métricas exclusivas do trimestre projetado (próximos 3 meses)
    const projectedPoints = chartData.filter(item => item.isProjection);
    let projRecTotal = 0;
    let projDespTotal = 0;
    projectedPoints.forEach(p => {
      projRecTotal += p.receitas;
      projDespTotal += p.despesas;
    });

    const projSaldoTotal = projRecTotal - projDespTotal;
    const projComprometimentoRecorrente = totalRecorrenteMensal * 3;
    const taxaCoberturaRecorrente = projComprometimentoRecorrente > 0
      ? (projRecTotal / projComprometimentoRecorrente) * 100
      : 100;

    const saudeProjetada = taxaCoberturaRecorrente >= 130
      ? 'alta'
      : taxaCoberturaRecorrente >= 100
        ? 'equilibrada'
        : 'atencao';

    return {
      totalReceitas: totalRec,
      totalDespesas: totalDesp,
      saldoTotal,
      margemMedia,
      isSaudavel,
      melhorMes,
      // Projeção 3 meses
      hasProjection: projectedPoints.length > 0,
      projRecTotal,
      projDespTotal,
      projSaldoTotal,
      projComprometimentoRecorrente,
      taxaCoberturaRecorrente,
      saudeProjetada
    };
  }, [chartData, totalRecorrenteMensal]);

  const hasData = summaryMetrics.totalReceitas > 0 || summaryMetrics.totalDespesas > 0 || summaryMetrics.hasProjection;
  const firstProjectionLabel = chartData.find(d => d.isProjection)?.label;

  return (
    <div 
      id="monthly-financial-summary-widget"
      className={`bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden ${className}`}
    >
      {/* Cabeçalho do Card */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-xs">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
                Saúde Financeira Mensal
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold whitespace-nowrap border ${
                summaryMetrics.isSaudavel
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-400/40'
              }`}>
                {summaryMetrics.isSaudavel ? 'Fluxo Superavitário' : 'Atenção ao Déficit'}
              </span>
              {showProjection && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-500/25 text-purple-200 border border-purple-400/40 shadow-2xs">
                  <Sparkles className="w-2.5 h-2.5" />
                  Projeção +3 Meses
                </span>
              )}
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white tracking-tight mt-0.5">
              Comparativo Mensal & Projeção com Despesas Recorrentes
            </h3>
          </div>
        </div>

        {/* Controles de Período, Projeção e Filtros */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          {/* Presets de Período */}
          <div className="flex items-center bg-white/10 p-1 rounded-xl border border-white/15 backdrop-blur-xs">
            <button
              id="period-preset-6m"
              type="button"
              onClick={() => setPeriodPreset('6m')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                periodPreset === '6m'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              6 Meses
            </button>
            <button
              id="period-preset-12m"
              type="button"
              onClick={() => setPeriodPreset('12m')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                periodPreset === '12m'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              12 Meses
            </button>
            <button
              id="period-preset-ano"
              type="button"
              onClick={() => setPeriodPreset('ano_atual')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                periodPreset === 'ano_atual'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Ano Completo
            </button>
          </div>

          {/* Toggle Projeção 3 Meses */}
          <button
            id="toggle-projection-3m"
            type="button"
            onClick={() => setShowProjection(!showProjection)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-2xs whitespace-nowrap ${
              showProjection
                ? 'bg-purple-600/40 text-purple-200 border-purple-400/50 hover:bg-purple-600/50 shadow-xs'
                : 'bg-white/10 text-slate-300 border-white/15 hover:bg-white/20'
            }`}
            title="Alternar projeção de saúde financeira para os próximos 3 meses"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-300" />
            <span>Projeção (3M)</span>
          </button>

          {/* Toggle Linha de Tendência */}
          <button
            id="toggle-trend-line"
            type="button"
            onClick={() => setShowTrendLine(!showTrendLine)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-2xs whitespace-nowrap ${
              showTrendLine
                ? 'bg-indigo-600/40 text-indigo-200 border-indigo-400/50 hover:bg-indigo-600/50 shadow-xs'
                : 'bg-white/10 text-slate-300 border-white/15 hover:bg-white/20'
            }`}
            title="Exibir linha de tendência baseada nos custos fixos e despesas recorrentes"
          >
            <LineChartIcon className="w-3.5 h-3.5 text-indigo-300" />
            <span>Linha de Tendência</span>
          </button>

          {/* Toggle Apenas Pagos vs Todos */}
          <button
            id="toggle-only-paid-status"
            type="button"
            onClick={() => setOnlyPaid(!onlyPaid)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-2xs whitespace-nowrap ${
              onlyPaid
                ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40 hover:bg-emerald-500/30'
                : 'bg-white/10 text-white border-white/20 hover:bg-white/15'
            }`}
            title={onlyPaid ? 'Exibindo apenas transações pagas (caixa realizado)' : 'Exibindo todas (incluindo pendentes)'}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{onlyPaid ? 'Caixa Realizado' : 'Previsto + Realizado'}</span>
          </button>

          {onGoToFinancial && (
            <button
              id="btn-goto-financial-from-chart"
              type="button"
              onClick={onGoToFinancial}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-indigo-200 hover:text-white bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/30 rounded-xl transition-all cursor-pointer shadow-2xs whitespace-nowrap"
            >
              <span>Módulo Financeiro</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Faixa Informativa de Comprometimento Recorrente */}
      <div className="px-4 py-2.5 bg-slate-900/90 text-slate-300 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
            <Layers className="w-3 h-3" />
          </div>
          {totalRecorrentesAtivas > 0 ? (
            <span>
              <strong className="text-white">Custos Recorrentes Cadastrados:</strong>{' '}
              <span className="text-purple-300 font-bold font-mono">{formatBRL(totalRecorrenteMensal)}/mês</span>{' '}
              <span className="text-slate-400">({totalRecorrentesAtivas} despesas ativas: aluguel, sistemas, contas fixas)</span>
            </span>
          ) : (
            <span className="text-amber-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              Nenhuma despesa recorrente ativa cadastrada. Cadastre em <strong>Financeiro &gt; Despesas Recorrentes</strong> para calibrar a linha de tendência com máxima precisão.
            </span>
          )}
        </div>

        {summaryMetrics.hasProjection && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Saúde Projetada (Próx. 3M):</span>
            <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] flex items-center gap-1 border ${
              summaryMetrics.saudeProjetada === 'alta'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                : summaryMetrics.saudeProjetada === 'equilibrada'
                  ? 'bg-amber-950 text-amber-300 border-amber-800'
                  : 'bg-rose-950 text-rose-300 border-rose-800'
            }`}>
              <ShieldCheck className="w-3 h-3" />
              {summaryMetrics.saudeProjetada === 'alta' && 'Fluxo Seguro (Superávit Previsto)'}
              {summaryMetrics.saudeProjetada === 'equilibrada' && 'Equilíbrio Operacional'}
              {summaryMetrics.saudeProjetada === 'atencao' && 'Atenção aos Custos Fixos'}
            </span>
          </div>
        )}
      </div>

      {/* Cartões Rápidos de Resumo do Período */}
      <div className="p-4 sm:p-5 grid grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/70 border-b border-slate-100">
        {/* Total Receitas */}
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Receitas Históricas</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-base sm:text-lg font-black text-emerald-700 tracking-tight font-mono">
            {formatBRL(summaryMetrics.totalReceitas)}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">No período selecionado</span>
        </div>

        {/* Total Despesas */}
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Despesas Históricas</span>
            <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-base sm:text-lg font-black text-rose-700 tracking-tight font-mono">
            {formatBRL(summaryMetrics.totalDespesas)}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">Custos e saídas operacionais</span>
        </div>

        {/* Saldo Líquido */}
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Saldo Histórico</span>
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
              summaryMetrics.isSaudavel ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'
            }`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-base sm:text-lg font-black tracking-tight font-mono ${
            summaryMetrics.isSaudavel ? 'text-indigo-900' : 'text-rose-700'
          }`}>
            {summaryMetrics.isSaudavel ? '+' : ''}{formatBRL(summaryMetrics.saldoTotal)}
          </p>
          <span className={`text-[10px] font-bold ${
            summaryMetrics.isSaudavel ? 'text-emerald-600' : 'text-rose-600'
          }`}>
            {summaryMetrics.isSaudavel ? 'Superávit realizado' : 'Déficit realizado'}
          </span>
        </div>

        {/* Painel Projeção Trimestral dos Próximos 3 Meses */}
        <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200/80 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Saldo Projetado (3M)</span>
            <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className={`text-base sm:text-lg font-black tracking-tight font-mono ${
            summaryMetrics.projSaldoTotal >= 0 ? 'text-purple-900' : 'text-rose-700'
          }`}>
            {summaryMetrics.projSaldoTotal >= 0 ? '+' : ''}{formatBRL(summaryMetrics.projSaldoTotal)}
          </p>
          <span className="text-[10px] text-purple-700 font-semibold flex items-center gap-1">
            <span>Fixos 3M: {formatBRL(summaryMetrics.projComprometimentoRecorrente)}</span>
          </span>
        </div>
      </div>

      {/* Gráfico Composto Responsivo: Barras Receitas/Despesas + Linha de Tendência */}
      <div className="p-4 sm:p-5">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
              <BarChart3 className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">
              Nenhuma movimentação financeira no período selecionado
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              Os lançamentos de entradas e saídas registrados em atendimentos ou no módulo financeiro serão visualizados aqui mês a mês com projeção de custos.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-full h-72 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData}
                  margin={{ top: 15, right: 10, left: 10, bottom: 5 }}
                  barGap={6}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickFormatter={formatCompactBRL}
                    width={60}
                  />
                  <Tooltip content={<MonthlySummaryCustomTooltip />} cursor={{ fill: '#f8fafc', opacity: 0.8 }} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
                    formatter={(value) => {
                      if (value === 'receitas') return <span className="text-slate-700 font-semibold mr-2">Receitas</span>;
                      if (value === 'despesas') return <span className="text-slate-700 font-semibold mr-2">Despesas</span>;
                      if (value === 'tendenciaRecorrente') return <span className="text-purple-700 font-semibold mr-2">Tendência Recorrente</span>;
                      return value;
                    }}
                  />
                  <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="2 2" />

                  {/* Linha Divisória de Início da Projeção de 3 Meses */}
                  {showProjection && firstProjectionLabel && (
                    <ReferenceLine
                      x={firstProjectionLabel}
                      stroke="#8b5cf6"
                      strokeDasharray="3 3"
                      strokeWidth={1.5}
                      label={{
                        value: 'Início da Projeção (+3M)',
                        fill: '#7c3aed',
                        fontSize: 10,
                        position: 'insideTopLeft'
                      }}
                    />
                  )}
                  
                  {/* Barra de Receitas (Verde Esmeralda sólido para histórico, verde mais claro/borda para projeção) */}
                  <Bar
                    dataKey="receitas"
                    name="receitas"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={36}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-rec-${index}`}
                        fill={entry.isProjection ? '#6ee7b7' : '#10b981'}
                        stroke={entry.isProjection ? '#059669' : 'none'}
                        strokeWidth={entry.isProjection ? 1.5 : 0}
                        strokeDasharray={entry.isProjection ? '2 2' : 'none'}
                      />
                    ))}
                  </Bar>

                  {/* Barra de Despesas (Rosa Avermelhado sólido para histórico, rosa suave para projeção) */}
                  <Bar
                    dataKey="despesas"
                    name="despesas"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={36}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-desp-${index}`}
                        fill={entry.isProjection ? '#fda4af' : '#f43f5e'}
                        stroke={entry.isProjection ? '#e11d48' : 'none'}
                        strokeWidth={entry.isProjection ? 1.5 : 0}
                        strokeDasharray={entry.isProjection ? '2 2' : 'none'}
                      />
                    ))}
                  </Bar>

                  {/* Linha de Tendência baseada nas Despesas Recorrentes e Custos Fixos */}
                  {showTrendLine && (
                    <Line
                      type="monotone"
                      dataKey="tendenciaRecorrente"
                      name="tendenciaRecorrente"
                      stroke="#8b5cf6"
                      strokeWidth={2.5}
                      strokeDasharray="4 4"
                      dot={{ r: 4, fill: '#8b5cf6', stroke: '#ffffff', strokeWidth: 2 }}
                      activeDot={{ r: 6, fill: '#7c3aed' }}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Rodapé explicativo do gráfico com indicadores de tendência */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block" />
                  <span className="font-medium text-slate-700">Receitas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-rose-500 inline-block" />
                  <span className="font-medium text-slate-700">Despesas</span>
                </div>
                {showTrendLine && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-0.5 bg-purple-500 inline-block border-t border-dashed border-purple-700" />
                    <span className="font-medium text-purple-700">Linha de Tendência (Recorrente)</span>
                  </div>
                )}
                {showProjection && (
                  <div className="flex items-center gap-1 text-[11px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                    <span>* Barras tracejadas = Projeção futura (+3 meses)</span>
                  </div>
                )}
              </div>

              {totalRecorrenteMensal > 0 ? (
                <div className="text-[11px] font-semibold text-purple-800 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200/80">
                  Custo Fixo Recorrente Base: {formatBRL(totalRecorrenteMensal)}/mês
                </div>
              ) : summaryMetrics.melhorMes.receitas > 0 ? (
                <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                  Melhor faturamento: {summaryMetrics.melhorMes.label} ({formatBRL(summaryMetrics.melhorMes.receitas)})
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
