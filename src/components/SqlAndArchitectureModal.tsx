import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Database, 
  FolderTree, 
  Sparkles, 
  ExternalLink,
  ShieldCheck,
  FileCode2,
  Terminal
} from 'lucide-react';
import { SUPABASE_SQL_SCRIPT } from '../data/supabaseSql';
import { NEXTJS_PROJECT_STRUCTURE, NEXTJS_SUPABASE_CLIENT_SNIPPET, NEXTJS_ENV_SNIPPET } from '../data/nextStructure';

interface SqlAndArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SqlAndArchitectureModal: React.FC<SqlAndArchitectureModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'sql' | 'nextjs' | 'env'>('sql');
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Etapa 1: Backend Supabase & Arquitetura Next.js
                </h3>
                <span className="text-[10px] font-semibold bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200/60">
                  Custo R$ 0,00
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Scripts SQL exatos para o PostgreSQL do Supabase e árvore estrutural do projeto Next.js.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3 border-b border-slate-200 flex items-center gap-4 bg-white text-xs">
          <button
            onClick={() => setActiveTab('sql')}
            className={`pb-3 font-semibold transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'sql'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Script SQL Supabase (3 Tabelas + RLS + Seed)</span>
          </button>

          <button
            onClick={() => setActiveTab('nextjs')}
            className={`pb-3 font-semibold transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'nextjs'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>Estrutura de Pastas Next.js (App Router)</span>
          </button>

          <button
            onClick={() => setActiveTab('env')}
            className={`pb-3 font-semibold transition-all cursor-pointer border-b-2 flex items-center gap-1.5 ${
              activeTab === 'env'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Configuração .env.local & Cliente</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 flex-1 overflow-y-auto bg-slate-950 text-slate-100 font-mono text-xs">
          
          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-900 p-3.5 rounded-lg border border-slate-800 text-slate-300 font-sans">
                <div>
                  <p className="font-semibold text-xs text-white">Como rodar no Supabase:</p>
                  <p className="text-[11px] text-slate-400">
                    Acesse seu painel no Supabase → Menu <strong>SQL Editor</strong> → Cole o script abaixo e clique em <strong>Run</strong>.
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(SUPABASE_SQL_SCRIPT, 'sql')}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  {copied === 'sql' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Script SQL</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 overflow-x-auto text-[11px] leading-relaxed text-emerald-400">
                {SUPABASE_SQL_SCRIPT}
              </pre>
            </div>
          )}

          {activeTab === 'nextjs' && (
            <div className="space-y-4 font-sans">
              <div className="flex items-center justify-between bg-slate-900 p-3.5 rounded-lg border border-slate-800 text-slate-300">
                <div>
                  <p className="font-semibold text-xs text-white">Arquitetura Next.js 14+ (App Router):</p>
                  <p className="text-[11px] text-slate-400">
                    Estrutura modular com separação por Server Components, Client Modals e helpers do Supabase SSR.
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(NEXTJS_PROJECT_STRUCTURE, 'structure')}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer font-sans shadow-xs"
                >
                  {copied === 'structure' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Estrutura</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 overflow-x-auto font-mono text-[11px] leading-relaxed text-amber-300">
                {NEXTJS_PROJECT_STRUCTURE}
              </pre>
            </div>
          )}

          {activeTab === 'env' && (
            <div className="space-y-4 font-sans">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-semibold text-xs text-white">1. Arquivo .env.local:</span>
                  <button
                    onClick={() => handleCopy(NEXTJS_ENV_SNIPPET, 'env')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copied === 'env' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copiar .env</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 font-mono text-[11px] text-sky-300">
                  {NEXTJS_ENV_SNIPPET}
                </pre>

                <div className="flex items-center justify-between text-slate-300 pt-3 border-t border-slate-800">
                  <span className="font-semibold text-xs text-white">2. lib/supabase/client.ts (Supabase SSR):</span>
                  <button
                    onClick={() => handleCopy(NEXTJS_SUPABASE_CLIENT_SNIPPET, 'client')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copied === 'client' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copiar Client</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 font-mono text-[11px] text-indigo-300">
                  {NEXTJS_SUPABASE_CLIENT_SNIPPET}
                </pre>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            <span>Tabelas prontas com Row Level Security (RLS) habilitado.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 active:bg-black text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-sm"
          >
            Fechar Visualizador
          </button>
        </div>

      </div>
    </div>
  );
};
