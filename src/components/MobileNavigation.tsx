import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  PackageCheck, 
  DollarSign, 
  MessageCircle, 
  Code2, 
  HeartPulse, 
  UserCheck, 
  Menu, 
  X, 
  LogOut, 
  Globe, 
  Megaphone,
  KeyRound,
  Smartphone
} from 'lucide-react';
import { TabType, UsuarioEquipe, ClinicaConfig } from '../types';
import { isUserAdminTotal } from '../services/firebaseService';
import { Settings } from 'lucide-react';

interface MobileNavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  lowStockCount: number;
  pendingCount: number;
  currentUser: UsuarioEquipe;
  unreadNoticesCount?: number;
  onRequestSwitchUser?: () => void;
  onLogout?: () => void;
  clinicaConfig?: ClinicaConfig;
  onOpenClinicSettings?: () => void;
  onOpenPWAInstall?: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  activeTab,
  setActiveTab,
  lowStockCount,
  pendingCount,
  currentUser,
  unreadNoticesCount = 0,
  onRequestSwitchUser,
  onLogout,
  clinicaConfig,
  onOpenClinicSettings,
  onOpenPWAInstall,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isAdminTotal = isUserAdminTotal(currentUser);
  const isAdminLocal = !isAdminTotal && (currentUser.role === 'admin_local' || currentUser.role === 'gestor' || currentUser.role === 'admin');
  const isGestor = isAdminTotal || isAdminLocal;
  const isCliente = currentUser.role === 'cliente';

  const roleLabel = isAdminTotal 
    ? 'Super Admin' 
    : isAdminLocal 
    ? 'Admin Local' 
    : currentUser.role === 'profissional'
    ? 'Profissional'
    : currentUser.role === 'recepcao' || currentUser.role === 'operador'
    ? 'Recepção'
    : 'Cliente';

  const handleTabClick = (tab: TabType) => {
    if (tab === 'configuracoes' && onOpenClinicSettings) {
      onOpenClinicSettings();
      setIsDrawerOpen(false);
      return;
    }
    setActiveTab(tab);
    setIsDrawerOpen(false);
  };

  // Primary bottom bar items (most frequent actions on smartphone)
  const getBottomBarItems = () => {
    if (isCliente) {
      return [
        {
          id: 'portal_paciente' as TabType,
          label: 'Procedimentos e Orçamentos',
          icon: Globe,
        },
      ];
    }

    if (isGestor) {
      return [
        {
          id: 'dashboard' as TabType,
          label: 'Balcão',
          icon: LayoutDashboard,
          badge: pendingCount > 0 ? pendingCount : undefined,
        },
        {
          id: 'agendamentos' as TabType,
          label: 'Agenda',
          icon: CalendarDays,
        },
        {
          id: 'pacientes' as TabType,
          label: 'Pacientes',
          icon: Users,
        },
        {
          id: 'financeiro' as TabType,
          label: 'Financeiro',
          icon: DollarSign,
        },
        {
          id: 'estoque' as TabType,
          label: 'Estoque',
          icon: PackageCheck,
          badge: lowStockCount > 0 ? '!' : undefined,
        },
      ];
    }

    return [
      {
        id: 'dashboard' as TabType,
        label: 'Balcão',
        icon: LayoutDashboard,
        badge: pendingCount > 0 ? pendingCount : undefined,
      },
      {
        id: 'agendamentos' as TabType,
        label: 'Agenda',
        icon: CalendarDays,
      },
      {
        id: 'pacientes' as TabType,
        label: 'Pacientes',
        icon: Users,
      },
      {
        id: 'estoque' as TabType,
        label: 'Procedimentos',
        icon: PackageCheck,
        badge: lowStockCount > 0 ? '!' : undefined,
      },
    ];
  };

  const bottomBarItems = getBottomBarItems();

  // All modules grouped for drawer menu
  const moduleGroups = isCliente ? [
    {
      title: 'Área do Cliente',
      items: [
        { id: 'portal_paciente' as TabType, label: 'Procedimentos e Orçamentos', icon: Globe, badge: 'Principal' },
      ]
    }
  ] : [
    {
      title: 'Recepção & Atendimento',
      items: [
        { id: 'dashboard' as TabType, label: 'Dashboard Balcão', icon: LayoutDashboard, badge: pendingCount > 0 ? `${pendingCount} pendente` : undefined },
        { id: 'agendamentos' as TabType, label: 'Agenda & Horários', icon: CalendarDays },
        { id: 'retorno_pos' as TabType, label: 'Retornos & Pós-Venda (15d/30d)', icon: HeartPulse, badge: 'Retoque' },
      ]
    },
    {
      title: 'Clínico & Pacientes',
      items: [
        { id: 'pacientes' as TabType, label: 'Pacientes & Prontuários', icon: Users },
        { id: 'whatsapp' as TabType, label: 'Automação WhatsApp Anti-Falta', icon: MessageCircle },
      ]
    },
    {
      title: 'Catálogo & Estoque',
      items: [
        { id: 'estoque' as TabType, label: 'Procedimentos Ofertados & Insumos', icon: PackageCheck, badge: lowStockCount > 0 ? `${lowStockCount} alerta` : undefined },
        { id: 'portal_paciente' as TabType, label: 'Portal do Paciente & Orçamentos', icon: Globe, badge: 'Google' },
      ]
    },
    {
      title: 'Comunicação & Mural',
      items: [
        { id: 'quadro_avisos' as TabType, label: 'Quadro de Avisos & Comunicados', icon: Megaphone, badge: unreadNoticesCount > 0 ? `${unreadNoticesCount} novo` : undefined },
      ]
    },
    {
      title: 'Financeiro & Vendas',
      items: [
        { id: 'financeiro' as TabType, label: 'Financeiro, Recibos & DRE', icon: DollarSign },
      ]
    },
    {
      title: 'Configurações & Segurança',
      items: [
        ...(isGestor ? [{ id: 'configuracoes' as TabType, label: 'Configurações & Logomarca da Clínica', icon: Settings, badge: 'Clínica' }] : []),
        ...(isAdminTotal ? [{ id: 'permissoes' as TabType, label: 'Permissões Granulares & Campos', icon: UserCheck, badge: 'Master' }] : []),
        ...(isGestor ? [{ id: 'usuarios' as TabType, label: 'Equipe & Usuários', icon: UserCheck }] : []),
        { id: 'perfil' as TabType, label: 'Meu Perfil & Senha', icon: Users },
        ...(isGestor ? [{ id: 'supabase_guide' as TabType, label: 'Arquitetura Firestore', icon: Code2 }] : []),
      ]
    },
  ];

  return (
    <>
      {/* Fixed Bottom Navigation Bar on Mobile/Tablet (< lg) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-1 py-1 shadow-lg pb-[max(env(safe-area-inset-bottom),0.35rem)]">
        <div className="flex items-center justify-around">
          {bottomBarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`relative flex flex-col items-center justify-center py-1 px-1.5 min-w-[50px] min-h-[46px] rounded-xl transition-all cursor-pointer ${
                  isActive ? 'text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                  {item.badge && (
                    <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 min-w-[16px] h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
                  {item.label}
                </span>
                {isActive && (
                  <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-0.5" />
                )}
              </button>
            );
          })}

          {/* Drawer Menu Button or Logout for Client */}
          {isCliente ? (
            onLogout && (
              <button
                onClick={onLogout}
                className="flex flex-col items-center justify-center py-1 px-1.5 min-w-[50px] min-h-[46px] rounded-xl text-rose-600 hover:text-rose-700 transition-all cursor-pointer"
                title="Sair"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-[10px] tracking-tight mt-0.5 font-semibold">Sair</span>
              </button>
            )
          ) : (
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="flex flex-col items-center justify-center py-1 px-1.5 min-w-[50px] min-h-[46px] rounded-xl text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-0.5">Módulos</span>
            </button>
          )}
        </div>
      </nav>

      {/* Slide-over Drawer for All Modules */}
      {isDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-full max-w-xs bg-white h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-right duration-200">
            
            {/* Drawer Header with Clinic Logo & Name (Clickable to open settings) */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              {isCliente ? (
                <div className="flex items-center gap-2.5 text-left min-w-0">
                  {clinicaConfig?.logomarca_url ? (
                    <img
                      src={clinicaConfig.logomarca_url}
                      alt={clinicaConfig.nome || 'Logo'}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-xl object-contain bg-white border border-slate-200/90 shadow-2xs shrink-0 p-0.5"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-slate-900 text-white font-bold flex items-center justify-center text-sm shadow-2xs shrink-0">
                      {(clinicaConfig?.nome || 'A').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm truncate max-w-[160px]">
                      {clinicaConfig?.nome || 'AuraEstética Studio'}
                    </h3>
                    <p className="text-[10px] text-indigo-600 font-semibold">
                      Área do Cliente
                    </p>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onOpenClinicSettings && onOpenClinicSettings();
                  }}
                  className="flex items-center gap-2.5 text-left group cursor-pointer hover:opacity-90 transition-opacity min-w-0"
                  title="Configurações e Logomarca da Clínica"
                >
                  {clinicaConfig?.logomarca_url ? (
                    <img
                      src={clinicaConfig.logomarca_url}
                      alt={clinicaConfig.nome || 'Logo'}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-xl object-contain bg-white border border-slate-200/90 shadow-2xs group-hover:ring-2 ring-indigo-500/40 transition-all shrink-0 p-0.5"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-slate-900 text-white font-bold flex items-center justify-center text-sm shadow-2xs shrink-0">
                      {(clinicaConfig?.nome || 'A').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm truncate max-w-[160px] group-hover:text-indigo-600 transition-colors">
                      {clinicaConfig?.nome || 'AuraEstética Studio'}
                    </h3>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                      <span>Configurações & Logo</span>
                      <Settings className="w-2.5 h-2.5 text-slate-400" />
                    </p>
                  </div>
                </button>
              )}

              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
                aria-label="Fechar menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current User Card */}
            <div className="p-3 bg-indigo-50/60 border-b border-indigo-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80'}
                  alt={currentUser.nome}
                  className="w-8 h-8 rounded-lg object-cover border border-indigo-200"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block leading-tight">{currentUser.nome}</span>
                  <span className="text-[10px] font-bold uppercase text-indigo-700">{roleLabel}</span>
                </div>
              </div>

              {onRequestSwitchUser && isAdminTotal && (
                <button
                  type="button"
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onRequestSwitchUser();
                  }}
                  className="p-1.5 rounded-lg bg-white border border-indigo-200 text-indigo-700 text-xs font-semibold hover:bg-indigo-50 flex items-center gap-1 cursor-pointer"
                  title="Trocar Usuário com Senha"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Trocar</span>
                </button>
              )}
            </div>

            {/* Modules List */}
            <div className="p-3 space-y-4 flex-1 overflow-y-auto">
              {moduleGroups.map((group, gIdx) => (
                <div key={gIdx} className="space-y-1">
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase px-3 py-0.5 block">
                    {group.title}
                  </span>

                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleTabClick(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer min-h-[40px] ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 shadow-2xs'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* PWA Install Action (staff only) */}
            {!isCliente && onOpenPWAInstall && (
              <div className="p-3 border-t border-slate-100 bg-indigo-50/50">
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onOpenPWAInstall();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-indigo-700 hover:bg-indigo-100/80 border border-indigo-200 transition-colors cursor-pointer shadow-xs bg-white"
                >
                  <Smartphone className="w-4 h-4 text-indigo-600" />
                  <span>Instalar no Celular (Android / iOS)</span>
                </button>
              </div>
            )}

            {/* Logout button in drawer */}
            {onLogout && (
              <div className="p-3 border-t border-slate-100 bg-slate-50">
                <button
                  onClick={() => {
                    setIsDrawerOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair da Sessão</span>
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
};
