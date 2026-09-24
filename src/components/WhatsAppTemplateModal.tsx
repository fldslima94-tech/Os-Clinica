import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  MessageSquare, 
  Sparkles, 
  RotateCcw, 
  Check, 
  Copy, 
  Eye, 
  Tag, 
  Calendar, 
  Clock, 
  User, 
  Building2, 
  Phone, 
  MapPin, 
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { WhatsAppTemplate, WhatsAppTemplateCategoria, ClinicaConfig } from '../types';
import { DEFAULT_WHATSAPP_TEMPLATES, formatWhatsAppMessage } from '../services/whatsappTemplateService';

interface WhatsAppTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: WhatsAppTemplate) => void;
  templateToEdit?: WhatsAppTemplate | null;
  clinicaConfig?: ClinicaConfig;
}

const AVAILABLE_TAGS = [
  { tag: '{paciente}', label: 'Nome do Paciente', icon: User, example: 'Mariana' },
  { tag: '{procedimento}', label: 'Procedimento', icon: Sparkles, example: 'Toxina Botulínica' },
  { tag: '{data}', label: 'Data', icon: Calendar, example: '25/09/2026' },
  { tag: '{horario}', label: 'Horário', icon: Clock, example: '14:30' },
  { tag: '{profissional}', label: 'Profissional / Gestor', icon: User, example: 'Dra. Laura Mendes' },
  { tag: '{clinica}', label: 'Nome da Clínica', icon: Building2, example: 'Aura Estética' },
  { tag: '{telefone_clinica}', label: 'Tel da Clínica', icon: Phone, example: '(11) 98765-4321' },
  { tag: '{endereco}', label: 'Endereço', icon: MapPin, example: 'Av. Paulista, 1000' },
  { tag: '{aniversario_mes}', label: 'Mês de Aniversário', icon: Calendar, example: 'Setembro' },
  { tag: '{cupom}', label: 'Cupom de Desconto', icon: Tag, example: 'VIP15' },
];

