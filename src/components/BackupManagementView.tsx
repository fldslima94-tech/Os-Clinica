import React, { useState, useEffect } from 'react';
import {
  Database,
  Save,
  Download,
  Upload,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  HardDrive,
  Trash2,
  Calendar,
  RotateCcw,
  Copy,
  Check,
  FileJson,
  Sliders,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
  X,
  Cloud,
  CloudDownload,
  Terminal,
  ExternalLink,
  FileCode,
  FolderArchive,
  Eye
} from 'lucide-react';
import {
  UsuarioEquipe,
  ConfiguracaoBackupAutomatico,
  SnapshotBackupSistema,
  ClinicaConfig,
  Paciente,
  Agendamento,
  Procedimento,
  ItemEstoque,
  LancamentoFinanceiro,
  Fornecedor,
  AtivoPatrimonial,
  AvisoMural,
  FirebaseStorageDump
} from '../types';
import {
  getConfiguracaoBackup,
  salvarConfiguracaoBackup,
  criarBackupCompleto,
  listarBackups,
  excluirBackup,
  restaurarBackup,
  baixarBackupComoArquivoJson,
  DEFAULT_BACKUP_CONFIG,
  dispararDumpCriticoStorage,
  listarDumpsFirebaseStorage,
  baixarDumpDoStorage,
  obterConteudoDumpStorage
} from '../services/firebaseService';
import { GoogleDriveBackupSection } from './GoogleDriveBackupSection';

interface BackupManagementViewProps {
  currentUser: UsuarioEquipe;
  clinicaConfig: ClinicaConfig;
  onRefreshData?: () => void;
  pacientesCount?: number;
  agendamentosCount?: number;
  financeiroCount?: number;
  estoqueCount?: number;
}

