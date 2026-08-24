import React, { useState } from 'react';
import { 
  Calendar, 
  Plus, 
  Search, 
  Sparkles, 
  Database, 
  Clock, 
  PhoneCall,
  BellRing,
  Shield,
  UserCheck,
  ChevronDown,
  RefreshCw,
  Users
} from 'lucide-react';
import { TabType, UsuarioEquipe, UserRole } from '../types';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenNewAppointment: () => void;
  onOpenSqlGuide: () => void;
  lowStockCount: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentUser: UsuarioEquipe;
  usuarios: UsuarioEquipe[];
  onSwitchUser: (user: UsuarioEquipe) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewAppointment,
  onOpenSqlGuide,
  lowStockCount,
  searchQuery,
  setSearchQuery,
  currentUser,
  usuarios,
  onSwitchUser,
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

  const toggleUserRole = () => {
    // Quick toggle between first admin and first operador
    if (currentUser.role === 'admin') {
      const operador = usuarios.find(u => u.role === 'operador') || usuarios[1];
      if (operador) onSwitchUser(operador);
    } else {
      const admin = usuarios.find(u => u.role === 'admin') || usuarios[0];
      if (admin) onSwitchUser(admin);
    }
  };

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
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                currentUser.role === 'admin'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200/70'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200/70'
              }`}>
                {currentUser.role === 'admin' ? '👑 Admin' : '🧑‍💼 Recepção'}
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>{capitalizedDate}</span>
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar paciente, procedimento..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Right Side: Role Switcher Pill & Actions */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          
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
                  {currentUser.role === 'admin' ? '👑 Dra. Admin' : '🧑‍💼 Operador'}
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
                <div className="px-3 py-2 border-b border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Alternar Sessão Ativa
                  </span>
                </div>

                <div className="p-1 space-y-1">
                  {usuarios.map(u => (
                    <button
                      key={u.id}
                      onClick={() => onSwitchUser(u)}
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
                          <p className="text-[10px] text-slate-400">{u.cargo}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {u.role === 'admin' ? 'Admin' : 'Operador'}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="px-3 pt-2 mt-1 border-t border-slate-100">
                  <button
                    onClick={() => setActiveTab('usuarios')}
                    className="w-full text-center text-xs font-bold text-indigo-600 hover:text-indigo-800 py-1"
                  >
                    Gerenciar Permissões da Equipe →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick 1-Click Role Switcher Toggle */}
          <button
            onClick={toggleUserRole}
            className={`hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
              currentUser.role === 'admin'
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-indigo-200'
            }`}
            title="Alternar rapidamente entre Admin e Operador"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Mudar para {currentUser.role === 'admin' ? 'Operador' : 'Admin'}</span>
          </button>

          {/* Quick New Appointment Button */}
          <button
            onClick={onOpenNewAppointment}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs md:text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Agendamento</span>
          </button>
        </div>

      </div>
    </header>
  );
};

