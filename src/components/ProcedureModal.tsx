import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  Clock, 
  DollarSign, 
  Tag, 
  Plus, 
  Trash2, 
  Info, 
  CheckCircle2, 
  Package, 
  Image as ImageIcon,
  Check,
  FileText,
  Upload,
  Star,
  Loader2
} from 'lucide-react';
import { ProcedimentoClinico, EstoqueInsumo, UnidadeMedida, CATEGORIAS_PROCEDIMENTOS_PERMITIDAS } from '../types';
import { compressImageFile } from '../lib/image-utils';
import { useConnectionStatus } from '../hooks/useConnectionStatus';
import { Wifi, WifiOff, Database, CloudCheck } from 'lucide-react';

interface ProcedureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (procedimento: Partial<ProcedimentoClinico>, idToEdit?: string) => void;
  procedimentoToEdit?: ProcedimentoClinico | null;
  estoqueDisponivel?: EstoqueInsumo[];
}

const CATEGORIAS_PADRAO = CATEGORIAS_PROCEDIMENTOS_PERMITIDAS;

interface ModeloProcedimento {
  nome: string;
  categoria: string;
  duracao_minutos: number;
  dias_retorno: number;
  valor_tabela: number;
  descricao: string;
  areas: string;
  indicacoes: string;
  contraindicacoes: string;
  cuidados_pos: string;
}

