export type StatusAgendamento = 'pendente' | 'confirmado' | 'em_espera' | 'em_atendimento' | 'concluido' | 'cancelado';
export type UnidadeMedida = 'ml' | 'unidade' | 'unidades' | 'seringa' | 'seringas' | 'frasco' | 'frascos' | 'ampola' | 'ampolas' | 'gramas' | 'pares' | 'bisnagas' | 'UI' | string;
export type FormaPagamento = 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'transferencia' | 'boleto';
export type StatusPagamento = 'pago' | 'pendente' | 'parcial' | 'estornado';

// RBAC: gestor, recepcao, profissional, cliente (with admin/operador compatibility)
export type UserRole = 'gestor' | 'recepcao' | 'profissional' | 'cliente' | 'admin' | 'operador';

export type PrioridadeAviso = 'urgente' | 'importante' | 'informativo';

export interface ClinicaConfig {
  id: string;
  nome: string;
  logomarca_url: string;
  telefone: string;
  endereco: string;
  cnpj?: string;
  email_contato?: string;
  slogan?: string;
  tema_cor_primaria?: string;
}

export interface AvisoQuadro {
  id: string;
  clinica_id?: string;
  titulo: string;
  mensagem: string;
  prioridade: PrioridadeAviso;
  autor_nome: string;
  autor_role: UserRole;
  data_criacao: string;
  data_publicacao?: string;
  destinatarios: 'todos' | 'gestor' | 'recepcao' | 'profissional' | 'cliente' | 'admin' | 'operador';
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
  nome_pacote: string;
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
  clinica_id?: string;
  paciente_id: string;
  paciente_nome: string;
  telefone: string;
  procedimento_origem: string;
  data_procedimento: string;
  dias_apos: number;
  data_ideal_retorno: string;
  motivo: string;
  status: 'pendente' | 'agendado' | 'contatado';
}

export interface PermissoesUsuario {
  ver_financeiro_completo: boolean;
  emitir_recibo: boolean;
  editar_prontuario_clinico: boolean;
  gerenciar_estoque_custos: boolean;
  configuracoes_sistema: boolean;
  visualizar_bens_ativos?: boolean;
}

export interface UsuarioEquipe {
  id: string;
  clinica_id?: string;
  nome: string;
  email: string;
  senha?: string;
  cargo: string;
  role: UserRole;
  telefone?: string;
  status: 'ativo' | 'inativo';
  ultimo_acesso?: string;
  avatar_url?: string;
  registro_profissional?: string; // CRM, CRBM, COREN, CRF, Esteticista
  especialidade?: string;
  porcentagem_comissao?: number;
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
  legenda?: string;
  observacoes?: string;
}

export interface FotoEvolucaoSessao {
  id: string;
  url: string;
  data: string;
  legenda: string;
  fase: 'antes' | 'durante' | 'depois' | 'retorno';
  procedimento_nome?: string;
  autor_nome?: string;
}

export type FotoEvolucaoClinica = FotoEvolucaoSessao;

export interface TermoConsentimento {
  assinado: boolean;
  data_assinatura?: string;
  assinatura_url?: string;
  assinatura_base64?: string;
  documento_rg_cpf?: string;
  cpf_declarado?: string;
  ip_registro?: string;
  texto_termo?: string;
  procedimento_nome?: string;
  nome_paciente_declarado?: string;
}

export interface RespostaAnamnese {
  pergunta_id: string;
  pergunta: string;
  resposta: string | boolean | string[];
}

export interface FichaAnamnesePreenchida {
  id: string;
  modelo_id: string;
  modelo_titulo: string;
  data_preenchimento: string;
  profissional_id?: string;
  profissional_nome?: string;
  respostas: RespostaAnamnese[];
  observacoes_gerais?: string;
  assinatura_cliente_url?: string;
}

export interface FichaRetornoEvolucao {
  id: string;
  clinica_id?: string;
  paciente_id: string;
  paciente_nome?: string;
  agendamento_id?: string;
  data: string;
  profissional_id: string;
  profissional_nome: string;
  procedimento_nome: string;
  numero_sessao?: number;
  relato_paciente: string;
  evolucao_clinica: string;
  intercorrencias?: string;
  parametros_tecnicos?: string; // Ex: Laser 15J, Agulha 1R 0.25mm, Pigmento Castanho Escuro Lote 382
  orientacoes_proxima_sessao?: string;
  fotos_sessao?: string[];
  criado_em: string;
}

