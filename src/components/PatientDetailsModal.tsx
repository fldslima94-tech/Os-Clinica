import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Calendar, 
  FileText, 
  Clock, 
  Save, 
  AlertTriangle,
  Camera,
  Upload,
  RotateCcw,
  CheckCircle2,
  Printer,
  Sparkles,
  Sliders,
  ShieldCheck,
  Trash2,
  HeartPulse,
  Plus,
  Zap,
  Tag,
  Eye,
  MapPin,
  Briefcase,
  HeartHandshake,
  Columns,
  Search,
  Image as ImageIcon,
  Maximize2,
  Layers,
  ArrowLeftRight,
  Filter,
  ArrowLeft
} from 'lucide-react';
import { 
  Paciente, 
  Agendamento, 
  FotoAntesDepois, 
  TermoConsentimento, 
  UsuarioEquipe, 
  FichaRetornoEvolucao,
  FotoEvolucaoClinica,
  AnamneseCompleta,
  ClinicaConfig
} from '../types';
import { MODELO_TERMO_CONSENTIMENTO } from '../data/mockData';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { AnamneseCompletaModal } from './AnamneseCompletaModal';
import { PrintableAnamneseModal } from './PrintableAnamneseModal';
import { PhotoComparisonModal, PhotoItem } from './PhotoComparisonModal';
import { CameraCaptureModal } from './CameraCaptureModal';
import { calcularIdade } from '../utils/anamneseValidation';
import { useConnectionStatus } from '../contexts/ConnectionStatusContext';
import { Wifi, WifiOff, Database, RefreshCw, CloudCheck } from 'lucide-react';

interface PatientDetailsModalProps {
  paciente: Paciente | null;
  isOpen: boolean;
  onClose: () => void;
  agendamentos: Agendamento[];
  profissionais?: UsuarioEquipe[];
  clinicaConfig?: ClinicaConfig;
  onUpdatePatientHistory: (pacienteId: string, novoHistorico: string, dadosExtras?: Partial<Paciente>) => void;
  onDeletePatient?: (id: string) => void;
  currentUser?: UsuarioEquipe;
}

