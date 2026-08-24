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
  PenTool,
  RotateCcw,
  CheckCircle2,
  Printer,
  Sparkles,
  Sliders,
  ShieldCheck,
  Trash2
} from 'lucide-react';
import { Paciente, Agendamento, FotoAntesDepois, TermoConsentimento, UsuarioEquipe } from '../types';
import { MODELO_TERMO_CONSENTIMENTO } from '../data/mockData';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface PatientDetailsModalProps {
  paciente: Paciente | null;
  isOpen: boolean;
  onClose: () => void;
  agendamentos: Agendamento[];
  onUpdatePatientHistory: (pacienteId: string, novoHistorico: string, dadosExtras?: Partial<Paciente>) => void;
  onDeletePatient?: (id: string) => void;
  currentUser?: UsuarioEquipe;
}

export const PatientDetailsModal: React.FC<PatientDetailsModalProps> = ({
  paciente,
  isOpen,
  onClose,
  agendamentos,
  onUpdatePatientHistory,
  onDeletePatient,
  currentUser,
}) => {
  const isAdmin = !currentUser || currentUser.role === 'admin';
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'anamnese' | 'procedimentos' | 'fotos' | 'termo'>('anamnese');
  
  // Anamnese fields state
  const [historico, setHistorico] = useState('');
  const [alergias, setAlergias] = useState('');
  const [medicacoes, setMedicacoes] = useState('');
  const [queixaPrincipal, setQueixaPrincipal] = useState('');
  const [fototipo, setFototipo] = useState('');
  const [cpf, setCpf] = useState('');

  // Photos state
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
      titulo: novaFotoTitulo || 'Registro Fotográfico',
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

  // Canvas Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSaveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const signatureBase64 = canvas.toDataURL('image/png');
    
    const updatedTermo: TermoConsentimento = {
      assinado: true,
      data_assinatura: new Date().toISOString(),
      assinatura_url: signatureBase64,
      documento_rg_cpf: cpf || paciente.cpf,
      texto_termo: MODELO_TERMO_CONSENTIMENTO,
    };

    setTermoConsentimento(updatedTermo);
    onUpdatePatientHistory(paciente.id, historico, { termo_consentimento: updatedTermo });
  };

  const handleSaveAll = () => {
    onUpdatePatientHistory(paciente.id, historico, {
      alergias,
      medicacoes,
      queixa_principal: queixaPrincipal,
      fototipo,
      cpf,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
              {paciente.nome.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">{paciente.nome}</h3>
                {alergias && (
                  <span className="text-[10px] font-bold bg-red-50 text-red-700 px-2 py-0.5 rounded-full border border-red-200 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Alerta de Alergia
                  </span>
                )}
                {termoConsentimento.assinado && (
                  <span className="text-[10px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    TCLE Assinado
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-0.5">
                <span>{paciente.telefone}</span>
                {paciente.data_nascimento && <span>• Nasc: {paciente.data_nascimento}</span>}
                {paciente.email && <span>• {paciente.email}</span>}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-2 border-b border-slate-200 flex items-center gap-4 bg-white text-xs">
          <button
            onClick={() => setActiveTab('anamnese')}
            className={`pb-3 font-semibold transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'anamnese'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Anamnese & Prontuário</span>
          </button>

          <button
            onClick={() => setActiveTab('procedimentos')}
            className={`pb-3 font-semibold transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'procedimentos'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Histórico ({patientAgendamentos.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('fotos')}
            className={`pb-3 font-semibold transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'fotos'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Fotos Antes & Depois ({fotosList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('termo')}
            className={`pb-3 font-semibold transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'termo'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>Termo TCLE & Assinatura</span>
          </button>
        </div>

        {/* Modal Tab Content Area */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6 text-xs sm:text-sm">
          
          {/* TAB 1: ANAMNESE */}
          {activeTab === 'anamnese' && (
            <div className="space-y-4">
              
              {/* Alert Alergias */}
              <div className="p-3.5 bg-red-50/70 border border-red-200 rounded-xl space-y-1">
                <label className="block text-xs font-bold text-red-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                  <span>Alergias Conhecidas / Intolerâncias:</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Alergia a lidocaína, esparadrapo, dipirona..."
                  value={alergias}
                  onChange={(e) => setAlergias(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-red-300 rounded-lg text-red-900 font-medium focus:ring-2 focus:ring-red-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">CPF do Paciente</label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fototipo de Fitzpatrick</label>
                  <select
                    value={fototipo}
                    onChange={(e) => setFototipo(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  >
                    <option value="Fototipo I (Muito clara, queima sempre, nunca bronzeia)">Fototipo I (Muito clara)</option>
                    <option value="Fototipo II (Clara, queima facilmente, bronzeia pouco)">Fototipo II (Clara)</option>
                    <option value="Fototipo III (Morena clara, queima moderadamente)">Fototipo III (Morena clara)</option>
                    <option value="Fototipo IV (Morena moderada, queima pouco)">Fototipo IV (Morena moderada)</option>
                    <option value="Fototipo V (Morena escura, raramente queima)">Fototipo V (Morena escura)</option>
                    <option value="Fototipo VI (Negra, nunca queima)">Fototipo VI (Negra)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Medicamentos em Uso</label>
                  <input
                    type="text"
                    placeholder="Ex: Anticoagulante, Roacutan..."
                    value={medicacoes}
                    onChange={(e) => setMedicacoes(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Queixa Principal & Objetivos Estéticos</label>
                <input
                  type="text"
                  placeholder="Ex: Rugas de expressão na testa, assimetria labial..."
                  value={queixaPrincipal}
                  onChange={(e) => setQueixaPrincipal(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Evolução Clínica & Notas do Prontuário
                </label>
                <textarea
                  rows={5}
                  value={historico}
                  onChange={(e) => setHistorico(e.target.value)}
                  placeholder="Registre as notas técnicas, quantidades aplicadas de toxina/preenchedor, intercorrências e orientações..."
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-lg font-sans leading-relaxed text-slate-900 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

            </div>
          )}

          {/* TAB 2: PROCEDIMENTOS TIMELINE */}
          {activeTab === 'procedimentos' && (
            <div className="space-y-4">
              {patientAgendamentos.length === 0 ? (
                <div className="p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                  Nenhum procedimento registrado para este paciente ainda.
                </div>
              ) : (
                <div className="space-y-3">
                  {patientAgendamentos.map((ag) => {
                    const dt = new Date(ag.data_hora);
                    return (
                      <div key={ag.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{ag.procedimento}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                              ag.status === 'concluido' ? 'bg-green-50 text-green-700 border-green-200' :
                              ag.status === 'confirmado' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                              'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {ag.status}
                            </span>
                          </div>
                          <span className="font-mono text-xs text-slate-500">
                            {dt.toLocaleDateString('pt-BR')} às {dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {ag.valor_estimado && (
                          <p className="text-xs text-slate-600">
                            Valor: <strong>R$ {ag.valor_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                            {ag.forma_pagamento && ` • Forma: ${ag.forma_pagamento}`}
                          </p>
                        )}

                        {ag.insumos_consumidos && ag.insumos_consumidos.length > 0 && (
                          <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs space-y-1">
                            <p className="font-bold text-slate-700 text-[11px]">Insumos Gastos no Atendimento:</p>
                            <ul className="list-disc list-inside text-slate-600 text-[11px]">
                              {ag.insumos_consumidos.map((ins, idx) => (
                                <li key={idx}>
                                  {ins.nome_item} ({ins.quantidade} {ins.unidade_medida}) • Lote: {ins.lote || 'Padrão'}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {ag.observacoes && (
                          <p className="text-xs text-slate-500 bg-white/70 p-2 rounded border border-slate-200/80">
                            {ag.observacoes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FOTOS ANTES & DEPOIS */}
          {activeTab === 'fotos' && (
            <div className="space-y-6">
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Evolução Fotográfica do Paciente</h4>
                  <p className="text-xs text-slate-500">Compare o Antes e Depois com fotos de alta resolução.</p>
                </div>

                <button
                  onClick={() => setIsAddingPhoto(!isAddingPhoto)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>{isAddingPhoto ? 'Cancelar' : '+ Nova Foto'}</span>
                </button>
              </div>

              {/* Add photo form */}
              {isAddingPhoto && (
                <div className="p-4 bg-slate-50 rounded-xl border border-indigo-200 space-y-4 animate-in fade-in duration-150">
                  <h5 className="font-bold text-slate-900 text-xs">Novo Registro Antes & Depois</h5>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Foto ANTES</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'antes')}
                        className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      />
                      {novaFotoAntes && (
                        <img src={novaFotoAntes} alt="Preview Antes" className="mt-2 h-32 w-full object-cover rounded-lg border border-slate-200" />
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Foto DEPOIS (Opcional)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'depois')}
                        className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                      />
                      {novaFotoDepois && (
                        <img src={novaFotoDepois} alt="Preview Depois" className="mt-2 h-32 w-full object-cover rounded-lg border border-slate-200" />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Título da sessão (ex: Toxina 50U Frontal)..."
                      value={novaFotoTitulo}
                      onChange={(e) => setNovaFotoTitulo(e.target.value)}
                      className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Observações do resultado..."
                      value={novaFotoObs}
                      onChange={(e) => setNovaFotoObs(e.target.value)}
                      className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingPhoto(false)}
                      className="px-3 py-1.5 text-slate-600 text-xs font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={!novaFotoAntes}
                      onClick={handleSaveNewPhoto}
                      className="px-4 py-1.5 bg-indigo-600 disabled:opacity-40 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Salvar Fotos
                    </button>
                  </div>
                </div>
              )}

              {/* Photos Gallery */}
              {fotosList.length === 0 ? (
                <div className="p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                  Nenhuma foto cadastrada para este paciente ainda. Clique em "+ Nova Foto" para adicionar.
                </div>
              ) : (
                <div className="space-y-6">
                  {fotosList.map((item) => (
                    <div key={item.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="font-bold text-slate-900 text-xs sm:text-sm">{item.titulo}</h5>
                        <span className="text-[11px] font-mono text-slate-500">{item.data}</span>
                      </div>

                      {item.foto_depois ? (
                        <div className="space-y-2">
                          {/* Interactive Split Slider */}
                          <div className="relative h-64 sm:h-80 w-full overflow-hidden rounded-xl border border-slate-200 select-none">
                            <img
                              src={item.foto_depois}
                              alt="Depois"
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                            <div
                              className="absolute inset-0 overflow-hidden"
                              style={{ width: `${sliderPosition}%` }}
                            >
                              <img
                                src={item.foto_antes}
                                alt="Antes"
                                className="absolute inset-0 w-full h-full object-cover max-w-none"
                                style={{ width: '100%' }}
                              />
                            </div>

                            {/* Split bar */}
                            <div
                              className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize flex items-center justify-center"
                              style={{ left: `${sliderPosition}%` }}
                            >
                              <div className="w-6 h-6 rounded-full bg-white shadow-md border border-slate-300 flex items-center justify-center text-slate-700 text-[10px] font-bold">
                                ↔
                              </div>
                            </div>

                            {/* Badges */}
                            <div className="absolute top-3 left-3 bg-slate-900/70 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-xs">
                              ANTES
                            </div>
                            <div className="absolute top-3 right-3 bg-indigo-600/80 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-xs">
                              DEPOIS
                            </div>
                          </div>

                          {/* Slider Range Control */}
                          <div className="flex items-center gap-3 px-2">
                            <span className="text-[11px] font-bold text-slate-500">Antes</span>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={sliderPosition}
                              onChange={(e) => setSliderPosition(Number(e.target.value))}
                              className="flex-1 accent-indigo-600 cursor-pointer"
                            />
                            <span className="text-[11px] font-bold text-indigo-600">Depois</span>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl overflow-hidden border border-slate-200">
                          <img src={item.foto_antes} alt="Foto Antes" className="w-full h-64 object-cover" />
                        </div>
                      )}

                      {item.observacoes && (
                        <p className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                          {item.observacoes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* TAB 4: TCLE & ASSINATURA DIGITAL */}
          {activeTab === 'termo' && (
            <div className="space-y-5">
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Termo de Consentimento Livre e Esclarecido (TCLE)</h4>
                  <p className="text-xs text-slate-500">Coleta e armazenamento de assinatura digital do paciente em conformidade com o CFM/CFF/CRBM.</p>
                </div>

                {termoConsentimento.assinado && (
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir Termo</span>
                  </button>
                )}
              </div>

              {/* Legal Text */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-700 leading-relaxed font-sans max-h-48 overflow-y-auto whitespace-pre-line">
                {MODELO_TERMO_CONSENTIMENTO}
              </div>

              {/* Patient data confirmation */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2">
                <span>Paciente: <strong>{paciente.nome}</strong></span>
                <span>CPF: <strong>{cpf || paciente.cpf || 'Não informado'}</strong></span>
                <span>Data: <strong>{new Date().toLocaleDateString('pt-BR')}</strong></span>
              </div>

              {/* Signature Canvas Area */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Assinatura Digital do Paciente (Desenhe abaixo com touch ou mouse):</span>
                  </label>

                  {!termoConsentimento.assinado && (
                    <button
                      type="button"
                      onClick={handleClearSignature}
                      className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Limpar tela</span>
                    </button>
                  )}
                </div>

                {termoConsentimento.assinado && termoConsentimento.assinatura_url ? (
                  <div className="p-4 bg-green-50/60 rounded-xl border border-green-200 space-y-2 text-center">
                    <p className="text-xs font-bold text-green-800 flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>Assinatura Digital Coletada e Autenticada</span>
                    </p>
                    <img 
                      src={termoConsentimento.assinatura_url} 
                      alt="Assinatura" 
                      className="mx-auto max-h-24 bg-white p-2 rounded-lg border border-slate-200" 
                    />
                    <p className="text-[10px] text-slate-400">
                      Data da Assinatura: {new Date(termoConsentimento.data_assinatura || '').toLocaleString('pt-BR')}
                    </p>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50 p-2 overflow-hidden flex flex-col items-center">
                    <canvas
                      ref={canvasRef}
                      width={600}
                      height={140}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="bg-white rounded-lg border border-slate-200 cursor-crosshair w-full touch-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Toque na tela e assine com o dedo ou mouse.
                    </p>
                  </div>
                )}

                {!termoConsentimento.assinado && (
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleSaveSignature}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Gravar Assinatura no Prontuário</span>
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-semibold rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Fechar Ficha
            </button>

            {isAdmin && onDeletePatient && (
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 text-xs font-semibold rounded-lg border border-red-200 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                title="Excluir cadastro do paciente permanentemente"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Paciente</span>
              </button>
            )}
          </div>

          <button
            onClick={handleSaveAll}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-sm flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Alterações</span>
          </button>
        </div>

      </div>

      {/* Delete Patient Confirmation Modal */}
      {isDeleteModalOpen && (
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={() => {
            if (onDeletePatient) {
              onDeletePatient(paciente.id);
            }
            setIsDeleteModalOpen(false);
            onClose();
          }}
          title="Excluir Cadastro de Paciente"
          itemType="Paciente"
          itemName={paciente.nome}
          description="A exclusão deste paciente removerá seu prontuário, histórico clínico, fotos e agendamentos relacionados do sistema."
        />
      )}

    </div>
  );
};
