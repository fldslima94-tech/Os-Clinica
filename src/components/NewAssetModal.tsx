import React, { useState, useEffect } from 'react';
import { 
  X, 
  Shield, 
  DollarSign, 
  Calendar, 
  MapPin, 
  User, 
  FileText, 
  CheckCircle2, 
  Sparkles,
  Layers,
  Upload
} from 'lucide-react';
import { BemAtivo, CategoriaBem, EstadoConservacaoBem, UsuarioEquipe } from '../types';

interface NewAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bemData: Omit<BemAtivo, 'id'>, idToEdit?: string) => void;
  bemToEdit?: BemAtivo | null;
  profissionais?: UsuarioEquipe[];
}

export const NewAssetModal: React.FC<NewAssetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  bemToEdit,
  profissionais = [],
}) => {
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<CategoriaBem>('equipamento');
  const [dataAquisicao, setDataAquisicao] = useState(new Date().toISOString().slice(0, 10));
  const [valorCompra, setValorCompra] = useState<number>(0);
  const [estadoConservacao, setEstadoConservacao] = useState<EstadoConservacaoBem>('excelente');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [localizacaoSala, setLocalizacaoSala] = useState('');
  const [responsavelNome, setResponsavelNome] = useState('');
  const [garantiaAte, setGarantiaAte] = useState('');
  const [notaFiscalNome, setNotaFiscalNome] = useState('');
  const [notaFiscalUrl, setNotaFiscalUrl] = useState('');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (bemToEdit) {
      setNome(bemToEdit.nome);
      setCategoria(bemToEdit.categoria);
      setDataAquisicao(bemToEdit.data_aquisicao ? bemToEdit.data_aquisicao.slice(0, 10) : new Date().toISOString().slice(0, 10));
      setValorCompra(bemToEdit.valor_compra);
      setEstadoConservacao(bemToEdit.estado_conservacao);
      setNumeroSerie(bemToEdit.numero_serie || '');
      setLocalizacaoSala(bemToEdit.localizacao_sala);
      setResponsavelNome(bemToEdit.responsavel_nome || '');
      setGarantiaAte(bemToEdit.garantia_ate ? bemToEdit.garantia_ate.slice(0, 10) : '');
      setNotaFiscalNome(bemToEdit.nota_fiscal_nome || '');
      setNotaFiscalUrl(bemToEdit.nota_fiscal_url || '');
      setObservacoes(bemToEdit.observacoes || '');
    } else {
      setNome('');
      setCategoria('equipamento');
      setDataAquisicao(new Date().toISOString().slice(0, 10));
      setValorCompra(0);
      setEstadoConservacao('excelente');
      setNumeroSerie('');
      setLocalizacaoSala('Sala 01 - Procedimentos');
      setResponsavelNome(profissionais[0]?.nome || '');
      setGarantiaAte('');
      setNotaFiscalNome('');
      setNotaFiscalUrl('');
      setObservacoes('');
    }
  }, [bemToEdit, profissionais, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !localizacaoSala.trim()) return;

    onSave(
      {
        nome: nome.trim(),
        categoria,
        data_aquisicao: dataAquisicao,
        valor_compra: Number(valorCompra),
        estado_conservacao: estadoConservacao,
        numero_serie: numeroSerie.trim() || undefined,
        localizacao_sala: localizacaoSala.trim(),
        responsavel_nome: responsavelNome.trim() || undefined,
        garantia_ate: garantiaAte ? garantiaAte : undefined,
        nota_fiscal_nome: notaFiscalNome.trim() || undefined,
        nota_fiscal_url: notaFiscalUrl.trim() || undefined,
        observacoes: observacoes.trim() || undefined,
      },
      bemToEdit ? bemToEdit.id : undefined
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden my-6 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0">
              <Shield className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {bemToEdit ? 'Editar Bem / Equipamento' : 'Novo Bem & Ativo do Studio'}
              </h3>
              <p className="text-xs text-indigo-200">
                Cadastro patrimonial para controle de garantias e manutenção
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nome do Bem / Aparelho *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Laser Lavieen 1927nm, Dermógrafo Cheyenne Pen, Maca 3 Motores"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Categoria do Bem *
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as CategoriaBem)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="laser">Laser & Alta Potência</option>
                <option value="dermografo">Dermógrafo / Micropigmentação</option>
                <option value="maca_mobiliario">Maca / Mobiliário Cirúrgico</option>
                <option value="autoclave">Autoclave & Esterilização</option>
                <option value="eletronico">Eletrônico / Computador</option>
                <option value="equipamento">Equipamento Estético Geral</option>
                <option value="outros">Outros Ativos</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estado de Conservação *
              </label>
              <select
                value={estadoConservacao}
                onChange={(e) => setEstadoConservacao(e.target.value as EstadoConservacaoBem)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="excelente">Excelente (Novo / Perfeito)</option>
                <option value="bom">Bom (Uso regular sem avarias)</option>
                <option value="regular">Regular (Desgaste estético leve)</option>
                <option value="manutencao">Em Manutenção / Calibração</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Valor de Aquisição (R$) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  R$
                </span>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={valorCompra}
                  onChange={(e) => setValorCompra(parseFloat(e.target.value) || 0)}
                  className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data de Aquisição *
              </label>
              <input
                type="date"
                required
                value={dataAquisicao}
                onChange={(e) => setDataAquisicao(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Localização / Sala no Studio *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Sala 01 - Procedimentos Avançados"
                value={localizacaoSala}
                onChange={(e) => setLocalizacaoSala(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Profissional Responsável
              </label>
              <input
                type="text"
                placeholder="Ex: Dra. Camila Vasconcelos"
                value={responsavelNome}
                onChange={(e) => setResponsavelNome(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Número de Série / Chapa
              </label>
              <input
                type="text"
                placeholder="Ex: SN-2024-88910"
                value={numeroSerie}
                onChange={(e) => setNumeroSerie(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Garantia Válida Até
              </label>
              <input
                type="date"
                value={garantiaAte}
                onChange={(e) => setGarantiaAte(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nota Fiscal / Comprovante de Compra
            </label>
            <input
              type="text"
              placeholder="Ex: NF-e 004.918 - MedLaser Brasil Distribuidora"
              value={notaFiscalNome}
              onChange={(e) => setNotaFiscalNome(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observações Técnicas & Histórico de Manutenção
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Revisão óptica anual obrigatória. Acompanha ponteira fracionada e óculos de proteção."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{bemToEdit ? 'Salvar Alterações' : 'Cadastrar Ativo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
