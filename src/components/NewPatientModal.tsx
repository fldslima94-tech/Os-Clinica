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
  AlertCircle
} from 'lucide-react';
import { Paciente, ConfiguracaoCampos, UsuarioEquipe } from '../types';
import { FieldWrapper } from './FieldWrapper';

interface NewPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (novoPaciente: Partial<Paciente>) => void;
  onSavePatient?: (novoPaciente: Partial<Paciente>) => void;
  configuracaoCampos?: ConfiguracaoCampos;
  currentUser?: UsuarioEquipe;
}

export const NewPatientModal: React.FC<NewPatientModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onSavePatient,
  configuracaoCampos,
}) => {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [queixaPrincipal, setQueixaPrincipal] = useState('');
  const [alergias, setAlergias] = useState('');
  const [medicacoes, setMedicacoes] = useState('');
  const [fototipo, setFototipo] = useState('Fototipo III');
  const [historicoClinico, setHistoricoClinico] = useState('');
  const [formError, setFormError] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setNome('');
      setTelefone('');
      setCpf('');
      setEmail('');
      setDataNascimento('');
      setQueixaPrincipal('');
      setAlergias('');
      setMedicacoes('');
      setFototipo('Fototipo III');
      setHistoricoClinico('');
      setFormError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!nome.trim()) {
      setFormError('Por favor, informe o nome completo do cliente.');
      return;
    }

    if (!telefone.trim()) {
      setFormError('Por favor, informe o telefone (WhatsApp) para contato.');
      return;
    }

    const saveFunction = onSave || onSavePatient;

    if (!saveFunction) {
      console.error('Nenhuma função onSave/onSavePatient fornecida ao NewPatientModal');
      return;
    }

    // Build consolidated clinical history
    let consolidatedHistorico = historicoClinico.trim();
    if (queixaPrincipal.trim()) {
      consolidatedHistorico = `[Queixa Principal]: ${queixaPrincipal.trim()} | ${consolidatedHistorico}`;
    }

    saveFunction({
      nome: nome.trim(),
      telefone: telefone.trim(),
      cpf: cpf.trim() || undefined,
      email: email.trim() || undefined,
      data_nascimento: dataNascimento || '',
      queixa_principal: queixaPrincipal.trim() || undefined,
      alergias: alergias.trim() || undefined,
      medicacoes: medicacoes.trim() || undefined,
      fototipo: fototipo || 'Fototipo III',
      historico_clinico: consolidatedHistorico || 'Ficha clínica inicial cadastrada.',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Cadastrar Novo Cliente / Paciente
              </h3>
              <p className="text-xs text-indigo-200 font-medium">
                Prontuário clínico, anamnese e dados cadastrais da clínica
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
          
          {/* Nome */}
          <div>
            <label className="font-bold text-slate-800 block mb-1.5 flex items-center justify-between">
              <span>Nome Completo do Cliente *</span>
              <span className="text-[11px] text-indigo-600 font-medium">Obrigatório</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Ex: Mariana Vasconcelos Ribeiro"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium"
            />
          </div>

          {/* Telefone & CPF */}
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
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium"
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1.5 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                CPF / Documento (Opcional)
              </label>
              <input
                type="text"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium"
              />
            </div>
          </div>

          {/* Email & Data Nasc */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="font-bold text-slate-800 block mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                E-mail (Opcional)
              </label>
              <input
                type="email"
                placeholder="mariana@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
              />
            </div>

            <FieldWrapper campoId="cliente.data_nascimento" configuracaoCampos={configuracaoCampos}>
              <div>
                <label className="font-bold text-slate-800 block mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                />
              </div>
            </FieldWrapper>
          </div>

          {/* Fototipo & Queixa Principal */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="font-bold text-slate-800 block mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Fototipo Cutâneo
              </label>
              <select
                value={fototipo}
                onChange={(e) => setFototipo(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs font-semibold cursor-pointer"
              >
                <option value="Fototipo I">Fototipo I (Muito clara)</option>
                <option value="Fototipo II">Fototipo II (Clara)</option>
                <option value="Fototipo III">Fototipo III (Morena clara)</option>
                <option value="Fototipo IV">Fototipo IV (Morena moderada)</option>
                <option value="Fototipo V">Fototipo V (Morena escura)</option>
                <option value="Fototipo VI">Fototipo VI (Negra)</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-800 block mb-1.5 flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                Queixa Principal / Interesse Estético
              </label>
              <input
                type="text"
                placeholder="Ex: Toxina botulínica, rejuvenescimento facial, melasma..."
                value={queixaPrincipal}
                onChange={(e) => setQueixaPrincipal(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
              />
            </div>
          </div>

          {/* Alergias & Medicações */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="font-bold text-slate-800 block mb-1.5 flex items-center gap-1.5 text-amber-700">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                Alergias Conhecidas
              </label>
              <input
                type="text"
                placeholder="Ex: Lidocaína, látex, iodo..."
                value={alergias}
                onChange={(e) => setAlergias(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-amber-50/50 border border-amber-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                Medicamentos Contínuos
              </label>
              <input
                type="text"
                placeholder="Ex: Anticoagulantes, Roacutan..."
                value={medicacoes}
                onChange={(e) => setMedicacoes(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
              />
            </div>
          </div>

          {/* Histórico Clínico Complementar */}
          <FieldWrapper campoId="cliente.alergias" configuracaoCampos={configuracaoCampos}>
            <div>
              <label className="font-bold text-slate-800 block mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                Observações Clínicas & Procedimentos Prévios
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Já realizou preenchimento há 1 ano; histórico de herpes labial..."
                value={historicoClinico}
                onChange={(e) => setHistoricoClinico(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs resize-none"
              />
            </div>
          </FieldWrapper>

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
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all cursor-pointer text-xs sm:text-sm flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              <span>Salvar Cliente / Paciente</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
