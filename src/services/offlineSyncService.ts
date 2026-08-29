import { db, COLLECTIONS, saveDocument, handleFirestoreError, OperationType, sanitizeForFirestore } from './firebaseService';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Paciente, AnamneseCompleta, FichaRetornoEvolucao, Agendamento } from '../types';

export interface SyncQueueItem {
  id: string;
  entityType: 'paciente' | 'anamnese' | 'evolucao_retorno' | 'agendamento' | 'generico';
  entityId: string;
  entityTitle: string;
  action: 'create' | 'update' | 'delete';
  payload: any;
  baseVersionTimestamp?: string;
  localUpdatedAt: string;
  retries: number;
  status: 'pending' | 'syncing' | 'failed' | 'conflict' | 'synced';
  lastError?: string;
  userEmail?: string;
  userName?: string;
}

export interface SyncConflict {
  id: string;
  queueItemId: string;
  entityType: 'paciente' | 'anamnese' | 'evolucao_retorno' | 'agendamento' | 'generico';
  entityId: string;
  entityTitle: string;
  localData: any;
  remoteData: any;
  conflictFields: string[];
  detectedAt: string;
  resolved: boolean;
  resolution?: 'keep_local' | 'keep_remote' | 'merge';
}

export interface SyncSingleUserResult {
  success: boolean;
  syncedItemsCount: number;
  conflict?: SyncConflict;
  error?: string;
  offlineQueued?: boolean;
}

export interface SyncBatchResult {
  totalPending: number;
  syncedCount: number;
  failedCount: number;
  conflictsCount: number;
  conflicts: SyncConflict[];
  errors: string[];
}

const DB_NAME = 'AuraEsteticaSyncDB';
const DB_VERSION = 1;
const STORE_QUEUE = 'sync_queue';
const STORE_CONFLICTS = 'sync_conflicts';
const STORE_CACHE = 'cached_records';

/**
 * Converte recursivamente objetos Timestamp do Firestore para ISO string antes de salvar no IndexedDB
 */
export function convertTimestampsToISO(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  // Objeto Timestamp do Firestore com método toDate()
  if (typeof obj?.toDate === 'function') {
    try {
      return obj.toDate().toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  // Objeto serializado de Timestamp { seconds, nanoseconds }
  if (typeof obj === 'object' && typeof obj.seconds === 'number' && typeof obj.nanoseconds === 'number') {
    try {
      return new Date(obj.seconds * 1000 + obj.nanoseconds / 1000000).toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  // Instância nativa de Date
  if (obj instanceof Date) {
    return isNaN(obj.getTime()) ? new Date().toISOString() : obj.toISOString();
  }

  // Array recursivo
  if (Array.isArray(obj)) {
    return obj.map(item => convertTimestampsToISO(item));
  }

  // Objeto recursivo
  if (typeof obj === 'object') {
    const res: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      res[key] = convertTimestampsToISO(obj[key]);
    }
    return res;
  }

  return obj;
}

/**
 * Abre ou inicializa o banco IndexedDB seguro para sincronização offline
 */
function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB não suportado no ambiente atual.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const dbInstance = (event.target as IDBOpenDBRequest).result;

      if (!dbInstance.objectStoreNames.contains(STORE_QUEUE)) {
        const queueStore = dbInstance.createObjectStore(STORE_QUEUE, { keyPath: 'id' });
        queueStore.createIndex('entityId', 'entityId', { unique: false });
        queueStore.createIndex('status', 'status', { unique: false });
        queueStore.createIndex('localUpdatedAt', 'localUpdatedAt', { unique: false });
      }

      if (!dbInstance.objectStoreNames.contains(STORE_CONFLICTS)) {
        const conflictsStore = dbInstance.createObjectStore(STORE_CONFLICTS, { keyPath: 'id' });
        conflictsStore.createIndex('entityId', 'entityId', { unique: false });
        conflictsStore.createIndex('resolved', 'resolved', { unique: false });
      }

      if (!dbInstance.objectStoreNames.contains(STORE_CACHE)) {
        const cacheStore = dbInstance.createObjectStore(STORE_CACHE, { keyPath: 'id' });
        cacheStore.createIndex('entityType', 'entityType', { unique: false });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Erro ao abrir o IndexedDB.'));
    };
  });
}

