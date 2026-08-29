import { 
  Paciente, 
  Agendamento, 
  EstoqueInsumo, 
  TransacaoFinanceira, 
  UsuarioEquipe, 
  ProcedimentoClinico, 
  SolicitacaoOrcamento, 
  AvisoQuadro,
  BemAtivo,
  BemPatrimonial,
  DespesaRecorrente,
  ModeloAnamnese,
  FichaRetornoEvolucao,
  ClinicaConfig,
  AlertaRetornoPos,
  Fornecedor
} from '../types';

export const MOCK_CLINICA_CONFIG: ClinicaConfig = {
  id: 'config-matriz',
  nome: 'AuraEstética - Clínica & Studio',
  logomarca_url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&auto=format&fit=crop&q=80',
  telefone: '(11) 98111-2233',
  endereco: 'Av. Paulista, 1500 - Conjunto 802, Bela Vista - São Paulo / SP',
  cnpj: '38.941.205/0001-94',
  email_contato: 'contato@auraestetica.com.br',
  slogan: 'Alta Tecnologia e Excelência em Procedimentos Estéticos e Beleza',
  tema_cor_primaria: '#4f46e5'
};

export const MOCK_USUARIOS: UsuarioEquipe[] = [
  {
    id: 'user-super-admin',
    nome: 'Fabio Lima',
    nomeCompleto: 'Fabio Lima',
    email: 'fldslima94@gmail.com',
    senha: 'admin123',
    cargo: 'Super Admin (Master)',
    profissao: 'Proprietário & Administrador Geral',
    role: 'admin_total',
    telefone: '(11) 99999-8877',
    status: 'ativo',
    ultimo_acesso: 'Online agora',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    registro_profissional: 'ADM/SP 99.112',
    especialidade: 'Governança & Gestão de Clínicas',
    porcentagem_comissao: 100,
    permissoes: {
      ver_financeiro_completo: true,
      emitir_recibo: true,
      editar_prontuario_clinico: true,
      gerenciar_estoque_custos: true,
      configuracoes_sistema: true,
      visualizar_bens_ativos: true,
    },
    permissoesCustomizadas: {
      financeiro: { verEntradas: true, verSaidas: true, verRecorrentes: true, excluir: true, verRelatorios: true },
      clientes: { criar: true, editar: true, excluir: true, verHistorico: true, preencherAnamnese: true },
      agenda: { verTodos: true, verPropria: true, criar: true, cancelar: true, finalizar: true },
      procedimentos: { verCustos: true, verMargem: true, criar: true, excluir: true, ajustarEstoque: true },
      bens: { visualizar: true, cadastrar: true, editar: true, gerenciar: true, excluir: true, manutencao: true },
      estoque: { ajustar: true, excluir: true },
      orcamentos: { verTodos: true, responder: true, verEmails: true }
    }
  },
  {
    id: 'user-super-admin-alt',
    nome: 'Fabio Lima (Master)',
    nomeCompleto: 'Fabio Lima (Master)',
    email: 'fabio@teste.com',
    senha: 'admin123',
    cargo: 'Super Admin (Master)',
    profissao: 'Proprietário & Administrador Geral',
    role: 'admin_total',
    telefone: '(11) 99999-8877',
    status: 'ativo',
    ultimo_acesso: 'Online agora',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    registro_profissional: 'ADM/SP 99.112',
    especialidade: 'Governança & Gestão de Clínicas',
    porcentagem_comissao: 100,
    permissoes: {
      ver_financeiro_completo: true,
      emitir_recibo: true,
      editar_prontuario_clinico: true,
      gerenciar_estoque_custos: true,
      configuracoes_sistema: true,
      visualizar_bens_ativos: true,
    },
    permissoesCustomizadas: {
      financeiro: { verEntradas: true, verSaidas: true, verRecorrentes: true, excluir: true, verRelatorios: true },
      clientes: { criar: true, editar: true, excluir: true, verHistorico: true, preencherAnamnese: true },
      agenda: { verTodos: true, verPropria: true, criar: true, cancelar: true, finalizar: true },
      procedimentos: { verCustos: true, verMargem: true, criar: true, excluir: true, ajustarEstoque: true },
      bens: { visualizar: true, cadastrar: true, editar: true, gerenciar: true, excluir: true, manutencao: true },
      estoque: { ajustar: true, excluir: true },
      orcamentos: { verTodos: true, responder: true, verEmails: true }
    }
  }
];

export const MOCK_AVISOS: AvisoQuadro[] = [
  {
    id: 'aviso-01',
    titulo: 'Manutenção Técnica Preventiva no Laser Lavieen',
    mensagem: 'O equipamento de Laser Lavieen passará por calibração óptica obrigatória e higienização geral amanhã, das 08h00 às 10h30.',
    prioridade: 'urgente',
    autor_nome: 'Dra. Camila Vasconcelos',
    autor_role: 'gestor',
    data_criacao: new Date().toISOString(),
    destinatarios: 'todos',
    ativo: true,
    exibir_popup: true,
    lido_por: [],
  },
  {
    id: 'aviso-02',
    titulo: 'Novo Lote de Pigmentos para Micropigmentação',
    mensagem: 'Chegaram os pigmentos orgânicos da marca Iron Works e Mag Color (tons Castanho Médio e Velvet Red). Já cadastrados e disponíveis no estoque.',
    prioridade: 'informativo',
    autor_nome: 'Renata Meireles',
    autor_role: 'profissional',
    data_criacao: new Date(Date.now() - 3600000 * 24).toISOString(),
    destinatarios: 'todos',
    ativo: true,
    exibir_popup: false,
    lido_por: ['user-01'],
  },
];

