import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Sparkles, 
  Plus, 
  Check, 
  DollarSign, 
  FileText,
  ShieldCheck,
  Layers,
  AlertCircle,
  Edit3
} from 'lucide-react';
import { Agendamento, Paciente, ProcedimentoClinico, StatusAgendamento, UsuarioEquipe } from '../types';

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  pacientes: Paciente[];
  procedimentos?: ProcedimentoClinico[];
  profissionais?: UsuarioEquipe[];
  initialData?: Partial<Agendamento> | null;
  onSave?: (novoAgendamento: Partial<Agendamento>) => void;
  onSaveAppointment?: (novoAgendamento: Partial<Agendamento>) => void;
  onOpenNewPatient?: () => void;
}

export const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({
  isOpen,
  onClose,
  pacientes = [],
  procedimentos = [],
  profissionais = [],
  initialData,
  onSave,
  onSaveAppointment,
  onOpenNewPatient,
}) => {
  // Lista de procedimentos ativos
  const availableProcedures = procedimentos.filter(p => p.ativo !== false);
  const adminProcedures = availableProcedures.length > 0 ? availableProcedures : procedimentos;

  const [pacienteId, setPacienteId] = useState<string>('');
  const [profissionalId, setProfissionalId] = useState<string>('');
  const [selectedProcId, setSelectedProcId] = useState<string>('');
  const [isCustomProc, setIsCustomProc] = useState<boolean>(false);
  const [customProcName, setCustomProcName] = useState<string>('');
  const [selectedVariationId, setSelectedVariationId] = useState<string>('');
  const [data, setData] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [hora, setHora] = useState<string>('14:00');
  const [duracao, setDuracao] = useState<number>(45);
  const [status, setStatus] = useState<StatusAgendamento>('confirmado');
  const [valor, setValor] = useState<string>('350');
  const [observacoes, setObservacoes] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Sincronização ao abrir o modal ou receber initialData
  useEffect(() => {
    if (!isOpen) {
      setFormError(null);
      return;
    }

    setFormError(null);

    // 1. Paciente ID
    if (initialData?.paciente_id) {
      setPacienteId(initialData.paciente_id);
    } else if (pacientes.length > 0) {
      // Se não tinha paciente selecionado ou o atual é inválido, pega o primeiro
      setPacienteId(prev => {
        if (prev && pacientes.some(p => p.id === prev)) return prev;
        return pacientes[0].id;
      });
    } else {
      setPacienteId('');
    }

    // 2. Profissional ID
    if (initialData?.profissional_id) {
      setProfissionalId(initialData.profissional_id);
    } else if (profissionais.length > 0) {
      setProfissionalId(prev => {
        if (prev && profissionais.some(pr => pr.id === prev)) return prev;
        return profissionais[0].id;
      });
    }

    // 3. Data e Hora
    if (initialData?.data_hora) {
      try {
        const d = new Date(initialData.data_hora);
        if (!isNaN(d.getTime())) {
          setData(d.toISOString().split('T')[0]);
          const hours = String(d.getHours()).padStart(2, '0');
          const minutes = String(d.getMinutes()).padStart(2, '0');
          setHora(`${hours}:${minutes}`);
        }
      } catch {
        // ignore
      }
    } else {
      const now = new Date();
      setData(now.toISOString().split('T')[0]);
    }

    // 4. Procedimento
    if (initialData?.procedimento) {
      const foundProc = adminProcedures.find(
        p => (p.nome || '').toLowerCase() === (initialData.procedimento || '').toLowerCase() ||
             p.id === initialData.procedimento
      );
      if (foundProc) {
        setSelectedProcId(foundProc.id);
        setIsCustomProc(false);
      } else {
        setIsCustomProc(true);
        setCustomProcName(initialData.procedimento);
      }
    } else if (adminProcedures.length > 0) {
      setSelectedProcId(adminProcedures[0].id);
      setIsCustomProc(false);
    } else {
      setIsCustomProc(true);
      setCustomProcName('Procedimento Estético');
    }

    // 5. Duração, Valor, Observações e Status
    if (initialData?.duracao_minutos) {
      setDuracao(initialData.duracao_minutos);
    }
    if (initialData?.valor_estimado !== undefined) {
      setValor(String(initialData.valor_estimado));
    }
    if (initialData?.observacoes) {
      setObservacoes(initialData.observacoes);
    }
    if (initialData?.status) {
      setStatus(initialData.status);
    }
  }, [isOpen, initialData, pacientes, profissionais, adminProcedures]);

  // Atualiza pacienteId caso a lista de pacientes mude
  useEffect(() => {
    if (isOpen && pacientes.length > 0 && !pacienteId) {
      setPacienteId(pacientes[0].id);
    }
  }, [isOpen, pacientes, pacienteId]);

  // Atualiza profissionalId caso a lista de profissionais mude
  useEffect(() => {
    if (isOpen && profissionais.length > 0 && !profissionalId) {
      setProfissionalId(profissionais[0].id);
    }
  }, [isOpen, profissionais, profissionalId]);

  // Procedimento atual selecionado do catálogo
  const currentProc = adminProcedures.find(p => p.id === selectedProcId) || adminProcedures[0];

  // Quando troca o procedimento do catálogo, atualiza valor e duração padrões
  useEffect(() => {
    if (!isCustomProc && currentProc) {
      setDuracao(currentProc.duracao_minutos || 45);
      setSelectedVariationId('');
      const defaultVal = currentProc.valor_promocional || currentProc.valor_tabela || currentProc.preco_sugerido || 0;
      setValor(String(defaultVal));
    }
  }, [selectedProcId, isCustomProc, currentProc]);

  const handleVariationChange = (varId: string) => {
    setSelectedVariationId(varId);
    if (currentProc?.variacoes) {
      const v = currentProc.variacoes.find(x => x.id === varId);
      if (v) {
        setValor(String(v.valor));
        if (v.duracao_minutos) setDuracao(v.duracao_minutos);
      }
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validação de Paciente
    if (!pacienteId) {
      setFormError('Por favor, selecione um paciente ou cadastre um novo cliente antes de agendar.');
      return;
    }

    // Validação de Data e Hora
    if (!data || !hora) {
      setFormError('Por favor, defina a data e o horário do agendamento.');
      return;
    }

    let dataHoraIso: string;
    try {
      const parsedDate = new Date(`${data}T${hora}:00`);
      if (isNaN(parsedDate.getTime())) {
        setFormError('Data ou horário inválidos.');
        return;
      }
      dataHoraIso = parsedDate.toISOString();
    } catch {
      setFormError('Erro ao processar data e horário.');
      return;
    }
    
    // Determinação do nome do procedimento
    let procedureName = 'Procedimento Estético';
    let contratoPadrao: string | undefined = undefined;

    if (isCustomProc) {
      procedureName = customProcName.trim() || 'Procedimento Estético';
    } else if (currentProc) {
      procedureName = currentProc.nome;
      contratoPadrao = currentProc.contrato_padrao;
      if (selectedVariationId && currentProc.variacoes) {
        const v = currentProc.variacoes.find(x => x.id === selectedVariationId);
        if (v) {
          procedureName = `${currentProc.nome} (${v.nome})`;
        }
      }
    }

    const selectedProf = profissionais.find(p => p.id === profissionalId);
    const saveFunction = onSave || onSaveAppointment;

    if (saveFunction) {
      saveFunction({
        paciente_id: pacienteId,
        data_hora: dataHoraIso,
        procedimento: procedureName,
        status: status,
        duracao_minutos: Number(duracao) || 45,
        valor_estimado: valor ? parseFloat(valor) : undefined,
        observacoes: observacoes.trim() || undefined,
        profissional_id: profissionalId || undefined,
        profissional_nome: selectedProf?.nome || undefined,
        profissional_cargo: selectedProf?.cargo || undefined,
        contrato_vinculado: contratoPadrao,
        contrato_assinado: false,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-8">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-xs">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Novo Agendamento Clínico
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Reserve horário, profissional e procedimento para o cliente
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {formError && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          
          {/* Paciente Select */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <User className="w-4 h-4 text-indigo-600" />
                <span>Cliente / Paciente *</span>
              </label>
              {onOpenNewPatient && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenNewPatient();
                  }}
                  className="text-[11px] text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer flex items-center gap-1 hover:underline"
                >
                  <Plus className="w-3 h-3" /> Cadastrar Novo Paciente
                </button>
              )}
            </div>

            {pacientes.length === 0 ? (
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs space-y-2">
                <p className="font-medium">Nenhum paciente cadastrado no sistema ainda.</p>
                {onOpenNewPatient && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenNewPatient();
                    }}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Cadastrar Primeiro Paciente Agora
                  </button>
                )}
              </div>
            ) : (
              <select
                value={pacienteId}
                onChange={(e) => {
                  setPacienteId(e.target.value);
                  setFormError(null);
                }}
                required
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
              >
                {pacientes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} — {p.telefone || 'Sem telefone'} {p.cpf ? `(CPF: ${p.cpf})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Profissional Responsável */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <User className="w-4 h-4 text-purple-600" />
              <span>Profissional Responsável *</span>
            </label>
            {profissionais.length > 0 ? (
              <select
                value={profissionalId}
                onChange={(e) => setProfissionalId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-medium"
              >
                {profissionais.map((prof) => (
                  <option key={prof.id} value={prof.id}>
                    {prof.nome} — {prof.cargo || 'Especialista'} ({prof.role === 'admin' || prof.role === 'admin_total' ? 'Responsável Técnico / Admin' : 'Profissional Clínico'})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value="Equipe Clínica"
                disabled
                className="w-full px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-medium cursor-not-allowed"
              />
            )}
          </div>

          {/* Procedimento (Catálogo ou Personalizado) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Procedimento / Serviço *</span>
              </label>
              
              {adminProcedures.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsCustomProc(!isCustomProc)}
                  className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer flex items-center gap-1 hover:underline"
                >
                  {isCustomProc ? (
                    <>
                      <Layers className="w-3 h-3" /> Escolher do Catálogo
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-3 h-3" /> Digitar Outro Serviço
                    </>
                  )}
                </button>
              )}
            </div>

            {isCustomProc || adminProcedures.length === 0 ? (
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={customProcName}
                  onChange={(e) => setCustomProcName(e.target.value)}
                  placeholder="Ex: Avaliação Facial, Harmonização, Limpeza de Pele..."
                  required
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                />
                <p className="text-[11px] text-slate-500">
                  {adminProcedures.length === 0 
                    ? 'Nenhum procedimento cadastrado no catálogo. Você pode digitar o nome livremente.' 
                    : 'Modo personalizado: digitando procedimento sob medida.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <select
                  value={selectedProcId}
                  onChange={(e) => setSelectedProcId(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                >
                  {adminProcedures.map((proc) => (
                    <option key={proc.id} value={proc.id}>
                      {proc.nome} — R$ {proc.valor_promocional || proc.valor_tabela || proc.preco_sugerido || 0} ({proc.categoria || 'Geral'})
                    </option>
                  ))}
                </select>

                {/* Variações do procedimento caso existam */}
                {currentProc?.variacoes && currentProc.variacoes.length > 0 && (
                  <div className="pl-2 border-l-2 border-indigo-200">
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Variação / Pacote do Procedimento:
                    </label>
                    <select
                      value={selectedVariationId}
                      onChange={(e) => handleVariationChange(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-indigo-50/50 border border-indigo-200 rounded-lg text-slate-800 text-xs font-medium focus:outline-none"
                    >
                      <option value="">Padrão (R$ {currentProc.valor_tabela || currentProc.preco_sugerido || 0})</option>
                      {currentProc.variacoes.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.nome} — R$ {v.valor} ({v.duracao_minutos || currentProc.duracao_minutos}min)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Data & Horário */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1.5 flex items-center gap-1">
                <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Data *</span>
              </label>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Horário *</span>
              </label>
              <input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
              />
            </div>
          </div>

          {/* Status, Duração & Valor */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusAgendamento)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 capitalize text-xs font-medium"
              >
                <option value="confirmado">Confirmado</option>
                <option value="pendente">Pendente</option>
                <option value="em_espera">Na Espera</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">
                Duração (min)
              </label>
              <input
                type="number"
                value={duracao}
                onChange={(e) => setDuracao(Number(e.target.value))}
                min={10}
                step={5}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1.5 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-green-600" />
                <span>Valor (R$)</span>
              </label>
              <input
                type="number"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="Ex: 350"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Observações / Recomendações</span>
            </label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Primeira sessão, paciente tem sensibilidade cutânea..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors cursor-pointer text-xs sm:text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pacientes.length === 0}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-semibold shadow-sm hover:shadow transition-all cursor-pointer text-xs sm:text-sm flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Confirmar Agendamento
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
