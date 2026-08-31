import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Hourglass, 
  AlertTriangle, 
  Plus, 
  Package, 
  User, 
  Sparkles, 
  DoorOpen, 
  Filter, 
  Check, 
  ArrowRight, 
  UserCheck, 
  ChevronRight, 
  ChevronLeft,
  CalendarDays,
  Eye, 
  EyeOff, 
  Wrench, 
  ShieldAlert,
  RotateCcw,
  Undo2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Target,
  Trophy,
  Edit3,
  Flame,
  CalendarClock,
  Receipt,
  AlertOctagon,
  Tv,
  Users,
  Activity,
  Layers,
  Sparkle
} from 'lucide-react';
import { Agendamento, EstoqueInsumo, Paciente, StatusAgendamento, UsuarioEquipe, BemAtivo, TransacaoFinanceira, DespesaRecorrente } from '../types';
import { isUserAdminLocalOrTotal } from '../services/firebaseService';

interface DashboardViewProps {
  agendamentos: Agendamento[];
  estoque: EstoqueInsumo[];
  pacientes: Paciente[];
  bens?: BemAtivo[];
  profissionais?: UsuarioEquipe[];
  transacoes?: TransacaoFinanceira[];
  despesasRecorrentes?: DespesaRecorrente[];
  currentUser?: UsuarioEquipe;
  onOpenNewAppointment: () => void;
  onOpenNewPatient: () => void;
  onOpenNewInventory: () => void;
  onUpdateStatus: (agendamentoId: string, novoStatus: StatusAgendamento) => void;
  onViewPatient: (paciente: Paciente) => void;
  onGoToEstoque: () => void;
  onGoToBens?: () => void;
  onGoToFinancial?: () => void;
  onOpenCompleteModal?: (agendamento: Agendamento) => void;
  onOpenCheckInModal?: (agendamento: Agendamento) => void;
  onOpenSecondScreenModal?: () => void;
  searchQuery: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  agendamentos,
  estoque,
  pacientes,
  bens = [],
  profissionais = [],
  transacoes = [],
  despesasRecorrentes = [],
  currentUser,
  onOpenNewAppointment,
  onOpenNewPatient,
  onOpenNewInventory,
  onUpdateStatus,
  onViewPatient,
  onGoToEstoque,
  onGoToBens,
  onGoToFinancial,
  onOpenCompleteModal,
  onOpenCheckInModal,
  onOpenSecondScreenModal,
  searchQuery,
}) => {
  const canViewFinancials = isUserAdminLocalOrTotal(currentUser);
  const [statusFilter, setStatusFilter] = useState<'todos' | StatusAgendamento>('todos');
  const [selectedProfissional, setSelectedProfissional] = useState<string>('todos');
  const [modoDetalhado, setModoDetalhado] = useState<boolean>(false);

  // Seletor de Período Financeiro (Mês e Ano)
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  const MESES = [
    { value: 0, label: 'Janeiro' },
    { value: 1, label: 'Fevereiro' },
    { value: 2, label: 'Março' },
    { value: 3, label: 'Abril' },
    { value: 4, label: 'Maio' },
    { value: 5, label: 'Junho' },
    { value: 6, label: 'Julho' },
    { value: 7, label: 'Agosto' },
    { value: 8, label: 'Setembro' },
    { value: 9, label: 'Outubro' },
    { value: 10, label: 'Novembro' },
    { value: 11, label: 'Dezembro' },
  ];

  const anosDisponiveis = [
    now.getFullYear() - 2,
    now.getFullYear() - 1,
    now.getFullYear(),
    now.getFullYear() + 1,
    now.getFullYear() + 2,
  ];

  const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();
  const selectedMonthObj = MESES.find(m => m.value === selectedMonth) || MESES[0];
  const selectedMonthName = selectedMonthObj.label;
  const selectedPeriodLabel = `${selectedMonthName} de ${selectedYear}`;

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  const handleResetToCurrentMonth = () => {
    const cur = new Date();
    setSelectedMonth(cur.getMonth());
    setSelectedYear(cur.getFullYear());
  };

  // Meta Financeira Mensal (com persistência em localStorage para o período)
  const [metaFaturamento, setMetaFaturamento] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`meta_faturamento_${now.getFullYear()}_${now.getMonth()}`) || 
                    localStorage.getItem('meta_faturamento_mensal');
      if (saved) {
        const val = Number(saved);
        if (!isNaN(val) && val > 0) return val;
      }
    } catch {
      // fallback
    }
    return 30000; // Meta padrão inicial de R$ 30.000,00
  });
  const [isEditingMeta, setIsEditingMeta] = useState<boolean>(false);
  const [inputMetaTemp, setInputMetaTemp] = useState<string>(() => metaFaturamento.toString());

  // Atualiza a meta carregada quando o período muda
  React.useEffect(() => {
    try {
      const periodSaved = localStorage.getItem(`meta_faturamento_${selectedYear}_${selectedMonth}`);
      if (periodSaved) {
        const val = Number(periodSaved);
        if (!isNaN(val) && val > 0) {
          setMetaFaturamento(val);
          setInputMetaTemp(val.toString());
          return;
        }
      }
      const globalSaved = localStorage.getItem('meta_faturamento_mensal');
      if (globalSaved) {
        const val = Number(globalSaved);
        if (!isNaN(val) && val > 0) {
          setMetaFaturamento(val);
          setInputMetaTemp(val.toString());
          return;
        }
      }
    } catch {
      // fallback
    }
    setMetaFaturamento(30000);
    setInputMetaTemp('30000');
  }, [selectedMonth, selectedYear]);

  const handleSaveMeta = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(inputMetaTemp.replace(/\./g, '').replace(',', '.'));
    if (!isNaN(parsed) && parsed > 0) {
      setMetaFaturamento(parsed);
      try {
        localStorage.setItem(`meta_faturamento_${selectedYear}_${selectedMonth}`, parsed.toString());
        localStorage.setItem('meta_faturamento_mensal', parsed.toString());
      } catch {
        // ignore
      }
    }
    setIsEditingMeta(false);
  };

  // Filter ONLY appointments of the CURRENT DAY (00:00 to 23:59)
  const todayDateStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  
  const todayAppointments = useMemo(() => {
    return agendamentos.filter(ag => {
      try {
        const agDateStr = new Date(ag.data_hora).toISOString().slice(0, 10);
        return agDateStr === todayDateStr;
      } catch {
        return false;
      }
    });
  }, [agendamentos, todayDateStr]);

  // Filter by search, status, and professional
  const filteredTodayAgendamentos = useMemo(() => {
    return todayAppointments.filter(ag => {
      const matchesStatus = statusFilter === 'todos' || ag.status === statusFilter;
      const matchesProf = selectedProfissional === 'todos' || 
        ag.profissional_id === selectedProfissional || 
        ag.profissional_nome === selectedProfissional;

      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchesStatus && matchesProf;

      const patient = pacientes.find(p => p.id === ag.paciente_id) || ag.paciente;
      const patientName = (patient?.nome || '').toLowerCase();
      const profName = (ag.profissional_nome || '').toLowerCase();

      return matchesStatus && matchesProf && (patientName.includes(query) || profName.includes(query));
    });
  }, [todayAppointments, statusFilter, selectedProfissional, searchQuery, pacientes]);

  // KPI Metrics for Today
  const totalToday = todayAppointments.length;
  const inWaitingRoom = useMemo(() => todayAppointments.filter(a => a.status === 'em_espera').length, [todayAppointments]);
  const inProcedure = useMemo(() => todayAppointments.filter(a => a.status === 'em_atendimento').length, [todayAppointments]);
  const confirmedCount = useMemo(() => todayAppointments.filter(a => a.status === 'confirmado').length, [todayAppointments]);
  const completedToday = useMemo(() => todayAppointments.filter(a => a.status === 'concluido').length, [todayAppointments]);

  const lowStockItems = useMemo(() => estoque.filter(item => item.quantidade <= item.alerta_minimo), [estoque]);

  // Alertas de Manutenção Preventiva de Equipamentos
  const { equipamentosManutVencida, equipamentosManutProxima, equipamentosEmManutencao, totalAlertasManutencao } = useMemo(() => {
    const hojeDashboardStr = new Date().toISOString().slice(0, 10);
    const limite15d = new Date();
    limite15d.setDate(limite15d.getDate() + 15);
    const limite15dStr = limite15d.toISOString().slice(0, 10);

    const vencida = bens.filter(b => 
      b.requerManutencao && 
      b.dataProximaManutencao && 
      b.dataProximaManutencao < hojeDashboardStr &&
      b.estado_conservacao !== 'manutencao'
    );

    const proxima = bens.filter(b => 
      b.requerManutencao && 
      b.dataProximaManutencao && 
      b.dataProximaManutencao >= hojeDashboardStr && 
      b.dataProximaManutencao <= limite15dStr &&
      b.estado_conservacao !== 'manutencao'
    );

    const emManut = bens.filter(b => 
      b.estado_conservacao === 'manutencao' || b.statusManutencao === 'em_manutencao'
    );

    return {
      equipamentosManutVencida: vencida,
      equipamentosManutProxima: proxima,
      equipamentosEmManutencao: emManut,
      totalAlertasManutencao: vencida.length + proxima.length + emManut.length
    };
  }, [bens]);

  // Resumo Financeiro do Período Selecionado (Receitas x Despesas)
  const { transacoesPeriodo, receitasPeriodo, despesasPeriodo, saldoLiquidoPeriodo, qtdTransacoesPeriodo } = useMemo(() => {
    const periodTxs = transacoes.filter(t => {
      if (t.excluido) return false;
      try {
        const d = new Date(t.data);
        return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
      } catch {
        return false;
      }
    });

    const rec = periodTxs
      .filter(t => (t.tipo === 'entrada' || t.tipo === 'receita') && t.status === 'pago')
      .reduce((acc, t) => acc + (Number(t.valor) || 0), 0);

    const desp = periodTxs
      .filter(t => (t.tipo === 'saida' || t.tipo === 'despesa') && t.status === 'pago')
      .reduce((acc, t) => acc + (Number(t.valor) || 0), 0);

    return {
      transacoesPeriodo: periodTxs,
      receitasPeriodo: rec,
      despesasPeriodo: desp,
      saldoLiquidoPeriodo: rec - desp,
      qtdTransacoesPeriodo: periodTxs.filter(t => t.status === 'pago').length
    };
  }, [transacoes, selectedYear, selectedMonth]);

  // Métricas de Meta de Faturamento do Período
  const percentualAtingido = metaFaturamento > 0 
    ? Math.min(Math.round((receitasPeriodo / metaFaturamento) * 100), 999) 
    : 0;
  const valorRestanteMeta = Math.max(0, metaFaturamento - receitasPeriodo);
  const metaAtingida = receitasPeriodo >= metaFaturamento && metaFaturamento > 0;

  // Alertas de Contas a Pagar (Para o mês atual: próximos 7 dias; Para outros meses: lançamentos do mês selecionado)
  interface ContaPagarProxima {
    id: string;
    origem: 'transacao' | 'recorrente';
    descricao: string;
    categoria: string;
    valor: number;
    dataVencimento: Date;
    diasRestantes: number; // 0 = hoje, <0 = atrasada, >0 = dias restantes
    status: 'hoje' | 'amanha' | 'em_breve' | 'atrasado' | 'periodo';
    formaPagamento?: string;
  }

  const { contasAPagarProximas, totalValorContasProximas } = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const lista: ContaPagarProxima[] = [];

    // 1. Transações com status 'pendente' do tipo despesa / saída
    transacoes.forEach(t => {
      if (t.excluido) return;
      const isDespesa = t.tipo === 'saida' || t.tipo === 'despesa';
      const isPendente = t.status === 'pendente';
      if (isDespesa && isPendente) {
        try {
          const dVenc = new Date(t.data);
          dVenc.setHours(0, 0, 0, 0);
          const inSelectedPeriod = dVenc.getFullYear() === selectedYear && dVenc.getMonth() === selectedMonth;

          if (isCurrentMonth) {
            const diffTime = dVenc.getTime() - hoje.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays >= -3 && diffDays <= 7) {
              lista.push({
                id: `tx-${t.id}`,
                origem: 'transacao',
                descricao: t.procedimento || t.paciente_nome || 'Despesa Programada',
                categoria: t.categoria || 'Despesa',
                valor: Number(t.valor) || 0,
                dataVencimento: dVenc,
                diasRestantes: diffDays,
                status: diffDays < 0 ? 'atrasado' : diffDays === 0 ? 'hoje' : diffDays === 1 ? 'amanha' : 'em_breve',
                formaPagamento: t.forma_pagamento,
              });
            }
          } else if (inSelectedPeriod) {
            const diffTime = dVenc.getTime() - hoje.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            lista.push({
              id: `tx-${t.id}`,
              origem: 'transacao',
              descricao: t.procedimento || t.paciente_nome || 'Despesa Programada',
              categoria: t.categoria || 'Despesa',
              valor: Number(t.valor) || 0,
              dataVencimento: dVenc,
              diasRestantes: diffDays,
              status: 'periodo',
              formaPagamento: t.forma_pagamento,
            });
          }
        } catch {
          // ignore date error
        }
      }
    });

    // 2. Despesas Recorrentes ativas com dia_vencimento
    despesasRecorrentes.forEach(d => {
      if (d.status === 'ativo') {
        const diaVenc = d.dia_vencimento;
        const dVencPeriodo = new Date(selectedYear, selectedMonth, diaVenc);
        dVencPeriodo.setHours(0, 0, 0, 0);

        const mesKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
        const jaPago = d.ultimo_pagamento_mes === mesKey;

        if (!jaPago) {
          if (isCurrentMonth) {
            const diffTime = dVencPeriodo.getTime() - hoje.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays >= 0 && diffDays <= 7) {
              lista.push({
                id: `rec-${d.id}`,
                origem: 'recorrente',
                descricao: d.descricao,
                categoria: d.categoria,
                valor: Number(d.valor) || 0,
                dataVencimento: dVencPeriodo,
                diasRestantes: diffDays,
                status: diffDays === 0 ? 'hoje' : diffDays === 1 ? 'amanha' : 'em_breve',
                formaPagamento: d.forma_pagamento_preferencial,
              });
            }
          } else {
            const diffTime = dVencPeriodo.getTime() - hoje.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            lista.push({
              id: `rec-${d.id}`,
              origem: 'recorrente',
              descricao: d.descricao,
              categoria: d.categoria,
              valor: Number(d.valor) || 0,
              dataVencimento: dVencPeriodo,
              diasRestantes: diffDays,
              status: 'periodo',
              formaPagamento: d.forma_pagamento_preferencial,
            });
          }
        }
      }
    });

    // Ordenar por data de vencimento mais próxima
    lista.sort((a, b) => a.diasRestantes - b.diasRestantes);

    return {
      contasAPagarProximas: lista,
      totalValorContasProximas: lista.reduce((acc, c) => acc + c.valor, 0)
    };
  }, [transacoes, despesasRecorrentes, selectedYear, selectedMonth, isCurrentMonth]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '--:--';
    }
  };

  const getStatusBadge = (status: StatusAgendamento) => {
    switch (status) {
      case 'em_atendimento':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-300 animate-pulse">
            <DoorOpen className="w-3.5 h-3.5 text-indigo-700" />
            Em Procedimento (Sala)
          </span>
        );
      case 'em_espera':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            Na Recepção (Chegou)
          </span>
        );
      case 'confirmado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Confirmado
          </span>
        );
      case 'pendente':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Hourglass className="w-3.5 h-3.5 text-amber-600" />
            Aguardando Confirmação
          </span>
        );
      case 'concluido':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <Check className="w-3.5 h-3.5 text-slate-500" />
            Concluído
          </span>
        );
      case 'cancelado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200">
            <XCircle className="w-3.5 h-3.5 text-red-500" />
            Cancelado
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Welcome & Reception Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Balcão do Dia (Hoje)
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Painel de Recepção & Balcão de Atendimento
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Filtragem estrita dos atendimentos do dia. Lista otimizada sem exposição de telefones ou valores na recepção.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setModoDetalhado(!modoDetalhado)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            {modoDetalhado ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{modoDetalhado ? 'Ocultar Detalhes' : 'Ver Detalhes'}</span>
          </button>

          <button
            onClick={onOpenNewAppointment}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Agendamento</span>
          </button>
        </div>
      </div>

      {/* Real-time Queue Banner */}
      {(inWaitingRoom > 0 || inProcedure > 0) && (
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-indigo-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
              <DoorOpen className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Fluxo de Recepção & Salas no Momento
              </h3>
              <p className="text-xs text-indigo-200 font-normal mt-0.5">
                {inWaitingRoom} cliente(s) aguardando no sofá da recepção e {inProcedure} em procedimento na sala.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Card de Visão Financeira Rápida com Seletor de Período (Restrito estritamente a Admin Local e Master) */}
      {canViewFinancials ? (
        <>
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Header com Seletor de Mês/Ano e Navegação Rápida */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-emerald-400 shrink-0 shadow-xs">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-indigo-200 uppercase tracking-wider">
                  Visão Financeira
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  {selectedPeriodLabel}
                </span>
                {isCurrentMonth ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Mês Atual
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    Período Histórico / Futuro
                  </span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight mt-0.5">
                Receitas e Despesas ({selectedMonthName} / {selectedYear})
              </h3>
            </div>
          </div>

          {/* Controles do Seletor de Período (Mês / Ano / Navegação) */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-between lg:justify-end">
            <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl border border-white/15 backdrop-blur-xs">
              <button
                type="button"
                onClick={handlePrevMonth}
                title="Mês anterior"
                className="p-1.5 rounded-lg hover:bg-white/15 active:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent text-white text-xs font-bold px-2 py-1 rounded-md cursor-pointer focus:outline-hidden focus:bg-slate-800"
              >
                {MESES.map(m => (
                  <option key={m.value} value={m.value} className="bg-slate-900 text-white font-medium">
                    {m.label}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-white text-xs font-bold px-2 py-1 rounded-md cursor-pointer focus:outline-hidden focus:bg-slate-800"
              >
                {anosDisponiveis.map(y => (
                  <option key={y} value={y} className="bg-slate-900 text-white font-medium">
                    {y}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleNextMonth}
                title="Próximo mês"
                className="p-1.5 rounded-lg hover:bg-white/15 active:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {!isCurrentMonth && (
              <button
                type="button"
                onClick={handleResetToCurrentMonth}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold bg-indigo-500/30 hover:bg-indigo-500/50 text-indigo-200 border border-indigo-400/40 rounded-xl transition-all cursor-pointer shadow-2xs"
                title="Redefinir para o mês atual"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Mês Atual</span>
              </button>
            )}

            {onGoToFinancial && (
              <button
                onClick={onGoToFinancial}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-xl border border-white/20 transition-all cursor-pointer shadow-2xs"
              >
                <span>Ver Financeiro</span>
                <ArrowRight className="w-3.5 h-3.5 text-indigo-300" />
              </button>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {/* Total de Receitas do Período */}
          <div className="flex items-center justify-between sm:justify-start gap-4 pt-2 md:pt-0">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shrink-0">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                <span>Receitas de {selectedMonthName}</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                  Entradas
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-emerald-700 tracking-tight mt-0.5">
                {formatCurrency(receitasPeriodo)}
              </p>
              <p className="text-[11px] text-slate-400 font-medium">
                Procedimentos e recebimentos pagos
              </p>
            </div>
          </div>

          {/* Total de Despesas do Período */}
          <div className="flex items-center justify-between sm:justify-start gap-4 pt-4 md:pt-0 md:pl-4">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600 shrink-0">
              <ArrowDownRight className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                <span>Despesas de {selectedMonthName}</span>
                <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.2 rounded">
                  Saídas
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-rose-700 tracking-tight mt-0.5">
                {formatCurrency(despesasPeriodo)}
              </p>
              <p className="text-[11px] text-slate-400 font-medium">
                Custos operacionais e pagamentos
              </p>
            </div>
          </div>

          {/* Saldo Líquido do Período */}
          <div className="flex items-center justify-between sm:justify-start gap-4 pt-4 md:pt-0 md:pl-4">
            <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${
              saldoLiquidoPeriodo >= 0 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600' 
                : 'bg-amber-50 border-amber-200 text-amber-600'
            }`}>
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
                <span>Saldo Líquido</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                  saldoLiquidoPeriodo >= 0 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {saldoLiquidoPeriodo >= 0 ? 'Superávit' : 'Déficit'}
                </span>
              </div>
              <p className={`text-xl sm:text-2xl font-black tracking-tight mt-0.5 ${
                saldoLiquidoPeriodo >= 0 ? 'text-indigo-900' : 'text-rose-700'
              }`}>
                {saldoLiquidoPeriodo >= 0 ? '+' : ''}{formatCurrency(saldoLiquidoPeriodo)}
              </p>
              <p className="text-[11px] text-slate-400 font-medium">
                {qtdTransacoesPeriodo} lançamento(s) em {selectedMonthName}/{selectedYear}
              </p>
            </div>
          </div>
        </div>

        {/* Barra e Painel de Meta Financeira Mensal */}
        <div className="px-4 sm:px-5 pb-5 pt-4 bg-slate-50/80 border-t border-slate-200/70">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center shrink-0">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 tracking-tight">
                    Meta de Faturamento de {selectedMonthName} de {selectedYear}
                  </span>
                  {metaAtingida && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <Trophy className="w-3 h-3 text-emerald-600" />
                      Meta Atingida!
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {metaAtingida 
                    ? `Parabéns! Faturamento superou a meta estipulada em ${formatCurrency(receitasPeriodo - metaFaturamento)}.`
                    : `Faltam ${formatCurrency(valorRestanteMeta)} para alcançar o objetivo do mês.`}
                </p>
              </div>
            </div>

            {/* Controle de Edição de Meta */}
            <div className="flex items-center gap-2">
              {isEditingMeta ? (
                <form onSubmit={handleSaveMeta} className="flex items-center gap-1.5">
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                    <input
                      type="number"
                      step="100"
                      min="1"
                      value={inputMetaTemp}
                      onChange={(e) => setInputMetaTemp(e.target.value)}
                      placeholder="Ex: 30000"
                      autoFocus
                      className="w-32 pl-8 pr-2 py-1 text-xs font-bold bg-white border border-indigo-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-2.5 py-1 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer"
                  >
                    Salvar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInputMetaTemp(metaFaturamento.toString());
                      setIsEditingMeta(false);
                    }}
                    className="px-2 py-1 text-xs font-medium text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Meta Estipulada</span>
                    <span className="text-xs font-extrabold text-slate-900">{formatCurrency(metaFaturamento)}</span>
                  </div>
                  <button
                    onClick={() => {
                      setInputMetaTemp(metaFaturamento.toString());
                      setIsEditingMeta(true);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:text-indigo-800 bg-white hover:bg-indigo-50/80 border border-indigo-200 rounded-lg transition-all cursor-pointer shadow-2xs"
                    title="Ajustar Meta Mensal"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Ajustar Meta</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Barra de Progresso Visual */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-600 flex items-center gap-1">
                <span>Progresso:</span>
                <span className={metaAtingida ? 'text-emerald-700' : 'text-indigo-600'}>
                  {formatCurrency(receitasPeriodo)}
                </span>
                <span className="text-slate-400 font-normal">de {formatCurrency(metaFaturamento)}</span>
              </span>
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-black ${
                metaAtingida
                  ? 'bg-emerald-600 text-white'
                  : percentualAtingido >= 75
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-200 text-slate-800'
              }`}>
                {percentualAtingido}%
              </span>
            </div>

            <div className="w-full h-3 bg-slate-200/90 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div 
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  metaAtingida
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 shadow-xs'
                    : percentualAtingido >= 50
                    ? 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-500'
                    : 'bg-gradient-to-r from-indigo-400 to-indigo-600'
                }`}
                style={{ width: `${Math.min(percentualAtingido, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mini-Card de Alertas: Contas a Pagar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-rose-50/20 to-amber-50/30">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
              contasAPagarProximas.length > 0 
                ? 'bg-rose-500 text-white' 
                : 'bg-emerald-100 text-emerald-700'
            }`}>
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  Contas a Pagar {isCurrentMonth ? 'Próximas (7 Dias)' : `de ${selectedMonthName}/${selectedYear}`}
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  contasAPagarProximas.length > 0 
                    ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  {isCurrentMonth
                    ? `${contasAPagarProximas.length} ${contasAPagarProximas.length === 1 ? 'vencimento' : 'vencimentos'} nos próx. 7 dias`
                    : `${contasAPagarProximas.length} ${contasAPagarProximas.length === 1 ? 'conta pendente' : 'contas pendentes'} em ${selectedMonthName}`
                  }
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Despesas fixas recorrentes e lançamentos pendentes com prazo para o período selecionado
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {contasAPagarProximas.length > 0 && (
              <div className="text-left sm:text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Total Previsto</span>
                <span className="text-sm font-black text-rose-700">{formatCurrency(totalValorContasProximas)}</span>
              </div>
            )}
            {onGoToFinancial && (
              <button
                onClick={onGoToFinancial}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                <span>Gerenciar Contas</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-5">
          {contasAPagarProximas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-800">
                {isCurrentMonth 
                  ? 'Nenhuma conta com vencimento para os próximos 7 dias!' 
                  : `Nenhuma conta pendente identificada para ${selectedMonthName} de ${selectedYear}!`}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isCurrentMonth 
                  ? 'Todas as despesas recorrentes e programadas estão em dia.'
                  : 'Nenhum lançamento pendente ou despesa em aberto registrado para este mês.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {contasAPagarProximas.map(conta => {
                const isAtrasada = conta.status === 'atrasado';
                const isHoje = conta.status === 'hoje';
                const isAmanha = conta.status === 'amanha';
                const isPeriodo = conta.status === 'periodo';

                return (
                  <div
                    key={conta.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                      isAtrasada
                        ? 'bg-rose-50/50 border-rose-200 shadow-2xs'
                        : isHoje
                        ? 'bg-amber-50/60 border-amber-200 shadow-2xs'
                        : isAmanha
                        ? 'bg-orange-50/40 border-orange-200/80'
                        : isPeriodo
                        ? 'bg-indigo-50/30 border-indigo-200/70'
                        : 'bg-slate-50/60 border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                          isAtrasada
                            ? 'bg-rose-100 text-rose-700'
                            : isHoje
                            ? 'bg-amber-100 text-amber-800'
                            : isAmanha
                            ? 'bg-orange-100 text-orange-800'
                            : isPeriodo
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-slate-200 text-slate-700'
                        }`}>
                          <Receipt className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate" title={conta.descricao}>
                            {conta.descricao}
                          </h4>
                          <span className="text-[10px] font-medium text-slate-400 capitalize block truncate">
                            {conta.origem === 'recorrente' ? 'Despesa Fixa' : 'Lançamento Programado'} • {conta.categoria}
                          </span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black shrink-0 ${
                        isAtrasada
                          ? 'bg-rose-600 text-white animate-pulse'
                          : isHoje
                          ? 'bg-amber-500 text-white font-extrabold'
                          : isAmanha
                          ? 'bg-orange-500 text-white'
                          : isPeriodo
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {isAtrasada
                          ? `${Math.abs(conta.diasRestantes)}d em atraso`
                          : isHoje
                          ? 'Vence Hoje'
                          : isAmanha
                          ? 'Amanhã'
                          : isPeriodo
                          ? `Dia ${conta.dataVencimento.getDate()}`
                          : `Em ${conta.diasRestantes} dias`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 mt-1">
                      <span className="text-[11px] text-slate-500 font-medium">
                        Venc: {conta.dataVencimento.toLocaleDateString('pt-BR')}
                      </span>
                      <span className="text-xs font-black text-rose-700 tracking-tight">
                        {formatCurrency(conta.valor)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  ) : (
    /* Painel Operacional do Balcão e Recepção (Para profissionais e recepcionistas sem acesso financeiro) */
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight font-display">
                Painel Operacional do Balcão
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Recepção Ativa
              </span>
            </div>
            <p className="text-xs text-indigo-200 font-medium mt-0.5">
              Acompanhe a fila de chegada, salas de atendimento e espelhe o balcão do dia para a TV da recepção.
            </p>
          </div>
        </div>

        {onOpenSecondScreenModal && (
          <button
            type="button"
            onClick={onOpenSecondScreenModal}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-md"
          >
            <Tv className="w-4 h-4" />
            <span>Transmitir para TV Recepção (2ª Tela)</span>
          </button>
        )}
      </div>

      <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
          <span className="text-[11px] font-bold text-indigo-900 block">Total Agendados Hoje</span>
          <span className="text-2xl font-black text-indigo-700 mt-1 block font-mono">{totalToday}</span>
          <span className="text-[10px] text-indigo-600/80">Pacientes na grade</span>
        </div>

        <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200">
          <span className="text-[11px] font-bold text-amber-900 block">Na Recepção (Espera)</span>
          <span className="text-2xl font-black text-amber-700 mt-1 block font-mono">{inWaitingRoom}</span>
          <span className="text-[10px] text-amber-600/80">Aguardando chamada</span>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
          <span className="text-[11px] font-bold text-emerald-900 block">Em Procedimento</span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block font-mono">{inProcedure}</span>
          <span className="text-[10px] text-emerald-600/80">Atendendo em sala</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[11px] font-bold text-slate-700 block">Concluídos Hoje</span>
          <span className="text-2xl font-black text-slate-800 mt-1 block font-mono">{completedToday}</span>
          <span className="text-[10px] text-slate-500">Atendimentos finalizados</span>
        </div>
      </div>
    </div>
  )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Agendado Hoje</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{totalToday}</p>
          <p className="text-[11px] text-slate-400 mt-1">Horários do dia</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs">
          <div className="flex items-center justify-between text-amber-800 text-xs font-medium">
            <span>Na Recepção (Aguardando)</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
          </div>
          <p className="text-2xl font-bold text-amber-900 mt-2">{inWaitingRoom}</p>
          <p className="text-[11px] text-amber-700 mt-1">Prontos para entrar em sala</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-indigo-200 bg-indigo-50/20 shadow-xs">
          <div className="flex items-center justify-between text-indigo-800 text-xs font-medium">
            <span>Em Sala (Atendimento)</span>
            <DoorOpen className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-indigo-900 mt-2">{inProcedure}</p>
          <p className="text-[11px] text-indigo-700 mt-1">Sendo atendidos agora</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-medium">
            <span>Concluídos Hoje</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-900 mt-2">{completedToday}</p>
          <p className="text-[11px] text-emerald-700 mt-1">Finalizados com sucesso</p>
        </div>
      </div>

      {/* Filter and Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Filtro por Profissional:
            </span>
            <select
              value={selectedProfissional}
              onChange={(e) => setSelectedProfissional(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="todos">Todos os Profissionais</option>
              {profissionais.map(p => (
                <option key={p.id} value={p.nome}>{p.nome} ({p.cargo})</option>
              ))}
            </select>
          </div>

          {/* Status Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setStatusFilter('todos')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                statusFilter === 'todos' ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos ({totalToday})
            </button>
            <button
              onClick={() => setStatusFilter('em_espera')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                statusFilter === 'em_espera' ? 'bg-amber-500 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Recepção ({inWaitingRoom})
            </button>
            <button
              onClick={() => setStatusFilter('em_atendimento')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                statusFilter === 'em_atendimento' ? 'bg-indigo-700 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Em Sala ({inProcedure})
            </button>
            <button
              onClick={() => setStatusFilter('concluido')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                statusFilter === 'concluido' ? 'bg-slate-700 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Concluídos ({completedToday})
            </button>
          </div>
        </div>

        {/* Clean Summary Table (Balcão do Dia) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Horário</th>
                <th className="py-3 px-4">Nome do Cliente</th>
                <th className="py-3 px-4">Profissional Responsável</th>
                {modoDetalhado && <th className="py-3 px-4">Procedimento</th>}
                <th className="py-3 px-4">Status no Balcão</th>
                <th className="py-3 px-4 text-center">Ações Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredTodayAgendamentos.length === 0 ? (
                <tr>
                  <td colSpan={modoDetalhado ? 6 : 5} className="py-12 text-center text-slate-400">
                    <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-slate-600">Nenhum atendimento agendado para hoje com este filtro.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Use o botão "Novo Agendamento" para incluir horários de hoje.</p>
                  </td>
                </tr>
              ) : (
                filteredTodayAgendamentos.map((ag) => {
                  const patient = pacientes.find(p => p.id === ag.paciente_id) || ag.paciente;
                  const patientName = patient?.nome || 'Cliente';

                  return (
                    <tr key={ag.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Horário */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="text-sm">{formatTime(ag.data_hora)}</span>
                        </div>
                      </td>

                      {/* Nome do Cliente */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => patient && onViewPatient(patient)}
                          className="font-bold text-slate-900 hover:text-indigo-600 text-left transition-colors cursor-pointer block"
                        >
                          {patientName}
                        </button>
                        {ag.numero_sessao && ag.total_sessoes_pacote && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            Sessão {ag.numero_sessao} de {ag.total_sessoes_pacote}
                          </span>
                        )}
                      </td>

                      {/* Profissional */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-700">
                          {ag.profissional_nome || 'Equipe Geral'}
                        </span>
                      </td>

                      {/* Procedimento (Apenas se Modo Detalhado ativo) */}
                      {modoDetalhado && (
                        <td className="py-3.5 px-4 text-slate-600 font-medium">
                          {ag.procedimento}
                        </td>
                      )}

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {getStatusBadge(ag.status)}
                      </td>

                      {/* Ações Rápidas & Controle de Status */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {ag.status === 'pendente' && (
                            <>
                              <button
                                onClick={() => onUpdateStatus(ag.id, 'em_espera')}
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                                title="Marcar chegada rápida na recepção"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Chegou</span>
                              </button>
                              {onOpenCheckInModal && (
                                <button
                                  onClick={() => onOpenCheckInModal(ag)}
                                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                  title="Check-In com Pagamento e Agendamento de Retorno"
                                >
                                  <span>Check-In</span>
                                </button>
                              )}
                            </>
                          )}

                          {ag.status === 'confirmado' && (
                            <>
                              <button
                                onClick={() => onUpdateStatus(ag.id, 'em_espera')}
                                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                                title="Marcar chegada rápida na recepção"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Chegou</span>
                              </button>
                              {onOpenCheckInModal && (
                                <button
                                  onClick={() => onOpenCheckInModal(ag)}
                                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                                  title="Check-In com Pagamento e Agendamento de Retorno"
                                >
                                  <span>Check-In</span>
                                </button>
                              )}
                            </>
                          )}

                          {ag.status === 'em_espera' && (
                            <>
                              <button
                                onClick={() => onUpdateStatus(ag.id, 'em_atendimento')}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                                title="Chamar para sala de atendimento"
                              >
                                <DoorOpen className="w-3.5 h-3.5" />
                                <span>Chamar Sala</span>
                              </button>

                              <button
                                onClick={() => onOpenCompleteModal ? onOpenCompleteModal(ag) : onUpdateStatus(ag.id, 'concluido')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                                title="Finalizar atendimento e registrar no caixa"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Finalizar</span>
                              </button>

                              <button
                                onClick={() => onUpdateStatus(ag.id, 'confirmado')}
                                className="p-1 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-md border border-slate-200 transition-colors cursor-pointer"
                                title="Desfazer chegada (retornar para agendado)"
                              >
                                <Undo2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {ag.status === 'em_atendimento' && (
                            <>
                              <button
                                onClick={() => onOpenCompleteModal ? onOpenCompleteModal(ag) : onUpdateStatus(ag.id, 'concluido')}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                                title="Concluir procedimento e debitar insumos"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Finalizar</span>
                              </button>

                              {/* Botão de Retorno caso tenha chamado o cliente errado */}
                              <button
                                onClick={() => onUpdateStatus(ag.id, 'em_espera')}
                                className="px-2 py-1 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 rounded-lg text-xs font-semibold transition-all border border-slate-300 flex items-center gap-1 cursor-pointer"
                                title="Chamou errado? Retornar para fila de espera na recepção"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                                <span>Voltar p/ Espera</span>
                              </button>
                            </>
                          )}

                          {ag.status === 'concluido' && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-slate-400 font-semibold">
                                Finalizado
                              </span>
                              <button
                                onClick={() => onUpdateStatus(ag.id, 'em_atendimento')}
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md border border-slate-200 transition-colors cursor-pointer"
                                title="Reabrir atendimento (retornar para em sala)"
                              >
                                <RotateCcw className="w-3 h-3" />
                              </button>
                            </div>
                          )}

                          {ag.status === 'cancelado' && (
                            <button
                              onClick={() => onUpdateStatus(ag.id, 'confirmado')}
                              className="px-2 py-0.5 text-[11px] text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded border border-slate-200 transition-colors cursor-pointer flex items-center gap-1"
                              title="Reativar agendamento"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Reativar</span>
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

      {/* Maintenance Preventive Alerts (6.1) */}
      {totalAlertasManutencao > 0 && (
        <div className="bg-gradient-to-r from-amber-50 via-rose-50 to-indigo-50 border border-amber-200/90 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                  Engenharia Clínica: {totalAlertasManutencao} equipamento(s) requerem atenção
                </h4>
                {equipamentosManutVencida.length > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-extrabold bg-rose-600 text-white rounded-full animate-pulse">
                    {equipamentosManutVencida.length} VENCIDA(S)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                {equipamentosManutVencida.length > 0 && (
                  <span className="text-rose-700 font-semibold mr-2">
                    🚨 Vencidas: {equipamentosManutVencida.map(e => e.nome).slice(0, 2).join(', ')}
                  </span>
                )}
                {equipamentosManutProxima.length > 0 && (
                  <span className="text-amber-800 font-medium mr-2">
                    ⚠️ Próximas (15d): {equipamentosManutProxima.map(e => e.nome).slice(0, 2).join(', ')}
                  </span>
                )}
                {equipamentosEmManutencao.length > 0 && (
                  <span className="text-sky-800 font-medium">
                    🛠️ Na Assistência: {equipamentosEmManutencao.map(e => e.nome).slice(0, 2).join(', ')}
                  </span>
                )}
              </p>
            </div>
          </div>
          
          {onGoToBens && (
            <button
              onClick={onGoToBens}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Gerenciar Manutenções</span>
            </button>
          )}
        </div>
      )}

      {/* Low Stock Warning Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-rose-900">
                {lowStockItems.length} insumo(s) abaixo do estoque mínimo
              </h4>
              <p className="text-[11px] text-rose-700">
                {lowStockItems.map(i => i.nome_item).slice(0, 3).join(', ')}
              </p>
            </div>
          </div>
          <button
            onClick={onGoToEstoque}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Ver Estoque
          </button>
        </div>
      )}
    </div>
  );
};
