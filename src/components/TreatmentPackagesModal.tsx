import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  ArrowRight, 
  Sparkles, 
  X, 
  Check, 
  RotateCcw,
  Percent,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { Paciente, PacoteTratamento } from '../types';

interface TreatmentPackagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  paciente: Paciente;
  onUpdatePaciente: (paciente: Paciente) => void;
}

const PACOTES_PREDEFINIDOS = [
  { nome: 'Protocolo Glúteo Max & Firmeza', procedimento: 'Bioestimulador Glúteo + Radiofrequência', sessoes: 5, valor: 4500 },
  { nome: 'Laser Lavieen Glow BB Laser', procedimento: 'Laser Lavieen Fracionado', sessoes: 3, valor: 2100 },
  { nome: 'Protocolo Full Face Rejuvenescimento', procedimento: 'Botox + Bioestimulador + Skinbooster', sessoes: 4, valor: 5800 },
  { nome: 'Drenagem Linfática Pós-Procedimento', procedimento: 'Drenagem Linfática Corporal', sessoes: 10, valor: 1500 },
  { nome: 'Microagulhamento Drug Delivery Facial', procedimento: 'Microagulhamento com Fatores de Crescimento', sessoes: 3, valor: 1800 },
];

export const TreatmentPackagesModal: React.FC<TreatmentPackagesModalProps> = ({
  isOpen,
  onClose,
  paciente,
  onUpdatePaciente,
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [nomePacote, setNomePacote] = useState('');
  const [procedimento, setProcedimento] = useState('');
  const [totalSessoes, setTotalSessoes] = useState<number>(5);
  const [valorTotal, setValorTotal] = useState<number>(2500);
  const [observacoes, setObservacoes] = useState('');

  if (!isOpen) return null;

  const pacotes = paciente.pacotes || [];

  const handleSelectPredefined = (pre: typeof PACOTES_PREDEFINIDOS[0]) => {
    setNomePacote(pre.nome);
    setProcedimento(pre.procedimento);
    setTotalSessoes(pre.sessoes);
    setValorTotal(pre.valor);
  };

  const handleCreatePacote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomePacote.trim() || totalSessoes <= 0) return;

    const novoPacote: PacoteTratamento = {
      id: `pack-${Date.now()}`,
      nome_pacote: nomePacote.trim(),
      procedimento: procedimento.trim() || nomePacote.trim(),
      total_sessoes: totalSessoes,
      sessoes_realizadas: 0,
      valor_total: valorTotal,
      status: 'em_andamento',
      data_inicio: new Date().toISOString(),
      observacoes: observacoes.trim() || undefined,
    };

    const pacotesAtualizados = [...pacotes, novoPacote];
    onUpdatePaciente({
      ...paciente,
      pacotes: pacotesAtualizados,
    });

    setIsAddingNew(false);
    setNomePacote('');
    setProcedimento('');
    setObservacoes('');
  };

  const handleAdvanceSession = (pacoteId: string) => {
    const pacotesAtualizados = pacotes.map(p => {
      if (p.id === pacoteId) {
        const realizadas = p.sessoes_realizadas + 1;
        const concluido = realizadas >= p.total_sessoes;
        return {
          ...p,
          sessoes_realizadas: realizadas,
          status: concluido ? ('concluido' as const) : p.status,
          ultima_sessao: new Date().toISOString(),
        };
      }
      return p;
    });

    onUpdatePaciente({
      ...paciente,
      pacotes: pacotesAtualizados,
    });
  };

  const handleResetSession = (pacoteId: string) => {
    const pacotesAtualizados = pacotes.map(p => {
      if (p.id === pacoteId && p.sessoes_realizadas > 0) {
        return {
          ...p,
          sessoes_realizadas: p.sessoes_realizadas - 1,
          status: 'em_andamento' as const,
        };
      }
      return p;
    });

    onUpdatePaciente({
      ...paciente,
      pacotes: pacotesAtualizados,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 flex flex-col">
        
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Pacotes & Planos de Sessões
              </h2>
              <p className="text-xs text-slate-500">
                Paciente: <strong className="text-slate-800">{paciente.nome}</strong> • Controle automático de saldo de sessões
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 flex-1">
          
          {/* Active Packages List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Pacotes Contratados ({pacotes.length})
              </h3>
              {!isAddingNew && (
                <button
                  onClick={() => setIsAddingNew(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Pacote / Plano</span>
                </button>
              )}
            </div>

            {pacotes.length === 0 && !isAddingNew ? (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-700">Nenhum pacote contratado ainda</p>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Crie planos de tratamento com múltiplas sessões (ex: Laser, Bioestimulador, Drenagem) para abater a cada visita.
                </p>
                <button
                  onClick={() => setIsAddingNew(true)}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Primeiro Pacote</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pacotes.map((pacote) => {
                  const percent = Math.round((pacote.sessoes_realizadas / pacote.total_sessoes) * 100);
                  const isDone = pacote.sessoes_realizadas >= pacote.total_sessoes;
                  const restam = pacote.total_sessoes - pacote.sessoes_realizadas;

                  return (
                    <div
                      key={pacote.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isDone
                          ? 'bg-slate-50/70 border-slate-200'
                          : 'bg-white border-purple-200/80 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border inline-block mb-1 ${
                            isDone 
                              ? 'bg-slate-100 text-slate-600 border-slate-200' 
                              : 'bg-purple-50 text-purple-700 border-purple-200'
                          }`}>
                            {isDone ? 'Concluído' : 'Em Andamento'}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 leading-tight">
                            {pacote.nome_pacote}
                          </h4>
                          <p className="text-xs text-slate-500">{pacote.procedimento}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-900 block">
                            {pacote.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {restam === 0 ? 'Plano finalizado' : `Restam ${restam} sessões`}
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="my-3">
                        <div className="flex items-center justify-between text-xs mb-1 font-semibold">
                          <span className="text-slate-700">
                            Sessão {pacote.sessoes_realizadas} de {pacote.total_sessoes}
                          </span>
                          <span className="text-purple-600 font-bold">{percent}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <div
                            className={`h-full transition-all duration-300 ${isDone ? 'bg-emerald-500' : 'bg-purple-600'}`}
                            style={{ width: `${Math.min(percent, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="text-[11px] text-slate-400">
                          {pacote.ultima_sessao 
                            ? `Última: ${new Date(pacote.ultima_sessao).toLocaleDateString('pt-BR')}`
                            : `Início: ${new Date(pacote.data_inicio).toLocaleDateString('pt-BR')}`}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {pacote.sessoes_realizadas > 0 && (
                            <button
                              type="button"
                              onClick={() => handleResetSession(pacote.id)}
                              className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100"
                              title="Desfazer última sessão"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                          
                          {!isDone ? (
                            <button
                              type="button"
                              onClick={() => handleAdvanceSession(pacote.id)}
                              className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Abater +1 Sessão</span>
                            </button>
                          ) : (
                            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Todas Feitas</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Form to add new package */}
          {isAddingNew && (
            <form onSubmit={handleCreatePacote} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Cadastrar Novo Pacote de Tratamento
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Cancelar
                </button>
              </div>

              {/* Suggestions chips */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                  Sugestões Rápidas de Pacotes:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {PACOTES_PREDEFINIDOS.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectPredefined(p)}
                      className="px-2 py-1 bg-white hover:bg-purple-50 text-slate-700 hover:text-purple-700 border border-slate-200 hover:border-purple-300 rounded-md text-[11px] font-medium transition-colors text-left"
                    >
                      + {p.nome} ({p.sessoes}x)
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome do Pacote *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Protocolo Lavieen 3 Sessões"
                    value={nomePacote}
                    onChange={(e) => setNomePacote(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Procedimento / Técnica *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Laser Lavieen Fracionado"
                    value={procedimento}
                    onChange={(e) => setProcedimento(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total de Sessões Contratadas *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={totalSessoes}
                    onChange={(e) => setTotalSessoes(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Valor Total do Pacote (R$) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    required
                    value={valorTotal}
                    onChange={(e) => setValorTotal(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 shadow-xs"
                >
                  Salvar Pacote
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>O abatimento de sessões também é integrado no momento da conclusão da consulta.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