export const BackupManagementView: React.FC<BackupManagementViewProps> = ({
  currentUser,
  clinicaConfig,
  onRefreshData,
  pacientesCount = 0,
  agendamentosCount = 0,
  financeiroCount = 0,
  estoqueCount = 0,
}) => {
  const [activeTab, setActiveTab] = useState<'storage_dumps' | 'firestore_snapshots' | 'google_drive'>('storage_dumps');
  const [config, setConfig] = useState<ConfiguracaoBackupAutomatico>(DEFAULT_BACKUP_CONFIG);
  const [backupsList, setBackupsList] = useState<SnapshotBackupSistema[]>([]);
  const [storageDumps, setStorageDumps] = useState<FirebaseStorageDump[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isTriggeringStorageDump, setIsTriggeringStorageDump] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Modais
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isCloudFunctionModalOpen, setIsCloudFunctionModalOpen] = useState(false);
  const [previewDump, setPreviewDump] = useState<{ metadata: FirebaseStorageDump; dados: any } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [restoreModalSnapshot, setRestoreModalSnapshot] = useState<SnapshotBackupSistema | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreMode, setRestoreMode] = useState<'substituir' | 'mesclar'>('substituir');
  const [deleteConfirmBackupId, setDeleteConfirmBackupId] = useState<string | null>(null);

  // Upload externo de arquivo JSON
  const [importedSnapshot, setImportedSnapshot] = useState<SnapshotBackupSistema | null>(null);
  const [copiedGcloudCommand, setCopiedGcloudCommand] = useState(false);
  const [copiedFunctionCode, setCopiedFunctionCode] = useState(false);
  const [copiedDeployCommand, setCopiedDeployCommand] = useState(false);

  const showStatus = (type: 'success' | 'error' | 'info', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const carregarDados = async () => {
    setIsLoading(true);
    try {
      const [cfg, list, sDumps] = await Promise.all([
        getConfiguracaoBackup(),
        listarBackups(),
        listarDumpsFirebaseStorage()
      ]);
      setConfig(cfg);
      setBackupsList(list);
      setStorageDumps(sDumps);
    } catch (err: any) {
      console.error('[BackupManagementView] Erro ao carregar dados:', err);
      showStatus('error', 'Falha ao carregar lista de backups e configurações.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const handleToggleAutoBackup = async () => {
    const novoStatus = !config.ativo;
    const novaConfig = { ...config, ativo: novoStatus };
    setConfig(novaConfig);
    try {
      await salvarConfiguracaoBackup(novaConfig);
      showStatus('success', novoStatus ? 'Rotina de backup automático ativada com sucesso!' : 'Rotina de backup automático pausada.');
    } catch (err) {
      showStatus('error', 'Erro ao salvar alteração.');
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await salvarConfiguracaoBackup(config);
      setIsConfigModalOpen(false);
      showStatus('success', 'Configurações de backup automático salvas com sucesso!');
    } catch (err) {
      showStatus('error', 'Erro ao salvar configurações.');
    }
  };

  const handleCreateInstantBackup = async (downloadDirect = false) => {
    setIsCreatingBackup(true);
    try {
      const snap = await criarBackupCompleto('manual', currentUser, downloadDirect);
      setBackupsList(prev => [snap, ...prev.filter(b => b.id !== snap.id)]);
      showStatus('success', `Backup manual concluído! ${snap.totalRegistros} registros preservados (${snap.tamanhoKb} KB).`);
    } catch (err: any) {
      console.error('[BackupManagementView] Erro ao gerar backup:', err);
      showStatus('error', 'Erro ao gerar backup: ' + (err.message || 'Falha desconhecida'));
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleDeleteBackup = async (id: string) => {
    try {
      await excluirBackup(id);
      setBackupsList(prev => prev.filter(b => b.id !== id));
      setDeleteConfirmBackupId(null);
      showStatus('success', 'Snapshot de backup excluído com sucesso.');
    } catch (err) {
      showStatus('error', 'Erro ao excluir backup.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed.dados && !parsed.totalRegistros) {
          throw new Error('O arquivo não possui uma estrutura válida de backup do sistema.');
        }
        setImportedSnapshot(parsed);
        setRestoreModalSnapshot(parsed);
        showStatus('info', `Arquivo "${file.name}" carregado. Revise os dados e confirme a restauração.`);
      } catch (err: any) {
        showStatus('error', 'Arquivo inválido: ' + (err.message || 'Erro de formatação JSON.'));
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reseta o input
  };

  const handleConfirmRestore = async () => {
    if (!restoreModalSnapshot) return;
    setIsRestoring(true);
    try {
      const res = await restaurarBackup(restoreModalSnapshot, restoreMode);
      setRestoreModalSnapshot(null);
      setImportedSnapshot(null);
      showStatus('success', res.message);
      if (onRefreshData) {
        onRefreshData();
      }
    } catch (err: any) {
      console.error('[BackupManagementView] Falha na restauração:', err);
      showStatus('error', 'Erro na restauração: ' + (err.message || 'Erro interno'));
    } finally {
      setIsRestoring(false);
    }
  };

  const gcloudCommand = `gcloud firestore backups schedules create \\
  --database="ai-studio-auraestticagesto-7fc09931-de5a-400c-bd4a-9fccfefade64" \\
  --recurrence=daily \\
  --retention=14d`;

  const functionDeployCommand = `firebase deploy --only functions:dumpColecoesCriticasStorage`;

  const functionCodeSnippet = `// functions/src/index.ts
import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Cloud Function agendada diariamente às 03:00 (Horário de Brasília)
 * Cron: '0 3 * * *' | TimeZone: 'America/Sao_Paulo'
 * Salva o dump de 'pacientes', 'agendamentos', 'financeiro' e 'estoque' no Firebase Storage
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
    const db = admin.firestore('ai-studio-auraestticagesto-7fc09931-de5a-400c-bd4a-9fccfefade64');
    const bucket = admin.storage().bucket('focused-sonar-rlk09.firebasestorage.app');

    // 1. Extração simultânea das coleções críticas
    const [pacientesSnap, agendamentosSnap, financeiroSnap, estoqueSnap] = await Promise.all([
      db.collection('pacientes').get(),
      db.collection('agendamentos').get(),
      db.collection('transacoes').get(),
      db.collection('estoque').get()
    ]);

    const timestamp = new Date().toISOString();
    const nomeArquivo = \`backups/daily/dump_critico_\${timestamp.replace(/[:.]/g, '-')}.json\`;

    const payload = {
      id: \`dump-\${Date.now()}\`,
      dataCriacao: timestamp,
      agendamento: 'Diariamente às 03:00 (America/Sao_Paulo)',
      totalRegistros: pacientesSnap.size + agendamentosSnap.size + financeiroSnap.size + estoqueSnap.size,
      dados: {
        pacientes: pacientesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        agendamentos: agendamentosSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        financeiro: financeiroSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        estoque: estoqueSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      }
    };

    // 2. Upload para o Firebase Storage
    await bucket.file(nomeArquivo).save(Buffer.from(JSON.stringify(payload, null, 2)), {
      contentType: 'application/json'
    });
  }
);`;

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(gcloudCommand);
    setCopiedGcloudCommand(true);
    setTimeout(() => setCopiedGcloudCommand(false), 3000);
  };

  const handleCopyFunctionCode = () => {
    navigator.clipboard.writeText(functionCodeSnippet);
    setCopiedFunctionCode(true);
    setTimeout(() => setCopiedFunctionCode(false), 3000);
  };

  const handleCopyDeployCommand = () => {
    navigator.clipboard.writeText(functionDeployCommand);
    setCopiedDeployCommand(true);
    setTimeout(() => setCopiedDeployCommand(false), 3000);
  };

  const handleTriggerCloudDump = async () => {
    setIsTriggeringStorageDump(true);
    try {
      const res = await dispararDumpCriticoStorage('manual_cloud_trigger', currentUser);
      if (res.sucesso && res.metadata) {
        setStorageDumps(prev => [res.metadata, ...prev.filter(d => d.id !== res.metadata.id)]);
        showStatus('success', `Dump das coleções críticas gerado com sucesso no Firebase Storage! Arquivo: ${res.metadata.nomeArquivo}`);
      }
    } catch (err: any) {
      console.error('[handleTriggerCloudDump] Erro:', err);
      showStatus('error', 'Falha ao processar dump para o Firebase Storage: ' + (err.message || 'Erro de conexão'));
    } finally {
      setIsTriggeringStorageDump(false);
    }
  };

  const handleDownloadStorageDump = async (dump: FirebaseStorageDump) => {
    setDownloadingFileId(dump.id);
    try {
      await baixarDumpDoStorage(dump);
      showStatus('success', `Download manual de "${dump.nomeArquivo}" concluído com sucesso!`);
    } catch (err: any) {
      console.error('[handleDownloadStorageDump] Erro:', err);
      showStatus('error', 'Erro ao baixar arquivo do storage: ' + (err.message || 'Falha de download'));
    } finally {
      setDownloadingFileId(null);
    }
  };

  const handlePreviewStorageDump = async (dump: FirebaseStorageDump) => {
    setIsLoadingPreview(true);
    try {
      const dados = await obterConteudoDumpStorage(dump);
      setPreviewDump({ metadata: dump, dados });
    } catch (err: any) {
      showStatus('error', 'Não foi possível carregar o conteúdo do dump.');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleRestoreFromStorageDump = async (dump: FirebaseStorageDump) => {
    try {
      const conteudo = await obterConteudoDumpStorage(dump);
      if (!conteudo) {
        showStatus('error', 'Conteúdo do dump não localizado.');
        return;
      }
      const dadosExtraidos = conteudo.dados || conteudo;
      const snapshotEstruturado: SnapshotBackupSistema = {
        id: dump.id,
        dataCriacao: dump.dataCriacao,
        tipo: 'automatico',
        criadoPor: dump.criadoPor || 'Cloud Function 03:00',
        versaoApp: '2.5.0',
        totalRegistros: dump.totalRegistros || 0,
        estatisticas: {
          pacientes: dump.colecoesCriticas?.pacientes || (dadosExtraidos.pacientes?.length || 0),
          agendamentos: dump.colecoesCriticas?.agendamentos || (dadosExtraidos.agendamentos?.length || 0),
          financeiro: dump.colecoesCriticas?.financeiro || (dadosExtraidos.financeiro?.length || 0),
          estoque: dump.colecoesCriticas?.estoque || (dadosExtraidos.estoque?.length || 0),
          procedimentos: dump.colecoesCriticas?.procedimentos || (dadosExtraidos.procedimentos?.length || 0),
          despesasRecorrentes: dadosExtraidos.despesasRecorrentes?.length || 0,
          fornecedores: 0,
          bens: 0,
          avisos: 0,
          usuarios: 0,
          modelosAnamnese: 0,
          alertasRetorno: 0,
        },
        dados: dadosExtraidos,
        tamanhoKb: dump.tamanhoKb
      };
      setRestoreModalSnapshot(snapshotEstruturado);
    } catch (err: any) {
      showStatus('error', 'Erro ao preparar dados de restauração.');
    }
  };

  const formatarData = (isoStr?: string) => {
    if (!isoStr) return 'Nunca executado';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {statusMessage && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl text-sm font-medium border shadow-xs animate-in fade-in slide-in-from-top-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-indigo-50 text-indigo-800 border-indigo-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {statusMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
            {statusMessage.type === 'info' && <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* CABEÇALHO PRINCIPAL DO SISTEMA DE BACKUPS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                <HardDrive className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Backups Automáticos & Recuperação de Dados
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                Firestore Cloud + Local
              </span>
            </div>
            <p className="text-sm text-slate-500 max-w-2xl">
              Proteção contínua contra perda de dados. Configure a rotina de snapshots periódicos na nuvem, exporte cópias completas em JSON e recupere informações com auditoria de integridade.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsConfigModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition border border-slate-200"
            >
              <Sliders className="w-4 h-4" />
              <span>Configurar Rotina</span>
            </button>

            <button
              onClick={() => handleCreateInstantBackup(false)}
              disabled={isCreatingBackup}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs transition disabled:opacity-50"
            >
              <Save className={`w-4 h-4 ${isCreatingBackup ? 'animate-spin' : ''}`} />
              <span>{isCreatingBackup ? 'Gerando Snapshot...' : 'Fazer Backup Completo Agora'}</span>
            </button>

            <button
              onClick={() => handleCreateInstantBackup(true)}
              disabled={isCreatingBackup}
              title="Cria o backup e inicia o download do arquivo JSON no computador"
              className="inline-flex items-center gap-2 px-3 py-2.5 bg-slate-900 hover:bg-black text-white font-semibold text-xs rounded-xl transition disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Exportar JSON</span>
            </button>
          </div>
        </div>

        {/* STATUS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Rotina Automática</span>
              <button
                onClick={handleToggleAutoBackup}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  config.ativo ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out mt-0.5 ml-0.5 ${
                    config.ativo ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-base font-bold ${config.ativo ? 'text-emerald-700' : 'text-slate-500'}`}>
                {config.ativo ? 'Ativa & Monitorando' : 'Pausada'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Frequência: {config.frequencia === 'diario' ? 'Diária (a cada 24h)' : config.frequencia === 'a_cada_12h' ? 'A cada 12 horas' : 'Semanal'}
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
            <div className="text-slate-500 text-xs font-medium flex items-center justify-between">
              <span>Último Backup</span>
              <Clock className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="mt-2 text-base font-bold text-slate-900">
              {formatarData(config.ultimoBackupEm)}
            </div>
            <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              {config.ultimoBackupStatus === 'sucesso' ? 'Status OK (Sem perdas)' : 'Aguardando primeira execução'}
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
            <div className="text-slate-500 text-xs font-medium flex items-center justify-between">
              <span>Snapshots Salvos</span>
              <Database className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-bold text-slate-900">{backupsList.length}</span>
              <span className="text-xs text-slate-500">/ retenção de {config.retencaoDias || 15}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Auto-limpeza dos mais antigos habilitada
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
            <div className="text-slate-500 text-xs font-medium flex items-center justify-between">
              <span>Registros Atuais na Base</span>
              <Layers className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="mt-2 text-base font-bold text-slate-900">
              {pacientesCount + agendamentosCount + financeiroCount + estoqueCount} itens
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {pacientesCount} pacientes, {agendamentosCount} agend., {estoqueCount} insumos
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* NAVEGAÇÃO ENTRE DUMPS NO STORAGE E SNAPSHOTS NO FIRESTORE */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('storage_dumps')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition border ${
              activeTab === 'storage_dumps'
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>Firebase Storage Dumps (Cloud Function 03:00)</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === 'storage_dumps' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {storageDumps.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('firestore_snapshots')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition border ${
              activeTab === 'firestore_snapshots'
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Snapshots do Firestore & Local</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === 'firestore_snapshots' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {backupsList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('google_drive')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition border ${
              activeTab === 'google_drive'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
              <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
              <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
              <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
              <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
              <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
              <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
            </svg>
            <span>Google Drive</span>
          </button>
        </div>

        <div className="flex items-center gap-3 px-3 py-1 text-xs text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Cloud Scheduler: <strong className="text-slate-800 font-semibold">03:00 Diário (BRT)</strong>
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: DUMPS NO FIREBASE STORAGE (CLOUD FUNCTION 03:00) */}
      {/* ========================================================================= */}
      {activeTab === 'storage_dumps' && (
        <div className="space-y-4">
          {/* BANNER INFORMATIVO DA CLOUD FUNCTION */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 border border-slate-800 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Rotina Automática de Dumps no Firebase Storage
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Ativo às 03:00
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Todos os dias às <strong className="text-white">03:00 da manhã</strong>, a Cloud Function do Firebase extrai automaticamente os dados integrais das coleções mais sensíveis da clínica, compactando-os em formato <strong className="text-rose-300">JSON</strong> e armazenando-os de forma imutável no <strong className="text-indigo-300">Firebase Storage</strong>.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-300">
                  <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                    <span>Bucket: focused-sonar-rlk09.firebasestorage.app</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Coleções Críticas: <strong>Pacientes</strong> ({pacientesCount}), <strong>Agendamentos</strong> ({agendamentosCount}), <strong>Financeiro</strong> ({financeiroCount}), <strong>Estoque</strong> ({estoqueCount})</span>
                  </div>
                </div>
              </div>

              {/* AÇÕES DA CLOUD FUNCTION */}
              <div className="flex flex-wrap items-center gap-2.5 lg:flex-col lg:items-stretch min-w-[240px]">
                <button
                  onClick={handleTriggerCloudDump}
                  disabled={isTriggeringStorageDump}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl shadow-xs transition disabled:opacity-50"
                  title="Executa imediatamente a rotina que salva o dump no Firebase Storage"
                >
                  <RefreshCw className={`w-4 h-4 ${isTriggeringStorageDump ? 'animate-spin' : ''}`} />
                  <span>{isTriggeringStorageDump ? 'Executando Dump...' : 'Disparar Dump Cloud Agora'}</span>
                </button>

                <button
                  onClick={() => setIsCloudFunctionModalOpen(true)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs rounded-xl transition border border-slate-700"
                >
                  <FileCode className="w-4 h-4 text-indigo-400" />
                  <span>Código & Deploy da Função</span>
                </button>

                <button
                  onClick={carregarDados}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-slate-400 hover:text-slate-200 text-[11px] transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Atualizar Arquivos</span>
                </button>
              </div>
            </div>
          </div>

          {/* LISTA DE DUMPS SALVOS NO FIREBASE STORAGE */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <CloudDownload className="w-4 h-4 text-rose-500" />
                  Arquivos de Dump JSON Disponíveis para Download Manual
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Clique no botão "Download JSON" para salvar o arquivo de backup diretamente no seu computador em formato JSON padronizado.
                </p>
              </div>
            </div>

            {storageDumps.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mx-auto mb-3 border border-rose-100">
                  <Cloud className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">Nenhum dump do Storage catalogado ainda</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5 leading-relaxed">
                  A rotina automática executa diariamente às 03:00. Para gerar seu primeiro arquivo de dump para download imediato, clique no botão abaixo.
                </p>
                <button
                  onClick={handleTriggerCloudDump}
                  disabled={isTriggeringStorageDump}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs transition"
                >
                  <Save className="w-4 h-4" />
                  <span>Disparar Primeiro Dump para o Storage Agora</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Arquivo JSON</th>
                      <th className="py-3 px-4">Horário / Rotina</th>
                      <th className="py-3 px-4">Coleções Críticas</th>
                      <th className="py-3 px-4">Tamanho</th>
                      <th className="py-3 px-4 text-right">Download & Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {storageDumps.map((dump) => (
                      <tr key={dump.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4 font-mono text-slate-900 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg shrink-0">
                              <FileJson className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 text-xs">{dump.nomeArquivo}</div>
                              <div className="text-[10px] text-slate-400 font-sans">
                                Firebase Storage: {dump.caminhoStorage || 'backups/daily/'}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-mono text-slate-800 font-medium">
                            {formatarData(dump.dataCriacao)}
                          </div>
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold mt-0.5">
                            <Clock className="w-3 h-3" />
                            {dump.agendamento || 'Rotina Diária 03:00'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px]">
                              {dump.colecoesCriticas?.pacientes || 0} pacientes
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[10px]">
                              {dump.colecoesCriticas?.agendamentos || 0} agendamentos
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                              {dump.colecoesCriticas?.financeiro || 0} transações
                            </span>
                            {dump.colecoesCriticas?.estoque !== undefined && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px]">
                                {dump.colecoesCriticas.estoque} estoque
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                          <span className="font-semibold text-slate-900">{dump.tamanhoKb} KB</span>
                          <span className="text-[10px] text-slate-400 block">
                            {dump.totalRegistros} itens
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {/* BOTÃO DE DOWNLOAD MANUAL DESTE ARQUIVO JSON */}
                            <button
                              onClick={() => handleDownloadStorageDump(dump)}
                              disabled={downloadingFileId === dump.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-2xs transition disabled:opacity-50 cursor-pointer"
                              title="Baixar arquivo JSON diretamente para o seu computador"
                            >
                              <Download className={`w-3.5 h-3.5 ${downloadingFileId === dump.id ? 'animate-bounce' : ''}`} />
                              <span>{downloadingFileId === dump.id ? 'Baixando...' : 'Download JSON'}</span>
                            </button>

                            {/* BOTÃO DE PRÉVIA / INSPEÇÃO */}
                            <button
                              onClick={() => handlePreviewStorageDump(dump)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                              title="Inspecionar conteúdo e dados do dump"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* BOTÃO DE RESTAURAÇÃO */}
                            <button
                              onClick={() => handleRestoreFromStorageDump(dump)}
                              className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition"
                              title="Restaurar banco de dados a partir deste dump do Storage"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: SNAPSHOTS DO FIRESTORE & LOCAL */}
      {/* ========================================================================= */}
      {activeTab === 'firestore_snapshots' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-rose-500" />
                Histórico de Snapshots Disponíveis para Restauração
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Snapshots armazenados com integridade na coleção protegida do Firestore e em cache de segurança.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Input para upload de arquivo JSON externo */}
              <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-2xs transition">
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Importar Arquivo JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                onClick={carregarDados}
                disabled={isLoading}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
                title="Atualizar lista"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* LISTA TABELADA DE BACKUPS */}
          {backupsList.length === 0 ? (
            <div className="p-12 text-center">
              <HardDrive className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-800">Nenhum backup arquivado ainda</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                Clique em "Fazer Backup Completo Agora" para criar seu primeiro snapshot de segurança com todas as coleções clínicas e financeiras.
              </p>
              <button
                onClick={() => handleCreateInstantBackup(false)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs transition"
              >
                <Save className="w-4 h-4" />
                <span>Criar Primeiro Backup Agora</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Data & Horário</th>
                    <th className="py-3 px-4">Origem / Tipo</th>
                    <th className="py-3 px-4">Responsável</th>
                    <th className="py-3 px-4">Registros Mapeados</th>
                    <th className="py-3 px-4">Tamanho</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {backupsList.map((backup) => (
                    <tr key={backup.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-800 whitespace-nowrap">
                        {formatarData(backup.dataCriacao)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md font-semibold text-[11px] ${
                            backup.tipo === 'automatico'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {backup.tipo === 'automatico' ? (
                            <>
                              <RefreshCw className="w-3 h-3 text-blue-500" />
                              Automático
                            </>
                          ) : (
                            <>
                              <Save className="w-3 h-3 text-emerald-500" />
                              Manual
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium whitespace-nowrap">
                        {backup.criadoPor}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900">{backup.totalRegistros} total</span>
                          {backup.estatisticas && (
                            <span className="text-[10px] text-slate-400">
                              ({backup.estatisticas.pacientes || 0} pac, {backup.estatisticas.agendamentos || 0} agend, {backup.estatisticas.financeiro || 0} fin)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {backup.tamanhoKb ? `${backup.tamanhoKb} KB` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => baixarBackupComoArquivoJson(backup)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-[11px] transition"
                            title="Baixar arquivo JSON"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-600" />
                            <span className="hidden sm:inline">Baixar</span>
                          </button>

                          <button
                            onClick={() => setRestoreModalSnapshot(backup)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-semibold text-[11px] transition"
                            title="Restaurar este backup"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-indigo-600" />
                            <span className="hidden sm:inline">Restaurar</span>
                          </button>

                          <button
                            onClick={() => setDeleteConfirmBackupId(backup.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Excluir snapshot"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: GOOGLE DRIVE BACKUPS */}
      {/* ========================================================================= */}
      {activeTab === 'google_drive' && (
        <GoogleDriveBackupSection
          currentUser={currentUser}
          backupsList={backupsList}
          onBackupSaved={carregarDados}
        />
      )}

      {/* CARD TÉCNICO: BACKUPS GERENCIADOS NO GOOGLE CLOUD (PITR & GCP CLI) */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-rose-400" />
              <h3 className="text-base font-bold tracking-tight text-white">
                Backups Nativos do Google Cloud / Firestore (Point-in-Time Recovery)
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Além dos snapshots automatizados gerenciados pelo Aura Estética, o banco de dados provisionado no Google Cloud Firestore (<code className="text-rose-300 font-mono">ai-studio-auraestticagesto-7fc09931-de5a-400c-bd4a-9fccfefade64</code>) suporta recuperação ponto-a-ponto (PITR) e agendamento contínuo no nível de infraestrutura do GCP.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Recuperação por minuto exato
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-400" /> Retenção automática de 14 dias
              </span>
            </div>
          </div>

          <div className="w-full lg:w-auto min-w-[340px]">
            <div className="bg-slate-800/80 rounded-xl p-3.5 border border-slate-700">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                <span className="font-mono text-slate-300">Comando Google Cloud CLI:</span>
                <button
                  onClick={handleCopyCommand}
                  className="flex items-center gap-1 text-rose-400 hover:text-rose-300 transition"
                >
                  {copiedGcloudCommand ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="font-mono text-[11px] text-slate-200 bg-black/40 p-2.5 rounded-lg overflow-x-auto whitespace-pre leading-relaxed border border-slate-700/50">
                {gcloudCommand}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: CONFIGURAR ROTINA AUTOMÁTICA */}
      {/* ========================================================================= */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold text-slate-900">Configurar Rotina de Backup Automático</h3>
              </div>
              <button
                onClick={() => setIsConfigModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4 py-4">
              {/* Ativar/Desativar */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Habilitar Rotina Automática</div>
                  <div className="text-xs text-slate-500">Executa automaticamente em segundo plano ao usar o sistema.</div>
                </div>
                <input
                  type="checkbox"
                  checked={config.ativo}
                  onChange={(e) => setConfig({ ...config, ativo: e.target.checked })}
                  className="w-5 h-5 text-rose-600 rounded-sm focus:ring-rose-500"
                />
              </div>

              {/* Frequência */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Frequência de Execução
                </label>
                <select
                  value={config.frequencia}
                  onChange={(e) => setConfig({ ...config, frequencia: e.target.value as any })}
                  className="w-full text-sm bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-hidden focus:border-rose-500"
                >
                  <option value="diario">Diária (Recomendado - 1x a cada 24 horas)</option>
                  <option value="a_cada_12h">A cada 12 Horas (Clínicas com alto volume diário)</option>
                  <option value="semanal">Semanal (1x a cada 7 dias)</option>
                </select>
              </div>

              {/* Retenção */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Política de Retenção (Manter últimos N snapshots)
                </label>
                <select
                  value={config.retencaoDias}
                  onChange={(e) => setConfig({ ...config, retencaoDias: Number(e.target.value) })}
                  className="w-full text-sm bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-hidden focus:border-rose-500"
                >
                  <option value={7}>Manter últimos 7 backups (1 semana)</option>
                  <option value={15}>Manter últimos 15 backups (~2 semanas - Padrão Seguro)</option>
                  <option value={30}>Manter últimos 30 backups (1 mês)</option>
                  <option value={60}>Manter últimos 60 backups (2 meses)</option>
                </select>
                <p className="text-[11px] text-slate-400">
                  Os backups excedentes serão limpos automaticamente para otimizar o uso do banco de dados.
                </p>
              </div>

              {/* Opções adicionais */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={config.salvarNoFirestore}
                    onChange={(e) => setConfig({ ...config, salvarNoFirestore: e.target.checked })}
                    className="w-4 h-4 text-rose-600 rounded-sm"
                  />
                  <span>Salvar snapshot na coleção segura do Firestore (<code className="font-mono text-slate-500">backups_sistema</code>)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={config.baixarArquivoJson}
                    onChange={(e) => setConfig({ ...config, baixarArquivoJson: e.target.checked })}
                    className="w-4 h-4 text-rose-600 rounded-sm"
                  />
                  <span>Disparar download do arquivo JSON automaticamente ao concluir o backup</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs transition"
                >
                  Salvar Configurações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RESTAURAR DADOS DE BACKUP COM VISUALIZAÇÃO PRÉVIA */}
      {/* ========================================================================= */}
      {restoreModalSnapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Restaurar Banco de Dados</h3>
              </div>
              <button
                onClick={() => setRestoreModalSnapshot(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-800 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Aviso de Segurança:</span> Antes de iniciar a restauração, o sistema gerará automaticamente um novo backup de segurança dos dados atuais.
              </div>
            </div>

            {/* Detalhes do Snapshot */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
                Resumo do Snapshot Selecionado:
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div><strong>Data do Backup:</strong> {formatarData(restoreModalSnapshot.dataCriacao)}</div>
                <div><strong>Criado Por:</strong> {restoreModalSnapshot.criadoPor}</div>
                <div><strong>Total Registros:</strong> {restoreModalSnapshot.totalRegistros}</div>
                <div><strong>Tamanho Estimado:</strong> {restoreModalSnapshot.tamanhoKb ? `${restoreModalSnapshot.tamanhoKb} KB` : '—'}</div>
              </div>

              {restoreModalSnapshot.estatisticas && (
                <div className="pt-2 border-t border-slate-200/80 flex flex-wrap gap-1.5 mt-2">
                  <span className="px-2 py-0.5 bg-white rounded-md border border-slate-200 font-mono text-[10px]">
                    Pacientes: {restoreModalSnapshot.estatisticas.pacientes || 0}
                  </span>
                  <span className="px-2 py-0.5 bg-white rounded-md border border-slate-200 font-mono text-[10px]">
                    Agendamentos: {restoreModalSnapshot.estatisticas.agendamentos || 0}
                  </span>
                  <span className="px-2 py-0.5 bg-white rounded-md border border-slate-200 font-mono text-[10px]">
                    Financeiro: {restoreModalSnapshot.estatisticas.financeiro || 0}
                  </span>
                  <span className="px-2 py-0.5 bg-white rounded-md border border-slate-200 font-mono text-[10px]">
                    Estoque: {restoreModalSnapshot.estatisticas.estoque || 0}
                  </span>
                  <span className="px-2 py-0.5 bg-white rounded-md border border-slate-200 font-mono text-[10px]">
                    Procedimentos: {restoreModalSnapshot.estatisticas.procedimentos || 0}
                  </span>
                </div>
              )}
            </div>

            {/* Modo de Restauração */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Modo de Restauração
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`flex flex-col p-3 rounded-xl border cursor-pointer transition ${
                    restoreMode === 'substituir'
                      ? 'bg-indigo-50/60 border-indigo-300 ring-2 ring-indigo-500/20'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="restoreMode"
                      checked={restoreMode === 'substituir'}
                      onChange={() => setRestoreMode('substituir')}
                      className="text-indigo-600"
                    />
                    <span className="text-xs font-bold text-slate-900">Substituição Total</span>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 pl-5">
                    Substitui o estado do banco exatamente pelos dados presentes neste snapshot.
                  </span>
                </label>

                <label
                  className={`flex flex-col p-3 rounded-xl border cursor-pointer transition ${
                    restoreMode === 'mesclar'
                      ? 'bg-indigo-50/60 border-indigo-300 ring-2 ring-indigo-500/20'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="restoreMode"
                      checked={restoreMode === 'mesclar'}
                      onChange={() => setRestoreMode('mesclar')}
                      className="text-indigo-600"
                    />
                    <span className="text-xs font-bold text-slate-900">Mesclagem Incremental</span>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 pl-5">
                    Atualiza itens coincidentes e insere registros faltantes sem apagar novos dados.
                  </span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRestoreModalSnapshot(null)}
                disabled={isRestoring}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={isRestoring}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition disabled:opacity-50"
              >
                <RotateCcw className={`w-4 h-4 ${isRestoring ? 'animate-spin' : ''}`} />
                <span>{isRestoring ? 'Restaurando Banco...' : 'Confirmar Restauração'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIRMAÇÃO DE EXCLUSÃO DE BACKUP */}
      {/* ========================================================================= */}
      {deleteConfirmBackupId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 bg-rose-100 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Excluir Snapshot de Backup?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tem certeza de que deseja excluir este snapshot arquivado? Esta ação removerá a cópia do Firestore e não poderá ser desfeita.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setDeleteConfirmBackupId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteBackup(deleteConfirmBackupId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs transition"
              >
                Sim, Excluir Snapshot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PRÉVIA E INSPEÇÃO DO CONTEÚDO DO DUMP JSON */}
      {/* ========================================================================= */}
      {previewDump && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 animate-in fade-in zoom-in-95 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <FileJson className="w-5 h-5 text-rose-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">Inspeção do Dump JSON</h3>
                  <p className="text-xs text-slate-400 font-mono">{previewDump.metadata.nomeArquivo}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewDump(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Badges de Coleções */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-center">
                <span className="text-[10px] uppercase font-bold text-rose-500 block">Pacientes</span>
                <span className="text-lg font-bold text-rose-800">
                  {previewDump.metadata.colecoesCriticas?.pacientes || previewDump.dados?.dados?.pacientes?.length || 0}
                </span>
              </div>
              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-center">
                <span className="text-[10px] uppercase font-bold text-indigo-500 block">Agendamentos</span>
                <span className="text-lg font-bold text-indigo-800">
                  {previewDump.metadata.colecoesCriticas?.agendamentos || previewDump.dados?.dados?.agendamentos?.length || 0}
                </span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-500 block">Financeiro</span>
                <span className="text-lg font-bold text-emerald-800">
                  {previewDump.metadata.colecoesCriticas?.financeiro || previewDump.dados?.dados?.financeiro?.length || 0}
                </span>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-center">
                <span className="text-[10px] uppercase font-bold text-amber-500 block">Estoque</span>
                <span className="text-lg font-bold text-amber-800">
                  {previewDump.metadata.colecoesCriticas?.estoque || previewDump.dados?.dados?.estoque?.length || 0}
                </span>
              </div>
            </div>

            {/* Visualizador de JSON */}
            <div className="flex-1 overflow-hidden flex flex-col bg-slate-900 rounded-xl p-3 text-slate-200 border border-slate-800">
              <div className="text-[11px] font-mono text-slate-400 pb-2 border-b border-slate-800 flex items-center justify-between">
                <span>Estrutura do Arquivo JSON:</span>
                <span>Tamanho: {previewDump.metadata.tamanhoKb} KB</span>
              </div>
              <pre className="flex-1 overflow-auto text-xs font-mono p-2 text-slate-300 leading-relaxed max-h-72">
                {JSON.stringify(previewDump.dados, null, 2)}
              </pre>
            </div>

            {/* Ações do Modal */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 shrink-0">
              <button
                onClick={() => setPreviewDump(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
              >
                Fechar
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleDownloadStorageDump(previewDump.metadata);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download deste Arquivo JSON</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CÓDIGO E GUIA DE DEPLOY DA CLOUD FUNCTION */}
      {/* ========================================================================= */}
      {isCloudFunctionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 animate-in fade-in zoom-in-95 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Cloud Function: Dump Diário às 03:00</h3>
                  <p className="text-xs text-slate-500">Extração programada para o Firebase Storage via Cloud Scheduler</p>
                </div>
              </div>
              <button
                onClick={() => setIsCloudFunctionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1.5">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Configuração de Agendamento Automático:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                  <div><strong>Horário de Execução:</strong> 03:00 (Madrugada)</div>
                  <div><strong>Fuso Horário:</strong> America/Sao_Paulo (BRT)</div>
                  <div><strong>Cron Expression:</strong> <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-bold">0 3 * * *</code></div>
                  <div><strong>Destino:</strong> Firebase Storage (JSON)</div>
                </div>
              </div>

              {/* Comando de Deploy */}
              <div className="bg-slate-900 rounded-xl p-3.5 text-slate-200 border border-slate-800">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                  <span className="font-mono text-slate-300 font-semibold flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5 text-rose-400" />
                    Comando de Deploy no Firebase CLI:
                  </span>
                  <button
                    onClick={handleCopyDeployCommand}
                    className="flex items-center gap-1 text-rose-400 hover:text-rose-300 transition"
                  >
                    {copiedDeployCommand ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="font-mono text-[11px] text-slate-200 bg-black/40 p-2.5 rounded-lg overflow-x-auto whitespace-pre border border-slate-700/50">
                  {functionDeployCommand}
                </pre>
              </div>

              {/* Código TypeScript da Cloud Function */}
              <div className="bg-slate-900 rounded-xl p-3.5 text-slate-200 border border-slate-800">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                  <span className="font-mono text-slate-300 font-semibold flex items-center gap-1">
                    <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                    Código da Cloud Function (functions/src/index.ts):
                  </span>
                  <button
                    onClick={handleCopyFunctionCode}
                    className="flex items-center gap-1 text-rose-400 hover:text-rose-300 transition"
                  >
                    {copiedFunctionCode ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar Código</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="font-mono text-[11px] text-slate-300 bg-black/40 p-2.5 rounded-lg overflow-x-auto whitespace-pre leading-relaxed border border-slate-700/50 max-h-56">
                  {functionCodeSnippet}
                </pre>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-100 shrink-0">
              <button
                onClick={() => setIsCloudFunctionModalOpen(false)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white font-semibold text-xs rounded-xl shadow-xs transition"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
