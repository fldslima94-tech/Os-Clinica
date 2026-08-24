export const SUPABASE_SQL_SCRIPT = `-- ==============================================================================
-- SCHEMA COMPLETO - SaaS CLÍNICA DE ESTÉTICA (EstéticaOS)
-- Banco de Dados: PostgreSQL / Supabase
-- Custo de Infraestrutura: R$ 0,00 (Free Tier)
-- ==============================================================================

-- 1. Habilitar extensão para geração de UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TABELA: PACIENTES & PRONTUÁRIO COMPLETO
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.pacientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    telefone TEXT NOT NULL,
    email TEXT,
    cpf TEXT,
    data_nascimento DATE,
    alergias TEXT,
    medicacoes TEXT,
    fototipo TEXT DEFAULT 'Fototipo III',
    queixa_principal TEXT,
    historico_clinico TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.pacientes IS 'Cadastro de pacientes, anamnese estética e histórico clínico.';

-- ==============================================================================
-- 3. TABELA: ESTOQUE DE INSUMOS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.estoque_insumos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_item TEXT NOT NULL,
    quantidade INTEGER NOT NULL DEFAULT 0 CHECK (quantidade >= 0),
    unidade_medida TEXT NOT NULL CHECK (unidade_medida IN ('ml', 'unidade', 'seringa')),
    alerta_minimo INTEGER NOT NULL DEFAULT 5 CHECK (alerta_minimo >= 0),
    categoria TEXT DEFAULT 'Geral',
    lote TEXT,
    preco_custo NUMERIC(10, 2) DEFAULT 0.00,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_estoque_alerta ON public.estoque_insumos(quantidade, alerta_minimo);
COMMENT ON TABLE public.estoque_insumos IS 'Controle de estoque de toxinas, bioestimuladores e descartáveis.';

-- ==============================================================================
-- 4. TABELA: AGENDAMENTOS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.agendamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
    data_hora TIMESTAMP WITH TIME ZONE NOT NULL,
    duracao_minutos INTEGER DEFAULT 45,
    procedimento TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pendente', 'confirmado', 'concluido', 'cancelado')) DEFAULT 'pendente',
    valor_estimado NUMERIC(10, 2),
    forma_pagamento TEXT CHECK (forma_pagamento IN ('pix', 'cartao_credito', 'cartao_debito', 'dinheiro', 'transferencia')),
    status_pagamento TEXT CHECK (status_pagamento IN ('pago', 'pendente', 'cancelado')),
    lembrete_enviado BOOLEAN DEFAULT false,
    observacoes TEXT,
    insumos_consumidos JSONB DEFAULT '[]'::jsonb,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agendamentos_data_hora ON public.agendamentos(data_hora);
CREATE INDEX IF NOT EXISTS idx_agendamentos_paciente_id ON public.agendamentos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON public.agendamentos(status);

-- ==============================================================================
-- 5. TABELA: TRANSAÇÕES FINANCEIRAS & CAIXA
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.transacoes_financeiras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agendamento_id UUID REFERENCES public.agendamentos(id) ON DELETE SET NULL,
    paciente_id UUID REFERENCES public.pacientes(id) ON DELETE SET NULL,
    paciente_nome TEXT NOT NULL,
    procedimento TEXT NOT NULL,
    valor NUMERIC(10, 2) NOT NULL CHECK (valor >= 0),
    custo_insumos NUMERIC(10, 2) DEFAULT 0.00,
    tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
    forma_pagamento TEXT NOT NULL CHECK (forma_pagamento IN ('pix', 'cartao_credito', 'cartao_debito', 'dinheiro', 'transferencia')),
    status TEXT NOT NULL CHECK (status IN ('pago', 'pendente', 'cancelado')) DEFAULT 'pago',
    data TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    observacao TEXT
);

CREATE INDEX IF NOT EXISTS idx_transacoes_data ON public.transacoes_financeiras(data);
CREATE INDEX IF NOT EXISTS idx_transacoes_status ON public.transacoes_financeiras(status);

-- ==============================================================================
-- 6. TABELA: EVOLUÇÃO FOTOGRÁFICA (ANTES & DEPOIS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.fotos_antes_depois (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    data DATE DEFAULT CURRENT_DATE,
    foto_antes_url TEXT NOT NULL,
    foto_depois_url TEXT,
    observacoes TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 7. TABELA: TERMOS DE CONSENTIMENTO (TCLE & ASSINATURAS DIGITAIS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.termos_consentimento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
    documento_cpf TEXT,
    texto_termo TEXT NOT NULL,
    assinatura_base64 TEXT NOT NULL,
    ip_origem TEXT,
    assinado_em TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 8. TRIGGER DE BAIXA AUTOMÁTICA DE ESTOQUE QUANDO O PROCEDIMENTO É CONCLUÍDO
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.fn_baixa_automatica_estoque()
RETURNS TRIGGER AS $$
DECLARE
    insumo RECORD;
BEGIN
    IF NEW.status = 'concluido' AND (OLD.status IS DISTINCT FROM 'concluido') THEN
        IF NEW.insumos_consumidos IS NOT NULL AND jsonb_array_length(NEW.insumos_consumidos) > 0 THEN
            FOR insumo IN SELECT * FROM jsonb_to_recordset(NEW.insumos_consumidos) AS x(nome_item text, quantidade int)
            LOOP
                UPDATE public.estoque_insumos
                SET quantidade = GREATEST(0, quantidade - insumo.quantidade)
                WHERE nome_item = insumo.nome_item;
            END LOOP;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_baixa_estoque ON public.agendamentos;
CREATE TRIGGER trg_baixa_estoque
AFTER UPDATE ON public.agendamentos
FOR EACH ROW
EXECUTE FUNCTION public.fn_baixa_automatica_estoque();

-- ==============================================================================
-- 9. SEGURANÇA: ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacoes_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fotos_antes_depois ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.termos_consentimento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso completo autenticados em pacientes" ON public.pacientes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso completo autenticados em estoque" ON public.estoque_insumos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso completo autenticados em agendamentos" ON public.agendamentos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso completo autenticados em transacoes" ON public.transacoes_financeiras FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso completo autenticados em fotos" ON public.fotos_antes_depois FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Acesso completo autenticados em termos" ON public.termos_consentimento FOR ALL TO authenticated USING (true) WITH CHECK (true);
`;
