import React, { useState, useRef, useEffect } from 'react';
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
  HeartHandshake
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
import { calcularIdade } from '../utils/anamneseValidation';

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
    const dadosAtualizados: Partial<Paciente> = {
      anamneses_completas: updatedAnamneses,
      alergias: novaAnamnese.saudeGeral.possuiAlergias ? novaAnamnese.saudeGeral.detalhesAlergias : paciente.alergias,
      medicacoes: novaAnamnese.saudeGeral.usoAcidos ? novaAnamnese.saudeGeral.detalhesAcidos : paciente.medicacoes,
      profissao: novaAnamnese.dadosPessoais.profissao || paciente.profissao,
      endereco: novaAnamnese.dadosPessoais.endereco || paciente.endereco,
      contato_emergencia: novaAnamnese.dadosPessoais.contatoEmergencia || paciente.contato_emergencia,
      data_nascimento: novaAnamnese.dadosPessoais.dataNascimento || paciente.data_nascimento,
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

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-4">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
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

            {/* TAB 3: FOTOS ANTES E DEPOIS */}
            {activeTab === 'fotos' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Galeria Clínica de Evolução (Antes & Depois)</h4>
                    <p className="text-xs text-slate-500">Fotodocumentação segura e comparativo estético</p>
                  </div>

                  <button
                    onClick={() => setIsAddingPhoto(!isAddingPhoto)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Adicionar Fotos</span>
                  </button>
                </div>

                {isAddingPhoto && (
                  <form onSubmit={handleSavePhotoEntry} className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200 space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Título / Procedimento</label>
                      <input
                        type="text"
                        placeholder="Ex: Preenchimento Labial 1ml - Imediato"
                        value={novaFotoTitulo}
                        onChange={(e) => setNovaFotoTitulo(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">URL Foto ANTES *</label>
                        <input
                          type="url"
                          required
                          placeholder="https://..."
                          value={novaFotoAntes}
                          onChange={(e) => setNovaFotoAntes(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">URL Foto DEPOIS (Opcional)</label>
                        <input
                          type="url"
                          placeholder="https://..."
                          value={novaFotoDepois}
                          onChange={(e) => setNovaFotoDepois(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Observações Técnicas</label>
                      <input
                        type="text"
                        placeholder="Ex: Iluminação padrão, ângulo frontal a 45º"
                        value={novaFotoObs}
                        onChange={(e) => setNovaFotoObs(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingPhoto(false)}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                      >
                        Salvar Fotos
                      </button>
                    </div>
                  </form>
                )}

                {fotosList.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    Nenhum registro fotográfico adicionado.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {fotosList.map((foto) => (
                      <div key={foto.id} className="p-3 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{foto.procedimento_nome}</span>
                          <button
                            onClick={() => handleDeletePhoto(foto.id)}
                            className="text-rose-500 hover:text-rose-700 text-xs p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Antes</span>
                            <img src={foto.foto_antes_url} alt="Antes" className="w-full h-32 object-cover rounded-xl border border-slate-100" />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Depois</span>
                            {foto.foto_depois_url ? (
                              <img src={foto.foto_depois_url} alt="Depois" className="w-full h-32 object-cover rounded-xl border border-slate-100" />
                            ) : (
                              <div className="w-full h-32 flex items-center justify-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-[10px] text-slate-400">
                                Pendente
                              </div>
                            )}
                          </div>
                        </div>
                        {foto.observacoes && (
                          <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg">{foto.observacoes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: HISTÓRICO DE AGENDAMENTOS */}
            {activeTab === 'procedimentos' && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Histórico Completo de Agendamentos & Sessões
                </h4>
                {pacienteAgendamentos.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    Nenhum agendamento registrado para este paciente.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pacienteAgendamentos.map((ag) => (
                      <div key={ag.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <div>
                            <strong className="text-slate-900 block">{ag.procedimento_nome}</strong>
                            <span className="text-slate-500 text-[11px]">
                              {new Date(ag.data).toLocaleDateString('pt-BR')} às {ag.hora_inicio} • {ag.profissional_nome}
                            </span>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 capitalize">
                          {ag.status}
                        </span>
                      </div>
                    ))}
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
    </>
  );
};
