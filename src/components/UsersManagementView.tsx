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
  Trash2
} from 'lucide-react';
import { UsuarioEquipe, UserRole } from '../types';
import { DeleteConfirmModal } from './DeleteConfirmModal';

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
  const [userToDelete, setUserToDelete] = useState<UsuarioEquipe | null>(null);

  const filteredUsers = usuarios.filter(u => {
    if (filterRole === 'todos') return true;
    return u.role === filterRole;
  });

  const adminCount = usuarios.filter(u => u.role === 'admin').length;
  const operadorCount = usuarios.filter(u => u.role === 'operador').length;
  const clienteCount = usuarios.filter(u => u.role === 'cliente').length;

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/60">
            👑 Admin
          </span>
        );
      case 'operador':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            🧑‍💼 Operador
          </span>
        );
      case 'cliente':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60">
            👤 Cliente
          </span>
        );
      default:
        return null;
    }
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
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                  currentUser.role === 'admin'
                    ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/40'
                    : currentUser.role === 'operador'
                    ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40'
                    : 'bg-blue-500/30 text-blue-200 border border-blue-400/40'
                }`}>
                  {currentUser.role === 'admin' ? 'Admin' : currentUser.role === 'operador' ? 'Operador' : 'Cliente'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-0.5">{currentUser.nome}</h2>
              <p className="text-xs text-slate-300 flex items-center gap-3 mt-0.5">
                <span>Cargo: {currentUser.cargo || (currentUser.role === 'admin' ? 'Admin' : currentUser.role === 'operador' ? 'Operador' : 'Cliente')}</span>
              </p>
            </div>
          </div>

          {/* Troca de usuário com senha */}
          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/15 w-full lg:w-auto flex flex-col sm:flex-row items-center gap-3">
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-indigo-300" />
              <span>Troca Segura de Usuário:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {usuarios.map(u => {
                const isActive = u.id === currentUser.id;
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
                    <span>{u.role === 'admin' ? '👑' : u.role === 'operador' ? '🧑‍💼' : '👤'}</span>
                    <span>{u.nome.split(' ')[0]}</span>
                    <span className="text-[10px] opacity-75 font-normal">({u.role})</span>
                    {isActive && <Check className="w-3 h-3 text-indigo-600" />}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* 2. STATS & SUMMARY METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-xs font-bold uppercase mb-1 tracking-wider">Total de Usuários</div>
            <div className="text-2xl font-bold text-slate-900">{usuarios.length} cadastrados</div>
            <p className="text-xs text-slate-400 mt-0.5">Controle de acesso seguro por perfil</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-xs font-bold uppercase mb-1 tracking-wider">Perfil Admin</div>
            <div className="text-2xl font-bold text-indigo-600">{adminCount} usuários</div>
            <p className="text-xs text-slate-400 mt-0.5">Acesso irrestrito a relatórios e configurações</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-xs font-bold uppercase mb-1 tracking-wider">Perfil Operador / Recepção</div>
            <div className="text-2xl font-bold text-emerald-600">{operadorCount} atendentes</div>
            <p className="text-xs text-slate-400 mt-0.5">Atendimento, agendamentos e balcão</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* 3. TEAM MEMBERS DIRECTORY */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
        
        {/* Section Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 uppercase text-sm tracking-wider">
                Usuários & Níveis de Acesso
              </h3>
              <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full border border-slate-200">
                {filteredUsers.length}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Gerenciamento de acessos categorizados exclusivamente como Admin, Operador e Cliente.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* Filter */}
            <div className="flex items-center bg-slate-50 p-1 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setFilterRole('todos')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  filterRole === 'todos' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-600'
                }`}
              >
                Todos ({usuarios.length})
              </button>
              <button
                onClick={() => setFilterRole('admin')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  filterRole === 'admin' ? 'bg-white text-indigo-700 font-semibold shadow-2xs' : 'text-slate-600'
                }`}
              >
                👑 Admin ({adminCount})
              </button>
              <button
                onClick={() => setFilterRole('operador')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  filterRole === 'operador' ? 'bg-white text-emerald-700 font-semibold shadow-2xs' : 'text-slate-600'
                }`}
              >
                🧑‍💼 Operador ({operadorCount})
              </button>
              <button
                onClick={() => setFilterRole('cliente')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  filterRole === 'cliente' ? 'bg-white text-blue-700 font-semibold shadow-2xs' : 'text-slate-600'
                }`}
              >
                👤 Cliente ({clienteCount})
              </button>
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

        {/* User Cards Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredUsers.map((user) => {
            const isCurrent = user.id === currentUser.id;

            return (
              <div
                key={user.id}
                className={`p-5 rounded-xl border transition-all ${
                  isCurrent
                    ? 'border-indigo-300 bg-indigo-50/20 shadow-xs ring-1 ring-indigo-200'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                      alt={user.nome}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">{user.nome}</h4>
                        {isCurrent && (
                          <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded border border-indigo-200">
                            Você
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 font-medium mt-0.5">Cargo: {user.cargo || (user.role === 'admin' ? 'Admin' : user.role === 'operador' ? 'Operador' : 'Cliente')}</p>
                    </div>
                  </div>

                  {getRoleBadge(user.role)}
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

                {/* Granular Permissions Tags */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Permissões Ativas
                  </span>
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    <span className={`px-2 py-0.5 rounded-md font-medium inline-flex items-center gap-1 ${
                      user.permissoes.ver_financeiro_completo
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-50 text-slate-400 border border-slate-200'
                    }`}>
                      {user.permissoes.ver_financeiro_completo ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-slate-400" />}
                      Lucro Líquido & DRE
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
                      Emissão de Recibos
                    </span>

                    <span className={`px-2 py-0.5 rounded-md font-medium inline-flex items-center gap-1 ${
                      user.permissoes.gerenciar_estoque_custos
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-50 text-slate-400 border border-slate-200'
                    }`}>
                      {user.permissoes.gerenciar_estoque_custos ? <Check className="w-3 h-3 text-emerald-600" /> : <X className="w-3 h-3 text-slate-400" />}
                      Custos de Insumos
                    </span>
                  </div>
                </div>

                {/* Footer Action */}
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
                        <span>Editar Dados / Senha</span>
                      </button>
                    )}

                    {!isCurrent && onDeleteUser && (
                      <button
                        type="button"
                        onClick={() => setUserToDelete(user)}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                        title="Excluir usuário do sistema (Admin)"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Excluir</span>
                      </button>
                    )}
                  </div>

                  {!isCurrent ? (
                    <button
                      onClick={() => onSwitchUser(user)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>Alternar Usuário (Senha)</span>
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
          })}
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
          title="Excluir Usuário do Sistema"
          itemType="Usuário da Equipe"
          itemName={`${userToDelete.nome} (${userToDelete.email}) - Perfil: ${userToDelete.cargo}`}
          description="A exclusão deste usuário revogará permanentemente seu acesso e credenciais de login ao sistema."
        />
      )}

    </div>
  );
};
