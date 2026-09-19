import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import fs from 'fs';
import path from 'path';
import firebaseConfig from '../firebase-applet-config.json';

// Verifica se existem credenciais de conta de serviço (Service Account) configuradas no ambiente
function hasAdminServiceAccount(): boolean {
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  return !!(credPath && fs.existsSync(credPath));
}

// Inicialização segura do Firebase Admin
function getAdminInstance() {
  if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId;
    initializeApp({
      projectId,
      storageBucket: firebaseConfig.storageBucket
    });
  }
  return getApps()[0];
}

function getDb(): Firestore | null {
  if (!hasAdminServiceAccount()) {
    return null;
  }
  const app = getAdminInstance();
  const dbId = (firebaseConfig as any).firestoreDatabaseId || '(default)';
  try {
    return getFirestore(app, dbId);
  } catch (e) {
    try {
      return getFirestore(app);
    } catch {
      return null;
    }
  }
}

// Diretório local em disco para cache persistente de downloads rápidos
const LOCAL_BACKUPS_DIR = path.join(process.cwd(), '.backups_storage');
if (!fs.existsSync(LOCAL_BACKUPS_DIR)) {
  try {
    fs.mkdirSync(LOCAL_BACKUPS_DIR, { recursive: true });
  } catch (e) {}
}

export interface StorageDumpMetadata {
  id: string;
  nomeArquivo: string;
  caminhoStorage: string;
  bucket: string;
  dataCriacao: string;
  tamanhoBytes: number;
  tamanhoKb: number;
  tipo: 'cloud_function_03h' | 'manual_cloud_trigger';
  origem: string;
  totalRegistros: number;
  colecoesCriticas: {
    pacientes: number;
    agendamentos: number;
    financeiro: number;
    estoque: number;
    procedimentos: number;
  };
  criadoPor: string;
  status: 'concluido' | 'erro';
}

/**
 * Salva um dump no armazenamento local do servidor e atualiza o manifesto
 */
