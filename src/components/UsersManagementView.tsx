import React, { useState } from 'react';
import { 
  Users, 
  Shield, 
  UserCheck, 
  Plus, 
  Check, 
  X, 
  Mail, 
  Phone, 
  Award, 
  Key, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  FileText, 
  Calendar, 
  DollarSign, 
  Package, 
  MessageCircle,
  Database,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Clock,
  Edit3,
  KeyRound,
  Trash2,
  Search,
  Crown,
  Stethoscope,
  Briefcase
} from 'lucide-react';
import { UsuarioEquipe, UserRole } from '../types';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { isUserAdminTotal } from '../services/firebaseService';

interface UsersManagementViewProps {
  usuarios: UsuarioEquipe[];
  currentUser: UsuarioEquipe;
  onSwitchUser: (usuario: UsuarioEquipe) => void;
  onOpenNewUser: () => void;
  onOpenEditUser?: (usuario: UsuarioEquipe) => void;
  onDeleteUser?: (id: string) => void;
  onToggleUserStatus?: (userId: string) => void;
  onOpenSqlGuide?: () => void;
}

export const UsersManagementView: React.FC<UsersManagementViewProps> = ({
  usuarios,
  currentUser,
  onSwitchUser,
  onOpenNewUser,
  onOpenEditUser,
  onDeleteUser,
  onToggleUserStatus,
  onOpenSqlGuide,
}) => {
  const [filterRole, setFilterRole] = useState<'todos' | UserRole>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [userToDelete, setUserToDelete] = useState<UsuarioEquipe | null>(null);

  const isSuperAdmin = isUserAdminTotal(currentUser) || currentUser.role === 'admin_total' || currentUser.role === 'admin';

  const filteredUsers = usuarios.filter(u => {
    // Role filter
    if (filterRole !== 'todos') {
      if (filterRole === 'admin_total' && u.role !== 'admin_total' && u.role !== 'admin') return false;
      if (filterRole === 'admin_local' && u.role !== 'admin_local' && u.role !== 'gestor') return false;
      if (filterRole === 'recepcao' && u.role !== 'recepcao' && u.role !== 'operador') return false;
      if (filterRole === 'profissional' && u.role !== 'profissional') return false;
      if (filterRole === 'cliente' && u.role !== 'cliente') return false;
    }

    // Search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = (u.nome || '').toLowerCase().includes(term);
      const matchEmail = (u.email || '').toLowerCase().includes(term);
      const matchCargo = (u.cargo || '').toLowerCase().includes(term);
      const matchRole = (u.role || '').toLowerCase().includes(term);
      if (!matchName && !matchEmail && !matchCargo && !matchRole) return false;
    }

    return true;
  });

  const superAdminCount = usuarios.filter(u => u.role === 'admin_total' || u.role === 'admin' || isUserAdminTotal(u)).length;
  const adminLocalCount = usuarios.filter(u => u.role === 'admin_local' || u.role === 'gestor').length;
  const profissionalCount = usuarios.filter(u => u.role === 'profissional').length;
  const operadorCount = usuarios.filter(u => u.role === 'operador' || u.role === 'recepcao').length;
  const clienteCount = usuarios.filter(u => u.role === 'cliente').length;

  const getRoleBadge = (role: UserRole, user?: UsuarioEquipe) => {
    if (isUserAdminTotal(user) || role === 'admin_total' || role === 'admin') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
          <Crown className="w-3 h-3 text-amber-600" />
          <span>Super Admin</span>
        </span>
      );
    }
    if (role === 'admin_local' || role === 'gestor') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/60 flex items-center gap-1">
          <Briefcase className="w-3 h-3 text-indigo-600" />
          <span>Gestor Local</span>
        </span>
      );
    }
    if (role === 'profissional') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200/60 flex items-center gap-1">
          <Stethoscope className="w-3 h-3 text-purple-600" />
          <span>Profissional</span>
        </span>
      );
    }
    if (role === 'operador' || role === 'recepcao') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center gap-1">
          <UserCheck className="w-3 h-3 text-emerald-600" />
          <span>Recepção</span>
        </span>
      );
    }
    if (role === 'cliente') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60">
          👤 Cliente
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
        {role}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* 1. CURRENT USER & QUICK ROLE BANNER */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          
          {/* Active User Information */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80'}
                alt={currentUser.nome}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-400 shadow-sm"
              />
              <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                currentUser.status === 'ativo' ? 'bg-emerald-400' : 'bg-slate-400'
              }`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  Sessão Ativa
                </span>
                {isSuperAdmin ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-400/30 text-amber-200 border border-amber-400/50 flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-400" />
                    Super Admin
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                    {currentUser.role}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-white mt-0.5">{currentUser.nome}</h2>
              <p className="text-xs text-slate-300 flex items-center gap-3 mt-0.5">
                <span>{currentUser.cargo || currentUser.profissao || 'Membro da Equipe'}</span>
                <span>•</span>
                <span>{currentUser.email}</span>
              </p>
            </div>
          </div>

          {/* Troca de usuário com senha */}
          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/15 w-full lg:w-auto flex flex-col sm:flex-row items-center gap-3">
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-indigo-300" />
              <span>Troca de Perfil / Usuário:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {usuarios.slice(0, 5).map(u => {
                const isActive = u.id === currentUser.id;
                const isSuper = isUserAdminTotal(u) || u.role === 'admin_total' || u.role === 'admin';
                return (
                  <button
                    key={u.id}
                    onClick={() => onSwitchUser(u)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-md font-bold'
                        : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10'
                    }`}
                  >
                    <span>{isSuper ? '👑' : u.role === 'admin_local' ? '💼' : u.role === 'profissional' ? '🩺' : u.role === 'recepcao' ? '🧑‍💼' : '👤'}</span>
                    <span>{u.nome.split(' ')[0]}</span>
                    {isActive && <Check className="w-3 h-3 text-indigo-600" />}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* 2. STATS & SUMMARY METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-xs font-bold uppercase mb-1 tracking-wider">Total de Contas</div>
            <div className="text-2xl font-bold text-slate-900">{usuarios.length}</div>
            <p className="text-xs text-slate-400 mt-0.5">Usuários com acesso cadastrado</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-amber-200/80 bg-amber-50/20 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-amber-700 text-xs font-bold uppercase mb-1 tracking-wider">Super Admins</div>
            <div className="text-2xl font-bold text-amber-900">{superAdminCount}</div>
            <p className="text-xs text-amber-600/80 mt-0.5">Governança total & exclusão de contas</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700">
            <Crown className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-xs font-bold uppercase mb-1 tracking-wider">Gestores & Clínicos</div>
            <div className="text-2xl font-bold text-indigo-600">{adminLocalCount + profissionalCount}</div>
            <p className="text-xs text-slate-400 mt-0.5">Atendimentos e gestão de unidades</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Stethoscope className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-xs font-bold uppercase mb-1 tracking-wider">Recepção / Operadores</div>
            <div className="text-2xl font-bold text-emerald-600">{operadorCount}</div>
            <p className="text-xs text-slate-400 mt-0.5">Agendamentos, balcão e triagem</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* 3. TEAM MEMBERS DIRECTORY */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
        
        {/* Section Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 uppercase text-sm tracking-wider">
                Usuários com Acesso ao Sistema
              </h3>
              <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full border border-slate-200">
                {filteredUsers.length} de {usuarios.length}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {isSuperAdmin 
                ? 'Como Super Admin, você pode criar, editar privilégios e excluir usuários do sistema permanentemente.' 
                : 'Gerenciamento de acessos e colaboradores cadastrados na clínica.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome, email ou cargo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* New User Button */}
            <button
              onClick={onOpenNewUser}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Usuário</span>
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="px-6 py-2.5 bg-slate-50/60 border-b border-slate-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-bold uppercase text-[10px] mr-1">Filtrar:</span>
          
          <button
            onClick={() => setFilterRole('todos')}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              filterRole === 'todos' ? 'bg-white text-slate-900 font-bold shadow-2xs border border-slate-200' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Todos ({usuarios.length})
          </button>
          
          <button
            onClick={() => setFilterRole('admin_total')}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              filterRole === 'admin_total' ? 'bg-amber-100 text-amber-950 font-bold shadow-2xs border border-amber-300' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            👑 Super Admin ({superAdminCount})
          </button>
          
          <button
            onClick={() => setFilterRole('admin_local')}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              filterRole === 'admin_local' ? 'bg-indigo-100 text-indigo-950 font-bold shadow-2xs border border-indigo-300' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            💼 Gestores ({adminLocalCount})
          </button>

          <button
            onClick={() => setFilterRole('profissional')}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              filterRole === 'profissional' ? 'bg-purple-100 text-purple-950 font-bold shadow-2xs border border-purple-300' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            🩺 Profissionais ({profissionalCount})
          </button>

          <button
            onClick={() => setFilterRole('recepcao')}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              filterRole === 'recepcao' ? 'bg-emerald-100 text-emerald-950 font-bold shadow-2xs border border-emerald-300' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            🧑‍💼 Recepção ({operadorCount})
          </button>

          <button
            onClick={() => setFilterRole('cliente')}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              filterRole === 'cliente' ? 'bg-blue-100 text-blue-950 font-bold shadow-2xs border border-blue-300' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            👤 Clientes ({clienteCount})
          </button>
        </div>

        {/* User Cards Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredUsers.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="font-bold text-sm text-slate-700">Nenhum usuário encontrado</p>
              <p className="text-xs text-slate-400 mt-0.5">Tente ajustar seus termos de busca ou filtros de perfil.</p>
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isCurrent = user.id === currentUser.id;
              const isTargetSuperAdmin = isUserAdminTotal(user) || user.role === 'admin_total' || user.role === 'admin';

              return (
                <div
                  key={user.id}
                  className={`p-5 rounded-xl border transition-all ${
                    isCurrent
                      ? 'border-indigo-300 bg-indigo-50/20 shadow-xs ring-1 ring-indigo-200'
                      : isTargetSuperAdmin
                      ? 'border-amber-200 bg-amber-50/10 hover:border-amber-300'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                          alt={user.nome}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                        <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${
                          user.status === 'ativo' ? 'bg-emerald-500' : 'bg-slate-400'
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">{user.nome}</h4>
                          {isCurrent && (
                            <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded border border-indigo-200">
                              Você
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 font-medium mt-0.5 flex flex-wrap items-center gap-1.5">
                          <span>{user.cargo || user.profissao || 'Colaborador'}</span>
                          {user.registro_profissional && (
                            <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-200">
                              {user.registro_profissional}
                            </span>
                          )}
                        </p>
                        {(user.especialidade || user.porcentagem_comissao !== undefined) && (
                          <div className="flex items-center gap-2 mt-1">
                            {user.especialidade && (
                              <span className="text-[11px] text-indigo-600 font-medium">
                                {user.especialidade}
                              </span>
                            )}
                            {user.porcentagem_comissao !== undefined && user.porcentagem_comissao > 0 && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                                {user.porcentagem_comissao}% comissão
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {getRoleBadge(user.role, user)}
                  </div>

                  {/* Contact and Activity */}
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-500 font-mono text-[11px]">•••••••• (Protegida)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{user.telefone || 'Sem telefone'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{user.ultimo_acesso || 'Online'}</span>
                    </div>
                  </div>

                  {/* Permissions Summary Tags */}
                  {user.permissoes && (
                    <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        Privilégios & Acessos
                      </span>
                      <div className="flex flex-wrap gap-1.5 text-[11px]">
                        <span className={`px-2 py-0.5 rounded-md font-medium inline-flex items-center gap-1 ${
                          user.permissoes.ver_financeiro_completo
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-50 text-slate-400 border border-slate-200'
                        }`}>
                          {user.permissoes.ver_financeiro_completo ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-slate-400" />}
                          Financeiro
                        </span>

                        <span className={`px-2 py-0.5 rounded-md font-medium inline-flex items-center gap-1 ${
                          user.permissoes.editar_prontuario_clinico
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-50 text-slate-400 border border-slate-200'
                        }`}>
                          {user.permissoes.editar_prontuario_clinico ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-slate-400" />}
                          Prontuário & TCLE
                        </span>

                        <span className={`px-2 py-0.5 rounded-md font-medium inline-flex items-center gap-1 ${
                          user.permissoes.emitir_recibo
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-50 text-slate-400 border border-slate-200'
                        }`}>
                          {user.permissoes.emitir_recibo ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-slate-400" />}
                          Recibos
                        </span>

                        <span className={`px-2 py-0.5 rounded-md font-medium inline-flex items-center gap-1 ${
                          user.permissoes.gerenciar_estoque_custos
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-50 text-slate-400 border border-slate-200'
                        }`}>
                          {user.permissoes.gerenciar_estoque_custos ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-slate-400" />}
                          Custos & Estoque
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Footer Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {onOpenEditUser && (
                        <button
                          type="button"
                          onClick={() => onOpenEditUser(user)}
                          className="text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 border border-slate-200 px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                          title="Editar nome, cargo, senha ou permissões"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Editar</span>
                        </button>
                      )}

                      {/* Botão de Excluir Usuário - Disponível para o Super Admin */}
                      {!isCurrent && onDeleteUser && isSuperAdmin && (
                        <button
                          type="button"
                          onClick={() => setUserToDelete(user)}
                          className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                          title="Excluir usuário do sistema permanentemente (Super Admin)"
                        >
                          <Trash2 className="w-3 h-3 text-red-600" />
                          <span>Excluir Usuário</span>
                        </button>
                      )}
                    </div>

                    {!isCurrent ? (
                      <button
                        type="button"
                        onClick={() => onSwitchUser(user)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <span>Alternar Usuário</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Sessão Ativa
                      </span>
                    )}
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <DeleteConfirmModal
          isOpen={!!userToDelete}
          onClose={() => setUserToDelete(null)}
          onConfirm={() => {
            if (userToDelete && onDeleteUser) {
              onDeleteUser(userToDelete.id);
            }
            setUserToDelete(null);
          }}
          title="Excluir Usuário com Acesso ao Sistema"
          itemType="Usuário do Sistema"
          itemName={`${userToDelete.nome} (${userToDelete.email}) - Cargo: ${userToDelete.cargo || userToDelete.role}`}
          description={`Tem certeza que deseja excluir o usuário "${userToDelete.nome}"? Esta ação revogará permanentemente o login (${userToDelete.email}) e removerá todos os privilégios de acesso ao sistema.`}
        />
      )}

    </div>
  );
};

