import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  Search, 
  Sparkles, 
  ChevronDown, 
  KeyRound, 
  Users, 
  LogOut,
  Bell,
  Megaphone,
  ShieldCheck,
  UserCheck,
  Wrench,
  Activity,
  Terminal,
  Wifi,
  WifiOff,
  RefreshCw,
  Tv
} from 'lucide-react';
import { TabType, UsuarioEquipe, UserRole } from '../types';
import { 
  isUserAdminTotal,
  getRecentWriteAttempts,
  printWriteAttemptsToConsole,
  setWriteDebugMode,
  getWriteDebugMode,
  subscribeToWriteAttempts
} from '../services/firebaseService';
import { useConnectionStatus } from '../contexts/ConnectionStatusContext';
import { ConnectionSyncStatusWidget } from './ConnectionSyncStatusWidget';
import { MasterEditToggle } from './MasterEditToggle';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenNewAppointment: () => void;
  onOpenSqlGuide: () => void;
  onOpenGlobalSearch?: () => void;
  onOpenNoticeBoard?: () => void;
  onOpenSecondScreenModal?: () => void;
  unreadNoticesCount?: number;
  lowStockCount: number;
  manutencaoAlertCount?: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentUser: UsuarioEquipe;
  usuarios: UsuarioEquipe[];
  onRequestSwitchUser: (targetUser?: UsuarioEquipe) => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewAppointment,
  onOpenSqlGuide,
  onOpenGlobalSearch,
  onOpenNoticeBoard,
  onOpenSecondScreenModal,
  unreadNoticesCount = 0,
  lowStockCount,
  manutencaoAlertCount = 0,
  searchQuery,
  setSearchQuery,
  currentUser,
  usuarios,
  onRequestSwitchUser,
  onLogout,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { isOnline, isSyncing } = useConnectionStatus();
  const [isDebugLogging, setIsDebugLogging] = useState<boolean>(() => getWriteDebugMode());
  const [recentWritesCount, setRecentWritesCount] = useState<number>(() => getRecentWriteAttempts().length);
  const [showConsoleFeedback, setShowConsoleFeedback] = useState(false);

  // Subscribe to real-time write attempts
  useEffect(() => {
    return subscribeToWriteAttempts(() => {
      setRecentWritesCount(getRecentWriteAttempts().length);
    });
  }, []);

  // Compute current connection state
  const connectionState: 'Online' | 'Syncing' | 'Offline' = isSyncing 
    ? 'Syncing' 
    : isOnline 
    ? 'Online' 
    : 'Offline';

  const handleToggleDebug = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMode = !isDebugLogging;
    setIsDebugLogging(nextMode);
    setWriteDebugMode(nextMode);
    printWriteAttemptsToConsole();
    setShowConsoleFeedback(true);
    setTimeout(() => setShowConsoleFeedback(false), 2500);
  };

  // Format current date in Portuguese
  const todayFormatted = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const capitalizedDate = todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin_total':
        return {
          label: '👑 Master',
          style: 'bg-amber-50 text-amber-700 border-amber-200/70',
        };
      case 'admin_local':
      case 'admin':
      case 'gestor':
        return {
          label: '⭐ Admin',
          style: 'bg-indigo-50 text-indigo-700 border-indigo-200/70',
        };
      case 'profissional':
        return {
          label: '🩺 Profissional',
          style: 'bg-teal-50 text-teal-700 border-teal-200/70',
        };
      case 'recepcao':
      case 'operador':
        return {
          label: '🧑‍💼 Recepção',
          style: 'bg-emerald-50 text-emerald-700 border-emerald-200/70',
        };
      case 'cliente':
        return {
          label: '👤 Cliente',
          style: 'bg-blue-50 text-blue-700 border-blue-200/70',
        };
      default:
        return {
          label: 'Usuário',
          style: 'bg-slate-50 text-slate-700 border-slate-200/70',
        };
    }
  };

  const currentBadge = getRoleBadge(currentUser.role);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 lg:px-8 py-3 shadow-2xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        {/* Left Side: Brand & Context */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-xs">
            E
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                EstéticaOS
              </h1>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${currentBadge.style}`}>
                {currentBadge.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>{capitalizedDate}</span>
            </p>
          </div>
        </div>

        {/* Search Bar with Ctrl+K trigger */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar rápida no sistema..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClick={() => onOpenGlobalSearch && onOpenGlobalSearch()}
            className="w-full pl-9 pr-14 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
          />
          <button
            type="button"
            onClick={() => onOpenGlobalSearch && onOpenGlobalSearch()}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white border border-slate-200 rounded text-slate-500 shadow-2xs hover:bg-slate-50"
            title="Pressione Ctrl+K ou clique para busca avançada"
          >
            ⌘K
          </button>
        </div>

        {/* Right Side: Role Switcher Pill & Actions */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          
          {/* Botão de Ativação do Modo Edição Master */}
          <MasterEditToggle />

          {/* Quick TV Reception / Second Screen Button */}
          <button
            type="button"
            onClick={() => {
              if (onOpenSecondScreenModal) {
                onOpenSecondScreenModal();
              } else {
                setActiveTab('balcao_tv');
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
              activeTab === 'balcao_tv'
                ? 'bg-purple-600 border-purple-700 text-white'
                : 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-800'
            }`}
            title="Abrir TV da Recepção / Segunda Tela (Espelhamento do Balcão do Dia por Turnos)"
          >
            <Tv className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden xl:inline">TV Recepção</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-200 text-purple-900 font-extrabold">2ª Tela</span>
          </button>

          {/* Quick Aura Copilot AI Button */}
          <button
            type="button"
            onClick={() => setActiveTab('gemini_copilot')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
              activeTab === 'gemini_copilot'
                ? 'bg-teal-600 border-teal-700 text-white'
                : 'bg-teal-50 hover:bg-teal-100 border-teal-200 text-teal-800'
            }`}
            title="Abrir Aura Copilot IA (Gemini 3.7 Flash)"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span className="hidden lg:inline">Aura Copilot</span>
          </button>

          {/* Status Indicator & Firestore Debug Toggle */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-50 border border-slate-200 rounded-xl shadow-2xs">
            {/* Simple Connection State Indicator: Online | Syncing | Offline */}
            <div 
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                connectionState === 'Online'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : connectionState === 'Syncing'
                  ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
              title={`Estado da Conexão: ${connectionState}`}
            >
              <span className="relative flex h-2 w-2">
                {connectionState === 'Online' && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                {connectionState === 'Syncing' && (
                  <RefreshCw className="w-2.5 h-2.5 animate-spin text-indigo-600 -ml-0.5" />
                )}
                {connectionState !== 'Syncing' && (
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      connectionState === 'Online' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  ></span>
                )}
              </span>
              <span className="text-[11px] tracking-tight">{connectionState}</span>
            </div>

            {/* Small Debug Writes Toggle */}
            <button
              type="button"
              onClick={handleToggleDebug}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-mono font-semibold transition-all cursor-pointer border ${
                isDebugLogging
                  ? 'bg-indigo-600 border-indigo-700 text-white shadow-2xs hover:bg-indigo-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
              title="Debug: Imprimir no Console (F12) as gravações em tempo real do Firestore"
            >
              <Terminal className="w-3 h-3 text-current" />
              <span className="hidden sm:inline">Debug</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                isDebugLogging ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {recentWritesCount}
              </span>
              {showConsoleFeedback && (
                <span className="text-[10px] text-emerald-300 font-sans font-bold animate-pulse">
                  ✓ F12
                </span>
              )}
            </button>
          </div>

          {/* Status de Conexão Detalhado & Sincronização Nuvem / IndexedDB */}
          <ConnectionSyncStatusWidget />

          {/* Quadro de Avisos Notification Bell */}
          <button
            type="button"
            onClick={() => {
              if (onOpenNoticeBoard) {
                onOpenNoticeBoard();
              } else {
                setActiveTab('quadro_avisos');
              }
            }}
            className={`relative p-2 rounded-xl border transition-colors cursor-pointer flex items-center justify-center ${
              activeTab === 'quadro_avisos'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title="Quadro de Avisos da Clínica"
          >
            <Megaphone className="w-4 h-4 text-indigo-600" />
            {unreadNoticesCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-2xs animate-pulse">
                {unreadNoticesCount}
              </span>
            )}
          </button>

          {/* Alertas de Manutenção Preventiva */}
          {currentUser.role !== 'cliente' && (
            <button
              type="button"
              onClick={() => setActiveTab('bens')}
              className={`relative p-2 rounded-xl border transition-colors cursor-pointer flex items-center justify-center ${
                activeTab === 'bens' || activeTab === 'patrimonio'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
              }`}
              title="Alertas de Manutenção Preventiva dos Equipamentos"
            >
              <Wrench className="w-4 h-4 text-amber-600" />
              {manutencaoAlertCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-2xs">
                  {manutencaoAlertCount}
                </span>
              )}
            </button>
          )}

          {/* User & Role Switcher Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer text-left"
              title="Alternar Perfil de Acesso"
            >
              <img
                src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80'}
                alt={currentUser.nome}
                className="w-7 h-7 rounded-lg object-cover border border-slate-200"
              />
              <div className="hidden sm:block text-left pr-1">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {currentUser.nome.split(' ')[0]} {currentUser.nome.split(' ')[1] || ''}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {isUserAdminTotal(currentUser) 
                    ? '👑 Super Admin' 
                    : currentUser.role === 'admin_local' || currentUser.role === 'admin' || currentUser.role === 'gestor'
                    ? '⭐ Admin' 
                    : currentUser.role === 'profissional'
                    ? '🩺 Profissional'
                    : currentUser.role === 'recepcao' || currentUser.role === 'operador'
                    ? '🧑‍💼 Recepção'
                    : '👤 Cliente'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                onClick={() => setIsUserMenuOpen(false)}
              >
                {isUserAdminTotal(currentUser) ? (
                  <>
                    <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Alternar Usuário (Master)
                      </span>
                      <KeyRound className="w-3 h-3 text-slate-400" />
                    </div>

                    <div className="p-1 space-y-1 max-h-48 overflow-y-auto">
                      {usuarios.map(u => (
                        <button
                          key={u.id}
                          onClick={() => onRequestSwitchUser(u)}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-left transition-colors cursor-pointer ${
                            u.id === currentUser.id
                              ? 'bg-indigo-50 text-indigo-900 font-semibold'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <img
                              src={u.avatar_url}
                              alt={u.nome}
                              className="w-6 h-6 rounded-md object-cover"
                            />
                            <div>
                              <p className="font-semibold leading-tight">{u.nome}</p>
                              <p className="text-[10px] text-slate-400">
                                {isUserAdminTotal(u)
                                  ? 'Super Admin'
                                  : u.role === 'admin_local' || u.role === 'admin' || u.role === 'gestor'
                                  ? 'Admin Local'
                                  : u.role === 'profissional'
                                  ? 'Profissional'
                                  : u.role === 'recepcao' || u.role === 'operador'
                                  ? 'Recepção'
                                  : 'Cliente'}
                              </p>
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            isUserAdminTotal(u) 
                              ? 'bg-amber-100 text-amber-800'
                              : u.role === 'admin_local' || u.role === 'admin' || u.role === 'gestor'
                              ? 'bg-indigo-100 text-indigo-700' 
                              : u.role === 'profissional'
                              ? 'bg-teal-100 text-teal-700'
                              : u.role === 'recepcao' || u.role === 'operador'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {isUserAdminTotal(u)
                              ? 'Master'
                              : u.role === 'admin_local' || u.role === 'admin' || u.role === 'gestor'
                              ? 'Admin'
                              : u.role === 'profissional'
                              ? 'Pro'
                              : u.role === 'recepcao' || u.role === 'operador'
                              ? 'Recepção'
                              : 'Cliente'}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="px-2 pt-2 mt-1 border-t border-slate-100 space-y-1">
                      <button
                        onClick={() => setActiveTab('usuarios')}
                        className="w-full text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 px-2 py-1.5 rounded-md flex items-center gap-1.5"
                      >
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>Gerenciar Equipe (Admin)</span>
                      </button>

                      <button
                        onClick={() => onRequestSwitchUser()}
                        className="w-full text-left text-xs font-semibold text-indigo-700 hover:bg-indigo-50 px-2 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Trocar Usuário com Senha</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-800">{currentUser.nome}</p>
                    <p className="text-[11px] text-slate-500">{currentUser.email || 'Conta da Equipe'}</p>
                  </div>
                )}

                <div className="px-2 pt-2 mt-1 space-y-1">
                  <button
                    onClick={() => setActiveTab('perfil')}
                    className="w-full text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 px-2 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Meu Perfil & Senha</span>
                  </button>

                  {onLogout && (
                    <button
                      onClick={onLogout}
                      className="w-full text-left text-xs font-semibold text-red-600 hover:bg-red-50 px-2 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-red-500" />
                      <span>Encerrar Sessão (Logout)</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Trocar Usuário Button requiring password (Only visible for Master) */}
          {isUserAdminTotal(currentUser) && (
            <button
              onClick={() => onRequestSwitchUser()}
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer shadow-2xs"
              title="Alternar perfil com verificação de senha master"
            >
              <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
              <span>Trocar Usuário</span>
            </button>
          )}

          {/* Quick New Appointment Button (Only visible for Admin and Operador) */}
          {currentUser.role !== 'cliente' && (
            <button
              onClick={onOpenNewAppointment}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs md:text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Agendamento</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
