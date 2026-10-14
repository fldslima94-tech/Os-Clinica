import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Star, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Upload, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  ArrowUp, 
  ArrowDown, 
  Sparkles, 
  Eye, 
  RefreshCw, 
  Save, 
  Sliders, 
  Globe, 
  MessageSquare, 
  X, 
  Check, 
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Layers,
  Heart,
  User,
  Video,
  GraduationCap,
  Instagram
} from 'lucide-react';
import { ClinicaConfig, DepoimentoCliente, ProcedimentoClinico, ProfissionalQuemSouEu } from '../types';
import { compressImageFile } from '../lib/image-utils';

interface SuperAdminWebsiteEditorProps {
  clinicaConfig: ClinicaConfig;
  onSaveClinicaConfig: (newConfig: ClinicaConfig) => void;
  procedimentos?: ProcedimentoClinico[];
  onPreviewSite?: () => void;
}

// Preset verified photos for high-end aesthetic clinics
const PRESET_STUDIO_PHOTOS = [
  {
    url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80',
    titulo: 'Recepção e Lounge VIP',
    tag: 'Recepção'
  },
  {
    url: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800&auto=format&fit=crop&q=80',
    titulo: 'Sala de Procedimentos Faciais com Iluminação Cirúrgica',
    tag: 'Consultório Facial'
  },
  {
    url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80',
    titulo: 'Cabine de Massoterapia e Relaxamento Corporal',
    tag: 'Cabine Corporal'
  },
  {
    url: 'https://images.unsplash.com/photo-1512290900672-1f55b9959a4b?w=800&auto=format&fit=crop&q=80',
    titulo: 'Maca Automatizada com Aquecimento Lombar',
    tag: 'Tecnologia'
  },
  {
    url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80',
    titulo: 'Central de Esterilização Hospitalar e Biossegurança',
    tag: 'Biossegurança'
  },
  {
    url: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&auto=format&fit=crop&q=80',
    titulo: 'Bancada Clínica com Injetáveis Certificados ANVISA',
    tag: 'Injetáveis'
  }
];

// Elegant client avatar presets
const PRESET_CLIENT_AVATARS = [
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
];

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

