import React, { useState, useEffect } from 'react';
import { 
  X, 
  Building2, 
  Phone, 
  CreditCard, 
  MapPin, 
  AlertCircle,
  Tag,
  DollarSign,
  Banknote,
  Coins
} from 'lucide-react';
import { Fornecedor, UsuarioEquipe } from '../types';
import { formatarTelefone, formatarCPF } from '../utils/anamneseValidation';

// Helper to format CNPJ / CPF
export function formatarCNPJouCPF(valor: string): string {
  const limpo = valor.replace(/\D/g, '');
  if (limpo.length <= 11) {
    return formatarCPF(limpo);
  }
  return limpo
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

// Helper to format CEP: 00000-000
export function formatarCEP(valor: string): string {
  const limpo = valor.replace(/\D/g, '').slice(0, 8);
  return limpo.replace(/^(\d{5})(\d)/, '$1-$2');
}

// Categorias padronizadas alinhadas ao cadastro de produtos/estoque + Serviços
export const CATEGORIAS_FORNECEDOR_PRODUTOS = [
  { id: 'Agulhas', label: 'Agulhas & Lâminas' },
  { id: 'Bioestimuladores', label: 'Bioestimuladores' },
  { id: 'Cosméticos', label: 'Cosméticos' },
  { id: 'Descartáveis', label: 'Descartáveis' },
  { id: 'Diluentes', label: 'Diluentes' },
  { id: 'Equipamentos', label: 'Equipamentos & Aparelhos' },
  { id: 'Geral', label: 'Geral' },
  { id: 'Injetáveis', label: 'Injetáveis' },
  { id: 'Outros', label: 'Outros' },
  { id: 'Pigmento', label: 'Pigmento' },
  { id: 'Preenchedores', label: 'Preenchedores' },
  { id: 'Serviços', label: 'Serviços' },
  { id: 'Tópicos & Anestésicos', label: 'Tópicos & Anestésicos' },
];

interface NewSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (novoFornecedor: Partial<Fornecedor>) => void;
  onSaveSupplier?: (novoFornecedor: Partial<Fornecedor>) => void;
  fornecedorToEdit?: Fornecedor | null;
  currentUser?: UsuarioEquipe;
}

