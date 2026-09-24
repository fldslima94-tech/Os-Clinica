import { WhatsAppTemplate, Agendamento, Paciente, ClinicaConfig, ProcedimentoClinico, UsuarioEquipe } from '../types';
import { COLLECTIONS, saveDocument, removeDocument, subscribeToCollection } from './firebaseService';

const STORAGE_KEY = 'aura_whatsapp_templates_v2';

export const DEFAULT_WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'template-confirmacao-padrao',
    titulo: '1. Confirmação (24h antes)',
    categoria: 'confirmacao',
    gatilho_sugerido: '24h antes',
    descricao: 'Lembrete de data, horário, profissional e opção 1 ou 2 para confirmar ou remarcar.',
    ativo: true,
    padrao: true,
    ordem: 1,
    mensagem: `Olá, *{paciente}*! Tudo bem? ✨

Passando para lembrar do seu agendamento de *{procedimento}* na *{clinica}*:
🗓 *Data:* {data}
⏰ *Horário:* {horario}
👩‍⚕️ *Profissional:* {profissional}

Por gentileza, responda:
*1* para *Confirmar presença*
*2* para *Remarcar horário*

Estamos ansiosos para recebê-lo(a)!`,
  },
  {
    id: 'template-pre-cuidados-padrao',
    titulo: '2. Cuidados Pré-Procedimento',
    categoria: 'pre_cuidados',
    gatilho_sugerido: '24h a 48h antes',
    descricao: 'Orientações prévias: evitar álcool, aspirina, comparecer com pele limpa.',
    ativo: true,
    padrao: true,
    ordem: 2,
    mensagem: `Olá, *{paciente}*! Tudo bem? ✨

Seu procedimento de *{procedimento}* com *{profissional}* está chegando ({data} às {horario}).

📌 *Orientações Importantes Pré-Procedimento:*
• Evite bebidas alcoólicas e anti-inflamatórios 24h antes.
• Venha com a pele limpa e sem maquiagem pesada.
• Em caso de sintomas gripais ou lesão ativa no local, avise nossa equipe com antecedência.
• Mantenha-se bem hidratado(a).

Até breve na {clinica}! Qualquer dúvida, estamos à disposição.`,
  },
  {
    id: 'template-pos-cuidados-padrao',
    titulo: '3. Cuidados Pós-Sessão',
    categoria: 'pos_cuidados',
    gatilho_sugerido: 'Imediatamente após',
    descricao: 'Recomendações pós-sessão: não massagear 4h a 6h, proteção solar e repouso.',
    ativo: true,
    padrao: true,
    ordem: 3,
    mensagem: `Olá, *{paciente}*! Esperamos que esteja se sentindo ótima após seu procedimento de *{procedimento}* com *{profissional}*! 💖

✨ *Lembretes Importantes de Cuidados Pós:*
• Não massagear ou comprimir a região tratada nas primeiras 4 a 6 horas.
• Evite atividades físicas intensas e exposição solar direta hoje.
• Mantenha a pele bem hidratada e aplique protetor solar FPS 50+.
• Beba bastante água para potencializar os resultados.

Qualquer dúvida ou desconforto, nossa equipe na {clinica} está à sua total disposição!`,
  },
  {
    id: 'template-retorno-padrao',
    titulo: '4. Retorno / Avaliação 15d',
    categoria: 'retorno',
    gatilho_sugerido: '15 dias pós',
    descricao: 'Convite para consulta de retorno e avaliação da evolução clínica.',
    ativo: true,
    padrao: true,
    ordem: 4,
    mensagem: `Olá, *{paciente}*! Como está o resultado do seu procedimento de *{procedimento}*? ✨

Já se passaram os primeiros dias de acomodação do resultado e gostaríamos de convidar você para sua *Consulta de Retorno e Avaliação Clínica* com *{profissional}*.

Podemos verificar uma data e horário esta semana na {clinica}?`,
  },
  {
    id: 'template-promocao-padrao',
    titulo: '5. Promoção & Oferta Especial',
    categoria: 'promocao',
    gatilho_sugerido: 'Disparo em Massa',
    descricao: 'Divulgação de condições exclusivas, campanhas e semanas promocionais para a base de pacientes.',
    ativo: true,
    padrao: true,
    ordem: 5,
    mensagem: `Olá, *{paciente}*! Tudo bem? ✨

Temos uma novidade especial para você na *{clinica}*! 💖

🎉 *Semana Especial de Cuidados & Procedimentos*
Preparamos uma condição exclusiva com condições facilitadas e mimos especiais para os atendimentos agendados esta semana!

✨ Vagas limitadas para garantir sua experiência VIP.

Gostaria de conhecer as condições especiais e garantir seu horário? Responda com *SIM* e te enviamos todos os detalhes!`,
  },
  {
    id: 'template-evento-padrao',
    titulo: '6. Convite para Evento / Coquetel VIP',
    categoria: 'evento',
    gatilho_sugerido: 'Evento / Lançamento',
    descricao: 'Convite exclusivo para coquetel, dia do Botox, inaugurações ou apresentação de novas tecnologias.',
    ativo: true,
    padrao: true,
    ordem: 6,
    mensagem: `Olá, *{paciente}*! Tudo bem? 🥂✨

Você é nossa convidada de honra para o *Encontro VIP de Estética & Bem-Estar* na *{clinica}*!

🗓 *Quando:* Em breve!
📍 *Local:* {endereco}
🍾 *Programação:* Demonstração de protocolos, coquetel exclusivo e condições inéditas para tratamentos.

Sua presença é muito especial para nós! Confirme sua presença respondendo com *QUERO IR* para incluirmos seu nome na lista VIP!`,
  },
  {
    id: 'template-aniversario-padrao',
    titulo: '7. Felicitações & Mimo de Aniversário',
    categoria: 'aniversario',
    gatilho_sugerido: 'No Mês / Dia de Aniversário',
    descricao: 'Mensagem carinhosa de parabéns com voucher de presente ou desconto de aniversário.',
    ativo: true,
    padrao: true,
    ordem: 7,
    mensagem: `Parabéns pelo seu dia, *{paciente}*! 🎂✨🎉

Toda a equipe da *{clinica}* deseja um novo ciclo repleto de saúde, alegria, realizações e muita autoestima!

Para celebrar junto com você, preparamos um *Presente Exclusivo de Aniversário*:
🎁 *Voucher Especial de Aniversário* para usar em qualquer procedimento ou home care durante todo o seu mês de aniversário!

Que tal agendar um momento especial de autocuidado para comemorar?`,
  },
  {
    id: 'template-reativacao-padrao',
    titulo: '8. Reativação de Clientes Ausentes',
    categoria: 'reativacao',
    gatilho_sugerido: '+60 dias sem agendamento',
    descricao: 'Mensagem carinhosa para resgatar pacientes que não visitam a clínica há algum tempo.',
    ativo: true,
    padrao: true,
    ordem: 8,
    mensagem: `Olá, *{paciente}*! Tudo bem? Sentimos muito a sua falta aqui na *{clinica}*! 🌸✨

Faz algum tempo que não cuidamos de você e gostaríamos de saber como está sua pele e seu bem-estar!

Preparamos uma *Cortesia Especial de Retorno*:
✨ *Revitalização Facial com Avaliação Personalizada* de cortesia no agendamento do seu próximo procedimento.

Podemos verificar um horário confortável para você esta semana? Adoraríamos te receber novamente!`,
  },
];

