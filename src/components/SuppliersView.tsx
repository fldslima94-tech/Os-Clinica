import React, { useState } from 'react';
import { 
  Building, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  Tag, 
  MapPin, 
  CreditCard, 
  FileText, 
  MessageCircle, 
  Trash2, 
  Edit3, 
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Fornecedor, CategoriaFornecedor, UsuarioEquipe, TransacaoFinanceira } from '../types';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface SuppliersViewProps {
  fornecedores: Fornecedor[];
  transacoes?: TransacaoFinanceira[];
  onOpenNewSupplier: () => void;
  onEditSupplier: (fornecedor: Fornecedor) => void;
  onDeleteSupplier: (id: string, motivo?: string) => void;
  currentUser?: UsuarioEquipe;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({
  fornecedores,
  transacoes = [],
  onOpenNewSupplier,
  onEditSupplier,
  onDeleteSupplier,
  currentUser,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('todos');
  const [supplierToDelete, setSupplierToDelete] = useState<Fornecedor | null>(null);

  const getCategoryBadge = (categoria: string) => {
    switch (categoria) {
      case 'insumos':
        return { label: 'Insumos & Pigmentos', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'equipamentos':
        return { label: 'Equipamentos & Lasers', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'manutencao':
        return { label: 'Manutenção & Laudos', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'servicos':
        return { label: 'Serviços Gerais', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'software':
        return { label: 'TI & Software', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'imobiliario':
        return { label: 'Imobiliário / Aluguel', color: 'bg-slate-50 text-slate-700 border-slate-200' };
      default:
        return { label: 'Fornecimentos Diversos', color: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  const filteredFornecedores = fornecedores.filter(f => {
    const q = search.toLowerCase().trim();
    const matchesSearch = !q || 
      f.razao_social.toLowerCase().includes(q) ||
      (f.nome_fantasia && f.nome_fantasia.toLowerCase().includes(q)) ||
      (f.cnpj_cpf && f.cnpj_cpf.includes(q)) ||
      f.telefone.includes(q) ||
      (f.email && f.email.toLowerCase().includes(q)) ||
      (f.contato_responsavel && f.contato_responsavel.toLowerCase().includes(q));

    const matchesCat = selectedCategoria === 'todos' || f.categoria === selectedCategoria;
    return matchesSearch && matchesCat;
  });

  const getSpentWithSupplier = (forn: Fornecedor) => {
    const nameMatch = forn.nome_fantasia?.toLowerCase() || forn.razao_social.toLowerCase();
    return transacoes
      .filter(t => (t.tipo === 'saida' || t.tipo === 'despesa') && !t.excluido && t.paciente_nome.toLowerCase().includes(nameMatch.slice(0, 8)))
      .reduce((acc, t) => acc + t.valor, 0);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              Compras & Cadeia de Suprimentos
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Gestão de Fornecedores & Parceiros
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Cadastro de distribuidores de toxinas, insumos estéticos, suporte de laser e contratos de manutenção.
          </p>
        </div>

        <button
          onClick={onOpenNewSupplier}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 rounded-xl text-sm font-bold transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Novo Fornecedor</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por razão social, nome fantasia, CNPJ, telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none text-xs">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'insumos', label: 'Insumos' },
            { id: 'equipamentos', label: 'Equipamentos' },
            { id: 'manutencao', label: 'Manutenção' },
            { id: 'servicos', label: 'Serviços' },
            { id: 'software', label: 'Software/TI' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoria(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategoria === cat.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Suppliers Grid */}
      {filteredFornecedores.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <Building className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">Nenhum fornecedor encontrado</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Cadastre novos distribuidores, representantes de produtos e empresas de assistência técnica.
          </p>
          <button
            onClick={onOpenNewSupplier}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-slate-950 rounded-xl text-xs font-bold hover:bg-amber-600 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Cadastrar Primeiro Fornecedor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredFornecedores.map((forn) => {
            const badge = getCategoryBadge(forn.categoria);
            const totalGasto = getSpentWithSupplier(forn);
            const phoneDigits = forn.telefone.replace(/\D/g, '');

            return (
              <div
                key={forn.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top line with Category & Actions */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>
                      {badge.label}
                    </span>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEditSupplier(forn)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="Editar Fornecedor"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setSupplierToDelete(forn)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Excluir Fornecedor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Fantasy Name */}
                  <div className="mb-3">
                    <h3 className="font-bold text-slate-900 text-base leading-snug">
                      {forn.razao_social}
                    </h3>
                    {forn.nome_fantasia && (
                      <p className="text-xs text-indigo-600 font-semibold mt-0.5">
                        {forn.nome_fantasia}
                      </p>
                    )}
                    {forn.cnpj_cpf && (
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        CNPJ/CPF: {forn.cnpj_cpf}
                      </p>
                    )}
                  </div>

                  {/* Contact Info List */}
                  <div className="space-y-1.5 py-2.5 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-medium">{forn.telefone}</span>
                      {phoneDigits && (
                        <a
                          href={`https://wa.me/55${phoneDigits}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold hover:bg-emerald-100 transition-colors ml-auto"
                        >
                          <MessageCircle className="w-3 h-3" />
                          WhatsApp
                        </a>
                      )}
                    </div>

                    {forn.email && (
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{forn.email}</span>
                      </div>
                    )}

                    {forn.contato_responsavel && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Contato:</span>
                        <span className="font-medium text-slate-800">{forn.contato_responsavel}</span>
                      </div>
                    )}

                    {forn.cidade_uf && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>{forn.cidade_uf}</span>
                      </div>
                    )}
                  </div>

                  {/* PIX / Banking Info */}
                  {forn.pix_chave && (
                    <div className="mt-2.5 p-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-semibold">PIX:</span>
                        <span className="font-mono text-slate-800 truncate max-w-[140px]">{forn.pix_chave}</span>
                      </div>
                    </div>
                  )}

                  {/* Observações */}
                  {forn.observacoes && (
                    <p className="mt-2.5 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg line-clamp-2">
                      {forn.observacoes}
                    </p>
                  )}
                </div>

                {/* Bottom Card Summary */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Status</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    forn.status === 'ativo' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {forn.status === 'ativo' ? 'Parceiro Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {supplierToDelete && (
        <DeleteConfirmModal
          isOpen={!!supplierToDelete}
          title="Excluir Fornecedor"
          message={`Tem certeza que deseja excluir o fornecedor "${supplierToDelete.razao_social}"? Esta ação removerá o registro dos cadastros da clínica.`}
          onClose={() => setSupplierToDelete(null)}
          onConfirm={(motivo) => {
            onDeleteSupplier(supplierToDelete.id, motivo);
            setSupplierToDelete(null);
          }}
        />
      )}

    </div>
  );
};