export interface PerguntaAnamnese {
  id: string;
  pergunta: string;
  tipo: 'texto' | 'sim_nao' | 'multipla_escolha' | 'alergias';
  obrigatorio: boolean;
  opcoes?: string[];
}

export interface ModeloAnamnese {
  id: string;
  clinica_id?: string;
  titulo: string;
  especialidade: string;
  profissional_id?: string;
  profissional_nome?: string;
  perguntas: PerguntaAnamnese[];
  criado_em: string;
  ativo: boolean;
}

export interface Paciente {
  id: string;
  clinica_id?: string;
  nome: string;
  telefone: string;
  data_nascimento: string;
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
  galeria_fotos_evolucao?: FotoEvolucaoSessao[];
  fichas_anamnese?: FichaAnamnesePreenchida[];
  evolucoes_retornos?: FichaRetornoEvolucao[];
  termo_consentimento?: TermoConsentimento;
  pacotes?: PacoteTratamento[];
  habilitar_login_portal?: boolean;
}

export interface InsumoConsumido {
  insumo_id: string;
  nome_item: string;
  quantidade: number;
  quantidade_utilizada?: number;
  unidade_medida: UnidadeMedida;
  lote?: string;
  custo_unitario?: number;
}

export interface Agendamento {
  id: string;
  clinica_id?: string;
  paciente_id: string;
  data_hora: string;
  procedimento: string;
  status: StatusAgendamento;
  criado_em: string;
  observacoes?: string;
  duracao_minutos?: number;
  valor_estimado?: number;
  forma_pagamento?: FormaPagamento;
  status_pagamento?: StatusPagamento;
  insumos_consumidos?: InsumoConsumido[];
  insumos_utilizados?: InsumoConsumido[];
  lembrete_enviado?: boolean;
  data_lembrete?: string;
  // Profissional vinculado obrigatório
  profissional_id?: string;
  profissional_nome: string;
  profissional_cargo?: string;
  // Contrato / Termo
  contrato_vinculado?: string;
  contrato_assinado?: boolean;
  // Sessão atual
  numero_sessao?: number;
  total_sessoes_pacote?: number;
  // Populated relation
  paciente?: Paciente;
}

export type CategoriaInsumo = 
  | 'pigmento' 
  | 'descartavel' 
  | 'cosmetico' 
  | 'agulha_lamina' 
  | 'anestesico' 
  | 'acido_injetavel' 
  | 'outros';

export interface VinculoProcedimentoInsumo {
  procedimento_id: string;
  procedimento_nome: string;
  quantidade_por_procedimento: number;
  unidade_medida?: string;
}

export interface EstoqueInsumo {
  id: string;
  clinica_id?: string;
  nome_item: string;
  quantidade: number;
  unidade_medida: UnidadeMedida;
  alerta_minimo: number;
  criado_em?: string;
  categoria: CategoriaInsumo | string;
  marca?: string;
  tom_cor?: string;
  cor_tonalidade?: string;
  lote?: string;
  validade?: string;
  custo_unitario?: number;
  observacoes?: string;
  procedimento_vinculado_id?: string;
  procedimento_vinculado_nome?: string;
  quantidade_por_procedimento?: number;
  procedimentos_vinculados?: VinculoProcedimentoInsumo[];
}

export type TipoTransacao = 'entrada' | 'saida' | 'receita' | 'despesa';

export type CategoriaTransacao = 
  | 'atendimento' 
  | 'venda_produto' 
  | 'comissao' 
  | 'compra_insumos' 
  | 'despesa_recorrente' 
  | 'manutencao' 
  | 'marketing' 
  | 'imposto' 
  | 'avulsa';

export interface TransacaoFinanceira {
  id: string;
  clinica_id?: string;
  agendamento_id?: string;
  paciente_id?: string;
  paciente_nome: string;
  profissional_id?: string;
  profissional_nome?: string;
  procedimento: string;
  valor: number;
  custo_insumos?: number;
  forma_pagamento: FormaPagamento;
  status: StatusPagamento;
  data: string;
  tipo: 'entrada' | 'saida' | 'receita' | 'despesa';
  categoria?: CategoriaTransacao | string;
  observacao?: string;
  // Soft delete audit fields
  excluido?: boolean;
  motivo_exclusao?: string;
  excluido_por?: string;
  excluido_por_role?: UserRole;
  data_exclusao?: string;
}

