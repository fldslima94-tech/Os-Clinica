import React from 'react';
import { 
  Printer, 
  X, 
  FileText, 
  ShieldCheck, 
  HeartPulse, 
  User, 
  Phone, 
  Calendar, 
  MapPin, 
  Sparkles, 
  Clock 
} from 'lucide-react';
import { AnamneseCompleta, ClinicaConfig, UsuarioEquipe } from '../types';

interface PrintableAnamneseModalProps {
  isOpen: boolean;
  onClose: () => void;
  anamnese: AnamneseCompleta | null;
  clinicaConfig?: ClinicaConfig;
  currentUser?: UsuarioEquipe;
}

export const PrintableAnamneseModal: React.FC<PrintableAnamneseModalProps> = ({
  isOpen,
  onClose,
  anamnese,
  clinicaConfig,
  currentUser,
}) => {
  if (!isOpen || !anamnese) return null;

  const handlePrint = () => {
    window.print();
  };

  const dp = anamnese.dadosPessoais || ({} as any);
  const sg = anamnese.saudeGeral || ({} as any);
  const proc = anamnese.detalhesProcedimento || ({} as any);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      
      {/* Botões Flutuantes de Ação (Ocultados na impressão) */}
      <div className="fixed top-4 right-4 z-60 flex items-center gap-2 print:hidden">
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg text-xs sm:text-sm font-bold transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimir / Salvar PDF</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="p-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl shadow-lg transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Folha A4 Formatada */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl p-6 sm:p-10 space-y-6 my-8 print:my-0 print:border-none print:shadow-none print:p-4 print:max-w-none text-slate-800">
        
        {/* Cabeçalho da Clínica */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
              {clinicaConfig?.nome || 'Studio Estética & Gestão Clínica'}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              {clinicaConfig?.slogan || 'Excelência em Tratamentos Estéticos Avançados e Cosmetologia'}
            </p>
            <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-4">
              <span>Tel/WhatsApp: {clinicaConfig?.telefone || '(11) 98765-4321'}</span>
              <span>{clinicaConfig?.endereco || 'São Paulo - SP'}</span>
              {clinicaConfig?.cnpj && <span>CNPJ: {clinicaConfig.cnpj}</span>}
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold rounded-lg block text-center mb-1">
              Ficha de Anamnese Oficial
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Registro Nº: {anamnese.id.slice(-8).toUpperCase()}
            </span>
          </div>
        </div>

        {/* 1. DADOS PESSOAIS DO CLIENTE */}
        <div className="space-y-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-indigo-900 bg-slate-100 px-3 py-1.5 rounded-lg">
            1. Dados Pessoais do Cliente
          </h2>
          <div className="flex flex-col sm:flex-row items-start gap-4">
            {anamnese.fotoPacienteUrl && (
              <div className="shrink-0 text-center space-y-1">
                <img
                  src={anamnese.fotoPacienteUrl}
                  alt="Foto Clínica do Paciente"
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl object-cover border-2 border-slate-300 shadow-xs"
                />
                <span className="text-[9px] uppercase font-bold text-slate-500 block">
                  Foto do Atendimento
                </span>
              </div>
            )}
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs w-full">
              <div>
                <span className="text-slate-500 font-semibold block text-[11px]">Nome Completo:</span>
                <strong className="text-slate-900">{dp.nomeCompleto}</strong>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block text-[11px]">Data de Nascimento / Idade:</span>
                <strong>{dp.dataNascimento ? new Date(dp.dataNascimento).toLocaleDateString('pt-BR') : '-'} ({dp.idade} anos)</strong>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block text-[11px]">Telefone / WhatsApp:</span>
                <strong>{dp.telefone}</strong>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block text-[11px]">E-mail:</span>
                <span>{dp.email || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block text-[11px]">Profissão:</span>
                <span>{dp.profissao || '-'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block text-[11px]">Contato de Emergência:</span>
                <span>{dp.contatoEmergencia?.nome || '-'} ({dp.contatoEmergencia?.telefone || '-'})</span>
              </div>
              <div className="sm:col-span-3">
                <span className="text-slate-500 font-semibold block text-[11px]">Endereço Completo:</span>
                <span>{dp.endereco || 'Não informado'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. ANAMNESE GERAL DE SAÚDE */}
        <div className="space-y-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-indigo-900 bg-slate-100 px-3 py-1.5 rounded-lg">
            2. Anamnese Geral & Histórico de Saúde
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            
            <div className="p-2 border border-slate-200 rounded-lg flex items-center justify-between">
              <span>Gestante ou amamentando?</span>
              <strong className={sg.gestanteOuAmamentando ? 'text-rose-600' : 'text-slate-700'}>
                {sg.gestanteOuAmamentando ? 'SIM' : 'NÃO'}
              </strong>
            </div>

            <div className="p-2 border border-slate-200 rounded-lg flex items-center justify-between">
              <span>Diabetes ou Pressão Alta?</span>
              <strong className={sg.diabetesOuPressaoAlta ? 'text-amber-600' : 'text-slate-700'}>
                {sg.diabetesOuPressaoAlta ? 'SIM' : 'NÃO'}
              </strong>
            </div>

            <div className="p-2 border border-slate-200 rounded-lg flex items-center justify-between">
              <span>Histórico de queloide / cicatrização ruim?</span>
              <strong className={sg.historicoQueloide ? 'text-amber-600' : 'text-slate-700'}>
                {sg.historicoQueloide ? 'SIM' : 'NÃO'}
              </strong>
            </div>

            <div className="p-2 border border-slate-200 rounded-lg flex items-center justify-between">
              <span>Problemas de coagulação / anticoagulantes?</span>
              <strong className={sg.problemasCoagulacao ? 'text-rose-600' : 'text-slate-700'}>
                {sg.problemasCoagulacao ? 'SIM' : 'NÃO'}
              </strong>
            </div>

            <div className="p-2 border border-slate-200 rounded-lg flex items-center justify-between">
              <span>Herpes ativa ou recorrente?</span>
              <strong className={sg.herpesAtiva ? 'text-amber-600' : 'text-slate-700'}>
                {sg.herpesAtiva ? 'SIM' : 'NÃO'}
              </strong>
            </div>

            <div className="p-2 border border-slate-200 rounded-lg flex items-center justify-between">
              <span>Possui alergias declaradas?</span>
              <strong className={sg.possuiAlergias ? 'text-rose-600' : 'text-slate-700'}>
                {sg.possuiAlergias ? `SIM (${sg.detalhesAlergias || 'Especificadas'})` : 'NÃO'}
              </strong>
            </div>

            <div className="p-2 border border-slate-200 rounded-lg flex items-center justify-between sm:col-span-2">
              <span>Uso de ácidos na pele atualmente:</span>
              <strong className={sg.usoAcidos ? 'text-amber-700' : 'text-slate-700'}>
                {sg.usoAcidos ? `SIM (${sg.detalhesAcidos})` : 'NÃO'}
              </strong>
            </div>

            <div className="p-2 border border-slate-200 rounded-lg flex items-center justify-between sm:col-span-2">
              <span>Cirurgia estética recente (12 meses):</span>
              <strong className={sg.cirurgiaEsteticaRecente ? 'text-amber-700' : 'text-slate-700'}>
                {sg.cirurgiaEsteticaRecente ? `SIM (${sg.detalhesCirurgia})` : 'NÃO'}
              </strong>
            </div>

          </div>
        </div>

        {/* 3. PROCEDIMENTO TÉCNICO ESPECÍFICO */}
        <div className="space-y-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-indigo-900 bg-slate-100 px-3 py-1.5 rounded-lg flex items-center justify-between">
            <span>3. Avaliação Técnica do Procedimento</span>
            <span className="text-indigo-600">{anamnese.procedimentoNome}</span>
          </h2>

          <div className="p-3 border border-slate-200 rounded-lg space-y-2 text-xs">
            
            {/* Limpeza de pele */}
            {proc?.limpezaPele && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-500 font-semibold block text-[11px]">Tipos de Pele:</span>
                  <strong>{proc.limpezaPele.tipoPele?.join(', ') || 'Normal'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[11px]">Uso Diário Protetor Solar:</span>
                  <strong>{proc.limpezaPele.usaProtetorSolar ? 'SIM' : 'NÃO'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[11px]">Aparência Atual:</span>
                  <strong>{proc.limpezaPele.aparenciaAtual?.join(', ') || 'Sem queixas'}</strong>
                </div>
              </div>
            )}

            {/* Injetáveis */}
            {proc?.injetaveis && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 font-semibold block text-[11px]">Já realizou injetáveis antes?</span>
                  <strong>{proc.injetaveis.jaRealizouAntes ? 'SIM' : 'NÃO'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[11px]">Histórico de Reações Adversas:</span>
                  <strong>{proc.injetaveis.historicoReacoes ? 'SIM' : 'NÃO'}</strong>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 font-semibold block text-[11px]">Área de Maior Incômodo / Queixa:</span>
                  <strong>{proc.injetaveis.areaMaiorIncomodo || 'Mapeamento facial completo'}</strong>
                </div>
              </div>
            )}

            {/* Micropigmentação */}
            {proc?.micropigmentacao && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-500 font-semibold block text-[11px]">Já realizou micro antes?</span>
                  <strong>{proc.micropigmentacao.jaFezAntes ? 'SIM' : 'NÃO'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[11px]">Cor de Preferência:</span>
                  <strong>{proc.micropigmentacao.corPreferencia || 'Natural'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[11px]">Formato & Simetria:</span>
                  <strong>{proc.micropigmentacao.observacoesFormato || 'Padrão estético'}</strong>
                </div>
              </div>
            )}

            {/* Outro */}
            {proc?.outro && (
              <div className="space-y-1">
                <div>
                  <span className="text-slate-500 font-semibold block text-[11px]">Objetivo do Tratamento:</span>
                  <strong>{proc.outro.objetivoTratamento || '-'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold block text-[11px]">Observações Clínicas:</span>
                  <span>{proc.outro.observacoesClinicas || '-'}</span>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* 4. TERMO DE CONSENTIMENTO & ASSINATURAS */}
        <div className="space-y-3 pt-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-indigo-900 bg-slate-100 px-3 py-1.5 rounded-lg">
            4. Termo de Consentimento Informado & Assinatura Digital
          </h2>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed text-slate-700 italic">
            &ldquo;Declaro que as informações acima são verdadeiras. Autorizo a realização do procedimento escolhido após receber todas as explicações sobre os cuidados, riscos e resultados esperados.&rdquo;
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
            
            {/* Bloco de Assinatura do Cliente */}
            <div className="flex flex-col items-center justify-center p-3 border border-dashed border-slate-300 rounded-xl bg-slate-50/50">
              {anamnese.assinaturaUrl ? (
                <img
                  src={anamnese.assinaturaUrl}
                  alt="Assinatura do Cliente"
                  className="max-h-24 object-contain mb-1"
                />
              ) : (
                <div className="h-16 flex items-center justify-center text-xs text-slate-400">
                  Assinatura Digital Registrada
                </div>
              )}
              <div className="w-full border-t border-slate-400 pt-1 text-center">
                <span className="text-xs font-bold text-slate-900 block">{dp.nomeCompleto}</span>
                <span className="text-[10px] text-slate-500">
                  Assinado Eletronicamente em {new Date(anamnese.assinadoEm).toLocaleString('pt-BR')}
                </span>
              </div>
            </div>

            {/* Bloco de Carimbo do Profissional */}
            <div className="flex flex-col items-center justify-end p-3 border border-dashed border-slate-300 rounded-xl bg-slate-50/50">
              <div className="h-16 flex items-center justify-center text-xs text-indigo-600 font-bold">
                {anamnese.profissionalNome || currentUser?.nome || 'Profissional Responsável'}
              </div>
              <div className="w-full border-t border-slate-400 pt-1 text-center">
                <span className="text-xs font-bold text-slate-900 block">
                  {anamnese.profissionalNome || currentUser?.nome || 'Profissional da Clínica'}
                </span>
                <span className="text-[10px] text-slate-500">
                  Responsável Técnico pelo Atendimento
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
