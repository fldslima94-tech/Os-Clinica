import React, { useState, useEffect } from 'react';
import {
  X,
  KeyRound,
  Phone,
  ShieldCheck,
  Webhook,
  Copy,
  Check,
  ExternalLink,
  HelpCircle,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Server,
  Layers,
  Sliders,
  CheckCircle2,
  Terminal,
  Zap,
  Info,
  Clock,
  ArrowRight
} from 'lucide-react';

interface WhatsAppConfigStatus {
  sucesso?: boolean;
  configured: boolean;
  hasToken: boolean;
  hasPhoneNumberId: boolean;
  hasVerifyToken: boolean;
  tokenPrefix: string | null;
  phoneNumberId: string | null;
  verifyTokenConfigured: boolean;
  apiVersion: string;
  webhookUrl: string;
}

export interface WhatsAppCloudApiConfigGuideProps {
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  onClose?: () => void;
  isModal?: boolean;
  onOpenWebhookGuide?: () => void;
}

export interface WhatsAppCloudApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  onOpenWebhookGuide?: () => void;
}

export const WhatsAppCloudApiConfigGuide: React.FC<WhatsAppCloudApiConfigGuideProps> = ({
  showToast,
  onClose,
  isModal = false,
  onOpenWebhookGuide,
}) => {
  const [activeTab, setActiveTab] = useState<'quickstart' | 'token' | 'phone_id' | 'webhook' | 'faq'>('quickstart');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{
    sucesso: boolean;
    mensagem: string;
    dados?: any;
  } | null>(null);

  const [status, setStatus] = useState<WhatsAppConfigStatus>({
    configured: false,
    hasToken: false,
    hasPhoneNumberId: false,
    hasVerifyToken: false,
    tokenPrefix: null,
    phoneNumberId: null,
    verifyTokenConfigured: false,
    apiVersion: 'v21.0',
    webhookUrl: typeof window !== 'undefined' ? `${window.location.origin}/api/whatsapp/webhook` : '',
  });

  const [generatedVerifyToken, setGeneratedVerifyToken] = useState<string>('aura_clinica_meta_webhook_2025');

  // Buscar status real do servidor
  const fetchStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch('/api/whatsapp/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(prev => ({
          ...prev,
          ...data,
          webhookUrl: data.webhookUrl || `${window.location.origin}/api/whatsapp/webhook`,
        }));
      }
    } catch (err) {
      console.error('Erro ao verificar status do WhatsApp:', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    setTestResult(null);
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(label);
    if (showToast) showToast(`Copiado para a área de transferência: ${label}`, 'success');
    setTimeout(() => {
      setCopiedKey(null);
    }, 2500);
  };

  const handleGenerateRandomToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_';
    let token = 'aura_meta_';
    for (let i = 0; i < 20; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedVerifyToken(token);
    handleCopy(token, 'WHATSAPP_VERIFY_TOKEN');
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/whatsapp/test-connection', {
        method: 'POST',
      });
      const data = await res.json();
      setTestResult(data);
      if (data.sucesso) {
        if (showToast) showToast('Conexão com a Meta realizada com sucesso!', 'success');
        fetchStatus();
      } else {
        if (showToast) showToast(data.mensagem || 'Erro ao validar credenciais.', 'error');
      }
    } catch (err: any) {
      setTestResult({
        sucesso: false,
        mensagem: err.message || 'Erro de comunicação com o servidor ao testar credenciais.',
      });
      if (showToast) showToast('Falha na requisição de teste.', 'error');
    } finally {
      setTestingConnection(false);
    }
  };

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const calculatedWebhookUrl = status.webhookUrl || `${currentOrigin}/api/whatsapp/webhook`;

  const containerClasses = isModal
    ? "bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden"
    : "bg-white rounded-3xl shadow-xs border border-slate-200 w-full flex flex-col overflow-hidden";

  return (
    <div className={containerClasses}>
      {/* Header Superior com Identidade e Status */}
      <div className="bg-slate-900 text-white p-5 sm:p-6 shrink-0 relative border-b border-slate-800">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                Meta Cloud API Oficial
              </span>
              <span className="bg-slate-800 text-slate-300 text-xs px-2.5 py-0.5 rounded-full border border-slate-700 font-mono">
                Versão {status.apiVersion}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              Configuração das Variáveis de Ambiente do WhatsApp
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed">
              Como obter e cadastrar os segredos <code className="bg-slate-800 px-1.5 py-0.5 rounded font-mono text-emerald-300 text-xs">WHATSAPP_TOKEN</code>, <code className="bg-slate-800 px-1.5 py-0.5 rounded font-mono text-emerald-300 text-xs">WHATSAPP_PHONE_NUMBER_ID</code> e <code className="bg-slate-800 px-1.5 py-0.5 rounded font-mono text-emerald-300 text-xs">WHATSAPP_VERIFY_TOKEN</code> no painel de Secrets do AI Studio.
            </p>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800/80 transition-colors shrink-0 cursor-pointer"
              title="Fechar Guia"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

          {/* Card de Diagnóstico em Tempo Real */}
          <div className="mt-4 p-3.5 bg-slate-800/90 rounded-2xl border border-slate-700/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Server className="w-4 h-4 text-indigo-400" />
                Status no Ambiente:
              </span>

              {/* Status Token */}
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono font-medium ${
                status.hasToken 
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              }`}>
                {status.hasToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                <span>TOKEN: {status.hasToken ? (status.tokenPrefix || 'Definido') : 'Pendente'}</span>
              </div>

              {/* Status Phone ID */}
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono font-medium ${
                status.hasPhoneNumberId 
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              }`}>
                {status.hasPhoneNumberId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                <span>PHONE_ID: {status.hasPhoneNumberId ? (status.phoneNumberId || 'Definido') : 'Pendente'}</span>
              </div>

              {/* Status Verify Token */}
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono font-medium ${
                status.hasVerifyToken 
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              }`}>
                {status.hasVerifyToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                <span>VERIFY_TOKEN: {status.hasVerifyToken ? 'Definido' : 'Pendente'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-auto">
              <button
                type="button"
                onClick={fetchStatus}
                disabled={loadingStatus}
                className="px-3 py-1.5 bg-slate-700/80 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Recarregar status das variáveis"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingStatus ? 'animate-spin' : ''}`} />
                <span>Checar Novamente</span>
              </button>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingConnection || !status.hasToken || !status.hasPhoneNumberId}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  status.hasToken && status.hasPhoneNumberId
                    ? 'bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 shadow-xs'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
                }`}
                title="Testar requisição real na Meta Graph API"
              >
                <Zap className={`w-3.5 h-3.5 ${testingConnection ? 'animate-pulse' : ''}`} />
                <span>{testingConnection ? 'Validando na Meta...' : 'Testar Conexão Oficial'}</span>
              </button>
            </div>
          </div>

          {/* Resultado do Teste de Conexão (se disparado) */}
          {testResult && (
            <div className={`mt-3 p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in duration-150 ${
              testResult.sucesso
                ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
                : 'bg-rose-950/70 border-rose-500/50 text-rose-200'
            }`}>
              {testResult.sucesso ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-semibold">{testResult.sucesso ? 'Conexão Bem-Sucedida!' : 'Falha na Validação'}</p>
                <p className="text-[11px] mt-0.5 leading-relaxed text-slate-300 font-mono">
                  {testResult.mensagem}
                </p>
                {testResult.dados && (
                  <div className="mt-1 text-[10px] bg-black/40 p-2 rounded border border-white/10 font-mono overflow-x-auto">
                    {JSON.stringify(testResult.dados, null, 2)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Barra de Abas do Guia */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-5 pt-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('quickstart')}
            className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border-b-2 ${
              activeTab === 'quickstart'
                ? 'bg-white text-slate-900 border-emerald-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/60'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>1. Início Rápido: Painel de Secrets</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('token')}
            className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border-b-2 ${
              activeTab === 'token'
                ? 'bg-white text-slate-900 border-emerald-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/60'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
            <span>2. Como Obter WHATSAPP_TOKEN</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('phone_id')}
            className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border-b-2 ${
              activeTab === 'phone_id'
                ? 'bg-white text-slate-900 border-emerald-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/60'
            }`}
          >
            <Phone className="w-3.5 h-3.5 text-blue-600" />
            <span>3. Como Obter WHATSAPP_PHONE_NUMBER_ID</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('webhook')}
            className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border-b-2 ${
              activeTab === 'webhook'
                ? 'bg-white text-slate-900 border-emerald-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/60'
            }`}
          >
            <Webhook className="w-3.5 h-3.5 text-indigo-600" />
            <span>4. Webhook & WHATSAPP_VERIFY_TOKEN</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('faq')}
            className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border-b-2 ${
              activeTab === 'faq'
                ? 'bg-white text-slate-900 border-emerald-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/60'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-purple-600" />
            <span>5. FAQ & Dúvidas</span>
          </button>
        </div>

        {/* Corpo com Conteúdo da Aba */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-slate-700 text-sm">
          
          {/* ========================================================
              ABA 1: INÍCIO RÁPIDO & TABELA DE VARIÁVEIS
             ======================================================== */}
          {activeTab === 'quickstart' && (
            <div className="space-y-6">
              <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 space-y-1">
                  <p className="font-bold text-sm">Onde configurar no AI Studio?</p>
                  <p className="leading-relaxed">
                    No painel do AI Studio, as credenciais confidenciais devem ser cadastradas através do menu de <strong>Secrets / Variáveis de Ambiente</strong>. Elas ficam protegidas com segurança criptografada no servidor Node.js e nunca são expostas no código público ou navegador dos clientes.
                  </p>
                </div>
              </div>

              {/* Tabela Interativa de Variáveis com Cópia com 1 Clique */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-emerald-600" />
                  As 3 Variáveis de Ambiente Obrigatórias
                </h3>

                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <div className="divide-y divide-slate-200">
                    
                    {/* Item 1: WHATSAPP_TOKEN */}
                    <div className="p-4 bg-white hover:bg-slate-50/80 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-xs sm:text-sm text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                              WHATSAPP_TOKEN
                            </span>
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.2 rounded-full border border-rose-200">
                              Obrigatório
                            </span>
                            {status.hasToken && (
                              <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                                <Check className="w-3 h-3" /> Configurado
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            Token Permanente de Usuário do Sistema (System User Token) gerado no Meta Business Suite com permissão <code className="bg-slate-100 text-slate-800 px-1 py-0.2 rounded text-[11px]">whatsapp_business_messaging</code>.
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopy('WHATSAPP_TOKEN', 'WHATSAPP_TOKEN')}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Copiar nome da variável"
                          >
                            {copiedKey === 'WHATSAPP_TOKEN' ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700">Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-500" />
                                <span>Copiar Nome</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab('token')}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <span>Ver Passo a Passo</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Item 2: WHATSAPP_PHONE_NUMBER_ID */}
                    <div className="p-4 bg-white hover:bg-slate-50/80 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-xs sm:text-sm text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                              WHATSAPP_PHONE_NUMBER_ID
                            </span>
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.2 rounded-full border border-rose-200">
                              Obrigatório
                            </span>
                            {status.hasPhoneNumberId && (
                              <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                                <Check className="w-3 h-3" /> Configurado
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            Identificador numérico do número (ex: <code className="font-mono bg-slate-100 px-1 py-0.2 rounded text-slate-700 text-[11px]">105938472910394</code>) extraído na aba WhatsApp &gt; Configuração da API. <strong>Não é</strong> o número com DDD.
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopy('WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_PHONE_NUMBER_ID')}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Copiar nome da variável"
                          >
                            {copiedKey === 'WHATSAPP_PHONE_NUMBER_ID' ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700">Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-500" />
                                <span>Copiar Nome</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab('phone_id')}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <span>Ver Passo a Passo</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Item 3: WHATSAPP_VERIFY_TOKEN */}
                    <div className="p-4 bg-white hover:bg-slate-50/80 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-xs sm:text-sm text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-200">
                              WHATSAPP_VERIFY_TOKEN
                            </span>
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.2 rounded-full border border-indigo-200">
                              Webhook & Robô
                            </span>
                            {status.hasVerifyToken && (
                              <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                                <Check className="w-3 h-3" /> Configurado
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            Senha inventada por você (token de verificação) que garante que apenas a Meta consiga enviar eventos para o seu webhook do robô inteligente.
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopy('WHATSAPP_VERIFY_TOKEN', 'WHATSAPP_VERIFY_TOKEN')}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Copiar nome da variável"
                          >
                            {copiedKey === 'WHATSAPP_VERIFY_TOKEN' ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700">Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-500" />
                                <span>Copiar Nome</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab('webhook')}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <span>Ver Passo a Passo</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* Guia Visual do Painel de Secrets do AI Studio */}
              <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Como Inserir no Painel de Secrets do AI Studio</h4>
                    <p className="text-xs text-slate-400">Processo simples de 4 passos dentro do ambiente do AI Studio</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60 space-y-1.5">
                    <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px]">A</span>
                      Abra o Painel de Secrets
                    </p>
                    <p className="text-slate-300 leading-relaxed">
                      Na barra lateral ou superior da interface do AI Studio, localize a aba ou ícone de <strong>Configurações do Projeto (Secrets / Environment)</strong>.
                    </p>
                  </div>

                  <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60 space-y-1.5">
                    <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px]">B</span>
                      Cadastre as Chaves
                    </p>
                    <p className="text-slate-300 leading-relaxed">
                      Clique em <strong>"Add Secret"</strong> ou <strong>"Nova Variável"</strong> e insira o nome exato da chave (ex: <code className="text-emerald-300 font-mono">WHATSAPP_TOKEN</code>) e cole o valor correspondente.
                    </p>
                  </div>

                  <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60 space-y-1.5">
                    <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px]">C</span>
                      Repita para as 3 Chaves
                    </p>
                    <p className="text-slate-300 leading-relaxed">
                      Insira <code className="text-emerald-300 font-mono">WHATSAPP_TOKEN</code>, <code className="text-blue-300 font-mono">WHATSAPP_PHONE_NUMBER_ID</code> e <code className="text-indigo-300 font-mono">WHATSAPP_VERIFY_TOKEN</code>.
                    </p>
                  </div>

                  <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60 space-y-1.5">
                    <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px]">D</span>
                      Teste a Conexão
                    </p>
                    <p className="text-slate-300 leading-relaxed">
                      Após salvar, volte a este modal e clique em <strong>"Testar Conexão Oficial"</strong> para confirmar que a Meta respondeu com sucesso!
                    </p>
                  </div>
                </div>

                {/* Bloco de Código Exemplo para .env local */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Modelo para arquivo .env.local (Desenvolvimento)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(
                        `# WhatsApp Cloud API Oficial (Meta)\nWHATSAPP_TOKEN="EAAB..."\nWHATSAPP_PHONE_NUMBER_ID="105938472910394"\nWHATSAPP_VERIFY_TOKEN="${generatedVerifyToken}"\nWHATSAPP_API_VERSION="v21.0"`,
                        'env_snippet'
                      )}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedKey === 'env_snippet' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'env_snippet' ? 'Copiado!' : 'Copiar Bloco .env'}</span>
                    </button>
                  </div>

                  <pre className="p-3 bg-black/60 rounded-xl text-slate-300 text-xs font-mono overflow-x-auto border border-slate-800 select-all">
{`# WhatsApp Cloud API Oficial (Meta)
WHATSAPP_TOKEN="EAAB..."
WHATSAPP_PHONE_NUMBER_ID="105938472910394"
WHATSAPP_VERIFY_TOKEN="${generatedVerifyToken}"
WHATSAPP_API_VERSION="v21.0"`}
                  </pre>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================
              ABA 2: PASSO 1: WHATSAPP_TOKEN (TOKEN PERMANENTE)
             ======================================================== */}
          {activeTab === 'token' && (
            <div className="space-y-6">
              
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                <KeyRound className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-950 space-y-1">
                  <p className="font-bold text-sm">O que é o WHATSAPP_TOKEN e por que ele deve ser Permanente?</p>
                  <p className="leading-relaxed">
                    O <strong>WHATSAPP_TOKEN</strong> é a credencial Bearer de autorização usada pelo servidor para disparar mensagens em nome do número oficial da sua clínica.
                  </p>
                  <p className="font-semibold text-rose-800">
                    ⚠️ Atenção: Na tela inicial da Meta ("API Setup") há um "Token de acesso temporário" que expira em 24 horas. Para o robô e os disparos em lote funcionarem 24 horas por dia sem interrupção, você deve gerar um <strong>Token de Usuário do Sistema (System User Token)</strong> que nunca expira.
                  </p>
                </div>
              </div>

              {/* Passo a Passo Ilustrado */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Passo a Passo: Gerando o Token Permanente no Meta Business Suite
                </h3>

                <div className="space-y-3">
                  
                  {/* Passo 1 */}
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                        1
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">Acesse as Configurações do Negócio na Meta</h4>
                    </div>
                    <p className="text-xs text-slate-600 pl-8 leading-relaxed">
                      Entre em <a href="https://business.facebook.com/settings" target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline font-bold inline-flex items-center gap-1">business.facebook.com/settings <ExternalLink className="w-3 h-3" /></a> e selecione a conta empresarial da sua clínica de estética.
                    </p>
                  </div>

                  {/* Passo 2 */}
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                        2
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">Crie um Usuário do Sistema (System User)</h4>
                    </div>
                    <p className="text-xs text-slate-600 pl-8 leading-relaxed">
                      No menu lateral esquerdo, vá em <strong>Usuários &gt; Usuários do Sistema</strong>. Clique no botão <strong>"Adicionar"</strong>.
                    </p>
                    <ul className="text-xs text-slate-600 pl-12 list-disc space-y-1">
                      <li>Nome do usuário: <code className="bg-slate-100 px-1 py-0.5 rounded font-bold text-slate-800">Aura Bot Clinica</code></li>
                      <li>Função do usuário do sistema: selecione <strong>Administrador</strong>.</li>
                    </ul>
                  </div>

                  {/* Passo 3 */}
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                        3
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">Atribua Ativos ao Usuário do Sistema</h4>
                    </div>
                    <p className="text-xs text-slate-600 pl-8 leading-relaxed">
                      Com o usuário do sistema selecionado, clique em <strong>"Atribuir Ativos"</strong>:
                    </p>
                    <ul className="text-xs text-slate-600 pl-12 list-disc space-y-1">
                      <li>Selecione <strong>Contas do WhatsApp</strong> &gt; marque a conta do WhatsApp da clínica.</li>
                      <li>Ative a opção <strong>"Controle Total / Gerenciar Conta do WhatsApp"</strong>.</li>
                      <li>Salve as alterações.</li>
                    </ul>
                  </div>

                  {/* Passo 4 */}
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                        4
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">Gere o Token com as Permissões Obrigatórias</h4>
                    </div>
                    <p className="text-xs text-slate-600 pl-8 leading-relaxed">
                      Clique no botão <strong>"Gerar Novo Token"</strong>:
                    </p>
                    <div className="ml-8 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                      <p className="font-semibold text-slate-800">1. Selecione o seu Aplicativo da Meta.</p>
                      <p className="font-semibold text-slate-800">2. Expiração do Token: Escolha <strong>"Nunca"</strong> (Never).</p>
                      <p className="font-semibold text-slate-800">3. Marque obrigatoriamente estas 2 permissões:</p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <span className="font-mono bg-emerald-100 text-emerald-800 font-bold px-2 py-1 rounded-md text-[11px] border border-emerald-300">
                          whatsapp_business_messaging
                        </span>
                        <span className="font-mono bg-emerald-100 text-emerald-800 font-bold px-2 py-1 rounded-md text-[11px] border border-emerald-300">
                          whatsapp_business_management
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Passo 5 */}
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold">
                        5
                      </span>
                      <h4 className="font-bold text-emerald-950 text-sm">Copie o Token e Cole no AI Studio Secrets</h4>
                    </div>
                    <p className="text-xs text-emerald-900 pl-8 leading-relaxed">
                      A Meta exibirá o token uma única vez (inicia com <code className="font-mono font-bold bg-white px-1 py-0.5 rounded text-emerald-800">EAAB...</code>). Copie e cadastre na variável de ambiente <code className="font-mono font-bold bg-white px-1 py-0.5 rounded text-emerald-800">WHATSAPP_TOKEN</code> no painel de Secrets.
                    </p>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* ========================================================
              ABA 3: PASSO 2: WHATSAPP_PHONE_NUMBER_ID
             ======================================================== */}
          {activeTab === 'phone_id' && (
            <div className="space-y-6">
              
              <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
                <Phone className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-950 space-y-1">
                  <p className="font-bold text-sm">O que é o WHATSAPP_PHONE_NUMBER_ID?</p>
                  <p className="leading-relaxed">
                    É o <strong>identificador interno exclusivo</strong> que a Meta atribuiu ao número de WhatsApp da sua clínica (geralmente composto por 15 ou 16 dígitos numéricos).
                  </p>
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 font-medium">
                    🚨 <strong>Erro mais comum:</strong> Não coloque o número de telefone com código do país (ex: 5511999999999). A API da Meta rejeitará. Você precisa colocar o <strong>ID Numérico</strong> gerado no painel da Meta!
                  </div>
                </div>
              </div>

              {/* Passo a Passo */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Onde encontrar o Phone Number ID na Meta:
                </h3>

                <div className="space-y-3">
                  
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                        1
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">Acesse o Portal Meta for Developers</h4>
                    </div>
                    <p className="text-xs text-slate-600 pl-8 leading-relaxed">
                      Acesse <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-bold inline-flex items-center gap-1">developers.facebook.com/apps <ExternalLink className="w-3 h-3" /></a> e clique no aplicativo empresarial da sua clínica.
                    </p>
                  </div>

                  <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                        2
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">Acesse WhatsApp &gt; Configuração da API (API Setup)</h4>
                    </div>
                    <p className="text-xs text-slate-600 pl-8 leading-relaxed">
                      No menu lateral esquerdo do aplicativo, clique na seta ao lado de <strong>WhatsApp</strong> e clique em <strong>Configuração da API</strong> (ou <em>API Setup</em>).
                    </p>
                  </div>

                  <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                        3
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">Localize o campo "Identificação do número de telefone"</h4>
                    </div>
                    <p className="text-xs text-slate-600 pl-8 leading-relaxed">
                      Logo abaixo de <em>"Etapa 1: Selecionar números de telefone"</em>, você verá dois campos importantes:
                    </p>
                    <div className="ml-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                        <p className="font-bold text-emerald-800 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Campo Correto a Copiar:
                        </p>
                        <p className="font-mono text-emerald-950 font-bold">Identificação do número de telefone</p>
                        <p className="text-[11px] text-emerald-700">(Exemplo: <span className="font-mono">105938472910394</span>)</p>
                      </div>

                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                        <p className="font-bold text-rose-800 flex items-center gap-1">
                          <X className="w-3.5 h-3.5" /> Não confunda com:
                        </p>
                        <p className="font-mono text-rose-950">ID da conta do WhatsApp Business</p>
                        <p className="text-[11px] text-rose-700">(Este é o ID da conta mãe, não do telefone)</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl shadow-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs font-bold">
                        4
                      </span>
                      <h4 className="font-bold text-blue-950 text-sm">Copie e Cole no AI Studio Secrets</h4>
                    </div>
                    <p className="text-xs text-blue-900 pl-8 leading-relaxed">
                      Cole esse ID numérico como valor da variável <code className="font-mono font-bold bg-white px-1 py-0.5 rounded text-blue-800">WHATSAPP_PHONE_NUMBER_ID</code> no painel de Secrets.
                    </p>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* ========================================================
              ABA 4: PASSO 3: WEBHOOK & WHATSAPP_VERIFY_TOKEN
             ======================================================== */}
          {activeTab === 'webhook' && (
            <div className="space-y-6">
              
              {onOpenWebhookGuide && (
                <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-4 rounded-2xl text-white flex items-center justify-between gap-3 flex-wrap shadow-md border border-indigo-500/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-400/30">
                      <Webhook className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-white">Guia Dedicado do Webhook (server/whatsapp.ts)</h4>
                      <p className="text-[11px] text-slate-300">Explicação aprofundada dos endpoints expostos, simulação de handshake e suporte a ngrok</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenWebhookGuide}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                  >
                    <span>Abrir Guia do Webhook</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 flex items-start gap-3">
                <Webhook className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-950 space-y-1">
                  <p className="font-bold text-sm">Para que serve o Webhook e o WHATSAPP_VERIFY_TOKEN?</p>
                  <p className="leading-relaxed">
                    O Webhook é o canal onde a Meta notifica o servidor do sistema toda vez que um paciente <strong>responde a um lembrete</strong> (por exemplo digitando <code className="bg-indigo-100 px-1 py-0.2 rounded font-bold">1</code> para confirmar consulta ou <code className="bg-indigo-100 px-1 py-0.2 rounded font-bold">2</code> para remarcar) ou envia uma mensagem de dúvida respondida automaticamente pela inteligência artificial.
                  </p>
                  <p className="leading-relaxed">
                    O <strong>WHATSAPP_VERIFY_TOKEN</strong> é uma chave secreta que você inventa para autenticar a conexão inicial entre a Meta e o servidor do aplicativo.
                  </p>
                </div>
              </div>

              {/* Dados Prontos para Copiar e Colar no Painel da Meta */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-600" />
                  Dados de Configuração para o Webhook na Meta
                </h3>

                <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-4">
                  
                  {/* URL do Webhook */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300">
                        1. URL de Retorno de Chamada (Callback URL):
                      </label>
                      <button
                        type="button"
                        onClick={() => handleCopy(calculatedWebhookUrl, 'webhook_url')}
                        className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        {copiedKey === 'webhook_url' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === 'webhook_url' ? 'Copiado!' : 'Copiar URL'}</span>
                      </button>
                    </div>
                    <div className="p-2.5 bg-black/60 rounded-xl border border-slate-700/80 font-mono text-xs text-emerald-300 break-all select-all flex items-center justify-between gap-2">
                      <span>{calculatedWebhookUrl}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Cole exatamente esta URL no campo "URL de Retorno de Chamada" na configuração do Webhook da Meta.
                    </p>
                  </div>

                  {/* Verify Token */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300">
                        2. Token de Verificação (Verify Token):
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleGenerateRandomToken}
                          className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                          title="Gerar nova chave aleatória"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Gerar Novo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy(generatedVerifyToken, 'verify_token_value')}
                          className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          {copiedKey === 'verify_token_value' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedKey === 'verify_token_value' ? 'Copiado!' : 'Copiar Token'}</span>
                        </button>
                      </div>
                    </div>
                    <div className="p-2.5 bg-black/60 rounded-xl border border-slate-700/80 font-mono text-xs text-indigo-300 break-all select-all">
                      {generatedVerifyToken}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Cadastre este valor como o segredo <code className="text-indigo-300 font-mono">WHATSAPP_VERIFY_TOKEN</code> no AI Studio E cole exatamente igual no painel da Meta.
                    </p>
                  </div>

                </div>
              </div>

              {/* Como Ativar na Meta */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Passo a Passo na Meta for Developers:
                </h3>

                <div className="space-y-3">
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
                    <p className="font-bold text-slate-900 text-xs">
                      1. Vá em WhatsApp &gt; Configuração (Configuration) no menu lateral
                    </p>
                    <p className="text-xs text-slate-600">
                      Localize a seção <strong>Webhook</strong> e clique no botão <strong>"Editar"</strong>.
                    </p>
                  </div>

                  <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
                    <p className="font-bold text-slate-900 text-xs">
                      2. Cole a URL de Retorno de Chamada e o Token de Verificação
                    </p>
                    <p className="text-xs text-slate-600">
                      Clique em <strong>"Verificar e Salvar"</strong>. O servidor responderá imediatamente confirmando o handshake da Meta.
                    </p>
                  </div>

                  <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
                    <p className="font-bold text-slate-900 text-xs">
                      3. Assine o campo obrigatório de mensagens (messages)
                    </p>
                    <p className="text-xs text-slate-600">
                      Em <em>"Campos do Webhook"</em>, clique em <strong>Gerenciar</strong> e marque a caixa de seleção:
                    </p>
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg font-mono text-emerald-800 text-xs font-bold inline-block">
                      ✅ messages (Mensagens Recebidas e Atualizações de Status)
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================
              ABA 5: FAQ & PERGUNTAS FREQUENTES
             ======================================================== */}
          {activeTab === 'faq' && (
            <div className="space-y-4">
              
              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-purple-600" />
                  Por que meus disparos pararam de funcionar de repente após 24 horas?
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Provavelmente você utilizou o <strong>Token Temporário de Teste</strong> fornecido na tela inicial da Meta, que tem validade de exatamente 24 horas. Siga os passos da aba <strong>"2. Como Obter WHATSAPP_TOKEN"</strong> para gerar um token de Usuário do Sistema (System User Token) sem prazo de validade.
                </p>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-purple-600" />
                  Posso usar o meu número comercial já existente na clínica?
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sim! No entanto, a Meta exige que um número vinculado à WhatsApp Cloud API não esteja ativo simultaneamente no aplicativo WhatsApp tradicional no smartphone. No painel da Meta, adicione o seu número em <em>WhatsApp &gt; Configuração da API &gt; Adicionar Número de Telefone</em> e faça a verificação por SMS ou chamada de voz.
                </p>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-purple-600" />
                  Como os números de telefone brasileiros devem ser cadastrados?
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  O sistema normaliza e formata automaticamente todos os telefones de pacientes antes do envio, adicionando o DDI internacional do Brasil (<strong>55</strong>) e removendo traços, parênteses e espaços. Exemplo: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">(11) 98765-4321</code> é convertido para <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-800">5511987654321</code>.
                </p>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-purple-600" />
                  A WhatsApp Cloud API da Meta tem custos?
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  A Meta disponibiliza <strong>1.000 conversas gratuitas por mês</strong> iniciadas pelo usuário/paciente para cada conta do WhatsApp Business. As mensagens de modelos para disparos ativos em massa fora da janela de 24 horas utilizam a tarifação padrão da Meta por categoria (marketing, utilidade ou autenticação).
                </p>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-2">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-purple-600" />
                  O que fazer se a clínica ainda não tiver a API da Meta configurada?
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Você não fica impedido de enviar mensagens! O sistema possui a modalidade alternativa <strong>"WhatsApp Web / Fila Sequencial com 1 Clique"</strong>, permitindo que a equipe envie os lembretes da agenda e campanhas diretamente pelo navegador WhatsApp Web com o texto totalmente pré-preenchido e personalizado para cada paciente.
                </p>
              </div>

            </div>
          )}

        </div>

        {/* Rodapé com Ações Rápidas */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Dados mantidos em segurança no servidor criptografado</span>
          </div>

          {onClose && (
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Fechar Guia
              </button>
            </div>
          )}
        </div>

      </div>
  );
};

export const WhatsAppCloudApiConfigModal: React.FC<WhatsAppCloudApiConfigModalProps> = ({
  isOpen,
  onClose,
  showToast,
  onOpenWebhookGuide,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col">
        <WhatsAppCloudApiConfigGuide
          showToast={showToast}
          onClose={onClose}
          isModal={true}
          onOpenWebhookGuide={onOpenWebhookGuide}
        />
      </div>
    </div>
  );
};
