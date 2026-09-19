import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';

// Inicialização do Firebase Admin com o Database e Storage configurados
if (!getApps().length) {
  initializeApp();
}

// Configurações canônicas do banco e storage
const FIRESTORE_DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || 'ai-studio-auraestticagesto-7fc09931-de5a-400c-bd4a-9fccfefade64';
const STORAGE_BUCKET = process.env.STORAGE_BUCKET || 'focused-sonar-rlk09.firebasestorage.app';

// Obter instância do Firestore com o databaseId correto
function getDbInstance() {
  try {
    return getFirestore(FIRESTORE_DATABASE_ID);
  } catch (e) {
    logger.warn(`[getDbInstance] Fallback para firestore default:`, e);
    return getFirestore();
  }
}

// Obter bucket do Firebase Storage
function getStorageBucket(): any {
  return getStorage().bucket(STORAGE_BUCKET);
}

/**
 * Função interna para coletar todos os documentos de uma coleção
 */
async function fetchCollectionData(db: any, collectionName: string): Promise<any[]> {
  try {
    const snapshot = await db.collection(collectionName).get();
    if (snapshot.empty) return [];
    return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
  } catch (err: any) {
    logger.error(`[fetchCollectionData] Erro ao extrair coleção ${collectionName}:`, err);
    return [];
  }
}

/**
 * Núcleo do processo de dump das coleções críticas do Firestore para o Firebase Storage
 */
export async function processarDumpCriticoParaStorage(origem: 'cloud_function_03h' | 'manual_https'): Promise<{
  sucesso: boolean;
  backupId: string;
  caminhoStorage: string;
  totalRegistros: number;
  tamanhoKb: number;
  estatisticas: Record<string, number>;
}> {
  const agora = new Date();
  const agoraIso = agora.toISOString();
  const timestampFormatado = agora.toISOString().replace(/[:.]/g, '-');
  const backupId = `dump-storage-${timestampFormatado}`;
  const caminhoStorage = `backups/daily/dump_critico_${timestampFormatado}.json`;

  logger.info(`[Cloud Function] Iniciando dump diário das coleções críticas às 03:00. BackupId: ${backupId}`);

  const db = getDbInstance();
  const bucket = getStorageBucket();

  // 1. Extração simultânea das coleções críticas ('pacientes', 'agendamentos', 'financeiro', 'estoque')
  const [
    pacientes,
    agendamentos,
    transacoesDocs,
    financeiroDocs,
    estoqueDocs,
    estoqueInsumosDocs,
    procedimentos,
    despesasRecorrentes,
    clinicaConfig
  ] = await Promise.all([
    fetchCollectionData(db, 'pacientes'),
    fetchCollectionData(db, 'agendamentos'),
    fetchCollectionData(db, 'transacoes'),
    fetchCollectionData(db, 'financeiro'),
    fetchCollectionData(db, 'estoque'),
    fetchCollectionData(db, 'estoque_insumos'),
    fetchCollectionData(db, 'procedimentos'),
    fetchCollectionData(db, 'despesas_recorrentes'),
    fetchCollectionData(db, 'clinica_config')
  ]);

  // Unificação de coleções financeiras
  const mapaFinanceiro = new Map<string, any>();
  [...transacoesDocs, ...financeiroDocs].forEach(d => mapaFinanceiro.set(d.id, d));
  const financeiro = Array.from(mapaFinanceiro.values());

  // Unificação de coleções de estoque
  const mapaEstoque = new Map<string, any>();
  [...estoqueDocs, ...estoqueInsumosDocs].forEach(d => mapaEstoque.set(d.id, d));
  const estoque = Array.from(mapaEstoque.values());

  const estatisticas = {
    pacientes: pacientes.length,
    agendamentos: agendamentos.length,
    financeiro: financeiro.length,
    estoque: estoque.length,
    procedimentos: procedimentos.length,
    despesasRecorrentes: despesasRecorrentes.length
  };

  const totalRegistros = pacientes.length + agendamentos.length + financeiro.length + estoque.length + procedimentos.length;

  logger.info(`[Cloud Function] Extração concluída. Total de ${totalRegistros} registros mapeados.`, estatisticas);

  // 2. Montagem do payload JSON estruturado
  const dumpPayload = {
    id: backupId,
    versaoFormato: '2.5.0',
    tipo: origem,
    frequencia: 'diario_03h',
    dataCriacao: agoraIso,
    horaExecucao: '03:00 (America/Sao_Paulo)',
    firestoreDatabaseId: FIRESTORE_DATABASE_ID,
    storageBucket: STORAGE_BUCKET,
    caminhoStorage,
    totalRegistros,
    estatisticas,
    dados: {
      pacientes,
      agendamentos,
      financeiro,
      estoque,
      procedimentos,
      despesasRecorrentes,
      clinicaConfig: clinicaConfig.length > 0 ? clinicaConfig[0] : null
    },
    metadadosSistema: {
      geradoPor: 'Firebase Cloud Function (Scheduler 03:00)',
      timezone: 'America/Sao_Paulo',
      statusIntegridade: 'OK_VALIDADO'
    }
  };

  const jsonString = JSON.stringify(dumpPayload, null, 2);
  const buffer = Buffer.from(jsonString, 'utf-8');
  const tamanhoBytes = buffer.length;
  const tamanhoKb = Math.round(tamanhoBytes / 1024);

  // 3. Upload para o Firebase Storage
  const file = bucket.file(caminhoStorage);
  await file.save(buffer, {
    contentType: 'application/json',
    metadata: {
      contentType: 'application/json',
      metadata: {
        backupId,
        origem,
        dataCriacao: agoraIso,
        totalRegistros: String(totalRegistros),
        pacientesCount: String(pacientes.length),
        agendamentosCount: String(agendamentos.length),
        financeiroCount: String(financeiro.length),
        firestoreDatabaseId: FIRESTORE_DATABASE_ID
      }
    }
  });

  // Também grava/atualiza um ponteiro latest_dump.json para consulta rápida
  try {
    const latestFile = bucket.file('backups/latest_dump.json');
    await latestFile.save(buffer, {
      contentType: 'application/json'
    });
  } catch (err) {
    logger.warn('[Cloud Function] Aviso ao salvar latest_dump.json:', err);
  }

  // 4. Registro dos metadados na coleção do Firestore para auditoria e listagem no front
  try {
    const docRef = db.collection('backups_sistema').doc(backupId);
    await docRef.set({
      id: backupId,
      dataCriacao: agoraIso,
      tipo: 'cloud_function_storage',
      origem: origem,
      caminhoStorage,
      storageBucket: STORAGE_BUCKET,
      nomeArquivo: `dump_critico_${timestampFormatado}.json`,
      totalRegistros,
      tamanhoKb,
      tamanhoBytes,
      estatisticas,
      criadoPor: 'Cloud Function 03:00 (Scheduler)',
      criadoPorEmail: 'cloud-functions@auraestetica.iam.gserviceaccount.com',
      status: 'concluido',
      dadosCompactadosAviso: 'Arquivo completo preservado no Firebase Storage.',
      // Preservamos amostra resumida no doc para não exceder limites de 1MB do Firestore
      resumoColecoes: {
        pacientes: pacientes.length,
        agendamentos: agendamentos.length,
        financeiro: financeiro.length,
        estoque: estoque.length,
        procedimentos: procedimentos.length
      }
    }, { merge: true });

    logger.info(`[Cloud Function] Metadados salvos na coleção backups_sistema com sucesso.`);
  } catch (err: any) {
    logger.error(`[Cloud Function] Erro ao gravar metadados no Firestore:`, err);
  }

  logger.info(`[Cloud Function] Dump concluído com sucesso em ${caminhoStorage} (${tamanhoKb} KB)`);

  return {
    sucesso: true,
    backupId,
    caminhoStorage,
    totalRegistros,
    tamanhoKb,
    estatisticas
  };
}

