import React, { useState, useEffect, useMemo } from 'react';
import { 
  Tv, 
  Calendar, 
  Clock, 
  Sun, 
  Sunset, 
  Moon, 
  Maximize, 
  Minimize, 
  Sparkles, 
  DoorOpen, 
  CheckCircle2, 
  Hourglass, 
  Check, 
  User, 
  ShieldCheck, 
  Volume2, 
  VolumeX, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Radio, 
  ArrowLeft,
  Layers,
  ChevronRight,
  Share2,
  Copy,
  ExternalLink,
  Info
} from 'lucide-react';
import { Agendamento, Paciente, StatusAgendamento, UsuarioEquipe, ClinicaConfig } from '../types';

export type TurnoType = 'todos' | 'manha' | 'tarde' | 'noite' | 'auto';

interface ReceptionTVViewProps {
  agendamentos: Agendamento[];
  pacientes: Paciente[];
  profissionais?: UsuarioEquipe[];
  clinicaConfig?: ClinicaConfig;
  onCloseTvMode?: () => void;
  isStandalone?: boolean;
}

export const ReceptionTVView: React.FC<ReceptionTVViewProps> = ({
  agendamentos,
  pacientes,
  profissionais = [],
  clinicaConfig,
  onCloseTvMode,
  isStandalone = false,
}) => {
  // Real-time Clock
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [selectedTurno, setSelectedTurno] = useState<TurnoType>('auto');
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [rotationTimer, setRotationTimer] = useState<number>(20); // seconds per turn
  const [currentRotatedTurnoIndex, setCurrentRotatedTurnoIndex] = useState<number>(0);
  const [privacyMode, setPrivacyMode] = useState<boolean>(false); // Anonymize last names
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Determine current active shift based on clock
  const currentHour = currentTime.getHours();
  const activeShiftByHour: 'manha' | 'tarde' | 'noite' = useMemo(() => {
    if (currentHour < 12) return 'manha';
    if (currentHour < 18) return 'tarde';
    return 'noite';
  }, [currentHour]);

  // Available shifts for rotation
  const SHIFTS_LIST: Array<'manha' | 'tarde' | 'noite'> = ['manha', 'tarde', 'noite'];

  // Auto rotation timer for shift carousel
  useEffect(() => {
    if (selectedTurno !== 'auto' && !autoRotate) return;
    
    // If autoRotate is enabled or selectedTurno is 'auto' with rotation
    const interval = setInterval(() => {
      setCurrentRotatedTurnoIndex((prev) => (prev + 1) % SHIFTS_LIST.length);
    }, rotationTimer * 1000);

    return () => clearInterval(interval);
  }, [selectedTurno, autoRotate, rotationTimer, SHIFTS_LIST.length]);

  // Fullscreen handlers
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.warn('Erro ao entrar em fullscreen:', err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        }).catch((err) => {
          console.warn('Erro ao sair de fullscreen:', err);
        });
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Filter ONLY appointments of TODAY (00:00 to 23:59)
  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [currentTime.getDate(), currentTime.getMonth(), currentTime.getFullYear()]);

  const todayAppointments = useMemo(() => {
    return agendamentos.filter((ag) => {
      if (ag.status === 'cancelado') return false;
      try {
        const agDate = new Date(ag.data_hora);
        const y = agDate.getFullYear();
        const m = String(agDate.getMonth() + 1).padStart(2, '0');
        const d = String(agDate.getDate()).padStart(2, '0');
        const agDateStr = `${y}-${m}-${d}`;
        return agDateStr === todayStr;
      } catch {
        return false;
      }
    }).sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());
  }, [agendamentos, todayStr]);

  // Helper to categorize appointment by shift
  const getAppointmentShift = (isoDate: string): 'manha' | 'tarde' | 'noite' => {
    try {
      const d = new Date(isoDate);
      const h = d.getHours();
      if (h < 12) return 'manha';
      if (h < 18) return 'tarde';
      return 'noite';
    } catch {
      return 'manha';
    }
  };

  // Group appointments by shift
  const appointmentsByShift = useMemo(() => {
    const manha: Agendamento[] = [];
    const tarde: Agendamento[] = [];
    const noite: Agendamento[] = [];

    todayAppointments.forEach((ag) => {
      const shift = getAppointmentShift(ag.data_hora);
      if (shift === 'manha') manha.push(ag);
      else if (shift === 'tarde') tarde.push(ag);
      else noite.push(ag);
    });

    return { manha, tarde, noite };
  }, [todayAppointments]);

  // Identify appointments in progress and in waiting room
  const inProcedureAppointment = useMemo(() => {
    return todayAppointments.find(a => a.status === 'em_atendimento');
  }, [todayAppointments]);

  const waitingAppointment = useMemo(() => {
    return todayAppointments.find(a => a.status === 'em_espera');
  }, [todayAppointments]);

  const nextUpcomingAppointment = useMemo(() => {
    const nowMs = currentTime.getTime();
    return todayAppointments.find(a => {
      const agMs = new Date(a.data_hora).getTime();
      return agMs >= nowMs && (a.status === 'confirmado' || a.status === 'pendente');
    });
  }, [todayAppointments, currentTime]);

  // Privacy name formatter (e.g. "Mariana Silva Souza" -> "Mariana S. S.")
  const formatPatientName = (fullName: string): string => {
    if (!privacyMode || !fullName) return fullName;
    const parts = fullName.trim().split(/\s+/);
    if (parts.length <= 1) return fullName;
    const firstName = parts[0];
    const initials = parts.slice(1).map(p => `${p.charAt(0).toUpperCase()}.`).join(' ');
    return `${firstName} ${initials}`;
  };

  // Format time (HH:MM)
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '--:--';
    }
  };

  // Status visual configurations
  const getStatusDisplay = (status: StatusAgendamento) => {
    switch (status) {
      case 'em_atendimento':
        return {
          label: 'EM ATENDIMENTO',
          badgeBg: 'bg-emerald-500 text-white font-extrabold shadow-lg shadow-emerald-500/30 animate-pulse',
          icon: DoorOpen,
          cardBorder: 'border-emerald-500/80 ring-2 ring-emerald-500/30 bg-emerald-950/20',
          dotColor: 'bg-emerald-400',
        };
      case 'em_espera':
        return {
          label: 'NA RECEPÇÃO (AGUARDANDO)',
          badgeBg: 'bg-amber-500 text-slate-950 font-extrabold shadow-md shadow-amber-500/20',
          icon: Hourglass,
          cardBorder: 'border-amber-400/70 ring-1 ring-amber-400/20 bg-amber-950/20',
          dotColor: 'bg-amber-400 animate-ping',
        };
      case 'confirmado':
        return {
          label: 'CONFIRMADO',
          badgeBg: 'bg-indigo-600/90 text-white font-bold',
          icon: CheckCircle2,
          cardBorder: 'border-indigo-500/30 bg-slate-900/40',
          dotColor: 'bg-indigo-400',
        };
      case 'concluido':
        return {
          label: 'FINALIZADO',
          badgeBg: 'bg-slate-700/60 text-slate-300 font-medium',
          icon: Check,
          cardBorder: 'border-slate-800 opacity-60 bg-slate-950/40',
          dotColor: 'bg-slate-500',
        };
      case 'pendente':
      default:
        return {
          label: 'AGENDADO',
          badgeBg: 'bg-sky-600/80 text-white font-medium',
          icon: Clock,
          cardBorder: 'border-slate-700/50 bg-slate-900/30',
          dotColor: 'bg-sky-400',
        };
    }
  };

  // Shift badge configurations
  const SHIFT_CONFIGS = {
    manha: {
      title: 'Turno da Manhã',
      hours: '07:00 às 11:59',
      icon: Sun,
      color: 'amber',
      headerBg: 'from-amber-600/20 to-amber-900/10 border-amber-500/30',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
      iconColor: 'text-amber-400',
    },
    tarde: {
      title: 'Turno da Tarde',
      hours: '12:00 às 17:59',
      icon: Sunset,
      color: 'orange',
      headerBg: 'from-orange-600/20 to-orange-900/10 border-orange-500/30',
      badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-400/30',
      iconColor: 'text-orange-400',
    },
    noite: {
      title: 'Turno da Noite',
      hours: '18:00 às 22:30',
      icon: Moon,
      color: 'indigo',
      headerBg: 'from-indigo-600/20 to-indigo-900/10 border-indigo-500/30',
      badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30',
      iconColor: 'text-indigo-400',
    },
  };

  const handleCopyTvLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('mode', 'tv');
    url.searchParams.set('token', 'virtual_reception_display');
    navigator.clipboard.writeText(url.toString()).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    });
  };

  // Determine which shift(s) to render
  const shiftsToRender: Array<'manha' | 'tarde' | 'noite'> = useMemo(() => {
    if (selectedTurno === 'todos') {
      return ['manha', 'tarde', 'noite'];
    }
    if (selectedTurno === 'manha') return ['manha'];
    if (selectedTurno === 'tarde') return ['tarde'];
    if (selectedTurno === 'noite') return ['noite'];
    
    // Mode 'auto': if carousel is active, show the currently rotated shift, else show the active shift by hour
    if (autoRotate) {
      return [SHIFTS_LIST[currentRotatedTurnoIndex]];
    }
    return [activeShiftByHour];
  }, [selectedTurno, autoRotate, currentRotatedTurnoIndex, activeShiftByHour]);

  const isDark = themeMode === 'dark';

  return (
    <div 
      className={`min-h-screen w-full flex flex-col font-sans select-none transition-colors duration-500 ${
        isDark 
          ? 'bg-slate-950 text-slate-100' 
          : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Top TV Reception Header */}
      <header 
        className={`w-full px-6 sm:px-10 py-5 border-b flex flex-wrap items-center justify-between gap-4 z-20 backdrop-blur-md transition-colors ${
          isDark 
            ? 'bg-slate-900/90 border-slate-800' 
            : 'bg-white/95 border-slate-200 shadow-xs'
        }`}
      >
        {/* Brand & Clinic Name */}
        <div className="flex items-center gap-4">
          {clinicaConfig?.logomarca_url ? (
            <img 
              src={clinicaConfig.logomarca_url} 
              alt={clinicaConfig.nome} 
              className="h-12 w-auto max-w-[140px] object-contain rounded-lg"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
          )}
          
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight font-display">
                {clinicaConfig?.nome || 'Estética & Saúde'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Balcão do Dia
              </span>
            </div>
            <p className={`text-xs font-medium tracking-wide mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {clinicaConfig?.slogan || 'Painel de Atendimentos & Recepção em Tempo Real'}
            </p>
          </div>
        </div>

        {/* Center: Shift Switcher Tabs */}
        <div className="hidden lg:flex items-center gap-1.5 p-1 rounded-2xl border backdrop-blur-xs bg-slate-900/50 border-slate-800">
          <button
            type="button"
            onClick={() => { setSelectedTurno('auto'); setAutoRotate(true); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedTurno === 'auto'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Alterna automaticamente pelos turnos"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
            <span>Auto Turnos</span>
          </button>

          <button
            type="button"
            onClick={() => { setSelectedTurno('manha'); setAutoRotate(false); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedTurno === 'manha'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>Manhã ({appointmentsByShift.manha.length})</span>
          </button>

          <button
            type="button"
            onClick={() => { setSelectedTurno('tarde'); setAutoRotate(false); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedTurno === 'tarde'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sunset className="w-3.5 h-3.5 text-orange-400" />
            <span>Tarde ({appointmentsByShift.tarde.length})</span>
          </button>

          <button
            type="button"
            onClick={() => { setSelectedTurno('noite'); setAutoRotate(false); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedTurno === 'noite'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Noite ({appointmentsByShift.noite.length})</span>
          </button>

          <button
            type="button"
            onClick={() => { setSelectedTurno('todos'); setAutoRotate(false); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedTurno === 'todos'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Ver Todos ({todayAppointments.length})</span>
          </button>
        </div>

        {/* Right: Live Digital Clock & Controls */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Live High-Contrast Clock */}
          <div className="text-right">
            <div className="flex items-baseline justify-end gap-1 font-mono text-2xl sm:text-3xl font-black tracking-tight text-indigo-400">
              <span>{currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="text-xs sm:text-sm font-semibold opacity-70">
                :{String(currentTime.getSeconds()).padStart(2, '0')}
              </span>
            </div>
            <p className={`text-[11px] font-semibold tracking-wider capitalize ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })}
            </p>
          </div>

          {/* Quick TV Control Buttons */}
          <div className="flex items-center gap-1.5">
            {/* Toggle Privacy Mode (Anonymize Names) */}
            <button
              type="button"
              onClick={() => setPrivacyMode(!privacyMode)}
              title={privacyMode ? 'Exibir Nomes Completos' : 'Ocultar Sobrenomes (Modo Privacidade LGPD)'}
              className={`p-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                privacyMode
                  ? 'bg-purple-600/30 text-purple-300 border-purple-500/40'
                  : isDark ? 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
            >
              {privacyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>

            {/* Toggle Theme (Dark / Light) */}
            <button
              type="button"
              onClick={() => setThemeMode(isDark ? 'light' : 'dark')}
              title={isDark ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro TV'}
              className={`p-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                isDark 
                  ? 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white' 
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Share / Virtual Display Link */}
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              title="Gerar Link / Configurar TV da Recepção"
              className={`p-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                isDark 
                  ? 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white' 
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Toggle Fullscreen */}
            <button
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia (Modo TV F11)'}
              className="p-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer shadow-sm"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>

            {/* Close / Return button */}
            {onCloseTvMode && (
              <button
                type="button"
                onClick={onCloseTvMode}
                title="Voltar para o Sistema Principal"
                className={`ml-2 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Voltar</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Real-time Status Callout Banner (Room In Progress / Next Waiting) */}
      <div className="w-full px-6 sm:px-10 py-3 bg-gradient-to-r from-indigo-900/90 via-purple-900/80 to-slate-900 text-white border-b border-indigo-800/60 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            {inProcedureAppointment ? (
              <span className="font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Em Atendimento Agora:</span>
                <span className="text-emerald-300 font-extrabold underline decoration-emerald-400">
                  {formatPatientName(inProcedureAppointment.paciente?.nome || (pacientes.find(p => p.id === inProcedureAppointment.paciente_id)?.nome) || 'Paciente')}
                </span>
                <span className="text-slate-300 font-normal">
                  com {inProcedureAppointment.profissional_nome || 'Profissional'}
                </span>
              </span>
            ) : waitingAppointment ? (
              <span className="font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Aguardando na Recepção:</span>
                <span className="text-amber-300 font-extrabold">
                  {formatPatientName(waitingAppointment.paciente?.nome || (pacientes.find(p => p.id === waitingAppointment.paciente_id)?.nome) || 'Paciente')}
                </span>
              </span>
            ) : nextUpcomingAppointment ? (
              <span className="font-medium text-slate-200">
                Próximo Atendimento às <strong className="text-indigo-300 font-bold">{formatTime(nextUpcomingAppointment.data_hora)}</strong>:{' '}
                {formatPatientName(nextUpcomingAppointment.paciente?.nome || (pacientes.find(p => p.id === nextUpcomingAppointment.paciente_id)?.nome) || 'Paciente')}
              </span>
            ) : (
              <span className="text-slate-300">
                Nenhum atendimento em andamento no momento. Agenda do dia em dia!
              </span>
            )}
          </div>
        </div>

        {/* Quick Shift Counter Badges */}
        <div className="flex items-center gap-2 text-[11px] font-bold">
          <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
            <Sun className="w-3 h-3" /> Manhã: {appointmentsByShift.manha.length}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-orange-500/20 text-orange-300 border border-orange-500/30 flex items-center gap-1">
            <Sunset className="w-3 h-3" /> Tarde: {appointmentsByShift.tarde.length}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
            <Moon className="w-3 h-3" /> Noite: {appointmentsByShift.noite.length}
          </span>
        </div>
      </div>

      {/* Main Content Area: Shifts & Appointments List */}
      <main className="flex-1 w-full px-6 sm:px-10 py-6 overflow-y-auto">
        {todayAppointments.length === 0 ? (
          <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-3xl bg-indigo-900/30 border border-indigo-700/50 flex items-center justify-center text-indigo-400 mb-4 shadow-xl">
              <Calendar className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold font-display tracking-tight">
              Nenhum agendamento para hoje
            </h2>
            <p className={`text-sm max-w-md mt-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Não há atendimentos programados para a data de hoje. Novos agendamentos registrados no balcão aparecerão aqui instantaneamente.
            </p>
          </div>
        ) : (
          <div className={`grid gap-6 ${
            shiftsToRender.length === 3 
              ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
              : shiftsToRender.length === 2
              ? 'grid-cols-1 lg:grid-cols-2'
              : 'grid-cols-1 max-w-5xl mx-auto'
          }`}>
            {shiftsToRender.map((shiftKey) => {
              const config = SHIFT_CONFIGS[shiftKey];
              const list = appointmentsByShift[shiftKey];
              const isCurrentActiveShift = activeShiftByHour === shiftKey;
              const ShiftIcon = config.icon;

              return (
                <section 
                  key={shiftKey}
                  className={`flex flex-col rounded-3xl border transition-all duration-300 overflow-hidden ${
                    isCurrentActiveShift
                      ? isDark 
                        ? 'bg-slate-900/80 border-indigo-500/50 ring-2 ring-indigo-500/20 shadow-2xl' 
                        : 'bg-white border-indigo-300 ring-2 ring-indigo-200 shadow-xl'
                      : isDark
                      ? 'bg-slate-900/40 border-slate-800 shadow-md'
                      : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  {/* Shift Column Header */}
                  <div className={`p-5 border-b bg-gradient-to-r ${config.headerBg} flex items-center justify-between gap-3`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${config.badgeBg}`}>
                        <ShiftIcon className={`w-6 h-6 ${config.iconColor}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-black tracking-tight font-display">
                            {config.title}
                          </h2>
                          {isCurrentActiveShift && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-white animate-pulse">
                              Agora
                            </span>
                          )}
                        </div>
                        <p className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {config.hours}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-xl font-black font-mono ${config.iconColor}`}>
                        {list.length}
                      </span>
                      <span className={`block text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {list.length === 1 ? 'Atendimento' : 'Atendimentos'}
                      </span>
                    </div>
                  </div>

                  {/* Shift Appointments Cards */}
                  <div className="p-4 sm:p-5 flex-1 space-y-3.5 overflow-y-auto">
                    {list.length === 0 ? (
                      <div className="py-10 text-center flex flex-col items-center justify-center">
                        <ShiftIcon className={`w-8 h-8 opacity-20 mb-2 ${config.iconColor}`} />
                        <p className={`text-xs font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          Nenhum atendimento agendado para o {config.title.toLowerCase()}
                        </p>
                      </div>
                    ) : (
                      list.map((ag) => {
                        const statusConfig = getStatusDisplay(ag.status);
                        const StatusIcon = statusConfig.icon;
                        const patient = pacientes.find(p => p.id === ag.paciente_id) || ag.paciente;
                        const patientName = formatPatientName(patient?.nome || 'Paciente');

                        return (
                          <div
                            key={ag.id}
                            className={`p-4 rounded-2xl border transition-all duration-200 ${statusConfig.cardBorder} ${
                              isDark ? 'bg-slate-900/60' : 'bg-slate-50/80'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              {/* Time & Patient Name */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="flex items-center gap-1 text-sm font-black font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>{formatTime(ag.data_hora)}</span>
                                  </div>

                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider ${statusConfig.badgeBg}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`} />
                                    <span>{statusConfig.label}</span>
                                  </span>
                                </div>

                                <h3 className="text-base sm:text-lg font-black tracking-tight truncate mt-1">
                                  {patientName}
                                </h3>

                                <p className={`text-xs font-semibold truncate mt-0.5 ${isDark ? 'text-indigo-200' : 'text-indigo-700'}`}>
                                  {ag.procedimento || 'Procedimento Estético'}
                                </p>
                              </div>
                            </div>

                            {/* Footer: Professional & Room */}
                            <div className={`mt-3 pt-2.5 border-t flex items-center justify-between text-xs font-semibold ${
                              isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
                            }`}>
                              <div className="flex items-center gap-1.5 truncate">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                <span className="truncate">
                                  {ag.profissional_nome || 'Equipe Aura'}
                                </span>
                              </div>

                              {(ag as any).sala && (
                                <div className="flex items-center gap-1 text-indigo-400 font-bold shrink-0">
                                  <DoorOpen className="w-3.5 h-3.5" />
                                  <span>{(ag as any).sala}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>

      {/* Mini Footer: Reception Controls Help & Security Assurance */}
      <footer 
        className={`w-full px-6 sm:px-10 py-3 border-t flex flex-wrap items-center justify-between gap-3 text-[11px] font-semibold transition-colors ${
          isDark 
            ? 'bg-slate-900/60 border-slate-800 text-slate-400' 
            : 'bg-white border-slate-200 text-slate-500'
        }`}
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Tela Pública de Recepção Segura • Valores financeiros e dados sensíveis protegidos por padrão.</span>
        </div>

        <div className="flex items-center gap-4">
          <span>Pressione <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[10px] border border-slate-700">F11</kbd> para Tela Cheia</span>
          <span>•</span>
          <span>Sincronização em tempo real ativa</span>
        </div>
      </footer>

      {/* Share / Smart TV Configuration Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Tv className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-display text-white">
                    Espelhar TV da Recepção
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Configure uma Smart TV, monitor secundário ou tablet na recepção.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <span className="text-[11px] uppercase font-bold text-indigo-400 block tracking-wider">
                  Link Direto do Balcão TV (Sem Senha Financeira)
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}${window.location.pathname}?mode=tv`}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleCopyTvLink}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition shrink-0 cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                  <p>Abra o navegador da Smart TV ou monitor da recepção.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                  <p>Acesse o link direto copiado acima.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-400 font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
                  <p>Pressione o botão de Tela Cheia no topo ou a tecla F11.</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  window.open(`${window.location.origin}${window.location.pathname}?mode=tv`, '_blank');
                  setShowShareModal(false);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Testar em Nova Janela</span>
              </button>

              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition cursor-pointer"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
