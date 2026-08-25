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
  Upload,
  Wrench,
  AlertTriangle,
  Clock,
  Building2
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

  // 6.1 Manutenção Preventiva
  const [requerManutencao, setRequerManutencao] = useState(false);
  const [periodicidadeDias, setPeriodicidadeDias] = useState<number>(90);
  const [dataUltimaManutencao, setDataUltimaManutencao] = useState('');
  const [dataProximaManutencao, setDataProximaManutencao] = useState('');
  const [empresaTecnica, setEmpresaTecnica] = useState('');
  const [statusManutencao, setStatusManutencao] = useState<'em_dia' | 'alerta_proximo' | 'vencida' | 'em_manutencao'>('em_dia');

  // Recalcular data da próxima manutenção ao alterar última manutenção ou periodicidade
  const calcularProximaData = (dataUltima: string, dias: number) => {
    if (!dataUltima) return '';
    try {
      const d = new Date(dataUltima);
      d.setDate(d.getDate() + dias);
      return d.toISOString().slice(0, 10);
    } catch {
      return '';
    }
  };

  const handleDataUltimaChange = (val: string) => {
    setDataUltimaManutencao(val);
    if (val && periodicidadeDias > 0) {
      setDataProximaManutencao(calcularProximaData(val, periodicidadeDias));
    }
  };

  const handlePeriodicidadeChange = (dias: number) => {
    setPeriodicidadeDias(dias);
    if (dataUltimaManutencao && dias > 0) {
      setDataProximaManutencao(calcularProximaData(dataUltimaManutencao, dias));
    }
  };

  useEffect(() => {
    if (bemToEdit) {
      setNome(bemToEdit.nome || bemToEdit.nomeBem || '');
      setCategoria(bemToEdit.categoria);
      setDataAquisicao(bemToEdit.data_aquisicao ? bemToEdit.data_aquisicao.slice(0, 10) : new Date().toISOString().slice(0, 10));
      setValorCompra(bemToEdit.valor_compra ?? bemToEdit.valorCompra ?? 0);
      setEstadoConservacao(bemToEdit.estado_conservacao || bemToEdit.estadoConservacao || 'excelente');
      setNumeroSerie(bemToEdit.numero_serie || bemToEdit.numeroSerie || '');
      setLocalizacaoSala(bemToEdit.localizacao_sala || bemToEdit.localizacaoSala || '');
      setResponsavelNome(bemToEdit.responsavel_nome || '');
      setGarantiaAte(bemToEdit.garantia_ate ? bemToEdit.garantia_ate.slice(0, 10) : '');
      setNotaFiscalNome(bemToEdit.nota_fiscal_nome || '');
      setNotaFiscalUrl(bemToEdit.nota_fiscal_url || '');
      setObservacoes(bemToEdit.observacoes || '');

      // Manutenção
      setRequerManutencao(Boolean(bemToEdit.requerManutencao));
      setPeriodicidadeDias(bemToEdit.periodicidadeDias || 90);
      setDataUltimaManutencao(bemToEdit.dataUltimaManutencao ? bemToEdit.dataUltimaManutencao.slice(0, 10) : '');
      setDataProximaManutencao(bemToEdit.dataProximaManutencao ? bemToEdit.dataProximaManutencao.slice(0, 10) : '');
      setEmpresaTecnica(bemToEdit.empresaTecnica || '');
      setStatusManutencao(bemToEdit.statusManutencao || 'em_dia');
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

      // Manutenção default
      setRequerManutencao(false);
      setPeriodicidadeDias(90);
      setDataUltimaManutencao('');
      setDataProximaManutencao('');
      setEmpresaTecnica('');
      setStatusManutencao('em_dia');
    }
  }, [bemToEdit, profissionais, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !localizacaoSala.trim()) return;

    // Calcular status automático de manutenção
    let finalStatusManutencao = statusManutencao;
    if (requerManutencao && dataProximaManutencao) {
      const hoje = new Date().toISOString().slice(0, 10);
      const limiteAlerta = new Date();
      limiteAlerta.setDate(limiteAlerta.getDate() + 15);
      const limiteAlertaStr = limiteAlerta.toISOString().slice(0, 10);

      if (estadoConservacao === 'manutencao' || statusManutencao === 'em_manutencao') {
        finalStatusManutencao = 'em_manutencao';
      } else if (dataProximaManutencao < hoje) {
        finalStatusManutencao = 'vencida';
      } else if (dataProximaManutencao <= limiteAlertaStr) {
        finalStatusManutencao = 'alerta_proximo';
      } else {
        finalStatusManutencao = 'em_dia';
      }
    }

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

        // Manutenção Preventiva
        requerManutencao,
        periodicidadeDias: requerManutencao ? Number(periodicidadeDias) : undefined,
        dataUltimaManutencao: requerManutencao && dataUltimaManutencao ? dataUltimaManutencao : undefined,
        dataProximaManutencao: requerManutencao && dataProximaManutencao ? dataProximaManutencao : undefined,
        empresaTecnica: requerManutencao && empresaTecnica.trim() ? empresaTecnica.trim() : undefined,
        statusManutencao: requerManutencao ? finalStatusManutencao : undefined,
        historicoManutencoes: bemToEdit?.historicoManutencoes || [],
        criado_em: bemToEdit?.criado_em || new Date().toISOString(),
      },
      bemToEdit ? bemToEdit.id : undefined
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95">
        
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
                Cadastro patrimonial e controle de ciclo de manutenção preventiva
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

          {/* ========================================================= */}
          {/* 6.1 SEÇÃO DE GESTÃO DE MANUTENÇÃO PREVENTIVA E ALERTAS */}
          {/* ========================================================= */}
          <div className="mt-4 p-4.5 bg-gradient-to-br from-indigo-50/70 via-slate-50 to-amber-50/40 rounded-2xl border border-indigo-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    Manutenção Preventiva & Alertas Periódicos
                    <span className="px-2 py-0.5 text-[10px] bg-indigo-100 text-indigo-700 font-bold rounded-full">
                      Módulo 6.1
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Controle de ciclos de calibração, revisões e alertas visuais de vencimento
                  </p>
                </div>
              </div>

              {/* Toggle Requer Manutenção */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={requerManutencao}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setRequerManutencao(checked);
                    if (checked && !dataUltimaManutencao) {
                      const hoje = new Date().toISOString().slice(0, 10);
                      setDataUltimaManutencao(hoje);
                      setDataProximaManutencao(calcularProximaData(hoje, periodicidadeDias));
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                <span className="ml-2 text-xs font-bold text-slate-700">
                  {requerManutencao ? 'Ativo' : 'Não Requer'}
                </span>
              </label>
            </div>

            {requerManutencao && (
              <div className="pt-3 border-t border-indigo-100/80 space-y-4 animate-in fade-in slide-in-from-top-2">
                
                {/* Periodicidade com Presets */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Periodicidade da Manutenção</span>
                    <span className="text-[11px] font-bold text-indigo-600">
                      A cada {periodicidadeDias} dias ({Math.round(periodicidadeDias / 30)} {Math.round(periodicidadeDias / 30) === 1 ? 'mês' : 'meses'})
                    </span>
                  </label>

                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {[
                      { dias: 30, label: '30d (Mensal)' },
                      { dias: 60, label: '60d (Bimestral)' },
                      { dias: 90, label: '90d (Trimestral)' },
                      { dias: 180, label: '180d (Semestral)' },
                    ].map((preset) => (
                      <button
                        key={preset.dias}
                        type="button"
                        onClick={() => handlePeriodicidadeChange(preset.dias)}
                        className={`py-1.5 px-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                          periodicidadeDias === preset.dias
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50/50 hover:border-indigo-300'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePeriodicidadeChange(365)}
                      className={`py-1.5 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                        periodicidadeDias === 365
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-indigo-50/50 hover:border-indigo-300'
                      }`}
                    >
                      365d (Anual)
                    </button>
                    <div className="flex-1 relative">
                      <input
                        type="number"
                        min="1"
                        placeholder="Outro intervalo em dias..."
                        value={periodicidadeDias}
                        onChange={(e) => handlePeriodicidadeChange(parseInt(e.target.value) || 30)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-medium">
                        dias
                      </span>
                    </div>
                  </div>
                </div>

                {/* Datas de Manutenção */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Data da Última Manutenção *
                    </label>
                    <input
                      type="date"
                      required={requerManutencao}
                      value={dataUltimaManutencao}
                      onChange={(e) => handleDataUltimaChange(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Data da Próxima Manutenção *</span>
                      <span className="text-[10px] text-slate-400">(Auto calculada)</span>
                    </label>
                    <input
                      type="date"
                      required={requerManutencao}
                      value={dataProximaManutencao}
                      onChange={(e) => setDataProximaManutencao(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-indigo-950"
                    />
                  </div>
                </div>

                {/* Empresa de Manutenção / Técnico */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                    Responsável / Empresa de Manutenção Técnica
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: MedLaser Assistência Técnica Autorizada - (11) 98888-0000 / Eng. Roberto"
                    value={empresaTecnica}
                    onChange={(e) => setEmpresaTecnica(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
            )}
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
              Observações Técnicas & Histórico
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

