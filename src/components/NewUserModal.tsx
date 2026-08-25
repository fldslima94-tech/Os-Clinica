import React, { useState } from 'react';
import { X, User, Shield, Mail, Phone, Award, CheckCircle2, Lock, UserCheck } from 'lucide-react';
import { UsuarioEquipe, UserRole, PermissoesUsuario } from '../types';

interface NewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveUser?: (novo: Partial<UsuarioEquipe>) => void;
  onSave?: (novo: Partial<UsuarioEquipe>) => void;
}

export const NewUserModal: React.FC<NewUserModalProps> = ({
  isOpen,
  onClose,
  onSaveUser,
  onSave,
}) => {
  const saveHandler = onSaveUser || onSave;
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cargo, setCargo] = useState('Operador');
  const [role, setRole] = useState<UserRole>('operador');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');

  // Default permissions based on role
  const [permissoes, setPermissoes] = useState<PermissoesUsuario>({
    ver_financeiro_completo: false,
    emitir_recibo: true,
    editar_prontuario_clinico: false,
    gerenciar_estoque_custos: false,
    configuracoes_sistema: false,
  });

  if (!isOpen) return null;

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === 'admin') {
      setCargo('Admin');
      setPermissoes({
        ver_financeiro_completo: true,
        emitir_recibo: true,
        editar_prontuario_clinico: true,
        gerenciar_estoque_custos: true,
        configuracoes_sistema: true,
      });
    } else if (newRole === 'operador') {
      setCargo('Operador');
      setPermissoes({
        ver_financeiro_completo: false,
        emitir_recibo: true,
        editar_prontuario_clinico: false,
        gerenciar_estoque_custos: false,
        configuracoes_sistema: false,
      });
    } else {
      setCargo('Cliente');
      setPermissoes({
        ver_financeiro_completo: false,
        emitir_recibo: false,
        editar_prontuario_clinico: false,
        gerenciar_estoque_custos: false,
        configuracoes_sistema: false,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) return;

    if (saveHandler) {
      saveHandler({
        nome: nome.trim(),
        email: email.trim(),
        senha: senha.trim() || (role === 'admin' ? 'admin123' : role === 'operador' ? 'operador123' : 'cliente123'),
        cargo: cargo.trim() || (role === 'admin' ? 'Admin' : role === 'operador' ? 'Operador' : 'Cliente'),
        role,
        telefone: telefone.trim(),
        status: 'ativo',
        permissoes,
      });
    }

    // Reset and close
    setNome('');
    setEmail('');
    setSenha('');
    setCargo('Operador');
    setTelefone('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Novo Cadastro de Usuário</h2>
              <p className="text-xs text-slate-500">Selecione o perfil: Admin, Operador ou Cliente</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Seletor de Perfil (Role) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Tipo de Acesso (Perfil) *
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
                  Acesso irrestrito a procedimentos, financeiro e equipe.
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
                  Atendimento, agenda, pacientes e estoque.
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
                  Portal do Paciente e orçamentos.
                </p>
              </button>

            </div>
          </div>

          {/* Nome e Cargo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nome Completo *</label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Mariana Silva"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cargo / Função *</label>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail (Login) *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@esteticaos.com.br"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Senha de Acesso *</label>
              <input
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Defina a senha"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp / Telefone</label>
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
              />
            </div>
          </div>

          {/* Permissões Específicas */}
          <div className="pt-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Permissões do Perfil
            </label>
            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
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
              Salvar Usuário
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
