import React, { useState, useEffect, useMemo } from 'react';
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
  ChevronRight,
  Megaphone,
  Cake,
  Repeat,
  FileText,
  History,
  Users,
  Search,
  Filter,
  ArrowRight,
  Pause,
  Play,
  X,
  ExternalLink,
  Gift,
  Flame,
  CheckSquare,
  Square,
  ShieldCheck,
  TrendingUp,
  Clock4,
  KeyRound,
  Webhook
} from 'lucide-react';
import { 
  Agendamento, 
  Paciente, 
  ClinicaConfig, 
  ProcedimentoClinico, 
  UsuarioEquipe, 
  WhatsAppTemplate, 
  WhatsAppCampanha,
  AlertaRetornoPos,
  TransacaoFinanceira
} from '../types';
import { 
  DEFAULT_WHATSAPP_TEMPLATES, 
  getStoredWhatsAppTemplates, 
  saveStoredWhatsAppTemplates, 
  formatWhatsAppMessage, 
  persistWhatsAppTemplate, 
  deleteWhatsAppTemplate,
  getStoredWhatsAppCampanhas,
  saveStoredWhatsAppCampanhas,
  persistWhatsAppCampanha
} from '../services/whatsappTemplateService';
import { WhatsAppTemplateModal } from './WhatsAppTemplateModal';
import { 
  WhatsAppCloudApiConfigModal, 
  WhatsAppCloudApiConfigGuide 
} from './WhatsAppCloudApiConfigModal';
import { WhatsAppWebhookSetupModal } from './WhatsAppWebhookSetupModal';
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
  alertasRetorno?: AlertaRetornoPos[];
  transacoes?: TransacaoFinanceira[];
}

type TabType = 'agenda' | 'campanhas' | 'aniversarios' | 'retornos' | 'templates' | 'historico' | 'configuracao';
type AudienceFilter = 'toda_base' | 'ativos' | 'inativos' | 'leads' | 'vip' | 'aniversariantes';

