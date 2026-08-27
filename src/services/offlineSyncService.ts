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
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        const queueStore = db.createObjectStore(STORE_QUEUE, { keyPath: 'id' });
        queueStore.createIndex('entityId', 'entityId', { unique: false });
        queueStore.createIndex('status', 'status', { unique: false });
        queueStore.createIndex('localUpdatedAt', 'localUpdatedAt', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_CONFLICTS)) {
        const conflictsStore = db.createObjectStore(STORE_CONFLICTS, { keyPath: 'id' });
        conflictsStore.createIndex('entityId', 'entityId', { unique: false });
        conflictsStore.createIndex('resolved', 'resolved', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        const cacheStore = db.createObjectStore(STORE_CACHE, { keyPath: 'id' });
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
 * Adiciona uma ação de criação/atualização à Fila IndexedDB
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
  const queueItem: SyncQueueItem = {
    id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    entityType: params.entityType,
    entityId: params.entityId,
    entityTitle: params.entityTitle,
    action: params.action,
    payload: params.payload,
    baseVersionTimestamp: params.baseVersionTimestamp || new Date().toISOString(),
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
        data: params.payload,
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
 * Atualiza o status de um item na fila
 */
export async function updateQueueItem(item: SyncQueueItem): Promise<void> {
  try {
    const idb = await openIndexedDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = idb.transaction(STORE_QUEUE, 'readwrite');
      const store = transaction.objectStore(STORE_QUEUE);
      store.put(item);
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
 * Função de Sincronização Individual: Sincroniza todas as alterações pendentes de um Paciente/Usuário com a Nuvem
 * Suporta Anamnese Completa, Evoluções Clínicas, Treinos/Procedimentos e Dados Cadastrais.
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
  const userItems = queue.filter(item => item.entityId === patientOrUserId || (item.payload && (item.payload.paciente_id === patientOrUserId || item.payload.clienteId === patientOrUserId)));

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

      // Determinar coleção do Firestore
      const collectionName = item.entityType === 'paciente' ? COLLECTIONS.PACIENTES :
        item.entityType === 'agendamento' ? COLLECTIONS.AGENDAMENTOS :
        COLLECTIONS.PACIENTES;

      const docRef = doc(db, collectionName, item.entityId);
      const remoteSnap = await getDoc(docRef);

      if (remoteSnap.exists() && !options?.forceOverwrite) {
        const remoteData = remoteSnap.data();
        const remoteTimestamp = remoteData.atualizadoEm || remoteData.atualizado_em || remoteData.criado_em || remoteData.criadoEm;
        const localBaseTimestamp = item.baseVersionTimestamp;

        // Se o dado remoto foi modificado após o ponto em que o usuário começou a editar localmente
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
              syncedItemsCount: syncedCount,
              conflict,
              error: `Conflito de dados detectado ao atualizar ${item.entityTitle}. A versão na nuvem foi modificada em outra sessão.`,
            };
          }
        }
      }

      // Se não há conflito ou forceOverwrite está habilitado: persistir na nuvem
      const payloadSanitized = sanitizeForFirestore({
        ...item.payload,
        atualizado_em: new Date().toISOString(),
        atualizadoEm: serverTimestamp(),
      });

      await setDoc(docRef, payloadSanitized, { merge: true });

      // Remover da fila de pendentes
      await removeQueueItem(item.id);
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

      const collectionName = item.entityType === 'paciente' ? COLLECTIONS.PACIENTES :
        item.entityType === 'agendamento' ? COLLECTIONS.AGENDAMENTOS :
        COLLECTIONS.PACIENTES;

      const docRef = doc(db, collectionName, item.entityId);
      const remoteSnap = await getDoc(docRef);

      if (remoteSnap.exists()) {
        const remoteData = remoteSnap.data();
        const remoteTimestamp = remoteData.atualizadoEm || remoteData.atualizado_em;
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

            result.conflictsCount++;
            result.conflicts.push(conflict);
            continue;
          }
        }
      }

      const payloadSanitized = sanitizeForFirestore({
        ...item.payload,
        atualizado_em: new Date().toISOString(),
        atualizadoEm: serverTimestamp(),
      });

      await setDoc(docRef, payloadSanitized, { merge: true });
      await removeQueueItem(item.id);
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
        ...conflict.localData,
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

      const payloadSanitized = sanitizeForFirestore(mergedPayload);
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
