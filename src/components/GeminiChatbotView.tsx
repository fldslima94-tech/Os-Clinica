import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  User, 
  Trash2, 
  Copy, 
  Check, 
  Zap, 
  BrainCircuit, 
  Stethoscope, 
  TrendingUp, 
  DollarSign, 
  HelpCircle, 
  RefreshCw,
  MessageSquare,
  Flame
} from 'lucide-react';
import { 
  callGeminiChat, 
  ChatMessage, 
  ChatRole, 
  ChatSpeedMode 
} from '../services/geminiService';
import { UsuarioEquipe } from '../types';

interface GeminiChatbotViewProps {
  currentUser: UsuarioEquipe;
}

const ROLES_INFO: Record<ChatRole, { label: string; icon: any; color: string; desc: string; samplePrompts: string[] }> = {
  clinical_consultant: {
    label: 'Consultor Clínico & Protocolos',
    icon: Stethoscope,
    color: 'bg-teal-500/10 text-teal-700 border-teal-200',
    desc: 'Protocolos de toxina botulínica, bioestimuladores, peelings químicos, harmonização e intercorrências.',
    samplePrompts: [
      'Qual o protocolo recomendado de preparo de pele para Peeling Químico em Fototipo IV?',
      'Indicações e pontos de segurança para aplicação de Toxina Botulínica no terço superior.',
      'Conduta imediata para hematoma pós-preenchimento labial com Ácido Hialurônico.',
      'Diferença entre Ácido Poli-L-Láctico e Hidroxiapatita de Cálcio para estímulo de colágeno.'
    ]
  },
  sales_growth: {
    label: 'Growth & Vendas da Clínica',
    icon: TrendingUp,
    color: 'bg-indigo-500/10 text-indigo-700 border-indigo-200',
    desc: 'Scripts de WhatsApp, recuperação de clientes sumidos, combos promocionais e upsell de home care.',
    samplePrompts: [
      'Escreva 3 opções de mensagens humanizadas de WhatsApp para confirmar agendamento de amanhã.',
      'Crie uma campanha de pós-venda para clientes que fizeram Limpeza de Pele há 30 dias.',
      'Elabore um script persuasivo para oferecer Home Care após procedimento facial.',
      'Como estruturar um plano de assinatura mensal de estética facial com alta retenção?'
    ]
  },
  cost_auditor: {
    label: 'Auditor de Custos & Markup',
    icon: DollarSign,
    color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
    desc: 'Cálculo de custo por sessão, consumo fracionado de ampolas/seringas e margem de lucro líquida.',
    samplePrompts: [
      'Como calcular o custo exato por sessão de Toxina Botulínica fracionada (100U)?',
      'Qual deve ser o Markup ideal para um procedimento com R$ 180 de insumos descartáveis?',
      'Dicas para evitar desperdício de agulhas, cânulas e anestésicos tópicos no consultório.',
      'Fórmula para precificar Pacote de 5 sessões de Drenagem Linfática com margem de 60%.'
    ]
  },
  system_support: {
    label: 'Suporte EstéticaOS',
    icon: HelpCircle,
    color: 'bg-purple-500/10 text-purple-700 border-purple-200',
    desc: 'Como usar prontuários, fichas de anamnese, fechamento de caixa e permissões da equipe.',
    samplePrompts: [
      'Como registrar a assinatura digital do paciente na ficha de anamnese?',
      'Como funciona o estorno de caixa com soft-delete auditado no sistema?',
      'Onde configuro alertas de retorno e retoque pós-procedimento?',
      'Como cadastrar bens e equipamentos para controle de manutenção preventiva?'
    ]
  }
};

const STORAGE_CHAT_KEY = 'aura_gemini_chat_history_v1';

