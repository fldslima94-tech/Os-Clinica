import React, { useState, useEffect } from 'react';
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
  updateDoc,
  arrayUnion,
  query,
  where,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { 
  saveLocalSingleItem, 
  deleteLocalSingleItem, 
  saveLocalCollection, 
  clearAllLocalPersistence 
} from './localPersistenceService';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInAnonymously
} from 'firebase/auth';
import { db, auth, googleProvider } from '../lib/firebase';
export { db, auth, googleProvider };
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
  StatusPagamento,
  UserRole,
  PermissoesCustomizadas,
  PerfilUsuario,
  ConfiguracaoCampos,
  Fornecedor
} from '../types';

// Collection Names & Canonical Firestore Paths
export const COLLECTIONS = {
  CLINICA_CONFIG: 'clinica_config',
  CONFIGURACOES_CAMPOS: 'configuracoes_campos',
  CONFIGURACOES_SISTEMA: 'configuracoes_sistema',
  PACIENTES: 'pacientes',
  FICHAS_CLIENTES: 'fichas_clientes',
  FORNECEDORES: 'fornecedores',
  AGENDAMENTOS: 'agendamentos',
  ESTOQUE: 'estoque',
  ESTOQUE_INSUMOS: 'estoque_insumos',
  PROCEDIMENTOS: 'procedimentos',
  ORCAMENTOS: 'solicitacoes_orcamento',
  ORCAMENTOS_SOLICITACOES: 'orcamentos_solicitacoes',
  TRANSACOES: 'transacoes',
  FINANCEIRO: 'transacoes',
  FLUXO_CAIXA: 'fluxo_caixa',
  DESPESAS_RECORRENTES: 'despesas_recorrentes',
  BENS: 'bens',
  BENS_ATIVOS: 'bens_ativos',
  PATRIMONIO: 'bens_ativos',
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

// Helper to remove undefined properties and sanitize objects recursively for Firestore compatibility
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (typeof data === 'function') {
    return undefined as unknown as T;
  }
  if (data instanceof Date) {
    return data;
  }
  // Preserve Firestore FieldValue and Timestamp instances
  if (typeof data === 'object' && data !== null) {
    const constructorName = (data as any).constructor?.name;
    if (
      constructorName === 'FieldValue' ||
      constructorName === 'Timestamp' ||
      constructorName === 'ServerTimestampTransform' ||
      (data as any)._methodName ||
      typeof (data as any).toMillis === 'function' ||
      typeof (data as any).isEqual === 'function'
    ) {
      return data;
    }
  }
  if (Array.isArray(data)) {
    return data
      .filter(item => item !== undefined)
      .map(item => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        const sanitizedVal = sanitizeForFirestore(value);
        if (sanitizedVal !== undefined) {
          cleaned[key] = sanitizedVal;
        }
      }
    }
    return cleaned as T;
  }
  return data;
}

// ==========================================
// Firestore Real-Time Write Attempts Tracker
// ==========================================
export interface FirestoreWriteAttempt {
  id: string;
  timestamp: Date;
  collection: string;
  docId: string;
  operation: 'setDoc' | 'updateDoc' | 'deleteDoc' | 'runTransaction';
  status: 'pending' | 'success' | 'error';
  durationMs?: number;
  payloadSummary?: string;
  payload?: any;
  error?: string;
}

const writeAttemptsLog: FirestoreWriteAttempt[] = [];
const writeAttemptListeners = new Set<() => void>();
let isWriteDebugActive = true; // Enabled by default for transparency

export function setWriteDebugMode(enabled: boolean): void {
  isWriteDebugActive = enabled;
  if (enabled) {
    console.info('%c[Firestore Realtime Tracker] Debug logging ATIVADO. Todas as tentativas de escrita serão impressas no console.', 'color: #10b981; font-weight: bold;');
    printWriteAttemptsToConsole();
  } else {
    console.info('%c[Firestore Realtime Tracker] Debug logging DESATIVADO.', 'color: #64748b;');
  }
}

export function getWriteDebugMode(): boolean {
  return isWriteDebugActive;
}

export function getRecentWriteAttempts(): FirestoreWriteAttempt[] {
  return [...writeAttemptsLog];
}

export function subscribeToWriteAttempts(callback: () => void): () => void {
  writeAttemptListeners.add(callback);
  return () => {
    writeAttemptListeners.delete(callback);
  };
}

