import React, { useState } from 'react';
import { 
  Calendar, 
  MessageCircle, 
  Clock, 
  CheckCircle2, 
  Phone, 
  Sparkles, 
  UserCheck, 
  AlertCircle, 
  Search,
  Send,
  ExternalLink,
  ShieldCheck,
  Check,
  ChevronRight,
  Filter,
  Trash2
} from 'lucide-react';
import { AlertaRetornoPos, Paciente, UsuarioEquipe } from '../types';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface PostCareReturnViewProps {
  alertas: AlertaRetornoPos[];
  onUpdateAlertaStatus: (alertaId: string, status: 'pendente' | 'agendado' | 'contatado') => void;
  onDeleteAlerta?: (alertaId: string) => void;
  onViewPatientByName?: (nome: string) => void;
  currentUser?: UsuarioEquipe;
}

export const PostCareReturnView: React.FC<PostCareReturnViewProps> = ({
  alertas,
  onUpdateAlertaStatus,
  onDeleteAlerta,
  onViewPatientByName,
  currentUser,
}) => {
  const isAdmin = !currentUser || currentUser.role === 'admin';
  const [filter, setFilter] = useState<'todos' | 'pendente' | 'contatado' | 'agendado'>('todos');
  const [search, setSearch] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [alertaToDelete, setAlertaToDelete] = useState<AlertaRetornoPos | null>(null);

  const filteredAlertas = alertas.filter(a => {
    const matchesFilter = filter === 'todos' || a.status === filter;
    const q = search.toLowerCase();
    const matchesSearch = 
      a.paciente_nome.toLowerCase().includes(q) || 
      a.procedimento_origem.toLowerCase().includes(q) ||
      a.telefone.includes(q);
    return matchesFilter && matchesSearch;
  });

  const pendentesCount = alertas.filter(a => a.status === 'pendente').length;
  const contatadosCount = alertas.filter(a => a.status === 'contatado').length;
  const agendadosCount = alertas.filter(a => a.status === 'agendado').length;

  const handleSendWhatsApp = (alerta: AlertaRetornoPos) => {
    const primeiroNome = alerta.paciente_nome.split(' ')[0];
    const text = encodeURIComponent(
      `Olá, ${primeiroNome}! Tudo bem? Aqui é da clínica EstéticaOS 🌸\n\nNotamos que completou ${alerta.dias_apos} dias da sua realização de *${alerta.procedimento_origem}*.\n\nQueremos saber como está sua recuperação e te convidar para sua consulta de *${alerta.motivo}* com a nossa especialista.\n\nPodemos verificar os melhores horários para você esta semana?`
    );
    const cleanPhone = alerta.telefone.replace(/\D/g, '');
    const url = `https://wa.me/55${cleanPhone}?text=${text}`;
    
    // Open WA and mark as contacted
    window.open(url, '_blank');
    onUpdateAlertaStatus(alerta.id, 'contatado');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Central de Retornos & Pós-Procedimento
            </h2>
            <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-indigo-200">
              Retenção & Cuidado 360°
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gere fidelização ativa lembrando pacientes de revisões gratuitas (15 dias de Botox), retoques e novos ciclos de bioestimulador.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-center">
            <span className="text-xs text-amber-700 font-bold block">{pendentesCount}</span>
            <span className="text-[10px] text-amber-800 uppercase font-semibold">Pendentes</span>
          </div>
          <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-center">
            <span className="text-xs text-blue-700 font-bold block">{contatadosCount}</span>
            <span className="text-[10px] text-blue-800 uppercase font-semibold">Em Contato</span>
          </div>
          <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <span className="text-xs text-emerald-700 font-bold block">{agendadosCount}</span>
            <span className="text-[10px] text-emerald-800 uppercase font-semibold">Agendados</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por paciente, procedimento ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(['todos', 'pendente', 'contatado', 'agendado'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer whitespace-nowrap ${
                filter === tab
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab === 'todos' ? 'Todos os Alertas' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAlertas.map(alerta => {
          const primeiroNome = alerta.paciente_nome.split(' ')[0];
          
          return (
            <div
              key={alerta.id}
              className={`bg-white rounded-2xl border p-5 shadow-sm transition-all flex flex-col justify-between ${
                alerta.status === 'pendente'
                  ? 'border-amber-200 bg-amber-50/20'
                  : alerta.status === 'agendado'
                  ? 'border-emerald-200 bg-emerald-50/10'
                  : 'border-slate-200'
              }`}
            >
              <div>
                {/* Header card */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                      {alerta.paciente_nome.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-tight">
                        {alerta.paciente_nome}
                      </h4>
                      <p className="text-xs text-slate-500">{alerta.telefone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                      alerta.status === 'pendente'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : alerta.status === 'contatado'
                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    }`}>
                      {alerta.status}
                    </span>

                    {isAdmin && onDeleteAlerta && (
                      <button
                        type="button"
                        onClick={() => setAlertaToDelete(alerta)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                        title="Excluir alerta de retorno (Admin)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="bg-white rounded-xl p-3 border border-slate-200/80 space-y-2 text-xs mb-4">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Procedimento Realizado:</span>
                    <span className="font-semibold text-slate-800 text-right">{alerta.procedimento_origem}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Data da Aplicação:</span>
                    <span className="font-medium text-slate-700">{new Date(alerta.data_procedimento).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="p-2 bg-indigo-50/70 border border-indigo-100 rounded-lg text-indigo-900 font-medium text-[11px] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>{alerta.motivo}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleSendWhatsApp(alerta)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  title="Disparar convite de retorno no WhatsApp"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp 1-Clique</span>
                </button>

                {alerta.status !== 'agendado' ? (
                  <button
                    onClick={() => onUpdateAlertaStatus(alerta.id, 'agendado')}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                    title="Marcar como agendado na recepção"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Agendado</span>
                  </button>
                ) : (
                  <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {filteredAlertas.length === 0 && (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-bold text-slate-700">Nenhum alerta de retorno encontrado</p>
          <p className="text-xs text-slate-400 mt-1">Todos os pós-procedimentos já foram contatados ou agendados pela recepção.</p>
        </div>
      )}

      {/* Delete Return Alert Confirmation Modal */}
      {alertaToDelete && (
        <DeleteConfirmModal
          isOpen={!!alertaToDelete}
          onClose={() => setAlertaToDelete(null)}
          onConfirm={() => {
            if (alertaToDelete && onDeleteAlerta) {
              onDeleteAlerta(alertaToDelete.id);
            }
            setAlertaToDelete(null);
          }}
          title="Excluir Alerta de Retorno"
          itemType="Alerta de Retorno Pós-Procedimento"
          itemName={`${alertaToDelete.paciente_nome} - ${alertaToDelete.procedimento_origem} (${alertaToDelete.motivo})`}
          description="A exclusão deste alerta removerá este lembrete de acompanhamento pós-procedimento da central de retornos."
        />
      )}

    </div>
  );
};
