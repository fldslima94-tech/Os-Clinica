import { Agendamento, TransacaoFinanceira, Paciente } from '../types';
import { COLLECTIONS } from './firebaseService';

const DB_NAME = 'AuraEsteticaLocalDB_v2';
const DB_VERSION = 1;

export const LOCAL_STORES = {
  AGENDAMENTOS: 'cached_agendamentos',
  TRANSACOES: 'cached_transacoes',
  PACIENTES: 'cached_pacientes',
  COLLECTIONS: 'cached_collections',
} as const;

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Normaliza qualquer objeto para formato seguro para o IndexedDB (sem funções, instâncias complexas ou referências circulares)
 */
export function sanitizeForIndexedDB(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  // Firestore Timestamp
  if (typeof obj?.toDate === 'function') {
    try {
      return obj.toDate().toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  // Objeto de Timestamp { seconds, nanoseconds }
  if (typeof obj === 'object' && typeof obj.seconds === 'number' && typeof obj.nanoseconds === 'number') {
    try {
      return new Date(obj.seconds * 1000 + obj.nanoseconds / 1000000).toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  // Date nativo
  if (obj instanceof Date) {
    return isNaN(obj.getTime()) ? new Date().toISOString() : obj.toISOString();
  }

  // Array recursivo
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForIndexedDB(item));
  }

  // Objeto comum recursivo
  if (typeof obj === 'object') {
    const res: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] !== 'function') {
        res[key] = sanitizeForIndexedDB(obj[key]);
      }
    }
    return res;
  }

  return obj;
}

/**
 * Abre e mantém conexão única reutilizável com o IndexedDB
 */
export function getLocalDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB não suportado neste navegador.'));
  }

  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(LOCAL_STORES.AGENDAMENTOS)) {
          const store = db.createObjectStore(LOCAL_STORES.AGENDAMENTOS, { keyPath: 'id' });
          store.createIndex('data_hora', 'data_hora', { unique: false });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('paciente_id', 'paciente_id', { unique: false });
        }

        if (!db.objectStoreNames.contains(LOCAL_STORES.TRANSACOES)) {
          const store = db.createObjectStore(LOCAL_STORES.TRANSACOES, { keyPath: 'id' });
          store.createIndex('data', 'data', { unique: false });
          store.createIndex('tipo', 'tipo', { unique: false });
          store.createIndex('status', 'status', { unique: false });
        }

        if (!db.objectStoreNames.contains(LOCAL_STORES.PACIENTES)) {
          const store = db.createObjectStore(LOCAL_STORES.PACIENTES, { keyPath: 'id' });
          store.createIndex('nome', 'nome', { unique: false });
        }

        if (!db.objectStoreNames.contains(LOCAL_STORES.COLLECTIONS)) {
          db.createObjectStore(LOCAL_STORES.COLLECTIONS, { keyPath: 'collectionKey' });
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        db.onclose = () => {
          dbPromise = null;
        };
        db.onerror = (e) => {
          console.warn('[LocalPersistence] Erro na conexão do IndexedDB:', e);
        };
        resolve(db);
      };

      request.onerror = () => {
        dbPromise = null;
        reject(request.error || new Error('Falha ao abrir banco local IndexedDB.'));
      };
    } catch (err) {
      dbPromise = null;
      reject(err);
    }
  });

  return dbPromise;
}

/**
 * Determina o store apropriado para cada coleção
 */
function getStoreNameForCollection(collectionName: string): string {
  if (collectionName === COLLECTIONS.AGENDAMENTOS) return LOCAL_STORES.AGENDAMENTOS;
  if (collectionName === COLLECTIONS.TRANSACOES) return LOCAL_STORES.TRANSACOES;
  if (collectionName === COLLECTIONS.PACIENTES) return LOCAL_STORES.PACIENTES;
  return LOCAL_STORES.COLLECTIONS;
}

/**
 * Carrega instantaneamente os agendamentos do IndexedDB local
 */