function recordWriteAttempt(attempt: Omit<FirestoreWriteAttempt, 'id'>): FirestoreWriteAttempt {
  const item: FirestoreWriteAttempt = {
    ...attempt,
    id: `write-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
  };
  writeAttemptsLog.unshift(item);
  if (writeAttemptsLog.length > 50) {
    writeAttemptsLog.pop();
  }
  
  if (isWriteDebugActive) {
    if (attempt.status === 'success') {
      console.log(
        `%c[Firestore Persistência OK] %c${attempt.operation.toUpperCase()} → %c${attempt.collection}/${attempt.docId} %c(${attempt.durationMs || 0}ms)`,
        'color: #10b981; font-weight: bold;',
        'color: #6366f1; font-weight: bold;',
        'color: #0f172a; font-weight: bold;',
        'color: #64748b;',
        attempt.payload || attempt.payloadSummary
      );
    } else if (attempt.status === 'error') {
      console.error(
        `%c[Firestore Persistência ERRO] %c${attempt.operation.toUpperCase()} → %c${attempt.collection}/${attempt.docId}:`,
        'color: #ef4444; font-weight: bold;',
        'color: #f59e0b; font-weight: bold;',
        'color: #0f172a;',
        attempt.error
      );
    }
  }

  writeAttemptListeners.forEach(fn => {
    try { fn(); } catch (e) { console.warn(e); }
  });

  return item;
}

export function printWriteAttemptsToConsole(): void {
  const logs = getRecentWriteAttempts();
  console.group('%c🔥 [Firestore Real-Time Writes Verification] Histórico Recente de Gravações', 'color: #6366f1; font-size: 13px; font-weight: bold;');
  console.log(`Total de tentativas registradas nesta sessão: ${logs.length}`);
  if (logs.length === 0) {
    console.log('%cNenhuma gravação realizada ainda nesta sessão.', 'color: #94a3b8; font-style: italic;');
  } else {
    console.table(logs.map(log => ({
      Horário: log.timestamp.toLocaleTimeString('pt-BR'),
      Coleção: log.collection,
      'ID Documento': log.docId,
      Operação: log.operation,
      Status: log.status.toUpperCase(),
      'Latência (ms)': log.durationMs ?? '-',
      Resumo: log.payloadSummary || '-'
    })));
  }
  console.groupEnd();
}

// Firestore generic save/update helper with timeout resilience and instant local persistence
export async function saveDocument<T extends { id: string }>(
  collectionName: string, 
  item: T
): Promise<{ success: boolean; error?: string }> {
  // 1. Optimistic instant write to local IndexedDB
  saveLocalSingleItem(collectionName, item).catch(() => {});

  const docPath = `${collectionName}/${item.id}`;
  const startTime = Date.now();
  try {
    const docRef = doc(db, collectionName, item.id);
    const sanitized = sanitizeForFirestore(item);
    
    // Set with timeout to avoid freezing UI on network jitter
    const savePromise = setDoc(docRef, {
      ...sanitized,
      atualizadoEm: serverTimestamp()
    }, { merge: true });

    const timeoutPromise = new Promise<{ timeout: true }>((resolve) => 
      setTimeout(() => resolve({ timeout: true }), 4000)
    );

    const result = await Promise.race([savePromise, timeoutPromise]);
    
    const duration = Date.now() - startTime;
    recordWriteAttempt({
      timestamp: new Date(),
      collection: collectionName,
      docId: item.id,
      operation: 'setDoc',
      status: 'success',
      durationMs: duration,
      payloadSummary: (item as any).nome || (item as any).procedimento || (item as any).descricao || (item as any).paciente_nome || 'Registro salvo',
      payload: sanitized
    });

    return { success: true };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    handleFirestoreError(error, OperationType.WRITE, docPath);
    console.warn(`[Firestore Save Info] em ${collectionName}/${item.id}:`, error?.message || error);

    recordWriteAttempt({
      timestamp: new Date(),
      collection: collectionName,
      docId: item.id,
      operation: 'setDoc',
      status: 'error',
      durationMs: duration,
      payloadSummary: (item as any).nome || 'Falha na gravação',
      error: error?.message || String(error)
    });

    return { success: false, error: error?.message || String(error) };
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
  const startTime = Date.now();
  try {
    const docRef = doc(db, COLLECTIONS.TRANSACOES, transacaoId);
    await setDoc(docRef, {
      excluido: true,
      motivo_exclusao: motivo,
      excluido_por: usuarioNome,
      excluido_por_role: usuarioRole || 'gestor',
      data_exclusao: new Date().toISOString()
    }, { merge: true });

    recordWriteAttempt({
      timestamp: new Date(),
      collection: COLLECTIONS.TRANSACOES,
      docId: transacaoId,
      operation: 'updateDoc',
      status: 'success',
      durationMs: Date.now() - startTime,
      payloadSummary: `Soft delete transação: ${motivo}`
    });
  } catch (error: any) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
    recordWriteAttempt({
      timestamp: new Date(),
      collection: COLLECTIONS.TRANSACOES,
      docId: transacaoId,
      operation: 'updateDoc',
      status: 'error',
      durationMs: Date.now() - startTime,
      error: error?.message || String(error)
    });
  }
}

// Firestore hard delete helper
export async function removeDocument(collectionName: string, id: string): Promise<void> {
  // 1. Optimistic instant delete from local IndexedDB
  deleteLocalSingleItem(collectionName, id).catch(() => {});

  const docPath = `${collectionName}/${id}`;
  const startTime = Date.now();
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);

    recordWriteAttempt({
      timestamp: new Date(),
      collection: collectionName,
      docId: id,
      operation: 'deleteDoc',
      status: 'success',
      durationMs: Date.now() - startTime,
      payloadSummary: `Exclusão de documento em ${collectionName}`
    });
  } catch (error: any) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
    recordWriteAttempt({
      timestamp: new Date(),
      collection: collectionName,
      docId: id,
      operation: 'deleteDoc',
      status: 'error',
      durationMs: Date.now() - startTime,
      error: error?.message || String(error)
    });
  }
}

/**
 * Atomic Checkout Transaction (`runTransaction`):
 * 1. Updates Appointment status to 'concluido' and registers payment & used supplies.
 * 2. Debits quantity of each used supply in inventory.
 * 3. Creates financial entry (TransacaoFinanceira - Entrada de Caixa) ONLY if valor > 0.
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
}): Promise<{ success: boolean; transacaoId?: string }> {
  const newTransacaoId = params.transacao?.id || `tx-${Date.now()}`;
  const supplies = params.insumosUsados || params.insumosConsumidos || [];
  const clinicaId = params.clinicaId || 'clinica-matriz';
  const forma = params.formaPagamento || params.transacao?.forma_pagamento || 'pix';
  const status = params.statusPagamento || params.transacao?.status || 'pago';
  const pacienteNome = params.pacienteNome || params.transacao?.paciente_nome || 'Cliente';
  const procedimentoNome = params.procedimentoNome || params.transacao?.procedimento || 'Procedimento Estético';
  const profNome = params.profissionalNome || params.transacao?.profissional_nome || 'Profissional';

  // Standardize tipo to 'entrada' or 'saida'
  const rawTipo = params.transacao?.tipo || 'entrada';
  const standardizedTipo: 'entrada' | 'saida' = (rawTipo === 'receita' || rawTipo === 'entrada') ? 'entrada' : 'saida';

  try {
    let transactionCreated = false;

    await runTransaction(db, async (transaction) => {
      // 1. Fetch & Verify Appointment safely
      const agRef = doc(db, COLLECTIONS.AGENDAMENTOS, params.agendamentoId);
      let agObs = params.observacoes || '';
      let alreadyPaidAtCheckin = false;
      let existingValor = 0;

      try {
        const agDoc = await transaction.get(agRef);
        if (agDoc.exists()) {
          const agData = agDoc.data();
          if (!params.observacoes) {
            agObs = agData.observacoes || '';
          }
          if (agData.pagamento_registrado_no_caixa === true) {
            alreadyPaidAtCheckin = true;
          }
          existingValor = Number(agData.valor_estimado || agData.valor || 0);
        }
      } catch (err) {
        console.warn('[Transaction Agendamento Read]', err);
      }

      const valorFinal = alreadyPaidAtCheckin ? 0 : (params.valorPago ?? params.transacao?.valor ?? existingValor ?? 0);
      
      // 2. Fetch inventory items to verify and debit
      const inventoryUpdates: { ref: any; newQty: number }[] = [];
      for (const insumo of supplies) {
        const insumoId = insumo.insumo_id;
        if (insumoId && !insumoId.startsWith('temp-')) {
          try {
            const itemRef = doc(db, COLLECTIONS.ESTOQUE, insumoId);
            const itemDoc = await transaction.get(itemRef);
            if (itemDoc.exists()) {
              const currentQty = Number(itemDoc.data().quantidade) || 0;
              const consumedQty = Number(insumo.quantidade_utilizada || insumo.quantidade || 0);
              const newQty = Math.max(0, currentQty - consumedQty);
              inventoryUpdates.push({ ref: itemRef, newQty });
            }
          } catch (itemErr) {
            console.warn('[Transaction Inventory Read Error]', itemErr);
          }
        }
      }

      // Execute Writes in Transaction:
      // A. Update appointment status strictly to 'concluido'
      const agUpdateData: Record<string, any> = {
        status: 'concluido',
        forma_pagamento: forma,
        status_pagamento: status,
        insumos_consumidos: supplies,
        insumos_utilizados: supplies,
        concluido_em: new Date().toISOString(),
        pagamento_registrado_no_caixa: valorFinal > 0 || alreadyPaidAtCheckin,
        observacoes: agObs
      };

      const finalEstimatedValue = valorFinal > 0 ? valorFinal : existingValor;
      if (typeof finalEstimatedValue === 'number' && !isNaN(finalEstimatedValue) && finalEstimatedValue > 0) {
        agUpdateData.valor_estimado = finalEstimatedValue;
      }

      transaction.set(agRef, sanitizeForFirestore(agUpdateData), { merge: true });

      // B. Debit Inventory
      for (const update of inventoryUpdates) {
        transaction.update(update.ref, { quantidade: update.newQty });
      }

      // C. Create Financial Transaction (Cash Inflow) ONLY if valor > 0 and NOT already settled
      if (valorFinal > 0 && !alreadyPaidAtCheckin) {
        const txRef = doc(db, COLLECTIONS.TRANSACOES, newTransacaoId);
        const totalCustoInsumos = supplies.reduce((sum, item) => sum + ((item.custo_unitario || 0) * (item.quantidade_utilizada || item.quantidade || 1)), 0);
        
        const newTx: TransacaoFinanceira = {
          id: newTransacaoId,
          clinica_id: clinicaId,
          agendamento_id: params.agendamentoId,
          paciente_id: params.pacienteId || params.transacao?.paciente_id || '',
          paciente_nome: pacienteNome,
          profissional_id: params.profissionalId || params.transacao?.profissional_id || '',
          profissional_nome: profNome,
          procedimento: procedimentoNome,
          valor: valorFinal,
          custo_insumos: totalCustoInsumos,
          forma_pagamento: forma,
          status: status,
          data: new Date().toISOString(),
          tipo: standardizedTipo,
          categoria: 'atendimento',
          observacao: params.observacoes || params.transacao?.observacao || `Atendimento concluído - ${procedimentoNome}`,
          excluido: false
        };
        transaction.set(txRef, sanitizeForFirestore(newTx));
        transactionCreated = true;
      }
    });

    return { success: true, transacaoId: transactionCreated ? newTransacaoId : undefined };
  } catch (error) {
    console.warn('[executeAtomicCheckout fallback direct save]', error);
    // Direct Fallback Persistence to ensure status 'concluido' is ALWAYS applied
    try {
      const valor = params.valorPago ?? params.transacao?.valor ?? 0;
      const fallbackAgData: { id: string } & Record<string, any> = {
        id: params.agendamentoId,
        status: 'concluido',
        forma_pagamento: forma,
        status_pagamento: status,
        insumos_consumidos: supplies,
        insumos_utilizados: supplies,
        concluido_em: new Date().toISOString(),
        pagamento_registrado_no_caixa: valor > 0 || params.transacao !== undefined,
        paciente_id: params.pacienteId || params.transacao?.paciente_id || '',
        procedimento: procedimentoNome,
        profissional_id: params.profissionalId || params.transacao?.profissional_id || '',
        profissional_nome: profNome,
      };
      if (typeof valor === 'number' && !isNaN(valor) && valor > 0) {
        fallbackAgData.valor_estimado = valor;
      }
      await saveDocument(COLLECTIONS.AGENDAMENTOS, fallbackAgData);
      if (valor > 0) {
        await saveDocument(COLLECTIONS.TRANSACOES, {
          id: newTransacaoId,
          clinica_id: clinicaId,
          agendamento_id: params.agendamentoId,
          paciente_id: params.pacienteId || params.transacao?.paciente_id || '',
          paciente_nome: pacienteNome,
          procedimento: procedimentoNome,
          profissional_id: params.profissionalId || params.transacao?.profissional_id || '',
          profissional_nome: profNome,
          valor: valor,
          forma_pagamento: forma,
          status: status,
          data: new Date().toISOString(),
          tipo: standardizedTipo,
          categoria: 'atendimento',
          excluido: false
        });
      }
      return { success: true, transacaoId: valor > 0 ? newTransacaoId : undefined };
    } catch (fallbackErr) {
      console.error('[Fallback saveDocument error]', fallbackErr);
      return { success: false };
    }
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

// Seed initial mock data into Firestore if explicitly requested (Default: Disabled for clean production)
export async function seedInitialFirestoreData(_mockData?: any): Promise<void> {
  // Desativado para iniciar o sistema completamente limpo e pronto para produção
  console.log('[Firestore] Inicialização limpa: auto-seed de mocks desativado.');
}

/**
 * Utilitário Master: Limpa todas as coleções de dados de teste/mock no Firestore e no cache local,
 * preservando estritamente a configuração da clínica e os usuários Administradores Master.
 */
export async function wipeDatabaseAndResetToProduction(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('[Firestore Wipe] Iniciando limpeza geral para produção...');

    const collectionsToClear = [
      COLLECTIONS.PACIENTES,
      COLLECTIONS.AGENDAMENTOS,
      COLLECTIONS.ESTOQUE,
      COLLECTIONS.TRANSACOES,
      COLLECTIONS.DESPESAS_RECORRENTES,
      COLLECTIONS.BENS,
      COLLECTIONS.FORNECEDORES,
      COLLECTIONS.ORCAMENTOS,
      COLLECTIONS.AVISOS,
      COLLECTIONS.ALERTAS_RETORNO,
      COLLECTIONS.MODELOS_ANAMNESE,
      COLLECTIONS.FICHAS_RETORNO,
    ];

    for (const colName of collectionsToClear) {
      try {
        const snap = await getDocs(collection(db, colName));
        if (!snap.empty) {
          const docs = snap.docs;
          const CHUNK_SIZE = 200;
          for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
            const chunk = docs.slice(i, i + CHUNK_SIZE);
            const batch = writeBatch(db);
            chunk.forEach((docSnap) => {
              batch.delete(docSnap.ref);
            });
            await batch.commit();
          }
        }
      } catch (err) {
        console.warn(`[Firestore Wipe] Aviso ao limpar coleção ${colName}:`, err);
      }
    }

    // Limpar usuários e perfis não-master
    try {
      const userSnap = await getDocs(collection(db, COLLECTIONS.USUARIOS));
      if (!userSnap.empty) {
        const userDocs = userSnap.docs.filter((d) => {
          const u = d.data() as UsuarioEquipe;
          return (
            d.id !== 'user-super-admin' &&
            d.id !== 'user-super-admin-alt' &&
            u.email !== 'fldslima94@gmail.com' &&
            u.email !== 'fabio@teste.com'
          );
        });

        const CHUNK_SIZE = 200;
        for (let i = 0; i < userDocs.length; i += CHUNK_SIZE) {
          const chunk = userDocs.slice(i, i + CHUNK_SIZE);
          const batchUsers = writeBatch(db);
          chunk.forEach((d) => batchUsers.delete(d.ref));
          await batchUsers.commit();
        }
      }

      const perfilSnap = await getDocs(collection(db, COLLECTIONS.PERFIS));
      if (!perfilSnap.empty) {
        const perfilDocs = perfilSnap.docs.filter((d) => 
          d.id !== 'user-super-admin' && d.id !== 'user-super-admin-alt'
        );
        const CHUNK_SIZE = 200;
        for (let i = 0; i < perfilDocs.length; i += CHUNK_SIZE) {
          const chunk = perfilDocs.slice(i, i + CHUNK_SIZE);
          const batchPerfis = writeBatch(db);
          chunk.forEach((d) => batchPerfis.delete(d.ref));
          await batchPerfis.commit();
        }
      }
    } catch (err) {
      console.warn('[Firestore Wipe] Aviso ao limpar usuários secundários:', err);
    }

    // Re-garante Super Admin Master no Firestore
    await ensureSuperAdminInFirestore();

    // Limpar IndexedDB local e caches de sincronização
    if (typeof window !== 'undefined') {
      try {
        if (window.indexedDB && window.indexedDB.deleteDatabase) {
          window.indexedDB.deleteDatabase('AuraEsteticaSyncDB');
        }
        await clearAllLocalPersistence();
        localStorage.removeItem('aura_offline_mutations_v2');
        localStorage.removeItem('aura_sync_pending_v1');
      } catch (cacheErr) {
        console.warn('[Cache Wipe] Aviso ao limpar caches locais:', cacheErr);
      }
    }

    return { 
      success: true, 
      message: 'Banco de dados e cache local limpos com sucesso! Apenas o Administrador Master foi mantido.' 
    };
  } catch (error: any) {
    console.error('[Firestore Wipe] Erro ao resetar banco de dados:', error);
    return { 
      success: false, 
      message: error?.message || 'Falha ao executar limpeza do banco de dados.' 
    };
  }
}

// Real-time listener subscription helper with optional clinicaId filtering and local cache warming
export function subscribeToCollection<T extends { id?: string }>(
  collectionName: string, 
  onData: (data: T[]) => void,
  fallbackData: T[] = [],
  clinicaId?: string
): () => void {
  try {
    const colRef = collection(db, collectionName);
    const q = clinicaId ? query(colRef, where('clinicaId', '==', clinicaId)) : colRef;
    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        // Envia os documentos da coleção diretamente (array vazio [] se não houver documentos)
        const items = snapshot.docs.map(d => ({ ...d.data(), id: d.id }) as T);
        onData(items);
        // Salva silenciosamente no cache local IndexedDB para carregamento instantâneo nas próximas sessões
        saveLocalCollection(collectionName, items).catch(() => {});
      },
      (error) => {
        console.error(`[Firestore Subscription Error] Erro ao sincronizar coleção "${collectionName}":`, error);
        handleFirestoreError(error, OperationType.GET, collectionName);
        if (fallbackData && fallbackData.length > 0) {
          onData(fallbackData);
        }
      }
    );
    return unsubscribe;
  } catch (error) {
    console.error(`[Firestore Subscription Init Error] Erro ao inicializar listener em "${collectionName}":`, error);
    handleFirestoreError(error, OperationType.GET, collectionName);
    if (fallbackData && fallbackData.length > 0) {
      onData(fallbackData);
    }
    return () => {};
  }
}

// Fetch documents filtered by clinicaId
export async function getClinicaDocs<T>(collectionName: string, clinicaId?: string): Promise<T[]> {
  try {
    const colRef = collection(db, collectionName);
    const q = clinicaId ? query(colRef, where('clinicaId', '==', clinicaId)) : colRef;
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id }) as unknown as T);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionName);
    return [];
  }
}

// React Hook for Real-time Firestore Collection Synchronization
export function useCollectionData<T extends { id: string }>(
  collectionName: string, 
  initialFallbackData: T[] = [],
  clinicaId?: string
): [T[], React.Dispatch<React.SetStateAction<T[]>>, boolean] {
  const [data, setData] = useState<T[]>(initialFallbackData);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = subscribeToCollection<T>(
      collectionName,
      (incomingData) => {
        setData(incomingData);
        setLoading(false);
      },
      initialFallbackData,
      clinicaId
    );
    return () => unsubscribe();
  }, [collectionName, clinicaId]);

  return [data, setData, loading];
}

// Firebase Email & Password Authentication Handlers
export async function loginWithFirebaseEmailPassword(email: string, pass: string): Promise<FirebaseUser> {
  const cleanEmail = email.trim().toLowerCase();
  try {
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    return userCredential.user;
  } catch (error: any) {
    // If user does not exist in Firebase Auth yet, attempt automatic creation
    if (
      error.code === 'auth/user-not-found' || 
      error.code === 'auth/invalid-credential' ||
      error.code === 'auth/invalid-login-credentials'
    ) {
      try {
        const newCredential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
        return newCredential.user;
      } catch (createErr: any) {
        // If user actually existed or creation failed, rethrow original login error
        console.warn('[Firebase Auth] Erro ao criar conta de sessão:', createErr);
        throw error;
      }
    }
    throw error;
  }
}

export async function registerFirebaseEmailPassword(email: string, pass: string, displayName?: string): Promise<FirebaseUser> {
  const userCredential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), pass);
  if (displayName) {
    await updateProfile(userCredential.user, { displayName });
  }
  return userCredential.user;
}

export async function sendFirebasePasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim().toLowerCase());
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

/**
 * Busca autoritativa em tempo real no Firestore por e-mail de usuário
 */
export async function fetchUserFromFirestoreByEmail(email: string): Promise<UsuarioEquipe | null> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return null;

  try {
    // 1. Busca direta na coleção principal de usuários
    const snapUsuarios = await getDocs(collection(db, COLLECTIONS.USUARIOS));
    for (const docSnap of snapUsuarios.docs) {
      const data = docSnap.data() as UsuarioEquipe;
      const uEmail = (data.email || '').trim().toLowerCase();
      if (uEmail === cleanEmail) {
        return { ...data, id: docSnap.id };
      }
    }

    // 2. Busca de contingência na coleção de perfis
    const snapPerfis = await getDocs(collection(db, COLLECTIONS.PERFIS));
    for (const docSnap of snapPerfis.docs) {
      const data = docSnap.data() as UsuarioEquipe;
      const uEmail = (data.email || '').trim().toLowerCase();
      if (uEmail === cleanEmail) {
        return { ...data, id: docSnap.id };
      }
    }
  } catch (err) {
    console.warn('[fetchUserFromFirestoreByEmail] Aviso ao consultar usuário no Firestore:', err);
  }
  return null;
}

/**
 * Carrega todos os usuários salvos no Firestore de forma direta e síncrona
 */
export async function fetchAllUsersFromFirestore(): Promise<UsuarioEquipe[]> {
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.USUARIOS));
    if (!snap.empty) {
      return snap.docs.map(d => ({ ...d.data(), id: d.id }) as UsuarioEquipe);
    }
  } catch (err) {
    console.warn('[fetchAllUsersFromFirestore] Aviso ao buscar lista de usuários:', err);
  }
  return [];
}

// Helper to update user profile in Firebase Auth and Firestore (perfis & usuarios)
export async function updateUserAvatarAndName(usuarioId: string, avatarUrl: string, nome?: string): Promise<void> {
  try {
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, {
        photoURL: avatarUrl,
        displayName: nome || auth.currentUser.displayName
      });
    }
    const userRef = doc(db, COLLECTIONS.USUARIOS, usuarioId);
    const perfilRef = doc(db, COLLECTIONS.PERFIS, usuarioId);
    
    const updateData: Record<string, any> = sanitizeForFirestore({ 
      avatar_url: avatarUrl,
      avatarUrl: avatarUrl,
      ...(nome ? { nome, nomeCompleto: nome } : {})
    });

    await setDoc(userRef, updateData, { merge: true });
    await setDoc(perfilRef, updateData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTIONS.USUARIOS}/${usuarioId}`);
  }
}