const MODELOS_PROCEDIMENTOS: ModeloProcedimento[] = [
  {
    nome: 'Micropigmentação Labial (Aquarela Lips)',
    categoria: 'Micropigmentação',
    duracao_minutos: 90,
    dias_retorno: 30,
    valor_tabela: 850,
    descricao: 'Técnica exclusiva de revitalização e cor labial com efeito translúcido e natural, definindo bordas e uniformizando tons arroxeados ou pálidos.',
    areas: 'Lábio Superior, Lábio Inferior',
    indicacoes: 'Lábios desvitalizados, Perda de contorno labial, Correção de assimetria sutil',
    contraindicacoes: 'Gestantes, Infecção labial ativa (Herpes ativa), Doenças autoimunes descompensadas',
    cuidados_pos: 'Aplicar pomada cicatrizante recomendada 3 a 5 vezes ao dia. Não retirar as casquinhas durante o processo de cicatrização. Evitar alimentos muito ácidos ou quentes nos primeiros 3 dias.',
  },
  {
    nome: 'Micropigmentação de Sobrancelhas (Shadow Line)',
    categoria: 'Micropigmentação',
    duracao_minutos: 90,
    dias_retorno: 30,
    valor_tabela: 750,
    descricao: 'Preenchimento e sombreamento de efeito pó translúcido para sobrancelhas com falhas ou com pouca densidade de pelos.',
    areas: 'Sobrancelha Direita, Sobrancelha Esquerda',
    indicacoes: 'Falhas nas sobrancelhas, Falta de desenho, Sobrancelhas ralas',
    contraindicacoes: 'Dermatites na área, Quelóides ativos, Gestação sem liberação médica',
    cuidados_pos: 'Higienizar com soro fisiológico, não esfregar a região, evitar piscina e exposição solar durante 10 dias.',
  },
  {
    nome: 'Extensão de Cílios (Volume Russo & Híbrido)',
    categoria: 'Cilios',
    duracao_minutos: 120,
    dias_retorno: 20,
    valor_tabela: 220,
    descricao: 'Aplicação de leques e fios ultrafinos de seda, modelando o olhar com leveza, curvatura e densidade personalizada.',
    areas: 'Cílios Superiores (Olho Direito e Esquerdo)',
    indicacoes: 'Cílios curtos, Cílios retos, Praticidade no dia a dia sem rímel',
    contraindicacoes: 'Blefarite ativa, Conjuntivite, Alergia a cianoacrilato',
    cuidados_pos: 'Não molhar os olhos nas primeiras 24 horas. Evitar demaquilantes oleosos e não esfregar os olhos com força.',
  },
  {
    nome: 'Design de Sombrancelhas com Henna & Mapeamento',
    categoria: 'Sombrancelhas',
    duracao_minutos: 45,
    dias_retorno: 15,
    valor_tabela: 85,
    descricao: 'Mapeamento facial através de paquímetro e linha, epilação precisa com pinça e aplicação de pigmento natural à base de henna.',
    areas: 'Arcadas Ciliares e Sobrancelhas',
    indicacoes: 'Harmonização do olhar, Limpeza de pelos excessivos, Destaque da cor',
    contraindicacoes: 'Feridas abertas na região, Alergia conhecida a henna',
    cuidados_pos: 'Evitar lavar a região com sabonete adstringente nas primeiras 8 horas para maior durabilidade da henna.',
  },
  {
    nome: 'Limpesa de Pele Profunda + Peeling Ultrassônico & LED',
    categoria: 'Limpesa de pele',
    duracao_minutos: 60,
    dias_retorno: 30,
    valor_tabela: 220,
    descricao: 'Higienização profunda, emoliência com vapor de ozônio, extração indolor de comedões por sucção e espátula ultrassônica, finalizando com máscara calmante e fototerapia LED.',
    areas: 'Face Completa, Pescoço, Colo',
    indicacoes: 'Cravos e miliuns, Poros dilatados, Excesso de oleosidade e células mortas',
    contraindicacoes: 'Dermatites agudas em crise, Queimaduras solares recentes, Rosácea ativa grave',
    cuidados_pos: 'Não aplicar maquiagem pesada por 12h. Usar protetor solar com FPS 50+ reaplicando a cada 3h.',
  },
  {
    nome: 'Terapia Capilar & Reconstrução dos Fios',
    categoria: 'Cabelo',
    duracao_minutos: 75,
    dias_retorno: 30,
    valor_tabela: 250,
    descricao: 'Desintoxicação do couro cabeludo, aplicação de alta frequência para oxigenação capilar e reposição profunda de massa lipídica e aminoácidos.',
    areas: 'Couro Cabeludo, Haste Capilar',
    indicacoes: 'Fios ressecados ou quebradiços, Queda por tração ou estresse, Pós-química',
    contraindicacoes: 'Lesões abertas no couro cabeludo, Sensibilidade extrema ao calor',
    cuidados_pos: 'Utilizar produtos home care sem sulfatos pesados e manter hidratação semanal.',
  },
  {
    nome: 'Penteado Social / Noiva / Eventos Especiais',
    categoria: 'penteado',
    duracao_minutos: 60,
    dias_retorno: 30,
    valor_tabela: 190,
    descricao: 'Produção capilar completa com preparação térmica, escovação, fixação profissional, tranças decorativas, coques modernos ou semipresos para ocasiões comemorativas.',
    areas: 'Cabelos e Penteado',
    indicacoes: 'Casamentos, Formaturas, Festas, Sessões fotográficas',
    contraindicacoes: 'Nenhuma contraindicação clínica',
    cuidados_pos: 'Para desmontar o penteado, soltar os grampos com cuidado e desembaraçar as mechas das pontas para a raiz utilizando óleo reparador.',
  },
  {
    nome: 'Drenagem Linfática Facial / Procedimento Estético',
    categoria: 'procedimento estetico',
    duracao_minutos: 50,
    dias_retorno: 15,
    valor_tabela: 160,
    descricao: 'Manobras manuais especializadas para drenagem de líquidos intersticiais retidos, desinchaço facial imediato, alívio de tensões e tonificação tecidual.',
    areas: 'Face, Papada, Linha Mandibular e Pescoço',
    indicacoes: 'Retenção hídrica facial, Bolsas periorbiculares, Pós-procedimentos estéticos não invasivos',
    contraindicacoes: 'Processos infecciosos febris, Trombose recente, Neoplasias ativas sem liberação oncológica',
    cuidados_pos: 'Manter ingestão adequada de água ao longo do dia para potencializar a eliminação natural de toxinas.',
  }
];

