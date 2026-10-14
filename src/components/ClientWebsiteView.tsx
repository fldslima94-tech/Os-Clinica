import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Sparkles, 
  Search, 
  Calendar, 
  Clock, 
  Check, 
  CheckCircle2, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  MapPin, 
  Phone, 
  Mail, 
  ExternalLink, 
  Heart, 
  ShieldCheck, 
  Award, 
  Star, 
  MessageCircle, 
  User, 
  LogIn, 
  LogOut, 
  ArrowRight, 
  CalendarCheck, 
  Share2, 
  Copy, 
  LayoutDashboard, 
  Info, 
  AlertCircle, 
  Layers, 
  CheckCheck, 
  Building2, 
  Compass, 
  Navigation, 
  CreditCard, 
  Percent, 
  Scissors, 
  Sparkle, 
  Activity, 
  Eye, 
  Send, 
  SlidersHorizontal,
  Menu,
  Edit,
  Edit2,
  Trash2,
  Upload,
  Camera,
  Image as ImageIcon,
  Save,
  Crown,
  Plus,
  Quote,
  Video,
  Play,
  GraduationCap,
  Instagram
} from 'lucide-react';
import { 
  ProcedimentoClinico, 
  SolicitacaoOrcamento, 
  PacienteGoogleProfile, 
  UsuarioEquipe, 
  ClinicaConfig, 
  CATEGORIAS_PROCEDIMENTOS_PERMITIDAS,
  Agendamento,
  FotoAntesDepois,
  DepoimentoCliente,
  ProfissionalQuemSouEu
} from '../types';
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
  getGestoresLocaisParaSelecao,
  saveDocument,
  COLLECTIONS
} from '../services/firebaseService';
import { compressImageFile } from '../lib/image-utils';

interface ClientWebsiteViewProps {
  procedimentos: ProcedimentoClinico[];
  orçamentos: SolicitacaoOrcamento[];
  agendamentos?: Agendamento[];
  onCriarOrcamento: (novoOrcamento: Omit<SolicitacaoOrcamento, 'id' | 'data_solicitacao'>) => void;
  onAtualizarStatusOrcamento?: (id: string, status: SolicitacaoOrcamento['status'], resposta?: string) => void;
  onConverterEmAgendamento?: (orcamento: SolicitacaoOrcamento) => void;
  onDeleteOrcamento?: (id: string) => void;
  onCriarAgendamento?: (novoAgendamento: any) => void;
  onAtualizarProcedimento?: (procedimento: ProcedimentoClinico) => void;
  onAtualizarClinicaConfig?: (config: ClinicaConfig) => void;
  currentUser?: UsuarioEquipe | null;
  clinicaConfig?: ClinicaConfig;
  profissionais?: UsuarioEquipe[];
  onReturnToAdmin?: () => void;
  onGoToAgendaSemanal?: (targetDate?: string) => void;
  isPublicVisitor?: boolean;
}

// Default professionals pool for Quem Sou Eu (up to 10)
const DEFAULT_PROFISSIONAIS: ProfissionalQuemSouEu[] = [
  {
    id: 'prof-1',
    nome: 'Drª Mariana Albuquerque',
    titulo: 'Biomédica Esteta & Especialista em Rejuvenescimento Facial',
    registro: 'CRBM 34.891 • Sociedade Brasileira de Biomedicina Estética',
    bio: 'Minha paixão é realçar sua beleza natural com sofisticação, precisão anatômica e segurança absoluta. Cada paciente possui proporções e expressões singulares: desenvolvo planos de tratamento individualizados, utilizando os melhores biomateriais do mundo com registro ANVISA para resultados sutis, elegantes e rejuvenescedores.',
    foto_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&auto=format&fit=crop&q=80',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    tipo_midia: 'foto',
    instagram: '@dra.mariana.estetica',
    anos_experiencia: '+8 Anos',
    diferenciais: ['Membro SBBM', 'Pós-Graduação em Harmonização', 'Speaker Nacional'],
    servicos_ids: [],
    ativo: true,
  },
  {
    id: 'prof-2',
    nome: 'Drª Beatriz Mendonça',
    titulo: 'Dermatologia Estética & Cosmiatria Avançada',
    registro: 'CRM 142.890 • RQE 78.432',
    bio: 'Especialista em saúde cutânea, estímulo biológico de colágeno e tecnologias a laser de última geração. Atuação focada em sustentação dérmica, gerenciamento do envelhecimento e recuperação do viço natural da pele.',
    foto_url: 'https://images.unsplash.com/photo-1594824813637-2808b8bdf218?w=800&auto=format&fit=crop&q=80',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    tipo_midia: 'foto',
    instagram: '@dra.beatriz.dermatologia',
    anos_experiencia: '+10 Anos',
    diferenciais: ['Membro SBD', 'Fellowship em Lasers', 'Preceptora Médica'],
    servicos_ids: [],
    ativo: true,
  },
  {
    id: 'prof-3',
    nome: 'Enfª Camila Vasconcelos',
    titulo: 'Enfermeira Esteta & Especialista em Injetáveis e Lábios',
    registro: 'COREN 289.412-SP',
    bio: 'Dedicação exclusiva a técnicas labiais de alta definição, microagulhamento robótico e peelings de renovação celular. Proporciono uma experiência acolhedora e livre de desconforto em cada sessão.',
    foto_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=800&auto=format&fit=crop&q=80',
    video_url: '',
    tipo_midia: 'foto',
    instagram: '@enfa.camilavasconcelos',
    anos_experiencia: '+6 Anos',
    diferenciais: ['Técnica Labial Russa', 'Pós-Graduação SOBECCE'],
    servicos_ids: [],
    ativo: true,
  }
];