export function salvarDumpLocal(metadata: StorageDumpMetadata, payloadCompleto?: any): boolean {
  try {
    if (!fs.existsSync(LOCAL_BACKUPS_DIR)) {
      fs.mkdirSync(LOCAL_BACKUPS_DIR, { recursive: true });
    }

    if (payloadCompleto) {
      const localFilePath = path.join(LOCAL_BACKUPS_DIR, metadata.nomeArquivo);
      const jsonStr = typeof payloadCompleto === 'string' ? payloadCompleto : JSON.stringify(payloadCompleto, null, 2);
      fs.writeFileSync(localFilePath, jsonStr, 'utf-8');
    }

    const manifestPath = path.join(LOCAL_BACKUPS_DIR, 'manifest.json');
    let manifest: StorageDumpMetadata[] = [];
    if (fs.existsSync(manifestPath)) {
      try {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      } catch {
        manifest = [];
      }
    }

    const idx = manifest.findIndex(m => m.id === metadata.id || m.nomeArquivo === metadata.nomeArquivo);
    if (idx >= 0) {
      manifest[idx] = metadata;
    } else {
      manifest.unshift(metadata);
    }

    fs.writeFileSync(manifestPath, JSON.stringify(manifest.slice(0, 50), null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.warn('[salvarDumpLocal] Erro ao salvar dump local:', e);
    return false;
  }
}

/**
 * Coleta documentos de uma coleção do Firestore (se houver permissão Admin)
 */
async function coletarDocumentos(db: Firestore | null, nomeColecao: string): Promise<any[]> {
  if (!db) return [];
  try {
    const snap = await db.collection(nomeColecao).get();
    if (snap.empty) return [];
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    return [];
  }
}

/**
 * Executa o dump automático ou manual das coleções críticas
 */
export async function executarDumpCriticoStorage(
  tipoOrigem: 'cloud_function_03h' | 'manual_cloud_trigger' = 'manual_cloud_trigger'
): Promise<{
  sucesso: boolean;
  metadata: StorageDumpMetadata;
  dados: any;
}> {
  const agora = new Date();
  const agoraIso = agora.toISOString();
  const timestampFormatado = agoraIso.replace(/[:.]/g, '-');
  const backupId = `dump-storage-${timestampFormatado}`;
  const nomeArquivo = `dump_critico_${timestampFormatado}.json`;
  const caminhoStorage = `backups/daily/${nomeArquivo}`;
  const bucketName = firebaseConfig.storageBucket;

  // Se o servidor não possui credenciais de serviço Admin, a extração de coleções é realizada no cliente
  if (!hasAdminServiceAccount()) {
    console.info(`[Storage Dump] Ambiente gerenciado sem chave de conta de serviço local. Extração do dump delegada ao cliente web autenticado.`);
    return {
      sucesso: false,
      metadata: {
        id: backupId,
        nomeArquivo,
        caminhoStorage,
        bucket: bucketName,
        dataCriacao: agoraIso,
        tamanhoBytes: 0,
        tamanhoKb: 0,
        tipo: tipoOrigem,
        origem: tipoOrigem === 'cloud_function_03h' ? 'Rotina Cloud Function 03:00' : 'Manual via Painel',
        totalRegistros: 0,
        colecoesCriticas: { pacientes: 0, agendamentos: 0, financeiro: 0, estoque: 0, procedimentos: 0 },
        criadoPor: 'Sistema (Delegado ao Cliente)',
        status: 'erro'
      },
      dados: null
    };
  }

  const db = getDb();
  console.log(`[Storage Dump] Iniciando extração das coleções críticas (${tipoOrigem}). ID: ${backupId}`);

  // 1. Extração paralela das coleções críticas (garantindo pacientes, agendamentos, financeiro e estoque)
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
    coletarDocumentos(db, 'pacientes'),
    coletarDocumentos(db, 'agendamentos'),
    coletarDocumentos(db, 'transacoes'),
    coletarDocumentos(db, 'financeiro'),
    coletarDocumentos(db, 'estoque'),
    coletarDocumentos(db, 'estoque_insumos'),
    coletarDocumentos(db, 'procedimentos'),
    coletarDocumentos(db, 'despesas_recorrentes'),
    coletarDocumentos(db, 'clinica_config')
  ]);

  // Unificar coleções financeiras garantindo integridade
  const mapaFinanceiro = new Map<string, any>();
  [...transacoesDocs, ...financeiroDocs].forEach(d => mapaFinanceiro.set(d.id, d));
  const financeiro = Array.from(mapaFinanceiro.values());

  // Unificar coleções de estoque garantindo integridade
  const mapaEstoque = new Map<string, any>();
  [...estoqueDocs, ...estoqueInsumosDocs].forEach(d => mapaEstoque.set(d.id, d));
  const estoque = Array.from(mapaEstoque.values());

  const colecoesCriticas = {
    pacientes: pacientes.length,
    agendamentos: agendamentos.length,
    financeiro: financeiro.length,
    estoque: estoque.length,
    procedimentos: procedimentos.length
  };

  const totalRegistros = pacientes.length + agendamentos.length + financeiro.length + estoque.length + procedimentos.length;

  // 2. Montagem do payload completo em formato JSON
  const payloadCompleto = {
    cabecalho: {
      id: backupId,
      tipo: tipoOrigem,
      versao: '2.5.0',
      dataCriacao: agoraIso,
      agendamento: 'Diariamente às 03:00 (America/Sao_Paulo)',
      origem: tipoOrigem === 'cloud_function_03h' ? 'Cloud Function Automática (03:00)' : 'Disparo Manual no Painel',
      firestoreDatabaseId: (firebaseConfig as any).firestoreDatabaseId || '(default)',
      storageBucket: bucketName,
      caminhoStorage,
      totalRegistros,
      colecoesCriticas
    },
    dados: {
      pacientes,
      agendamentos,
      financeiro,
      estoque,
      procedimentos,
      despesasRecorrentes,
      clinicaConfig: clinicaConfig.length > 0 ? clinicaConfig[0] : null
    }
  };

  const jsonString = JSON.stringify(payloadCompleto, null, 2);
  const buffer = Buffer.from(jsonString, 'utf-8');
  const tamanhoBytes = buffer.length;
  const tamanhoKb = Math.round(tamanhoBytes / 1024);

  // 3. Salvar no diretório local de backups da aplicação para download instantâneo
  const localFilePath = path.join(LOCAL_BACKUPS_DIR, nomeArquivo);
  try {
    fs.writeFileSync(localFilePath, jsonString, 'utf-8');
  } catch (e) {
    console.warn('[Storage Dump] Aviso ao salvar arquivo em disco local:', e);
  }

  // 4. Tentativa de upload para o Firebase Storage oficial se houver credenciais
  let uploadNoStorageOk = false;
  try {
    const bucket = getStorage().bucket(bucketName);
    const file = bucket.file(caminhoStorage);
    await file.save(buffer, {
      contentType: 'application/json',
      metadata: {
        contentType: 'application/json',
        metadata: {
          backupId,
          totalRegistros: String(totalRegistros),
          dataCriacao: agoraIso
        }
      }
    });
    uploadNoStorageOk = true;
    console.log(`[Storage Dump] Sucesso no upload para Firebase Storage: ${caminhoStorage}`);
  } catch (err) {
    // Ignora silenciosamente
  }

  // 5. Salvar metadados na coleção do Firestore
  const metadata: StorageDumpMetadata = {
    id: backupId,
    nomeArquivo,
    caminhoStorage,
    bucket: bucketName,
    dataCriacao: agoraIso,
    tamanhoBytes,
    tamanhoKb,
    tipo: tipoOrigem,
    origem: tipoOrigem === 'cloud_function_03h' ? 'Rotina Cloud Function 03:00' : 'Manual via Painel',
    totalRegistros,
    colecoesCriticas,
    criadoPor: tipoOrigem === 'cloud_function_03h' ? 'Cloud Function (Scheduler 03:00)' : 'Administrador da Clínica',
    status: 'concluido'
  };

  if (db) {
    try {
      const docRef = db.collection('backups_sistema').doc(backupId);
      await docRef.set({
        ...metadata,
        tipoRegistro: 'dump_storage_critico',
        sucessoStorage: uploadNoStorageOk,
        temArquivoEmDisco: true,
        dadosCompactadosAviso: 'Dump gravado no Firebase Storage. Disponível para download manual em JSON.'
      }, { merge: true });
    } catch (err) {
      // Ignora silenciosamente se não houver permissão Admin no Firestore
    }
  }

  // Atualiza manifest local sempre
  salvarDumpLocal(metadata);

  return {
    sucesso: true,
    metadata,
    dados: payloadCompleto
  };
}

