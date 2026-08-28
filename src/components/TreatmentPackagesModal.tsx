import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  ArrowRight, 
  Sparkles, 
  X, 
  Check, 
  RotateCcw,
  Percent,
  TrendingUp,
  AlertCircle,
  Trash2,
  ShieldCheck,
  Lock,
  DollarSign,
  Layers,
  Info,
  Sliders,
  BadgePercent
} from 'lucide-react';
import { Paciente, PacoteTratamento, PacoteItemProcedimento, ProcedimentoClinico, UsuarioEquipe } from '../types';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { useConnectionStatus } from '../hooks/useConnectionStatus';
import { Wifi, WifiOff, Database, CloudCheck } from 'lucide-react';
import { isUserAdminTotal, isUserAdminLocalOrTotal } from '../services/firebaseService';

interface TreatmentPackagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  paciente: Paciente;
  onUpdatePaciente: (paciente: Paciente) => void;
  onScheduleSession?: (sessaoInfo: { pacienteId: string; procedimento: string; observacoes?: string; valor?: number }) => void;
  currentUser?: UsuarioEquipe;
  procedimentos?: ProcedimentoClinico[];
}

// System standard discount tiers for standard operators (Max 20%)
const REGRAS_DESCONTO_PADRAO = [
  { id: 'sem_desconto', label: 'Sem Desconto (0%)', percentual: 0, minSessoes: 1 },
  { id: 'bronze_3', label: 'Plano Básico 3+ Sessões (5% OFF)', percentual: 5, minSessoes: 3 },
  { id: 'prata_5', label: 'Plano Fidelidade 5+ Sessões (10% OFF)', percentual: 10, minSessoes: 5 },
  { id: 'ouro_8', label: 'Protocolo Avançado 8+ Sessões (15% OFF)', percentual: 15, minSessoes: 8 },
  { id: 'diamante_vip', label: 'Combo Master VIP (20% OFF - Teto Padrão)', percentual: 20, minSessoes: 10 },
];

const LIMITE_DESCONTO_OPERADOR = 20; // 20% maximum without admin override

