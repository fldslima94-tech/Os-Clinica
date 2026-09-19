import { getValidAccessToken, GOOGLE_CALENDAR_SCOPE } from './googleAuthService';

export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  htmlLink?: string;
}

const CALENDAR_API_URL = 'https://www.googleapis.com/calendar/v3';

/**
 * Cria um evento no Google Calendar principal do usuário
 */
export async function createCalendarEvent(
  event: GoogleCalendarEvent,
  calendarId: string = 'primary'
): Promise<GoogleCalendarEvent> {
  const token = await getValidAccessToken(GOOGLE_CALENDAR_SCOPE);

  const res = await fetch(`${CALENDAR_API_URL}/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Falha ao criar agendamento no Google Calendar (${res.status})`);
  }

  return await res.json();
}

/**
 * Atualiza um evento existente no Google Calendar
 */
export async function updateCalendarEvent(
  eventId: string,
  event: Partial<GoogleCalendarEvent>,
  calendarId: string = 'primary'
): Promise<GoogleCalendarEvent> {
  const token = await getValidAccessToken(GOOGLE_CALENDAR_SCOPE);

  const res = await fetch(`${CALENDAR_API_URL}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Falha ao atualizar agendamento no Google Calendar (${res.status})`);
  }

  return await res.json();
}

/**
 * Exclui um evento do Google Calendar
 */
export async function deleteCalendarEvent(
  eventId: string,
  calendarId: string = 'primary'
): Promise<void> {
  const token = await getValidAccessToken(GOOGLE_CALENDAR_SCOPE);

  const res = await fetch(`${CALENDAR_API_URL}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok && res.status !== 404) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Falha ao excluir agendamento do Google Calendar (${res.status})`);
  }
}

/**
 * Lista eventos do Google Calendar em um período
 */
export async function listCalendarEvents(
  timeMin?: string,
  timeMax?: string,
  calendarId: string = 'primary'
): Promise<GoogleCalendarEvent[]> {
  const token = await getValidAccessToken(GOOGLE_CALENDAR_SCOPE);

  const params = new URLSearchParams({
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '100',
  });

  if (timeMin) params.append('timeMin', timeMin);
  if (timeMax) params.append('timeMax', timeMax);

  const res = await fetch(`${CALENDAR_API_URL}/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Falha ao listar eventos do Google Calendar (${res.status})`);
  }

  const data = await res.json();
  return data.items || [];
}