export const GeminiChatbotView: React.FC<GeminiChatbotViewProps> = ({ currentUser }) => {
  const [role, setRole] = useState<ChatRole>('clinical_consultant');
  const [speedMode, setSpeedMode] = useState<ChatSpeedMode>('general');
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CHAT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Erro ao carregar histórico do chat:', e);
    }
    return [
      {
        id: 'msg-welcome',
        sender: 'bot',
        text: `Olá, **${currentUser.nome || 'Especialista'}**! Sou a **Aura Copilot IA**, assistente inteligente integrada ao seu software de gestão. \n\nPosso auxiliar com protocolos clínicos, elaboração de mensagens de vendas, auditoria de custos por sessão ou tirar dúvidas sobre o sistema. Como posso ajudar você agora?`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        model: 'gemini-3.7-flash',
        role: 'clinical_consultant'
      }
    ];
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CHAT_KEY, JSON.stringify(messages));
    } catch (e) {}
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    if (window.confirm('Deseja limpar todo o histórico de conversas da Aura Copilot?')) {
      const welcome: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: 'bot',
        text: `Histórico renovado! Selecione a persona desejada e me envie sua pergunta.`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        model: 'gemini-3.7-flash',
        role
      };
      setMessages([welcome]);
      localStorage.removeItem(STORAGE_CHAT_KEY);
    }
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputMessage).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    // Build history formatted for Gemini
    const historyPayload = messages
      .filter(m => !m.isError)
      .map(m => ({
        role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
        parts: [{ text: m.text }]
      }));

    try {
      const result = await callGeminiChat({
        message: textToSend,
        history: historyPayload,
        role,
        mode: speedMode
      });

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: result.text,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        model: result.model,
        role: result.role
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Erro na resposta do Gemini:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'bot',
        text: `⚠️ Desculpe, ocorreu uma instabilidade na consulta: ${err.message || 'Tente novamente em instantes.'}`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const currentRoleInfo = ROLES_INFO[role];

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] bg-slate-50/50 rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Header with Role & Speed Selectors */}
      <div className="bg-white border-b border-slate-200 p-4 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-teal-500 flex items-center justify-center text-white shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-800">Aura Copilot IA</h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Online
              </span>
            </div>
            <p className="text-xs text-slate-500">Assistente Clínico, Financeiro & Operacional Multi-Turno</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Speed / Complexity Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setSpeedMode('fast')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 cursor-pointer ${
                speedMode === 'fast' ? 'bg-white text-slate-800 shadow-xs font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="gemini-3.1-flash-lite: Respostas ultra rápidas"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Rápido</span>
            </button>
            <button
              onClick={() => setSpeedMode('general')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 cursor-pointer ${
                speedMode === 'general' ? 'bg-white text-slate-800 shadow-xs font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="gemini-3.7-flash: Equilíbrio perfeito entre inteligência e agilidade"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Geral</span>
            </button>
            <button
              onClick={() => setSpeedMode('complex')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 cursor-pointer ${
                speedMode === 'complex' ? 'bg-white text-slate-800 shadow-xs font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="gemini-3.1-pro-preview: Raciocínio clínico e diagnósticos complexos"
            >
              <BrainCircuit className="w-3.5 h-3.5 text-teal-600" />
              <span>Complexo</span>
            </button>
          </div>

          <button
            onClick={handleClearHistory}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-200 cursor-pointer"
            title="Limpar Histórico"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Role Pill Navigation */}
      <div className="bg-slate-100/70 border-b border-slate-200 px-4 py-2 flex items-center gap-2 overflow-x-auto">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Flame className="w-3.5 h-3.5 text-amber-600" /> Papel:
        </span>
        {(Object.keys(ROLES_INFO) as ChatRole[]).map((rKey) => {
          const info = ROLES_INFO[rKey];
          const Icon = info.icon;
          const isActive = role === rKey;
          return (
            <button
              key={rKey}
              onClick={() => setRole(rKey)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer border ${
                isActive 
                  ? 'bg-white text-slate-900 shadow-xs border-slate-300 ring-2 ring-indigo-500/20' 
                  : 'bg-transparent text-slate-600 border-transparent hover:bg-white/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{info.label}</span>
            </button>
          );
        })}
      </div>

      {/* Message Thread Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white shadow-xs ${
                  isUser 
                    ? 'bg-indigo-600' 
                    : msg.isError 
                    ? 'bg-rose-600' 
                    : 'bg-teal-600'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`relative group rounded-2xl p-4 text-xs md:text-sm leading-relaxed border transition-all ${
                  isUser
                    ? 'bg-indigo-600 text-white border-indigo-700 rounded-tr-none shadow-xs'
                    : msg.isError
                    ? 'bg-rose-50 text-rose-800 border-rose-200 rounded-tl-none'
                    : 'bg-white text-slate-800 border-slate-200 rounded-tl-none shadow-xs'
                }`}
              >
                {!isUser && !msg.isError && (
                  <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-100">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-500" />
                      {msg.model || 'Gemini 3.7'}
                    </span>
                    <button
                      onClick={() => handleCopy(msg.text, msg.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md cursor-pointer"
                      title="Copiar texto"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}

                <div className="whitespace-pre-wrap select-text">
                  {msg.text}
                </div>

                <div className={`text-[10px] mt-2 font-medium ${isUser ? 'text-indigo-200 text-right' : 'text-slate-400'}`}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 max-w-xl mr-auto animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-teal-600/50 flex items-center justify-center text-white shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 shadow-xs flex items-center gap-2 text-xs text-slate-500">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
              <span>Aura Copilot processando com {speedMode === 'fast' ? 'Gemini Flash Lite' : speedMode === 'complex' ? 'Gemini Pro Preview' : 'Gemini 3.7 Flash'}...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      {messages.length < 4 && (
        <div className="px-4 py-2 bg-white/80 border-t border-slate-200">
          <div className="text-[11px] font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
            <MessageSquare className="w-3 h-3 text-indigo-600" /> Sugestões rápidas para "{currentRoleInfo.label}":
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {currentRoleInfo.samplePrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
                className="text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 text-slate-600 px-3 py-1.5 rounded-xl border border-slate-200 transition-all shrink-0 cursor-pointer text-left max-w-sm truncate disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Box */}
      <div className="p-4 bg-white border-t border-slate-200 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={`Pergunte algo sobre ${currentRoleInfo.label.toLowerCase()}...`}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs md:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
