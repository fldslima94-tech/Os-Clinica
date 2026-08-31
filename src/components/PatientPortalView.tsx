import React, { useState, useEffect } from 'react';
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
  HelpCircle,
  Trash2,
  MapPin,
  Navigation,
  Compass,
  CalendarCheck,
  Building2
} from 'lucide-react';
import { 
  ProcedimentoClinico, 
  SolicitacaoOrcamento, 
  PacienteGoogleProfile, 
  UsuarioEquipe, 
  ClinicaConfig 
} from '../types';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { 
  loginWithFirebaseGoogle, 
  logoutFirebase, 
  onFirebaseAuthStateChange, 
  isUserAdminTotal, 
  isUserAdminLocalOrTotal 
} from '../services/firebaseService';

interface PatientPortalViewProps {
  procedimentos: ProcedimentoClinico[];
  orçamentos: SolicitacaoOrcamento[];
  onCriarOrcamento: (novoOrcamento: Omit<SolicitacaoOrcamento, 'id' | 'data_solicitacao'>) => void;
  onAtualizarStatusOrcamento?: (id: string, status: SolicitacaoOrcamento['status'], resposta?: string) => void;
  onConverterEmAgendamento?: (orcamento: SolicitacaoOrcamento) => void;
  onDeleteOrcamento?: (id: string) => void;
  onCriarAgendamento?: (novoAgendamento: any) => void;
  currentUser: UsuarioEquipe;
  clinicaConfig?: ClinicaConfig;
  profissionais?: UsuarioEquipe[];
}

