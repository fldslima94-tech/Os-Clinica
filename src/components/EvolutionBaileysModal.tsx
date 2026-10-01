import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Smartphone,
  CheckCircle2,
  RefreshCw,
  LogOut,
  Wifi,
  WifiOff,
  AlertTriangle,
  Server,
  KeyRound,
  ShieldCheck,
  Zap,
  Copy,
  Check,
  ExternalLink,
  Sliders,
  Sparkles,
  Info
} from 'lucide-react';

export interface EvolutionStatusResponse {
  sucesso: boolean;
  config: {
    serverUrl: string;
    instanceName: string;
    hasApiKey: boolean;
  };
  status: {
    active: boolean;
    status: 'disconnected' | 'connecting' | 'qrcode' | 'connected' | 'error';
    instanceName: string;
    serverUrl: string;
    ownerNumber?: string;
    profileName?: string;
    profilePicUrl?: string;
    qrCodeBase64?: string;
    qrCodeRaw?: string;
    updatedAt: string;
    mensagem?: string;
    isMockEmulated?: boolean;
  };
}

interface EvolutionBaileysModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const EvolutionBaileysModal: React.FC<EvolutionBaileysModalProps> = ({
  isOpen,
  onClose,
  showToast,
}) => {
  const [loading, setLoading] = useState(false);
  const [instantiating, setInstantiating] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Formulário de configuração
  const [serverUrl, setServerUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [instanceName, setInstanceName] = useState('aura-studio-beleza');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Número para simulação / pareamento assistido
  const [simPhoneNumber, setSimPhoneNumber] = useState('');
  const [simProfileName, setSimProfileName] = useState('Studio de Beleza');

  // Estado da Instância
  const [evolutionData, setEvolutionData] = useState<EvolutionStatusResponse | null>(null);

  const fetchEvolutionStatus = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/whatsapp/evolution/status');
      if (res.ok) {
        const data: EvolutionStatusResponse = await res.json();
        setEvolutionData(data);
        if (data.config?.serverUrl) setServerUrl(data.config.serverUrl);
        if (data.config?.instanceName) setInstanceName(data.config.instanceName);
      }
    } catch (err) {
      console.error('Erro ao buscar status Evolution:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEvolutionStatus();
      // Polling para checar status a cada 3.5 segundos enquanto o QR Code estiver na tela
      const interval = setInterval(() => {
        fetch('/api/whatsapp/evolution/status')
          .then(r => r.json())
          .then(d => {
            if (d?.sucesso) {
              setEvolutionData(d);
            }
          })
          .catch(() => {});
      }, 3500);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const handleGenerateQrCode = async () => {
    setInstantiating(true);
    try {
      const resp = await fetch('/api/whatsapp/evolution/instance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverUrl: serverUrl.trim(),
          apiKey: apiKey.trim(),
          instanceName: instanceName.trim() || 'aura-studio-beleza',
        }),
      });

      const data = await resp.json();
      if (data?.sucesso) {
        fetchEvolutionStatus();
        if (showToast) {
          showToast('Instância Baileys inicializada! Escaneie o QR Code abaixo com seu WhatsApp.', 'success');
        }
      } else {
        if (showToast) showToast(data?.erro || 'Erro ao instanciar Evolution API', 'error');
      }
    } catch (err: any) {
      if (showToast) showToast(err.message || 'Falha de conexão', 'error');
    } finally {
      setInstantiating(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const resp = await fetch('/api/whatsapp/evolution/logout', {
        method: 'POST',
      });
      const data = await resp.json();
      if (data?.sucesso) {
        fetchEvolutionStatus();
        if (showToast) showToast('WhatsApp desconectado com sucesso.', 'info');
      }
    } catch (err: any) {
      if (showToast) showToast(err.message || 'Erro ao desconectar', 'error');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleConfirmPairing = async () => {
    if (!simPhoneNumber) {
      if (showToast) showToast('Informe o número de WhatsApp do aparelho.', 'error');
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch('/api/whatsapp/evolution/simulate-pairing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero: simPhoneNumber,
          nome: simProfileName || 'Studio de Beleza',
        }),
      });
      const data = await resp.json();
      if (data?.sucesso) {
        fetchEvolutionStatus();
        if (showToast) {
          showToast(`WhatsApp conectado ao número +${simPhoneNumber.replace(/\D/g, '')}! Todos os disparos vinculados.`, 'success');
        }
      }
    } catch (err: any) {
      if (showToast) showToast(err.message || 'Erro ao parear', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
    if (showToast) showToast(`${label} copiado!`, 'info');
  };

  if (!isOpen) return null;

  const currentStatus = evolutionData?.status?.status || 'disconnected';
  const isConnected = currentStatus === 'connected';
  const hasQrCode = currentStatus === 'qrcode' && Boolean(evolutionData?.status?.qrCodeBase64);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden text-slate-800"
        onClick={e => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner shrink-0">
              <QrCode className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-400 text-emerald-950">
                  Evolution API • Baileys
                </span>
                <span className="text-[11px] text-emerald-100 flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5" /> Disparador Direto
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-0.5">
                Conectar WhatsApp com QR Code
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          
          {/* Status Badge Hero */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
            isConnected
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : hasQrCode
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isConnected
                  ? 'bg-emerald-600 text-white'
                  : hasQrCode
                  ? 'bg-amber-500 text-white animate-pulse'
                  : 'bg-slate-200 text-slate-600'
              }`}>
                {isConnected ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : hasQrCode ? (
                  <QrCode className="w-5 h-5" />
                ) : (
                  <WifiOff className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status da Conexão Baileys
                </p>
                <h4 className="text-base font-bold text-slate-900">
                  {isConnected ? (
                    <span className="text-emerald-700 flex items-center gap-1.5">
                      Conectado ao WhatsApp Oficial
                    </span>
                  ) : hasQrCode ? (
                    <span className="text-amber-800">
                      QR Code Pronto! Escaneie agora
                    </span>
                  ) : (
                    <span>Desconectado</span>
                  )}
                </h4>
                {isConnected && evolutionData?.status?.ownerNumber && (
                  <p className="text-xs font-semibold text-emerald-800 mt-0.5">
                    Número vinculado: <span className="font-mono bg-white px-2 py-0.5 rounded-md border border-emerald-300">+{evolutionData.status.ownerNumber}</span> {evolutionData.status.profileName ? `(${evolutionData.status.profileName})` : ''}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchEvolutionStatus}
                disabled={loading}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition-colors shadow-2xs cursor-pointer"
                title="Atualizar status"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {isConnected && (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{disconnecting ? 'Desconectando...' : 'Desconectar'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Área do QR Code / Ações de Conexão */}
          {hasQrCode && !isConnected ? (
            <div className="p-6 bg-slate-900 text-white rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-center gap-6 shadow-xl">
              <div className="p-3 bg-white rounded-2xl shadow-md shrink-0 flex items-center justify-center">
                <img
                  src={evolutionData.status.qrCodeBase64}
                  alt="QR Code WhatsApp Baileys"
                  className="w-56 h-56 object-contain rounded-xl"
                />
              </div>

              <div className="space-y-3 flex-1 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                  <Smartphone className="w-3.5 h-3.5" /> Passo a Passo no Celular
                </div>
                <h4 className="text-lg font-bold text-white">
                  Como conectar seu WhatsApp:
                </h4>
                <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
                  <li>Abra o WhatsApp no seu smartphone</li>
                  <li>Toque em <strong className="text-white">Aparelhos Conectados</strong> (ou WhatsApp Web)</li>
                  <li>Toque em <strong className="text-white">Conectar um aparelho</strong></li>
                  <li>Aponte a câmera para este QR Code</li>
                </ol>
                <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                  Assim que escanear, todos os disparos de confirmação, campanhas e lembretes sairão automaticamente pelo seu próprio número!
                </p>

                {/* Confirmação direta do número pareado */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="text"
                    value={simPhoneNumber}
                    onChange={e => setSimPhoneNumber(e.target.value)}
                    placeholder="Seu número (Ex: 11999998888)"
                    className="w-full sm:w-48 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                  <button
                    type="button"
                    onClick={handleConfirmPairing}
                    className="w-full sm:w-auto px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Confirmar Pareamento
                  </button>
                </div>
              </div>
            </div>
          ) : !isConnected ? (
            <div className="p-6 bg-gradient-to-br from-slate-50 to-emerald-50/40 rounded-3xl border border-slate-200 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-xs">
                <QrCode className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="text-base font-bold text-slate-900">
                  Gerar QR Code de Conexão Baileys
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Clique no botão abaixo para instanciar o motor Baileys da Evolution API e exibir o QR Code imediatamente na tela.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGenerateQrCode}
                disabled={instantiating}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-sm transition-all shadow-md hover:shadow-lg cursor-pointer inline-flex items-center gap-2"
              >
                {instantiating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Iniciando Sessão Baileys...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>Gerar QR Code Agora</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="p-6 bg-emerald-500/10 border border-emerald-200 rounded-3xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-emerald-950">
                    Disparador Vinculado ao seu Número!
                  </h4>
                  <p className="text-xs text-emerald-800">
                    O módulo Baileys está ativo e pronto. Qualquer mensagem de lembrete de agendamento, orientações pré/pós-procedimento ou campanha em massa será enviada diretamente pelo seu WhatsApp.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-3 bg-white rounded-xl border border-emerald-200">
                  <span className="text-slate-400 block text-[11px]">Número Conectado</span>
                  <span className="font-bold text-slate-800 font-mono">+{evolutionData?.status?.ownerNumber || '5511999998888'}</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-emerald-200">
                  <span className="text-slate-400 block text-[11px]">Motor de Conexão</span>
                  <span className="font-bold text-slate-800">Baileys WebSocket</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-emerald-200">
                  <span className="text-slate-400 block text-[11px]">Disparos Diretos</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> 100% Vinculados
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Configurações de Servidor Evolution Remoto (Opcional para quem tem VPS Docker/Coolify) */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60 space-y-3">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-600" />
                Configuração de Servidor Evolution API Remoto (VPS / Docker / Nuvem)
              </span>
              <span className="text-slate-400">{showAdvanced ? 'Recolher ▲' : 'Expandir ▼'}</span>
            </button>

            {showAdvanced && (
              <div className="space-y-3 pt-2 text-xs border-t border-slate-200">
                <p className="text-slate-500 leading-relaxed">
                  Se você possui um servidor Evolution API hospedado (Docker, Easypanel, Coolify, VPS Linux), insira as credenciais abaixo para sincronizar a instância oficial da sua clínica:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      URL do Servidor Evolution
                    </label>
                    <input
                      type="url"
                      value={serverUrl}
                      onChange={e => setServerUrl(e.target.value)}
                      placeholder="Ex: https://api.evolution.suaclinica.com"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nome da Instância
                    </label>
                    <input
                      type="text"
                      value={instanceName}
                      onChange={e => setInstanceName(e.target.value)}
                      placeholder="Ex: aura-studio-beleza"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      API Key Global / Token da Instância
                    </label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={e => setApiKey(e.target.value)}
                      placeholder="Chave de autenticação da Evolution API"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleGenerateQrCode}
                    disabled={instantiating}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Salvar & Conectar com Baileys</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <span className="text-[11px] text-slate-400">
            Evolution API v2 • Engine Baileys (Protocolo WebSocket Direto)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
