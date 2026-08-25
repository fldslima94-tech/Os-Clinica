import React, { useState, useEffect } from 'react';
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
  Layers, 
  Image as ImageIcon,
  Sliders,
  Check,
  FileText
} from 'lucide-react';
import { ProcedimentoClinico, EstoqueInsumo, UnidadeMedida, VariacaoProcedimento } from '../types';

interface ProcedureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (procedimento: Omit<ProcedimentoClinico, 'id'>, idToEdit?: string) => void;
  procedimentoToEdit?: ProcedimentoClinico | null;
  estoqueDisponivel?: EstoqueInsumo[];
}

const CATEGORIAS_PADRAO = [
  'Injetáveis & Harmonização',
  'Bioestimuladores & Fios',
  'Laser & Fototerapia',
  'Tratamentos Faciais & Peelings',
  'Corporal & Alta Tecnologia',
  'Consultas & Avaliações',
  'Outros Procedimentos',
];

export const ProcedureModal: React.FC<ProcedureModalProps> = ({
  isOpen,
  onClose,
  onSave,
  procedimentoToEdit,
  estoqueDisponivel = [],
}) => {
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState(CATEGORIAS_PADRAO[0]);
  const [duracaoMinutos, setDuracaoMinutos] = useState(45);
  const [valorTabela, setValorTabela] = useState(1200);
  const [valorPromocional, setValorPromocional] = useState<string>('');
  const [descricao, setDescricao] = useState('');
  const [areasInput, setAreasInput] = useState('');
  const [indicacoesInput, setIndicacoesInput] = useState('');
  const [cuidadosPos, setCuidadosPos] = useState('');
  const [imagemUrl, setImagemUrl] = useState('');
  const [destaquePortal, setDestaquePortal] = useState(true);
  const [ativo, setAtivo] = useState(true);
  const [exigeContrato, setExigeContrato] = useState(true);
  const [contratoPadrao, setContratoPadrao] = useState('');

  // 3 Tabela de Valores Variáveis (Variações de Preço e Porte)
  const [variacao1, setVariacao1] = useState<VariacaoProcedimento>({
    id: 'v1',
    nome: 'Variação 1 (Básico / 1 Área / Inicial)',
    valor: 650,
    duracao_minutos: 30,
    descricao: 'Atendimento pontual ou área única',
  });

  const [variacao2, setVariacao2] = useState<VariacaoProcedimento>({
    id: 'v2',
    nome: 'Variação 2 (Intermediário / 2 Áreas)',
    valor: 1100,
    duracao_minutos: 45,
    descricao: 'Atendimento médio com 2 regiões ou volume intermediário',
  });

  const [variacao3, setVariacao3] = useState<VariacaoProcedimento>({
    id: 'v3',
    nome: 'Variação 3 (Completo / 3 Áreas / Premium)',
    valor: 1450,
    duracao_minutos: 60,
    descricao: 'Protocolo completo ou full face com acompanhamento',
  });

  // Insumos vinculados (receita padrão)
  const [insumosVinculados, setInsumosVinculados] = useState<{
    insumo_id: string;
    nome_item: string;
    quantidade: number;
    unidade_medida: UnidadeMedida;
  }[]>([]);

  useEffect(() => {
    if (procedimentoToEdit) {
      setNome(procedimentoToEdit.nome);
      setCategoria(procedimentoToEdit.categoria);
      setDuracaoMinutos(procedimentoToEdit.duracao_minutos);
      setValorTabela(procedimentoToEdit.valor_tabela);
      setValorPromocional(procedimentoToEdit.valor_promocional ? String(procedimentoToEdit.valor_promocional) : '');
      setDescricao(procedimentoToEdit.descricao);
      setAreasInput(procedimentoToEdit.areas_aplicacao ? procedimentoToEdit.areas_aplicacao.join(', ') : '');
      setIndicacoesInput(procedimentoToEdit.indicacoes ? procedimentoToEdit.indicacoes.join(', ') : '');
      setCuidadosPos(procedimentoToEdit.cuidados_pos || '');
      setImagemUrl(procedimentoToEdit.imagem_url || '');
      setDestaquePortal(procedimentoToEdit.destaque_portal ?? true);
      setAtivo(procedimentoToEdit.ativo ?? true);
      setExigeContrato(procedimentoToEdit.exige_contrato ?? true);
      setContratoPadrao(procedimentoToEdit.contrato_padrao || `TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO & CONTRATO DE SERVIÇOS ESTÉTICOS\n\n1. PROCEDIMENTO: ${procedimentoToEdit.nome}\n2. ESCLARECIMENTO: O paciente declara ter sido orientado(a) sobre indicações, contraindicações e cuidados pós-procedimento.\n3. CUSTOS E PRODUTOS: Os valores acordados e produtos aplicados constam em ficha e recibo financeiro.\n4. PRIVACIDADE: O paciente autoriza registros clínicos para histórico no prontuário eletrônico.`);
      setInsumosVinculados(procedimentoToEdit.insumos_vinculados || []);

      if (procedimentoToEdit.variacoes && procedimentoToEdit.variacoes.length >= 3) {
        setVariacao1(procedimentoToEdit.variacoes[0]);
        setVariacao2(procedimentoToEdit.variacoes[1]);
        setVariacao3(procedimentoToEdit.variacoes[2]);
      } else {
        const baseVal = procedimentoToEdit.valor_tabela || 1200;
        setVariacao1({
          id: 'v1',
          nome: 'Variação 1 (Básico / 1 Área)',
          valor: Math.round(baseVal * 0.5),
          duracao_minutos: Math.max(20, Math.round(procedimentoToEdit.duracao_minutos * 0.7)),
          descricao: 'Atendimento inicial em 1 região',
        });
        setVariacao2({
          id: 'v2',
          nome: 'Variação 2 (Intermediário / 2 Áreas)',
          valor: Math.round(baseVal * 0.8),
          duracao_minutos: procedimentoToEdit.duracao_minutos,
          descricao: 'Atendimento intermediário ou 2 regiões',
        });
        setVariacao3({
          id: 'v3',
          nome: 'Variação 3 (Completo / 3 Áreas / Premium)',
          valor: baseVal,
          duracao_minutos: Math.round(procedimentoToEdit.duracao_minutos * 1.2),
          descricao: 'Protocolo completo e intensivo',
        });
      }
    } else {
      setNome('');
      setCategoria(CATEGORIAS_PADRAO[0]);
      setDuracaoMinutos(45);
      setValorTabela(1200);
      setValorPromocional('');
      setDescricao('');
      setAreasInput('');
      setIndicacoesInput('');
      setCuidadosPos('');
      setImagemUrl('');
      setDestaquePortal(true);
      setAtivo(true);
      setExigeContrato(true);
      setContratoPadrao('TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO & CONTRATO DE PRESTAÇÃO DE SERVIÇOS ESTÉTICOS\n\n1. OBJETO E TRATAMENTO: O presente contrato tem por objeto a prestação de serviços estéticos especializados conforme avaliação e plano de aplicação acordado.\n2. CIÊNCIA E ESCLARECIMENTOS: O(A) paciente declara ter sido devidamente orientado(a) quanto à técnica utilizada, número de sessões recomendadas, cuidados pré e pós-procedimento, bem como possíveis reações temporárias esperadas (edema, rubor ou sensibilidade local).\n3. OBRIGAÇÕES DO PACIENTE: O(A) paciente compromete-se a seguir integralmente as recomendações e cuidados domiciliares fornecidos pelo profissional, bem como retornar nas datas agendadas para reavaliação clínica.\n4. CONDIÇÕES FINANCEIRAS: Os valores acordados e formas de pagamento contratadas encontram-se discriminados no recibo do procedimento.\n5. AUTORIZAÇÃO E PRONTUÁRIO: Fica autorizada a inclusão das fotos de evolução clínica e dados de aplicação no prontuário eletrônico confidencial.');
      setInsumosVinculados([]);
      setVariacao1({
        id: 'v1',
        nome: 'Variação 1 (Básico / 1 Área / Inicial)',
        valor: 650,
        duracao_minutos: 30,
        descricao: 'Atendimento pontual ou área única',
      });
      setVariacao2({
        id: 'v2',
        nome: 'Variação 2 (Intermediário / 2 Áreas)',
        valor: 1100,
        duracao_minutos: 45,
        descricao: 'Atendimento médio com 2 regiões',
      });
      setVariacao3({
        id: 'v3',
        nome: 'Variação 3 (Completo / 3 Áreas / Premium)',
        valor: 1450,
        duracao_minutos: 60,
        descricao: 'Protocolo completo com acompanhamento',
      });
    }
  }, [procedimentoToEdit, isOpen]);

  if (!isOpen) return null;

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

    const areas = areasInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const indicacoes = indicacoesInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const variacoesFinais: VariacaoProcedimento[] = [
      {
        id: 'v1',
        nome: variacao1.nome.trim() || 'Variação 1 (Básico)',
        valor: Number(variacao1.valor) || 0,
        duracao_minutos: Number(variacao1.duracao_minutos) || 30,
        descricao: variacao1.descricao?.trim(),
      },
      {
        id: 'v2',
        nome: variacao2.nome.trim() || 'Variação 2 (Médio)',
        valor: Number(variacao2.valor) || 0,
        duracao_minutos: Number(variacao2.duracao_minutos) || 45,
        descricao: variacao2.descricao?.trim(),
      },
      {
        id: 'v3',
        nome: variacao3.nome.trim() || 'Variação 3 (Completo)',
        valor: Number(variacao3.valor) || 0,
        duracao_minutos: Number(variacao3.duracao_minutos) || 60,
        descricao: variacao3.descricao?.trim(),
      },
    ];

    onSave({
      nome: nome.trim(),
      categoria,
      duracao_minutos: Number(duracaoMinutos) || 45,
      valor_tabela: Number(valorTabela) || Number(variacao3.valor) || 0,
      valor_promocional: valorPromocional ? Number(valorPromocional) : undefined,
      variacoes: variacoesFinais,
      descricao: descricao.trim(),
      areas_aplicacao: areas.length > 0 ? areas : undefined,
      indicacoes: indicacoes.length > 0 ? indicacoes : undefined,
      cuidados_pos: cuidadosPos.trim() || undefined,
      imagem_url: imagemUrl.trim() || undefined,
      destaque_portal: destaquePortal,
      ativo,
      insumos_vinculados: insumosVinculados.length > 0 ? insumosVinculados : undefined,
      exige_contrato: exigeContrato,
      contrato_padrao: contratoPadrao.trim() || undefined,
    }, procedimentoToEdit?.id);

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {procedimentoToEdit ? 'Editar Procedimento & Tabela de Valores' : 'Cadastrar Novo Procedimento & Tabela de Variações'}
              </h2>
              <p className="text-xs text-slate-500">
                Cadastre a precificação em 3 variações e os insumos de estoque consumidos.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          
          {/* Nome e Categoria */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Nome do Procedimento *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Toxina Botulínica ou Preenchimento Labial Ácido Hialurônico"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Categoria
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

          {/* TABELA DE VALORES VARIÁVEIS EM 3 VARIAÇÕES (Destaque Principal do Prompt) */}
          <div className="bg-gradient-to-br from-indigo-50/70 via-slate-50 to-purple-50/40 p-4 rounded-xl border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                  Tabela de Valores em 3 Variações (Área / Quantidade / Complexidade)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Defina 3 opções de preços para este procedimento (ex: 1 Área / 2 Áreas / 3 Áreas ou 0.5ml / 1.0ml / 1.5ml).
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-600 text-white rounded-full uppercase tracking-wider">
                3 Variações
              </span>
            </div>

            {/* Variação 1 */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-extrabold">1</span>
                  Variação 1 (Básico / 1 Área / Padrão)
                </span>
                <span className="text-[11px] text-slate-400 font-medium">Entrada / Porte Menor</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-6">
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Título da Variação 1</label>
                  <input
                    type="text"
                    value={variacao1.nome}
                    onChange={(e) => setVariacao1({ ...variacao1, nome: e.target.value })}
                    placeholder="Ex: 1 Área (Testa ou Glabela)"
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:bg-white"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={variacao1.valor}
                    onChange={(e) => setVariacao1({ ...variacao1, valor: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-emerald-700 focus:bg-white"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Duração (min)</label>
                  <input
                    type="number"
                    min="10"
                    step="5"
                    value={variacao1.duracao_minutos || 30}
                    onChange={(e) => setVariacao1({ ...variacao1, duracao_minutos: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 focus:bg-white"
                  />
                </div>
                <div className="sm:col-span-12">
                  <input
                    type="text"
                    value={variacao1.descricao || ''}
                    onChange={(e) => setVariacao1({ ...variacao1, descricao: e.target.value })}
                    placeholder="Descrição / especificação da variação 1 (opcional)..."
                    className="w-full px-2.5 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-lg text-slate-600"
                  />
                </div>
              </div>
            </div>

            {/* Variação 2 */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-700 uppercase tracking-wide flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-extrabold">2</span>
                  Variação 2 (Intermediário / 2 Áreas / Médio)
                </span>
                <span className="text-[11px] text-slate-400 font-medium">Médio Porte</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-6">
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Título da Variação 2</label>
                  <input
                    type="text"
                    value={variacao2.nome}
                    onChange={(e) => setVariacao2({ ...variacao2, nome: e.target.value })}
                    placeholder="Ex: 2 Áreas (Testa + Glabela)"
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:bg-white"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={variacao2.valor}
                    onChange={(e) => setVariacao2({ ...variacao2, valor: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-emerald-700 focus:bg-white"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Duração (min)</label>
                  <input
                    type="number"
                    min="10"
                    step="5"
                    value={variacao2.duracao_minutos || 45}
                    onChange={(e) => setVariacao2({ ...variacao2, duracao_minutos: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 focus:bg-white"
                  />
                </div>
                <div className="sm:col-span-12">
                  <input
                    type="text"
                    value={variacao2.descricao || ''}
                    onChange={(e) => setVariacao2({ ...variacao2, descricao: e.target.value })}
                    placeholder="Descrição / especificação da variação 2 (opcional)..."
                    className="w-full px-2.5 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-lg text-slate-600"
                  />
                </div>
              </div>
            </div>

            {/* Variação 3 */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 uppercase tracking-wide flex items-center gap-1">
                  <span className="w-4 h-4 rounded-full bg-indigo-900 text-white flex items-center justify-center text-[10px] font-extrabold">3</span>
                  Variação 3 (Completo / 3 Áreas / Premium)
                </span>
                <span className="text-[11px] text-indigo-600 font-semibold">Tabela Cheia / Máximo</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-6">
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Título da Variação 3</label>
                  <input
                    type="text"
                    value={variacao3.nome}
                    onChange={(e) => {
                      setVariacao3({ ...variacao3, nome: e.target.value });
                    }}
                    placeholder="Ex: 3 Áreas Completas (Full Face)"
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:bg-white"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={variacao3.valor}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setVariacao3({ ...variacao3, valor: val });
                      setValorTabela(val);
                    }}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-emerald-700 focus:bg-white"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Duração (min)</label>
                  <input
                    type="number"
                    min="10"
                    step="5"
                    value={variacao3.duracao_minutos || 60}
                    onChange={(e) => {
                      const d = Number(e.target.value);
                      setVariacao3({ ...variacao3, duracao_minutos: d });
                      setDuracaoMinutos(d);
                    }}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-700 focus:bg-white"
                  />
                </div>
                <div className="sm:col-span-12">
                  <input
                    type="text"
                    value={variacao3.descricao || ''}
                    onChange={(e) => setVariacao3({ ...variacao3, descricao: e.target.value })}
                    placeholder="Descrição / especificação da variação 3 (opcional)..."
                    className="w-full px-2.5 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-lg text-slate-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Valores Gerais & Promoção */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                Valor Base Principal (R$) *
              </label>
              <input
                type="number"
                min="0"
                step="10"
                required
                value={valorTabela}
                onChange={(e) => setValorTabela(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Valor Promo / Pix (R$)
              </label>
              <input
                type="number"
                min="0"
                step="10"
                placeholder="Opcional"
                value={valorPromocional}
                onChange={(e) => setValorPromocional(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-emerald-700"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Duração Base (Minutos)
              </label>
              <select
                value={duracaoMinutos}
                onChange={(e) => setDuracaoMinutos(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium cursor-pointer"
              >
                <option value={20}>20 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>1 hora (60 min)</option>
                <option value={75}>1h15 (75 min)</option>
                <option value={90}>1h30 (90 min)</option>
                <option value={120}>2 horas (120 min)</option>
              </select>
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Descrição & Benefícios Clínicos *
            </label>
            <textarea
              required
              rows={2}
              placeholder="Descreva os objetivos, técnica utilizada e benefícios esperados..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Áreas de Aplicação & Indicações */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Áreas de Aplicação (separadas por vírgula)
              </label>
              <input
                type="text"
                placeholder="Ex: Testa, Glabela, Lábios, Mandíbula"
                value={areasInput}
                onChange={(e) => setAreasInput(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Indicações Clínicas (separadas por vírgula)
              </label>
              <input
                type="text"
                placeholder="Ex: Linhas de expressão, Flacidez, Perda de volume"
                value={indicacoesInput}
                onChange={(e) => setIndicacoesInput(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Cuidados Pós & Foto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Cuidados Pós-Procedimento
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Não abaixar a cabeça por 4h, evitar sol e exercícios por 24h..."
                value={cuidadosPos}
                onChange={(e) => setCuidadosPos(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                URL da Foto Ilustrativa
              </label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={imagemUrl}
                onChange={(e) => setImagemUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <p className="text-[10px] text-slate-400">Exibida no Portal do Paciente e orçamentos.</p>
            </div>
          </div>

          {/* Insumos Consumidos do Estoque (Receita Padrão) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-indigo-600" />
                  Receita de Insumos & Produtos do Estoque
                </h4>
                <p className="text-[11px] text-slate-500">
                  Ao concluir este procedimento na clínica, estes itens podem ter baixa automática no estoque.
                </p>
              </div>

              {/* Add item dropdown */}
              <div className="flex items-center gap-2">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddInsumo(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  defaultValue=""
                  className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                >
                  <option value="" disabled>+ Vincular Insumo...</option>
                  {estoqueDisponivel.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.nome_item} ({item.unidade_medida})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {insumosVinculados.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-1">
                Nenhum insumo vinculado ainda. Selecione acima para adicionar toxinas, preenchedores ou agulhas.
              </p>
            ) : (
              <div className="space-y-2">
                {insumosVinculados.map((ins) => (
                  <div key={ins.insumo_id} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-xs font-medium text-slate-800 truncate pr-2">
                      {ins.nome_item}
                    </span>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0.1"
                          step="0.5"
                          value={ins.quantidade}
                          onChange={(e) => handleUpdateInsumoQuantity(ins.insumo_id, Number(e.target.value))}
                          className="w-16 px-2 py-1 text-xs text-center border border-slate-200 rounded font-semibold bg-slate-50"
                        />
                        <span className="text-xs text-slate-500 font-medium">{ins.unidade_medida}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveInsumo(ins.insumo_id)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contrato Vinculado Obrigatório */}
          <div className="bg-gradient-to-br from-indigo-50/50 to-slate-50 p-4 rounded-xl border border-indigo-100/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  Contrato & Termo de Consentimento Vinculado
                </h4>
                <p className="text-[11px] text-slate-500">
                  Todo agendamento deste procedimento exigirá e vinculará este modelo de contrato com assinatura digital da paciente.
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={exigeContrato}
                  onChange={(e) => setExigeContrato(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <span>Exigir Contrato</span>
              </label>
            </div>

            {exigeContrato && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">Minuta do Contrato / Termo de Esclarecimento</span>
                  <button
                    type="button"
                    onClick={() => setContratoPadrao(`TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO & CONTRATO DE PRESTAÇÃO DE SERVIÇOS ESTÉTICOS\n\n1. OBJETO E TRATAMENTO: O presente contrato tem por objeto a realização do procedimento ${nome || 'estético selecionado'}, com plano de aplicação personalizado.\n2. ESCLARECIMENTOS: O(A) paciente declara ter recebido todas as explicações pertinentes sobre indicações clínicas, reações comuns (edema leve, rubor ou pequenos hematomas) e tempo de recuperação.\n3. CUIDADOS PÓS-PROCEDIMENTO: O(A) paciente assume a responsabilidade de seguir rigorosamente as orientações profissionais e retornar para a consulta de revisão.\n4. TERMO FINANCEIRO E VALORES: Os valores, formas de parcelamento e recibos emitidos integram este instrumento.\n5. AUTORIZAÇÃO DE REGISTRO CLÍNICO: Autorizo o registro fotográfico de evolução clínica para controle exclusivo em meu prontuário médico.`)}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                  >
                    Restaurar Modelo Padrão
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={contratoPadrao}
                  onChange={(e) => setContratoPadrao(e.target.value)}
                  placeholder="Insira as cláusulas e o termo de consentimento do procedimento..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                />
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>Vinculação ativa: ao agendar este procedimento, o contrato será automaticamente anexado.</span>
                </div>
              </div>
            )}
          </div>

          {/* Opções de Visibilidade */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={destaquePortal}
                onChange={(e) => setDestaquePortal(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <span className="text-xs font-medium text-slate-700">
                Disponível no <strong>Portal do Paciente</strong> para orçamentos
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={ativo}
                onChange={(e) => setAtivo(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <span className="text-xs font-medium text-slate-700">
                Procedimento Ativo para Vendas e Agendamento
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{procedimentoToEdit ? 'Salvar Alterações' : 'Cadastrar Procedimento'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
