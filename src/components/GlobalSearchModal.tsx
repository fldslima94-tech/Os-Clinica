import React, { useEffect, useState, useMemo } from 'react';
import { 
  Search, 
  Calendar, 
  User, 
  Package, 
  DollarSign, 
  ArrowRight, 
  Plus, 
  Clock, 
  CheckCircle2, 
  X, 
  Sparkles,
  MessageCircle,
  Users,
  CornerDownLeft,
  FileText
} from 'lucide-react';
import { Paciente, Agendamento, EstoqueInsumo, TabType } from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  pacientes: Paciente[];
  agendamentos: Agendamento[];
  estoque: EstoqueInsumo[];
  setActiveTab: (tab: TabType) => void;
  onViewPatient: (paciente: Paciente) => void;
  onOpenNewAppointment: () => void;
  onOpenNewPatient: () => void;
  onOpenNewInventory: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  pacientes,
  agendamentos,
  estoque,
  setActiveTab,
  onViewPatient,
  onOpenNewAppointment,
  onOpenNewPatient,
  onOpenNewInventory,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Reset query on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard shortcuts (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (isOpen && e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Results computation
  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      // Default quick actions
      return [
        {
          id: 'action-new-app',
          type: 'action' as const,
          title: 'Novo Agendamento de Consulta',
          subtitle: 'Agendar horário para hoje ou próximos dias',
          icon: Calendar,
          action: () => {
            onClose();
            onOpenNewAppointment();
          }
        },
        {
          id: 'action-new-pat',
          type: 'action' as const,
          title: 'Cadastrar Novo Paciente',
          subtitle: 'Criar ficha de anamnese e contato',
          icon: User,
          action: () => {
            onClose();
            onOpenNewPatient();
          }
        },
        {
          id: 'action-queue',
          type: 'action' as const,
          title: 'Ver Fila de Espera & Balcão de Hoje',
          subtitle: 'Monitorar pacientes na recepção e em sala',
          icon: Clock,
          action: () => {
            onClose();
            setActiveTab('dashboard');
          }
        },
        {
          id: 'action-fin',
          type: 'action' as const,
          title: 'Abrir Fechamento Financeiro & Recibos',
          subtitle: 'Ver extrato diário, faturamento e emitir recibos',
          icon: DollarSign,
          action: () => {
            onClose();
            setActiveTab('financeiro');
          }
        },
      ];
    }

    const patientMatches = pacientes
      .filter(p => p.nome.toLowerCase().includes(q) || p.telefone.includes(q) || p.cpf?.includes(q))
      .slice(0, 5)
      .map(p => ({
        id: `p-${p.id}`,
        type: 'paciente' as const,
        title: p.nome,
        subtitle: `Tel: ${p.telefone} • ${p.historico_clinico.slice(0, 45)}...`,
        icon: User,
        action: () => {
          onClose();
          onViewPatient(p);
        }
      }));

    const appointmentMatches = agendamentos
      .filter(a => 
        a.procedimento.toLowerCase().includes(q) || 
        a.paciente?.nome.toLowerCase().includes(q) ||
        a.observacoes?.toLowerCase().includes(q)
      )
      .slice(0, 4)
      .map(a => ({
        id: `a-${a.id}`,
        type: 'agendamento' as const,
        title: `${a.paciente?.nome || 'Paciente'} - ${a.procedimento}`,
        subtitle: `Status: ${a.status.toUpperCase()} • ${new Date(a.data_hora).toLocaleDateString('pt-BR')} às ${new Date(a.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
        icon: Calendar,
        action: () => {
          onClose();
          setActiveTab('agendamentos');
        }
      }));

    const inventoryMatches = estoque
      .filter(i => i.nome_item.toLowerCase().includes(q) || i.categoria?.toLowerCase().includes(q))
      .slice(0, 3)
      .map(i => ({
        id: `i-${i.id}`,
        type: 'estoque' as const,
        title: i.nome_item,
        subtitle: `Saldo: ${i.quantidade} ${i.unidade_medida} • Alerta: ${i.alerta_minimo} • Lote: ${i.lote || 'N/A'}`,
        icon: Package,
        action: () => {
          onClose();
          setActiveTab('estoque');
        }
      }));

    return [...patientMatches, ...appointmentMatches, ...inventoryMatches];
  }, [query, pacientes, agendamentos, estoque, onClose, onViewPatient, onOpenNewAppointment, onOpenNewPatient, setActiveTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <div className="relative border-b border-slate-100 p-4 flex items-center gap-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-indigo-600 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Digite para buscar pacientes, agendamentos, estoque ou atalhos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm sm:text-base text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-2xs">
            ESC para fechar
          </span>
        </div>

        {/* Results List */}
        <div className="p-2 overflow-y-auto divide-y divide-slate-50 flex-1">
          {results.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
              <p className="text-sm font-medium">Nenhum resultado encontrado para "{query}"</p>
              <p className="text-xs text-slate-400 mt-1">Tente pesquisar por nome do paciente, telefone, botox, insumo ou data.</p>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {query ? `Resultados da Pesquisa (${results.length})` : 'Ações Rápidas & Navegação'}
              </div>
              {results.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={item.action}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-indigo-50/70 group transition-all text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white text-slate-600 flex items-center justify-center shrink-0 transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800 group-hover:text-indigo-950 flex items-center gap-2">
                          <span>{item.title}</span>
                          {item.type === 'paciente' && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700">Paciente</span>
                          )}
                          {item.type === 'agendamento' && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700">Agenda</span>
                          )}
                          {item.type === 'estoque' && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">Insumo</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 group-hover:text-indigo-800/80 line-clamp-1 mt-0.5">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 text-indigo-600 text-xs font-semibold flex items-center gap-1 transition-opacity shrink-0">
                      <span>Acessar</span>
                      <CornerDownLeft className="w-3.5 h-3.5" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <kbd className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-600 shadow-2xs">Ctrl</kbd>
              <span>+</span>
              <kbd className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-600 shadow-2xs">K</kbd>
              <span className="text-slate-400">Atalho global</span>
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            EstéticaOS • Busca Inteligente
          </span>
        </div>
      </div>
    </div>
  );
};