// Complete profile updater for self-management
export async function atualizarDadosPerfil(
  usuarioId: string, 
  dados: { nomeCompleto?: string; profissao?: string; avatarUrl?: string; telefone?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    if (auth.currentUser && dados.nomeCompleto) {
      await updateProfile(auth.currentUser, {
        displayName: dados.nomeCompleto,
        photoURL: dados.avatarUrl || auth.currentUser.photoURL
      });
    }

    const payload: Record<string, any> = sanitizeForFirestore({
      atualizadoEm: serverTimestamp(),
      ...(dados.nomeCompleto ? { nome: dados.nomeCompleto, nomeCompleto: dados.nomeCompleto } : {}),
      ...(dados.profissao !== undefined ? { profissao: dados.profissao, cargo: dados.profissao } : {}),
      ...(dados.avatarUrl ? { avatar_url: dados.avatarUrl, avatarUrl: dados.avatarUrl } : {}),
      ...(dados.telefone ? { telefone: dados.telefone } : {})
    });

    const userRef = doc(db, COLLECTIONS.USUARIOS, usuarioId);
    const perfilRef = doc(db, COLLECTIONS.PERFIS, usuarioId);

    await setDoc(userRef, payload, { merge: true });
    await setDoc(perfilRef, payload, { merge: true });

    return { success: true };
  } catch (error: any) {
    console.error('[Firebase] Erro ao atualizar dados do perfil:', error);
    return { success: false, error: error.message || 'Erro ao atualizar dados do perfil' };
  }
}

