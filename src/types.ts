export type StatusAgendamento = 'pendente' | 'confirmado' | 'em_espera' | 'em_atendimento' | 'concluido' | 'cancelado';
export type UnidadeMedida = 'ml' | 'unidade' | 'unidades' | 'seringa' | 'seringas' | 'frasco' | 'frascos' | 'ampola' | 'ampolas' | 'gramas' | 'pares' | 'bisnagas' | 'UI' | string;
export type FormaPagamento = 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'transferencia' | 'boleto';
export type StatusPagamento = 'pago' | 'pendente' | 'parcial' | 'estornado';

// RBAC Hierarquia: admin_master / admin_total (Master Total), admin_local (Admin Local / Gestor), usuario / profissional / recepcao / operador (Usuário da Equipe), cliente (Portal do Paciente)
export type UserRole = 
  | 'admin_master' 
  | 'admin_total' 
  | 'admin_local' 
  | 'usuario' 
  | 'profissional' 
  | 'recepcao' 
  | 'cliente' 
  | 'gestor' 
  | 'admin' 
  | 'operador';

export interface PermissoesCustomizadas {
  modulosLiberados?: string[]; // Ex: ['dashboard', 'agendamentos', 'pacientes', 'estoque', 'financeiro', 'patrimonio', 'fornecedores', 'whatsapp', 'quadro_avisos', 'portal_paciente']
  financeiro: { 
    verEntradas: boolean; 
    verSaidas: boolean; 
    verRecorrentes: boolean; 
    excluir: boolean;
    verRelatorios?: boolean;
  };
  clientes: { 
    criar: boolean; 
    editar: boolean; 
    excluir: boolean; 
    verHistorico: boolean;
    preencherAnamnese?: boolean;
  };
  agenda: { 
    verTodos: boolean; 
    verPropria?: boolean;
    criar: boolean; 
    cancelar: boolean; 
    finalizar: boolean; 
  };
  procedimentos: { 
    verCustos: boolean; 
    verMargem: boolean; 
    criar: boolean; 
    excluir: boolean;
    ajustarEstoque?: boolean;
  };
  bens: { 
    visualizar?: boolean;
    cadastrar?: boolean;
    editar?: boolean;
    gerenciar: boolean; 
    excluir: boolean; 
    manutencao?: boolean;
  };
  estoque: { 
    ajustar: boolean; 
    excluir: boolean; 
  };
  fornecedores?: {
    visualizar: boolean;
    criar: boolean;
    editar: boolean;
    excluir: boolean;
  };
  orcamentos?: {
    verTodos: boolean;
    responder: boolean;
    verEmails: boolean;
  };
}

export interface PerfilUsuario {
  id: string;
  clinicaId: string;
  nomeCompleto: string;
  email: string;
  avatarUrl?: string;
  profissao?: string;
  cargo: 'admin_total' | 'admin_local' | 'recepcao' | 'profissional' | 'cliente' | string;
  role: UserRole;
  permissoesCustomizadas?: PermissoesCustomizadas;
  criadoEm?: any;
  atualizadoEm?: any;
}

export interface CampoPersonalizado {
  id: string;
  categoria: string; // 'Clientes' | 'Procedimentos' | 'Estoque' | 'Agenda' | 'Bens' | 'Fornecedores' | 'Financeiro' | 'Anamnese'
  label: string;
  tipo: 'text' | 'number' | 'select' | 'date' | 'boolean' | 'textarea';
  opcoes?: string[]; // Para selects
  placeholder?: string;
  obrigatorio?: boolean;
  largura?: 'half' | 'full' | 'third';
  ajuda?: string;
  criadoEm?: string;
}