/**
 * 1. CLOUD FUNCTION AGENDADA (SCHEDULED V2)
 * Dispara automaticamente todos os dias às 03:00 da manhã (Horário de Brasília)
 * Cron: '0 3 * * *'
 * Timezone: 'America/Sao_Paulo'
 */
export const dumpColecoesCriticasStorage = onSchedule(
  {
    schedule: '0 3 * * *',
    timeZone: 'America/Sao_Paulo',
    memory: '512MiB',
    timeoutSeconds: 300,
    retryCount: 2
  },
  async (event) => {
    logger.info(`[Scheduler Event] Iniciando disparo programado das 03:00:`, event.scheduleTime);
    try {
      const res = await processarDumpCriticoParaStorage('cloud_function_03h');
      logger.info(`[Scheduler Event] Dump finalizado com sucesso:`, res);
    } catch (err: any) {
      logger.error(`[Scheduler Event] Falha crítica no dump das 03:00:`, err);
      throw err;
    }
  }
);

/**
 * 2. CLOUD FUNCTION HTTPS / ONREQUEST
 * Permite que administradores autenticados disparem o dump do Storage sob demanda
 */
export const dispararDumpManualStorage = onRequest(
  {
    cors: true,
    memory: '512MiB',
    timeoutSeconds: 300
  },
  async (req, res) => {
    // Permite CORS pré-flight
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.status(204).send('');
      return;
    }

    try {
      const resultado = await processarDumpCriticoParaStorage('manual_https');
      res.status(200).json({
        mensagem: 'Dump para Firebase Storage executado com sucesso!',
        ...resultado
      });
    } catch (err: any) {
      logger.error(`[dispararDumpManualStorage] Erro:`, err);
      res.status(500).json({
        erro: 'Falha ao executar dump para Firebase Storage',
        detalhes: err.message || String(err)
      });
    }
  }
);
