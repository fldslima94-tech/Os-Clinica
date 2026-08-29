import React, { useState, useRef, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  CloudOff, 
  CloudCheck, 
  Database, 
  ArrowUpRight, 
  Clock, 
  FileText, 
  User, 
  Calendar,
  AlertOctagon,
  ChevronDown,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  HelpCircle,
  X,
  Terminal
} from 'lucide-react';
import { useConnectionStatus } from '../contexts/ConnectionStatusContext';
import { printWriteAttemptsToConsole, getRecentWriteAttempts } from '../services/firebaseService';

export const ConnectionSyncStatusWidget: React.FC = () => {
  const {
    isOnline,
    isSyncing,
    pendingCount,
    queueItems,
    conflictsCount,
    conflicts,
    lastSyncedAt,
    lastError,
    simulateOffline,
    toggleSimulateOffline,
    syncAll,
    dismissError,
    setSelectedConflict,
  } = useConnectionStatus();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Não sincronizado';
    const diffSeconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (diffSeconds < 60) return 'Agora mesmo';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `há ${diffMinutes}m`;
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão de Status Principal no Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-2xs cursor-pointer ${
          conflictsCount > 0
            ? 'bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100 animate-pulse'
            : !isOnline
            ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
            : isSyncing
            ? 'bg-indigo-50 border-indigo-300 text-indigo-800 hover:bg-indigo-100'
            : pendingCount > 0
            ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
        }`}
        title="Status da Conexão e Sincronização IndexedDB / Firestore"
      >
        {/* Ícone Dinâmico */}
        {conflictsCount > 0 ? (
          <AlertOctagon className="w-3.5 h-3.5 text-rose-600 animate-bounce" />
        ) : !isOnline ? (
          <CloudOff className="w-3.5 h-3.5 text-amber-600" />
        ) : isSyncing ? (
          <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
        ) : pendingCount > 0 ? (
          <Database className="w-3.5 h-3.5 text-amber-600" />
        ) : (
          <CloudCheck className="w-3.5 h-3.5 text-emerald-600" />
        )}

        {/* Rótulo Dinâmico */}
        <span className="hidden sm:inline">
          {conflictsCount > 0
            ? `Conflito (${conflictsCount})`
            : !isOnline
            ? pendingCount > 0 ? `Offline (${pendingCount})` : 'Offline'
            : isSyncing
            ? 'Sincronizando...'
            : pendingCount > 0
            ? `Pendente (${pendingCount})`
            : 'Nuvem OK'}
        </span>

        {/* Badge do contador se houver pendências */}
        {(pendingCount > 0 || conflictsCount > 0) && (
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
              conflictsCount > 0
                ? 'bg-rose-600 text-white'
                : 'bg-amber-600 text-white'
            }`}
          >
            {conflictsCount > 0 ? conflictsCount : pendingCount}
          </span>
        )}

        <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
      </button>

      {/* Popover Detalhado de Conexão & Sincronização */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header do Popover */}
          <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl ${isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Central de Conectividade & Sync</span>
                  <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'}`} />
                </h4>
                <p className="text-[11px] text-slate-300">
                  {isOnline ? 'Conexão ativa com Firebase Firestore' : 'Modo Offline: Armazenamento Local Seguro'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Banner de Erro/Conflito se houver */}
          {lastError && (
            <div className="p-3 bg-rose-50 border-b border-rose-100 flex items-start gap-2 text-rose-800 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{lastError}</p>
              </div>
              <button onClick={dismissError} className="text-rose-500 hover:text-rose-700">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Seção de Conflitos se houver */}
          {conflictsCount > 0 && (
            <div className="p-3 bg-rose-50/80 border-b border-rose-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4 text-rose-600" />
                  {conflictsCount} Conflito(s) de Dados Detectado(s)
                </span>
              </div>
              <p className="text-[11px] text-rose-700 mb-2">
                A versão na nuvem foi modificada enquanto este dispositivo estava offline.
              </p>
              <div className="space-y-1.5">
                {conflicts.map(c => (
                  <div key={c.id} className="p-2 bg-white rounded-xl border border-rose-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-800">{c.entityTitle}</div>
                      <div className="text-[10px] text-slate-500">Campos: {c.conflictFields.join(', ')}</div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedConflict(c);
                        setIsOpen(false);
                      }}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold shadow-xs cursor-pointer"
                    >
                      Resolver
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Geral */}
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-semibold text-slate-500 block uppercase">Fila IndexedDB</span>
                <span className="text-base font-extrabold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Database className="w-3.5 h-3.5 text-indigo-600" />
                  {pendingCount} item(ns)
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-semibold text-slate-500 block uppercase">Última Sincronia</span>
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1 mt-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {formatLastSync(lastSyncedAt)}
                </span>
              </div>
            </div>

            {/* Simular Modo Offline (Toggle Interativo) */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-800 block">Simulador Offline</span>
                <span className="text-[10px] text-slate-500">Permite testar salvamento na fila IndexedDB sem rede</span>
              </div>
              <button
                type="button"
                onClick={toggleSimulateOffline}
                className="cursor-pointer text-indigo-600 hover:text-indigo-700 transition-colors"
                title={simulateOffline ? 'Desativar simulação offline' : 'Ativar simulação offline'}
              >
                {simulateOffline ? (
                  <ToggleRight className="w-7 h-7 text-amber-600" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-slate-400" />
                )}
              </button>
            </div>

            {/* Lista dos Itens na Fila IndexedDB */}
            {pendingCount > 0 ? (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Itens aguardando envio para a nuvem
                </span>
                {queueItems.map(item => (
                  <div
                    key={item.id}
                    className="p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs shadow-2xs"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="p-1 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                        {item.entityType === 'anamnese' ? (
                          <FileText className="w-3.5 h-3.5" />
                        ) : item.entityType === 'paciente' ? (
                          <User className="w-3.5 h-3.5" />
                        ) : (
                          <Calendar className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="truncate">
                        <div className="font-semibold text-slate-800 truncate">{item.entityTitle}</div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(item.localUpdatedAt).toLocaleTimeString('pt-BR')} • {item.action === 'create' ? 'Criação' : 'Atualização'}
                        </div>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      item.status === 'syncing' ? 'bg-indigo-100 text-indigo-700' :
                      item.status === 'failed' ? 'bg-rose-100 text-rose-700' :
                      item.status === 'conflict' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {item.status === 'syncing' ? 'Enviando...' : item.status === 'failed' ? 'Falhou' : 'Pendente'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/80 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Todos os registros de anamnese, treinos e clientes estão 100% sincronizados com a nuvem.</span>
              </div>
            )}

            {/* Botão de Sincronização Manual & Debug Log */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <button
                type="button"
                disabled={!isOnline || isSyncing || pendingCount === 0}
                onClick={syncAll}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Sincronizando com Firestore...' : 'Sincronizar Fila com a Nuvem Agora'}</span>
              </button>

              <button
                type="button"
                onClick={() => printWriteAttemptsToConsole()}
                className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Imprime todas as gravações Firestore no Console do navegador (F12)"
              >
                <Terminal className="w-3.5 h-3.5 text-indigo-600" />
                <span>Imprimir Logs de Gravação no Console (F12)</span>
              </button>
            </div>

          </div>

        </div>
      )}
    </div>
  );
};