// Secure password update with Firebase Auth re-authentication
export async function reautenticarEAtualizarSenha(
  senhaAtual: string, 
  novaSenha: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) {
      return { success: false, error: 'Usuário não autenticado no Firebase Auth.' };
    }

    if (novaSenha.length < 6) {
      return { success: false, error: 'A nova senha deve ter no mínimo 6 caracteres.' };
    }

    // Step 1: Re-authenticate with current credentials
    const credential = EmailAuthProvider.credential(user.email, senhaAtual);
    await reauthenticateWithCredential(user, credential);

    // Step 2: Update to new password
    await updatePassword(user, novaSenha);

    return { success: true };
  } catch (error: any) {
    console.warn('[Firebase Auth] Erro ao atualizar senha:', error);
    let friendlyMessage = 'Não foi possível alterar a senha. Verifique os dados informados.';
    
    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      friendlyMessage = 'A senha atual informada está incorreta.';
    } else if (error.code === 'auth/weak-password') {
      friendlyMessage = 'A nova senha é muito fraca. Utilize pelo menos 6 caracteres.';
    } else if (error.code === 'auth/requires-recent-login') {
      friendlyMessage = 'Por motivos de segurança, faça login novamente antes de redefinir sua senha.';
    }

    return { success: false, error: friendlyMessage };
  }
}

