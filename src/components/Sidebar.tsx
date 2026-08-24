import React from 'react';
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
  Globe, 
  Megaphone, 
  LogOut, 
  Lock
} from 'lucide-react';
import { TabType, UsuarioEquipe } from '../types';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  lowStockCount: number;
  pendingCount: number;
  currentUser: UsuarioEquipe;
  unreadNoticesCount?: number;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  lowStockCount,
  pendingCount,
  currentUser,
  unreadNoticesCount = 0,
  onLogout,
}) => {
  const isAdmin = currentUser.role === 'admin';
  const isOperador = currentUser.role === 'operador';
  const isCliente = currentUser.role === 'cliente';

  const roleLabel = isAdmin ? 'Admin' : isOperador ? 'Operador' : 'Cliente';

  // Role-based navigation modules
  const getSections = () => {
    if (isCliente) {
      return [
        {
          title: 'Área do Paciente',
          items: [
            {
              id: 'portal_paciente' as TabType,
              label: 'Portal & Orçamentos',
              icon: Globe,
              badge: 'Principal',
              badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200 font-semibold',
            },
            {
              id: 'quadro_avisos' as TabType,
              label: 'Mural & Comunicados',
              icon: Megaphone,
              badge: unreadNoticesCount > 0 ? `${unreadNoticesCount}` : undefined,
              badgeColor: 'bg-rose-100 text-rose-800 border-rose-200 font-bold',
            },
          ]
        }
      ];
    }

    return [
      {
        title: 'Recepção & Agenda',
        items: [
          {
            id: 'dashboard' as TabType,
            label: 'Dashboard Balcão',
            icon: LayoutDashboard,
            badge: pendingCount > 0 ? `${pendingCount} pendente` : undefined,
            badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
          },
          {
            id: 'agendamentos' as TabType,
            label: 'Agenda & Horários',
            icon: CalendarDays,
          },
          {
            id: 'retorno_pos' as TabType,
            label: 'Retornos & Pós-Venda',
            icon: HeartPulse,
            badge: 'Retoque 15d',
            badgeColor: 'bg-rose-100 text-rose-800 border-rose-200 font-semibold',
          },
        ]
      },
      {
        title: 'Clínico & Pacientes',
        items: [
          {
            id: 'pacientes' as TabType,
            label: 'Pacientes & Prontuários',
            icon: Users,
          },
          {
            id: 'whatsapp' as TabType,
            label: 'Automação WhatsApp',
            icon: MessageCircle,
            badge: 'Anti-Falta',
            badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold',
          },
        ]
      },
      {
        title: 'Catálogo & Estoque',
        items: [
          {
            id: 'estoque' as TabType,
            label: 'Catálogo & Insumos',
            icon: PackageCheck,
            badge: lowStockCount > 0 ? `${lowStockCount} alerta` : undefined,
            badgeColor: 'bg-rose-100 text-rose-800 border-rose-200 font-semibold',
          },
          {
            id: 'portal_paciente' as TabType,
            label: 'Portal & Orçamentos',
            icon: Globe,
            badge: 'Google',
            badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200 font-semibold',
          },
        ]
      },
      {
        title: 'Comunicação & Mural',
        items: [
          {
            id: 'quadro_avisos' as TabType,
            label: 'Quadro de Avisos',
            icon: Megaphone,
            badge: unreadNoticesCount > 0 ? `${unreadNoticesCount} novo` : undefined,
            badgeColor: 'bg-rose-100 text-rose-800 border-rose-200 font-bold',
          },
        ]
      },
      {
        title: 'Financeiro & Vendas',
        items: [
          {
            id: 'financeiro' as TabType,
            label: 'Financeiro & Recibos',
            icon: DollarSign,
            badge: !isAdmin ? 'Recibos' : undefined,
            badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
          },
        ]
      },
      ...(isAdmin ? [{
        title: 'Configurações & Equipe',
        items: [
          {
            id: 'usuarios' as TabType,
            label: 'Equipe & Permissões',
            icon: UserCheck,
            badge: 'Admin',
            badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          },
          {
            id: 'supabase_guide' as TabType,
            label: 'SQL Supabase & Deploy',
            icon: Code2,
          },
        ]
      }] : [])
    ];
  };

  const moduleSections = getSections();

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
          <p className="text-xs text-slate-400 font-semibold tracking-wider uppercase">Gestão Modular</p>
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
            isAdmin 
              ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
              : isOperador 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-blue-50 text-blue-700 border-blue-200'
          }`}>
            {roleLabel}
          </span>
        </div>
      </div>

      {/* Navigation list grouped by modules */}
      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        {moduleSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase px-3 py-0.5 block">
              {section.title}
            </span>

            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer min-h-[38px] ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge ? (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* User profile footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2 hidden lg:block">
        <div className="w-full flex items-center gap-3 p-1.5 rounded-lg text-left">
          <img
            src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80'}
            alt={currentUser.nome}
            className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
          />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-slate-800 truncate">{currentUser.nome}</span>
            <span className="text-[11px] text-slate-500 truncate flex items-center gap-1 font-medium">
              {roleLabel}
            </span>
          </div>
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50/80 border border-slate-200 transition-colors cursor-pointer"
            title="Encerrar sessão atual e voltar para a tela de login"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair da Sessão</span>
          </button>
        )}
      </div>

    </aside>
  );
};
