import { Agendamento, Paciente, ClinicaConfig } from '../types';

/**
 * Utilitários para geração de arquivos iCalendar (.ICS) segundo a norma RFC 5545
 * e links diretos para Google Agenda e Microsoft Outlook.
 */

// Formata data Date para padrão UTC iCalendar: YYYYMMDDTHHMMSSZ
export function formatIcsDateUtc(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    date.getUTCFullYear().toString() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  );
}

// Escapa caracteres especiais para formato iCalendar (RFC 5545)
export function escapeIcsText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

// Helper para obter datas de início e término seguras
export function getAppointmentStartAndEndDates(agendamento: Agendamento): { startDate: Date; endDate: Date } {
  let startDate: Date;
  try {
    startDate = new Date(agendamento.data_hora);
    if (isNaN(startDate.getTime())) {
      startDate = new Date();
    }
  } catch {
    startDate = new Date();
  }

  const duracaoMinutos = Number(agendamento.duracao_minutos) || 45;
  const endDate = new Date(startDate.getTime() + duracaoMinutos * 60 * 1000);

  return { startDate, endDate };
}

// Gera o bloco VEVENT para um agendamento individual
export function generateVEvent(
  agendamento: Agendamento,
  paciente?: Paciente,
  clinicaConfig?: ClinicaConfig
): string {
  const { startDate, endDate } = getAppointmentStartAndEndDates(agendamento);
  const now = new Date();

  const pacienteNome = paciente?.nome || agendamento.paciente?.nome || 'Paciente';
  const pacienteTelefone = paciente?.telefone || agendamento.paciente?.telefone || '';
  const profissionalNome = agendamento.profissional_nome || 'Profissional Responsável';
  const clinicaNome = clinicaConfig?.nome || 'Clínica Aura Estética';
  const clinicaEndereco = clinicaConfig?.endereco || '';
  const clinicaTelefone = clinicaConfig?.telefone || '';

  const summary = `Consulta: ${agendamento.procedimento} - ${pacienteNome}`;
  
  const descriptionLines = [
    `Procedimento: ${agendamento.procedimento}`,
    `Paciente: ${pacienteNome}${pacienteTelefone ? ` (${pacienteTelefone})` : ''}`,
    `Profissional Responsável: ${profissionalNome}${agendamento.profissional_cargo ? ` - ${agendamento.profissional_cargo}` : ''}`,
    `Status: ${agendamento.status}`,
    `Duração Prevista: ${agendamento.duracao_minutos || 45} min`,
    agendamento.valor_estimado ? `Valor Estimado: R$ ${agendamento.valor_estimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : null,
    agendamento.observacoes ? `Observações Clínicas: ${agendamento.observacoes}` : null,
    `Local: ${clinicaNome}${clinicaEndereco ? ` - ${clinicaEndereco}` : ''}${clinicaTelefone ? ` | Tel: ${clinicaTelefone}` : ''}`,
    `\nAgendado via Sistema de Gestão EstéticaOS`
  ].filter(Boolean) as string[];

  const description = descriptionLines.join('\n');
  const location = clinicaEndereco ? `${clinicaNome}, ${clinicaEndereco}` : clinicaNome;

  const uid = `agendamento-${agendamento.id || Date.now()}@auraestetica`;
  const dtStamp = formatIcsDateUtc(now);
  const dtStart = formatIcsDateUtc(startDate);
  const dtEnd = formatIcsDateUtc(endDate);

  const lines = [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(location)}`,
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'SEQUENCE:0',
    // Alarme 1: 1 hora antes
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    `DESCRIPTION:Lembrete de Consulta em 1 hora: ${escapeIcsText(agendamento.procedimento)} com ${escapeIcsText(pacienteNome)}`,
    'END:VALARM',
    // Alarme 2: 24 horas antes
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'ACTION:DISPLAY',
    `DESCRIPTION:Lembrete: Consulta amanhã: ${escapeIcsText(agendamento.procedimento)} - ${escapeIcsText(clinicaNome)}`,
    'END:VALARM',
    'END:VEVENT'
  ];

  return lines.join('\r\n');
}

/**
 * Gera a string completa de arquivo .ics RFC 5545 para um ou múltiplos agendamentos
 */
export function generateIcsContent(
  agendamentos: Agendamento | Agendamento[],
  pacientes: Paciente[] = [],
  clinicaConfig?: ClinicaConfig,
  calendarioNome = 'Agenda Clínica Aura Estética'
): string {
  const lista = Array.isArray(agendamentos) ? agendamentos : [agendamentos];
  const header = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Aura Estética//Agendamentos Clínicos//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(calendarioNome)}`,
    'X-WR-TIMEZONE:America/Sao_Paulo'
  ].join('\r\n');

  const events = lista.map(ag => {
    const paciente = pacientes.find(p => p.id === ag.paciente_id) || ag.paciente;
    return generateVEvent(ag, paciente, clinicaConfig);
  }).join('\r\n');

  const footer = '\r\nEND:VCALENDAR';

  return `${header}\r\n${events}${footer}`;
}

/**
 * Dispara o download automático do arquivo .ics no navegador do usuário
 */
