import type { Request, Response } from 'express';
import { getAdminDb } from './firebaseAdmin.ts';
import { getGeminiClient } from './gemini.ts';

// ==========================================
// Configuração (variáveis de ambiente)
// ==========================================
// Configure estas 3 no painel de Secrets do AI Studio (ou no .env.local em dev):
//  WHATSAPP_TOKEN          -> Token permanente do System User (Meta for Developers)
//  WHATSAPP_PHONE_NUMBER_ID -> ID do número de telefone (WhatsApp Business Cloud API)
//  WHATSAPP_VERIFY_TOKEN   -> Uma senha inventada por você, usada só para validar o webhook
const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v21.0';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || '';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const WHATSAPP_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || '';

const COLLECTIONS = {
  CONVERSAS: 'whatsapp_conversas',
  MENSAGENS: 'whatsapp_mensagens',
  PEDIDOS: 'pedidos_whatsapp',
  PACIENTES: 'pacientes',
  AGENDAMENTOS: 'agendamentos',
};

function whatsappConfigurado(): boolean {
  return !!(WHATSAPP_TOKEN && WHATSAPP_PHONE_NUMBER_ID);
}

/** Normaliza um telefone para o formato usado como ID de documento (só dígitos) */
function normalizarTelefone(telefone: string): string {
  return (telefone || '').replace(/\D/g, '');
}

// ==========================================
// 1. ENVIO DE MENSAGENS (saída)
// ==========================================

/**
 * Envia uma mensagem de texto simples via WhatsApp Cloud API.
 * `telefone` pode vir com ou sem formatação; será normalizado.
 */
export async function enviarMensagemWhatsApp(telefone: string, texto: string): Promise<{ sucesso: boolean; erro?: string; id?: string }> {
  if (!whatsappConfigurado()) {
    const msg = 'WhatsApp não configurado: defina WHATSAPP_TOKEN e WHATSAPP_PHONE_NUMBER_ID no ambiente.';
    console.warn(`[whatsapp] ${msg}`);
    return { sucesso: false, erro: msg };
  }

  const numero = normalizarTelefone(telefone);
  if (!numero) {
    return { sucesso: false, erro: 'Telefone inválido.' };
  }

  try {
    const resp = await fetch(
      `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: numero,
          type: 'text',
          text: { body: texto, preview_url: false },
        }),
      }
    );

    const data: any = await resp.json();

    if (!resp.ok) {
      console.error('[whatsapp] Erro ao enviar mensagem:', data);
      return { sucesso: false, erro: data?.error?.message || 'Falha ao enviar mensagem via WhatsApp API' };
    }

    const messageId = data?.messages?.[0]?.id;

    // Registra a mensagem enviada no histórico (best-effort, não bloqueia o envio)
    await registrarMensagem(numero, 'saida', texto, messageId).catch(() => {});

    return { sucesso: true, id: messageId };
  } catch (err: any) {
    console.error('[whatsapp] Exceção ao enviar mensagem:', err);
    return { sucesso: false, erro: err?.message || 'Erro desconhecido ao enviar mensagem' };
  }
}

async function registrarMensagem(telefone: string, direcao: 'entrada' | 'saida', texto: string, mensagemId?: string) {
  const db = getAdminDb();
  if (!db) return;
  const id = mensagemId || `${direcao}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await db.collection(COLLECTIONS.MENSAGENS).doc(id).set({
    telefone,
    direcao,
    texto,
    timestamp: new Date().toISOString(),
  }, { merge: true });
}

// ==========================================
// 2. VERIFICAÇÃO DO WEBHOOK (handshake inicial da Meta)
// ==========================================

export function handleWhatsAppWebhookVerify(req: Request, res: Response) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN && WHATSAPP_VERIFY_TOKEN) {
    console.log('[whatsapp] Webhook verificado com sucesso pela Meta.');
    res.status(200).send(String(challenge));
  } else {
    console.warn('[whatsapp] Falha na verificação do webhook (token não confere).');
    res.sendStatus(403);
  }
}

// ==========================================
// 3. RECEBIMENTO DE MENSAGENS (entrada) + ROBÔ DE ATENDIMENTO
// ==========================================

const MENU_PRINCIPAL =
  'Digite uma opção:\n' +
  '*1* - Confirmar presença em agendamento\n' +
  '*2* - Preciso remarcar\n' +
  '*3* - Fazer um pedido\n' +
  '*4* - Falar com a equipe\n\n' +
  '_Você pode digitar "menu" a qualquer momento para ver estas opções de novo._';

