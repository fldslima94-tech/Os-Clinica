import { pgTable, text, serial, timestamp, integer, numeric, boolean, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Tabela: Usuários (Integrada com Firebase Auth)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  nome: text('nome'),
  role: text('role').default('usuario'),
  clinicaId: text('clinica_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. Tabela: Pacientes / Clientes
export const pacientes = pgTable('pacientes', {
  id: serial('id').primaryKey(),
  clinicaId: text('clinica_id'),
  nome: text('nome').notNull(),
  telefone: text('telefone').notNull(),
  email: text('email'),
  cpf: text('cpf'),
  dataNascimento: text('data_nascimento'),
  historicoClinico: text('historico_clinico'),
  alergias: text('alergias'),
  medicacoes: text('medicacoes'),
  fototipo: text('fototipo'),
  queixaPrincipal: text('queixa_principal'),
  fotoUrl: text('foto_url'),
  criadoEm: timestamp('criado_em').defaultNow(),
});

// 3. Tabela: Estoque de Insumos
export const estoqueInsumos = pgTable('estoque_insumos', {
  id: serial('id').primaryKey(),
  clinicaId: text('clinica_id'),
  nomeItem: text('nome_item').notNull(),
  quantidade: integer('quantidade').notNull().default(0),
  unidadeMedida: text('unidade_medida').notNull().default('unidade'),
  alertaMinimo: integer('alerta_minimo').notNull().default(5),
  categoria: text('categoria').default('Geral'),
  marca: text('marca'),
  lote: text('lote'),
  validade: text('validade'),
  precoCusto: numeric('preco_custo', { precision: 10, scale: 2 }).default('0.00'),
  criadoEm: timestamp('criado_em').defaultNow(),
});

// 4. Tabela: Agendamentos
export const agendamentos = pgTable('agendamentos', {
  id: serial('id').primaryKey(),
  clinicaId: text('clinica_id'),
  pacienteId: integer('paciente_id').references(() => pacientes.id),
  dataHora: timestamp('data_hora').notNull(),
  duracaoMinutos: integer('duracao_minutos').default(45),
  procedimento: text('procedimento').notNull(),
  status: text('status').notNull().default('pendente'),
  valorEstimado: numeric('valor_estimado', { precision: 10, scale: 2 }),
  formaPagamento: text('forma_pagamento'),
  statusPagamento: text('status_pagamento'),
  lembreteEnviado: boolean('lembrete_enviado').default(false),
  observacoes: text('observacoes'),
  insumosConsumidos: jsonb('insumos_consumidos').default([]),
  profissionalId: text('profissional_id'),
  profissionalNome: text('profissional_nome').default('Profissional'),
  criadoEm: timestamp('criado_em').defaultNow(),
});

// 5. Tabela: Transações Financeiras
export const transacoesFinanceiras = pgTable('transacoes_financeiras', {
  id: serial('id').primaryKey(),
  clinicaId: text('clinica_id'),
  agendamentoId: integer('agendamento_id').references(() => agendamentos.id),
  pacienteId: integer('paciente_id').references(() => pacientes.id),
  pacienteNome: text('paciente_nome').notNull(),
  profissionalId: text('profissional_id'),
  profissionalNome: text('profissional_nome'),
  procedimento: text('procedimento').notNull(),
  valor: numeric('valor', { precision: 10, scale: 2 }).notNull(),
  custoInsumos: numeric('custo_insumos', { precision: 10, scale: 2 }).default('0.00'),
  tipo: text('tipo').notNull(), // 'entrada' | 'saida' | 'receita' | 'despesa'
  formaPagamento: text('forma_pagamento').notNull(),
  status: text('status').notNull().default('pago'),
  data: timestamp('data').defaultNow().notNull(),
  observacao: text('observacao'),
  excluido: boolean('excluido').default(false),
});

// 6. Tabela: Bens & Ativos Patrimoniais
export const bensAtivos = pgTable('bens_ativos', {
  id: serial('id').primaryKey(),
  clinicaId: text('clinica_id'),
  nome: text('nome').notNull(),
  categoria: text('categoria').notNull(),
  dataAquisicao: text('data_aquisicao'),
  valorCompra: numeric('valor_compra', { precision: 10, scale: 2 }).default('0.00'),
  estadoConservacao: text('estado_conservacao').default('bom'),
  numeroSerie: text('numero_serie'),
  localizacaoSala: text('localizacao_sala').default('Recepção'),
  status: text('status').default('ativo'),
  criadoEm: timestamp('criado_em').defaultNow(),
});

// 7. Tabela: Fornecedores
export const fornecedores = pgTable('fornecedores', {
  id: serial('id').primaryKey(),
  clinicaId: text('clinica_id'),
  razaoSocial: text('razao_social').notNull(),
  nomeFantasia: text('nome_fantasia'),
  cnpjCpf: text('cnpj_cpf'),
  telefone: text('telefone').notNull(),
  email: text('email'),
  categoria: text('categoria').default('insumos'),
  criadoEm: timestamp('criado_em').defaultNow(),
});

// 8. Tabela: Avisos do Quadro
export const avisosQuadro = pgTable('avisos_quadro', {
  id: serial('id').primaryKey(),
  clinicaId: text('clinica_id'),
  titulo: text('titulo').notNull(),
  mensagem: text('mensagem').notNull(),
  prioridade: text('prioridade').default('informativo'),
  autorNome: text('autor_nome').notNull(),
  destinatarios: text('destinatarios').default('todos'),
  ativo: boolean('ativo').default(true),
  criadoEm: timestamp('criado_em').defaultNow(),
});

// Relationships
export const pacientesRelations = relations(pacientes, ({ many }) => ({
  agendamentos: many(agendamentos),
  transacoes: many(transacoesFinanceiras),
}));

export const agendamentosRelations = relations(agendamentos, ({ one }) => ({
  paciente: one(pacientes, {
    fields: [agendamentos.pacienteId],
    references: [pacientes.id],
  }),
}));
