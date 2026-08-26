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
  Image as ImageIcon,
  Check,
  FileText
} from 'lucide-react';
import { ProcedimentoClinico, EstoqueInsumo, UnidadeMedida } from '../types';

interface ProcedureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (procedimento: Partial<ProcedimentoClinico>, idToEdit?: string) => void;
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
  const [diasRetorno, setDiasRetorno] = useState(15);
  const [valorTabela, setValorTabela] = useState<number | string>(1200);
  const [valorPromocional, setValorPromocional] = useState<string>('');
  const [descricao, setDescricao] = useState('');
  const [areasInput, setAreasInput] = useState('');
  const [indicacoesInput, setIndicacoesInput] = useState('');
  const [contraindicacoesInput, setContraindicacoesInput] = useState('');
  const [cuidadosPos, setCuidadosPos] = useState('');
  const [imagemUrl, setImagemUrl] = useState('');
  const [destaquePortal, setDestaquePortal] = useState(true);
  const [ativo, setAtivo] = useState(true);
  const [exigeContrato, setExigeContrato] = useState(true);
  const [contratoPadrao, setContratoPadrao] = useState('');

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
      setImagemUrl(procedimentoToEdit.imagem_url || '');
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
      setValorTabela(1200);
      setValorPromocional('');
      setDescricao('');
      setAreasInput('');
      setIndicacoesInput('');
      setContraindicacoesInput('');
      setCuidadosPos('');
      setImagemUrl('');
      setDestaquePortal(true);
      setAtivo(true);
      setExigeContrato(true);
      setContratoPadrao('TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO & CONTRATO DE PRESTAÇÃO DE SERVIÇOS ESTÉTICOS\n\n1. OBJETO E TRATAMENTO: O presente contrato tem por objeto a prestação de serviços estéticos especializados conforme avaliação e plano de aplicação acordado.\n2. CIÊNCIA E ESCLARECIMENTOS: O(A) paciente declara ter sido devidamente orientado(a) quanto à técnica utilizada, número de sessões recomendadas, cuidados pré e pós-procedimento, bem como possíveis reações temporárias esperadas (edema, rubor ou sensibilidade local).\n3. OBRIGAÇÕES DO PACIENTE: O(A) paciente compromete-se a seguir integralmente as recomendações e cuidados domiciliares fornecidos pelo profissional, bem como retornar nas datas agendadas para reavaliação clínica.\n4. CONDIÇÕES FINANCEIRAS: Os valores acordados e formas de pagamento contratadas encontram-se discriminados no recibo do procedimento.\n5. AUTORIZAÇÃO E PRONTUÁRIO: Fica autorizada a inclusão das fotos de evolução clínica e dados de aplicação no prontuário eletrônico confidencial.');
      setInsumosVinculados([]);
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

    const numValor = Number(valorTabela) || 0;

    const areas = areasInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const indicacoes = indicacoesInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

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
      imagem_url: imagemUrl.trim() || undefined,
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
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {procedimentoToEdit ? 'Editar Procedimento' : 'Cadastrar Novo Procedimento'}
              </h2>
              <p className="text-xs text-slate-500">
                Defina o preço único, duração, descrição e insumos consumidos.
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
                placeholder="Ex: Toxina Botulínica (Botox) ou Preenchimento Labial"
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
                    placeholder="1200.00"
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
                    placeholder="Ex: 990.00"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
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

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">
                  URL da Imagem / Foto (Opcional)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={imagemUrl}
                  onChange={(e) => setImagemUrl(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg font-medium"
                />
              </div>
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
                  placeholder="Ex: Glabela, Testa, Pés de Galinha"
                  value={areasInput}
                  onChange={(e) => setAreasInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Indicações Clínicas (separadas por vírgula)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Rugas dinâmicas, Linhas de expressão"
                  value={indicacoesInput}
                  onChange={(e) => setIndicacoesInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Cuidados Pós-Procedimento / Orientações ao Paciente
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Não deitar por 4 horas, evitar exercícios físicos intensos por 24h, aplicar protetor solar..."
                value={cuidadosPos}
                onChange={(e) => setCuidadosPos(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-medium resize-none"
              />
            </div>
          </div>

          {/* Insumos de Estoque Vinculados (Receita Padrão) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-indigo-600" />
                  Insumos Vinculados (Débito Automático de Estoque)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Os itens listados abaixo serão sugeridos para baixa automática de estoque ao concluir o atendimento.
                </p>
              </div>
            </div>

            {/* Adicionar Insumo */}
            {estoqueDisponivel.length > 0 && (
              <div className="flex gap-2">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddInsumo(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  defaultValue=""
                  className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg font-medium cursor-pointer"
                >
                  <option value="" disabled>+ Selecionar insumo do estoque...</option>
                  {estoqueDisponivel
                    .filter(item => !insumosVinculados.some(iv => iv.insumo_id === item.id))
                    .map(item => (
                      <option key={item.id} value={item.id}>
                        {item.nome_item} (Disponível: {item.quantidade} {item.unidade_medida})
                      </option>
                    ))}
                </select>
              </div>
            )}

            {/* Lista de Insumos Vinculados */}
            {insumosVinculados.length > 0 ? (
              <div className="space-y-2">
                {insumosVinculados.map((insumo) => (
                  <div 
                    key={insumo.insumo_id}
                    className="flex items-center justify-between gap-3 p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs"
                  >
                    <span className="text-xs font-bold text-slate-800 flex-1 truncate">
                      {insumo.nome_item}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500">Qtd por sessão:</span>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={insumo.quantidade}
                        onChange={(e) => handleUpdateInsumoQuantity(insumo.insumo_id, parseFloat(e.target.value) || 1)}
                        className="w-16 px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded font-mono font-bold text-center"
                      />
                      <span className="text-xs font-semibold text-slate-600 min-w-[36px]">
                        {insumo.unidade_medida}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveInsumo(insumo.insumo_id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-1 text-center bg-white rounded-lg border border-dashed border-slate-200">
                Nenhum insumo vinculado a este procedimento ainda.
              </p>
            )}
          </div>

          {/* Termo e Contrato Padrão */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider cursor-pointer">
                <input
                  type="checkbox"
                  checked={exigeContrato}
                  onChange={(e) => setExigeContrato(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Exigir Termo de Consentimento / Contrato Assinado</span>
              </label>
            </div>

            {exigeContrato && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Minuta do Contrato / Termo de Esclarecimento:
                </label>
                <textarea
                  rows={4}
                  value={contratoPadrao}
                  onChange={(e) => setContratoPadrao(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono leading-relaxed"
                  placeholder="Texto do termo de consentimento..."
                />
              </div>
            )}
          </div>

          {/* Opções e Visibilidade */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Procedimento Ativo no Catálogo</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={destaquePortal}
                  onChange={(e) => setDestaquePortal(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Exibir no Portal do Paciente / Agendamento Online</span>
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{procedimentoToEdit ? 'Salvar Alterações' : 'Cadastrar Procedimento'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
