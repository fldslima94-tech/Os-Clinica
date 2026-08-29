import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Upload, 
  Download, 
  RefreshCw, 
  Wand2, 
  Layers, 
  Eye, 
  Camera, 
  CheckCircle2, 
  AlertCircle,
  Sliders,
  Scissors
} from 'lucide-react';
import { callGenerateImage, ImageGenerationResult } from '../services/geminiService';
import { UsuarioEquipe, Paciente } from '../types';

interface ImageStudioAIViewProps {
  currentUser: UsuarioEquipe;
  pacientes?: Paciente[];
  onSaveToPatientGallery?: (pacienteId: string, imageUrl: string, caption: string) => void;
}

const PRESET_MARKETING_PROMPTS = [
  {
    title: 'Campanha Rejuvenescimento Facial',
    prompt: 'Fotografia profissional de estética de alta resolução em iluminação suave de estúdio, mulher com pele radiante, viçosa e saudável após tratamento de bioestimulador de colágeno, fundo minimalista em tons de bege e dourado suave, estilo capa de revista de dermatologia de luxo.'
  },
  {
    title: 'Harmonização Facial & Preenchimento Labial',
    prompt: 'Close-up estético de lábios hidratados com contorno bem definido e natural após preenchimento com ácido hialurônico, iluminação clínica limpa, detalhes hiper-realistas de textura de pele saudável, sem exagero.'
  },
  {
    title: 'Limpeza de Pele Profunda & Glow',
    prompt: 'Fotografia de tratamento de spa e clínica estética facial, detalhes de máscara hidroplástica refrescante e gotas de sérum iluminador na pele, atmosfera relaxante e clean.'
  },
  {
    title: 'Banner Promocional Toxina Botulínica',
    prompt: 'Design conceitual moderno para clínica de estética premium, estética minimalista destacando jovialidade e elegância, cores suaves em verde sage e branco pérola, espaço para tipografia.'
  }
];

const PRESET_EDIT_PROMPTS = [
  'Simular contorno labial sutil e hidratação profunda mantendo anatomia natural.',
  'Atenuar linhas de expressão glabelares e periorbitais mantendo textura realista da pele.',
  'Uniformizar o tom da pele simulando resultado de 3 sessões de Peeling Químico clareador.',
  'Realçar viço facial e reduzir aspecto de cansaço na região das olheiras.'
];

