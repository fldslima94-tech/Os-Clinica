import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Send, 
  CheckCheck, 
  Clock, 
  Sparkles, 
  Copy, 
  Calendar, 
  User, 
  CheckCircle2, 
  RefreshCw, 
  Sliders, 
  Plus, 
  Edit3, 
  Trash2, 
  RotateCcw, 
  Check, 
  AlertCircle, 
  Tag, 
  Info,
  ChevronRight
} from 'lucide-react';
import { Agendamento, Paciente, ClinicaConfig, ProcedimentoClinico, UsuarioEquipe, WhatsAppTemplate } from '../types';
import { 
  DEFAULT_WHATSAPP_TEMPLATES, 
  getStoredWhatsAppTemplates, 
  saveStoredWhatsAppTemplates, 
  formatWhatsAppMessage, 
  persistWhatsAppTemplate, 
  deleteWhatsAppTemplate 
} from '../services/whatsappTemplateService';
import { WhatsAppTemplateModal } from './WhatsAppTemplateModal';
import { COLLECTIONS, subscribeToCollection } from '../services/firebaseService';

interface WhatsAppAutomationViewProps {
  agendamentos: Agendamento[];
  pacientes: Paciente[];
  onMarkReminderSent: (agendamentoId: string) => void;
  clinicaConfig?: ClinicaConfig;
  procedimentos?: ProcedimentoClinico[];
  usuarios?: UsuarioEquipe[];
  currentUser?: UsuarioEquipe;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const WhatsAppAutomationView: React.FC<WhatsAppAutomationViewProps> = ({
  agendamentos,
  pacientes,
  onMarkReminderSent,
  clinicaConfig,
  procedimentos = [],
  usuarios = [],
  currentUser,
  showToast,
}) => {
  // Estado de templates carregados
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>(() => getStoredWhatsAppTemplates());
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() => {
    const initial = getStoredWhatsAppTemplates();
    return initial[0]?.id || 'template-confirmacao-padrao';
  });

