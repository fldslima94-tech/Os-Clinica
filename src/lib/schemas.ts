import { z } from 'zod';

export const ClinicaConfigSchema = z.object({
  id: z.string().min(1),
  nome: z.string().min(2, 'O nome da clínica deve ter ao menos 2 caracteres'),
  logomarca_url: z.string().url('URL da logomarca inválida').or(z.string().min(1)),
  telefone: z.string().min(8, 'Telefone inválido'),
  endereco: z.string().min(3, 'Endereço obrigatório'),
  cnpj: z.string().optional(),
  email_contato: z.string().email('E-mail inválido').optional().or(z.literal('')),
  slogan: z.string().optional(),
});

export const UsuarioEquipeSchema = z.object({
  id: z.string().min(1),
  clinica_id: z.string().optional(),
  nome: z.string().min(2, 'Nome obrigatório'),
  email: z.string().email('E-mail inválido'),
  cargo: z.string().min(2, 'Cargo obrigatório'),
  role: z.enum(['gestor', 'recepcao', 'profissional', 'cliente', 'admin', 'operador']),
  telefone: z.string().optional(),
  status: z.enum(['ativo', 'inativo']),
  avatar_url: z.string().optional(),
  registro_profissional: z.string().optional(),
  especialidade: z.string().optional(),
  porcentagem_comissao: z.number().min(0).max(100).optional(),
});

export const ProcedimentoSchema = z.object({
  nome: z.string().min(2, 'Nome do procedimento é obrigatório'),
  categoria: z.string().min(2, 'Categoria é obrigatória'),
  duracao_minutos: z.number().min(5, 'Duração mínima de 5 minutos'),
  valor_tabela: z.number().min(0, 'Valor de tabela deve ser positivo'),
  quantidade_sessoes: z.number().min(1, 'Quantidade de sessões deve ser no mínimo 1'),
  profissional_id: z.string().optional(),
  profissional_nome: z.string().optional(),
  descricao: z.string().optional().default(''),
  contrato_padrao: z.string().optional(),
  exige_contrato: z.boolean().optional(),
  custo_estimado_insumos: z.number().min(0).optional(),
  margem_lucro_estimada: z.number().min(0).optional(),
  ativo: z.boolean().default(true),
});

export const EstoqueInsumoSchema = z.object({
  nome_item: z.string().min(2, 'Nome do insumo é obrigatório'),
  categoria: z.string().min(2, 'Categoria obrigatória'),
  quantidade: z.number().min(0, 'Quantidade não pode ser negativa'),
  unidade_medida: z.enum(['ml', 'unidade', 'seringa', 'frasco', 'ampola', 'gramas', 'pares']),
  alerta_minimo: z.number().min(0, 'Alerta mínimo não pode ser negativo'),
  marca: z.string().optional(),
  cor_tonalidade: z.string().optional(),
  lote: z.string().optional(),
  validade: z.string().optional(),
  custo_unitario: z.number().min(0).optional(),
});

export const TransacaoFinanceiraSchema = z.object({
  tipo: z.enum(['entrada', 'saida', 'receita', 'despesa']),
  categoria: z.string().min(2, 'Categoria obrigatória'),
  valor: z.number().positive('O valor deve ser maior que zero'),
  forma_pagamento: z.enum(['pix', 'cartao_credito', 'cartao_debito', 'dinheiro', 'transferencia', 'boleto']),
  status: z.enum(['pago', 'pendente', 'parcial', 'estornado']),
  data: z.string().min(1, 'Data obrigatória'),
  paciente_nome: z.string().optional().default(''),
  procedimento: z.string().optional().default(''),
  observacao: z.string().optional(),
});

export const SoftDeleteAuditSchema = z.object({
  motivo_exclusao: z.string().min(4, 'Informe o motivo detalhado da exclusão do lançamento'),
});

export const DespesaRecorrenteSchema = z.object({
  descricao: z.string().min(2, 'Descrição obrigatória'),
  categoria: z.enum(['aluguel', 'energia', 'internet', 'software', 'contabilidade', 'marketing', 'manutencao', 'limpeza', 'outros']),
  valor: z.number().positive('Valor deve ser maior que zero'),
  dia_vencimento: z.number().min(1).max(31, 'Dia de vencimento inválido (1 a 31)'),
  recorrencia: z.enum(['mensal', 'anual', 'semanal']),
  status: z.enum(['ativo', 'inativo']),
  forma_pagamento_preferencial: z.enum(['pix', 'cartao_credito', 'cartao_debito', 'dinheiro', 'transferencia', 'boleto']),
});

export const BemAtivoSchema = z.object({
  nome: z.string().min(2, 'Nome do bem / patrimônio obrigatório'),
  categoria: z.enum(['equipamento', 'dermografo', 'maca_mobiliario', 'eletronico', 'laser', 'autoclave', 'climatizacao', 'outros']),
  data_aquisicao: z.string().min(4, 'Data de aquisição obrigatória'),
  valor_compra: z.number().min(0, 'Valor de compra deve ser positivo'),
  estado_conservacao: z.enum(['excelente', 'bom', 'regular', 'manutencao']),
  numero_serie: z.string().optional(),
  nota_fiscal_url: z.string().optional(),
  nota_fiscal_nome: z.string().optional(),
  localizacao_sala: z.string().min(2, 'Localização / Sala obrigatória'),
  responsavel_nome: z.string().optional(),
  garantia_ate: z.string().optional(),
  observacoes: z.string().optional(),
});

export const ModeloAnamneseSchema = z.object({
  titulo: z.string().min(2, 'Título do modelo de anamnese obrigatório'),
  especialidade: z.string().min(2, 'Especialidade obrigatória'),
  profissional_id: z.string().optional(),
  profissional_nome: z.string().optional(),
  perguntas: z.array(z.object({
    id: z.string(),
    pergunta: z.string().min(2, 'Pergunta obrigatória'),
    tipo: z.enum(['texto', 'sim_nao', 'multipla_escolha', 'alergias']),
    obrigatorio: z.boolean(),
    opcoes: z.array(z.string()).optional(),
  })).min(1, 'Adicione pelo menos 1 pergunta ao modelo de anamnese'),
});

export const FichaRetornoEvolucaoSchema = z.object({
  paciente_id: z.string().min(1, 'Paciente obrigatório'),
  profissional_id: z.string().min(1, 'Profissional obrigatório'),
  profissional_nome: z.string().min(1, 'Nome do profissional obrigatório'),
  procedimento_nome: z.string().min(1, 'Procedimento obrigatório'),
  relato_paciente: z.string().min(2, 'Relato do paciente obrigatório'),
  evolucao_clinica: z.string().min(2, 'Evolução clínica obrigatória'),
  parametros_tecnicos: z.string().optional(),
  intercorrencias: z.string().optional(),
  orientacoes_proxima_sessao: z.string().optional(),
});
