import React, { useState, useEffect, useMemo } from 'react';
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
  ChevronLeft,
  Eye,
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
  Building2,
  Image as ImageIcon
} from 'lucide-react';
import { 
  ProcedimentoClinico, 
  SolicitacaoOrcamento, 
  PacienteGoogleProfile, 
  UsuarioEquipe, 
  ClinicaConfig,
  CATEGORIAS_PROCEDIMENTOS_PERMITIDAS
} from '../types';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { 
  loginWithFirebaseGoogle, 
  logoutFirebase, 
  onFirebaseAuthStateChange, 
  isUserAdminTotal, 
  isUserAdminLocalOrTotal,
  saveClientPortalProfile,
  fetchClientPortalProfile,
  formatPhoneBR,
  isValidPhoneBR,
  getGestoresLocaisParaSelecao
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
  onGoToAgendaSemanal?: (targetDate?: string) => void;
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
  onGoToAgendaSemanal,
}) => {
  const isAdmin = !currentUser || isUserAdminTotal(currentUser) || isUserAdminLocalOrTotal(currentUser) || currentUser.role === 'admin_master' || currentUser.role === 'admin_total' || currentUser.role === 'admin' || currentUser.role === 'gestor' || currentUser.role === 'recepcao';
  const gestoresLocais = useMemo(() => getGestoresLocaisParaSelecao(profissionais), [profissionais]);
  
  // Active Tab: simulador (Orçamento) | agendamento | mapa | meus_orcamentos | gestao_clinica
  const [activeTab, setActiveTab] = useState<'simulador' | 'agendamento' | 'mapa' | 'meus_orcamentos' | 'gestao_clinica'>('simulador');
  const [portalMode, setPortalMode] = useState<'orcamento' | 'agendamento'>('orcamento');
  const [categoryFilter, setCategoryFilter] = useState('todos');
  const [search, setSearch] = useState('');
  const [orcamentoToDelete, setOrcamentoToDelete] = useState<SolicitacaoOrcamento | null>(null);

  useEffect(() => {
    // Only restrict 'gestao_clinica' from regular clients, leaving simulador and agendamento fully accessible
    if (currentUser?.role === 'cliente' && activeTab === 'gestao_clinica') {
      setActiveTab('simulador');
    }
  }, [currentUser?.role, activeTab]);

  // Google Authentication State
  const [googleProfile, setGoogleProfile] = useState<PacienteGoogleProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Onboarding Obrigatório para Retorno (Nome + Telefone/WhatsApp)
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [onboardingNome, setOnboardingNome] = useState('');
  const [onboardingTelefone, setOnboardingTelefone] = useState('');
  const [onboardingError, setOnboardingError] = useState('');
  const [isSavingOnboarding, setIsSavingOnboarding] = useState(false);

  // Procedure Details & Photo Carousel Modal
  const [procedureForDetails, setProcedureForDetails] = useState<ProcedimentoClinico | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);

  // Sync with Firebase Auth state in real-time and check profile persistence
  useEffect(() => {
    // Se o usuário logado no sistema já for do perfil cliente, inicializa o perfil com seus dados
    if (currentUser?.role === 'cliente' && !googleProfile) {
      setGoogleProfile({
        id: currentUser.id,
        nome: currentUser.nome,
        email: currentUser.email || '',
        avatar_url: currentUser.avatar_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
        telefone: currentUser.telefone || '',
      });
    }

    const unsubscribe = onFirebaseAuthStateChange(async (user) => {
      if (user) {
        // Busca perfil salvo no Firestore / Cache
        const storedProfile = await fetchClientPortalProfile(user.uid);
        const nome = storedProfile?.nome || user.displayName || 'Paciente Google';
        const telefone = storedProfile?.telefone || '';
        const email = user.email || storedProfile?.email || '';
        const avatar_url = user.photoURL || storedProfile?.avatar_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80';

        const profile: PacienteGoogleProfile = {
          id: user.uid,
          nome,
          email,
          avatar_url,
          telefone,
        };

        setGoogleProfile(profile);

        // Se perfil não possuir telefone cadastrado válido, dispara o onboarding obrigatório
        if (!telefone || !isValidPhoneBR(telefone)) {
          setOnboardingNome(nome);
          setOnboardingTelefone(formatPhoneBR(telefone));
          setOnboardingError('');
          setIsOnboardingModalOpen(true);
        }
      }
    });
    return () => unsubscribe();
  }, [currentUser]);

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

  const categories = useMemo(() => {
    const customCats = Array.from(new Set(procedimentos.map(p => p.categoria))).filter(
      (c): c is string => Boolean(c) && !CATEGORIAS_PROCEDIMENTOS_PERMITIDAS.includes(c as any)
    );
    const sortedCategories = [
      ...CATEGORIAS_PROCEDIMENTOS_PERMITIDAS,
      ...customCats
    ].sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true, sensitivity: 'base' }));

    return ['todos', ...sortedCategories];
  }, [procedimentos]);

  const filteredProcedures = procedimentos.filter(p => {
    if (p.ativo === false) return false;
    if (p.destaque_portal === false) return false;
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
        const storedProfile = await fetchClientPortalProfile(user.uid);
        const nome = storedProfile?.nome || user.displayName || 'Paciente Google';
        const telefone = storedProfile?.telefone || '';
        const email = user.email || storedProfile?.email || '';
        const avatar_url = user.photoURL || storedProfile?.avatar_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80';

        const profile: PacienteGoogleProfile = {
          id: user.uid,
          nome,
          email,
          avatar_url,
          telefone,
        };

        setGoogleProfile(profile);
        setIsGoogleLoginModalOpen(false);

        // Se não possui telefone válido, redireciona/abre onboarding obrigatório
        if (!telefone || !isValidPhoneBR(telefone)) {
          setOnboardingNome(nome);
          setOnboardingTelefone(formatPhoneBR(telefone));
          setOnboardingError('');
          setIsOnboardingModalOpen(true);
        } else {
          await saveClientPortalProfile(profile);
        }
      }
    } catch (err: any) {
      console.warn('[Firebase Auth] Abrindo modal para identificação:', err);
      setAuthError(err.message || 'Não foi possível conectar com o Google no momento.');
      setIsGoogleLoginModalOpen(true);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleGoogleLogin = async (useMockOrCustom: 'mock' | 'custom') => {
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
      if (!customNameInput.trim()) return;
      const cleanPhone = formatPhoneBR(customPhoneInput.trim());
      const cleanEmail = customEmailInput.trim() || `${customNameInput.trim().toLowerCase().replace(/[^a-z0-9]/g, '') || 'paciente'}@portal.cliente`;
      profile = {
        id: `pac-${Date.now()}`,
        nome: customNameInput.trim(),
        email: cleanEmail,
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        telefone: cleanPhone,
      };
    }

    setGoogleProfile(profile);
    setIsGoogleLoginModalOpen(false);

    if (!profile.telefone || !isValidPhoneBR(profile.telefone)) {
      setOnboardingNome(profile.nome);
      setOnboardingTelefone(formatPhoneBR(profile.telefone || ''));
      setIsOnboardingModalOpen(true);
    } else {
      await saveClientPortalProfile(profile);
    }
  };

  // Salvar Onboarding de Contato Obrigatório
  const handleSaveOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardingNome.trim()) {
      setOnboardingError('Por favor, informe seu nome completo.');
      return;
    }
    if (!isValidPhoneBR(onboardingTelefone)) {
      setOnboardingError('Por favor, digite um WhatsApp válido com DDD (10 ou 11 dígitos, ex: (11) 99999-8888).');
      return;
    }

    setIsSavingOnboarding(true);
    setOnboardingError('');

    try {
      const updatedProfile: PacienteGoogleProfile = {
        id: googleProfile?.id || `goog-${Date.now()}`,
        nome: onboardingNome.trim(),
        email: googleProfile?.email || customEmailInput.trim() || `${onboardingNome.toLowerCase().replace(/[^a-z0-9]/g, '')}@portal.cliente`,
        avatar_url: googleProfile?.avatar_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
        telefone: onboardingTelefone.trim(),
      };

      await saveClientPortalProfile(updatedProfile);
      setGoogleProfile(updatedProfile);
      setIsOnboardingModalOpen(false);
    } catch (err) {
      console.error('[handleSaveOnboarding error]', err);
      setOnboardingError('Erro ao salvar os dados. Tente novamente.');
    } finally {
      setIsSavingOnboarding(false);
    }
  };

  // Direct WhatsApp link for a specific procedure in the showcase
  const generateDirectProcWhatsAppLink = (proc: ProcedimentoClinico) => {
    const rawPhone = clinicaConfig?.telefone ? clinicaConfig.telefone.replace(/\D/g, '') : '5511987654321';
    const phone = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`;
    const clientName = googleProfile?.nome || (currentUser?.role === 'cliente' ? currentUser?.nome : '') || '';
    const clientPhone = googleProfile?.telefone || '';
    const preco = proc.valor_promocional || proc.valor_tabela;
    
    const idGreeting = clientName
      ? `Olá, meu nome é *${clientName}*${clientPhone ? ` (Tel: *${clientPhone}*)` : ''}.`
      : 'Olá!';

    const msg = `${idGreeting}\n\nTenho interesse no procedimento *${proc.nome}* no *${clinicaConfig?.nome || 'Studio'}*:\n• *Valor Estimado:* R$ ${preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n• *Duração Estimada:* ${proc.duracao_minutos} min\n\nGostaria de solicitar um orçamento e saber os horários disponíveis para avaliação! ✨`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  const handleGoogleLogout = async () => {
    await logoutFirebase();
    setGoogleProfile(null);
  };

  // Submit quote request with protection and WhatsApp integration
  const handleSubmitQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProcedures.length === 0) return;

    // Proteção de rota / fluxo: usuário precisa estar identificado
    if (!googleProfile) {
      setIsGoogleLoginModalOpen(true);
      return;
    }

    // Proteção de rota / fluxo: usuário precisa ter completado nome e telefone de contato
    if (!googleProfile.telefone || !isValidPhoneBR(googleProfile.telefone)) {
      setOnboardingNome(googleProfile.nome || '');
      setOnboardingTelefone(formatPhoneBR(googleProfile.telefone || ''));
      setOnboardingError('Por favor, informe seu telefone / WhatsApp para que nossa equipe possa retornar seu orçamento.');
      setIsOnboardingModalOpen(true);
      return;
    }

    // 1. Persistência Interna: Registrar o pedido com status "Pendente"
    const payload: Omit<SolicitacaoOrcamento, 'id' | 'data_solicitacao'> = {
      paciente_nome: googleProfile.nome,
      paciente_email: googleProfile.email,
      paciente_telefone: googleProfile.telefone,
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
      status: 'pendente', // Status "Pendente" conforme especificação
    };

    onCriarOrcamento(payload);

    const generatedQuote: SolicitacaoOrcamento = {
      ...payload,
      id: `orc-${Date.now()}`,
      data_solicitacao: new Date().toISOString(),
    };

    setLastSubmittedQuote(generatedQuote);
    setShowSuccessModal(true);

    // 2. Integração com WhatsApp: Redirecionamento amigável com mensagem pré-formatada
    const whatsAppUrl = generateWhatsAppLink(generatedQuote);
    try {
      window.open(whatsAppUrl, '_blank');
    } catch {
      // Ignorar bloqueio de popup caso o navegador exija clique direto
    }

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

    if (!googleProfile.telefone || !isValidPhoneBR(googleProfile.telefone)) {
      setOnboardingNome(googleProfile.nome || '');
      setOnboardingTelefone(formatPhoneBR(googleProfile.telefone || ''));
      setOnboardingError('Informe seu WhatsApp para confirmarmos o agendamento.');
      setIsOnboardingModalOpen(true);
      return;
    }

    const selectedProc = procedimentos.find(p => p.id === bookingProcedureId);
    const selectedProf = gestoresLocais.find(p => p.id === bookingProfessionalId) || profissionais.find(p => p.id === bookingProfessionalId);
    const valorEstimado = selectedProc ? (selectedProc.valor_promocional || selectedProc.valor_tabela) : 0;

    const finalProfId = selectedProc?.profissional_id || selectedProf?.id || gestoresLocais[0]?.id || (profissionais[0]?.id || 'prof-geral');
    const finalProfNome = selectedProc?.profissional_nome || selectedProf?.nome || gestoresLocais[0]?.nome || (profissionais[0]?.nome || 'Equipe Médica');

    // Agendamento direto na clínica (vai direto para a agenda semanal da clínica)
    if (onCriarAgendamento && selectedProc) {
      const horaPadrao = bookingPeriod === 'manha' ? '09:00' : bookingPeriod === 'tarde' ? '14:30' : '18:30';
      onCriarAgendamento({
        pacienteId: `pac-${Date.now()}`,
        pacienteNome: googleProfile.nome,
        pacienteTelefone: googleProfile.telefone,
        pacienteEmail: googleProfile.email,
        procedimentoId: selectedProc.id,
        procedimentoNome: selectedProc.nome,
        profissionalId: finalProfId,
        profissionalNome: finalProfNome,
        data: bookingDate,
        hora: horaPadrao,
        duracaoMinutos: selectedProc.duracao_minutos || 45,
        valor: valorEstimado,
        status: 'confirmado',
        observacoes: `[Agendamento via Portal do Cliente] ${bookingNotes ? bookingNotes : ''}`,
        origem_portal: true,
        necessita_cadastro_completo: true,
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

  // Generate WhatsApp Direct link strictly conforming to requirements:
  // Saudação e identificação: "Olá, meu nome é [Nome] (Tel: [Telefone])."
  // Lista de procedimentos de interesse.
  // Mensagem/dúvida adicional (se houver).
  // Redirecionar o cliente para iniciar a conversa no WhatsApp oficial da clínica.
  const generateWhatsAppLink = (quote: SolicitacaoOrcamento) => {
    const rawPhone = clinicaConfig?.telefone ? clinicaConfig.telefone.replace(/\D/g, '') : '5511987654321';
    const phone = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`;
    const procList = (quote.procedimentos_selecionados || []).map(p => `• *${p.nome}* (R$ ${p.valor_unitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`).join('\n');
    const details = quote.queixa_principal ? `\n\n*Observações / Dúvidas:*\n${quote.queixa_principal}` : '';
    
    const msg = `Olá, meu nome é *${quote.paciente_nome}* (Tel: *${quote.paciente_telefone}*).\n\nTenho interesse nos seguintes procedimentos no *${clinicaConfig?.nome || 'Studio'}*:\n${procList || `• ${quote.procedimento_nome || 'Consulta Avaliativa'}`}\n\n*Total Estimado:* R$ ${(quote.valor_total_estimado || quote.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}${details}\n\nGostaria de solicitar o orçamento e saber as disponibilidades de agendamento! ✨`;
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
              <span>{currentUser.role === 'cliente' ? 'Área do Cliente' : 'Portal de Autoatendimento'} • {clinicaConfig?.nome || 'AuraEstética Studio'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {currentUser.role === 'cliente' ? 'Procedimentos & Orçamentos' : 'Simule seu Orçamento & Agende sua Consulta'}
            </h2>
            <p className="text-xs sm:text-sm text-indigo-100/80 leading-relaxed">
              {currentUser.role === 'cliente' 
                ? 'Consulte os procedimentos disponíveis no studio, confira valores e detalhes, e solicite seus orçamentos diretamente com nossa equipe.'
                : 'Explore os procedimentos ofertados pela clínica, calcule o investimento em tempo real com condições de parcelamento sem juros, verifique a localização no Google Maps e solicite seu agendamento direto com a equipe médica.'}
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

      {/* Seletor de Intenção do Cliente: Orçamento vs Agendamento do Procedimento */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-200/60">
                Atendimento Personalizado
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                Portal do Cliente
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
              Como você prefere prosseguir com seu atendimento?
            </h3>
            <p className="text-xs text-slate-500">
              Escolha entre solicitar uma cotação de <strong>orçamento</strong> ou realizar o <strong>agendamento direto</strong> na agenda semanal da clínica.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {/* Opção 1: Orçamento */}
          <div 
            onClick={() => {
              setPortalMode('orcamento');
              setActiveTab('simulador');
            }}
            className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
              activeTab === 'simulador'
                ? 'border-indigo-600 bg-indigo-50/40 shadow-sm ring-2 ring-indigo-500/20'
                : 'border-slate-200 hover:border-indigo-300 bg-white hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                activeTab === 'simulador' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">Solicitar Orçamento</h4>
                  {activeTab === 'simulador' && (
                    <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                      Ativo
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Simule valores e envie seu pedido com o <strong>procedimento selecionado, nome, contato e e-mail</strong> diretamente para a <strong>gestão da clínica e leads</strong> analisar.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Aparece na gestão e leads</span>
              <span className="font-bold text-indigo-600 flex items-center gap-1">
                Simular Orçamento <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Opção 2: Agendamento */}
          <div 
            onClick={() => {
              setPortalMode('agendamento');
              setActiveTab('agendamento');
            }}
            className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
              activeTab === 'agendamento'
                ? 'border-blue-600 bg-blue-50/40 shadow-sm ring-2 ring-blue-500/20'
                : 'border-slate-200 hover:border-blue-300 bg-white hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                activeTab === 'agendamento' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                <CalendarCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">Agendamento do Procedimento</h4>
                  {activeTab === 'agendamento' && (
                    <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                      Ativo
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Vai <strong>direto para a agenda semanal da clínica</strong>. Ao comparecer na recepção, seguiremos com o preenchimento do seu <strong>cadastro completo</strong>.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Agenda semanal & recepção</span>
              <span className="font-bold text-blue-600 flex items-center gap-1">
                Agendar Horário <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-thin">
        <button
          onClick={() => {
            setPortalMode('orcamento');
            setActiveTab('simulador');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'simulador'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4 text-indigo-400" />
          <span>Solicitar Orçamento</span>
          {selectedProcedures.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] bg-indigo-500 text-white rounded-full font-bold">
              {selectedProcedures.length}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setPortalMode('agendamento');
            setActiveTab('agendamento');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'agendamento'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CalendarCheck className="w-4 h-4 text-blue-300" />
          <span>Agendamento do Procedimento</span>
        </button>

        <button
          onClick={() => setActiveTab('meus_orcamentos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'meus_orcamentos'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Minhas Solicitações ({myQuotes.length})</span>
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
          <span>Localização & Endereço</span>
        </button>

        {isAdmin && currentUser.role !== 'cliente' && (
          <button
            onClick={() => setActiveTab('gestao_clinica')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ml-auto ${
              activeTab === 'gestao_clinica'
                ? 'bg-indigo-700 text-white shadow-sm'
                : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Gestão da Clínica e Leads ({orçamentos.length})</span>
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
                      {(() => {
                        const coverImg = (proc.imagens_galeria && proc.imagens_galeria.length > 0)
                          ? proc.imagens_galeria[0]
                          : proc.imagem_url;
                        const totalFotos = proc.imagens_galeria?.length || (proc.imagem_url ? 1 : 0);

                        if (!coverImg) return null;

                        return (
                          <div 
                            onClick={() => {
                              setProcedureForDetails(proc);
                              setActivePhotoIndex(0);
                            }}
                            className="h-40 w-full relative overflow-hidden bg-slate-100 cursor-pointer group"
                            title="Clique para ver fotos e detalhes completos"
                          >
                            <img
                              src={coverImg}
                              alt={proc.nome}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-linear-to-t from-slate-950/75 via-slate-950/20 to-transparent" />
                            <span className="absolute bottom-2.5 left-3 text-[10px] font-bold text-white uppercase tracking-wider bg-slate-900/80 px-2 py-0.5 rounded-md backdrop-blur-xs">
                              {proc.categoria}
                            </span>
                            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                              {totalFotos > 1 && (
                                <span className="text-[10px] font-bold text-white bg-slate-900/80 px-2 py-0.5 rounded-full backdrop-blur-xs">
                                  📷 {totalFotos} fotos
                                </span>
                              )}
                              <span className="text-[10px] font-bold text-white bg-indigo-600/90 hover:bg-indigo-600 px-2 py-0.5 rounded-full backdrop-blur-xs flex items-center gap-1">
                                <Eye className="w-3 h-3" /> Ver Detalhes
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                      <div className="p-4 space-y-2">
                        {!(proc.imagens_galeria && proc.imagens_galeria.length > 0) && !proc.imagem_url && (
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                              {proc.categoria}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setProcedureForDetails(proc);
                                setActivePhotoIndex(0);
                              }}
                              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3 h-3" /> Detalhes
                            </button>
                          </div>
                        )}

                        <h4 
                          onClick={() => {
                            setProcedureForDetails(proc);
                            setActivePhotoIndex(0);
                          }}
                          className="text-sm font-bold text-slate-900 leading-snug cursor-pointer hover:text-indigo-600 transition-colors"
                        >
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

                    <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleProcedure(proc)}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? 'bg-slate-900 text-white hover:bg-slate-800'
                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                        }`}
                        title={isSelected ? 'Remover da simulação de orçamento' : 'Adicionar à simulação de orçamento'}
                      >
                        {isSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>No Orçamento</span>
                          </>
                        ) : (
                          <>
                            <FileText className="w-3.5 h-3.5" />
                            <span>Orçamento</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setBookingProcedureId(proc.id);
                          setPortalMode('agendamento');
                          setActiveTab('agendamento');
                          window.scrollTo({ top: 400, behavior: 'smooth' });
                        }}
                        className="flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-2xs"
                        title="Agendar diretamente na agenda semanal da clínica"
                      >
                        <CalendarCheck className="w-3.5 h-3.5" />
                        <span>Agendar</span>
                      </button>

                      <a
                        href={generateDirectProcWhatsAppLink(proc)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-2xs hover:shadow-xs shrink-0"
                        title="Falar direto no WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>

          {/* Right Column: Quote Summary & Order Form */}
          <div id="resumo-orcamento" className="lg:col-span-5 xl:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm sticky top-6 space-y-5">
            
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
                <FileText className="w-4 h-4" />
                <span>Enviar Orçamento para Gestão da Clínica</span>
              </button>

              <div className="bg-indigo-50/70 p-2.5 rounded-xl border border-indigo-100 text-[11px] text-indigo-900 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p>
                  Esta solicitação não entra na agenda e <strong>aparece na gestão da clínica e leads</strong> informando o procedimento selecionado, seu nome, contato e e-mail.
                </p>
              </div>

              <p className="text-[10px] text-center text-slate-400 leading-tight">
                🔒 Seus dados são protegidos conforme a LGPD e enviados com segurança à equipe da clínica.
              </p>
            </form>

          </div>

        </div>
      )}

      {/* TAB 2: AGENDAMENTO DO PROCEDIMENTO NA AGENDA SEMANAL */}
      {activeTab === 'agendamento' && (
        <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
                  Agenda Semanal
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                  Cadastro na Recepção
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-1">Agendamento do Procedimento</h3>
              <p className="text-xs text-slate-500">
                Seu horário será inserido <strong>direto na agenda semanal da clínica</strong>. Ao comparecer na recepção, seguiremos com seu cadastro completo.
              </p>
            </div>
          </div>

          <div className="bg-blue-50/80 border border-blue-200 p-3.5 rounded-2xl flex items-start gap-3 text-xs text-blue-900">
            <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="block font-bold text-blue-950">Aviso Importante:</strong>
              <p className="text-blue-800 text-[11px] leading-relaxed">
                Ao selecionar o agendamento, seu horário vai direto para a grade semanal da clínica. Ao ser recepcionado(a) no dia do atendimento, nossa equipe preencherá seu <strong>cadastro completo</strong> (documentos, termo e ficha de anamnese).
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

            {/* Profissional Responsável (Gestor Local) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Profissional Responsável
                </label>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  Gestor Local
                </span>
              </div>
              {(() => {
                const selProc = procedimentos.find(p => p.id === bookingProcedureId);
                if (selProc?.profissional_nome) {
                  return (
                    <div className="w-full px-3.5 py-2.5 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-600" />
                        <span>{selProc.profissional_nome}</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold text-indigo-700 bg-white border border-indigo-200 px-2 py-0.5 rounded-md">
                        Definido no Procedimento
                      </span>
                    </div>
                  );
                }
                return (
                  <select
                    value={bookingProfessionalId}
                    onChange={(e) => setBookingProfessionalId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 font-medium"
                  >
                    {gestoresLocais.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nome} — {p.cargo || 'Gestor Local'}
                      </option>
                    ))}
                  </select>
                );
              })()}
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
              <span>Confirmar e Lançar na Agenda Semanal</span>
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
              <div key={quote.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  {/* Lead Header: Nome e Data */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={quote.paciente_avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'}
                        alt={quote.paciente_nome}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                          Lead do Portal
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-0.5">{quote.paciente_nome}</h4>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {new Date(quote.data_solicitacao).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  {/* Dados de Contato: Telefone e Email */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Número de Contato:</span>
                      <a 
                        href={`tel:${quote.paciente_telefone}`} 
                        className="font-bold text-slate-800 hover:text-indigo-600 flex items-center gap-1 font-mono text-[11px]"
                      >
                        <Phone className="w-3 h-3 text-emerald-600" />
                        {quote.paciente_telefone || 'Não informado'}
                      </a>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">E-mail Informado:</span>
                      <a 
                        href={`mailto:${quote.paciente_email}`} 
                        className="font-medium text-slate-700 hover:text-indigo-600 truncate max-w-[170px] flex items-center gap-1 text-[11px]"
                        title={quote.paciente_email}
                      >
                        <Mail className="w-3 h-3 text-indigo-500 shrink-0" />
                        {quote.paciente_email || 'Não informado'}
                      </a>
                    </div>
                  </div>

                  {/* Procedimento Selecionado */}
                  <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/80 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between font-bold text-indigo-950">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Procedimento Selecionado:</span>
                      </span>
                      <span className="font-mono text-indigo-700 font-bold">
                        R$ {(quote.valor_total_estimado || quote.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    {(quote.procedimentos_selecionados || []).length > 0 ? (
                      (quote.procedimentos_selecionados || []).map((p, i) => (
                        <div key={i} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-indigo-100 text-[11px]">
                          <span className="font-semibold text-slate-800">• {p.nome}</span>
                          <span className="text-slate-500 font-mono text-[10px]">R$ {p.valor_unitario?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-slate-600 italic">Procedimento geral de avaliação</p>
                    )}
                  </div>

                  {quote.queixa_principal && (
                    <div className="text-xs text-slate-600 bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/60 space-y-0.5">
                      <strong className="block text-[11px] text-amber-900 font-bold">Queixa / Objetivos informados:</strong>
                      <p className="text-[11px] text-amber-950 leading-relaxed">{quote.queixa_principal}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                    <span>Horário Preferido: <strong>{quote.periodo_preferencia || 'Flexível'}</strong></span>
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
                <h3 className="text-lg font-bold text-slate-900">Identificação do Cliente</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Acesse com sua conta Google ou faça o cadastro rápido com Nome e WhatsApp.
                </p>
              </div>

              {/* Instant Google Connect Button */}
              <div className="space-y-2">
                <button
                  onClick={handleFirebaseGoogleSignIn}
                  disabled={isAuthLoading}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-300 rounded-xl shadow-xs text-xs sm:text-sm font-bold text-slate-700 transition-all cursor-pointer disabled:opacity-60"
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

              <div className="flex items-center gap-3 text-xs text-slate-400">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[11px] font-bold uppercase tracking-wider">ou cadastro rápido sem senha</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <div className="space-y-3 text-left">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Seu nome e sobrenome"
                    value={customNameInput}
                    onChange={(e) => setCustomNameInput(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    WhatsApp / Telefone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="(11) 99999-8888"
                    value={customPhoneInput}
                    onChange={(e) => setCustomPhoneInput(formatPhoneBR(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    E-mail (Opcional)
                  </label>
                  <input
                    type="email"
                    placeholder="seu.email@exemplo.com"
                    value={customEmailInput}
                    onChange={(e) => setCustomEmailInput(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <button
                  onClick={() => handleGoogleLogin('custom')}
                  disabled={!customNameInput.trim() || !customPhoneInput.trim()}
                  className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm hover:shadow-md"
                >
                  Continuar com Nome & Telefone
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

      {/* ONBOARDING OBRIGATÓRIO (NOME COMPLETO + WHATSAPP PARA RETORNO) */}
      {isOnboardingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 sm:p-7 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs">
                <UserCheck className="w-7 h-7" />
              </div>

              <div className="text-center">
                <h3 className="text-lg font-bold text-slate-900">Finalize seus Dados para Retorno</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Precisamos do seu WhatsApp para que a equipe do Studio possa retornar seu orçamento e agendamento.
                </p>
              </div>

              {onboardingError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{onboardingError}</span>
                </div>
              )}

              <form onSubmit={handleSaveOnboarding} className="space-y-3.5 text-left">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Seu nome completo"
                    value={onboardingNome}
                    onChange={(e) => setOnboardingNome(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    WhatsApp / Telefone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="(11) 99999-8888"
                    value={onboardingTelefone}
                    onChange={(e) => setOnboardingTelefone(formatPhoneBR(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Digite com DDD. Exemplo: (11) 99999-8888
                  </p>
                </div>

                {googleProfile?.email && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      E-mail Vinculado (Google)
                    </label>
                    <input
                      type="email"
                      disabled
                      value={googleProfile.email}
                      className="w-full px-3.5 py-2 text-xs bg-slate-100 text-slate-500 border border-slate-200 rounded-xl cursor-not-allowed"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSavingOnboarding || !onboardingNome.trim() || !onboardingTelefone.trim()}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  {isSavingOnboarding ? (
                    <span>Salvando dados...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Salvar Dados e Continuar</span>
                    </>
                  )}
                </button>
              </form>

            </div>
          </div>
        </div>
      )}

      {/* PROCEDURE DETAILS & PHOTO CAROUSEL MODAL */}
      {procedureForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl max-h-[92vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
                  {procedureForDetails.categoria}
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {procedureForDetails.duracao_minutos} min
                </span>
              </div>
              <button
                type="button"
                onClick={() => setProcedureForDetails(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {/* Photo Carousel */}
              {(() => {
                const fotos = (procedureForDetails.imagens_galeria && procedureForDetails.imagens_galeria.length > 0)
                  ? procedureForDetails.imagens_galeria
                  : (procedureForDetails.imagem_url ? [procedureForDetails.imagem_url] : []);

                if (fotos.length === 0) {
                  return (
                    <div className="h-44 sm:h-56 w-full rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white flex flex-col items-center justify-center p-6 text-center shadow-inner">
                      <Sparkles className="w-10 h-10 text-indigo-300 mb-2" />
                      <h4 className="text-lg font-bold">{procedureForDetails.nome}</h4>
                      <p className="text-xs text-indigo-200 mt-1 max-w-sm">Procedimento estético profissional com tecnologia de ponta</p>
                    </div>
                  );
                }

                const currentPhoto = fotos[Math.min(activePhotoIndex, fotos.length - 1)];

                return (
                  <div className="space-y-3">
                    <div className="relative h-60 sm:h-80 w-full rounded-2xl overflow-hidden bg-slate-900 group">
                      <img
                        src={currentPhoto}
                        alt={procedureForDetails.nome}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />

                      {/* Photo counter */}
                      <span className="absolute top-3 right-3 text-xs font-bold text-white bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 shadow-sm">
                        Foto {activePhotoIndex + 1} de {fotos.length}
                      </span>

                      {/* Prev / Next controls */}
                      {fotos.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() => setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : fotos.length - 1))}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-xs transition-all cursor-pointer shadow-md"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setActivePhotoIndex((prev) => (prev < fotos.length - 1 ? prev + 1 : 0))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-xs transition-all cursor-pointer shadow-md"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Thumbnail strip */}
                    {fotos.length > 1 && (
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                        {fotos.map((img, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActivePhotoIndex(idx)}
                            className={`w-16 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                              activePhotoIndex === idx
                                ? 'border-indigo-600 ring-2 ring-indigo-400/40 shadow-xs scale-105'
                                : 'border-slate-200 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img src={img} alt={`Miniatura ${idx + 1}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
                  {procedureForDetails.nome}
                </h3>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Sobre o Procedimento
                </h5>
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  {procedureForDetails.descricao || 'Sem descrição detalhada cadastrada.'}
                </p>
              </div>

              {/* Pricing & Conditions Card */}
              {(() => {
                const preco = procedureForDetails.valor_promocional || procedureForDetails.valor_tabela;
                const pix = preco * 0.95;
                const parcela = preco / 10;
                return (
                  <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 sm:p-5 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Investimento Estimado</span>
                      <div className="text-right">
                        {procedureForDetails.valor_promocional && (
                          <span className="text-xs text-slate-400 line-through mr-2 font-mono">
                            R$ {procedureForDetails.valor_tabela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                        <span className="text-2xl font-extrabold text-slate-900 font-mono">
                          R$ {preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-indigo-200/50 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-emerald-800 font-semibold">
                        <span>✨ À vista no PIX com 5% de desconto:</span>
                        <span>R$ {pix.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex items-center justify-between text-indigo-900 font-medium">
                        <span>💳 Condições no Cartão de Crédito:</span>
                        <span className="font-bold">Até 10x de R$ {parcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} sem juros</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer Actions */}
            {(() => {
              const isSelected = selectedProcedures.some(p => p.id === procedureForDetails.id);
              return (
                <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row gap-2.5">
                  <a
                    href={generateDirectProcWhatsAppLink(procedureForDetails)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Solicitar Orçamento no WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => handleToggleProcedure(procedureForDetails)}
                    className={`py-3 px-5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Adicionado à Cotação</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Adicionar à Cotação</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* STICKY BOTTOM BAR FOR MOBILE QUOTE CART */}
      {selectedProcedures.length > 0 && activeTab === 'simulador' && (
        <div className="fixed bottom-3 left-3 right-3 sm:hidden z-40 bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl flex items-center justify-between border border-slate-700 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs relative">
              <FileText className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                {selectedProcedures.length}
              </span>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Cotação Atual</p>
              <p className="text-sm font-extrabold font-mono text-white">
                R$ {totalEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const el = document.getElementById('resumo-orcamento');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="py-2 px-3.5 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>Finalizar</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* SUCCESS CONFIRMATION MODAL - QUOTE */}
      {showSuccessModal && lastSubmittedQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6 text-center space-y-4">
            
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100">
              <FileText className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-md inline-block mb-1">
                Gestão da Clínica e Leads
              </span>
              <h3 className="text-lg font-bold text-slate-900">Orçamento Enviado com Sucesso!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Olá <strong>{lastSubmittedQuote.paciente_nome}</strong>, seu pedido foi enviado exclusivamente para a <strong>Gestão da Clínica e Leads</strong> informando o procedimento selecionado, seu contato e e-mail.
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-left text-xs space-y-2">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block">Procedimento(s) Selecionado(s):</span>
                <p className="font-bold text-slate-800">
                  {(lastSubmittedQuote.procedimentos_selecionados || []).map(p => p.nome).join(', ')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
                <div>
                  <span className="text-[10px] text-slate-400 block">Número de Contato:</span>
                  <span className="font-bold text-slate-800 font-mono text-[11px]">{lastSubmittedQuote.paciente_telefone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">E-mail Informado:</span>
                  <span className="font-medium text-slate-700 truncate block text-[11px]">{lastSubmittedQuote.paciente_email}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 font-bold">
                <span className="text-slate-600">Investimento Estimado:</span>
                <span className="font-mono text-indigo-700">
                  R$ {(lastSubmittedQuote.valor_total_estimado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={generateWhatsAppLink(lastSubmittedQuote)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Abrir Conversa no WhatsApp da Clínica</span>
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
              <span className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md inline-block mb-1">
                Lançado na Agenda Semanal
              </span>
              <h3 className="text-lg font-bold text-slate-900">Agendamento Realizado com Sucesso!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Olá <strong>{lastSubmittedBooking.pacienteNome}</strong>, seu horário foi agendado e inserido diretamente na <strong>Agenda Semanal da Clínica</strong>.
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-left text-xs space-y-1.5">
              <p className="font-bold text-slate-800">Procedimento: {lastSubmittedBooking.procedimentoNome}</p>
              <p className="text-slate-600">Data Preferencial: {lastSubmittedBooking.data} ({lastSubmittedBooking.periodo})</p>
              <p className="text-slate-600">Profissional: {lastSubmittedBooking.profissionalNome}</p>
              <p className="font-mono text-blue-700 font-bold">Investimento Estimado: R$ {lastSubmittedBooking.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>

            <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-left text-xs text-amber-900 space-y-1">
              <strong className="block text-amber-950 flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                Cadastro Completo na Recepção:
              </strong>
              <p className="text-[11px] leading-relaxed text-amber-800">
                Ao comparecer na clínica no dia marcado, nossa equipe da recepção dará continuidade preenchendo o seu <strong>cadastro completo</strong> (documentação, ficha de anamnese e termos).
              </p>
            </div>

            <div className="space-y-2 pt-2">
              {onGoToAgendaSemanal && (
                <button
                  onClick={() => {
                    setBookingSuccessModal(false);
                    onGoToAgendaSemanal(lastSubmittedBooking.data);
                  }}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>🗓️ Ir para a Agenda Semanal da Clínica</span>
                </button>
              )}

              <button
                onClick={() => {
                  setBookingSuccessModal(false);
                  setActiveTab('meus_orcamentos');
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
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
