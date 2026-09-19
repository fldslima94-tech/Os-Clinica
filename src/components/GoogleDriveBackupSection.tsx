import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  UploadCloud,
  FolderPlus,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  Calendar,
  Lock,
  LogOut,
  Layers,
  ArrowRight,
  Database
} from 'lucide-react';
import {
  getStoredWorkspaceAuth,
  requestGoogleWorkspaceToken,
  clearWorkspaceAuth,
  GoogleWorkspaceAuthState
} from '../services/googleAuthService';
import {
  uploadFileToDrive,
  listDriveFiles,
  getOrCreateDriveFolder,
  GoogleDriveFile
} from '../services/googleDriveService';
import { SnapshotBackupSistema, UsuarioEquipe } from '../types';
import { criarBackupCompleto } from '../services/firebaseService';

interface GoogleDriveBackupSectionProps {
  currentUser?: UsuarioEquipe;
  backupsList: SnapshotBackupSistema[];
  onBackupSaved?: () => void;
}

export const GoogleDriveBackupSection: React.FC<GoogleDriveBackupSectionProps> = ({
  currentUser,
  backupsList,
  onBackupSaved
}) => {
  const [authState, setAuthState] = useState<GoogleWorkspaceAuthState>(getStoredWorkspaceAuth());
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [driveFiles, setDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [folderId, setFolderId] = useState<string | null>(null);

  // Carrega status da autenticação
  useEffect(() => {
    const current = getStoredWorkspaceAuth();
    setAuthState(current);
    if (current.isConnected && current.hasDriveAccess) {
      carregarArquivosDrive();
    }
  }, []);

  const showFeedback = (type: 'success' | 'error' | 'info', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 6000);
  };

  const handleConnectGoogleDrive = async () => {
    setIsAuthenticating(true);
    try {
      await requestGoogleWorkspaceToken();
      const updated = getStoredWorkspaceAuth();
      setAuthState(updated);
      showFeedback('success', 'Google Workspace conectado com sucesso!');
      carregarArquivosDrive();
    } catch (err: any) {
      console.error('[GoogleDriveBackupSection] Falha ao autenticar:', err);
      showFeedback('error', 'Falha na conexão com Google: ' + (err.message || 'Erro de autorização'));
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDisconnect = () => {
    clearWorkspaceAuth();
    setAuthState(getStoredWorkspaceAuth());
    setDriveFiles([]);
    setFolderId(null);
    showFeedback('info', 'Desconectado do Google Workspace.');
  };

  const carregarArquivosDrive = async () => {
    setIsLoadingFiles(true);
    try {
      // Cria ou busca pasta padrão para a clínica no Drive
      const targetFolderId = await getOrCreateDriveFolder('AuraEstetica_Backups');
      setFolderId(targetFolderId);
      const files = await listDriveFiles(targetFolderId);
      setDriveFiles(files);
    } catch (err: any) {
      console.error('[carregarArquivosDrive] Erro:', err);
      showFeedback('error', 'Falha ao sincronizar com Google Drive: ' + (err.message || 'Erro de leitura'));
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleExportSnapshotToDrive = async (snapshot: SnapshotBackupSistema) => {
    setIsUploading(true);
    try {
      const targetFolder = folderId || (await getOrCreateDriveFolder('AuraEstetica_Backups'));
      setFolderId(targetFolder);

      const fileName = `Backup_AuraEstetica_${snapshot.dataCriacao.replace(/[:.]/g, '-')}.json`;
      const jsonStr = JSON.stringify(snapshot, null, 2);

      const uploaded = await uploadFileToDrive(fileName, jsonStr, 'application/json', targetFolder);

      showFeedback('success', `Backup "${fileName}" salvo com sucesso no Google Drive!`);
      await carregarArquivosDrive();
      if (onBackupSaved) onBackupSaved();
    } catch (err: any) {
      console.error('[handleExportSnapshotToDrive] Erro:', err);
      showFeedback('error', 'Erro ao salvar no Drive: ' + (err.message || 'Falha de upload'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateInstantBackupToDrive = async () => {
    setIsUploading(true);
    try {
      const snap = await criarBackupCompleto('manual', currentUser, false);
      const targetFolder = folderId || (await getOrCreateDriveFolder('AuraEstetica_Backups'));
      setFolderId(targetFolder);

      const fileName = `Backup_Instantaneo_AuraEstetica_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      const jsonStr = JSON.stringify(snap, null, 2);

      await uploadFileToDrive(fileName, jsonStr, 'application/json', targetFolder);

      showFeedback('success', `Novo backup completo gerado e enviado diretamente para o Google Drive! (${snap.totalRegistros} itens)`);
      await carregarArquivosDrive();
      if (onBackupSaved) onBackupSaved();
    } catch (err: any) {
      console.error('[handleCreateInstantBackupToDrive] Erro:', err);
      showFeedback('error', 'Erro ao criar e enviar backup ao Drive: ' + (err.message || 'Falha geral'));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-3.5 rounded-xl text-xs font-semibold border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : feedback.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-indigo-50 text-indigo-800 border-indigo-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {feedback.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
            {feedback.type === 'info' && <HardDrive className="w-4 h-4 text-indigo-600 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
        </div>
      )}

      {/* Header do Google Drive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <svg className="w-6 h-6" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
              <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
              <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
              <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
              <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
              <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
              <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Sincronização com Google Drive
              </h3>
              {authState.isConnected && authState.hasDriveAccess ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Conectado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                  Desconectado
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Armazene cópias de segurança em JSON diretamente na pasta <strong className="text-slate-700">"AuraEstetica_Backups"</strong> no Google Drive da clínica.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {authState.isConnected && authState.hasDriveAccess ? (
            <>
              <button
                onClick={handleCreateInstantBackupToDrive}
                disabled={isUploading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50"
              >
                <UploadCloud className={`w-4 h-4 ${isUploading ? 'animate-bounce' : ''}`} />
                <span>{isUploading ? 'Enviando...' : 'Backup Instantâneo para o Drive'}</span>
              </button>

              <button
                onClick={carregarArquivosDrive}
                disabled={isLoadingFiles}
                title="Recarregar lista do Drive"
                className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingFiles ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={handleDisconnect}
                title="Desconectar conta Google"
                className="p-2 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={handleConnectGoogleDrive}
              disabled={isAuthenticating}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>{isAuthenticating ? 'Conectando ao Google...' : 'Conectar Conta Google Drive'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Conteúdo com os backups listados do Google Drive */}
      {authState.isConnected && authState.hasDriveAccess ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-2">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <FolderPlus className="w-3.5 h-3.5 text-blue-500" />
              Arquivos de Backup na pasta "AuraEstetica_Backups":
            </span>
            <span>{driveFiles.length} arquivos encontrados</span>
          </div>

          {isLoadingFiles ? (
            <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
              <span>Carregando backups do Google Drive...</span>
            </div>
          ) : driveFiles.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
              Nenhum backup encontrado no Google Drive ainda. Clique em "Backup Instantâneo para o Drive" para enviar o primeiro!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {driveFiles.map(file => (
                <div
                  key={file.id}
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-xs transition bg-slate-50/50 flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 bg-blue-100/60 text-blue-700 rounded-lg shrink-0">
                      <FileJson className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-800 truncate" title={file.name}>
                        {file.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {file.createdTime ? new Date(file.createdTime).toLocaleString('pt-BR') : 'Data recente'}
                        {file.size ? ` • ${(parseInt(file.size, 10) / 1024).toFixed(1)} KB` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
                    {file.webViewLink && (
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Abrir no Drive</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Enviar Snapshots locais já existentes */}
          {backupsList.length > 0 && (
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-slate-500" />
                Copiar Snapshots Locais Recentes para o Google Drive:
              </h4>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {backupsList.slice(0, 4).map(snap => (
                  <button
                    key={snap.id}
                    onClick={() => handleExportSnapshotToDrive(snap)}
                    disabled={isUploading}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-[11px] font-semibold rounded-lg border border-slate-200 transition shrink-0 disabled:opacity-50"
                  >
                    <UploadCloud className="w-3 h-3 text-blue-500" />
                    <span>Snapshot {new Date(snap.dataCriacao).toLocaleDateString('pt-BR')} ({snap.totalRegistros} itens)</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 text-center space-y-2">
          <p className="text-xs text-slate-600 font-medium">
            Conecte sua conta do Google para habilitar o envio automático e manual de dumps JSON de segurança para a sua nuvem do Google Drive.
          </p>
          <p className="text-[11px] text-slate-400">
            Escopo de segurança seguro: o aplicativo apenas acessa arquivos criados por ele mesmo (drive.file).
          </p>
        </div>
      )}
    </div>
  );
};
