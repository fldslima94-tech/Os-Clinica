import React, { useState } from 'react';
import { 
  Calendar, 
  Search, 
  ChevronDown, 
  KeyRound, 
  Users, 
  LogOut,
  Megaphone,
  UserCheck,
  Wrench,
  Tv,
  Plus,
  Smartphone
} from 'lucide-react';
import { TabType, UsuarioEquipe, UserRole, ClinicaConfig } from '../types';
import { isUserAdminTotal } from '../services/firebaseService';
import { ConnectionSyncStatusWidget } from './ConnectionSyncStatusWidget';
import { MasterEditToggle } from './MasterEditToggle';
import { Settings } from 'lucide-react';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenNewAppointment: () => void;
  onOpenSqlGuide: () => void;
  onOpenGlobalSearch?: () => void;
  onOpenNoticeBoard?: () => void;
  onOpenSecondScreenModal?: () => void;
  onOpenPWAInstall?: () => void;
  unreadNoticesCount?: number;
  lowStockCount: number;
  manutencaoAlertCount?: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentUser: UsuarioEquipe;
  usuarios: UsuarioEquipe[];
  onRequestSwitchUser: (targetUser?: UsuarioEquipe) => void;
  onLogout?: () => void;
  clinicaConfig?: ClinicaConfig;
  onOpenClinicSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewAppointment,
  onOpenSqlGuide,
  onOpenGlobalSearch,
  onOpenNoticeBoard,
  onOpenSecondScreenModal,
  onOpenPWAInstall,
  unreadNoticesCount = 0,
  lowStockCount,
  manutencaoAlertCount = 0,
  searchQuery,
  setSearchQuery,
  currentUser,
  usuarios,
  onRequestSwitchUser,
  onLogout,
  clinicaConfig,
  onOpenClinicSettings,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

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
          label: 'Master',
          style: 'bg-amber-50 text-amber-800 border-amber-200/80',
        };
      case 'admin_local':
      case 'admin':
      case 'gestor':
        return {
          label: 'Admin',
          style: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
        };
      case 'profissional':
        return {
          label: 'Profissional',
          style: 'bg-teal-50 text-teal-700 border-teal-200/80',
        };
      case 'recepcao':
      case 'operador':
        return {
          label: 'Recepção',
          style: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
        };
      case 'cliente':
        return {
          label: 'Paciente',
          style: 'bg-blue-50 text-blue-700 border-blue-200/80',
        };
      default:
        return {
          label: 'Usuário',
          style: 'bg-slate-50 text-slate-700 border-slate-200/80',
        };
    }
  };

  const currentBadge = getRoleBadge(currentUser.role);

  return (
    <header className="bg-white border-b border-slate-200/90 sticky top-0 z-30 px-2.5 sm:px-4 lg:px-8 py-2 sm:py-2.5 shadow-2xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-3">
        
        {/* Left Side: Clinic Logo, Name & Settings link */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 shrink">
          <button
            type="button"
            onClick={() => onOpenClinicSettings && onOpenClinicSettings()}
            className="flex items-center gap-1.5 sm:gap-2.5 text-left group cursor-pointer hover:opacity-95 transition-all focus:outline-none rounded-2xl p-0.5 min-w-0"
            title="Clique para abrir Configurações e Logomarca da Clínica"
          >
            <div className="relative shrink-0">
              {clinicaConfig?.logomarca_url ? (
                <img
                  src={clinicaConfig.logomarca_url}
                  alt={clinicaConfig.nome || 'Logo da Clínica'}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-xl sm:rounded-2xl object-contain bg-white border border-slate-200/90 shadow-2xs group-hover:ring-2 ring-indigo-500/40 group-hover:border-indigo-400 transition-all shrink-0 p-0.5"
                />
              ) : (
                <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 flex items-center justify-center text-white font-bold text-sm sm:text-base lg:text-lg shadow-2xs border border-indigo-700/50 group-hover:ring-2 ring-indigo-500/40 transition-all shrink-0">
                  {(clinicaConfig?.nome || 'A').charAt(0).toUpperCase()}
                </div>
              )}
              {/* Settings icon badge on logo to indicate clickability */}
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-white rounded-full shadow-xs border border-slate-200 flex items-center justify-center text-slate-500 group-hover:text-indigo-600 group-hover:border-indigo-300 transition-colors">
                <Settings className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <h1 className="text-xs sm:text-sm md:text-base font-bold text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors truncate max-w-[105px] xs:max-w-[135px] sm:max-w-[170px] md:max-w-[210px] lg:max-w-xs">
                  {clinicaConfig?.nome || 'AuraEstética Studio'}
                </h1>
                <span className={`hidden xl:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full border items-center gap-1 shrink-0 ${currentBadge.style}`}>
                  {currentBadge.label}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 hidden sm:flex items-center gap-1 mt-0.5 truncate">
                <Calendar className="w-3 h-3 text-indigo-600 shrink-0" />
                <span className="truncate">{capitalizedDate}</span>
              </p>
            </div>
          </button>
        </div>

        {/* Center: Search Bar with Ctrl+K trigger (visible on desktop >= lg) */}
        <div className="hidden lg:block relative w-48 xl:w-72 2xl:w-80 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar rápida no sistema..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClick={() => onOpenGlobalSearch && onOpenGlobalSearch()}
            className="w-full pl-9 pr-12 py-1.5 sm:py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
          />
          <button
            type="button"
            onClick={() => onOpenGlobalSearch && onOpenGlobalSearch()}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white border border-slate-200 rounded text-slate-500 shadow-2xs hover:bg-slate-50 cursor-pointer"
            title="Pressione Ctrl+K ou clique para busca avançada"
          >
            ⌘K
          </button>
        </div>

        {/* Right Side: Actions (Optimized for Mobile & Desktop) */}
        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 justify-end shrink-0">
          
          {/* Mobile/Tablet Search Button (< lg) */}
          <button
            type="button"
            onClick={() => onOpenGlobalSearch && onOpenGlobalSearch()}
            className="lg:hidden p-1.5 sm:p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Buscar no sistema"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Botão de Ativação do Modo Edição Master (hidden on small/medium screens to preserve space) */}
          <div className="hidden xl:block">
            <MasterEditToggle />
          </div>

          {/* TV Reception / Second Screen Button (visible on wide screens >= xl) */}
          <button
            type="button"
            onClick={() => {
              if (onOpenSecondScreenModal) {
                onOpenSecondScreenModal();
              } else {
                setActiveTab('balcao_tv');
              }
            }}
            className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'balcao_tv'
                ? 'bg-purple-600 border-purple-700 text-white shadow-2xs'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
            title="Abrir TV da Recepção"
          >
            <Tv className="w-3.5 h-3.5 text-purple-600" />
            <span>TV Recepção</span>
          </button>

          {/* Status de Conexão e Sincronização */}
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
            className={`relative p-1.5 sm:p-2 rounded-xl border transition-colors cursor-pointer flex items-center justify-center ${
              activeTab === 'quadro_avisos'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title="Quadro de Avisos da Clínica"
          >
            <Megaphone className="w-4 h-4 text-indigo-600" />
            {unreadNoticesCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
            )}
          </button>

          {/* Alertas de Manutenção Preventiva (Desktop) */}
          {currentUser.role !== 'cliente' && manutencaoAlertCount > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('bens')}
              className={`hidden md:flex relative p-1.5 sm:p-2 rounded-xl border transition-colors cursor-pointer items-center justify-center ${
                activeTab === 'bens' || activeTab === 'patrimonio'
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
              }`}
              title="Alertas de Manutenção dos Equipamentos"
            >
              <Wrench className="w-4 h-4 text-amber-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full" />
            </button>
          )}

          {/* Instalar App (Android e iOS) */}
          {onOpenPWAInstall && (
            <button
              type="button"
              onClick={onOpenPWAInstall}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 text-xs font-semibold"
              title="Instalar App no Celular (Android & iOS)"
            >
              <Smartphone className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="hidden sm:inline">Instalar App</span>
            </button>
          )}

          {/* User & Role Switcher Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-1 sm:gap-1.5 lg:gap-2 p-1 sm:p-1.5 lg:px-2.5 lg:py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer text-left"
              title="Alternar Perfil de Acesso"
            >
              <img
                src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80'}
                alt={currentUser.nome}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover border border-slate-200 shrink-0"
              />
              <div className="hidden lg:block text-left pr-1">
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
              <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-1.5rem)] bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
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
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                            u.id === currentUser.id
                              ? 'bg-indigo-50 text-indigo-900 font-semibold'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <img
                              src={u.avatar_url}
                              alt={u.nome}
                              className="w-6 h-6 rounded-lg object-cover"
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
                        className="w-full text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 px-2 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>Gerenciar Equipe (Admin)</span>
                      </button>

                      <button
                        onClick={() => onRequestSwitchUser()}
                        className="w-full text-left text-xs font-semibold text-indigo-700 hover:bg-indigo-50 px-2 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
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
                  {onOpenClinicSettings && (
                    <button
                      onClick={onOpenClinicSettings}
                      className="w-full text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 px-2 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      <span>Configurações & Logomarca</span>
                    </button>
                  )}

                  <button
                    onClick={() => setActiveTab('perfil')}
                    className="w-full text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 px-2 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Meu Perfil & Senha</span>
                  </button>

                  {onOpenPWAInstall && (
                    <button
                      onClick={onOpenPWAInstall}
                      className="w-full text-left text-xs font-semibold text-indigo-700 hover:bg-indigo-50 px-2 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Instalar no Celular (Android / iOS)</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (onOpenSecondScreenModal) onOpenSecondScreenModal();
                      else setActiveTab('balcao_tv');
                    }}
                    className="w-full text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 px-2 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer xl:hidden"
                  >
                    <Tv className="w-3.5 h-3.5 text-purple-600" />
                    <span>TV Recepção (2ª Tela)</span>
                  </button>

                  {onLogout && (
                    <button
                      onClick={onLogout}
                      className="w-full text-left text-xs font-semibold text-red-600 hover:bg-red-50 px-2 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-red-500" />
                      <span>Encerrar Sessão (Logout)</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick New Appointment Button (Only visible for Admin, Operador, Profissional) */}
          {currentUser.role !== 'cliente' && (
            <button
              onClick={onOpenNewAppointment}
              className="inline-flex items-center justify-center gap-1.5 p-1.5 sm:px-3 sm:py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title="Novo Agendamento"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Novo Agendamento</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
