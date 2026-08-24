import React, { useState } from 'react';
import { 
  X, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Sparkles, 
  Plus, 
  Check, 
  DollarSign, 
  FileText
} from 'lucide-react';
import { Agendamento, Paciente, StatusAgendamento } from '../types';
import { PROCEDIMENTOS_COMUNS } from '../data/mockData';

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  pacientes: Paciente[];
  onSaveAppointment: (novoAgendamento: Partial<Agendamento>) => void;
  onOpenNewPatient: () => void;
}

export const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({
  isOpen,
  onClose,
  pacientes,
  onSaveAppointment,
  onOpenNewPatient,
}) => {
  const [pacienteId, setPacienteId] = useState<string>(pacientes[0]?.id || '');
  const [procedimento, setProcedimento] = useState<string>(PROCEDIMENTOS_COMUNS[0]);
  const [customProc, setCustomProc] = useState<string>('');
  const [data, setData] = useState<string>(new Date().toISOString().split('T')[0]);
  const [hora, setHora] = useState<string>('14:00');
  const [duracao, setDuracao] = useState<number>(45);
  const [status, setStatus] = useState<StatusAgendamento>('confirmado');
  const [valor, setValor] = useState<string>('1200');
  const [observacoes, setObservacoes] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteId) return;

    const dataHoraIso = new Date(`${data}T${hora}:00`).toISOString();
    const finalProc = customProc.trim() ? customProc.trim() : procedimento;

    onSaveAppointment({
      paciente_id: pacienteId,
      data_hora: dataHoraIso,
      procedimento: finalProc,
      status: status,
      duracao_minutos: Number(duracao),
      valor_estimado: valor ? parseFloat(valor) : undefined,
      observacoes: observacoes.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-600 text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Novo Agendamento
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Preencha os dados do atendimento para o balcão
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

          {/* Procedimento */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1.5">
              Procedimento Estético *
            </label>
            <select
              value={procedimento}
              onChange={(e) => {
                setProcedimento(e.target.value);
                setCustomProc('');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 mb-2"
            >
              {PROCEDIMENTOS_COMUNS.map((proc) => (
                <option key={proc} value={proc}>
                  {proc}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Ou digite outro procedimento personalizado..."
              value={customProc}
              onChange={(e) => setCustomProc(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs"
            />
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

          {/* Status & Valor */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1.5">
                Status Inicial
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusAgendamento)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 capitalize"
              >
                <option value="confirmado">Confirmado</option>
                <option value="pendente">Pendente (Aguardando)</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1.5 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-green-600" />
                Valor Estimado (R$)
              </label>
              <input
                type="number"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="Ex: 1450"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
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
