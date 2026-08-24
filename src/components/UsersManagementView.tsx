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
  Edit3
} from 'lucide-react';
import { UsuarioEquipe, UserRole } from '../types';

interface UsersManagementViewProps {
  usuarios: UsuarioEquipe[];
  currentUser: UsuarioEquipe;
  onSwitchUser: (usuario: UsuarioEquipe) => void;
  onOpenNewUser: () => void;
  onOpenEditUser?: (usuario: UsuarioEquipe) => void;
  onToggleUserStatus?: (userId: string) => void;
  onOpenSqlGuide?: () => void;
}

export const UsersManagementView: React.FC<UsersManagementViewProps> = ({
  usuarios,
  currentUser,
  onSwitchUser,
  onOpenNewUser,
  onOpenEditUser,
  onToggleUserStatus,
  onOpenSqlGuide,
}) => {
  const [filterRole, setFilterRole] = useState<'todos' | UserRole>('todos');
  const [copiedSql, setCopiedSql] = useState(false);

  const filteredUsers = usuarios.filter(u => {
    if (filterRole === 'todos') return true;
    return u.role === filterRole;
  });

  const adminCount = usuarios.filter(u => u.role === 'admin').length;
  const operadorCount = usuarios.filter(u => u.role === 'operador').length;

  const handleCopyRoleSql = () => {
    const sql = `-- Consulta de validação de cargo / perfil no Supabase
SELECT u.id, u.email, p.nome, p.role, p.cargo
FROM auth.users u
JOIN public.perfis_usuarios p ON p.id = u.id;`;
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. CURRENT USER & QUICK ROLE SIMULATOR BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          
          {/* Active User Information */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&auto=format&fit=crop&q=80'}
                alt={currentUser.nome}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-400 shadow-sm"
              />
              <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                currentUser.status === 'ativo' ? 'bg-emerald-400' : 'bg-slate-400'
              }`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                  Sessão Ativa no Sistema
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                  currentUser.role === 'admin'
                    ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/40'
                    : 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40'
                }`}>
                  {currentUser.role === 'admin' ? '👑 Administrador' : '🧑‍💼 Operador (Recepção)'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">{currentUser.nome}</h2>
              <p className="text-xs text-slate-300 flex items-center gap-3 mt-0.5">
                <span>{currentUser.cargo}</span>
                {currentUser.registro_profissional && (
                  <span className="text-slate-400">• {currentUser.registro_profissional}</span>
                )}
              </p>
            </div>
          </div>

          {/* Instant Role Switcher for Testing */}
          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/15 w-full lg:w-auto">
            <div className="text-xs font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-indigo-300" />
              <span>Simular / Alternar Usuário em Tempo Real:</span>
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
                    <span>{u.role === 'admin' ? '👑' : '🧑‍💼'}</span>
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
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-xs font-bold uppercase mb-1 tracking-wider">Total da Equipe</div>
            <div className="text-2xl font-bold text-slate-900">{usuarios.length} usuários</div>
            <p className="text-xs text-slate-400 mt-0.5">Todos com acesso seguro via Supabase</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-xs font-bold uppercase mb-1 tracking-wider">Perfil Administrador</div>
            <div className="text-2xl font-bold text-indigo-600">{adminCount} profissionais</div>
            <p className="text-xs text-slate-400 mt-0.5">Acesso total a relatórios e prontuários</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-xs font-bold uppercase mb-1 tracking-wider">Perfil Operador / Recepção</div>
            <div className="text-2xl font-bold text-emerald-600">{operadorCount} atendentes</div>
            <p className="text-xs text-slate-400 mt-0.5">Foco em agendamentos e atendimento</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* 3. TEAM MEMBERS DIRECTORY */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        
        {/* Section Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 uppercase text-sm tracking-wider">
                Membros da Equipe & Níveis de Acesso
              </h3>
              <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full border border-slate-200">
                {filteredUsers.length}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Gerencie profissionais, recepcionistas e suas permissões no sistema
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
                👑 Admins ({adminCount})
              </button>
              <button
                onClick={() => setFilterRole('operador')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  filterRole === 'operador' ? 'bg-white text-emerald-700 font-semibold shadow-2xs' : 'text-slate-600'
                }`}
              >
                🧑‍💼 Operadores ({operadorCount})
              </button>
            </div>

            {/* New User Button */}
            <button
              onClick={onOpenNewUser}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Membro</span>
            </button>
          </div>
        </div>

        {/* User Cards Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredUsers.map((user) => {
            const isCurrent = user.id === currentUser.id;
            const isAdmin = user.role === 'admin';

            return (
              <div
                key={user.id}
                className={`p-5 rounded-xl border transition-all ${
                  isCurrent
                    ? 'border-indigo-300 bg-indigo-50/20 shadow-sm ring-1 ring-indigo-200'
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
                      <p className="text-xs text-slate-600 font-medium mt-0.5">{user.cargo}</p>
                      {user.registro_profissional && (
                        <p className="text-[11px] text-slate-400">{user.registro_profissional}</p>
                      )}
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 ${
                    isAdmin
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                  }`}>
                    {isAdmin ? '👑 Admin' : '🧑‍💼 Operador'}
                  </span>
                </div>

                {/* Contact and Activity */}
                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span className="text-slate-600">Senha: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-700 font-mono text-[11px] font-bold">{user.senha || (user.role === 'admin' ? 'admin123' : 'recepcao123')}</code></span>
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
                    <span className="text-[11px] text-slate-400">
                      Acesso: {user.ultimo_acesso || 'Recente'}
                    </span>
                    {onOpenEditUser && (
                      <button
                        type="button"
                        onClick={() => onOpenEditUser(user)}
                        className="text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 border border-slate-200 px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                        title="Editar nome, cargo, senha ou permissões"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Editar Nome/Dados</span>
                      </button>
                    )}
                  </div>

                  {!isCurrent ? (
                    <button
                      onClick={() => onSwitchUser(user)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>Alternar para este perfil</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Perfil em Uso
                    </span>
                  )}
                </div>

              </div>
            );
          })}
        </div>

      </div>

      {/* 4. PERMISSION MATRIX (MATRIZ COMPARATIVA DE RECURSOS) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 uppercase text-sm tracking-wider flex items-center gap-2">
            <Key className="w-4 h-4 text-indigo-600" />
            <span>Matriz de Permissões: Administrador vs. Operador</span>
          </h3>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Diferenciação clara entre o perfil clínico/estratégico e a equipe de recepção
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Módulo / Recurso do Sistema</th>
                <th className="px-6 py-3.5 text-center bg-indigo-50/50 text-indigo-900">
                  👑 Administrador (Dra. Responsável)
                </th>
                <th className="px-6 py-3.5 text-center bg-emerald-50/50 text-emerald-900">
                  🧑‍💼 Operador (Recepção / Secretária)
                </th>
                <th className="px-6 py-3.5">Finalidade Operacional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              
              {/* Row 1: Recepção & Balcão */}
              <tr className="hover:bg-slate-50">
                <td className="px-6 py-3.5 font-semibold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span>Balcão de Recepção & Agendamentos</span>
                </td>
                <td className="px-6 py-3.5 text-center bg-indigo-50/20 font-medium text-emerald-700">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                    <Check className="w-3.5 h-3.5" /> Acesso Total
                  </span>
                </td>
                <td className="px-6 py-3.5 text-center bg-emerald-50/20 font-medium text-emerald-700">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                    <Check className="w-3.5 h-3.5" /> Acesso Total
                  </span>
                </td>
                <td className="px-6 py-3.5 text-slate-500">
                  Confirmar presença, criar horários e gerenciar fluxo do dia.
                </td>
              </tr>

              {/* Row 2: WhatsApp */}
              <tr className="hover:bg-slate-50">
                <td className="px-6 py-3.5 font-semibold text-slate-900 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-slate-500" />
                  <span>Automação de WhatsApp Anti-Falta</span>
                </td>
                <td className="px-6 py-3.5 text-center bg-indigo-50/20 font-medium text-emerald-700">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                    <Check className="w-3.5 h-3.5" /> Acesso Total
                  </span>
                </td>
                <td className="px-6 py-3.5 text-center bg-emerald-50/20 font-medium text-emerald-700">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                    <Check className="w-3.5 h-3.5" /> Disparo em 1 Clique
                  </span>
                </td>
                <td className="px-6 py-3.5 text-slate-500">
                  Lembretes de 24h, pós-sessão e orientações pré-procedimento.
                </td>
              </tr>

              {/* Row 3: Cadastro de Pacientes */}
              <tr className="hover:bg-slate-50">
                <td className="px-6 py-3.5 font-semibold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-500" />
                  <span>Cadastro de Pacientes</span>
                </td>
                <td className="px-6 py-3.5 text-center bg-indigo-50/20 font-medium text-emerald-700">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                    <Check className="w-3.5 h-3.5" /> Criar & Editar
                  </span>
                </td>
                <td className="px-6 py-3.5 text-center bg-emerald-50/20 font-medium text-emerald-700">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                    <Check className="w-3.5 h-3.5" /> Criar & Atualizar
                  </span>
                </td>
                <td className="px-6 py-3.5 text-slate-500">
                  Cadastrar nome, telefone, CPF, nascimento e contatos.
                </td>
              </tr>

              {/* Row 4: Prontuário Clínico & TCLE */}
              <tr className="hover:bg-slate-50">
                <td className="px-6 py-3.5 font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>Prontuário Clínico, TCLE & Fotos Antes/Depois</span>
                </td>
                <td className="px-6 py-3.5 text-center bg-indigo-50/20 font-medium text-emerald-700">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                    <Check className="w-3.5 h-3.5" /> Completo (Edição & Fotos)
                  </span>
                </td>
                <td className="px-6 py-3.5 text-center bg-emerald-50/20 font-medium text-amber-700">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 border border-amber-200">
                    <Eye className="w-3.5 h-3.5" /> Visualização / Coleta TCLE
                  </span>
                </td>
                <td className="px-6 py-3.5 text-slate-500">
                  Proteção de sigilo médico/estético e colheita de assinatura do termo.
                </td>
              </tr>

              {/* Row 5: Baixa de Insumos & Estoque */}
              <tr className="hover:bg-slate-50">
                <td className="px-6 py-3.5 font-semibold text-slate-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-slate-500" />
                  <span>Estoque & Preço de Custo</span>
                </td>
                <td className="px-6 py-3.5 text-center bg-indigo-50/20 font-medium text-emerald-700">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                    <Check className="w-3.5 h-3.5" /> Gestão de Custos & Lotes
                  </span>
                </td>
                <td className="px-6 py-3.5 text-center bg-emerald-50/20 font-medium text-slate-700">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                    ⚡ Baixa Automática nas Sessões
                  </span>
                </td>
                <td className="px-6 py-3.5 text-slate-500">
                  Desconto automático do estoque ao concluir sem expor custos ao operador.
                </td>
              </tr>

              {/* Row 6: Financeiro & DRE */}
              <tr className="hover:bg-slate-50">
                <td className="px-6 py-3.5 font-semibold text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-slate-500" />
                  <span>Financeiro (Lucro Líquido & DRE)</span>
                </td>
                <td className="px-6 py-3.5 text-center bg-indigo-50/20 font-medium text-emerald-700">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                    <Check className="w-3.5 h-3.5" /> Visão Completa de Lucro
                  </span>
                </td>
                <td className="px-6 py-3.5 text-center bg-emerald-50/20 font-medium text-slate-500">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                    🧾 Apenas Recibos & Baixas
                  </span>
                </td>
                <td className="px-6 py-3.5 text-slate-500">
                  Operador registra recebimentos e emite recibos; lucro é restrito ao Admin.
                </td>
              </tr>

              {/* Row 7: Gestão de Usuários & Banco SQL */}
              <tr className="hover:bg-slate-50">
                <td className="px-6 py-3.5 font-semibold text-slate-900 flex items-center gap-2">
                  <Database className="w-4 h-4 text-slate-500" />
                  <span>Configurações & SQL Supabase</span>
                </td>
                <td className="px-6 py-3.5 text-center bg-indigo-50/20 font-medium text-emerald-700">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                    <Check className="w-3.5 h-3.5" /> Administrador Master
                  </span>
                </td>
                <td className="px-6 py-3.5 text-center bg-emerald-50/20 font-medium text-red-600">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-50 border border-red-200 text-red-700">
                    <Lock className="w-3.5 h-3.5" /> Restrito / Bloqueado
                  </span>
                </td>
                <td className="px-6 py-3.5 text-slate-500">
                  Garante que apenas o responsável técnico altere configurações de segurança.
                </td>
              </tr>

            </tbody>
          </table>
        </div>

      </div>

      {/* 5. SUPABASE AUTH & RLS EXPLANATION BOX */}
      <div className="bg-slate-900 text-slate-200 rounded-xl p-6 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Como o Supabase Auth + RLS protege a sua Clínica</h4>
              <p className="text-xs text-slate-400">Implementação no PostgreSQL com verificação em nível de linha (Zero Trust)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyRoleSql}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Key className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedSql ? 'Copiado!' : 'Copiar SQL de Perfis'}</span>
            </button>
            {onOpenSqlGuide && (
              <button
                onClick={onOpenSqlGuide}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Ver Schema Completo
              </button>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          No Supabase, a tabela <code className="text-emerald-400 bg-slate-800 px-1 py-0.5 rounded font-mono">public.perfis_usuarios</code> é vinculada diretamente ao <code className="text-emerald-400 bg-slate-800 px-1 py-0.5 rounded font-mono">auth.users(id)</code> via trigger. Quando o operador faz login, as políticas <strong>Row Level Security (RLS)</strong> asseguram que requisições ao financeiro ou dados clínicos só retornem o que a permissão dele autoriza.
        </p>

        <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
          <pre>{`-- Exemplo de RLS no Supabase para isolar dados financeiros
CREATE POLICY "Apenas admins acessam DRE e Lucro Liquido"
ON public.transacoes_financeiras
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.perfis_usuarios
    WHERE id = auth.uid() AND role = 'admin'
  )
);`}</pre>
        </div>
      </div>

    </div>
  );
};
