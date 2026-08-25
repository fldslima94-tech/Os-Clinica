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
  Tag
} from 'lucide-react';
import { 
  Paciente, 
  Agendamento, 
  FotoAntesDepois, 
  TermoConsentimento, 
  UsuarioEquipe, 
  FichaRetornoEvolucao,
  FotoEvolucaoClinica
} from '../types';
import { MODELO_TERMO_CONSENTIMENTO } from '../data/mockData';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface PatientDetailsModalProps {
  paciente: Paciente | null;
  isOpen: boolean;
  onClose: () => void;
  agendamentos: Agendamento[];
  profissionais?: UsuarioEquipe[];
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
  onUpdatePatientHistory,
  onDeletePatient,
  currentUser,
}) => {
  const isGestor = !currentUser || currentUser.role === 'gestor' || currentUser.role === 'admin';
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'anamnese' | 'evolucoes' | 'fotos' | 'procedimentos' | 'termo'>('anamnese');
  
  // Anamnese fields state
  const [historico, setHistorico] = useState('');
  const [alergias, setAlergias] = useState('');
  const [medicacoes, setMedicacoes] = useState('');
  const [queixaPrincipal, setQueixaPrincipal] = useState('');
  const [fototipo, setFototipo] = useState('');
  const [cpf, setCpf] = useState('');

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

  // Photos state (Antes/Depois & Galeria Clínica)
  const [fotosList, setFotosList] = useState<FotoAntesDepois[]>([]);
  const [novaFotoTitulo, setNovaFotoTitulo] = useState('');
  const [novaFotoAntes, setNovaFotoAntes] = useState<string>('');
  const [novaFotoDepois, setNovaFotoDepois] = useState<string>('');
  const [novaFotoObs, setNovaFotoObs] = useState('');
  const [isAddingPhoto, setIsAddingPhoto] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);

  // TCLE & Signature Canvas
  const [termoConsentimento, setTermoConsentimento] = useState<TermoConsentimento>({ assinado: false });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (paciente) {
      setHistorico(paciente.historico_clinico || '');
      setAlergias(paciente.alergias || '');
      setMedicacoes(paciente.medicacoes || '');
      setQueixaPrincipal(paciente.queixa_principal || '');
      setFototipo(paciente.fototipo || 'Fototipo III (Morena clara)');
      setCpf(paciente.cpf || '');
      setFotosList(paciente.fotos_antes_depois || []);
      setEvolucoesList(paciente.evolucoes_retornos || []);
      setTermoConsentimento(paciente.termo_consentimento || { assinado: false });
    }
  }, [paciente, isOpen]);

  // Filter appointments for this patient
  const patientAgendamentos = agendamentos.filter(
    (ag) => ag.paciente_id === paciente?.id
  );

  if (!isOpen || !paciente) return null;

  // Handle Photo File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'antes' | 'depois') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'antes') setNovaFotoAntes(reader.result as string);
        else setNovaFotoDepois(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveNewPhoto = () => {
    if (!novaFotoAntes) return;
    const newEntry: FotoAntesDepois = {
      id: `foto-${Date.now()}`,
      titulo: novaFotoTitulo || 'Registro Fotográfico Clínico',
      data: new Date().toISOString().split('T')[0],
      foto_antes: novaFotoAntes,
      foto_depois: novaFotoDepois || undefined,
      observacoes: novaFotoObs,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl overflow-hidden my-6 animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-white font-bold text-lg">
              {paciente.nome.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">{paciente.nome}</h3>
                {termoConsentimento.assinado && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    TCLE Assinado
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 flex items-center gap-3 mt-0.5">
                <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-indigo-400" /> {paciente.telefone}</span>
                {paciente.email && <span>• {paciente.email}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 border-b border-slate-200 bg-slate-50/70 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('anamnese')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'anamnese'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Ficha de Anamnese</span>
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
            <span>Evoluções & Retornos ({evolucoesList.length})</span>
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
            <span>Galeria Antes & Depois ({fotosList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('procedimentos')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'procedimentos'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Histórico de Sessões ({patientAgendamentos.length})</span>
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
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: ANAMNESE */}
          {activeTab === 'anamnese' && (
            <div className="space-y-4">
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
                  rows={4}
                  value={historico}
                  onChange={(e) => setHistorico(e.target.value)}
                  placeholder="Histórico detalhado de preenchimentos, lasers, peelings e cirurgias prévias..."
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleSaveAnamnese}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Anamnese</span>
                </button>
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
                        <span className="text-[11px] text-slate-400 font-medium">
                          {new Date(evo.data).toLocaleDateString('pt-BR')} • {evo.profissional_nome}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        {evo.evolucao_clinica}
                      </p>

                      {evo.parametros_tecnicos && (
                        <div className="text-[11px] text-indigo-700 font-mono flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-indigo-500" />
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
                  <h4 className="text-sm font-bold text-slate-900">Galeria Fotográfica Privada</h4>
                  <p className="text-xs text-slate-500">Imagens para comparação e evolução dos resultados</p>
                </div>
                <button
                  onClick={() => setIsAddingPhoto(!isAddingPhoto)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Adicionar Fotos</span>
                </button>
              </div>

              {isAddingPhoto && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Título do Procedimento</label>
                    <input
                      type="text"
                      placeholder="Ex: Antes e Depois de Toxina Botulínica 15 dias"
                      value={novaFotoTitulo}
                      onChange={(e) => setNovaFotoTitulo(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 border-2 border-dashed rounded-xl bg-white">
                      <label className="block text-xs font-bold text-slate-600 mb-1 cursor-pointer">Foto ANTES</label>
                      {novaFotoAntes ? (
                        <img src={novaFotoAntes} alt="Antes" className="w-full h-28 object-cover rounded-lg" />
                      ) : (
                        <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'antes')} className="text-xs" />
                      )}
                    </div>

                    <div className="text-center p-3 border-2 border-dashed rounded-xl bg-white">
                      <label className="block text-xs font-bold text-slate-600 mb-1 cursor-pointer">Foto DEPOIS</label>
                      {novaFotoDepois ? (
                        <img src={novaFotoDepois} alt="Depois" className="w-full h-28 object-cover rounded-lg" />
                      ) : (
                        <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'depois')} className="text-xs" />
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button onClick={() => setIsAddingPhoto(false)} className="px-3 py-1.5 text-xs text-slate-600">Cancelar</button>
                    <button onClick={handleSaveNewPhoto} className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold">Salvar Foto</button>
                  </div>
                </div>
              )}

              {/* Grid de Fotos Salvas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {fotosList.map((foto) => (
                  <div key={foto.id} className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{foto.titulo}</span>
                      <button onClick={() => handleDeletePhoto(foto.id)} className="text-slate-400 hover:text-rose-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Antes</span>
                        <img src={foto.foto_antes} alt="Antes" className="w-full h-32 object-cover rounded-xl border" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Depois</span>
                        {foto.foto_depois ? (
                          <img src={foto.foto_depois} alt="Depois" className="w-full h-32 object-cover rounded-xl border" />
                        ) : (
                          <div className="w-full h-32 bg-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs">Pendente</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: HISTÓRICO DE SESSÕES */}
          {activeTab === 'procedimentos' && (
            <div className="space-y-3">
              {patientAgendamentos.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">Nenhuma sessão registrada para este cliente.</p>
              ) : (
                patientAgendamentos.map(ag => (
                  <div key={ag.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{ag.procedimento}</p>
                      <p className="text-slate-500">{new Date(ag.data_hora).toLocaleDateString('pt-BR')} • {ag.profissional_nome}</p>
                    </div>
                    <span className="font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px]">
                      {ag.status.toUpperCase()}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 5: CONTRATO & TCLE DIGITAL */}
          {activeTab === 'termo' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 font-serif text-xs text-slate-700 leading-relaxed max-h-44 overflow-y-auto whitespace-pre-line">
                {MODELO_TERMO_CONSENTIMENTO}
              </div>

              {termoConsentimento.assinado ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    <div>
                      <h5 className="text-xs font-bold">TCLE Assinado Digitalmente</h5>
                      <p className="text-[11px] text-emerald-700">Data: {new Date(termoConsentimento.data_assinatura || '').toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                  {termoConsentimento.assinatura_base64 && (
                    <img src={termoConsentimento.assinatura_base64} alt="Assinatura" className="h-10 bg-white p-1 rounded border border-emerald-300" />
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Assine no quadro abaixo:</label>
                    <button onClick={clearCanvas} className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1">
                      <RotateCcw className="w-3 h-3" /> Limpar
                    </button>
                  </div>
                  <canvas
                    ref={canvasRef}
                    width={500}
                    height={120}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-28 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl cursor-crosshair"
                  />
                  <div className="flex justify-end">
                    <button onClick={handleSaveSignature} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Salvar Assinatura Digital
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