export const PatientPortalView: React.FC<PatientPortalViewProps> = ({
  procedimentos,
  orçamentos,
  onCriarOrcamento,
  onAtualizarStatusOrcamento,
  onConverterEmAgendamento,
  onDeleteOrcamento,
  onCriarAgendamento,
  currentUser,
  clinicaConfig,
  profissionais = [],
}) => {
  const isAdmin = !currentUser || isUserAdminTotal(currentUser) || isUserAdminLocalOrTotal(currentUser) || currentUser.role === 'admin_master' || currentUser.role === 'admin_total' || currentUser.role === 'admin' || currentUser.role === 'gestor';
  
  // Active Tab: simulador | agendamento | mapa | meus_orcamentos | gestao_clinica
  const [activeTab, setActiveTab] = useState<'simulador' | 'agendamento' | 'mapa' | 'meus_orcamentos' | 'gestao_clinica'>('simulador');
  const [categoryFilter, setCategoryFilter] = useState('todos');
  const [search, setSearch] = useState('');
  const [orcamentoToDelete, setOrcamentoToDelete] = useState<SolicitacaoOrcamento | null>(null);

  // Google Authentication State
  const [googleProfile, setGoogleProfile] = useState<PacienteGoogleProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Sync with Firebase Auth state in real-time
  useEffect(() => {
    const unsubscribe = onFirebaseAuthStateChange((user) => {
      if (user) {
        setGoogleProfile({
          id: user.uid,
          nome: user.displayName || 'Paciente Google',
          email: user.email || '',
          avatar_url: user.photoURL || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
          telefone: user.phoneNumber || '(11) 99888-7766',
        });
      }
    });
    return () => unsubscribe();
  }, []);

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

  // Direct Appointment Form State
  const [bookingProcedureId, setBookingProcedureId] = useState<string>('');
  const [bookingDate, setBookingDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [bookingPeriod, setBookingPeriod] = useState<string>('manha');
  const [bookingProfessionalId, setBookingProfessionalId] = useState<string>('qualquer');
  const [bookingNotes, setBookingNotes] = useState<string>('');
  const [bookingSuccessModal, setBookingSuccessModal] = useState(false);
  const [lastSubmittedBooking, setLastSubmittedBooking] = useState<any>(null);

  const categories = ['todos', ...Array.from(new Set(procedimentos.map(p => p.categoria)))];

  const filteredProcedures = procedimentos.filter(p => {
    if (!p.ativo || !p.destaque_portal) return false;
    if (categoryFilter !== 'todos' && p.categoria !== categoryFilter) return false;
    const q = (search || '').toLowerCase();
    return (p.nome || '').toLowerCase().includes(q) || (p.descricao || '').toLowerCase().includes(q);
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

  // Handle Google Login with Firebase Auth and fallback
  const handleFirebaseGoogleSignIn = async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const user = await loginWithFirebaseGoogle();
      if (user) {
        const profile: PacienteGoogleProfile = {
          id: user.uid,
          nome: user.displayName || 'Paciente Google',
          email: user.email || '',
          avatar_url: user.photoURL || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
          telefone: user.phoneNumber || '(11) 99888-7766',
        };
        setGoogleProfile(profile);
        setIsGoogleLoginModalOpen(false);
      }
    } catch (err: any) {
      console.warn('[Firebase Auth] Abrindo modal para identificação:', err);
      setAuthError(err.message || 'Não foi possível conectar com o Google no momento.');
      setIsGoogleLoginModalOpen(true);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleGoogleLogin = (useMockOrCustom: 'mock' | 'custom') => {
    let profile: PacienteGoogleProfile;
    if (useMockOrCustom === 'mock') {
      profile = {
        id: `goog-${Date.now()}`,
        nome: 'Fernanda Lima da Silva',
        email: 'paciente.fernanda@exemplo.com',
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
    setIsGoogleLoginModalOpen(false);
  };

  const handleGoogleLogout = async () => {
    await logoutFirebase();
    setGoogleProfile(null);
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

  // Submit direct appointment request
  const handleSubmitDirectBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingProcedureId) return;

    if (!googleProfile) {
      setIsGoogleLoginModalOpen(true);
      return;
    }

    const selectedProc = procedimentos.find(p => p.id === bookingProcedureId);
    const selectedProf = profissionais.find(p => p.id === bookingProfessionalId);
    const valorEstimado = selectedProc ? (selectedProc.valor_promocional || selectedProc.valor_tabela) : 0;

    // Criar solicitação de orçamento vinculada
    const orcamentoPayload: Omit<SolicitacaoOrcamento, 'id' | 'data_solicitacao'> = {
      paciente_nome: googleProfile.nome,
      paciente_email: googleProfile.email,
      paciente_telefone: googleProfile.telefone || '(11) 99999-0000',
      paciente_avatar_url: googleProfile.avatar_url,
      conta_google_vinculada: true,
      procedimentos_selecionados: selectedProc ? [{
        procedimento_id: selectedProc.id,
        nome: selectedProc.nome,
        categoria: selectedProc.categoria,
        valor_unitario: valorEstimado,
      }] : [],
      valor_total_estimado: valorEstimado,
      queixa_principal: `[Solicitação Direta de Agendamento] Data Preferida: ${bookingDate} (${bookingPeriod}). Profissional: ${selectedProf?.nome || 'Qualquer Disponível'}. Observações: ${bookingNotes}`,
      periodo_preferencia: (bookingPeriod as any) || 'qualquer',
      status: 'novo',
    };

    onCriarOrcamento(orcamentoPayload);

    // Se houver manipulador de agendamento direto na clínica
    if (onCriarAgendamento && selectedProc) {
      const horaPadrao = bookingPeriod === 'manha' ? '09:00' : bookingPeriod === 'tarde' ? '14:30' : '18:30';
      onCriarAgendamento({
        pacienteId: `pac-${Date.now()}`,
        pacienteNome: googleProfile.nome,
        pacienteTelefone: googleProfile.telefone || '(11) 99999-0000',
        pacienteEmail: googleProfile.email,
        procedimentoId: selectedProc.id,
        procedimentoNome: selectedProc.nome,
        profissionalId: selectedProf?.id || (profissionais[0]?.id || 'prof-geral'),
        profissionalNome: selectedProf?.nome || (profissionais[0]?.nome || 'Equipe Médica'),
        data: bookingDate,
        hora: horaPadrao,
        duracaoMinutos: selectedProc.duracao_minutos || 45,
        valor: valorEstimado,
        status: 'pendente',
        observacoes: `Solicitado via Portal do Paciente Google. ${bookingNotes}`
      });
    }

    const bookingSummary = {
      pacienteNome: googleProfile.nome,
      procedimentoNome: selectedProc?.nome || 'Consulta Avaliativa',
      data: bookingDate,
      periodo: bookingPeriod,
      profissionalNome: selectedProf?.nome || 'Qualquer Disponível',
      valor: valorEstimado,
      observacoes: bookingNotes
    };

    setLastSubmittedBooking(bookingSummary);
    setBookingSuccessModal(true);
    setBookingNotes('');
  };

  // Generate WhatsApp Direct link
  const generateWhatsAppLink = (quote: SolicitacaoOrcamento) => {
    const phone = clinicaConfig?.telefone ? clinicaConfig.telefone.replace(/\D/g, '') : '5511987654321';
    const procList = (quote.procedimentos_selecionados || []).map(p => `• *${p.nome}* (R$ ${p.valor_unitario.toLocaleString('pt-BR')})`).join('\n');
    const msg = `Olá, Equipe ${clinicaConfig?.nome || 'EstéticaOS'}! 👋\n\nSou *${quote.paciente_nome}* e acabei de solicitar um orçamento/agendamento no Portal do Paciente:\n\n📋 *Procedimentos de Interesse:*\n${procList || `• ${quote.procedimento_nome || 'Consulta Avaliativa'}`}\n\n💰 *Total Estimado:* R$ ${(quote.valor_total_estimado || quote.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n${quote.queixa_principal ? `\n📝 *Detalhes:* ${quote.queixa_principal}` : ''}\n\nGostaria de confirmar o agendamento! ✨`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  // Clinic address and maps route
  const clinicaEndereco = clinicaConfig?.endereco || 'Av. Paulista, 1000, Bela Vista - São Paulo, SP';
  const googleMapsRouteUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${clinicaConfig?.nome || 'Clínica Estética'} ${clinicaEndereco}`)}`;
  const googleMapsEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(clinicaEndereco)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  // Filter quotes for current google profile or all
  const myQuotes = orçamentos.filter(o => 
    googleProfile ? (o.paciente_email || '').toLowerCase() === (googleProfile.email || '').toLowerCase() : true
  );

  return (
    <div className="space-y-6">
      
      {/* Portal Header */}
      <div className="bg-linear-to-r from-indigo-950 via-indigo-900 to-slate-950 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden border border-indigo-800/40">
        <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-60 h-60 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-semibold text-indigo-200 backdrop-blur-xs border border-white/10 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              <span>Portal de Autoatendimento & Agendamentos • {clinicaConfig?.nome || 'EstéticaOS'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Simule seu Orçamento & Agende sua Consulta
            </h2>
            <p className="text-xs sm:text-sm text-indigo-100/80 leading-relaxed">
              Explore os procedimentos ofertados pela clínica, calcule o investimento em tempo real com condições de parcelamento sem juros, verifique a localização no Google Maps e solicite seu agendamento direto com a equipe médica.
            </p>
          </div>

          {/* Google Account Profile Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shrink-0 w-full sm:w-auto min-w-[290px] shadow-sm">
            {googleProfile ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={googleProfile.avatar_url}
                    alt={googleProfile.nome}
                    className="w-11 h-11 rounded-full border-2 border-white/40 object-cover shadow-2xs"
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
                    className="text-rose-300 hover:text-rose-200 font-bold underline cursor-pointer text-[11px]"
                  >
                    Desconectar
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-2.5">
                <p className="text-xs text-indigo-100 font-medium">
                  Conecte sua conta para salvar orçamentos e agendamentos:
                </p>
                <button
                  onClick={handleFirebaseGoogleSignIn}
                  disabled={isAuthLoading}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-slate-800 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer disabled:opacity-70"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>{isAuthLoading ? 'Conectando...' : 'Entrar com a Conta Google'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-thin">
        <button
          onClick={() => setActiveTab('simulador')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'simulador'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Simulador & Vitrine</span>
          {selectedProcedures.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] bg-indigo-500 text-white rounded-full font-bold">
              {selectedProcedures.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('agendamento')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'agendamento'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CalendarCheck className="w-4 h-4 text-blue-500" />
          <span>Solicitar Agendamento</span>
        </button>

        <button
          onClick={() => setActiveTab('mapa')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'mapa'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <MapPin className="w-4 h-4 text-rose-500" />
          <span>Localização & Google Maps</span>
        </button>

        <button
          onClick={() => setActiveTab('meus_orcamentos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'meus_orcamentos'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4 text-emerald-500" />
          <span>Minhas Solicitações ({myQuotes.length})</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('gestao_clinica')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ml-auto ${
              activeTab === 'gestao_clinica'
                ? 'bg-indigo-700 text-white shadow-sm'
                : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Gestão da Clínica / Leads ({orçamentos.length})</span>
          </button>
        )}
      </div>

      {/* TAB 1: SIMULADOR & VITRINE DE PROCEDIMENTOS */}
      {activeTab === 'simulador' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Procedures Showcase */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            
            {/* Search & Categories */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Pesquisar procedimentos (ex: Botox, Preenchimento Labial, Bioestimulador, Lavieen)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
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
                    className={`bg-white rounded-2xl border transition-all duration-200 shadow-xs overflow-hidden flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-600 ring-2 ring-indigo-500/30 bg-indigo-50/20'
                        : 'border-slate-200 hover:border-indigo-200 hover:shadow-md'
                    }`}
                  >
                    <div>
                      {proc.imagem_url && (
                        <div className="h-36 w-full relative overflow-hidden bg-slate-100">
                          <img
                            src={proc.imagem_url}
                            alt={proc.nome}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-linear-to-t from-slate-950/70 via-slate-950/20 to-transparent" />
                          <span className="absolute bottom-2.5 left-3 text-[10px] font-bold text-white uppercase tracking-wider bg-slate-900/80 px-2 py-0.5 rounded-md backdrop-blur-xs">
                            {proc.categoria}
                          </span>
                        </div>
                      )}

                      <div className="p-4 space-y-2">
                        {!proc.imagem_url && (
                          <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                            {proc.categoria}
                          </span>
                        )}

                        <h4 className="text-sm font-bold text-slate-900 leading-snug">
                          {proc.nome}
                        </h4>

                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {proc.descricao}
                        </p>

                        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
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
                            <span>Selecionado no Orçamento</span>
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
          <div className="lg:col-span-5 xl:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm sticky top-6 space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Resumo do Orçamento</span>
              </h3>
              <span className="text-xs font-semibold px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                {selectedProcedures.length} item{selectedProcedures.length !== 1 ? 's' : ''}
              </span>
            </div>

            {selectedProcedures.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                <Sparkles className="w-8 h-8 text-indigo-400 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">Seu orçamento está vazio</p>
                <p className="text-[11px] text-slate-400">
                  Clique em <strong>"+ Adicionar ao Orçamento"</strong> nos procedimentos ao lado para calcular os valores.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
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
              <div className="space-y-3 bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold text-slate-700">Investimento Estimado:</span>
                  <span className="text-xl font-extrabold text-slate-900 font-mono">
                    R$ {totalEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-indigo-200/60 text-xs">
                  <div className="flex items-center justify-between text-emerald-800 font-semibold">
                    <span>À vista com 5% de desconto (Pix):</span>
                    <span>R$ {totalComDescontoPix.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center justify-between text-indigo-900 font-medium">
                    <span>Ou parcelado no cartão:</span>
                    <span className="font-bold">10x de R$ {valorParcela10x.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
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
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Preferência de Horário para Atendimento
                </label>
                <select
                  value={periodoPreferencia}
                  onChange={(e) => setPeriodoPreferencia(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 font-medium cursor-pointer"
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
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
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

      {/* TAB 2: SOLICITAÇÃO DIRETA DE AGENDAMENTO */}
      {activeTab === 'agendamento' && (
        <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Solicitação Direta de Consulta / Avaliação</h3>
              <p className="text-xs text-slate-500">
                Escolha o procedimento e o melhor dia. Nossa recepção entrará em contato para confirmar o horário exato.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmitDirectBooking} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Procedimento Desejado *
              </label>
              <select
                required
                value={bookingProcedureId}
                onChange={(e) => setBookingProcedureId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 font-medium"
              >
                <option value="">Selecione um procedimento...</option>
                {procedimentos.filter(p => p.ativo).map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nome} — R$ {(p.valor_promocional || p.valor_tabela).toLocaleString('pt-BR')} ({p.duracao_minutos} min)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Data Preferencial *
                </label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Turno / Período *
                </label>
                <select
                  value={bookingPeriod}
                  onChange={(e) => setBookingPeriod(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 font-medium"
                >
                  <option value="manha">Manhã (08h às 12h)</option>
                  <option value="tarde">Tarde (13h às 18h)</option>
                  <option value="noite">Noite (após 18h)</option>
                  <option value="sabado">Sábado (08h às 14h)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Profissional de Preferência
              </label>
              <select
                value={bookingProfessionalId}
                onChange={(e) => setBookingProfessionalId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 font-medium"
              >
                <option value="qualquer">Qualquer profissional disponível (Mais rápido)</option>
                {profissionais.filter(u => u.status === 'ativo' && u.role !== 'cliente').map(p => (
                  <option key={p.id} value={p.id}>
                    {p.nome} — {p.especialidade || p.cargo || 'Especialista'}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Observações ou Dúvidas
              </label>
              <textarea
                rows={3}
                placeholder="Informe se já fez o procedimento antes, se tem alergias ou alguma dúvida específica..."
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={!bookingProcedureId}
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-sm font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Enviar Solicitação de Agendamento</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: LOCALIZAÇÃO & GOOGLE MAPS */}
      {activeTab === 'mapa' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Clinic Information Card */}
          <div className="lg:col-span-5 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{clinicaConfig?.nome || 'EstéticaOS Clínica'}</h3>
                <p className="text-xs text-slate-500">Localização & Contato da Unidade</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-slate-700">
              <div className="flex items-start gap-2.5">
                <Building2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-slate-800">Endereço Completo:</span>
                  <span className="text-slate-600 leading-relaxed">{clinicaEndereco}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-slate-800">Telefone / WhatsApp:</span>
                  <span className="text-slate-600">{clinicaConfig?.telefone || '(11) 98765-4321'}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-slate-800">Horário de Funcionamento:</span>
                  <span className="text-slate-600">Segunda a Sexta: 08h às 20h • Sábados: 08h às 15h</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Compass className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-slate-800">Facilidades & Acessibilidade:</span>
                  <span className="text-slate-600">Estacionamento conveniado no local, ambiente climatizado e acessibilidade para PCD.</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <a
                href={googleMapsRouteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Navigation className="w-4 h-4" />
                <span>Traçar Rota no Google Maps</span>
              </a>
            </div>
          </div>

          {/* Interactive Google Map Frame */}
          <div className="lg:col-span-7 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-3">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-600" />
                <span>Visualização no Google Maps</span>
              </span>
              <a
                href={googleMapsRouteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-indigo-600 hover:underline font-semibold flex items-center gap-1"
              >
                <span>Abrir em Tela Cheia</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="w-full h-96 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 relative">
              <iframe
                title="Google Maps Clínica"
                src={googleMapsEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

        </div>
      )}

      {/* TAB 4: MEUS ORÇAMENTOS E AGENDAMENTOS SOLICITADOS (PACIENTE) */}
      {activeTab === 'meus_orcamentos' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Histórico de Solicitações do Paciente</h3>
              <p className="text-xs text-slate-400">
                Acompanhe o status e a resposta da clínica para cada orçamento ou agendamento solicitado.
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
                pendente: 'bg-blue-100 text-blue-800 border-blue-200',
              };

              const statusLabels = {
                novo: 'Recebido / Aguardando Contato',
                em_analise: 'Em Análise Médica',
                orcamento_enviado: 'Respondido no WhatsApp',
                agendado: 'Agendamento Confirmado',
                pendente: 'Pendente de Confirmação',
              };

              return (
                <div key={quote.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColors[quote.status || 'novo']}`}>
                        {statusLabels[quote.status || 'novo']}
                      </span>
                      <p className="text-xs text-slate-400 mt-1">
                        Solicitado em: {new Date(quote.data_solicitacao).toLocaleString('pt-BR')}
                      </p>
                    </div>

                    <span className="text-base font-bold font-mono text-slate-900">
                      R$ {(quote.valor_total_estimado || quote.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                    <p className="font-bold text-slate-700 mb-1">Procedimentos Selecionados:</p>
                    {(quote.procedimentos_selecionados || []).map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-slate-600">
                        <span>• {p.nome}</span>
                        <span className="font-mono">R$ {p.valor_unitario.toLocaleString('pt-BR')}</span>
                      </div>
                    ))}
                    {!quote.procedimentos_selecionados?.length && quote.procedimento_nome && (
                      <div className="flex items-center justify-between text-slate-600">
                        <span>• {quote.procedimento_nome}</span>
                        <span className="font-mono">R$ {(quote.valor_total || 0).toLocaleString('pt-BR')}</span>
                      </div>
                    )}
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

                    {onDeleteOrcamento && (
                      <button
                        type="button"
                        onClick={() => setOrcamentoToDelete(quote)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Cancelar / Excluir esta solicitação"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>

          {myQuotes.length === 0 && (
            <div className="bg-white p-12 text-center rounded-3xl border border-slate-200">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-base font-bold text-slate-800">Nenhum orçamento solicitado ainda</h4>
              <p className="text-xs text-slate-500 mt-1">
                Acesse a aba <strong>Simulador & Vitrine</strong> para montar seu primeiro plano de tratamento.
              </p>
            </div>
          )}

        </div>
      )}

      {/* TAB 5: GESTÃO DA CLÍNICA / LEADS DE ORÇAMENTO (EQUIPE) */}
      {activeTab === 'gestao_clinica' && isAdmin && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Painel de Atendimento de Orçamentos & Leads (Recepção & Vendas)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Todas as solicitações de pacientes captadas através do Portal. Responda no WhatsApp ou converta em agendamentos na agenda.
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
                      <span>{(quote.procedimentos_selecionados || []).length} Procedimento(s):</span>
                      <span className="font-mono text-indigo-700">
                        R$ {(quote.valor_total_estimado || quote.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    {(quote.procedimentos_selecionados || []).map((p, i) => (
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
                    className="text-xs font-semibold bg-slate-100 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-hidden cursor-pointer"
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

                    {onDeleteOrcamento && (
                      <button
                        type="button"
                        onClick={() => setOrcamentoToDelete(quote)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Excluir solicitação de orçamento"
                      >
                        <Trash2 className="w-4 h-4" />
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
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 sm:p-7 text-center space-y-4">
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
                  Cadastre-se ou entre em 1 clique para salvar seus orçamentos e solicitações de agendamento.
                </p>
              </div>

              {/* Instant Google Connect Button */}
              <button
                onClick={() => handleGoogleLogin('mock')}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 rounded-xl shadow-xs text-xs sm:text-sm font-bold text-slate-700 transition-all cursor-pointer"
              >
                <img
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80"
                  alt="Avatar"
                  className="w-6 h-6 rounded-full object-cover"
                />
                <span>Continuar como Fernanda (paciente.fernanda@exemplo.com)</span>
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
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
                <input
                  type="email"
                  placeholder="Seu email Google (@gmail.com)"
                  value={customEmailInput}
                  onChange={(e) => setCustomEmailInput(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
                <input
                  type="tel"
                  placeholder="WhatsApp para contato (ex: 11 99999-8888)"
                  value={customPhoneInput}
                  onChange={(e) => setCustomPhoneInput(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />

                <button
                  onClick={() => handleGoogleLogin('custom')}
                  disabled={!customNameInput.trim() || !customEmailInput.trim()}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
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

      {/* SUCCESS CONFIRMATION MODAL - QUOTE */}
      {showSuccessModal && lastSubmittedQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6 text-center space-y-4">
            
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Orçamento Solicitado com Sucesso!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Olá <strong>{lastSubmittedQuote.paciente_nome}</strong>, sua solicitação foi registrada no sistema da clínica.
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-left text-xs space-y-1.5">
              <div className="flex justify-between font-bold text-slate-800">
                <span>Total Estimado:</span>
                <span className="font-mono text-indigo-700">
                  R$ {(lastSubmittedQuote.valor_total_estimado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <p className="text-slate-500">
                Procedimentos: {(lastSubmittedQuote.procedimentos_selecionados || []).map(p => p.nome).join(', ')}
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={generateWhatsAppLink(lastSubmittedQuote)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all"
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
                Ver Minhas Solicitações
              </button>
            </div>

          </div>
        </div>
      )}

      {/* SUCCESS CONFIRMATION MODAL - DIRECT BOOKING */}
      {bookingSuccessModal && lastSubmittedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6 text-center space-y-4">
            
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100">
              <CalendarCheck className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Agendamento Solicitado!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Olá <strong>{lastSubmittedBooking.pacienteNome}</strong>, sua solicitação de consulta foi enviada à recepção.
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-left text-xs space-y-1.5">
              <p className="font-bold text-slate-800">Procedimento: {lastSubmittedBooking.procedimentoNome}</p>
              <p className="text-slate-600">Data Preferencial: {lastSubmittedBooking.data} ({lastSubmittedBooking.periodo})</p>
              <p className="text-slate-600">Profissional: {lastSubmittedBooking.profissionalNome}</p>
              <p className="font-mono text-blue-700 font-bold">Investimento: R$ {lastSubmittedBooking.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setBookingSuccessModal(false);
                  setActiveTab('meus_orcamentos');
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-colors cursor-pointer"
              >
                Acompanhar Minha Solicitação
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Delete Quote / Lead Confirmation Modal */}
      {orcamentoToDelete && (
        <DeleteConfirmModal
          isOpen={!!orcamentoToDelete}
          onClose={() => setOrcamentoToDelete(null)}
          onConfirm={() => {
            if (orcamentoToDelete && onDeleteOrcamento) {
              onDeleteOrcamento(orcamentoToDelete.id);
            }
            setOrcamentoToDelete(null);
          }}
          title="Excluir Orçamento / Lead"
          itemType="Solicitação de Orçamento"
          itemName={`${orcamentoToDelete.paciente_nome} - R$ ${(orcamentoToDelete.valor_total_estimado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          description="Esta ação removerá a solicitação de orçamento do funil de atendimento e do histórico do paciente."
        />
      )}

    </div>
  );
};
