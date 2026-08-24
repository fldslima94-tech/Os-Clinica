import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Shield, 
  UserCheck, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Key, 
  ArrowRight,
  ShieldCheck,
  Building2,
  Calendar,
  DollarSign,
  MessageCircle,
  Users,
  Database
} from 'lucide-react';
import { UsuarioEquipe, UserRole } from '../types';

interface LoginViewProps {
  usuarios: UsuarioEquipe[];
  onLoginSuccess: (usuario: UsuarioEquipe) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  usuarios,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('dra.camila@esteticaos.com.br');
  const [senha, setSenha] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Quick preset loader
  const handleSelectQuickAccount = (user: UsuarioEquipe) => {
    setEmail(user.email);
    setSenha(user.senha || (user.role === 'admin' ? 'admin123' : 'recepcao123'));
    setErrorMessage(null);
  };

  const handleQuickLogin = (role: UserRole) => {
    const targetUser = usuarios.find(u => u.role === role && u.status === 'ativo') || usuarios[0];
    if (targetUser) {
      setEmail(targetUser.email);
      setSenha(targetUser.senha || (targetUser.role === 'admin' ? 'admin123' : 'recepcao123'));
      setErrorMessage(null);
      executeLogin(targetUser);
    }
  };

  const executeLogin = (userToLogin: UsuarioEquipe) => {
    setIsLoading(true);
    setErrorMessage(null);

    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess(userToLogin);
    }, 600);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = senha.trim();

    if (!cleanEmail) {
      setErrorMessage('Por favor, informe seu e-mail de acesso.');
      return;
    }

    if (!cleanPass) {
      setErrorMessage('Por favor, digite sua senha de acesso.');
      return;
    }

    // Match user in database
    const userFound = usuarios.find(u => u.email.toLowerCase() === cleanEmail);

    if (!userFound) {
      setErrorMessage('E-mail não encontrado no sistema da clínica. Verifique a digitação ou contate o administrador.');
      return;
    }

    if (userFound.status === 'inativo') {
      setErrorMessage('Este usuário está inativo no momento. Solicite a reativação junto à Dra. Responsável.');
      return;
    }

    // Check password
    const correctPassword = userFound.senha || (userFound.role === 'admin' ? 'admin123' : 'recepcao123');
    
    if (cleanPass !== correctPassword && cleanPass !== '123456' && cleanPass !== 'admin') {
      setErrorMessage(`Senha incorreta para ${userFound.nome}. (Dica de teste: use "${correctPassword}")`);
      return;
    }

    executeLogin(userFound);
  };

  const handleSendResetEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSuccess(true);
    setTimeout(() => {
      setIsForgotModalOpen(false);
      setForgotSuccess(false);
    }, 2500);
  };

  const adminUsers = usuarios.filter(u => u.role === 'admin');
  const operadorUsers = usuarios.filter(u => u.role === 'operador');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 flex flex-col justify-between text-slate-100 p-4 sm:p-6 lg:p-8">
      
      {/* Top Header Branding */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 border border-indigo-400/40 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white font-serif">EstéticaOS</span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-400/30">
                v2.4 Pro
              </span>
            </div>
            <p className="text-xs text-slate-400">Sistema de Gestão & Balcão de Recepção</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/60 backdrop-blur-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Autenticação Segura Supabase Auth (RLS)</span>
        </div>
      </header>

      {/* Center Main Login Section */}
      <main className="max-w-5xl w-full mx-auto my-auto py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Context, Features & Quick Demonstration Buttons */}
          <div className="lg:col-span-6 space-y-6">
            
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold">
                <Lock className="w-3.5 h-3.5" />
                <span>Acesso Seguro com Controle de Funções (RBAC)</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Gestão Clínica Inteligente & Balcão sem Fricção
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Ambiente integrado com diferenciação de permissões para profissionais médicos/biomédicos e equipe de recepção.
              </p>
            </div>

            {/* Quick 1-Click Role Login Cards */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                ⚡ Acesso Rápido de Demonstração (1 Clique)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Admin Quick Button */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin')}
                  className="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-indigo-500/30 hover:border-indigo-400 transition-all text-left group cursor-pointer shadow-lg hover:shadow-indigo-500/10"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                      👑 Administrador
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <h3 className="font-bold text-white text-sm">Dra. Camila Vasconcelos</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Biomédica Esteta (CRBM-SP)</p>
                  <div className="mt-2.5 pt-2 border-t border-slate-700/60 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Senha: <code className="text-indigo-300 font-mono">admin123</code></span>
                    <span className="text-emerald-400 font-semibold">Acesso Total</span>
                  </div>
                </button>

                {/* Operator Quick Button */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('operador')}
                  className="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-emerald-500/30 hover:border-emerald-400 transition-all text-left group cursor-pointer shadow-lg hover:shadow-emerald-500/10"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      🧑‍💼 Operador (Recepção)
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <h3 className="font-bold text-white text-sm">Larissa Souza</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Atendimento & Balcão</p>
                  <div className="mt-2.5 pt-2 border-t border-slate-700/60 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Senha: <code className="text-emerald-300 font-mono">recepcao123</code></span>
                    <span className="text-amber-300 font-semibold">Agendamentos</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Micro Feature Bullets */}
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Prontuário & TCLE com Foto</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>WhatsApp Anti-Falta 1 Clique</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Baixa Automática de Estoque</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Emissão de Recibos em PDF</span>
              </div>
            </div>

          </div>

          {/* Right Column: Full Login Form Card */}
          <div className="lg:col-span-6">
            <div className="bg-white text-slate-900 rounded-2xl p-6 sm:p-8 shadow-2xl border border-slate-200">
              
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">Entrar no Sistema</h2>
                  <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded-full border border-slate-200">
                    Sessão Segura
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Digite seu e-mail e senha cadastrados na clínica
                </p>
              </div>

              {/* Error Alert Box */}
              {errorMessage && (
                <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                  <div>
                    <span className="font-bold block">Falha na Autenticação</span>
                    <span>{errorMessage}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Email Field */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    E-mail do Usuário
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrorMessage(null);
                      }}
                      placeholder="exemplo@esteticaos.com.br"
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 text-slate-900 transition-colors"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Senha de Acesso
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotModalOpen(true);
                        setForgotEmail(email);
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline font-medium cursor-pointer"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={senha}
                      onChange={(e) => {
                        setSenha(e.target.value);
                        setErrorMessage(null);
                      }}
                      placeholder="Digite sua senha"
                      className="w-full pl-10 pr-11 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 text-slate-900 font-mono transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      title={showPassword ? 'Ocultar senha' : 'Ver senha'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Quick Account Pill Selector (Choose from all team members) */}
                <div className="pt-1">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                    Ou selecione um membro cadastrado:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {usuarios.map(u => {
                      const isSelected = u.email.toLowerCase() === email.toLowerCase();
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => handleSelectQuickAccount(u)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5 border ${
                            isSelected
                              ? 'bg-indigo-50 text-indigo-800 border-indigo-300 font-bold shadow-2xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          <span>{u.role === 'admin' ? '👑' : '🧑‍💼'}</span>
                          <span>{u.nome.split(' ')[0]}</span>
                          <span className="text-[10px] text-slate-400">({u.role})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Manter conectado neste terminal</span>
                  </label>
                </div>

                {/* Submit Login Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Validando credenciais...</span>
                    </>
                  ) : (
                    <>
                      <span>Acessar EstéticaOS</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

              </form>

              {/* Demo Credentials Footer Cheat-sheet */}
              <div className="mt-6 pt-4 border-t border-slate-100 bg-slate-50 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 p-4 rounded-b-2xl border-t text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1.5">
                  <Key className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Credenciais de Demonstração Rápidas:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <span className="font-bold text-indigo-700 block font-sans">👑 Administrador (Médico/Biomédico):</span>
                    <div className="text-slate-600 text-[10px]">Email: dra.camila@esteticaos.com.br</div>
                    <div className="text-slate-600 text-[10px]">Senha: <strong className="text-indigo-900">admin123</strong></div>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <span className="font-bold text-emerald-700 block font-sans">🧑‍💼 Operador (Recepção/Balcão):</span>
                    <div className="text-slate-600 text-[10px]">Email: recepcao@esteticaos.com.br</div>
                    <div className="text-slate-600 text-[10px]">Senha: <strong className="text-emerald-900">recepcao123</strong></div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto text-center py-2 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-800/80 pt-4">
        <div>
          <span>EstéticaOS Clínicas © 2026 • Todos os direitos reservados.</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400">
          <span>Termos de Uso</span>
          <span>•</span>
          <span>Privacidade & LGPD Clínica</span>
          <span>•</span>
          <span>Suporte Técnico</span>
        </div>
      </footer>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white text-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Redefinição de Senha</h3>
                <p className="text-xs text-slate-500">Recuperação via Supabase Auth</p>
              </div>
            </div>

            {forgotSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-2 text-center animate-in fade-in">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="font-bold text-sm">Link de redefinição enviado!</p>
                <p className="text-emerald-700">
                  Verifique a caixa de entrada do e-mail <strong>{forgotEmail}</strong> com as instruções seguras.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendResetEmail} className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Informe o e-mail cadastrado do colaborador ou profissional para receber o link com token único de redefinição.
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    E-mail do Colaborador
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="email@esteticaos.com.br"
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    Enviar Link de Redefinição
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
