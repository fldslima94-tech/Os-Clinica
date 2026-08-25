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
  HeartPulse
} from 'lucide-react';
import { Paciente, UsuarioEquipe } from '../types';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface PatientsViewProps {
  pacientes: Paciente[];
  onOpenNewPatient: () => void;
  onViewPatient: (paciente: Paciente) => void;
  onOpenPackages?: (paciente: Paciente) => void;
  onDeletePatient?: (id: string) => void;
  currentUser?: UsuarioEquipe;
}

export const PatientsView: React.FC<PatientsViewProps> = ({
  pacientes,
  onOpenNewPatient,
  onViewPatient,
  onOpenPackages,
  onDeletePatient,
  currentUser,
}) => {
  const isGestor = !currentUser || currentUser.role === 'gestor' || currentUser.role === 'admin';
  const [search, setSearch] = useState('');
  const [patientToDelete, setPatientToDelete] = useState<Paciente | null>(null);

  const filteredPacientes = pacientes.filter(p => {
    const q = search.toLowerCase().trim();
    return (
      !q ||
      p.nome.toLowerCase().includes(q) ||
      p.telefone.includes(q) ||
      (p.email && p.email.toLowerCase().includes(q)) ||
      (p.historico_clinico && p.historico_clinico.toLowerCase().includes(q))
    );
  });

  const calculateAge = (birthDateString?: string) => {
    if (!birthDateString) return null;
    try {
      const birth = new Date(birthDateString);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    } catch {
      return null;
    }
  };

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
              Prontuários & Anamnese
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Fichas de Clientes & Histórico Clínico
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Anamneses personalizáveis, evoluções de retorno clínico e galeria fotográfica privada antes/depois.
          </p>
        </div>

        <button
          onClick={onOpenNewPatient}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Nova Ficha</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar ficha por nome do cliente, telefone, e-mail ou histórico..."
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
            onClick={onOpenNewPatient}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Cadastrar Primeira Ficha
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPacientes.map((paciente) => {
            const age = calculateAge(paciente.data_nascimento);
            const totalFotos = (paciente.fotos_antes_depois?.length || 0) + (paciente.galeria_clinica?.length || 0);
            const totalEvolucoes = paciente.evolucoes_retornos?.length || 0;

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

                    <div className="flex items-center gap-1.5">
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

                  <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                    {paciente.nome}
                  </h3>

                  <div className="mt-2 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{paciente.telefone}</span>
                    </div>

                    {paciente.data_nascimento && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{formatDate(paciente.data_nascimento)} {age ? `(${age} anos)` : ''}</span>
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
                    <span>Abrir Ficha Completa</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  {isGestor && onDeletePatient && (
                    <button
                      onClick={() => setPatientToDelete(paciente)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Excluir Ficha"
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
          onConfirm={() => {
            onDeletePatient(patientToDelete.id);
            setPatientToDelete(null);
          }}
          title="Excluir Ficha de Cliente"
          description={`Tem certeza que deseja excluir a ficha de ${patientToDelete.nome}? Esta ação removerá o prontuário e registros associados.`}
        />
      )}
    </div>
  );
};
