import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { 
  SyncQueueItem, 
  SyncConflict, 
  SyncSingleUserResult, 
  SyncBatchResult,
  getPendingSyncQueue, 
  getUnresolvedConflicts, 
  syncSingleUserToCloud, 
  syncAllPendingQueue, 
  enqueueSyncAction, 
  resolveSyncConflict 
} from '../services/offlineSyncService';

interface ConnectionStatusContextType {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  queueItems: SyncQueueItem[];
  conflictsCount: number;
  conflicts: SyncConflict[];
  lastSyncedAt: Date | null;
  lastError: string | null;
  networkLatencyMs: number | null;
  simulateOffline: boolean;
  toggleSimulateOffline: () => void;
  syncAll: () => Promise<SyncBatchResult>;
  syncSingleUser: (patientOrUserId: string, options?: { forceOverwrite?: boolean; onConflict?: (conflict: SyncConflict) => void }) => Promise<SyncSingleUserResult>;
  queueOfflineMutation: (params: {
    entityType: 'paciente' | 'anamnese' | 'evolucao_retorno' | 'agendamento' | 'generico';
    entityId: string;
    entityTitle: string;
    action: 'create' | 'update' | 'delete';
    payload: any;
    baseVersionTimestamp?: string;
    userEmail?: string;
    userName?: string;
  }) => Promise<SyncQueueItem>;
  resolveConflict: (conflictId: string, resolution: 'keep_local' | 'keep_remote' | 'merge', customMergedData?: any) => Promise<{ success: boolean; error?: string }>;
  dismissError: () => void;
  selectedConflict: SyncConflict | null;
  setSelectedConflict: (conflict: SyncConflict | null) => void;
}

const ConnectionStatusContext = createContext<ConnectionStatusContextType | undefined>(undefined);

