export type StatusAgendamento = 'pendente' | 'confirmado' | 'em_espera' | 'em_atendimento' | 'concluido' | 'cancelado';
export type UnidadeMedida = 'ml' | 'unidade' | 'seringa';
export type FormaPagamento = 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'transferencia';
export type StatusPagamento = 'pago' | 'pendente' | 'parcial';
export type UserRole = 'admin' | 'operador';

export interface PacoteTratamento {
  id: string;
  nome_pacote: string; // Ex: "Protocolo Glúteo Max (5 Sessões)" ou "Laser Lavieen (3 Sessões)"
  procedimento: string;
  total_sessoes: number;
  sessoes_realizadas: number;
  valor_total: number;
  status: 'em_andamento' | 'concluido' | 'cancelado';
  data_inicio: string;
  ultima_sessao?: string;
  observacoes?: string;
}

export interface AlertaRetornoPos {
  id: string;
  paciente_id: string;
  paciente_nome: string;
  telefone: string;
  procedimento_origem: string;
  data_procedimento: string;
  dias_apos: number; // Ex: 15 para botox, 30 para bioestimulador
  data_ideal_retorno: string;
  motivo: string; // Ex: "Revisão e retoque gratuito de Botox (15 dias)"
  status: 'pendente' | 'agendado' | 'contatado';
}

export interface PermissoesUsuario {
  ver_financeiro_completo: boolean;
  emitir_recibo: boolean;
  editar_prontuario_clinico: boolean;
  gerenciar_estoque_custos: boolean;
  configuracoes_sistema: boolean;
}

export interface UsuarioEquipe {
  id: string;
  nome: string;
  email: string;
  senha?: string;
  cargo: string;
  role: UserRole;
  telefone?: string;
  status: 'ativo' | 'inativo';
  ultimo_acesso?: string;
  avatar_url?: string;
  registro_profissional?: string; // CRM, CRBM, COREN, CRF
  criado_em?: string;
  created_at?: string;
  permissoes: PermissoesUsuario;
}

export interface FotoAntesDepois {
  id: string;
  titulo: string;
  data: string;
  foto_antes: string;
  foto_depois?: string;
  procedimento?: string;
  observacoes?: string;
}

export interface TermoConsentimento {
  assinado: boolean;
  data_assinatura?: string;
  assinatura_url?: string; // base64 canvas
  documento_rg_cpf?: string;
  texto_termo?: string;
}

export interface Paciente {
  id: string;
  nome: string;
  telefone: string;
  data_nascimento: string; // YYYY-MM-DD
  historico_clinico: string;
  criado_em: string;
  email?: string;
  cpf?: string;
  alergias?: string;
  medicacoes?: string;
  queixa_principal?: string;
  fototipo?: string;
  foto_url?: string;
  fotos_antes_depois?: FotoAntesDepois[];
  termo_consentimento?: TermoConsentimento;
  pacotes?: PacoteTratamento[];
}

export interface InsumoConsumido {
  insumo_id: string;
  nome_item: string;
  quantidade: number;
  unidade_medida: UnidadeMedida;
  lote?: string;
}

export interface Agendamento {
  id: string;
  paciente_id: string;
  data_hora: string; // ISO string
  procedimento: string;
  status: StatusAgendamento;
  criado_em: string;
  observacoes?: string;
  duracao_minutos?: number;
  valor_estimado?: number;
  forma_pagamento?: FormaPagamento;
  status_pagamento?: StatusPagamento;
  insumos_consumidos?: InsumoConsumido[];
  lembrete_enviado?: boolean;
  data_lembrete?: string;
  // Populated relation
  paciente?: Paciente;
}

export interface EstoqueInsumo {
  id: string;
  nome_item: string;
  quantidade: number;
  unidade_medida: UnidadeMedida;
  alerta_minimo: number;
  criado_em?: string;
  categoria?: string;
  lote?: string;
  validade?: string;
  custo_unitario?: number;
}

export interface TransacaoFinanceira {
  id: string;
  agendamento_id?: string;
  paciente_id?: string;
  paciente_nome: string;
  procedimento: string;
  valor: number;
  custo_insumos?: number;
  forma_pagamento: FormaPagamento;
  status: StatusPagamento;
  data: string;
  tipo: 'receita' | 'despesa';
  observacao?: string;
}

export type TabType = 
  | 'dashboard' 
  | 'agendamentos' 
  | 'pacientes' 
  | 'estoque' 
  | 'financeiro' 
  | 'whatsapp'
  | 'whatsapp_automation' 
  | 'retorno_pos'
  | 'usuarios'
  | 'supabase_guide';