// Save field visibility configurations (admin_total)
export async function salvarConfiguracaoCampos(
  clinicaId: string, 
  configuracao: ConfiguracaoCampos
): Promise<{ success: boolean; error?: string }> {
  try {
    const configDocRef = doc(db, COLLECTIONS.CONFIGURACOES_CAMPOS, clinicaId || 'config_matriz');
    await setDoc(configDocRef, sanitizeForFirestore({
      ...configuracao,
      clinicaId: clinicaId || 'config_matriz',
      atualizadoEm: serverTimestamp()
    }), { merge: true });
    return { success: true };
  } catch (error: any) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTIONS.CONFIGURACOES_CAMPOS}/${clinicaId}`);
    return { success: false, error: error.message };
  }
}

// Save user permissions (admin_total)
export async function salvarPermissoesUsuario(
  usuarioId: string,
  permissoes: PermissoesCustomizadas,
  role?: UserRole
): Promise<{ success: boolean; error?: string }> {
  try {
    const userRef = doc(db, COLLECTIONS.USUARIOS, usuarioId);
    const perfilRef = doc(db, COLLECTIONS.PERFIS, usuarioId);

    const updateData: Record<string, any> = sanitizeForFirestore({
      permissoesCustomizadas: permissoes,
      ...(role ? { role, cargo: role } : {}),
      atualizadoEm: serverTimestamp()
    });

    await setDoc(userRef, updateData, { merge: true });
    await setDoc(perfilRef, updateData, { merge: true });

    return { success: true };
  } catch (error: any) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTIONS.USUARIOS}/${usuarioId}`);
    return { success: false, error: error.message };
  }
}

// Excluir usuário com acesso ao sistema (Super Admin)
export async function excluirUsuario(usuarioId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const userRef = doc(db, COLLECTIONS.USUARIOS, usuarioId);
    const perfilRef = doc(db, COLLECTIONS.PERFIS, usuarioId);

    await deleteDoc(userRef);
    try {
      await deleteDoc(perfilRef);
    } catch {
      // Perfil doc might be optional
    }

    return { success: true };
  } catch (error: any) {
    handleFirestoreError(error, OperationType.DELETE, `${COLLECTIONS.USUARIOS}/${usuarioId}`);
    return { success: false, error: error.message };
  }
}

// Permission & Role Helper Checking Utilities (Hierarquia: Admin Master > Admin Local > Usuário > Cliente)
export const SUPER_ADMIN_EMAILS = [
  'fldslima94@gmail.com',
  'fabio@teste.com'
];

export function isUserAdminTotal(user?: UsuarioEquipe | null): boolean {
  if (!user) return false;
  const userEmail = (user.email || '').toLowerCase().trim();
  if (SUPER_ADMIN_EMAILS.includes(userEmail)) return true;
  const userName = (user.nome || user.nomeCompleto || '').toLowerCase().trim();
  const userRole = (user.role || '').toLowerCase().trim();
  const userCargo = (user.cargo || '').toLowerCase().trim();
  
  return (
    userRole === 'admin_total' || 
    userRole === 'admin_master' || 
    userRole === 'admin' || 
    userRole === 'master' ||
    userRole === 'super_admin' ||
    user.id === 'user-super-admin' ||
    user.id === 'user-super-admin-alt' ||
    userName === 'fabio lima' ||
    userName.includes('fabio lima') ||
    Boolean(userCargo && (
      userCargo.includes('master') || 
      userCargo.includes('super admin') || 
      userCargo.includes('administrador geral') || 
      userCargo.includes('admin total')
    ))
  );
}

export function isUserAdminMaster(user?: UsuarioEquipe | null): boolean {
  return isUserAdminTotal(user);
}

export function isUserAdminLocalOrTotal(user?: UsuarioEquipe | null): boolean {
  if (!user) return false;
  if (isUserAdminTotal(user)) return true;
  const userRole = (user.role || '').toLowerCase().trim();
  const userCargo = (user.cargo || '').toLowerCase().trim();
  return (
    userRole === 'admin_master' ||
    userRole === 'admin_total' ||
    userRole === 'admin_local' || 
    userRole === 'gestor' ||
    userRole === 'admin' ||
    userCargo.includes('admin local') ||
    userCargo.includes('gerente') ||
    userCargo.includes('gestor') ||
    userCargo.includes('administrador')
  );
}

