import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy,
  limit, 
  getDocs,
  QueryConstraint,
  WhereFilterOp,
  OrderByDirection,
  Firestore
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

export interface ServerDocSnapshot<T = any> {
  exists: boolean;
  id: string;
  data: () => T | undefined;
}

export interface ServerQuerySnapshot<T = any> {
  empty: boolean;
  size: number;
  docs: Array<ServerDocSnapshot<T>>;
}

export interface ServerDocRef {
  id: string;
  get(): Promise<ServerDocSnapshot>;
  set(data: any, options?: { merge?: boolean }): Promise<void>;
  delete(): Promise<void>;
}

export interface ServerQueryBuilder {
  where(field: string, op: WhereFilterOp, value: any): ServerQueryBuilder;
  orderBy(field: string, direction?: OrderByDirection): ServerQueryBuilder;
  limit(count: number): ServerQueryBuilder;
  get(): Promise<ServerQuerySnapshot>;
}

export interface ServerCollectionRef extends ServerQueryBuilder {
  doc(docId: string): ServerDocRef;
  add(data: any): Promise<{ id: string }>;
}

export interface ServerDb {
  collection(colName: string): ServerCollectionRef;
}

let serverDbInstance: ServerDb | null = null;

function createServerDb(): ServerDb {
  const app = getApps().length === 0
    ? initializeApp(firebaseConfig, 'server-firestore-app')
    : getApps().find(a => a.name === 'server-firestore-app') || getApps()[0];

  const dbId = (firebaseConfig as any).firestoreDatabaseId || '(default)';
  const firestore: Firestore = getFirestore(app, dbId);

  return {
    collection(colName: string): ServerCollectionRef {
      const constraints: QueryConstraint[] = [];

      const buildQuery = () => {
        if (constraints.length > 0) {
          return query(collection(firestore, colName), ...constraints);
        }
        return collection(firestore, colName);
      };

      const queryBuilder: ServerCollectionRef = {
        doc(docId: string): ServerDocRef {
          const docRef = doc(firestore, colName, docId);
          return {
            id: docId,
            async get(): Promise<ServerDocSnapshot> {
              const snap = await getDoc(docRef);
              return {
                exists: snap.exists(),
                id: snap.id,
                data: () => snap.data(),
              };
            },
            async set(data: any, options?: { merge?: boolean }): Promise<void> {
              await setDoc(docRef, data, options || {});
            },
            async delete(): Promise<void> {
              await deleteDoc(docRef);
            },
          };
        },

        async add(data: any): Promise<{ id: string }> {
          const docRef = await addDoc(collection(firestore, colName), data);
          return { id: docRef.id };
        },

        where(field: string, op: WhereFilterOp, value: any): ServerQueryBuilder {
          constraints.push(where(field, op, value));
          return queryBuilder;
        },

        orderBy(field: string, direction?: OrderByDirection): ServerQueryBuilder {
          if (direction) {
            constraints.push(orderBy(field, direction));
          } else {
            constraints.push(orderBy(field));
          }
          return queryBuilder;
        },

        limit(count: number): ServerQueryBuilder {
          constraints.push(limit(count));
          return queryBuilder;
        },

        async get(): Promise<ServerQuerySnapshot> {
          const q = buildQuery();
          const snap = await getDocs(q);
          const docs: ServerDocSnapshot[] = snap.docs.map(d => ({
            exists: d.exists(),
            id: d.id,
            data: () => d.data(),
          }));
          return {
            empty: snap.empty,
            size: snap.size,
            docs,
          };
        },
      };

      return queryBuilder;
    },
  };
}

/**
 * Retorna a instância unificada do Firestore no servidor Node.js
 * configurada para o banco Firestore do projeto sem depender de credenciais GCP IAM.
 */
export function getAdminDb(): ServerDb | null {
  try {
    if (!serverDbInstance) {
      serverDbInstance = createServerDb();
    }
    return serverDbInstance;
  } catch (e) {
    console.error('[firebaseAdmin] Falha ao inicializar conexão do Firestore no servidor:', e);
    return null;
  }
}