interface ConversaState {
  telefone: string;
  nome?: string;
  estado: 'novo' | 'menu' | 'aguardando_produto' | 'aguardando_observacao_pedido' | 'aguardando_atendente';
  pedido_rascunho?: { produto?: string };
  criado_em: string;
  atualizado_em: string;
}

async function getOuCriarConversa(telefone: string, nomeContato?: string): Promise<ConversaState> {
  const db = getAdminDb();
  const agora = new Date().toISOString();
  if (!db) {
    return { telefone, nome: nomeContato, estado: 'novo', criado_em: agora, atualizado_em: agora };
  }
  const ref = db.collection(COLLECTIONS.CONVERSAS).doc(telefone);
  const snap = await ref.get();
  if (snap.exists) {
    return snap.data() as ConversaState;
  }
  const nova: ConversaState = { telefone, nome: nomeContato, estado: 'novo', criado_em: agora, atualizado_em: agora };
  await ref.set(nova);
  return nova;
}

async function salvarConversa(state: ConversaState) {
  const db = getAdminDb();
  if (!db) return;
  state.atualizado_em = new Date().toISOString();
  await db.collection(COLLECTIONS.CONVERSAS).doc(state.telefone).set(state, { merge: true });
}

/** Busca o agendamento futuro mais próximo do paciente dono deste telefone (se houver) */
async function buscarProximoAgendamento(telefone: string) {
  const db = getAdminDb();
  if (!db) return null;
  const pacientesSnap = await db.collection(COLLECTIONS.PACIENTES)
    .where('telefone', '==', telefone)
    .limit(1)
    .get();
  if (pacientesSnap.empty) return null;
  const paciente = { id: pacientesSnap.docs[0].id, ...pacientesSnap.docs[0].data() } as any;

  const agSnap = await db.collection(COLLECTIONS.AGENDAMENTOS)
    .where('paciente_id', '==', paciente.id)
    .where('status', '==', 'agendado')
    .orderBy('data_hora', 'asc')
    .limit(1)
    .get();

  if (agSnap.empty) return null;
  return { id: agSnap.docs[0].id, ...agSnap.docs[0].data(), paciente } as any;
}

/** Fallback: usa o Gemini (já usado no resto do app) para responder perguntas livres do cliente */
async function responderComIA(pergunta: string): Promise<string> {
  try {
    const client = getGeminiClient();
    const result = await client.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: [{ role: 'user', parts: [{ text: pergunta }] }],
      config: {
        systemInstruction:
          'Você é a recepcionista virtual de uma clínica de estética, respondendo pelo WhatsApp. ' +
          'Responda em português do Brasil, de forma breve (no máximo 3 frases), simpática e profissional. ' +
          'Não invente preços, horários específicos ou disponibilidade — se perguntarem isso, diga que a equipe vai confirmar em breve. ' +
          'Termine sugerindo digitar "menu" para ver as opções do atendimento automático.',
      },
    });
    return result.text?.trim() || 'Recebemos sua mensagem! Digite "menu" para ver as opções de atendimento.';
  } catch (err) {
    console.error('[whatsapp] Erro ao consultar Gemini para fallback:', err);
    return 'Recebemos sua mensagem e já vamos te responder! Digite "menu" para ver as opções de atendimento automático.';
  }
}