const now = new Date();
const addDays = (d: number) => new Date(now.getTime() + d * 86400000).toISOString().slice(0, 10);
const subDays = (d: number) => new Date(now.getTime() - d * 86400000).toISOString().slice(0, 10);

export const MOCK_BENS: BemAtivo[] = [
  {
    id: 'bem-01',
    nome: 'Laser Lavieen Thulium 1927nm',
    categoria: 'laser',
    data_aquisicao: '2024-03-15',
    valor_compra: 185000,
    estado_conservacao: 'excelente',
    numero_serie: 'LV-2024-SP892',
    localizacao_sala: 'Sala 01 - Procedimentos Avançados',
    responsavel_nome: 'Dra. Camila Vasconcelos',
    garantia_ate: '2027-03-15',
    nota_fiscal_nome: 'NF-e 004.918 - MedLaser Brasil',
    observacoes: 'Revisão óptica em dia. Inclui ponteira fracionada e não-fracionada.',
    requerManutencao: true,
    periodicidadeDias: 90,
    dataUltimaManutencao: subDays(82),
    dataProximaManutencao: addDays(8), // Alerta amarelo (próximos 7 a 15 dias)
    empresaTecnica: 'MedLaser Engenharia Clínica (11) 98765-0011',
    statusManutencao: 'alerta_proximo',
    historicoManutencoes: [
      {
        id: 'hist-01',
        dataRealizacao: subDays(82),
        tipo: 'calibracao',
        descricao: 'Calibração de potência óptica dos diodos e limpeza das lentes de safira',
        custo: 1200,
        tecnicoEmpresa: 'Eng. Roberto Alves (MedLaser)',
        registradoPor: 'Fabio Lima',
        laudoNome: 'Laudo_Calibracao_Lavieen_2024.pdf'
      }
    ],
    criado_em: '2024-03-15T10:00:00Z',
  },
  {
    id: 'bem-02',
    nome: 'Dermógrafo Cheyenne Hawk Pen Silver',
    categoria: 'dermografo',
    data_aquisicao: '2024-06-20',
    valor_compra: 6800,
    estado_conservacao: 'regular',
    numero_serie: 'CH-9941-GER',
    localizacao_sala: 'Sala 03 - Micropigmentação & Estética',
    responsavel_nome: 'Renata Meireles',
    garantia_ate: '2026-06-20',
    nota_fiscal_nome: 'NF-e 012.339 - Cheyenne Distribuidora',
    observacoes: 'Acompanha pedal wireless e 2 baterias recarregáveis de lítio.',
    requerManutencao: true,
    periodicidadeDias: 60,
    dataUltimaManutencao: subDays(65),
    dataProximaManutencao: subDays(5), // Alerta vermelho (Vencido)
    empresaTecnica: 'Cheyenne Service Brasil (11) 97111-2299',
    statusManutencao: 'vencida',
    historicoManutencoes: [
      {
        id: 'hist-02',
        dataRealizacao: subDays(65),
        tipo: 'preventiva',
        descricao: 'Troca de anéis de vedação internos e lubrificação do motor suíço',
        custo: 350,
        tecnicoEmpresa: 'Téc. Lucas Silva (Cheyenne)',
        registradoPor: 'Renata Meireles',
        laudoNome: 'Certificado_Revisao_Cheyenne.pdf'
      }
    ],
    criado_em: '2024-06-20T14:00:00Z',
  },
  {
    id: 'bem-03',
    nome: 'Maca Hidráulica Estética 3 Motores Reclinável',
    categoria: 'maca_mobiliario',
    data_aquisicao: '2024-01-10',
    valor_compra: 9400,
    estado_conservacao: 'manutencao',
    numero_serie: 'MC-2024-01',
    localizacao_sala: 'Sala 01 - Procedimentos Avançados',
    responsavel_nome: 'Dra. Camila Vasconcelos',
    garantia_ate: '2026-01-10',
    nota_fiscal_nome: 'NF-e 089.120 - Estética Prime Móveis',
    observacoes: 'Revestimento em courvin hospitalar anti-mofo e aquecimento lombar integrado.',
    requerManutencao: true,
    periodicidadeDias: 180,
    dataUltimaManutencao: subDays(190),
    dataProximaManutencao: subDays(10),
    empresaTecnica: 'MacaTech Hospitalar (11) 96444-5511',
    statusManutencao: 'em_manutencao', // Tag azul
    historicoManutencoes: [
      {
        id: 'hist-03',
        dataRealizacao: subDays(190),
        tipo: 'corretiva',
        descricao: 'Substituição do atuador linear do pistão do encosto lombar',
        custo: 480,
        tecnicoEmpresa: 'MacaTech Hospitalar',
        registradoPor: 'Fabio Lima',
        laudoNome: 'OS_MacaTech_891.pdf'
      }
    ],
    criado_em: '2024-01-10T09:00:00Z',
  },
  {
    id: 'bem-04',
    nome: 'Autoclave Cristófoli 12L Inox Hospitalar',
    categoria: 'autoclave',
    data_aquisicao: '2023-11-05',
    valor_compra: 5200,
    estado_conservacao: 'excelente',
    numero_serie: 'CR-12L-99812',
    localizacao_sala: 'Sala de Esterilização & Descarte',
    responsavel_nome: 'Larissa Souza',
    garantia_ate: '2025-11-05',
    nota_fiscal_nome: 'NF-e 033.411 - Dental & Hospitalar SP',
    observacoes: 'Testes biológicos mensais registrados no caderno de controle da vigilância sanitária.',
    requerManutencao: true,
    periodicidadeDias: 30,
    dataUltimaManutencao: subDays(5),
    dataProximaManutencao: addDays(25), // Em dia (verde)
    empresaTecnica: 'Cristófoli Biossegurança Autorizada (11) 98222-3344',
    statusManutencao: 'em_dia',
    historicoManutencoes: [
      {
        id: 'hist-04',
        dataRealizacao: subDays(5),
        tipo: 'preventiva',
        descricao: 'Teste biológico com indicador 3M e substituição da borracha de vedação da porta',
        custo: 220,
        tecnicoEmpresa: 'Cristófoli Biossegurança',
        registradoPor: 'Larissa Souza',
        laudoNome: 'Laudo_Teste_Biologico_3M.pdf'
      }
    ],
    criado_em: '2023-11-05T11:00:00Z',
  },
];