export const TreatmentPackagesModal: React.FC<TreatmentPackagesModalProps> = ({
  isOpen,
  onClose,
  paciente,
  onUpdatePaciente,
  onScheduleSession,
  currentUser,
  procedimentos = [],
}) => {
  const { isOnline, pendingCount } = useConnectionStatus();
  const isAdmin = !currentUser || isUserAdminTotal(currentUser) || isUserAdminLocalOrTotal(currentUser) || currentUser.role === 'admin_master' || currentUser.role === 'admin_total' || currentUser.role === 'admin' || currentUser.role === 'gestor';
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [pacoteToDelete, setPacoteToDelete] = useState<PacoteTratamento | null>(null);

  // Form Mode: 'personalizado_multiplo' (multiple procedures) or 'rapido_simples' (single procedure)
  const [packageType, setPackageType] = useState<'personalizado' | 'simples'>('personalizado');

  // Simple Mode fields
  const [nomePacote, setNomePacote] = useState('');
  const [procedimentoSimples, setProcedimentoSimples] = useState('');
  const [sessoesSimples, setSessoesSimples] = useState<number>(5);
  const [valorUnitarioSimples, setValorUnitarioSimples] = useState<number>(300);

  // Custom Multi-Item Package items
  const [itensCustomizados, setItensCustomizados] = useState<PacoteItemProcedimento[]>([
    {
      procedimento_id: procedimentos[0]?.id || 'proc-01',
      procedimento_nome: procedimentos[0]?.nome || 'Toxina Botulínica (3 Áreas)',
      sessoes: 2,
      valor_unitario: procedimentos[0]?.valor_promocional || procedimentos[0]?.valor_tabela || 1290,
    }
  ]);

  // Discount configuration
  const [descontoTipo, setDescontoTipo] = useState<'padrao' | 'custom_percent' | 'custom_valor'>('padrao');
  const [regraDescontoSelecionada, setRegraDescontoSelecionada] = useState<string>('prata_5');
  const [customPercentual, setCustomPercentual] = useState<number>(10);
  const [customValorDesconto, setCustomValorDesconto] = useState<number>(0);
  const [observacoes, setObservacoes] = useState('');

  if (!isOpen) return null;

  const pacotes = paciente.pacotes || [];

  // Calculate Base Gross Value (Sem Desconto)
  const totalSessoesCalculado = useMemo(() => {
    if (packageType === 'simples') {
      return sessoesSimples;
    }
    return itensCustomizados.reduce((acc, item) => acc + (Number(item.sessoes) || 0), 0);
  }, [packageType, sessoesSimples, itensCustomizados]);

  const valorOriginalSemDesconto = useMemo(() => {
    if (packageType === 'simples') {
      return sessoesSimples * valorUnitarioSimples;
    }
    return itensCustomizados.reduce((acc, item) => acc + ((Number(item.sessoes) || 0) * (Number(item.valor_unitario) || 0)), 0);
  }, [packageType, sessoesSimples, valorUnitarioSimples, itensCustomizados]);

  // Calculate Discount Amount & Final Value
  const { valorDescontoCalculado, percentualEfetivo, valorFinalComDesconto, isAboveSystemLimit } = useMemo(() => {
    let valorDesc = 0;
    let perc = 0;

    if (descontoTipo === 'padrao') {
      const regra = REGRAS_DESCONTO_PADRAO.find(r => r.id === regraDescontoSelecionada);
      perc = regra ? regra.percentual : 0;
      valorDesc = (valorOriginalSemDesconto * perc) / 100;
    } else if (descontoTipo === 'custom_percent') {
      perc = customPercentual;
      // Cap at 20% for non-admin
      if (!isAdmin && perc > LIMITE_DESCONTO_OPERADOR) {
        perc = LIMITE_DESCONTO_OPERADOR;
      }
      valorDesc = (valorOriginalSemDesconto * perc) / 100;
    } else if (descontoTipo === 'custom_valor') {
      valorDesc = customValorDesconto;
      if (valorOriginalSemDesconto > 0) {
        perc = Math.round((valorDesc / valorOriginalSemDesconto) * 100);
      }
      // If non-admin, cap at 20% of total
      if (!isAdmin && valorDesc > (valorOriginalSemDesconto * LIMITE_DESCONTO_OPERADOR) / 100) {
        valorDesc = (valorOriginalSemDesconto * LIMITE_DESCONTO_OPERADOR) / 100;
        perc = LIMITE_DESCONTO_OPERADOR;
      }
    }

    const finalVal = Math.max(0, valorOriginalSemDesconto - valorDesc);
    const aboveLimit = perc > LIMITE_DESCONTO_OPERADOR;

    return {
      valorDescontoCalculado: valorDesc,
      percentualEfetivo: perc,
      valorFinalComDesconto: finalVal,
      isAboveSystemLimit: aboveLimit,
    };
  }, [descontoTipo, regraDescontoSelecionada, customPercentual, customValorDesconto, valorOriginalSemDesconto, isAdmin]);

  // Add Item to Custom Package
  const handleAddItemCustomizado = () => {
    const defaultProc = procedimentos[0];
    const newItem: PacoteItemProcedimento = {
      procedimento_id: defaultProc?.id || `proc-${Date.now()}`,
      procedimento_nome: defaultProc?.nome || 'Procedimento Estético',
      sessoes: 2,
      valor_unitario: defaultProc?.valor_promocional || defaultProc?.valor_tabela || 800,
    };
    setItensCustomizados([...itensCustomizados, newItem]);
  };

  const handleUpdateItemCustomizado = (index: number, updates: Partial<PacoteItemProcedimento>) => {
    setItensCustomizados(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  const handleRemoveItemCustomizado = (index: number) => {
    if (itensCustomizados.length <= 1) return;
    setItensCustomizados(prev => prev.filter((_, i) => i !== index));
  };

  const handleSelectProcedimentoForItem = (index: number, procId: string) => {
    const proc = procedimentos.find(p => p.id === procId);
    if (proc) {
      handleUpdateItemCustomizado(index, {
        procedimento_id: proc.id,
        procedimento_nome: proc.nome,
        valor_unitario: proc.valor_promocional || proc.valor_tabela || 500,
      });
    }
  };

  // Create Package
  const handleCreatePacote = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalSessoesCalculado <= 0) return;

    let finalNome = nomePacote.trim();
    let finalProcDesc = '';

    if (packageType === 'personalizado') {
      if (!finalNome) {
        finalNome = `Combo Personalizado (${itensCustomizados.map(i => `${i.sessoes}x ${i.procedimento_nome}`).join(' + ')})`;
      }
      finalProcDesc = itensCustomizados.map(i => `${i.sessoes}x ${i.procedimento_nome}`).join(' + ');
    } else {
      if (!finalNome) {
        finalNome = `Pacote ${procedimentoSimples || 'Tratamento'} (${sessoesSimples} Sessões)`;
      }
      finalProcDesc = procedimentoSimples || finalNome;
    }

    const novoPacote: PacoteTratamento = {
      id: `pack-${Date.now()}`,
      nome_pacote: finalNome,
      procedimento: finalProcDesc,
      total_sessoes: totalSessoesCalculado,
      sessoes_realizadas: 0,
      valor_total: valorFinalComDesconto,
      valor_original_sem_desconto: valorOriginalSemDesconto,
      desconto_aplicado_percentual: percentualEfetivo,
      desconto_valor: valorDescontoCalculado,
      autorizado_por_admin: isAboveSystemLimit && isAdmin,
      itens_procedimentos: packageType === 'personalizado' ? itensCustomizados : undefined,
      status: 'em_andamento',
      data_inicio: new Date().toISOString(),
      observacoes: observacoes.trim() || undefined,
    };

    const pacotesAtualizados = [...pacotes, novoPacote];
    onUpdatePaciente({
      ...paciente,
      pacotes: pacotesAtualizados,
    });

    setIsAddingNew(false);
    setNomePacote('');
    setObservacoes('');
  };

  const handleAdvanceSession = (pacoteId: string) => {
    const pacotesAtualizados = pacotes.map(p => {
      if (p.id === pacoteId) {
        const realizadas = p.sessoes_realizadas + 1;
        const concluido = realizadas >= p.total_sessoes;
        return {
          ...p,
          sessoes_realizadas: realizadas,
          status: concluido ? ('concluido' as const) : p.status,
          ultima_sessao: new Date().toISOString(),
        };
      }
      return p;
    });

    onUpdatePaciente({
      ...paciente,
      pacotes: pacotesAtualizados,
    });
  };

  const handleResetSession = (pacoteId: string) => {
    const pacotesAtualizados = pacotes.map(p => {
      if (p.id === pacoteId && p.sessoes_realizadas > 0) {
        return {
          ...p,
          sessoes_realizadas: p.sessoes_realizadas - 1,
          status: 'em_andamento' as const,
        };
      }
      return p;
    });

    onUpdatePaciente({
      ...paciente,
      pacotes: pacotesAtualizados,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 flex flex-col">
        
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-2xs">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Pacotes Personalizados & Planos de Tratamento
                </h2>
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full border border-purple-200">
                    <ShieldCheck className="w-3 h-3 text-purple-600" />
                    Admin: Descontos Ilimitados Liberados
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                    Operador (Teto de Desconto: 20%)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Paciente: <strong className="text-slate-800">{paciente.nome}</strong> • Premissas de desconto automáticas e controle de sessões
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Status de Conexão */}
            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
              !isOnline 
                ? 'bg-amber-500/10 text-amber-700 border-amber-300' 
                : 'bg-emerald-500/10 text-emerald-700 border-emerald-300'
            }`}>
              {!isOnline ? <WifiOff className="w-3.5 h-3.5 text-amber-600" /> : <CloudCheck className="w-3.5 h-3.5 text-emerald-600" />}
              <span>{!isOnline ? 'Offline (IndexedDB)' : 'Nuvem Conectada'}</span>
              {pendingCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-amber-200 text-amber-900 rounded-full text-[10px]">
                  {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Offline Warning Banner */}
        {!isOnline && (
          <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-2.5 text-amber-800 text-xs shrink-0">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Modo Offline Ativo:</strong> Criação, edição e baixas de sessões deste pacote serão armazenadas localmente no IndexedDB e sincronizadas com a nuvem quando a conexão for retomada.
              </span>
            </div>
            <span className="px-2 py-0.5 bg-amber-200/70 text-amber-900 rounded-md font-bold text-[10px] uppercase shrink-0">
              Fila Local
            </span>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-6 flex-1">
          
          {/* Active Packages List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Pacotes Contratados do Paciente ({pacotes.length})
              </h3>
              {!isAddingNew && (
                <button
                  onClick={() => setIsAddingNew(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Montar Novo Pacote com Desconto</span>
                </button>
              )}
            </div>

            {pacotes.length === 0 && !isAddingNew ? (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-700">Nenhum pacote contratado no momento</p>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Crie planos de tratamento personalizados com múltiplos procedimentos e regras de desconto automáticas.
                </p>
                <button
                  onClick={() => setIsAddingNew(true)}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 transition-colors cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Montar Primeiro Pacote</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pacotes.map((pacote) => {
                  const percent = Math.round((pacote.sessoes_realizadas / (pacote.total_sessoes || 1)) * 100);
                  const isDone = pacote.sessoes_realizadas >= pacote.total_sessoes;
                  const restam = pacote.total_sessoes - pacote.sessoes_realizadas;

                  return (
                    <div
                      key={pacote.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isDone
                          ? 'bg-slate-50/70 border-slate-200'
                          : 'bg-white border-purple-200/80 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border ${
                              isDone 
                                ? 'bg-slate-100 text-slate-600 border-slate-200' 
                                : 'bg-purple-50 text-purple-700 border-purple-200'
                            }`}>
                              {isDone ? 'Concluído' : 'Em Andamento'}
                            </span>

                            {pacote.desconto_aplicado_percentual ? (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {pacote.desconto_aplicado_percentual}% OFF
                              </span>
                            ) : null}

                            {pacote.autorizado_por_admin && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1" title="Desconto autorizado por perfil Administrador">
                                <ShieldCheck className="w-3 h-3 text-indigo-600" />
                                Desconto Admin
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm font-bold text-slate-900 leading-tight">
                            {pacote.nome_pacote}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">{pacote.procedimento}</p>
                        </div>
                        
                        <div className="text-right shrink-0">
                          <span className="text-sm font-bold text-slate-900 block font-mono">
                            {pacote.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                          {pacote.valor_original_sem_desconto && pacote.valor_original_sem_desconto > pacote.valor_total && (
                            <span className="text-[10px] text-slate-400 line-through block">
                              De: {pacote.valor_original_sem_desconto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500 font-medium">
                            {restam === 0 ? 'Plano finalizado' : `Restam ${restam} sessões`}
                          </span>
                        </div>
                      </div>

                      {/* Itemized Procedures Breakdown */}
                      {pacote.itens_procedimentos && pacote.itens_procedimentos.length > 0 && (
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 my-2 space-y-1 text-[11px]">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Composição do Combo:
                          </span>
                          {pacote.itens_procedimentos.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-slate-600">
                              <span>• {item.sessoes}x {item.procedimento_nome}</span>
                              <span className="font-mono text-slate-500">R$ {item.valor_unitario * item.sessoes}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Progress bar */}
                      <div className="my-3">
                        <div className="flex items-center justify-between text-xs mb-1 font-semibold">
                          <span className="text-slate-700">
                            Sessão {pacote.sessoes_realizadas} de {pacote.total_sessoes}
                          </span>
                          <span className="text-purple-600 font-bold">{percent}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                          <div
                            className={`h-full transition-all duration-300 ${isDone ? 'bg-emerald-500' : 'bg-purple-600'}`}
                            style={{ width: `${Math.min(percent, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="text-[11px] text-slate-400">
                          {pacote.ultima_sessao 
                            ? `Última: ${new Date(pacote.ultima_sessao).toLocaleDateString('pt-BR')}`
                            : `Início: ${new Date(pacote.data_inicio).toLocaleDateString('pt-BR')}`}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {pacote.sessoes_realizadas > 0 && (
                            <button
                              type="button"
                              onClick={() => handleResetSession(pacote.id)}
                              className="p-1.5 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 cursor-pointer"
                              title="Desfazer última sessão"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                          
                          {!isDone ? (
                            <>
                              {onScheduleSession && (
                                <button
                                  type="button"
                                  onClick={() => onScheduleSession({
                                    pacienteId: paciente.id,
                                    procedimento: pacote.procedimento || pacote.nome_pacote,
                                    observacoes: `Sessão ${pacote.sessoes_realizadas + 1} de ${pacote.total_sessoes} - Pacote: ${pacote.nome_pacote}`,
                                    valor: 0
                                  })}
                                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                                  title="Agendar próxima sessão na agenda"
                                >
                                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>Agendar Sessão</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleAdvanceSession(pacote.id)}
                                className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Abater +1 Sessão</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Todas Feitas</span>
                            </span>
                          )}

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => setPacoteToDelete(pacote)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                              title="Excluir pacote de tratamento (Admin)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* FORM: BUILD CUSTOM SERVICE PACKAGE WITH DISCOUNT PREMISES */}
          {isAddingNew && (
            <form onSubmit={handleCreatePacote} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-5 animate-in fade-in duration-150">
              
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-purple-600 text-white rounded-lg">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Montador de Pacotes Personalizados & Regras de Desconto
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Combine procedimentos, defina quantidade de sessões e aplique descontos baseados em volume
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Mode toggle */}
                  <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setPackageType('personalizado')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        packageType === 'personalizado'
                          ? 'bg-white text-purple-700 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Combo Multi-Serviços
                    </button>
                    <button
                      type="button"
                      onClick={() => setPackageType('simples')}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                        packageType === 'simples'
                          ? 'bg-white text-purple-700 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Serviço Único (Sessões)
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Package Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Personalizado do Pacote / Protocolo
                </label>
                <input
                  type="text"
                  placeholder="Ex: Protocolo Noiva Glamour (Botox + 3x Laser + 2x Drenagem)"
                  value={nomePacote}
                  onChange={(e) => setNomePacote(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none"
                />
              </div>

              {/* MULTI-ITEM CUSTOM PACKAGE BUILDER */}
              {packageType === 'personalizado' ? (
                <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-purple-600" />
                      Procedimentos Inclusos no Pacote:
                    </span>
                    <button
                      type="button"
                      onClick={handleAddItemCustomizado}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-purple-200"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar Procedimento
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {itensCustomizados.map((item, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div className="flex-1 w-full sm:w-auto">
                          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                            Procedimento #{idx + 1}
                          </label>
                          <select
                            value={item.procedimento_id}
                            onChange={(e) => handleSelectProcedimentoForItem(idx, e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md outline-none focus:ring-1 focus:ring-purple-500 font-medium"
                          >
                            {procedimentos.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.nome} — R$ {p.valor_promocional || p.valor_tabela}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="w-24">
                          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                            Nº Sessões
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={item.sessoes}
                            onChange={(e) => handleUpdateItemCustomizado(idx, { sessoes: Math.max(1, Number(e.target.value)) })}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md outline-none focus:ring-1 focus:ring-purple-500 text-center font-bold"
                          />
                        </div>

                        <div className="w-32">
                          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                            Valor Unit. (R$)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={item.valor_unitario}
                            onChange={(e) => handleUpdateItemCustomizado(idx, { valor_unitario: Number(e.target.value) })}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                          />
                        </div>

                        <div className="w-28 text-right sm:text-left pt-2 sm:pt-4">
                          <span className="text-[10px] text-slate-400 block">Subtotal:</span>
                          <span className="text-xs font-bold text-slate-900 font-mono">
                            R$ {(item.sessoes * item.valor_unitario).toFixed(2)}
                          </span>
                        </div>

                        {itensCustomizados.length > 1 && (
                          <div className="pt-2 sm:pt-4">
                            <button
                              type="button"
                              onClick={() => handleRemoveItemCustomizado(idx)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                              title="Remover procedimento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* SINGLE PROCEDURE MODE */
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Procedimento / Tratamento *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Laser Lavieen Fracionado"
                      value={procedimentoSimples}
                      onChange={(e) => setProcedimentoSimples(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nº de Sessões *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      required
                      value={sessoesSimples}
                      onChange={(e) => setSessoesSimples(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-purple-500 font-bold text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Valor Unitário da Sessão (R$) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={valorUnitarioSimples}
                      onChange={(e) => setValorUnitarioSimples(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                    />
                  </div>
                </div>
              )}

              {/* DISCOUNT PREMISES & ADMIN OVERRIDE ENGINE */}
              <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <BadgePercent className="w-4 h-4 text-purple-700" />
                    <span className="text-xs font-bold text-purple-900">
                      Premissas de Desconto & Políticas Comerciais
                    </span>
                  </div>

                  {isAdmin && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Descontos Superiores Permitidos (Admin)
                    </span>
                  )}
                </div>

                {/* Preset discount buttons */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1.5">
                    Regras de Desconto Padrão do Sistema:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {REGRAS_DESCONTO_PADRAO.map((regra) => {
                      const isSelected = descontoTipo === 'padrao' && regraDescontoSelecionada === regra.id;
                      return (
                        <button
                          type="button"
                          key={regra.id}
                          onClick={() => {
                            setDescontoTipo('padrao');
                            setRegraDescontoSelecionada(regra.id);
                          }}
                          className={`p-2 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-purple-600 text-white border-purple-600 shadow-xs font-bold'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300'
                          }`}
                        >
                          <div className="truncate">{regra.label}</div>
                          <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-purple-100' : 'text-slate-400'}`}>
                            {regra.percentual}% de abatimento automático
                          </div>
                        </button>
                      );
                    })}

                    {/* Custom discount button */}
                    <button
                      type="button"
                      onClick={() => setDescontoTipo('custom_percent')}
                      className={`p-2 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                        descontoTipo !== 'padrao'
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs font-bold'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="truncate flex items-center gap-1">
                        <Sliders className="w-3 h-3" />
                        Desconto Personalizado
                      </div>
                      <div className={`text-[10px] mt-0.5 ${descontoTipo !== 'padrao' ? 'text-purple-100' : 'text-slate-400'}`}>
                        {isAdmin ? 'Qualquer % ou R$ (Admin)' : 'Até máx 20% (Operador)'}
                      </div>
                    </button>
                  </div>
                </div>

                {/* Custom discount inputs if selected */}
                {descontoTipo !== 'padrao' && (
                  <div className="p-3 bg-white rounded-lg border border-purple-200 space-y-2 mt-2">
                    <div className="flex items-center gap-4 text-xs font-semibold text-slate-700">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="customType"
                          checked={descontoTipo === 'custom_percent'}
                          onChange={() => setDescontoTipo('custom_percent')}
                          className="text-purple-600"
                        />
                        Porcentagem (% OFF)
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name="customType"
                          checked={descontoTipo === 'custom_valor'}
                          onChange={() => setDescontoTipo('custom_valor')}
                          className="text-purple-600"
                        />
                        Valor Fixo em Reais (R$)
                      </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {descontoTipo === 'custom_percent' ? (
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                            Percentual de Desconto (%):
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max={isAdmin ? 100 : LIMITE_DESCONTO_OPERADOR}
                              value={customPercentual}
                              onChange={(e) => setCustomPercentual(Number(e.target.value))}
                              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">%</span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                            Valor do Desconto em Dinheiro (R$):
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max={valorOriginalSemDesconto}
                              value={customValorDesconto}
                              onChange={(e) => setCustomValorDesconto(Number(e.target.value))}
                              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">R$</span>
                          </div>
                        </div>
                      )}

                      {/* Admin Override Badge / Non-admin Notice */}
                      <div className="flex items-center">
                        {isAboveSystemLimit ? (
                          isAdmin ? (
                            <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-800 flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>
                                <strong>Desconto Superior Autorizado:</strong> Você possui perfil Administrador para conceder descontos acima de {LIMITE_DESCONTO_OPERADOR}%.
                              </span>
                            </div>
                          ) : (
                            <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 flex items-center gap-1.5">
                              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                              <span>
                                Descontos superiores a {LIMITE_DESCONTO_OPERADOR}% exigem autorização de um Administrador. O valor foi limitado ao teto seguro.
                              </span>
                            </div>
                          )
                        ) : (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Info className="w-3.5 h-3.5 text-slate-400" />
                            <span>Desconto dentro da margem padrão cadastrada no sistema.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* FINANCIAL SUMMARY CARD */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-xl shadow-md space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300 block">
                  Resumo Financeiro & Condições Comerciais do Pacote
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center sm:text-left">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Total de Sessões</span>
                    <span className="text-lg font-bold text-white font-mono">{totalSessoesCalculado}x</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Valor Original</span>
                    <span className="text-sm font-semibold text-slate-300 line-through font-mono">
                      R$ {valorOriginalSemDesconto.toFixed(2)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-emerald-400 uppercase block font-bold">
                      Economia ({percentualEfetivo}%)
                    </span>
                    <span className="text-sm font-bold text-emerald-400 font-mono">
                      - R$ {valorDescontoCalculado.toFixed(2)}
                    </span>
                  </div>

                  <div className="bg-white/10 p-2 rounded-lg border border-white/10">
                    <span className="text-[10px] text-purple-200 uppercase block font-bold">Valor Final do Pacote</span>
                    <span className="text-lg font-extrabold text-white font-mono">
                      R$ {valorFinalComDesconto.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
                  <span>
                    Média por sessão: <strong>R$ {(totalSessoesCalculado > 0 ? valorFinalComDesconto / totalSessoesCalculado : 0).toFixed(2)}</strong>
                  </span>
                  {isAboveSystemLimit && isAdmin && (
                    <span className="text-emerald-300 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Autorização Especial de Desconto Vinculada
                    </span>
                  )}
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Observações / Condições de Pagamento
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Parcelado em até 6x no cartão sem juros no balcão. Válido por 12 meses."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-purple-500 resize-none"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-lg text-xs font-bold shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Salvar Pacote com Desconto
                </button>
              </div>

            </form>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>O saldo de sessões do pacote é abatido automaticamente nas consultas ou diretamente nesta tela.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg cursor-pointer transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>

      {/* Delete Package Confirmation Modal */}
      {pacoteToDelete && (
        <DeleteConfirmModal
          isOpen={!!pacoteToDelete}
          onClose={() => setPacoteToDelete(null)}
          onConfirm={() => {
            if (pacoteToDelete) {
              const pacotesAtualizados = pacotes.filter(p => p.id !== pacoteToDelete.id);
              onUpdatePaciente({
                ...paciente,
                pacotes: pacotesAtualizados,
              });
            }
            setPacoteToDelete(null);
          }}
          title="Excluir Pacote de Tratamento"
          itemType="Pacote"
          itemName={pacoteToDelete.nome_pacote}
          description={`Esta ação removerá o pacote "${pacoteToDelete.nome_pacote}" (${pacoteToDelete.sessoes_realizadas}/${pacoteToDelete.total_sessoes} sessões) da ficha do paciente.`}
        />
      )}
    </div>
  );
};
