export interface SystemFieldDefinition {
  id: string;
  defaultLabel: string;
  category: 'Clientes' | 'Agenda' | 'Procedimentos' | 'Estoque' | 'Bens' | 'Fornecedores' | 'Financeiro' | 'Anamnese';
  description: string;
  defaultRequired?: boolean;
  defaultWidth?: 'half' | 'full' | 'third';
  type?: 'text' | 'number' | 'select' | 'date' | 'boolean' | 'textarea';
}

export const SYSTEM_MODULES = [
  { id: 'Clientes', label: 'Ficha de Clientes / Pacientes', icon: 'User', description: 'Formulários de cadastro e prontuário' },
  { id: 'Anamnese', label: 'Anamnese & Consentimento', icon: 'FileText', description: 'Questionário de saúde e termos' },
  { id: 'Agenda', label: 'Agendamentos & Agenda', icon: 'Calendar', description: 'Marcação de consultas e sessões' },
  { id: 'Procedimentos', label: 'Procedimentos Clínicos', icon: 'Sparkles', description: 'Catálogo de serviços e tabelas de preço' },
  { id: 'Estoque', label: 'Estoque & Insumos', icon: 'Package', description: 'Materiais, pigmentos e descartáveis' },
  { id: 'Bens', label: 'Bens & Patrimônio', icon: 'Building', description: 'Equipamentos, mobiliário e manutenção' },
  { id: 'Fornecedores', label: 'Fornecedores & Parceiros', icon: 'Briefcase', description: 'Contatos e parceiros comerciais' },
  { id: 'Financeiro', label: 'Financeiro & Lançamentos', icon: 'DollarSign', description: 'Entradas, saídas e custos' },
] as const;

