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
  Lock,
  Building,
  Landmark,
  Settings,
  Sparkles,
  Database,
  Tv,
  HardDrive
} from 'lucide-react';
import { TabType, UsuarioEquipe, ClinicaConfig } from '../types';
import { isUserAdminTotal } from '../services/firebaseService';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  lowStockCount: number;
  pendingCount: number;
  currentUser: UsuarioEquipe;
  unreadNoticesCount?: number;
  clinicaConfig?: ClinicaConfig;
  onOpenClinicSettings?: () => void;
  onOpenUserAvatarModal?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  lowStockCount,
  pendingCount,
  currentUser,
  unreadNoticesCount = 0,
  clinicaConfig,
  onOpenClinicSettings,
  onOpenUserAvatarModal,
  onLogout,
}) => {
  const isAdminTotal = isUserAdminTotal(currentUser);
  const isAdminLocal = !isAdminTotal && (currentUser.role === 'admin_local' || currentUser.role === 'gestor' || currentUser.role === 'admin');
  const isGestor = isAdminTotal || isAdminLocal;
  const isRecepcao = currentUser.role === 'recepcao' || currentUser.role === 'operador';
  const isProfissional = currentUser.role === 'profissional';
  const isCliente = currentUser.role === 'cliente';

  const roleLabel = isAdminTotal 
    ? 'Admin Total (Master)' 
    : isAdminLocal 
    ? 'Admin Local (Gestor)' 
    : isProfissional 
    ? 'Profissional' 
    : isRecepcao 
    ? 'Recepção' 
    : 'Cliente';

  // Role-based navigation modules
  const getSections = () => {
    if (isCliente) {
      return [
        {
          title: 'Área do Paciente',
          items: [
            {
              id: 'portal_paciente' as TabType,
              label: 'Minhas Consultas',
              icon: Globe,
            },
            {
              id: 'quadro_avisos' as TabType,
              label: 'Mural de Avisos',
              icon: Megaphone,
              badge: unreadNoticesCount > 0 ? `${unreadNoticesCount}` : undefined,
              badgeColor: 'bg-rose-100 text-rose-700 font-bold',
            },
            {
              id: 'perfil' as TabType,
              label: 'Meu Perfil',
              icon: Users,
            },
          ]
        }
      ];
    }

    return [
      {
        title: 'Recepção',
        items: [
          {
            id: 'dashboard' as TabType,
            label: 'Balcão do Dia',
            icon: LayoutDashboard,
          },
          {
            id: 'balcao_tv' as TabType,
            label: 'TV Recepção',
            icon: Tv,
          },
          {
            id: 'agendamentos' as TabType,
            label: 'Agendamentos',
            icon: CalendarDays,
          },
          {
            id: 'retorno_pos' as TabType,
            label: 'Retornos & Pós-Venda',
            icon: HeartPulse,
          },
        ]
      },
      {
        title: 'Clínico',
        items: [
          {
            id: 'pacientes' as TabType,
            label: 'Pacientes',
            icon: Users,
          },
          {
            id: 'whatsapp' as TabType,
            label: 'WhatsApp',
            icon: MessageCircle,
          },
        ]
      },
      {
        title: 'Estoque & Ativos',
        items: [
          {
            id: 'estoque' as TabType,
            label: 'Estoque de Insumos',
            icon: PackageCheck,
            badge: lowStockCount > 0 ? `${lowStockCount}` : undefined,
            badgeColor: 'bg-rose-100 text-rose-700 font-bold',
          },
          {
            id: 'fornecedores' as TabType,
            label: 'Fornecedores',
            icon: Building,
          },
          {
            id: 'patrimonio' as TabType,
            label: 'Equipamentos',
            icon: Landmark,
          },
        ]
      },
      {
        title: 'Comunicação',
        items: [
          {
            id: 'portal_paciente' as TabType,
            label: 'Portal do Paciente',
            icon: Globe,
          },
          {
            id: 'quadro_avisos' as TabType,
            label: 'Mural da Equipe',
            icon: Megaphone,
            badge: unreadNoticesCount > 0 ? `${unreadNoticesCount}` : undefined,
            badgeColor: 'bg-rose-100 text-rose-700 font-bold',
          },
        ]
      },
      // Módulo Financeiro: EXCLUSIVO para Admin Local e Admin Master
      ...(isGestor ? [
        {
          title: 'Financeiro',
          items: [
            {
              id: 'financeiro' as TabType,
              label: 'Fluxo de Caixa',
              icon: DollarSign,
            },
          ]
        }
      ] : []),
      {
        title: 'Gestão',
        items: [
          ...(isAdminTotal ? [
            {
              id: 'banco_dados' as TabType,
              label: 'Banco de Dados',
              icon: Database,
            },
            {
              id: 'permissoes' as TabType,
              label: 'Permissões',
              icon: Lock,
            }
          ] : []),
          ...(isGestor ? [
            {
              id: 'backups' as TabType,
              label: 'Backups',
              icon: HardDrive,
            }
          ] : []),
          ...(isGestor ? [{
            id: 'usuarios' as TabType,
            label: 'Equipe & Usuários',
            icon: UserCheck,
          }] : []),
          {
            id: 'perfil' as TabType,
            label: 'Meu Perfil',
            icon: Users,
          },
          ...(isGestor ? [{
            id: 'supabase_guide' as TabType,
            label: 'Arquitetura Firestore',
            icon: Code2,
          }] : [])
        ]
      }
    ];
  };

  const moduleSections = getSections();

  return (
    <aside className="hidden lg:flex lg:w-64 bg-white text-slate-800 flex-col shrink-0 border-r border-slate-200">
      
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100">
        <button
          type="button"
          onClick={() => onOpenClinicSettings && onOpenClinicSettings()}
          className="w-full flex items-center gap-3 mb-2 text-left group cursor-pointer hover:opacity-90 transition-opacity"
          title="Clique para abrir Configurações e Logomarca da Clínica"
        >
          {clinicaConfig?.logomarca_url ? (
            <img 
              src={clinicaConfig.logomarca_url} 
              alt="Logo Clínica" 
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-2xl object-contain bg-white border border-slate-200/90 shadow-xs group-hover:ring-2 ring-indigo-500/40 transition-all shrink-0 p-0.5" 
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-slate-900 rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-xs group-hover:ring-2 ring-indigo-500/40 transition-all shrink-0">
              {(clinicaConfig?.nome || 'A').charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <span className="text-sm font-bold tracking-tight text-slate-900 block truncate group-hover:text-indigo-600 transition-colors">
              {clinicaConfig?.nome || 'AuraEstética Studio'}
            </span>
            <span className="text-[11px] text-slate-400 block truncate">
              Configurações da Clínica
            </span>
          </div>
        </button>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
            isGestor 
              ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
              : isProfissional
              ? 'bg-purple-50 text-purple-700 border-purple-200'
              : isRecepcao 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-blue-50 text-blue-700 border-blue-200'
          }`}>
            {roleLabel}
          </span>

          {isGestor && onOpenClinicSettings && (
            <button
              onClick={onOpenClinicSettings}
              className="p-1 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
              title="Configurações e Logomarca da Clínica"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation list */}
      <div className="p-3 space-y-4 flex-1 overflow-y-auto">
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
        <button
          onClick={onOpenUserAvatarModal}
          className="w-full flex items-center gap-3 p-1.5 rounded-xl text-left hover:bg-white transition-all border border-transparent hover:border-slate-200 cursor-pointer group"
          title="Clique para alterar sua foto de perfil"
        >
          <div className="relative">
            <img
              src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80'}
              alt={currentUser.nome}
              className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0 group-hover:ring-2 ring-indigo-500/40 transition-all"
            />
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[8px]">
              ✎
            </div>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600">{currentUser.nome}</span>
            <span className="text-[11px] text-slate-500 truncate flex items-center gap-1 font-medium">
              {roleLabel} • {currentUser.cargo || 'Equipe'}
            </span>
          </div>
        </button>

        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors cursor-pointer"
            title="Sair"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        )}
      </div>

    </aside>
  );
};