export const ProcedureModal: React.FC<ProcedureModalProps> = ({
  isOpen,
  onClose,
  onSave,
  procedimentoToEdit,
  estoqueDisponivel = [],
}) => {
  const { isOnline, pendingCount, isSyncing } = useConnectionStatus();
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<string>(CATEGORIAS_PADRAO[0]);
  const [duracaoMinutos, setDuracaoMinutos] = useState(45);
  const [diasRetorno, setDiasRetorno] = useState(15);
  const [valorTabela, setValorTabela] = useState<number | string>(850);
  const [valorPromocional, setValorPromocional] = useState<string>('');
  const [descricao, setDescricao] = useState('');
  const [areasInput, setAreasInput] = useState('');
  const [indicacoesInput, setIndicacoesInput] = useState('');
  const [contraindicacoesInput, setContraindicacoesInput] = useState('');
  const [cuidadosPos, setCuidadosPos] = useState('');
  const [destaquePortal, setDestaquePortal] = useState(true);
  const [ativo, setAtivo] = useState(true);
  const [exigeContrato, setExigeContrato] = useState(true);
  const [contratoPadrao, setContratoPadrao] = useState('');

  // Imagens do mostruário (até 5 fotos da galeria)
  const [imagensGaleria, setImagensGaleria] = useState<string[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [manualUrlInput, setManualUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Insumos vinculados (receita padrão)
  const [insumosVinculados, setInsumosVinculados] = useState<{
    insumo_id: string;
    nome_item: string;
    quantidade: number;
    unidade_medida: UnidadeMedida;
  }[]>([]);

  useEffect(() => {
    if (procedimentoToEdit) {
      setNome(procedimentoToEdit.nome || '');
      setCategoria(procedimentoToEdit.categoria || CATEGORIAS_PADRAO[0]);
      setDuracaoMinutos(procedimentoToEdit.duracao_minutos || 45);
      setDiasRetorno(procedimentoToEdit.dias_retorno_padrao || 15);
      setValorTabela(procedimentoToEdit.valor_tabela || procedimentoToEdit.preco_sugerido || 0);
      setValorPromocional(procedimentoToEdit.valor_promocional ? String(procedimentoToEdit.valor_promocional) : '');
      setDescricao(procedimentoToEdit.descricao || '');
      setAreasInput(procedimentoToEdit.areas_aplicacao ? procedimentoToEdit.areas_aplicacao.join(', ') : '');
      setIndicacoesInput(procedimentoToEdit.indicacoes ? procedimentoToEdit.indicacoes.join(', ') : '');
      setContraindicacoesInput(procedimentoToEdit.contraindicacoes ? (Array.isArray(procedimentoToEdit.contraindicacoes) ? procedimentoToEdit.contraindicacoes.join(', ') : procedimentoToEdit.contraindicacoes) : '');
      setCuidadosPos(procedimentoToEdit.cuidados_pos || procedimentoToEdit.instrucoes_cuidados || '');
      
      // Carregar imagens do mostruário
      const loadedImages: string[] = [];
      if (procedimentoToEdit.imagens_galeria && procedimentoToEdit.imagens_galeria.length > 0) {
        loadedImages.push(...procedimentoToEdit.imagens_galeria.slice(0, 5));
      } else if (procedimentoToEdit.imagem_url) {
        loadedImages.push(procedimentoToEdit.imagem_url);
      }
      setImagensGaleria(loadedImages);

      setDestaquePortal(procedimentoToEdit.destaque_portal ?? true);
      setAtivo(procedimentoToEdit.ativo ?? true);
      setExigeContrato(procedimentoToEdit.exige_contrato ?? true);
      setContratoPadrao(procedimentoToEdit.contrato_padrao || `TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO & CONTRATO DE SERVIÇOS ESTÉTICOS\n\n1. PROCEDIMENTO: ${procedimentoToEdit.nome}\n2. ESCLARECIMENTO: O paciente declara ter sido orientado(a) sobre indicações, contraindicações e cuidados pós-procedimento.\n3. CUSTOS E PRODUTOS: Os valores acordados e produtos aplicados constam em ficha e recibo financeiro.\n4. PRIVACIDADE: O paciente autoriza registros clínicos para histórico no prontuário eletrônico.`);
      setInsumosVinculados(procedimentoToEdit.insumos_vinculados || []);
    } else {
      setNome('');
      setCategoria(CATEGORIAS_PADRAO[0]);
      setDuracaoMinutos(45);
      setDiasRetorno(15);
      setValorTabela(850);
      setValorPromocional('');
      setDescricao('');
      setAreasInput('');
      setIndicacoesInput('');
      setContraindicacoesInput('');
      setCuidadosPos('');
      setImagensGaleria([]);
      setShowUrlInput(false);
      setManualUrlInput('');
      setDestaquePortal(true);
      setAtivo(true);
      setExigeContrato(true);
      setContratoPadrao('TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO & CONTRATO DE PRESTAÇÃO DE SERVIÇOS ESTÉTICOS\n\n1. OBJETO E TRATAMENTO: O presente contrato tem por objeto a prestação de serviços estéticos especializados conforme avaliação e plano de aplicação acordado.\n2. CIÊNCIA E ESCLARECIMENTOS: O(A) paciente declara ter sido devidamente orientado(a) quanto à técnica utilizada, número de sessões recomendadas, cuidados pré e pós-procedimento, bem como possíveis reações temporárias esperadas (edema, rubor ou sensibilidade local).\n3. OBRIGAÇÕES DO PACIENTE: O(A) paciente compromete-se a seguir integralmente as recomendações e cuidados domiciliares fornecidos pelo profissional, bem como retornar nas datas agendadas para reavaliação clínica.\n4. CONDIÇÕES FINANCEIRAS: Os valores acordados e formas de pagamento contratadas encontram-se discriminados no recibo do procedimento.\n5. AUTORIZAÇÃO E PRONTUÁRIO: Fica autorizada a inclusão das fotos de evolução clínica e dados de aplicação no prontuário eletrônico confidencial.');
      setInsumosVinculados([]);
    }
  }, [procedimentoToEdit, isOpen]);

  if (!isOpen) return null;

  const handleApplyModelo = (modelo: ModeloProcedimento) => {
    setNome(modelo.nome);
    setCategoria(modelo.categoria);
    setDuracaoMinutos(modelo.duracao_minutos);
    setDiasRetorno(modelo.dias_retorno);
    setValorTabela(modelo.valor_tabela);
    setDescricao(modelo.descricao);
    setAreasInput(modelo.areas);
    setIndicacoesInput(modelo.indicacoes);
    setContraindicacoesInput(modelo.contraindicacoes);
    setCuidadosPos(modelo.cuidados_pos);
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    const remainingSlots = 5 - imagensGaleria.length;
    if (remainingSlots <= 0) return;

    const toProcess = files.slice(0, remainingSlots);
    setIsUploadingImages(true);
    try {
      const processed: string[] = [];
      for (const file of toProcess) {
        if (!file.type.startsWith('image/')) continue;
        const base64 = await compressImageFile(file, {
          maxWidth: 900,
          maxHeight: 900,
          quality: 0.78,
          targetMaxKB: 40,
          mimeType: 'image/webp'
        });
        processed.push(base64);
      }
      setImagensGaleria(prev => [...prev, ...processed].slice(0, 5));
    } catch (err) {
      console.error('Erro ao processar imagem da galeria:', err);
    } finally {
      setIsUploadingImages(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAddManualUrl = () => {
    if (!manualUrlInput.trim()) return;
    if (imagensGaleria.length >= 5) return;
    setImagensGaleria(prev => [...prev, manualUrlInput.trim()].slice(0, 5));
    setManualUrlInput('');
    setShowUrlInput(false);
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImagensGaleria(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSetPrimaryImage = (indexToPrimary: number) => {
    setImagensGaleria(prev => {
      const target = prev[indexToPrimary];
      const others = prev.filter((_, idx) => idx !== indexToPrimary);
      return [target, ...others];
    });
  };

  const handleAddInsumo = (insumoId: string) => {
    const item = estoqueDisponivel.find(i => i.id === insumoId);
    if (!item) return;
    if (insumosVinculados.some(i => i.insumo_id === insumoId)) return;

    setInsumosVinculados([
      ...insumosVinculados,
      {
        insumo_id: item.id,
        nome_item: item.nome_item,
        quantidade: 1,
        unidade_medida: item.unidade_medida,
      }
    ]);
  };

  const handleRemoveInsumo = (insumoId: string) => {
    setInsumosVinculados(insumosVinculados.filter(i => i.insumo_id !== insumoId));
  };

  const handleUpdateInsumoQuantity = (insumoId: string, qtd: number) => {
    setInsumosVinculados(
      insumosVinculados.map(i => i.insumo_id === insumoId ? { ...i, quantidade: Math.max(0.1, qtd) } : i)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    const numValor = Number(valorTabela) || 0;

    const areas = areasInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const indicacoes = indicacoesInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const primaryImage = imagensGaleria[0] || undefined;

    const dataToSave: Partial<ProcedimentoClinico> = {
      nome: nome.trim(),
      categoria,
      duracao_minutos: Number(duracaoMinutos) || 45,
      dias_retorno_padrao: Number(diasRetorno) || 15,
      valor_tabela: numValor,
      preco_sugerido: numValor,
      valor_promocional: valorPromocional ? Number(valorPromocional) : undefined,
      descricao: descricao.trim(),
      areas_aplicacao: areas.length > 0 ? areas : undefined,
      indicacoes: indicacoes.length > 0 ? indicacoes : undefined,
      contraindicacoes: contraindicacoesInput.trim() || undefined,
      cuidados_pos: cuidadosPos.trim() || undefined,
      instrucoes_cuidados: cuidadosPos.trim() || undefined,
      imagem_url: primaryImage,
      imagens_galeria: imagensGaleria.length > 0 ? imagensGaleria : (primaryImage ? [primaryImage] : undefined),
      destaque_portal: destaquePortal,
      ativo,
      insumos_vinculados: insumosVinculados.length > 0 ? insumosVinculados : undefined,
      exige_contrato: exigeContrato,
      contrato_padrao: contratoPadrao.trim() || undefined,
    };

    onSave(dataToSave, procedimentoToEdit?.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {procedimentoToEdit ? 'Editar Procedimento' : 'Novo Procedimento'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Defina detalhes clínicos, mostruário de fotos, categoria e contrato
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">

          {/* Modelos Prontos para Acelerar */}
          {!procedimentoToEdit && (
            <div className="bg-indigo-50/50 border border-indigo-100/80 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Modelos Prontos por Categoria
                </span>
                <span className="text-[10px] text-indigo-600 font-medium">Clique para preencher automaticamente</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {MODELOS_PROCEDIMENTOS.map((mod, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyModelo(mod)}
                    className="text-xs px-2.5 py-1 bg-white hover:bg-indigo-600 hover:text-white text-indigo-800 rounded-lg border border-indigo-200/60 font-medium transition-all shadow-2xs"
                  >
                    {mod.nome}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Identificação Básica */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Nome do Procedimento *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Micropigmentação Labial Aquarela"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Categoria *
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium cursor-pointer"
              >
                {CATEGORIAS_PADRAO.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Precificação Única e Duração */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Preço & Duração do Procedimento
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Preço do Procedimento (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                  <input
                    type="number"
                    required
                    min={0}
                    step="0.01"
                    placeholder="850.00"
                    value={valorTabela}
                    onChange={(e) => setValorTabela(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  Preço Promocional (Opcional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">R$</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Ex: 750.00"
                    value={valorPromocional}
                    onChange={(e) => setValorPromocional(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Duração Estimada (minutos) *
                </label>
                <input
                  type="number"
                  required
                  min={5}
                  max={480}
                  value={duracaoMinutos}
                  onChange={(e) => setDuracaoMinutos(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg font-medium"
                />
              </div>
            </div>

            {/* Retorno Clínico */}
            <div className="pt-1">
              <div className="space-y-1 sm:w-1/2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  Retorno Clínico Recomendado (dias)
                </label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={diasRetorno}
                  onChange={(e) => setDiasRetorno(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg font-medium"
                  placeholder="Ex: 15"
                />
              </div>
            </div>
          </div>

          {/* Galeria de Fotos / Mostruário (Até 5 imagens) */}
          <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/90 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-pink-600" />
                  Fotos do Mostruário (Galeria de Resultados)
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  Adicione até 5 fotos da galeria para o mostruário de resultados do procedimento.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                  imagensGaleria.length >= 5 
                    ? 'bg-amber-50 text-amber-700 border-amber-200' 
                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                }`}>
                  {imagensGaleria.length} de 5 fotos
                </span>

                {imagensGaleria.length < 5 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImages}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {isUploadingImages ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Otimizando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        Abrir Galeria
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Input escondido para selecionar fotos da galeria */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFilesSelected}
              className="hidden"
            />

            {/* Toggle para link manual */}
            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="text-pink-600 hover:text-pink-700 font-semibold underline underline-offset-2 flex items-center gap-1 cursor-pointer"
              >
                {showUrlInput ? 'Ocultar inserção por link URL' : 'Ou colar link direto de foto URL'}
              </button>
              {isUploadingImages && (
                <span className="text-indigo-600 font-medium animate-pulse text-[11px]">
                  Comprimindo fotos da galeria para carregamento instantâneo...
                </span>
              )}
            </div>

            {/* Formulário de URL manual */}
            {showUrlInput && (
              <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                <input
                  type="url"
                  placeholder="Cole o link da foto (https://...)"
                  value={manualUrlInput}
                  onChange={(e) => setManualUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddManualUrl();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500"
                />
                <button
                  type="button"
                  onClick={handleAddManualUrl}
                  disabled={!manualUrlInput.trim() || imagensGaleria.length >= 5}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold disabled:opacity-40 cursor-pointer"
                >
                  Adicionar Link
                </button>
              </div>
            )}

            {/* Grid dos 5 Slots de Mostruário */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
              {imagensGaleria.map((imgUrl, idx) => (
                <div 
                  key={idx} 
                  className={`relative group rounded-xl overflow-hidden border-2 transition-all aspect-square bg-slate-100 flex items-center justify-center ${
                    idx === 0 ? 'border-pink-500 ring-2 ring-pink-500/20 shadow-xs' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`Mostruário ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80';
                    }}
                  />
                  {/* Badges */}
                  <div className="absolute top-1.5 left-1.5">
                    {idx === 0 ? (
                      <span className="bg-pink-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-current" /> Capa
                      </span>
                    ) : (
                      <span className="bg-slate-900/70 backdrop-blur-xs text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                        Foto {idx + 1}
                      </span>
                    )}
                  </div>

                  {/* Ações ao passar o mouse / toque */}
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                    {idx !== 0 && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimaryImage(idx)}
                        className="w-full py-1 px-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded text-[10px] font-bold shadow-xs cursor-pointer"
                        title="Definir como foto de capa principal"
                      >
                        Tornar Capa
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="w-full py-1 px-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                      title="Excluir do mostruário"
                    >
                      <Trash2 className="w-3 h-3" />
                      Excluir
                    </button>
                  </div>
                </div>
              ))}

              {/* Slots Vazios */}
              {Array.from({ length: Math.max(0, 5 - imagensGaleria.length) }).map((_, slotIdx) => {
                const currentSlotNum = imagensGaleria.length + slotIdx + 1;
                return (
                  <button
                    key={`slot-${slotIdx}`}
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImages}
                    className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-pink-400 bg-white hover:bg-pink-50/30 transition-all flex flex-col items-center justify-center p-2 text-center group cursor-pointer disabled:opacity-50"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-pink-100 flex items-center justify-center text-slate-400 group-hover:text-pink-600 mb-1 transition-colors">
                      <Plus className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 group-hover:text-pink-700">
                      Foto {currentSlotNum}
                    </span>
                    <span className="text-[9px] text-slate-400">
                      {currentSlotNum === 1 ? 'Foto de Capa' : 'Mostruário'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Descrição e Aplicação */}
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Descrição do Procedimento & Benefícios
              </label>
              <textarea
                rows={2}
                placeholder="Descreva a técnica aplicada, benefícios e resultados esperados..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-medium resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Áreas de Aplicação (separadas por vírgula)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Face, Lábios, Sobrancelhas..."
                  value={areasInput}
                  onChange={(e) => setAreasInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Principais Indicações (separadas por vírgula)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Realce do olhar, Harmonização..."
                  value={indicacoesInput}
                  onChange={(e) => setIndicacoesInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Contraindicações
                </label>
                <input
                  type="text"
                  placeholder="Ex: Gestantes, Infecção ativa no local..."
                  value={contraindicacoesInput}
                  onChange={(e) => setContraindicacoesInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Orientações Pós-Procedimento
                </label>
                <input
                  type="text"
                  placeholder="Ex: Aplicar pomada 3x ao dia..."
                  value={cuidadosPos}
                  onChange={(e) => setCuidadosPos(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-medium"
                />
              </div>
            </div>
          </div>

          {/* Insumos Vinculados (Receita Padrão) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-indigo-600" />
                  Receita Padrão de Insumos (Baixa Automática)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Estes itens serão deduzidos do estoque sempre que o procedimento for realizado
                </p>
              </div>

              {estoqueDisponivel.length > 0 && (
                <div className="flex items-center gap-2">
                  <select
                    id="select-add-insumo"
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddInsumo(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">+ Vincular Insumo do Estoque</option>
                    {estoqueDisponivel
                      .filter(i => !insumosVinculados.some(v => v.insumo_id === i.id))
                      .map(ins => (
                        <option key={ins.id} value={ins.id}>
                          {ins.nome_item} ({ins.unidade_medida})
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            {insumosVinculados.length === 0 ? (
              <div className="text-center py-4 border border-dashed border-slate-200 rounded-lg bg-white">
                <Package className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                <p className="text-xs text-slate-400">Nenhum insumo vinculado a este procedimento.</p>
                <p className="text-[10px] text-slate-400">Vincule materiais para ter controle automático de custo e estoque.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {insumosVinculados.map((insumo) => (
                  <div 
                    key={insumo.insumo_id}
                    className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200 text-xs"
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <span className="font-semibold text-slate-800">{insumo.nome_item}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 text-[11px]">Qtd:</span>
                        <input
                          type="number"
                          min={0.01}
                          step={0.1}
                          value={insumo.quantidade}
                          onChange={(e) => handleUpdateInsumoQuantity(insumo.insumo_id, Number(e.target.value))}
                          className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-center font-bold text-slate-800"
                        />
                        <span className="text-slate-500 text-[11px] font-medium">{insumo.unidade_medida}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveInsumo(insumo.insumo_id)}
                        className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Termo de Consentimento & Contrato Específico */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                Contrato & Termo de Consentimento Específico
              </h4>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={exigeContrato}
                  onChange={(e) => setExigeContrato(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                Exigir Assinatura do Contrato no Atendimento
              </label>
            </div>

            {exigeContrato && (
              <div className="space-y-1">
                <p className="text-[11px] text-slate-500">
                  Texto contratual exibido ao paciente para assinatura digital na finalização do procedimento:
                </p>
                <textarea
                  rows={4}
                  value={contratoPadrao}
                  onChange={(e) => setContratoPadrao(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-lg font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  placeholder="Insira o texto das cláusulas e termos deste procedimento..."
                />
              </div>
            )}
          </div>

          {/* Configurações Finais */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={destaquePortal}
                  onChange={(e) => setDestaquePortal(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                Exibir com Destaque no Catálogo de Procedimentos
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                Procedimento Ativo para Agendamento
              </label>
            </div>
          </div>

          {/* Botões do Rodapé */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isUploadingImages}
              className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all hover:shadow-indigo-500/20 disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              {procedimentoToEdit ? 'Salvar Alterações' : 'Cadastrar Procedimento'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
