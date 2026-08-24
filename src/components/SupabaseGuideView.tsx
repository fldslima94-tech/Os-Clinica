import React, { useState } from 'react';
import { 
  Database, 
  FolderTree, 
  Copy, 
  Check, 
  Terminal, 
  ShieldCheck, 
  ExternalLink, 
  CheckCircle2,
  Server,
  Layers,
  ArrowRight
} from 'lucide-react';
import { SUPABASE_SQL_SCRIPT } from '../data/supabaseSql';
import { NEXTJS_PROJECT_STRUCTURE, NEXTJS_SUPABASE_CLIENT_SNIPPET, NEXTJS_ENV_SNIPPET } from '../data/nextStructure';

export const SupabaseGuideView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'sql' | 'nextjs' | 'env'>('sql');
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* Overview Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm border border-slate-800">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Etapa 1: Infraestrutura Custo R$ 0,00
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
            Guia de Implementação: Supabase & Next.js
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Aqui você encontra o script SQL exato para criar as 3 tabelas no PostgreSQL do Supabase, a estrutura recomendada do Next.js (App Router) e as variáveis de ambiente necessárias.
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-800 text-xs">
          <div className="bg-slate-800/60 p-3.5 rounded-lg border border-slate-700/50">
            <p className="text-slate-400 font-medium">Banco de Dados</p>
            <p className="font-bold text-white text-sm mt-0.5">PostgreSQL (Supabase)</p>
            <p className="text-[11px] text-green-400 mt-0.5 font-medium">3 tabelas + RLS ativo</p>
          </div>
          <div className="bg-slate-800/60 p-3.5 rounded-lg border border-slate-700/50">
            <p className="text-slate-400 font-medium">Frontend</p>
            <p className="font-bold text-white text-sm mt-0.5">Next.js 14/15 App Router</p>
            <p className="text-[11px] text-indigo-300 mt-0.5 font-medium">React + Tailwind + Lucide</p>
          </div>
          <div className="bg-slate-800/60 p-3.5 rounded-lg border border-slate-700/50">
            <p className="text-slate-400 font-medium">Autenticação</p>
            <p className="font-bold text-white text-sm mt-0.5">Supabase Auth</p>
            <p className="text-[11px] text-sky-400 mt-0.5 font-medium">Login balcão / recepcionista</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveSubTab('sql')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeSubTab === 'sql'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>1. Script SQL Supabase</span>
            </button>

            <button
              onClick={() => setActiveSubTab('nextjs')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeSubTab === 'nextjs'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <FolderTree className="w-4 h-4" />
              <span>2. Estrutura Next.js</span>
            </button>

            <button
              onClick={() => setActiveSubTab('env')}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeSubTab === 'env'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>3. .env.local & Cliente</span>
            </button>
          </div>

          <div>
            {activeSubTab === 'sql' && (
              <button
                onClick={() => handleCopy(SUPABASE_SQL_SCRIPT, 'sql')}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                {copied === 'sql' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Script Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Script SQL</span>
                  </>
                )}
              </button>
            )}

            {activeSubTab === 'nextjs' && (
              <button
                onClick={() => handleCopy(NEXTJS_PROJECT_STRUCTURE, 'structure')}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                {copied === 'structure' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Estrutura Copiada!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Árvore de Pastas</span>
                  </>
                )}
              </button>
            )}

            {activeSubTab === 'env' && (
              <button
                onClick={() => handleCopy(NEXTJS_ENV_SNIPPET, 'env')}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 active:bg-black text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                {copied === 'env' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>.env Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar .env.local</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Code Displays */}
        <div className="p-5 bg-slate-950 text-slate-200">
          
          {activeSubTab === 'sql' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs">
                <p className="font-bold text-white mb-1">Passo a passo para rodar no Supabase:</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px]">
                  <li>Crie um projeto gratuito em <strong>supabase.com</strong>.</li>
                  <li>No menu lateral esquerdo, clique no ícone <strong>SQL Editor</strong>.</li>
                  <li>Clique em <strong>New Query</strong>, cole o código abaixo e clique em <strong>Run</strong>.</li>
                  <li>Pronto! As 3 tabelas (<code className="text-emerald-400">pacientes</code>, <code className="text-emerald-400">agendamentos</code>, <code className="text-emerald-400">estoque_insumos</code>) serão criadas com índices, integridade referencial e dados de teste.</li>
                </ol>
              </div>

              <pre className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 overflow-x-auto font-mono text-[11px] leading-relaxed text-emerald-400">
                {SUPABASE_SQL_SCRIPT}
              </pre>
            </div>
          )}

          {activeSubTab === 'nextjs' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs">
                <p className="font-bold text-white mb-1">Organização no Next.js (App Router):</p>
                <p className="text-[11px] text-slate-400">
                  Estrutura modular com separação de rotas protegidas pelo Supabase Auth em <code className="text-indigo-400">app/(dashboard)</code> e cliente SSR em <code className="text-indigo-400">lib/supabase</code>.
                </p>
              </div>

              <pre className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 overflow-x-auto font-mono text-[11px] leading-relaxed text-amber-300">
                {NEXTJS_PROJECT_STRUCTURE}
              </pre>
            </div>
          )}

          {activeSubTab === 'env' && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-bold text-white mb-1">1. Arquivo de Variáveis de Ambiente (.env.local):</p>
                <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 font-mono text-[11px] text-sky-300">
                  {NEXTJS_ENV_SNIPPET}
                </pre>
              </div>

              <div>
                <p className="text-xs font-bold text-white mb-1">2. Cliente Supabase do Navegador (lib/supabase/client.ts):</p>
                <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 font-mono text-[11px] text-indigo-300">
                  {NEXTJS_SUPABASE_CLIENT_SNIPPET}
                </pre>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
