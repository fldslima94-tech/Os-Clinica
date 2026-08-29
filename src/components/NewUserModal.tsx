import React, { useState } from 'react';
import { X, User, Shield, Mail, Phone, Award, CheckCircle2, Lock, UserCheck, Crown, Building2, UserCircle, Sparkles, Stethoscope, Percent } from 'lucide-react';
import { UsuarioEquipe, UserRole, PermissoesUsuario } from '../types';

interface NewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveUser?: (novo: Partial<UsuarioEquipe>) => void;
  onSave?: (novo: Partial<UsuarioEquipe>) => void;
  currentUser?: UsuarioEquipe;
}

export const NewUserModal: React.FC<NewUserModalProps> = ({
  isOpen,
  onClose,
  onSaveUser,
  onSave,
  currentUser,
}) => {
  const saveHandler = onSaveUser || onSave;
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cargo, setCargo] = useState('Profissional / Atendimento');
  const [role, setRole] = useState<UserRole>('usuario');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [registroProfissional, setRegistroProfissional] = useState('');
  const [especialidade, setEspecialidade] = useState('');
  const [comissaoPercent, setComissaoPercent] = useState<number | string>(30);

  // Default permissions based on role
  const [permissoes, setPermissoes] = useState<PermissoesUsuario>({
    ver_financeiro_completo: false,
    emitir_recibo: true,
    editar_prontuario_clinico: true,
    gerenciar_estoque_custos: false,
    configuracoes_sistema: false,
  });

  if (!isOpen) return null;

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === 'admin_master' || newRole === 'admin_total') {
      setCargo('Admin Master (Acesso Total)');
      setPermissoes({
        ver_financeiro_completo: true,
        emitir_recibo: true,
        editar_prontuario_clinico: true,
        gerenciar_estoque_custos: true,
        configuracoes_sistema: true,
      });
    } else if (newRole === 'admin_local') {
      setCargo('Admin Local (Gestor)');
      setPermissoes({
        ver_financeiro_completo: true,
        emitir_recibo: true,
        editar_prontuario_clinico: true,
        gerenciar_estoque_custos: true,
        configuracoes_sistema: false,
      });
    } else if (newRole === 'usuario' || newRole === 'profissional' || newRole === 'recepcao' || newRole === 'operador') {
      setCargo('Usuário da Equipe');
      setPermissoes({
        ver_financeiro_completo: false,
        emitir_recibo: true,
        editar_prontuario_clinico: true,
        gerenciar_estoque_custos: false,
        configuracoes_sistema: false,
      });
    } else {
      setCargo('Cliente (Portal & Orçamentos)');
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

    const defaultPass = 
      role === 'admin_master' || role === 'admin_total' ? 'master123' :
      role === 'admin_local' ? 'gestor123' :
      role === 'cliente' ? 'cliente123' : 'usuario123';

    const cleanEmail = email.trim().toLowerCase();
    const cleanRole = role === 'admin_master' ? 'admin_total' : role;
    const isMasterOrGestor = cleanRole === 'admin_total' || cleanRole === 'admin_local';

    if (saveHandler) {
      saveHandler({
        nome: nome.trim(),
        nomeCompleto: nome.trim(),
        email: cleanEmail,
        senha: senha.trim() || defaultPass,
        cargo: cargo.trim() || (
          cleanRole === 'admin_total' ? 'Admin Master' :
          cleanRole === 'admin_local' ? 'Admin Local' :
          cleanRole === 'cliente' ? 'Cliente' : 'Profissional da Equipe'
        ),
        role: cleanRole,
        telefone: telefone.trim(),
        registro_profissional: registroProfissional.trim() || undefined,
        especialidade: especialidade.trim() || undefined,
        porcentagem_comissao: Number(comissaoPercent) || 0,
        status: 'ativo',
        permissoes,
        permissoesCustomizadas: {
          financeiro: {
            verEntradas: permissoes.ver_financeiro_completo || isMasterOrGestor,
            verSaidas: permissoes.ver_financeiro_completo || isMasterOrGestor,
            verRecorrentes: permissoes.ver_financeiro_completo || isMasterOrGestor,
            excluir: cleanRole === 'admin_total',
            verRelatorios: permissoes.ver_financeiro_completo || isMasterOrGestor,
          },
          clientes: {
            criar: true,
            editar: true,
            excluir: cleanRole === 'admin_total' || cleanRole === 'admin_local',
            verHistorico: true,
            preencherAnamnese: true,
          },
          agenda: {
            verTodos: true,
            verPropria: true,
            criar: true,
            cancelar: true,
            finalizar: true,
          },
          procedimentos: {
            verCustos: permissoes.ver_financeiro_completo || isMasterOrGestor,
            verMargem: permissoes.ver_financeiro_completo || isMasterOrGestor,
            criar: isMasterOrGestor,
            excluir: cleanRole === 'admin_total',
            ajustarEstoque: true,
          },
          bens: {
            visualizar: true,
            cadastrar: isMasterOrGestor,
            editar: isMasterOrGestor,
            gerenciar: isMasterOrGestor,
            excluir: cleanRole === 'admin_total',
            manutencao: true,
          },
          estoque: {
            ajustar: true,
            excluir: cleanRole === 'admin_total',
          },
          orcamentos: {
            verTodos: true,
            responder: true,
            verEmails: true,
          }
        }
      });
    }

    // Reset and close
    setNome('');
    setEmail('');
    setSenha('');
    setCargo('Usuário da Equipe');
    setTelefone('');
    setRegistroProfissional('');
    setEspecialidade('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Novo Cadastro de Usuário / Profissional</h2>
              <p className="text-xs text-slate-500">Cadastre profissionais reais, recepcionistas e gestores com comissões</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Seletor de Hierarquia (4 Níveis) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Nível Hierárquico no Sistema *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              
              {/* Nível 1: Admin Master */}
              <button
                type="button"
                onClick={() => handleRoleChange('admin_master')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  role === 'admin_master' || role === 'admin_total'
                    ? 'border-amber-500 bg-amber-50/80 text-amber-950 ring-2 ring-amber-500/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-amber-800">
                    <Crown className="w-4 h-4 text-amber-600" />
                    <span>1. Admin Master</span>
                  </span>
                  {(role === 'admin_master' || role === 'admin_total') && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  Acesso total: libera módulos, cadastra/exclui usuários, altera nomes de campos e permissões.
                </p>
              </button>

              {/* Nível 2: Admin Local */}
              <button
                type="button"
                onClick={() => handleRoleChange('admin_local')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  role === 'admin_local'
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 ring-2 ring-indigo-600/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-indigo-800">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <span>2. Admin Local</span>
                  </span>
                  {role === 'admin_local' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  Acesso baseado no que o Admin Master liberar. Gerencia equipe e operações da unidade.
                </p>
              </button>

              {/* Nível 3: Usuário */}
              <button
                type="button"
                onClick={() => handleRoleChange('usuario')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  role === 'usuario' || role === 'profissional' || role === 'recepcao' || role === 'operador'
                    ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-600/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-emerald-800">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>3. Profissional / Equipe</span>
                  </span>
                  {(role === 'usuario' || role === 'profissional' || role === 'recepcao' || role === 'operador') && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  Acesso aos atendimentos, agenda por profissional, anamneses e evolução de clientes.
                </p>
              </button>

              {/* Nível 4: Cliente */}
              <button
                type="button"
                onClick={() => handleRoleChange('cliente')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  role === 'cliente'
                    ? 'border-blue-600 bg-blue-50/80 text-blue-950 ring-2 ring-blue-600/20'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nome Completo *</label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Dra. Mariana Silva"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cargo / Função *</label>
              <input
                type="text"
                required
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="Ex: Biomédica Esteta, Dermatologista, Esteticista..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
              />
            </div>
          </div>

          {/* Registro Profissional e Especialidade */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Conselho / Registro (CRM, CRBM...)</label>
              <input
                type="text"
                value={registroProfissional}
                onChange={(e) => setRegistroProfissional(e.target.value)}
                placeholder="Ex: CRBM 42.190 / CRM 189.200"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Especialidade Clínica</label>
              <input
                type="text"
                value={especialidade}
                onChange={(e) => setEspecialidade(e.target.value)}
                placeholder="Ex: Harmonização Facial, Laser..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-emerald-600" />
                <span>Comissão (%)</span>
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={comissaoPercent}
                onChange={(e) => setComissaoPercent(e.target.value)}
                placeholder="Ex: 30"
                className="w-full px-3 py-2 text-xs bg-white border border-emerald-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 font-bold text-emerald-800"
              />
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
                placeholder="mariana@clinica.com.br"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Senha de Acesso *</label>
              <input
                type="text"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Ex: 123456"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp / Telefone</label>
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
              />
            </div>
          </div>

          {/* Permissões Específicas */}
          {role !== 'cliente' && (
            <div className="pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Privilégios Operacionais Iniciais
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

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Salvar Cadastro de Profissional</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
