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
  Package
} from 'lucide-react';
import { Paciente } from '../types';

interface PatientsViewProps {
  pacientes: Paciente[];
  onOpenNewPatient: () => void;
  onViewPatient: (paciente: Paciente) => void;
  onOpenPackages?: (paciente: Paciente) => void;
}

export const PatientsView: React.FC<PatientsViewProps> = ({
  pacientes,
  onOpenNewPatient,
  onViewPatient,
  onOpenPackages,
}) => {
  const [search, setSearch] = useState('');

  const filteredPacientes = pacientes.filter(p => {
    const q = search.toLowerCase();
    return (
      p.nome.toLowerCase().includes(q) ||
      p.telefone.includes(q) ||
      p.historico_clinico.toLowerCase().includes(q)
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Cadastro de Pacientes & Prontuários
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Gerenciamento de prontuários estéticos, histórico de alergias e dados de contato.
          </p>
        </div>

        <button
          onClick={onOpenNewPatient}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Paciente</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, telefone ou queixa/histórico..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
        <span className="text-xs text-slate-400 font-medium">
          {filteredPacientes.length} paciente{filteredPacientes.length !== 1 ? 's' : ''} encontrado{filteredPacientes.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Patients List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPacientes.map(paciente => {
          const age = calculateAge(paciente.data_nascimento);
          const hasAlergy = paciente.historico_clinico.toLowerCase().includes('alerg');

          return (
            <div
              key={paciente.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0 border border-slate-300">
                      {paciente.nome.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-tight">
                        {paciente.nome}
                      </h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(paciente.data_nascimento)} {age ? `(${age} anos)` : ''}</span>
                      </p>
                    </div>
                  </div>

                  {hasAlergy && (
                    <span 
                      title="Alergia relatada no histórico"
                      className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60 text-[10px] font-semibold inline-flex items-center gap-1"
                    >
                      <ShieldAlert className="w-3 h-3 text-amber-600" />
                      Alergia
                    </span>
                  )}
                </div>

                <div className="space-y-2.5 mb-4 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Telefone:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">{paciente.telefone}</span>
                      <a
                        href={`https://wa.me/55${paciente.telefone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 hover:text-emerald-700 p-0.5 rounded hover:bg-emerald-50 transition-colors"
                        title="Conversar no WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {/* Pacotes Ativos */}
                  {paciente.pacotes && paciente.pacotes.length > 0 && (
                    <div className="p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-indigo-900 font-medium">
                        <Package className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{paciente.pacotes.length} Pacote{paciente.pacotes.length > 1 ? 's' : ''} Ativo{paciente.pacotes.length > 1 ? 's' : ''}</span>
                      </div>
                      <span className="text-[10px] font-bold bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded">
                        {paciente.pacotes.reduce((acc, p) => acc + (p.sessoes_totais - p.sessoes_realizadas), 0)} sessões rest.
                      </span>
                    </div>
                  )}

                  {/* Prontuário / Histórico Clínico Preview */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <p className="text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      Histórico Clínico / Prontuário:
                    </p>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {paciente.historico_clinico || 'Sem histórico ou queixas cadastradas.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  onClick={() => onOpenPackages && onOpenPackages(paciente)}
                  className="py-2 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  title="Gerenciar Pacotes e Sessões deste paciente"
                >
                  <Package className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Pacotes</span>
                </button>
                <button
                  onClick={() => onViewPatient(paciente)}
                  className="py-2 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Prontuário</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