export async function loadLocalAgendamentos(): Promise<Agendamento[]> {
  try {
    const db = await getLocalDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(LOCAL_STORES.AGENDAMENTOS, 'readonly');
      const store = transaction.objectStore(LOCAL_STORES.AGENDAMENTOS);
      const request = store.getAll();

      request.onsuccess = () => {
        const items = (request.result as Agendamento[]) || [];
        // Ordena por data
        items.sort((a, b) => new Date(a.data_hora || 0).getTime() - new Date(b.data_hora || 0).getTime());
        resolve(items);
      };

      request.onerror = () => {
        resolve([]);
      };
    });
  } catch (err) {
    console.warn('[LocalPersistence] Aviso ao carregar agendamentos do IndexedDB:', err);
    return [];
  }
}

/**
 * Salva agendamentos em lote no IndexedDB local
 */
export async function saveLocalAgendamentos(agendamentos: Agendamento[]): Promise<void> {
  if (!agendamentos || agendamentos.length === 0) return;
  try {
    const db = await getLocalDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(LOCAL_STORES.AGENDAMENTOS, 'readwrite');
      const store = transaction.objectStore(LOCAL_STORES.AGENDAMENTOS);

      agendamentos.forEach((item) => {
        if (item && item.id) {
          store.put(sanitizeForIndexedDB(item));
        }
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.warn('[LocalPersistence] Aviso ao persistir agendamentos no IndexedDB:', err);
  }
}

/**
 * Carrega instantaneamente as transações do IndexedDB local
 */
export async function loadLocalTransacoes(): Promise<TransacaoFinanceira[]> {
  try {
    const db = await getLocalDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(LOCAL_STORES.TRANSACOES, 'readonly');
      const store = transaction.objectStore(LOCAL_STORES.TRANSACOES);
      const request = store.getAll();

      request.onsuccess = () => {
        const items = (request.result as TransacaoFinanceira[]) || [];
        // Ordena por data decrescente
        items.sort((a, b) => new Date(b.data || 0).getTime() - new Date(a.data || 0).getTime());
        resolve(items);
      };

      request.onerror = () => {
        resolve([]);
      };
    });
  } catch (err) {
    console.warn('[LocalPersistence] Aviso ao carregar transações do IndexedDB:', err);
    return [];
  }
}

/**
 * Salva transações em lote no IndexedDB local
 */
export async function saveLocalTransacoes(transacoes: TransacaoFinanceira[]): Promise<void> {
  if (!transacoes || transacoes.length === 0) return;
  try {
    const db = await getLocalDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(LOCAL_STORES.TRANSACOES, 'readwrite');
      const store = transaction.objectStore(LOCAL_STORES.TRANSACOES);

      transacoes.forEach((item) => {
        if (item && item.id) {
          store.put(sanitizeForIndexedDB(item));
        }
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.warn('[LocalPersistence] Aviso ao persistir transações no IndexedDB:', err);
  }
}

/**
 * Carrega instantaneamente os pacientes do IndexedDB local
 */
export async function loadLocalPacientes(): Promise<Paciente[]> {
  try {
    const db = await getLocalDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(LOCAL_STORES.PACIENTES, 'readonly');
      const store = transaction.objectStore(LOCAL_STORES.PACIENTES);
      const request = store.getAll();

      request.onsuccess = () => {
        const items = (request.result as Paciente[]) || [];
        items.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
        resolve(items);
      };

      request.onerror = () => {
        resolve([]);
      };
    });
  } catch (err) {
    console.warn('[LocalPersistence] Aviso ao carregar pacientes do IndexedDB:', err);
    return [];
  }
}

/**
 * Salva pacientes em lote no IndexedDB local
 */