export function downloadIcsFile(
  agendamentos: Agendamento | Agendamento[],
  pacientes: Paciente[] = [],
  clinicaConfig?: ClinicaConfig,
  customFileName?: string
): void {
  const icsContent = generateIcsContent(agendamentos, pacientes, clinicaConfig);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  let filename = customFileName;
  if (!filename) {
    if (!Array.isArray(agendamentos)) {
      const paciente = pacientes.find(p => p.id === agendamentos.paciente_id) || agendamentos.paciente;
      const cleanName = (paciente?.nome || 'paciente')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-');
      const datePart = (agendamentoDateToSimpleStr(agendamentos.data_hora));
      filename = `agendamento-${cleanName}-${datePart}.ics`;
    } else {
      filename = `agenda-consultas-${new Date().toISOString().split('T')[0]}.ics`;
    }
  }

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.ics') ? filename : `${filename}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function agendamentoDateToSimpleStr(iso?: string): string {
  try {
    if (!iso) return 'data';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? 'data' : d.toISOString().split('T')[0];
  } catch {
    return 'data';
  }
}

/**
 * Gera URL de abertura direta no Google Agenda Web com dados preenchidos
 */
export function getGoogleCalendarWebUrl(
  agendamento: Agendamento,
  paciente?: Paciente,
  clinicaConfig?: ClinicaConfig
): string {
  const { startDate, endDate } = getAppointmentStartAndEndDates(agendamento);
  const pacienteNome = paciente?.nome || agendamento.paciente?.nome || 'Paciente';
  const pacienteTelefone = paciente?.telefone || agendamento.paciente?.telefone || '';
  const profissionalNome = agendamento.profissional_nome || 'Profissional';
  const clinicaNome = clinicaConfig?.nome || 'Clínica Aura Estética';
  const clinicaEndereco = clinicaConfig?.endereco || '';

  const title = `Consulta: ${agendamento.procedimento} - ${pacienteNome}`;
  const details = [
    `Procedimento: ${agendamento.procedimento}`,
    `Paciente: ${pacienteNome}${pacienteTelefone ? ` (${pacienteTelefone})` : ''}`,
    `Profissional Responsável: ${profissionalNome}`,
    `Status: ${agendamento.status}`,
    agendamento.observacoes ? `Observações: ${agendamento.observacoes}` : null,
    `Local: ${clinicaNome}${clinicaEndereco ? ` - ${clinicaEndereco}` : ''}`
  ].filter(Boolean).join('\n');

  const location = clinicaEndereco ? `${clinicaNome}, ${clinicaEndereco}` : clinicaNome;
  const dates = `${formatIcsDateUtc(startDate)}/${formatIcsDateUtc(endDate)}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: dates,
    details: details,
    location: location
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Gera URL de abertura no Outlook Calendar Web
 */
export function getOutlookWebUrl(
  agendamento: Agendamento,
  paciente?: Paciente,
  clinicaConfig?: ClinicaConfig
): string {
  const { startDate, endDate } = getAppointmentStartAndEndDates(agendamento);
  const pacienteNome = paciente?.nome || agendamento.paciente?.nome || 'Paciente';
  const profissionalNome = agendamento.profissional_nome || 'Profissional';
  const clinicaNome = clinicaConfig?.nome || 'Clínica Aura Estética';
  const clinicaEndereco = clinicaConfig?.endereco || '';

  const subject = `Consulta: ${agendamento.procedimento} - ${pacienteNome}`;
  const body = `Procedimento: ${agendamento.procedimento}\nPaciente: ${pacienteNome}\nProfissional: ${profissionalNome}\nClínica: ${clinicaNome}`;
  const location = clinicaEndereco ? `${clinicaNome}, ${clinicaEndereco}` : clinicaNome;

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: subject,
    startdt: startDate.toISOString(),
    enddt: endDate.toISOString(),
    body: body,
    location: location
  });

  return `https://outlook.live.com/calendar/0/action/compose?${params.toString()}`;
}

/**
 * Mensagem formatada de resumo do agendamento para compartilhar no WhatsApp / E-mail
 */
export function getAppointmentShareSummary(
  agendamento: Agendamento,
  paciente?: Paciente,
  clinicaConfig?: ClinicaConfig
): string {
  const { startDate } = getAppointmentStartAndEndDates(agendamento);
  const pacienteNome = paciente?.nome || agendamento.paciente?.nome || 'Paciente';
  const profissionalNome = agendamento.profissional_nome || 'Profissional Responsável';
  const clinicaNome = clinicaConfig?.nome || 'Clínica Aura Estética';
  const clinicaEndereco = clinicaConfig?.endereco || '';
  const clinicaTelefone = clinicaConfig?.telefone || '';

  const dataFormatada = startDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const horaFormatada = startDate.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return [
    `✨ *Confirmação de Agendamento - ${clinicaNome}* ✨`,
    ``,
    `👤 *Paciente:* ${pacienteNome}`,
    `💉 *Procedimento:* ${agendamento.procedimento}`,
    `👩‍⚕️ *Profissional:* ${profissionalNome}`,
    `🗓 *Data:* ${dataFormatada}`,
    `⏰ *Horário:* ${horaFormatada}`,
    `⏳ *Duração Estimada:* ${agendamento.duracao_minutos || 45} minutos`,
    clinicaEndereco ? `📍 *Endereço:* ${clinicaEndereco}` : null,
    clinicaTelefone ? `📞 *Contato:* ${clinicaTelefone}` : null,
    agendamento.observacoes ? `📝 *Observações:* ${agendamento.observacoes}` : null,
    ``,
    `📅 _Um arquivo de calendário (.ics) foi gerado para adicionar este compromisso ao Google Agenda ou Apple Calendar do seu celular._`
  ].filter(line => line !== null).join('\n');
}