export interface DespesaRecorrente {
  id: string;
  clinica_id?: string;
  descricao: string;
  categoria: 'aluguel' | 'energia' | 'internet' | 'software' | 'contabilidade' | 'marketing' | 'manutencao' | 'limpeza' | 'outros';
  valor: number;
  dia_vencimento: number; // 1 a 31
  recorrencia: 'mensal' | 'anual' | 'semanal';
  status: 'ativo' | 'inativo';
  forma_pagamento_preferencial: FormaPagamento;
  observacoes?: string;
  ultimo_pagamento_mes?: string; // YYYY-MM
  criado_em: string;
}

export type CategoriaBemAtivo = 
  | 'equipamento' 
  | 'dermografo' 
  | 'maca_mobiliario' 
  | 'eletronico' 
  | 'laser' 
  | 'autoclave' 
  | 'climatizacao' 
  | 'outros';

export type CategoriaBem = CategoriaBemAtivo;

export type EstadoConservacaoBem = 'excelente' | 'bom' | 'regular' | 'manutencao';

export interface BemAtivo {
  id: string;
  clinica_id?: string;
  nome: string;
  categoria: CategoriaBemAtivo;
  data_aquisicao: string;
  valor_compra: number;
  estado_conservacao: EstadoConservacaoBem;
  numero_serie?: string;
  nota_fiscal_url?: string;
  nota_fiscal_nome?: string;
  foto_url?: string;
  localizacao_sala: string;
  responsavel_nome?: string;
  garantia_ate?: string;
  observacoes?: string;
  status?: 'ativo' | 'manutencao' | 'descartado' | 'inativo';
  criado_em: string;
}

export type BemPatrimonial = BemAtivo;

export type TabType = 
  | 'dashboard' 
  | 'agendamentos' 
  | 'pacientes' // Fichas de Clientes
  | 'estoque' 
  | 'patrimonio'
  | 'bens' // Bens & Ativos do Studio
  | 'financeiro' 
  | 'retorno_pos' 
  | 'whatsapp'
  | 'portal_paciente'
  | 'quadro_avisos'
  | 'usuarios'
  | 'configuracoes'
  | 'supabase_guide';

export interface VariacaoProcedimento {
  id: string;
  nome: string;
  valor: number;
  duracao_minutos?: number;
  descricao?: string;
}

export interface ProcedimentoClinico {
  id: string;
  clinica_id?: string;
  nome: string;
  categoria: string;
  duracao_minutos: number;
  valor_tabela?: number;
  preco_sugerido?: number;
  valor_promocional?: number;
  quantidade_sessoes?: number;
  dias_retorno_padrao?: number;
  instrucoes_cuidados?: string;
  contraindicacoes?: string[];
  profissional_id?: string;
  profissional_nome?: string;
  variacoes?: VariacaoProcedimento[];
  descricao: string;
  areas_aplicacao?: string[];
  indicacoes?: string[];
  fotos_antes_depois?: FotoAntesDepois[];
  contrato_id?: string;
  contrato_padrao?: string;
  exige_contrato?: boolean;
  custo_estimado_insumos?: number;
  margem_lucro_estimada?: number;
  ativo?: boolean;
  destaque_portal?: boolean;
  imagem_url?: string;
  criado_em?: string;
  cadastrado_por_admin?: boolean;
  criado_por_usuario_id?: string;
  criado_por_nome?: string;
}

export interface SolicitacaoOrcamento {
  id: string;
  clinica_id?: string;
  paciente_nome: string;
  paciente_email: string;
  paciente_telefone: string;
  paciente_avatar_url?: string;
  conta_google_vinculada: boolean;
  procedimento_nome?: string;
  valor_total?: number;
  profissional_id?: string;
  profissional_nome?: string;
  procedimentos_selecionados?: {
    procedimento_id: string;
    nome: string;
    categoria: string;
    valor_unitario: number;
  }[];
  valor_total_estimado?: number;
  queixa_principal?: string;
  periodo_preferencia?: 'qualquer' | 'manha' | 'tarde' | 'noite' | 'sabado';
  status: 'novo' | 'em_analise' | 'orcamento_enviado' | 'agendado' | 'pendente';
  data_solicitacao: string;
  resposta_clinica?: string;
  observacoes?: string;
}

export interface PacienteGoogleProfile {
  id: string;
  nome: string;
  email: string;
  avatar_url: string;
  telefone?: string;
  data_nascimento?: string;
}
