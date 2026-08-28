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
  KeyRound
} from 'lucide-react';
import { TabType, UsuarioEquipe } from '../types';
import { isUserAdminTotal } from '../services/firebaseService';

interface MobileNavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  lowStockCount: number;
  pendingCount: number;
  currentUser: UsuarioEquipe;
  unreadNoticesCount?: number;
  onRequestSwitchUser?: () => void;
  onLogout?: () => void;
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
    setActiveTab(tab);
    setIsDrawerOpen(false);
  };

  // Primary bottom bar items (most frequent actions on smartphone)
  const getBottomBarItems = () => {
    if (isCliente) {
      return [
        {
          id: 'portal_paciente' as TabType,
          label: 'Portal',
          icon: Globe,
        },
        {
          id: 'quadro_avisos' as TabType,
          label: 'Mural',
          icon: Megaphone,
          badge: unreadNoticesCount > 0 ? unreadNoticesCount : undefined,
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
      {
        id: 'quadro_avisos' as TabType,
        label: 'Avisos',
        icon: Megaphone,
        badge: unreadNoticesCount > 0 ? unreadNoticesCount : undefined,
      },
    ];
  };

  const bottomBarItems = getBottomBarItems();

  // All modules grouped for drawer menu
  const moduleGroups = isCliente ? [
    {
      title: 'Área do Paciente',
      items: [
        { id: 'portal_paciente' as TabType, label: 'Portal do Paciente & Orçamentos', icon: Globe, badge: 'Principal' },
        { id: 'quadro_avisos' as TabType, label: 'Mural & Comunicados da Clínica', icon: Megaphone, badge: unreadNoticesCount > 0 ? `${unreadNoticesCount} novo` : undefined },
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
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 shadow-lg">
        <div className="flex items-center justify-around">
          {bottomBarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`relative flex flex-col items-center justify-center py-1.5 px-2 min-w-[56px] min-h-[48px] rounded-xl transition-all cursor-pointer ${
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

          {/* Drawer Menu Button */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex flex-col items-center justify-center py-1.5 px-2 min-w-[56px] min-h-[48px] rounded-xl text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] tracking-tight mt-0.5">Módulos</span>
          </button>
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
            
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center">
                  E
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">EstéticaOS</h3>
                  <p className="text-[10px] text-slate-500">Módulos da Clínica</p>
                </div>
              </div>

              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
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

              {onRequestSwitchUser && (
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