export const DEFAULT_SYSTEM_FIELDS: SystemFieldDefinition[] = [
  // 1. Clientes
  { id: 'cliente.nome', defaultLabel: 'Nome Completo do Cliente', category: 'Clientes', description: 'Identificação principal do paciente', defaultRequired: true, defaultWidth: 'full' },
  { id: 'cliente.telefone', defaultLabel: 'Telefone / WhatsApp', category: 'Clientes', description: 'Canal direto de contato e confirmações', defaultRequired: true, defaultWidth: 'half' },
  { id: 'cliente.cpf', defaultLabel: 'CPF do Cliente', category: 'Clientes', description: 'Documento para emissão de recibos e contratos', defaultWidth: 'half' },
  { id: 'cliente.email', defaultLabel: 'E-mail', category: 'Clientes', description: 'Envio de informativos e portal', defaultWidth: 'half' },
  { id: 'cliente.data_nascimento', defaultLabel: 'Data de Nascimento / Idade', category: 'Clientes', description: 'Cálculo dinâmico de idade', defaultWidth: 'half' },
  { id: 'cliente.profissao', defaultLabel: 'Profissão', category: 'Clientes', description: 'Ocupação do paciente', defaultWidth: 'third' },
  { id: 'cliente.endereco', defaultLabel: 'Endereço Completo', category: 'Clientes', description: 'Rua, número, bairro e cidade', defaultWidth: 'full' },
  { id: 'cliente.contato_emergencia', defaultLabel: 'Contato de Emergência (Nome & Tel)', category: 'Clientes', description: 'Pessoa de confiança em caso de urgência', defaultWidth: 'full' },
  { id: 'cliente.fototipo', defaultLabel: 'Fototipo Fitzpatrick (Escala I a VI)', category: 'Clientes', description: 'Classificação de sensibilidade e pigmentação cutânea', defaultWidth: 'half' },
  { id: 'cliente.queixa_principal', defaultLabel: 'Queixa Principal & Interesse Estético', category: 'Clientes', description: 'Motivo da procura pelo atendimento', defaultWidth: 'full' },
  { id: 'cliente.alergias', defaultLabel: 'Histórico de Alergias', category: 'Clientes', description: 'Alergias a fármacos, látex ou produtos', defaultWidth: 'half' },
  { id: 'cliente.medicacoes', defaultLabel: 'Medicamentos em Uso Contínuo', category: 'Clientes', description: 'Substâncias e tratamentos em andamento', defaultWidth: 'half' },
  { id: 'cliente.historico_clinico', defaultLabel: 'Observações Clínicas / Histórico', category: 'Clientes', description: 'Notas do prontuário e evolução', defaultWidth: 'full', type: 'textarea' },

  // 2. Anamnese
  { id: 'anamnese.dados_pessoais', defaultLabel: 'Identificação Pessoal & Contato', category: 'Anamnese', description: 'Etapa 1 da Anamnese Completa', defaultRequired: true, defaultWidth: 'full' },
  { id: 'anamnese.saude_geral', defaultLabel: 'Checklist de Saúde Geral (Sim / Não)', category: 'Anamnese', description: 'Diabetes, gestação, queloides, herpes, coagulação', defaultRequired: true, defaultWidth: 'full' },
  { id: 'anamnese.alergias_acidos', defaultLabel: 'Detalhamento de Alergias & Uso de Ácidos', category: 'Anamnese', description: 'Uso de ácidos e cirurgias prévias', defaultWidth: 'full' },
  { id: 'anamnese.avaliacao_especifica', defaultLabel: 'Avaliação Específica por Procedimento', category: 'Anamnese', description: 'Perguntas dinâmicas para Limpeza, Injetáveis, Micropigmentação', defaultWidth: 'full' },
  { id: 'anamnese.termo_consentimento', defaultLabel: 'Termo de Consentimento & Responsabilidade', category: 'Anamnese', description: 'Texto jurídico e declaração de ciência', defaultRequired: true, defaultWidth: 'full' },
  { id: 'anamnese.assinatura_digital', defaultLabel: 'Assinatura Digital no Canvas', category: 'Anamnese', description: 'Rubrica eletrônica do cliente', defaultRequired: true, defaultWidth: 'full' },

  // 3. Agenda
  { id: 'agendamento.paciente', defaultLabel: 'Cliente / Paciente', category: 'Agenda', description: 'Seleção do cliente agendado', defaultRequired: true, defaultWidth: 'half' },
  { id: 'agendamento.profissional', defaultLabel: 'Profissional Responsável', category: 'Agenda', description: 'Especialista que realizará o procedimento', defaultRequired: true, defaultWidth: 'half' },
  { id: 'agendamento.procedimento', defaultLabel: 'Procedimento / Serviço', category: 'Agenda', description: 'Procedimento clínico selecionado', defaultRequired: true, defaultWidth: 'half' },
  { id: 'agendamento.data_hora', defaultLabel: 'Data e Horário do Atendimento', category: 'Agenda', description: 'Horário reservado na grade', defaultRequired: true, defaultWidth: 'half' },
  { id: 'agendamento.duracao', defaultLabel: 'Duração Estimada (minutos)', category: 'Agenda', description: 'Tempo de bloqueio da sala/cadeira', defaultWidth: 'half' },
  { id: 'agendamento.valor', defaultLabel: 'Valor Previsto / Estimado (R$)', category: 'Agenda', description: 'Cotação financeira do atendimento', defaultWidth: 'half' },
  { id: 'agendamento.forma_pagamento', defaultLabel: 'Forma de Pagamento Prevista', category: 'Agenda', description: 'Pix, Cartão, Dinheiro ou Boleto', defaultWidth: 'half' },
  { id: 'agendamento.status_pagamento', defaultLabel: 'Status de Pagamento Inicial', category: 'Agenda', description: 'Pago, Pendente ou Parcial', defaultWidth: 'half' },
  { id: 'agendamento.observacoes', defaultLabel: 'Observações do Agendamento', category: 'Agenda', description: 'Orientações preliminares para a recepção', defaultWidth: 'full', type: 'textarea' },

  // 4. Procedimentos
  { id: 'procedimento.nome', defaultLabel: 'Nome do Procedimento', category: 'Procedimentos', description: 'Título comercial do serviço', defaultRequired: true, defaultWidth: 'full' },
  { id: 'procedimento.categoria', defaultLabel: 'Categoria do Procedimento', category: 'Procedimentos', description: 'Facial, Corporal, Injetáveis, etc.', defaultRequired: true, defaultWidth: 'half' },
  { id: 'procedimento.duracao_minutos', defaultLabel: 'Duração Padrão (Minutos)', category: 'Procedimentos', description: 'Tempo padrão de realização', defaultWidth: 'half' },
  { id: 'procedimento.valor_tabela', defaultLabel: 'Preço de Tabela (R$)', category: 'Procedimentos', description: 'Valor padrão cobrado', defaultRequired: true, defaultWidth: 'half' },
  { id: 'procedimento.valor_promocional', defaultLabel: 'Preço Promocional / Pacote (R$)', category: 'Procedimentos', description: 'Valor especial ou com desconto', defaultWidth: 'half' },
  { id: 'procedimento.custoInsumos', defaultLabel: 'Custo Estimado de Insumos', category: 'Procedimentos', description: 'Total de materiais gastos', defaultWidth: 'half' },
  { id: 'procedimento.margem', defaultLabel: 'Margem de Lucro Estimada (%)', category: 'Procedimentos', description: 'Rentabilidade calculada', defaultWidth: 'half' },
  { id: 'procedimento.quantidade_sessoes', defaultLabel: 'Quantidade Padrão de Sessões', category: 'Procedimentos', description: 'Sessão única ou protocolo múltiplo', defaultWidth: 'third' },
  { id: 'procedimento.dias_retorno', defaultLabel: 'Dias para Retorno Pós-Procedimento', category: 'Procedimentos', description: 'Gatilho do módulo de pós-atendimento', defaultWidth: 'third' },
  { id: 'procedimento.contrato_padrao', defaultLabel: 'Termo de Consentimento Padrão', category: 'Procedimentos', description: 'Minuta contratual anexada', defaultWidth: 'full', type: 'textarea' },
  { id: 'procedimento.contraindicacoes', defaultLabel: 'Contraindicações Clínicas', category: 'Procedimentos', description: 'Situações que impedem a realização', defaultWidth: 'full', type: 'textarea' },
  { id: 'procedimento.cuidados_pos', defaultLabel: 'Orientações de Cuidados Pós', category: 'Procedimentos', description: 'Instruções para o paciente levar para casa', defaultWidth: 'full', type: 'textarea' },

  // 5. Estoque
  { id: 'insumo.nome_item', defaultLabel: 'Nome do Insumo / Material', category: 'Estoque', description: 'Descrição do item estocado', defaultRequired: true, defaultWidth: 'full' },
  { id: 'insumo.categoria', defaultLabel: 'Categoria do Insumo', category: 'Estoque', description: 'Pigmento, Agulha, Descartável, Ácido, etc.', defaultRequired: true, defaultWidth: 'half' },
  { id: 'insumo.quantidade', defaultLabel: 'Quantidade em Estoque', category: 'Estoque', description: 'Saldo físico atual', defaultRequired: true, defaultWidth: 'half' },
  { id: 'insumo.unidade_medida', defaultLabel: 'Unidade de Medida', category: 'Estoque', description: 'ml, seringa, unidade, frasco, etc.', defaultRequired: true, defaultWidth: 'half' },
  { id: 'insumo.alerta_minimo', defaultLabel: 'Ponto de Pedido / Alerta Mínimo', category: 'Estoque', description: 'Gatilho de reposição no estoque', defaultWidth: 'half' },
  { id: 'insumo.custo_unitario', defaultLabel: 'Custo Unitário de Compra (R$)', category: 'Estoque', description: 'Valor pago por unidade', defaultWidth: 'half' },
  { id: 'insumo.marca', defaultLabel: 'Marca / Fabricante', category: 'Estoque', description: 'Laboratório ou fornecedor da marca', defaultWidth: 'half' },
  { id: 'insumo.cor_tonalidade', defaultLabel: 'Cor / Tonalidade de Pigmento', category: 'Estoque', description: 'Para dermopigmentação e maquiagem definitiva', defaultWidth: 'half' },
  { id: 'insumo.lote', defaultLabel: 'Número do Lote', category: 'Estoque', description: 'Rastreabilidade e vigilância sanitária', defaultWidth: 'half' },
  { id: 'insumo.validade', defaultLabel: 'Data de Validade', category: 'Estoque', description: 'Controle de vencimento dos insumos', defaultWidth: 'half' },
  { id: 'insumo.observacoes', defaultLabel: 'Observações / Instruções de Uso', category: 'Estoque', description: 'Notas sobre conservação', defaultWidth: 'full', type: 'textarea' },

  // 6. Bens & Patrimônio
  { id: 'bem.nome', defaultLabel: 'Nome do Bem / Equipamento', category: 'Bens', description: 'Identificação patrimonial do ativo', defaultRequired: true, defaultWidth: 'full' },
  { id: 'bem.categoria', defaultLabel: 'Categoria do Ativo', category: 'Bens', description: 'Laser, Dermógrafo, Autoclave, Maca, etc.', defaultRequired: true, defaultWidth: 'half' },
  { id: 'bem.valor_compra', defaultLabel: 'Valor de Aquisição / Compra (R$)', category: 'Bens', description: 'Custo de compra do patrimônio', defaultWidth: 'half' },
  { id: 'bem.data_aquisicao', defaultLabel: 'Data de Aquisição', category: 'Bens', description: 'Data da compra ou instalação', defaultWidth: 'half' },
  { id: 'bem.estado_conservacao', defaultLabel: 'Estado de Conservação', category: 'Bens', description: 'Excelente, Bom, Regular, Em Manutenção', defaultWidth: 'half' },
  { id: 'bem.numero_serie', defaultLabel: 'Número de Série / Placa Patrimonial', category: 'Bens', description: 'Identificador único do fabricante', defaultWidth: 'half' },
  { id: 'bem.localizacao_sala', defaultLabel: 'Localização / Sala do Studio', category: 'Bens', description: 'Sala de Procedimentos, Recepção, etc.', defaultWidth: 'half' },
  { id: 'bem.responsavel_nome', defaultLabel: 'Profissional Responsável', category: 'Bens', description: 'Guardião do equipamento', defaultWidth: 'half' },
  { id: 'bem.garantia_ate', defaultLabel: 'Garantia de Fábrica até', category: 'Bens', description: 'Término da cobertura de garantia', defaultWidth: 'half' },
  { id: 'bem.manutencao_preventiva', defaultLabel: 'Periodicidade de Manutenção Preventiva (Dias)', category: 'Bens', description: 'Intervalo em dias para revisões periódicas', defaultWidth: 'half' },
  { id: 'bem.empresa_tecnica', defaultLabel: 'Empresa Técnica / Autorizada', category: 'Bens', description: 'Prestador de suporte técnico', defaultWidth: 'half' },
  { id: 'bem.observacoes', defaultLabel: 'Observações do Bem', category: 'Bens', description: 'Histórico e particularidades', defaultWidth: 'full', type: 'textarea' },

  // 7. Fornecedores
  { id: 'fornecedor.razao_social', defaultLabel: 'Razão Social / Nome da Empresa', category: 'Fornecedores', description: 'Nome jurídico ou comercial', defaultRequired: true, defaultWidth: 'full' },
  { id: 'fornecedor.nome_fantasia', defaultLabel: 'Nome Fantasia', category: 'Fornecedores', description: 'Como a marca é conhecida', defaultWidth: 'half' },
  { id: 'fornecedor.cnpj_cpf', defaultLabel: 'CNPJ / CPF', category: 'Fornecedores', description: 'Cadastro fiscal da empresa', defaultWidth: 'half' },
  { id: 'fornecedor.categoria', defaultLabel: 'Ramo / Categoria de Fornecimento', category: 'Fornecedores', description: 'Insumos, Equipamentos, Manutenção, etc.', defaultWidth: 'half' },
  { id: 'fornecedor.telefone', defaultLabel: 'Telefone / WhatsApp Comercial', category: 'Fornecedores', description: 'Canal de cotação e pedidos', defaultRequired: true, defaultWidth: 'half' },
  { id: 'fornecedor.email', defaultLabel: 'E-mail Comercial', category: 'Fornecedores', description: 'Envio de ordens de compra e notas', defaultWidth: 'half' },
  { id: 'fornecedor.contato_vendedor', defaultLabel: 'Nome do Representante / Vendedor', category: 'Fornecedores', description: 'Pessoa de contato direto', defaultWidth: 'half' },
  { id: 'fornecedor.cidade_uf', defaultLabel: 'Cidade / Estado', category: 'Fornecedores', description: 'Localização do fornecedor', defaultWidth: 'half' },
  { id: 'fornecedor.prazo_entrega', defaultLabel: 'Prazo Médio de Entrega (Dias)', category: 'Fornecedores', description: 'Lead time para planejamento de estoque', defaultWidth: 'half' },
  { id: 'fornecedor.condicoes_pagamento', defaultLabel: 'Condições de Pagamento Habituais', category: 'Fornecedores', description: 'Boleto faturado, Pix com desconto, etc.', defaultWidth: 'full' },

  // 8. Financeiro
  { id: 'financeiro.tipo', defaultLabel: 'Tipo de Lançamento (Receita / Despesa)', category: 'Financeiro', description: 'Direção do fluxo financeiro', defaultRequired: true, defaultWidth: 'half' },
  { id: 'financeiro.categoria', defaultLabel: 'Categoria Financeira', category: 'Financeiro', description: 'Atendimento, Insumos, Aluguel, Comissão, etc.', defaultRequired: true, defaultWidth: 'half' },
  { id: 'financeiro.valor', defaultLabel: 'Valor do Lançamento (R$)', category: 'Financeiro', description: 'Montante monetário', defaultRequired: true, defaultWidth: 'half' },
  { id: 'financeiro.data', defaultLabel: 'Data de Competência / Movimento', category: 'Financeiro', description: 'Data do pagamento ou recebimento', defaultRequired: true, defaultWidth: 'half' },
  { id: 'financeiro.forma_pagamento', defaultLabel: 'Forma de Pagamento', category: 'Financeiro', description: 'Pix, Cartão de Crédito, Débito, Dinheiro', defaultRequired: true, defaultWidth: 'half' },
  { id: 'financeiro.status_pagamento', defaultLabel: 'Status da Transação', category: 'Financeiro', description: 'Pago, Pendente, Parcial', defaultRequired: true, defaultWidth: 'half' },
  { id: 'financeiro.paciente_cliente', defaultLabel: 'Cliente / Paciente Vinculado', category: 'Financeiro', description: 'Origem da receita de atendimento', defaultWidth: 'half' },
  { id: 'financeiro.profissional', defaultLabel: 'Profissional Vinculado', category: 'Financeiro', description: 'Base para cálculo de comissões', defaultWidth: 'half' },
  { id: 'financeiro.observacao', defaultLabel: 'Observações e Descrição Detalhada', category: 'Financeiro', description: 'Histórico da movimentação contábil', defaultWidth: 'full', type: 'textarea' },
];