export interface ConfiguracaoCampos {
  id?: string;
  clinicaId: string;
  camposOcultos: string[]; // Ex: ['cliente.cpf', 'procedimento.custoInsumos', 'insumo.lote', 'agendamento.observacoes']
  camposObrigatorios?: string[];
  labelsCustomizados?: Record<string, string>; // Mapeamento campoId -> Rótulo personalizado
  ajudaCustomizada?: Record<string, string>; // Mapeamento campoId -> Descrição de ajuda personalizada
  placeholdersCustomizados?: Record<string, string>; // Mapeamento campoId -> Placeholder personalizado
  ordemCampos?: Record<string, string[]>; // Mapeamento categoria/tela -> Lista de IDs de campos em ordem customizada
  larguraCampos?: Record<string, 'half' | 'full' | 'third'>; // Largura do campo no grid
  camposPersonalizados?: CampoPersonalizado[]; // Novos campos criados dinamicamente pelo Admin Master
  atualizadoPor?: string;
  atualizadoEm?: any;
}

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
  tipo?: 'retorno' | 'pos_venda'; // 'retorno': Retorno Clínico | 'pos_venda': Pós-Venda de Produto / Home Care
  origem_venda?: 'produto' | 'servico' | 'procedimento';
  procedimento_origem: string;
  produto_nome?: string;
  data_procedimento: string;
  dias_apos: number;
  data_ideal_retorno: string;
  motivo: string;
  observacao?: string;
  status: 'pendente' | 'agendado' | 'contatado';
  criado_em?: string;
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
  clinicaId?: string;
  nome: string;
  nomeCompleto?: string;
  email: string;
  senha?: string;
  cargo: string;
  profissao?: string;
  role: UserRole;
  telefone?: string;
  status: 'ativo' | 'inativo';
  ultimo_acesso?: string;
  avatar_url?: string;
  avatarUrl?: string;
  registro_profissional?: string; // CRM, CRBM, COREN, CRF, Esteticista
  especialidade?: string;
  porcentagem_comissao?: number;
  criado_em?: string;
  created_at?: string;
  permissoes: PermissoesUsuario;
  permissoesCustomizadas?: PermissoesCustomizadas;
}

export interface FotoAntesDepois {
  id: string;
  titulo?: string;
  data: string;
  foto_antes?: string;
  foto_antes_url?: string;
  foto_depois?: string;
  foto_depois_url?: string;
  procedimento?: string;
  procedimento_nome?: string;
  legenda?: string;
  observacoes?: string;
  criado_em?: string;
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

export interface AnamneseCompleta {
  id: string;
  clinicaId: string;
  clienteId: string;
  clienteNome?: string;
  profissionalId?: string;
  profissionalNome?: string;
  procedimentoNome?: string;
  
  // 1. Dados Pessoais Snapshot
  dadosPessoais: {
    nomeCompleto: string;
    dataNascimento: string;
    idade: number;
    telefone: string;
    cpf?: string;
    email?: string;
    endereco?: string;
    profissao?: string;
    contatoEmergencia?: {
      nome: string;
      telefone: string;
    };
  };

  // 2. Anamnese Geral (Saúde)
  saudeGeral: {
    gestanteOuAmamentando: boolean;
    possuiAlergias: boolean;
    detalhesAlergias?: string;
    diabetesOuPressaoAlta: boolean;
    historicoQueloide: boolean;
    problemasCoagulacao: boolean;
    herpesAtiva: boolean;
    usoAcidos: boolean;
    detalhesAcidos?: string;
    cirurgiaEsteticaRecente: boolean;
    detalhesCirurgia?: string;
  };

  // 3. Específico por Procedimento
  procedimentoTipo: 'limpeza_pele' | 'injetaveis' | 'micropigmentacao' | 'outro';
  detalhesProcedimento: {
    limpezaPele?: {
      tipoPele: string[]; // ['Seca', 'Oleosa', 'Mista', 'Sensível', 'Acneica']
      usaProtetorSolar: boolean;
      aparenciaAtual: string[]; // ['Cravos', 'Espinhas', 'Manchas', 'Desidratação']
    };
    injetaveis?: {
      jaRealizouAntes: boolean;
      historicoReacoes: boolean;
      areaMaiorIncomodo: string;
    };
    micropigmentacao?: {
      jaFezAntes: boolean;
      corPreferencia: string;
      observacoesFormato: string;
    };
    outro?: {
      objetivoTratamento: string;
      observacoesClinicas: string;
    };
  };

