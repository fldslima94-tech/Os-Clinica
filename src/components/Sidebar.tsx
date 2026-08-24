import React from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  PackageCheck, 
  DollarSign,
  MessageCircle,
  Code2, 
  ShieldCheck,
  AlertTriangle,
  HeartPulse,
  UserCheck,
  Shield,
  Lock
} from 'lucide-react';
import { TabType, UsuarioEquipe } from '../types';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  lowStockCount: number;
  pendingCount: number;
  currentUser: UsuarioEquipe;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  lowStockCount,
  pendingCount,
  currentUser,
}) => {
  const isAdmin = currentUser.role === 'admin';

  const menuItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Dashboard Balcão',
      icon: LayoutDashboard,
      badge: pendingCount > 0 ? `${pendingCount} pendente` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      id: 'agendamentos' as TabType,
      label: 'Agenda & Calendário',
      icon: CalendarDays,
    },
    {
      id: 'pacientes' as TabType,
      label: 'Pacientes & Prontuários',
      icon: Users,
    },
    {
      id: 'estoque' as TabType,
      label: 'Estoque de Insumos',
      icon: PackageCheck,
      badge: lowStockCount > 0 ? `${lowStockCount} alerta` : undefined,
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200 font-semibold',
    },
    {
      id: 'financeiro' as TabType,
      label: 'Financeiro & Recibos',
      icon: DollarSign,
      badge: !isAdmin ? 'Recibos' : undefined,
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    },
    {
      id: 'whatsapp' as TabType,
      label: 'Automação WhatsApp',
      icon: MessageCircle,
      badge: 'Anti-Falta',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold',
    },
    {
      id: 'usuarios' as TabType,
      label: 'Equipe & Permissões',
      icon: UserCheck,
      badge: isAdmin ? 'Admin' : 'Equipe',
      badgeColor: isAdmin ? 'bg-indigo-100 text-indigo-800 border-indigo-200' : 'bg-slate-100 text-slate-600 border-slate-200',
    },
    {
      id: 'supabase_guide' as TabType,
      label: 'SQL Supabase & Deploy',
      icon: Code2,
      restrictedToAdmin: true,
    },
  ];

  return (
    <aside className="w-full lg:w-64 bg-white text-slate-800 flex flex-col shrink-0 border-r border-slate-200">
      
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-100 hidden lg:block">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-base shadow-xs">
            E
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">EstéticaOS</span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Gestão de Clínica</p>
          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded border ${
            isAdmin ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            {isAdmin ? '👑 Admin' : '🧑‍💼 Recepção'}
          </span>
        </div>
      </div>

      {/* Navigation list */}
      <div className="p-4 space-y-1 flex-1">
        <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase px-3 py-1 mb-1 flex items-center justify-between">
          <span>Módulos Principais</span>
          <span className="text-[10px] lowercase text-slate-400">({currentUser.role})</span>
        </div>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isRestricted = item.restrictedToAdmin && !isAdmin;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-slate-100 text-indigo-700 font-semibold'
                  : isRestricted
                  ? 'text-slate-400 hover:bg-slate-50'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : isRestricted ? 'text-slate-300' : 'text-slate-400'}`} />
                <span className={isRestricted ? 'text-slate-400' : ''}>{item.label}</span>
              </div>
              {isRestricted ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 border border-slate-200 inline-flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" /> Admin
                </span>
              ) : item.badge ? (
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${item.badgeColor}`}>
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* User profile footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <button
          onClick={() => setActiveTab('usuarios')}
          className="w-full flex items-center gap-3 p-1.5 rounded-lg hover:bg-white transition-colors text-left cursor-pointer border border-transparent hover:border-slate-200"
        >
          <img
            src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80'}
            alt={currentUser.nome}
            className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
          />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-slate-800 truncate">{currentUser.nome}</span>
            <span className="text-[11px] text-slate-500 truncate flex items-center gap-1">
              {isAdmin ? '👑 Dra. Administradora' : '🧑‍💼 Operador Recepção'}
            </span>
          </div>
        </button>
      </div>

    </aside>
  );
};