/** Processa uma mensagem de texto recebida de um paciente/lead e decide a resposta do robô */
async function processarMensagemRecebida(telefoneOriginal: string, nomeContato: string | undefined, texto: string) {
  const telefone = normalizarTelefone(telefoneOriginal);
  const textoNormalizado = texto.trim().toLowerCase();

  await registrarMensagem(telefone, 'entrada', texto);
  const conversa = await getOuCriarConversa(telefone, nomeContato);

  // Comando global: sempre reabre o menu
  if (['menu', 'oi', 'ola', 'olá', 'inicio', 'início'].includes(textoNormalizado)) {
    conversa.estado = 'menu';
    await salvarConversa(conversa);
    await enviarMensagemWhatsApp(telefone, `Olá${nomeContato ? `, ${nomeContato.split(' ')[0]}` : ''}! 👋\n\n${MENU_PRINCIPAL}`);
    return;
  }

  switch (conversa.estado) {
    case 'novo': {
      conversa.estado = 'menu';
      await salvarConversa(conversa);
      await enviarMensagemWhatsApp(telefone, `Olá${nomeContato ? `, ${nomeContato.split(' ')[0]}` : ''}! 👋 Bem-vindo(a)!\n\n${MENU_PRINCIPAL}`);
      return;
    }

    case 'menu': {
      if (textoNormalizado === '1') {
        const agendamento = await buscarProximoAgendamento(telefone);
        if (!agendamento) {
          await enviarMensagemWhatsApp(telefone, 'Não encontrei nenhum agendamento futuro no seu nome. Se já tem uma data marcada, nossa equipe vai confirmar com você em breve.');
          conversa.estado = 'menu';
        } else {
          const db = getAdminDb();
          if (db) {
            await db.collection(COLLECTIONS.AGENDAMENTOS).doc(agendamento.id).set(
              { status_confirmacao_whatsapp: 'confirmado' },
              { merge: true }
            );
          }
          await enviarMensagemWhatsApp(telefone, '✅ Presença confirmada! Te esperamos por aqui. Até breve!');
          conversa.estado = 'menu';
        }
      } else if (textoNormalizado === '2') {
        conversa.estado = 'aguardando_atendente';
        await enviarMensagemWhatsApp(telefone, 'Sem problemas! Nossa equipe vai entrar em contato com você para reagendar o melhor horário. 🗓️');
      } else if (textoNormalizado === '3') {
        conversa.estado = 'aguardando_produto';
        await enviarMensagemWhatsApp(telefone, 'Perfeito! Qual produto ou procedimento você gostaria de pedir/agendar?');
      } else if (textoNormalizado === '4') {
        conversa.estado = 'aguardando_atendente';
        await enviarMensagemWhatsApp(telefone, 'Certo! Já avisei a equipe, alguém vai te responder por aqui em instantes. 🙋');
      } else {
        const resposta = await responderComIA(texto);
        await enviarMensagemWhatsApp(telefone, resposta);
      }
      await salvarConversa(conversa);
      return;
    }

    case 'aguardando_produto': {
      conversa.pedido_rascunho = { produto: texto.trim() };
      conversa.estado = 'aguardando_observacao_pedido';
      await salvarConversa(conversa);
      await enviarMensagemWhatsApp(telefone, 'Anotado! Quer adicionar alguma observação (quantidade, cor, urgência)? Se não, digite "não".');
      return;
    }

    case 'aguardando_observacao_pedido': {
      const db = getAdminDb();
      const observacao = textoNormalizado === 'não' || textoNormalizado === 'nao' ? '' : texto.trim();
      let pedidoId = `pedido-${Date.now()}`;
      if (db) {
        const docRef = await db.collection(COLLECTIONS.PEDIDOS).add({
          telefone,
          nome_contato: nomeContato || conversa.nome || '',
          produto: conversa.pedido_rascunho?.produto || '',
          observacao,
          status: 'novo',
          criado_em: new Date().toISOString(),
        });
        pedidoId = docRef.id;
      }
      conversa.pedido_rascunho = undefined;
      conversa.estado = 'menu';
      await salvarConversa(conversa);
      await enviarMensagemWhatsApp(
        telefone,
        `🧾 Pedido registrado! (nº ${pedidoId.slice(-6)})\nNossa equipe vai confirmar disponibilidade e valor com você em breve.\n\n${MENU_PRINCIPAL}`
      );
      return;
    }

    case 'aguardando_atendente': {
      // Enquanto está com um atendente humano "marcado", o robô só registra a mensagem
      // (já feito acima) e não responde automaticamente, para não atrapalhar o atendimento.
      return;
    }

    default: {
      conversa.estado = 'menu';
      await salvarConversa(conversa);
      await enviarMensagemWhatsApp(telefone, MENU_PRINCIPAL);
    }
  }
}

/**
 * Handler do webhook (POST) chamado pela Meta a cada evento (mensagem recebida, status de entrega, etc).
 * Sempre responde 200 rapidamente (exigência da Meta) e processa a mensagem em seguida.
 */
export async function handleWhatsAppWebhookReceive(req: Request, res: Response) {
  res.sendStatus(200); // confirma recebimento imediatamente

  try {
    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    const mensagens = value?.messages;
    if (!mensagens || mensagens.length === 0) {
      // Pode ser apenas uma notificação de status (entregue/lido) — ignoramos.
      return;
    }

    const contato = value?.contacts?.[0];
    const nomeContato = contato?.profile?.name;

    for (const msg of mensagens) {
      if (msg.type !== 'text') {
        // Áudio, imagem, etc. — registra e avisa que só processamos texto por enquanto.
        await registrarMensagem(normalizarTelefone(msg.from), 'entrada', `[mensagem do tipo ${msg.type}, não suportada pelo robô]`);
        await enviarMensagemWhatsApp(msg.from, 'Por enquanto só consigo entender mensagens de texto 🙏 Pode escrever o que precisa?');
        continue;
      }
      await processarMensagemRecebida(msg.from, nomeContato, msg.text.body);
    }
  } catch (err) {
    console.error('[whatsapp] Erro ao processar webhook:', err);
  }
}