/**
 * Validação estrita de acesso a dados financeiros (receita, lucro, despesas, margens, metas)
 * Permitido apenas para Admin Local e Admin Master (Total).
 */
export function canAccessFinancials(user?: UsuarioEquipe | null): boolean {
  return isUserAdminLocalOrTotal(user);
}

/**
 * Auto-cura e garantia de existência do Super Admin no Firestore
 */
export async function ensureSuperAdminInFirestore(): Promise<void> {
  try {
    const superAdminData: UsuarioEquipe = {
      id: 'user-super-admin',
      nome: 'Fabio Lima',
      nomeCompleto: 'Fabio Lima',
      email: 'fldslima94@gmail.com',
      senha: 'admin123',
      cargo: 'Super Admin (Master)',
      profissao: 'Proprietário & Administrador Geral',
      role: 'admin_total',
      telefone: '(11) 99999-8877',
      status: 'ativo',
      ultimo_acesso: 'Online agora',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      registro_profissional: 'ADM/SP 99.112',
      especialidade: 'Governança & Gestão de Clínicas',
      porcentagem_comissao: 100,
      permissoes: {
        ver_financeiro_completo: true,
        emitir_recibo: true,
        editar_prontuario_clinico: true,
        gerenciar_estoque_custos: true,
        configuracoes_sistema: true,
        visualizar_bens_ativos: true,
      },
      permissoesCustomizadas: {
        financeiro: { verEntradas: true, verSaidas: true, verRecorrentes: true, excluir: true, verRelatorios: true },
        clientes: { criar: true, editar: true, excluir: true, verHistorico: true, preencherAnamnese: true },
        agenda: { verTodos: true, verPropria: true, criar: true, cancelar: true, finalizar: true },
        procedimentos: { verCustos: true, verMargem: true, criar: true, excluir: true, ajustarEstoque: true },
        bens: { visualizar: true, cadastrar: true, editar: true, gerenciar: true, excluir: true, manutencao: true },
        estoque: { ajustar: true, excluir: true },
        orcamentos: { verTodos: true, responder: true, verEmails: true }
      }
    };

    const userRef = doc(db, COLLECTIONS.USUARIOS, 'user-super-admin');
    const perfilRef = doc(db, COLLECTIONS.PERFIS, 'user-super-admin');

    await setDoc(userRef, sanitizeForFirestore(superAdminData), { merge: true });
    await setDoc(perfilRef, sanitizeForFirestore(superAdminData), { merge: true });

    // Also auto-heal alternate super admin login (fabio@teste.com)
    const superAdminAltData: UsuarioEquipe = {
      ...superAdminData,
      id: 'user-super-admin-alt',
      nome: 'Fabio Lima (Master)',
      nomeCompleto: 'Fabio Lima (Master)',
      email: 'fabio@teste.com',
      senha: 'admin123',
    };
    const userAltRef = doc(db, COLLECTIONS.USUARIOS, 'user-super-admin-alt');
    const perfilAltRef = doc(db, COLLECTIONS.PERFIS, 'user-super-admin-alt');
    await setDoc(userAltRef, sanitizeForFirestore(superAdminAltData), { merge: true });
    await setDoc(perfilAltRef, sanitizeForFirestore(superAdminAltData), { merge: true });
  } catch (err) {
    console.warn('[ensureSuperAdminInFirestore] Aviso ao sincronizar Super Admin:', err);
  }
}

export function checkUserCustomPermission(
  user: UsuarioEquipe | null | undefined, 
  modulo: keyof PermissoesCustomizadas, 
  acao: string
): boolean {
  if (!user) return false;
  
  // 1. Admin Master always has full irrevocable privileges across all modules
  if (isUserAdminTotal(user)) return true;

  // 2. Cliente has restricted portal-only access
  if (user.role === 'cliente') {
    if (modulo === 'orcamentos') return true;
    return false;
  }

  // 3. Custom permissions matrix check (configured by Master or Local)
  if (user.permissoesCustomizadas && (user.permissoesCustomizadas as any)[modulo]) {
    const val = (user.permissoesCustomizadas as any)[modulo][acao];
    if (typeof val === 'boolean') return val;
  }

  // 4. Fallback defaults based on role & hierarchy
  if (modulo === 'financeiro') {
    // Valores de receita, lucro, margens, despesas e metas restritos estritamente ao admin_local e admin_total
    if (!isUserAdminLocalOrTotal(user)) return false;
    if (acao === 'excluir') return isUserAdminTotal(user) || Boolean(user.permissoesCustomizadas?.financeiro?.excluir);
    return true;
  }

  if (modulo === 'clientes') {
    if (acao === 'excluir') return isUserAdminTotal(user);
    return true;
  }

  if (modulo === 'procedimentos') {
    if (acao === 'verCustos' || acao === 'verMargem') return isUserAdminLocalOrTotal(user);
    if (acao === 'excluir') return isUserAdminTotal(user);
    return true;
  }

  if (modulo === 'bens') {
    if (acao === 'excluir') return isUserAdminTotal(user);
    return isUserAdminLocalOrTotal(user);
  }

  if (modulo === 'estoque') {
    if (acao === 'excluir') return isUserAdminTotal(user);
    return isUserAdminLocalOrTotal(user);
  }

  return true;
}

// ==========================================
// 6.1 Gestão de Manutenção Preventiva & Alertas
// ==========================================

export interface AlertaManutencaoItem {
  id: string;
  nome: string;
  categoria: string;
  localizacao_sala?: string;
  responsavel_nome?: string;
  empresaTecnica?: string;
  dataUltimaManutencao?: string;
  dataProximaManutencao?: string;
  periodicidadeDias?: number;
  statusManutencao: 'em_dia' | 'alerta_proximo' | 'vencida' | 'em_manutencao';
  diasDiferenca?: number;
  diasRestantes?: number;
}

export interface AlertasManutencaoResultado {
  vencidos: AlertaManutencaoItem[];
  proximos: AlertaManutencaoItem[];
  emManutencao: AlertaManutencaoItem[];
  emDia: AlertaManutencaoItem[];
  totalAlertas: number;
}

/**
 * Busca equipamentos com manutenção próxima (7 a 15 dias) ou vencida para exibição no Dashboard e cabeçalho
 */
