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
  Sparkles
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
  const [cargo, setCargo] = useState('');
  const [role, setRole] = useState<UserRole>('operador');
  const [telefone, setTelefone] = useState('');
  const [registroProfissional, setRegistroProfissional] = useState('');
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
      setCargo(usuario.cargo);
      setRole(usuario.role);
      setTelefone(usuario.telefone || '');
      setRegistroProfissional(usuario.registro_profissional || '');
      setSenha(usuario.senha || (usuario.role === 'admin' ? 'admin123' : 'recepcao123'));
      setPermissoes(usuario.permissoes);
    }
  }, [usuario]);

  if (!isOpen || !usuario) return null;

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === 'admin') {
      setPermissoes({
        ver_financeiro_completo: true,
        editar_prontuario_clinico: true,
        gerenciar_estoque_custos: true,
        configuracoes_sistema: true,
        emitir_recibo: true,
      });
    } else {
      setPermissoes({
        ver_financeiro_completo: false,
        editar_prontuario_clinico: false,
        gerenciar_estoque_custos: false,
        configuracoes_sistema: false,
        emitir_recibo: true,
      });
    }
  };

  const togglePermission = (key: keyof PermissoesUsuario) => {
    setPermissoes(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) return;

    onSaveUser({
      ...usuario,
      nome: nome.trim(),
      email: email.trim(),
      senha: senha.trim(),
      cargo: cargo.trim(),
      role,
      telefone: telefone.trim(),
      registro_profissional: registroProfissional.trim() || undefined,
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
              <p className="text-xs text-slate-500">Atualize nome, e-mail, senha e permissões de acesso</p>
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
          
          {/* Nome e Cargo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome Completo do Usuário *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Dra. Larissa Moura"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cargo / Especialidade *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Recepção & Atendimento"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-colors"
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
                  placeholder="usuario@esteticaos.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Senha de Acesso
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Defina a senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 font-mono transition-colors"
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
                  placeholder="(11) 99999-9999"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Registro Profissional (Opcional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Registro Profissional (CRM, CRBM, COREN, CRF)
            </label>
            <div className="relative">
              <BadgeCheck className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Ex: CRBM-SP 45.190"
                value={registroProfissional}
                onChange={(e) => setRegistroProfissional(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-colors"
              />
            </div>
          </div>

          {/* Perfil / Nível de Acesso (Role) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Nível de Acesso no Sistema *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Option Admin */}
              <div
                onClick={() => handleRoleChange('admin')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  role === 'admin'
                    ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-900">👑 Perfil Administrador</span>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    role === 'admin' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                  }`}>
                    {role === 'admin' && <Check className="w-2.5 h-2.5" />}
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Acesso total: DRE financeiro, custos de insumos, prontuário clínico e gestão de equipe.
                </p>
              </div>

              {/* Option Operador */}
              <div
                onClick={() => handleRoleChange('operador')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  role === 'operador'
                    ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900">🧑‍💼 Perfil Operador (Recepção)</span>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    role === 'operador' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                  }`}>
                    {role === 'operador' && <Check className="w-2.5 h-2.5" />}
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Operacional: agendamentos, mensagens WhatsApp anti-falta, recebimentos e emissão de recibos.
                </p>
              </div>

            </div>
          </div>

          {/* Granular Permissions Checkboxes */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              Permissões Granulares
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              
              <label className="flex items-center gap-2 p-1.5 rounded hover:bg-white transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissoes.ver_financeiro_completo}
                  onChange={() => togglePermission('ver_financeiro_completo')}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-700">Ver Lucro Líquido & DRE</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 rounded hover:bg-white transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissoes.editar_prontuario_clinico}
                  onChange={() => togglePermission('editar_prontuario_clinico')}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-700">Editar Prontuário & TCLE</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 rounded hover:bg-white transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissoes.gerenciar_estoque_custos}
                  onChange={() => togglePermission('gerenciar_estoque_custos')}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-700">Ver Custos e Gerenciar Insumos</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 rounded hover:bg-white transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissoes.configuracoes_sistema}
                  onChange={() => togglePermission('configuracoes_sistema')}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-700">Configurações & Gestão de Equipe</span>
              </label>

              <label className="flex items-center gap-2 p-1.5 rounded hover:bg-white transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissoes.emitir_recibo}
                  onChange={() => togglePermission('emitir_recibo')}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-700">Emitir Recibos de Pagamento</span>
              </label>

            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
