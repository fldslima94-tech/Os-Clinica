import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  User, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  Briefcase, 
  HeartHandshake, 
  HeartPulse, 
  ShieldCheck, 
  Sparkles, 
  FileText, 
  Printer, 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  AlertCircle,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Lock,
  Eye,
  Info,
  Camera,
  Upload,
  Trash2,
  Image as ImageIcon,
  RotateCcw
} from 'lucide-react';
import { AnamneseCompleta, Paciente, UsuarioEquipe, ClinicaConfig } from '../types';
import { CanvasAssinatura } from './CanvasAssinatura';
import { CameraCaptureModal } from './CameraCaptureModal';
import { calcularIdade, formatarTelefone, formatarCPF, anamneseCompletaSchema } from '../utils/anamneseValidation';
import { useConnectionStatus } from '../contexts/ConnectionStatusContext';
import { Wifi, WifiOff, Database, CloudCheck } from 'lucide-react';

interface AnamneseCompletaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (anamnese: AnamneseCompleta, novoPacienteDados?: Partial<Paciente>) => void;
  pacienteExistente?: Paciente | null;
  paciente?: Paciente | null;
  anamneseParaVisualizar?: AnamneseCompleta | null;
  currentUser?: UsuarioEquipe;
  clinicaConfig?: ClinicaConfig;
}

