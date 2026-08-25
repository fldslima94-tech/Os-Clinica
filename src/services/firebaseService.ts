import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  runTransaction,
  getDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { db, auth, googleProvider } from '../lib/firebase';
import {
  Paciente,
  Agendamento,
  EstoqueInsumo,
  ProcedimentoClinico,
  SolicitacaoOrcamento,
  TransacaoFinanceira,
  UsuarioEquipe,
  AvisoQuadro,
  AlertaRetornoPos,
  BemAtivo,
  DespesaRecorrente,
  ModeloAnamnese,
  FichaRetornoEvolucao,
  ClinicaConfig,
  InsumoConsumido,
  FormaPagamento,
  StatusPagamento
} from '../types';

// Collection Names & Canonical Firestore Paths
export const COLLECTIONS = {
  CLINICA_CONFIG: 'clinica_config',
  PACIENTES: 'pacientes',
  FICHAS_CLIENTES: 'fichas_clientes',
  AGENDAMENTOS: 'agendamentos',
  ESTOQUE: 'estoque',
  ESTOQUE_INSUMOS: 'estoque_insumos',
  PROCEDIMENTOS: 'procedimentos',
  ORCAMENTOS: 'solicitacoes_orcamento',
  ORCAMENTOS_SOLICITACOES: 'orcamentos_solicitacoes',
  TRANSACOES: 'transacoes',
  FLUXO_CAIXA: 'fluxo_caixa',
  DESPESAS_RECORRENTES: 'despesas_recorrentes',
  BENS: 'bens',
  BENS_ATIVOS: 'bens_ativos',
  MODELOS_ANAMNESE: 'modelos_anamnese',
  MODELOS_CONTRATOS: 'modelos_contratos',
  FICHAS_RETORNO: 'fichas_retorno',
  USUARIOS: 'usuarios',
  PERFIS: 'perfis',
  AVISOS: 'avisos',
  COMUNICADOS_INTERNOS: 'comunicados_internos',
  ALERTAS_RETORNO: 'alertas_retorno',
} as const;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
  TRANSACTION = 'transaction'
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMsg = error instanceof Error ? error.message : String(error);
  // Graceful handling for temporary offline / connecting network states
  if (errMsg.includes('unavailable') || errMsg.includes('offline') || errMsg.includes('Connection failed')) {
    console.info(`[Firestore Offline] Sincronização em segundo plano/modo local ativo para ${operationType} em ${path || 'coleção'}.`);
    return;
  }
  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn(`[Firestore Info - ${operationType}] em ${path}:`, errInfo.error);
}

