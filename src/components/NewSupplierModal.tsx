import React, { useState, useEffect } from 'react';
import { 
  X, 
  Building2, 
  Phone, 
  Mail, 
  CreditCard, 
  MapPin, 
  FileText, 
  Tag, 
  UserCheck, 
  Check, 
  AlertCircle,
  Sparkles,
  Globe,
  Briefcase,
  Layers,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { Fornecedor, CategoriaFornecedor, UsuarioEquipe } from '../types';
import { formatarTelefone, formatarCPF } from '../utils/anamneseValidation';

// Helper to format CNPJ / CPF
export function formatarCNPJouCPF(valor: string): string {
  const limpo = valor.replace(/\D/g, '');
  if (limpo.length <= 11) {
    return formatarCPF(limpo);
  }
  // CNPJ format: 00.000.000/0000-00
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
  const [inscricaoEstadual, setInscricaoEstadual] = useState('');
  const [categoria, setCategoria] = useState<CategoriaFornecedor>('insumos');

  // Contato
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [site, setSite] = useState('');
  const [contatoResponsavel, setContatoResponsavel] = useState('');
  const [cargoContato, setCargoContato] = useState('');

  // Endereço
  const [cep, setCep] = useState('');
  const [endereco, setEndereco] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');

  // Financeiro & Condições
  const [pixChave, setPixChave] = useState('');
  const [tipoChavePix, setTipoChavePix] = useState('CNPJ');
  const [bancoNome, setBancoNome] = useState('');
  const [agencia, setAgencia] = useState('');
  const [contaCorrente, setContaCorrente] = useState('');
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
        setInscricaoEstadual(fornecedorToEdit.inscricao_estadual || '');
        setCategoria((fornecedorToEdit.categoria as CategoriaFornecedor) || 'insumos');
        
        setTelefone(fornecedorToEdit.telefone || '');
        setEmail(fornecedorToEdit.email || '');
        setSite(fornecedorToEdit.site || '');
        setContatoResponsavel(fornecedorToEdit.contato_responsavel || '');
        setCargoContato(fornecedorToEdit.cargo_contato || '');
        
        setCep(fornecedorToEdit.cep || '');
        setEndereco(fornecedorToEdit.endereco || '');
        setNumero(fornecedorToEdit.numero || '');
        setComplemento(fornecedorToEdit.complemento || '');
        setBairro(fornecedorToEdit.bairro || '');
        setCidade(fornecedorToEdit.cidade || '');
        setUf(fornecedorToEdit.uf || '');
        
        setPixChave(fornecedorToEdit.pix_chave || '');
        setTipoChavePix(fornecedorToEdit.tipo_chave_pix || 'CNPJ');
        setBancoNome(fornecedorToEdit.banco_nome || fornecedorToEdit.banco_dados || '');
        setAgencia(fornecedorToEdit.agencia || '');
        setContaCorrente(fornecedorToEdit.conta_corrente || '');
        setCondicoesPagamento(fornecedorToEdit.condicoes_pagamento || '');
        setPrazoEntregaMedio(fornecedorToEdit.prazo_entrega_medio || '');
        
        setObservacoes(fornecedorToEdit.observacoes || '');
        setStatus(fornecedorToEdit.status || 'ativo');
      } else {
        setRazaoSocial('');
        setNomeFantasia('');
        setCnpjCpf('');
        setInscricaoEstadual('');
        setCategoria('insumos');
        
        setTelefone('');
        setEmail('');
        setSite('');
        setContatoResponsavel('');
        setCargoContato('');
        
        setCep('');
        setEndereco('');
        setNumero('');
        setComplemento('');
        setBairro('');
        setCidade('');
        setUf('');
        
        setPixChave('');
        setTipoChavePix('CNPJ');
        setBancoNome('');
        setAgencia('');
        setContaCorrente('');
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
      ? `${endereco}${numero ? `, ${numero}` : ''}${complemento ? ` - ${complemento}` : ''}${bairro ? ` (${bairro})` : ''}`
      : undefined;

    saveFunction({
      id: fornecedorToEdit?.id,
      razao_social: razaoSocial.trim(),
      nome_fantasia: nomeFantasia.trim() || undefined,
      cnpj_cpf: cnpjCpf.trim() || undefined,
      inscricao_estadual: inscricaoEstadual.trim() || undefined,
      categoria: categoria,
      
      telefone: telefone.trim(),
      email: email.trim() || undefined,
      site: site.trim() || undefined,
      contato_responsavel: contatoResponsavel.trim() || undefined,
      cargo_contato: cargoContato.trim() || undefined,
      
      cep: cep.trim() || undefined,
      endereco: enderecoFormatado || endereco.trim() || undefined,
      numero: numero.trim() || undefined,
      complemento: complemento.trim() || undefined,
      bairro: bairro.trim() || undefined,
      cidade: cidade.trim() || undefined,
      uf: uf.trim() || undefined,
      cidade_uf: cidadeUfFormatada,
      
      pix_chave: pixChave.trim() || undefined,
      tipo_chave_pix: tipoChavePix,
      banco_dados: bancoNome.trim() || undefined,
      banco_nome: bancoNome.trim() || undefined,
      agencia: agencia.trim() || undefined,
      conta_corrente: contaCorrente.trim() || undefined,
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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6 flex flex-col max-h-[92vh]">
        
        {/* Header no Padrão do Cadastro de Paciente / Sistema */}
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
                Padrão estruturado de parceiros, insumos, suporte técnico e serviços
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

        {/* Formulário com Abas/Seções Estruturadas */}
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Categoria de Fornecimento
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as CategoriaFornecedor)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 font-medium"
                >
                  <option value="insumos">Insumos, Pigmentos & Cosméticos</option>
                  <option value="equipamentos">Equipamentos Médicos & Estéticos</option>
                  <option value="manutencao">Assistência Técnica & Manutenção</option>
                  <option value="servicos">Serviços Especializados / Consultoria</option>
                  <option value="software">Software & Tecnologia</option>
                  <option value="imobiliario">Locação & Imobiliário</option>
                  <option value="outros">Outros Fornecimentos</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  CNPJ ou CPF
                </label>
                <input
                  type="text"
                  placeholder="00.000.000/0001-00"
                  value={cnpjCpf}
                  onChange={(e) => setCnpjCpf(formatarCNPJouCPF(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Inscrição Estadual (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Isento ou 123.456.789.000"
                  value={inscricaoEstadual}
                  onChange={(e) => setInscricaoEstadual(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
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
                  E-mail para Pedidos / NFe
                </label>
                <input
                  type="email"
                  placeholder="pedidos@fornecedor.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Site / Portal de Compras
                </label>
                <input
                  type="text"
                  placeholder="https://loja.fornecedor.com.br"
                  value={site}
                  onChange={(e) => setSite(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Seção 3: Endereço Completo */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-100 pb-2">
              <MapPin className="w-4 h-4 text-indigo-600" />
              <span>3. Endereço Completo & Localização</span>
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
                  Complemento / Sala
                </label>
                <input
                  type="text"
                  placeholder="Ex: Sala 42, Bloco B"
                  value={complemento}
                  onChange={(e) => setComplemento(e.target.value)}
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

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cidade
                </label>
                <input
                  type="text"
                  placeholder="Ex: São Paulo"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estado (UF)
                </label>
                <input
                  type="text"
                  placeholder="SP"
                  maxLength={2}
                  value={uf}
                  onChange={(e) => setUf(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs uppercase bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Seção 4: Dados Financeiros & Condições Comerciais */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-100 pb-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>4. Dados Financeiros & Condições de Pagamento</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Chave Pix
                </label>
                <input
                  type="text"
                  placeholder="CNPJ, E-mail, Telefone ou Chave Aleatória"
                  value={pixChave}
                  onChange={(e) => setPixChave(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Banco / Instituição Financeira
                </label>
                <input
                  type="text"
                  placeholder="Ex: Itaú (341), Bradesco, Inter..."
                  value={bancoNome}
                  onChange={(e) => setBancoNome(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Agência & Conta Corrente
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Agência"
                    value={agencia}
                    onChange={(e) => setAgencia(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                  />
                  <input
                    type="text"
                    placeholder="Conta C/C"
                    value={contaCorrente}
                    onChange={(e) => setContaCorrente(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Condições de Pagamento / Prazo de Faturamento
                </label>
                <input
                  type="text"
                  placeholder="Ex: Boleto 28 dias, 5% desc. no Pix à vista"
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
                  placeholder="Ex: 2 a 4 dias úteis via Sedex"
                  value={prazoEntregaMedio}
                  onChange={(e) => setPrazoEntregaMedio(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status do Fornecedor
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStatus('ativo')}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      status === 'ativo'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs font-bold'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Ativo / Homologado
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('inativo')}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      status === 'inativo'
                        ? 'bg-slate-100 text-slate-700 border-slate-300 shadow-2xs font-bold'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Inativo / Bloqueado
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Seção 5: Observações */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold border-b border-slate-100 pb-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>5. Observações & Itens Fornecidos</span>
            </div>

            <div>
              <textarea
                rows={3}
                placeholder="Anotações internas, marcas exclusivas, contatos de suporte de emergência, tabela de descontos acordada..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 resize-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 text-xs font-semibold rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-sm flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{fornecedorToEdit ? 'Atualizar Fornecedor' : 'Salvar Fornecedor'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
