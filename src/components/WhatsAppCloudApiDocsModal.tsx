import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Hash, 
  Lock, 
  Copy, 
  Check, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Sparkles, 
  HelpCircle, 
  Server, 
  MessageSquare, 
  ArrowRight, 
  X, 
  Code, 
  Layers, 
  Send,
  Zap,
  Globe,
  Settings,
  Info,
  ShieldCheck
} from 'lucide-react';

interface WhatsAppStatusResponse {
  configurado: boolean;
  hasToken: boolean;
  hasPhoneNumberId: boolean;
  hasVerifyToken: boolean;
  phoneNumberIdMasked: string | null;
  tokenMasked: string | null;
  verifyTokenMasked: string | null;
  apiVersion?: string;
  error?: string;
}

interface WhatsAppCloudApiDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const WhatsAppCloudApiDocsModal: React.FC<WhatsAppCloudApiDocsModalProps> = ({
  isOpen,
  onClose,
  showToast
}) => {
  const [activeTab, setActiveTab] = useState<'passo_a_passo' | 'secrets' | 'webhook' | 'teste_diagnostico' | 'faq'>('passo_a_passo');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [status, setStatus] = useState<WhatsAppStatusResponse | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  // Gerador de token de verificação sugerido
  const [suggestedVerifyToken, setSuggestedVerifyToken] = useState('aura_meta_webhook_' + Math.random().toString(36).substring(2, 10));

  // Diagnóstico de teste de envio
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Olá! Este é um teste oficial de conexão da Clínica Aura Estética com a API Cloud do WhatsApp.');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ sucesso: boolean; mensagem: string; id?: string } | null>(null);

  const webhookUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/whatsapp/webhook`
    : 'https://seu-dominio.run.app/api/whatsapp/webhook';

  const fetchStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const res = await fetch('/api/whatsapp/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      } else {
        setStatus({
          configurado: false,
          hasToken: false,
          hasPhoneNumberId: false,
          hasVerifyToken: false,
          phoneNumberIdMasked: null,
          tokenMasked: null,
          verifyTokenMasked: null
        });
      }
    } catch {
      setStatus({
        configurado: false,
        hasToken: false,
        hasPhoneNumberId: false,
        hasVerifyToken: false,
        phoneNumberIdMasked: null,
        tokenMasked: null,
        verifyTokenMasked: null
      });
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    if (showToast) {
      showToast(`Copiado para a área de transferência!`, 'success');
    }
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  const handleSendTestMessage = async () => {
    if (!testPhone.trim()) {
      if (showToast) showToast('Por favor, informe o telefone com DDD para teste.', 'error');
      return;
    }

    setIsSendingTest(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telefone: testPhone,
          mensagem: testMessage
        })
      });

      const data = await res.json();

      if (res.ok && data.sucesso) {
        setTestResult({
          sucesso: true,
          mensagem: 'Mensagem enviada com sucesso pela Cloud API da Meta!',
          id: data.id
        });
        if (showToast) showToast('Mensagem de teste enviada com sucesso!', 'success');
      } else {
        setTestResult({
          sucesso: false,
          mensagem: data.error || 'A API da Meta rejeitou o envio. Verifique o token e as credenciais.'
        });
      }
    } catch (err: any) {
      setTestResult({
        sucesso: false,
        mensagem: err.message || 'Erro de rede ou servidor indisponível.'
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  if (!isOpen) return null;

  const envSnippet = `# Variáveis da API Oficial WhatsApp Cloud (Meta)
WHATSAPP_TOKEN="EAAB..."
WHATSAPP_PHONE_NUMBER_ID="108923485729103"
WHATSAPP_VERIFY_TOKEN="${suggestedVerifyToken}"
WHATSAPP_API_VERSION="v21.0"`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div 
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Cabeçalho do Modal */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 border-b border-slate-800 flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-emerald-400" />
                Meta Cloud API Oficial
              </span>
              <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Settings className="w-3 h-3" />
                AI Studio Secrets Panel
              </span>
            </div>
            <h2 id="modal-title" className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Como Obter e Configurar as Variáveis do WhatsApp Cloud API
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              Aprenda a cadastrar com precisão as credenciais da Meta no painel de Secrets do AI Studio para habilitar disparos em massa automáticos e o robô de agendamentos.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shrink-0"
            title="Fechar"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Status em Tempo Real */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-600">Status no AI Studio:</span>
            {isLoadingStatus ? (
              <span className="inline-flex items-center gap-1.5 text-slate-500 font-medium">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verificando ambiente...
              </span>
            ) : status?.configurado ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                API Conectada & Pronta
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-200">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                Pendente de Configuração no Secrets
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-600">
              <span className={status?.hasToken ? 'text-emerald-700 font-bold' : 'text-slate-400 line-through'}>
                WHATSAPP_TOKEN {status?.hasToken ? '✓' : '✗'}
              </span>
              <span className="text-slate-300">|</span>
              <span className={status?.hasPhoneNumberId ? 'text-emerald-700 font-bold' : 'text-slate-400 line-through'}>
                PHONE_NUMBER_ID {status?.hasPhoneNumberId ? '✓' : '✗'}
              </span>
              <span className="text-slate-300">|</span>
              <span className={status?.hasVerifyToken ? 'text-emerald-700 font-bold' : 'text-slate-400 line-through'}>
                VERIFY_TOKEN {status?.hasVerifyToken ? '✓' : '✗'}
              </span>
            </div>

            <button
              type="button"
              onClick={fetchStatus}
              disabled={isLoadingStatus}
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Recarregar status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStatus ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Abas de Navegação Interna */}
        <div className="flex items-center gap-1 px-5 sm:px-6 pt-3 border-b border-slate-200 overflow-x-auto scrollbar-none shrink-0 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('passo_a_passo')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border-b-2 -mb-px ${
              activeTab === 'passo_a_passo'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            1. Guia Meta for Developers
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('secrets')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border-b-2 -mb-px ${
              activeTab === 'secrets'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            2. As 3 Variáveis no AI Studio Secrets
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('webhook')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border-b-2 -mb-px ${
              activeTab === 'webhook'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            3. Webhook (Receber Mensagens)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('teste_diagnostico')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border-b-2 -mb-px ${
              activeTab === 'teste_diagnostico'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            4. Teste de Diagnóstico em Tempo Real
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('faq')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border-b-2 -mb-px ${
              activeTab === 'faq'
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Perguntas & Resolução de Erros
          </button>
        </div>

        {/* Corpo com Scroll */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 text-sm">

          {/* =========================================================
              ABA 1: PASSO A PASSO NA META DEVELOPERS
             ========================================================= */}
          {activeTab === 'passo_a_passo' && (
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed text-emerald-950">
                  <p className="font-bold mb-1">Por que usar a API Oficial da Meta (Cloud API)?</p>
                  <p>
                    A API Oficial permite envio instantâneo e silencioso em segundo plano, sem necessidade de deixar o WhatsApp Web aberto na tela, além de permitir receber as respostas dos clientes e confirmar agendamentos automaticamente no banco de dados.
                  </p>
                </div>
              </div>

              {/* Stepper de 4 passos */}
              <div className="space-y-4">
                {/* Passo 1 */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs hover:border-slate-300 transition-colors">
                  <div className="flex items-start gap-3.5">
                    <span className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      1
                    </span>
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                          Acesse o Portal Meta for Developers e Crie um App
                        </h3>
                        <a 
                          href="https://developers.facebook.com/apps" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                        >
                          Abrir developers.facebook.com <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Faça login com a sua conta do Facebook. Clique em <strong>"Meus Aplicativos"</strong> &gt; <strong>"Criar Aplicativo"</strong>. 
                        Na categoria do app, selecione <strong>"Outro"</strong> e depois escolha o tipo <strong>"Empresa" (Business)</strong>. Dê um nome amigável como <em>"Clinica Aura WhatsApp"</em>.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Passo 2 */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs hover:border-slate-300 transition-colors">
                  <div className="flex items-start gap-3.5">
                    <span className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      2
                    </span>
                    <div className="space-y-2 flex-1">
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                        Adicione o Produto "WhatsApp" ao Aplicativo
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        No painel do aplicativo criado, role até a lista de produtos disponíveis, localize o card do <strong>"WhatsApp"</strong> e clique em <strong>"Configurar"</strong>. 
                        A Meta disponibilizará imediatamente um número de teste oficial e o painel "Configuração da API".
                      </p>
                    </div>
                  </div>
                </div>

                {/* Passo 3 */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs hover:border-slate-300 transition-colors">
                  <div className="flex items-start gap-3.5">
                    <span className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      3
                    </span>
                    <div className="space-y-2 flex-1">
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                        Copie a "Identificação do Número de Telefone" (Phone Number ID)
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        No menu lateral esquerdo, clique em <strong>WhatsApp &gt; Configuração da API</strong>. 
                        Na seção "Enviar e receber mensagens", você verá o campo:
                      </p>
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3 text-xs">
                        <div>
                          <p className="text-[11px] text-slate-500 font-medium">Campo exibido na tela da Meta:</p>
                          <p className="font-bold text-slate-900 font-mono">Identificação do número de telefone (Phone number ID)</p>
                          <p className="text-[10px] text-slate-400">Exemplo: 109283746501928 (sequência de 15 dígitos)</p>
                        </div>
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold rounded-md">
                          Vai para: WHATSAPP_PHONE_NUMBER_ID
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Passo 4 */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-2xs hover:border-slate-300 transition-colors">
                  <div className="flex items-start gap-3.5">
                    <span className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      4
                    </span>
                    <div className="space-y-3 flex-1">
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                        Obtenha o Token de Acesso (Token Permanente de Usuário do Sistema)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                          <span className="font-bold text-slate-800 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            Opção 1: Teste Rápido (24 Horas)
                          </span>
                          <p className="text-slate-600 leading-relaxed">
                            Na mesma página "Configuração da API", copie o <strong>"Token de acesso temporário"</strong>. Ele é gerado instantaneamente e serve para testar disparos hoje mesmo.
                          </p>
                        </div>

                        <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-1.5">
                          <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            Opção 2: Produção Definitiva (Nunca Expira)
                          </span>
                          <p className="text-emerald-950 leading-relaxed">
                            No <em>Meta Business Suite</em> &gt; <em>Configurações do Negócio</em> &gt; <em>Usuários do Sistema</em>. Adicione um usuário admin, atribua o ativo do WhatsApp e gere um token com as permissões <code className="bg-white px-1 py-0.5 rounded text-[10px] font-mono">whatsapp_business_messaging</code> e <code className="bg-white px-1 py-0.5 rounded text-[10px] font-mono">whatsapp_business_management</code>.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveTab('secrets')}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <span>Próximo: Cadastrar no AI Studio Secrets</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* =========================================================
              ABA 2: AS 3 VARIÁVEIS NO AI STUDIO SECRETS PANEL
             ========================================================= */}
          {activeTab === 'secrets' && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
                <Key className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-950 leading-relaxed">
                  <p className="font-bold mb-1">Onde configurar no AI Studio?</p>
                  <p>
                    No ambiente do AI Studio Build, clique no ícone de <strong>Configurações (Engrenagem)</strong> ou no menu <strong>Secrets / Variáveis de Ambiente</strong>. 
                    Adicione exatamente os 3 nomes abaixo (em caixa alta) com os respectivos valores obtidos na Meta.
                  </p>
                </div>
              </div>

              {/* Cards das 3 variáveis */}
              <div className="space-y-3.5">
                
                {/* 1. WHATSAPP_TOKEN */}
                <div className="bg-white border-2 border-slate-200 hover:border-emerald-500 rounded-xl p-4 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono text-xs font-bold">
                          WHATSAPP_TOKEN
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Obrigatório
                        </span>
                        {status?.hasToken && (
                          <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Detectado no ambiente
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600">
                        Token de autorização Bearer emitido pela Meta. Inicia geralmente com <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">EAAB...</code>.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy('WHATSAPP_TOKEN', 'var_token')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
                    >
                      {copiedKey === 'var_token' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" /> Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copiar Nome
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 2. WHATSAPP_PHONE_NUMBER_ID */}
                <div className="bg-white border-2 border-slate-200 hover:border-emerald-500 rounded-xl p-4 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono text-xs font-bold">
                          WHATSAPP_PHONE_NUMBER_ID
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Obrigatório
                        </span>
                        {status?.hasPhoneNumberId && (
                          <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Detectado: {status.phoneNumberIdMasked}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600">
                        Identificador numérico do número de telefone atribuído pela Meta (ex: <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">108923485729103</code>). <strong>Não</strong> coloque o número telefônico aqui.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy('WHATSAPP_PHONE_NUMBER_ID', 'var_phone_id')}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
                    >
                      {copiedKey === 'var_phone_id' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" /> Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copiar Nome
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* 3. WHATSAPP_VERIFY_TOKEN */}
                <div className="bg-white border-2 border-slate-200 hover:border-emerald-500 rounded-xl p-4 transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono text-xs font-bold">
                          WHATSAPP_VERIFY_TOKEN
                        </span>
                        <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                          Para Webhook
                        </span>
                        {status?.hasVerifyToken && (
                          <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Ativo
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600">
                        Senha secreta criada livremente por você para validar a autenticidade do Webhook que recebe mensagens e confirmações de consultas.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleCopy(suggestedVerifyToken, 'val_verify_token')}
                        className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        title="Copiar token gerado"
                      >
                        <Lock className="w-3 h-3" />
                        {copiedKey === 'val_verify_token' ? 'Copiado!' : 'Copiar Token Sugerido'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopy('WHATSAPP_VERIFY_TOKEN', 'var_verify_token')}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                      >
                        {copiedKey === 'var_verify_token' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" /> Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copiar Nome
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>Sugestão de valor seguro: <strong className="text-slate-800">{suggestedVerifyToken}</strong></span>
                    <button
                      type="button"
                      onClick={() => setSuggestedVerifyToken('aura_meta_webhook_' + Math.random().toString(36).substring(2, 10))}
                      className="text-indigo-600 hover:underline cursor-pointer"
                    >
                      Gerar outro código
                    </button>
                  </div>
                </div>

              </div>

              {/* Bloco .env pronto para copiar */}
              <div className="bg-slate-900 rounded-xl p-4 text-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-emerald-400" />
                    Formato .env Completo (Copiar Bloco)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(envSnippet, 'env_full')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedKey === 'env_full' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" /> Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copiar Todos
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3 bg-slate-950 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed border border-slate-800">
                  {envSnippet}
                </pre>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('passo_a_passo')}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Voltar ao Passo a Passo
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('webhook')}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <span>Próximo: Configurar o Webhook</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* =========================================================
              ABA 3: CONFIGURANDO O WEBHOOK NA META
             ========================================================= */}
          {activeTab === 'webhook' && (
            <div className="space-y-6">
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl flex items-start gap-3">
                <Globe className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div className="text-xs text-purple-950 leading-relaxed">
                  <p className="font-bold mb-1">Para que serve o Webhook?</p>
                  <p>
                    O Webhook conecta o número da clínica na Meta diretamente ao seu servidor. Quando o paciente responde <em>"1 - Confirmar presença"</em> ou faz um pedido no WhatsApp, a Meta chama automaticamente essa URL para atualizar o status na sua agenda!
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3">
                  <h3 className="font-bold text-slate-900 text-sm">
                    1. URL de Retorno de Chamada (Callback URL)
                  </h3>
                  <p className="text-xs text-slate-600">
                    No painel da Meta, acesse <strong>WhatsApp &gt; Configuração</strong> e clique em <strong>"Editar"</strong> no card de Webhook:
                  </p>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={webhookUrl}
                      className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 select-all"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(webhookUrl, 'webhook_url')}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
                    >
                      {copiedKey === 'webhook_url' ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copiar URL
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3">
                  <h3 className="font-bold text-slate-900 text-sm">
                    2. Token de Verificação (Verify Token)
                  </h3>
                  <p className="text-xs text-slate-600">
                    No campo "Token de verificação" ao lado da URL, insira o mesmo valor cadastrado na variável <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px] font-bold">WHATSAPP_VERIFY_TOKEN</code>:
                  </p>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={suggestedVerifyToken}
                      className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 select-all"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(suggestedVerifyToken, 'verify_token_webhook')}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
                    >
                      {copiedKey === 'verify_token_webhook' ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copiar Token
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-2">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    3. Ativar o Campo de Assinatura "messages"
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Após salvar a URL com sucesso, role até <strong>"Campos do Webhook"</strong>, clique em <strong>"Gerenciar"</strong> e marque a opção <strong>messages</strong> (Assinar). Isso garante que o bot receba os textos enviados pelos clientes.
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('secrets')}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Voltar aos Secrets
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('teste_diagnostico')}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <span>Testar Envio em Tempo Real</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* =========================================================
              ABA 4: TESTE DE DIAGNÓSTICO EM TEMPO REAL
             ========================================================= */}
          {activeTab === 'teste_diagnostico' && (
            <div className="space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-600" />
                  Simulador de Envio Direto via Cloud API
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Teste agora mesmo se a comunicação entre o servidor da sua clínica e a Meta está funcionando 100%. Insira um número de telefone com DDD para receber uma mensagem de validação.
                </p>
              </div>

              {!status?.configurado && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Variáveis não detectadas:</strong>
                    Você precisa definir <code className="font-mono font-bold">WHATSAPP_TOKEN</code> e <code className="font-mono font-bold">WHATSAPP_PHONE_NUMBER_ID</code> no painel de Secrets do AI Studio antes de disparar o teste.
                  </div>
                </div>
              )}

              <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Número de Telefone do Destinatário (com DDD):
                  </label>
                  <input
                    type="tel"
                    placeholder="Ex: 11987654321 ou (11) 98765-4321"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    * No modo de testes (sandbox) da Meta, certifique-se de que este número foi adicionado previamente na lista "Para" da página API Setup.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mensagem de Teste:
                  </label>
                  <textarea
                    rows={3}
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={fetchStatus}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Atualizar Status
                  </button>

                  <button
                    type="button"
                    onClick={handleSendTestMessage}
                    disabled={isSendingTest || !testPhone.trim()}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
                  >
                    {isSendingTest ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Disparando pela Meta...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Enviar Mensagem de Teste
                      </>
                    )}
                  </button>
                </div>

                {/* Retorno do Teste */}
                {testResult && (
                  <div className={`p-4 rounded-xl border text-xs space-y-1 ${
                    testResult.sucesso 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
                      : 'bg-red-50 border-red-200 text-red-950'
                  }`}>
                    <div className="flex items-center gap-2 font-bold">
                      {testResult.sucesso ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Envio bem-sucedido!</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <span>Falha no envio da mensagem:</span>
                        </>
                      )}
                    </div>
                    <p className="leading-relaxed">{testResult.mensagem}</p>
                    {testResult.id && (
                      <p className="font-mono text-[11px] text-emerald-700">Message ID Meta: {testResult.id}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* =========================================================
              ABA 5: FAQ & RESOLUÇÃO DE ERROS
             ========================================================= */}
          {activeTab === 'faq' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-emerald-600" />
                  "A mensagem não chegou no meu celular. O que pode ser?"
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Se você estiver usando o <strong>número de teste padrão da Meta</strong> (sandbox), a Meta exige por segurança que o número do destinatário seja cadastrado previamente na lista de telefones autorizados. No painel da Meta, em <em>WhatsApp &gt; Configuração da API &gt; etapa 1 (Enviar e receber mensagens)</em>, clique no seletor "Para" e adicione o seu número pessoal para receber o código SMS de liberação.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-emerald-600" />
                  "O token temporário expirou após 24 horas. Como deixo permanente?"
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Para não precisar gerar um token todo dia, acesse o <strong>Meta Business Suite &gt; Configurações do Negócio &gt; Usuários do Sistema</strong>. Crie um usuário com função de Administrador e clique em <em>"Gerar Novo Token"</em> marcando as permissões <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">whatsapp_business_messaging</code> e <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">whatsapp_business_management</code>. Esse token tem validade permanente (nunca expira).
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-emerald-600" />
                  "É obrigatório usar a API da Meta ou posso usar o WhatsApp Web?"
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <strong>Não é obrigatório!</strong> Se você preferir não configurar a API da Meta nem cadastrar cartão ou tokens, o sistema já possui a ferramenta integrada de <strong>Fila Sequencial do WhatsApp Web</strong> (disponível na aba "Lembretes da Agenda" e "Disparo em Massa"). Com ela, basta clicar em "Abrir Conversa" para disparar mensagens diretamente pelo navegador ou aplicativo WhatsApp do computador com custo zero.
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-emerald-600" />
                  "Como o robô sabe se o paciente confirmou a presença?"
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Quando o paciente digita o número <strong className="text-slate-900">1</strong> em resposta ao lembrete da clínica, o webhook recebe a resposta, busca o agendamento futuro mais próximo pelo número do telefone e altera automaticamente o status para <span className="text-emerald-700 font-bold">"Confirmado via WhatsApp"</span> na agenda!
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Rodapé com botão de fechar */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>As credenciais ficam seguras no ambiente de execução do servidor.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Concluir & Fechar Guia
          </button>
        </div>
      </div>
    </div>
  );
};