// Firestore generic save/update helper
export async function saveDocument<T extends { id: string }>(collectionName: string, item: T): Promise<void> {
  const docPath = `${collectionName}/${item.id}`;
  try {
    const docRef = doc(db, collectionName, item.id);
    await setDoc(docRef, item, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

// Firestore soft delete for financial transactions
export async function softDeleteTransacao(
  transacaoId: string, 
  motivo: string, 
  usuarioNome: string,
  usuarioRole?: string
): Promise<void> {
  const docPath = `${COLLECTIONS.TRANSACOES}/${transacaoId}`;
  try {
    const docRef = doc(db, COLLECTIONS.TRANSACOES, transacaoId);
    await setDoc(docRef, {
      excluido: true,
      motivo_exclusao: motivo,
      excluido_por: usuarioNome,
      excluido_por_role: usuarioRole || 'gestor',
      data_exclusao: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

// Firestore hard delete helper
export async function removeDocument(collectionName: string, id: string): Promise<void> {
  const docPath = `${collectionName}/${id}`;
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

/**
 * Atomic Checkout Transaction (`runTransaction`):
 * 1. Updates Appointment status to 'concluido' and registers payment & used supplies.
 * 2. Debits quantity of each used supply in inventory.
 * 3. Creates financial entry (TransacaoFinanceira - Entrada de Caixa).
 */
export async function executeAtomicCheckout(params: {
  agendamentoId: string;
  clinicaId?: string;
  pacienteId?: string;
  pacienteNome?: string;
  profissionalId?: string;
  profissionalNome?: string;
  procedimentoNome?: string;
  valorPago?: number;
  formaPagamento?: FormaPagamento;
  statusPagamento?: StatusPagamento;
  insumosUsados?: InsumoConsumido[];
  insumosConsumidos?: InsumoConsumido[];
  transacao?: Partial<TransacaoFinanceira>;
  observacoes?: string;
}): Promise<{ transacaoId: string }> {
  const newTransacaoId = `tx-${Date.now()}`;
  const supplies = params.insumosUsados || params.insumosConsumidos || [];
  const clinicaId = params.clinicaId || 'clinica-matriz';
  const valor = params.valorPago ?? params.transacao?.valor ?? 0;
  const forma = params.formaPagamento || params.transacao?.forma_pagamento || 'pix';
  const status = params.statusPagamento || params.transacao?.status || 'pago';
  const pacienteNome = params.pacienteNome || params.transacao?.paciente_nome || 'Cliente';
  const procedimentoNome = params.procedimentoNome || params.transacao?.procedimento || 'Procedimento Estético';

  try {
    await runTransaction(db, async (transaction) => {
      // 1. Fetch & Verify Appointment
      const agRef = doc(db, COLLECTIONS.AGENDAMENTOS, params.agendamentoId);
      const agDoc = await transaction.get(agRef);
      
      // 2. Fetch inventory items to verify and debit
      const inventoryUpdates: { ref: any; newQty: number }[] = [];
      for (const insumo of supplies) {
        if (insumo.insumo_id) {
          const itemRef = doc(db, COLLECTIONS.ESTOQUE, insumo.insumo_id);
          const itemDoc = await transaction.get(itemRef);
          if (itemDoc.exists()) {
            const currentQty = Number(itemDoc.data().quantidade) || 0;
            const consumedQty = Number(insumo.quantidade_utilizada || insumo.quantidade || 0);
            const newQty = Math.max(0, currentQty - consumedQty);
            inventoryUpdates.push({ ref: itemRef, newQty });
          }
        }
      }

      // Execute Writes in Transaction:
      // A. Update appointment
      transaction.set(agRef, {
        status: 'concluido',
        valor_estimado: valor,
        forma_pagamento: forma,
        status_pagamento: status,
        insumos_consumidos: supplies,
        observacoes: params.observacoes || (agDoc.exists() ? agDoc.data().observacoes : '')
      }, { merge: true });

      // B. Debit Inventory
      for (const update of inventoryUpdates) {
        transaction.update(update.ref, { quantidade: update.newQty });
      }

      // C. Create Financial Transaction (Cash Inflow)
      const txRef = doc(db, COLLECTIONS.TRANSACOES, newTransacaoId);
      const totalCustoInsumos = supplies.reduce((sum, item) => sum + ((item.custo_unitario || 0) * (item.quantidade_utilizada || item.quantidade || 1)), 0);
      
      const newTx: TransacaoFinanceira = {
        id: newTransacaoId,
        clinica_id: clinicaId,
        agendamento_id: params.agendamentoId,
        paciente_id: params.pacienteId,
        paciente_nome: pacienteNome,
        profissional_id: params.profissionalId,
        profissional_nome: params.profissionalNome || params.transacao?.profissional_nome,
        procedimento: procedimentoNome,
        valor: valor,
        custo_insumos: totalCustoInsumos,
        forma_pagamento: forma,
        status: status,
        data: new Date().toISOString(),
        tipo: 'entrada',
        categoria: 'atendimento',
        observacao: params.observacoes || `Atendimento concluído - ${procedimentoNome}`,
        excluido: false
      };
      transaction.set(txRef, newTx);
    });

    return { transacaoId: newTransacaoId };
  } catch (error) {
    handleFirestoreError(error, OperationType.TRANSACTION, `checkout/${params.agendamentoId}`);
    return { transacaoId: newTransacaoId };
  }
}

/**
 * PARTE 4 - Transação Atômica de Checkout e Retorno:
 * Implementação modular com runTransaction, serverTimestamp e Timestamp
 */
export interface InsumoUsadoTransaction {
  insumoId: string;
  quantidadeUsada: number;
}

export async function finalizarAtendimentoTransaction(
  clinicaId: string,
  agendamentoId: string,
  valorCobrado: number,
  insumos: InsumoUsadoTransaction[],
  profissionalId: string,
  clienteId: string
) {
  return await runTransaction(db, async (transaction) => {
    const agendamentoRef = doc(db, 'agendamentos', agendamentoId);
    const agendamentoSnap = await transaction.get(agendamentoRef);

    if (!agendamentoSnap.exists()) {
      throw new Error('Agendamento não encontrado.');
    }

    // 1. Debitar insumos no estoque
    for (const item of insumos) {
      if (item.quantidadeUsada > 0) {
        const insumoRef = doc(db, 'estoque_insumos', item.insumoId);
        const insumoSnap = await transaction.get(insumoRef);

        if (insumoSnap.exists()) {
          const qtdAtual = insumoSnap.data().quantidade || 0;
          transaction.update(insumoRef, {
            quantidade: Math.max(0, qtdAtual - item.quantidadeUsada),
          });
        } else {
          // Checar fallback na coleção estoque
          const fallbackRef = doc(db, 'estoque', item.insumoId);
          const fallbackSnap = await transaction.get(fallbackRef);
          if (fallbackSnap.exists()) {
            const qtdAtual = fallbackSnap.data().quantidade || 0;
            transaction.update(fallbackRef, {
              quantidade: Math.max(0, qtdAtual - item.quantidadeUsada),
            });
          }
        }
      }
    }

    // 2. Atualizar status do agendamento
    transaction.update(agendamentoRef, {
      status: 'concluido',
      insumosUtilizados: insumos,
      concluidoEm: serverTimestamp(),
    });

    // 3. Lançar Receita no Fluxo de Caixa (Entrada)
    if (valorCobrado > 0) {
      const lancamentoRef = doc(db, 'fluxo_caixa', `${agendamentoId}_rec`);
      const procedimentoNome = agendamentoSnap.data().procedimentoNome || agendamentoSnap.data().procedimento || 'Procedimento Estético';
      transaction.set(lancamentoRef, {
        clinicaId,
        tipo: 'entrada',
        categoria: 'procedimento',
        descricao: `Atendimento concluído - ${procedimentoNome}`,
        valor: valorCobrado,
        status: 'pago',
        dataVencimento: Timestamp.now(),
        dataPagamento: Timestamp.now(),
        agendamentoId,
        profissionalId,
        excluido: false,
        motivoExclusao: null,
        criadoEm: serverTimestamp(),
      });
    }

    return { success: true, clienteId, agendamentoId };
  });
}

// Seed initial mock data into Firestore if empty
export async function seedInitialFirestoreData(mockData: {
  clinica_config?: ClinicaConfig;
  pacientes: Paciente[];
  agendamentos: Agendamento[];
  estoque: EstoqueInsumo[];
  procedimentos: ProcedimentoClinico[];
  orcamentos: SolicitacaoOrcamento[];
  transacoes: TransacaoFinanceira[];
  despesas_recorrentes?: DespesaRecorrente[];
  bens?: BemAtivo[];
  modelos_anamnese?: ModeloAnamnese[];
  fichas_retorno?: FichaRetornoEvolucao[];
  usuarios: UsuarioEquipe[];
  avisos: AvisoQuadro[];
  alertas_retorno: AlertaRetornoPos[];
}): Promise<void> {
  try {
    const checkPacientes = await getDocs(collection(db, COLLECTIONS.PACIENTES));
    if (!checkPacientes.empty) {
      return;
    }

    console.log('[Firestore] Semeando banco de dados completo do Studio...');
    const batch = writeBatch(db);

    if (mockData.clinica_config) {
      batch.set(doc(db, COLLECTIONS.CLINICA_CONFIG, mockData.clinica_config.id), mockData.clinica_config);
    }
    mockData.pacientes.forEach(p => batch.set(doc(db, COLLECTIONS.PACIENTES, p.id), p));
    mockData.agendamentos.forEach(a => batch.set(doc(db, COLLECTIONS.AGENDAMENTOS, a.id), a));
    mockData.estoque.forEach(e => batch.set(doc(db, COLLECTIONS.ESTOQUE, e.id), e));
    mockData.procedimentos.forEach(pr => batch.set(doc(db, COLLECTIONS.PROCEDIMENTOS, pr.id), pr));
    mockData.orcamentos.forEach(o => batch.set(doc(db, COLLECTIONS.ORCAMENTOS, o.id), o));
    mockData.transacoes.forEach(t => batch.set(doc(db, COLLECTIONS.TRANSACOES, t.id), t));
    if (mockData.despesas_recorrentes) mockData.despesas_recorrentes.forEach(dr => batch.set(doc(db, COLLECTIONS.DESPESAS_RECORRENTES, dr.id), dr));
    if (mockData.bens) mockData.bens.forEach(b => batch.set(doc(db, COLLECTIONS.BENS, b.id), b));
    if (mockData.modelos_anamnese) mockData.modelos_anamnese.forEach(m => batch.set(doc(db, COLLECTIONS.MODELOS_ANAMNESE, m.id), m));
    if (mockData.fichas_retorno) mockData.fichas_retorno.forEach(f => batch.set(doc(db, COLLECTIONS.FICHAS_RETORNO, f.id), f));
    mockData.usuarios.forEach(u => batch.set(doc(db, COLLECTIONS.USUARIOS, u.id), u));
    mockData.avisos.forEach(av => batch.set(doc(db, COLLECTIONS.AVISOS, av.id), av));
    mockData.alertas_retorno.forEach(ar => batch.set(doc(db, COLLECTIONS.ALERTAS_RETORNO, ar.id), ar));

    await batch.commit();
    console.log('[Firestore] Banco de dados semeado com sucesso.');
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'batch/seed');
  }
}

// Real-time listener subscription helper
export function subscribeToCollection<T>(
  collectionName: string, 
  onData: (data: T[]) => void,
  fallbackData: T[]
): () => void {
  try {
    const colRef = collection(db, collectionName);
    const unsubscribe = onSnapshot(
      colRef, 
      (snapshot) => {
        if (!snapshot.empty) {
          const items = snapshot.docs.map(d => ({ ...d.data(), id: d.id }) as T);
          onData(items);
        } else if (fallbackData.length > 0) {
          onData(fallbackData);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, collectionName);
        onData(fallbackData);
      }
    );
    return unsubscribe;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, collectionName);
    onData(fallbackData);
    return () => {};
  }
}

// Firebase Google Authentication Handlers
export async function loginWithFirebaseGoogle(): Promise<FirebaseUser | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.warn('[Firebase Auth] Erro no login Google:', error);
    throw error;
  }
}

export async function logoutFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.warn('[Firebase Auth] Erro ao deslogar:', error);
  }
}

export function onFirebaseAuthStateChange(callback: (user: FirebaseUser | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

// Helper to update user profile in Firebase Auth and Firestore
export async function updateUserAvatarAndName(usuarioId: string, avatarUrl: string, nome?: string): Promise<void> {
  try {
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, {
        photoURL: avatarUrl,
        displayName: nome || auth.currentUser.displayName
      });
    }
    const userRef = doc(db, COLLECTIONS.USUARIOS, usuarioId);
    await setDoc(userRef, { 
      avatar_url: avatarUrl,
      ...(nome ? { nome } : {})
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTIONS.USUARIOS}/${usuarioId}`);
  }
}
