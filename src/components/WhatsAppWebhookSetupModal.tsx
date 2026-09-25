import React, { useState, useEffect } from 'react';
import {
  X,
  Webhook,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Server,
  Zap,
  CheckCircle2,
  RefreshCw,
  Terminal,
  HelpCircle,
  ArrowRight,
  Code2,
  MessageSquare,
  Lock,
  Globe,
  Radio,
  FileCheck
} from 'lucide-react';

interface WhatsAppWebhookSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const WhatsAppWebhookSetupModal: React.FC<WhatsAppWebhookSetupModalProps> = ({
  isOpen,
  onClose,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'passo_a_passo' | 'arquitetura' | 'ambiente_local' | 'testador' | 'troubleshooting'>('passo_a_passo');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // Status do servidor
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [verifyToken, setVerifyToken] = useState<string>('');
  const [hasVerifyToken, setHasVerifyToken] = useState<boolean>(false);
  const [serverWebhookUrl, setServerWebhookUrl] = useState<string>('');

  // Testador de handshake
  const [testingHandshake, setTestingHandshake] = useState(false);
  const [handshakeResult, setHandshakeResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);

  // URL pública do webhook baseada na origem atual
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const detectedWebhookUrl = serverWebhookUrl || `${currentOrigin}/api/whatsapp/webhook`;
  const defaultSuggestedToken = 'aura_clinica_meta_webhook_2025';

  const fetchServerStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch('/api/whatsapp/status');
      if (res.ok) {
        const data = await res.json();
        setHasVerifyToken(Boolean(data.hasVerifyToken));
        if (data.webhookUrl) {
          setServerWebhookUrl(data.webhookUrl);
        }
      }
    } catch (err) {
      console.error('Erro ao verificar status do servidor:', err);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchServerStatus();
    }
  }, [isOpen]);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    showToast?.(`${fieldName} copiado com sucesso!`, 'success');
    setTimeout(() => {
      setCopiedField(null);
    }, 2500);
  };

  // Simulação de handshake Meta -> GET /api/whatsapp/webhook
  const runHandshakeTest = async () => {
    setTestingHandshake(true);
    setHandshakeResult(null);
    const tokenToTest = verifyToken.trim() || defaultSuggestedToken;
    const challengeTest = `challenge_meta_${Date.now().toString(36)}`;

    try {
      const res = await fetch(`/api/whatsapp/webhook?hub.mode=subscribe&hub.challenge=${challengeTest}&hub.verify_token=${encodeURIComponent(tokenToTest)}`);
      const responseText = await res.text();

      if (res.status === 200 && responseText === challengeTest) {
        setHandshakeResult({
          success: true,
          message: 'Handshake verificado com sucesso pelo server/whatsapp.ts!',
          details: `O endpoint respondeu com status HTTP 200 e ecoou o challenge "${challengeTest}" perfeitamente. A Meta aceitará esta validação sem erros.`
        });
      } else if (res.status === 403) {
        setHandshakeResult({
          success: false,
          message: 'Erro 403 Forbidden: O token informado não confere.',
          details: `O servidor esperava a variável de ambiente WHATSAPP_VERIFY_TOKEN idêntica à informada. Verifique se configurou WHATSAPP_VERIFY_TOKEN no painel de Secrets.`
        });
      } else {
        setHandshakeResult({
          success: false,
          message: `O endpoint retornou status ${res.status}.`,
          details: `Resposta do servidor: ${responseText || 'Sem corpo na resposta'}.`
        });
      }
    } catch (err: any) {
      setHandshakeResult({
        success: false,
        message: 'Falha ao conectar ao endpoint local.',
        details: err?.message || 'Verifique se o servidor Node.js/Express está em execução.'
      });
    } finally {
      setTestingHandshake(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-4xl overflow-hidden my-6 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-400/30 shadow-inner">
              <Webhook className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  Como Configurar o Webhook da WhatsApp Cloud API na Meta
                </h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-semibold">
                  server/whatsapp.ts
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Instruções passo a passo para expor os endpoints HTTP e validá-los no Meta for Developers Console
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas de Navegação */}
        <div className="bg-slate-50 border-b border-slate-200/80 px-4 sm:px-6 flex items-center gap-2 overflow-x-auto py-2.5 shrink-0 text-xs scrollbar-thin">
          <button
            onClick={() => setActiveTab('passo_a_passo')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'passo_a_passo'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>1. Passo a Passo no Console Meta</span>
          </button>

          <button
            onClick={() => setActiveTab('arquitetura')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'arquitetura'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>2. Por Que Expor server/whatsapp.ts?</span>
          </button>

          <button
            onClick={() => setActiveTab('ambiente_local')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ambiente_local'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>3. Nuvem vs Localhost (ngrok)</span>
          </button>

          <button
            onClick={() => setActiveTab('testador')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'testador'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>4. Testador de Handshake</span>
          </button>

          <button
            onClick={() => setActiveTab('troubleshooting')}
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'troubleshooting'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-rose-500" />
            <span>5. Solução de Problemas</span>
          </button>
        </div>

        {/* Conteúdo Dinâmico */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6 text-xs sm:text-sm">

          {/* ========================================================================= */}
          {/* ABA 1: PASSO A PASSO NA META */}
          {/* ========================================================================= */}
          {activeTab === 'passo_a_passo' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Banner Resumo de Valores a Preencher */}
              <div className="bg-gradient-to-br from-indigo-50 via-slate-50 to-indigo-50/50 p-4 sm:p-5 rounded-2xl border border-indigo-200/80 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-indigo-950 font-bold">
                    <Radio className="w-4 h-4 text-indigo-600 animate-pulse" />
                    <span>Dados Prontos para Preencher no Painel da Meta:</span>
                  </div>
                  <a
                    href="https://developers.facebook.com/apps"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs hover:shadow-xs transition"
                  >
                    <span>Abrir Meta for Developers</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Callback URL */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      1. URL de Retorno de Chamada (Callback URL)
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={detectedWebhookUrl}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-[11px] text-slate-800 font-semibold focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopy(detectedWebhookUrl, 'URL de Retorno')}
                        className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        {copiedField === 'URL de Retorno' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copiar</span>
                      </button>
                    </div>
                  </div>

                  {/* Verify Token */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      2. Verificar Token (Verify Token)
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={defaultSuggestedToken}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-[11px] text-slate-800 font-semibold focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopy(defaultSuggestedToken, 'Verificar Token')}
                        className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        {copiedField === 'Verificar Token' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copiar</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 bg-white/70 p-2 rounded-lg border border-slate-200/70">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Certifique-se de que a variável <strong>WHATSAPP_VERIFY_TOKEN</strong> no painel de Secrets do AI Studio possui o mesmo valor exato.
                  </span>
                </div>
              </div>

              {/* Roteiro Passo a Passo Visual */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wide flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-600" />
                  <span>Passo a Passo Detalhado no Meta for Developers</span>
                </h4>

                {/* Passo 1 */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-start gap-3.5 hover:border-slate-300 transition">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div className="space-y-1 flex-1">
                    <h5 className="font-bold text-slate-900 text-sm">Acesse o seu Aplicativo na Meta</h5>
                    <p className="text-slate-600 text-xs">
                      Entre em <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline font-semibold">developers.facebook.com/apps</a>, faça login com sua conta do Facebook e selecione o Aplicativo do tipo <strong>Empresa / WhatsApp</strong> criado para a clínica.
                    </p>
                  </div>
                </div>

                {/* Passo 2 */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-start gap-3.5 hover:border-slate-300 transition">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div className="space-y-1 flex-1">
                    <h5 className="font-bold text-slate-900 text-sm">Navegue até WhatsApp ➔ Configuração</h5>
                    <p className="text-slate-600 text-xs">
                      No menu lateral esquerdo, localize o produto <strong>WhatsApp</strong> e clique em <strong>Configuração (Configuration)</strong>.
                    </p>
                  </div>
                </div>

                {/* Passo 3 */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-start gap-3.5 hover:border-slate-300 transition">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    3
                  </span>
                  <div className="space-y-1 flex-1">
                    <h5 className="font-bold text-slate-900 text-sm">Role até a seção Webhook e clique em "Editar"</h5>
                    <p className="text-slate-600 text-xs">
                      No card intitulado <strong>Webhook</strong>, clique no botão <strong>Editar (Edit)</strong> para abrir o modal de configuração de URL.
                    </p>
                  </div>
                </div>

                {/* Passo 4 */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-start gap-3.5 hover:border-slate-300 transition">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    4
                  </span>
                  <div className="space-y-1 flex-1">
                    <h5 className="font-bold text-slate-900 text-sm">Cole a URL de Retorno de Chamada e o Token de Verificação</h5>
                    <p className="text-slate-600 text-xs">
                      No campo <strong>URL de retorno de chamada (Callback URL)</strong>, cole a URL pública do seu servidor terminando em <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-mono font-bold">/api/whatsapp/webhook</code>.
                      <br />
                      No campo <strong>Verificar token (Verify Token)</strong>, informe a senha secreta definida em <strong>WHATSAPP_VERIFY_TOKEN</strong>.
                    </p>
                  </div>
                </div>

                {/* Passo 5 */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-start gap-3.5 hover:border-slate-300 transition">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    5
                  </span>
                  <div className="space-y-1 flex-1">
                    <h5 className="font-bold text-slate-900 text-sm">Clique em "Verificar e Salvar" (Verify and Save)</h5>
                    <p className="text-slate-600 text-xs">
                      A Meta disparará imediatamente uma requisição <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-mono font-bold">GET</code> para o seu servidor. O arquivo <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono font-bold">server/whatsapp.ts</code> valida o token e responde o challenge com código HTTP 200 em milissegundos.
                    </p>
                  </div>
                </div>

                {/* Passo 6 (CRÍTICO) */}
                <div className="p-4 bg-amber-50/80 rounded-2xl border-2 border-amber-300 shadow-xs flex items-start gap-3.5">
                  <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    6
                  </span>
                  <div className="space-y-1 flex-1">
                    <h5 className="font-bold text-amber-950 text-sm flex items-center gap-1.5">
                      <span>PASSO OBRIGATÓRIO: Assinar o campo "messages"</span>
                      <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-bold">Crítico</span>
                    </h5>
                    <p className="text-amber-900 text-xs leading-relaxed">
                      Após salvar o webhook, clique no botão <strong>Gerenciar campos (Manage fields)</strong> logo abaixo da URL do Webhook.
                      <br />
                      Localize a linha <strong>messages</strong>, clique em <strong>Assinar (Subscribe)</strong> e depois em Concluir.
                      <br />
                      <strong className="text-amber-950 underline">Sem assinar este campo, a Meta aceita o webhook mas nunca envia as mensagens dos clientes para o robô!</strong>
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ABA 2: ARQUITETURA E EXPLICAÇÃO */}
          {/* ========================================================================= */}
          {activeTab === 'arquitetura' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              <div className="bg-slate-900 text-white p-5 rounded-3xl space-y-4 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-400/30">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">
                      Por que precisamos expor os endpoints de server/whatsapp.ts?
                    </h4>
                    <p className="text-xs text-slate-300">
                      Entenda como a arquitetura em tempo real da Meta se comunica com o seu servidor Express
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Diferente de consultas comuns onde seu aplicativo vai até a Meta buscar dados, o <strong>WhatsApp funciona de forma orientada a eventos (Webhooks)</strong>. Quando um cliente envia uma mensagem ou confirma uma consulta, a Meta precisa disparar um aviso imediato para o seu servidor.
                </p>
              </div>

              {/* Diagrama de Funcionamento */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
                <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Radio className="w-4 h-4 text-indigo-600" />
                  <span>Fluxo de Comunicação Bidirecional:</span>
                </h5>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5 text-indigo-700">
                      <MessageSquare className="w-4 h-4" />
                      <span>1. Cliente Envia Mensagem</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      O paciente responde *"1"* confirmando presença no agendamento ou pergunta sobre preços de procedimentos.
                    </p>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-indigo-200 shadow-2xs space-y-1.5">
                    <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                      <Webhook className="w-4 h-4 text-indigo-600" />
                      <span>2. Meta Dispara POST Webhook</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      A Meta envia uma requisição HTTPS POST para <code className="text-indigo-600 font-mono font-bold">/api/whatsapp/webhook</code> com os dados do remetente e o texto.
                    </p>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-2xs space-y-1.5">
                    <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>3. server/whatsapp.ts Responde</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">
                      A função <code className="font-mono font-bold text-emerald-700">handleWhatsAppWebhookReceive</code> confirma a presença na agenda do Firestore e envia a resposta de agradecimento.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabela dos 3 Endpoints Implementados */}
              <div className="space-y-3">
                <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Os 3 Endpoints Implementados em server/whatsapp.ts:
                </h5>

                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-200 bg-white">
                  
                  {/* GET Webhook */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">GET</span>
                        <span className="font-bold text-slate-900">/api/whatsapp/webhook</span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500">Handshake Inicial com a Meta</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      <strong>Função:</strong> <code className="font-mono font-bold text-indigo-600">handleWhatsAppWebhookVerify(req, res)</code>.
                      <br />
                      A Meta envia parâmetros <code className="font-mono text-slate-700">hub.mode=subscribe</code>, <code className="font-mono text-slate-700">hub.verify_token</code> e <code className="font-mono text-slate-700">hub.challenge</code>. O servidor confere o token e ecoa o challenge. Se esse endpoint não existir ou falhar, a Meta <strong>recusa o cadastro da URL</strong>.
                    </p>
                  </div>

                  {/* POST Webhook */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">POST</span>
                        <span className="font-bold text-slate-900">/api/whatsapp/webhook</span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500">Recebimento de Mensagens e Respostas</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      <strong>Função:</strong> <code className="font-mono font-bold text-indigo-600">handleWhatsAppWebhookReceive(req, res)</code>.
                      <br />
                      Recebe as mensagens digitadas pelos pacientes, executa o menu interativo (opção 1 = confirmar consulta, opção 2 = remarcar, opção 3 = pedir produtos/home care) e salva o histórico no banco de dados.
                    </p>
                  </div>

                  {/* POST Send */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-bold">POST</span>
                        <span className="font-bold text-slate-900">/api/whatsapp/send</span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500">Envio Interno de Mensagens</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      <strong>Função:</strong> <code className="font-mono font-bold text-indigo-600">enviarMensagemWhatsApp(telefone, texto)</code>.
                      <br />
                      Dispara lembretes de agendamentos, mensagens de pós-atendimento e promoções da clínica chamando diretamente a Graph API da Meta via token de autorização Bearer.
                    </p>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* ABA 3: AMBIENTE LOCAL VS NUVEM */}
          {/* ========================================================================= */}
          {activeTab === 'ambiente_local' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Nuvem / AI Studio */}
                <div className="p-5 bg-gradient-to-br from-emerald-50/80 to-slate-50 rounded-2xl border-2 border-emerald-300 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
                    <Globe className="w-5 h-5 text-emerald-600" />
                    <span>Ambiente em Nuvem (Cloud Run / AI Studio)</span>
                  </div>
                  <div className="text-xs text-slate-700 space-y-2 leading-relaxed">
                    <p>
                      Na nuvem do AI Studio ou em produção (Cloud Run, Vercel, VPS), seu aplicativo já possui um domínio <strong>público na internet</strong> com certificado SSL/HTTPS válido.
                    </p>
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-200 space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Sua URL Pública Atual:</span>
                      <code className="text-xs font-mono font-bold text-emerald-800 break-all block">
                        {detectedWebhookUrl}
                      </code>
                    </div>
                    <p className="text-emerald-800 font-medium">
                      Basta copiar essa URL e colar diretamente no painel de Webhooks da Meta! Não necessita de ngrok ou ferramentas extras.
                    </p>
                  </div>
                </div>

                {/* Localhost */}
                <div className="p-5 bg-gradient-to-br from-indigo-50/80 to-slate-50 rounded-2xl border-2 border-indigo-300 shadow-xs space-y-3">
                  <div className="flex items-center gap-2 text-indigo-950 font-bold text-sm">
                    <Terminal className="w-5 h-5 text-indigo-600" />
                    <span>Ambiente Local (Desenvolvimento em Máquina)</span>
                  </div>
                  <div className="text-xs text-slate-700 space-y-2 leading-relaxed">
                    <p>
                      Se estiver rodando o servidor no seu computador (<code className="bg-slate-200 px-1 py-0.5 rounded font-mono font-bold text-slate-800">localhost:3000</code>), <strong>a Meta não consegue acessar seu PC diretamente</strong>.
                    </p>
                    <p>
                      Você precisa de um túnel seguro (tunnel) para gerar uma URL pública HTTPS temporária.
                    </p>
                    <div className="bg-slate-900 text-slate-200 p-2.5 rounded-xl font-mono text-[11px] space-y-1">
                      <span className="text-slate-400 text-[10px] block"># Execute no seu terminal:</span>
                      <code className="text-emerald-400 block font-bold">npx ngrok http 3000</code>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      O ngrok gerará uma URL como <code className="text-indigo-600 font-mono font-bold">https://abc123.ngrok-free.app</code>. O seu webhook na Meta será: <code className="text-indigo-600 font-mono font-bold">https://abc123.ngrok-free.app/api/whatsapp/webhook</code>.
                    </p>
                  </div>
                </div>

              </div>

              {/* Dicas de Segurança e Requisitos da Meta */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <h5 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                  <Lock className="w-4 h-4 text-indigo-600" />
                  <span>Requisitos de Rede Exigidos pela Meta:</span>
                </h5>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li><strong>Obrigatório HTTPS:</strong> A Meta rejeita conexões HTTP sem criptografia SSL.</li>
                  <li><strong>Porta Padrão:</strong> A URL deve responder na porta padrão 443 (HTTPS).</li>
                  <li><strong>Tempo de Resposta Rápido:</strong> O handshake deve responder em menos de 5 segundos (o <code className="font-mono text-slate-800">server/whatsapp.ts</code> responde em menos de 10ms).</li>
                </ul>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* ABA 4: TESTADOR DE HANDSHAKE */}
          {/* ========================================================================= */}
          {activeTab === 'testador' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        Testador Interativo de Handshake (Simulação Meta)
                      </h4>
                      <p className="text-xs text-slate-500">
                        Simula exatamente a chamada GET que a Meta fará quando você clicar em "Verificar e Salvar".
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={runHandshakeTest}
                    disabled={testingHandshake}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {testingHandshake ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Validando...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Disparar Teste de Handshake</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                      Token a Testar:
                    </label>
                    <input
                      type="text"
                      value={verifyToken}
                      onChange={(e) => setVerifyToken(e.target.value)}
                      placeholder={`Padrão: ${defaultSuggestedToken}`}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                      Endpoint Alvo:
                    </label>
                    <input
                      type="text"
                      readOnly
                      value="/api/whatsapp/webhook"
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono text-slate-600 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Resultado do Teste */}
                {handshakeResult && (
                  <div className={`p-4 rounded-xl border mt-3 space-y-1 animate-in fade-in duration-150 ${
                    handshakeResult.success
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-rose-50 border-rose-300 text-rose-950'
                  }`}>
                    <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                      {handshakeResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span>{handshakeResult.message}</span>
                    </div>
                    {handshakeResult.details && (
                      <p className="text-xs opacity-90 pl-6 leading-relaxed">
                        {handshakeResult.details}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Status do Servidor Real */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Diagnóstico das Variáveis no Servidor:
                  </span>
                  <button
                    type="button"
                    onClick={fetchServerStatus}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingStatus ? 'animate-spin' : ''}`} />
                    <span>Recarregar</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className={`w-2.5 h-2.5 rounded-full ${hasVerifyToken ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span className="font-semibold text-slate-700">
                    WHATSAPP_VERIFY_TOKEN no Servidor:
                  </span>
                  <span className={`font-mono text-[11px] px-2 py-0.5 rounded font-bold ${
                    hasVerifyToken ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {hasVerifyToken ? 'Configurado no Ambiente' : 'Não configurado (Usará token padrão em desenvolvimento)'}
                  </span>
                </div>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* ABA 5: TROUBLESHOOTING / ERROS COMUNS */}
          {/* ========================================================================= */}
          {activeTab === 'troubleshooting' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-rose-900 text-xs sm:text-sm">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Erro: "A URL de retorno de chamada não pôde ser validada"</span>
                </div>
                <p className="text-xs text-rose-800 leading-relaxed pl-6">
                  <strong>Causas mais comuns:</strong>
                  <br />• O valor digitado no campo <em>Verificar token</em> da Meta está diferente do <em>WHATSAPP_VERIFY_TOKEN</em> definido nos Secrets do AI Studio.
                  <br />• O servidor estava reiniciando ou indisponível no momento em que você clicou no botão.
                  <br />• Foi informada uma URL com <em>http://</em> em vez de <em>https://</em>.
                </p>
              </div>

              <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-950 text-xs sm:text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Erro: "O webhook valida, mas o robô não recebe mensagens dos clientes"</span>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed pl-6">
                  <strong>Causa:</strong> Você salvou a URL do Webhook, mas esqueceu de <strong>assinar o campo "messages"</strong>. No painel da Meta, clique em <strong>Gerenciar campos</strong> na seção do Webhook e marque a caixa de seleção do evento <code className="bg-amber-200/80 px-1 py-0.5 rounded font-mono font-bold text-amber-950">messages</code>.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-xs sm:text-sm">
                  <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Posso alterar o Verify Token depois de configurado?</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed pl-6">
                  Sim! Basta alterar a variável <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-slate-800 font-bold">WHATSAPP_VERIFY_TOKEN</code> nos Secrets do AI Studio e clicar novamente em <strong>Editar</strong> no painel de Webhooks da Meta informando o novo valor correspondente.
                </p>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between flex-wrap gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Endpoints integrados em <code className="font-mono text-slate-800 font-bold">server/whatsapp.ts</code> e roteados em <code className="font-mono text-slate-800 font-bold">server.ts</code></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              Fechar Guia
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
