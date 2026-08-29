import React, { useState } from 'react';
import { 
  MapPin, 
  Search, 
  ExternalLink, 
  Building2, 
  Sparkles, 
  Star, 
  Navigation, 
  Truck, 
  FlaskConical, 
  Plus, 
  Check, 
  Loader2,
  Map as MapIcon
} from 'lucide-react';
import { callMapsGrounding, MapsGroundingResult } from '../services/geminiService';
import { UsuarioEquipe, Fornecedor } from '../types';

interface MapsGroundingViewProps {
  currentUser: UsuarioEquipe;
  onAddFornecedor?: (fornecedor: Partial<Fornecedor>) => void;
}

const PRESET_QUERIES = [
  {
    label: 'Distribuidores de Toxina & Preenchedores',
    icon: Truck,
    query: 'distribuidores autorizados de toxina botulínica e ácido hialurônico para clínicas de estética'
  },
  {
    label: 'Farmácias de Manipulação Especializadas',
    icon: FlaskConical,
    query: 'farmácias de manipulação estética facial e corporal com entregas para consultórios'
  },
  {
    label: 'Laboratórios & Clínicas Dermatológicas',
    icon: Building2,
    query: 'laboratórios de biópsia dermatológica e clínicas de dermatologia estética de referência'
  },
  {
    label: 'Equipamentos & Descartáveis Estéticos',
    icon: Navigation,
    query: 'lojas de descartáveis hospitalares, seringas, agulhas e equipamentos a laser para estética'
  }
];

export const MapsGroundingView: React.FC<MapsGroundingViewProps> = ({ currentUser, onAddFornecedor }) => {
  const [searchQuery, setSearchQuery] = useState('distribuidores de toxina botulínica e ácido hialurônico');
  const [location, setLocation] = useState('São Paulo, SP');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MapsGroundingResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [addedSupplierId, setAddedSupplierId] = useState<string | null>(null);

  const handleSearch = async (queryToUse?: string) => {
    const q = (queryToUse || searchQuery).trim();
    if (!q || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await callMapsGrounding({
        query: q,
        location: location.trim() || undefined
      });
      setResult(data);
    } catch (err: any) {
      console.error('Erro na consulta do Google Maps Grounding:', err);
      setErrorMessage(err.message || 'Falha ao buscar locais no Google Maps com Gemini.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAddSupplier = (name: string, address?: string, uri?: string) => {
    if (!onAddFornecedor) return;
    const newFornecedor: Partial<Fornecedor> = {
      nome_empresa: name,
      endereco: address || '',
      site: uri || '',
      categoria: 'insumos_injetaveis',
      telefone: '(11) 99999-0000',
      status: 'ativo',
      observacoes: `Fornecedor localizado via Google Maps Grounding por ${currentUser.nome || 'Usuário'}.`
    };
    onAddFornecedor(newFornecedor);
    setAddedSupplierId(name);
    setTimeout(() => setAddedSupplierId(null), 3000);
  };

  const groundingChunks = result?.groundingMetadata?.groundingChunks || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-white/20 text-white backdrop-blur-xs">
              <MapIcon className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight">Google Maps Grounding & Fornecedores</h1>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-400 text-slate-900 rounded-full">
              Gemini 2.5 Flash
            </span>
          </div>
          <p className="text-xs md:text-sm text-blue-100 max-w-2xl leading-relaxed">
            Localize fornecedores autorizados de insumos, distribuidores de injetáveis, farmácias de manipulação e clínicas parceiras com dados atualizados e ancorados no ecossistema Google Maps.
          </p>
        </div>
      </div>

      {/* Search Filter Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-7 relative">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              O que você procura?
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ex: Distribuidores autorizados de toxina botulínica e ácido hialurônico..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs md:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>

          <div className="md:col-span-3 relative">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Região / Cidade
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: São Paulo, SP..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs md:text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>

          <div className="md:col-span-2 flex items-end">
            <button
              onClick={() => handleSearch()}
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-xs disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Buscando...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Explorar</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-400">Sugestões Rápidas:</span>
          {PRESET_QUERIES.map((preset, idx) => {
            const Icon = preset.icon;
            return (
              <button
                key={idx}
                onClick={() => {
                  setSearchQuery(preset.query);
                  handleSearch(preset.query);
                }}
                disabled={isLoading}
                className="text-xs bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Icon className="w-3.5 h-3.5 text-blue-600" />
                <span>{preset.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-rose-600 font-bold ml-2">×</button>
        </div>
      )}

      {/* Initial Empty State before search */}
      {!result && !isLoading && !errorMessage && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-1">Pronto para pesquisar no Google Maps</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
            Escolha uma das sugestões acima ou digite termos específicos de insumos estéticos, farmácias de manipulação ou parceiros clínicos.
          </p>
          <button
            onClick={() => handleSearch()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-xs"
          >
            Buscar Fornecedores Agora
          </button>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main AI Summary & Analysis */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Relatório de Estabelecimentos & Logística</h3>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Grounding com Google Maps
              </span>
            </div>

            <div className="text-xs md:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {result.text}
            </div>
          </div>

          {/* Sidebar with Grounded Place Chunks */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                Locais Ancorados ({groundingChunks.length})
              </h4>

              {groundingChunks.length === 0 ? (
                <div className="text-xs text-slate-500 py-4 text-center">
                  Os detalhes de localização foram incorporados diretamente no relatório ao lado.
                </div>
              ) : (
                <div className="space-y-3">
                  {groundingChunks.map((chunk, idx) => {
                    const place = chunk.maps || chunk.web;
                    const isMaps = Boolean(chunk.maps);
                    const title = place?.title || `Local ${idx + 1}`;
                    const address = (place as any)?.address;
                    const rating = (place as any)?.rating;
                    const uri = place?.uri;

                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-blue-300 hover:shadow-xs transition-all text-xs"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h5 className="font-bold text-slate-800 text-xs">{title}</h5>
                          {uri && (
                            <a
                              href={uri}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded-md transition-all shrink-0"
                              title="Abrir no Google Maps"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>

                        {address && (
                          <p className="text-[11px] text-slate-500 mb-2 leading-tight">
                            {address}
                          </p>
                        )}

                        {rating && (
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 mb-2">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            <span>{rating.toFixed(1)} estrelas</span>
                          </div>
                        )}

                        {onAddFornecedor && (
                          <button
                            onClick={() => handleQuickAddSupplier(title, address, uri)}
                            className={`w-full mt-1 py-1 px-2.5 rounded-lg font-semibold text-[11px] transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              addedSupplierId === title
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 hover:border-blue-200'
                            }`}
                          >
                            {addedSupplierId === title ? (
                              <>
                                <Check className="w-3 h-3" />
                                <span>Cadastrado em Fornecedores!</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3 h-3" />
                                <span>Vincular como Fornecedor</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