  // 4. Consentimento
  termoAceito: boolean;
  assinaturaUrl: string; // Imagem em base64 ou URL no Storage
  assinadoEm: string;
  criadoEm: string;
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
  endereco?: string;
  profissao?: string;
  contato_emergencia?: {
    nome: string;
    telefone: string;
  };
  alergias?: string;
  medicacoes?: string;
  queixa_principal?: string;
  fototipo?: string;
  foto_url?: string;
  fotos_antes_depois?: FotoAntesDepois[];
  galeria_fotos_evolucao?: FotoEvolucaoSessao[];
  fichas_anamnese?: FichaAnamnesePreenchida[];
  anamneses_completas?: AnamneseCompleta[];
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

export interface HistoricoManutencaoItem {
  id: string;
  dataRealizacao: string; // ISO string ou Timestamp
  tipo: 'preventiva' | 'corretiva' | 'calibracao';
  descricao: string;
  custo: number;
  tecnicoEmpresa: string;
  laudoUrl?: string;
  laudoNome?: string;
  registradoPor: string;
}

export interface BemAtivo {
  id: string;
  clinica_id?: string;
  clinicaId?: string;
  nome: string;
  nomeBem?: string;
  categoria: CategoriaBemAtivo;
  data_aquisicao: string;
  dataAquisicao?: any;
  valor_compra: number;
  valorCompra?: number;
  estado_conservacao: EstadoConservacaoBem;
  estadoConservacao?: EstadoConservacaoBem;
  numero_serie?: string;
  numeroSerie?: string;
  nota_fiscal_url?: string;
  notaFiscalUrl?: string;
  nota_fiscal_nome?: string;
  foto_url?: string;
  localizacao_sala: string;
  localizacaoSala?: string;
  responsavel_nome?: string;
  garantia_ate?: string;
  observacoes?: string;
  status?: 'ativo' | 'manutencao' | 'descartado' | 'inativo';

  // --- Campos de Manutenção Preventiva (6.1) ---
  requerManutencao?: boolean;
  periodicidadeDias?: number; // Ex: 30, 90, 180, 365
  dataUltimaManutencao?: string;
  dataProximaManutencao?: string;
  empresaTecnica?: string;
  statusManutencao?: 'em_dia' | 'alerta_proximo' | 'vencida' | 'em_manutencao';
  historicoManutencoes?: HistoricoManutencaoItem[];

  criado_em: string;
  criadoEm?: any;
}

export type BemPatrimonial = BemAtivo;

export type CategoriaFornecedor = 
  | 'insumos' 
  | 'equipamentos' 
  | 'manutencao' 
  | 'servicos' 
  | 'software' 
  | 'imobiliario'
  | 'outros';

export interface Fornecedor {
  id: string;
  clinica_id?: string;
  razao_social: string; // Nome ou Razão Social
  nome_fantasia?: string;
  cnpj_cpf?: string;
  inscricao_estadual?: string;
  telefone: string;
  email?: string;
  site?: string;
  categoria: CategoriaFornecedor | string;
  contato_responsavel?: string;
  cargo_contato?: string;
  // Endereço completo padronizado
  cep?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cidade_uf?: string;
  // Dados Bancários & Condições Comerciais
  pix_chave?: string;
  tipo_chave_pix?: string;
  banco_dados?: string;
  banco_nome?: string;
  agencia?: string;
  conta_corrente?: string;
  condicoes_pagamento?: string;
  prazo_entrega_medio?: string;
  observacoes?: string;
  status?: 'ativo' | 'inativo';
  criado_em: string;
}

export type TabType = 
  | 'dashboard' 
  | 'agendamentos' 
  | 'pacientes' // Fichas de Clientes
  | 'fornecedores' // Gestão de Fornecedores e Parceiros
  | 'estoque' 
  | 'patrimonio'
  | 'bens' // Bens & Ativos do Studio
  | 'financeiro' 
  | 'retorno_pos' 
  | 'whatsapp'
  | 'portal_paciente'
  | 'quadro_avisos'
  | 'usuarios'
  | 'permissoes' // Módulo de Gestão de Permissões e Campos do admin_total
  | 'perfil' // Meu Perfil / Minha Conta
  | 'configuracoes'
  | 'supabase_guide';

export interface VariacaoProcedimento {
  id: string;
  nome: string;
  valor: number;
  duracao_minutos?: number;
  descricao?: string;
}

export interface ProcedimentoInsumoVinculado {
  insumo_id: string;
  nome_item: string;
  quantidade: number;
  unidade_medida: UnidadeMedida;
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
  cuidados_pos?: string;
  contraindicacoes?: string[] | string;
  profissional_id?: string;
  profissional_nome?: string;
  variacoes?: VariacaoProcedimento[];
  descricao: string;
  areas_aplicacao?: string[];
  indicacoes?: string[];
  insumos_vinculados?: ProcedimentoInsumoVinculado[];
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
