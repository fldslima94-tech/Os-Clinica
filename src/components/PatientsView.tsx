import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  Calendar, 
  FileText, 
  MessageCircle, 
  AlertCircle, 
  ChevronRight,
  ShieldAlert,
  Package,
  Trash2,
  Sparkles,
  Camera,
  HeartPulse,
  Building,
  CheckCircle2,
  MapPin,
  Clock
} from 'lucide-react';
import { Paciente, UsuarioEquipe } from '../types';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { MasterEditableText } from './MasterEditableText';
import { checkUserCustomPermission, COLLECTIONS } from '../services/firebaseService';
import { calcularIdade } from '../utils/anamneseValidation';

interface PatientsViewProps {
  pacientes: Paciente[];
  onOpenNewPatient: () => void;
  onOpenNewAnamnese?: () => void;
  onViewPatient: (paciente: Paciente) => void;
  onOpenPackages?: (paciente: Paciente) => void;
  onDeletePatient?: (id: string, motivo?: string) => void;
  onGoToSuppliers?: () => void;
  currentUser?: UsuarioEquipe;
}

export const PatientsView: React.FC<PatientsViewProps> = ({
  pacientes,
  onOpenNewPatient,
  onOpenNewAnamnese,
  onViewPatient,
  onOpenPackages,
  onDeletePatient,
  onGoToSuppliers,
  currentUser,
}) => {
  const canDelete = checkUserCustomPermission(currentUser, 'clientes', 'excluir');
  const [search, setSearch] = useState('');
  const [patientToDelete, setPatientToDelete] = useState<Paciente | null>(null);

  const filteredPacientes = pacientes.filter(p => {
    const q = search.toLowerCase().trim();
    return (
      !q ||
      p.nome.toLowerCase().includes(q) ||
      p.telefone.includes(q) ||
      (p.email && p.email.toLowerCase().includes(q)) ||
      (p.cpf && p.cpf.includes(q)) ||
      (p.historico_clinico && p.historico_clinico.toLowerCase().includes(q))
    );
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Prontuários & Anamnese Completa
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Fichas de Clientes & Anamneses Clínicas
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Anamnese estruturada com validação estrita, assinatura digital em canvas, evoluções de retorno e galeria de fotos.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Botão Unificado: Cadastro Direto com Anamnese Obrigatória */}
          <button
            onClick={onOpenNewAnamnese || onOpenNewPatient}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs"
          >
            <Sparkles className="w-4 h-4" />
            <span>Novo Cadastro com Anamnese</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar ficha por nome do cliente, telefone, CPF, e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium hidden sm:block">
          Total de <strong>{filteredPacientes.length}</strong> fichas cadastradas
        </div>
      </div>

      {/* Patient Cards Grid */}
      {filteredPacientes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">Nenhuma ficha de cliente encontrada</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Cadastre novos clientes com anamnese clínica, fotos de acompanhamento e termos de consentimento.
          </p>
          <button
            onClick={onOpenNewAnamnese || onOpenNewPatient}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Novo Cadastro com Anamnese
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPacientes.map((paciente) => {
            const age = calcularIdade(paciente.data_nascimento);
            const totalFotos = (paciente.fotos_antes_depois?.length || 0) + (paciente.galeria_clinica?.length || 0);
            const totalEvolucoes = paciente.evolucoes_retornos?.length || 0;
            const totalAnamneses = paciente.anamneses_completas?.length || 0;

            return (
              <div
                key={paciente.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                      {paciente.nome.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {totalAnamneses > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          {totalAnamneses} Anamnese{totalAnamneses > 1 ? 's' : ''}
                        </span>
                      )}
                      {totalFotos > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          <Camera className="w-3 h-3" />
                          {totalFotos} fotos
                        </span>
                      )}
                      {totalEvolucoes > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <HeartPulse className="w-3 h-3" />
                          {totalEvolucoes} evoluções
                        </span>
                      )}
                    </div>
                  </div>

                  <MasterEditableText
                    collectionName={COLLECTIONS.PACIENTES}
                    documentId={paciente.id}
                    fieldKey="nome"
                    value={paciente.nome}
                    allowDelete={true}
                    deleteLabel={paciente.nome}
                  >
                    <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                      {paciente.nome}
                    </h3>
                  </MasterEditableText>

                  <div className="mt-2 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-slate-800">{paciente.telefone}</span>
                    </div>

                    {paciente.data_nascimento && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{formatDate(paciente.data_nascimento)} {age !== '' ? `(${age} anos)` : ''}</span>
                      </div>
                    )}

                    {paciente.endereco && (
                      <div className="flex items-center gap-2 text-slate-500 text-[11px] truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{paciente.endereco}</span>
                      </div>
                    )}

                    {paciente.fototipo && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fototipo:</span>
                        <span className="font-semibold text-slate-700">{paciente.fototipo}</span>
                      </div>
                    )}

                    {paciente.alergias && (
                      <div className="mt-2 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-start gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-2"><strong>Alergias:</strong> {paciente.alergias}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => onViewPatient(paciente)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                  >
                    <span>Abrir Prontuário & Ficha</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  {canDelete && onDeletePatient && (
                    <button
                      onClick={() => setPatientToDelete(paciente)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Excluir Ficha (Requer Justificativa de Auditoria)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {patientToDelete && onDeletePatient && (
        <DeleteConfirmModal
          isOpen={true}
          onClose={() => setPatientToDelete(null)}
          onConfirm={(motivo) => {
            onDeletePatient(patientToDelete.id, motivo);
            setPatientToDelete(null);
          }}
          title="Excluir Ficha de Cliente"
          description={`Tem certeza que deseja excluir o cadastro do cliente? Esta operação será registrada no log de auditoria.`}
          itemName={patientToDelete.nome}
          itemCategory="Ficha de Cliente / Prontuário"
          requireReason={true}
        />
      )}
    </div>
  );
};
