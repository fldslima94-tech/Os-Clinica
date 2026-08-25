import React, { useState, useEffect } from 'react';
import { 
  X, 
  Building, 
  Phone, 
  Mail, 
  CreditCard, 
  MapPin, 
  FileText, 
  Tag, 
  UserCheck, 
  Check, 
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { Fornecedor, CategoriaFornecedor, UsuarioEquipe } from '../types';

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
  const [razaoSocial, setRazaoSocial] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [cnpjCpf, setCnpjCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [categoria, setCategoria] = useState<CategoriaFornecedor>('insumos');
  const [contatoResponsavel, setContatoResponsavel] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cidadeUf, setCidadeUf] = useState('');
  const [pixChave, setPixChave] = useState('');
  const [bancoDados, setBancoDados] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [status, setStatus] = useState<'ativo' | 'inativo'>('ativo');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (fornecedorToEdit) {
        setRazaoSocial(fornecedorToEdit.razao_social || '');
        setNomeFantasia(fornecedorToEdit.nome_fantasia || '');
        setCnpjCpf(fornecedorToEdit.cnpj_cpf || '');
        setTelefone(fornecedorToEdit.telefone || '');
        setEmail(fornecedorToEdit.email || '');
        setCategoria((fornecedorToEdit.categoria as CategoriaFornecedor) || 'insumos');
        setContatoResponsavel(fornecedorToEdit.contato_responsavel || '');
        setEndereco(fornecedorToEdit.endereco || '');
        setCidadeUf(fornecedorToEdit.cidade_uf || '');
        setPixChave(fornecedorToEdit.pix_chave || '');
        setBancoDados(fornecedorToEdit.banco_dados || '');
        setObservacoes(fornecedorToEdit.observacoes || '');
        setStatus(fornecedorToEdit.status || 'ativo');
      } else {
        setRazaoSocial('');
        setNomeFantasia('');
        setCnpjCpf('');
        setTelefone('');
        setEmail('');
        setCategoria('insumos');
        setContatoResponsavel('');
        setEndereco('');
        setCidadeUf('');
        setPixChave('');
        setBancoDados('');
        setObservacoes('');
        setStatus('ativo');
      }
      setFormError('');
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

    if (!telefone.trim()) {
      setFormError('Por favor, informe o telefone de contato / WhatsApp do fornecedor.');
      return;
    }

    const saveFunction = onSave || onSaveSupplier;
    if (!saveFunction) {
      console.error('Nenhuma função onSave/onSaveSupplier fornecida ao NewSupplierModal');
      return;
    }

    saveFunction({
      id: fornecedorToEdit?.id,
      razao_social: razaoSocial.trim(),
      nome_fantasia: nomeFantasia.trim() || undefined,
      cnpj_cpf: cnpjCpf.trim() || undefined,
      telefone: telefone.trim(),
      email: email.trim() || undefined,
      categoria: categoria,
      contato_responsavel: contatoResponsavel.trim() || undefined,
      endereco: endereco.trim() || undefined,
      cidade_uf: cidadeUf.trim() || undefined,
      pix_chave: pixChave.trim() || undefined,
      banco_dados: bancoDados.trim() || undefined,
      observacoes: observacoes.trim() || undefined,
      status: status,
      criado_em: fornecedorToEdit?.criado_em || new Date().toISOString(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 shadow-xs">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {fornecedorToEdit ? 'Editar Fornecedor / Parceiro' : 'Cadastrar Novo Fornecedor'}
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                Insumos, equipamentos médicos, assistência técnica e serviços
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

        {/* Error Alert */}
        {formError && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-700 text-xs font-semibold animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{formError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm max-h-[75vh] overflow-y-auto">
          
          {/* Razão Social & Nome Fantasia */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="font-bold text-slate-800 block mb-1.5 flex items-center justify-between">
                <span>Razão Social / Nome da Empresa *</span>
                <span className="text-[11px] text-amber-600 font-semibold">Obrigatório</span>
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="Ex: Allergan Aesthetics Brasil Ltda"
                value={razaoSocial}
                onChange={(e) => setRazaoSocial(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1.5">
                Nome Comercial / Fantasia
              </label>
              <input
                type="text"
                placeholder="Ex: Allergan / Botox"
                value={nomeFantasia}
                onChange={(e) => setNomeFantasia(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
              />
            </div>
          </div>

          {/* Categoria & CNPJ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="font-bold text-slate-800 block mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-600" />
                Categoria Principal *
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as CategoriaFornecedor)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-xs font-semibold cursor-pointer"
              >
                <option value="insumos">Insumos, Toxinas & Pigmentos</option>
                <option value="equipamentos">Equipamentos Médicos & Lasers</option>
                <option value="manutencao">Manutenção & Engenharia Clínica</option>
                <option value="servicos">Serviços Gerais & Contabilidade</option>
                <option value="software">Softwares, TI & Telecom</option>
                <option value="imobiliario">Aluguel / Imobiliário</option>
                <option value="outros">Outros Fornecimentos</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1.5 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                CNPJ ou CPF
              </label>
              <input
                type="text"
                placeholder="00.000.000/0001-00"
                value={cnpjCpf}
                onChange={(e) => setCnpjCpf(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
              />
            </div>
          </div>

          {/* Telefone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="font-bold text-slate-800 block mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                Telefone (WhatsApp) *
              </label>
              <input
                type="text"
                required
                placeholder="(11) 98765-4321"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                E-mail para Pedidos / NFs
              </label>
              <input
                type="email"
                placeholder="pedidos@fornecedor.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
              />
            </div>
          </div>

          {/* Contato Responsável & Cidade */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="font-bold text-slate-800 block mb-1.5 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                Representante / Contato Comercial
              </label>
              <input
                type="text"
                placeholder="Ex: Fernanda (Representante Comercial)"
                value={contatoResponsavel}
                onChange={(e) => setContatoResponsavel(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                Cidade / UF
              </label>
              <input
                type="text"
                placeholder="Ex: São Paulo / SP"
                value={cidadeUf}
                onChange={(e) => setCidadeUf(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
              />
            </div>
          </div>

          {/* Dados Financeiros (PIX / Banco) */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
              Dados para Pagamento (Opcional)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">
                  Chave PIX
                </label>
                <input
                  type="text"
                  placeholder="CNPJ, E-mail, Telefone ou Aleatória"
                  value={pixChave}
                  onChange={(e) => setPixChave(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">
                  Conta Bancária / Banco
                </label>
                <input
                  type="text"
                  placeholder="Banco, Agência e Conta"
                  value={bancoDados}
                  onChange={(e) => setBancoDados(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="font-bold text-slate-800 block mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Observações / Condições Comerciais
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Prazo de entrega médio 48h; faturamento em 30 dias no boleto; pedido mínimo R$ 1.000..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-xs resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors cursor-pointer text-xs sm:text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 rounded-xl font-bold shadow-md shadow-amber-500/20 hover:shadow-amber-500/30 transition-all cursor-pointer text-xs sm:text-sm flex items-center gap-2"
            >
              <Building className="w-4 h-4" />
              <span>{fornecedorToEdit ? 'Atualizar Fornecedor' : 'Salvar Fornecedor'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