/**
 * Carrega templates do localStorage local com fallback para os templates padrão
 */
export function getStoredWhatsAppTemplates(): WhatsAppTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[whatsappTemplateService] Erro ao ler templates do localStorage:', err);
  }
  return DEFAULT_WHATSAPP_TEMPLATES;
}

/**
 * Salva localmente
 */
export function saveStoredWhatsAppTemplates(templates: WhatsAppTemplate[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch (err) {
    console.warn('[whatsappTemplateService] Erro ao salvar templates no localStorage:', err);
  }
}

/**
 * Substitui as variáveis {paciente}, {procedimento}, {data}, {horario}, {profissional}, etc.
 */
export function formatWhatsAppMessage(
  templateText: string,
  options: {
    agendamento?: Agendamento;
    paciente?: Paciente;
    clinicaConfig?: ClinicaConfig;
    procedimentos?: ProcedimentoClinico[];
    usuarios?: UsuarioEquipe[];
  }
): string {
  const { agendamento, paciente, clinicaConfig, procedimentos, usuarios } = options;

  const patientName = paciente?.nome || agendamento?.paciente?.nome || 'Paciente';
  const firstName = patientName.split(' ')[0] || patientName;
  const clinicName = clinicaConfig?.nome || 'Aura Estética Avançada';
  const clinicPhone = clinicaConfig?.telefone || '(11) 98765-4321';
  const clinicAddress = clinicaConfig?.endereco || 'Av. Paulista, 1000 - Jardins, São Paulo/SP';

  let dateStr = 'Data a confirmar';
  let timeStr = 'Horário a confirmar';
  if (agendamento?.data_hora) {
    try {
      const dt = new Date(agendamento.data_hora);
      dateStr = dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      timeStr = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      // ignore
    }
  }

  const procedureName = agendamento?.procedimento || 'Procedimento Estético';

  // Descobrir nome do profissional / gestor local
  let professionalName = agendamento?.profissional_nome || '';
  if (!professionalName && agendamento?.profissional_id && usuarios) {
    const prof = usuarios.find(u => u.id === agendamento.profissional_id);
    if (prof) professionalName = prof.nome;
  }
  if (!professionalName && procedimentos) {
    const proc = procedimentos.find(p => p.nome.toLowerCase() === procedureName.toLowerCase());
    if (proc?.profissional_nome) {
      professionalName = proc.profissional_nome;
    }
  }
  if (!professionalName) {
    professionalName = 'Nossa Especialista';
  }

  return templateText
    .replace(/\{paciente\}/gi, firstName)
    .replace(/\{nome_completo\}/gi, patientName)
    .replace(/\{primeiro_nome\}/gi, firstName)
    .replace(/\{procedimento\}/gi, procedureName)
    .replace(/\{data\}/gi, dateStr)
    .replace(/\{horario\}/gi, timeStr)
    .replace(/\{hora\}/gi, timeStr)
    .replace(/\{profissional\}/gi, professionalName)
    .replace(/\{clinica\}/gi, clinicName)
    .replace(/\{telefone_clinica\}/gi, clinicPhone)
    .replace(/\{endereco\}/gi, clinicAddress)
    .replace(/\{dias_retorno\}/gi, '15')
    .replace(/\{cupom\}/gi, 'VIP15')
    .replace(/\{aniversario_mes\}/gi, new Date().toLocaleString('pt-BR', { month: 'long' }));
}

const CAMPAIGNS_STORAGE_KEY = 'aura_whatsapp_campanhas_v1';

export function getStoredWhatsAppCampanhas(): import('../types').WhatsAppCampanha[] {
  try {
    const raw = localStorage.getItem(CAMPAIGNS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('[whatsappTemplateService] Erro ao ler campanhas do localStorage:', err);
  }
  return [];
}

export function saveStoredWhatsAppCampanhas(campanhas: import('../types').WhatsAppCampanha[]): void {
  try {
    localStorage.setItem(CAMPAIGNS_STORAGE_KEY, JSON.stringify(campanhas));
  } catch (err) {
    console.warn('[whatsappTemplateService] Erro ao salvar campanhas no localStorage:', err);
  }
}

export async function persistWhatsAppCampanha(campanha: import('../types').WhatsAppCampanha): Promise<void> {
  const current = getStoredWhatsAppCampanhas();
  const index = current.findIndex(c => c.id === campanha.id);
  let updatedList: import('../types').WhatsAppCampanha[];
  if (index >= 0) {
    updatedList = [...current];
    updatedList[index] = campanha;
  } else {
    updatedList = [campanha, ...current];
  }
  saveStoredWhatsAppCampanhas(updatedList);

  try {
    await saveDocument(COLLECTIONS.WHATSAPP_CAMPANHAS, campanha);
  } catch (err) {
    console.warn('[whatsappTemplateService] Erro ao persistir campanha no Firestore:', err);
  }
}

/**
 * Salva ou atualiza um template no Firestore e no cache local
 */
export async function persistWhatsAppTemplate(template: WhatsAppTemplate): Promise<void> {
  // 1. Atualizar LocalStorage imediatamente
  const current = getStoredWhatsAppTemplates();
  const index = current.findIndex(t => t.id === template.id);
  let updatedList: WhatsAppTemplate[];
  if (index >= 0) {
    updatedList = [...current];
    updatedList[index] = { ...template, atualizado_em: new Date().toISOString() };
  } else {
    updatedList = [...current, { ...template, criado_em: new Date().toISOString() }];
  }
  saveStoredWhatsAppTemplates(updatedList);

  // 2. Persistir no Firestore
  try {
    await saveDocument(COLLECTIONS.WHATSAPP_TEMPLATES, template);
  } catch (err) {
    console.warn('[whatsappTemplateService] Aviso ao salvar no Firestore (mantido local):', err);
  }
}

/**
 * Remove um template (se não for nativo ou se o usuário optar por excluir)
 */
export async function deleteWhatsAppTemplate(templateId: string): Promise<void> {
  const current = getStoredWhatsAppTemplates();
  const filtered = current.filter(t => t.id !== templateId);
  saveStoredWhatsAppTemplates(filtered);

  try {
    await removeDocument(COLLECTIONS.WHATSAPP_TEMPLATES, templateId);
  } catch (err) {
    console.warn('[whatsappTemplateService] Erro ao remover do Firestore:', err);
  }
}

/**
 * Restaura um template nativo para o texto padrão original de fábrica
 */
export async function resetDefaultTemplate(templateId: string): Promise<WhatsAppTemplate | null> {
  const defaultFound = DEFAULT_WHATSAPP_TEMPLATES.find(t => t.id === templateId);
  if (!defaultFound) return null;

  await persistWhatsAppTemplate(defaultFound);
  return defaultFound;
}
