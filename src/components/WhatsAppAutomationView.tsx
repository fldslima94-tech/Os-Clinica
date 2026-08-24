import React, { useState } from 'react';
import { 
  MessageCircle, 
  Send, 
  CheckCheck, 
  Clock, 
  Sparkles, 
  Copy, 
  ExternalLink, 
  Calendar, 
  User, 
  CheckCircle2,
  RefreshCw,
  Sliders
} from 'lucide-react';
import { Agendamento, Paciente } from '../types';

interface WhatsAppAutomationViewProps {
  agendamentos: Agendamento[];
  pacientes: Paciente[];
  onMarkReminderSent: (agendamentoId: string) => void;
}

export const WhatsAppAutomationView: React.FC<WhatsAppAutomationViewProps> = ({
  agendamentos,
  pacientes,
  onMarkReminderSent,
}) => {
  const [activeTemplate, setActiveTemplate] = useState<'confirmacao' | 'pre_cuidados' | 'pos_cuidados' | 'retorno'>('confirmacao');
  const [selectedFilter, setSelectedFilter] = useState<'todos' | 'hoje' | 'amanha'>('todos');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const formatMessage = (ag: Agendamento, templateType: string) => {
    const patient = ag.paciente || pacientes.find(p => p.id === ag.paciente_id);
    const patientName = patient?.nome.split(' ')[0] || 'Paciente';
    const dateObj = new Date(ag.data_hora);
    const dateStr = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    if (templateType === 'confirmacao') {
      return `Olá, *${patientName}*! Tudo bem? ✨\n\nPassando para lembrar do seu agendamento de *${ag.procedimento}* na *EstéticaOS*:\n🗓 *Data:* ${dateStr}\n⏰ *Horário:* ${timeStr}\n\nPor gentileza, responda:\n*1* para *Confirmar presença*\n*2* para *Remarcar horário*\n\nEstamos ansiosos para recebê-lo(a)!`;
    }

    if (templateType === 'pre_cuidados') {
      return `Olá, *${patientName}*! Tudo bem? ✨\n\nSeu procedimento de *${ag.procedimento}* está chegando (${dateStr} às ${timeStr}).\n\n📌 *Orientações Importantes Pré-Procedimento:*\n• Evite bebidas alcoólicas e anti-inflamatórios 24h antes.\n• Venha com a pele limpa e sem maquiagem pesada.\n• Em caso de sintomas gripais ou herpes ativa, avise nossa equipe.\n\nAté breve na EstéticaOS!`;
    }

    if (templateType === 'pos_cuidados') {
      return `Olá, *${patientName}*! Esperamos que esteja se sentindo ótima após seu procedimento de *${ag.procedimento}*! 💖\n\n✨ *Lembretes de Cuidados Pós:*\n• Não massagear ou comprimir a região tratada nas primeiras 4 a 6 horas.\n• Evite atividades físicas intensas e exposição solar direta hoje.\n• Mantenha a pele bem hidratada com protetor solar.\n\nQualquer dúvida, estamos sempre à disposição!`;
    }

    if (templateType === 'retorno') {
      return `Olá, *${patientName}*! Como está o resultado do seu procedimento de *${ag.procedimento}*? ✨\n\nJá se passaram os primeiros dias de acomodação do produto e gostaríamos de convidar você para sua *Consulta de Retorno e Avaliação*. Podemos verificar uma data para esta semana?`;
    }

    return '';
  };

  const handleSendWhatsApp = (ag: Agendamento) => {
    const patient = ag.paciente || pacientes.find(p => p.id === ag.paciente_id);
    if (!patient?.telefone) return;

    const rawPhone = patient.telefone.replace(/\D/g, '');
    const message = formatMessage(ag, activeTemplate);
    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/55${rawPhone}?text=${encoded}`;

    onMarkReminderSent(ag.id);
    window.open(url, '_blank');
  };

  const handleCopyText = (ag: Agendamento) => {
    const message = formatMessage(ag, activeTemplate);
    navigator.clipboard.writeText(message);
    setCopiedId(ag.id);
    onMarkReminderSent(ag.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filtered = agendamentos.filter(ag => {
    if (ag.status === 'cancelado') return false;
    const d = new Date(ag.data_hora);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = d.toDateString() === tomorrow.toDateString();

    if (selectedFilter === 'hoje') return isToday;
    if (selectedFilter === 'amanha') return isTomorrow;
    return true;
  });

  const remindersSentCount = agendamentos.filter(a => a.lembrete_enviado).length;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5" />
              Central de Disparos WhatsApp
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Automação de Lembretes & Orientações
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Dispare lembretes de confirmação, cuidados pré/pós e reduza faltas (no-show) na clínica para 0%.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
          <div className="text-right">
            <p className="text-slate-400 font-medium">Lembretes Disparados</p>
            <p className="text-base font-bold font-mono text-emerald-600">
              {remindersSentCount} de {agendamentos.length}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-emerald-600 text-white">
            <CheckCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Template Selector Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-indigo-600" />
            <span>Selecione o Modelo de Mensagem Ativo</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <button
            onClick={() => setActiveTemplate('confirmacao')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              activeTemplate === 'confirmacao'
                ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20 text-indigo-950 font-semibold'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <p className="text-xs font-bold">1. Confirmação (24h)</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Lembrete de data, horário e opção 1 ou 2.</p>
          </button>

          <button
            onClick={() => setActiveTemplate('pre_cuidados')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              activeTemplate === 'pre_cuidados'
                ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20 text-indigo-950 font-semibold'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <p className="text-xs font-bold">2. Cuidados Pré-Procedimento</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Orientações de álcool, aspirina e pele limpa.</p>
          </button>

          <button
            onClick={() => setActiveTemplate('pos_cuidados')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              activeTemplate === 'pos_cuidados'
                ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20 text-indigo-950 font-semibold'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <p className="text-xs font-bold">3. Cuidados Pós-Sessão</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Não massagear 4h e protetor solar.</p>
          </button>

          <button
            onClick={() => setActiveTemplate('retorno')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              activeTemplate === 'retorno'
                ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20 text-indigo-950 font-semibold'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <p className="text-xs font-bold">4. Retorno / Avaliação 15d</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Agendamento de revisão do procedimento.</p>
          </button>
        </div>
      </div>

      {/* Appointments List for messaging */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Filter bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-700">Filtrar Agenda:</span>
            {['todos', 'hoje', 'amanha'].map(f => (
              <button
                key={f}
                onClick={() => setSelectedFilter(f as any)}
                className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-colors cursor-pointer ${
                  selectedFilter === f
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {f === 'todos' ? 'Todos os Próximos' : f === 'hoje' ? 'Hoje' : 'Amanhã'}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-500 font-medium">
            {filtered.length} agendamentos na fila
          </span>
        </div>

        {/* Message dispatch list */}
        <div className="divide-y divide-slate-100">
          {filtered.map(ag => {
            const patient = ag.paciente || pacientes.find(p => p.id === ag.paciente_id);
            const dt = new Date(ag.data_hora);
            const dateStr = dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            const timeStr = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const previewText = formatMessage(ag, activeTemplate);

            return (
              <div key={ag.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 truncate">
                      {patient?.nome}
                    </span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold">
                      {dateStr} às {timeStr}
                    </span>
                    {ag.lembrete_enviado ? (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-green-50 text-green-700 border border-green-200 font-semibold px-2 py-0.5 rounded-full">
                        <CheckCheck className="w-3 h-3" />
                        Disparado
                      </span>
                    ) : (
                      <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 font-semibold px-2 py-0.5 rounded-full">
                        Pendente de envio
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-semibold text-slate-600">
                    {ag.procedimento} • Tel: {patient?.telefone || 'Sem telefone'}
                  </p>

                  {/* Message preview snippet */}
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 text-[11px] text-slate-600 font-sans whitespace-pre-line line-clamp-2 max-w-2xl">
                    {previewText}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => handleCopyText(ag)}
                    className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {copiedId === ag.id ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copiar Texto</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleSendWhatsApp(ag)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Enviar WhatsApp</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
};