export async function saveLocalPacientes(pacientes: Paciente[]): Promise<void> {
  if (!pacientes || pacientes.length === 0) return;
  try {
    const db = await getLocalDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(LOCAL_STORES.PACIENTES, 'readwrite');
      const store = transaction.objectStore(LOCAL_STORES.PACIENTES);

      pacientes.forEach((item) => {
        if (item && item.id) {
          store.put(sanitizeForIndexedDB(item));
        }
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.warn('[LocalPersistence] Aviso ao persistir pacientes no IndexedDB:', err);
  }
}

/**
 * Carrega coleção genérica ou especializada do IndexedDB
 */
export async function loadLocalCollection<T>(collectionName: string): Promise<T[]> {
  try {
    const db = await getLocalDB();
    const storeName = getStoreNameForCollection(collectionName);

    if (storeName === LOCAL_STORES.COLLECTIONS) {
      return new Promise((resolve) => {
        const transaction = db.transaction(LOCAL_STORES.COLLECTIONS, 'readonly');
        const store = transaction.objectStore(LOCAL_STORES.COLLECTIONS);
        const request = store.get(collectionName);

        request.onsuccess = () => {
          const result = request.result;
          resolve((result?.data as T[]) || []);
        };

        request.onerror = () => resolve([]);
      });
    }

    return new Promise((resolve) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve((request.result as T[]) || []);
      };

      request.onerror = () => resolve([]);
    });
  } catch (err) {
    console.warn(`[LocalPersistence] Aviso ao carregar coleção ${collectionName} do IndexedDB:`, err);
    return [];
  }
}

/**
 * Salva em lote qualquer coleção no IndexedDB
 */
export async function saveLocalCollection<T extends { id?: string }>(
  collectionName: string, 
  items: T[]
): Promise<void> {
  if (!items) return;
  try {
    const db = await getLocalDB();
    const storeName = getStoreNameForCollection(collectionName);

    if (storeName === LOCAL_STORES.COLLECTIONS) {
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(LOCAL_STORES.COLLECTIONS, 'readwrite');
        const store = transaction.objectStore(LOCAL_STORES.COLLECTIONS);
        store.put({
          collectionKey: collectionName,
          data: sanitizeForIndexedDB(items),
          savedAt: new Date().toISOString(),
        });
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      items.forEach((item) => {
        if (item && (item as any).id) {
          store.put(sanitizeForIndexedDB(item));
        }
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.warn(`[LocalPersistence] Aviso ao salvar coleção ${collectionName} no IndexedDB:`, err);
  }
}

/**
 * Salva ou atualiza um item individual otimisticamente no IndexedDB
 */
export async function saveLocalSingleItem<T extends { id: string }>(
  collectionName: string, 
  item: T
): Promise<void> {
  if (!item || !item.id) return;
  try {
    const db = await getLocalDB();
    const storeName = getStoreNameForCollection(collectionName);

    if (storeName === LOCAL_STORES.COLLECTIONS) {
      // Atualiza dentro do array da coleção
      const currentList = await loadLocalCollection<T>(collectionName);
      const updatedList = currentList.some(i => i.id === item.id)
        ? currentList.map(i => i.id === item.id ? { ...i, ...item } : i)
        : [...currentList, item];
      await saveLocalCollection(collectionName, updatedList);
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      store.put(sanitizeForIndexedDB(item));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.warn(`[LocalPersistence] Falha ao persistir item individual ${item.id}:`, err);
  }
}

/**
 * Remove um item individual do cache IndexedDB
 */
export async function deleteLocalSingleItem(
  collectionName: string, 
  id: string
): Promise<void> {
  if (!id) return;
  try {
    const db = await getLocalDB();
    const storeName = getStoreNameForCollection(collectionName);

    if (storeName === LOCAL_STORES.COLLECTIONS) {
      const currentList = await loadLocalCollection<{ id: string }>(collectionName);
      const updatedList = currentList.filter(i => i.id !== id);
      await saveLocalCollection(collectionName, updatedList);
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      store.delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.warn(`[LocalPersistence] Falha ao excluir item ${id} do IndexedDB:`, err);
  }
}

/**
 * Limpa todos os stores persistidos locais (para operações de Reset Total / Wipe)
 */
export async function clearAllLocalPersistence(): Promise<void> {
  try {
    if (typeof window === 'undefined' || !window.indexedDB) return;
    
    if (dbPromise) {
      try {
        const db = await dbPromise;
        db.close();
      } catch {
        // ignore
      }
      dbPromise = null;
    }

    await new Promise<void>((resolve) => {
      const request = indexedDB.deleteDatabase(DB_NAME);
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
      request.onblocked = () => resolve();
    });
  } catch (err) {
    console.warn('[LocalPersistence] Aviso ao resetar banco local:', err);
  }
}