export const MOCK_BENS_PATRIMONIAIS = MOCK_BENS;

export const MOCK_DESPESAS_RECORRENTES: DespesaRecorrente[] = [
  {
    id: 'desp-rec-01',
    descricao: 'Aluguel do Conjunto Comercial (Conjunto 802)',
    categoria: 'aluguel',
    valor: 4800,
    dia_vencimento: 10,
    recorrencia: 'mensal',
    status: 'ativo',
    forma_pagamento_preferencial: 'boleto',
    observacoes: 'Contrato imobiliário com reajuste anual via IPCA.',
    criado_em: '2024-01-01T00:00:00Z',
  },
  {
    id: 'desp-rec-02',
    descricao: 'Energia Elétrica (Enel SP)',
    categoria: 'energia',
    valor: 850,
    dia_vencimento: 15,
    recorrencia: 'mensal',
    status: 'ativo',
    forma_pagamento_preferencial: 'pix',
    observacoes: 'Consumo mais elevado devido ao resfriamento de lasers e ar-condicionado.',
    criado_em: '2024-01-01T00:00:00Z',
  },
  {
    id: 'desp-rec-03',
    descricao: 'Internet Fibra Dedicada 600MB + Telefonia',
    categoria: 'internet',
    valor: 249.90,
    dia_vencimento: 20,
    recorrencia: 'mensal',
    status: 'ativo',
    forma_pagamento_preferencial: 'cartao_credito',
    criado_em: '2024-01-01T00:00:00Z',
  },
  {
    id: 'desp-rec-04',
    descricao: 'Assessoria Contábil & Jurídica em Saúde',
    categoria: 'contabilidade',
    valor: 1200,
    dia_vencimento: 5,
    recorrencia: 'mensal',
    status: 'ativo',
    forma_pagamento_preferencial: 'pix',
    criado_em: '2024-01-01T00:00:00Z',
  },
];

export const MOCK_MODELOS_ANAMNESE: ModeloAnamnese[] = [
  {
    id: 'mod-anam-01',
    titulo: 'Anamnese Geral & Injetáveis (Toxina e Preenchedores)',
    especialidade: 'Harmonização Facial e Dermatologia',
    profissional_nome: 'Dra. Camila Vasconcelos',
    criado_em: '2024-01-15T10:00:00Z',
    ativo: true,
    perguntas: [
      { id: 'q1', pergunta: 'Possui histórico de alergia a anestésicos (lidocaína/procaína) ou esparadrapo?', tipo: 'sim_nao', obrigatorio: true },
      { id: 'q2', pergunta: 'Está gestante ou em período de amamentação?', tipo: 'sim_nao', obrigatorio: true },
      { id: 'q3', pergunta: 'Faz uso contínuo de anticoagulantes, aspirina ou anti-inflamatórios?', tipo: 'sim_nao', obrigatorio: true },
      { id: 'q4', pergunta: 'Histórico de herpes labial ou infecções no local da aplicação?', tipo: 'sim_nao', obrigatorio: true },
      { id: 'q5', pergunta: 'Descreva os procedimentos estéticos que já realizou no rosto anteriormente:', tipo: 'texto', obrigatorio: false },
    ]
  },
  {
    id: 'mod-anam-02',
    titulo: 'Anamnese para Micropigmentação (Labial & Sobrancelhas)',
    especialidade: 'Micropigmentação e Estética Facial',
    profissional_nome: 'Renata Meireles',
    criado_em: '2024-02-01T14:00:00Z',
    ativo: true,
    perguntas: [
      { id: 'mq1', pergunta: 'Tem tendência a formação de queloide ou cicatrização hipertrófica?', tipo: 'sim_nao', obrigatorio: true },
      { id: 'mq2', pergunta: 'Possui histórico de diabetes descompensada ou hemofilia?', tipo: 'sim_nao', obrigatorio: true },
      { id: 'mq3', pergunta: 'Já realizou micropigmentação anterior na mesma região?', tipo: 'sim_nao', obrigatorio: true },
      { id: 'mq4', pergunta: 'Qual tonalidade/estilo prefere (Efeito Batom / Efeito Aquarela / Natural)?', tipo: 'texto', obrigatorio: true },
    ]
  }
];