export const ImageStudioAIView: React.FC<ImageStudioAIViewProps> = ({ 
  currentUser, 
  pacientes = [],
  onSaveToPatientGallery 
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'edit'>('create');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '9:16' | '16:9' | '4:3'>('1:1');
  const [imageSize, setImageSize] = useState<'1K' | '512px'>('1K');
  const [inputImageBase64, setInputImageBase64] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ImageGenerationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setInputImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    const p = prompt.trim();
    if (!p || isLoading) return;

    if (activeTab === 'edit' && !inputImageBase64) {
      setErrorMessage('Para simular ou editar, envie uma foto base do paciente.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSavedSuccessMessage(null);

    try {
      const data = await callGenerateImage({
        prompt: p,
        aspectRatio,
        imageSize,
        base64Image: activeTab === 'edit' ? (inputImageBase64 || undefined) : undefined,
        mode: activeTab
      });

      setResult(data);
    } catch (err: any) {
      console.error('Erro ao gerar imagem com Gemini:', err);
      setErrorMessage(err.message || 'Falha ao processar imagem no Estética Studio IA.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!result?.imageUrl) return;
    const link = document.createElement('a');
    link.href = result.imageUrl;
    link.download = `estetica-studio-ia-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveToPatient = () => {
    if (!result?.imageUrl || !selectedPatientId || !onSaveToPatientGallery) return;
    onSaveToPatientGallery(selectedPatientId, result.imageUrl, `Simulação IA: ${prompt.substring(0, 60)}...`);
    setSavedSuccessMessage('Imagem vinculada à galeria do prontuário com sucesso!');
    setTimeout(() => setSavedSuccessMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-white/20 text-white backdrop-blur-xs">
              <Wand2 className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight">Estética Studio IA & Simulador de Resultados</h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-400 text-slate-900 rounded-full">
              Gemini 3.1 Flash Image
            </span>
          </div>
          <p className="text-xs md:text-sm text-teal-100 max-w-2xl leading-relaxed">
            Crie artes de alta definição para redes sociais, simule previsões estéticas de procedimentos (antes e depois) e ilustre protocolos clínicos com inteligência artificial generativa.
          </p>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="flex items-center justify-center">
        <div className="inline-flex bg-slate-200/80 p-1.5 rounded-2xl border border-slate-300 shadow-inner gap-1">
          <button
            onClick={() => {
              setActiveTab('create');
              setPrompt(PRESET_MARKETING_PROMPTS[0].prompt);
            }}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'create'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Criar Arte Promocional / Foto IA</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('edit');
              setPrompt(PRESET_EDIT_PROMPTS[0]);
            }}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'edit'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scissors className="w-4 h-4 text-teal-600" />
            <span>Simulador & Edição (Antes e Depois)</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-teal-600" />
              Parâmetros de Geração
            </h3>

            {/* If in edit mode: photo upload */}
            {activeTab === 'edit' && (
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Foto do Paciente (Foto Base)
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl p-4 text-center cursor-pointer transition-all bg-slate-50 hover:bg-teal-50/40"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {inputImageBase64 ? (
                    <div className="relative group">
                      <img
                        src={inputImageBase64}
                        alt="Foto base"
                        className="max-h-36 mx-auto rounded-lg object-contain shadow-xs"
                      />
                      <div className="text-[11px] text-teal-700 font-semibold mt-2">
                        Clique para alterar a foto enviada
                      </div>
                    </div>
                  ) : (
                    <div className="py-2">
                      <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                      <p className="text-xs font-semibold text-slate-700">Clique para enviar a foto da face ou pele</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Formatos suportados: PNG, JPG, WEBP</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Prompt Input */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                {activeTab === 'create' ? 'Descrição da Imagem Desejada' : 'Instrução de Simulação / Alteração'}
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                placeholder={
                  activeTab === 'create'
                    ? 'Descreva a cena, iluminação, procedimento estético, cores e estilo...'
                    : 'Descreva a melhoria desejada (ex: atenuar olheiras, preenchimento labial, clarear manchas)...'
                }
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs md:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all resize-none"
              />
            </div>

            {/* Preset Suggestions */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sugestões de Prompts:</span>
              <div className="flex flex-col gap-1.5">
                {(activeTab === 'create' ? PRESET_MARKETING_PROMPTS : PRESET_EDIT_PROMPTS).map((item, idx) => {
                  const text = typeof item === 'string' ? item : item.prompt;
                  const title = typeof item === 'string' ? item : item.title;
                  return (
                    <button
                      key={idx}
                      onClick={() => setPrompt(text)}
                      className="text-left text-xs p-2 rounded-xl bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-900 border border-slate-200 hover:border-teal-200 transition-all cursor-pointer truncate"
                      title={text}
                    >
                      <span className="font-semibold">{title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Aspect Ratio & Resolution */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Proporção (Aspect Ratio)
                </label>
                <select
                  value={aspectRatio}
                  onChange={(e) => setAspectRatio(e.target.value as any)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="1:1">1:1 (Quadrado Feed)</option>
                  <option value="9:16">9:16 (Stories / Reels)</option>
                  <option value="16:9">16:9 (Banner / Paisagem)</option>
                  <option value="4:3">4:3 (Fotografia Clínica)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Resolução
                </label>
                <select
                  value={imageSize}
                  onChange={(e) => setImageSize(e.target.value as any)}
                  className="w-full py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="1K">1K Alta Definição (Padrão)</option>
                  <option value="512px">512px Rápido</option>
                </select>
              </div>
            </div>

            {/* Generate Action Button */}
            <button
              onClick={handleGenerate}
              disabled={isLoading || !prompt.trim()}
              className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processando com Gemini 3.1 Flash Image...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>{activeTab === 'create' ? 'Gerar Imagem' : 'Gerar Simulação'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preview & Output Column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs min-h-[480px] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-teal-600" />
                Pré-visualização do Resultado
              </h3>
              {result && (
                <span className="text-[10px] font-bold px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {result.model}
                </span>
              )}
            </div>

            {/* Error box */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success notification */}
            {savedSuccessMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{savedSuccessMessage}</span>
              </div>
            )}

            {/* Main Stage Display */}
            <div className="my-auto flex items-center justify-center p-4">
              {isLoading ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center mx-auto animate-bounce">
                    <Wand2 className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Aura AI renderizando imagem</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Ajustando proporções, iluminação volumétrica e realismo dermatológico...
                  </p>
                </div>
              ) : result?.imageUrl ? (
                <div className="space-y-4 w-full text-center">
                  <div className="relative inline-block max-w-full overflow-hidden rounded-2xl border border-slate-200 shadow-md bg-slate-900">
                    <img
                      src={result.imageUrl}
                      alt="Resultado gerado por IA"
                      className="max-h-[380px] max-w-full object-contain mx-auto"
                    />
                  </div>
                  {result.text && (
                    <p className="text-xs text-slate-600 max-w-md mx-auto italic">
                      "{result.text}"
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <ImageIcon className="w-12 h-12 mx-auto stroke-1 text-slate-300" />
                  <p className="text-xs">Nenhuma imagem gerada ainda.</p>
                  <p className="text-[11px] text-slate-400">Configure o prompt à esquerda e clique em Gerar.</p>
                </div>
              )}
            </div>

            {/* Actions Footer */}
            {result?.imageUrl && (
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Arquivo</span>
                </button>

                {pacientes.length > 0 && onSaveToPatientGallery && (
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedPatientId}
                      onChange={(e) => setSelectedPatientId(e.target.value)}
                      className="py-1.5 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">Selecione o Cliente...</option>
                      {pacientes.map(p => (
                        <option key={p.id} value={p.id}>{p.nome}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleSaveToPatient}
                      disabled={!selectedPatientId}
                      className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Salvar no Prontuário</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