export const NewSupplierModal: React.FC<NewSupplierModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onSaveSupplier,
  fornecedorToEdit,
}) => {
  // Identificação
  const [razaoSocial, setRazaoSocial] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [cnpjCpf, setCnpjCpf] = useState('');
  const [categoria, setCategoria] = useState<string>('Injetáveis');

  // Contato (sem email e site, conforme solicitado)
  const [telefone, setTelefone] = useState('');
  const [contatoResponsavel, setContatoResponsavel] = useState('');
  const [cargoContato, setCargoContato] = useState('');

  // Endereço (sem complemento/sala, conforme solicitado)
  const [cep, setCep] = useState('');
  const [endereco, setEndereco] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');

  // Dados Financeiros & Condições de Pagamento
  // Forma de pagamento com opções: 'Cartão', 'Dinheiro' e 'PIX'
  const [formaPagamento, setFormaPagamento] = useState<'cartao' | 'dinheiro' | 'pix'>('pix');
  const [pixChave, setPixChave] = useState('');
  const [tipoChavePix, setTipoChavePix] = useState('CNPJ');
  const [condicoesPagamento, setCondicoesPagamento] = useState('');
  const [prazoEntregaMedio, setPrazoEntregaMedio] = useState('');

  // Observações e Status
  const [observacoes, setObservacoes] = useState('');
  const [status, setStatus] = useState<'ativo' | 'inativo'>('ativo');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (fornecedorToEdit) {
        setRazaoSocial(fornecedorToEdit.razao_social || '');
        setNomeFantasia(fornecedorToEdit.nome_fantasia || '');
        setCnpjCpf(fornecedorToEdit.cnpj_cpf || '');
        setCategoria(fornecedorToEdit.categoria || 'Injetáveis');
        
        setTelefone(fornecedorToEdit.telefone || '');
        setContatoResponsavel(fornecedorToEdit.contato_responsavel || '');
        setCargoContato(fornecedorToEdit.cargo_contato || '');
        
        setCep(fornecedorToEdit.cep || '');
        setEndereco(fornecedorToEdit.endereco || '');
        setNumero(fornecedorToEdit.numero || '');
        setBairro(fornecedorToEdit.bairro || '');
        setCidade(fornecedorToEdit.cidade || '');
        setUf(fornecedorToEdit.uf || '');
        
        const forma = fornecedorToEdit.forma_pagamento_preferencial?.toLowerCase();
        if (forma === 'cartao' || forma === 'cartão') {
          setFormaPagamento('cartao');
        } else if (forma === 'dinheiro') {
          setFormaPagamento('dinheiro');
        } else {
          setFormaPagamento('pix');
        }

        setPixChave(fornecedorToEdit.pix_chave || '');
        setTipoChavePix(fornecedorToEdit.tipo_chave_pix || 'CNPJ');
        setCondicoesPagamento(fornecedorToEdit.condicoes_pagamento || '');
        setPrazoEntregaMedio(fornecedorToEdit.prazo_entrega_medio || '');
        
        setObservacoes(fornecedorToEdit.observacoes || '');
        setStatus(fornecedorToEdit.status || 'ativo');
      } else {
        setRazaoSocial('');
        setNomeFantasia('');
        setCnpjCpf('');
        setCategoria('Injetáveis');
        
        setTelefone('');
        setContatoResponsavel('');
        setCargoContato('');
        
        setCep('');
        setEndereco('');
        setNumero('');
        setBairro('');
        setCidade('');
        setUf('');
        
        setFormaPagamento('pix');
        setPixChave('');
        setTipoChavePix('CNPJ');
        setCondicoesPagamento('');
        setPrazoEntregaMedio('');
        
        setObservacoes('');
        setStatus('ativo');
      }
      setFormError('');
      setIsSubmitting(false);
    }
  }, [isOpen, fornecedorToEdit]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!razaoSocial.trim()) {
      setFormError('Por favor, informe a Razão Social ou Nome do Fornecedor.');
      return;
    }

    if (!telefone.trim() || telefone.replace(/\D/g, '').length < 8) {
      setFormError('Por favor, informe um Telefone / WhatsApp válido.');
      return;
    }

    const saveFunction = onSave || onSaveSupplier;
    if (!saveFunction) {
      console.error('Nenhuma função onSave/onSaveSupplier fornecida ao NewSupplierModal');
      return;
    }

    setIsSubmitting(true);

    const cidadeUfFormatada = cidade && uf ? `${cidade} - ${uf}` : cidade || uf || undefined;
    const enderecoFormatado = endereco 
      ? `${endereco}${numero ? `, ${numero}` : ''}${bairro ? ` (${bairro})` : ''}`
      : undefined;

    saveFunction({
      id: fornecedorToEdit?.id,
      razao_social: razaoSocial.trim(),
      nome_fantasia: nomeFantasia.trim() || undefined,
      cnpj_cpf: cnpjCpf.trim() || undefined,
      categoria: categoria,
      
      telefone: telefone.trim(),
      contato_responsavel: contatoResponsavel.trim() || undefined,
      cargo_contato: cargoContato.trim() || undefined,
      
      cep: cep.trim() || undefined,
      endereco: enderecoFormatado || endereco.trim() || undefined,
      numero: numero.trim() || undefined,
      bairro: bairro.trim() || undefined,
      cidade: cidade.trim() || undefined,
      uf: uf.trim() || undefined,
      cidade_uf: cidadeUfFormatada,
      
      forma_pagamento_preferencial: formaPagamento,
      pix_chave: formaPagamento === 'pix' ? pixChave.trim() || undefined : undefined,
      tipo_chave_pix: formaPagamento === 'pix' ? tipoChavePix : undefined,
      condicoes_pagamento: condicoesPagamento.trim() || undefined,
      prazo_entrega_medio: prazoEntregaMedio.trim() || undefined,
      
      observacoes: observacoes.trim() || undefined,
      status: status,
      criado_em: fornecedorToEdit?.criado_em || new Date().toISOString(),
    });

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 shadow-xs font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {fornecedorToEdit ? 'Editar Fornecedor & Parceiro' : 'Cadastrar Novo Fornecedor'}
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                Gestão simplificada de fornecedores vinculada às categorias de insumos e serviços
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mensagem de Erro / Validação */}
        {formError && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-700 text-xs font-semibold animate-in fade-in shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{formError}</span>
          </div>
        )}

        {/* Formulário com Seções Estruturadas */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
          
          {/* Seção 1: Identificação & Empresa */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-100 pb-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>1. Identificação da Empresa & Fornecedor</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Razão Social ou Nome do Fornecedor <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: MedEstética Distribuidora de Insumos Ltda"
                  value={razaoSocial}
                  onChange={(e) => setRazaoSocial(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Fantasia / Apelido
                </label>
                <input
                  type="text"
                  placeholder="Ex: MedEstética Brasil"
                  value={nomeFantasia}
                  onChange={(e) => setNomeFantasia(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-indigo-600" />
                  Categoria de Fornecimento
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 font-semibold"
                >
                  {CATEGORIAS_FORNECEDOR_PRODUTOS.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  CNPJ ou CPF (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="00.000.000/0001-00"
                  value={cnpjCpf}
                  onChange={(e) => setCnpjCpf(formatarCNPJouCPF(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Seção 2: Contato & Atendimento */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-100 pb-2">
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>2. Canais de Contato & Representante</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Telefone / WhatsApp Comercial <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={telefone}
                  onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contato / Representante Comercial
                </label>
                <input
                  type="text"
                  placeholder="Ex: Carlos Oliveira"
                  value={contatoResponsavel}
                  onChange={(e) => setContatoResponsavel(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cargo / Função do Contato
                </label>
                <input
                  type="text"
                  placeholder="Ex: Consultor Técnico, Gerente de Contas"
                  value={cargoContato}
                  onChange={(e) => setCargoContato(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Seção 3: Endereço */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-100 pb-2">
              <MapPin className="w-4 h-4 text-indigo-600" />
              <span>3. Endereço & Localização</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  CEP
                </label>
                <input
                  type="text"
                  placeholder="00000-000"
                  value={cep}
                  onChange={(e) => setCep(formatarCEP(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Logradouro / Endereço (Rua, Av.)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Av. Paulista, 1000"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Número
                </label>
                <input
                  type="text"
                  placeholder="Ex: 500"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bairro
                </label>
                <input
                  type="text"
                  placeholder="Ex: Bela Vista"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cidade / UF
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <input
                    type="text"
                    placeholder="Cidade"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    className="col-span-2 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                  />
                  <input
                    type="text"
                    placeholder="UF"
                    maxLength={2}
                    value={uf}
                    onChange={(e) => setUf(e.target.value.toUpperCase())}
                    className="px-2 py-2 text-xs uppercase text-center bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Seção 4: Dados Financeiros & Condições de Pagamento */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-100 pb-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>4. Dados Financeiros & Condições de Pagamento</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              
              {/* Campo de Seleção para Forma de Pagamento: Cartão, Dinheiro e PIX */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Forma de Pagamento Principal / Preferencial <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFormaPagamento('pix')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      formaPagamento === 'pix'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Coins className="w-4 h-4 text-emerald-600" />
                    <span>PIX</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormaPagamento('cartao')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      formaPagamento === 'cartao'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-800 ring-2 ring-indigo-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                    <span>Cartão</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormaPagamento('dinheiro')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      formaPagamento === 'dinheiro'
                        ? 'bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-amber-600" />
                    <span>Dinheiro</span>
                  </button>
                </div>
              </div>

              {/* Se PIX, exibe campos de Chave Pix */}
              {formaPagamento === 'pix' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tipo de Chave PIX
                    </label>
                    <select
                      value={tipoChavePix}
                      onChange={(e) => setTipoChavePix(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 font-medium"
                    >
                      <option value="CNPJ">CNPJ</option>
                      <option value="CPF">CPF</option>
                      <option value="E-mail">E-mail</option>
                      <option value="Telefone">Telefone</option>
                      <option value="Aleatória">Chave Aleatória (EVP)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Chave PIX
                    </label>
                    <input
                      type="text"
                      placeholder="Informe a chave PIX do parceiro"
                      value={pixChave}
                      onChange={(e) => setPixChave(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Condições Comerciais / Parcelamento
                </label>
                <input
                  type="text"
                  placeholder="Ex: 30/60 dias, À vista, Faturado 15d"
                  value={condicoesPagamento}
                  onChange={(e) => setCondicoesPagamento(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Prazo Médio de Entrega
                </label>
                <input
                  type="text"
                  placeholder="Ex: 2 dias úteis, Sedex 24h"
                  value={prazoEntregaMedio}
                  onChange={(e) => setPrazoEntregaMedio(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Seção 5: Observações e Status */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-100 pb-2">
              <DollarSign className="w-4 h-4 text-indigo-600" />
              <span>5. Status & Observações Internas</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observações Gerais / Histórico
                </label>
                <textarea
                  rows={2}
                  placeholder="Anotações internas sobre frete, pontualidade, descontos especiais de volume..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status do Cadastro
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'ativo' | 'inativo')}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 font-semibold"
                >
                  <option value="ativo">Ativo (Homologado)</option>
                  <option value="inativo">Inativo / Bloqueado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer & Ações */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white pb-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <Building2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Salvando...' : fornecedorToEdit ? 'Salvar Alterações' : 'Concluir Cadastro'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
