import { TransacaoFinanceira, UsuarioEquipe } from '../types';

/**
 * Normaliza nomes para comparação segura (remove Dr./Dra., espaços e caixa alta)
 */
function normalizeName(name?: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/^(dr\.|dra\.|dr|dra)\s+/i, '') // remove prefixo de título
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Verifica se uma transação financeira é visível para um determinado usuário.
 * 
 * Regra de negócio estrita:
 * 1. Saídas e Despesas Recorrentes são UNIFICADAS (todos os administradores têm acesso).
 * 2. Entradas e Receitas são RESTRITAS apenas ao usuário que as realizou ou a quem estão atreladas:
 *    - Realizado por ele: criado_por_id, criado_por_nome, usuario_id, usuario_nome
 *    - Atrelado a ele: profissional_id, profissional_nome
 */
export function isTransacaoVisivelParaUsuario(
  tx: TransacaoFinanceira,
  usuario?: UsuarioEquipe | null
): boolean {
  // 1. Saídas e Despesas são unificadas para toda a clínica
  if (tx.tipo === 'saida' || tx.tipo === 'despesa') {
    return true;
  }

  // Se não houver usuário definido (ex: estado transitório), mantém visível por segurança
  if (!usuario) {
    return true;
  }

  const userId = usuario.id?.trim();
  const userNome = normalizeName(usuario.nome);
  const userNomeCompleto = normalizeName(usuario.nomeCompleto);

  // 2. Transações de Entrada/Receita: apenas as realizadas por ele ou atreladas a ele
  
  // A. Verificação por ID do criador ou usuário lançador
  const criadoPorId = (tx.criado_por_id || tx.usuario_id || '').trim();
  if (userId && criadoPorId && criadoPorId === userId) {
    return true;
  }

  // B. Verificação por ID do profissional responsável
  const profId = (tx.profissional_id || '').trim();
  if (userId && profId && profId === userId) {
    return true;
  }

  // C. Verificação por Nome do criador / lançador
  const criadoPorNome = normalizeName(tx.criado_por_nome || tx.usuario_nome);
  if (criadoPorNome && (criadoPorNome === userNome || (userNomeCompleto && criadoPorNome === userNomeCompleto))) {
    return true;
  }
  if (criadoPorNome && userNome && (criadoPorNome.includes(userNome) || userNome.includes(criadoPorNome))) {
    return true;
  }

  // D. Verificação por Nome do profissional responsável
  const profNome = normalizeName(tx.profissional_nome);
  if (profNome && (profNome === userNome || (userNomeCompleto && profNome === userNomeCompleto))) {
    return true;
  }
  if (profNome && userNome && (profNome.includes(userNome) || userNome.includes(profNome))) {
    return true;
  }

  // Se for entrada e não pertencer nem estiver atrelada a este usuário, fica restrita
  return false;
}

/**
 * Filtra uma lista de transações retornando apenas as visíveis para o usuário especificado.
 */
export function filterTransacoesPorUsuario(
  transacoes: TransacaoFinanceira[],
  usuario?: UsuarioEquipe | null
): TransacaoFinanceira[] {
  if (!transacoes || !Array.isArray(transacoes)) return [];
  return transacoes.filter(tx => isTransacaoVisivelParaUsuario(tx, usuario));
}