export const AnamneseCompletaModal: React.FC<AnamneseCompletaModalProps> = ({
  isOpen,
  onClose,
  onSave,
  pacienteExistente,
  paciente,
  anamneseParaVisualizar,
  currentUser,
  clinicaConfig,
}) => {
  const { isOnline, isSyncing } = useConnectionStatus();
  const targetPaciente = pacienteExistente || paciente;
  const isVisualizacao = !!anamneseParaVisualizar;
  const [etapaAtual, setEtapaAtual] = useState<number>(1);
  const [errosValidacao, setErrosValidacao] = useState<{ [campo: string]: string }>({});

  // 0. Foto do Paciente / Câmera
  const [fotoPacienteUrl, setFotoPacienteUrl] = useState('');
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 1. Dados Pessoais
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [endereco, setEndereco] = useState('');
  const [profissao, setProfissao] = useState('');
  const [cpf, setCpf] = useState('');
  const [contatoEmergenciaNome, setContatoEmergenciaNome] = useState('');
  const [contatoEmergenciaTel, setContatoEmergenciaTel] = useState('');

  // 2. Anamnese Geral (Saúde)
  const [gestanteOuAmamentando, setGestanteOuAmamentando] = useState(false);
  const [possuiAlergias, setPossuiAlergias] = useState(false);
  const [detalhesAlergias, setDetalhesAlergias] = useState('');
  const [diabetesOuPressaoAlta, setDiabetesOuPressaoAlta] = useState(false);
  const [historicoQueloide, setHistoricoQueloide] = useState(false);
  const [problemasCoagulacao, setProblemasCoagulacao] = useState(false);
  const [herpesAtiva, setHerpesAtiva] = useState(false);
  const [usoAcidos, setUsoAcidos] = useState(false);
  const [detalhesAcidos, setDetalhesAcidos] = useState('');
  const [cirurgiaEsteticaRecente, setCirurgiaEsteticaRecente] = useState(false);
  const [detalhesCirurgia, setDetalhesCirurgia] = useState('');

  // 3. Controle por Procedimento
  const [procedimentoTipo, setProcedimentoTipo] = useState<'limpeza_pele' | 'injetaveis' | 'micropigmentacao' | 'outro'>('limpeza_pele');
  const [nomeProcedimentoEspecifico, setNomeProcedimentoEspecifico] = useState('');
  
  // Limpeza de pele
  const [tipoPele, setTipoPele] = useState<string[]>(['Mista']);
  const [usaProtetorSolar, setUsaProtetorSolar] = useState(true);
  const [aparenciaAtual, setAparenciaAtual] = useState<string[]>(['Cravos']);

  // Injetáveis
  const [injetaveisJaRealizou, setInjetaveisJaRealizou] = useState(false);
  const [injetaveisHistoricoReacoes, setInjetaveisHistoricoReacoes] = useState(false);
  const [injetaveisAreaIncomodo, setInjetaveisAreaIncomodo] = useState('');

  // Micropigmentação
  const [microJaFez, setMicroJaFez] = useState(false);
  const [microCorPreferencia, setMicroCorPreferencia] = useState('');
  const [microObservacoesFormato, setMicroObservacoesFormato] = useState('');

  // Outro
  const [outroObjetivo, setOutroObjetivo] = useState('');
  const [outroObservacoes, setOutroObservacoes] = useState('');

  // 4. Termo de Consentimento e Assinatura
  const [termoAceito, setTermoAceito] = useState(false);
  const [assinaturaUrl, setAssinaturaUrl] = useState('');

  // Inicialização e preenchimento ao abrir
  useEffect(() => {
    if (!isOpen) return;

    if (anamneseParaVisualizar) {
      // Carregar dados da anamnese existente
      const dp = anamneseParaVisualizar.dadosPessoais;
      setNomeCompleto(dp.nomeCompleto || '');
      setDataNascimento(dp.dataNascimento || '');
      setTelefone(dp.telefone || '');
      setEmail(dp.email || '');
      setEndereco(dp.endereco || '');
      setProfissao(dp.profissao || '');
      setContatoEmergenciaNome(dp.contatoEmergencia?.nome || '');
      setContatoEmergenciaTel(dp.contatoEmergencia?.telefone || '');

      const sg = anamneseParaVisualizar.saudeGeral;
      setGestanteOuAmamentando(sg.gestanteOuAmamentando || false);
      setPossuiAlergias(sg.possuiAlergias || false);
      setDetalhesAlergias(sg.detalhesAlergias || '');
      setDiabetesOuPressaoAlta(sg.diabetesOuPressaoAlta || false);
      setHistoricoQueloide(sg.historicoQueloide || false);
      setProblemasCoagulacao(sg.problemasCoagulacao || false);
      setHerpesAtiva(sg.herpesAtiva || false);
      setUsoAcidos(sg.usoAcidos || false);
      setDetalhesAcidos(sg.detalhesAcidos || '');
      setCirurgiaEsteticaRecente(sg.cirurgiaEsteticaRecente || false);
      setDetalhesCirurgia(sg.detalhesCirurgia || '');

      setProcedimentoTipo(anamneseParaVisualizar.procedimentoTipo || 'limpeza_pele');
      setNomeProcedimentoEspecifico(anamneseParaVisualizar.procedimentoNome || '');

      const dpProc = anamneseParaVisualizar.detalhesProcedimento || {};
      if (dpProc.limpezaPele) {
        setTipoPele(dpProc.limpezaPele.tipoPele || []);
        setUsaProtetorSolar(dpProc.limpezaPele.usaProtetorSolar ?? true);
        setAparenciaAtual(dpProc.limpezaPele.aparenciaAtual || []);
      }
      if (dpProc.injetaveis) {
        setInjetaveisJaRealizou(dpProc.injetaveis.jaRealizouAntes || false);
        setInjetaveisHistoricoReacoes(dpProc.injetaveis.historicoReacoes || false);
        setInjetaveisAreaIncomodo(dpProc.injetaveis.areaMaiorIncomodo || '');
      }
      if (dpProc.micropigmentacao) {
        setMicroJaFez(dpProc.micropigmentacao.jaFezAntes || false);
        setMicroCorPreferencia(dpProc.micropigmentacao.corPreferencia || '');
        setMicroObservacoesFormato(dpProc.micropigmentacao.observacoesFormato || '');
      }
      if (dpProc.outro) {
        setOutroObjetivo(dpProc.outro.objetivoTratamento || '');
        setOutroObservacoes(dpProc.outro.observacoesClinicas || '');
      }

      setTermoAceito(anamneseParaVisualizar.termoAceito ?? true);
      setAssinaturaUrl(anamneseParaVisualizar.assinaturaUrl || '');
      setFotoPacienteUrl(anamneseParaVisualizar.fotoPacienteUrl || '');
      setEtapaAtual(1);
    } else if (targetPaciente) {
      // Preenche com os dados do paciente existente
      setNomeCompleto(targetPaciente.nome || '');
      setDataNascimento(targetPaciente.data_nascimento || '');
      setTelefone(targetPaciente.telefone || '');
      setEmail(targetPaciente.email || '');
      setCpf(targetPaciente.cpf || '');
      setEndereco(targetPaciente.endereco || '');
      setProfissao(targetPaciente.profissao || '');
      setContatoEmergenciaNome(targetPaciente.contato_emergencia?.nome || '');
      setContatoEmergenciaTel(targetPaciente.contato_emergencia?.telefone || '');
      setFotoPacienteUrl(targetPaciente.foto_url || '');
      
      if (targetPaciente.alergias) {
        setPossuiAlergias(true);
        setDetalhesAlergias(targetPaciente.alergias);
      } else {
        setPossuiAlergias(false);
        setDetalhesAlergias('');
      }
      setTermoAceito(false);
      setAssinaturaUrl('');
      setEtapaAtual(1);
    } else {
      // Novo cadastro limpo
      setNomeCompleto('');
      setDataNascimento('');
      setTelefone('');
      setEmail('');
      setEndereco('');
      setProfissao('');
      setCpf('');
      setContatoEmergenciaNome('');
      setContatoEmergenciaTel('');
      setFotoPacienteUrl('');

      setGestanteOuAmamentando(false);
      setPossuiAlergias(false);
      setDetalhesAlergias('');
      setDiabetesOuPressaoAlta(false);
      setHistoricoQueloide(false);
      setProblemasCoagulacao(false);
      setHerpesAtiva(false);
      setUsoAcidos(false);
      setDetalhesAcidos('');
      setCirurgiaEsteticaRecente(false);
      setDetalhesCirurgia('');

      setProcedimentoTipo('limpeza_pele');
      setNomeProcedimentoEspecifico('');
      setTipoPele(['Mista']);
      setUsaProtetorSolar(true);
      setAparenciaAtual(['Cravos']);
      setInjetaveisJaRealizou(false);
      setInjetaveisHistoricoReacoes(false);
      setInjetaveisAreaIncomodo('');
      setMicroJaFez(false);
      setMicroCorPreferencia('');
      setMicroObservacoesFormato('');
      setOutroObjetivo('');
      setOutroObservacoes('');

      setTermoAceito(false);
      setAssinaturaUrl('');
      setEtapaAtual(1);
    }
    setErrosValidacao({});
  }, [isOpen, targetPaciente, anamneseParaVisualizar]);

  if (!isOpen) return null;

  const idadeCalculada = calcularIdade(dataNascimento);

  const toggleTipoPele = (item: string) => {
    if (tipoPele.includes(item)) {
      setTipoPele(tipoPele.filter(t => t !== item));
    } else {
      setTipoPele([...tipoPele, item]);
    }
  };

  const toggleAparencia = (item: string) => {
    if (aparenciaAtual.includes(item)) {
      setAparenciaAtual(aparenciaAtual.filter(a => a !== item));
    } else {
      setAparenciaAtual([...aparenciaAtual, item]);
    }
  };

  const handleNext = () => {
    setErrosValidacao({});
    if (etapaAtual === 1) {
      if (!nomeCompleto.trim()) {
        setErrosValidacao({ nomeCompleto: 'Nome completo é obrigatório.' });
        return;
      }
      if (!dataNascimento) {
        setErrosValidacao({ dataNascimento: 'Data de nascimento é obrigatória.' });
        return;
      }
      if (!telefone.trim() || telefone.replace(/\D/g, '').length < 10) {
        setErrosValidacao({ telefone: 'Telefone/WhatsApp com DDD é obrigatório.' });
        return;
      }
    }

    if (etapaAtual === 2) {
      if (possuiAlergias && !detalhesAlergias.trim()) {
        setErrosValidacao({ detalhesAlergias: 'Por favor, especifique a alergia declarada.' });
        return;
      }
      if (usoAcidos && !detalhesAcidos.trim()) {
        setErrosValidacao({ detalhesAcidos: 'Por favor, especifique quais ácidos são utilizados.' });
        return;
      }
      if (cirurgiaEsteticaRecente && !detalhesCirurgia.trim()) {
        setErrosValidacao({ detalhesCirurgia: 'Por favor, informe a cirurgia recente.' });
        return;
      }
    }

    setEtapaAtual(prev => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setEtapaAtual(prev => Math.max(prev - 1, 1));
  };

  const handleFinalizar = () => {
    setErrosValidacao({});

    if (!termoAceito) {
      setErrosValidacao({ termoAceito: 'É obrigatório aceitar o termo de consentimento.' });
      return;
    }

    if (!assinaturaUrl) {
      setErrosValidacao({ assinaturaUrl: 'É obrigatório assinar digitalmente no quadro acima.' });
      return;
    }

    const payload: AnamneseCompleta = {
      id: anamneseParaVisualizar?.id || `anam-${Date.now()}`,
      clinicaId: clinicaConfig?.id || 'clinica-1',
      clienteId: pacienteExistente?.id || `pac-${Date.now()}`,
      clienteNome: nomeCompleto.trim(),
      profissionalId: currentUser?.id || 'prof-1',
      profissionalNome: currentUser?.nome || 'Profissional Responsável',
      procedimentoNome: nomeProcedimentoEspecifico.trim() || (
        procedimentoTipo === 'limpeza_pele' ? 'Limpeza de Pele' :
        procedimentoTipo === 'injetaveis' ? 'Procedimento Injetável' :
        procedimentoTipo === 'micropigmentacao' ? 'Micropigmentação' : 'Outro Procedimento'
      ),
      dadosPessoais: {
        nomeCompleto: nomeCompleto.trim(),
        dataNascimento,
        idade: typeof idadeCalculada === 'number' ? idadeCalculada : 0,
        telefone: telefone.trim(),
        email: email.trim() || undefined,
        endereco: endereco.trim() || undefined,
        profissao: profissao.trim() || undefined,
        contatoEmergencia: {
          nome: contatoEmergenciaNome.trim(),
          telefone: contatoEmergenciaTel.trim(),
        },
      },
      saudeGeral: {
        gestanteOuAmamentando,
        possuiAlergias,
        detalhesAlergias: possuiAlergias ? detalhesAlergias.trim() : undefined,
        diabetesOuPressaoAlta,
        historicoQueloide,
        problemasCoagulacao,
        herpesAtiva,
        usoAcidos: usoAcidos,
        detalhesAcidos: usoAcidos ? detalhesAcidos.trim() : undefined,
        cirurgiaEsteticaRecente,
        detalhesCirurgia: cirurgiaEsteticaRecente ? detalhesCirurgia.trim() : undefined,
      },
      procedimentoTipo,
      detalhesProcedimento: {
        ...(procedimentoTipo === 'limpeza_pele' ? {
          limpezaPele: {
            tipoPele,
            usaProtetorSolar,
            aparenciaAtual,
          }
        } : {}),
        ...(procedimentoTipo === 'injetaveis' ? {
          injetaveis: {
            jaRealizouAntes: injetaveisJaRealizou,
            historicoReacoes: injetaveisHistoricoReacoes,
            areaMaiorIncomodo: injetaveisAreaIncomodo.trim(),
          }
        } : {}),
        ...(procedimentoTipo === 'micropigmentacao' ? {
          micropigmentacao: {
            jaFezAntes: microJaFez,
            corPreferencia: microCorPreferencia.trim(),
            observacoesFormato: microObservacoesFormato.trim(),
          }
        } : {}),
        ...(procedimentoTipo === 'outro' ? {
          outro: {
            objetivoTratamento: outroObjetivo.trim(),
            observacoesClinicas: outroObservacoes.trim(),
          }
        } : {}),
      },
      termoAceito: true,
      assinaturaUrl,
      fotoPacienteUrl: fotoPacienteUrl || undefined,
      fotosAtendimento: fotoPacienteUrl ? [fotoPacienteUrl] : undefined,
      assinadoEm: new Date().toISOString(),
      criadoEm: anamneseParaVisualizar?.criadoEm || new Date().toISOString(),
    };

    // Validar com Zod
    try {
      anamneseCompletaSchema.parse({
        dadosPessoais: payload.dadosPessoais,
        saudeGeral: payload.saudeGeral,
        procedimentoTipo: payload.procedimentoTipo,
        detalhesProcedimento: payload.detalhesProcedimento,
        termoAceito: payload.termoAceito,
        assinaturaUrl: payload.assinaturaUrl,
      });
    } catch (err: any) {
      if (err.errors && err.errors.length > 0) {
        setErrosValidacao({ form: err.errors[0].message });
        return;
      }
    }

    const dadosPacienteAtualizados: Partial<Paciente> = {
      nome: nomeCompleto.trim(),
      telefone: telefone.trim(),
      data_nascimento: dataNascimento,
      email: email.trim() || undefined,
      cpf: cpf.trim() || undefined,
      endereco: endereco.trim() || undefined,
      profissao: profissao.trim() || undefined,
      foto_url: fotoPacienteUrl || undefined,
      contato_emergencia: {
        nome: contatoEmergenciaNome.trim(),
        telefone: contatoEmergenciaTel.trim(),
      },
      alergias: possuiAlergias ? detalhesAlergias.trim() : undefined,
      historico_clinico: `Ficha Anamnese realizada em ${new Date().toLocaleDateString('pt-BR')} para ${payload.procedimentoNome}. ${possuiAlergias ? `[Alergias]: ${detalhesAlergias}` : ''}`,
    };

    onSave(payload, dadosPacienteAtualizados);
    onClose();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6 flex flex-col max-h-[92vh]">
        
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {isVisualizacao ? 'Ficha de Anamnese & Consentimento Assinado' : 'Ficha de Cliente & Anamnese Completa'}
                </h3>
                {isVisualizacao && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Assinado
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-200 font-medium">
                {isVisualizacao 
                  ? `Registro clínico com comprovação digital de ${nomeCompleto || 'Cliente'}`
                  : 'Formulário clínico com dados pessoais, histórico de saúde e assinatura'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botão Rápido de Câmera */}
            <button
              type="button"
              disabled={isVisualizacao}
              onClick={() => setIsCameraModalOpen(true)}
              title={fotoPacienteUrl ? 'Foto registrada (Clique para alterar)' : 'Capturar foto do paciente via câmera'}
              className={`p-2 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer disabled:opacity-50 ${
                fotoPacienteUrl 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30' 
                  : 'bg-indigo-600/50 hover:bg-indigo-600 text-white border border-indigo-400/40'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span className="hidden md:inline">
                {fotoPacienteUrl ? 'Foto Anexada' : 'Capturar Foto'}
              </span>
              {fotoPacienteUrl && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>

            {/* Status de Sincronização Local */}
            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
              !isOnline 
                ? 'bg-amber-500/20 text-amber-200 border-amber-400/40' 
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
            }`}>
              {!isOnline ? <WifiOff className="w-3.5 h-3.5" /> : <CloudCheck className="w-3.5 h-3.5" />}
              <span>{!isOnline ? 'Salvamento Offline (IndexedDB)' : 'Nuvem Conectada'}</span>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              title="Imprimir Ficha Completa / Gerar PDF"
              className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stepper Tabs (Apenas se não for visualização estrita, ou para navegar entre seções) */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between overflow-x-auto gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setEtapaAtual(1)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              etapaAtual === 1 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${etapaAtual === 1 ? 'bg-white text-indigo-600' : 'bg-slate-300 text-slate-700'}`}>1</span>
            <span>1. Dados Pessoais</span>
          </button>

          <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />

          <button
            type="button"
            onClick={() => setEtapaAtual(2)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              etapaAtual === 2 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${etapaAtual === 2 ? 'bg-white text-indigo-600' : 'bg-slate-300 text-slate-700'}`}>2</span>
            <span>2. Saúde Geral</span>
          </button>

          <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />

          <button
            type="button"
            onClick={() => setEtapaAtual(3)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              etapaAtual === 3 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${etapaAtual === 3 ? 'bg-white text-indigo-600' : 'bg-slate-300 text-slate-700'}`}>3</span>
            <span>3. Procedimento</span>
          </button>

          <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />

          <button
            type="button"
            onClick={() => setEtapaAtual(4)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              etapaAtual === 4 
                ? 'bg-indigo-600 text-white shadow-xs' 
                : 'text-slate-600 hover:bg-slate-200/60'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${etapaAtual === 4 ? 'bg-white text-indigo-600' : 'bg-slate-300 text-slate-700'}`}>4</span>
            <span>4. Termo & Assinatura</span>
          </button>
        </div>

        {/* Offline Status Warning Banner */}
        {!isOnline && (
          <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-2.5 text-amber-800 text-xs shrink-0">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Modo Offline Ativo:</strong> Esta anamnese e assinatura digital serão armazenadas com segurança no dispositivo (IndexedDB) e enviadas automaticamente para a nuvem assim que houver conexão.
              </span>
            </div>
            <span className="px-2 py-0.5 bg-amber-200/60 text-amber-900 rounded-md font-bold text-[10px] uppercase shrink-0">
              Fila Local
            </span>
          </div>
        )}

        {/* Global Error Banner */}
        {Object.keys(errosValidacao).length > 0 && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-700 text-xs font-semibold animate-in fade-in shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{Object.values(errosValidacao)[0]}</span>
          </div>
        )}

        {/* Modal Body Container */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 print:p-0 print:overflow-visible">
          
          {/* ================================================================= */}
          {/* ETAPA 1: DADOS PESSOAIS DO CLIENTE */}
          {/* ================================================================= */}
          {etapaAtual === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-sm font-bold text-slate-800">Bloco 1: Dados Pessoais & Foto do Cliente</h4>
                </div>
                <span className="text-xs text-slate-400 font-medium">Campos com * são obrigatórios</span>
              </div>

              {/* Card de Foto Clínica & Captura de Câmera */}
              <div className="p-4 bg-gradient-to-br from-indigo-50/70 via-slate-50 to-purple-50/40 rounded-2xl border border-indigo-100/80 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  
                  <div className="flex items-center gap-3.5">
                    {fotoPacienteUrl ? (
                      <div className="relative group shrink-0">
                        <img
                          src={fotoPacienteUrl}
                          alt="Foto do Paciente"
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-indigo-500 shadow-md ring-2 ring-indigo-200"
                        />
                        <span className="absolute -bottom-1 -right-1 p-1 bg-emerald-600 text-white rounded-full shadow-xs" title="Foto Registrada">
                          <Check className="w-3 h-3" />
                        </span>
                      </div>
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-indigo-100/70 border-2 border-dashed border-indigo-300 flex flex-col items-center justify-center text-indigo-500 shrink-0">
                        <Camera className="w-7 h-7" />
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs sm:text-sm font-bold text-slate-900">
                          Foto Clínica do Paciente
                        </h5>
                        {fotoPacienteUrl ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Foto Registrada
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200/80 text-slate-600">
                            Câmera em Tempo Real
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] sm:text-xs text-slate-500 max-w-md leading-relaxed">
                        Capture uma foto facial ou corporal durante o atendimento para comprovação clínica e acompanhamento na ficha.
                      </p>
                    </div>
                  </div>

                  {/* Botões de Ação de Foto */}
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      disabled={isVisualizacao}
                      onClick={() => setIsCameraModalOpen(true)}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{fotoPacienteUrl ? 'Tirar Nova Foto' : 'Capturar Foto'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isVisualizacao}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all cursor-pointer disabled:opacity-50"
                      title="Carregar foto da galeria ou arquivo local"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Galeria</span>
                    </button>

                    {fotoPacienteUrl && !isVisualizacao && (
                      <button
                        type="button"
                        onClick={() => setFotoPacienteUrl('')}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-all cursor-pointer"
                        title="Remover Foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Nome Completo */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome Completo do Cliente *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      disabled={isVisualizacao}
                      value={nomeCompleto}
                      onChange={(e) => setNomeCompleto(e.target.value)}
                      placeholder="Ex: Maria Clara Fernandes"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-600"
                    />
                  </div>
                  {errosValidacao.nomeCompleto && (
                    <span className="text-[11px] text-rose-600 font-semibold mt-1 block">{errosValidacao.nomeCompleto}</span>
                  )}
                </div>

                {/* Data de Nascimento + Cálculo de Idade */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Data de Nascimento *
                    </label>
                    {idadeCalculada !== '' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <Clock className="w-3 h-3" />
                        {idadeCalculada} anos
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      disabled={isVisualizacao}
                      value={dataNascimento}
                      onChange={(e) => setDataNascimento(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all disabled:bg-slate-100"
                    />
                  </div>
                  {errosValidacao.dataNascimento && (
                    <span className="text-[11px] text-rose-600 font-semibold mt-1 block">{errosValidacao.dataNascimento}</span>
                  )}
                </div>

                {/* Telefone / WhatsApp */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Telefone / WhatsApp *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      disabled={isVisualizacao}
                      value={telefone}
                      onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all disabled:bg-slate-100"
                    />
                  </div>
                  {errosValidacao.telefone && (
                    <span className="text-[11px] text-rose-600 font-semibold mt-1 block">{errosValidacao.telefone}</span>
                  )}
                </div>

                {/* E-mail */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      disabled={isVisualizacao}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="cliente@email.com"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all disabled:bg-slate-100"
                    />
                  </div>
                </div>

                {/* Profissão */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Profissão
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      disabled={isVisualizacao}
                      value={profissao}
                      onChange={(e) => setProfissao(e.target.value)}
                      placeholder="Ex: Arquiteta, Advogada, Estudante"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all disabled:bg-slate-100"
                    />
                  </div>
                </div>

                {/* Endereço Completo */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Endereço Completo (Rua, Número, Bairro, Cidade)
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      disabled={isVisualizacao}
                      value={endereco}
                      onChange={(e) => setEndereco(e.target.value)}
                      placeholder="Av. Paulista, 1000, Apto 42 - Bela Vista, São Paulo - SP"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all disabled:bg-slate-100"
                    />
                  </div>
                </div>

                {/* Bloco de Contato de Emergência */}
                <div className="sm:col-span-2 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80 space-y-3">
                  <div className="flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4 text-indigo-600" />
                    <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Contato de Emergência
                    </h5>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Nome do Contato de Emergência
                      </label>
                      <input
                        type="text"
                        disabled={isVisualizacao}
                        value={contatoEmergenciaNome}
                        onChange={(e) => setContatoEmergenciaNome(e.target.value)}
                        placeholder="Ex: Carlos (Esposo), Joana (Mãe)"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-indigo-500 outline-none disabled:bg-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Telefone de Emergência
                      </label>
                      <input
                        type="text"
                        disabled={isVisualizacao}
                        value={contatoEmergenciaTel}
                        onChange={(e) => setContatoEmergenciaTel(formatarTelefone(e.target.value))}
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-indigo-500 outline-none disabled:bg-slate-100"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* ETAPA 2: ANAMNESE GERAL (SAÚDE DO CLIENTE) */}
          {/* ================================================================= */}
          {etapaAtual === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-rose-600" />
                  <h4 className="text-sm font-bold text-slate-800">Bloco 2: Anamnese Geral (Saúde do Cliente)</h4>
                </div>
                <span className="text-xs text-slate-400 font-medium">Checklist clínico obrigatório</span>
              </div>

              <div className="space-y-3">
                
                {/* 1. Gestante ou Amamentando */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                      1. Gestante ou amamentando?
                    </span>
                    <span className="text-[11px] text-slate-500">Contraindicação para certos injetáveis e ácidos</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={isVisualizacao}
                      onClick={() => setGestanteOuAmamentando(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        gestanteOuAmamentando ? 'bg-rose-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      disabled={isVisualizacao}
                      onClick={() => setGestanteOuAmamentando(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        !gestanteOuAmamentando ? 'bg-slate-700 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Não
                    </button>
                  </div>
                </div>

                {/* 2. Possui Alergia */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                        2. Possui alergia a medicamentos, cosméticos ou substâncias?
                      </span>
                      <span className="text-[11px] text-slate-500">Anestésicos, látex, dipirona, pigmentos ou conservantes</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={isVisualizacao}
                        onClick={() => setPossuiAlergias(true)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          possuiAlergias ? 'bg-rose-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        disabled={isVisualizacao}
                        onClick={() => {
                          setPossuiAlergias(false);
                          setDetalhesAlergias('');
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          !possuiAlergias ? 'bg-slate-700 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Não
                      </button>
                    </div>
                  </div>

                  {possuiAlergias && (
                    <div className="pt-2 animate-in fade-in">
                      <label className="block text-[11px] font-bold text-rose-700 mb-1">
                        Qual(is) alergia(s)? *
                      </label>
                      <input
                        type="text"
                        disabled={isVisualizacao}
                        value={detalhesAlergias}
                        onChange={(e) => setDetalhesAlergias(e.target.value)}
                        placeholder="Ex: Alergia a iodo, dipirona, frutos do mar, fragrâncias..."
                        className="w-full px-3 py-2 bg-white border border-rose-300 rounded-xl text-xs font-medium focus:border-rose-500 outline-none"
                      />
                      {errosValidacao.detalhesAlergias && (
                        <span className="text-[11px] text-rose-600 font-semibold mt-1 block">{errosValidacao.detalhesAlergias}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* 3. Diabetes ou Pressão Alta */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                      3. Tem diabetes ou pressão alta?
                    </span>
                    <span className="text-[11px] text-slate-500">Monitoramento de resposta cicatricial e anestesia tópica</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={isVisualizacao}
                      onClick={() => setDiabetesOuPressaoAlta(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        diabetesOuPressaoAlta ? 'bg-amber-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      disabled={isVisualizacao}
                      onClick={() => setDiabetesOuPressaoAlta(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        !diabetesOuPressaoAlta ? 'bg-slate-700 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Não
                    </button>
                  </div>
                </div>

                {/* 4. Histórico de Queloide */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                      4. Possui histórico de queloide ou cicatrização hipertrófica/ruim?
                    </span>
                    <span className="text-[11px] text-slate-500">Atenção especial para micropigmentação e microagulhamento</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={isVisualizacao}
                      onClick={() => setHistoricoQueloide(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        historicoQueloide ? 'bg-amber-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      disabled={isVisualizacao}
                      onClick={() => setHistoricoQueloide(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        !historicoQueloide ? 'bg-slate-700 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Não
                    </button>
                  </div>
                </div>

                {/* 5. Coagulação e Anticoagulantes */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                      5. Tem problemas de coagulação ou faz uso de anticoagulantes?
                    </span>
                    <span className="text-[11px] text-slate-500">Ex: AAS, varfarina, sangramentos frequentes</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={isVisualizacao}
                      onClick={() => setProblemasCoagulacao(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        problemasCoagulacao ? 'bg-rose-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      disabled={isVisualizacao}
                      onClick={() => setProblemasCoagulacao(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        !problemasCoagulacao ? 'bg-slate-700 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Não
                    </button>
                  </div>
                </div>

                {/* 6. Herpes Ativa */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                      6. Possui herpes ativa ou com frequência (lábios/face)?
                    </span>
                    <span className="text-[11px] text-slate-500">Necessidade de profilaxia antiviral pré-preenchimento ou micro</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={isVisualizacao}
                      onClick={() => setHerpesAtiva(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        herpesAtiva ? 'bg-amber-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      disabled={isVisualizacao}
                      onClick={() => setHerpesAtiva(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        !herpesAtiva ? 'bg-slate-700 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Não
                    </button>
                  </div>
                </div>

                {/* 7. Uso de Ácidos */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                        7. Faz uso de ácidos na pele atualmente?
                      </span>
                      <span className="text-[11px] text-slate-500">Ex: Retinóico, glicólico, salicílico, hidroquinona, Roacutan</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={isVisualizacao}
                        onClick={() => setUsoAcidos(true)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          usoAcidos ? 'bg-amber-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        disabled={isVisualizacao}
                        onClick={() => {
                          setUsoAcidos(false);
                          setDetalhesAcidos('');
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          !usoAcidos ? 'bg-slate-700 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Não
                      </button>
                    </div>
                  </div>

                  {usoAcidos && (
                    <div className="pt-2 animate-in fade-in">
                      <label className="block text-[11px] font-bold text-amber-800 mb-1">
                        Quais ácidos e frequência? *
                      </label>
                      <input
                        type="text"
                        disabled={isVisualizacao}
                        value={detalhesAcidos}
                        onChange={(e) => setDetalhesAcidos(e.target.value)}
                        placeholder="Ex: Ácido glicólico à noite 3x por semana..."
                        className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-medium focus:border-amber-500 outline-none"
                      />
                      {errosValidacao.detalhesAcidos && (
                        <span className="text-[11px] text-rose-600 font-semibold mt-1 block">{errosValidacao.detalhesAcidos}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* 8. Cirurgia Estética Recente */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <span className="text-xs sm:text-sm font-bold text-slate-800 block">
                        8. Já fez alguma cirurgia estética recente?
                      </span>
                      <span className="text-[11px] text-slate-500">Rinoplastia, blefaroplastia, lifting, próteses nos últimos 12 meses</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={isVisualizacao}
                        onClick={() => setCirurgiaEsteticaRecente(true)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          cirurgiaEsteticaRecente ? 'bg-amber-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        disabled={isVisualizacao}
                        onClick={() => {
                          setCirurgiaEsteticaRecente(false);
                          setDetalhesCirurgia('');
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          !cirurgiaEsteticaRecente ? 'bg-slate-700 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Não
                      </button>
                    </div>
                  </div>

                  {cirurgiaEsteticaRecente && (
                    <div className="pt-2 animate-in fade-in">
                      <label className="block text-[11px] font-bold text-amber-800 mb-1">
                        Qual cirurgia e quando foi realizada? *
                      </label>
                      <input
                        type="text"
                        disabled={isVisualizacao}
                        value={detalhesCirurgia}
                        onChange={(e) => setDetalhesCirurgia(e.target.value)}
                        placeholder="Ex: Rinoplastia há 6 meses..."
                        className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs font-medium focus:border-amber-500 outline-none"
                      />
                      {errosValidacao.detalhesCirurgia && (
                        <span className="text-[11px] text-rose-600 font-semibold mt-1 block">{errosValidacao.detalhesCirurgia}</span>
                      )}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* ETAPA 3: CONTROLE POR PROCEDIMENTO (SEÇÕES CONDICIONAIS) */}
          {/* ================================================================= */}
          {etapaAtual === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-sm font-bold text-slate-800">Bloco 3: Controle por Procedimento Específico</h4>
                </div>
                <span className="text-xs text-slate-400 font-medium">Perguntas técnicas direcionadas</span>
              </div>

              {/* Seletor de Categoria do Procedimento */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Selecione a Categoria do Procedimento que será realizado:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'limpeza_pele', label: 'Limpeza de Pele' },
                    { id: 'injetaveis', label: 'Injetáveis (Botox / Preench.)' },
                    { id: 'micropigmentacao', label: 'Micropigmentação' },
                    { id: 'outro', label: 'Outro Tratamento' },
                  ].map((proc) => (
                    <button
                      key={proc.id}
                      type="button"
                      disabled={isVisualizacao}
                      onClick={() => setProcedimentoTipo(proc.id as any)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                        procedimentoTipo === proc.id
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold shadow-xs'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-xs">{proc.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Nome Específico do Procedimento */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome Específico do Procedimento / Protocolo
                </label>
                <input
                  type="text"
                  disabled={isVisualizacao}
                  value={nomeProcedimentoEspecifico}
                  onChange={(e) => setNomeProcedimentoEspecifico(e.target.value)}
                  placeholder="Ex: Toxina Botulínica Terço Superior, Micro Labial Glam..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-indigo-500 outline-none"
                />
              </div>

              {/* SUB-SEÇÃO A: LIMPEZA DE PELE */}
              {procedimentoTipo === 'limpeza_pele' && (
                <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100 space-y-4 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                      A. Limpeza de Pele
                    </span>
                    <h5 className="text-xs font-bold text-slate-800">Avaliação Técnica da Pele</h5>
                  </div>

                  {/* Tipo de Pele */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Tipo de Pele:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['Seca', 'Oleosa', 'Mista', 'Sensível', 'Acneica'].map((item) => {
                        const selecionado = tipoPele.includes(item);
                        return (
                          <button
                            key={item}
                            type="button"
                            disabled={isVisualizacao}
                            onClick={() => toggleTipoPele(item)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                              selecionado 
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs' 
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Uso de protetor solar diário */}
                  <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-indigo-100">
                    <span className="text-xs font-semibold text-slate-800">
                      Uso diário de protetor solar?
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isVisualizacao}
                        onClick={() => setUsaProtetorSolar(true)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          usaProtetorSolar ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        disabled={isVisualizacao}
                        onClick={() => setUsaProtetorSolar(false)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          !usaProtetorSolar ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        Não
                      </button>
                    </div>
                  </div>

                  {/* Aparência Atual da Pele */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Aparência Atual da Pele (Checklist):
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {['Cravos', 'Espinhas', 'Manchas', 'Desidratação'].map((item) => {
                        const checked = aparenciaAtual.includes(item);
                        return (
                          <label
                            key={item}
                            className={`flex items-center gap-2 p-2.5 bg-white rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                              checked ? 'border-indigo-500 bg-indigo-50/50 text-indigo-900 font-bold' : 'border-slate-200 text-slate-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              disabled={isVisualizacao}
                              checked={checked}
                              onChange={() => toggleAparencia(item)}
                              className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>{item}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-SEÇÃO B: PROCEDIMENTOS INJETÁVEIS */}
              {procedimentoTipo === 'injetaveis' && (
                <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100 space-y-4 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                      B. Injetáveis
                    </span>
                    <h5 className="text-xs font-bold text-slate-800">Toxina Botulínica, Preenchimento & Bioestimuladores</h5>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-indigo-100">
                      <span className="text-xs font-semibold text-slate-800">
                        Já realizou injetáveis antes?
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isVisualizacao}
                          onClick={() => setInjetaveisJaRealizou(true)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            injetaveisJaRealizou ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          disabled={isVisualizacao}
                          onClick={() => setInjetaveisJaRealizou(false)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            !injetaveisJaRealizou ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          Não
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-indigo-100">
                      <span className="text-xs font-semibold text-slate-800">
                        Histórico de reações adversas?
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isVisualizacao}
                          onClick={() => setInjetaveisHistoricoReacoes(true)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            injetaveisHistoricoReacoes ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          disabled={isVisualizacao}
                          onClick={() => setInjetaveisHistoricoReacoes(false)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            !injetaveisHistoricoReacoes ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          Não
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Área de maior incômodo para o cliente (Mapeamento facial/corporal):
                    </label>
                    <textarea
                      rows={2}
                      disabled={isVisualizacao}
                      value={injetaveisAreaIncomodo}
                      onChange={(e) => setInjetaveisAreaIncomodo(e.target.value)}
                      placeholder="Ex: Linhas na glabela e testa, sulco nasogeniano (bigode chinês), perda de volume labial..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* SUB-SEÇÃO C: MICROPIGMENTAÇÃO */}
              {procedimentoTipo === 'micropigmentacao' && (
                <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100 space-y-4 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                      C. Micropigmentação
                    </span>
                    <h5 className="text-xs font-bold text-slate-800">Sobrancelhas, Lábios e Delineados</h5>
                  </div>

                  <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-indigo-100">
                    <span className="text-xs font-semibold text-slate-800">
                      Já fez micropigmentação antes?
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isVisualizacao}
                        onClick={() => setMicroJaFez(true)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          microJaFez ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        Sim
                      </button>
                      <button
                        type="button"
                        disabled={isVisualizacao}
                        onClick={() => setMicroJaFez(false)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          !microJaFez ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        Não
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Cor / Tom de preferência do cliente:
                      </label>
                      <input
                        type="text"
                        disabled={isVisualizacao}
                        value={microCorPreferencia}
                        onChange={(e) => setMicroCorPreferencia(e.target.value)}
                        placeholder="Ex: Castanho médio natural, Rosa suave nude..."
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-indigo-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Observações de Formato & Simetria:
                      </label>
                      <input
                        type="text"
                        disabled={isVisualizacao}
                        value={microObservacoesFormato}
                        onChange={(e) => setMicroObservacoesFormato(e.target.value)}
                        placeholder="Ex: Arco suave, correção de falha na cauda direita..."
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SUB-SEÇÃO D: OUTRO */}
              {procedimentoTipo === 'outro' && (
                <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100 space-y-3 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                      D. Outro Procedimento
                    </span>
                    <h5 className="text-xs font-bold text-slate-800">Objetivo Clínico</h5>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Objetivo Principal do Tratamento:
                    </label>
                    <input
                      type="text"
                      disabled={isVisualizacao}
                      value={outroObjetivo}
                      onChange={(e) => setOutroObjetivo(e.target.value)}
                      placeholder="Ex: Clareamento de manchas, firmeza corporal..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Observações Clínicas Adicionais:
                    </label>
                    <textarea
                      rows={2}
                      disabled={isVisualizacao}
                      value={outroObservacoes}
                      onChange={(e) => setOutroObservacoes(e.target.value)}
                      placeholder="Orientações e detalhes do protocolo aplicado..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ================================================================= */}
          {/* ETAPA 4: TERMO DE CONSENTIMENTO E ASSINATURA DIGITAL */}
          {/* ================================================================= */}
          {etapaAtual === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-sm font-bold text-slate-800">Bloco 4: Termo de Consentimento & Assinatura Digital</h4>
                </div>
                <span className="text-xs text-slate-400 font-medium">Validade jurídica e comprovação</span>
              </div>

              {/* Caixa Oficial do Termo */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Clínica: {clinicaConfig?.nome || 'Studio Estético'}</span>
                  <span>Data: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                  <p className="italic text-slate-800 font-semibold mb-2">
                    &ldquo;Declaro que as informações acima são verdadeiras. Autorizo a realização do procedimento escolhido após receber todas as explicações sobre os cuidados, riscos e resultados esperados.&rdquo;
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Fui informado(a) sobre as orientações de pós-procedimento, possíveis reações e me comprometo a seguir as recomendações do profissional responsável ({currentUser?.nome || 'Profissional da Clínica'}).
                  </p>
                </div>

                {/* Checkbox de Aceite */}
                <label className="flex items-start gap-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={isVisualizacao}
                    checked={termoAceito}
                    onChange={(e) => setTermoAceito(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <div className="text-xs text-slate-700">
                    <span className="font-bold text-indigo-950 block">
                      Li e concordo com os termos de consentimento informado acima *
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Ao assinar digitalmente abaixo, confirmo a veracidade de todo o histórico prestado.
                    </span>
                  </div>
                </label>
                {errosValidacao.termoAceito && (
                  <span className="text-[11px] text-rose-600 font-semibold block">{errosValidacao.termoAceito}</span>
                )}
              </div>

              {/* Canvas de Assinatura */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Assinatura Digital do Cliente (Na Tela) *
                </label>

                {isVisualizacao && assinaturaUrl ? (
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center space-y-2">
                    <img
                      src={assinaturaUrl}
                      alt="Assinatura do Cliente"
                      className="max-h-32 object-contain"
                    />
                    <span className="text-[11px] text-slate-500 font-medium">
                      Assinatura registrada eletronicamente em {anamneseParaVisualizar?.assinadoEm ? new Date(anamneseParaVisualizar.assinadoEm).toLocaleString('pt-BR') : 'Data registrada'}
                    </span>
                  </div>
                ) : (
                  <CanvasAssinatura
                    onSalvar={(url) => setAssinaturaUrl(url)}
                    assinaturaExistente={assinaturaUrl}
                  />
                )}

                {errosValidacao.assinaturaUrl && (
                  <span className="text-[11px] text-rose-600 font-semibold block">{errosValidacao.assinaturaUrl}</span>
                )}
              </div>

              {/* Foto do Paciente Anexada (Verificação Visual) */}
              {fotoPacienteUrl && (
                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={fotoPacienteUrl}
                      alt="Foto do Paciente"
                      className="w-12 h-12 rounded-xl object-cover border border-indigo-300 shadow-xs ring-2 ring-indigo-100"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="text-xs font-bold text-indigo-950">Foto Clínica Vinculada</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Identificação visual anexada à assinatura digital do atendimento.
                      </p>
                    </div>
                  </div>
                  {!isVisualizacao && (
                    <button
                      type="button"
                      onClick={() => setIsCameraModalOpen(true)}
                      className="px-2.5 py-1 text-[11px] font-bold text-indigo-600 hover:bg-indigo-100 rounded-lg transition-all cursor-pointer"
                    >
                      Alterar Foto
                    </button>
                  )}
                </div>
              )}

              {/* Resumo da Anamnese para Conferência */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span>Resumo do Prontuário</span>
                  <span className="text-indigo-600">{nomeProcedimentoEspecifico || 'Procedimento Clínico'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px]">
                  <div>Cliente: <strong className="text-slate-800">{nomeCompleto || '-'}</strong> ({idadeCalculada ? `${idadeCalculada} anos` : '-'})</div>
                  <div>WhatsApp: <strong className="text-slate-800">{telefone || '-'}</strong></div>
                  <div>Alergias: <strong className={possuiAlergias ? 'text-rose-600' : 'text-slate-800'}>{possuiAlergias ? detalhesAlergias : 'Nenhuma relatada'}</strong></div>
                  <div>Ácidos: <strong className={usoAcidos ? 'text-amber-700' : 'text-slate-800'}>{usoAcidos ? detalhesAcidos : 'Não'}</strong></div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer com Ações de Navegação e Envio */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <div>
            {etapaAtual > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200/80 rounded-xl transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/80 rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {etapaAtual < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <span>Avançar</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              !isVisualizacao ? (
                <button
                  type="button"
                  onClick={handleFinalizar}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Ficha Completa & Assinatura</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white rounded-xl transition-all cursor-pointer"
                >
                  Fechar
                </button>
              )
            )}
          </div>
        </div>

        {/* Hidden File Input for Image Upload Fallback */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
              if (event.target?.result) {
                setFotoPacienteUrl(event.target.result as string);
              }
            };
            reader.readAsDataURL(file);
          }}
          className="hidden"
        />

        {/* Modal de Captura de Foto via Câmera */}
        {isCameraModalOpen && (
          <CameraCaptureModal
            isOpen={isCameraModalOpen}
            onClose={() => setIsCameraModalOpen(false)}
            onCapture={(photoDataUrl) => setFotoPacienteUrl(photoDataUrl)}
            patientName={nomeCompleto || pacienteExistente?.nome}
            title={`Foto de ${nomeCompleto || 'Paciente'}`}
            subtitle="Registro fotográfico em tempo real durante a anamnese"
          />
        )}

      </div>
    </div>
  );
};
