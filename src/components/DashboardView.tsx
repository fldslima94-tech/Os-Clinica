import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Hourglass, 
  AlertTriangle, 
  Plus, 
  Package, 
  Phone, 
  User, 
  ChevronRight, 
  Sparkles, 
  MessageCircle,
  FileText,
  Filter,
  Check,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { Agendamento, EstoqueInsumo, Paciente, StatusAgendamento } from '../types';

interface DashboardViewProps {
  agendamentos: Agendamento[];
  estoque: EstoqueInsumo[];
  pacientes: Paciente[];
  onOpenNewAppointment: () => void;
  onOpenNewPatient: () => void;
  onOpenNewInventory: () => void;
  onUpdateStatus: (agendamentoId: string, novoStatus: StatusAgendamento) => void;
  onViewPatient: (paciente: Paciente) => void;
  onGoToEstoque: () => void;
  onOpenCompleteModal?: (agendamento: Agendamento) => void;
  searchQuery: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  agendamentos,
  estoque,
  pacientes,
  onOpenNewAppointment,
  onOpenNewPatient,
  onOpenNewInventory,
  onUpdateStatus,
  onViewPatient,
  onGoToEstoque,
  onOpenCompleteModal,
  searchQuery,
}) => {
  const [statusFilter, setStatusFilter] = useState<'todos' | StatusAgendamento>('todos');

  // Filter low stock items
  const lowStockItems = estoque.filter(item => item.quantidade <= item.alerta_minimo);

  // Filter today's appointments based on search and status
  const filteredAgendamentos = agendamentos.filter(ag => {
    const matchesStatus = statusFilter === 'todos' || ag.status === statusFilter;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesStatus;

    const patientName = ag.paciente?.nome.toLowerCase() || '';
    const procName = ag.procedimento.toLowerCase();
    const phone = ag.paciente?.telefone.toLowerCase() || '';

    return matchesStatus && (patientName.includes(query) || procName.includes(query) || phone.includes(query));
  });

  // Calculate quick metrics
  const totalToday = agendamentos.length;
  const confirmedCount = agendamentos.filter(a => a.status === 'confirmado').length;
  const pendingCount = agendamentos.filter(a => a.status === 'pendente').length;
  const completedCount = agendamentos.filter(a => a.status === 'concluido').length;

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '--:--';
    }
  };

  const handleConclude = (ag: Agendamento) => {
    if (onOpenCompleteModal) {
      onOpenCompleteModal(ag);
    } else {
      onUpdateStatus(ag.id, 'concluido');
    }
  };

  const getStatusBadge = (status: StatusAgendamento) => {
    switch (status) {
      case 'confirmado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200/60">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            Confirmado
          </span>
        );
      case 'pendente':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
            <Hourglass className="w-3.5 h-3.5 text-amber-600" />
            Pendente
          </span>
        );
      case 'concluido':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            <Check className="w-3.5 h-3.5 text-slate-500" />
            Concluído
          </span>
        );
      case 'cancelado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200">
            <XCircle className="w-3.5 h-3.5 text-red-500" />
            Cancelado
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. TOP STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Card 1: Total do Dia */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-xs font-bold uppercase mb-1 tracking-wider">Agendamentos Hoje</div>
            <div className="text-2xl font-bold text-slate-900">{totalToday}</div>
            <p className="text-xs text-slate-400 mt-1">{completedCount} finalizados</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Confirmados */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-xs font-bold uppercase mb-1 tracking-wider">Confirmados</div>
            <div className="text-2xl font-bold text-green-600">{confirmedCount}</div>
            <p className="text-xs text-slate-400 mt-1">Prontos para atendimento</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center text-green-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Pendentes */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-xs font-bold uppercase mb-1 tracking-wider">Aguardando Confirmação</div>
            <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
            <p className="text-xs text-slate-400 mt-1">Contatar via WhatsApp</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Hourglass className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Alertas de Estoque */}
        <div 
          onClick={onGoToEstoque}
          className={`bg-white p-5 rounded-xl border shadow-sm transition-all cursor-pointer flex items-center justify-between ${
            lowStockItems.length > 0
              ? 'border-l-4 border-l-amber-400 border-slate-200 hover:bg-slate-50'
              : 'border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div>
            <div className="text-slate-400 text-xs font-bold uppercase mb-1 tracking-wider">Alertas de Estoque</div>
            <div className="text-2xl font-bold text-amber-600">
              {lowStockItems.length.toString().padStart(2, '0')}
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <span>{lowStockItems.length > 0 ? 'Reposição necessária' : 'Estoque regular'}</span>
              <ChevronRight className="w-3 h-3 text-slate-400" />
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* 2. LOW STOCK ALERT BANNER */}
      {lowStockItems.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-800 uppercase text-xs sm:text-sm tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Alertas de Estoque ({lowStockItems.length} itens críticos)</span>
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenNewInventory}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                + Entrada de Insumo
              </button>
              <button
                onClick={onGoToEstoque}
                className="px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <span>Inventário Completo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockItems.map(item => (
              <div 
                key={item.id}
                className="p-3 bg-amber-50/80 border border-amber-100 rounded-lg flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-semibold text-amber-900">{item.nome_item}</div>
                  <div className="text-xs text-amber-700 mt-0.5">
                    Restam apenas <strong>{item.quantidade} {item.unidade_medida}</strong> (mín: {item.alerta_minimo})
                  </div>
                </div>
                <button 
                  onClick={onGoToEstoque}
                  className="bg-white border border-amber-200 text-amber-600 p-1.5 rounded-md hover:bg-amber-50 cursor-pointer shadow-2xs"
                  title="Gerenciar insumo"
                >
                  <Package className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. MAIN SECTION: TODAY'S APPOINTMENTS (BALCÃO DE RECEPÇÃO) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        
        {/* Section Header with Filters */}
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-800 uppercase text-sm tracking-wider">
                Próximos Horários & Agendamentos
              </h2>
              <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full border border-slate-200">
                {filteredAgendamentos.length}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Fluxo em tempo real para controle de recepção e atendimentos da clínica
            </p>
          </div>

          {/* Status Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setStatusFilter('todos')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                statusFilter === 'todos'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({totalToday})
            </button>
            <button
              onClick={() => setStatusFilter('confirmado')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                statusFilter === 'confirmado'
                  ? 'bg-white text-green-700 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Confirmados ({confirmedCount})
            </button>
            <button
              onClick={() => setStatusFilter('pendente')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                statusFilter === 'pendente'
                  ? 'bg-white text-amber-700 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pendentes ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('concluido')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                statusFilter === 'concluido'
                  ? 'bg-white text-slate-800 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Concluídos ({completedCount})
            </button>
          </div>
        </div>

        {/* Appointment Table / List */}
        {filteredAgendamentos.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">Nenhum agendamento encontrado</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery 
                ? 'Nenhum resultado para a busca aplicada. Tente limpar os filtros.'
                : 'Não há agendamentos cadastrados com o status selecionado para hoje.'}
            </p>
            <button
              onClick={onOpenNewAppointment}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Novo Agendamento
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Horário</th>
                  <th className="px-6 py-3">Paciente</th>
                  <th className="px-6 py-3">Procedimento</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Observações</th>
                  <th className="px-6 py-3 text-right">Ações de Recepção</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredAgendamentos.map((ag) => {
                  const patient = ag.paciente || pacientes.find(p => p.id === ag.paciente_id);
                  const isPending = ag.status === 'pendente';

                  return (
                    <tr 
                      key={ag.id} 
                      className={`hover:bg-slate-50 transition-colors ${
                        isPending ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      {/* Horário */}
                      <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 font-mono font-semibold text-xs">
                            {formatTime(ag.data_hora)}
                          </span>
                          {ag.duracao_minutos && (
                            <span className="text-[11px] text-slate-400">
                              {ag.duracao_minutos} min
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Paciente */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 text-slate-700 font-semibold flex items-center justify-center text-xs shrink-0">
                            {patient?.nome.substring(0, 2).toUpperCase() || 'PA'}
                          </div>
                          <div>
                            <button
                              onClick={() => patient && onViewPatient(patient)}
                              className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors text-left cursor-pointer flex items-center gap-1"
                            >
                              <span>{patient?.nome || 'Paciente não identificado'}</span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                            <div className="flex items-center gap-2 mt-0.5 text-slate-500 text-xs">
                              <span>{patient?.telefone}</span>
                              {patient?.telefone && (
                                <a
                                  href={`https://wa.me/55${patient.telefone.replace(/\D/g, '')}?text=Olá%20${encodeURIComponent(patient.nome)},%20confirmamos%20seu%20horário%20hoje%20às%20${formatTime(ag.data_hora)}%20na%20EstéticaOS?`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Enviar mensagem no WhatsApp"
                                  className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 transition-colors"
                                >
                                  <MessageCircle className="w-3 h-3 text-emerald-600" />
                                  <span>WhatsApp</span>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Procedimento */}
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-800 block">
                          {ag.procedimento}
                        </span>
                        {ag.valor_estimado && (
                          <span className="text-xs text-slate-500">
                            R$ {ag.valor_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(ag.status)}
                      </td>

                      {/* Observações / Histórico Clínico */}
                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-xs text-slate-500 truncate" title={ag.observacoes || patient?.historico_clinico}>
                          {ag.observacoes || (patient?.historico_clinico ? `Histórico: ${patient.historico_clinico}` : 'Nenhuma observação.')}
                        </p>
                      </td>

                      {/* Ações Rápidas */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {ag.status === 'pendente' && (
                            <button
                              onClick={() => onUpdateStatus(ag.id, 'confirmado')}
                              title="Confirmar Agendamento"
                              className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md text-xs font-semibold shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              <span>Confirmar</span>
                            </button>
                          )}

                          {ag.status !== 'concluido' && (
                            <button
                              onClick={() => handleConclude(ag)}
                              title="Marcar como Concluído e dar Baixa"
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Concluir</span>
                            </button>
                          )}

                          {ag.status !== 'cancelado' && ag.status !== 'concluido' && (
                            <button
                              onClick={() => onUpdateStatus(ag.id, 'cancelado')}
                              title="Cancelar Horário"
                              className="px-2 py-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md text-xs transition-colors cursor-pointer font-medium"
                            >
                              Cancelar
                            </button>
                          )}

                          {patient && (
                            <button
                              onClick={() => onViewPatient(patient)}
                              title="Ver Prontuário"
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>* Concluir um atendimento desconta os insumos automaticamente do estoque e gera lançamento financeiro.</span>
          <button 
            onClick={onOpenNewAppointment}
            className="text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
          >
            + Agendar Paciente
          </button>
        </div>

      </div>

      {/* 4. BALCÃO QUICK ACTIONS BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div 
          onClick={onOpenNewAppointment}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer flex items-center gap-4 group"
        >
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors flex items-center justify-center shrink-0">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Novo Agendamento Rápido
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Marcar procedimento com horário e paciente
            </p>
          </div>
        </div>

        <div 
          onClick={onOpenNewPatient}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition-all cursor-pointer flex items-center gap-4 group"
        >
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors flex items-center justify-center shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-slate-800 transition-colors">
              Cadastrar Novo Paciente
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Prontuário, fotos, TCLE e anamnese
            </p>
          </div>
        </div>

        <div 
          onClick={onOpenNewInventory}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-amber-300 hover:shadow-sm transition-all cursor-pointer flex items-center gap-4 group"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-colors flex items-center justify-center shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
              Entrada de Insumo / Toxina
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Atualizar quantidades e limites de alerta
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