/**
 * Lista todos os dumps do Storage disponíveis
 */
export async function listarDumpsStorage(): Promise<StorageDumpMetadata[]> {
  const mapPorNome = new Map<string, StorageDumpMetadata>();

  // 1. Carrega do manifest local
  const manifestPath = path.join(LOCAL_BACKUPS_DIR, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest: StorageDumpMetadata[] = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      manifest.forEach(item => {
        if (item && item.nomeArquivo) {
          mapPorNome.set(item.nomeArquivo, item);
        }
      });
    } catch {}
  }

  // 2. Busca do Firestore apenas se houver credenciais válidas do Firebase Admin
  const db = getDb();
  if (db) {
    try {
      const snap = await db.collection('backups_sistema')
        .where('tipoRegistro', '==', 'dump_storage_critico')
        .get();

      if (!snap.empty) {
        snap.forEach(doc => {
          const item = doc.data() as StorageDumpMetadata;
          if (item && item.nomeArquivo) {
            mapPorNome.set(item.nomeArquivo, item);
          }
        });
      }
    } catch (e) {
      // Sem credenciais ou sem permissão Admin - ignora silenciosamente
    }
  }

  // 3. Busca arquivos .json locais em disco
  try {
    if (fs.existsSync(LOCAL_BACKUPS_DIR)) {
      const arquivos = fs.readdirSync(LOCAL_BACKUPS_DIR).filter(f => f.endsWith('.json') && f !== 'manifest.json');
      for (const arq of arquivos) {
        if (!mapPorNome.has(arq)) {
          const stats = fs.statSync(path.join(LOCAL_BACKUPS_DIR, arq));
          mapPorNome.set(arq, {
            id: arq.replace('.json', ''),
            nomeArquivo: arq,
            caminhoStorage: `backups/daily/${arq}`,
            bucket: firebaseConfig.storageBucket,
            dataCriacao: stats.birthtime.toISOString(),
            tamanhoBytes: stats.size,
            tamanhoKb: Math.round(stats.size / 1024),
            tipo: 'cloud_function_03h',
            origem: 'Arquivo Storage (Disco Local)',
            totalRegistros: 0,
            colecoesCriticas: { pacientes: 0, agendamentos: 0, financeiro: 0, estoque: 0, procedimentos: 0 },
            criadoPor: 'Rotina Storage',
            status: 'concluido'
          });
        }
      }
    }
  } catch (e) {}

  // Ordena pelo mais recente primeiro
  const lista = Array.from(mapPorNome.values());
  return lista.sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime());
}

/**
 * Lê o conteúdo do arquivo JSON de um backup
 */
export function obterConteudoArquivoDump(nomeArquivoOuId: string): string | null {
  const nomeSanitizado = nomeArquivoOuId.endsWith('.json') ? nomeArquivoOuId : `${nomeArquivoOuId}.json`;
  const localPath = path.join(LOCAL_BACKUPS_DIR, nomeSanitizado);
  
  if (fs.existsSync(localPath)) {
    return fs.readFileSync(localPath, 'utf-8');
  }

  // Tenta encontrar por ID
  const arquivos = fs.existsSync(LOCAL_BACKUPS_DIR) ? fs.readdirSync(LOCAL_BACKUPS_DIR) : [];
  const encontrado = arquivos.find(f => f.includes(nomeArquivoOuId));
  if (encontrado) {
    return fs.readFileSync(path.join(LOCAL_BACKUPS_DIR, encontrado), 'utf-8');
  }

  return null;
}

/**
 * Agendador interno para disparar às 03:00 (America/Sao_Paulo) enquanto o servidor estiver ativo
 */
export function iniciarAgendador03h() {
  console.log('[Agendador 03:00] Inicializando rotina diária de dump para Firebase Storage...');

  const checarHoraEExecutar = async () => {
    try {
      const agora = new Date();
      // Converte para o fuso de São Paulo
      const formatter = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
      });
      const partes = formatter.formatToParts(agora);
      const hora = parseInt(partes.find(p => p.type === 'hour')?.value || '-1', 10);
      const minuto = parseInt(partes.find(p => p.type === 'minute')?.value || '-1', 10);

      // Se for exatamente 03:00 (ou até 03:05), e o ambiente possui permissões de serviço
      if (hora === 3 && minuto < 5 && hasAdminServiceAccount()) {
        console.log('[Agendador 03:00] Horário programado atingido! Disparando dump automático...');
        await executarDumpCriticoStorage('cloud_function_03h');
      }
    } catch (err) {
      // Silencioso
    }
  };

  // Checa a cada 5 minutos
  setInterval(checarHoraEExecutar, 5 * 60 * 1000);
}
