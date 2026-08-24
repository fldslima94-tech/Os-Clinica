import React, { useState } from 'react';
import { 
  Sparkles, 
  Search, 
  Plus, 
  Check, 
  DollarSign, 
  Clock, 
  Send, 
  MessageCircle, 
  UserCheck, 
  ShieldCheck, 
  Calendar, 
  CheckCircle2, 
  X, 
  ChevronRight, 
  FileText, 
  ExternalLink,
  Layers,
  Heart,
  LogIn,
  LogOut,
  User,
  Phone,
  Mail,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { ProcedimentoClinico, SolicitacaoOrcamento, PacienteGoogleProfile, UsuarioEquipe } from '../types';

interface PatientPortalViewProps {
  procedimentos: ProcedimentoClinico[];
  orçamentos: SolicitacaoOrcamento[];
  onCriarOrcamento: (novoOrcamento: Omit<SolicitacaoOrcamento, 'id' | 'data_solicitacao'>) => void;
  onAtualizarStatusOrcamento?: (id: string, status: SolicitacaoOrcamento['status'], resposta?: string) => void;
  onConverterEmAgendamento?: (orcamento: SolicitacaoOrcamento) => void;
  currentUser: UsuarioEquipe;
}

export const PatientPortalView: React.FC<PatientPortalViewProps> = ({
  procedimentos,
  orçamentos,
  onCriarOrcamento,
  onAtualizarStatusOrcamento,
  onConverterEmAgendamento,
  currentUser,
}) => {
  // Mode: Patient View (public simulator) vs Clinic Admin View (lead management)
  const [activeTab, setActiveTab] = useState<'simulador' | 'meus_orcamentos' | 'gestao_clinica'>('simulador');
  const [categoryFilter, setCategoryFilter] = useState('todos');
  const [search, setSearch] = useState('');

  // Google Authentication State
  const [googleProfile, setGoogleProfile] = useState<PacienteGoogleProfile | null>(() => {
    try {
      const saved = localStorage.getItem('esteticaos_google_user');
      return saved ? JSON.parse(saved) : {
        id: 'goog-001',
        nome: 'Fernanda Lima da Silva',
        email: 'fldslima94@gmail.com',
        avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
        telefone: '(11) 99888-7766',
      };
    } catch {
      return null;
    }
  });

  const [isGoogleLoginModalOpen, setIsGoogleLoginModalOpen] = useState(false);
  const [customNameInput, setCustomNameInput] = useState('');
  const [customEmailInput, setCustomEmailInput] = useState('');
  const [customPhoneInput, setCustomPhoneInput] = useState('');

  // Selected items in the quote cart
  const [selectedProcedures, setSelectedProcedures] = useState<ProcedimentoClinico[]>([]);
  const [queixaPrincipal, setQueixaPrincipal] = useState('');
  const [periodoPreferencia, setPeriodoPreferencia] = useState<'qualquer' | 'manha' | 'tarde' | 'noite' | 'sabado'>('qualquer');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSubmittedQuote, setLastSubmittedQuote] = useState<SolicitacaoOrcamento | null>(null);

  const categories = ['todos', ...Array.from(new Set(procedimentos.map(p => p.categoria)))];

  const filteredProcedures = procedimentos.filter(p => {
    if (!p.ativo || !p.destaque_portal) return false;
    if (categoryFilter !== 'todos' && p.categoria !== categoryFilter) return false;
    const q = search.toLowerCase();
    return p.nome.toLowerCase().includes(q) || p.descricao.toLowerCase().includes(q);
  });

  // Toggle procedure in quote cart
  const handleToggleProcedure = (proc: ProcedimentoClinico) => {
    if (selectedProcedures.some(p => p.id === proc.id)) {
      setSelectedProcedures(selectedProcedures.filter(p => p.id !== proc.id));
    } else {
      setSelectedProcedures([...selectedProcedures, proc]);
    }
  };

  const totalEstimado = selectedProcedures.reduce((acc, p) => {
    const preco = p.valor_promocional || p.valor_tabela;
    return acc + preco;
  }, 0);

  const totalComDescontoPix = totalEstimado * 0.95; // 5% discount
  const valorParcela10x = totalEstimado > 0 ? (totalEstimado / 10) : 0;

  // Handle Google Login
  const handleGoogleLogin = (useMockOrCustom: 'mock' | 'custom') => {
    let profile: PacienteGoogleProfile;
    if (useMockOrCustom === 'mock') {
      profile = {
        id: `goog-${Date.now()}`,
        nome: 'Fernanda Lima da Silva',
        email: 'fldslima94@gmail.com',
        avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
        telefone: '(11) 99888-7766',
      };
    } else {
      if (!customNameInput.trim() || !customEmailInput.trim()) return;
      profile = {
        id: `goog-${Date.now()}`,
        nome: customNameInput.trim(),
        email: customEmailInput.trim(),
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        telefone: customPhoneInput.trim() || '(11) 99999-8888',
      };
    }

    setGoogleProfile(profile);
    localStorage.setItem('esteticaos_google_user', JSON.stringify(profile));
    setIsGoogleLoginModalOpen(false);
  };

  const handleGoogleLogout = () => {
    setGoogleProfile(null);
    localStorage.removeItem('esteticaos_google_user');
  };

  // Submit quote request
  const handleSubmitQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProcedures.length === 0) return;

    if (!googleProfile) {
      setIsGoogleLoginModalOpen(true);
      return;
    }

    const payload: Omit<SolicitacaoOrcamento, 'id' | 'data_solicitacao'> = {
      paciente_nome: googleProfile.nome,
      paciente_email: googleProfile.email,
      paciente_telefone: googleProfile.telefone || '(11) 99999-0000',
      paciente_avatar_url: googleProfile.avatar_url,
      conta_google_vinculada: true,
      procedimentos_selecionados: selectedProcedures.map(p => ({
        procedimento_id: p.id,
        nome: p.nome,
        categoria: p.categoria,
        valor_unitario: p.valor_promocional || p.valor_tabela,
      })),
      valor_total_estimado: totalEstimado,
      queixa_principal: queixaPrincipal.trim() || undefined,
      periodo_preferencia: periodoPreferencia,
      status: 'novo',
    };

    onCriarOrcamento(payload);

    const generatedQuote: SolicitacaoOrcamento = {
      ...payload,
      id: `orc-${Date.now()}`,
      data_solicitacao: new Date().toISOString(),
    };

    setLastSubmittedQuote(generatedQuote);
    setShowSuccessModal(true);
    setSelectedProcedures([]);
    setQueixaPrincipal('');
  };

  // Generate WhatsApp Direct link
  const generateWhatsAppLink = (quote: SolicitacaoOrcamento) => {
    const phone = '5511987654321'; // Clinic WhatsApp
    const procList = quote.procedimentos_selecionados.map(p => `• *${p.nome}* (R$ ${p.valor_unitario.toLocaleString('pt-BR')})`).join('\n');
    const msg = `Olá, Equipe EstéticaOS! 👋\n\nSou *${quote.paciente_nome}* e acabei de solicitar um orçamento no Portal do Paciente:\n\n📋 *Procedimentos de Interesse:*\n${procList}\n\n💰 *Total Estimado:* R$ ${quote.valor_total_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n${quote.queixa_principal ? `\n📝 *Minha Queixa/Dúvida:* ${quote.queixa_principal}` : ''}\n\nGostaria de confirmar a disponibilidade e tirar algumas dúvidas para agendamento! ✨`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  // Filter quotes for current google profile or all
  const myQuotes = orçamentos.filter(o => 
    googleProfile ? o.paciente_email.toLowerCase() === googleProfile.email.toLowerCase() : true
  );

  return (
    <div className="space-y-6">
      
      {/* Portal Header */}
      <div className="bg-linear-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-indigo-200 backdrop-blur-xs border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              <span>Portal de Autoatendimento do Paciente</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Monte seu Plano de Tratamento & Orçamento
            </h2>
            <p className="text-sm text-indigo-100/80 leading-relaxed">
              Explore os procedimentos ofertados pela clínica, calcule o investimento em tempo real com condições de parcelamento e envie sua solicitação direto para a nossa equipe médica.
            </p>
          </div>

          {/* Google Account Profile Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl shrink-0 w-full sm:w-auto min-w-[280px]">
            {googleProfile ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={googleProfile.avatar_url}
                    alt={googleProfile.nome}
                    className="w-10 h-10 rounded-full border-2 border-white/40 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white truncate block">{googleProfile.nome}</span>
                      <img
                        src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png"
                        alt="Google"
                        className="w-3.5 h-3.5 shrink-0"
                        title="Autenticado com Google"
                      />
                    </div>
                    <span className="text-[11px] text-indigo-200 truncate block">{googleProfile.email}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                  <span className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Conta Conectada
                  </span>
                  <button
                    onClick={handleGoogleLogout}
                    className="text-indigo-200 hover:text-white underline cursor-pointer text-[11px]"
                  >
                    Trocar conta
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-2.5">
                <p className="text-xs text-indigo-100 font-medium">
                  Conecte sua conta para salvar e acompanhar seus orçamentos:
                </p>
                <button
                  onClick={() => setIsGoogleLoginModalOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-slate-800 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Entrar com a Conta Google</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('simulador')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'simulador'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Simulador & Vitrine de Procedimentos</span>
          {selectedProcedures.length > 0 && (
            <span className="px-1.5 py-0.5 text-[11px] bg-indigo-500 text-white rounded-full font-bold">
              {selectedProcedures.length} selecionado{selectedProcedures.length > 1 ? 's' : ''}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('meus_orcamentos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'meus_orcamentos'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4 text-emerald-500" />
          <span>Meus Orçamentos Solicitados ({myQuotes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('gestao_clinica')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'gestao_clinica'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span>Gestão da Clínica / Leads ({orçamentos.length})</span>
        </button>
      </div>

      {/* TAB 1: SIMULADOR & VITRINE DE PROCEDIMENTOS */}
      {activeTab === 'simulador' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Procedures Showcase */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            
            {/* Search & Categories */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Pesquisar procedimentos (ex: Botox, Lábios, Colágeno, Lavieen)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      categoryFilter === cat
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat === 'todos' ? 'Todos os Procedimentos' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid of Procedure Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredProcedures.map(proc => {
                const isSelected = selectedProcedures.some(p => p.id === proc.id);
                const precoEfetivo = proc.valor_promocional || proc.valor_tabela;

                return (
                  <div
                    key={proc.id}
                    className={`bg-white rounded-2xl border transition-all duration-200 shadow-sm overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-600 ring-2 ring-indigo-500/30 bg-indigo-50/20'
                        : 'border-slate-200 hover:border-indigo-200 hover:shadow-md'
                    }`}
                  >
                    <div>
                      {proc.imagem_url && (
                        <div className="h-32 w-full relative overflow-hidden bg-slate-100">
                          <img
                            src={proc.imagem_url}
                            alt={proc.nome}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-linear-to-t from-slate-950/60 to-transparent" />
                          <span className="absolute bottom-2 left-2.5 text-[10px] font-bold text-white uppercase tracking-wider bg-slate-900/80 px-2 py-0.5 rounded backdrop-blur-xs">
                            {proc.categoria}
                          </span>
                        </div>
                      )}

                      <div className="p-4 space-y-2">
                        {!proc.imagem_url && (
                          <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                            {proc.categoria}
                          </span>
                        )}

                        <h4 className="text-sm font-bold text-slate-900 leading-snug">
                          {proc.nome}
                        </h4>

                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {proc.descricao}
                        </p>

                        <div className="flex items-center justify-between text-xs pt-2">
                          <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {proc.duracao_minutos} min
                          </span>

                          <div className="text-right">
                            <span className="text-base font-extrabold text-slate-900 font-mono">
                              R$ {precoEfetivo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>

                      </div>
                    </div>

                    <div className="p-3 bg-slate-50/70 border-t border-slate-100">
                      <button
                        onClick={() => handleToggleProcedure(proc)}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xs'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Selecionado para o Orçamento</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Adicionar ao Orçamento</span>
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>

          {/* Right Column: Quote Summary & Order Form */}
          <div className="lg:col-span-5 xl:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-6 space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Resumo do Orçamento</span>
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full">
                {selectedProcedures.length} item{selectedProcedures.length !== 1 ? 's' : ''}
              </span>
            </div>

            {selectedProcedures.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                <Sparkles className="w-8 h-8 text-indigo-400 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">Seu orçamento está vazio</p>
                <p className="text-[11px] text-slate-400">
                  Clique em <strong>"+ Adicionar ao Orçamento"</strong> nos procedimentos ao lado para simular os valores.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {selectedProcedures.map(proc => {
                  const preco = proc.valor_promocional || proc.valor_tabela;
                  return (
                    <div key={proc.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-slate-800 truncate">{proc.nome}</p>
                        <p className="text-[10px] text-slate-400">{proc.categoria}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-mono font-bold text-slate-900">
                          R$ {preco.toLocaleString('pt-BR')}
                        </span>
                        <button
                          onClick={() => handleToggleProcedure(proc)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Calculations & Payment Simulation */}
            {selectedProcedures.length > 0 && (
              <div className="space-y-3 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold text-slate-700">Investimento Total:</span>
                  <span className="text-xl font-extrabold text-slate-900 font-mono">
                    R$ {totalEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-indigo-200/60 text-xs">
                  <div className="flex items-center justify-between text-emerald-800 font-semibold">
                    <span>À vista com 5% desconto (Pix):</span>
                    <span>R$ {totalComDescontoPix.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center justify-between text-indigo-900 font-medium">
                    <span>Ou parcelado em até 10x:</span>
                    <span className="font-bold">10x de R$ {valorParcela10x.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} sem juros</span>
                  </div>
                </div>
              </div>
            )}

            {/* Form Fields for submission */}
            <form onSubmit={handleSubmitQuote} className="space-y-4 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Queixas Principais ou Objetivos (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Desejo suavizar rugas na testa, realçar os lábios com naturalidade..."
                  value={queixaPrincipal}
                  onChange={(e) => setQueixaPrincipal(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Preferência de Horário para Atendimento
                </label>
                <select
                  value={periodoPreferencia}
                  onChange={(e) => setPeriodoPreferencia(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium cursor-pointer"
                >
                  <option value="qualquer">Qualquer dia / Flexível</option>
                  <option value="manha">Período da Manhã (08h às 12h)</option>
                  <option value="tarde">Período da Tarde (13h às 18h)</option>
                  <option value="noite">Fim de Tarde / Noite (após 18h)</option>
                  <option value="sabado">Aos Sábados</option>
                </select>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={selectedProcedures.length === 0}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-sm font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Solicitar Orçamento & Agendamento</span>
              </button>

              <p className="text-[10px] text-center text-slate-400 leading-tight">
                🔒 Seus dados são protegidos conforme a LGPD e enviados com segurança à equipe médica.
              </p>
            </form>

          </div>

        </div>
      )}

      {/* TAB 2: MEUS ORÇAMENTOS SOLICITADOS (PACIENTE) */}
      {activeTab === 'meus_orcamentos' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Histórico de Solicitações do Paciente</h3>
              <p className="text-xs text-slate-400">
                Acompanhe o status e a resposta da clínica para cada orçamento solicitado.
              </p>
            </div>
            {googleProfile && (
              <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                {googleProfile.email}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myQuotes.map(quote => {
              const statusColors = {
                novo: 'bg-amber-100 text-amber-800 border-amber-200',
                em_analise: 'bg-indigo-100 text-indigo-800 border-indigo-200',
                orcamento_enviado: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                agendado: 'bg-purple-100 text-purple-800 border-purple-200',
              };

              const statusLabels = {
                novo: 'Recebido / Aguardando Contato',
                em_analise: 'Em Análise Médica',
                orcamento_enviado: 'Respondido no WhatsApp',
                agendado: 'Agendamento Confirmado',
              };

              return (
                <div key={quote.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColors[quote.status]}`}>
                        {statusLabels[quote.status]}
                      </span>
                      <p className="text-xs text-slate-400 mt-1">
                        Solicitado em: {new Date(quote.data_solicitacao).toLocaleString('pt-BR')}
                      </p>
                    </div>

                    <span className="text-base font-bold font-mono text-slate-900">
                      R$ {quote.valor_total_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                    <p className="font-bold text-slate-700 mb-1">Procedimentos Selecionados:</p>
                    {quote.procedimentos_selecionados.map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-slate-600">
                        <span>• {p.nome}</span>
                        <span className="font-mono">R$ {p.valor_unitario.toLocaleString('pt-BR')}</span>
                      </div>
                    ))}
                  </div>

                  {quote.queixa_principal && (
                    <p className="text-xs text-slate-500 bg-amber-50/60 p-2.5 rounded-lg border border-amber-100/80">
                      <strong>Observações:</strong> {quote.queixa_principal}
                    </p>
                  )}

                  {quote.resposta_clinica && (
                    <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 text-xs text-indigo-900 space-y-1">
                      <p className="font-bold flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5 text-indigo-600" />
                        Retorno da Clínica:
                      </p>
                      <p className="text-indigo-800">{quote.resposta_clinica}</p>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <a
                      href={generateWhatsAppLink(quote)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold border border-emerald-200 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Falar no WhatsApp</span>
                    </a>
                  </div>

                </div>
              );
            })}
          </div>

          {myQuotes.length === 0 && (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-800">Nenhum orçamento solicitado ainda</h4>
              <p className="text-xs text-slate-500 mt-1">
                Acesse a aba <strong>Simulador & Vitrine</strong> para montar seu primeiro plano de tratamento.
              </p>
            </div>
          )}

        </div>
      )}

      {/* TAB 3: GESTÃO DA CLÍNICA / LEADS DE ORÇAMENTO */}
      {activeTab === 'gestao_clinica' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Painel de Atendimento de Orçamentos (Recepção & Vendas)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Todas as solicitações de pacientes captadas através do Portal. Responda no WhatsApp ou converta em agendamentos.
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-indigo-100 text-indigo-800 rounded-lg">
              {orçamentos.length} Leads no Funil
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orçamentos.map(quote => (
              <div key={quote.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={quote.paciente_avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                        alt={quote.paciente_nome}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{quote.paciente_nome}</h4>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" /> {quote.paciente_email}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-700 mb-1">
                      <span>{quote.procedimentos_selecionados.length} Procedimento(s):</span>
                      <span className="font-mono text-indigo-700">
                        R$ {quote.valor_total_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    {quote.procedimentos_selecionados.map((p, i) => (
                      <p key={i} className="text-[11px] text-slate-600 truncate">
                        • {p.nome}
                      </p>
                    ))}
                  </div>

                  {quote.queixa_principal && (
                    <p className="text-xs text-slate-600 mt-2 bg-amber-50/70 p-2.5 rounded-lg border border-amber-200/60">
                      <strong>Queixa:</strong> {quote.queixa_principal}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                    <span>Preferência: <strong>{quote.periodo_preferencia || 'Flexível'}</strong></span>
                    <span>{new Date(quote.data_solicitacao).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <select
                    value={quote.status}
                    onChange={(e) => onAtualizarStatusOrcamento && onAtualizarStatusOrcamento(quote.id, e.target.value as any)}
                    className="text-xs font-semibold bg-slate-100 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none cursor-pointer"
                  >
                    <option value="novo">Novo</option>
                    <option value="em_analise">Em Análise</option>
                    <option value="orcamento_enviado">Respondido</option>
                    <option value="agendado">Agendado</option>
                  </select>

                  <div className="flex items-center gap-1.5">
                    <a
                      href={generateWhatsAppLink(quote)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
                      title="Chamar paciente no WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>

                    {onConverterEmAgendamento && (
                      <button
                        onClick={() => onConverterEmAgendamento(quote)}
                        className="px-2.5 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                        title="Agendar horário na agenda"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Agendar</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

      {/* GOOGLE SIGN IN MODAL */}
      {isGoogleLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs">
                <svg className="w-7 h-7" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900">Entrar com a Conta Google</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Cadastre-se ou entre em 1 clique para salvar seus orçamentos e agendamentos.
                </p>
              </div>

              {/* Instant Google Connect Button */}
              <button
                onClick={() => handleGoogleLogin('mock')}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 rounded-xl shadow-xs text-sm font-bold text-slate-700 transition-all cursor-pointer"
              >
                <img
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80"
                  alt="Avatar"
                  className="w-6 h-6 rounded-full object-cover"
                />
                <span>Continuar como Fernanda (fldslima94@gmail.com)</span>
              </button>

              <div className="flex items-center gap-3 text-xs text-slate-400">
                <div className="flex-1 h-px bg-slate-200" />
                <span>ou preencha seus dados</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <div className="space-y-3 text-left">
                <input
                  type="text"
                  placeholder="Nome completo do paciente"
                  value={customNameInput}
                  onChange={(e) => setCustomNameInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <input
                  type="email"
                  placeholder="Seu email Google (@gmail.com)"
                  value={customEmailInput}
                  onChange={(e) => setCustomEmailInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <input
                  type="tel"
                  placeholder="WhatsApp para contato (ex: 11 99999-8888)"
                  value={customPhoneInput}
                  onChange={(e) => setCustomPhoneInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />

                <button
                  onClick={() => handleGoogleLogin('custom')}
                  disabled={!customNameInput.trim() || !customEmailInput.trim()}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Conectar com estes Dados
                </button>
              </div>

              <button
                onClick={() => setIsGoogleLoginModalOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600 underline cursor-pointer pt-2"
              >
                Voltar sem conectar
              </button>

            </div>
          </div>
        </div>
      )}

      {/* SUCCESS CONFIRMATION MODAL */}
      {showSuccessModal && lastSubmittedQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6 text-center space-y-4">
            
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Orçamento Solicitado com Sucesso!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Olá <strong>{lastSubmittedQuote.paciente_nome}</strong>, sua solicitação foi registrada no sistema da clínica.
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-left text-xs space-y-1.5">
              <div className="flex justify-between font-bold text-slate-800">
                <span>Total Estimado:</span>
                <span className="font-mono text-indigo-700">
                  R$ {lastSubmittedQuote.valor_total_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-slate-500">
                Procedimentos: {lastSubmittedQuote.procedimentos_selecionados.map(p => p.nome).join(', ')}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={generateWhatsAppLink(lastSubmittedQuote)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Abrir Resumo no WhatsApp da Clínica</span>
              </a>

              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  setActiveTab('meus_orcamentos');
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Ver Meus Orçamentos
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
