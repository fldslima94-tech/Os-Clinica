import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserCheck, 
  DollarSign, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  User, 
  Sparkles, 
  CreditCard, 
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CalendarPlus
} from 'lucide-react';
import { Agendamento, FormaPagamento, StatusPagamento, UsuarioEquipe, Paciente } from '../types';

interface CheckInPaymentAndReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  agendamento: Agendamento | null;
  paciente?: Paciente;
  profissionais?: UsuarioEquipe[];
  onConfirmCheckIn: (data: {
    agendamentoId: string;
    pagamento: {
      valor: number;
      forma: FormaPagamento;
      status: StatusPagamento;
      observacao?: string;
    };
    agendarRetorno: boolean;
    dadosRetorno?: {
      data_hora: string;
      procedimento: string;
      duracao_minutos: number;
      profissional_id?: string;
      profissional_nome?: string;
      observacoes?: string;
    };
  }) => void;
}

export const CheckInPaymentAndReturnModal: React.FC<CheckInPaymentAndReturnModalProps> = ({
  isOpen,
  onClose,
  agendamento,
  paciente,
  profissionais = [],
  onConfirmCheckIn,
}) => {
  const [valor, setValor] = useState<number>(agendamento?.valor_estimado || 1200);
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>(agendamento?.forma_pagamento || 'pix');
  const [statusPagamento, setStatusPagamento] = useState<StatusPagamento>('pago');
  const [obsPagamento, setObsPagamento] = useState<string>('Pagamento confirmado no check-in da recepção.');
  
  // Return Scheduling State
  const [agendarRetorno, setAgendarRetorno] = useState<boolean>(true);
  const [diasRetorno, setDiasRetorno] = useState<number>(15);
  const [dataRetorno, setDataRetorno] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().slice(0, 10);
  });
  const [horaRetorno, setHoraRetorno] = useState<string>('14:30');
  const [duracaoRetorno, setDuracaoRetorno] = useState<number>(30);
  const [procedimentoRetorno, setProcedimentoRetorno] = useState<string>('');
  const [profissionalRetornoId, setProfissionalRetornoId] = useState<string>('');
  const [obsRetorno, setObsRetorno] = useState<string>('Retorno de revisão e acompanhamento pós-procedimento.');

  useEffect(() => {
    if (agendamento) {
      setValor(agendamento.valor_estimado || 1200);
      setFormaPagamento(agendamento.forma_pagamento || 'pix');
      setStatusPagamento('pago');
      setProcedimentoRetorno(`Revisão / Retorno de ${agendamento.procedimento}`);
      setProfissionalRetornoId(agendamento.profissional_id || (profissionais[0]?.id || ''));

      // Set return date 15 days from today
      const d = new Date();
      d.setDate(d.getDate() + 15);
      setDataRetorno(d.toISOString().slice(0, 10));
    }
  }, [agendamento, profissionais]);

  if (!isOpen || !agendamento) return null;

  const patientName = agendamento.paciente?.nome || paciente?.nome || 'Paciente';

  const handleShortcutDays = (days: number) => {
    setDiasRetorno(days);
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDataRetorno(d.toISOString().slice(0, 10));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedProf = profissionais.find(p => p.id === profissionalRetornoId);

    onConfirmCheckIn({
      agendamentoId: agendamento.id,
      pagamento: {
        valor: Number(valor),
        forma: formaPagamento,
        status: statusPagamento,
        observacao: obsPagamento.trim() || undefined,
      },
      agendarRetorno,
      dadosRetorno: agendarRetorno ? {
        data_hora: new Date(`${dataRetorno}T${horaRetorno}:00`).toISOString(),
        procedimento: procedimentoRetorno || `Revisão de ${agendamento.procedimento}`,
        duracao_minutos: duracaoRetorno,
        profissional_id: profissionalRetornoId || agendamento.profissional_id,
        profissional_nome: selectedProf?.nome || agendamento.profissional_nome,
        observacoes: obsRetorno.trim() || undefined,
      } : undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-amber-500 via-amber-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                  Check-in na Recepção
                </span>
                <span className="text-[10px] bg-emerald-400 text-slate-950 font-bold px-2 py-0.5 rounded-full">
                  Chegada Confirmada
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">
                Confirmar Chegada & Lançar Pagamento
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs sm:text-sm max-h-[80vh] overflow-y-auto">
          
          {/* Patient & Procedure Summary Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Paciente</div>
              <div className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                <User className="w-4 h-4 text-indigo-600" />
                <span>{patientName}</span>
              </div>
              <div className="text-xs text-slate-600 mt-1">
                <strong>Procedimento:</strong> {agendamento.procedimento}
              </div>
              {agendamento.profissional_nome && (
                <div className="text-xs text-indigo-700 font-medium mt-0.5">
                  <strong>Profissional:</strong> {agendamento.profissional_nome}
                </div>
              )}
            </div>

            <div className="bg-white px-3 py-2 rounded-lg border border-slate-200 text-right shrink-0">
              <div className="text-[10px] uppercase font-bold text-slate-400">Status da Fila</div>
              <div className="text-xs font-bold text-amber-600 flex items-center gap-1 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span>Sala de Espera</span>
              </div>
            </div>
          </div>

          {/* 1. SEÇÃO DE PAGAMENTO */}
          <div className="border border-emerald-200 bg-emerald-50/40 rounded-xl p-4 space-y-3.5">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-600 text-white">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-emerald-950 text-xs sm:text-sm">1. Pagamento do Procedimento</h4>
                  <p className="text-[11px] text-emerald-700">Registre o recebimento no ato da chegada do paciente</p>
                </div>
              </div>
              <span className="text-xs bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-md">
                Obrigatório
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Valor */}
              <div>
                <label className="font-bold text-slate-700 block mb-1 text-[11px] uppercase tracking-wide">
                  Valor a Pagar (R$) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={valor}
                    onChange={(e) => setValor(parseFloat(e.target.value) || 0)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-emerald-800 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Forma de Pagamento */}
              <div>
                <label className="font-bold text-slate-700 block mb-1 text-[11px] uppercase tracking-wide">
                  Forma de Pagamento *
                </label>
                <select
                  value={formaPagamento}
                  onChange={(e) => setFormaPagamento(e.target.value as FormaPagamento)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                >
                  <option value="pix">⚡ PIX (Instantâneo)</option>
                  <option value="cartao_credito">💳 Cartão de Crédito</option>
                  <option value="cartao_debito">💳 Cartão de Débito</option>
                  <option value="dinheiro">💵 Dinheiro em Espécie</option>
                  <option value="transferencia">🏦 Transferência Bancária</option>
                </select>
              </div>
            </div>

            {/* Status do Pagamento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="font-bold text-slate-700 block mb-1 text-[11px] uppercase tracking-wide">
                  Status da Quitação
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStatusPagamento('pago')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                      statusPagamento === 'pago'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Pago Total</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusPagamento('pendente')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer flex items-center justify-center gap-1 ${
                      statusPagamento === 'pendente'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>Pendente</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 text-[11px] uppercase tracking-wide">
                  Observações do Recibo
                </label>
                <input
                  type="text"
                  placeholder="Ex: Pago via QR Code Pix no balcão"
                  value={obsPagamento}
                  onChange={(e) => setObsPagamento(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* 2. SEÇÃO DE RETORNO / PRÓXIMO AGENDAMENTO */}
          <div className="border border-indigo-200 bg-indigo-50/40 rounded-xl p-4 space-y-3.5">
            <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
                  <CalendarPlus className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-indigo-950 text-xs sm:text-sm">2. Retorno & Novo Agendamento</h4>
                  <p className="text-[11px] text-indigo-700">Garanta a fidelização e revisão clínica pós-procedimento</p>
                </div>
              </div>

              <label className="inline-flex items-center gap-2 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-indigo-200 text-xs font-bold text-indigo-900">
                <input
                  type="checkbox"
                  checked={agendarRetorno}
                  onChange={(e) => setAgendarRetorno(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Agendar Agora</span>
              </label>
            </div>

            {agendarRetorno ? (
              <div className="space-y-3 pt-1">
                {/* Atalhos Rápidos de Prazo */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-[11px] uppercase tracking-wide">
                    Sugestão de Intervalo Clínico
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { days: 15, label: '+15 dias (Retoque Toxina)' },
                      { days: 30, label: '+30 dias (Próxima Sessão)' },
                      { days: 45, label: '+45 dias' },
                      { days: 60, label: '+60 dias (Reavaliação)' },
                    ].map((btn) => (
                      <button
                        key={btn.days}
                        type="button"
                        onClick={() => handleShortcutDays(btn.days)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors cursor-pointer ${
                          diasRetorno === btn.days
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-white text-indigo-800 border-indigo-200 hover:bg-indigo-50'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Data e Hora do Retorno */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-700 block mb-1 text-[11px] uppercase tracking-wide flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      Data do Retorno *
                    </label>
                    <input
                      type="date"
                      required={agendarRetorno}
                      value={dataRetorno}
                      onChange={(e) => setDataRetorno(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-[11px] uppercase tracking-wide flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      Horário *
                    </label>
                    <input
                      type="time"
                      required={agendarRetorno}
                      value={horaRetorno}
                      onChange={(e) => setHoraRetorno(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Profissional e Procedimento do Retorno */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-[11px] uppercase tracking-wide">
                      Profissional do Retorno
                    </label>
                    <select
                      value={profissionalRetornoId}
                      onChange={(e) => setProfissionalRetornoId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                    >
                      {profissionais.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nome} ({p.cargo})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1 text-[11px] uppercase tracking-wide">
                      Tipo de Retorno / Motivo
                    </label>
                    <input
                      type="text"
                      value={procedimentoRetorno}
                      onChange={(e) => setProcedimentoRetorno(e.target.value)}
                      placeholder="Ex: Revisão de Toxina / Retoque 15 dias"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1 text-[11px] uppercase tracking-wide">
                    Observações para a Próxima Consulta
                  </label>
                  <input
                    type="text"
                    value={obsRetorno}
                    onChange={(e) => setObsRetorno(e.target.value)}
                    placeholder="Ex: Avaliar simetria e necessidade de pontos de retoque"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 bg-white/70 border border-slate-200 rounded-lg text-center text-xs text-slate-500">
                Retorno não será agendado no momento. Poderá ser cadastrado posteriormente no módulo de Agendamentos ou Retornos Pós.
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer inline-flex items-center gap-2 text-xs sm:text-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar Chegada, Pagamento & Retorno</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
