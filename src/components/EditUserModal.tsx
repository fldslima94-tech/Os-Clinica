import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Shield, 
  Phone, 
  Lock, 
  BadgeCheck, 
  Check, 
  Key,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  Crown,
  Building2,
  UserCheck,
  UserCircle,
  AlertCircle
} from 'lucide-react';
import { UsuarioEquipe, UserRole, PermissoesUsuario } from '../types';
import { canUserAssignRole, isUserAdminTotal } from '../services/firebaseService';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  usuario?: UsuarioEquipe | null;
  user?: UsuarioEquipe | null;
  onSaveUser?: (updatedUser: UsuarioEquipe) => void;
  onSave?: (updatedUser: UsuarioEquipe) => void;
  currentUser?: UsuarioEquipe;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  usuario: propUsuario,
  user: propUser,
  onSaveUser,
  onSave,
  currentUser,
}) => {
  const usuario = propUsuario || propUser || null;
  const saveHandler = onSaveUser || onSave;
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cargo, setCargo] = useState('Usuário da Equipe');
  const [role, setRole] = useState<UserRole>('usuario');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isSuperAdmin = isUserAdminTotal(currentUser);
  const isTargetSuperAdmin = isUserAdminTotal(usuario);
  const canAssignMaster = canUserAssignRole(currentUser, 'admin_master');
  const canAssignAdminLocal = canUserAssignRole(currentUser, 'admin_local');
  const canAssignUsuario = canUserAssignRole(currentUser, 'usuario');
  const canAssignCliente = canUserAssignRole(currentUser, 'cliente');

  const [permissoes, setPermissoes] = useState<PermissoesUsuario>({
    ver_financeiro_completo: false,
    editar_prontuario_clinico: true,
    gerenciar_estoque_custos: false,
    configuracoes_sistema: false,
    emitir_recibo: true,
  });

  useEffect(() => {
    if (usuario) {
      setNome(usuario.nome);
      setEmail(usuario.email);
      setCargo(usuario.cargo || (
        usuario.role === 'admin_master' || usuario.role === 'admin_total' ? 'Admin Master' :
        usuario.role === 'admin_local' ? 'Admin Local' :
        usuario.role === 'cliente' ? 'Cliente' : 'Usuário'
      ));
      setRole(usuario.role);
      setTelefone(usuario.telefone || '');
      setSenha(usuario.senha || '123456');
      if (usuario.permissoes) {
        setPermissoes(usuario.permissoes);
      }
    }
  }, [usuario]);

  if (!isOpen || !usuario) return null;

  const handleRoleChange = (newRole: UserRole) => {
    if (role !== newRole && !canUserAssignRole(currentUser, newRole)) {
      if (newRole === 'admin_master' || newRole === 'admin_total') {
        setErrorMsg('Permissão negada: Apenas o Super Admin pode atribuir o cargo de Super Admin.');
      } else {
        setErrorMsg('Permissão negada: Você só pode atribuir cargos de classe igual à sua ou inferior.');
      }
      return;
    }
    setErrorMsg(null);
    setRole(newRole);
    if (newRole === 'admin_master' || newRole === 'admin_total') {
      setCargo('Admin Master (Acesso Total)');
      setPermissoes({
        ver_financeiro_completo: true,
        editar_prontuario_clinico: true,
        gerenciar_estoque_custos: true,
        configuracoes_sistema: true,
        emitir_recibo: true,
      });
    } else if (newRole === 'admin_local') {
      setCargo('Admin Local (Gestor)');
      setPermissoes({
        ver_financeiro_completo: true,
        editar_prontuario_clinico: true,
        gerenciar_estoque_custos: true,
        configuracoes_sistema: false,
        emitir_recibo: true,
      });
    } else if (newRole === 'usuario' || newRole === 'profissional' || newRole === 'recepcao' || newRole === 'operador') {
      setCargo('Usuário da Equipe');
      setPermissoes({
        ver_financeiro_completo: false,
        editar_prontuario_clinico: true,
        gerenciar_estoque_custos: false,
        configuracoes_sistema: false,
        emitir_recibo: true,
      });
    } else {
      setCargo('Cliente (Portal & Orçamentos)');
      setPermissoes({
        ver_financeiro_completo: false,
        editar_prontuario_clinico: false,
        gerenciar_estoque_custos: false,
        configuracoes_sistema: false,
        emitir_recibo: false,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim() || !usuario) return;

    if (role !== usuario.role && !canUserAssignRole(currentUser, role)) {
      setErrorMsg('Apenas o Super Admin pode atribuir a função de Super Admin. Você só pode atribuir cargos de classe igual à sua ou inferior.');
      return;
    }

    if (saveHandler) {
      saveHandler({
        ...usuario,
        nome: nome.trim(),
        nomeCompleto: nome.trim(),
        email: email.trim(),
        senha: senha.trim(),
        cargo: cargo.trim() || (
          role === 'admin_master' || role === 'admin_total' ? 'Admin Master' :
          role === 'admin_local' ? 'Admin Local' :
          role === 'cliente' ? 'Cliente' : 'Usuário'
        ),
        role,
        telefone: telefone.trim(),
        permissoes,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-xl border border-slate-200/90 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Editar Cadastro de Usuário</h2>
              <p className="text-xs text-slate-500">Atualize dados, senha e nível de acesso nos 4 níveis da hierarquia</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Alerta de Erro de Permissão */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-800 font-medium animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Banner de Proteção do Super Admin */}
          {isTargetSuperAdmin && !isSuperAdmin && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
              <Crown className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Usuário Super Admin Protegido</span>
                <span>Apenas o próprio Super Admin pode alterar a classe hierárquica ou privilégios de outro Super Admin.</span>
              </div>
            </div>
          )}

          {/* Perfil / Nível de Acesso (4 Níveis da Hierarquia) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Nível Hierárquico no Sistema *
              </label>
              {!isSuperAdmin && (
                <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-600" />
                  Super Admin restrito
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              
              {/* Nível 1: Admin Master */}
              <button
                type="button"
                disabled={!canAssignMaster || (isTargetSuperAdmin && !isSuperAdmin)}
                onClick={() => handleRoleChange('admin_master')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  !canAssignMaster || (isTargetSuperAdmin && !isSuperAdmin)
                    ? 'border-slate-200 bg-slate-100/70 text-slate-400 opacity-60 cursor-not-allowed'
                    : role === 'admin_master' || role === 'admin_total'
                    ? 'border-amber-500 bg-amber-50/80 text-amber-950 ring-2 ring-amber-500/20 shadow-xs cursor-pointer'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${canAssignMaster ? 'text-amber-800' : 'text-slate-500'}`}>
                    <Crown className="w-4 h-4 text-amber-600" />
                    <span>1. Admin Master</span>
                  </span>
                  {!canAssignMaster ? (
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Super Admin
                    </span>
                  ) : (role === 'admin_master' || role === 'admin_total') ? (
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  ) : null}
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  {canAssignMaster
                    ? 'Acesso total: libera módulos, cadastra/exclui usuários, altera permissões.'
                    : 'Exclusivo: Apenas o Super Admin pode atribuir perfil de Super Admin.'}
                </p>
              </button>

              {/* Nível 2: Admin Local */}
              <button
                type="button"
                disabled={!canAssignAdminLocal || (isTargetSuperAdmin && !isSuperAdmin)}
                onClick={() => handleRoleChange('admin_local')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  !canAssignAdminLocal || (isTargetSuperAdmin && !isSuperAdmin)
                    ? 'border-slate-200 bg-slate-100/70 text-slate-400 opacity-60 cursor-not-allowed'
                    : role === 'admin_local'
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 ring-2 ring-indigo-600/20 shadow-xs cursor-pointer'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${canAssignAdminLocal ? 'text-indigo-800' : 'text-slate-500'}`}>
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <span>2. Admin Local</span>
                  </span>
                  {!canAssignAdminLocal ? (
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Bloqueado
                    </span>
                  ) : role === 'admin_local' ? (
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  ) : null}
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  {canAssignAdminLocal
                    ? 'Gestor da unidade: gerencia equipe, caixa e operações da unidade.'
                    : 'Permitido apenas para Super Admin e Admin Local.'}
                </p>
              </button>

              {/* Nível 3: Usuário */}
              <button
                type="button"
                disabled={!canAssignUsuario || (isTargetSuperAdmin && !isSuperAdmin)}
                onClick={() => handleRoleChange('usuario')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  !canAssignUsuario || (isTargetSuperAdmin && !isSuperAdmin)
                    ? 'border-slate-200 bg-slate-100/70 text-slate-400 opacity-60 cursor-not-allowed'
                    : role === 'usuario' || role === 'profissional' || role === 'recepcao' || role === 'operador'
                    ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-600/20 shadow-xs cursor-pointer'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${canAssignUsuario ? 'text-emerald-800' : 'text-slate-500'}`}>
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>3. Profissional / Equipe</span>
                  </span>
                  {!canAssignUsuario ? (
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Bloqueado
                    </span>
                  ) : (role === 'usuario' || role === 'profissional' || role === 'recepcao' || role === 'operador') ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : null}
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  Acesso aos atendimentos, agenda por profissional, anamneses e evolução de clientes.
                </p>
              </button>

              {/* Nível 4: Cliente */}
              <button
                type="button"
                disabled={!canAssignCliente || (isTargetSuperAdmin && !isSuperAdmin)}
                onClick={() => handleRoleChange('cliente')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  !canAssignCliente || (isTargetSuperAdmin && !isSuperAdmin)
                    ? 'border-slate-200 bg-slate-100/70 text-slate-400 opacity-60 cursor-not-allowed'
                    : role === 'cliente'
                    ? 'border-blue-600 bg-blue-50/80 text-blue-950 ring-2 ring-blue-600/20 shadow-xs cursor-pointer'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-blue-800">
                    <UserCircle className="w-4 h-4 text-blue-600" />
                    <span>4. Cliente</span>
                  </span>
                  {role === 'cliente' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  Acesso exclusivo ao Portal do Paciente, consultas e orçamentos clínicos.
                </p>
              </button>

            </div>
          </div>

          {/* Nome e Cargo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome Completo *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cargo / Descrição da Função *
              </label>
              <input
                type="text"
                required
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="Ex: Biomédica Esteta, Recepcionista, Gerente..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
              />
            </div>
          </div>

          {/* Email, Senha e Telefone */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                E-mail (Login) *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Senha de Acesso *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                WhatsApp / Telefone
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Permissões Específicas */}
          {role !== 'cliente' && (
            <div className="pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Privilégios Operacionais do Usuário
              </label>
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissoes.ver_financeiro_completo}
                    onChange={(e) => setPermissoes({ ...permissoes, ver_financeiro_completo: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-semibold text-slate-800">Visualizar Fluxo Financeiro Completo</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissoes.editar_prontuario_clinico}
                    onChange={(e) => setPermissoes({ ...permissoes, editar_prontuario_clinico: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-semibold text-slate-800">Evolução Clínica & Prontuários dos Clientes</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissoes.gerenciar_estoque_custos}
                    onChange={(e) => setPermissoes({ ...permissoes, gerenciar_estoque_custos: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-semibold text-slate-800">Gerenciar Custos de Insumos & Procedimentos</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissoes.emitir_recibo}
                    onChange={(e) => setPermissoes({ ...permissoes, emitir_recibo: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-semibold text-slate-800">Emissão de Recibos & Comprovantes</span>
                </label>
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              Salvar Alterações
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
