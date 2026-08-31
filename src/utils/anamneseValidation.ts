import { z } from 'zod';

/**
 * Calcula a idade com precisão a partir da data de nascimento ISO (AAAA-MM-DD), Date ou Timestamp.
 */
export function calcularIdade(dataNascimento: any): number | '' {
  if (!dataNascimento) return '';
  try {
    const hoje = new Date();
    let nascimento: Date;

    if (typeof dataNascimento?.toDate === 'function') {
      nascimento = dataNascimento.toDate();
    } else if (dataNascimento instanceof Date) {
      nascimento = dataNascimento;
    } else if (typeof dataNascimento === 'string' || typeof dataNascimento === 'number') {
      nascimento = new Date(dataNascimento);
    } else {
      return '';
    }

    if (isNaN(nascimento.getTime())) return '';

    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade >= 0 ? idade : '';
  } catch {
    return '';
  }
}

/**
 * Formata telefone brasileiro com máscara: (00) 00000-0000 ou (00) 0000-0000
 */
export function formatarTelefone(valor: string): string {
  if (!valor) return '';
  const apenasNumeros = valor.replace(/\D/g, '').slice(0, 11);
  
  if (apenasNumeros.length <= 2) {
    return apenasNumeros.length > 0 ? `(${apenasNumeros}` : '';
  }
  if (apenasNumeros.length <= 6) {
    return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2)}`;
  }
  if (apenasNumeros.length <= 10) {
    return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 6)}-${apenasNumeros.slice(6)}`;
  }
  return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 7)}-${apenasNumeros.slice(7, 11)}`;
}

/**
 * Formata CPF brasileiro: 000.000.000-00
 */
export function formatarCPF(valor: string): string {
  if (!valor) return '';
  const apenasNumeros = valor.replace(/\D/g, '').slice(0, 11);
  if (apenasNumeros.length <= 3) return apenasNumeros;
  if (apenasNumeros.length <= 6) return `${apenasNumeros.slice(0, 3)}.${apenasNumeros.slice(3)}`;
  if (apenasNumeros.length <= 9) return `${apenasNumeros.slice(0, 3)}.${apenasNumeros.slice(3, 6)}.${apenasNumeros.slice(6)}`;
  return `${apenasNumeros.slice(0, 3)}.${apenasNumeros.slice(3, 6)}.${apenasNumeros.slice(6, 9)}-${apenasNumeros.slice(9, 11)}`;
}

// Zod Schema para Ficha de Anamnese Completa
export const anamneseCompletaSchema = z.object({
  // 1. Dados Pessoais
  dadosPessoais: z.object({
    nomeCompleto: z.string().min(3, 'O nome completo do cliente é obrigatório (mínimo 3 caracteres).'),
    dataNascimento: z.string().min(1, 'A data de nascimento é obrigatória.'),
    idade: z.number().min(0, 'Idade inválida.'),
    telefone: z.string().min(10, 'O telefone/WhatsApp deve ser válido.'),
    cpf: z.string().optional().default(''),
    email: z.string().email('E-mail inválido.').or(z.literal('')).optional(),
    endereco: z.string().optional().default(''),
    profissao: z.string().optional().default(''),
    contatoEmergencia: z.object({
      nome: z.string().optional().default(''),
      telefone: z.string().optional().default(''),
    }).optional().default({ nome: '', telefone: '' }),
  }),

  // 2. Saúde Geral
  saudeGeral: z.object({
    gestanteOuAmamentando: z.boolean().default(false),
    possuiAlergias: z.boolean().default(false),
    detalhesAlergias: z.string().optional(),
    diabetesOuPressaoAlta: z.boolean().default(false),
    historicoQueloide: z.boolean().default(false),
    problemasCoagulacao: z.boolean().default(false),
    herpesAtiva: z.boolean().default(false),
    usoAcidos: z.boolean().default(false),
    detalhesAcidos: z.string().optional(),
    cirurgiaEsteticaRecente: z.boolean().default(false),
    detalhesCirurgia: z.string().optional(),
  }),

  // 3. Específico por Procedimento
  procedimentoTipo: z.enum(['limpeza_pele', 'injetaveis', 'micropigmentacao', 'outro']),
  detalhesProcedimento: z.object({
    limpezaPele: z.object({
      tipoPele: z.array(z.string()).default([]),
      usaProtetorSolar: z.boolean().default(true),
      aparenciaAtual: z.array(z.string()).default([]),
    }).optional(),
    injetaveis: z.object({
      jaRealizouAntes: z.boolean().default(false),
      historicoReacoes: z.boolean().default(false),
      areaMaiorIncomodo: z.string().default(''),
    }).optional(),
    micropigmentacao: z.object({
      jaFezAntes: z.boolean().default(false),
      corPreferencia: z.string().default(''),
      observacoesFormato: z.string().default(''),
    }).optional(),
    outro: z.object({
      objetivoTratamento: z.string().default(''),
      observacoesClinicas: z.string().default(''),
    }).optional(),
  }),

  // 4. Consentimento e Assinatura
  termoAceito: z.boolean().refine(val => val === true, {
    message: 'É necessário aceitar o termo de consentimento.',
  }),
  assinaturaUrl: z.string().min(1, 'A assinatura digital na tela é obrigatória.'),
});