  // Filtros e envio
  const [selectedFilter, setSelectedFilter] = useState<'todos' | 'hoje' | 'amanha'>('todos');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sendingApiId, setSendingApiId] = useState<string | null>(null);
  const [apiSentIds, setApiSentIds] = useState<Set<string>>(new Set());
  const [apiErrorId, setApiErrorId] = useState<string | null>(null);

  // Modais de Criação & Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<WhatsAppTemplate | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<WhatsAppTemplate | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Sincronizar com Firestore em tempo real
  useEffect(() => {
    const unsub = subscribeToCollection<WhatsAppTemplate>(
      COLLECTIONS.WHATSAPP_TEMPLATES,
      (remoteTemplates) => {
        if (remoteTemplates && remoteTemplates.length > 0) {
          // Mescla modelos remotos com padrões caso algum ainda não exista
          const mergedMap = new Map<string, WhatsAppTemplate>();
          
          DEFAULT_WHATSAPP_TEMPLATES.forEach(dt => mergedMap.set(dt.id, dt));
          remoteTemplates.forEach(rt => mergedMap.set(rt.id, rt));
          
          const list = Array.from(mergedMap.values());
          list.sort((a, b) => (a.ordem || 99) - (b.ordem || 99));
          
          setTemplates(list);
          saveStoredWhatsAppTemplates(list);
        }
      },
      DEFAULT_WHATSAPP_TEMPLATES
    );

    return () => unsub();
  }, []);

  const activeTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0] || DEFAULT_WHATSAPP_TEMPLATES[0];

  const formatMessageForAgendamento = (ag: Agendamento, templateText: string) => {
    const patient = ag.paciente || pacientes.find(p => p.id === ag.paciente_id);
    return formatWhatsAppMessage(templateText, {
      agendamento: ag,
      paciente: patient,
      clinicaConfig,
      procedimentos,
      usuarios,
    });
  };

  const handleSendWhatsApp = (ag: Agendamento) => {
    const patient = ag.paciente || pacientes.find(p => p.id === ag.paciente_id);
    if (!patient?.telefone) {
      if (showToast) showToast('Paciente não possui telefone cadastrado.', 'error');
      return;
    }

    const rawPhone = patient.telefone.replace(/\D/g, '');
    const message = formatMessageForAgendamento(ag, activeTemplate.mensagem);
    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/55${rawPhone}?text=${encoded}`;

    onMarkReminderSent(ag.id);
    window.open(url, '_blank');
    if (showToast) showToast(`Mensagem aberta para envio a ${patient.nome.split(' ')[0]}`, 'info');
  };

  /** Envia direto pela API oficial */
  const handleSendWhatsAppApi = async (ag: Agendamento) => {
    const patient = ag.paciente || pacientes.find(p => p.id === ag.paciente_id);
    if (!patient?.telefone) {
      if (showToast) showToast('Paciente não possui telefone cadastrado.', 'error');
      return;
    }

    setApiErrorId(null);
    setSendingApiId(ag.id);
    try {
      const message = formatMessageForAgendamento(ag, activeTemplate.mensagem);
      const resp = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone: `55${patient.telefone.replace(/\D/g, '')}`, mensagem: message }),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data?.error || 'Falha ao enviar mensagem.');
      }
      onMarkReminderSent(ag.id);
      setApiSentIds(prev => new Set(prev).add(ag.id));
      if (showToast) showToast(`Mensagem enviada com sucesso para ${patient.nome.split(' ')[0]}!`, 'success');
    } catch (err) {
      console.error('[WhatsAppAutomationView] Erro ao enviar via API:', err);
      setApiErrorId(ag.id);
      if (showToast) showToast('Falha no disparo automático. Verifique as credenciais do WhatsApp.', 'error');
    } finally {
      setSendingApiId(null);
    }
  };

  const handleCopyText = (ag: Agendamento) => {
    const message = formatMessageForAgendamento(ag, activeTemplate.mensagem);
    navigator.clipboard.writeText(message);
    setCopiedId(ag.id);
    onMarkReminderSent(ag.id);
    if (showToast) showToast('Texto copiado com sucesso!', 'info');
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Abrir modal para inclusão
  const handleOpenNewTemplateModal = () => {
    setTemplateToEdit(null);
    setIsModalOpen(true);
  };

  // Abrir modal para edição de um modelo específico
  const handleOpenEditTemplateModal = (template: WhatsAppTemplate, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTemplateToEdit(template);
    setIsModalOpen(true);
  };

  // Salvar novo modelo ou modelo editado
  const handleSaveTemplate = async (saved: WhatsAppTemplate) => {
    await persistWhatsAppTemplate(saved);
    setTemplates(prev => {
      const index = prev.findIndex(t => t.id === saved.id);
      if (index >= 0) {
        const copy = [...prev];
        copy[index] = saved;
        return copy;
      }
      return [...prev, saved];
    });
    setSelectedTemplateId(saved.id);
    if (showToast) {
      showToast(`Mensagem "${saved.titulo}" salva com sucesso!`, 'success');
    }
  };

  // Excluir modelo personalizado
  const handleConfirmDelete = async () => {
    if (!templateToDelete) return;
    const idToDelete = templateToDelete.id;
    await deleteWhatsAppTemplate(idToDelete);
    setTemplates(prev => prev.filter(t => t.id !== idToDelete));
    if (selectedTemplateId === idToDelete) {
      const remaining = templates.filter(t => t.id !== idToDelete);
      setSelectedTemplateId(remaining[0]?.id || DEFAULT_WHATSAPP_TEMPLATES[0].id);
    }
    setTemplateToDelete(null);
    if (showToast) {
      showToast('Mensagem automática removida com sucesso.', 'info');
    }
  };

  // Restaurar todos os modelos padrão
  const handleRestoreAllDefaults = async () => {
    for (const dt of DEFAULT_WHATSAPP_TEMPLATES) {
      await persistWhatsAppTemplate(dt);
    }
    setTemplates(DEFAULT_WHATSAPP_TEMPLATES);
    setSelectedTemplateId(DEFAULT_WHATSAPP_TEMPLATES[0].id);
    setIsResetConfirmOpen(false);
    if (showToast) {
      showToast('Modelos padrão de mensagens restaurados com sucesso!', 'success');
    }
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

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'confirmacao':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'pre_cuidados':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pos_cuidados':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'retorno':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'confirmacao': return 'Confirmação';
      case 'pre_cuidados': return 'Cuidados Pré';
      case 'pos_cuidados': return 'Cuidados Pós';
      case 'retorno': return 'Retorno';
      default: return 'Personalizado';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Principal */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs">
              <MessageCircle className="w-3.5 h-3.5" />
              Central de Disparos WhatsApp
            </span>
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold px-2 py-0.5 rounded-full">
              {templates.length} Mensagens Cadastradas
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Automação de Lembretes & Orientações
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1 max-w-2xl leading-relaxed">
            Personalize modelos de mensagens automáticas de confirmação, cuidados pré/pós e avaliação para reduzir o no-show para 0%.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* Botão de Incluir Nova Mensagem */}
          <button
            type="button"
            onClick={handleOpenNewTemplateModal}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Mensagem Automática</span>
          </button>

          {/* Contador de envios */}
          <div className="hidden lg:flex items-center gap-3 bg-slate-50 p-2.5 px-3.5 rounded-xl border border-slate-200 text-xs">
            <div className="text-right">
              <p className="text-slate-400 font-medium text-[11px]">Disparados</p>
              <p className="text-sm font-bold font-mono text-emerald-600">
                {remindersSentCount} de {agendamentos.length}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-emerald-600 text-white shadow-2xs">
              <CheckCheck className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Modelos / Lembretes & Orientações com Edição e Inclusão */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <span>Modelos de Mensagens Automáticas (Lembretes & Cuidados)</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Selecione um modelo para aplicar aos disparos, ou clique em <strong>Editar</strong> para alterar o texto e as instruções.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="text-[11px] text-slate-500 hover:text-slate-700 hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
              title="Restaura os textos originais das 4 mensagens de fábrica da clínica"
            >
              <RotateCcw className="w-3 h-3 text-slate-400" />
              <span>Restaurar Padrões da Clínica</span>
            </button>
          </div>
        </div>

        {/* Cards de Modelos Dinâmicos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {templates.map(tpl => {
            const isSelected = activeTemplate.id === tpl.id;
            return (
              <div
                key={tpl.id}
                onClick={() => setSelectedTemplateId(tpl.id)}
                className={`group relative p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20 text-slate-900 shadow-xs'
                    : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/80 text-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCategoryColor(tpl.categoria)}`}>
                      {getCategoryLabel(tpl.categoria)}
                    </span>
                    {tpl.gatilho_sugerido && (
                      <span className="text-[10px] font-mono text-slate-500 bg-white/80 px-1.5 py-0.5 rounded border border-slate-200/80">
                        {tpl.gatilho_sugerido}
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1 flex items-center justify-between">
                    <span>{tpl.titulo}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  </h4>

                  {tpl.descricao && (
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {tpl.descricao}
                    </p>
                  )}
                </div>

                {/* Card Actions (Editar / Excluir) */}
                <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={(e) => handleOpenEditTemplateModal(tpl, e)}
                    className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Editar Mensagem</span>
                  </button>

                  {!tpl.padrao && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTemplateToDelete(tpl);
                      }}
                      className="text-[11px] text-slate-400 hover:text-rose-600 p-1 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                      title="Excluir este modelo personalizado"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Banner do Modelo Ativo com Preview Resumido e Ação Rápida */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Modelo em Uso nos Disparos:
              </span>
              <span className="font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-200">
                {activeTemplate.titulo}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 line-clamp-1">
              {activeTemplate.mensagem.replace(/\n+/g, ' ')}
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleOpenEditTemplateModal(activeTemplate)}
            className="px-3 py-1.5 bg-white border border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/50 text-slate-700 hover:text-emerald-800 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
          >
            <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Editar Conteúdo Deste Modelo</span>
          </button>
        </div>

      </div>

      {/* Fila de Agendamentos para Disparo */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        
        {/* Barra de Filtros */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-700">Filtrar Agenda:</span>
            {(['todos', 'hoje', 'amanha'] as const).map(f => (
              <button
                key={f}
                onClick={() => setSelectedFilter(f)}
                className={`px-3 py-1.5 rounded-xl font-semibold capitalize transition-all cursor-pointer ${
                  selectedFilter === f
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {f === 'todos' ? 'Todos os Próximos' : f === 'hoje' ? 'Hoje' : 'Amanhã'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>{filtered.length} agendamentos na fila para envio</span>
          </div>
        </div>

        {/* Lista de Disparos */}
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <MessageCircle className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">Nenhum agendamento encontrado para o filtro selecionado.</p>
            <p className="text-xs text-slate-400">Altere o filtro acima para ver outros períodos da agenda.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map(ag => {
              const patient = ag.paciente || pacientes.find(p => p.id === ag.paciente_id);
              const dt = new Date(ag.data_hora);
              const dateStr = dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
              const timeStr = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
              const previewText = formatMessageForAgendamento(ag, activeTemplate.mensagem);

              return (
                <div key={ag.id} className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                  
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">
                        {patient?.nome || 'Paciente sem nome'}
                      </span>
                      <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                        {dateStr} às {timeStr}
                      </span>
                      {ag.lembrete_enviado ? (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold px-2 py-0.5 rounded-full">
                          <CheckCheck className="w-3 h-3" />
                          Lembrete Disparado
                        </span>
                      ) : (
                        <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 font-semibold px-2 py-0.5 rounded-full">
                          Pendente de envio
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-slate-600 flex items-center gap-2">
                      <span>{ag.procedimento}</span>
                      <span>•</span>
                      <span className="text-slate-500 font-mono">Tel: {patient?.telefone || 'Sem telefone'}</span>
                    </p>

                    {/* Prévia da mensagem customizada renderizada com os dados reais deste paciente */}
                    <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200/80 text-[11px] text-slate-700 font-sans whitespace-pre-line line-clamp-3 max-w-3xl leading-relaxed">
                      {previewText}
                    </div>
                  </div>

                  {/* Ações de envio */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                    
                    {/* Botão Copiar Texto */}
                    <button
                      onClick={() => handleCopyText(ag)}
                      className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
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

                    {/* Botão Abrir no WhatsApp Web/App */}
                    <button
                      onClick={() => handleSendWhatsApp(ag)}
                      className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                      title="Abre o WhatsApp com a mensagem personalizada pronta para envio manual"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                      <span>Abrir no WhatsApp</span>
                    </button>

                    {/* Botão Enviar Automático via Meta Cloud API */}
                    <button
                      onClick={() => handleSendWhatsAppApi(ag)}
                      disabled={sendingApiId === ag.id}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                      title="Dispara diretamente pela API Oficial do WhatsApp para o celular do paciente"
                    >
                      {sendingApiId === ag.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : apiSentIds.has(ag.id) ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      <span>
                        {sendingApiId === ag.id ? 'Enviando...' : apiSentIds.has(ag.id) ? 'Enviado!' : 'Enviar Automático'}
                      </span>
                    </button>

                    {apiErrorId === ag.id && (
                      <span className="text-[11px] text-rose-600 font-semibold block w-full text-right">
                        Falha ao enviar. Verifique o número ou as credenciais.
                      </span>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Modal de Criação / Edição de Mensagem Automática */}
      <WhatsAppTemplateModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setTemplateToEdit(null);
        }}
        onSave={handleSaveTemplate}
        templateToEdit={templateToEdit}
        clinicaConfig={clinicaConfig}
      />

      {/* Modal de Confirmação de Exclusão */}
      {templateToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-md w-full space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Excluir mensagem automática?
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Você tem certeza que deseja excluir o modelo <strong>"{templateToDelete.titulo}"</strong>? Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setTemplateToDelete(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Restaurar Padrões */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-md w-full space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Restaurar modelos padrão da clínica?
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Esta ação restaura os textos originais das 4 mensagens de fábrica (Confirmação 24h, Pré-Cuidados, Pós-Cuidados e Retorno 15d).
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRestoreAllDefaults}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                Restaurar Textos Originais
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