export const WhatsAppTemplateModal: React.FC<WhatsAppTemplateModalProps> = ({
  isOpen,
  onClose,
  onSave,
  templateToEdit,
  clinicaConfig,
}) => {
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState<WhatsAppTemplateCategoria>('confirmacao');
  const [gatilhoSugerido, setGatilhoSugerido] = useState('24h antes');
  const [descricao, setDescricao] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      if (templateToEdit) {
        setTitulo(templateToEdit.titulo);
        setCategoria(templateToEdit.categoria);
        setGatilhoSugerido(templateToEdit.gatilho_sugerido || '24h antes');
        setDescricao(templateToEdit.descricao || '');
        setMensagem(templateToEdit.mensagem || '');
      } else {
        setTitulo('');
        setCategoria('personalizado');
        setGatilhoSugerido('Manual / Personalizado');
        setDescricao('');
        setMensagem(`Olá, *{paciente}*! Tudo bem? ✨\n\nPassando para enviar uma orientação importante sobre seu agendamento de *{procedimento}* com *{profissional}* na *{clinica}*.\n\nFicamos à sua disposição!`);
      }
    }
  }, [isOpen, templateToEdit]);

  if (!isOpen) return null;

  const isEditing = Boolean(templateToEdit);
  const isDefaultTemplate = Boolean(templateToEdit?.padrao);

  const handleInsertTag = (tagText: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setMensagem(prev => prev + ' ' + tagText);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const textBefore = mensagem.substring(0, start);
    const textAfter = mensagem.substring(end);

    const newText = textBefore + tagText + textAfter;
    setMensagem(newText);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + tagText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  };

  const handleRestoreDefault = () => {
    if (!templateToEdit) return;
    const defaultTemplate = DEFAULT_WHATSAPP_TEMPLATES.find(t => t.id === templateToEdit.id);
    if (defaultTemplate) {
      setTitulo(defaultTemplate.titulo);
      setCategoria(defaultTemplate.categoria);
      setGatilhoSugerido(defaultTemplate.gatilho_sugerido || '');
      setDescricao(defaultTemplate.descricao || '');
      setMensagem(defaultTemplate.mensagem);
      setErrorMsg(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) {
      setErrorMsg('Por favor, informe o título da mensagem automática.');
      return;
    }
    if (!mensagem.trim()) {
      setErrorMsg('O texto da mensagem automática não pode ficar em branco.');
      return;
    }

    const updated: WhatsAppTemplate = {
      id: templateToEdit?.id || `template-${Date.now()}`,
      titulo: titulo.trim(),
      categoria,
      gatilho_sugerido: gatilhoSugerido.trim(),
      descricao: descricao.trim(),
      mensagem: mensagem.trim(),
      ativo: templateToEdit ? templateToEdit.ativo : true,
      padrao: templateToEdit?.padrao || false,
      ordem: templateToEdit?.ordem || 99,
      atualizado_em: new Date().toISOString(),
      criado_em: templateToEdit?.criado_em || new Date().toISOString(),
    };

    onSave(updated);
    onClose();
  };

  // Preview com simulação de dados reais
  const previewText = formatWhatsAppMessage(mensagem, {
    clinicaConfig,
    paciente: { id: 'p1', nome: 'Mariana Silveira', telefone: '(11) 98765-4321' } as any,
    agendamento: {
      id: 'ag1',
      paciente_id: 'p1',
      procedimento: 'Harmonização Facial',
      data_hora: new Date(Date.now() + 86400000).toISOString(),
      profissional_nome: 'Dra. Laura Mendes',
    } as any,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isEditing ? 'Editar Mensagem Automática' : 'Nova Mensagem Automática'}
              </h3>
              <p className="text-xs text-slate-500">
                Personalize textos, orientações e variáveis dinâmicas enviadas pelo WhatsApp.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-800 font-medium">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Content Body (2 Columns on large screens: Editor + Live Preview) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Form Fields (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Título & Categoria */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Título do Modelo *
                </label>
                <input
                  type="text"
                  required
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  placeholder="Ex: Lembrete 2h Antes..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Categoria da Mensagem
                </label>
                <select
                  value={categoria}
                  onChange={e => setCategoria(e.target.value as WhatsAppTemplateCategoria)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900 bg-white"
                >
                  <option value="confirmacao">Confirmação de Agendamento</option>
                  <option value="pre_cuidados">Cuidados Pré-Procedimento</option>
                  <option value="pos_cuidados">Cuidados Pós-Sessão</option>
                  <option value="retorno">Retorno / Avaliação Clínica</option>
                  <option value="promocao">Promoção & Campanha Especial</option>
                  <option value="evento">Convite para Evento / Coquetel VIP</option>
                  <option value="aniversario">Felicitações & Presente de Aniversário</option>
                  <option value="reativacao">Reativação de Pacientes Ausentes</option>
                  <option value="personalizado">Personalizado / Outro</option>
                </select>
              </div>
            </div>

            {/* Gatilho Sugerido & Descrição */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Momento / Gatilho de Envio
                </label>
                <input
                  type="text"
                  value={gatilhoSugerido}
                  onChange={e => setGatilhoSugerido(e.target.value)}
                  placeholder="Ex: 24h antes, 2h antes, 15 dias pós..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Descrição Rápida (opcional)
                </label>
                <input
                  type="text"
                  value={descricao}
                  onChange={e => setDescricao(e.target.value)}
                  placeholder="Ex: Lembrete para reduzir no-show..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900 bg-white"
                />
              </div>
            </div>

            {/* Toolbar de Tags Dinâmicas */}
            <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-emerald-600" />
                  Clique nas variáveis para inserir no texto:
                </span>
                <span className="text-[10px] text-slate-500">Substituição automática</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {AVAILABLE_TAGS.map(item => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => handleInsertTag(item.tag)}
                    title={`Inserir ${item.tag} (exemplo: ${item.example})`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/70 text-[11px] font-mono text-slate-700 hover:text-emerald-800 transition-colors shadow-2xs cursor-pointer"
                  >
                    <span className="font-bold text-emerald-600">+</span>
                    <span>{item.tag}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Editor de Texto */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Conteúdo da Mensagem *
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {mensagem.length} caracteres
                </span>
              </div>
              <textarea
                ref={textareaRef}
                rows={9}
                required
                value={mensagem}
                onChange={e => setMensagem(e.target.value)}
                placeholder="Escreva a mensagem aqui... Use *negrito* para destacar palavras no WhatsApp."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-sans leading-relaxed border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900 bg-white"
              />
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                Dica: Digite *texto* para deixar em <strong>negrito</strong> no WhatsApp.
              </p>
            </div>

          </div>

          {/* Right Column: Live WhatsApp Simulation Preview (5 cols) */}
          <div className="lg:col-span-5 flex flex-col">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-emerald-600" />
              <span>Como o Paciente Vai Receber</span>
            </label>

            {/* WhatsApp Phone Mockup Container */}
            <div className="bg-[#efeae2] rounded-2xl border border-slate-300 p-3 shadow-inner flex flex-col flex-1 min-h-[360px] relative overflow-hidden">
              
              {/* WhatsApp Chat Header */}
              <div className="bg-[#075e54] text-white px-3 py-2 rounded-xl flex items-center justify-between shadow-xs mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-400/40 text-white font-bold flex items-center justify-center text-xs border border-white/20">
                    {clinicaConfig?.nome?.slice(0, 2).toUpperCase() || 'AE'}
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-tight">
                      {clinicaConfig?.nome || 'Aura Estética'}
                    </p>
                    <p className="text-[10px] text-emerald-100/80 leading-none">Online</p>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              {/* Chat Message Bubble */}
              <div className="flex-1 flex flex-col justify-end space-y-2">
                <div className="self-end max-w-[92%] bg-[#d9fdd3] text-slate-900 p-3 rounded-2xl rounded-tr-xs shadow-xs text-xs whitespace-pre-line border border-emerald-200/50 leading-relaxed font-sans relative">
                  {previewText || (
                    <span className="text-slate-400 italic">
                      Digite o texto ao lado para visualizar a prévia instantânea aqui...
                    </span>
                  )}
                  
                  {/* Balloon Footer (Timestamp + Blue Double Ticks) */}
                  <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-500 font-mono">
                    <span>{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="text-[#53bdeb] font-bold">✓✓</span>
                  </div>
                </div>
              </div>

              {/* Info pill */}
              <div className="mt-3 text-center">
                <span className="inline-block text-[10px] bg-white/70 text-slate-600 px-2.5 py-0.5 rounded-full border border-slate-200/60 font-medium">
                  Simulação com dados de teste
                </span>
              </div>

            </div>
          </div>

        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/80">
          <div>
            {isDefaultTemplate && (
              <button
                type="button"
                onClick={handleRestoreDefault}
                className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-200/60 transition-colors cursor-pointer"
                title="Restaura o texto original de fábrica da clínica"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Restaurar Texto Padrão Original</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Mensagem Automática</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
