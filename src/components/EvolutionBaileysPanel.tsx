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
  Sliders,
  Sparkles,
  Send,
  MessageSquare,
  Clock,
  Calendar,
  Gift,
  Bot
} from 'lucide-react';
import { EvolutionStatusResponse } from './EvolutionBaileysModal';

interface EvolutionBaileysPanelProps {
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  onOpenModal?: () => void;
}

export const EvolutionBaileysPanel: React.FC<EvolutionBaileysPanelProps> = ({
  showToast,
  onOpenModal,
}) => {
  const [loading, setLoading] = useState(false);
  const [instantiating, setInstantiating] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Formulário de Configuração Avançada
  const [serverUrl, setServerUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [instanceName, setInstanceName] = useState('aura-studio-beleza');
  const [showConfig, setShowConfig] = useState(false);

  // Teste de Disparo
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Olá! Mensagem de teste enviada pelo Evolution API (motor Baileys) da clínica.');
  const [lastTestResult, setLastTestResult] = useState<{ sucesso: boolean; mensagem: string; id?: string } | null>(null);

  // Simulação / Pareamento Rápido
  const [simPhone, setSimPhone] = useState('5511999998888');
  const [simName, setSimName] = useState('Studio de Beleza');

  // Estado da Instância
  const [evolutionData, setEvolutionData] = useState<EvolutionStatusResponse | null>(null);

  const fetchStatus = async () => {
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
    fetchStatus();
    const interval = setInterval(() => {
      fetch('/api/whatsapp/evolution/status')
        .then(r => r.json())
        .then(d => {
          if (d?.sucesso) setEvolutionData(d);
        })
        .catch(() => {});
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleCreateInstance = async () => {
    try {
      setInstantiating(true);
      const res = await fetch('/api/whatsapp/evolution/instance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serverUrl: serverUrl.trim() || undefined,
          apiKey: apiKey.trim() || undefined,
          instanceName: instanceName.trim() || 'aura-studio-beleza',
        }),
      });

      const data = await res.json();
      if (data.sucesso) {
        await fetchStatus();
        showToast?.('Instância Evolution API inicializada! QR Code pronto para leitura.', 'success');
      } else {
        showToast?.(data.mensagem || 'Falha ao instanciar na Evolution API', 'error');
      }
    } catch (err: any) {
      showToast?.(err.message || 'Erro ao comunicar com o servidor', 'error');
    } finally {
      setInstantiating(false);
    }
  };

  const handleSimulatePairing = async () => {
    try {
      setInstantiating(true);
      const res = await fetch('/api/whatsapp/evolution/simulate-pairing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero: simPhone,
          nome: simName,
        }),
      });

      const data = await res.json();
      if (data.sucesso) {
        await fetchStatus();
        showToast?.(`WhatsApp pareado com sucesso ao número +${simPhone}!`, 'success');
      } else {
        showToast?.('Falha ao parear WhatsApp simulado', 'error');
      }
    } catch (err: any) {
      showToast?.(err.message || 'Erro ao parear', 'error');
    } finally {
      setInstantiating(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Deseja realmente desconectar este WhatsApp? Todas as automações ficarão pausadas até um novo pareamento.')) {
      return;
    }

    try {
      setDisconnecting(true);
      const res = await fetch('/api/whatsapp/evolution/logout', { method: 'POST' });
      const data = await res.json();
      if (data.sucesso) {
        await fetchStatus();
        showToast?.('Instância desconectada com sucesso!', 'info');
      }
    } catch (err: any) {
      showToast?.(err.message || 'Erro ao desconectar', 'error');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim() || !testMessage.trim()) {
      showToast?.('Preencha o número de telefone e a mensagem de teste.', 'error');
      return;
    }

    setSendingTest(true);
    setLastTestResult(null);

    try {
      const resp = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telefone: testPhone,
          mensagem: testMessage,
        }),
      });

      const data = await resp.json();
      if (resp.ok && data.sucesso) {
        setLastTestResult({
          sucesso: true,
          mensagem: `Mensagem disparada com sucesso via motor Baileys! (ID: ${data.id || 'ok'})`,
          id: data.id,
        });
        showToast?.('Mensagem de teste enviada pelo seu WhatsApp conectado!', 'success');
      } else {
        setLastTestResult({
          sucesso: false,
          mensagem: data.error || data.erro || 'Falha ao disparar mensagem.',
        });
        showToast?.(data.error || 'Falha no disparo', 'error');
      }
    } catch (err: any) {
      setLastTestResult({
        sucesso: false,
        mensagem: err.message || 'Erro de comunicação ao enviar mensagem.',
      });
      showToast?.(err.message || 'Erro no envio', 'error');
    } finally {
      setSendingTest(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    showToast?.('Copiado para a área de transferência!', 'info');
  };

  const status = evolutionData?.status?.status || 'disconnected';
  const isConnected = status === 'connected';
  const isQrCode = status === 'qrcode';
  const ownerNumber = evolutionData?.status?.ownerNumber;
  const profileName = evolutionData?.status?.profileName;
  const qrCodeBase64 = evolutionData?.status?.qrCodeBase64;

  return (
    <div className="space-y-6">
      {/* Banner Principal / Estado da Conexão */}
      <div className={`rounded-3xl p-6 sm:p-8 border shadow-sm transition-all ${
        isConnected 
          ? 'bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 border-emerald-500/30 text-white' 
          : isQrCode
          ? 'bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 border-indigo-500/30 text-white'
          : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700 text-white'
      }`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border ${
                isConnected
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : isQrCode
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 animate-pulse'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                {isConnected ? (
                  <>
                    <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WhatsApp Conectado (Baileys)</span>
                  </>
                ) : isQrCode ? (
                  <>
                    <QrCode className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Aguardando Leitura do QR Code</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                    <span>WhatsApp Desconectado</span>
                  </>
                )}
              </span>

              <span className="px-2.5 py-1 bg-white/10 rounded-full text-xs font-mono text-slate-300">
                Motor: Baileys WebSockets
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {isConnected 
                ? `WhatsApp Ativo: +${ownerNumber || 'Conectado'}` 
                : 'Conexão Evolution API (Baileys)'}
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed">
              {isConnected ? (
                <>
                  Seu WhatsApp está pareado! Toda a estrutura de disparos — <strong>lembretes da agenda, mensagens de pré/pós-procedimento, campanhas em massa e a atendente virtual Aura</strong> — está saindo diretamente pelo seu número com criptografia de ponta a ponta.
                </>
              ) : (
                <>
                  Conecte seu WhatsApp escaneando o QR Code abaixo com a câmera do seu smartphone. A aplicação opera exclusivamente com o motor <strong>Evolution API (Baileys)</strong>, sem necessidade da API do WhatsApp Cloud ou aprovação da Meta.
                </>
              )}
            </p>

            {isConnected && (
              <div className="flex items-center gap-4 pt-1 text-xs text-emerald-300">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Perfil: <strong>{profileName || 'Studio de Beleza'}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Sessão Persistida no Firestore
                </span>
              </div>
            )}
          </div>

          {/* Botões de Ação do Banner */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
            {isConnected ? (
              <>
                <button
                  type="button"
                  onClick={fetchStatus}
                  disabled={loading}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/20"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Sincronizar</span>
                </button>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="px-4 py-2.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Desconectar Aparelho</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleCreateInstance}
                  disabled={instantiating}
                  className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  {instantiating ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <QrCode className="w-4 h-4" />
                  )}
                  <span>{isQrCode ? 'Atualizar QR Code' : 'Gerar QR Code de Conexão'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowConfig(!showConfig)}
                  className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-white/20"
                >
                  <Sliders className="w-4 h-4" />
                  <span>Configuração da Instância</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Se estiver com QR Code ativo e aguardando leitura */}
      {isQrCode && qrCodeBase64 && !isConnected && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-8 items-center animate-in fade-in">
          <div className="md:col-span-5 flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200">
              <img
                src={qrCodeBase64}
                alt="QR Code WhatsApp Baileys"
                className="w-64 h-64 object-contain rounded-lg"
              />
            </div>
            <div className="flex items-center gap-2 mt-4 text-xs font-semibold text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Aguardando leitura pelo WhatsApp...</span>
            </div>
          </div>

          <div className="md:col-span-7 space-y-4">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-600" />
              Como parear o seu smartphone agora:
            </h3>

            <ol className="space-y-3 text-xs sm:text-sm text-slate-600">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-xs">
                  1
                </span>
                <span>Abra o <strong>WhatsApp</strong> no seu celular.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-xs">
                  2
                </span>
                <span>
                  No <strong>Android</strong>, toque nos 3 pontinhos (<code className="font-mono bg-slate-100 px-1 py-0.5 rounded">⋮</code>) &gt; <strong>Aparelhos Conectados</strong>. No <strong>iPhone</strong>, vá em <strong>Configurações</strong> &gt; <strong>Aparelhos Conectados</strong>.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-xs">
                  3
                </span>
                <span>Toque em <strong>Conectar um aparelho</strong> e aponte a câmera para o QR Code ao lado.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-xs">
                  4
                </span>
                <span>Pronto! O sistema detectará o pareamento automaticamente em tempo real.</span>
              </li>
            </ol>

            {/* Teste Rápido / Simulação no Sandbox */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1">
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Pareamento rápido de teste para este ambiente:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={simPhone}
                    onChange={e => setSimPhone(e.target.value)}
                    placeholder="5511999998888"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={handleSimulatePairing}
                    disabled={instantiating}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl whitespace-nowrap transition-colors cursor-pointer shadow-xs"
                  >
                    Simular Conexão
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid com Funcionalidades Vinculadas & Disparo de Teste */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna da Esquerda: Disparo de Teste em Tempo Real */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Testar Disparo pelo Número Conectado
                </h3>
                <p className="text-xs text-slate-500">
                  Valide o envio real usando o motor Evolution API Baileys
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSendTestMessage} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Telefone de Destino (com DDD):
              </label>
              <input
                type="text"
                value={testPhone}
                onChange={e => setTestPhone(e.target.value)}
                placeholder="Ex: 5511999998888"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                disabled={!isConnected}
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Formato internacional recomendado: 55 + DDD + Número.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Conteúdo da Mensagem:
              </label>
              <textarea
                value={testMessage}
                onChange={e => setTestMessage(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                disabled={!isConnected}
              />
            </div>

            {lastTestResult && (
              <div className={`p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
                lastTestResult.sucesso
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-rose-50 text-rose-900 border-rose-200'
              }`}>
                {lastTestResult.sucesso ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{lastTestResult.mensagem}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!isConnected || sendingTest}
              className={`w-full py-3 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer ${
                isConnected
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-200 text-slate-500 cursor-not-allowed'
              }`}
            >
              {sendingTest ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Disparando via Baileys...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Enviar Mensagem de Teste</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Coluna da Direita: Estrutura de Disparos Vinculada ao Aparelho */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Estrutura de Disparos da Clínica
              </h3>
              <p className="text-xs text-slate-500">
                Todos os módulos agora disparam diretamente pelo número conectado
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 text-xs font-bold">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-900">Lembretes & Confirmações da Agenda</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                  Disparos individuais ou em lote para os pacientes do dia ou do dia seguinte.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 text-xs font-bold">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-900">Aura Atendente Virtual (Gemini IA)</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                  Responde automaticamente aos clientes quando mandam mensagem no seu WhatsApp.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 text-xs font-bold">
                <Gift className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-900">Parabéns a Aniversariantes do Mês</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                  Felicitações personalizadas com cupons e mimos direto no WhatsApp.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 text-xs font-bold">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-900">Campanhas Promocionais em Massa</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                  Envio para listas segmentadas (Leads, Clientes Ativos, Inativos e VIPs).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Guia de Configuração do Webhook Evolution API (Aura Atendente Virtual) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Recepção Automática Ativa
                </span>
                <span className="text-xs text-slate-500 font-medium">Evolution API v1 & v2</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                Guia de Webhook: Apontamento para o Bot Aura Atendente Virtual
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              const url = typeof window !== 'undefined' ? `${window.location.origin}/api/whatsapp/webhook` : '/api/whatsapp/webhook';
              await navigator.clipboard.writeText(url);
              setCopiedKey('webhook_url');
              setTimeout(() => setCopiedKey(null), 2500);
              showToast?.('URL do Webhook copiada para a área de transferência!', 'success');
            }}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            {copiedKey === 'webhook_url' ? (
              <>
                <Check className="w-4 h-4" />
                <span>URL Copiada!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar URL do Webhook</span>
              </>
            )}
          </button>
        </div>

        {/* URL do Webhook em Destaque */}
        <div className="p-4 bg-slate-900 rounded-2xl text-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Sua URL de Webhook (Cole no Painel da Evolution API):</span>
            <span className="text-emerald-400 font-mono">Rota: /api/whatsapp/webhook</span>
          </div>
          <div className="flex items-center justify-between gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <code className="text-xs sm:text-sm font-mono text-emerald-300 break-all select-all">
              {typeof window !== 'undefined' ? `${window.location.origin}/api/whatsapp/webhook` : 'https://sua-clinica.app/api/whatsapp/webhook'}
            </code>
            <button
              type="button"
              onClick={async () => {
                const url = typeof window !== 'undefined' ? `${window.location.origin}/api/whatsapp/webhook` : '/api/whatsapp/webhook';
                await navigator.clipboard.writeText(url);
                setCopiedKey('webhook_url_code');
                setTimeout(() => setCopiedKey(null), 2500);
              }}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0"
              title="Copiar"
            >
              {copiedKey === 'webhook_url_code' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Passo a Passo de Configuração no Painel da Evolution API */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Passo a Passo no Painel / Evolution Manager:
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                1
              </div>
              <h5 className="text-xs font-bold text-slate-900">Acesse a Instância</h5>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                No menu lateral do Evolution Manager, clique na sua instância (ex: <code className="text-indigo-600 font-semibold">{instanceName}</code>) e abra a aba <strong>Webhook</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                2
              </div>
              <h5 className="text-xs font-bold text-slate-900">Ative o Webhook</h5>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Marque <strong>Webhook Enabled</strong> como <strong className="text-emerald-700">ON</strong> e cole a URL acima no campo <strong>Webhook URL</strong>. Ative <strong>Webhook by Events</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">
                3
              </div>
              <h5 className="text-xs font-bold text-slate-900">Selecione os 2 Eventos</h5>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Na lista de eventos, marque estritamente:
                <br />
                • <strong className="text-indigo-700">MESSAGES_UPSERT</strong> (recepção do cliente)
                <br />
                • <strong className="text-indigo-700">CONNECTION_UPDATE</strong> (status do aparelho)
              </p>
            </div>
          </div>
        </div>

        {/* Detalhamento dos Eventos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div className="p-4 bg-indigo-50/80 rounded-2xl border border-indigo-100 space-y-2">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              <span>Evento: messages.upsert (MESSAGES_UPSERT)</span>
            </div>
            <p className="text-xs text-indigo-950/80 leading-relaxed">
              Dispara a cada mensagem de texto ou áudio enviada por um cliente para o seu WhatsApp. O servidor encaminha o texto para a <strong>Aura (Google Gemini)</strong>, que:
            </p>
            <ul className="text-[11px] text-indigo-900 space-y-1 list-disc list-inside">
              <li>Confirma agendamentos (Opção 1)</li>
              <li>Encaminha pedidos de remarcação (Opção 2)</li>
              <li>Registra pedidos de insumos/produtos (Opção 3)</li>
              <li>Transfere para atendente humano quando solicitado (Opção 4)</li>
              <li>Responde dúvidas sobre procedimentos, valores e pós-atendimento</li>
            </ul>
          </div>

          <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-100 space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
              <Wifi className="w-4 h-4 text-amber-600" />
              <span>Evento: connection.update (CONNECTION_UPDATE)</span>
            </div>
            <p className="text-xs text-amber-950/80 leading-relaxed">
              Dispara sempre que o estado da sessão WhatsApp Baileys mudar:
            </p>
            <ul className="text-[11px] text-amber-900 space-y-1 list-disc list-inside">
              <li><strong>open:</strong> Atualiza instantaneamente a clínica para <span className="font-bold text-emerald-700">Conectado</span></li>
              <li><strong>close:</strong> Alerta a recepção que o aparelho foi desconectado</li>
              <li><strong>connecting:</strong> Mostra aviso de reconexão automática</li>
              <li>Sincroniza número do chip e nome do perfil automaticamente</li>
            </ul>
          </div>
        </div>

        {/* Configuração via API REST (cURL) */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Server className="w-4 h-4 text-slate-600" />
              Configuração Alternativa via API REST (cURL / Postman / Swagger):
            </span>
            <button
              type="button"
              onClick={async () => {
                const curlCmd = `curl -X POST "${serverUrl || 'https://sua-evolution-api.com'}/webhook/set/${instanceName}" \\
  -H "Content-Type: application/json" \\
  -H "apikey: ${apiKey || 'SUA_API_KEY'}" \\
  -d '{
    "webhook": {
      "enabled": true,
      "url": "${typeof window !== 'undefined' ? window.location.origin : 'https://sua-clinica.app'}/api/whatsapp/webhook",
      "byEvents": true,
      "base64": false,
      "events": [
        "MESSAGES_UPSERT",
        "CONNECTION_UPDATE"
      ]
    }
  }'`;
                await navigator.clipboard.writeText(curlCmd);
                setCopiedKey('curl_code');
                setTimeout(() => setCopiedKey(null), 2500);
                showToast?.('Comando cURL copiado com sucesso!', 'success');
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
            >
              {copiedKey === 'curl_code' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'curl_code' ? 'Copiado!' : 'Copiar cURL'}</span>
            </button>
          </div>
          <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto leading-relaxed">
{`curl -X POST "${serverUrl || 'https://sua-evolution-api.com'}/webhook/set/${instanceName}" \\
  -H "Content-Type: application/json" \\
  -H "apikey: ${apiKey || 'SUA_API_KEY'}" \\
  -d '{
    "webhook": {
      "enabled": true,
      "url": "${typeof window !== 'undefined' ? window.location.origin : 'https://sua-clinica.app'}/api/whatsapp/webhook",
      "byEvents": true,
      "base64": false,
      "events": [
        "MESSAGES_UPSERT",
        "CONNECTION_UPDATE"
      ]
    }
  }'`}
          </pre>
        </div>
      </div>

      {/* Configuração Avançada da Instância (Opcional) */}
      {showConfig && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4 animate-in fade-in">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Server className="w-4 h-4 text-indigo-600" />
            <span>Configurações Técnicas da Instância Evolution API (Baileys)</span>
          </div>
          <p className="text-xs text-slate-500">
            Por padrão, a aplicação gera o QR Code no motor Baileys integrado. Se você possui um servidor Evolution API hospedado na nuvem (Docker/VPS), insira os dados abaixo:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                URL da Evolution API:
              </label>
              <input
                type="text"
                value={serverUrl}
                onChange={e => setServerUrl(e.target.value)}
                placeholder="https://api.evolution.suaclinica.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Chave de API (Global ou Instance Token):
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="42960847-..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nome da Instância:
              </label>
              <input
                type="text"
                value={instanceName}
                onChange={e => setInstanceName(e.target.value)}
                placeholder="aura-studio-beleza"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleCreateInstance}
              disabled={instantiating}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs flex items-center gap-2"
            >
              {instantiating ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>Salvar e Conectar Instância</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
