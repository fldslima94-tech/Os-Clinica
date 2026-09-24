import React, { useState, useEffect } from 'react';
import { X, User, Shield, Mail, Phone, Award, CheckCircle2, Lock, UserCheck, Crown, Building2, UserCircle, Sparkles, AlertCircle } from 'lucide-react';
import { UsuarioEquipe, UserRole, PermissoesUsuario } from '../types';
import { canUserAssignRole, getUserHierarchyRank, isUserAdminTotal } from '../services/firebaseService';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isSuperAdmin = isUserAdminTotal(currentUser);
  const canCreateMaster = canUserAssignRole(currentUser, 'admin_master');
  const canCreateAdminLocal = canUserAssignRole(currentUser, 'admin_local');
  const canCreateUsuario = canUserAssignRole(currentUser, 'usuario');
  const canCreateCliente = canUserAssignRole(currentUser, 'cliente');

  // Ajusta automaticamente a role inicial para a maior permitida ou 'usuario'
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      if (!canUserAssignRole(currentUser, role)) {
        if (canCreateAdminLocal) {
          setRole('admin_local');
          setCargo('Admin Local (Gestor)');
        } else {
          setRole('usuario');
          setCargo('Usuário da Equipe');
        }
      }
    }
  }, [isOpen, currentUser]);

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
    if (!canUserAssignRole(currentUser, newRole)) {
      if (newRole === 'admin_master' || newRole === 'admin_total') {
        setErrorMsg('Permissão negada: Apenas o Super Admin pode criar um novo Super Admin.');
      } else {
        setErrorMsg('Permissão negada: Você só pode criar usuários de nível igual ou inferior ao seu.');
      }
      return;
    }
    setErrorMsg(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) return;

    const cleanEmail = email.trim().toLowerCase();
    const cleanRole = role === 'admin_master' ? 'admin_total' : role;

    // Validação estrita de hierarquia:
    // Apenas Super Admin cria outro Super Admin; os demais apenas igual ou inferior.
    if (!canUserAssignRole(currentUser, cleanRole)) {
      setErrorMsg('Apenas o Super Admin pode criar um novo Super Admin. Você só pode criar usuários de classe igual à sua ou inferior.');
      return;
    }

    const defaultPass = 
      role === 'admin_master' || role === 'admin_total' ? 'master123' :
      role === 'admin_local' ? 'gestor123' :
      role === 'cliente' ? 'cliente123' : 'usuario123';

    const isMasterOrGestor = cleanRole === 'admin_total' || cleanRole === 'admin_local';

    setIsSubmitting(true);
    try {
      if (saveHandler) {
        await Promise.resolve(saveHandler({
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
        }));
      }

      // Reset and close
      setNome('');
      setEmail('');
      setSenha('');
      setCargo('Usuário da Equipe');
      setTelefone('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-xl border border-slate-200/90 animate-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Novo Cadastro de Usuário / Profissional</h2>
              <p className="text-xs text-slate-500">Cadastre profissionais reais, recepcionistas e gestores</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensagem de Erro de Permissão */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-800 font-medium animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Banner Informativo de Hierarquia */}
        <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            {isSuperAdmin ? (
              <Crown className="w-4 h-4 text-amber-600 shrink-0" />
            ) : canCreateAdminLocal ? (
              <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
            ) : (
              <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span className="font-semibold text-slate-800">
              Seu Perfil: {currentUser?.cargo || currentUser?.nome || (isSuperAdmin ? 'Super Admin' : 'Gestor')}
            </span>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
            {isSuperAdmin 
              ? 'Pode criar todos os níveis' 
              : 'Pode criar: classe igual ou inferior'}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Seletor de Hierarquia (4 Níveis) */}
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
                disabled={!canCreateMaster}
                onClick={() => handleRoleChange('admin_master')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  !canCreateMaster
                    ? 'border-slate-200 bg-slate-100/70 text-slate-400 opacity-60 cursor-not-allowed'
                    : role === 'admin_master' || role === 'admin_total'
                    ? 'border-amber-500 bg-amber-50/80 text-amber-950 ring-2 ring-amber-500/20 cursor-pointer'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${canCreateMaster ? 'text-amber-800' : 'text-slate-500'}`}>
                    <Crown className="w-4 h-4 text-amber-600" />
                    <span>1. Admin Master</span>
                  </span>
                  {!canCreateMaster ? (
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Super Admin
                    </span>
                  ) : (role === 'admin_master' || role === 'admin_total') ? (
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  ) : null}
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  {canCreateMaster 
                    ? 'Acesso total: libera módulos, cadastra/exclui usuários, altera permissões.'
                    : 'Exclusivo: Apenas o Super Admin pode criar outro Super Admin.'}
                </p>
              </button>

              {/* Nível 2: Admin Local */}
              <button
                type="button"
                disabled={!canCreateAdminLocal}
                onClick={() => handleRoleChange('admin_local')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  !canCreateAdminLocal
                    ? 'border-slate-200 bg-slate-100/70 text-slate-400 opacity-60 cursor-not-allowed'
                    : role === 'admin_local'
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 ring-2 ring-indigo-600/20 cursor-pointer'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${canCreateAdminLocal ? 'text-indigo-800' : 'text-slate-500'}`}>
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <span>2. Admin Local</span>
                  </span>
                  {!canCreateAdminLocal ? (
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Bloqueado
                    </span>
                  ) : role === 'admin_local' ? (
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  ) : null}
                </div>
                <p className="text-[11px] text-slate-600 leading-tight">
                  {canCreateAdminLocal 
                    ? 'Gestor da unidade: gerencia equipe, caixa e configurações locais.'
                    : 'Permitido apenas para Super Admin e Admin Local.'}
                </p>
              </button>

              {/* Nível 3: Usuário */}
              <button
                type="button"
                disabled={!canCreateUsuario}
                onClick={() => handleRoleChange('usuario')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  !canCreateUsuario
                    ? 'border-slate-200 bg-slate-100/70 text-slate-400 opacity-60 cursor-not-allowed'
                    : role === 'usuario' || role === 'profissional' || role === 'recepcao' || role === 'operador'
                    ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-600/20 cursor-pointer'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${canCreateUsuario ? 'text-emerald-800' : 'text-slate-500'}`}>
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>3. Profissional / Equipe</span>
                  </span>
                  {!canCreateUsuario ? (
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
                disabled={!canCreateCliente}
                onClick={() => handleRoleChange('cliente')}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  !canCreateCliente
                    ? 'border-slate-200 bg-slate-100/70 text-slate-400 opacity-60 cursor-not-allowed'
                    : role === 'cliente'
                    ? 'border-blue-600 bg-blue-50/80 text-blue-950 ring-2 ring-blue-600/20 cursor-pointer'
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
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-75"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Salvando no Banco...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salvar Cadastro de Profissional</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
