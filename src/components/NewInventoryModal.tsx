import React, { useState, useEffect } from 'react';
import { 
  X, 
  Package, 
  AlertTriangle, 
  Tag,
  Calendar,
  Layers,
  Sparkles,
  Palette,
  Check,
  Pipette
} from 'lucide-react';
import { EstoqueInsumo, UnidadeMedida, ProcedimentoClinico } from '../types';
import { CurrencyInput } from './CurrencyInput';

// Cores e tons de pigmentos comuns em micropigmentação e estética
const PRESET_PIGMENT_COLORS = [
  // Sobrancelhas e Olhos
  { nome: 'Castanho Claro', hex: '#8D6E63', grupo: 'Sobrancelhas' },
  { nome: 'Castanho Médio', hex: '#5D4037', grupo: 'Sobrancelhas' },
  { nome: 'Castanho Escuro', hex: '#3E2723', grupo: 'Sobrancelhas' },
  { nome: 'Castanho Russo', hex: '#4E3629', grupo: 'Sobrancelhas' },
  { nome: 'Loiro Dourado', hex: '#C5A059', grupo: 'Sobrancelhas' },
  { nome: 'Preto Total', hex: '#1C1917', grupo: 'Sobrancelhas' },

  // Lábios
  { nome: 'Vermelho Ruby', hex: '#B91C1C', grupo: 'Lábios' },
  { nome: 'Pitanga Red', hex: '#DC2626', grupo: 'Lábios' },
  { nome: 'Nude Rosé', hex: '#D78B7D', grupo: 'Lábios' },
  { nome: 'Coral Suave', hex: '#EA580C', grupo: 'Lábios' },
  { nome: 'Terracota', hex: '#9A3412', grupo: 'Lábios' },
  { nome: 'Malva Real', hex: '#86198F', grupo: 'Lábios' },

  // Modificadores & Corretores
  { nome: 'Mostarda (Clareador)', hex: '#EAB308', grupo: 'Corretores' },
  { nome: 'Laranja (Aquecedor)', hex: '#F97316', grupo: 'Corretores' },
  { nome: 'Oliva (Neutralizador)', hex: '#65A30D', grupo: 'Corretores' },
];

interface NewInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (novoInsumo: Partial<EstoqueInsumo>) => void;
  onSaveInventory?: (novoInsumo: Partial<EstoqueInsumo>) => void;
  procedimentos?: ProcedimentoClinico[];
  procedimentosDisponiveis?: ProcedimentoClinico[];
  itemToEdit?: EstoqueInsumo | null;
}