export const ClientWebsiteView: React.FC<ClientWebsiteViewProps> = ({
  procedimentos: initialProcedimentos,
  orçamentos,
  agendamentos = [],
  onCriarOrcamento,
  onAtualizarStatusOrcamento,
  onConverterEmAgendamento,
  onDeleteOrcamento,
  onCriarAgendamento,
  onAtualizarProcedimento,
  onAtualizarClinicaConfig,
  currentUser,
  clinicaConfig: propClinicaConfig,
  profissionais = [],
  onReturnToAdmin,
  onGoToAgendaSemanal,
  isPublicVisitor = false,
}) => {
  const isSuperAdmin = currentUser ? isUserAdminTotal(currentUser) : false;
  const isStaff = currentUser && currentUser.role !== 'cliente' && !isPublicVisitor;
  const gestoresLocais = useMemo(() => getGestoresLocaisParaSelecao(profissionais), [profissionais]);

  // Local state for live editable procedures and clinic config
  const [procedimentosList, setProcedimentosList] = useState<ProcedimentoClinico[]>(initialProcedimentos);
  useEffect(() => {
    setProcedimentosList(initialProcedimentos);
  }, [initialProcedimentos]);

  const [localClinicaConfig, setLocalClinicaConfig] = useState<ClinicaConfig>(() => {
    return propClinicaConfig || {
      id: 'config-matriz',
      nome: 'Studio de Beleza Feminina',
      logomarca_url: '/logo.svg',
      telefone: '(11) 98111-2233',
      endereco: 'Av. Paulista, 1500 - Conjunto 802, Bela Vista - São Paulo / SP',
      slogan: 'Alta Tecnologia e Excelência em Procedimentos Estéticos e Beleza Feminina',
      tema_cor_primaria: '#c59b27'
    };
  });

  useEffect(() => {
    if (propClinicaConfig) {
      setLocalClinicaConfig(propClinicaConfig);
    }
  }, [propClinicaConfig]);

  // Super Admin Master Edit Mode Toggle
  const [isSuperAdminEditOn, setIsSuperAdminEditOn] = useState<boolean>(() => {
    try {
      return localStorage.getItem('aura_site_admin_edit_mode') !== 'false';
    } catch {
      return true;
    }
  });

  const toggleSuperAdminEdit = () => {
    setIsSuperAdminEditOn(prev => {
      const next = !prev;
      try {
        localStorage.setItem('aura_site_admin_edit_mode', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Modals for Super Admin Editing
  const [isHeroTextModalOpen, setIsHeroTextModalOpen] = useState(false);
  const [isStudioPhotosModalOpen, setIsStudioPhotosModalOpen] = useState(false);
  const [isTestimonialModalOpen, setIsTestimonialModalOpen] = useState(false);
  const [testimonialToEdit, setTestimonialToEdit] = useState<DepoimentoCliente | null>(null);

  // Form states for Hero & Text editing
  const [heroFormTitulo, setHeroFormTitulo] = useState('');
  const [heroFormSubtitulo, setHeroFormSubtitulo] = useState('');
  const [heroFormImagem, setHeroFormImagem] = useState('');
  const [heroFormSlogan, setHeroFormSlogan] = useState('');
  const [heroFormSobre, setHeroFormSobre] = useState('');
  const [heroFormEndereco, setHeroFormEndereco] = useState('');
  const [heroFormTelefone, setHeroFormTelefone] = useState('');
  const [heroFormHorarioSemana, setHeroFormHorarioSemana] = useState('');
  const [heroFormHorarioSabado, setHeroFormHorarioSabado] = useState('');
  const [uploadingHeroImg, setUploadingHeroImg] = useState(false);

  // Form states for Studio Environment Photos
  const [tempStudioPhotos, setTempStudioPhotos] = useState<string[]>([]);
  const [newStudioPhotoUrl, setNewStudioPhotoUrl] = useState('');
  const [uploadingStudioPhoto, setUploadingStudioPhoto] = useState(false);

  // Form states for Procedure Photo Editing
  const [procToEditPhoto, setProcToEditPhoto] = useState<ProcedimentoClinico | null>(null);
  const [editingPhotoUrl, setEditingPhotoUrl] = useState('');
  const [editingGalleryUrls, setEditingGalleryUrls] = useState<string[]>([]);
  const [uploadingProcPhoto, setUploadingProcPhoto] = useState(false);

  // Form states for Testimonials (Depoimentos)
  const [testimonialFormNome, setTestimonialFormNome] = useState('');
  const [testimonialFormProcedimento, setTestimonialFormProcedimento] = useState('');
  const [testimonialFormTexto, setTestimonialFormTexto] = useState('');
  const [testimonialFormNota, setTestimonialFormNota] = useState(5);
  const [testimonialFormAvatar, setTestimonialFormAvatar] = useState('');
  const [testimonialFormData, setTestimonialFormData] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Active section in page navigation
  const [activeSection, setActiveSection] = useState<'home' | 'quem_sou_eu' | 'tratamentos' | 'agendamento' | 'simulador' | 'depoimentos' | 'transformacoes' | 'studio' | 'minha_conta'>('home');
  const [quemSouMediaTab, setQuemSouMediaTab] = useState<'foto' | 'video'>('foto');
  const [quemSouCategoryFilter, setQuemSouCategoryFilter] = useState<string>('todos');
  
  // Multi-Professionals for Quem Sou Eu (supports up to 10)
  const [selectedProfIndex, setSelectedProfIndex] = useState(0);

  const profissionaisQuemSou: ProfissionalQuemSouEu[] = useMemo(() => {
    if (localClinicaConfig?.quem_sou_profissionais && localClinicaConfig.quem_sou_profissionais.length > 0) {
      return localClinicaConfig.quem_sou_profissionais;
    }
    if (localClinicaConfig?.quem_sou_nome) {
      return [
        {
          id: 'prof-1',
          nome: localClinicaConfig.quem_sou_nome,
          titulo: localClinicaConfig.quem_sou_titulo || 'Biomédica Esteta & Especialista Facial',
          registro: localClinicaConfig.quem_sou_registro || 'CRBM 34.891 • Sociedade Brasileira de Biomedicina Estética',
          bio: localClinicaConfig.quem_sou_bio || 'Minha paixão é realçar sua beleza natural com sofisticação, precisão anatômica e segurança absoluta.',
          foto_url: localClinicaConfig.quem_sou_foto_url || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&auto=format&fit=crop&q=80',
          video_url: localClinicaConfig.quem_sou_video_url || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          tipo_midia: localClinicaConfig.quem_sou_tipo_midia || 'foto',
          instagram: localClinicaConfig.quem_sou_instagram || '@dra.mariana.estetica',
          anos_experiencia: localClinicaConfig.quem_sou_anos_experiencia || '+8 Anos',
          servicos_ids: localClinicaConfig.quem_sou_servicos_ids || [],
          diferenciais: localClinicaConfig.quem_sou_diferenciais || ['Certificada ANVISA', 'Atendimento Humanizado'],
          ativo: true,
        },
        ...DEFAULT_PROFISSIONAIS.slice(1)
      ];
    }
    return DEFAULT_PROFISSIONAIS;
  }, [localClinicaConfig]);

  const activeProfissional = profissionaisQuemSou[selectedProfIndex] || profissionaisQuemSou[0];

  const [isQuemSouEditorOpen, setIsQuemSouEditorOpen] = useState(false);
  const [quemSouEditNome, setQuemSouEditNome] = useState('');
  const [quemSouEditTitulo, setQuemSouEditTitulo] = useState('');
  const [quemSouEditRegistro, setQuemSouEditRegistro] = useState('');
  const [quemSouEditBio, setQuemSouEditBio] = useState('');
  const [quemSouEditFotoUrl, setQuemSouEditFotoUrl] = useState('');
  const [quemSouEditVideoUrl, setQuemSouEditVideoUrl] = useState('');
  const [quemSouEditInstagram, setQuemSouEditInstagram] = useState('');
  const [quemSouEditAnosExp, setQuemSouEditAnosExp] = useState('');
  const [isUploadingQuemSouFoto, setIsUploadingQuemSouFoto] = useState(false);
  const quemSouFileInputRef = useRef<HTMLInputElement>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toastText, setToastText] = useState<string | null>(null);

  // Authentication State (Google or Quick Local Account)
  const [googleProfile, setGoogleProfile] = useState<PacienteGoogleProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authNameInput, setAuthNameInput] = useState('');
  const [authPhoneInput, setAuthPhoneInput] = useState('');
  const [authEmailInput, setAuthEmailInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Filter & Search for Procedures Catalog
  const [categoryFilter, setCategoryFilter] = useState('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [procedureForDetails, setProcedureForDetails] = useState<ProcedimentoClinico | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Quote Simulator Cart
  const [selectedProcedures, setSelectedProcedures] = useState<ProcedimentoClinico[]>([]);
  const [queixaPrincipal, setQueixaPrincipal] = useState('');
  const [periodoPreferencia, setPeriodoPreferencia] = useState<'qualquer' | 'manha' | 'tarde' | 'noite' | 'sabado'>('qualquer');
  const [quoteSuccessModal, setQuoteSuccessModal] = useState(false);
  const [lastSubmittedQuote, setLastSubmittedQuote] = useState<SolicitacaoOrcamento | null>(null);

  // Direct Online Booking Form State
  const [bookingProcId, setBookingProcId] = useState<string>('');
  const [bookingDate, setBookingDate] = useState<string>(() => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today.toISOString().split('T')[0];
  });
  const [bookingPeriod, setBookingPeriod] = useState<string>('manha');
  const [bookingTimeSlot, setBookingTimeSlot] = useState<string>('09:30');
  const [bookingProfId, setBookingProfId] = useState<string>('qualquer');
  const [bookingClientName, setBookingClientName] = useState<string>('');
  const [bookingClientPhone, setBookingClientPhone] = useState<string>('');
  const [bookingClientEmail, setBookingClientEmail] = useState<string>('');
  const [bookingNotes, setBookingNotes] = useState<string>('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSuccessModal, setBookingSuccessModal] = useState(false);
  const [lastConfirmedBooking, setLastConfirmedBooking] = useState<any>(null);

  // Sync Google/Client Auth
  useEffect(() => {
    if (currentUser?.role === 'cliente' && !googleProfile) {
      setGoogleProfile({
        id: currentUser.id,
        nome: currentUser.nome,
        email: currentUser.email || '',
        avatar_url: currentUser.avatar_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
        telefone: currentUser.telefone || '',
      });
      setBookingClientName(currentUser.nome);
      setBookingClientPhone(formatPhoneBR(currentUser.telefone || ''));
      setBookingClientEmail(currentUser.email || '');
    }

    const unsubscribe = onFirebaseAuthStateChange(async (user) => {
      if (user) {
        const stored = await fetchClientPortalProfile(user.uid);
        const nome = stored?.nome || user.displayName || 'Paciente';
        const telefone = stored?.telefone || '';
        const email = user.email || stored?.email || '';
        const avatar_url = user.photoURL || stored?.avatar_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80';

        const profile: PacienteGoogleProfile = {
          id: user.uid,
          nome,
          email,
          avatar_url,
          telefone,
        };

        setGoogleProfile(profile);
        setBookingClientName(nome);
        if (telefone) setBookingClientPhone(formatPhoneBR(telefone));
        if (email) setBookingClientEmail(email);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Fast Toast
  const triggerToast = (msg: string) => {
    setToastText(msg);
    setTimeout(() => setToastText(null), 3500);
  };

  // Categories list
  const categories = useMemo(() => {
    const customCats = Array.from(new Set(procedimentosList.map(p => p.categoria))).filter(
      (c): c is string => Boolean(c) && !CATEGORIAS_PROCEDIMENTOS_PERMITIDAS.includes(c as any)
    );
    const sorted = [
      ...CATEGORIAS_PROCEDIMENTOS_PERMITIDAS,
      ...customCats
    ].sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true, sensitivity: 'base' }));

    return ['todos', ...sorted];
  }, [procedimentosList]);

  // Filtered procedures
  const filteredProcedures = useMemo(() => {
    return procedimentosList.filter(p => {
      if (p.ativo === false) return false;
      if (categoryFilter !== 'todos' && p.categoria !== categoryFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        (p.nome || '').toLowerCase().includes(q) ||
        (p.descricao || '').toLowerCase().includes(q) ||
        (p.categoria || '').toLowerCase().includes(q)
      );
    });
  }, [procedimentosList, categoryFilter, searchQuery]);

  // ==========================================
  // SUPER ADMIN SAVE HANDLERS (Firestore & Local)
  // ==========================================

  const handleSaveClinicaConfigPartial = async (partial: Partial<ClinicaConfig>) => {
    const updated: ClinicaConfig = {
      ...localClinicaConfig,
      ...partial,
    };
    setLocalClinicaConfig(updated);
    try {
      await saveDocument(COLLECTIONS.CLINICA_CONFIG, updated);
      if (onAtualizarClinicaConfig) {
        onAtualizarClinicaConfig(updated);
      }
      triggerToast('Alterações salvas com sucesso no banco de dados!');
    } catch (err) {
      console.warn('[handleSaveClinicaConfigPartial]', err);
      triggerToast('Salvo em memória local.');
    }
  };

  // Salvar foto real do procedimento
  const handleSaveProcedurePhoto = async () => {
    if (!procToEditPhoto) return;
    const updatedProc: ProcedimentoClinico = {
      ...procToEditPhoto,
      imagem_url: editingPhotoUrl.trim() || procToEditPhoto.imagem_url,
      imagens_galeria: editingGalleryUrls.length > 0 ? editingGalleryUrls : [editingPhotoUrl.trim() || procToEditPhoto.imagem_url || ''],
    };

    setProcedimentosList(prev => prev.map(p => p.id === updatedProc.id ? updatedProc : p));
    try {
      await saveDocument(COLLECTIONS.PROCEDIMENTOS, updatedProc);
      if (onAtualizarProcedimento) {
        onAtualizarProcedimento(updatedProc);
      }
      triggerToast(`Foto real do procedimento "${updatedProc.nome}" atualizada com sucesso!`);
    } catch (err) {
      console.warn('[handleSaveProcedurePhoto]', err);
      triggerToast('Foto atualizada com sucesso!');
    }
    setProcToEditPhoto(null);
  };

  // Upload helper using compressImageFile (converts local photo into fast, lightweight Base64)
  const processImageUpload = async (file: File, onSuccess: (dataUrl: string) => void, setLoading: (l: boolean) => void) => {
    setLoading(true);
    try {
      const compressed = await compressImageFile(file, {
        maxWidth: 1200,
        maxHeight: 1200,
        quality: 0.8,
        mimeType: 'image/webp'
      });
      onSuccess(compressed);
      triggerToast('Foto real carregada e otimizada com sucesso!');
    } catch (err) {
      console.warn('[processImageUpload fallback to FileReader]', err);
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onSuccess(reader.result);
          triggerToast('Foto carregada com sucesso!');
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setLoading(false);
    }
  };

  // Salvar Fotos Reais do Ambiente do Studio
  const handleSaveStudioPhotos = async () => {
    const cleanList = tempStudioPhotos.filter(url => Boolean(url && url.trim()));
    await handleSaveClinicaConfigPartial({ fotos_ambiente: cleanList });
    setIsStudioPhotosModalOpen(false);
  };

  // Abrir Modal de Edição de Fotos do Studio
  const handleOpenStudioPhotosEditor = () => {
    const current = localClinicaConfig.fotos_ambiente && localClinicaConfig.fotos_ambiente.length > 0
      ? localClinicaConfig.fotos_ambiente
      : [
          'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1512290900672-1f55b9959a4b?w=600&auto=format&fit=crop&q=80'
        ];
    setTempStudioPhotos([...current]);
    setNewStudioPhotoUrl('');
    setIsStudioPhotosModalOpen(true);
  };

  // Abrir Modal de Adicionar/Editar Depoimento
  const handleOpenTestimonialModal = (dep?: DepoimentoCliente) => {
    if (dep) {
      setTestimonialToEdit(dep);
      setTestimonialFormNome(dep.nome);
      setTestimonialFormProcedimento(dep.procedimento);
      setTestimonialFormTexto(dep.texto);
      setTestimonialFormNota(dep.nota || 5);
      setTestimonialFormAvatar(dep.avatar_url || '');
      setTestimonialFormData(dep.data || '');
    } else {
      setTestimonialToEdit(null);
      setTestimonialFormNome('');
      setTestimonialFormProcedimento(procedimentosList[0]?.nome || 'Procedimento Estético');
      setTestimonialFormTexto('');
      setTestimonialFormNota(5);
      setTestimonialFormAvatar('https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80');
      setTestimonialFormData('Atendida recentemente');
    }
    setIsTestimonialModalOpen(true);
  };

  // Salvar Depoimento
  const handleSaveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testimonialFormNome.trim()) {
      triggerToast('Informe o nome da cliente.');
      return;
    }
    if (!testimonialFormTexto.trim()) {
      triggerToast('Digite o depoimento da cliente.');
      return;
    }

    const currentList: DepoimentoCliente[] = localClinicaConfig.depoimentos && localClinicaConfig.depoimentos.length > 0
      ? [...localClinicaConfig.depoimentos]
      : [];

    const newDepItem: DepoimentoCliente = {
      id: testimonialToEdit ? testimonialToEdit.id : `dep-${Date.now()}`,
      nome: testimonialFormNome.trim(),
      procedimento: testimonialFormProcedimento.trim() || 'Procedimento Estético',
      texto: testimonialFormTexto.trim(),
      nota: testimonialFormNota || 5,
      avatar_url: testimonialFormAvatar.trim() || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
      data: testimonialFormData.trim() || 'Atendida no Studio',
      destaque: true,
    };

    let updatedList: DepoimentoCliente[];
    if (testimonialToEdit) {
      updatedList = currentList.map(d => d.id === testimonialToEdit.id ? newDepItem : d);
    } else {
      updatedList = [newDepItem, ...currentList];
    }

    await handleSaveClinicaConfigPartial({ depoimentos: updatedList });
    setIsTestimonialModalOpen(false);
    triggerToast(testimonialToEdit ? 'Depoimento atualizado com sucesso!' : 'Novo depoimento de cliente adicionado ao site!');
  };

  // Excluir Depoimento
  const handleDeleteTestimonial = async (id: string) => {
    const currentList: DepoimentoCliente[] = localClinicaConfig.depoimentos || [];
    const updatedList = currentList.filter(d => d.id !== id);
    await handleSaveClinicaConfigPartial({ depoimentos: updatedList });
    triggerToast('Depoimento removido do site.');
  };

  // Abrir Modal de Edição de Hero & Textos
  const handleOpenHeroEditor = () => {
    setHeroFormTitulo(localClinicaConfig.hero_titulo || 'Realce sua beleza natural com sofisticação e precisão.');
    setHeroFormSubtitulo(localClinicaConfig.hero_subtitulo || 'Unimos tecnologia moderna, produtos biocompatíveis certificados e um olhar artístico exclusivo para transformar sua autoestima com total segurança.');
    setHeroFormImagem(localClinicaConfig.hero_imagem_url || 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=900&auto=format&fit=crop&q=80');
    setHeroFormSlogan(localClinicaConfig.slogan || 'Alta Tecnologia e Excelência em Procedimentos Estéticos e Beleza Feminina');
    setHeroFormSobre(localClinicaConfig.sobre_studio_texto || 'Localizado estrategicamente com fácil acesso e estacionamento, nosso studio conta com salas climatizadas, macas automatizadas com aquecimento lombar e autoclave hospitalar para esterilização grau máximo.');
    setHeroFormEndereco(localClinicaConfig.endereco || 'Av. Paulista, 1500 - Conjunto 802, Bela Vista - São Paulo / SP');
    setHeroFormTelefone(localClinicaConfig.telefone || '(11) 98111-2233');
    setHeroFormHorarioSemana(localClinicaConfig.horario_semana || 'Segunda a Sexta: 08:00 às 19:30');
    setHeroFormHorarioSabado(localClinicaConfig.horario_sabado || 'Sábados: 08:00 às 15:00');
    setIsHeroTextModalOpen(true);
  };

  // Salvar Hero & Textos do Site
  const handleSaveHeroEditor = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSaveClinicaConfigPartial({
      hero_titulo: heroFormTitulo.trim(),
      hero_subtitulo: heroFormSubtitulo.trim(),
      hero_imagem_url: heroFormImagem.trim(),
      slogan: heroFormSlogan.trim(),
      sobre_studio_texto: heroFormSobre.trim(),
      endereco: heroFormEndereco.trim(),
      telefone: heroFormTelefone.trim(),
      horario_semana: heroFormHorarioSemana.trim(),
      horario_sabado: heroFormHorarioSabado.trim(),
    });
    setIsHeroTextModalOpen(false);
  };

  // Abrir Modal de Edição Quem Sou Eu
  const handleOpenQuemSouEditor = () => {
    setQuemSouEditNome(localClinicaConfig.quem_sou_nome || 'Drª Mariana Albuquerque');
    setQuemSouEditTitulo(localClinicaConfig.quem_sou_titulo || 'Biomédica Esteta & Especialista em Rejuvenescimento Facial');
    setQuemSouEditRegistro(localClinicaConfig.quem_sou_registro || 'CRBM 34.891 • Sociedade Brasileira de Biomedicina Estética');
    setQuemSouEditBio(localClinicaConfig.quem_sou_bio || 'Minha paixão é realçar sua beleza natural com sofisticação, precisão anatômica e segurança absoluta. Cada paciente possui proporções e expressões singulares: desenvolvo planos de tratamento individualizados, utilizando os melhores biomateriais do mundo com registro ANVISA para resultados sutis, elegantes e rejuvenescedores.');
    setQuemSouEditFotoUrl(localClinicaConfig.quem_sou_foto_url || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&auto=format&fit=crop&q=80');
    setQuemSouEditVideoUrl(localClinicaConfig.quem_sou_video_url || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    setQuemSouEditInstagram(localClinicaConfig.quem_sou_instagram || '@dra.mariana.estetica');
    setQuemSouEditAnosExp(localClinicaConfig.quem_sou_anos_experiencia || '+8 Anos');
    setIsQuemSouEditorOpen(true);
  };

  const handleSaveQuemSouEditor = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSaveClinicaConfigPartial({
      quem_sou_nome: quemSouEditNome.trim(),
      quem_sou_titulo: quemSouEditTitulo.trim(),
      quem_sou_registro: quemSouEditRegistro.trim(),
      quem_sou_bio: quemSouEditBio.trim(),
      quem_sou_foto_url: quemSouEditFotoUrl.trim(),
      quem_sou_video_url: quemSouEditVideoUrl.trim(),
      quem_sou_instagram: quemSouEditInstagram.trim(),
      quem_sou_anos_experiencia: quemSouEditAnosExp.trim(),
    });
    setIsQuemSouEditorOpen(false);
    triggerToast('Aba "Quem Sou Eu" atualizada com sucesso!');
  };

  const handleQuemSouFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingQuemSouFoto(true);
      const compressed = await compressImageFile(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.8,
        targetMaxKB: 35,
        mimeType: 'image/webp'
      });
      setQuemSouEditFotoUrl(compressed);
      triggerToast('Foto da profissional carregada!');
    } catch (err) {
      console.error(err);
      triggerToast('Erro ao processar foto.');
    } finally {
      setIsUploadingQuemSouFoto(false);
      if (quemSouFileInputRef.current) quemSouFileInputRef.current.value = '';
    }
  };

  // ==========================================
  // CART & BOOKING HANDLERS
  // ==========================================

  const toggleProcedureInCart = (proc: ProcedimentoClinico) => {
    setSelectedProcedures(prev => {
      const exists = prev.some(p => p.id === proc.id);
      if (exists) {
        triggerToast(`Removido: ${proc.nome}`);
        return prev.filter(p => p.id !== proc.id);
      } else {
        triggerToast(`Adicionado ao Orçamento: ${proc.nome}`);
        return [...prev, proc];
      }
    });
  };

  const totalEstimado = useMemo(() => {
    return selectedProcedures.reduce((acc, p) => acc + (p.valor_promocional || p.valor_tabela || 0), 0);
  }, [selectedProcedures]);

  const totalComDescontoPix = totalEstimado * 0.95;
  const valorParcela10x = totalEstimado > 0 ? totalEstimado / 10 : 0;

  const clinicPhoneDigits = useMemo(() => {
    const raw = (localClinicaConfig?.telefone || '11987654321').replace(/\D/g, '');
    return raw.startsWith('55') ? raw : `55${raw}`;
  }, [localClinicaConfig?.telefone]);

  const generateWhatsAppLink = (text: string) => {
    return `https://wa.me/${clinicPhoneDigits}?text=${encodeURIComponent(text)}`;
  };

  const handleCopySiteLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?site=true`;
    navigator.clipboard.writeText(url).then(() => {
      triggerToast('Link do Site copiado! Envie para seus clientes no WhatsApp.');
    }).catch(() => {
      triggerToast('Link do Site: ' + url);
    });
  };

  // Google Login
  const handleGoogleSignIn = async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    try {
      const user = await loginWithFirebaseGoogle();
      if (user) {
        const stored = await fetchClientPortalProfile(user.uid);
        const nome = stored?.nome || user.displayName || 'Paciente';
        const telefone = stored?.telefone || '';
        const email = user.email || stored?.email || '';
        const avatar_url = user.photoURL || stored?.avatar_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80';

        const profile: PacienteGoogleProfile = {
          id: user.uid,
          nome,
          email,
          avatar_url,
          telefone,
        };

        setGoogleProfile(profile);
        setBookingClientName(nome);
        if (telefone) setBookingClientPhone(formatPhoneBR(telefone));
        if (email) setBookingClientEmail(email);
        setIsAuthModalOpen(false);
        triggerToast(`Bem-vinda(o), ${nome}!`);
      }
    } catch (err: any) {
      console.warn('[Google Sign In]', err);
      setAuthError('Não foi possível conectar com a Conta Google no momento. Você pode usar a identificação rápida.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Quick Client Sign In
  const handleQuickSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authNameInput.trim()) {
      setAuthError('Por favor informe seu nome.');
      return;
    }
    if (!authPhoneInput.trim() || !isValidPhoneBR(authPhoneInput)) {
      setAuthError('Por favor informe um telefone WhatsApp válido com DDD.');
      return;
    }

    const pseudoUid = `client-${authPhoneInput.replace(/\D/g, '')}`;
    const profile: PacienteGoogleProfile = {
      id: pseudoUid,
      nome: authNameInput.trim(),
      email: authEmailInput.trim(),
      telefone: authPhoneInput.trim(),
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
    };

    setGoogleProfile(profile);
    setBookingClientName(profile.nome);
    setBookingClientPhone(formatPhoneBR(profile.telefone));
    if (profile.email) setBookingClientEmail(profile.email);

    try {
      await saveClientPortalProfile(profile);
    } catch (e) {
      // ignore
    }

    setIsAuthModalOpen(false);
    triggerToast(`Olá, ${profile.nome}! Perfil conectado.`);
  };

  // Direct Booking & Online Quote Submission
  const handleDirectBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-resolve procedure if not directly selected but present in cart
    let activeProcId = bookingProcId;
    if (!activeProcId && selectedProcedures.length > 0) {
      activeProcId = selectedProcedures[0].id;
    }

    if (!activeProcId && selectedProcedures.length === 0) {
      triggerToast('Por favor selecione ou adicione pelo menos 1 procedimento.');
      return;
    }
    if (!bookingDate) {
      triggerToast('Por favor selecione a data da consulta.');
      return;
    }
    if (!bookingClientName.trim()) {
      triggerToast('Por favor informe seu nome completo.');
      return;
    }
    if (!bookingClientPhone.trim() || !isValidPhoneBR(bookingClientPhone)) {
      triggerToast('Por favor informe um WhatsApp válido com DDD.');
      return;
    }

    setBookingSubmitting(true);

    let procNome = 'Consulta & Protocolo de Tratamento';
    let procValor = 0;
    let duracao = 45;

    if (selectedProcedures.length > 0) {
      procNome = selectedProcedures.length === 1 
        ? selectedProcedures[0].nome 
        : `${selectedProcedures[0].nome} (+${selectedProcedures.length - 1} procedimento${selectedProcedures.length > 2 ? 's' : ''})`;
      procValor = totalEstimado;
      duracao = selectedProcedures.reduce((acc, p) => acc + (p.duracao_minutos || 30), 0);
    } else if (activeProcId) {
      const proc = procedimentosList.find(p => p.id === activeProcId);
      if (proc) {
        procNome = proc.nome;
        procValor = proc.valor_promocional || proc.valor_tabela || 0;
        duracao = proc.duracao_minutos || 45;
      }
    }

    let profNome = 'Equipe Especialista';
    if (bookingProfId !== 'qualquer') {
      const pr = profissionais.find(p => p.id === bookingProfId) || 
                 profissionaisQuemSou.find(p => p.id === bookingProfId);
      if (pr) profNome = pr.nome;
    }

    const procedureDetailsList = selectedProcedures.length > 0 
      ? selectedProcedures.map(p => `${p.nome} (R$ ${(p.valor_promocional || p.valor_tabela || 0).toFixed(2)})`).join(', ')
      : procNome;

    const notesWithBudget = `[Orçamento Online: R$ ${procValor.toFixed(2)} | À vista PIX 5%: R$ ${(procValor * 0.95).toFixed(2)}] Procedimentos: ${procedureDetailsList}. ${bookingNotes.trim() ? `Observações: ${bookingNotes.trim()}` : ''}`;

    const appointmentPayload = {
      data: bookingDate,
      hora: bookingTimeSlot,
      procedimentoNome: procNome,
      procedimentoId: activeProcId || 'protocolo-multiplo',
      profissionalId: bookingProfId === 'qualquer' ? undefined : bookingProfId,
      profissionalNome: profNome,
      valor: procValor,
      duracaoMinutos: duracao,
      pacienteNome: bookingClientName.trim(),
      pacienteTelefone: bookingClientPhone.trim(),
      pacienteEmail: bookingClientEmail.trim() || undefined,
      observacoes: notesWithBudget,
      pacienteId: googleProfile ? googleProfile.id : undefined,
    };

    try {
      if (onCriarAgendamento) {
        onCriarAgendamento(appointmentPayload);
      }
      if (onCriarOrcamento && selectedProcedures.length > 0) {
        onCriarOrcamento({
          paciente_nome: bookingClientName.trim(),
          paciente_telefone: bookingClientPhone.trim(),
          paciente_email: bookingClientEmail.trim() || 'cliente@portal.com.br',
          conta_google_vinculada: Boolean(googleProfile),
          procedimentos_selecionados: selectedProcedures.map(p => ({
            procedimento_id: p.id,
            nome: p.nome,
            categoria: p.categoria,
            valor_unitario: p.valor_promocional || p.valor_tabela || 0,
          })),
          valor_total_estimado: totalEstimado,
          queixa_principal: `[Agendamento Online no Site para ${bookingDate} às ${bookingTimeSlot}] ${bookingNotes.trim() || 'Sem queixas adicionais'}`,
          periodo_preferencia: 'qualquer',
          status: 'pendente',
        });
      }
      setLastConfirmedBooking(appointmentPayload);
      setBookingSuccessModal(true);
      triggerToast('Consulta agendada com sucesso!');
    } catch (err) {
      console.warn('[handleDirectBooking]', err);
      triggerToast('Erro ao registrar agendamento. Tente novamente.');
    } finally {
      setBookingSubmitting(false);
    }
  };

  // Quote Submission
  const handleSendQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProcedures.length === 0) {
      triggerToast('Adicione pelo menos 1 procedimento ao orçamento.');
      return;
    }
    if (!bookingClientName.trim()) {
      triggerToast('Informe seu nome completo.');
      return;
    }
    if (!bookingClientPhone.trim() || !isValidPhoneBR(bookingClientPhone)) {
      triggerToast('Informe um WhatsApp válido.');
      return;
    }

    const newQuote: Omit<SolicitacaoOrcamento, 'id' | 'data_solicitacao'> = {
      paciente_nome: bookingClientName.trim(),
      paciente_telefone: bookingClientPhone.trim(),
      paciente_email: bookingClientEmail.trim() || 'cliente@portal.com.br',
      conta_google_vinculada: Boolean(googleProfile),
      procedimentos_selecionados: selectedProcedures.map(p => ({
        procedimento_id: p.id,
        nome: p.nome,
        categoria: p.categoria,
        valor_unitario: p.valor_promocional || p.valor_tabela || 0,
      })),
      valor_total_estimado: totalEstimado,
      queixa_principal: queixaPrincipal.trim() || 'Simulação realizada no Site Oficial da Clínica.',
      periodo_preferencia: periodoPreferencia,
      status: 'pendente',
    };

    onCriarOrcamento(newQuote);
    setLastSubmittedQuote({
      ...newQuote,
      id: `orc-${Date.now()}`,
      data_solicitacao: new Date().toISOString(),
    });
    setQuoteSuccessModal(true);
    setSelectedProcedures([]);
    triggerToast('Orçamento enviado com sucesso à recepção!');
  };

  // Filter appointments for active client
  const myAppointments = useMemo(() => {
    if (!googleProfile) return [];
    const phoneClean = (googleProfile.telefone || '').replace(/\D/g, '');
    const emailClean = (googleProfile.email || '').toLowerCase().trim();
    const nameClean = (googleProfile.nome || '').toLowerCase().trim();

    return agendamentos.filter(ag => {
      if (ag.paciente_id === googleProfile.id) return true;
      const agPhone = (ag.paciente?.telefone || '').replace(/\D/g, '');
      const agEmail = (ag.paciente?.email || '').toLowerCase().trim();
      const agName = (ag.paciente?.nome || '').toLowerCase().trim();
      if (phoneClean && agPhone && (agPhone.includes(phoneClean) || phoneClean.includes(agPhone))) return true;
      if (emailClean && agEmail && agEmail === emailClean) return true;
      if (nameClean && agName && agName === nameClean) return true;
      return false;
    });
  }, [agendamentos, googleProfile]);

  // Filter quotes for active client
  const myQuotes = useMemo(() => {
    if (!googleProfile) return [];
    const phoneClean = (googleProfile.telefone || '').replace(/\D/g, '');
    const emailClean = (googleProfile.email || '').toLowerCase().trim();

    return orçamentos.filter(orc => {
      const orcPhone = (orc.paciente_telefone || '').replace(/\D/g, '');
      const orcEmail = (orc.paciente_email || '').toLowerCase().trim();
      if (phoneClean && orcPhone && (orcPhone.includes(phoneClean) || phoneClean.includes(orcPhone))) return true;
      if (emailClean && orcEmail && orcEmail === emailClean) return true;
      return false;
    });
  }, [orçamentos, googleProfile]);

  // Helper to extract embedded video (YouTube, Vimeo or direct video)
  const getEmbedVideoUrl = (url?: string): { isEmbed: boolean; src: string } => {
    if (!url || !url.trim()) return { isEmbed: false, src: '' };
    const u = url.trim();
    const ytMatch = u.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (ytMatch) {
      return { isEmbed: true, src: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0` };
    }
    const vimeoMatch = u.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
    if (vimeoMatch) {
      return { isEmbed: true, src: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
    }
    return { isEmbed: false, src: u };
  };

  // Smooth scroll support
  const scrollTo = (id: string) => {
    let targetId = id;
    if (id === 'agendamento' || id === 'simulador' || id === 'orcamento') {
      setActiveSection('agendamento');
      targetId = 'agendamento';
    } else if (id === 'quem-sou-eu' || id === 'quem_sou_eu') {
      setActiveSection('quem_sou_eu');
      targetId = 'quem-sou-eu';
    } else {
      setActiveSection(id as any);
    }

    const element = document.getElementById(targetId) || document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMobileMenuOpen(false);
  };

  // Depoimentos da clínica (com fallback para default se vazio)
  const depoimentosList: DepoimentoCliente[] = useMemo(() => {
    if (localClinicaConfig.depoimentos && localClinicaConfig.depoimentos.length > 0) {
      return localClinicaConfig.depoimentos;
    }
    return [
      {
        id: 'dep-1',
        nome: 'Carolina Mendes',
        procedimento: 'Toxina Botulínica Terço Superior',
        texto: 'Fiz a aplicação e o resultado ficou extremamente harmônico e sutil, exatamente como eu sonhava. A atenção e o cuidado dos profissionais são incomparáveis!',
        nota: 5,
        avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
        data: 'Atendida há 2 semanas',
        destaque: true
      },
      {
        id: 'dep-2',
        nome: 'Mariana Duarte Alencar',
        procedimento: 'Micropigmentação Labial Velvet',
        texto: 'Minha boca ganhou um tom rosado saudável e natural. Não senti dor durante o procedimento e a cicatrização foi perfeita com as orientações pós-sessão.',
        nota: 5,
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        data: 'Atendida no mês passado',
        destaque: true
      },
      {
        id: 'dep-3',
        nome: 'Beatriz Silveira',
        procedimento: 'Limpeza de Pele Profunda',
        texto: 'Ambiente maravilhoso, cheiroso e impecavelmente limpo! Minha pele renasceu após o protocolo, sem manchas nem vermelhidão. Já agendei a próxima.',
        nota: 5,
        avatar_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&auto=format&fit=crop&q=80',
        data: 'Atendida recentemente',
        destaque: true
      }
    ];
  }, [localClinicaConfig.depoimentos]);

  // Fotos do ambiente do Studio
  const fotosAmbienteList: string[] = useMemo(() => {
    if (localClinicaConfig.fotos_ambiente && localClinicaConfig.fotos_ambiente.length > 0) {
      return localClinicaConfig.fotos_ambiente;
    }
    return [
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1512290900672-1f55b9959a4b?w=600&auto=format&fit=crop&q=80'
    ];
  }, [localClinicaConfig.fotos_ambiente]);

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-800 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
      
      {/* Toast Feedback */}
      {toastText && (
        <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2.5 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{toastText}</span>
          </div>
        </div>
      )}

      {/* SUPER ADMIN FLOATING MASTER TOOLBAR */}
      {isSuperAdmin && (
        <div className="sticky top-0 z-50 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950 text-white px-4 py-2.5 border-b border-amber-500/30 shadow-md">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            
            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 text-amber-300 rounded-lg border border-amber-500/40 font-bold uppercase tracking-wider text-[11px]">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Super Admin</span>
              </span>
              <span className="font-medium hidden sm:inline text-slate-300">
                Edição em Tempo Real Habilitada
              </span>
            </div>

            <div className="flex items-center gap-2">
              
              {/* Toggle Mode */}
              <button
                type="button"
                onClick={toggleSuperAdminEdit}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isSuperAdminEditOn 
                    ? 'bg-amber-500 text-slate-950 shadow-sm' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
                title="Ativar ou desativar botões de edição visual"
              >
                <Edit3Icon isSuperAdminEditOn={isSuperAdminEditOn} />
                <span>{isSuperAdminEditOn ? 'Modo Edição Ativo' : 'Visualizar como Cliente'}</span>
              </button>

              {isSuperAdminEditOn && (
                <>
                  <button
                    type="button"
                    onClick={handleOpenHeroEditor}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-amber-200 rounded-xl font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Editar Título, Subtítulo, Foto Principal e Informações"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Editar Hero & Textos</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenStudioPhotosEditor}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-amber-200 rounded-xl font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Gerenciar Fotos Reais do Ambiente da Clínica"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Fotos do Ambiente</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenTestimonialModal()}
                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-amber-200 rounded-xl font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Adicionar Depoimento Real de Cliente"
                  >
                    <Quote className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">+ Depoimento</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenQuemSouEditor}
                    className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded-xl font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Editar Seção Quem Sou Eu (Foto/Vídeo da Profissional e Serviços)"
                  >
                    <User className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden md:inline">Quem Sou Eu</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={handleCopySiteLink}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Copiar Link Oficial do Site para Enviar no WhatsApp"
              >
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Copiar Link do Site</span>
              </button>

              {onReturnToAdmin && (
                <button
                  type="button"
                  onClick={onReturnToAdmin}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden lg:inline">Painel Admin</span>
                </button>
              )}

            </div>

          </div>
        </div>
      )}

      {/* Staff banner if not super admin */}
      {!isSuperAdmin && isStaff && (
        <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 text-amber-100 px-4 py-2 text-xs flex items-center justify-between shadow-xs sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span className="font-bold">Pré-visualização do Site Oficial & Agendamento Online</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySiteLink}
              className="px-2.5 py-1 bg-amber-700/80 hover:bg-amber-600 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Share2 className="w-3 h-3" />
              <span>Copiar Link Público</span>
            </button>
            {onReturnToAdmin && (
              <button
                onClick={onReturnToAdmin}
                className="px-2.5 py-1 bg-black/30 hover:bg-black/50 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Voltar ao Sistema</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* TOP HEADER & NAVIGATION */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-amber-900/10 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          {/* Logo & Clinic Name */}
          <div 
            onClick={() => scrollTo('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 text-white flex items-center justify-center font-bold shadow-md shadow-amber-600/20 group-hover:scale-105 transition-transform overflow-hidden">
              {localClinicaConfig?.logomarca_url && localClinicaConfig.logomarca_url !== '/logo.svg' ? (
                <img 
                  src={localClinicaConfig.logomarca_url} 
                  alt={localClinicaConfig.nome} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <Sparkles className="w-6 h-6 text-white" />
              )}
            </div>

            <div className="flex flex-col">
              <span className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight leading-tight group-hover:text-amber-800 transition-colors">
                {localClinicaConfig?.nome || 'Aura Estética Studio'}
              </span>
              <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
                {localClinicaConfig?.slogan ? localClinicaConfig.slogan.slice(0, 36) + '...' : 'Estética Avançada & Bem-Estar'}
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold text-slate-600">
            <button 
              onClick={() => scrollTo('home')}
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
                activeSection === 'home' ? 'text-amber-800 font-extrabold bg-amber-50' : 'hover:text-amber-800 hover:bg-slate-50'
              }`}
            >
              Início
            </button>
            <button 
              onClick={() => scrollTo('quem-sou-eu')}
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSection === 'quem_sou_eu' ? 'text-amber-800 font-extrabold bg-amber-50' : 'hover:text-amber-800 hover:bg-slate-50'
              }`}
            >
              <span>👩‍⚕️ Quem Sou Eu</span>
            </button>
            <button 
              onClick={() => scrollTo('tratamentos')}
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
                activeSection === 'tratamentos' ? 'text-amber-800 font-extrabold bg-amber-50' : 'hover:text-amber-800 hover:bg-slate-50'
              }`}
            >
              Procedimentos
            </button>
            <button 
              onClick={() => scrollTo('agendamento')}
              className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer font-bold flex items-center gap-1.5 ${
                activeSection === 'agendamento' || activeSection === 'simulador' 
                  ? 'bg-amber-100 text-amber-900 shadow-2xs font-extrabold' 
                  : 'text-amber-800 hover:bg-amber-50'
              }`}
            >
              <span>📅 Orçamento online</span>
              {selectedProcedures.length > 0 && (
                <span className="text-[10px] bg-amber-600 text-white px-1.5 py-0.5 rounded-full font-black">
                  {selectedProcedures.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => scrollTo('depoimentos')}
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
                activeSection === 'depoimentos' ? 'text-amber-800 font-extrabold bg-amber-50' : 'hover:text-amber-800 hover:bg-slate-50'
              }`}
            >
              💬 Depoimentos
            </button>
            <button 
              onClick={() => scrollTo('studio')}
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer ${
                activeSection === 'studio' ? 'text-amber-800 font-extrabold bg-amber-50' : 'hover:text-amber-800 hover:bg-slate-50'
              }`}
            >
              🏢 O Studio
            </button>
            <button 
              onClick={() => scrollTo('minha_conta')}
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer text-indigo-700 font-bold ${
                activeSection === 'minha_conta' ? 'bg-indigo-50 font-black' : 'hover:bg-indigo-50/50'
              }`}
            >
              Minha Conta
            </button>
          </nav>

          {/* Action Header Items */}
          <div className="flex items-center gap-2.5">
            
            {/* WhatsApp Quick Link */}
            <a
              href={generateWhatsAppLink('Olá! Gostaria de falar com a recepção do studio.')}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 hover:bg-emerald-100 transition-colors text-xs font-bold shadow-2xs"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp</span>
            </a>

            {/* Client Login or Avatar */}
            {!googleProfile ? (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Entrar</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 pl-1">
                <button
                  onClick={() => scrollTo('minha_conta')}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Acessar Minha Conta"
                >
                  <img
                    src={googleProfile.avatar_url}
                    alt={googleProfile.nome}
                    className="w-8 h-8 rounded-full object-cover border border-amber-300"
                  />
                  <span className="hidden xl:inline text-xs font-bold text-slate-800 truncate max-w-[100px]">
                    {googleProfile.nome.split(' ')[0]}
                  </span>
                </button>
                <button
                  onClick={() => {
                    logoutFirebase();
                    setGoogleProfile(null);
                    triggerToast('Você desconectou da sua conta.');
                  }}
                  className="p-2 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer rounded-lg hover:bg-rose-50"
                  title="Sair"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Abrir Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

          </div>

        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-2 shadow-xl animate-in slide-in-from-top-2 duration-150">
            <button 
              onClick={() => scrollTo('home')}
              className="w-full text-left px-3 py-2 rounded-lg font-semibold text-sm hover:bg-amber-50"
            >
              Início
            </button>
            <button 
              onClick={() => scrollTo('quem-sou-eu')}
              className="w-full text-left px-3 py-2 rounded-lg font-semibold text-sm hover:bg-amber-50 text-slate-800 flex items-center justify-between"
            >
              <span>👩‍⚕️ Quem Sou Eu (Especialista)</span>
              <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full">Dra.</span>
            </button>
            <button 
              onClick={() => scrollTo('tratamentos')}
              className="w-full text-left px-3 py-2 rounded-lg font-semibold text-sm hover:bg-amber-50"
            >
              Procedimentos & Tratamentos
            </button>
            <button 
              onClick={() => scrollTo('agendamento')}
              className="w-full text-left px-3 py-2.5 rounded-lg font-bold text-sm bg-amber-50/90 text-amber-900 flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <span>📅</span>
                <span>Orçamento online</span>
              </span>
              {selectedProcedures.length > 0 && (
                <span className="text-[10px] bg-amber-600 text-white font-extrabold px-2 py-0.5 rounded-full">
                  {selectedProcedures.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => scrollTo('depoimentos')}
              className="w-full text-left px-3 py-2 rounded-lg font-semibold text-sm hover:bg-amber-50 text-amber-900"
            >
              💬 Depoimentos de Clientes
            </button>
            <button 
              onClick={() => scrollTo('studio')}
              className="w-full text-left px-3 py-2 rounded-lg font-semibold text-sm hover:bg-amber-50"
            >
              🏢 O Studio & Fotos do Ambiente
            </button>
            <button 
              onClick={() => scrollTo('minha_conta')}
              className="w-full text-left px-3 py-2 rounded-lg font-semibold text-sm hover:bg-amber-50 text-indigo-700"
            >
              👤 Minha Conta / Meus Agendamentos
            </button>

            {isSuperAdmin && (
              <div className="pt-2 border-t border-amber-200 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 px-3 block">
                  Ações de Super Admin
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleOpenHeroEditor();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-amber-950 bg-amber-50"
                >
                  ✏️ Editar Hero & Textos do Site
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleOpenQuemSouEditor();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-amber-950 bg-amber-50"
                >
                  👩‍⚕️ Editar Seção Quem Sou Eu
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleOpenStudioPhotosEditor();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-amber-950 bg-amber-50"
                >
                  📷 Gerenciar Fotos do Ambiente
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleOpenTestimonialModal();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-amber-950 bg-amber-50"
                >
                  💬 Adicionar Depoimento Real
                </button>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <a
                href={generateWhatsAppLink('Olá! Gostaria de falar com a equipe da recepção.')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-center text-xs font-bold"
              >
                Falar no WhatsApp
              </a>
              {!googleProfile ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsAuthModalOpen(true);
                  }}
                  className="w-full py-2.5 border border-slate-300 rounded-xl text-center text-xs font-bold"
                >
                  Entrar / Identificar
                </button>
              ) : (
                <button
                  onClick={() => {
                    logoutFirebase();
                    setGoogleProfile(null);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 border border-rose-200 text-rose-700 rounded-xl text-center text-xs font-bold"
                >
                  Desconectar
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Website Sections */}
      <main className="flex-1">

        {/* 1. HERO SECTION */}
        <section id="home" className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
          
          {/* Subtle Ambient Background Gradients */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
            <div 
              className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full blur-3xl opacity-30"
              style={{
                background: 'radial-gradient(circle, rgba(217, 163, 76, 0.4) 0%, rgba(180, 120, 30, 0.15) 50%, transparent 75%)'
              }}
            />
            <div 
              className="absolute top-1/2 -left-32 w-[500px] h-[500px] rounded-full blur-3xl opacity-20"
              style={{
                background: 'radial-gradient(circle, rgba(147, 51, 234, 0.25) 0%, transparent 70%)'
              }}
            />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              
              {/* Left Column: Headlines & Call to Actions */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left relative">
                
                {/* Super Admin Quick Edit Button for Hero */}
                {isSuperAdmin && isSuperAdminEditOn && (
                  <div className="inline-block mb-1">
                    <button
                      type="button"
                      onClick={handleOpenHeroEditor}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                      title="Editar título, subtítulo e imagem de destaque"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Editar Textos & Fotos do Hero</span>
                    </button>
                  </div>
                )}

                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100/70 border border-amber-300/60 text-amber-900 text-xs font-bold shadow-2xs">
                  <Sparkles className="w-4 h-4 text-amber-700" />
                  <span>Protocolos de Alta Performance & Estética Avançada</span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
                  {localClinicaConfig.hero_titulo || 'Realce sua beleza natural com sofisticação e precisão.'}
                </h1>

                <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                  {localClinicaConfig.hero_subtitulo || `No ${localClinicaConfig?.nome || 'Studio'}, unimos tecnologia moderna, produtos biocompatíveis certificados e um olhar artístico exclusivo para transformar sua autoestima com total segurança.`}
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                  <button
                    onClick={() => scrollTo('agendamento')}
                    className="w-full sm:w-auto px-7 py-4 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-700 hover:to-amber-600 text-white font-extrabold rounded-2xl shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center gap-2.5 cursor-pointer text-sm"
                  >
                    <CalendarCheck className="w-5 h-5" />
                    <span>Agendar Consulta Online</span>
                  </button>

                  <button
                    onClick={() => scrollTo('tratamentos')}
                    className="w-full sm:w-auto px-6 py-4 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-2xl border border-slate-300/80 shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                  >
                    <Scissors className="w-4 h-4 text-amber-700" />
                    <span>Ver Todos os Tratamentos</span>
                  </button>
                </div>

              </div>

              {/* Right Column: Hero Showcase Card */}
              <div className="lg:col-span-5 relative">
                <div className="relative mx-auto max-w-md lg:max-w-none">
                  
                  {/* Decorative Frame */}
                  <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-amber-600 to-amber-300 opacity-20 blur-xl" />

                  <div className="relative rounded-3xl overflow-hidden bg-white shadow-2xl border border-amber-900/15 group">
                    <img 
                      src={localClinicaConfig.hero_imagem_url || 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=900&auto=format&fit=crop&q=80'} 
                      alt={localClinicaConfig.nome} 
                      className="w-full h-80 sm:h-96 object-cover" 
                    />

                    {/* Quick Edit Overlay for Hero Photo */}
                    {isSuperAdmin && isSuperAdminEditOn && (
                      <button
                        type="button"
                        onClick={handleOpenHeroEditor}
                        className="absolute top-3 right-3 px-3 py-1.5 bg-slate-900/85 hover:bg-slate-900 text-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-xs transition-all cursor-pointer border border-amber-400/40"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Trocar Foto do Hero</span>
                      </button>
                    )}

                    <div className="p-6 bg-gradient-to-b from-white to-amber-50/50 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block">
                            Experiência Premium
                          </span>
                          <h3 className="font-extrabold text-slate-900 text-base">
                            Atendimento Personalizado
                          </h3>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-800 shadow-2xs">
                          <Sparkles className="w-5 h-5" />
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        Cada paciente possui um plano individualizado com diagnóstico fotográfico, cuidados pré-sessão e acompanhamento no pós-procedimento.
                      </p>

                      <div className="pt-2 border-t border-amber-900/10 flex items-center justify-between text-xs font-semibold text-slate-700">
                        <span className="flex items-center gap-1.5 text-emerald-700">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Agenda Aberta para Este Mês
                        </span>
                        <button
                          onClick={() => scrollTo('agendamento')}
                          className="text-amber-800 hover:text-amber-950 font-bold underline cursor-pointer"
                        >
                          Orçamento online →
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* ABA & SEÇÃO: QUEM SOU EU (ESPECIALISTAS ATÉ 10 & SERVIÇOS NO STUDIO) */}
        {/* ======================================================== */}
        <section id="quem-sou-eu" className="py-16 sm:py-24 bg-gradient-to-b from-white via-amber-50/30 to-white border-b border-amber-900/10 scroll-mt-20 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Header & Badges */}
            <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
              <div className="inline-flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-widest text-amber-800 bg-amber-100/90 px-3.5 py-1.5 rounded-full border border-amber-300/70 inline-block shadow-2xs">
                  Especialistas & Responsáveis Técnicas
                </span>
                {isSuperAdmin && isSuperAdminEditOn && (
                  <button
                    type="button"
                    onClick={handleOpenQuemSouEditor}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-full text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer transition-transform hover:scale-105"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Editar Profissionais ({profissionaisQuemSou.length}/10)</span>
                  </button>
                )}
              </div>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Quem Sou Eu
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
                Conheça a trajetória de nossas especialistas, a filosofia de atendimento humanizado e os procedimentos clínicos desempenhados com excelência e segurança no studio.
              </p>
            </div>

            {/* Multi-Professional Selector (up to 10) */}
            {profissionaisQuemSou.length > 1 && (
              <div className="mb-10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Conheça Nossos Especialistas ({profissionaisQuemSou.length} profissionais disponíveis):
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {profissionaisQuemSou.map((prof, idx) => {
                    const isSelected = idx === selectedProfIndex;
                    return (
                      <button
                        key={prof.id || idx}
                        type="button"
                        onClick={() => {
                          setSelectedProfIndex(idx);
                          setQuemSouMediaTab(prof.tipo_midia || 'foto');
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                          isSelected
                            ? 'bg-amber-100/90 border-amber-600 ring-2 ring-amber-500/30 shadow-md font-bold'
                            : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
                        }`}
                      >
                        <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-200 border border-slate-300 shrink-0">
                          {prof.foto_url ? (
                            <img src={prof.foto_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <User className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-extrabold text-slate-900 block truncate">
                            {prof.nome}
                          </span>
                          <span className="text-[10px] text-amber-800 block truncate">
                            {prof.titulo}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Profile & Media Showcase */}
            <div className="bg-white rounded-3xl border border-amber-900/15 shadow-xl p-6 sm:p-10 mb-16 relative overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                
                {/* Left: Media Card (Photo or Video) */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Media Switcher */}
                  <div className="flex items-center justify-center sm:justify-start gap-2 bg-slate-100 p-1 rounded-2xl w-fit border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setQuemSouMediaTab('foto')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        quemSouMediaTab === 'foto'
                          ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Camera className="w-3.5 h-3.5 text-amber-600" />
                      <span>📸 Foto Oficial</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuemSouMediaTab('video')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        quemSouMediaTab === 'video'
                          ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Video className="w-3.5 h-3.5 text-amber-600" />
                      <span>🎥 Vídeo de Apresentação</span>
                    </button>
                  </div>

                  {/* Media Display */}
                  {quemSouMediaTab === 'foto' ? (
                    <div className="relative rounded-2xl overflow-hidden shadow-lg border-2 border-amber-200/80 group">
                      <img 
                        src={activeProfissional.foto_url || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&auto=format&fit=crop&q=80'} 
                        alt={activeProfissional.nome || 'Especialista do Studio'} 
                        className="w-full h-[400px] object-cover object-top transition-transform duration-500 group-hover:scale-102"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20 pointer-events-none" />
                      
                      {/* Floating Badges on Photo */}
                      <div className="absolute top-3 left-3 flex flex-col gap-2">
                        <span className="px-3 py-1 bg-white/95 backdrop-blur-md text-amber-900 rounded-full text-[11px] font-extrabold shadow-sm border border-white/80 flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-amber-600" />
                          <span>{activeProfissional.registro || 'Especialista Certificada'}</span>
                        </span>
                      </div>

                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-base font-extrabold block">
                              {activeProfissional.nome}
                            </span>
                            <span className="text-[11px] text-amber-200 font-medium">
                              {activeProfissional.titulo}
                            </span>
                          </div>
                          {activeProfissional.instagram && (
                            <a
                              href={`https://instagram.com/${activeProfissional.instagram.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg text-[11px] font-bold text-white flex items-center gap-1 transition-colors"
                            >
                              <Instagram className="w-3.5 h-3.5 text-amber-300" />
                              <span>{activeProfissional.instagram}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative rounded-2xl overflow-hidden shadow-lg border-2 border-amber-200/80 bg-slate-950 h-[400px] flex items-center justify-center">
                      {(() => {
                        const videoUrl = activeProfissional.video_url || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
                        const embed = getEmbedVideoUrl(videoUrl);
                        if (embed.isEmbed) {
                          return (
                            <iframe 
                              src={embed.src} 
                              title="Vídeo de Apresentação da Profissional" 
                              className="w-full h-full border-0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          );
                        }
                        if (embed.src) {
                          return (
                            <video 
                              src={embed.src} 
                              controls 
                              className="w-full h-full object-cover"
                              poster={activeProfissional.foto_url}
                            />
                          );
                        }
                        return (
                          <div className="p-8 text-center text-slate-400 space-y-3">
                            <Video className="w-12 h-12 text-amber-400 mx-auto" />
                            <p className="text-xs">Nenhum link de vídeo configurado para {activeProfissional.nome}.</p>
                            {isSuperAdmin && (
                              <button
                                type="button"
                                onClick={handleOpenQuemSouEditor}
                                className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs"
                              >
                                Adicionar Link de Vídeo
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  <p className="text-[11px] text-slate-500 text-center italic">
                    {quemSouMediaTab === 'foto' ? `📸 Registro oficial de ${activeProfissional.nome}` : `🎥 Assista ao vídeo de apresentação de ${activeProfissional.nome}`}
                  </p>
                </div>

                {/* Right: Bio & Credentials */}
                <div className="lg:col-span-7 space-y-6">
                  <div>
                    <span className="text-xs font-bold text-amber-700 uppercase tracking-widest block mb-1">
                      {activeProfissional.registro || 'Especialista Certificada'}
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                      {activeProfissional.nome}
                    </h3>
                    <p className="text-sm font-semibold text-amber-900 mt-0.5">
                      {activeProfissional.titulo}
                    </p>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {activeProfissional.bio || "Minha paixão é realçar sua beleza natural com sofisticação, precisão anatômica e segurança absoluta. Cada paciente possui proporções e expressões singulares: desenvolvo planos de tratamento individualizados, utilizando os melhores biomateriais do mundo com registro ANVISA para resultados sutis, elegantes e rejuvenescedores."}
                  </p>

                  {/* Pillars of Excellence / Differentials */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {(activeProfissional.diferenciais && activeProfissional.diferenciais.length > 0
                      ? activeProfissional.diferenciais
                      : ['Formação Continuada', 'Produtos 100% ANVISA', 'Cuidado Individualizado', 'Foco em Naturalidade']
                    ).slice(0, 4).map((dif, i) => {
                      const icons = [GraduationCap, ShieldCheck, Heart, Sparkles];
                      const IconComp = icons[i % icons.length];
                      return (
                        <div key={i} className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200/60 flex items-start gap-2.5">
                          <IconComp className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">{dif}</span>
                            <span className="text-[11px] text-slate-600">Padrão ouro em segurança e tecnologia estética.</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Stats Badges */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-2 border-t border-slate-100">
                    <div className="p-3 text-center bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="block text-lg sm:text-2xl font-black text-amber-900">
                        {activeProfissional.anos_experiencia || '+8 Anos'}
                      </span>
                      <span className="text-[10px] sm:text-xs text-slate-500 font-semibold">De Prática Clínica</span>
                    </div>
                    <div className="p-3 text-center bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="block text-lg sm:text-2xl font-black text-amber-900">+1.800</span>
                      <span className="text-[10px] sm:text-xs text-slate-500 font-semibold">Pacientes Atendidas</span>
                    </div>
                    <div className="p-3 text-center bg-slate-50 rounded-2xl border border-slate-200">
                      <span className="block text-lg sm:text-2xl font-black text-amber-900">100%</span>
                      <span className="text-[10px] sm:text-xs text-slate-500 font-semibold">Foco em Bem-Estar</span>
                    </div>
                  </div>

                  {/* Direct Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setBookingProfId(activeProfissional.id);
                        scrollTo('agendamento');
                        triggerToast(`Agendando com ${activeProfissional.nome}.`);
                      }}
                      className="flex-1 sm:flex-initial px-6 py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-extrabold rounded-2xl shadow-lg shadow-amber-600/20 text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Agendar Consulta com {activeProfissional.nome.split(' ')[0]}</span>
                    </button>

                    <a
                      href={generateWhatsAppLink(`Olá! Gostaria de tirar dúvidas com ${activeProfissional.nome} sobre os procedimentos.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 sm:flex-initial px-5 py-3.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                      <span>Tirar Dúvidas no WhatsApp</span>
                    </a>
                  </div>

                </div>

              </div>
            </div>

            {/* Sub-Section: SERVIÇOS QUE ELA DESEMPENHA NO STUDIO */}
            <div className="space-y-6 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-amber-900/10 pb-4">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-700 bg-amber-100 px-3 py-1 rounded-full border border-amber-200 inline-block mb-1">
                    Atuação Clínica no Studio
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                    Serviços Desempenhados por {activeProfissional.nome}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Conheça os tratamentos e protocolos avançados executados pessoalmente no studio.
                  </p>
                </div>

                {/* Filter chips */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {['todos', 'Harmonização Facial', 'Bioestimuladores de Colágeno', 'Injetáveis & Toxina', 'Limpeza & Peelings'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setQuemSouCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        quemSouCategoryFilter === cat
                          ? 'bg-amber-800 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                      }`}
                    >
                      {cat === 'todos' ? 'Todos os Serviços' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Procedures performed grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {procedimentosList
                  .filter(p => p.ativo !== false)
                  .filter(p => {
                    if (activeProfissional.servicos_ids && activeProfissional.servicos_ids.length > 0) {
                      return activeProfissional.servicos_ids.includes(p.id);
                    }
                    return true;
                  })
                  .filter(p => {
                    if (quemSouCategoryFilter === 'todos') return true;
                    if (quemSouCategoryFilter === 'Harmonização Facial') return p.categoria.toLowerCase().includes('harmoniz') || p.nome.toLowerCase().includes('harmoniz') || p.nome.toLowerCase().includes('preenchimento');
                    if (quemSouCategoryFilter === 'Bioestimuladores de Colágeno') return p.categoria.toLowerCase().includes('colágeno') || p.nome.toLowerCase().includes('sculptra') || p.nome.toLowerCase().includes('radiesse') || p.nome.toLowerCase().includes('bioestimulador');
                    if (quemSouCategoryFilter === 'Injetáveis & Toxina') return p.categoria.toLowerCase().includes('injet') || p.nome.toLowerCase().includes('botox') || p.nome.toLowerCase().includes('toxina');
                    if (quemSouCategoryFilter === 'Limpeza & Peelings') return p.categoria.toLowerCase().includes('limpeza') || p.categoria.toLowerCase().includes('peeling') || p.nome.toLowerCase().includes('pele');
                    return p.categoria === quemSouCategoryFilter;
                  })
                  .slice(0, 6)
                  .map(proc => {
                    const preco = proc.valor_promocional || proc.valor_tabela || 0;
                    const precoPix = preco * 0.95;
                    const isAdded = selectedProcedures.some(sp => sp.id === proc.id);

                    return (
                      <div 
                        key={proc.id} 
                        className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                      >
                        <div className="relative h-44 bg-slate-100 overflow-hidden">
                          <img 
                            src={proc.imagem_url || 'https://images.unsplash.com/photo-1512290900672-1f55b9959a4b?w=600&auto=format&fit=crop&q=80'} 
                            alt={proc.nome} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                            <span className="px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-md text-amber-900 text-[10px] font-extrabold border border-white/70 shadow-2xs">
                              {proc.categoria}
                            </span>
                          </div>
                          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-semibold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-300" />
                            <span>{proc.duracao_minutos} min</span>
                          </div>
                        </div>

                        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-amber-800 transition-colors">
                              {proc.nome}
                            </h4>
                            <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                              {proc.descricao || 'Protocolo avançado realizado com técnica minimamente invasiva e produtos biocompatíveis.'}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                            <div>
                              <span className="text-[10px] font-bold uppercase text-slate-400 block">A partir de</span>
                              <span className="font-extrabold text-amber-900 text-base">
                                R$ {preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              R$ {precoPix.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} no PIX
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setBookingProcId(proc.id);
                                setBookingProfId(activeProfissional.id);
                                scrollTo('agendamento');
                                triggerToast(`Selecionado: ${proc.nome} com ${activeProfissional.nome}. Escolha a data.`);
                              }}
                              className="py-2 px-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Agendar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleProcedureInCart(proc)}
                              className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer border ${
                                isAdded 
                                  ? 'bg-amber-100 text-amber-900 border-amber-300 font-black' 
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {isAdded ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                              <span>{isAdded ? 'No Orçamento' : '+ Orçamento'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

          </div>
        </section>

        {/* 2. CATÁLOGO DE PROCEDIMENTOS & TRATAMENTOS */}
        <section id="tratamentos" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
            <span className="text-xs font-extrabold uppercase tracking-widest text-amber-800 bg-amber-100/80 px-3 py-1 rounded-full border border-amber-300/60 inline-block">
              Nossos Tratamentos
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Catálogo de Procedimentos com Valores Transparentes
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Escolha seu tratamento, confira os detalhes clínicos, monte sua simulação de investimento ou agende sua consulta imediatamente.
            </p>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="space-y-4 mb-8">
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
              
              {/* Live Search Input */}
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pesquisar por nome ou indicação..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Counter & Action */}
              <div className="flex items-center gap-3 text-xs text-slate-500 w-full sm:w-auto justify-between sm:justify-end">
                <span>Exibindo <strong>{filteredProcedures.length}</strong> procedimentos ativos</span>
                {selectedProcedures.length > 0 && (
                  <button
                    onClick={() => scrollTo('agendamento')}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold transition-colors cursor-pointer text-xs"
                  >
                    Ver Orçamento ({selectedProcedures.length})
                  </button>
                )}
              </div>

            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
              {categories.map((cat) => {
                const isSelected = categoryFilter === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-700 text-white shadow-sm shadow-amber-800/30'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                    }`}
                  >
                    {cat === 'todos' ? '🌟 Todos os Procedimentos' : cat}
                  </button>
                );
              })}
            </div>

          </div>

          {/* Procedures Grid */}
          {filteredProcedures.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
              <Sparkles className="w-10 h-10 text-amber-500 mx-auto" />
              <h3 className="font-bold text-slate-800 text-base">Nenhum procedimento encontrado</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Não localizamos procedimentos para o termo &quot;{searchQuery}&quot; ou na categoria selecionada.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('todos');
                }}
                className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold"
              >
                Limpar Filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredProcedures.map((proc) => {
                const isSelectedInCart = selectedProcedures.some(p => p.id === proc.id);
                const precoTabela = proc.valor_tabela || 0;
                const precoPromo = proc.valor_promocional;
                const precoFinal = precoPromo || precoTabela;
                const valorPix = precoFinal * 0.95;
                const parcela10x = precoFinal / 10;

                const defaultImg = 'https://images.unsplash.com/photo-1512290900672-1f55b9959a4b?w=700&auto=format&fit=crop&q=80';
                const mainImg = proc.imagem_url || (proc.imagens_galeria && proc.imagens_galeria[0]) || defaultImg;

                return (
                  <div
                    key={proc.id}
                    className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group relative"
                  >
                    {/* Image Header with Category Badge */}
                    <div className="relative h-52 sm:h-56 overflow-hidden bg-slate-100">
                      <img
                        src={mainImg}
                        alt={proc.nome}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      
                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                        <span className="px-2.5 py-1 bg-white/90 backdrop-blur-md text-amber-900 rounded-full text-[11px] font-extrabold shadow-sm border border-white/60">
                          {proc.categoria}
                        </span>

                        <div className="flex items-center gap-1 bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[11px] font-semibold">
                          <Clock className="w-3.5 h-3.5 text-amber-300" />
                          <span>{proc.duracao_minutos} min</span>
                        </div>
                      </div>

                      {/* Super Admin Quick Photo Edit Button */}
                      {isSuperAdmin && isSuperAdminEditOn && (
                        <button
                          type="button"
                          onClick={() => {
                            setProcToEditPhoto(proc);
                            setEditingPhotoUrl(proc.imagem_url || '');
                            setEditingGalleryUrls(proc.imagens_galeria || [proc.imagem_url || '']);
                          }}
                          className="absolute top-12 right-3 p-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl shadow-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition-transform hover:scale-105 z-10"
                          title="Alterar foto real deste procedimento"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span className="text-[10px]">Foto Real</span>
                        </button>
                      )}

                      {/* Quick Detail Trigger Icon */}
                      <button
                        onClick={() => {
                          setProcedureForDetails(proc);
                          setActivePhotoIndex(0);
                        }}
                        className="absolute bottom-3 right-3 p-2 bg-white/90 hover:bg-white text-slate-800 rounded-xl shadow-md backdrop-blur-xs transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1"
                        title="Ver fotos e detalhes"
                      >
                        <Eye className="w-4 h-4 text-amber-700" />
                        <span className="text-[11px]">Detalhes</span>
                      </button>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                      
                      <div className="space-y-2">
                        <h3 className="font-extrabold text-slate-900 text-base sm:text-lg group-hover:text-amber-800 transition-colors leading-snug">
                          {proc.nome}
                        </h3>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal">
                          {proc.descricao || 'Tratamento especializado com protocolo individualizado e tecnologia de ponta.'}
                        </p>
                      </div>

                      {/* Pricing Block */}
                      <div className="bg-amber-50/50 p-3.5 rounded-2xl border border-amber-900/10 space-y-1">
                        <div className="flex items-baseline justify-between">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Investimento</span>
                          {precoPromo && (
                            <span className="text-xs text-slate-400 line-through">
                              R$ {precoTabela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          )}
                        </div>

                        <div className="flex items-baseline gap-2">
                          <span className="text-xl sm:text-2xl font-black text-amber-900">
                            R$ {precoFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-700">
                            (R$ {valorPix.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} no PIX)
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-600 font-medium">
                          ou em até <strong>10x de R$ {parcela10x.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> sem juros
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="space-y-2 pt-2">
                        <div className="grid grid-cols-2 gap-2">
                          
                          {/* Direct Book Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setBookingProcId(proc.id);
                              scrollTo('agendamento');
                              triggerToast(`Selecionado: ${proc.nome}. Escolha a data.`);
                            }}
                            className="py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Agendar</span>
                          </button>

                          {/* Add to VIP Quote */}
                          <button
                            type="button"
                            onClick={() => toggleProcedureInCart(proc)}
                            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                              isSelectedInCart
                                ? 'bg-amber-100 text-amber-900 border-amber-300 font-extrabold'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {isSelectedInCart ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-amber-700" />
                                <span>No Orçamento</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span>+ Orçamento</span>
                              </>
                            )}
                          </button>

                        </div>

                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </section>

        {/* ======================================================== */}
        {/* 3. SEÇÃO UNIFICADA: ORÇAMENTO ONLINE & AGENDAMENTO 24H */}
        {/* ======================================================== */}
        <section id="agendamento" className="py-16 sm:py-24 bg-gradient-to-b from-amber-50/50 via-white to-amber-50/30 border-y border-amber-900/10 scroll-mt-20 relative">
          {/* Invisible anchor targets for backwards compatibility with #simulador and #orcamento links */}
          <div id="simulador" className="absolute -top-24 opacity-0 pointer-events-none" />
          <div id="orcamento" className="absolute -top-24 opacity-0 pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Unified Header */}
            <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
              <span className="text-xs font-extrabold uppercase tracking-widest text-amber-800 bg-amber-100/90 px-3.5 py-1.5 rounded-full border border-amber-300/70 inline-block shadow-2xs">
                Simulação de Protocolo & Reserva 24h
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Orçamento online
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
                Monte seu protocolo personalizado de procedimentos, veja as condições especiais de pagamento com desconto à vista ou parcelamento sem juros, e garanta seu horário na agenda clínica em tempo real.
              </p>
            </div>

            {/* UNIFIED INTERACTIVE GRID: PROTOCOLO / ORÇAMENTO (LEFT) + AGENDAMENTO (RIGHT) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* ========================================== */}
              {/* LEFT COLUMN: SIMULAÇÃO & PROCEDIMENTOS */}
              {/* ========================================== */}
              <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-amber-900/15 shadow-xl space-y-6">
                
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center font-extrabold shadow-md shadow-amber-600/20">
                      <Sparkles className="w-5 h-5 text-amber-100" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base">Procedimentos do Orçamento</h3>
                      <p className="text-[11px] text-slate-500">
                        {selectedProcedures.length} {selectedProcedures.length === 1 ? 'item selecionado' : 'itens selecionados'}
                      </p>
                    </div>
                  </div>

                  {selectedProcedures.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedProcedures([])}
                      className="text-xs text-rose-600 hover:text-rose-800 font-bold cursor-pointer transition-colors"
                    >
                      Limpar Lista
                    </button>
                  )}
                </div>

                {/* Quick Add Procedure Selector */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Adicionar Tratamento ao Orçamento:
                  </label>
                  <div className="relative">
                    <select
                      value=""
                      onChange={(e) => {
                        const procId = e.target.value;
                        if (!procId) return;
                        const found = procedimentosList.find(p => p.id === procId);
                        if (found) {
                          toggleProcedureInCart(found);
                        }
                        e.target.value = '';
                      }}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                    >
                      <option value="">+ Selecionar procedimento para somar...</option>
                      {procedimentosList.filter(p => p.ativo !== false).map(proc => {
                        const isAdded = selectedProcedures.some(sp => sp.id === proc.id);
                        return (
                          <option key={proc.id} value={proc.id}>
                            {isAdded ? '✓ [Já incluso] ' : '+ '} {proc.nome} — R$ {(proc.valor_promocional || proc.valor_tabela).toFixed(2)}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Quick Popular Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {procedimentosList.slice(0, 4).map(p => {
                      const isAdded = selectedProcedures.some(sp => sp.id === p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => toggleProcedureInCart(p)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                            isAdded
                              ? 'bg-amber-100 text-amber-950 border-amber-300 shadow-2xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                          }`}
                        >
                          {isAdded ? '✓' : '+'} {p.nome.split(' ')[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Procedures Cart List */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Tratamentos Incluídos na sua Simulação:
                  </label>
                  
                  {selectedProcedures.length === 0 ? (
                    <div className="p-6 text-center bg-slate-50/80 rounded-2xl border border-dashed border-slate-300 text-slate-500 space-y-2">
                      <Sparkles className="w-7 h-7 text-amber-500 mx-auto" />
                      <p className="text-xs font-bold text-slate-700">Nenhum procedimento selecionado ainda</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Escolha no campo acima ou clique em <strong>&quot;+ Orçamento&quot;</strong> em qualquer card da aba Tratamentos para ver os valores e parcelamento.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {selectedProcedures.map(p => (
                        <div key={p.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center justify-between gap-3 shadow-2xs">
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-xs text-slate-900 block truncate">{p.nome}</span>
                            <span className="text-[10px] text-slate-500">{p.categoria} • {p.duracao_minutos} min</span>
                          </div>
                          <div className="flex items-center gap-2.5 shrink-0">
                            <span className="font-extrabold text-xs text-amber-900">
                              R$ {(p.valor_promocional || p.valor_tabela).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleProcedureInCart(p)}
                              className="w-6 h-6 rounded-full bg-rose-100 hover:bg-rose-200 text-rose-700 flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
                              title="Remover"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Live Financial Calculation Box */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-amber-100/50 to-amber-50 border border-amber-200/80 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-700">
                    <span className="font-semibold">Valor Total Estimado:</span>
                    <span className="font-extrabold text-slate-900 text-base">
                      R$ {totalEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold bg-emerald-50/80 p-2 rounded-xl border border-emerald-200/60">
                    <span className="flex items-center gap-1.5 font-bold">
                      <Percent className="w-3.5 h-3.5 text-emerald-700" /> À vista no PIX (5% OFF):
                    </span>
                    <span className="font-black text-emerald-700 text-sm">
                      R$ {totalComDescontoPix.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-700 border-t border-amber-200/60 pt-2">
                    <span>Condições no Cartão de Crédito:</span>
                    <span className="font-bold text-slate-900">
                      até 10x de R$ {valorParcela10x.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} sem juros
                    </span>
                  </div>
                </div>

                {/* Trust Differentials */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-medium">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>Produtos 100% ANVISA</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Avaliação inclusa</span>
                  </div>
                </div>

                {/* Send via WhatsApp quick quote */}
                {selectedProcedures.length > 0 && (
                  <a
                    href={generateWhatsAppLink(
                      `Olá! Gostaria de consultar sobre meu Orçamento Online montado no site: ${selectedProcedures.map(p => p.nome).join(' + ')}. Total estimado: R$ ${totalEstimado.toFixed(2)} (ou R$ ${totalComDescontoPix.toFixed(2)} no PIX à vista).`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>Enviar este Orçamento pelo WhatsApp</span>
                  </a>
                )}

              </div>

              {/* ========================================== */}
              {/* RIGHT COLUMN: AGENDAMENTO ONLINE & CONFIRMAÇÃO */}
              {/* ========================================== */}
              <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-amber-900/15 shadow-xl space-y-6">
                
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center font-extrabold shadow-md">
                      <Calendar className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base">Reserve seu Horário na Agenda</h3>
                      <p className="text-[11px] text-slate-500">
                        Atendimento com hora marcada e confirmação em tempo real
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300">
                    Agenda Aberta
                  </span>
                </div>

                <form onSubmit={handleDirectBooking} className="space-y-6">
                  
                  {/* Step 1: Procedimento Principal ou Avaliação (caso não tenha selecionado no simulador) */}
                  {selectedProcedures.length === 0 && (
                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                        1. Procedimento ou Avaliação Clínica *
                      </label>
                      <select
                        value={bookingProcId}
                        onChange={(e) => setBookingProcId(e.target.value)}
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      >
                        <option value="">Selecione o procedimento na lista...</option>
                        {procedimentosList.filter(p => p.ativo !== false).map(proc => (
                          <option key={proc.id} value={proc.id}>
                            {proc.nome} • ({proc.categoria}) — R$ {(proc.valor_promocional || proc.valor_tabela).toFixed(2)} ({proc.duracao_minutos} min)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Step 2: Profissional de Preferência & Data */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                        {selectedProcedures.length > 0 ? '1.' : '2.'} Especialista / Profissional
                      </label>
                      <select
                        value={bookingProfId}
                        onChange={(e) => setBookingProfId(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      >
                        <option value="qualquer">Qualquer Especialista Disponível (Mais Rápido)</option>
                        {profissionaisQuemSou.map(prof => (
                          <option key={prof.id} value={prof.id}>
                            {prof.nome} — {prof.titulo}
                          </option>
                        ))}
                        {profissionais.filter(p => p.role !== 'cliente' && !profissionaisQuemSou.some(pq => pq.nome === p.nome)).map(prof => (
                          <option key={prof.id} value={prof.id}>
                            {prof.nome} ({prof.cargo || prof.profissao || 'Especialista'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                        {selectedProcedures.length > 0 ? '2.' : '3.'} Data da Consulta *
                      </label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      />
                    </div>

                  </div>

                  {/* Step 3: Turno e Horário Disponível */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                      {selectedProcedures.length > 0 ? '3.' : '4.'} Horário Preferencial *
                    </label>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      {[
                        { slot: '08:30', turno: 'Manhã' },
                        { slot: '09:30', turno: 'Manhã' },
                        { slot: '10:30', turno: 'Manhã' },
                        { slot: '11:30', turno: 'Manhã' },
                        { slot: '14:00', turno: 'Tarde' },
                        { slot: '15:30', turno: 'Tarde' },
                        { slot: '17:00', turno: 'Tarde' },
                        { slot: '18:30', turno: 'Noite' },
                      ].map(({ slot, turno }) => {
                        const isSelected = bookingTimeSlot === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setBookingTimeSlot(slot)}
                            className={`p-2.5 rounded-2xl text-center border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-700 text-white border-amber-800 font-extrabold shadow-sm'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 text-xs'
                            }`}
                          >
                            <span className="block text-sm font-bold">{slot}</span>
                            <span className={`text-[10px] ${isSelected ? 'text-amber-200' : 'text-slate-400'}`}>{turno}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 4: Client Identification */}
                  <div className="pt-4 border-t border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        {selectedProcedures.length > 0 ? '4.' : '5.'} Seus Dados para Confirmação
                      </span>
                      {!googleProfile && (
                        <button
                          type="button"
                          onClick={handleGoogleSignIn}
                          disabled={isAuthLoading}
                          className="text-xs text-amber-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          Preencher com Conta Google
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Seu Nome Completo *
                        </label>
                        <input
                          type="text"
                          required
                          value={bookingClientName}
                          onChange={(e) => setBookingClientName(e.target.value)}
                          placeholder="Ex: Mariana Albuquerque"
                          className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          WhatsApp para Contato *
                        </label>
                        <input
                          type="tel"
                          required
                          value={bookingClientPhone}
                          onChange={(e) => setBookingClientPhone(formatPhoneBR(e.target.value))}
                          placeholder="(11) 99999-8888"
                          className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          E-mail (opcional)
                        </label>
                        <input
                          type="email"
                          value={bookingClientEmail}
                          onChange={(e) => setBookingClientEmail(e.target.value)}
                          placeholder="seu.email@exemplo.com"
                          className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900"
                        />
                      </div>

                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Observações Clínicas ou Queixas (opcional)
                      </label>
                      <textarea
                        rows={2}
                        value={bookingNotes}
                        onChange={(e) => setBookingNotes(e.target.value)}
                        placeholder="Ex: Primeira vez no studio, gostaria de focar em rejuvenescimento facial..."
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900"
                      />
                    </div>

                  </div>

                  {/* Submit Booking */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={bookingSubmitting}
                      className="w-full py-4 px-6 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-700 hover:to-amber-600 text-white font-extrabold rounded-2xl shadow-xl shadow-amber-600/25 transition-all flex items-center justify-center gap-3 cursor-pointer text-sm sm:text-base disabled:opacity-70"
                    >
                      {bookingSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Confirmando na agenda...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Confirmar Orçamento & Agendamento Online</span>
                        </>
                      )}
                    </button>
                    <p className="text-[11px] text-center text-slate-500 mt-2">
                      ✓ Confirmação em tempo real na tela e envio de detalhes para o seu WhatsApp.
                    </p>
                  </div>

                </form>

              </div>

            </div>

          </div>
        </section>

        {/* 5. SEÇÃO DE DEPOIMENTOS REAIS DE CLIENTES ATENDIDAS */}
        <section id="depoimentos" className="py-16 sm:py-24 bg-gradient-to-b from-white via-amber-50/40 to-white border-y border-amber-900/10 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-12">
              <div className="text-center sm:text-left space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-widest text-amber-800 bg-amber-100/80 px-3 py-1 rounded-full border border-amber-300/60 inline-block">
                  Avaliações Verificadas
                </span>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  Depoimentos de Nossas Clientes
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-xl">
                  Histórias reais de transformação, confiança e bem-estar contadas por quem viveu a experiência em nosso studio.
                </p>
              </div>

              {/* Super Admin Quick Add Testimonial */}
              {isSuperAdmin && isSuperAdminEditOn && (
                <button
                  type="button"
                  onClick={() => handleOpenTestimonialModal()}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-2xl text-xs font-extrabold flex items-center gap-2 shadow-md transition-all cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Depoimento Real</span>
                </button>
              )}
            </div>

            {/* Testimonials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {depoimentosList.map((dep) => (
                <div
                  key={dep.id}
                  className="bg-white rounded-3xl p-6 sm:p-7 border border-amber-900/10 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative group"
                >
                  {/* Super Admin Edit & Delete Buttons for each Testimonial */}
                  {isSuperAdmin && isSuperAdminEditOn && (
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-90 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => handleOpenTestimonialModal(dep)}
                        className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        title="Editar este depoimento"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTestimonial(dep.id)}
                        className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        title="Excluir este depoimento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="space-y-3">
                    {/* Stars */}
                    <div className="flex items-center gap-1 text-amber-500">
                      {Array.from({ length: dep.nota || 5 }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-500" />
                      ))}
                    </div>

                    {/* Text Quote */}
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                      &quot;{dep.texto}&quot;
                    </p>
                  </div>

                  {/* Client Info Footer */}
                  <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                    <img
                      src={dep.avatar_url || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80'}
                      alt={dep.nome}
                      className="w-11 h-11 rounded-full object-cover border-2 border-amber-200 shadow-xs"
                    />
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">
                        {dep.nome}
                      </h4>
                      <p className="text-[11px] text-amber-800 font-semibold truncate">
                        {dep.procedimento}
                      </p>
                      {dep.data && (
                        <span className="text-[10px] text-slate-400 block">
                          {dep.data}
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              ))}
            </div>

          </div>
        </section>

        {/* 6. O STUDIO & FOTOS REAIS DO AMBIENTE */}
        <section id="studio" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left: About Text & Clinic Info */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-widest text-amber-800 bg-amber-100/80 px-3 py-1 rounded-full border border-amber-300/60 inline-block">
                  Espaço Aconchegante & Biosseguro
                </span>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  Nosso Studio & Estrutura
                </h2>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {localClinicaConfig.sobre_studio_texto || 'Localizado estrategicamente com fácil acesso e estacionamento, nosso studio conta com salas climatizadas, macas automatizadas com aquecimento lombar e autoclave hospitalar para esterilização grau máximo.'}
              </p>

              {/* Location & Contacts Card */}
              <div className="bg-white p-5 rounded-2xl border border-amber-900/15 shadow-xs space-y-3 text-xs">
                
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">Endereço:</span>
                    <span className="text-slate-600">
                      {localClinicaConfig?.endereco || 'Av. Paulista, 1500 - Conjunto 802, Bela Vista - São Paulo / SP'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-amber-700 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-900 block">Telefone / Recepção:</span>
                    <span className="text-slate-600">
                      {localClinicaConfig?.telefone ? formatPhoneBR(localClinicaConfig.telefone) : '(11) 98111-2233'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block">Horário de Funcionamento:</span>
                    <span className="text-slate-600 block">
                      {localClinicaConfig?.horario_semana || 'Segunda a Sexta: 08:00 às 19:30'}
                    </span>
                    <span className="text-slate-600 block">
                      {localClinicaConfig?.horario_sabado || 'Sábados: 08:00 às 15:00'}
                    </span>
                  </div>
                </div>

              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(localClinicaConfig?.endereco || 'Aura Estética')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
                >
                  <Navigation className="w-4 h-4 text-amber-400" />
                  <span>Como Chegar (Google Maps)</span>
                </a>

                {/* Super Admin Edit Studio Environment Photos */}
                {isSuperAdmin && isSuperAdminEditOn && (
                  <button
                    type="button"
                    onClick={handleOpenStudioPhotosEditor}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Gerenciar Fotos Reais do Ambiente</span>
                  </button>
                )}
              </div>

            </div>

            {/* Right: Studio Environment Real Photos Gallery */}
            <div className="lg:col-span-7">
              <div className={`grid gap-4 ${fotosAmbienteList.length > 4 ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2'}`}>
                {fotosAmbienteList.map((fotoUrl, idx) => (
                  <div 
                    key={idx} 
                    className="relative rounded-2xl overflow-hidden shadow-md group h-40 sm:h-48 bg-slate-100"
                  >
                    <img
                      src={fotoUrl}
                      alt={`Ambiente ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <span className="text-white text-[11px] font-semibold">
                        Ambiente Esterilizado & Confortável
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </section>

        {/* 7. ÁREA DO CLIENTE / MINHA CONTA */}
        <section id="minha_conta" className="py-16 sm:py-24 bg-gradient-to-b from-slate-50 to-white border-t border-slate-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="text-center max-w-xl mx-auto space-y-2 mb-10">
              <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200 inline-block">
                Área Exclusiva da Paciente
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Meus Agendamentos & Orçamentos
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Acesse seus horários confirmados, histórico de atendimentos e orientações pós-procedimento.
              </p>
            </div>

            {/* Client Card Profile or Login Prompt */}
            {!googleProfile ? (
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-lg text-center space-y-6 max-w-md mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
                  <User className="w-8 h-8" />
                </div>
                
                <div className="space-y-1">
                  <h3 className="font-extrabold text-slate-900 text-lg">Identifique-se para acessar</h3>
                  <p className="text-xs text-slate-500">
                    Conecte sua conta com Google ou informe seu WhatsApp para consultar seus horários e protocolos.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={isAuthLoading}
                    className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl border border-slate-300 shadow-xs text-xs flex items-center justify-center gap-3 cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Entrar com Conta Google</span>
                  </button>

                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Phone className="w-4 h-4 text-amber-400" />
                    <span>Identificar com WhatsApp</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-lg space-y-8">
                
                {/* Profile Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-100">
                  <div className="flex items-center gap-4 text-center sm:text-left">
                    <img
                      src={googleProfile.avatar_url}
                      alt={googleProfile.nome}
                      className="w-16 h-16 rounded-full object-cover border-2 border-indigo-200 shadow-sm"
                    />
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-lg">
                        {googleProfile.nome}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1 justify-center sm:justify-start">
                        {googleProfile.telefone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-emerald-600" />
                            {formatPhoneBR(googleProfile.telefone)}
                          </span>
                        )}
                        {googleProfile.email && (
                          <span>• {googleProfile.email}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      logoutFirebase();
                      setGoogleProfile(null);
                    }}
                    className="px-4 py-2 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Desconectar
                  </button>
                </div>

                {/* Subsections: Appointments, Quotes, Care */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* 1. Meus Agendamentos */}
                  <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                        <CalendarCheck className="w-4 h-4 text-amber-700" />
                        <span>Meus Agendamentos</span>
                      </h4>
                      <span className="text-xs font-bold text-slate-500">
                        {myAppointments.length} agendado(s)
                      </span>
                    </div>

                    {myAppointments.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs space-y-1">
                        <p>Você ainda não possui horários agendados.</p>
                        <button
                          onClick={() => scrollTo('agendamento')}
                          className="text-amber-800 font-bold underline cursor-pointer"
                        >
                          Agendar uma consulta online agora
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {myAppointments.map(ag => (
                          <div key={ag.id} className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1 shadow-2xs">
                            <div className="flex items-center justify-between font-bold text-slate-800">
                              <span>{ag.procedimento}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-extrabold ${
                                ag.status === 'confirmado' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {ag.status}
                              </span>
                            </div>
                            <div className="text-slate-500 text-[11px] flex items-center justify-between">
                              <span>📅 {new Date(ag.data_hora).toLocaleDateString('pt-BR')} às {new Date(ag.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                              <span>{ag.profissional_nome || 'Especialista'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 2. Meus Orçamentos */}
                  <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        <span>Meus Orçamentos VIP</span>
                      </h4>
                      <span className="text-xs font-bold text-slate-500">
                        {myQuotes.length} solicitado(s)
                      </span>
                    </div>

                    {myQuotes.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs space-y-1">
                        <p>Nenhum orçamento pendente.</p>
                        <button
                          onClick={() => scrollTo('agendamento')}
                          className="text-amber-800 font-bold underline cursor-pointer"
                        >
                          Fazer uma nova simulação online
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {myQuotes.map(orc => (
                          <div key={orc.id} className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1 shadow-2xs">
                            <div className="flex items-center justify-between font-bold text-slate-800">
                              <span>{orc.procedimentos_selecionados && orc.procedimentos_selecionados.length > 0 ? orc.procedimentos_selecionados.map(p => p.nome).join(', ') : orc.procedimento_nome || 'Procedimento Clínico'}</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-extrabold uppercase">
                                {orc.status}
                              </span>
                            </div>
                            <div className="text-slate-500 text-[11px] flex items-center justify-between">
                              <span>Total: R$ {(orc.valor_total_estimado || orc.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              <span>Solicitado em: {new Date(orc.data_solicitacao).toLocaleDateString('pt-BR')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

                {/* 3. Guia de Cuidados Pós-Sessão & Home Care */}
                <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                    <ShieldCheck className="w-5 h-5 text-amber-700" />
                    <span>Manual de Cuidados Pós-Procedimento & Home Care</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700">
                    <div className="p-3 bg-white rounded-xl border border-amber-200/60 space-y-1">
                      <span className="font-extrabold text-amber-800 block">☀️ Proteção Solar</span>
                      <p className="text-[11px] text-slate-600">Aplique filtro solar FPS 50+ a cada 3 horas, mesmo em dias nublados ou em ambientes fechados.</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-amber-200/60 space-y-1">
                      <span className="font-extrabold text-amber-800 block">💧 Hidratação Contínua</span>
                      <p className="text-[11px] text-slate-600">Beba pelo menos 2 litros de água ao dia para otimizar os bioestimuladores e o preenchimento.</p>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-amber-200/60 space-y-1">
                      <span className="font-extrabold text-amber-800 block">🚫 Primeiras 48 Horas</span>
                      <p className="text-[11px] text-slate-600">Evite sauna, banhos muito quentes, atividades físicas extenuantes e exposição solar direta.</p>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>
        </section>

      </main>

      {/* FOOTER OFICIAL DO SITE */}
      <footer className="bg-slate-950 text-slate-400 pt-16 pb-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            
            {/* Brand Col */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-extrabold text-white text-base block">
                    {localClinicaConfig?.nome || 'Aura Estética Studio'}
                  </span>
                  <span className="text-[11px] text-amber-300">
                    Estética Avançada & Bem-Estar
                  </span>
                </div>
              </div>

              <p className="text-slate-400 leading-relaxed text-xs">
                Excelência clínica, biossegurança e protocolos sob medida para realçar sua essência e harmonia natural.
              </p>

              {localClinicaConfig?.cnpj && (
                <span className="text-[11px] text-slate-500 block">CNPJ: {localClinicaConfig.cnpj}</span>
              )}
            </div>

            {/* Quick Links */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">Navegação Rápida</h4>
              <ul className="space-y-2 text-xs">
                <li><button onClick={() => scrollTo('home')} className="hover:text-amber-300 cursor-pointer">Início</button></li>
                <li><button onClick={() => scrollTo('quem-sou-eu')} className="hover:text-amber-300 cursor-pointer">Quem Sou Eu (Especialistas)</button></li>
                <li><button onClick={() => scrollTo('tratamentos')} className="hover:text-amber-300 cursor-pointer">Procedimentos & Tratamentos</button></li>
                <li><button onClick={() => scrollTo('agendamento')} className="hover:text-amber-300 cursor-pointer">Orçamento online & Agendamento</button></li>
                <li><button onClick={() => scrollTo('depoimentos')} className="hover:text-amber-300 cursor-pointer">Depoimentos de Clientes</button></li>
                <li><button onClick={() => scrollTo('studio')} className="hover:text-amber-300 cursor-pointer">O Studio & Ambiente</button></li>
                <li><button onClick={() => scrollTo('minha_conta')} className="hover:text-amber-300 cursor-pointer">Área da Cliente</button></li>
              </ul>
            </div>

            {/* Contacts */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">Contatos Oficiais</h4>
              <ul className="space-y-2 text-xs">
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{localClinicaConfig?.telefone ? formatPhoneBR(localClinicaConfig.telefone) : '(11) 98111-2233'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{localClinicaConfig?.email_contato || 'contato@studiodebelezafeminina.com.br'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{localClinicaConfig?.endereco || 'Av. Paulista, 1500 - Conjunto 802, Bela Vista - São Paulo / SP'}</span>
                </li>
              </ul>
            </div>

            {/* Security & Team Access */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">Acesso da Equipe</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Colaboradores, profissionais de saúde e recepcionistas podem acessar o painel de gestão clínica:
              </p>
              {onReturnToAdmin ? (
                <button
                  onClick={onReturnToAdmin}
                  className="w-full py-2.5 px-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LayoutDashboard className="w-4 h-4 text-amber-400" />
                  <span>Acessar Painel Clínico</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="w-full py-2.5 px-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-amber-400" />
                  <span>Login no Sistema</span>
                </button>
              )}
            </div>

          </div>

          <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <span>© {new Date().getFullYear()} {localClinicaConfig?.nome || 'Aura Estética Studio'} • Todos os direitos reservados.</span>
            <div className="flex items-center gap-4">
              <span>Termos de Uso</span>
              <span>•</span>
              <span>Privacidade & LGPD</span>
              <span>•</span>
              <span>Responsabilidade Médica</span>
            </div>
          </div>

        </div>
      </footer>

      {/* Floating WhatsApp Quick Action Button */}
      <a
        href={generateWhatsAppLink('Olá! Estou navegando no site do estúdio e gostaria de tirar algumas dúvidas.')}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 p-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-2xl hover:scale-105 transition-all flex items-center gap-2 font-bold text-xs group"
        aria-label="Falar no WhatsApp"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="hidden sm:inline font-bold">Fale Conosco</span>
      </a>

      {/* ======================================================== */}
      {/* MODAL 1: SUPER ADMIN EDIT HERO & TEXTS OF THE SITE */}
      {/* ======================================================== */}
      {isHeroTextModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                    Editar Textos & Fotos do Hero do Site
                  </h3>
                  <p className="text-xs text-slate-500">Personalize o visual principal exibido aos clientes</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHeroTextModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveHeroEditor} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Título Principal do Hero (Destaque)
                </label>
                <input
                  type="text"
                  required
                  value={heroFormTitulo}
                  onChange={(e) => setHeroFormTitulo(e.target.value)}
                  placeholder="Ex: Realce sua beleza natural com sofisticação e precisão."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Subtítulo Explicativo do Hero
                </label>
                <textarea
                  rows={3}
                  required
                  value={heroFormSubtitulo}
                  onChange={(e) => setHeroFormSubtitulo(e.target.value)}
                  placeholder="Ex: Unimos tecnologia moderna, produtos biocompatíveis e um olhar artístico..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white text-slate-900 leading-relaxed"
                />
              </div>

              {/* Foto Principal do Hero com Upload */}
              <div className="space-y-2 p-4 bg-amber-50/50 rounded-2xl border border-amber-200/80">
                <label className="block text-xs font-bold text-amber-900">
                  Foto de Destaque do Hero (Imagem Principal)
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  {heroFormImagem && (
                    <img
                      src={heroFormImagem}
                      alt="Preview Hero"
                      className="w-20 h-20 rounded-xl object-cover border border-amber-300 shadow-xs shrink-0"
                    />
                  )}

                  <div className="flex-1 w-full space-y-2">
                    <input
                      type="url"
                      value={heroFormImagem}
                      onChange={(e) => setHeroFormImagem(e.target.value)}
                      placeholder="URL da foto (ex: https://...)"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-900"
                    />

                    <div className="flex items-center gap-2">
                      <label className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingHeroImg ? 'Carregando...' : 'Carregar Foto do Computador / Celular'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              processImageUpload(file, (dataUrl) => setHeroFormImagem(dataUrl), setUploadingHeroImg);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Texto &quot;Sobre o Studio&quot;
                </label>
                <textarea
                  rows={3}
                  value={heroFormSobre}
                  onChange={(e) => setHeroFormSobre(e.target.value)}
                  placeholder="Descreva a estrutura, equipamentos e diferenciais do studio..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white text-slate-900 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Telefone / WhatsApp Oficial
                  </label>
                  <input
                    type="text"
                    value={heroFormTelefone}
                    onChange={(e) => setHeroFormTelefone(e.target.value)}
                    placeholder="(11) 98111-2233"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Endereço Completo
                  </label>
                  <input
                    type="text"
                    value={heroFormEndereco}
                    onChange={(e) => setHeroFormEndereco(e.target.value)}
                    placeholder="Av. Paulista, 1500..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Horário (Segunda a Sexta)
                  </label>
                  <input
                    type="text"
                    value={heroFormHorarioSemana}
                    onChange={(e) => setHeroFormHorarioSemana(e.target.value)}
                    placeholder="Segunda a Sexta: 08:00 às 19:30"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Horário (Sábados)
                  </label>
                  <input
                    type="text"
                    value={heroFormHorarioSabado}
                    onChange={(e) => setHeroFormHorarioSabado(e.target.value)}
                    placeholder="Sábados: 08:00 às 15:00"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsHeroTextModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Alterações no Site</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: SUPER ADMIN EDIT PROCEDURE REAL PHOTO */}
      {/* ======================================================== */}
      {procToEditPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                  Foto Real do Serviço
                </span>
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                  {procToEditPhoto.nome}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setProcToEditPhoto(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              
              {/* Image Preview */}
              <div className="relative rounded-2xl overflow-hidden h-48 bg-slate-100 border border-slate-200">
                <img
                  src={editingPhotoUrl || procToEditPhoto.imagem_url || 'https://images.unsplash.com/photo-1512290900672-1f55b9959a4b?w=700&auto=format&fit=crop&q=80'}
                  alt={procToEditPhoto.nome}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Photo Input via URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  URL da Foto Real do Tratamento
                </label>
                <input
                  type="url"
                  value={editingPhotoUrl}
                  onChange={(e) => setEditingPhotoUrl(e.target.value)}
                  placeholder="https://exemplo.com/foto-real.jpg"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              {/* Upload Button */}
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 flex items-center justify-between gap-3">
                <div className="text-xs text-amber-950">
                  <span className="font-bold block">Tirar ou enviar foto real</span>
                  <span className="text-[11px] text-amber-800">Foto do serviço realizado no studio</span>
                </div>

                <label className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0">
                  <Camera className="w-3.5 h-3.5" />
                  <span>{uploadingProcPhoto ? 'Otimizando...' : 'Enviar Foto'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        processImageUpload(file, (dataUrl) => setEditingPhotoUrl(dataUrl), setUploadingProcPhoto);
                      }
                    }}
                  />
                </label>
              </div>

            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setProcToEditPhoto(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveProcedurePhoto}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Foto Real</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: SUPER ADMIN GERENCIAR FOTOS DO AMBIENTE */}
      {/* ======================================================== */}
      {isStudioPhotosModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                    Fotos Reais do Ambiente da Clínica
                  </h3>
                  <p className="text-xs text-slate-500">Adicione e remova as fotos exibidas na seção &quot;Nosso Studio & Estrutura&quot;</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsStudioPhotosModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Current Photos Grid with Delete Button */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 block">
                Fotos Atuais do Studio ({tempStudioPhotos.length})
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {tempStudioPhotos.map((url, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden h-28 bg-slate-100 border border-slate-200 group">
                    <img
                      src={url}
                      alt={`Ambiente ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setTempStudioPhotos(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute top-2 right-2 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-md cursor-pointer"
                      title="Excluir foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Add New Photo */}
            <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-3">
              <span className="text-xs font-extrabold text-amber-950 block">
                + Adicionar Nova Foto Real do Ambiente
              </span>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="url"
                  value={newStudioPhotoUrl}
                  onChange={(e) => setNewStudioPhotoUrl(e.target.value)}
                  placeholder="Colar link de foto (URL)"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-900"
                />

                <button
                  type="button"
                  onClick={() => {
                    if (newStudioPhotoUrl.trim()) {
                      setTempStudioPhotos(prev => [...prev, newStudioPhotoUrl.trim()]);
                      setNewStudioPhotoUrl('');
                    }
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold cursor-pointer shrink-0"
                >
                  Adicionar URL
                </button>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <label className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingStudioPhoto ? 'Processando Foto...' : 'Enviar Foto do Celular / Computador'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        processImageUpload(file, (dataUrl) => {
                          setTempStudioPhotos(prev => [...prev, dataUrl]);
                        }, setUploadingStudioPhoto);
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsStudioPhotosModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveStudioPhotos}
                className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Fotos no Site</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: SUPER ADMIN ADICIONAR / EDITAR DEPOIMENTO */}
      {/* ======================================================== */}
      {isTestimonialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <Quote className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                    {testimonialToEdit ? 'Editar Depoimento de Cliente' : 'Adicionar Novo Depoimento Real'}
                  </h3>
                  <p className="text-xs text-slate-500">Exibido na seção de avaliações verificadas do site</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTestimonialModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTestimonial} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome da Cliente Atendida *
                </label>
                <input
                  type="text"
                  required
                  value={testimonialFormNome}
                  onChange={(e) => setTestimonialFormNome(e.target.value)}
                  placeholder="Ex: Carolina Mendes"
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Procedimento Realizado *
                  </label>
                  <input
                    type="text"
                    required
                    value={testimonialFormProcedimento}
                    onChange={(e) => setTestimonialFormProcedimento(e.target.value)}
                    placeholder="Ex: Toxina Botulínica"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Avaliação em Estrelas (1 a 5)
                  </label>
                  <div className="flex items-center gap-1 py-1">
                    {[1, 2, 3, 4, 5].map((starVal) => (
                      <button
                        key={starVal}
                        type="button"
                        onClick={() => setTestimonialFormNota(starVal)}
                        className="p-1 hover:scale-125 transition-transform cursor-pointer"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            testimonialFormNota >= starVal
                              ? 'fill-amber-400 text-amber-500'
                              : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Texto do Depoimento da Cliente *
                </label>
                <textarea
                  rows={3}
                  required
                  value={testimonialFormTexto}
                  onChange={(e) => setTestimonialFormTexto(e.target.value)}
                  placeholder="Relato sincero da cliente sobre o atendimento, o resultado e a experiência no studio..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 leading-relaxed"
                />
              </div>

              {/* Avatar da Cliente com Upload */}
              <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-2">
                <label className="block text-xs font-bold text-amber-950">
                  Foto / Avatar da Cliente
                </label>

                <div className="flex items-center gap-3">
                  <img
                    src={testimonialFormAvatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80'}
                    alt="Preview Avatar"
                    className="w-12 h-12 rounded-full object-cover border-2 border-amber-300 shadow-xs shrink-0"
                  />

                  <div className="flex-1 space-y-1.5">
                    <input
                      type="url"
                      value={testimonialFormAvatar}
                      onChange={(e) => setTestimonialFormAvatar(e.target.value)}
                      placeholder="URL da foto da cliente"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl text-slate-900"
                    />

                    <label className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold cursor-pointer">
                      <Camera className="w-3 h-3" />
                      <span>{uploadingAvatar ? 'Enviando...' : 'Carregar Foto Real'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            processImageUpload(file, (dataUrl) => setTestimonialFormAvatar(dataUrl), setUploadingAvatar);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tempo ou Data do Atendimento
                </label>
                <input
                  type="text"
                  value={testimonialFormData}
                  onChange={(e) => setTestimonialFormData(e.target.value)}
                  placeholder="Ex: Atendida há 2 semanas"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsTestimonialModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Depoimento</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* MODAL 5: PROCEDURE DETAILS */}
      {procedureForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full">
                  {procedureForDetails.categoria}
                </span>
                <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl mt-1">
                  {procedureForDetails.nome}
                </h3>
              </div>
              <button
                onClick={() => setProcedureForDetails(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Gallery / Carousel if exists */}
            {procedureForDetails.imagens_galeria && procedureForDetails.imagens_galeria.length > 0 ? (
              <div className="relative rounded-2xl overflow-hidden h-64 bg-slate-100">
                <img
                  src={procedureForDetails.imagens_galeria[activePhotoIndex] || procedureForDetails.imagem_url}
                  alt={procedureForDetails.nome}
                  className="w-full h-full object-cover"
                />
                {procedureForDetails.imagens_galeria.length > 1 && (
                  <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5">
                    {procedureForDetails.imagens_galeria.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActivePhotoIndex(idx)}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          activePhotoIndex === idx ? 'bg-white scale-125' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : procedureForDetails.imagem_url ? (
              <div className="rounded-2xl overflow-hidden h-64 bg-slate-100">
                <img
                  src={procedureForDetails.imagem_url}
                  alt={procedureForDetails.nome}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : null}

            {/* Description & Clinical Care */}
            <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <p>{procedureForDetails.descricao}</p>

              {procedureForDetails.indicacoes && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/60">
                  <span className="font-bold text-amber-900 block mb-1">Indicações Principais:</span>
                  <p className="text-xs text-slate-600">
                    {Array.isArray(procedureForDetails.indicacoes) ? procedureForDetails.indicacoes.join(', ') : procedureForDetails.indicacoes}
                  </p>
                </div>
              )}

              {procedureForDetails.cuidados_pos && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/60">
                  <span className="font-bold text-emerald-900 block mb-1">Cuidados Pós-Sessão:</span>
                  <p className="text-xs text-slate-600">{procedureForDetails.cuidados_pos}</p>
                </div>
              )}

              {procedureForDetails.contraindicacoes && (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200/60">
                  <span className="font-bold text-rose-900 block mb-1">Contraindicações:</span>
                  <p className="text-xs text-slate-600">
                    {Array.isArray(procedureForDetails.contraindicacoes) ? procedureForDetails.contraindicacoes.join(', ') : procedureForDetails.contraindicacoes}
                  </p>
                </div>
              )}
            </div>

            {/* Price & Action */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-[11px] text-slate-500 font-semibold block">Valor do Tratamento</span>
                <span className="text-xl font-black text-amber-900">
                  R$ {(procedureForDetails.valor_promocional || procedureForDetails.valor_tabela).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    toggleProcedureInCart(procedureForDetails);
                    setProcedureForDetails(null);
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  + Adicionar ao Orçamento
                </button>
                <button
                  onClick={() => {
                    setBookingProcId(procedureForDetails.id);
                    setProcedureForDetails(null);
                    scrollTo('agendamento');
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Agendar Este Tratamento
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 6: AUTHENTICATION MODAL */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Área da Cliente</h3>
                  <p className="text-xs text-slate-500">Conecte sua conta para acessar seus agendamentos</p>
                </div>
              </div>
              <button
                onClick={() => setIsAuthModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {authError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {/* Google Sign In Button */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isAuthLoading}
                className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-2xl border border-slate-300 shadow-xs text-xs sm:text-sm flex items-center justify-center gap-3 transition-colors cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{isAuthLoading ? 'Conectando...' : 'Entrar com Conta Google'}</span>
              </button>

              <div className="relative flex py-2 items-center">
                <div className="grow border-t border-slate-200"></div>
                <span className="shrink mx-3 text-[11px] text-slate-400 font-semibold uppercase">ou identificação rápida</span>
                <div className="grow border-t border-slate-200"></div>
              </div>
            </div>

            {/* Quick Identification Form */}
            <form onSubmit={handleQuickSignIn} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Seu Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={authNameInput}
                  onChange={(e) => setAuthNameInput(e.target.value)}
                  placeholder="Ex: Amanda Rezende"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  WhatsApp com DDD *
                </label>
                <input
                  type="tel"
                  required
                  value={authPhoneInput}
                  onChange={(e) => setAuthPhoneInput(formatPhoneBR(e.target.value))}
                  placeholder="(11) 99999-8888"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  E-mail (opcional)
                </label>
                <input
                  type="email"
                  value={authEmailInput}
                  onChange={(e) => setAuthEmailInput(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white text-slate-900"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer mt-2"
              >
                Acessar Meus Agendamentos
              </button>
            </form>

          </div>
        </div>
      )}

      {/* MODAL 7: BOOKING SUCCESS CONFIRMATION */}
      {bookingSuccessModal && lastConfirmedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-center space-y-5 animate-in zoom-in-95 duration-150">
            
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-900 text-xl">
                Agendamento Confirmado!
              </h3>
              <p className="text-xs text-slate-500">
                Seu horário foi inserido na agenda da clínica.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Procedimento:</span>
                <span className="font-bold text-slate-900">{lastConfirmedBooking.procedimentoNome}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Data e Horário:</span>
                <span className="font-bold text-slate-900">
                  {new Date(`${lastConfirmedBooking.data}T${lastConfirmedBooking.hora}:00`).toLocaleDateString('pt-BR')} às {lastConfirmedBooking.hora}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Profissional:</span>
                <span className="font-bold text-slate-900">{lastConfirmedBooking.profissionalNome}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Paciente:</span>
                <span className="font-bold text-slate-900">{lastConfirmedBooking.pacienteNome}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={generateWhatsAppLink(`Olá! Confirmei meu agendamento no site para o procedimento "${lastConfirmedBooking.procedimentoNome}" no dia ${lastConfirmedBooking.data} às ${lastConfirmedBooking.hora}. Meu nome é ${lastConfirmedBooking.pacienteNome}.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar Comprovante no WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => setBookingSuccessModal(false)}
                className="w-full py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 8: QUOTE SUCCESS CONFIRMATION */}
      {quoteSuccessModal && lastSubmittedQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-center space-y-5 animate-in zoom-in-95 duration-150">
            
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-900 text-xl">
                Simulação Enviada com Sucesso!
              </h3>
              <p className="text-xs text-slate-500">
                Nossa equipe clínica avaliará suas preferências para enviar as melhores condições.
              </p>
            </div>

            <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-600">Procedimentos:</span>
                <span className="font-bold text-slate-900">{lastSubmittedQuote.procedimentos_selecionados?.length || 1} selecionado(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Valor Estimado:</span>
                <span className="font-extrabold text-amber-900">
                  R$ {(lastSubmittedQuote.valor_total_estimado || lastSubmittedQuote.valor_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>À vista no PIX (5% OFF):</span>
                <span className="font-bold">
                  R$ {((lastSubmittedQuote.valor_total_estimado || lastSubmittedQuote.valor_total || 0) * 0.95).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <a
                href={generateWhatsAppLink(`Olá! Acabei de enviar um orçamento pelo site no valor de R$ ${(lastSubmittedQuote.valor_total_estimado || lastSubmittedQuote.valor_total || 0).toFixed(2)} (${lastSubmittedQuote.procedimentos_selecionados ? lastSubmittedQuote.procedimentos_selecionados.map(p => p.nome).join(', ') : lastSubmittedQuote.procedimento_nome || 'Procedimento'}). Gostaria de tirar dúvidas com a equipe.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Conversar com a Recepção no WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => setQuoteSuccessModal(false)}
                className="w-full py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Concluir
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: SUPER ADMIN EDITAR SEÇÃO QUEM SOU EU */}
      {/* ======================================================== */}
      {isQuemSouEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                    Editar Seção &quot;Quem Sou Eu&quot;
                  </h3>
                  <p className="text-xs text-slate-500">Foto, vídeo, biografia e credenciais da profissional responsável</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuemSouEditorOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuemSouEditor} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome da Profissional *
                  </label>
                  <input
                    type="text"
                    required
                    value={quemSouEditNome}
                    onChange={(e) => setQuemSouEditNome(e.target.value)}
                    placeholder="Ex: Drª Mariana Albuquerque"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Título / Especialidade *
                  </label>
                  <input
                    type="text"
                    required
                    value={quemSouEditTitulo}
                    onChange={(e) => setQuemSouEditTitulo(e.target.value)}
                    placeholder="Ex: Biomédica Esteta & Especialista Facial"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Registro Profissional / Conselho
                  </label>
                  <input
                    type="text"
                    value={quemSouEditRegistro}
                    onChange={(e) => setQuemSouEditRegistro(e.target.value)}
                    placeholder="Ex: CRBM 34.891 • Sociedade Brasileira de Biomedicina Estética"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Anos de Experiência
                  </label>
                  <input
                    type="text"
                    value={quemSouEditAnosExp}
                    onChange={(e) => setQuemSouEditAnosExp(e.target.value)}
                    placeholder="Ex: +8 Anos"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Biografia & Trajetória Clínica (Apresentação Pessoal)
                </label>
                <textarea
                  rows={4}
                  required
                  value={quemSouEditBio}
                  onChange={(e) => setQuemSouEditBio(e.target.value)}
                  placeholder="Conte sobre sua formação, propósito, metodologia e compromisso com os pacientes..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white text-slate-900"
                />
              </div>

              {/* Foto da Profissional */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800">
                    Foto Oficial da Profissional
                  </label>
                  <input
                    type="file"
                    ref={quemSouFileInputRef}
                    accept="image/*"
                    onChange={handleQuemSouFotoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isUploadingQuemSouFoto}
                    onClick={() => quemSouFileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingQuemSouFoto ? 'Comprimindo...' : 'Fazer Upload'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-200 border border-slate-300 shrink-0">
                    {quemSouEditFotoUrl ? (
                      <img src={quemSouEditFotoUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Camera className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    value={quemSouEditFotoUrl}
                    onChange={(e) => setQuemSouEditFotoUrl(e.target.value)}
                    placeholder="Cole a URL direta da foto (https://...)"
                    className="flex-1 px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
              </div>

              {/* Vídeo de Apresentação */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Vídeo de Apresentação (YouTube, Vimeo ou Link MP4)
                </label>
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-amber-600 shrink-0" />
                  <input
                    type="text"
                    value={quemSouEditVideoUrl}
                    onChange={(e) => setQuemSouEditVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... ou https://vimeo.com/..."
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  O vídeo pode ser assistido diretamente na aba &quot;Quem Sou Eu&quot; pelos visitantes.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Instagram da Profissional (Opcional)
                </label>
                <div className="flex items-center gap-2">
                  <Instagram className="w-4 h-4 text-pink-600 shrink-0" />
                  <input
                    type="text"
                    value={quemSouEditInstagram}
                    onChange={(e) => setQuemSouEditInstagram(e.target.value)}
                    placeholder="@dra.mariana.estetica"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white text-slate-900"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsQuemSouEditorOpen(false)}
                  className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar no Firestore</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

// Helper icon component for toggle
function Edit3Icon({ isSuperAdminEditOn }: { isSuperAdminEditOn: boolean }) {
  return isSuperAdminEditOn ? <Edit className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />;
}
