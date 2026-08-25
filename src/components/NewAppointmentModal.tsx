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
  Layers
} from 'lucide-react';
import { Agendamento, Paciente, ProcedimentoClinico, StatusAgendamento, UsuarioEquipe } from '../types';

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  pacientes: Paciente[];
  procedimentos?: ProcedimentoClinico[];
  profissionais?: UsuarioEquipe[];
  onSave?: (novoAgendamento: Partial<Agendamento>) => void;
  onSaveAppointment?: (novoAgendamento: Partial<Agendamento>) => void;
  onOpenNewPatient?: () => void;
}

export const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({
  isOpen,
  onClose,
  pacientes,
  procedimentos = [],
  profissionais = [],
  onSave,
  onSaveAppointment,
  onOpenNewPatient,
}) => {
  // Filter procedures registered by Admin only
  const adminProcedures = procedimentos.filter(p => p.ativo !== false && (p.cadastrado_por_admin !== false));

  const [pacienteId, setPacienteId] = useState<string>(pacientes[0]?.id || '');
  const [profissionalId, setProfissionalId] = useState<string>(profissionais[0]?.id || '');
  const [selectedProcId, setSelectedProcId] = useState<string>(adminProcedures[0]?.id || '');
  const [selectedVariationId, setSelectedVariationId] = useState<string>('');
  const [data, setData] = useState<string>(new Date().toISOString().split('T')[0]);
  const [hora, setHora] = useState<string>('14:00');
  const [duracao, setDuracao] = useState<number>(45);
  const [status, setStatus] = useState<StatusAgendamento>('confirmado');
  const [valor, setValor] = useState<string>('1200');
  const [observacoes, setObservacoes] = useState<string>('');

  const currentProc = adminProcedures.find(p => p.id === selectedProcId) || adminProcedures[0];

  useEffect(() => {
    if (profissionais.length > 0 && !profissionalId) {
      setProfissionalId(profissionais[0].id);
    }
  }, [profissionais, profissionalId]);

  useEffect(() => {
    if (adminProcedures.length > 0 && !selectedProcId) {
      setSelectedProcId(adminProcedures[0].id);
    }
  }, [adminProcedures, selectedProcId]);

  useEffect(() => {
    if (currentProc) {
      setDuracao(currentProc.duracao_minutos || 45);
      if (currentProc.variacoes && currentProc.variacoes.length > 0) {
        const firstVar = currentProc.variacoes[0];
        setSelectedVariationId(firstVar.id);
        setValor(String(firstVar.valor));
      } else {
        setSelectedVariationId('');
        const defaultVal = currentProc.valor_promocional || currentProc.valor_tabela || 0;
        setValor(String(defaultVal));
      }
    }
  }, [selectedProcId]);

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
    if (!pacienteId) return;

    const dataHoraIso = new Date(`${data}T${hora}:00`).toISOString();
    
    let procedureName = currentProc?.nome || 'Procedimento Clínico';
    if (selectedVariationId && currentProc?.variacoes) {
      const v = currentProc.variacoes.find(x => x.id === selectedVariationId);
      if (v) {
        procedureName = `${currentProc.nome} (${v.nome})`;
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
        duracao_minutos: Number(duracao),
        valor_estimado: valor ? parseFloat(valor) : undefined,
        observacoes: observacoes.trim() || undefined,
        profissional_id: profissionalId || undefined,
        profissional_nome: selectedProf?.nome || undefined,
        profissional_cargo: selectedProf?.cargo || undefined,
        contrato_vinculado: currentProc?.contrato_padrao || undefined,
        contrato_assinado: false,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Novo Agendamento
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Catálogo exclusivo de procedimentos aprovados pela administração
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          
          {/* Paciente Select */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <User className="w-4 h-4 text-indigo-600" />
                <span>Paciente *</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenNewPatient();
                }}
                className="text-[11px] text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
              >
                + Cadastrar Novo Paciente
              </button>
            </div>
            <select
              value={pacienteId}
              onChange={(e) => setPacienteId(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              {pacientes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} — {p.telefone}
                </option>
              ))}
            </select>
          </div>

          {/* Profissional Responsável */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <User className="w-4 h-4 text-purple-600" />
              <span>Profissional Responsável pelo Atendimento *</span>
            </label>
            <select
              value={profissionalId}
              onChange={(e) => setProfissionalId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-medium"
            >
              {profissionais.map((prof) => (
                <option key={prof.id} value={prof.id}>
                  {prof.nome} — {prof.cargo} ({prof.role === 'admin' ? 'Responsável Técnico / Admin' : 'Profissional Clínico'})
                </option>
              ))}
            </select>
          </div>

          {/* Procedimento (Admin-only registered procedures) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Procedimento do Catálogo Oficial (Admin) *</span>
              </label>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
                {adminProcedures.length} disponíveis
              </span>
            </div>
            
            {adminProcedures.length === 0 ? (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-800 text-xs">
                Nenhum procedimento cadastrado por administradores foi encontrado no catálogo. Cadastre no módulo Estoque & Procedimentos.
              </div>
            ) : (
              <select
                value={selectedProcId}
                onChange={(e) => setSelectedProcId(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 mb-2"
              >
                {adminProcedures.map((proc) => (
                  <option key={proc.id} value={proc.id}>
                    {proc.nome} — R$ {proc.valor_promocional || proc.valor_tabela} ({proc.categoria})
                  </option>
                ))}
              </select>
            )}

            {/* 3-Tier Variations Option if procedure has variations */}
            {currentProc?.variacoes && currentProc.variacoes.length > 0 && (
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-1.5 mt-2">
                <label className="text-[11px] font-bold text-indigo-900 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  Variação / Nível de Aplicação:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {currentProc.variacoes.map((v) => {
                    const isSelected = selectedVariationId === v.id;
                    return (
                      <button
                        type="button"
                        key={v.id}
                        onClick={() => handleVariationChange(v.id)}
                        className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        <div className="text-[11px] font-bold truncate">{v.nome}</div>
                        <div className={`text-xs font-mono font-semibold ${isSelected ? 'text-indigo-100' : 'text-emerald-700'}`}>
                          R$ {v.valor}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Data & Horário */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1.5 flex items-center gap-1">
                <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                Data *
              </label>
              <input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Horário *
              </label>
              <input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
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
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 capitalize text-xs"
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
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1.5 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-green-600" />
                Valor (R$)
              </label>
              <input
                type="number"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="Ex: 1450"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Observações / Instruções Clínicas
            </label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Paciente sensível, aplicar anestésico 20min antes..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs resize-none"
            />
          </div>

          {/* Buttons */}
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
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg font-semibold shadow-sm transition-colors cursor-pointer"
            >
              Confirmar Agendamento
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