export const SuperAdminWebsiteEditor: React.FC<SuperAdminWebsiteEditorProps> = ({
  clinicaConfig,
  onSaveClinicaConfig,
  procedimentos = [],
  onPreviewSite
}) => {
  // Navigation inside the editor
  const [activeTab, setActiveTab] = useState<'fotos' | 'depoimentos' | 'quem_sou_eu' | 'preview'>('fotos');

  // Multi-professionals state (supports up to 10 professionals)
  const [profissionaisQuemSou, setProfissionaisQuemSou] = useState<ProfissionalQuemSouEu[]>(() => {
    if (clinicaConfig.quem_sou_profissionais && clinicaConfig.quem_sou_profissionais.length > 0) {
      return [...clinicaConfig.quem_sou_profissionais];
    }
    if (clinicaConfig.quem_sou_nome) {
      return [
        {
          id: 'prof-1',
          nome: clinicaConfig.quem_sou_nome,
          titulo: clinicaConfig.quem_sou_titulo || 'Biomédica Esteta & Especialista Facial',
          registro: clinicaConfig.quem_sou_registro || 'CRBM 34.891 • Sociedade Brasileira de Biomedicina Estética',
          bio: clinicaConfig.quem_sou_bio || 'Minha paixão é realçar sua beleza natural com sofisticação, precisão anatômica e segurança absoluta.',
          foto_url: clinicaConfig.quem_sou_foto_url || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&auto=format&fit=crop&q=80',
          video_url: clinicaConfig.quem_sou_video_url || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          tipo_midia: clinicaConfig.quem_sou_tipo_midia || 'foto',
          instagram: clinicaConfig.quem_sou_instagram || '@dra.mariana.estetica',
          anos_experiencia: clinicaConfig.quem_sou_anos_experiencia || '+8 Anos',
          servicos_ids: clinicaConfig.quem_sou_servicos_ids || [],
          diferenciais: clinicaConfig.quem_sou_diferenciais || ['Certificada ANVISA', 'Atendimento Humanizado'],
          ativo: true,
        },
        ...DEFAULT_PROFISSIONAIS.slice(1)
      ];
    }
    return DEFAULT_PROFISSIONAIS;
  });

  const [activeProfIndex, setActiveProfIndex] = useState(0);
  const [isUploadingQuemSouFoto, setIsUploadingQuemSouFoto] = useState(false);
  const quemSouFileInputRef = useRef<HTMLInputElement>(null);

  // Local state for photos and testimonials
  const [fotosAmbiente, setFotosAmbiente] = useState<string[]>(() => {
    return (clinicaConfig.fotos_ambiente && clinicaConfig.fotos_ambiente.length > 0)
      ? [...clinicaConfig.fotos_ambiente]
      : PRESET_STUDIO_PHOTOS.slice(0, 4).map(p => p.url);
  });

  const [depoimentos, setDepoimentos] = useState<DepoimentoCliente[]>(() => {
    return (clinicaConfig.depoimentos && clinicaConfig.depoimentos.length > 0)
      ? [...clinicaConfig.depoimentos]
      : [
          {
            id: 'dep-1',
            nome: 'Camila Albuquerque',
            procedimento: 'Harmonização Facial & Botox',
            texto: 'Experiência impecável! Fiz meu botox preventivo e preenchimento labial com a equipe. O atendimento foi super humanizado, sem dor e o resultado ficou ultra natural.',
            nota: 5,
            avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
            data: 'Atendida em Março/2026',
            destaque: true
          },
          {
            id: 'dep-2',
            nome: 'Dra. Vanessa Rangel',
            procedimento: 'Bioestimulador de Colágeno',
            texto: 'A clínica é linda, os equipamentos de última geração e o cuidado com a biossegurança me passou extrema confiança. Minha pele melhorou 100% o viço e a firmeza.',
            nota: 5,
            avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
            data: 'Atendida em Fevereiro/2026',
            destaque: true
          },
          {
            id: 'dep-3',
            nome: 'Mariana Duarte',
            procedimento: 'Limpeza de Pele Profunda & Peeling',
            texto: 'Fiquei encantada desde a recepção até o pós-procedimento com suporte pelo WhatsApp. Recomendo de olhos fechados para todas as amigas!',
            nota: 5,
            avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
            data: 'Atendida há 2 semanas',
            destaque: true
          }
        ];
  });

  // Sync from props if external config updates
  useEffect(() => {
    if (clinicaConfig.fotos_ambiente && clinicaConfig.fotos_ambiente.length > 0) {
      setFotosAmbiente(clinicaConfig.fotos_ambiente);
    }
  }, [clinicaConfig.fotos_ambiente]);

  useEffect(() => {
    if (clinicaConfig.depoimentos && clinicaConfig.depoimentos.length > 0) {
      setDepoimentos(clinicaConfig.depoimentos);
    }
  }, [clinicaConfig.depoimentos]);

  useEffect(() => {
    if (clinicaConfig.quem_sou_profissionais && clinicaConfig.quem_sou_profissionais.length > 0) {
      setProfissionaisQuemSou(clinicaConfig.quem_sou_profissionais);
    }
  }, [clinicaConfig.quem_sou_profissionais]);

  // Saving state & feedback
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // New photo input states
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Testimonial modal / form state
  const [isTestimonialModalOpen, setIsTestimonialModalOpen] = useState(false);
  const [editingTestimonialId, setEditingTestimonialId] = useState<string | null>(null);
  const [tNome, setTNome] = useState('');
  const [tProcedimento, setTProcedimento] = useState('');
  const [tTexto, setTTexto] = useState('');
  const [tNota, setTNota] = useState<number>(5);
  const [tAvatarUrl, setTAvatarUrl] = useState('');
  const [tData, setTData] = useState('');
  const [tDestaque, setTDestaque] = useState(true);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation
  const [itemToDelete, setItemToDelete] = useState<{ type: 'foto' | 'depoimento'; idOrIndex: string | number } | null>(null);

  // Helper to persist everything directly to Firestore
  const persistToFirestore = async (
    updatedPhotos: string[],
    updatedTestimonials: DepoimentoCliente[],
    successMessage: string,
    updatedProfissionais?: ProfissionalQuemSouEu[]
  ) => {
    setIsSaving(true);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);

    try {
      const profsToSave = updatedProfissionais || profissionaisQuemSou;
      const primaryProf: Partial<ProfissionalQuemSouEu> = profsToSave[0] || {};

      const updatedConfig: ClinicaConfig = {
        ...clinicaConfig,
        fotos_ambiente: updatedPhotos,
        depoimentos: updatedTestimonials,
        quem_sou_profissionais: profsToSave,
        quem_sou_nome: primaryProf.nome || '',
        quem_sou_titulo: primaryProf.titulo || '',
        quem_sou_registro: primaryProf.registro || '',
        quem_sou_bio: primaryProf.bio || '',
        quem_sou_foto_url: primaryProf.foto_url || '',
        quem_sou_video_url: primaryProf.video_url || '',
        quem_sou_tipo_midia: primaryProf.tipo_midia || 'foto',
        quem_sou_instagram: primaryProf.instagram || '',
        quem_sou_anos_experiencia: primaryProf.anos_experiencia || '+8 Anos',
        quem_sou_servicos_ids: primaryProf.servicos_ids || [],
      };

      await onSaveClinicaConfig(updatedConfig);
      setSaveSuccessMsg(successMessage);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Erro ao salvar no Firestore:', err);
      setSaveErrorMsg(err?.message || 'Erro ao sincronizar com o Firestore. Tente novamente.');
      setTimeout(() => setSaveErrorMsg(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  // --- PHOTO MANAGEMENT HANDLERS ---
  const handleAddPhotoByUrl = async () => {
    const trimmed = newPhotoUrl.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:image/')) {
      alert('Por favor, informe uma URL de imagem válida (começando com https://) ou faça upload de um arquivo.');
      return;
    }

    const updated = [...fotosAmbiente, trimmed];
    setFotosAmbiente(updated);
    setNewPhotoUrl('');
    await persistToFirestore(updated, depoimentos, 'Nova foto adicionada e salva no Firestore!');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingPhoto(true);
      // Compress to optimal webp base64 (around 25-35KB) for Firestore
      const compressedBase64 = await compressImageFile(file, {
        maxWidth: 900,
        maxHeight: 900,
        quality: 0.75,
        targetMaxKB: 40,
        mimeType: 'image/webp'
      });

      const updated = [...fotosAmbiente, compressedBase64];
      setFotosAmbiente(updated);
      await persistToFirestore(updated, depoimentos, 'Foto carregada e salva com sucesso no Firestore!');
    } catch (err) {
      console.error('Falha na compressão da foto:', err);
      alert('Não foi possível processar a imagem. Tente uma foto menor ou utilize um link direto.');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAddPresetPhoto = async (presetUrl: string) => {
    if (fotosAmbiente.includes(presetUrl)) {
      alert('Esta foto de sugestão já está adicionada à galeria!');
      return;
    }
    const updated = [...fotosAmbiente, presetUrl];
    setFotosAmbiente(updated);
    await persistToFirestore(updated, depoimentos, 'Foto da biblioteca oficial adicionada com sucesso!');
  };

  const handleMovePhoto = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= fotosAmbiente.length) return;

    const updated = [...fotosAmbiente];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    setFotosAmbiente(updated);
    await persistToFirestore(updated, depoimentos, 'Ordem das fotos do ambiente atualizada!');
  };

  const handleDeletePhoto = async (index: number) => {
    const updated = fotosAmbiente.filter((_, i) => i !== index);
    setFotosAmbiente(updated);
    setItemToDelete(null);
    await persistToFirestore(updated, depoimentos, 'Foto removida do site da clínica.');
  };

  // --- TESTIMONIAL MANAGEMENT HANDLERS ---
  const handleOpenAddTestimonial = () => {
    setEditingTestimonialId(null);
    setTNome('');
    setTProcedimento(procedimentos[0]?.nome || 'Harmonização Facial');
    setTTexto('');
    setTNota(5);
    setTAvatarUrl(PRESET_CLIENT_AVATARS[0]);
    setTData('Atendida recentemente');
    setTDestaque(true);
    setIsTestimonialModalOpen(true);
  };

  const handleOpenEditTestimonial = (dep: DepoimentoCliente) => {
    setEditingTestimonialId(dep.id);
    setTNome(dep.nome);
    setTProcedimento(dep.procedimento);
    setTTexto(dep.texto);
    setTNota(dep.nota || 5);
    setTAvatarUrl(dep.avatar_url || PRESET_CLIENT_AVATARS[0]);
    setTData(dep.data || '');
    setTDestaque(dep.destaque !== false);
    setIsTestimonialModalOpen(true);
  };

  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingAvatar(true);
      const compressed = await compressImageFile(file, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.8,
        targetMaxKB: 25,
        mimeType: 'image/webp'
      });
      setTAvatarUrl(compressed);
    } catch (err) {
      console.error('Falha ao processar avatar:', err);
      alert('Erro ao carregar avatar. Tente outra foto.');
    } finally {
      setIsUploadingAvatar(false);
      if (avatarFileInputRef.current) {
        avatarFileInputRef.current.value = '';
      }
    }
  };

  const handleSaveTestimonialForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tNome.trim()) {
      alert('Por favor, informe o nome da cliente.');
      return;
    }
    if (!tTexto.trim()) {
      alert('Por favor, digite o depoimento da cliente.');
      return;
    }

    const newDep: DepoimentoCliente = {
      id: editingTestimonialId || `dep-${Date.now()}`,
      nome: tNome.trim(),
      procedimento: tProcedimento.trim() || 'Procedimento Estético',
      texto: tTexto.trim(),
      nota: tNota || 5,
      avatar_url: tAvatarUrl.trim() || PRESET_CLIENT_AVATARS[0],
      data: tData.trim() || 'Atendida no Studio',
      destaque: tDestaque
    };

    let updated: DepoimentoCliente[];
    if (editingTestimonialId) {
      updated = depoimentos.map(d => d.id === editingTestimonialId ? newDep : d);
    } else {
      updated = [newDep, ...depoimentos];
    }

    setDepoimentos(updated);
    setIsTestimonialModalOpen(false);
    await persistToFirestore(
      fotosAmbiente, 
      updated, 
      editingTestimonialId ? 'Depoimento atualizado no Firestore!' : 'Novo depoimento de cliente salvo no Firestore!'
    );
  };

  const handleDeleteTestimonial = async (id: string) => {
    const updated = depoimentos.filter(d => d.id !== id);
    setDepoimentos(updated);
    setItemToDelete(null);
    await persistToFirestore(fotosAmbiente, updated, 'Depoimento removido do Firestore.');
  };

  const handleMoveTestimonial = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= depoimentos.length) return;

    const updated = [...depoimentos];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    setDepoimentos(updated);
    await persistToFirestore(fotosAmbiente, updated, 'Ordem dos depoimentos atualizada no Firestore!');
  };

  const handleUpdateActiveProf = (field: keyof ProfissionalQuemSouEu, value: any) => {
    setProfissionaisQuemSou(prev => {
      const copy = [...prev];
      if (copy[activeProfIndex]) {
        copy[activeProfIndex] = {
          ...copy[activeProfIndex],
          [field]: value
        };
      }
      return copy;
    });
  };

  const handleAddProfissional = async () => {
    if (profissionaisQuemSou.length >= 10) {
      alert('Limite máximo de 10 profissionais atingido!');
      return;
    }
    const newIndex = profissionaisQuemSou.length + 1;
    const newProf: ProfissionalQuemSouEu = {
      id: `prof-${Date.now()}`,
      nome: `Profissional ${newIndex}`,
      titulo: 'Especialista em Estética & Rejuvenescimento',
      registro: 'CRBM / CRM / COREN',
      bio: 'Dedicação total ao cuidado estético humanizado, atuando com as técnicas mais modernas e seguras do mercado.',
      foto_url: 'https://images.unsplash.com/photo-1594824813637-2808b8bdf218?w=800&auto=format&fit=crop&q=80',
      video_url: '',
      tipo_midia: 'foto',
      instagram: '@dra.estetica',
      anos_experiencia: '+5 Anos',
      servicos_ids: [],
      diferenciais: ['Biossegurança Ouro', 'Atendimento Humanizado'],
      ativo: true,
    };
    const updated = [...profissionaisQuemSou, newProf];
    setProfissionaisQuemSou(updated);
    setActiveProfIndex(updated.length - 1);
    await persistToFirestore(fotosAmbiente, depoimentos, 'Nova profissional adicionada com sucesso no Firestore!', updated);
  };

  const handleDeleteProfissional = async (indexToDelete: number) => {
    if (profissionaisQuemSou.length <= 1) {
      alert('É necessário manter pelo menos 1 profissional cadastrada na clínica.');
      return;
    }
    const profName = profissionaisQuemSou[indexToDelete]?.nome || 'Profissional';
    if (!window.confirm(`Tem certeza que deseja remover ${profName} da aba Quem Sou Eu?`)) {
      return;
    }
    const updated = profissionaisQuemSou.filter((_, idx) => idx !== indexToDelete);
    setProfissionaisQuemSou(updated);
    setActiveProfIndex(Math.max(0, indexToDelete - 1));
    await persistToFirestore(fotosAmbiente, depoimentos, `${profName} removida com sucesso.`, updated);
  };

  const handleToggleServicoForActiveProf = (procId: string) => {
    setProfissionaisQuemSou(prev => {
      const copy = [...prev];
      const cur = copy[activeProfIndex];
      if (!cur) return prev;
      const currentServicos = cur.servicos_ids || [];
      const has = currentServicos.includes(procId);
      const updatedServicos = has 
        ? currentServicos.filter(id => id !== procId)
        : [...currentServicos, procId];
      copy[activeProfIndex] = {
        ...cur,
        servicos_ids: updatedServicos
      };
      return copy;
    });
  };

  const handleSelectAllServicosForActiveProf = () => {
    setProfissionaisQuemSou(prev => {
      const copy = [...prev];
      const cur = copy[activeProfIndex];
      if (!cur) return prev;
      copy[activeProfIndex] = {
        ...cur,
        servicos_ids: procedimentos.filter(p => p.ativo !== false).map(p => p.id)
      };
      return copy;
    });
  };

  const handleClearAllServicosForActiveProf = () => {
    setProfissionaisQuemSou(prev => {
      const copy = [...prev];
      const cur = copy[activeProfIndex];
      if (!cur) return prev;
      copy[activeProfIndex] = {
        ...cur,
        servicos_ids: []
      };
      return copy;
    });
  };

  const handleQuemSouFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const updated = [...profissionaisQuemSou];
      if (updated[activeProfIndex]) {
        updated[activeProfIndex] = {
          ...updated[activeProfIndex],
          foto_url: compressed
        };
        setProfissionaisQuemSou(updated);
        await persistToFirestore(fotosAmbiente, depoimentos, `Foto de ${updated[activeProfIndex].nome} salva no Firestore!`, updated);
      }
    } catch (err) {
      console.error('Falha ao processar foto da profissional:', err);
      alert('Erro ao carregar imagem. Tente outra foto ou cole a URL direta.');
    } finally {
      setIsUploadingQuemSouFoto(false);
      if (quemSouFileInputRef.current) {
        quemSouFileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. TOP HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-indigo-900/60 shadow-xl relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-20 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Painel Super Admin Master &bull; Gestão do Site</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <span>Personalização da Página Inicial</span>
              <span className="text-xs bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-2.5 py-0.5 rounded-lg font-semibold">
                AuraEstética
              </span>
            </h2>

            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Edite as <strong>fotos reais do ambiente/serviços</strong> e os <strong>depoimentos de clientes</strong> exibidos na Home da AuraEstética. Todas as alterações são salvas diretamente no <strong>Cloud Firestore</strong> em tempo real.
            </p>
          </div>

          {/* Quick Actions & Live Indicator */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {onPreviewSite && (
              <button
                type="button"
                onClick={onPreviewSite}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-white/15 cursor-pointer shadow-xs"
              >
                <Eye className="w-4 h-4 text-amber-300" />
                <span>Visualizar Site Oficial</span>
              </button>
            )}

            <div className="px-3.5 py-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Firestore Conectado</span>
            </div>
          </div>
        </div>

        {/* Global Feedback Banners */}
        {saveSuccessMsg && (
          <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center gap-2.5 text-xs font-bold text-emerald-200 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {saveErrorMsg && (
          <div className="mt-4 p-3 bg-rose-500/20 border border-rose-500/40 rounded-2xl flex items-center gap-2.5 text-xs font-bold text-rose-200 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{saveErrorMsg}</span>
          </div>
        )}
      </div>

      {/* 2. TAB SELECTOR */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('fotos')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'fotos'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Camera className="w-4 h-4 text-amber-600" />
            <span>Fotos de Serviços & Ambiente ({fotosAmbiente.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('depoimentos')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'depoimentos'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span>Depoimentos dos Clientes ({depoimentos.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('quem_sou_eu')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'quem_sou_eu'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <User className="w-4 h-4 text-rose-600" />
            <span>Aba &quot;Quem Sou Eu&quot; ({profissionaisQuemSou.length}/10 Profissionais)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Eye className="w-4 h-4 text-indigo-600" />
            <span>Prévia ao Vivo na Home</span>
          </button>
        </div>

        {/* Global manual save button */}
        <button
          type="button"
          disabled={isSaving}
          onClick={() => persistToFirestore(fotosAmbiente, depoimentos, 'Configurações sincronizadas no Cloud Firestore!')}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Salvando no Firestore...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Salvar Alterações Agora</span>
            </>
          )}
        </button>
      </div>

      {/* 3. TAB CONTENT */}

      {/* ================= TAB: FOTOS DO AMBIENTE & SERVIÇOS ================= */}
      {activeTab === 'fotos' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          {/* Add Photos Toolbar */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-amber-600" />
                  <span>Adicionar Novas Fotos ao Site</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Carregue fotos reais do espaço, salas de atendimento, equipamentos ou insumos.
                </p>
              </div>

              {/* Upload file button */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isUploadingPhoto}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isUploadingPhoto ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Comprimindo Imagem...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Fazer Upload do Dispositivo</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* URL input */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100">
              <div className="relative flex-1">
                <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="url"
                  placeholder="Ou cole o link direto da imagem (https://...)"
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <button
                type="button"
                onClick={handleAddPhotoByUrl}
                disabled={!newPhotoUrl.trim()}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0"
              >
                Adicionar por Link
              </button>
            </div>
          </div>

          {/* Active Photos Gallery */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-slate-700" />
                <span>Fotos Atuais Exibidas na Seção &quot;Nosso Studio & Estrutura&quot; ({fotosAmbiente.length})</span>
              </h3>
              <span className="text-xs text-slate-500">
                Use as setas para reorganizar a ordem de exibição no site.
              </span>
            </div>

            {fotosAmbiente.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-300 space-y-3">
                <Camera className="w-10 h-10 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-700">Nenhuma foto adicionada ainda</p>
                <p className="text-xs text-slate-500">Use os botões acima ou as sugestões abaixo para adicionar fotos.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {fotosAmbiente.map((fotoUrl, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    {/* Image View */}
                    <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                      <img
                        src={fotoUrl}
                        alt={`Ambiente ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      
                      {/* Order Badge */}
                      <span className="absolute top-2.5 left-2.5 px-2.5 py-1 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-extrabold rounded-lg shadow-sm">
                        #{idx + 1}
                      </span>

                      {/* Primary Photo Badge */}
                      {idx === 0 && (
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-extrabold rounded-md shadow-sm">
                          Destaque Principal
                        </span>
                      )}
                    </div>

                    {/* Controls Footer */}
                    <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMovePhoto(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1.5 rounded-lg bg-white hover:bg-slate-200 disabled:opacity-30 border border-slate-200 text-slate-700 cursor-pointer"
                          title="Mover para a esquerda / cima"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMovePhoto(idx, 'down')}
                          disabled={idx === fotosAmbiente.length - 1}
                          className="p-1.5 rounded-lg bg-white hover:bg-slate-200 disabled:opacity-30 border border-slate-200 text-slate-700 cursor-pointer"
                          title="Mover para a direita / baixo"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setItemToDelete({ type: 'foto', idOrIndex: idx })}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 cursor-pointer text-xs font-bold flex items-center gap-1"
                        title="Remover foto do site"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remover</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Curated Aesthetic Clinic Presets */}
          <div className="bg-gradient-to-br from-amber-50/60 to-orange-50/40 p-6 rounded-3xl border border-amber-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-extrabold text-amber-950 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-700" />
                  <span>Biblioteca de Fotos Sugeridas (Alta Resolução)</span>
                </h4>
                <p className="text-xs text-amber-800">
                  Fotos profissionais selecionadas de clínicas de estética de alto padrão. Clique em &quot;+ Adicionar&quot; para incluir na sua página inicial.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {PRESET_STUDIO_PHOTOS.map((preset, pIdx) => {
                const isAlreadyAdded = fotosAmbiente.includes(preset.url);
                return (
                  <div
                    key={pIdx}
                    className="bg-white rounded-xl border border-amber-200 overflow-hidden shadow-2xs space-y-2 p-2 flex flex-col justify-between"
                  >
                    <div className="h-24 rounded-lg overflow-hidden relative">
                      <img
                        src={preset.url}
                        alt={preset.titulo}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-slate-900/80 text-white text-[9px] font-bold rounded">
                        {preset.tag}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={isAlreadyAdded}
                      onClick={() => handleAddPresetPhoto(preset.url)}
                      className={`w-full py-1.5 px-2 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                        isAlreadyAdded
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-2xs'
                      }`}
                    >
                      {isAlreadyAdded ? 'Já Adicionada' : '+ Adicionar'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ================= TAB: DEPOIMENTOS DE CLIENTES ================= */}
      {activeTab === 'depoimentos' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Top Bar with Add Button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-600" />
                <span>Avaliações & Histórias de Clientes na Home</span>
              </h3>
              <p className="text-xs text-slate-500">
                Depoimentos reais constroem autoridade e aumentam a taxa de conversão de agendamentos no site.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddTestimonial}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Depoimento</span>
            </button>
          </div>

          {/* Testimonials List */}
          {depoimentos.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-300 space-y-3">
              <Star className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Nenhum depoimento cadastrado</p>
              <p className="text-xs text-slate-500">Clique em &quot;Adicionar Depoimento&quot; para criar o primeiro.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {depoimentos.map((dep, dIdx) => (
                <div
                  key={dep.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative"
                >
                  <div className="space-y-3">
                    {/* Header with Star Rating and Order Tools */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-amber-500">
                        {Array.from({ length: dep.nota || 5 }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-500" />
                        ))}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveTestimonial(dIdx, 'up')}
                          disabled={dIdx === 0}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-20 text-slate-600 text-xs cursor-pointer"
                          title="Mover para cima"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveTestimonial(dIdx, 'down')}
                          disabled={dIdx === depoimentos.length - 1}
                          className="p-1 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-20 text-slate-600 text-xs cursor-pointer"
                          title="Mover para baixo"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Testimonial Quote */}
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic line-clamp-4">
                      &quot;{dep.texto}&quot;
                    </p>
                  </div>

                  {/* Client Info & Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={dep.avatar_url || PRESET_CLIENT_AVATARS[0]}
                        alt={dep.nome}
                        className="w-10 h-10 rounded-full object-cover border border-amber-200 shadow-2xs shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">
                          {dep.nome}
                        </h4>
                        <p className="text-[11px] text-amber-800 font-semibold truncate">
                          {dep.procedimento}
                        </p>
                        {dep.data && (
                          <span className="text-[10px] text-slate-400 block truncate">
                            {dep.data}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleOpenEditTestimonial(dep)}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setItemToDelete({ type: 'depoimento', idOrIndex: dep.id })}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Excluir</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* ================= TAB: ABA QUEM SOU EU ================= */}
      {/* ================= TAB: ABA QUEM SOU EU (MULTI-PROFISSIONAIS ATÉ 10) ================= */}
      {activeTab === 'quem_sou_eu' && (() => {
        const currProf = profissionaisQuemSou[activeProfIndex] || profissionaisQuemSou[0] || {
          id: 'prof-1',
          nome: 'Profissional',
          titulo: '',
          registro: '',
          bio: '',
          foto_url: '',
          video_url: '',
          tipo_midia: 'foto',
          instagram: '',
          anos_experiencia: '+5 Anos',
          servicos_ids: [],
          diferenciais: [],
          ativo: true
        };

        const activeProceduresCount = (currProf.servicos_ids || []).length;
        const totalProcedures = procedimentos.filter(p => p.ativo !== false).length;

        return (
          <div className="space-y-8 animate-in fade-in duration-200">
            
            {/* Top Bar for Quem Sou Eu */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200 inline-block">
                      Equipe Clínica & Especialistas
                    </span>
                    <span className="text-[11px] font-extrabold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                      {profissionaisQuemSou.length} de até 10 Profissionais
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                    Gerenciar Profissionais da Aba &quot;Quem Sou Eu&quot;
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Cadastre e personalize até 10 profissionais da clínica com foto de alta resolução, link de vídeo tour, biografia, redes sociais e os procedimentos desempenhados no studio.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    disabled={profissionaisQuemSou.length >= 10 || isSaving}
                    onClick={handleAddProfissional}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar Profissional ({profissionaisQuemSou.length}/10)</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => persistToFirestore(fotosAmbiente, depoimentos, 'Todas as profissionais foram salvas com sucesso no Firestore!')}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 shadow-xs cursor-pointer transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>Salvar no Firestore</span>
                  </button>
                </div>
              </div>

              {/* Professional Selection Carousel / Tabs */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Selecione a profissional para editar ({profissionaisQuemSou.length} cadastradas):
                </label>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {profissionaisQuemSou.map((prof, idx) => {
                    const isSelected = idx === activeProfIndex;
                    return (
                      <button
                        key={prof.id || idx}
                        type="button"
                        onClick={() => setActiveProfIndex(idx)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-2 relative ${
                          isSelected
                            ? 'bg-amber-50/90 border-amber-500 ring-2 ring-amber-500/30 shadow-sm'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 border border-slate-300 shrink-0">
                            {prof.foto_url ? (
                              <img src={prof.foto_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <User className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-bold text-amber-800 block">
                              #{idx + 1} {idx === 0 && '• Principal'}
                            </span>
                            <span className="font-extrabold text-xs text-slate-900 block truncate">
                              {prof.nome || `Profissional ${idx + 1}`}
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] text-slate-500 truncate block">
                          {prof.titulo || 'Especialista'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Professional Card Editor */}
              <div className="bg-slate-50/70 p-6 rounded-2xl border border-slate-200 space-y-6">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white border border-slate-300 shrink-0 shadow-xs">
                      {currProf.foto_url ? (
                        <img src={currProf.foto_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                          <User className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                        Editando Profissional #{activeProfIndex + 1} de {profissionaisQuemSou.length}
                      </span>
                      <h4 className="text-base font-extrabold text-slate-900 mt-1">
                        {currProf.nome || 'Nova Profissional'}
                      </h4>
                    </div>
                  </div>

                  {profissionaisQuemSou.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteProfissional(activeProfIndex)}
                      className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remover esta Profissional</span>
                    </button>
                  )}
                </div>

                {/* Main Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Nome da Profissional *
                    </label>
                    <input
                      type="text"
                      value={currProf.nome || ''}
                      onChange={(e) => handleUpdateActiveProf('nome', e.target.value)}
                      placeholder="Ex: Drª Mariana Albuquerque"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Título / Especialidade Clínica *
                    </label>
                    <input
                      type="text"
                      value={currProf.titulo || ''}
                      onChange={(e) => handleUpdateActiveProf('titulo', e.target.value)}
                      placeholder="Ex: Biomédica Esteta & Especialista Facial"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Registro Profissional / Conselho
                    </label>
                    <input
                      type="text"
                      value={currProf.registro || ''}
                      onChange={(e) => handleUpdateActiveProf('registro', e.target.value)}
                      placeholder="Ex: CRBM 34.891 • Sociedade Brasileira de Biomedicina Estética"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Anos de Experiência / Destaque
                    </label>
                    <input
                      type="text"
                      value={currProf.anos_experiencia || ''}
                      onChange={(e) => handleUpdateActiveProf('anos_experiencia', e.target.value)}
                      placeholder="Ex: +8 Anos"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900"
                    />
                  </div>

                </div>

                {/* Bio Field */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Biografia, Filosofia de Atendimento & Trajetória
                  </label>
                  <textarea
                    rows={4}
                    value={currProf.bio || ''}
                    onChange={(e) => handleUpdateActiveProf('bio', e.target.value)}
                    placeholder="Descreva a trajetória, formação acadêmica, propósito e o olhar artístico para os tratamentos..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-900"
                  />
                </div>

                {/* Media Section: Photo & Video */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                  
                  {/* Photo Box */}
                  <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-amber-600" />
                        <span className="font-extrabold text-xs text-slate-800">Foto Oficial da Profissional</span>
                      </div>
                      <input
                        type="file"
                        ref={quemSouFileInputRef}
                        accept="image/*"
                        onChange={handleQuemSouFileUpload}
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
                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 border border-slate-300 shrink-0 shadow-xs">
                        {currProf.foto_url ? (
                          <img src={currProf.foto_url} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <User className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <label className="text-[11px] font-bold text-slate-500">Ou cole a URL direta da foto:</label>
                        <input
                          type="text"
                          value={currProf.foto_url || ''}
                          onChange={(e) => handleUpdateActiveProf('foto_url', e.target.value)}
                          placeholder="https://..."
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Video Box */}
                  <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-4">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-indigo-600" />
                      <span className="font-extrabold text-xs text-slate-800">Vídeo de Apresentação (YouTube / Vimeo / MP4)</span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500">Link do Vídeo:</label>
                      <input
                        type="text"
                        value={currProf.video_url || ''}
                        onChange={(e) => handleUpdateActiveProf('video_url', e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=... ou https://vimeo.com/..."
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                      />
                      <p className="text-[10px] text-slate-400">
                        O visitante pode alternar entre &quot;Foto Oficial&quot; e &quot;Vídeo de Apresentação&quot; no site.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-500 mb-1 block">Instagram:</label>
                        <div className="flex items-center gap-2">
                          <Instagram className="w-4 h-4 text-pink-600 shrink-0" />
                          <input
                            type="text"
                            value={currProf.instagram || ''}
                            onChange={(e) => handleUpdateActiveProf('instagram', e.target.value)}
                            placeholder="@dra.estetica"
                            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-500 mb-1 block">Mídia Inicial Padrão:</label>
                        <select
                          value={currProf.tipo_midia || 'foto'}
                          onChange={(e) => handleUpdateActiveProf('tipo_midia', e.target.value as any)}
                          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                        >
                          <option value="foto">Foto Oficial</option>
                          <option value="video">Vídeo de Apresentação</option>
                        </select>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Diferenciais / Certificações */}
                <div className="space-y-1.5 pt-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Diferenciais & Certificações (separados por vírgula)
                  </label>
                  <input
                    type="text"
                    value={(currProf.diferenciais || []).join(', ')}
                    onChange={(e) => {
                      const tags = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                      handleUpdateActiveProf('diferenciais', tags);
                    }}
                    placeholder="Ex: Membro SBBM, Speaker Nacional, Pós-Graduação em Harmonização, Biossegurança Hospitalar"
                    className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-900"
                  />
                  <p className="text-[11px] text-slate-400">
                    Exibidos como selos e credenciais de destaque abaixo do perfil da profissional.
                  </p>
                </div>

                {/* Serviços que esta profissional desempenha no studio */}
                <div className="pt-4 border-t border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h5 className="font-extrabold text-sm text-slate-900">
                        Procedimentos Realizados por {currProf.nome || 'esta Especialista'} no Studio ({activeProceduresCount} selecionados de {totalProcedures})
                      </h5>
                      <p className="text-xs text-slate-500">
                        Marque os procedimentos clínicos que esta profissional realiza. Eles serão filtrados e exibidos na seção &quot;Quem Sou Eu&quot;.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllServicosForActiveProf}
                        className="px-2.5 py-1 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg cursor-pointer"
                      >
                        Selecionar Todos
                      </button>
                      <button
                        type="button"
                        onClick={handleClearAllServicosForActiveProf}
                        className="px-2.5 py-1 text-xs font-bold text-slate-600 bg-slate-200/70 hover:bg-slate-300 rounded-lg cursor-pointer"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto p-3 bg-white rounded-2xl border border-slate-200">
                    {procedimentos.filter(p => p.ativo !== false).map(p => {
                      const isChecked = (currProf.servicos_ids || []).includes(p.id);
                      return (
                        <label
                          key={p.id}
                          className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-amber-50 border-amber-300 font-bold'
                              : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleServicoForActiveProf(p.id)}
                            className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-xs text-slate-900 block truncate">{p.nome}</span>
                            <span className="text-[10px] text-slate-500">{p.categoria} • R$ {(p.valor_promocional || p.valor_tabela).toFixed(2)}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Save bottom button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => persistToFirestore(fotosAmbiente, depoimentos, `Alterações de ${currProf.nome} sincronizadas no Firestore!`)}
                    className="px-6 py-3 bg-amber-800 hover:bg-amber-900 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-sm cursor-pointer transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4 text-amber-300" />
                    <span>Salvar Alterações no Firestore</span>
                  </button>
                </div>

              </div>

            </div>

          </div>
        );
      })()}

      {/* ================= TAB: PRÉVIA AO VIVO NA HOME ================= */}
      {activeTab === 'preview' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between text-xs">
            <span className="font-bold flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-400" />
              <span>Simulação em Tempo Real das Seções na Página Inicial</span>
            </span>
            <span className="text-slate-400">
              {fotosAmbiente.length} fotos &bull; {depoimentos.length} depoimentos
            </span>
          </div>

          {/* 1. Preview of Depoimentos Section */}
          <div className="bg-gradient-to-b from-white via-amber-50/30 to-white p-8 rounded-3xl border border-amber-900/10 shadow-sm space-y-6">
            <div className="text-center space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-300 inline-block">
                Avaliações Verificadas
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900">
                Depoimentos de Nossas Clientes
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {depoimentos.slice(0, 3).map((dep) => (
                <div key={dep.id} className="bg-white p-6 rounded-2xl border border-amber-900/10 shadow-xs space-y-3">
                  <div className="flex text-amber-400">
                    {Array.from({ length: dep.nota || 5 }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-700 italic">&quot;{dep.texto}&quot;</p>
                  <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                    <img src={dep.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover border border-amber-200" />
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">{dep.nome}</h5>
                      <p className="text-[10px] text-amber-800">{dep.procedimento}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Preview of Studio Environment Photos Section */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="text-center space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-300 inline-block">
                Espaço Aconchegante & Biosseguro
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900">
                Nosso Studio & Estrutura
              </h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {fotosAmbiente.slice(0, 4).map((fotoUrl, idx) => (
                <div key={idx} className="h-40 rounded-2xl overflow-hidden shadow-xs relative group bg-slate-100">
                  <img src={fotoUrl} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent flex items-end p-2.5">
                    <span className="text-white text-[10px] font-semibold">Ambiente Esterilizado #{idx + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ================= MODAL: ADICIONAR / EDITAR DEPOIMENTO ================= */}
      {isTestimonialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 my-6">
            
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center font-bold">
                  <Star className="w-5 h-5 fill-amber-400" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-950 text-base leading-tight">
                    {editingTestimonialId ? 'Editar Depoimento da Cliente' : 'Adicionar Depoimento Real de Cliente'}
                  </h4>
                  <p className="text-[11px] text-slate-900 font-semibold">
                    Exibido na página inicial do site da AuraEstética
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsTestimonialModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-black/10 text-slate-950 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveTestimonialForm} className="p-6 space-y-4">
              
              {/* Nome */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Nome da Paciente / Cliente *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Dra. Juliana Silveira ou Mariana Costa"
                  value={tNome}
                  onChange={(e) => setTNome(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Procedimento */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Procedimento Realizado *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Ex: Harmonização Facial, Botox ou Bioestimulador"
                    value={tProcedimento}
                    onChange={(e) => setTProcedimento(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  {procedimentos.length > 0 && (
                    <select
                      onChange={(e) => {
                        if (e.target.value) setTProcedimento(e.target.value);
                      }}
                      className="px-2.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 cursor-pointer"
                      defaultValue=""
                    >
                      <option value="" disabled>Escolher do Catálogo</option>
                      {procedimentos.map((proc) => (
                        <option key={proc.id} value={proc.nome}>{proc.nome}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Avaliação em Estrelas */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Classificação / Estrelas (1 a 5)
                </label>
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {[1, 2, 3, 4, 5].map((starVal) => (
                    <button
                      key={starVal}
                      type="button"
                      onClick={() => setTNota(starVal)}
                      className="p-1 rounded-lg hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          starVal <= tNota
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-extrabold text-amber-800 ml-2">
                    {tNota} de 5 Estrelas
                  </span>
                </div>
              </div>

              {/* Texto do Depoimento */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Texto do Depoimento da Cliente *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Relato sincero da cliente sobre o atendimento, técnica, ambiente e resultado obtido..."
                  value={tTexto}
                  onChange={(e) => setTTexto(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
                />
              </div>

              {/* Avatar da Cliente */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Foto de Perfil da Cliente
                </label>
                
                <div className="flex items-center gap-3">
                  <img
                    src={tAvatarUrl || PRESET_CLIENT_AVATARS[0]}
                    alt="Preview avatar"
                    className="w-12 h-12 rounded-full object-cover border-2 border-amber-400 shadow-sm shrink-0"
                  />
                  
                  <div className="flex-1 space-y-1">
                    <input
                      type="file"
                      ref={avatarFileInputRef}
                      accept="image/*"
                      onChange={handleAvatarFileUpload}
                      className="hidden"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={isUploadingAvatar}
                        onClick={() => avatarFileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
                      >
                        {isUploadingAvatar ? 'Processando...' : 'Fazer Upload'}
                      </button>
                      <input
                        type="url"
                        placeholder="Ou URL da foto (https://...)"
                        value={tAvatarUrl}
                        onChange={(e) => setTAvatarUrl(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Preset Avatars */}
                <div className="pt-1">
                  <span className="text-[11px] text-slate-400 block mb-1">Avatares femininos recomendados:</span>
                  <div className="flex gap-2">
                    {PRESET_CLIENT_AVATARS.map((av, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setTAvatarUrl(av)}
                        className={`w-7 h-7 rounded-full overflow-hidden border-2 cursor-pointer transition-all ${
                          tAvatarUrl === av ? 'border-amber-500 ring-2 ring-amber-300' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={av} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Data ou Tag */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Identificador / Data de Atendimento
                </label>
                <input
                  type="text"
                  placeholder="Ex: Atendida em Março/2026 ou Cliente VIP"
                  value={tData}
                  onChange={(e) => setTData(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTestimonialModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingTestimonialId ? 'Salvar Alterações' : 'Salvar no Firestore'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ================= MODAL: CONFIRMAÇÃO DE EXCLUSÃO ================= */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 w-full max-w-sm text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h4 className="font-extrabold text-slate-900 text-base">
                Confirmar Exclusão?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {itemToDelete.type === 'foto'
                  ? 'Esta foto será removida permanentemente da galeria do Studio na Home do site.'
                  : 'Este depoimento será removido permanentemente da página inicial.'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => {
                  if (itemToDelete.type === 'foto') {
                    handleDeletePhoto(itemToDelete.idOrIndex as number);
                  } else {
                    handleDeleteTestimonial(itemToDelete.idOrIndex as string);
                  }
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