export const WhatsAppAutomationView: React.FC<WhatsAppAutomationViewProps> = ({
  agendamentos,
  pacientes,
  onMarkReminderSent,
  clinicaConfig,
  procedimentos = [],
  usuarios = [],
  currentUser,
  showToast,
  alertasRetorno = [],
  transacoes = [],
}) => {
  // Aba ativa principal
  const [activeTab, setActiveTab] = useState<TabType>('agenda');

  // Modal de Configuração Cloud API (Secrets AI Studio) & Status da Conexão
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [cloudApiConfigured, setCloudApiConfigured] = useState<boolean | null>(null);

  const checkCloudApiStatus = () => {
    fetch('/api/whatsapp/status')
      .then(r => r.json())
      .then(d => {
        setCloudApiConfigured(Boolean(d?.configured));
      })
      .catch(() => setCloudApiConfigured(false));
  };

  useEffect(() => {
    checkCloudApiStatus();
  }, []);

  // Templates
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>(() => getStoredWhatsAppTemplates());
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() => {
    const initial = getStoredWhatsAppTemplates();
    return initial[0]?.id || 'template-confirmacao-padrao';
  });

  // Campanhas Salvas
  const [campanhas, setCampanhas] = useState<WhatsAppCampanha[]>(() => getStoredWhatsAppCampanhas());

  // Filtros de Agenda
  const [agendaFilter, setAgendaFilter] = useState<'todos' | 'hoje' | 'amanha' | 'pendentes'>('todos');
  const [agendaSearch, setAgendaSearch] = useState('');

  // Seleção de Agendamentos na Agenda
  const [selectedAgendamentoIds, setSelectedAgendamentoIds] = useState<Set<string>>(new Set());

  // Estados de Campanhas / Promoções em Massa
  const [audienceFilter, setAudienceFilter] = useState<AudienceFilter>('toda_base');
  const [campaignSearch, setCampaignSearch] = useState('');
  const [campaignTitle, setCampaignTitle] = useState('Super Promoção & Condição Especial da Semana');
  const [campaignCustomMessage, setCampaignCustomMessage] = useState('');
  const [campaignTemplateId, setCampaignTemplateId] = useState<string>('template-promocao-padrao');
  const [selectedPatientIds, setSelectedPatientIds] = useState<Set<string>>(new Set());

  // Modais de Criação & Edição de Modelos
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<WhatsAppTemplate | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<WhatsAppTemplate | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Estados de Disparo
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sendingApiId, setSendingApiId] = useState<string | null>(null);
  const [apiSentIds, setApiSentIds] = useState<Set<string>>(new Set());
  const [apiErrorId, setApiErrorId] = useState<string | null>(null);

  // Disparo em Lote Progressivo (Modal com Barra de Progresso)
  const [isBatchSending, setIsBatchSending] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{
    total: number;
    current: number;
    success: number;
    failed: number;
    currentPatientName: string;
    isPaused: boolean;
  } | null>(null);

  // Fila Interativa de Envio Manual WhatsApp Web (Paciente a Paciente)
  const [webQueueModal, setWebQueueModal] = useState<{
    items: Array<{ id: string; pacienteNome: string; telefone: string; mensagem: string; isAgendamento?: boolean }>;
    currentIndex: number;
  } | null>(null);

  // Sincronizar templates e campanhas do Firestore
  useEffect(() => {
    const unsubTemplates = subscribeToCollection<WhatsAppTemplate>(
      COLLECTIONS.WHATSAPP_TEMPLATES,
      (remoteTemplates) => {
        if (remoteTemplates && remoteTemplates.length > 0) {
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

    const unsubCampanhas = subscribeToCollection<WhatsAppCampanha>(
      COLLECTIONS.WHATSAPP_CAMPANHAS,
      (remoteCampanhas) => {
        if (remoteCampanhas && remoteCampanhas.length > 0) {
          setCampanhas(remoteCampanhas);
          saveStoredWhatsAppCampanhas(remoteCampanhas);
        }
      },
      []
    );

    return () => {
      unsubTemplates();
      unsubCampanhas();
    };
  }, []);

  const activeTemplate = useMemo(() => {
    return templates.find(t => t.id === selectedTemplateId) || templates[0] || DEFAULT_WHATSAPP_TEMPLATES[0];
  }, [templates, selectedTemplateId]);

  // Mensagem da Campanha atual
  const campaignActiveMessage = useMemo(() => {
    if (campaignCustomMessage.trim()) return campaignCustomMessage;
    const tpl = templates.find(t => t.id === campaignTemplateId);
    return tpl ? tpl.mensagem : DEFAULT_WHATSAPP_TEMPLATES[4]?.mensagem || '';
  }, [campaignCustomMessage, campaignTemplateId, templates]);

  // Identificar pacientes VIP (baseado em transações ou frequência de agendamentos)
  const vipPatientIds = useMemo(() => {
    const counts = new Map<string, number>();
    agendamentos.forEach(a => {
      if (a.paciente_id) {
        counts.set(a.paciente_id, (counts.get(a.paciente_id) || 0) + 1);
      }
    });
    // Pacientes com mais de 2 agendamentos
    const set = new Set<string>();
    counts.forEach((val, id) => {
      if (val >= 2) set.add(id);
    });
    return set;
  }, [agendamentos]);

  // Identificar aniversariantes do mês atual
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const currentDay = new Date().getDate();

  const aniversariantesMes = useMemo(() => {
    return pacientes.filter(p => {
      if (!p.data_nascimento) return false;
      try {
        const parts = p.data_nascimento.split('-');
        if (parts.length >= 2) {
          const m = parseInt(parts[1], 10);
          return m === currentMonth;
        }
      } catch {
        return false;
      }
      return false;
    });
  }, [pacientes, currentMonth]);

  // Identificar pacientes inativos (+60 dias sem agendamento)
  const pacientesInativos = useMemo(() => {
    const now = Date.now();
    const SIXTY_DAYS = 60 * 24 * 60 * 60 * 1000;
    
    // Mapear última data de agendamento por paciente
    const lastDates = new Map<string, number>();
    agendamentos.forEach(a => {
      if (a.paciente_id && a.data_hora) {
        const t = new Date(a.data_hora).getTime();
        const prev = lastDates.get(a.paciente_id) || 0;
        if (t > prev) lastDates.set(a.paciente_id, t);
      }
    });

    return pacientes.filter(p => {
      const last = lastDates.get(p.id);
      if (!last) return false; // Sem histórico ou novo
      return (now - last) > SIXTY_DAYS;
    });
  }, [pacientes, agendamentos]);

  // Pacientes Leads (sem agendamento ainda)
  const pacientesLeads = useMemo(() => {
    const bookedIds = new Set(agendamentos.map(a => a.paciente_id).filter(Boolean));
    return pacientes.filter(p => !bookedIds.has(p.id));
  }, [pacientes, agendamentos]);

  // Base segmentada de pacientes para a Aba de Campanhas
  const audiencePatients = useMemo(() => {
    let list: Paciente[] = [];
    switch (audienceFilter) {
      case 'toda_base':
        list = pacientes.filter(p => Boolean(p.telefone && p.telefone.replace(/\D/g, '').length >= 10));
        break;
      case 'ativos':
        const activeIds = new Set(agendamentos.map(a => a.paciente_id));
        list = pacientes.filter(p => activeIds.has(p.id) && Boolean(p.telefone));
        break;
      case 'inativos':
        list = pacientesInativos.filter(p => Boolean(p.telefone));
        break;
      case 'leads':
        list = pacientesLeads.filter(p => Boolean(p.telefone));
        break;
      case 'vip':
        list = pacientes.filter(p => vipPatientIds.has(p.id) && Boolean(p.telefone));
        break;
      case 'aniversariantes':
        list = aniversariantesMes.filter(p => Boolean(p.telefone));
        break;
      default:
        list = pacientes;
    }

    if (campaignSearch.trim()) {
      const q = campaignSearch.toLowerCase();
      list = list.filter(p => 
        p.nome.toLowerCase().includes(q) || 
        (p.telefone && p.telefone.includes(q))
      );
    }

    return list;
  }, [pacientes, audienceFilter, campaignSearch, agendamentos, pacientesInativos, pacientesLeads, vipPatientIds, aniversariantesMes]);

  // Inicializar seleção da audiência de campanhas quando o filtro muda
  useEffect(() => {
    const validIds = new Set(audiencePatients.map(p => p.id));
    setSelectedPatientIds(validIds);
  }, [audienceFilter]);

  // Lista de Agendamentos filtrados
  const filteredAgendamentos = useMemo(() => {
    return agendamentos.filter(ag => {
      if (ag.status === 'cancelado') return false;
      const d = new Date(ag.data_hora);
      const today = new Date();
      const isToday = d.toDateString() === today.toDateString();

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isTomorrow = d.toDateString() === tomorrow.toDateString();

      if (agendaFilter === 'hoje' && !isToday) return false;
      if (agendaFilter === 'amanha' && !isTomorrow) return false;
      if (agendaFilter === 'pendentes' && ag.lembrete_enviado) return false;

      if (agendaSearch.trim()) {
        const q = agendaSearch.toLowerCase();
        const pName = (ag.paciente?.nome || '').toLowerCase();
        const proc = (ag.procedimento || '').toLowerCase();
        if (!pName.includes(q) && !proc.includes(q)) return false;
      }

      return true;
    });
  }, [agendamentos, agendaFilter, agendaSearch]);

  // Formatar mensagem para um agendamento específico
  const formatForAgendamento = (ag: Agendamento, templateText: string) => {
    const patient = ag.paciente || pacientes.find(p => p.id === ag.paciente_id);
    return formatWhatsAppMessage(templateText, {
      agendamento: ag,
      paciente: patient,
      clinicaConfig,
      procedimentos,
      usuarios,
    });
  };

  // Formatar mensagem para um paciente geral (sem agendamento)
  const formatForPatient = (patient: Paciente, templateText: string) => {
    return formatWhatsAppMessage(templateText, {
      paciente: patient,
      clinicaConfig,
      procedimentos,
      usuarios,
    });
  };

  // Envio individual via WhatsApp Web/App
  const handleOpenIndividualWhatsApp = (phone: string, text: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Envio individual via API Oficial
  const handleSendSingleApi = async (phone: string, text: string, id: string, onDone?: () => void) => {
    setSendingApiId(id);
    setApiErrorId(null);
    try {
      const resp = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone: `55${phone.replace(/\D/g, '')}`, mensagem: text }),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        const errMsg = data?.error || 'Falha ao enviar mensagem.';
        if (errMsg.includes('WHATSAPP_TOKEN') || errMsg.includes('não configurado') || errMsg.includes('credenciais')) {
          setIsConfigModalOpen(true);
        }
        throw new Error(errMsg);
      }
      setApiSentIds(prev => new Set(prev).add(id));
      if (onDone) onDone();
      if (showToast) showToast('Mensagem enviada com sucesso!', 'success');
    } catch (err) {
      console.error('[WhatsAppAutomationView] Erro ao enviar:', err);
      setApiErrorId(id);
      if (showToast) showToast('Erro no disparo. Verifique conexão e credenciais do WhatsApp.', 'error');
    } finally {
      setSendingApiId(null);
    }
  };

  // Selecionar/Deselecionar todos da agenda
  const handleToggleSelectAllAgenda = () => {
    if (selectedAgendamentoIds.size === filteredAgendamentos.length) {
      setSelectedAgendamentoIds(new Set());
    } else {
      setSelectedAgendamentoIds(new Set(filteredAgendamentos.map(a => a.id)));
    }
  };

  const handleToggleSelectAgendamento = (id: string) => {
    setSelectedAgendamentoIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Selecionar/Deselecionar todos na audiência de campanhas
  const handleToggleSelectAllAudience = () => {
    if (selectedPatientIds.size === audiencePatients.length) {
      setSelectedPatientIds(new Set());
    } else {
      setSelectedPatientIds(new Set(audiencePatients.map(p => p.id)));
    }
  };

  const handleToggleSelectPatient = (id: string) => {
    setSelectedPatientIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // DISPARO EM LOTE PROGRESSIVO (Batch Send via API com delay anti-bloqueio)
  const handleStartBatchSend = async (
    itemsToSend: Array<{ id: string; pacienteNome: string; telefone: string; text: string; isAgendamento?: boolean }>
  ) => {
    if (itemsToSend.length === 0) {
      if (showToast) showToast('Nenhum paciente selecionado para o disparo.', 'error');
      return;
    }

    setIsBatchSending(true);
    setBatchProgress({
      total: itemsToSend.length,
      current: 0,
      success: 0,
      failed: 0,
      currentPatientName: itemsToSend[0]?.pacienteNome || '',
      isPaused: false,
    });

    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < itemsToSend.length; i++) {
      const item = itemsToSend[i];
      setBatchProgress(prev => prev ? {
        ...prev,
        current: i + 1,
        currentPatientName: item.pacienteNome,
      } : null);

      try {
        const cleanPhone = item.telefone.replace(/\D/g, '');
        const resp = await fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telefone: `55${cleanPhone}`, mensagem: item.text }),
        });

        if (resp.ok) {
          successCount++;
          setApiSentIds(prev => new Set(prev).add(item.id));
          if (item.isAgendamento) {
            onMarkReminderSent(item.id);
          }
        } else {
          failedCount++;
        }
      } catch (err) {
        console.warn(`[BatchSend] Falha ao enviar para ${item.pacienteNome}:`, err);
        failedCount++;
      }

      setBatchProgress(prev => prev ? {
        ...prev,
        success: successCount,
        failed: failedCount,
      } : null);

      // Intervalo de segurança anti-bloqueio de 600ms entre requisições
      await new Promise(res => setTimeout(res, 600));
    }

    // Registrar histórico da campanha se for mais de 1 paciente
    if (itemsToSend.length > 1) {
      const novaCampanha: WhatsAppCampanha = {
        id: `campanha-${Date.now()}`,
        titulo: activeTab === 'agenda' ? 'Disparo em Massa de Lembretes da Agenda' : campaignTitle,
        tipo: activeTab === 'agenda' ? 'geral' : (audienceFilter === 'aniversariantes' ? 'aniversariantes' : 'promocao'),
        mensagem: itemsToSend[0]?.text || '',
        total_destinatarios: itemsToSend.length,
        total_enviados: successCount,
        total_erros: failedCount,
        status: 'concluido',
        criado_em: new Date().toISOString(),
        criado_por: currentUser?.nome || 'Admin',
        filtros_aplicados: activeTab === 'agenda' ? `Agenda (${agendaFilter})` : `Segmento: ${audienceFilter}`,
      };

      await persistWhatsAppCampanha(novaCampanha);
      setCampanhas(prev => [novaCampanha, ...prev]);
    }

    if (showToast) {
      showToast(`Disparo concluído: ${successCount} enviados com sucesso, ${failedCount} com falhas.`, 'success');
    }
  };

  // Abrir Fila WhatsApp Web para Envio Manual Sequencial
  const handleStartWebQueue = (
    items: Array<{ id: string; pacienteNome: string; telefone: string; mensagem: string; isAgendamento?: boolean }>
  ) => {
    if (items.length === 0) {
      if (showToast) showToast('Nenhum paciente selecionado.', 'error');
      return;
    }
    setWebQueueModal({
      items,
      currentIndex: 0,
    });
  };

  // Copiar todas as mensagens formatadas selecionadas
  const handleCopyAllSelected = (
    items: Array<{ pacienteNome: string; telefone: string; text: string }>
  ) => {
    if (items.length === 0) return;
    const combined = items
      .map((it, idx) => `[${idx + 1}] ${it.pacienteNome} (${it.telefone}):\n${it.text}\n`)
      .join('\n----------------------------------------\n\n');

    navigator.clipboard.writeText(combined);
    if (showToast) {
      showToast(`${items.length} mensagens copiadas para a área de transferência!`, 'info');
    }
  };

  // Salvar novo modelo ou modelo editado
  const handleSaveTemplate = async (saved: WhatsAppTemplate) => {
    await persistWhatsAppTemplate(saved);
    setTemplates(prev => {
      const idx = prev.findIndex(t => t.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [...prev, saved];
    });
    setSelectedTemplateId(saved.id);
    if (showToast) showToast(`Modelo "${saved.titulo}" salvo com sucesso!`, 'success');
  };

  // Excluir modelo
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
    if (showToast) showToast('Modelo excluído com sucesso.', 'info');
  };

  // Restaurar padrões
  const handleRestoreAllDefaults = async () => {
    for (const dt of DEFAULT_WHATSAPP_TEMPLATES) {
      await persistWhatsAppTemplate(dt);
    }
    setTemplates(DEFAULT_WHATSAPP_TEMPLATES);
    setSelectedTemplateId(DEFAULT_WHATSAPP_TEMPLATES[0].id);
    setIsResetConfirmOpen(false);
    if (showToast) showToast('Modelos originais da clínica restaurados!', 'success');
  };

  // Contadores para os Cards de Resumo
  const totalAgendadosHoje = agendamentos.filter(a => {
    const d = new Date(a.data_hora);
    return d.toDateString() === new Date().toDateString() && a.status !== 'cancelado';
  }).length;

  const totalBaseWhatsApp = pacientes.filter(p => Boolean(p.telefone && p.telefone.replace(/\D/g, '').length >= 10)).length;
  const remindersSentCount = agendamentos.filter(a => a.lembrete_enviado).length;

  return (
    <div className="space-y-6">
      
      {/* 1. Header do Módulo com Identidade e Métricas Principais */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs">
                <MessageCircle className="w-3.5 h-3.5" />
                Central de Automação & Mensagens WhatsApp
              </span>
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold px-2 py-0.5 rounded-full">
                {totalBaseWhatsApp} Contatos Alcançáveis
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Automação de Lembretes & Orientações
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1 max-w-3xl leading-relaxed">
              Dispare lembretes da agenda individualmente ou em grupo, envie campanhas promocionais e eventos em massa para toda a base, parabenize aniversariantes e faça gestão completa de mensagens.
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
            <button
              type="button"
              onClick={() => setIsWebhookModalOpen(true)}
              className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer border border-indigo-200"
              title="Instruções para configurar a URL do Webhook na Meta e expor os endpoints de server/whatsapp.ts"
            >
              <Webhook className="w-4 h-4 text-indigo-600" />
              <span>Instruções Webhook Meta</span>
            </button>

            <button
              type="button"
              onClick={() => setIsConfigModalOpen(true)}
              className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer border border-slate-700"
              title="Como obter e cadastrar WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID e WHATSAPP_VERIFY_TOKEN no AI Studio"
            >
              <KeyRound className="w-4 h-4 text-emerald-400" />
              <span>Configurar Cloud API (Secrets)</span>
              {cloudApiConfigured === true ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30" title="API Meta Conectada"></span>
              ) : cloudApiConfigured === false ? (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse ring-2 ring-amber-400/30" title="Variáveis Pendentes no AI Studio"></span>
              ) : null}
            </button>

            <button
              type="button"
              onClick={() => {
                setTemplateToEdit(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Mensagem Automática</span>
            </button>
          </div>
        </div>

        {/* Barra de Estatísticas / Métricas Rápidas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <p className="text-slate-400 font-medium text-[11px]">Agenda Hoje</p>
              <p className="text-base font-bold text-slate-900">{totalAgendadosHoje} pacientes</p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-slate-400 font-medium text-[11px]">Base Total WhatsApp</p>
              <p className="text-base font-bold text-slate-900">{totalBaseWhatsApp} contatos</p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center shrink-0">
              <Cake className="w-4 h-4" />
            </div>
            <div>
              <p className="text-slate-400 font-medium text-[11px]">Aniversariantes do Mês</p>
              <p className="text-base font-bold text-slate-900">{aniversariantesMes.length} clientes</p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <Repeat className="w-4 h-4" />
            </div>
            <div>
              <p className="text-slate-400 font-medium text-[11px]">Retornos Pendentes</p>
              <p className="text-base font-bold text-slate-900">{alertasRetorno.length} pacientes</p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 col-span-2 sm:col-span-1 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <CheckCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-slate-400 font-medium text-[11px]">Lembretes Enviados</p>
              <p className="text-base font-bold text-slate-900">{remindersSentCount} de {agendamentos.length}</p>
            </div>
          </div>
        </div>

        {/* 2. Menu de Navegação em Abas do Módulo */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-100 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('agenda')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'agenda'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>1. Lembretes da Agenda (Disparo em Lote)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
              {filteredAgendamentos.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('campanhas')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'campanhas'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5 text-amber-400" />
            <span>2. Disparo em Massa & Campanhas (Promoções & Eventos)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300">
              Toda Base
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('aniversarios')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'aniversarios'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
            }`}
          >
            <Cake className="w-3.5 h-3.5 text-pink-400" />
            <span>3. Aniversariantes do Mês</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-pink-500/20 text-pink-300">
              {aniversariantesMes.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('retornos')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'retornos'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
            }`}
          >
            <Repeat className="w-3.5 h-3.5 text-purple-400" />
            <span>4. Retornos & Pós-Procedimento</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-500/20 text-purple-300">
              {alertasRetorno.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('templates')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'templates'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span>5. Central de Modelos ({templates.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('historico')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'historico'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5 text-slate-400" />
            <span>6. Histórico de Disparos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('configuracao')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'configuracao'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-emerald-500" />
            <span>7. Guia Cloud API (Secrets)</span>
            {cloudApiConfigured === false && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-600 font-semibold">
                Configurar
              </span>
            )}
            {cloudApiConfigured === true && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-600 font-semibold">
                Ativo
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================
          ABA 1: LEMBRETES DA AGENDA (COM SELEÇÃO E DISPARO EM LOTE)
         ======================================================== */}
      {activeTab === 'agenda' && (
        <div className="space-y-4">
          
          {/* Seletor do Modelo em Uso na Agenda */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-emerald-600" />
                Modelo Ativo para os Lembretes:
              </span>
              <select
                value={selectedTemplateId}
                onChange={e => setSelectedTemplateId(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/20"
              >
                {templates.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.titulo} ({t.gatilho_sugerido || 'Sem gatilho'})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setTemplateToEdit(activeTemplate);
                  setIsModalOpen(true);
                }}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/50 text-slate-700 hover:text-emerald-800 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Editar Mensagem Selecionada</span>
              </button>
            </div>
          </div>

          {/* Barra de Filtros e Busca de Agendamentos */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-slate-700">Filtro de Horário:</span>
              {(['todos', 'hoje', 'amanha', 'pendentes'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setAgendaFilter(f)}
                  className={`px-3 py-1.5 rounded-xl font-semibold capitalize transition-all cursor-pointer ${
                    agendaFilter === f
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  {f === 'todos' ? 'Todos os Próximos' : f === 'hoje' ? 'Hoje' : f === 'amanha' ? 'Amanhã' : 'Pendentes'}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64 text-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={agendaSearch}
                onChange={e => setAgendaSearch(e.target.value)}
                placeholder="Buscar por paciente ou procedimento..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 text-slate-900"
              />
            </div>
          </div>

          {/* BARRA DE AÇÃO EM LOTE FLUTUANTE / FIXA (QUANDO HOUVER SELECIONADOS) */}
          <div className="bg-emerald-950 text-white p-4 rounded-2xl border border-emerald-800 shadow-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleToggleSelectAllAgenda}
                className="p-1.5 bg-emerald-900 hover:bg-emerald-800 text-emerald-200 rounded-lg transition-colors cursor-pointer"
                title="Selecionar / Deselecionar Todos"
              >
                {selectedAgendamentoIds.size === filteredAgendamentos.length && filteredAgendamentos.length > 0 ? (
                  <CheckSquare className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Square className="w-5 h-5" />
                )}
              </button>
              <div>
                <p className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
                  Agrupamento de Pacientes para Disparo
                </p>
                <p className="text-sm font-bold text-white">
                  {selectedAgendamentoIds.size} de {filteredAgendamentos.length} pacientes selecionados
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end text-xs">
              
              {/* Botão Copiar Lista Formatada */}
              <button
                type="button"
                onClick={() => {
                  const selectedItems = filteredAgendamentos
                    .filter(a => selectedAgendamentoIds.has(a.id))
                    .map(a => {
                      const p = a.paciente || pacientes.find(pt => pt.id === a.paciente_id);
                      return {
                        pacienteNome: p?.nome || 'Paciente',
                        telefone: p?.telefone || '',
                        text: formatForAgendamento(a, activeTemplate.mensagem),
                      };
                    });
                  handleCopyAllSelected(selectedItems);
                }}
                disabled={selectedAgendamentoIds.size === 0}
                className="px-3.5 py-2 bg-emerald-900/80 hover:bg-emerald-800 disabled:opacity-50 text-emerald-200 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Textos</span>
              </button>

              {/* Botão Sequência WhatsApp Web */}
              <button
                type="button"
                onClick={() => {
                  const selectedItems = filteredAgendamentos
                    .filter(a => selectedAgendamentoIds.has(a.id))
                    .map(a => {
                      const p = a.paciente || pacientes.find(pt => pt.id === a.paciente_id);
                      return {
                        id: a.id,
                        pacienteNome: p?.nome || 'Paciente',
                        telefone: p?.telefone || '',
                        mensagem: formatForAgendamento(a, activeTemplate.mensagem),
                        isAgendamento: true,
                      };
                    });
                  handleStartWebQueue(selectedItems);
                }}
                disabled={selectedAgendamentoIds.size === 0}
                className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Abre paciente por paciente em sequência no WhatsApp Web"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-300" />
                <span>Fila WhatsApp Web</span>
              </button>

              {/* Botão Principal: Disparar em Lote via API Oficial */}
              <button
                type="button"
                onClick={() => {
                  const selectedItems = filteredAgendamentos
                    .filter(a => selectedAgendamentoIds.has(a.id))
                    .map(a => {
                      const p = a.paciente || pacientes.find(pt => pt.id === a.paciente_id);
                      return {
                        id: a.id,
                        pacienteNome: p?.nome || 'Paciente',
                        telefone: p?.telefone || '',
                        text: formatForAgendamento(a, activeTemplate.mensagem),
                        isAgendamento: true,
                      };
                    });
                  handleStartBatchSend(selectedItems);
                }}
                disabled={selectedAgendamentoIds.size === 0}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-extrabold rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-md"
              >
                <Send className="w-4 h-4" />
                <span>Disparar para os {selectedAgendamentoIds.size} Selecionados</span>
              </button>

            </div>
          </div>

          {/* Lista de Agendamentos */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {filteredAgendamentos.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Calendar className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">Nenhum agendamento encontrado.</p>
                <p className="text-xs text-slate-400">Verifique os filtros de horário ou a busca.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredAgendamentos.map(ag => {
                  const patient = ag.paciente || pacientes.find(p => p.id === ag.paciente_id);
                  const dt = new Date(ag.data_hora);
                  const dateStr = dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                  const timeStr = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                  const previewText = formatForAgendamento(ag, activeTemplate.mensagem);
                  const isSelected = selectedAgendamentoIds.has(ag.id);

                  return (
                    <div 
                      key={ag.id} 
                      className={`p-4 sm:p-5 transition-colors flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 ${
                        isSelected ? 'bg-emerald-50/50' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Checkbox de seleção */}
                        <button
                          type="button"
                          onClick={() => handleToggleSelectAgendamento(ag.id)}
                          className="mt-1 p-1 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>

                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-sm text-slate-900">
                              {patient?.nome || 'Paciente sem nome'}
                            </span>
                            <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                              {dateStr} às {timeStr}
                            </span>
                            {ag.lembrete_enviado || apiSentIds.has(ag.id) ? (
                              <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold px-2 py-0.5 rounded-full">
                                <CheckCheck className="w-3 h-3" />
                                Lembrete Enviado
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

                          {/* Prévia da Mensagem */}
                          <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200/80 text-[11px] text-slate-700 font-sans whitespace-pre-line line-clamp-2 max-w-3xl leading-relaxed">
                            {previewText}
                          </div>
                        </div>
                      </div>

                      {/* Ações Individuais */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(previewText);
                            setCopiedId(ag.id);
                            setTimeout(() => setCopiedId(null), 2500);
                          }}
                          className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          {copiedId === ag.id ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                          <span>{copiedId === ag.id ? 'Copiado!' : 'Copiar'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (patient?.telefone) {
                              handleOpenIndividualWhatsApp(patient.telefone, previewText);
                              onMarkReminderSent(ag.id);
                            } else if (showToast) {
                              showToast('Paciente sem telefone cadastrado.', 'error');
                            }
                          }}
                          className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <MessageCircle className="w-4 h-4 text-emerald-600" />
                          <span>Abrir WhatsApp</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (patient?.telefone) {
                              handleSendSingleApi(patient.telefone, previewText, ag.id, () => onMarkReminderSent(ag.id));
                            } else if (showToast) {
                              showToast('Paciente sem telefone cadastrado.', 'error');
                            }
                          }}
                          disabled={sendingApiId === ag.id}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-60 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          {sendingApiId === ag.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          <span>Enviar</span>
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================
          ABA 2: DISPARO EM MASSA & CAMPANHAS (PROMOÇÕES & EVENTOS)
         ======================================================== */}
      {activeTab === 'campanhas' && (
        <div className="space-y-6">
          
          {/* Card de Configuração da Campanha */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-amber-500" />
                  <span>Configurar Campanha de Promoção ou Evento em Massa</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Alcance toda a sua base de clientes cadastrada ou filtre segmentos específicos com condições especiais.
                </p>
              </div>

              {/* Botão de Atalho para Modelos */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold">Usar Modelo Pronto:</span>
                <select
                  value={campaignTemplateId}
                  onChange={e => {
                    setCampaignTemplateId(e.target.value);
                    const found = templates.find(t => t.id === e.target.value);
                    if (found) setCampaignCustomMessage(found.mensagem);
                  }}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                >
                  {templates.filter(t => ['promocao', 'evento', 'reativacao', 'personalizado'].includes(t.categoria)).map(t => (
                    <option key={t.id} value={t.id}>
                      {t.titulo}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Segmentação de Público */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-emerald-600" />
                <span>1. Escolha o Segmento da Base:</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {[
                  { id: 'toda_base', label: 'Toda a Base', desc: 'Todos com WhatsApp', count: totalBaseWhatsApp, icon: Users, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
                  { id: 'ativos', label: 'Clientes Ativos', desc: 'Com agendamento', count: pacientes.filter(p => agendamentos.some(a => a.paciente_id === p.id)).length, icon: Flame, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
                  { id: 'inativos', label: 'Ausentes (+60d)', desc: 'Campanha de resgate', count: pacientesInativos.length, icon: Clock4, color: 'text-amber-600 bg-amber-50 border-amber-200' },
                  { id: 'leads', label: 'Leads / Novos', desc: 'Sem agendamento', count: pacientesLeads.length, icon: Sparkles, color: 'text-blue-600 bg-blue-50 border-blue-200' },
                  { id: 'vip', label: 'Clientes VIP', desc: 'Alta frequência', count: Array.from(vipPatientIds).length, icon: TrendingUp, color: 'text-purple-600 bg-purple-50 border-purple-200' },
                  { id: 'aniversariantes', label: 'Aniversariantes', desc: 'Neste mês', count: aniversariantesMes.length, icon: Gift, color: 'text-pink-600 bg-pink-50 border-pink-200' },
                ].map(seg => {
                  const isCurrent = audienceFilter === seg.id;
                  const Icon = seg.icon;
                  return (
                    <button
                      key={seg.id}
                      type="button"
                      onClick={() => setAudienceFilter(seg.id as AudienceFilter)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isCurrent
                          ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/70 shadow-xs'
                          : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className={`p-1.5 rounded-lg border ${seg.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {seg.count}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 leading-tight">{seg.label}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{seg.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Título & Mensagem da Campanha */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-3 border-t border-slate-100">
              
              <div className="lg:col-span-7 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nome / Título da Campanha (para seu controle)
                  </label>
                  <input
                    type="text"
                    value={campaignTitle}
                    onChange={e => setCampaignTitle(e.target.value)}
                    placeholder="Ex: Semana do Botox - 20% OFF / Convite VIP Coquetel"
                    className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Texto da Mensagem em Massa *
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {campaignActiveMessage.length} caracteres
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    value={campaignActiveMessage}
                    onChange={e => setCampaignCustomMessage(e.target.value)}
                    placeholder="Digite o texto da promoção ou evento aqui... Use {paciente} para inserir o primeiro nome de cada cliente automaticamente."
                    className="w-full px-3.5 py-2.5 text-xs font-sans leading-relaxed border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 text-slate-900 bg-white"
                  />
                </div>

                {/* Variáveis Dinâmicas */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-[11px] font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    Variáveis que o sistema substitui automaticamente para cada paciente:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {['{paciente}', '{clinica}', '{telefone_clinica}', '{endereco}', '{cupom}', '{aniversario_mes}'].map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setCampaignCustomMessage(prev => (prev || campaignActiveMessage) + ' ' + tag)}
                        className="px-2 py-0.5 bg-white border border-slate-200 hover:border-emerald-400 text-[11px] font-mono rounded text-slate-700 hover:text-emerald-800 transition-colors shadow-2xs cursor-pointer"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Preview em Tempo Real no Celular */}
              <div className="lg:col-span-5 flex flex-col">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Prévia WhatsApp (Exemplo: Mariana)</span>
                </label>

                <div className="bg-[#efeae2] rounded-2xl border border-slate-300 p-3 shadow-inner flex flex-col flex-1 relative overflow-hidden">
                  <div className="bg-[#075e54] text-white px-3 py-2 rounded-xl flex items-center justify-between shadow-xs mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-400/40 text-white font-bold flex items-center justify-center text-xs">
                        {clinicaConfig?.nome?.[0] || 'A'}
                      </div>
                      <div>
                        <p className="text-xs font-bold leading-tight">{clinicaConfig?.nome || 'AuraEstética'}</p>
                        <p className="text-[10px] text-emerald-200 leading-tight">Conta Comercial Oficial</p>
                      </div>
                    </div>
                    <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  </div>

                  <div className="p-3.5 bg-white text-slate-800 text-xs rounded-xl shadow-xs border border-slate-200/80 whitespace-pre-line leading-relaxed flex-1">
                    {formatForPatient({ id: 'ex', nome: 'Mariana Silveira', telefone: '(11) 98765-4321' } as any, campaignActiveMessage)}
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Barra de Ação de Disparo da Campanha */}
          <div className="bg-amber-950 text-white p-4 sm:p-5 rounded-2xl border border-amber-800 shadow-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleToggleSelectAllAudience}
                className="p-2 bg-amber-900 hover:bg-amber-800 text-amber-200 rounded-xl transition-colors cursor-pointer"
                title="Alternar Selecionar Todos"
              >
                {selectedPatientIds.size === audiencePatients.length && audiencePatients.length > 0 ? (
                  <CheckSquare className="w-5 h-5 text-amber-400" />
                ) : (
                  <Square className="w-5 h-5" />
                )}
              </button>
              <div>
                <p className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Destinatários da Campanha
                </p>
                <p className="text-sm sm:text-base font-extrabold text-white">
                  {selectedPatientIds.size} pacientes selecionados para receber
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end text-xs">
              
              <button
                type="button"
                onClick={() => {
                  const selectedItems = audiencePatients
                    .filter(p => selectedPatientIds.has(p.id))
                    .map(p => ({
                      pacienteNome: p.nome,
                      telefone: p.telefone,
                      text: formatForPatient(p, campaignActiveMessage),
                    }));
                  handleCopyAllSelected(selectedItems);
                }}
                disabled={selectedPatientIds.size === 0}
                className="px-3.5 py-2.5 bg-amber-900/80 hover:bg-amber-800 disabled:opacity-50 text-amber-200 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                <span>Copiar Mensagens</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const selectedItems = audiencePatients
                    .filter(p => selectedPatientIds.has(p.id))
                    .map(p => ({
                      id: p.id,
                      pacienteNome: p.nome,
                      telefone: p.telefone,
                      mensagem: formatForPatient(p, campaignActiveMessage),
                    }));
                  handleStartWebQueue(selectedItems);
                }}
                disabled={selectedPatientIds.size === 0}
                className="px-4 py-2.5 bg-amber-800 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 text-amber-300" />
                <span>Fila WhatsApp Web</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const selectedItems = audiencePatients
                    .filter(p => selectedPatientIds.has(p.id))
                    .map(p => ({
                      id: p.id,
                      pacienteNome: p.nome,
                      telefone: p.telefone,
                      text: formatForPatient(p, campaignActiveMessage),
                    }));
                  handleStartBatchSend(selectedItems);
                }}
                disabled={selectedPatientIds.size === 0}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-md"
              >
                <Send className="w-4 h-4" />
                <span>Disparar Campanha para os {selectedPatientIds.size} Pacientes</span>
              </button>

            </div>
          </div>

          {/* Lista de Pacientes da Audiência Selecionada */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <span className="font-bold text-slate-800">
                Lista de Pacientes do Segmento Selecionado ({audiencePatients.length})
              </span>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={campaignSearch}
                  onChange={e => setCampaignSearch(e.target.value)}
                  placeholder="Filtrar por nome ou celular..."
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 text-slate-900"
                />
              </div>
            </div>

            {audiencePatients.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-600">Nenhum paciente encontrado neste segmento.</p>
                <p className="text-xs text-slate-400">Tente selecionar outro segmento acima ou limpe a busca.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {audiencePatients.map(p => {
                  const isSelected = selectedPatientIds.has(p.id);
                  const isSent = apiSentIds.has(p.id);
                  const preview = formatForPatient(p, campaignActiveMessage);

                  return (
                    <div 
                      key={p.id} 
                      className={`p-3.5 sm:p-4 transition-colors flex items-center justify-between gap-3 ${
                        isSelected ? 'bg-amber-50/40' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectPatient(p.id)}
                          className="p-1 text-slate-400 hover:text-amber-600 transition-colors cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-amber-600" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                              {p.nome}
                            </span>
                            <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {p.telefone}
                            </span>
                            {vipPatientIds.has(p.id) && (
                              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                                VIP
                              </span>
                            )}
                            {isSent && (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCheck className="w-3 h-3" />
                                Enviado
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenIndividualWhatsApp(p.telefone, preview)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSendSingleApi(p.telefone, preview, p.id)}
                          disabled={sendingApiId === p.id}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span className="hidden sm:inline">Enviar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================
          ABA 3: ANIVERSARIANTES DO MÊS (MIMO & FIDELIZAÇÃO)
         ======================================================== */}
      {activeTab === 'aniversarios' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-700 flex items-center justify-center shrink-0">
                <Cake className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Aniversariantes de {new Date().toLocaleString('pt-BR', { month: 'long' })}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Fidelize seus pacientes enviando felicitações carinhosas com voucher presente no mês de aniversário.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const bdayTemplate = templates.find(t => t.categoria === 'aniversario') || DEFAULT_WHATSAPP_TEMPLATES[6];
                const items = aniversariantesMes.map(p => ({
                  id: p.id,
                  pacienteNome: p.nome,
                  telefone: p.telefone,
                  text: formatForPatient(p, bdayTemplate.mensagem),
                }));
                handleStartBatchSend(items);
              }}
              disabled={aniversariantesMes.length === 0}
              className="px-4 py-2.5 bg-pink-600 hover:bg-pink-700 active:bg-pink-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Gift className="w-4 h-4" />
              <span>Parabenizar Todos os {aniversariantesMes.length} Aniversariantes</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {aniversariantesMes.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Cake className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-600">Nenhum aniversariante cadastrado para este mês.</p>
                <p className="text-xs text-slate-400">Certifique-se de preencher a data de nascimento no cadastro dos pacientes.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {aniversariantesMes.map(p => {
                  const bdayTemplate = templates.find(t => t.categoria === 'aniversario') || DEFAULT_WHATSAPP_TEMPLATES[6];
                  const msg = formatForPatient(p, bdayTemplate.mensagem);
                  const isSent = apiSentIds.has(p.id);

                  // Verificar se é hoje
                  let isToday = false;
                  try {
                    const day = parseInt(p.data_nascimento.split('-')[2] || '0', 10);
                    isToday = day === currentDay;
                  } catch {
                    isToday = false;
                  }

                  return (
                    <div key={p.id} className="p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-slate-900">{p.nome}</span>
                          <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-pink-50 text-pink-700 font-bold border border-pink-200">
                            Nascimento: {p.data_nascimento}
                          </span>
                          {isToday && (
                            <span className="text-[10px] font-extrabold bg-pink-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                              🎉 ANIVERSARIANTE DE HOJE!
                            </span>
                          )}
                          {isSent && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCheck className="w-3 h-3" />
                              Mensagem Enviada
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 font-mono">Telefone: {p.telefone}</p>

                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-700 whitespace-pre-line line-clamp-2 max-w-2xl">
                          {msg}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenIndividualWhatsApp(p.telefone, msg)}
                          className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <MessageCircle className="w-4 h-4 text-emerald-600" />
                          <span>Abrir WhatsApp</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSendSingleApi(p.telefone, msg, p.id)}
                          disabled={sendingApiId === p.id}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Send className="w-4 h-4" />
                          <span>Enviar Mimo</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          ABA 4: RETORNOS & PÓS-PROCEDIMENTO (PÓS-VENDA)
         ======================================================== */}
      {activeTab === 'retornos' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <Repeat className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Pacientes Aguardando Retorno & Avaliação Pós
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Convide pacientes que realizaram procedimentos há 7, 15, 30 ou 60 dias para a consulta de revisão e retoque.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const retTemplate = templates.find(t => t.categoria === 'retorno') || DEFAULT_WHATSAPP_TEMPLATES[3];
                const items = alertasRetorno.map(al => ({
                  id: al.id,
                  pacienteNome: al.paciente_nome,
                  telefone: al.telefone,
                  text: formatWhatsAppMessage(retTemplate.mensagem, {
                    paciente: { id: al.paciente_id, nome: al.paciente_nome, telefone: al.telefone } as any,
                    agendamento: { procedimento: al.procedimento_origem } as any,
                    clinicaConfig,
                    procedimentos,
                    usuarios,
                  }),
                }));
                handleStartBatchSend(items);
              }}
              disabled={alertasRetorno.length === 0}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span>Convidar Todos os {alertasRetorno.length} Retornos</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {alertasRetorno.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Repeat className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-600">Nenhum alerta de retorno pendente no momento.</p>
                <p className="text-xs text-slate-400">Novos alertas são gerados automaticamente após a realização dos atendimentos.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {alertasRetorno.map(al => {
                  const retTemplate = templates.find(t => t.categoria === 'retorno') || DEFAULT_WHATSAPP_TEMPLATES[3];
                  const msg = formatWhatsAppMessage(retTemplate.mensagem, {
                    paciente: { id: al.paciente_id, nome: al.paciente_nome, telefone: al.telefone } as any,
                    agendamento: { procedimento: al.procedimento_origem } as any,
                    clinicaConfig,
                    procedimentos,
                    usuarios,
                  });

                  return (
                    <div key={al.id} className="p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-slate-900">{al.paciente_nome}</span>
                          <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold border border-purple-200">
                            {al.dias_apos} dias pós {al.procedimento_origem}
                          </span>
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
                            Ideal: {al.data_ideal_retorno}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 font-mono">Telefone: {al.telefone}</p>

                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-700 whitespace-pre-line line-clamp-2 max-w-2xl">
                          {msg}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenIndividualWhatsApp(al.telefone, msg)}
                          className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <MessageCircle className="w-4 h-4 text-emerald-600" />
                          <span>WhatsApp</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSendSingleApi(al.telefone, msg, al.id)}
                          disabled={sendingApiId === al.id}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Send className="w-4 h-4" />
                          <span>Convidar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          ABA 5: CENTRAL DE MODELOS DE MENSAGEM (TEMPLATES)
         ======================================================== */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-600" />
                <span>Modelos de Mensagens Automáticas ({templates.length})</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Crie e edite mensagens de confirmação, cuidados, promoções, eventos, aniversários e reativação.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(true)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Restaurar Textos de Fábrica</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTemplateToEdit(null);
                  setIsModalOpen(true);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Modelo</span>
              </button>
            </div>
          </div>

          {/* Grid de Modelos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {templates.map(tpl => (
              <div
                key={tpl.id}
                className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3 hover:border-emerald-500/50 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-slate-50 text-slate-700 border-slate-200">
                      {tpl.categoria.toUpperCase()}
                    </span>
                    {tpl.gatilho_sugerido && (
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                        {tpl.gatilho_sugerido}
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{tpl.titulo}</h4>

                  <p className="text-[11px] text-slate-600 font-sans whitespace-pre-line line-clamp-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {tpl.mensagem}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setTemplateToEdit(tpl);
                      setIsModalOpen(true);
                    }}
                    className="font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar Texto</span>
                  </button>

                  {!tpl.padrao && (
                    <button
                      type="button"
                      onClick={() => setTemplateToDelete(tpl)}
                      className="text-slate-400 hover:text-rose-600 p-1 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                      title="Excluir Modelo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          ABA 6: HISTÓRICO DE CAMPANHAS E DISPAROS
         ======================================================== */}
      {activeTab === 'historico' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                <span>Histórico de Campanhas & Disparos em Massa</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Registro de envios em massa realizados para a base de clientes com contadores de entrega.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            {campanhas.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <History className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-600">Nenhum disparo em massa registrado ainda.</p>
                <p className="text-xs text-slate-400">Ao realizar disparos agrupados na aba de Agenda ou Campanhas, o histórico aparecerá aqui.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {campanhas.map(c => {
                  const d = new Date(c.criado_em);
                  const dateStr = d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div key={c.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-slate-900">{c.titulo}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {c.tipo.toUpperCase()}
                          </span>
                          <span className="text-xs font-mono text-slate-400">{dateStr}</span>
                        </div>

                        {c.filtros_aplicados && (
                          <p className="text-xs text-slate-500 font-medium">
                            Público: {c.filtros_aplicados} • Por: {c.criado_por || 'Sistema'}
                          </p>
                        )}

                        <p className="text-[11px] text-slate-600 line-clamp-1 italic">
                          "{c.mensagem.replace(/\n+/g, ' ')}"
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 text-xs">
                        <div className="text-right">
                          <p className="font-bold text-emerald-600">{c.total_enviados} enviados</p>
                          {c.total_erros > 0 && <p className="text-[11px] text-rose-500 font-semibold">{c.total_erros} falhas</p>}
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                          {Math.round((c.total_enviados / (c.total_destinatarios || 1)) * 100)}% Sucesso
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL DE DISPARO EM LOTE PROGRESSIVO (BARRA DE PROGRESSO)
         ======================================================== */}
      {isBatchSending && batchProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-w-lg w-full space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Disparando Mensagens em Lote...
                </h3>
                <p className="text-xs text-slate-500">
                  Enviando com intervalo de segurança anti-bloqueio para a API oficial.
                </p>
              </div>
            </div>

            {/* Barra de Progresso */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Progresso: {batchProgress.current} de {batchProgress.total}</span>
                <span>{Math.round((batchProgress.current / batchProgress.total) * 100)}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div 
                  className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
                  style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                />
              </div>
            </div>

            {/* Status Atual */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <p className="text-slate-500">
                Paciente atual: <strong className="text-slate-900">{batchProgress.currentPatientName}</strong>
              </p>
              <div className="flex items-center gap-4 text-[11px] font-mono">
                <span className="text-emerald-700 font-bold">✓ {batchProgress.success} com sucesso</span>
                <span className="text-rose-600 font-bold">✕ {batchProgress.failed} falhas</span>
              </div>
            </div>

            {batchProgress.current === batchProgress.total ? (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsBatchSending(false)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Concluir e Fechar
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-center text-slate-400">
                Por favor, não feche esta tela enquanto o disparo estiver em andamento.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL DE FILA INTERATIVA WHATSAPP WEB (PASSO A PASSO)
         ======================================================== */}
      {webQueueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 max-w-lg w-full space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Fila de Envio WhatsApp Web
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setWebQueueModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Indicador de Passo */}
            <div className="flex justify-between items-center text-xs font-bold text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span>Paciente {webQueueModal.currentIndex + 1} de {webQueueModal.items.length}</span>
              <span className="font-mono text-emerald-700">
                {Math.round(((webQueueModal.currentIndex + 1) / webQueueModal.items.length) * 100)}%
              </span>
            </div>

            {/* Paciente Atual */}
            {webQueueModal.items[webQueueModal.currentIndex] && (
              <div className="space-y-3">
                <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200">
                  <p className="text-xs font-bold text-emerald-900">
                    {webQueueModal.items[webQueueModal.currentIndex].pacienteNome}
                  </p>
                  <p className="text-[11px] font-mono text-emerald-700">
                    Telefone: {webQueueModal.items[webQueueModal.currentIndex].telefone}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 whitespace-pre-line max-h-48 overflow-y-auto leading-relaxed">
                  {webQueueModal.items[webQueueModal.currentIndex].mensagem}
                </div>

                <div className="flex items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const cur = webQueueModal.items[webQueueModal.currentIndex];
                      handleOpenIndividualWhatsApp(cur.telefone, cur.mensagem);
                      if (cur.isAgendamento) onMarkReminderSent(cur.id);
                    }}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Abrir Conversa no WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (webQueueModal.currentIndex + 1 < webQueueModal.items.length) {
                        setWebQueueModal(prev => prev ? { ...prev, currentIndex: prev.currentIndex + 1 } : null);
                      } else {
                        setWebQueueModal(null);
                        if (showToast) showToast('Fila de envio finalizada!', 'success');
                      }
                    }}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{webQueueModal.currentIndex + 1 < webQueueModal.items.length ? 'Próximo' : 'Concluir'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          ABA 7: GUIA CLOUD API & VARIÁVEIS DE AMBIENTE (SECRETS)
         ======================================================== */}
      {activeTab === 'configuracao' && (
        <div className="space-y-4">
          <WhatsAppCloudApiConfigGuide
            showToast={showToast}
            onClose={() => setActiveTab('agenda')}
          />
        </div>
      )}

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
                Excluir modelo de mensagem?
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Você tem certeza que deseja excluir o modelo <strong>"{templateToDelete.titulo}"</strong>?
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
                Esta ação restaura os textos originais das mensagens de fábrica da clínica.
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

      {/* Modal Completo do Guia de Configuração da API do WhatsApp Cloud */}
      <WhatsAppCloudApiConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => {
          setIsConfigModalOpen(false);
          checkCloudApiStatus();
        }}
        showToast={showToast}
        onOpenWebhookGuide={() => {
          setIsConfigModalOpen(false);
          setIsWebhookModalOpen(true);
        }}
      />

      {/* Modal Dedicado de Instruções do Webhook URL (Meta Developers Console & server/whatsapp.ts) */}
      <WhatsAppWebhookSetupModal
        isOpen={isWebhookModalOpen}
        onClose={() => setIsWebhookModalOpen(false)}
        showToast={showToast}
      />

    </div>
  );
};
