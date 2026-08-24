import React, { useState } from 'react';
import { 
  Bell, 
  Plus, 
  AlertTriangle, 
  Info, 
  CheckCircle2, 
  Megaphone, 
  Calendar, 
  User, 
  Eye, 
  Trash2, 
  Radio, 
  Sparkles,
  Search,
  Filter,
  ShieldCheck
} from 'lucide-react';
import { AvisoQuadro, PrioridadeAviso, UsuarioEquipe } from '../types';

interface NoticeBoardViewProps {
  avisos: AvisoQuadro[];
  currentUser: UsuarioEquipe;
  onAddAviso: (novoAviso: Omit<AvisoQuadro, 'id' | 'data_criacao' | 'lido_por'>) => void;
  onDeleteAviso?: (id: string) => void;
  onTriggerPopup: (aviso: AvisoQuadro) => void;
}

export const NoticeBoardView: React.FC<NoticeBoardViewProps> = ({
  avisos,
  currentUser,
  onAddAviso,
  onDeleteAviso,
  onTriggerPopup,
}) => {
  const [filterPriority, setFilterPriority] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isNewNoticeModalOpen, setIsNewNoticeModalOpen] = useState(false);

  // Form State
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novaMensagem, setNovaMensagem] = useState('');
  const [novaPrioridade, setNovaPrioridade] = useState<PrioridadeAviso>('importante');
  const [novosDestinatarios, setNovosDestinatarios] = useState<'todos' | 'admin' | 'operador' | 'cliente'>('todos');
  const [novoExibirPopup, setNovoExibirPopup] = useState(false);

  const isAdmin = currentUser.role === 'admin';
  const isOperador = currentUser.role === 'operador';
  const canCreate = isAdmin || isOperador;

  // Filter notices based on user role and filters
  const filteredAvisos = avisos.filter(a => {
    // Audience filter based on current user role
    if (a.destinatarios !== 'todos' && a.destinatarios !== currentUser.role) {
      // If user is not the target audience, don't show unless admin
      if (!isAdmin) return false;
    }

    // Priority filter
    if (filterPriority !== 'todos' && a.prioridade !== filterPriority) {
      return false;
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchTitle = a.titulo.toLowerCase().includes(term);
      const matchMsg = a.mensagem.toLowerCase().includes(term);
      const matchAuthor = a.autor_nome.toLowerCase().includes(term);
      if (!matchTitle && !matchMsg && !matchAuthor) return false;
    }

    return true;
  });

  const handleCreateNotice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoTitulo.trim() || !novaMensagem.trim()) return;

    onAddAviso({
      titulo: novoTitulo.trim(),
      mensagem: novaMensagem.trim(),
      prioridade: novaPrioridade,
      autor_nome: currentUser.nome,
      autor_role: currentUser.role,
      destinatarios: novosDestinatarios,
      ativo: true,
      exibir_popup: novoExibirPopup,
    });

    // Reset Form
    setNovoTitulo('');
    setNovaMensagem('');
    setNovaPrioridade('importante');
    setNovosDestinatarios('todos');
    setNovoExibirPopup(false);
    setIsNewNoticeModalOpen(false);
  };

  const getPriorityBadge = (prioridade: PrioridadeAviso) => {
    switch (prioridade) {
      case 'urgente':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
            🔴 Urgente
          </span>
        );
      case 'importante':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            🔔 Importante
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
            ℹ️ Informativo
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 border border-indigo-500/30 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-600/20">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Quadro de Avisos & Comunicados
              </h2>
              <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200">
                {avisos.length} avisos
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Mural interno para alinhamento da equipe, protocolos de biossegurança, avisos de manutenção e alertas instantâneos em pop-up na tela.
            </p>
          </div>
        </div>

        {canCreate && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setIsNewNoticeModalOpen(true)}
              className="w-full md:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Publicar Novo Aviso</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por título, texto ou autor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
          />
        </div>

        {/* Priority Filter Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setFilterPriority('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filterPriority === 'todos'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
            }`}
          >
            Todos ({avisos.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterPriority('urgente')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filterPriority === 'urgente'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/60'
            }`}
          >
            🔴 Urgentes ({avisos.filter(a => a.prioridade === 'urgente').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterPriority('importante')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filterPriority === 'importante'
                ? 'bg-amber-500 text-slate-900 font-bold shadow-2xs'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/60'
            }`}
          >
            🔔 Importantes ({avisos.filter(a => a.prioridade === 'importante').length})
          </button>
          <button
            type="button"
            onClick={() => setFilterPriority('informativo')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              filterPriority === 'informativo'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/60'
            }`}
          >
            ℹ️ Informativos ({avisos.filter(a => a.prioridade === 'informativo').length})
          </button>
        </div>
      </div>

      {/* Notices List */}
      <div className="space-y-4">
        {filteredAvisos.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Megaphone className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Nenhum aviso encontrado</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Não há avisos correspondentes aos filtros selecionados no momento.
            </p>
          </div>
        ) : (
          filteredAvisos.map(aviso => {
            const isUrgente = aviso.prioridade === 'urgente';
            const isImportante = aviso.prioridade === 'importante';
            
            const cardBg = isUrgente 
              ? 'bg-rose-50/50 border-rose-200 hover:border-rose-300' 
              : isImportante 
              ? 'bg-amber-50/40 border-amber-200 hover:border-amber-300' 
              : 'bg-white border-slate-200 hover:border-slate-300';

            const dateFormatted = new Intl.DateTimeFormat('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }).format(new Date(aviso.data_criacao));

            return (
              <div 
                key={aviso.id} 
                className={`rounded-2xl p-5 sm:p-6 border transition-all shadow-xs ${cardBg}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getPriorityBadge(aviso.prioridade)}
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                        {aviso.titulo}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1 font-medium">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{aviso.autor_nome}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-bold uppercase">
                            {aviso.autor_role === 'admin' ? 'Admin' : aviso.autor_role === 'operador' ? 'Operador' : 'Cliente'}
                          </span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {dateFormatted}
                        </span>
                        <span>•</span>
                        <span className="text-[11px] text-slate-500">
                          Público: <strong className="uppercase">{aviso.destinatarios}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions (Pop-up preview / Delete) */}
                  <div className="flex items-center gap-2 self-end sm:self-start">
                    <button
                      type="button"
                      onClick={() => onTriggerPopup(aviso)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-indigo-700 border border-slate-200 shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Ver como Pop-up em Tela"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver em Pop-up</span>
                    </button>

                    {isAdmin && onDeleteAviso && (
                      <button
                        type="button"
                        onClick={() => onDeleteAviso(aviso.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Excluir Aviso (Admin)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Message Body */}
                <div className="bg-white/80 backdrop-blur-xs p-4 rounded-xl border border-slate-200/80 text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                  {aviso.mensagem}
                </div>

                {/* Popup alert badge */}
                {aviso.exibir_popup && (
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-rose-700">
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                    <span>Configurado para abrir em Pop-up automático na tela dos usuários</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal to create new Notice */}
      {isNewNoticeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Novo Comunicado / Aviso</h3>
                  <p className="text-xs text-slate-500">Publicar mensagem no mural da clínica</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsNewNoticeModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNotice} className="space-y-4">
              
              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Título do Aviso / Comunicado *
                </label>
                <input
                  type="text"
                  required
                  value={novoTitulo}
                  onChange={(e) => setNovoTitulo(e.target.value)}
                  placeholder="Ex: Calibração Técnica no Laser Lavieen"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                />
              </div>

              {/* Priority and Target Audience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Nível de Prioridade
                  </label>
                  <select
                    value={novaPrioridade}
                    onChange={(e) => setNovaPrioridade(e.target.value as PrioridadeAviso)}
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                  >
                    <option value="urgente">🔴 Urgente (Alerta Crítico)</option>
                    <option value="importante">🔔 Importante (Alinhamento)</option>
                    <option value="informativo">ℹ️ Informativo (Geral)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Público Destinatário
                  </label>
                  <select
                    value={novosDestinatarios}
                    onChange={(e) => setNovosDestinatarios(e.target.value as any)}
                    className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                  >
                    <option value="todos">Todos (Admin, Operador e Cliente)</option>
                    <option value="admin">Apenas Admin</option>
                    <option value="operador">Apenas Operador (Recepção)</option>
                    <option value="cliente">Apenas Clientes (Portal)</option>
                  </select>
                </div>
              </div>

              {/* Message Content */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Mensagem Completa *
                </label>
                <textarea
                  required
                  rows={4}
                  value={novaMensagem}
                  onChange={(e) => setNovaMensagem(e.target.value)}
                  placeholder="Descreva as orientações, horários, procedimentos ou novidades com clareza para a equipe..."
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 leading-relaxed"
                />
              </div>

              {/* Display as Pop-up Toggle */}
              <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-xs text-indigo-950 block">
                    Alertar em forma de Pop-up na tela
                  </span>
                  <span className="text-[11px] text-indigo-800/80">
                    Abre uma janela modal em destaque na tela para todos os usuários destinatários.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={novoExibirPopup}
                    onChange={(e) => setNovoExibirPopup(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
                </label>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewNoticeModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Megaphone className="w-4 h-4" />
                  <span>Publicar no Quadro</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