export const PatientDetailsModal: React.FC<PatientDetailsModalProps> = ({
  paciente,
  isOpen,
  onClose,
  agendamentos,
  profissionais = [],
  clinicaConfig,
  onUpdatePatientHistory,
  onDeletePatient,
  currentUser,
}) => {
  const { isOnline, isSyncing, syncSingleUser, queueItems, conflicts } = useConnectionStatus();
  const [localSyncFeedback, setLocalSyncFeedback] = useState<string | null>(null);
  
  const pendingPatientMutations = useMemo(() => {
    if (!paciente) return [];
    return queueItems.filter(item => item.entityId === paciente.id || item.entityTitle?.toLowerCase().includes(paciente.nome.toLowerCase()));
  }, [queueItems, paciente]);

  const isGestor = !currentUser || currentUser.role === 'gestor' || currentUser.role === 'admin';
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'anamnese' | 'evolucoes' | 'fotos' | 'procedimentos' | 'termo'>('anamnese');
  
  // Modais de Anamnese Completa & Impressão
  const [isAnamneseModalOpen, setIsAnamneseModalOpen] = useState(false);
  const [selectedAnamneseForPrint, setSelectedAnamneseForPrint] = useState<AnamneseCompleta | null>(null);

  // Anamnese fields state
  const [historico, setHistorico] = useState('');
  const [alergias, setAlergias] = useState('');
  const [medicacoes, setMedicacoes] = useState('');
  const [queixaPrincipal, setQueixaPrincipal] = useState('');
  const [fototipo, setFototipo] = useState('');
  const [cpf, setCpf] = useState('');
  const [endereco, setEndereco] = useState('');
  const [profissao, setProfissao] = useState('');

  // Evoluções de Retorno State
  const [evolucoesList, setEvolucoesList] = useState<FichaRetornoEvolucao[]>([]);
  const [isAddingEvolucao, setIsAddingEvolucao] = useState(false);
  const [evoProcedimento, setEvoProcedimento] = useState('');
  const [evoProfissionalNome, setEvoProfissionalNome] = useState(currentUser?.nome || 'Dra. Camila Vasconcelos');
  const [evoNumeroSessao, setEvoNumeroSessao] = useState(1);
  const [evoRelato, setEvoRelato] = useState('');
  const [evoClinica, setEvoClinica] = useState('');
  const [evoParametros, setEvoParametros] = useState('');
  const [evoIntercorrencias, setEvoIntercorrencias] = useState('');

  // Galeria Antes e Depois State
  const [fotosList, setFotosList] = useState<FotoAntesDepois[]>([]);
  const [isAddingPhoto, setIsAddingPhoto] = useState(false);
  const [novaFotoTitulo, setNovaFotoTitulo] = useState('');
  const [novaFotoAntes, setNovaFotoAntes] = useState('');
  const [novaFotoDepois, setNovaFotoDepois] = useState('');
  const [novaFotoObs, setNovaFotoObs] = useState('');
  const [fotoSearchQuery, setFotoSearchQuery] = useState('');

  // Comparador de Fotos State
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
  const [comparisonInitialPair, setComparisonInitialPair] = useState<{
    photoA: PhotoItem;
    photoB: PhotoItem;
  } | undefined>(undefined);

  // Câmera para Galeria State
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<'antes' | 'depois' | { photoId: string } | null>(null);
  
  const fileInputAntesRef = useRef<HTMLInputElement | null>(null);
  const fileInputDepoisRef = useRef<HTMLInputElement | null>(null);
  const fileInputUpdateDepoisRef = useRef<HTMLInputElement | null>(null);
  const [selectedPhotoIdForUpdate, setSelectedPhotoIdForUpdate] = useState<string | null>(null);

  // Termo Consentimento State
  const [termoConsentimento, setTermoConsentimento] = useState<TermoConsentimento | undefined>(undefined);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (paciente) {
      setHistorico(paciente.historico_clinico || '');
      setAlergias(paciente.alergias || '');
      setMedicacoes(paciente.medicacoes || '');
      setQueixaPrincipal(paciente.queixa_principal || '');
      setFototipo(paciente.fototipo || 'Fototipo III');
      setCpf(paciente.cpf || '');
      setEndereco(paciente.endereco || '');
      setProfissao(paciente.profissao || '');
      setFotosList(paciente.fotos_antes_depois || []);
      setTermoConsentimento(paciente.termo_consentimento);
      setEvolucoesList(paciente.evolucoes_retornos || []);
    }
  }, [paciente]);

  if (!isOpen || !paciente) return null;

  const pacienteAgendamentos = agendamentos.filter(a => a.paciente_id === paciente.id);
  const anamnesesCompletas = paciente.anamneses_completas || [];
  const idadeCalculada = calcularIdade(paciente.data_nascimento);

  const handleSaveNovaAnamneseCompleta = (novaAnamnese: AnamneseCompleta) => {
    const updatedAnamneses = [novaAnamnese, ...anamnesesCompletas];
    
    // Sincronizar dados principais de saúde no cadastro do paciente
    const novasFotosGaleria = novaAnamnese.fotoPacienteUrl ? [
      {
        id: `foto-anamnese-${Date.now()}`,
        titulo: `Foto Anamnese - ${novaAnamnese.procedimentoNome || 'Avaliação Clínica'}`,
        data: new Date().toISOString().split('T')[0],
        foto_antes: novaAnamnese.fotoPacienteUrl,
        foto_antes_url: novaAnamnese.fotoPacienteUrl,
        procedimento_nome: novaAnamnese.procedimentoNome,
        observacoes: 'Foto clínica capturada via câmera durante preenchimento da anamnese.',
        criado_em: new Date().toISOString(),
      },
      ...(paciente.fotos_antes_depois || [])
    ] : paciente.fotos_antes_depois;

    const dadosAtualizados: Partial<Paciente> = {
      anamneses_completas: updatedAnamneses,
      alergias: novaAnamnese.saudeGeral.possuiAlergias ? novaAnamnese.saudeGeral.detalhesAlergias : paciente.alergias,
      medicacoes: novaAnamnese.saudeGeral.usoAcidos ? novaAnamnese.saudeGeral.detalhesAcidos : paciente.medicacoes,
      profissao: novaAnamnese.dadosPessoais.profissao || paciente.profissao,
      endereco: novaAnamnese.dadosPessoais.endereco || paciente.endereco,
      contato_emergencia: novaAnamnese.dadosPessoais.contatoEmergencia || paciente.contato_emergencia,
      data_nascimento: novaAnamnese.dadosPessoais.dataNascimento || paciente.data_nascimento,
      ...(novaAnamnese.fotoPacienteUrl ? { foto_url: novaAnamnese.fotoPacienteUrl } : {}),
      ...(novasFotosGaleria ? { fotos_antes_depois: novasFotosGaleria } : {}),
    };

    onUpdatePatientHistory(
      paciente.id,
      `${historico}\n[Anamnese Completa: ${novaAnamnese.procedimentoNome} realizada em ${new Date(novaAnamnese.criadoEm).toLocaleDateString('pt-BR')}]`,
      dadosAtualizados
    );

    setIsAnamneseModalOpen(false);
  };

  const handleSavePhotoEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaFotoAntes.trim()) return;

    const newEntry: FotoAntesDepois = {
      id: `foto-${Date.now()}`,
      data: new Date().toISOString().split('T')[0],
      procedimento_nome: novaFotoTitulo.trim() || 'Procedimento Clínico',
      foto_antes_url: novaFotoAntes.trim(),
      foto_depois_url: novaFotoDepois.trim() || undefined,
      observacoes: novaFotoObs.trim() || undefined,
      criado_em: new Date().toISOString(),
    };

    const updated = [newEntry, ...fotosList];
    setFotosList(updated);
    onUpdatePatientHistory(paciente.id, historico, { fotos_antes_depois: updated });

    setIsAddingPhoto(false);
    setNovaFotoTitulo('');
    setNovaFotoAntes('');
    setNovaFotoDepois('');
    setNovaFotoObs('');
  };

  const handleDeletePhoto = (photoId: string) => {
    if (!paciente) return;
    const updated = fotosList.filter(f => f.id !== photoId);
    setFotosList(updated);
    onUpdatePatientHistory(paciente.id, historico, { fotos_antes_depois: updated });
  };

  // Update existing photo entry with a "Depois" photo
  const handleUpdateDepoisPhoto = (photoId: string, depoisUrl: string) => {
    if (!paciente) return;
    const updated = fotosList.map(f => {
      if (f.id === photoId) {
        return {
          ...f,
          foto_depois_url: depoisUrl,
          foto_depois: depoisUrl,
        };
      }
      return f;
    });
    setFotosList(updated);
    onUpdatePatientHistory(paciente.id, historico, { fotos_antes_depois: updated });
    setSelectedPhotoIdForUpdate(null);
  };

  // Memoized list of all individual photos for comparing any two
  const allAvailablePhotos: PhotoItem[] = useMemo(() => {
    const list: PhotoItem[] = [];

    fotosList.forEach((foto) => {
      const urlAntes = foto.foto_antes_url || foto.foto_antes;
      const urlDepois = foto.foto_depois_url || foto.foto_depois;
      const proc = foto.procedimento_nome || foto.procedimento || foto.titulo || 'Procedimento Clínico';
      const dt = foto.data ? new Date(foto.data).toLocaleDateString('pt-BR') : '';

      if (urlAntes) {
        list.push({
          id: `${foto.id}-antes`,
          url: urlAntes,
          label: 'Antes',
          date: dt,
          procedure: proc,
          notes: foto.observacoes || foto.legenda,
        });
      }

      if (urlDepois) {
        list.push({
          id: `${foto.id}-depois`,
          url: urlDepois,
          label: 'Depois',
          date: dt,
          procedure: proc,
          notes: foto.observacoes || foto.legenda,
        });
      }
    });

    // Anamneses photos
    anamnesesCompletas.forEach((anamnese) => {
      if (anamnese.fotoPacienteUrl) {
        list.push({
          id: `anamnese-${anamnese.id}`,
          url: anamnese.fotoPacienteUrl,
          label: 'Anamnese',
          date: new Date(anamnese.criadoEm).toLocaleDateString('pt-BR'),
          procedure: anamnese.procedimentoNome || 'Avaliação Inicial',
          notes: 'Foto registrada no termo de anamnese',
        });
      }
    });

    // Paciente profile photo if distinct
    if (paciente?.foto_url && !list.some(p => p.url === paciente.foto_url)) {
      list.push({
        id: `paciente-avatar-${paciente.id}`,
        url: paciente.foto_url,
        label: 'Perfil',
        procedure: 'Cadastro Geral',
      });
    }

    return list;
  }, [fotosList, anamnesesCompletas, paciente]);

  // Filtered photos based on search query
  const filteredFotosList = useMemo(() => {
    if (!fotoSearchQuery.trim()) return fotosList;
    const query = fotoSearchQuery.toLowerCase();
    return fotosList.filter(f => 
      (f.procedimento_nome && f.procedimento_nome.toLowerCase().includes(query)) ||
      (f.procedimento && f.procedimento.toLowerCase().includes(query)) ||
      (f.titulo && f.titulo.toLowerCase().includes(query)) ||
      (f.observacoes && f.observacoes.toLowerCase().includes(query)) ||
      (f.data && f.data.includes(query))
    );
  }, [fotosList, fotoSearchQuery]);

  // Open comparison for a specific pair
  const handleOpenComparePair = (foto: FotoAntesDepois) => {
    const urlAntes = foto.foto_antes_url || foto.foto_antes;
    const urlDepois = foto.foto_depois_url || foto.foto_depois;
    const proc = foto.procedimento_nome || foto.procedimento || foto.titulo || 'Procedimento Clínico';
    const dt = foto.data ? new Date(foto.data).toLocaleDateString('pt-BR') : '';

    if (!urlAntes) return;

    if (urlDepois) {
      setComparisonInitialPair({
        photoA: {
          id: `${foto.id}-antes`,
          url: urlAntes,
          label: 'Antes',
          date: dt,
          procedure: proc,
          notes: foto.observacoes,
        },
        photoB: {
          id: `${foto.id}-depois`,
          url: urlDepois,
          label: 'Depois',
          date: dt,
          procedure: proc,
          notes: foto.observacoes,
        },
      });
    } else {
      setComparisonInitialPair(undefined);
    }
    setIsComparisonModalOpen(true);
  };

  // Camera capture callback dispatcher
  const handleCameraPhotoCaptured = (photoDataUrl: string) => {
    if (cameraTarget === 'antes') {
      setNovaFotoAntes(photoDataUrl);
    } else if (cameraTarget === 'depois') {
      setNovaFotoDepois(photoDataUrl);
    } else if (cameraTarget && typeof cameraTarget === 'object' && cameraTarget.photoId) {
      handleUpdateDepoisPhoto(cameraTarget.photoId, photoDataUrl);
    }
    setCameraTarget(null);
    setIsCameraModalOpen(false);
  };

  // File upload helper for local image file to base64 DataURL
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'antes' | 'depois' | 'update-depois') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        const dataUrl = ev.target.result as string;
        if (target === 'antes') {
          setNovaFotoAntes(dataUrl);
        } else if (target === 'depois') {
          setNovaFotoDepois(dataUrl);
        } else if (target === 'update-depois' && selectedPhotoIdForUpdate) {
          handleUpdateDepoisPhoto(selectedPhotoIdForUpdate, dataUrl);
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveNewEvolucao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evoProcedimento.trim() || !evoClinica.trim()) return;

    const newEvo: FichaRetornoEvolucao = {
      id: `evo-${Date.now()}`,
      paciente_id: paciente.id,
      paciente_nome: paciente.nome,
      data: new Date().toISOString().split('T')[0],
      profissional_id: currentUser?.id,
      profissional_nome: evoProfissionalNome,
      procedimento_nome: evoProcedimento.trim(),
      numero_sessao: Number(evoNumeroSessao),
      relato_paciente: evoRelato.trim() || 'Sem queixas relatadas pelo paciente.',
      evolucao_clinica: evoClinica.trim(),
      parametros_tecnicos: evoParametros.trim() || undefined,
      intercorrencias: evoIntercorrencias.trim() || undefined,
      criado_em: new Date().toISOString(),
    };

    const updated = [newEvo, ...evolucoesList];
    setEvolucoesList(updated);
    onUpdatePatientHistory(paciente.id, historico, { evolucoes_retornos: updated });

    setIsAddingEvolucao(false);
    setEvoProcedimento('');
    setEvoRelato('');
    setEvoClinica('');
    setEvoParametros('');
    setEvoIntercorrencias('');
  };

  const handleSaveAnamnese = () => {
    onUpdatePatientHistory(paciente.id, historico, {
      alergias,
      medicacoes,
      queixa_principal: queixaPrincipal,
      fototipo,
      cpf,
      endereco,
      profissao,
    });
  };

  // Canvas Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e293b';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSaveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const signatureData = canvas.toDataURL('image/png');

    const updatedTermo: TermoConsentimento = {
      assinado: true,
      data_assinatura: new Date().toISOString(),
      assinatura_base64: signatureData,
      nome_paciente_declarado: paciente.nome,
      cpf_declarado: cpf || paciente.cpf,
      ip_registro: '189.40.112.5 (Segurança SSL)',
    };

    setTermoConsentimento(updatedTermo);
    onUpdatePatientHistory(paciente.id, historico, { termo_consentimento: updatedTermo });
  };

  // Escape key listener to close modal smoothly
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isCameraModalOpen && !isDeleteModalOpen && !isComparisonModalOpen && !isAnamneseModalOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isCameraModalOpen, isDeleteModalOpen, isComparisonModalOpen, isAnamneseModalOpen, onClose]);

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-4">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="p-2 -ml-1 text-slate-300 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                title="Voltar para a lista de clientes"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Voltar</span>
              </button>
              <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-xs">
                <User className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {paciente.nome}
                  </h3>
                  {idadeCalculada !== '' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/30">
                      {idadeCalculada} anos
                    </span>
                  )}
                  {paciente.cpf && (
                    <span className="text-xs text-indigo-200 font-mono">
                      CPF: {paciente.cpf}
                    </span>
                  )}
                </div>
                <p className="text-xs text-indigo-200 font-medium flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    {paciente.telefone}
                  </span>
                  {paciente.email && <span>{paciente.email}</span>}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Botão de Sincronizar Ficha Individual com a Nuvem */}
              <button
                type="button"
                disabled={isSyncing}
                onClick={async () => {
                  if (!paciente) return;
                  setLocalSyncFeedback('Sincronizando ficha...');
                  const res = await syncSingleUser(paciente.id);
                  if (res.success) {
                    setLocalSyncFeedback('Ficha sincronizada com a nuvem!');
                  } else if (res.offlineQueued) {
                    setLocalSyncFeedback('Modo offline: Ficha mantida na fila local');
                  } else if (res.conflict) {
                    setLocalSyncFeedback('Conflito de dados detectado');
                  } else {
                    setLocalSyncFeedback(res.error || 'Erro na sincronização');
                  }
                  setTimeout(() => setLocalSyncFeedback(null), 4000);
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all cursor-pointer"
                title="Sincronizar histórico, anamnese e evoluções deste cliente com o Cloud Firestore"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Ficha'}</span>
              </button>

              {isGestor && onDeletePatient && (
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="p-2 text-rose-300 hover:text-rose-100 hover:bg-rose-900/40 rounded-xl transition-all cursor-pointer"
                  title="Excluir Prontuário"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                title="Fechar (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50/50 px-4 sm:px-6 overflow-x-auto shrink-0 gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('anamnese')}
              className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'anamnese'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Anamnese & Ficha Completa</span>
              {anamnesesCompletas.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-bold">
                  {anamnesesCompletas.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('evolucoes')}
              className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'evolucoes'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <HeartPulse className="w-3.5 h-3.5" />
              <span>Evoluções ({evolucoesList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('fotos')}
              className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'fotos'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Antes & Depois ({fotosList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('procedimentos')}
              className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'procedimentos'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Histórico de Sessões ({pacienteAgendamentos.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('termo')}
              className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'termo'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Contrato & TCLE Digital</span>
            </button>
          </div>

          {/* Local Sync Feedback & Offline Banner */}
          {localSyncFeedback && (
            <div className="mx-4 sm:mx-6 mt-3 p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between text-xs text-indigo-900 animate-in fade-in shrink-0">
              <div className="flex items-center gap-2">
                <CloudCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>{localSyncFeedback}</span>
              </div>
              <button onClick={() => setLocalSyncFeedback(null)} className="text-indigo-400 hover:text-indigo-700">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {!isOnline && (
            <div className="mx-4 sm:mx-6 mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900 shrink-0">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-600 shrink-0" />
                <span><strong>Modo Offline:</strong> As atualizações no prontuário e evoluções clínicas deste paciente serão gravadas localmente e enviadas à nuvem assim que a internet reconectar.</span>
              </div>
            </div>
          )}

          {pendingPatientMutations.length > 0 && (
            <div className="mx-4 sm:mx-6 mt-3 p-2.5 bg-indigo-50/90 border border-indigo-200 rounded-xl flex items-center justify-between text-xs text-indigo-900 shrink-0">
              <div className="flex items-center gap-2">
                <CloudCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  <strong>Pendências na Fila Local:</strong> {pendingPatientMutations.length} alteraç{pendingPatientMutations.length > 1 ? 'ões' : 'ão'} de anamnese/evolução aguardando transmissão ao Firestore.
                </span>
              </div>
              {isOnline && (
                <button
                  type="button"
                  disabled={isSyncing}
                  onClick={async () => {
                    if (!paciente) return;
                    setLocalSyncFeedback('Sincronizando...');
                    const res = await syncSingleUser(paciente.id);
                    if (res.success) setLocalSyncFeedback('Ficha sincronizada com sucesso!');
                    else setLocalSyncFeedback(res.error || 'Erro na sincronização');
                    setTimeout(() => setLocalSyncFeedback(null), 4000);
                  }}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                >
                  {isSyncing ? 'Sincronizando...' : 'Enviar Agora'}
                </button>
              )}
            </div>
          )}

          {/* Content Body */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
            
            {/* TAB 1: ANAMNESE & FICHA COMPLETA */}
            {activeTab === 'anamnese' && (
              <div className="space-y-6">
                
                {/* Banner de Ação para Nova Anamnese Completa */}
                <div className="bg-gradient-to-r from-indigo-50 via-white to-indigo-50/50 p-4 sm:p-5 rounded-2xl border border-indigo-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <h4 className="text-sm font-bold text-indigo-950">
                        Ficha de Anamnese Completa & Assinatura Digital
                      </h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Preencha a anamnese completa com validação Zod, cálculo automático de idade, checklist médico por procedimento e captura de assinatura digital na tela.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAnamneseModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nova Anamnese Completa</span>
                  </button>
                </div>

                {/* Lista de Fichas de Anamneses Completas Realizadas */}
                {anamnesesCompletas.length > 0 && (
                  <div className="space-y-3">
                    <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Fichas de Anamnese Assinadas ({anamnesesCompletas.length})</span>
                    </h5>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {anamnesesCompletas.map((ana) => (
                        <div
                          key={ana.id}
                          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 shadow-xs transition-all space-y-3"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-[10px] font-bold">
                                {ana.procedimentoNome}
                              </span>
                              <h6 className="text-xs font-bold text-slate-900 mt-1">
                                {ana.dadosPessoais.nomeCompleto}
                              </h6>
                              <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" />
                                {new Date(ana.criadoEm).toLocaleString('pt-BR')}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => setSelectedAnamneseForPrint(ana)}
                              className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                              title="Visualizar e Imprimir"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Ver / Imprimir</span>
                            </button>
                          </div>

                          {/* Mini Checklist de Saúde */}
                          <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                            <div>
                              <span className="text-slate-500">Gestante: </span>
                              <strong className={ana.saudeGeral.gestanteOuAmamentando ? 'text-rose-600' : 'text-slate-700'}>
                                {ana.saudeGeral.gestanteOuAmamentando ? 'SIM' : 'NÃO'}
                              </strong>
                            </div>
                            <div>
                              <span className="text-slate-500">Alergias: </span>
                              <strong className={ana.saudeGeral.possuiAlergias ? 'text-rose-600' : 'text-slate-700'}>
                                {ana.saudeGeral.possuiAlergias ? 'SIM' : 'NÃO'}
                              </strong>
                            </div>
                            <div>
                              <span className="text-slate-500">Queloide: </span>
                              <strong className={ana.saudeGeral.historicoQueloide ? 'text-amber-600' : 'text-slate-700'}>
                                {ana.saudeGeral.historicoQueloide ? 'SIM' : 'NÃO'}
                              </strong>
                            </div>
                            <div>
                              <span className="text-slate-500">Uso de Ácidos: </span>
                              <strong className={ana.saudeGeral.usoAcidos ? 'text-amber-600' : 'text-slate-700'}>
                                {ana.saudeGeral.usoAcidos ? 'SIM' : 'NÃO'}
                              </strong>
                            </div>
                          </div>

                          {/* Assinatura Preview */}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Assinatura Digital Validada
                            </span>
                            {ana.assinaturaUrl && (
                              <img
                                src={ana.assinaturaUrl}
                                alt="Assinatura"
                                className="h-6 object-contain"
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Formulário Rápido de Anamnese & Dados Cadastrais */}
                <div className="space-y-4 pt-2 border-t border-slate-200">
                  <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Dados Cadastrais & Histórico Clínico Permanente</span>
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Queixa Principal do Paciente
                      </label>
                      <input
                        type="text"
                        value={queixaPrincipal}
                        onChange={(e) => setQueixaPrincipal(e.target.value)}
                        placeholder="Ex: Rugas dinâmicas na testa, flacidez malar, contorno labial..."
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Fototipo de Fitzpatrick
                      </label>
                      <input
                        type="text"
                        value={fototipo}
                        onChange={(e) => setFototipo(e.target.value)}
                        placeholder="Ex: Fototipo III (Morena clara, bronzeia gradualmente)"
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Profissão do Cliente
                      </label>
                      <input
                        type="text"
                        value={profissao}
                        onChange={(e) => setProfissao(e.target.value)}
                        placeholder="Ex: Arquiteta, Advogada"
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Endereço Completo
                      </label>
                      <input
                        type="text"
                        value={endereco}
                        onChange={(e) => setEndereco(e.target.value)}
                        placeholder="Rua, Número, Bairro, Cidade - UF"
                        className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Histórico de Alergias & Reações Adversas
                    </label>
                    <textarea
                      rows={2}
                      value={alergias}
                      onChange={(e) => setAlergias(e.target.value)}
                      placeholder="Ex: Alergia a anestésicos tópicos (Lidocaína), esparadrapo, látex..."
                      className="w-full p-2.5 text-xs bg-rose-50/40 border border-rose-200 rounded-xl text-rose-900 focus:ring-2 focus:ring-rose-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Medicações em Uso Contínuo
                    </label>
                    <input
                      type="text"
                      value={medicacoes}
                      onChange={(e) => setMedicacoes(e.target.value)}
                      placeholder="Ex: Anticoagulantes, Roacutan, Anticoncepcional oral..."
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Histórico Clínico & Procedimentos Anteriores
                    </label>
                    <textarea
                      rows={3}
                      value={historico}
                      onChange={(e) => setHistorico(e.target.value)}
                      placeholder="Histórico detalhado de preenchimentos, lasers, peelings e cirurgias prévias..."
                      className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleSaveAnamnese}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Salvar Alterações do Prontuário</span>
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: EVOLUÇÕES & RETORNOS CLÍNICOS */}
            {activeTab === 'evolucoes' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Evoluções de Sessões & Retornos</h4>
                    <p className="text-xs text-slate-500">Registro técnico de parâmetros aplicados e resposta clínica</p>
                  </div>

                  <button
                    onClick={() => setIsAddingEvolucao(!isAddingEvolucao)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nova Evolução</span>
                  </button>
                </div>

                {/* Form Nova Evolução */}
                {isAddingEvolucao && (
                  <form onSubmit={handleSaveNewEvolucao} className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Procedimento Realizado *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Toxina Botulínica Dysport 50U / Laser Lavieen"
                          value={evoProcedimento}
                          onChange={(e) => setEvoProcedimento(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Nº da Sessão</label>
                        <input
                          type="number"
                          min="1"
                          value={evoNumeroSessao}
                          onChange={(e) => setEvoNumeroSessao(parseInt(e.target.value) || 1)}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Evolução Clínica & Conduta *</label>
                      <textarea
                        required
                        rows={2}
                        placeholder="Descreva a evolução do tecido, simetria e resposta do paciente..."
                        value={evoClinica}
                        onChange={(e) => setEvoClinica(e.target.value)}
                        className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Parâmetros Técnicos & Insumos Utilizados</label>
                      <input
                        type="text"
                        placeholder="Ex: Lavieen: 10mJ / Cartucho 1R 0.25mm / Pigmento Velvet Red Lote L-2025"
                        value={evoParametros}
                        onChange={(e) => setEvoParametros(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingEvolucao(false)}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                      >
                        Salvar Registro
                      </button>
                    </div>
                  </form>
                )}

                {/* Lista de Evoluções */}
                {evolucoesList.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    Nenhuma evolução clínica registrada ainda para esta ficha.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {evolucoesList.map((evo) => (
                      <div key={evo.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              Sessão {evo.numero_sessao}
                            </span>
                            <h5 className="text-xs font-bold text-slate-900">{evo.procedimento_nome}</h5>
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {new Date(evo.data).toLocaleDateString('pt-BR')} • {evo.profissional_nome}
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          {evo.evolucao_clinica}
                        </p>

                        {evo.parametros_tecnicos && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                            <Sliders className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span>Parâmetros: {evo.parametros_tecnicos}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: FOTOS ANTES E DEPOIS / GALERIA CLÍNICA */}
            {activeTab === 'fotos' && (
              <div className="space-y-4">
                {/* Header da Galeria com Ações & Comparador */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/50 rounded-2xl border border-indigo-100/80 shadow-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">Galeria Clínica de Fotos (Antes & Depois)</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                        {fotosList.length} {fotosList.length === 1 ? 'registro' : 'registros'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Fotodocumentação segura, acompanhamento de evolução e comparativo lado a lado
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Botão de Comparação Lado a Lado Geral */}
                    <button
                      type="button"
                      disabled={allAvailablePhotos.length < 2}
                      onClick={() => {
                        setComparisonInitialPair(undefined);
                        setIsComparisonModalOpen(true);
                      }}
                      className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      title={allAvailablePhotos.length < 2 ? 'Necessário pelo menos 2 fotos para comparar' : 'Abrir comparador clínico lado a lado'}
                    >
                      <Columns className="w-4 h-4" />
                      <span>Comparar Lado a Lado</span>
                      {allAvailablePhotos.length >= 2 && (
                        <span className="px-1.5 py-0.2 bg-white/25 rounded-md text-[10px]">
                          {allAvailablePhotos.length}
                        </span>
                      )}
                    </button>

                    {/* Botão Adicionar Fotos */}
                    <button
                      type="button"
                      onClick={() => setIsAddingPhoto(!isAddingPhoto)}
                      className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-indigo-600" />
                      <span>{isAddingPhoto ? 'Fechar Formulário' : 'Novo Registro'}</span>
                    </button>
                  </div>
                </div>

                {/* Barra de Busca & Filtro de Procedimento */}
                {fotosList.length > 0 && (
                  <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
                    <Search className="w-4 h-4 text-slate-400 ml-1.5 shrink-0" />
                    <input
                      type="text"
                      placeholder="Filtrar fotos por procedimento, data ou observação..."
                      value={fotoSearchQuery}
                      onChange={(e) => setFotoSearchQuery(e.target.value)}
                      className="w-full bg-transparent border-0 text-xs text-slate-800 focus:outline-none placeholder:text-slate-400"
                    />
                    {fotoSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setFotoSearchQuery('')}
                        className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Formulário de Adicionar Novo Registro Fotográfico */}
                {isAddingPhoto && (
                  <form onSubmit={handleSavePhotoEntry} className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200 space-y-3.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-indigo-600" />
                        Cadastrar Novo Par de Fotos (Antes & Depois)
                      </h5>
                      <span className="text-[11px] text-slate-500">Capture com a câmera ou carregue arquivos</span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Título / Procedimento *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Preenchimento Labial 1ml - Sessão 1"
                        value={novaFotoTitulo}
                        onChange={(e) => setNovaFotoTitulo(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Box Foto ANTES */}
                      <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-indigo-600" />
                            Foto ANTES *
                          </label>
                          {novaFotoAntes && (
                            <button
                              type="button"
                              onClick={() => setNovaFotoAntes('')}
                              className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                            >
                              Remover
                            </button>
                          )}
                        </div>

                        {novaFotoAntes ? (
                          <div className="relative rounded-lg overflow-hidden border border-slate-200 h-32 flex items-center justify-center bg-slate-950">
                            <img src={novaFotoAntes} alt="Preview Antes" className="max-h-full max-w-full object-contain" />
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-indigo-600/90 text-white text-[10px] font-bold">
                              Antes Carregada
                            </span>
                          </div>
                        ) : (
                          <div className="h-32 border-2 border-dashed border-indigo-200 rounded-xl bg-indigo-50/30 flex flex-col items-center justify-center gap-2 p-2 text-center">
                            <ImageIcon className="w-6 h-6 text-indigo-400" />
                            <div className="flex flex-wrap items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setCameraTarget('antes');
                                  setIsCameraModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Camera className="w-3 h-3" />
                                Câmera
                              </button>
                              <button
                                type="button"
                                onClick={() => fileInputAntesRef.current?.click()}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 border border-slate-300 cursor-pointer"
                              >
                                <Upload className="w-3 h-3" />
                                Arquivo
                              </button>
                            </div>
                          </div>
                        )}

                        <input
                          type="text"
                          placeholder="Ou cole a URL da imagem..."
                          value={novaFotoAntes}
                          onChange={(e) => setNovaFotoAntes(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-[11px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                        />
                      </div>

                      {/* Box Foto DEPOIS */}
                      <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-600" />
                            Foto DEPOIS (Opcional)
                          </label>
                          {novaFotoDepois && (
                            <button
                              type="button"
                              onClick={() => setNovaFotoDepois('')}
                              className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                            >
                              Remover
                            </button>
                          )}
                        </div>

                        {novaFotoDepois ? (
                          <div className="relative rounded-lg overflow-hidden border border-slate-200 h-32 flex items-center justify-center bg-slate-950">
                            <img src={novaFotoDepois} alt="Preview Depois" className="max-h-full max-w-full object-contain" />
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-600/90 text-white text-[10px] font-bold">
                              Depois Carregada
                            </span>
                          </div>
                        ) : (
                          <div className="h-32 border-2 border-dashed border-emerald-200 rounded-xl bg-emerald-50/30 flex flex-col items-center justify-center gap-2 p-2 text-center">
                            <ImageIcon className="w-6 h-6 text-emerald-400" />
                            <div className="flex flex-wrap items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setCameraTarget('depois');
                                  setIsCameraModalOpen(true);
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Camera className="w-3 h-3" />
                                Câmera
                              </button>
                              <button
                                type="button"
                                onClick={() => fileInputDepoisRef.current?.click()}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 border border-slate-300 cursor-pointer"
                              >
                                <Upload className="w-3 h-3" />
                                Arquivo
                              </button>
                            </div>
                          </div>
                        )}

                        <input
                          type="text"
                          placeholder="Ou cole a URL da imagem..."
                          value={novaFotoDepois}
                          onChange={(e) => setNovaFotoDepois(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-[11px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Observações Técnicas & Parâmetros</label>
                      <input
                        type="text"
                        placeholder="Ex: Iluminação padrão, ângulo frontal a 45º, pós-imediato sem filtro"
                        value={novaFotoObs}
                        onChange={(e) => setNovaFotoObs(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingPhoto(false)}
                        className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={!novaFotoAntes.trim()}
                        className="px-5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
                      >
                        Salvar Fotos
                      </button>
                    </div>
                  </form>
                )}

                {/* Listagem de Pares / Galeria de Fotos */}
                {filteredFotosList.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-400 mx-auto">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-700 text-sm">
                        {fotoSearchQuery ? 'Nenhuma foto encontrada para esta busca.' : 'Nenhum registro fotográfico adicionado.'}
                      </p>
                      <p className="text-slate-400 text-xs mt-0.5">
                        {fotoSearchQuery ? 'Tente buscar por outro termo ou limpe o filtro.' : 'Adicione fotos de antes/depois para acompanhar os resultados dos procedimentos.'}
                      </p>
                    </div>
                    {!fotoSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setIsAddingPhoto(true)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar Primeiro Registro
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredFotosList.map((foto) => {
                      const urlAntes = foto.foto_antes_url || foto.foto_antes;
                      const urlDepois = foto.foto_depois_url || foto.foto_depois;
                      const temParCompleto = Boolean(urlAntes && urlDepois);

                      return (
                        <div key={foto.id} className="p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs hover:shadow-md transition-all space-y-3 flex flex-col justify-between">
                          
                          {/* Card Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h5 className="text-xs sm:text-sm font-bold text-slate-900">
                                {foto.procedimento_nome || foto.procedimento || foto.titulo || 'Procedimento Clínico'}
                              </h5>
                              <span className="text-[11px] text-slate-500 font-medium">
                                {foto.data ? new Date(foto.data).toLocaleDateString('pt-BR') : 'Data não informada'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              {temParCompleto && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenComparePair(foto)}
                                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold flex items-center gap-1 border border-indigo-200 transition-all cursor-pointer"
                                  title="Comparar este par lado a lado"
                                >
                                  <Columns className="w-3.5 h-3.5" />
                                  <span>Comparar</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDeletePhoto(foto.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                                title="Excluir este par de fotos"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Dual Photo Grid */}
                          <div className="grid grid-cols-2 gap-2.5">
                            
                            {/* Card Antes */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px] font-bold text-indigo-700 uppercase tracking-wider px-1">
                                <span>Antes</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                              </div>

                              {urlAntes ? (
                                <div 
                                  onClick={() => handleOpenComparePair(foto)}
                                  className="group relative h-36 bg-slate-950 rounded-xl overflow-hidden border border-slate-200 cursor-pointer shadow-inner"
                                >
                                  <img 
                                    src={urlAntes} 
                                    alt="Antes" 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1 text-xs font-bold">
                                    <Maximize2 className="w-4 h-4" />
                                    <span>Ver / Comparar</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="h-36 flex items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-[10px] text-slate-400">
                                  Sem Foto
                                </div>
                              )}
                            </div>

                            {/* Card Depois */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px] font-bold text-emerald-700 uppercase tracking-wider px-1">
                                <span>Depois</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              </div>

                              {urlDepois ? (
                                <div 
                                  onClick={() => handleOpenComparePair(foto)}
                                  className="group relative h-36 bg-slate-950 rounded-xl overflow-hidden border border-slate-200 cursor-pointer shadow-inner"
                                >
                                  <img 
                                    src={urlDepois} 
                                    alt="Depois" 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-1 text-xs font-bold">
                                    <Maximize2 className="w-4 h-4" />
                                    <span>Ver / Comparar</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="h-36 flex flex-col items-center justify-center bg-slate-50/80 border border-dashed border-slate-300 rounded-xl p-2 text-center gap-1.5">
                                  <span className="text-[10px] font-semibold text-slate-400">Depois Pendente</span>
                                  <div className="flex flex-col gap-1 w-full">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCameraTarget({ photoId: foto.id });
                                        setIsCameraModalOpen(true);
                                      }}
                                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
                                    >
                                      <Camera className="w-3 h-3" />
                                      Tirar Foto
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedPhotoIdForUpdate(foto.id);
                                        fileInputUpdateDepoisRef.current?.click();
                                      }}
                                      className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-medium flex items-center justify-center gap-1 transition-all cursor-pointer"
                                    >
                                      <Upload className="w-3 h-3" />
                                      Carregar
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>

                          </div>

                          {/* Observações e Botão de Comparação Rápida */}
                          <div className="space-y-2 pt-1 border-t border-slate-100">
                            {foto.observacoes && (
                              <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                                {foto.observacoes}
                              </p>
                            )}

                            {temParCompleto && (
                              <button
                                type="button"
                                onClick={() => handleOpenComparePair(foto)}
                                className="w-full py-2 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border border-indigo-200/80 cursor-pointer shadow-xs"
                              >
                                <Columns className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Comparar Antes & Depois em Tela Cheia</span>
                              </button>
                            )}
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: HISTÓRICO DE AGENDAMENTOS */}
            {activeTab === 'procedimentos' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Histórico Completo de Agendamentos & Sessões ({pacienteAgendamentos.length})
                  </h4>
                </div>
                {pacienteAgendamentos.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    Nenhum agendamento registrado para este paciente.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pacienteAgendamentos.map((ag) => {
                      const dt = new Date(ag.data_hora);
                      const dateStr = isNaN(dt.getTime()) ? '--/--/----' : dt.toLocaleDateString('pt-BR');
                      const timeStr = isNaN(dt.getTime()) ? '--:--' : dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                      return (
                        <div key={ag.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                              <Calendar className="w-4 h-4" />
                            </div>
                            <div>
                              <strong className="text-slate-900 block">{ag.procedimento}</strong>
                              <span className="text-slate-500 text-[11px]">
                                {dateStr} às {timeStr} • {ag.profissional_nome || 'Profissional Responsável'}
                              </span>
                            </div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                            ag.status === 'concluido' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            ag.status === 'confirmado' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            ag.status === 'cancelado' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {ag.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: CONTRATO & TCLE DIGITAL */}
            {activeTab === 'termo' && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 space-y-2 max-h-48 overflow-y-auto">
                  <h5 className="font-bold text-slate-900">Termo de Consentimento Livre e Esclarecido (TCLE)</h5>
                  <p className="leading-relaxed whitespace-pre-line">
                    {MODELO_TERMO_CONSENTIMENTO}
                  </p>
                </div>

                {termoConsentimento?.assinado ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Termo de Consentimento Assinado Digitalmente</span>
                    </div>
                    {termoConsentimento.assinatura_base64 && (
                      <div className="p-2 bg-white rounded-xl border border-emerald-200 inline-block">
                        <img src={termoConsentimento.assinatura_base64} alt="Assinatura" className="max-h-20" />
                      </div>
                    )}
                    <div className="text-[11px] text-emerald-700">
                      Assinado em {new Date(termoConsentimento.data_assinatura).toLocaleString('pt-BR')} por {termoConsentimento.nome_paciente_declarado}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
                    <label className="block text-xs font-bold text-slate-800">
                      Assinatura na Tela pelo Paciente (Toque ou Mouse)
                    </label>
                    <div className="border border-slate-300 rounded-xl overflow-hidden bg-slate-50/50">
                      <canvas
                        ref={canvasRef}
                        width={600}
                        height={160}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-36 bg-white cursor-crosshair touch-none"
                      />
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <button
                        type="button"
                        onClick={clearCanvas}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Limpar Assinatura</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveSignature}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Confirmar & Gravar TCLE</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-slate-500">
              Prontuário ID: <span className="font-mono">{paciente.id}</span>
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Fechar
            </button>
          </div>

        </div>
      </div>

      {/* Modal de Exclusão */}
      {isDeleteModalOpen && (
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={() => {
            if (onDeletePatient) onDeletePatient(paciente.id);
            setIsDeleteModalOpen(false);
            onClose();
          }}
          title="Excluir Prontuário do Paciente"
          message={`Tem certeza que deseja excluir o cadastro de ${paciente.nome}? Esta ação apagará o histórico clínico e agendamentos.`}
        />
      )}

      {/* Modal de Anamnese Completa Form */}
      {isAnamneseModalOpen && (
        <AnamneseCompletaModal
          isOpen={isAnamneseModalOpen}
          onClose={() => setIsAnamneseModalOpen(false)}
          paciente={paciente}
          currentUser={currentUser}
          onSave={handleSaveNovaAnamneseCompleta}
        />
      )}

      {/* Modal de Impressão de Anamnese */}
      {selectedAnamneseForPrint && (
        <PrintableAnamneseModal
          isOpen={!!selectedAnamneseForPrint}
          onClose={() => setSelectedAnamneseForPrint(null)}
          anamnese={selectedAnamneseForPrint}
          clinicaConfig={clinicaConfig}
          currentUser={currentUser}
        />
      )}

      {/* Modal de Comparação de Fotos Lado a Lado (Antes & Depois) */}
      {isComparisonModalOpen && (
        <PhotoComparisonModal
          isOpen={isComparisonModalOpen}
          onClose={() => {
            setIsComparisonModalOpen(false);
            setComparisonInitialPair(undefined);
          }}
          patientName={paciente.nome}
          initialPair={comparisonInitialPair}
          allAvailablePhotos={allAvailablePhotos}
        />
      )}

      {/* Modal de Captura de Foto para a Galeria via Câmera */}
      {isCameraModalOpen && (
        <CameraCaptureModal
          isOpen={isCameraModalOpen}
          onClose={() => {
            setIsCameraModalOpen(false);
            setCameraTarget(null);
          }}
          onCapture={handleCameraPhotoCaptured}
          patientName={paciente.nome}
          title={
            cameraTarget === 'antes' ? 'Capturar Foto ANTES' :
            cameraTarget === 'depois' ? 'Capturar Foto DEPOIS' :
            'Capturar Foto Clínica'
          }
          subtitle={`Registro fotográfico para ${paciente.nome}`}
        />
      )}

      {/* Hidden File Inputs para Upload Direto */}
      <input
        ref={fileInputAntesRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileChange(e, 'antes')}
        className="hidden"
      />
      <input
        ref={fileInputDepoisRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileChange(e, 'depois')}
        className="hidden"
      />
      <input
        ref={fileInputUpdateDepoisRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileChange(e, 'update-depois')}
        className="hidden"
      />
    </>
  );
};