export const ConnectionStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [realOnline, setRealOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [simulateOffline, setSimulateOffline] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [queueItems, setQueueItems] = useState<SyncQueueItem[]>([]);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(new Date());
  const [lastError, setLastError] = useState<string | null>(null);
  const [networkLatencyMs, setNetworkLatencyMs] = useState<number | null>(null);
  const [selectedConflict, setSelectedConflict] = useState<SyncConflict | null>(null);

  const isOnline = realOnline && !simulateOffline;

  // Atualizar itens da fila e conflitos
  const refreshQueueAndConflicts = useCallback(async () => {
    try {
      const [queue, unresolvedConflicts] = await Promise.all([
        getPendingSyncQueue(),
        getUnresolvedConflicts(),
      ]);
      setQueueItems(queue);
      setConflicts(unresolvedConflicts);
    } catch (err) {
      console.warn('[ConnectionStatus] Erro ao carregar fila:', err);
    }
  }, []);

  // Monitorar eventos online/offline do navegador
  useEffect(() => {
    const handleOnline = () => {
      setRealOnline(true);
      refreshQueueAndConflicts();
    };

    const handleOffline = () => {
      setRealOnline(false);
    };

    const handleSyncQueueChange = () => {
      refreshQueueAndConflicts();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('aura_sync_queue_changed', handleSyncQueueChange);

    refreshQueueAndConflicts();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('aura_sync_queue_changed', handleSyncQueueChange);
    };
  }, [refreshQueueAndConflicts]);

  // Sincronização em lote
  const syncAll = useCallback(async (): Promise<SyncBatchResult> => {
    if (!isOnline) {
      return {
        totalPending: queueItems.length,
        syncedCount: 0,
        failedCount: 0,
        conflictsCount: conflicts.length,
        conflicts: conflicts,
        errors: ['Dispositivo offline. Não é possível sincronizar no momento.'],
      };
    }

    setIsSyncing(true);
    setLastError(null);

    try {
      const result = await syncAllPendingQueue();
      setLastSyncedAt(new Date());
      await refreshQueueAndConflicts();

      if (result.conflictsCount > 0) {
        setLastError(`Conflito de dados detectado em ${result.conflictsCount} registro(s). Por favor, revise as alterações.`);
      } else if (result.failedCount > 0) {
        setLastError(`Falha ao sincronizar ${result.failedCount} item(ns). Verifique sua conexão.`);
      }

      return result;
    } catch (error: any) {
      const errMsg = error.message || 'Erro inesperado durante a sincronização';
      setLastError(errMsg);
      return {
        totalPending: queueItems.length,
        syncedCount: 0,
        failedCount: queueItems.length,
        conflictsCount: 0,
        conflicts: [],
        errors: [errMsg],
      };
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, queueItems.length, conflicts, refreshQueueAndConflicts]);

  // Auto-sync quando a conexão retornar e houver itens pendentes
  useEffect(() => {
    if (isOnline && queueItems.length > 0 && !isSyncing) {
      const timer = setTimeout(() => {
        syncAll();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isOnline, queueItems.length, isSyncing, syncAll]);

  // Sincronização de usuário / paciente individual
  const syncSingleUser = useCallback(async (
    patientOrUserId: string,
    options?: { forceOverwrite?: boolean; onConflict?: (conflict: SyncConflict) => void }
  ): Promise<SyncSingleUserResult> => {
    if (!isOnline) {
      return {
        success: false,
        syncedItemsCount: 0,
        offlineQueued: true,
        error: 'Dispositivo offline. Dados gravados com segurança na fila local IndexedDB.',
      };
    }

    setIsSyncing(true);
    try {
      const result = await syncSingleUserToCloud(patientOrUserId, {
        forceOverwrite: options?.forceOverwrite,
        onConflict: (c) => {
          setSelectedConflict(c);
          if (options?.onConflict) options.onConflict(c);
        },
      });

      await refreshQueueAndConflicts();
      setLastSyncedAt(new Date());

      if (result.conflict) {
        setSelectedConflict(result.conflict);
        setLastError(result.error || 'Conflito de dados detectado.');
      } else if (!result.success && result.error) {
        setLastError(result.error);
      }

      return result;
    } catch (err: any) {
      const errorStr = err.message || 'Falha ao sincronizar registro do paciente.';
      setLastError(errorStr);
      return {
        success: false,
        syncedItemsCount: 0,
        error: errorStr,
      };
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, refreshQueueAndConflicts]);

  // Adicionar mutação offline
  const queueOfflineMutation = useCallback(async (params: {
    entityType: 'paciente' | 'anamnese' | 'evolucao_retorno' | 'agendamento' | 'generico';
    entityId: string;
    entityTitle: string;
    action: 'create' | 'update' | 'delete';
    payload: any;
    baseVersionTimestamp?: string;
    userEmail?: string;
    userName?: string;
  }): Promise<SyncQueueItem> => {
    const item = await enqueueSyncAction(params);
    await refreshQueueAndConflicts();

    // Se estiver online, tentar sincronizar imediatamente
    if (isOnline) {
      syncSingleUser(params.entityId);
    }

    return item;
  }, [isOnline, refreshQueueAndConflicts, syncSingleUser]);

  // Resolver conflito
  const resolveConflict = useCallback(async (
    conflictId: string, 
    resolution: 'keep_local' | 'keep_remote' | 'merge', 
    customMergedData?: any
  ) => {
    setIsSyncing(true);
    try {
      const res = await resolveSyncConflict(conflictId, resolution, customMergedData);
      await refreshQueueAndConflicts();
      if (selectedConflict?.id === conflictId) {
        setSelectedConflict(null);
      }
      return res;
    } finally {
      setIsSyncing(false);
    }
  }, [refreshQueueAndConflicts, selectedConflict]);

  const dismissError = useCallback(() => {
    setLastError(null);
  }, []);

  const toggleSimulateOffline = useCallback(() => {
    setSimulateOffline(prev => !prev);
  }, []);

  return (
    <ConnectionStatusContext.Provider
      value={{
        isOnline,
        isSyncing,
        pendingCount: queueItems.length,
        queueItems,
        conflictsCount: conflicts.length,
        conflicts,
        lastSyncedAt,
        lastError,
        networkLatencyMs,
        simulateOffline,
        toggleSimulateOffline,
        syncAll,
        syncSingleUser,
        queueOfflineMutation,
        resolveConflict,
        dismissError,
        selectedConflict,
        setSelectedConflict,
      }}
    >
      {children}
    </ConnectionStatusContext.Provider>
  );
};

export const useConnectionStatus = () => {
  const context = useContext(ConnectionStatusContext);
  if (!context) {
    throw new Error('useConnectionStatus deve ser utilizado dentro de um ConnectionStatusProvider');
  }
  return context;
};
