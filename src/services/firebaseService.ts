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
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
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

// Helper to remove undefined properties recursively for Firestore compatibility
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data
      .filter(item => item !== undefined)
      .map(item => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

// Firestore generic save/update helper
export async function saveDocument<T extends { id: string }>(collectionName: string, item: T): Promise<void> {
  const docPath = `${collectionName}/${item.id}`;
  try {
    const docRef = doc(db, collectionName, item.id);
    const sanitized = sanitizeForFirestore(item);
    await setDoc(docRef, sanitized, { merge: true });
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
  fornecedores?: Fornecedor[];
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
    if (mockData.fornecedores) mockData.fornecedores.forEach(f => batch.set(doc(db, COLLECTIONS.FORNECEDORES, f.id), f));
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

// Real-time listener subscription helper with optional clinicaId filtering
export function subscribeToCollection<T>(
  collectionName: string, 
  onData: (data: T[]) => void,
  fallbackData: T[],
  clinicaId?: string
): () => void {
  try {
    const colRef = collection(db, collectionName);
    const q = clinicaId ? query(colRef, where('clinicaId', '==', clinicaId)) : colRef;
    const unsubscribe = onSnapshot(
      q, 
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
    
    const updateData: Record<string, any> = { 
      avatar_url: avatarUrl,
      avatarUrl: avatarUrl,
      ...(nome ? { nome, nomeCompleto: nome } : {})
    };

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

    const payload: Record<string, any> = {
      atualizadoEm: serverTimestamp(),
      ...(dados.nomeCompleto ? { nome: dados.nomeCompleto, nomeCompleto: dados.nomeCompleto } : {}),
      ...(dados.profissao !== undefined ? { profissao: dados.profissao, cargo: dados.profissao } : {}),
      ...(dados.avatarUrl ? { avatar_url: dados.avatarUrl, avatarUrl: dados.avatarUrl } : {}),
      ...(dados.telefone ? { telefone: dados.telefone } : {})
    };

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
    await setDoc(configDocRef, {
      ...configuracao,
      clinicaId: clinicaId || 'config_matriz',
      atualizadoEm: serverTimestamp()
    }, { merge: true });
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

    const updateData: Record<string, any> = {
      permissoesCustomizadas: permissoes,
      ...(role ? { role, cargo: role } : {}),
      atualizadoEm: serverTimestamp()
    };

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
export function isUserAdminTotal(user?: UsuarioEquipe | null): boolean {
  if (!user) return false;
  return (
    user.role === 'admin_master' || 
    user.role === 'admin_total' || 
    user.role === 'admin' || 
    user.email === 'fabio@teste.com' ||
    Boolean(user.cargo && (user.cargo.toLowerCase().includes('master') || user.cargo.toLowerCase().includes('super admin')))
  );
}

export function isUserAdminMaster(user?: UsuarioEquipe | null): boolean {
  return isUserAdminTotal(user);
}

export function isUserAdminLocalOrTotal(user?: UsuarioEquipe | null): boolean {
  if (!user) return false;
  return (
    isUserAdminTotal(user) || 
    user.role === 'admin_local' || 
    user.role === 'gestor' ||
    Boolean(user.cargo && user.cargo.toLowerCase().includes('admin local'))
  );
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
    if (acao === 'excluir') return false; // Only explicitly granted or admin_master can delete
    if (user.role === 'admin_local' || user.role === 'gestor') return true;
    if (acao === 'verEntradas' && (user.role === 'recepcao' || user.role === 'usuario')) return true;
    return Boolean(user.permissoes?.ver_financeiro_completo);
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

export async function migrarHierarquiaUsuarios(emailSuperAdmin: string = 'fabio@teste.com') {
  try {
    const perfisRef = collection(db, COLLECTIONS.PERFIS);
    const usuariosRef = collection(db, COLLECTIONS.USUARIOS);
    const snapshot = await getDocs(perfisRef);

    let totalMigrados = 0;
    let superAdminDefinido = false;

    const batch = writeBatch(db);

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const docRef = doc(db, COLLECTIONS.PERFIS, docSnap.id);
      const userDocRef = doc(db, COLLECTIONS.USUARIOS, docSnap.id);

      const emailMatch = data.email?.toLowerCase().trim() === emailSuperAdmin.toLowerCase().trim();
      const nameMatch = data.nomeCompleto?.toLowerCase().includes('fabio lima') || data.nome?.toLowerCase().includes('fabio lima');

      // 1. Identificar Fabio Lima como Super Admin ('admin_total')
      if (emailMatch || nameMatch) {
        const updateSuper = {
          cargo: 'Super Admin (Master)',
          role: 'admin_total' as UserRole,
          superAdmin: true,
          permissoesCompletas: true,
          atualizadoEm: serverTimestamp(),
        };
        batch.set(docRef, updateSuper, { merge: true });
        batch.set(userDocRef, updateSuper, { merge: true });
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
        batch.set(docRef, updateLocal, { merge: true });
        batch.set(userDocRef, updateLocal, { merge: true });
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
    handleFirestoreError(error, OperationType.WRITE, COLLECTIONS.PERFIS);
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

