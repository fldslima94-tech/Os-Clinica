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
  Image as ImageIcon
} from 'lucide-react';
import { ProcedimentoClinico, EstoqueInsumo, UnidadeMedida } from '../types';

interface ProcedureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (procedimento: Omit<ProcedimentoClinico, 'id'>, idToEdit?: string) => void;
  procedimentoToEdit?: ProcedimentoClinico | null;
  estoqueDisponivel: EstoqueInsumo[];
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
  estoqueDisponivel,
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
      setInsumosVinculados(procedimentoToEdit.insumos_vinculados || []);
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

    const areas = areasInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const indicacoes = indicacoesInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    onSave({
      nome: nome.trim(),
      categoria,
      duracao_minutos: Number(duracaoMinutos) || 45,
      valor_tabela: Number(valorTabela) || 0,
      valor_promocional: valorPromocional ? Number(valorPromocional) : undefined,
      descricao: descricao.trim(),
      areas_aplicacao: areas.length > 0 ? areas : undefined,
      indicacoes: indicacoes.length > 0 ? indicacoes : undefined,
      cuidados_pos: cuidadosPos.trim() || undefined,
      imagem_url: imagemUrl.trim() || undefined,
      destaque_portal: destaquePortal,
      ativo,
      insumos_vinculados: insumosVinculados.length > 0 ? insumosVinculados : undefined,
    }, procedimentoToEdit?.id);

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {procedimentoToEdit ? 'Editar Procedimento Ofertado' : 'Cadastrar Novo Procedimento da Clínica'}
              </h2>
              <p className="text-xs text-slate-500">
                Tudo o que a clínica oferta para agendamentos e orçamentos do paciente.
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Nome e Categoria */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Nome do Procedimento *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Toxina Botulínica (3 Áreas) ou Preenchimento Labial 1ml"
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

          {/* Valores e Tempo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
            <div className="space-y-1">
              <label className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                Valor de Tabela (R$) *
              </label>
              <input
                type="number"
                min="0"
                step="10"
                required
                value={valorTabela}
                onChange={(e) => setValorTabela(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-white border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-slate-900"
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
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold text-emerald-700"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Duração Estimada
              </label>
              <select
                value={duracaoMinutos}
                onChange={(e) => setDuracaoMinutos(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium cursor-pointer"
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
              Descrição & Benefícios para o Paciente *
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
                Procedimento Ativo para Vendas
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