export const MOCK_PACIENTES: Paciente[] = [
  {
    id: 'b1a2c3d4-0001-4000-8000-000000000001',
    nome: 'Carolina Mendes',
    telefone: '(11) 98765-4321',
    data_nascimento: '1988-04-15',
    cpf: '321.456.789-00',
    alergias: 'Lidocaína tópica (apenas eritema leve). Nega alergia a esparadrapo.',
    medicacoes: 'Vitamina C oral, Anticoncepcional oral.',
    queixa_principal: 'Linhas na testa e rugas periorbiculares (pés de galinha). Deseja arqueamento suave.',
    fototipo: 'III (Morena clara, bronzeia gradualmente)',
    historico_clinico: 'Histórico de alergia a lidocaína tópica. Já realizou preenchimento malar e toxina em 2024 sem intercorrências.',
    criado_em: '2025-01-10T10:00:00Z',
    email: 'carolina.mendes@email.com',
    habilitar_login_portal: true,
    fotos_antes_depois: [
      {
        id: 'foto-01',
        titulo: 'Toxina Botulínica Terço Superior',
        data: '2025-01-25',
        procedimento: 'Toxina Botulínica (3 Áreas)',
        foto_antes: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80',
        foto_depois: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
        observacoes: 'Resultado de 15 dias após aplicação de 50U. Excelente relaxamento da musculatura frontal.',
      }
    ],
    evolucoes_retornos: [
      {
        id: 'ret-01',
        paciente_id: 'b1a2c3d4-0001-4000-8000-000000000001',
        paciente_nome: 'Carolina Mendes',
        data: '2025-01-25',
        profissional_id: 'user-01',
        profissional_nome: 'Dra. Camila Vasconcelos',
        procedimento_nome: 'Retorno e Avaliação de Toxina Botulínica',
        numero_sessao: 1,
        relato_paciente: 'Paciente muito satisfeita com o resultado. Nenhuma queixa de assimetria ou dor de cabeça.',
        evolucao_clinica: 'Simetria facial preservada. Mímica natural mantida no terço médio e superior.',
        parametros_tecnicos: 'Toxina Botulínica Dysport 50U reconstituída em 1.5ml SF 0.9%.',
        criado_em: '2025-01-25T14:30:00Z'
      }
    ]
  },
  {
    id: 'b1a2c3d4-0002-4000-8000-000000000002',
    nome: 'Mariana Duarte Alencar',
    telefone: '(11) 97111-2233',
    data_nascimento: '1992-08-22',
    cpf: '456.789.123-11',
    alergias: 'Nenhuma alergia relatada.',
    medicacoes: 'Nenhuma.',
    queixa_principal: 'Lábios pálidos e sem contorno definido. Deseja cor saudável e hidratação.',
    fototipo: 'II (Pele clara)',
    historico_clinico: 'Primeira micropigmentação labial. Lábios hidratados previamente com Bepantol.',
    criado_em: '2025-01-15T11:00:00Z',
    email: 'mariana.duarte@email.com',
    habilitar_login_portal: true,
    fotos_antes_depois: [
      {
        id: 'foto-02',
        titulo: 'Micropigmentação Labial Efeito Velvet',
        data: '2025-02-10',
        procedimento: 'Micropigmentação Labial',
        procedimento_nome: 'Micropigmentação Labial',
        foto_antes: 'https://images.unsplash.com/photo-1512290900672-1f02a0a026e6?w=600&auto=format&fit=crop&q=80',
        foto_depois: 'https://images.unsplash.com/photo-1588510970672-f2f94e022b7b?w=600&auto=format&fit=crop&q=80',
        foto_antes_url: 'https://images.unsplash.com/photo-1512290900672-1f02a0a026e6?w=600&auto=format&fit=crop&q=80',
        foto_depois_url: 'https://images.unsplash.com/photo-1588510970672-f2f94e022b7b?w=600&auto=format&fit=crop&q=80',
        observacoes: 'Revitalização labial com pigmento Coral Rose. Cicatrização uniforme e definição do arco do cupido.',
      }
    ],
  }
];