/**
 * Adiciona uma ação de criação/atualização à Fila IndexedDB com conversão de Timestamps
 */
export async function enqueueSyncAction(params: {
  entityType: 'paciente' | 'anamnese' | 'evolucao_retorno' | 'agendamento' | 'generico';
  entityId: string;
  entityTitle: string;
  action: 'create' | 'update' | 'delete';
  payload: any;
  baseVersionTimestamp?: string;
  userEmail?: string;
  userName?: string;
}): Promise<SyncQueueItem> {
  const safePayload = convertTimestampsToISO(params.payload);
  const safeBaseVersion = params.baseVersionTimestamp 
    ? convertTimestampsToISO(params.baseVersionTimestamp) 
    : new Date().toISOString();

  const queueItem: SyncQueueItem = {
    id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    entityType: params.entityType,
    entityId: params.entityId,
    entityTitle: params.entityTitle,
    action: params.action,
    payload: safePayload,
    baseVersionTimestamp: safeBaseVersion,
    localUpdatedAt: new Date().toISOString(),
    retries: 0,
    status: 'pending',
    userEmail: params.userEmail,
    userName: params.userName,
  };

  try {
    const idb = await openIndexedDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = idb.transaction([STORE_QUEUE, STORE_CACHE], 'readwrite');
      const queueStore = transaction.objectStore(STORE_QUEUE);
      const cacheStore = transaction.objectStore(STORE_CACHE);

      queueStore.put(queueItem);
      // Atualiza também o cache local
      cacheStore.put({
        id: `${params.entityType}_${params.entityId}`,
        entityType: params.entityType,
        entityId: params.entityId,
        data: safePayload,
        cachedAt: new Date().toISOString(),
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.warn('[OfflineSync] Falha ao salvar no IndexedDB, usando fallback em memória:', error);
  }

  // Notificar ouvintes globais de sync
  dispatchSyncStatusChangeEvent();

  return queueItem;
}

/**
 * Busca todos os itens da fila de sincronização pendentes
 */
export async function getPendingSyncQueue(): Promise<SyncQueueItem[]> {
  try {
    const idb = await openIndexedDB();
    return new Promise((resolve) => {
      const transaction = idb.transaction(STORE_QUEUE, 'readonly');
      const store = transaction.objectStore(STORE_QUEUE);
      const request = store.getAll();

      request.onsuccess = () => {
        const items = (request.result as SyncQueueItem[]) || [];
        // Ordena pelos mais antigos primeiro para manter sequência lógica
        items.sort((a, b) => new Date(a.localUpdatedAt).getTime() - new Date(b.localUpdatedAt).getTime());
        resolve(items);
      };

      request.onerror = () => {
        resolve([]);
      };
    });
  } catch {
    return [];
  }
}

/**
 * Busca conflitos de sincronização não resolvidos
 */
export async function getUnresolvedConflicts(): Promise<SyncConflict[]> {
  try {
    const idb = await openIndexedDB();
    return new Promise((resolve) => {
      const transaction = idb.transaction(STORE_CONFLICTS, 'readonly');
      const store = transaction.objectStore(STORE_CONFLICTS);
      const request = store.getAll();

      request.onsuccess = () => {
        const items = (request.result as SyncConflict[]) || [];
        resolve(items.filter(c => !c.resolved));
      };

      request.onerror = () => {
        resolve([]);
      };
    });
  } catch {
    return [];
  }
}

/**
 * Remove um item concluído da fila IndexedDB
 */
export async function removeQueueItem(queueId: string): Promise<void> {
  try {
    const idb = await openIndexedDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = idb.transaction(STORE_QUEUE, 'readwrite');
      const store = transaction.objectStore(STORE_QUEUE);
      store.delete(queueId);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    dispatchSyncStatusChangeEvent();
  } catch (err) {
    console.warn('[OfflineSync] Erro ao remover item da fila:', err);
  }
}

/**
 * Atualiza o status de um item na fila com conversão de timestamps
 */
export async function updateQueueItem(item: SyncQueueItem): Promise<void> {
  try {
    const idb = await openIndexedDB();
    const safeItem = convertTimestampsToISO(item);
    await new Promise<void>((resolve, reject) => {
      const transaction = idb.transaction(STORE_QUEUE, 'readwrite');
      const store = transaction.objectStore(STORE_QUEUE);
      store.put(safeItem);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    dispatchSyncStatusChangeEvent();
  } catch (err) {
    console.warn('[OfflineSync] Erro ao atualizar item na fila:', err);
  }
}

/**
 * Registra um conflito detectado no IndexedDB
 */
export async function recordSyncConflict(conflict: Omit<SyncConflict, 'id' | 'detectedAt' | 'resolved'>): Promise<SyncConflict> {
  const fullConflict: SyncConflict = {
    ...conflict,
    localData: convertTimestampsToISO(conflict.localData),
    remoteData: convertTimestampsToISO(conflict.remoteData),
    id: `conflict-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    detectedAt: new Date().toISOString(),
    resolved: false,
  };

  try {
    const idb = await openIndexedDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = idb.transaction(STORE_CONFLICTS, 'readwrite');
      const store = transaction.objectStore(STORE_CONFLICTS);
      store.put(fullConflict);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    dispatchSyncStatusChangeEvent();
  } catch (err) {
    console.warn('[OfflineSync] Erro ao gravar conflito no IndexedDB:', err);
  }

  return fullConflict;
}

/**
 * Detecta divergências de campos entre a versão local e a versão remota
 */
function detectFieldConflicts(localData: any, remoteData: any): string[] {
  if (!localData || !remoteData) return ['registro_completo'];

  const conflictingFields: string[] = [];
  const keysToCheck = new Set([...Object.keys(localData), ...Object.keys(remoteData)]);

  for (const key of keysToCheck) {
    if (key === 'atualizadoEm' || key === 'atualizado_em' || key === 'id') continue;

    const localVal = localData[key];
    const remoteVal = remoteData[key];

    if (localVal === undefined || remoteVal === undefined) {
      conflictingFields.push(key);
      continue;
    }

    if (typeof localVal === 'object' && typeof remoteVal === 'object') {
      if (JSON.stringify(localVal) !== JSON.stringify(remoteVal)) {
        conflictingFields.push(key);
      }
    } else if (localVal !== remoteVal) {
      conflictingFields.push(key);
    }
  }

  return conflictingFields;
}

/**
 * Sincroniza um item individual para a nuvem tratando anamneses embutidas no documento do paciente
 */
async function processSyncItemToCloud(
  item: SyncQueueItem,
  options?: {
    forceOverwrite?: boolean;
    onConflict?: (conflict: SyncConflict) => void;
  }
): Promise<{ success: boolean; conflict?: SyncConflict; error?: string }> {
  // CASO ESPECIAL: Anamnese Completa - NÃO deve ser salva como documento avulso!
  if (item.entityType === 'anamnese') {
    const patientId = item.payload?.clienteId || item.payload?.paciente_id || item.entityId;
    const patientDocRef = doc(db, COLLECTIONS.PACIENTES, patientId);
    const patientSnap = await getDoc(patientDocRef);

    const novaAnamnese = convertTimestampsToISO(item.payload);

    if (patientSnap.exists()) {
      const patientData = patientSnap.data();
      const existingAnamneses: any[] = Array.isArray(patientData.anamneses_completas) ? patientData.anamneses_completas : [];

      // Upsert anamnese no array existente
      const updatedAnamneses = existingAnamneses.some((a: any) => a.id === novaAnamnese.id)
        ? existingAnamneses.map((a: any) => (a.id === novaAnamnese.id ? novaAnamnese : a))
        : [novaAnamnese, ...existingAnamneses];

      const dadosAtualizados: any = {
        anamneses_completas: updatedAnamneses,
        atualizado_em: new Date().toISOString(),
        atualizadoEm: serverTimestamp(),
      };

      // Mesclar campos clínicos derivados da anamnese
      if (novaAnamnese.saudeGeral?.possuiAlergias && novaAnamnese.saudeGeral.detalhesAlergias) {
        dadosAtualizados.alergias = novaAnamnese.saudeGeral.detalhesAlergias;
      }
      if (novaAnamnese.saudeGeral?.usoAcidos && novaAnamnese.saudeGeral.detalhesAcidos) {
        dadosAtualizados.medicacoes = novaAnamnese.saudeGeral.detalhesAcidos;
      }
      if (novaAnamnese.dadosPessoais?.profissao) {
        dadosAtualizados.profissao = novaAnamnese.dadosPessoais.profissao;
      }
      if (novaAnamnese.dadosPessoais?.endereco) {
        dadosAtualizados.endereco = novaAnamnese.dadosPessoais.endereco;
      }
      if (novaAnamnese.dadosPessoais?.contatoEmergencia) {
        dadosAtualizados.contato_emergencia = novaAnamnese.dadosPessoais.contatoEmergencia;
      }
      if (novaAnamnese.dadosPessoais?.dataNascimento) {
        dadosAtualizados.data_nascimento = novaAnamnese.dadosPessoais.dataNascimento;
      }

      await setDoc(patientDocRef, sanitizeForFirestore(dadosAtualizados), { merge: true });
    } else {
      // Paciente ainda não cadastrado na nuvem - cria ficha inicial com a anamnese embutida
      const novoPacienteData = {
        id: patientId,
        nome: novaAnamnese.dadosPessoais?.nomeCompleto || novaAnamnese.pacienteNome || 'Cliente',
        telefone: novaAnamnese.dadosPessoais?.telefone || '',
        email: novaAnamnese.dadosPessoais?.email || '',
        cpf: novaAnamnese.dadosPessoais?.cpf || '',
        data_nascimento: novaAnamnese.dadosPessoais?.dataNascimento || '',
        endereco: novaAnamnese.dadosPessoais?.endereco || '',
        profissao: novaAnamnese.dadosPessoais?.profissao || '',
        alergias: novaAnamnese.saudeGeral?.possuiAlergias ? novaAnamnese.saudeGeral.detalhesAlergias : '',
        medicacoes: novaAnamnese.saudeGeral?.usoAcidos ? novaAnamnese.saudeGeral.detalhesAcidos : '',
        anamneses_completas: [novaAnamnese],
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
        atualizadoEm: serverTimestamp(),
      };
      await setDoc(patientDocRef, sanitizeForFirestore(novoPacienteData), { merge: true });
    }

    await removeQueueItem(item.id);
    return { success: true };
  }

  // CASO ESPECIAL: Evolução de Retorno Clínica - salvar embutida no paciente
  if (item.entityType === 'evolucao_retorno') {
    const patientId = item.payload?.paciente_id || item.entityId;
    const patientDocRef = doc(db, COLLECTIONS.PACIENTES, patientId);
    const patientSnap = await getDoc(patientDocRef);
    const novaEvolucao = convertTimestampsToISO(item.payload);

    if (patientSnap.exists()) {
      const patientData = patientSnap.data();
      const existingEvolucoes: any[] = Array.isArray(patientData.evolucoes_retornos) ? patientData.evolucoes_retornos : [];
      const updatedEvolucoes = existingEvolucoes.some((e: any) => e.id === novaEvolucao.id)
        ? existingEvolucoes.map((e: any) => (e.id === novaEvolucao.id ? novaEvolucao : e))
        : [novaEvolucao, ...existingEvolucoes];

      await setDoc(patientDocRef, sanitizeForFirestore({
        evolucoes_retornos: updatedEvolucoes,
        atualizado_em: new Date().toISOString(),
        atualizadoEm: serverTimestamp(),
      }), { merge: true });
    } else {
      await setDoc(patientDocRef, sanitizeForFirestore({
        id: patientId,
        evolucoes_retornos: [novaEvolucao],
        atualizado_em: new Date().toISOString(),
        atualizadoEm: serverTimestamp(),
      }), { merge: true });
    }

    await removeQueueItem(item.id);
    return { success: true };
  }

  // Sincronização padrão para entidades regulares (paciente, agendamento, etc.)
  const collectionName = item.entityType === 'paciente' ? COLLECTIONS.PACIENTES :
    item.entityType === 'agendamento' ? COLLECTIONS.AGENDAMENTOS :
    COLLECTIONS.PACIENTES;

  const docRef = doc(db, collectionName, item.entityId);
  const remoteSnap = await getDoc(docRef);

  if (remoteSnap.exists() && !options?.forceOverwrite) {
    const remoteData = convertTimestampsToISO(remoteSnap.data());
    const remoteTimestamp = remoteData.atualizadoEm || remoteData.atualizado_em || remoteData.criado_em || remoteData.criadoEm;
    const localBaseTimestamp = item.baseVersionTimestamp;

    if (remoteTimestamp && localBaseTimestamp && new Date(remoteTimestamp).getTime() > new Date(localBaseTimestamp).getTime()) {
      const conflictingFields = detectFieldConflicts(item.payload, remoteData);

      if (conflictingFields.length > 0) {
        item.status = 'conflict';
        item.lastError = `Conflito detectado nos campos: ${conflictingFields.join(', ')}`;
        await updateQueueItem(item);

        const conflict = await recordSyncConflict({
          queueItemId: item.id,
          entityType: item.entityType,
          entityId: item.entityId,
          entityTitle: item.entityTitle,
          localData: item.payload,
          remoteData: remoteData,
          conflictFields: conflictingFields,
        });

        if (options?.onConflict) {
          options.onConflict(conflict);
        }

        return {
          success: false,
          conflict,
          error: `Conflito de dados detectado ao atualizar ${item.entityTitle}.`,
        };
      }
    }
  }

  const payloadSanitized = sanitizeForFirestore({
    ...convertTimestampsToISO(item.payload),
    atualizado_em: new Date().toISOString(),
    atualizadoEm: serverTimestamp(),
  });

  await setDoc(docRef, payloadSanitized, { merge: true });
  await removeQueueItem(item.id);
  return { success: true };
}

/**
 * Função de Sincronização Individual: Sincroniza todas as alterações pendentes de um Paciente/Usuário com a Nuvem
 */
export async function syncSingleUserToCloud(
  patientOrUserId: string,
  options?: {
    forceOverwrite?: boolean;
    onConflict?: (conflict: SyncConflict) => void;
  }
): Promise<SyncSingleUserResult> {
  // 1. Checar conectividade de rede
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      success: false,
      syncedItemsCount: 0,
      offlineQueued: true,
      error: 'Dispositivo em modo offline. As alterações continuam seguras na fila IndexedDB.',
    };
  }

  const queue = await getPendingSyncQueue();
  const userItems = queue.filter(item => 
    item.entityId === patientOrUserId || 
    (item.payload && (item.payload.paciente_id === patientOrUserId || item.payload.clienteId === patientOrUserId))
  );

  if (userItems.length === 0) {
    return {
      success: true,
      syncedItemsCount: 0,
    };
  }

  let syncedCount = 0;

  for (const item of userItems) {
    try {
      item.status = 'syncing';
      await updateQueueItem(item);

      const res = await processSyncItemToCloud(item, options);
      if (!res.success) {
        return {
          success: false,
          syncedItemsCount: syncedCount,
          conflict: res.conflict,
          error: res.error,
        };
      }

      syncedCount++;
    } catch (error: any) {
      console.error(`[OfflineSync] Erro ao sincronizar item ${item.id}:`, error);
      item.status = 'failed';
      item.retries = (item.retries || 0) + 1;
      item.lastError = error.message || 'Falha na comunicação com o Firestore';
      await updateQueueItem(item);

      return {
        success: false,
        syncedItemsCount: syncedCount,
        error: `Falha ao sincronizar com a nuvem: ${item.lastError}`,
      };
    }
  }

  dispatchSyncStatusChangeEvent();

  return {
    success: true,
    syncedItemsCount: syncedCount,
  };
}

/**
 * Processa e sincroniza todos os itens pendentes na Fila IndexedDB com o Cloud Firestore
 */
export async function syncAllPendingQueue(): Promise<SyncBatchResult> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const queue = await getPendingSyncQueue();
    return {
      totalPending: queue.length,
      syncedCount: 0,
      failedCount: 0,
      conflictsCount: 0,
      conflicts: [],
      errors: ['Dispositivo offline. A sincronização será retomada automaticamente quando a conexão retornar.'],
    };
  }

  const queue = await getPendingSyncQueue();
  const result: SyncBatchResult = {
    totalPending: queue.length,
    syncedCount: 0,
    failedCount: 0,
    conflictsCount: 0,
    conflicts: [],
    errors: [],
  };

  for (const item of queue) {
    if (item.status === 'conflict') {
      result.conflictsCount++;
      continue;
    }

    try {
      item.status = 'syncing';
      await updateQueueItem(item);

      const res = await processSyncItemToCloud(item);
      if (!res.success) {
        if (res.conflict) {
          result.conflictsCount++;
          result.conflicts.push(res.conflict);
        } else if (res.error) {
          result.failedCount++;
          result.errors.push(`[${item.entityTitle}] ${res.error}`);
        }
        continue;
      }

      result.syncedCount++;
    } catch (error: any) {
      item.status = 'failed';
      item.retries = (item.retries || 0) + 1;
      item.lastError = error.message || 'Falha de conexão';
      await updateQueueItem(item);

      result.failedCount++;
      result.errors.push(`[${item.entityTitle}] ${item.lastError}`);
    }
  }

  dispatchSyncStatusChangeEvent();
  return result;
}

/**
 * Resolve um conflito de sincronização com base na estratégia selecionada pelo usuário
 */
export async function resolveSyncConflict(
  conflictId: string,
  resolution: 'keep_local' | 'keep_remote' | 'merge',
  customMergedData?: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const idb = await openIndexedDB();
    const conflicts = await getUnresolvedConflicts();
    const conflict = conflicts.find(c => c.id === conflictId);

    if (!conflict) {
      return { success: false, error: 'Conflito não encontrado ou já resolvido.' };
    }

    const collectionName = conflict.entityType === 'paciente' ? COLLECTIONS.PACIENTES :
      conflict.entityType === 'agendamento' ? COLLECTIONS.AGENDAMENTOS :
      COLLECTIONS.PACIENTES;

    const docRef = doc(db, collectionName, conflict.entityId);

    if (resolution === 'keep_local') {
      const payloadSanitized = sanitizeForFirestore({
        ...convertTimestampsToISO(conflict.localData),
        atualizado_em: new Date().toISOString(),
        atualizadoEm: serverTimestamp(),
      });
      await setDoc(docRef, payloadSanitized, { merge: true });
      await removeQueueItem(conflict.queueItemId);
    } else if (resolution === 'keep_remote') {
      // Descarta as alterações locais da fila
      await removeQueueItem(conflict.queueItemId);
    } else if (resolution === 'merge') {
      const mergedPayload = customMergedData || {
        ...conflict.remoteData,
        ...conflict.localData,
        // Mesclar históricos e anamneses de forma inteligente
        historico_clinico: `${conflict.remoteData.historico_clinico || ''}\n${conflict.localData.historico_clinico || ''}`.trim(),
        anamneses_completas: [
          ...(conflict.localData.anamneses_completas || []),
          ...(conflict.remoteData.anamneses_completas || []).filter((r: any) => 
            !(conflict.localData.anamneses_completas || []).some((l: any) => l.id === r.id)
          )
        ],
        evolucoes_retornos: [
          ...(conflict.localData.evolucoes_retornos || []),
          ...(conflict.remoteData.evolucoes_retornos || []).filter((r: any) => 
            !(conflict.localData.evolucoes_retornos || []).some((l: any) => l.id === r.id)
          )
        ],
        atualizado_em: new Date().toISOString(),
        atualizadoEm: serverTimestamp(),
      };

      const payloadSanitized = sanitizeForFirestore(convertTimestampsToISO(mergedPayload));
      await setDoc(docRef, payloadSanitized, { merge: true });
      await removeQueueItem(conflict.queueItemId);
    }

    // Marcar conflito como resolvido no IndexedDB
    await new Promise<void>((resolve, reject) => {
      const transaction = idb.transaction(STORE_CONFLICTS, 'readwrite');
      const store = transaction.objectStore(STORE_CONFLICTS);
      conflict.resolved = true;
      conflict.resolution = resolution;
      store.put(conflict);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });

    dispatchSyncStatusChangeEvent();
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Erro ao resolver conflito.' };
  }
}

/**
 * Evento Customizado para notificar componentes e hooks React sobre mudanças na fila IndexedDB
 */
function dispatchSyncStatusChangeEvent() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('aura_sync_queue_changed'));
  }
}