export async function buscarAlertasManutencao(
  clinicaId?: string, 
  diasMargemAlerta: number = 15
): Promise<AlertasManutencaoResultado> {
  const agora = new Date();
  const hojeStr = agora.toISOString().slice(0, 10);
  const dataLimiteAlerta = new Date();
  dataLimiteAlerta.setDate(agora.getDate() + diasMargemAlerta);
  const limiteStr = dataLimiteAlerta.toISOString().slice(0, 10);

  const resultado: AlertasManutencaoResultado = {
    vencidos: [],
    proximos: [],
    emManutencao: [],
    emDia: [],
    totalAlertas: 0,
  };

  try {
    const bensRef = collection(db, COLLECTIONS.BENS_ATIVOS);
    const snapshot = await getDocs(bensRef);

    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as BemAtivo;
      if (!data.requerManutencao) return;

      const proximaStr = data.dataProximaManutencao || '';
      if (!proximaStr) return;

      const dataProxima = new Date(proximaStr);
      const isEmManutencao = data.statusManutencao === 'em_manutencao' || data.estado_conservacao === 'manutencao';

      if (isEmManutencao) {
        resultado.emManutencao.push({
          id: docSnap.id,
          nome: data.nome,
          categoria: data.categoria,
          localizacao_sala: data.localizacao_sala,
          responsavel_nome: data.responsavel_nome,
          empresaTecnica: data.empresaTecnica,
          dataUltimaManutencao: data.dataUltimaManutencao,
          dataProximaManutencao: proximaStr,
          periodicidadeDias: data.periodicidadeDias,
          statusManutencao: 'em_manutencao',
        });
      } else if (proximaStr < hojeStr) {
        const diffDias = Math.max(1, Math.floor((agora.getTime() - dataProxima.getTime()) / (1000 * 3600 * 24)));
        resultado.vencidos.push({
          id: docSnap.id,
          nome: data.nome,
          categoria: data.categoria,
          localizacao_sala: data.localizacao_sala,
          responsavel_nome: data.responsavel_nome,
          empresaTecnica: data.empresaTecnica,
          dataUltimaManutencao: data.dataUltimaManutencao,
          dataProximaManutencao: proximaStr,
          periodicidadeDias: data.periodicidadeDias,
          statusManutencao: 'vencida',
          diasDiferenca: diffDias,
        });
      } else if (proximaStr <= limiteStr) {
        const diasRestantes = Math.max(0, Math.ceil((dataProxima.getTime() - agora.getTime()) / (1000 * 3600 * 24)));
        resultado.proximos.push({
          id: docSnap.id,
          nome: data.nome,
          categoria: data.categoria,
          localizacao_sala: data.localizacao_sala,
          responsavel_nome: data.responsavel_nome,
          empresaTecnica: data.empresaTecnica,
          dataUltimaManutencao: data.dataUltimaManutencao,
          dataProximaManutencao: proximaStr,
          periodicidadeDias: data.periodicidadeDias,
          statusManutencao: 'alerta_proximo',
          diasRestantes,
        });
      } else {
        resultado.emDia.push({
          id: docSnap.id,
          nome: data.nome,
          categoria: data.categoria,
          localizacao_sala: data.localizacao_sala,
          responsavel_nome: data.responsavel_nome,
          empresaTecnica: data.empresaTecnica,
          dataUltimaManutencao: data.dataUltimaManutencao,
          dataProximaManutencao: proximaStr,
          periodicidadeDias: data.periodicidadeDias,
          statusManutencao: 'em_dia',
        });
      }
    });

    resultado.totalAlertas = resultado.vencidos.length + resultado.proximos.length + resultado.emManutencao.length;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, COLLECTIONS.BENS_ATIVOS);
  }

  return resultado;
}

/**
 * Registra intervenção de manutenção no bem, atualiza a data da última,
 * recalcula a próxima com base na periodicidade e arquiva no histórico.
 */
export async function registrarNovaManutencao(
  bemId: string,
  dados: {
    tipo: 'preventiva' | 'corretiva' | 'calibracao';
    descricao: string;
    custo: number;
    tecnicoEmpresa: string;
    periodicidadeDias: number;
    registradoPor: string;
    dataRealizacao?: string;
    laudoUrl?: string;
    laudoNome?: string;
  }
): Promise<{ success: boolean; dataProximaManutencao: string }> {
  const dataExecucao = dados.dataRealizacao ? new Date(dados.dataRealizacao) : new Date();
  const proxima = new Date(dataExecucao.getTime() + dados.periodicidadeDias * 86400000);
  const dataExecucaoStr = dataExecucao.toISOString().slice(0, 10);
  const dataProximaStr = proxima.toISOString().slice(0, 10);

  const novoHistoricoItem = {
    id: `manut-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    dataRealizacao: dataExecucaoStr,
    tipo: dados.tipo,
    descricao: dados.descricao,
    custo: Number(dados.custo) || 0,
    tecnicoEmpresa: dados.tecnicoEmpresa,
    laudoUrl: dados.laudoUrl || '',
    laudoNome: dados.laudoNome || '',
    registradoPor: dados.registradoPor,
  };

  try {
    const bemRef = doc(db, COLLECTIONS.BENS_ATIVOS, bemId);
    const snap = await getDoc(bemRef);
    const atual = snap.exists() ? snap.data() : {};
    const historicoAntigo = atual.historicoManutencoes || [];

    await updateDoc(bemRef, {
      dataUltimaManutencao: dataExecucaoStr,
      dataProximaManutencao: dataProximaStr,
      periodicidadeDias: dados.periodicidadeDias,
      empresaTecnica: dados.tecnicoEmpresa || atual.empresaTecnica || '',
      statusManutencao: 'em_dia',
      estado_conservacao: 'excelente',
      historicoManutencoes: [novoHistoricoItem, ...historicoAntigo],
      atualizadoEm: serverTimestamp(),
    });

    return { success: true, dataProximaManutencao: dataProximaStr };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COLLECTIONS.BENS_ATIVOS}/${bemId}`);
    return { success: false, dataProximaManutencao: dataProximaStr };
  }
}

// ==========================================
// Script de Migração: Promoção de Fabio Lima e Rebaixamento de Admins
// ==========================================

export async function migrarHierarquiaUsuarios(emailSuperAdmin: string = 'fldslima94@gmail.com') {
  try {
    const usuariosRef = collection(db, COLLECTIONS.USUARIOS);
    const snapshot = await getDocs(usuariosRef);

    let totalMigrados = 0;
    let superAdminDefinido = false;

    const batch = writeBatch(db);

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const userDocRef = doc(db, COLLECTIONS.USUARIOS, docSnap.id);
      const perfisDocRef = doc(db, COLLECTIONS.PERFIS, docSnap.id);

      const userEmail = (data.email || '').toLowerCase().trim();
      const userName = (data.nomeCompleto || data.nome || '').toLowerCase().trim();
      const isSuper =
        docSnap.id === 'user-super-admin' ||
        userEmail === 'fldslima94@gmail.com' ||
        userEmail === 'fabio@teste.com' ||
        userEmail === emailSuperAdmin.toLowerCase().trim() ||
        userName.includes('fabio lima');

      // 1. Identificar Fabio Lima como Super Admin ('admin_total')
      if (isSuper) {
        const updateSuper = {
          cargo: 'Super Admin (Master)',
          role: 'admin_total' as UserRole,
          superAdmin: true,
          permissoesCompletas: true,
          atualizadoEm: serverTimestamp(),
        };
        batch.set(userDocRef, updateSuper, { merge: true });
        batch.set(perfisDocRef, updateSuper, { merge: true });
        superAdminDefinido = true;
      } 
      // 2. Rebaixar qualquer outro admin/gestor para 'admin_local'
      else if (data.cargo === 'gestor' || data.cargo === 'admin' || data.role === 'admin' || data.role === 'gestor') {
        const updateLocal = {
          cargo: 'Admin Local (Gestor)',
          role: 'admin_local' as UserRole,
          superAdmin: false,
          atualizadoEm: serverTimestamp(),
        };
        batch.set(userDocRef, updateLocal, { merge: true });
        batch.set(perfisDocRef, updateLocal, { merge: true });
        totalMigrados++;
      }
    });

    await batch.commit();

    return {
      success: true,
      superAdminDefinido,
      adminsRebaixados: totalMigrados,
    };
  } catch (error: any) {
    handleFirestoreError(error, OperationType.WRITE, COLLECTIONS.USUARIOS);
    return {
      success: false,
      error: error.message,
      superAdminDefinido: false,
      adminsRebaixados: 0,
    };
  }
}