export const MOCK_PROCEDIMENTOS: ProcedimentoClinico[] = [
  {
    id: 'proc-01',
    nome: 'Toxina Botulínica (3 Áreas)',
    categoria: 'Injetáveis & Harmonização',
    duracao_minutos: 45,
    valor_tabela: 1450,
    quantidade_sessoes: 1,
    profissional_id: 'user-01',
    profissional_nome: 'Dra. Camila Vasconcelos',
    descricao: 'Aplicação de toxina botulínica de alta precisão para linhas de expressão na testa, glabela e pés de galinha com durabilidade de 4 a 6 meses.',
    areas_aplicacao: ['Testa / Frontal', 'Glabela (Entre as sobrancelhas)', 'Pés de galinha (Periorbicular)'],
    indicacoes: ['Rugas dinâmicas', 'Prevenção de linhas estáticas', 'Elevação sutil da cauda da sobrancelha'],
    custo_estimado_insumos: 380,
    margem_lucro_estimada: 1070,
    contrato_padrao: `TERMO DE ESCLARECIMENTO E CONSENTIMENTO LIVRE E ESCLARECIDO
PROCEDIMENTO: APLICAÇÃO DE TOXINA BOTULÍNICA

Eu, paciente devidamente identificado, declaro que fui esclarecido(a) pela equipe clínica sobre a natureza e objetivos do procedimento de toxina botulínica.
Estou ciente de que:
1. O resultado não é imediato, iniciando entre 48h a 72h e estabilizando em 15 dias.
2. É necessário comparecer ao retorno clínico entre 15 e 21 dias para avaliação.
3. Devo evitar deitar nas 4 horas seguintes e não praticar exercícios físicos intensos nas primeiras 24 horas.`,
    exige_contrato: true,
    ativo: true,
    destaque_portal: true,
    imagem_url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600&auto=format&fit=crop&q=80',
    criado_em: '2025-01-01T00:00:00Z',
  },
  {
    id: 'proc-02',
    nome: 'Micropigmentação Labial (Efeito Aquarela)',
    categoria: 'Micropigmentação & Sobrancelhas',
    duracao_minutos: 90,
    valor_tabela: 950,
    quantidade_sessoes: 2, // 1 aplicação + 1 retoque em 30 dias
    profissional_id: 'user-03',
    profissional_nome: 'Renata Meireles',
    descricao: 'Técnica exclusiva de revitalização e cor labial com efeito translúcido e natural, definindo bordas e uniformizando tons arroxeados ou pálidos.',
    areas_aplicacao: ['Lábio Superior', 'Lábio Inferior'],
    indicacoes: ['Lábios desvitalizados', 'Perda de contorno labial', 'Correção de assimetria sutil'],
    custo_estimado_insumos: 120,
    margem_lucro_estimada: 830,
    contrato_padrao: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS ESTÉTICOS - MICROPIGMENTAÇÃO LABIAL

1. O procedimento inclui 1 sessão principal e 1 retorno/revisão em 30 a 45 dias.
2. A cor clareará cerca de 40% a 50% após o período de descamação nos primeiros 7 dias.
3. Não puxar as casquinhas e manter hidratação constante com pomada cicatrizante indicada.`,
    exige_contrato: true,
    ativo: true,
    destaque_portal: true,
    imagem_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80',
    criado_em: '2025-01-01T00:00:00Z',
  },
  {
    id: 'proc-03',
    nome: 'Laser Lavieen (BB Glow Effect)',
    categoria: 'Tecnologias & Lasers',
    duracao_minutos: 60,
    valor_tabela: 850,
    quantidade_sessoes: 3,
    profissional_id: 'user-01',
    profissional_nome: 'Dra. Camila Vasconcelos',
    descricao: 'Laser de Thulium subablativo que trata manchas solares, melasma, poros dilatados e melhora o viço com tempo de recuperação mínimo.',
    areas_aplicacao: ['Face Completa', 'Pescoço', 'Colo'],
    indicacoes: ['Poros dilatados', 'Melasma e manchas de sol', 'Textura irregular e falta de luminosidade'],
    custo_estimado_insumos: 95,
    margem_lucro_estimada: 755,
    contrato_padrao: `TERMO DE CONSENTIMENTO PARA PROCEDIMENTOS COM LASER LAVIEEN

Declaro que fui informado(a) sobre a necessidade de uso rigoroso de protetor solar FPS 50+ de 3 em 3 horas e abstenção solar por no mínimo 14 dias após o procedimento.`,
    exige_contrato: true,
    ativo: true,
    destaque_portal: true,
    imagem_url: 'https://images.unsplash.com/photo-1512290900672-1f02e6005b4b?w=600&auto=format&fit=crop&q=80',
    criado_em: '2025-01-01T00:00:00Z',
  }
];

export const MOCK_ESTOQUE: EstoqueInsumo[] = [
  {
    id: 'ins-01',
    nome_item: 'Pigmento Labial Velvet Red (15ml)',
    categoria: 'pigmento',
    quantidade: 8,
    unidade_medida: 'frasco',
    alerta_minimo: 3,
    marca: 'Mag Color Gold',
    cor_tonalidade: 'Velvet Red / Vermelho Carmim Suave',
    lote: 'L-2025/089',
    validade: '2027-10-30',
    custo_unitario: 145,
    observacoes: 'Pigmento orgânico biocompatível de alta fixação para micropigmentação labial.',
  },
  {
    id: 'ins-02',
    nome_item: 'Pigmento Sobrancelhas Castanho Médio (15ml)',
    categoria: 'pigmento',
    quantidade: 6,
    unidade_medida: 'frasco',
    alerta_minimo: 2,
    marca: 'Iron Works',
    cor_tonalidade: 'Castanho Médio Aquecido',
    lote: 'IW-7741',
    validade: '2027-12-15',
    custo_unitario: 130,
    observacoes: 'Ideal para fototipos II a IV, sem risco de viragem para azul ou cinza.',
  },
  {
    id: 'ins-03',
    nome_item: 'Toxina Botulínica 100U (Frasco-ampola)',
    categoria: 'acido_injetavel',
    quantidade: 12,
    unidade_medida: 'frasco',
    alerta_minimo: 4,
    marca: 'Dysport / Galderma',
    lote: 'DY-88190',
    validade: '2026-11-20',
    custo_unitario: 420,
    observacoes: 'Armazenar obrigatoriamente sob refrigeração de 2°C a 8°C.',
  },
  {
    id: 'ins-04',
    nome_item: 'Agulha 1R 0.25mm para Dermógrafo (Cartucho)',
    categoria: 'agulha_lamina',
    quantidade: 45,
    unidade_medida: 'unidade',
    alerta_minimo: 15,
    marca: 'Cheyenne Safety Cartridge',
    lote: 'CH-3381',
    validade: '2028-05-10',
    custo_unitario: 18,
    observacoes: 'Membrana de segurança patenteada anti-refluxo.',
  },
  {
    id: 'ins-05',
    nome_item: 'Luvas Nitrílicas Rosa Sem Pó (Caixa c/ 100un)',
    categoria: 'descartavel',
    quantidade: 14,
    unidade_medida: 'unidade',
    alerta_minimo: 5,
    marca: 'Supermax Pink',
    custo_unitario: 38,
  }
];

// Today's date ISO helper
const getTodayAt = (hours: number, minutes: number = 0) => {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
};

export const MOCK_AGENDAMENTOS: Agendamento[] = [
  {
    id: 'ag-01',
    paciente_id: 'b1a2c3d4-0001-4000-8000-000000000001',
    profissional_id: 'user-01',
    profissional_nome: 'Dra. Camila Vasconcelos',
    profissional_cargo: 'Médica Dermatologista',
    data_hora: getTodayAt(9, 0),
    procedimento: 'Toxina Botulínica (3 Áreas)',
    status: 'em_espera',
    criado_em: '2025-01-20T10:00:00Z',
    duracao_minutos: 45,
    valor_estimado: 1450,
    forma_pagamento: 'pix',
    status_pagamento: 'pendente',
    numero_sessao: 1,
    total_sessoes_pacote: 1,
    contrato_assinado: true,
  },
  {
    id: 'ag-02',
    paciente_id: 'b1a2c3d4-0002-4000-8000-000000000002',
    profissional_id: 'user-03',
    profissional_nome: 'Renata Meireles',
    profissional_cargo: 'Especialista Micropigmentação',
    data_hora: getTodayAt(11, 30),
    procedimento: 'Micropigmentação Labial (Efeito Aquarela)',
    status: 'confirmado',
    criado_em: '2025-01-22T14:00:00Z',
    duracao_minutos: 90,
    valor_estimado: 950,
    forma_pagamento: 'cartao_credito',
    status_pagamento: 'pendente',
    numero_sessao: 1,
    total_sessoes_pacote: 2,
    contrato_assinado: true,
  },
  {
    id: 'ag-03',
    paciente_id: 'b1a2c3d4-0001-4000-8000-000000000001',
    profissional_id: 'user-01',
    profissional_nome: 'Dra. Camila Vasconcelos',
    profissional_cargo: 'Médica Dermatologista',
    data_hora: getTodayAt(15, 0),
    procedimento: 'Laser Lavieen (BB Glow Effect)',
    status: 'confirmado',
    criado_em: '2025-01-23T09:00:00Z',
    duracao_minutos: 60,
    valor_estimado: 850,
    forma_pagamento: 'pix',
    status_pagamento: 'pendente',
    numero_sessao: 1,
    total_sessoes_pacote: 3,
  }
];

export const MOCK_TRANSACOES: TransacaoFinanceira[] = [
  {
    id: 'tx-01',
    paciente_id: 'b1a2c3d4-0001-4000-8000-000000000001',
    paciente_nome: 'Carolina Mendes',
    profissional_id: 'user-01',
    profissional_nome: 'Dra. Camila Vasconcelos',
    procedimento: 'Toxina Botulínica (3 Áreas)',
    valor: 1450,
    custo_insumos: 380,
    forma_pagamento: 'pix',
    status: 'pago',
    data: new Date(Date.now() - 3600000 * 24).toISOString(),
    tipo: 'entrada',
    categoria: 'atendimento',
    observacao: 'Pagamento à vista com 5% de desconto Pix aplicado.',
  },
  {
    id: 'tx-02',
    paciente_id: 'b1a2c3d4-0002-4000-8000-000000000002',
    paciente_nome: 'Mariana Duarte Alencar',
    profissional_id: 'user-03',
    profissional_nome: 'Renata Meireles',
    procedimento: 'Micropigmentação Labial',
    valor: 950,
    custo_insumos: 120,
    forma_pagamento: 'cartao_credito',
    status: 'pago',
    data: new Date(Date.now() - 3600000 * 48).toISOString(),
    tipo: 'entrada',
    categoria: 'atendimento',
    observacao: 'Parcelado em 3x no cartão de crédito.',
  },
  {
    id: 'tx-03',
    paciente_nome: 'Mag Color & Iron Works Cosméticos',
    procedimento: 'Reposição de Pigmentos & Cartuchos',
    valor: 860,
    forma_pagamento: 'pix',
    status: 'pago',
    data: new Date(Date.now() - 3600000 * 72).toISOString(),
    tipo: 'saida',
    categoria: 'compra_insumos',
    observacao: 'Compra de 6 frascos de pigmentos orgânicos e 20 agulhas cartucho.',
  },
  {
    id: 'tx-04',
    paciente_nome: 'Renata Meireles (Profissional)',
    procedimento: 'Repasse de Comissões Quinzenais',
    valor: 1250,
    forma_pagamento: 'transferencia',
    status: 'pago',
    data: new Date(Date.now() - 3600000 * 96).toISOString(),
    tipo: 'saida',
    categoria: 'comissao',
    observacao: 'Comissão de 45% sobre procedimentos de micropigmentação executados.',
  }
];

export const MOCK_ORCAMENTOS: SolicitacaoOrcamento[] = [
  {
    id: 'orc-01',
    paciente_nome: 'Fernanda Lima',
    paciente_email: 'paciente.fernanda@exemplo.com',
    paciente_telefone: '(11) 98765-4321',
    conta_google_vinculada: true,
    profissional_id: 'user-01',
    profissional_nome: 'Dra. Camila Vasconcelos',
    procedimentos_selecionados: [
      {
        procedimento_id: 'proc-01',
        nome: 'Toxina Botulínica (3 Áreas)',
        categoria: 'Injetáveis & Harmonização',
        valor_unitario: 1450
      },
      {
        procedimento_id: 'proc-03',
        nome: 'Laser Lavieen (BB Glow Effect)',
        categoria: 'Tecnologias & Lasers',
        valor_unitario: 850
      }
    ],
    valor_total_estimado: 2300,
    queixa_principal: 'Linhas na testa e queixa de poros e manchas pós-verão.',
    periodo_preferencia: 'sabado',
    status: 'em_analise',
    data_solicitacao: new Date(Date.now() - 3600000 * 5).toISOString(),
    resposta_clinica: 'Olá Fernanda! Analisamos sua solicitação. Podemos combinar a toxina com a sessão de Lavieen no mesmo dia com condição especial.',
  }
];

export const MODELO_TERMO_CONSENTIMENTO = `TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO (TCLE) & CONTRATO DE PRESTAÇÃO DE SERVIÇOS ESTÉTICOS

1. DECLARAÇÃO DE CIÊNCIA E AUTORIZAÇÃO:
Eu, devidamente identificado(a) nesta ficha clínica, autorizo a realização do procedimento estético acordado com a equipe profissional devidamente habilitada. Declaro ter recebido todas as informações claras sobre a técnica, produtos aplicados, finalidades, riscos inerentes e cuidados pós-procedimento.

2. VERACIDADE DAS INFORMAÇÕES DE SAÚDE:
Declaro sob as penas da lei que todas as respostas fornecidas na Ficha de Anamnese (alergias, medicações em uso, histórico cirúrgico, gestação e patologias prévias) são a mais pura expressão da verdade, isentando a clínica de responsabilidade decorrente de omissão ou falsidade de informações de saúde.

3. USO DE IMAGEM & REGISTRO FOTOGRÁFICO:
Autorizo o registro fotográfico antes e depois estritamente para acompanhamento da evolução clínica e prontuário sigiloso.

4. ASSINATURA DIGITAL:
A aposição de assinatura digital no presente documento confirma a plena aceitação de todos os termos acima.`;

export const RECEITA_INSUMOS_PADRAO: Record<string, { nome_item: string; quantidade: number; unidade_medida: string }[]> = {
  'Toxina Botulínica (3 Áreas)': [
    { nome_item: 'Toxina Botulínica 100U (Botox / Dysport)', quantidade: 50, unidade_medida: 'UI' },
    { nome_item: 'Seringa de Insulina 0.5ml com Agulha 30G', quantidade: 2, unidade_medida: 'unidades' },
    { nome_item: 'Anestésico Tópico Dermomax 4% (Bisnaga)', quantidade: 0.1, unidade_medida: 'bisnagas' },
  ],
  'Preenchimento Labial com Ácido Hialurônico': [
    { nome_item: 'Ácido Hialurônico Reticulado 1ml (Juvederm/Restylane)', quantidade: 1, unidade_medida: 'seringas' },
    { nome_item: 'Microcânula 22G 50mm Descartável', quantidade: 1, unidade_medida: 'unidades' },
    { nome_item: 'Anestésico Tópico Dermomax 4% (Bisnaga)', quantidade: 0.2, unidade_medida: 'bisnagas' },
  ],
  'Micropigmentação Labial (Aquarelle Lips)': [
    { nome_item: 'Pigmento Orgânico Mag Color Velvet Red (15ml)', quantidade: 0.1, unidade_medida: 'frascos' },
    { nome_item: 'Agulha Cartucho 1R 0.25mm para Dermógrafo', quantidade: 1, unidade_medida: 'unidades' },
    { nome_item: 'Anestésico Tópico Dermomax 4% (Bisnaga)', quantidade: 0.15, unidade_medida: 'bisnagas' },
  ],
  'Laser Lavieen (BB Glow Effect)': [
    { nome_item: 'Protetor Ocular para Laser / IPL', quantidade: 1, unidade_medida: 'unidades' },
    { nome_item: 'Máscara Facial Calmante Hidratante Pós-Laser', quantidade: 1, unidade_medida: 'unidades' },
  ],
};

export const MOCK_ALERTAS_RETORNO: AlertaRetornoPos[] = [
  {
    id: 'alerta-01',
    paciente_id: 'b1a2c3d4-0001-4000-8000-000000000001',
    paciente_nome: 'Carolina Mendes',
    telefone: '(11) 98765-4321',
    procedimento_origem: 'Toxina Botulínica (3 Áreas)',
    data_procedimento: '2025-01-10',
    dias_apos: 15,
    data_ideal_retorno: '2025-01-25',
    motivo: 'Revisão clínica e avaliação de retoque gratuito de Botox (15 dias)',
    status: 'agendado',
  }
];

export const MOCK_FORNECEDORES: Fornecedor[] = [
  {
    id: 'forn-01',
    razao_social: 'Allergan Aesthetics Brasil Ltda',
    nome_fantasia: 'Allergan / AbbVie',
    cnpj_cpf: '08.258.248/0001-90',
    telefone: '(11) 98765-1122',
    email: 'pedidos@allergan.com.br',
    categoria: 'insumos',
    contato_responsavel: 'Fernanda Representante SP',
    cidade_uf: 'São Paulo / SP',
    pix_chave: 'financeiro@allergan.com.br',
    observacoes: 'Fornecedor oficial de Botox 100U e linha de preenchedores Juvederm Voluma/Volift.',
    status: 'ativo',
    criado_em: '2025-01-01T10:00:00.000Z'
  },
  {
    id: 'forn-02',
    razao_social: 'MedSystems Importação e Comércio de Equipamentos Médicos',
    nome_fantasia: 'MedSystems Laser & Tech',
    cnpj_cpf: '05.123.456/0001-78',
    telefone: '(11) 99888-4455',
    email: 'suporte@medsystems.com.br',
    categoria: 'equipamentos',
    contato_responsavel: 'Eng. Roberto Alves (Assistência Técnica)',
    cidade_uf: 'Campinas / SP',
    pix_chave: '05.123.456/0001-78',
    observacoes: 'Fabricante e assistência técnica autorizada do Laser Lavieen Thulium e Ultraformer.',
    status: 'ativo',
    criado_em: '2025-01-05T14:30:00.000Z'
  },
  {
    id: 'forn-03',
    razao_social: 'Mag Estética e Pigmentos Dermocosméticos ME',
    nome_fantasia: 'Mag Color Micropigmentação',
    cnpj_cpf: '12.345.678/0001-99',
    telefone: '(11) 97123-9988',
    email: 'vendas@magcolor.com.br',
    categoria: 'insumos',
    contato_responsavel: 'Juliana Castro',
    cidade_uf: 'São Paulo / SP',
    pix_chave: 'contato@magcolor.com.br',
    observacoes: 'Linha completa de pigmentos inorgânicos e orgânicos, agulhas e dermógrafos.',
    status: 'ativo',
    criado_em: '2025-01-10T09:15:00.000Z'
  },
  {
    id: 'forn-04',
    razao_social: 'Engenharia Clínica Prime & Calibrações Hospitalares',
    nome_fantasia: 'Prime Calibrações e Laudos',
    cnpj_cpf: '23.456.789/0001-01',
    telefone: '(11) 98222-3344',
    email: 'laudos@primecalibracoes.com.br',
    categoria: 'manutencao',
    contato_responsavel: 'Dr. Lucas Engenheiro Clínico',
    cidade_uf: 'São Paulo / SP',
    pix_chave: '23.456.789/0001-01',
    observacoes: 'Responsável pela emissão de laudos de conformidade, calibração e teste de segurança elétrica.',
    status: 'ativo',
    criado_em: '2025-01-12T11:00:00.000Z'
  }
];

