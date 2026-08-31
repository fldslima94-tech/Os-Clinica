import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Calendar, 
  FileText, 
  ShieldAlert,
  Sparkles,
  Mail,
  CreditCard,
  HeartPulse,
  AlertCircle,
  MapPin,
  Briefcase,
  HeartHandshake,
  Clock,
  CheckCircle2,
  Sliders
} from 'lucide-react';
import { Paciente, ConfiguracaoCampos, UsuarioEquipe } from '../types';
import { FieldWrapper, getFieldLabel, getFieldPlaceholder, isFieldHidden, isFieldMandatory } from './FieldWrapper';
import { calcularIdade, formatarTelefone, formatarCPF } from '../utils/anamneseValidation';

interface NewPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (novoPaciente: Partial<Paciente>) => void;
  onSavePatient?: (novoPaciente: Partial<Paciente>) => void;
  onOpenAnamneseCompleta?: () => void;
  configuracaoCampos?: ConfiguracaoCampos;
  currentUser?: UsuarioEquipe;
}

export const NewPatientModal: React.FC<NewPatientModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onSavePatient,
  onOpenAnamneseCompleta,
  configuracaoCampos,
}) => {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [endereco, setEndereco] = useState('');
  const [profissao, setProfissao] = useState('');
  const [contatoEmergenciaNome, setContatoEmergenciaNome] = useState('');
  const [contatoEmergenciaTel, setContatoEmergenciaTel] = useState('');
  const [queixaPrincipal, setQueixaPrincipal] = useState('');
  const [alergias, setAlergias] = useState('');
  const [medicacoes, setMedicacoes] = useState('');
  const [fototipo, setFototipo] = useState('Fototipo III');
  const [historicoClinico, setHistoricoClinico] = useState('');
  const [customFieldsData, setCustomFieldsData] = useState<Record<string, any>>({});
  const [formError, setFormError] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setNome('');
      setTelefone('');
      setCpf('');
      setEmail('');
      setDataNascimento('');
      setEndereco('');
      setProfissao('');
      setContatoEmergenciaNome('');
      setContatoEmergenciaTel('');
      setQueixaPrincipal('');
      setAlergias('');
      setMedicacoes('');
      setFototipo('Fototipo III');
      setHistoricoClinico('');
      setCustomFieldsData({});
      setFormError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const idadeCalculada = calcularIdade(dataNascimento);
  const customFieldsForClients = configuracaoCampos?.camposPersonalizados?.filter(f => f.categoria === 'Clientes') || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!isFieldHidden('cliente.nome', configuracaoCampos) && (!nome.trim())) {
      setFormError(`Por favor, informe o campo "${getFieldLabel('cliente.nome', configuracaoCampos, 'Nome Completo')}".`);
      return;
    }

    if (!isFieldHidden('cliente.telefone', configuracaoCampos) && (!telefone.trim() || telefone.replace(/\D/g, '').length < 10)) {
      setFormError(`Por favor, informe um ${getFieldLabel('cliente.telefone', configuracaoCampos, 'Telefone / WhatsApp')} válido com DDD.`);
      return;
    }

    const cleanCpf = cpf.replace(/\D/g, '');
    if (!cleanCpf || cleanCpf.length !== 11) {
      setFormError(`O ${getFieldLabel('cliente.cpf', configuracaoCampos, 'CPF')} do cliente é obrigatório e deve conter 11 dígitos.`);
      return;
    }

    if (!endereco.trim() || endereco.trim().length < 5) {
      setFormError(`O ${getFieldLabel('cliente.endereco', configuracaoCampos, 'Endereço de Residência')} é obrigatório (informe rua, número, bairro e cidade).`);
      return;
    }

    const saveFunction = onSave || onSavePatient;

    if (!saveFunction) {
      console.error('Nenhuma função onSave/onSavePatient fornecida ao NewPatientModal');
      return;
    }

    // Build consolidated clinical history including custom fields
    let consolidatedHistorico = historicoClinico.trim();
    if (queixaPrincipal.trim()) {
      consolidatedHistorico = `[Queixa]: ${queixaPrincipal.trim()} | ${consolidatedHistorico}`;
    }

    if (Object.keys(customFieldsData).length > 0) {
      const customStr = Object.entries(customFieldsData)
        .map(([key, val]) => {
          const fieldDef = customFieldsForClients.find(f => f.id === key);
          return `[${fieldDef?.label || key}]: ${val}`;
        })
        .join(' | ');
      consolidatedHistorico = `${consolidatedHistorico} | ${customStr}`;
    }

    saveFunction({
      nome: nome.trim(),
      telefone: telefone.trim(),
      cpf: cpf.trim() || undefined,
      email: email.trim() || undefined,
      data_nascimento: dataNascimento || '',
      endereco: endereco.trim() || undefined,
      profissao: profissao.trim() || undefined,
      contato_emergencia: {
        nome: contatoEmergenciaNome.trim(),
        telefone: contatoEmergenciaTel.trim(),
      },
      queixa_principal: queixaPrincipal.trim() || undefined,
      alergias: alergias.trim() || undefined,
      medicacoes: medicacoes.trim() || undefined,
      fototipo: fototipo || 'Fototipo III',
      historico_clinico: consolidatedHistorico || 'Ficha clínica inicial cadastrada.',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Cadastrar Ficha de Cliente / Paciente
              </h3>
              <p className="text-xs text-indigo-200 font-medium">
                Prontuário clínico, dados pessoais, contato de emergência e histórico
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

        {/* Banner Opcional de Anamnese Completa com Assinatura */}
        {onOpenAnamneseCompleta && (
          <div className="bg-indigo-50/80 border-b border-indigo-100 p-3.5 px-6 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
              <div className="text-xs">
                <strong className="text-indigo-950 block">Deseja colher a Anamnese Completa com Assinatura Digital?</strong>
                <span className="text-slate-500">Inclui checklist de saúde Sim/Não, controle por procedimento e assinatura na tela.</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAnamneseCompleta();
              }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
            >
              Abrir Anamnese Completa
            </button>
          </div>
        )}

        {/* Error Alert */}
        {formError && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-700 text-xs font-semibold animate-in fade-in shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{formError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm overflow-y-auto flex-1">
          
          {/* BLOCO 1: DADOS PESSOAIS */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <User className="w-4 h-4 text-indigo-600" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                1. Dados Pessoais do Cliente
              </h4>
            </div>

            {/* Nome Completo */}
            <FieldWrapper
              campoId="cliente.nome"
              configuracaoCampos={configuracaoCampos}
              label="Nome Completo do Cliente"
              required
            >
              <input
                type="text"
                required
                autoFocus
                placeholder={getFieldPlaceholder('cliente.nome', configuracaoCampos, 'Ex: Mariana Vasconcelos Ribeiro')}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs sm:text-sm font-medium"
              />
            </FieldWrapper>

            {/* Telefone & CPF */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FieldWrapper
                campoId="cliente.telefone"
                configuracaoCampos={configuracaoCampos}
                label="Telefone / WhatsApp"
                required
              >
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder={getFieldPlaceholder('cliente.telefone', configuracaoCampos, '(00) 00000-0000')}
                    maxLength={15}
                    value={telefone}
                    onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs sm:text-sm font-medium"
                  />
                </div>
              </FieldWrapper>

              <FieldWrapper
                campoId="cliente.cpf"
                configuracaoCampos={configuracaoCampos}
                label="CPF do Cliente *"
                required
              >
                <div className="relative">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder={getFieldPlaceholder('cliente.cpf', configuracaoCampos, '000.000.000-00')}
                    maxLength={14}
                    value={cpf}
                    onChange={(e) => setCpf(formatarCPF(e.target.value))}
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs sm:text-sm font-medium"
                  />
                </div>
              </FieldWrapper>
            </div>

            {/* Email & Data Nasc + Idade Dinâmica */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FieldWrapper
                campoId="cliente.email"
                configuracaoCampos={configuracaoCampos}
                label="E-mail"
              >
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder={getFieldPlaceholder('cliente.email', configuracaoCampos, 'mariana@exemplo.com')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs sm:text-sm"
                  />
                </div>
              </FieldWrapper>

              <FieldWrapper
                campoId="cliente.data_nascimento"
                configuracaoCampos={configuracaoCampos}
                label="Data de Nascimento"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    {idadeCalculada !== '' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <Clock className="w-3 h-3" />
                        {idadeCalculada} anos
                      </span>
                    )}
                  </div>
                  <input
                    type="date"
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs sm:text-sm"
                  />
                </div>
              </FieldWrapper>
            </div>

            {/* Profissão & Endereço */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FieldWrapper
                campoId="cliente.profissao"
                configuracaoCampos={configuracaoCampos}
                label="Profissão"
              >
                <div className="relative">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder={getFieldPlaceholder('cliente.profissao', configuracaoCampos, 'Ex: Arquiteta, Advogada')}
                    value={profissao}
                    onChange={(e) => setProfissao(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
                  />
                </div>
              </FieldWrapper>

              <FieldWrapper
                campoId="cliente.endereco"
                configuracaoCampos={configuracaoCampos}
                label="Endereço de Residência Completo *"
                required
                className="sm:col-span-2"
              >
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder={getFieldPlaceholder('cliente.endereco', configuracaoCampos, 'Rua, Número, Bairro, Cidade - UF')}
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
                  />
                </div>
              </FieldWrapper>
            </div>

            {/* Contato de Emergência */}
            <FieldWrapper
              campoId="cliente.contato_emergencia"
              configuracaoCampos={configuracaoCampos}
              label="Contato de Emergência"
            >
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-1.5">
                  <HeartHandshake className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800">Pessoa de Confiança</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    placeholder="Nome do Contato (Ex: Carlos - Esposo)"
                    value={contatoEmergenciaNome}
                    onChange={(e) => setContatoEmergenciaNome(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Telefone de Emergência (00) 00000-0000"
                    maxLength={15}
                    value={contatoEmergenciaTel}
                    onChange={(e) => setContatoEmergenciaTel(formatarTelefone(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
            </FieldWrapper>

          </div>

          {/* BLOCO 2: HISTÓRICO & INTERESSE CLÍNICO */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <HeartPulse className="w-4 h-4 text-rose-600" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                2. Histórico & Interesse Clínico
              </h4>
            </div>

            {/* Fototipo & Queixa Principal */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FieldWrapper
                campoId="cliente.fototipo"
                configuracaoCampos={configuracaoCampos}
                label="Fototipo Cutâneo"
              >
                <select
                  value={fototipo}
                  onChange={(e) => setFototipo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs font-semibold cursor-pointer"
                >
                  <option value="Fototipo I">Fototipo I (Muito clara)</option>
                  <option value="Fototipo II">Fototipo II (Clara)</option>
                  <option value="Fototipo III">Fototipo III (Morena clara)</option>
                  <option value="Fototipo IV">Fototipo IV (Morena moderada)</option>
                  <option value="Fototipo V">Fototipo V (Morena escura)</option>
                  <option value="Fototipo VI">Fototipo VI (Negra)</option>
                </select>
              </FieldWrapper>

              <FieldWrapper
                campoId="cliente.queixa_principal"
                configuracaoCampos={configuracaoCampos}
                label="Queixa Principal / Interesse Estético"
                className="sm:col-span-2"
              >
                <input
                  type="text"
                  placeholder={getFieldPlaceholder('cliente.queixa_principal', configuracaoCampos, 'Ex: Toxina botulínica, limpeza de pele, micropigmentação...')}
                  value={queixaPrincipal}
                  onChange={(e) => setQueixaPrincipal(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
                />
              </FieldWrapper>
            </div>

            {/* Alergias & Medicações */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FieldWrapper
                campoId="cliente.alergias"
                configuracaoCampos={configuracaoCampos}
                label="Alergias Conhecidas"
              >
                <input
                  type="text"
                  placeholder={getFieldPlaceholder('cliente.alergias', configuracaoCampos, 'Ex: Lidocaína, látex, iodo...')}
                  value={alergias}
                  onChange={(e) => setAlergias(e.target.value)}
                  className="w-full px-3 py-2 bg-amber-50/50 border border-amber-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-xs"
                />
              </FieldWrapper>

              <FieldWrapper
                campoId="cliente.medicacoes"
                configuracaoCampos={configuracaoCampos}
                label="Medicamentos Contínuos"
              >
                <input
                  type="text"
                  placeholder={getFieldPlaceholder('cliente.medicacoes', configuracaoCampos, 'Ex: Anticoagulantes, Roacutan...')}
                  value={medicacoes}
                  onChange={(e) => setMedicacoes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
                />
              </FieldWrapper>
            </div>

            {/* Observações Clínicas */}
            <FieldWrapper
              campoId="cliente.historico_clinico"
              configuracaoCampos={configuracaoCampos}
              label="Observações Clínicas Iniciais"
            >
              <textarea
                rows={2}
                placeholder={getFieldPlaceholder('cliente.historico_clinico', configuracaoCampos, 'Ex: Histórico de queloide, cuidados especiais...')}
                value={historicoClinico}
                onChange={(e) => setHistoricoClinico(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs resize-none"
              />
            </FieldWrapper>

            {/* Campos Personalizados Dinâmicos Criados pelo Super Admin */}
            {customFieldsForClients.length > 0 && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center gap-1.5 text-indigo-700">
                  <Sliders className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Campos Personalizados da Clínica</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {customFieldsForClients.map(field => {
                    if (isFieldHidden(field.id, configuracaoCampos)) return null;

                    return (
                      <div key={field.id} className={field.largura === 'full' ? 'sm:col-span-2' : ''}>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {field.label}
                          {(field.obrigatorio || isFieldMandatory(field.id, configuracaoCampos)) && (
                            <span className="text-rose-500 ml-1 font-bold">*</span>
                          )}
                        </label>
                        {field.tipo === 'textarea' ? (
                          <textarea
                            rows={2}
                            placeholder={field.placeholder || ''}
                            value={customFieldsData[field.id] || ''}
                            onChange={(e) => setCustomFieldsData({ ...customFieldsData, [field.id]: e.target.value })}
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs resize-none"
                          />
                        ) : field.tipo === 'select' ? (
                          <select
                            value={customFieldsData[field.id] || ''}
                            onChange={(e) => setCustomFieldsData({ ...customFieldsData, [field.id]: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium cursor-pointer"
                          >
                            <option value="">Selecione...</option>
                            {field.opcoes?.map((opt, i) => (
                              <option key={i} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.tipo === 'number' ? 'number' : field.tipo === 'date' ? 'date' : 'text'}
                            placeholder={field.placeholder || ''}
                            value={customFieldsData[field.id] || ''}
                            onChange={(e) => setCustomFieldsData({ ...customFieldsData, [field.id]: e.target.value })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold transition-colors cursor-pointer text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold shadow-xs transition-all cursor-pointer text-xs sm:text-sm flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              <span>Salvar Ficha do Cliente</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