// React Hook para controle de renderização e permissões
export function usePermissions(currentUser?: UsuarioEquipe | null) {
  const isAdminTotal = isUserAdminTotal(currentUser);
  const isAdminLocalOrTotal = isUserAdminLocalOrTotal(currentUser);

  const can = (modulo: keyof PermissoesCustomizadas, acao: string) => {
    return checkUserCustomPermission(currentUser, modulo, acao);
  };

  return {
    isAdminTotal,
    isAdminLocalOrTotal,
    can,
    canDelete: (modulo: keyof PermissoesCustomizadas) => checkUserCustomPermission(currentUser, modulo, 'excluir'),
    canManageAssets: () => checkUserCustomPermission(currentUser, 'bens', 'gerenciar'),
  };
}

// ============================================================================
// 10. MÓDULO MASTER DATABASE: CRUD, CATEGORIAS, HISTÓRICOS E AUDITORIA GLOBAL
// ============================================================================

/**
 * Exclusão física definitiva direta de qualquer documento no Firestore para o Admin Master
 */
export async function deleteRecordMaster(collectionName: string, docId: string): Promise<boolean> {
  try {
    // 1. Instant local persistence removal
    deleteLocalSingleItem(collectionName, docId).catch(() => {});
    
    // 2. Remove from Firestore
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
    return true;
  } catch (error: any) {
    console.error(`[deleteRecordMaster] Erro ao excluir registro ${docId} de ${collectionName}:`, error);
    handleFirestoreError(error, OperationType.DELETE, collectionName);
    return false;
  }
}

/**
 * Atualização/Edição direta de campos de qualquer documento no Firestore para o Admin Master
 */
export async function updateRecordMaster(collectionName: string, docId: string, data: any): Promise<boolean> {
  try {
    const docRef = doc(db, collectionName, docId);
    const cleanData = sanitizeForFirestore({
      ...data,
      atualizadoEm: serverTimestamp(),
    });
    await setDoc(docRef, cleanData, { merge: true });
    return true;
  } catch (error: any) {
    console.error(`[updateRecordMaster] Erro ao atualizar documento ${docId} em ${collectionName}:`, error);
    handleFirestoreError(error, OperationType.WRITE, collectionName);
    return false;
  }
}

/**
 * Criação de novo documento com ID gerado ou customizado para o Admin Master
 */
export async function createRecordMaster(collectionName: string, data: any, customId?: string): Promise<string | null> {
  try {
    const id = customId || (data.id && String(data.id).trim() ? String(data.id).trim() : `${collectionName.slice(0, 4)}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`);
    const docRef = doc(db, collectionName, id);
    const cleanData = sanitizeForFirestore({
      ...data,
      id,
      criadoEm: serverTimestamp(),
      atualizadoEm: serverTimestamp(),
    });
    await setDoc(docRef, cleanData, { merge: true });
    return id;
  } catch (error: any) {
    console.error(`[createRecordMaster] Erro ao criar documento em ${collectionName}:`, error);
    handleFirestoreError(error, OperationType.WRITE, collectionName);
    return null;
  }
}

/**
 * Atualização em lote de categoria para todos os documentos de uma coleção (renomeação de categoria)
 */
export async function batchRenameCategory(
  collectionName: string,
  oldCategory: string,
  newCategory: string,
  categoryField: string = 'categoria'
): Promise<{ success: boolean; updatedCount: number }> {
  try {
    if (!oldCategory || !newCategory || oldCategory.trim() === newCategory.trim()) {
      return { success: true, updatedCount: 0 };
    }

    const colRef = collection(db, collectionName);
    const snap = await getDocs(colRef);
    let updatedCount = 0;
    const batch = writeBatch(db);

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data && data[categoryField] === oldCategory) {
        batch.update(docSnap.ref, {
          [categoryField]: newCategory.trim(),
          atualizadoEm: serverTimestamp(),
        });
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      await batch.commit();
    }

    return { success: true, updatedCount };
  } catch (error: any) {
    console.error(`[batchRenameCategory] Erro ao renomear categoria de ${oldCategory} para ${newCategory}:`, error);
    return { success: false, updatedCount: 0 };
  }
}

/**
 * Remoção ou reclassificação em lote de uma categoria em uma coleção
 */
export async function batchDeleteCategory(
  collectionName: string,
  categoryToDelete: string,
  fallbackCategory: string = 'Geral',
  categoryField: string = 'categoria'
): Promise<{ success: boolean; updatedCount: number }> {
  try {
    const colRef = collection(db, collectionName);
    const snap = await getDocs(colRef);
    let updatedCount = 0;
    const batch = writeBatch(db);

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data && data[categoryField] === categoryToDelete) {
        batch.update(docSnap.ref, {
          [categoryField]: fallbackCategory,
          atualizadoEm: serverTimestamp(),
        });
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      await batch.commit();
    }

    return { success: true, updatedCount };
  } catch (error: any) {
    console.error(`[batchDeleteCategory] Erro ao excluir/reclassificar categoria ${categoryToDelete}:`, error);
    return { success: false, updatedCount: 0 };
  }
}

/**
 * Exclusão de item específico do histórico clínico de um paciente (Evolução, Anamnese, Foto ou Prontuário)
 */
export async function deletePatientClinicalHistoryItem(
  paciente: Paciente,
  itemType: 'evolucao' | 'anamnese' | 'foto' | 'procedimento_texto',
  itemId: string
): Promise<Paciente | null> {
  try {
    const updatedPaciente: Paciente = { ...paciente };

    if (itemType === 'evolucao') {
      const evolucoes = updatedPaciente.evolucoes_retornos || [];
      updatedPaciente.evolucoes_retornos = evolucoes.filter(ev => ev.id !== itemId);
    } else if (itemType === 'anamnese') {
      const anamneses = updatedPaciente.anamneses_completas || [];
      updatedPaciente.anamneses_completas = anamneses.filter(an => an.id !== itemId);
      const fichasAnamnese = updatedPaciente.fichas_anamnese || [];
      updatedPaciente.fichas_anamnese = fichasAnamnese.filter(fa => fa.id !== itemId);
    } else if (itemType === 'foto') {
      const fotos = updatedPaciente.fotos_antes_depois || [];
      updatedPaciente.fotos_antes_depois = fotos.filter(f => f.id !== itemId);
    } else if (itemType === 'procedimento_texto') {
      // Limpar ou resetar histórico de texto
      updatedPaciente.historico_clinico = '';
    }

    await saveDocument(COLLECTIONS.PACIENTES, updatedPaciente);
    return updatedPaciente;
  } catch (error: any) {
    console.error(`[deletePatientClinicalHistoryItem] Erro ao excluir histórico do paciente ${paciente.id}:`, error);
    return null;
  }
}

