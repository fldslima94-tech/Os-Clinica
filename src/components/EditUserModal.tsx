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
  CheckCircle2
} from 'lucide-react';
import { UsuarioEquipe, UserRole, PermissoesUsuario } from '../types';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  usuario: UsuarioEquipe | null;
  onSaveUser: (updatedUser: UsuarioEquipe) => void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  usuario,
  onSaveUser,
}) => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cargo, setCargo] = useState('Operador');
  const [role, setRole] = useState<UserRole>('operador');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [permissoes, setPermissoes] = useState<PermissoesUsuario>({
    ver_financeiro_completo: false,
    editar_prontuario_clinico: false,
    gerenciar_estoque_custos: false,
    configuracoes_sistema: false,
    emitir_recibo: true,
  });

  useEffect(() => {
    if (usuario) {
      setNome(usuario.nome);
      setEmail(usuario.email);
      setCargo(usuario.cargo || (usuario.role === 'admin' ? 'Admin' : usuario.role === 'operador' ? 'Operador' : 'Cliente'));
      setRole(usuario.role);
      setTelefone(usuario.telefone || '');
      setSenha(usuario.senha || (usuario.role === 'admin' ? 'admin123' : usuario.role === 'operador' ? 'operador123' : 'cliente123'));
      setPermissoes(usuario.permissoes);
    }
  }, [usuario]);

  if (!isOpen || !usuario) return null;

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === 'admin') {
      setCargo('Admin');
      setPermissoes({
        ver_financeiro_completo: true,
        editar_prontuario_clinico: true,
        gerenciar_estoque_custos: true,
        configuracoes_sistema: true,
        emitir_recibo: true,
      });
    } else if (newRole === 'operador') {
      setCargo('Operador');
      setPermissoes({
        ver_financeiro_completo: false,
        editar_prontuario_clinico: false,
        gerenciar_estoque_custos: false,
        configuracoes_sistema: false,
        emitir_recibo: true,
      });
    } else {
      setCargo('Cliente');
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
    if (!nome.trim() || !email.trim()) return;

    onSaveUser({
      ...usuario,
      nome: nome.trim(),
      email: email.trim(),
      senha: senha.trim(),
      cargo: cargo.trim() || (role === 'admin' ? 'Admin' : role === 'operador' ? 'Operador' : 'Cliente'),
      role,
      telefone: telefone.trim(),
      permissoes,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Editar Cadastro de Usuário</h2>
              <p className="text-xs text-slate-500">Atualize dados, senha e nível de acesso (Admin, Operador, Cliente)</p>
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
          
          {/* Perfil / Nível de Acesso (Role) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Nível de Acesso (Perfil) *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              
              <button
                type="button"
                onClick={() => handleRoleChange('admin')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  role === 'admin'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-600/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1 text-indigo-700">
                    👑 Admin
                  </span>
                  {role === 'admin' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Acesso total ao sistema e dados.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('operador')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  role === 'operador'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-600/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1 text-emerald-700">
                    🧑‍💼 Operador
                  </span>
                  {role === 'operador' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Balcão, agenda e estoque.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('cliente')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  role === 'cliente'
                    ? 'border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-600/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1 text-blue-700">
                    👤 Cliente
                  </span>
                  {role === 'cliente' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Portal e orçamentos.
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
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cargo / Função *
              </label>
              <select
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
              >
                <option value="Admin">Admin</option>
                <option value="Operador">Operador</option>
                <option value="Cliente">Cliente</option>
              </select>
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
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
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
                  className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                WhatsApp / Celular
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Permissões Específicas */}
          <div className="pt-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Permissões Granulares
            </label>
            <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissoes.ver_financeiro_completo}
                  onChange={(e) => setPermissoes({ ...permissoes, ver_financeiro_completo: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-semibold text-slate-800">Visualizar DRE e Métricas Financeiras Completas</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissoes.editar_prontuario_clinico}
                  onChange={(e) => setPermissoes({ ...permissoes, editar_prontuario_clinico: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-semibold text-slate-800">Evolução Clínica & Prontuários</span>
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

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              Salvar Alterações
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