export const NewInventoryModal: React.FC<NewInventoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onSaveInventory,
  itemToEdit,
}) => {
  const [nomeItem, setNomeItem] = useState('');
  const [quantidade, setQuantidade] = useState<number>(10);
  const [unidadeMedida, setUnidadeMedida] = useState<UnidadeMedida>('unidade');
  const [alertaMinimo, setAlertaMinimo] = useState<number>(5);
  const [categoria, setCategoria] = useState('Injetáveis');
  const [marca, setMarca] = useState('');
  const [corTonalidade, setCorTonalidade] = useState('');
  const [corHex, setCorHex] = useState('#3E2723');
  const [lote, setLote] = useState('');
  const [validade, setValidade] = useState<string>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [custoUnitario, setCustoUnitario] = useState<number>(150);
  const [formError, setFormError] = useState('');

  const isPigmento = 
    categoria.toLowerCase().includes('pigmento') || 
    categoria.toLowerCase().includes('piguimento');

  useEffect(() => {
    if (isOpen) {
      if (itemToEdit) {
        setNomeItem(itemToEdit.nome_item || '');
        setQuantidade(itemToEdit.quantidade ?? 0);
        setUnidadeMedida(itemToEdit.unidade_medida || 'unidade');
        setAlertaMinimo(itemToEdit.alerta_minimo ?? 5);
        setCategoria(itemToEdit.categoria === 'Piguimento' ? 'Pigmento' : (itemToEdit.categoria || 'Injetáveis'));
        setMarca(itemToEdit.marca || '');
        const isEditPigment = (itemToEdit.categoria || '').toLowerCase().includes('pigment') || (itemToEdit.categoria || '').toLowerCase().includes('piguim');
        setCorTonalidade(isEditPigment ? (itemToEdit.cor || itemToEdit.cor_tonalidade || itemToEdit.tom_cor || '') : '');
        setCorHex(itemToEdit.cor_hex || '#3E2723');
        setLote(itemToEdit.lote || '');
        setValidade(itemToEdit.validade || '');
        setCustoUnitario(itemToEdit.custo_unitario ?? 0);
        setFormError('');
      } else {
        setNomeItem('');
        setQuantidade(10);
        setUnidadeMedida('unidade');
        setAlertaMinimo(5);
        setCategoria('Injetáveis');
        setMarca('');
        setCorTonalidade('');
        setCorHex('#3E2723');
        setLote('');
        const d = new Date();
        d.setFullYear(d.getFullYear() + 1);
        setValidade(d.toISOString().slice(0, 10));
        setCustoUnitario(150);
        setFormError('');
      }
    }
  }, [isOpen, itemToEdit]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!nomeItem.trim()) {
      setFormError('Por favor, informe o nome do item / insumo.');
      return;
    }

    const saveFn = onSave || onSaveInventory;
    if (!saveFn) {
      console.error('Nenhuma função onSave/onSaveInventory repassada.');
      return;
    }

    const catFinal = categoria.trim() === 'Piguimento' ? 'Pigmento' : (categoria.trim() || 'Geral');
    const isPigmentoFinal = catFinal.toLowerCase().includes('pigment') || catFinal.toLowerCase().includes('piguim');

    // Salva o insumo independente de procedimento (cor somente para o que for pigmento)
    saveFn({
      ...(itemToEdit ? { id: itemToEdit.id } : {}),
      nome_item: nomeItem.trim(),
      quantidade: Number(quantidade) || 0,
      unidade_medida: unidadeMedida,
      alerta_minimo: Number(alertaMinimo) || 5,
      categoria: catFinal,
      marca: marca.trim() || undefined,
      cor: isPigmentoFinal ? (corTonalidade.trim() || undefined) : undefined,
      cor_tonalidade: isPigmentoFinal ? (corTonalidade.trim() || undefined) : undefined,
      tom_cor: isPigmentoFinal ? (corTonalidade.trim() || undefined) : undefined,
      cor_hex: isPigmentoFinal && corTonalidade.trim() ? corHex : undefined,
      lote: lote.trim() || undefined,
      validade: validade || undefined,
      custo_unitario: Number(custoUnitario) || 0,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl w-full max-w-xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {itemToEdit ? 'Editar Dados do Insumo' : 'Cadastrar Insumo & Item de Estoque'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {itemToEdit ? 'Atualize as informações do item, saldo, lote e custo' : 'Controle de saldo, lotes, validade e custo unitário'}
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

        {/* Error Alert */}
        {formError && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-700 text-xs font-semibold animate-in fade-in">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{formError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm max-h-[80vh] overflow-y-auto">
          
          {/* Nome do Item */}
          <div>
            <label className="font-bold text-slate-700 block mb-1.5 uppercase text-[11px] tracking-wide">
              Nome do Item / Insumo *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Toxina Botulínica 100U, Ácido Hialurônico Reticulado 1ml, Luvas Cirúrgicas"
              value={nomeItem}
              onChange={(e) => setNomeItem(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-medium"
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
                onChange={(e) => {
                  const newCat = e.target.value;
                  setCategoria(newCat);
                  const isNewCatPigmento = newCat.toLowerCase().includes('pigment');
                  if (!isNewCatPigmento) {
                    setCorTonalidade('');
                  }
                }}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer font-medium"
              >
                <option value="Agulhas">Agulhas & Lâminas</option>
                <option value="Bioestimuladores">Bioestimuladores</option>
                <option value="Cosméticos">Cosméticos</option>
                <option value="Descartáveis">Descartáveis</option>
                <option value="Diluentes">Diluentes</option>
                <option value="Geral">Geral</option>
                <option value="Injetáveis">Injetáveis</option>
                <option value="Outros">Outros</option>
                <option value="Pigmento">Pigmento (Micropigmentação)</option>
                <option value="Preenchedores">Preenchedores</option>
                <option value="Tópicos & Anestésicos">Tópicos & Anestésicos</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1.5 uppercase text-[11px] tracking-wide">
                Lote de Fabricação
              </label>
              <input
                type="text"
                placeholder="Ex: BTX-2026-098 ou LOT-441"
                value={lote}
                onChange={(e) => setLote(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>
          </div>

          {/* SEÇÃO ESPECIAL: OPÇÃO DE COR EXCLUSIVA PARA CATEGORIA PIGMENTO */}
          {isPigmento ? (
            <div className="bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-amber-50/80 border-2 border-amber-300 rounded-2xl p-4 shadow-xs space-y-3.5 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs shrink-0">
                    <Palette className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-amber-950 text-xs sm:text-sm flex items-center gap-1.5">
                      <span>Opção de Cor do Pigmento</span>
                      <span className="text-[10px] bg-amber-200/90 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                        Pigmento / Micropigmentação
                      </span>
                    </h4>
                    <p className="text-[11px] text-amber-800 font-medium">
                      Selecione uma tonalidade na paleta rápida ou use o seletor visual com nome personalizado.
                    </p>
                  </div>
                </div>

                {/* Amostra Visual em Tempo Real */}
                <div className="flex items-center gap-2 bg-white/95 px-3 py-1.5 rounded-xl border border-amber-300 shadow-xs self-start sm:self-auto shrink-0">
                  <span 
                    className="w-5 h-5 rounded-full border border-black/20 shadow-inner shrink-0" 
                    style={{ backgroundColor: corHex }}
                    title={`Cor selecionada: ${corHex}`}
                  />
                  <div className="text-left">
                    <div className="text-[11px] font-bold text-slate-800 max-w-[130px] truncate leading-tight">
                      {corTonalidade || 'Selecione a Cor'}
                    </div>
                    <div className="text-[9px] font-mono text-slate-400 uppercase leading-none">
                      {corHex}
                    </div>
                  </div>
                </div>
              </div>

              {/* Seletor Visual + Input de Nome da Cor */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-white p-3.5 rounded-xl border border-amber-200">
                {/* Seletor Hexadecimal / Color Picker */}
                <div className="sm:col-span-4 flex items-center gap-2.5">
                  <label className="text-[11px] font-bold text-slate-700 uppercase shrink-0">
                    Seletor Visual:
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="color"
                      value={corHex}
                      onChange={(e) => setCorHex(e.target.value)}
                      className="w-9 h-9 p-0.5 rounded-lg border border-slate-300 cursor-pointer bg-white shadow-xs hover:scale-105 transition-transform"
                      title="Clique para abrir a paleta de cores completa"
                    />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                    {corHex}
                  </span>
                </div>

                {/* Nome da Cor / Tonalidade */}
                <div className="sm:col-span-8">
                  <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wide">
                    Nome da Cor / Tonalidade do Pigmento *
                  </label>
                  <input
                    type="text"
                    required={isPigmento}
                    placeholder="Ex: Castanho Escuro, Velvet Red, Natural Brown, Pitanga..."
                    value={corTonalidade}
                    onChange={(e) => setCorTonalidade(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Paleta Rápida de Tons Populares */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">
                  Tons Frequentes de Micropigmentação (clique para preencher):
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {PRESET_PIGMENT_COLORS.map((preset) => {
                    const isSelected = 
                      (corTonalidade && corTonalidade.toLowerCase() === preset.nome.toLowerCase()) || 
                      (corHex && corHex.toLowerCase() === preset.hex.toLowerCase());
                    return (
                      <button
                        key={preset.nome}
                        type="button"
                        onClick={() => {
                          setCorTonalidade(preset.nome);
                          setCorHex(preset.hex);
                        }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border shadow-2xs ${
                          isSelected
                            ? 'bg-amber-900 text-white border-amber-900 ring-2 ring-amber-400 shadow-xs'
                            : 'bg-white hover:bg-amber-100/70 text-slate-800 border-amber-200/90 hover:border-amber-300'
                        }`}
                      >
                        <span 
                          className="w-3 h-3 rounded-full border border-black/20 shrink-0 shadow-2xs" 
                          style={{ backgroundColor: preset.hex }} 
                        />
                        <span>{preset.nome}</span>
                        {isSelected && <Check className="w-3 h-3 text-amber-300 ml-0.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Marca / Fabricante do Pigmento */}
              <div className="pt-2 border-t border-amber-200/60">
                <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wide">
                  Marca / Fabricante do Pigmento
                </label>
                <input
                  type="text"
                  placeholder="Ex: Iron Works, RB Kollors, Mag Color, Nuance, Electric Ink"
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-xs"
                />
              </div>
            </div>
          ) : (
            /* Apenas Marca / Fabricante para outras categorias (sem campo de cor) */
            <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200">
              <label className="font-bold text-slate-700 block mb-1 uppercase text-[11px] tracking-wide">
                Marca / Fabricante
              </label>
              <input
                type="text"
                placeholder="Ex: Allergan, Galderma, Rennova, Descarpack, BD"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-xs font-medium"
              />
            </div>
          )}

          {/* DATA DE VALIDADE & CUSTO UNITÁRIO (CurrencyInput) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-amber-50/40 p-3.5 rounded-xl border border-amber-200/80 items-end">
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
                className="w-full px-3 py-2.5 bg-white border border-amber-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-semibold"
              />
              <p className="text-[10px] text-amber-700 mt-1 font-medium">Controle de vencimento para biossegurança</p>
            </div>

            <div>
              <CurrencyInput
                label="Custo Unitário"
                value={custoUnitario}
                onChange={(val) => setCustoUnitario(val)}
                placeholder="0,00"
              />
              <p className="text-[10px] text-slate-500 mt-1">Custo por {unidadeMedida}</p>
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
                step="0.01"
                min="0"
                required
                value={quantidade}
                onChange={(e) => {
                  const raw = e.target.value.replace(',', '.');
                  setQuantidade(parseFloat(raw) || 0);
                }}
                className="w-full px-2.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1 uppercase text-[10px] tracking-wide">
                Unidade *
              </label>
              <select
                value={unidadeMedida}
                onChange={(e) => setUnidadeMedida(e.target.value as UnidadeMedida)}
                className="w-full px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer text-xs"
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
                step="0.01"
                min="0"
                required
                value={alertaMinimo}
                onChange={(e) => {
                  const raw = e.target.value.replace(',', '.');
                  setAlertaMinimo(parseFloat(raw) || 1);
                }}
                className="w-full px-2.5 py-2.5 bg-amber-50/50 border border-amber-200/80 rounded-xl text-amber-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Package className="w-4 h-4" />
              <span>{itemToEdit ? 'Salvar Alterações do Insumo' : 'Salvar Insumo no Estoque'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
