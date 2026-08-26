import React, { useState } from 'react';
import { 
  X, 
  Package, 
  AlertTriangle, 
  Layers, 
  Tag,
  Calendar,
  Link as LinkIcon,
  Plus,
  Trash2,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { EstoqueInsumo, UnidadeMedida, ProcedimentoClinico, VinculoProcedimentoInsumo } from '../types';

interface NewInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveInventory: (novoInsumo: Partial<EstoqueInsumo>) => void;
  procedimentosDisponiveis?: ProcedimentoClinico[];
}

export const NewInventoryModal: React.FC<NewInventoryModalProps> = ({
  isOpen,
  onClose,
  onSaveInventory,
  procedimentosDisponiveis = [],
}) => {
  const [nomeItem, setNomeItem] = useState('');
  const [quantidade, setQuantidade] = useState<number>(10);
  const [unidadeMedida, setUnidadeMedida] = useState<UnidadeMedida>('unidade');
  const [alertaMinimo, setAlertaMinimo] = useState<number>(5);
  const [categoria, setCategoria] = useState('Injetáveis');
  const [marca, setMarca] = useState('');
  const [corTonalidade, setCorTonalidade] = useState('');
  const [lote, setLote] = useState('');
  const [validade, setValidade] = useState<string>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [custoUnitario, setCustoUnitario] = useState<number>(150);

  // Vínculo com Procedimento Cadastrado & Consumo por Procedimento
  const [procedimentoVinculadoId, setProcedimentoVinculadoId] = useState<string>('');
  const [quantidadePorProcedimento, setQuantidadePorProcedimento] = useState<number>(1);

  // Vínculos múltiplos adicionais
  const [vinculosExtras, setVinculosExtras] = useState<VinculoProcedimentoInsumo[]>([]);

  if (!isOpen) return null;

  const handleAddVinculoExtra = (procId: string) => {
    if (!procId) return;
    const proc = procedimentosDisponiveis.find(p => p.id === procId);
    if (!proc) return;
    if (vinculosExtras.some(v => v.procedimento_id === procId) || procId === procedimentoVinculadoId) return;

    setVinculosExtras([
      ...vinculosExtras,
      {
        procedimento_id: proc.id,
        procedimento_nome: proc.nome,
        quantidade_por_procedimento: 1,
        unidade_medida: unidadeMedida,
      }
    ]);
  };

  const handleRemoveVinculoExtra = (procId: string) => {
    setVinculosExtras(vinculosExtras.filter(v => v.procedimento_id !== procId));
  };

  const handleUpdateExtraQtd = (procId: string, qtd: number) => {
    setVinculosExtras(
      vinculosExtras.map(v => v.procedimento_id === procId ? { ...v, quantidade_por_procedimento: Math.max(0.1, qtd) } : v)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeItem.trim()) return;

    const procPrincipal = procedimentosDisponiveis.find(p => p.id === procedimentoVinculadoId);

    const todosVinculos: VinculoProcedimentoInsumo[] = [];
    if (procPrincipal) {
      todosVinculos.push({
        procedimento_id: procPrincipal.id,
        procedimento_nome: procPrincipal.nome,
        quantidade_por_procedimento: Number(quantidadePorProcedimento) || 1,
        unidade_medida: unidadeMedida,
      });
    }
    vinculosExtras.forEach(v => {
      if (!todosVinculos.some(tv => tv.procedimento_id === v.procedimento_id)) {
        todosVinculos.push({
          ...v,
          unidade_medida: unidadeMedida,
        });
      }
    });

    onSaveInventory({
      nome_item: nomeItem.trim(),
      quantidade: Number(quantidade) || 0,
      unidade_medida: unidadeMedida,
      alerta_minimo: Number(alertaMinimo) || 5,
      categoria: categoria.trim() || undefined,
      marca: marca.trim() || undefined,
      cor_tonalidade: corTonalidade.trim() || undefined,
      lote: lote.trim() || undefined,
      validade: validade || undefined,
      custo_unitario: Number(custoUnitario) || undefined,
      procedimento_vinculado_id: procPrincipal?.id,
      procedimento_vinculado_nome: procPrincipal?.nome,
      quantidade_por_procedimento: procPrincipal ? (Number(quantidadePorProcedimento) || 1) : undefined,
      procedimentos_vinculados: todosVinculos.length > 0 ? todosVinculos : undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Cadastrar Insumo & Vincular ao Procedimento
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Controle de validade, lotes e consumo automático por procedimento
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm max-h-[80vh] overflow-y-auto">
          
          {/* Nome do Item */}
          <div>
            <label className="font-bold text-slate-700 block mb-1.5 uppercase text-[11px] tracking-wide">
              Nome do Item / Produto do Estoque *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Toxina Botulínica 100U, Ácido Hialurônico Reticulado 1ml, Cânula 22G"
              value={nomeItem}
              onChange={(e) => setNomeItem(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
            />
          </div>

          {/* Categoria e Lote */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1.5 flex items-center gap-1 uppercase text-[11px] tracking-wide">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                Categoria
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
              >
                <option value="Pigmento">Pigmento</option>
                <option value="Descartáveis">Descartáveis</option>
                <option value="Cosméticos">Cosméticos</option>
                <option value="Agulhas">Agulhas & Lâminas</option>
                <option value="Injetáveis">Injetáveis</option>
                <option value="Preenchedores">Preenchedores</option>
                <option value="Bioestimuladores">Bioestimuladores</option>
                <option value="Tópicos & Anestésicos">Tópicos & Anestésicos</option>
                <option value="Diluentes">Diluentes</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5 uppercase text-[11px] tracking-wide">
                Lote de Fabricação
              </label>
              <input
                type="text"
                placeholder="Ex: BTX-2026-098 ou PIG-904"
                value={lote}
                onChange={(e) => setLote(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Marca e Cor / Tonalidade (Especialmente para Pigmentos e Cosméticos) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="font-bold text-slate-700 block mb-1 uppercase text-[11px] tracking-wide">
                Marca / Fabricante
              </label>
              <input
                type="text"
                placeholder="Ex: Iron Works, RB Kollors, Rennova, Allergan"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1 uppercase text-[11px] tracking-wide">
                Cor / Tonalidade {categoria === 'Pigmento' && <span className="text-amber-600 font-bold">*</span>}
              </label>
              <input
                type="text"
                placeholder="Ex: Castanho Escuro, Chocolate, Red Rose, Natural"
                value={corTonalidade}
                onChange={(e) => setCorTonalidade(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-xs"
              />
            </div>
          </div>

          {/* DATA DE VALIDADE & CUSTO UNITÁRIO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-amber-50/40 p-3.5 rounded-xl border border-amber-200/80">
            <div>
              <label className="font-bold text-amber-950 block mb-1 flex items-center gap-1.5 uppercase text-[11px] tracking-wide">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                Data de Validade *
              </label>
              <input
                type="date"
                required
                value={validade}
                onChange={(e) => setValidade(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-semibold"
              />
              <p className="text-[10px] text-amber-700 mt-1 font-medium">Controle de vencimento para biossegurança</p>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1.5 uppercase text-[11px] tracking-wide">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                Custo Unitário (R$)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={custoUnitario}
                onChange={(e) => setCustoUnitario(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-emerald-800 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">Custo por {unidadeMedida}</p>
            </div>
          </div>

          {/* Quantidade, Unidade & Alerta Mínimo */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wide">
                Qtd em Estoque *
              </label>
              <input
                type="number"
                min="0"
                required
                value={quantidade}
                onChange={(e) => setQuantidade(parseInt(e.target.value) || 0)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wide">
                Unidade *
              </label>
              <select
                value={unidadeMedida}
                onChange={(e) => setUnidadeMedida(e.target.value as UnidadeMedida)}
                className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer text-xs"
              >
                <option value="unidade">Unidade (frasco)</option>
                <option value="seringa">Seringa</option>
                <option value="ml">ml</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1 uppercase text-[10px] tracking-wide">
                <AlertTriangle className="w-3 h-3 text-amber-500" />
                Alerta Mín. *
              </label>
              <input
                type="number"
                min="1"
                required
                value={alertaMinimo}
                onChange={(e) => setAlertaMinimo(parseInt(e.target.value) || 1)}
                className="w-full px-2.5 py-2 bg-amber-50/50 border border-amber-200/80 rounded-lg text-amber-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
              />
            </div>
          </div>

          {/* VÍNCULO COM PROCEDIMENTO CADASTRADO & QUANTIDADE POR PROCEDIMENTO */}
          <div className="bg-gradient-to-br from-indigo-50/60 to-purple-50/40 p-4 rounded-xl border border-indigo-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-indigo-600" />
                  Vínculo com Procedimento & Consumo por Sessão
                </h4>
                <p className="text-[11px] text-slate-500">
                  Indique qual procedimento consome este insumo e a quantidade gasta por atendimento.
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-600 text-white rounded-full uppercase tracking-wider">
                Baixa Automática
              </span>
            </div>

            {/* Procedimento Principal */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <div className="sm:col-span-8">
                <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                  Procedimento Vinculado
                </label>
                <select
                  value={procedimentoVinculadoId}
                  onChange={(e) => setProcedimentoVinculadoId(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:bg-white cursor-pointer"
                >
                  <option value="">-- Selecionar Procedimento da Clínica --</option>
                  {procedimentosDisponiveis.map(proc => (
                    <option key={proc.id} value={proc.id}>
                      {proc.nome} ({proc.categoria})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-4">
                <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                  Qtd por Procedimento
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0.1"
                    step="0.5"
                    value={quantidadePorProcedimento}
                    onChange={(e) => setQuantidadePorProcedimento(Number(e.target.value))}
                    disabled={!procedimentoVinculadoId}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-indigo-700 disabled:opacity-50"
                  />
                  <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap">{unidadeMedida}</span>
                </div>
              </div>
            </div>

            {/* Vínculos Extras */}
            {vinculosExtras.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase block">
                  Outros Procedimentos Vinculados:
                </label>
                {vinculosExtras.map((ve) => (
                  <div key={ve.procedimento_id} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200 text-xs">
                    <span className="font-medium text-slate-800 truncate pr-2">{ve.procedimento_nome}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="number"
                        min="0.1"
                        step="0.5"
                        value={ve.quantidade_por_procedimento}
                        onChange={(e) => handleUpdateExtraQtd(ve.procedimento_id, Number(e.target.value))}
                        className="w-16 px-1.5 py-0.5 text-xs text-center border border-slate-200 rounded font-bold text-indigo-700"
                      />
                      <span className="text-[11px] text-slate-500">{unidadeMedida}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveVinculoExtra(ve.procedimento_id)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Extra Link */}
            <div className="flex items-center gap-2 pt-1">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddVinculoExtra(e.target.value);
                    e.target.value = '';
                  }
                }}
                defaultValue=""
                className="px-2.5 py-1 text-[11px] bg-white border border-dashed border-indigo-300 rounded-lg text-indigo-700 font-medium cursor-pointer hover:bg-indigo-50/50"
              >
                <option value="" disabled>+ Vincular a mais um procedimento...</option>
                {procedimentosDisponiveis
                  .filter(p => p.id !== procedimentoVinculadoId && !vinculosExtras.some(ve => ve.procedimento_id === p.id))
                  .map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
              </select>
            </div>

          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-lg font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Package className="w-4 h-4" />
              <span>Salvar Insumo no Estoque</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

