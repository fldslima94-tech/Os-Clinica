export type StatusAgendamento = 'pendente' | 'confirmado' | 'em_espera' | 'em_atendimento' | 'concluido' | 'cancelado';
export type UnidadeMedida = 'ml' | 'unidade' | 'seringa';
export type FormaPagamento = 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'transferencia';
export type StatusPagamento = 'pago' | 'pendente' | 'parcial';
export type UserRole = 'admin' | 'operador' | 'cliente';

export type PrioridadeAviso = 'urgente' | 'importante' | 'informativo';

export interface AvisoQuadro {
  id: string;
  titulo: string;
  mensagem: string;
  prioridade: PrioridadeAviso;
  autor_nome: string;
  autor_role: UserRole;
  data_criacao: string;
  destinatarios: 'todos' | 'admin' | 'operador' | 'cliente';
  ativo: boolean;
  exibir_popup: boolean;
  lido_por?: string[];
}

export interface PacoteItemProcedimento {
  procedimento_id: string;
  procedimento_nome: string;
  sessoes: number;
  valor_unitario: number;
}

export interface PacoteTratamento {
  id: string;
  nome_pacote: string; // Ex: "Protocolo Glúteo Max (5 Sessões)" ou "Laser Lavieen (3 Sessões)"
  procedimento: string;
  total_sessoes: number;
  sessoes_realizadas: number;
  valor_total: number;
  valor_original_sem_desconto?: number;
  desconto_aplicado_percentual?: number;
  desconto_valor?: number;
  autorizado_por_admin?: boolean;
  itens_procedimentos?: PacoteItemProcedimento[];
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

export interface VinculoProcedimentoInsumo {
  procedimento_id: string;
  procedimento_nome: string;
  quantidade_por_procedimento: number;
  unidade_medida: UnidadeMedida;
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
  validade?: string; // YYYY-MM-DD
  custo_unitario?: number;
  procedimento_vinculado_id?: string;
  procedimento_vinculado_nome?: string;
  quantidade_por_procedimento?: number;
  procedimentos_vinculados?: VinculoProcedimentoInsumo[];
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
  | 'portal_paciente'
  | 'quadro_avisos'
  | 'usuarios'
  | 'supabase_guide';

export interface VariacaoProcedimento {
  id: string; // 'v1' | 'v2' | 'v3'
  nome: string; // Ex: "1 Área / Básico", "2 Áreas / Médio", "3 Áreas / Completo"
  valor: number;
  duracao_minutos?: number;
  descricao?: string;
}

export interface ProcedimentoClinico {
  id: string;
  nome: string;
  categoria: string;
  duracao_minutos: number;
  valor_tabela: number;
  valor_promocional?: number;
  variacoes?: VariacaoProcedimento[];
  descricao: string;
  areas_aplicacao?: string[];
  indicacoes?: string[];
  insumos_vinculados?: {
    insumo_id: string;
    nome_item: string;
    quantidade: number;
    unidade_medida: UnidadeMedida;
  }[];
  cuidados_pos?: string;
  ativo: boolean;
  destaque_portal?: boolean;
  imagem_url?: string;
  criado_em?: string;
  cadastrado_por_admin?: boolean;
  criado_por_usuario_id?: string;
  criado_por_nome?: string;
}

export interface SolicitacaoOrcamento {
  id: string;
  paciente_nome: string;
  paciente_email: string;
  paciente_telefone: string;
  paciente_avatar_url?: string;
  conta_google_vinculada: boolean;
  procedimentos_selecionados: {
    procedimento_id: string;
    nome: string;
    categoria: string;
    valor_unitario: number;
  }[];
  valor_total_estimado: number;
  queixa_principal?: string;
  periodo_preferencia?: 'qualquer' | 'manha' | 'tarde' | 'noite' | 'sabado';
  status: 'novo' | 'em_analise' | 'orcamento_enviado' | 'agendado';
  data_solicitacao: string;
  resposta_clinica?: string;
}

export interface PacienteGoogleProfile {
  id: string;
  nome: string;
  email: string;
  avatar_url: string;
  telefone?: string;
  data_nascimento?: string;
}

