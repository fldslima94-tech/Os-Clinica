import React, { useState, useRef } from 'react';
import { 
  Printer, 
  X, 
  Receipt, 
  CheckCircle2, 
  Share2, 
  MessageCircle, 
  Copy, 
  Check, 
  Building2, 
  User, 
  Calendar, 
  CreditCard, 
  FileText,
  ShieldCheck,
  Download,
  Edit3
} from 'lucide-react';
import { TransacaoFinanceira, ClinicaConfig, UsuarioEquipe, FormaPagamento } from '../types';

interface PrintableReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transacao: TransacaoFinanceira | null;
  clinicaConfig?: ClinicaConfig;
  currentUser?: UsuarioEquipe;
}

// Helper to convert currency to formatted string
const formatCurrency = (val: number | string | undefined): string => {
  const num = typeof val === 'string' ? parseFloat(val) : Number(val);
  if (isNaN(num) || num === undefined) return 'R$ 0,00';
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

// Helper for payment method label
const getFormaLabel = (forma?: FormaPagamento | string): string => {
  switch (forma) {
    case 'pix':
      return 'PIX Instantâneo';
    case 'cartao_credito':
      return 'Cartão de Crédito';
    case 'cartao_debito':
      return 'Cartão de Débito';
    case 'dinheiro':
      return 'Dinheiro em Espécie';
    case 'transferencia':
      return 'Transferência Bancária / TED';
    case 'boleto':
      return 'Boleto Bancário';
    default:
      return forma || 'À Vista';
  }
};

// Helper for approximate written value in BRL (pt-BR)
function valorPorExtenso(valor: number): string {
  if (!valor || valor <= 0) return 'zero reais';
  
  const unidades = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
  const deDezAdezenove = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const dezenas = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

  function converterGrupo(n: number): string {
    if (n === 0) return '';
    if (n === 100) return 'cem';
    
    let c = Math.floor(n / 100);
    let d = Math.floor((n % 100) / 10);
    let u = n % 10;
    let partes: string[] = [];

    if (c > 0) partes.push(centenas[c]);
    
    if (d === 1) {
      partes.push(deDezAdezenove[u]);
    } else {
      if (d > 1) partes.push(dezenas[d]);
      if (u > 0) partes.push(unidades[u]);
    }

    return partes.join(' e ');
  }

  const inteiro = Math.floor(valor);
  const centavos = Math.round((valor - inteiro) * 100);

  let textoFinal = '';

  if (inteiro > 0) {
    const milhares = Math.floor(inteiro / 1000);
    const resto = inteiro % 1000;
    let partesMilhar: string[] = [];

    if (milhares > 0) {
      if (milhares === 1) {
        partesMilhar.push('mil');
      } else {
        partesMilhar.push(converterGrupo(milhares) + ' mil');
      }
    }

    if (resto > 0) {
      partesMilhar.push(converterGrupo(resto));
    }

    const textoInteiro = partesMilhar.join(' e ');
    textoFinal += `${textoInteiro} ${inteiro === 1 ? 'real' : 'reais'}`;
  }

  if (centavos > 0) {
    const textoCentavos = converterGrupo(centavos);
    if (textoFinal.length > 0) {
      textoFinal += ` e ${textoCentavos} ${centavos === 1 ? 'centavo' : 'centavos'}`;
    } else {
      textoFinal += `${textoCentavos} ${centavos === 1 ? 'centavo' : 'centavos'}`;
    }
  }

  return textoFinal.charAt(0).toUpperCase() + textoFinal.slice(1);
}

export const PrintableReceiptModal: React.FC<PrintableReceiptModalProps> = ({
  isOpen,
  onClose,
  transacao,
  clinicaConfig,
  currentUser,
}) => {
  const [copied, setCopied] = useState(false);
  const [cpfCliente, setCpfCliente] = useState('');
  const [observacaoAdicional, setObservacaoAdicional] = useState('');
  const [isEditingDetails, setIsEditingDetails] = useState(false);

  if (!isOpen || !transacao) return null;

  const dataTx = new Date(transacao.data);
  const dataFormatada = dataTx.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const horaFormatada = dataTx.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const dataExtenso = dataTx.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const codigoRecibo = transacao.id.startsWith('tx-') 
    ? `REC-${transacao.id.replace('tx-', '').slice(-8).toUpperCase()}` 
    : `REC-${transacao.id.slice(-8).toUpperCase()}`;

  const clinicaNome = clinicaConfig?.nome || 'Studio Estética & Gestão Clínica';
  const clinicaSlogan = clinicaConfig?.slogan || 'Excelência em Tratamentos Estéticos Avançados e Cosmetologia';
  const clinicaTel = clinicaConfig?.telefone || '(11) 98765-4321';
  const clinicaEndereco = clinicaConfig?.endereco || 'São Paulo - SP';
  const clinicaCnpj = clinicaConfig?.cnpj || '12.345.678/0001-90';

  const pacienteNome = transacao.paciente_nome || 'Consumidor / Cliente';
  const procedimentoNome = transacao.procedimento || 'Procedimento Estético Especializado';
  const valorTotal = Number(transacao.valor) || 0;
  const profissionalResponsavel = transacao.profissional_nome || currentUser?.nome || 'Responsável Técnico';
  const formaPagamentoTexto = getFormaLabel(transacao.forma_pagamento);

  const valorExtenso = valorPorExtenso(valorTotal);

  const handlePrint = () => {
    window.print();
  };

  const getWhatsAppText = () => {
    return `*COMPROVANTE DE RECIBO - ${clinicaNome.toUpperCase()}*\n` +
      `----------------------------------------\n` +
      `📄 *Recibo Nº:* ${codigoRecibo}\n` +
      `📅 *Data:* ${dataFormatada} às ${horaFormatada}\n` +
      `👤 *Cliente:* ${pacienteNome}\n` +
      (cpfCliente ? `🆔 *CPF:* ${cpfCliente}\n` : '') +
      `💉 *Serviço / Procedimento:* ${procedimentoNome}\n` +
      `💳 *Forma de Pagamento:* ${formaPagamentoTexto}\n` +
      `💰 *Valor Pago:* ${formatCurrency(valorTotal)} (${valorExtenso})\n` +
      `👩‍⚕️ *Profissional:* ${profissionalResponsavel}\n` +
      `----------------------------------------\n` +
      `✅ *Status:* QUITADO E APROVADO\n` +
      `🏢 ${clinicaNome} - CNPJ: ${clinicaCnpj}\n` +
      `📍 ${clinicaEndereco} | Tel: ${clinicaTel}`;
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(getWhatsAppText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(getWhatsAppText());
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
      
      {/* Botões de Ação Superiores (Ocultados na Impressão) */}
      <div className="fixed top-4 right-4 z-60 flex items-center gap-2 print:hidden">
        <button
          type="button"
          onClick={() => setIsEditingDetails(!isEditingDetails)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl shadow-lg text-xs font-semibold transition-all cursor-pointer border border-slate-700"
          title="Editar dados complementares do recibo"
        >
          <Edit3 className="w-4 h-4 text-indigo-400" />
          <span>{isEditingDetails ? 'Ocultar Edição' : 'Complementar Dados'}</span>
        </button>

        <button
          type="button"
          onClick={handleCopyText}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl shadow-lg text-xs font-semibold transition-all cursor-pointer border border-slate-700"
          title="Copiar texto do recibo"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-300" />}
          <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
        </button>

        <button
          type="button"
          onClick={handleShareWhatsApp}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg text-xs font-semibold transition-all cursor-pointer"
          title="Enviar Recibo via WhatsApp"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="hidden sm:inline">WhatsApp</span>
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg text-xs sm:text-sm font-bold transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimir / Gerar PDF</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="p-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl shadow-lg transition-all cursor-pointer border border-slate-700"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="w-full max-w-3xl my-8 space-y-4 print:my-0 print:max-w-none">
        
        {/* Painel Opcional de Edição Rápida de Dados do Recibo (Ocultado na impressão) */}
        {isEditingDetails && (
          <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-xl print:hidden animate-in fade-in slide-in-from-top-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-3 flex items-center gap-2">
              <Edit3 className="w-4 h-4" />
              Complementar Informações do Recibo (Opcional)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">CPF do Cliente:</label>
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpfCliente}
                  onChange={(e) => setCpfCliente(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-1">Observação / Informação Adicional:</label>
                <input
                  type="text"
                  placeholder="Ex: Sessão 1 de 4 / Pacote Facial"
                  value={observacaoAdicional}
                  onChange={(e) => setObservacaoAdicional(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Folha do Recibo Formatada para Visualização e Impressão A4 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 sm:p-10 space-y-6 print:border-none print:shadow-none print:p-6 print:rounded-none text-slate-800">
          
          {/* Cabeçalho da Clínica com Identidade Visual */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-slate-900 pb-5">
            <div className="flex items-center gap-3">
              {clinicaConfig?.logomarca_url ? (
                <img
                  src={clinicaConfig.logomarca_url}
                  alt={clinicaNome}
                  className="w-14 h-14 object-contain rounded-xl border border-slate-200 p-1"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-xs">
                  {clinicaNome.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight uppercase">
                  {clinicaNome}
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  {clinicaSlogan}
                </p>
                <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                  <span>{clinicaEndereco}</span>
                  <span>• Tel: {clinicaTel}</span>
                  {clinicaCnpj && <span>• CNPJ: {clinicaCnpj}</span>}
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right shrink-0 bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl w-full sm:w-auto border sm:border-none border-slate-200">
              <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-900 text-xs font-black rounded-lg uppercase tracking-wider mb-1 border border-emerald-300">
                RECIBO OFICIAL DE PAGAMENTO
              </span>
              <div className="text-xs font-bold text-slate-900">
                Nº {codigoRecibo}
              </div>
              <div className="text-[11px] text-slate-500">
                Emitido em {dataFormatada} às {horaFormatada}
              </div>
            </div>
          </div>

          {/* Banner de Valor em Destaque */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Valor Total Recebido
              </span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {formatCurrency(valorTotal)}
              </div>
              <div className="text-xs text-slate-600 italic mt-0.5">
                ({valorExtenso})
              </div>
            </div>

            <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="block uppercase tracking-wider text-[10px]">Situação do Pagamento</span>
                <span>PAGAMENTO QUITADO</span>
              </div>
            </div>
          </div>

          {/* Declaração Formal de Recebimento */}
          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-white p-4 rounded-xl border border-slate-200 space-y-2">
            <p>
              Recebemos de <strong className="text-slate-900 font-bold">{pacienteNome}</strong>
              {cpfCliente ? <>, inscrito(a) no CPF sob o nº <strong className="text-slate-900">{cpfCliente}</strong></> : ''}, 
              a importância supra de <strong className="text-slate-900 font-bold">{formatCurrency(valorTotal)}</strong> ({valorExtenso}), 
              referente à prestação de serviços estéticos e/ou tratamentos descritos neste comprovante.
            </p>
          </div>

          {/* Discriminação dos Itens & Serviços */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg">
              Discriminação dos Serviços Prestados
            </h3>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase">
                    <th className="py-2.5 px-4">Item / Procedimento</th>
                    <th className="py-2.5 px-4">Forma de Pagamento</th>
                    <th className="py-2.5 px-4 text-center">Data</th>
                    <th className="py-2.5 px-4 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-4">
                      <strong className="text-slate-900 block">{procedimentoNome}</strong>
                      {transacao.categoria && (
                        <span className="text-[10px] text-slate-500 uppercase tracking-wide">
                          Categoria: {transacao.categoria}
                        </span>
                      )}
                      {(transacao.observacao || observacaoAdicional) && (
                        <span className="block text-[11px] text-slate-500 mt-0.5">
                          {observacaoAdicional || transacao.observacao}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">
                      {formaPagamentoTexto}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600">
                      {dataFormatada}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(valorTotal)}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50/80 border-t border-slate-200 font-bold text-xs">
                    <td colSpan={3} className="py-2.5 px-4 text-right text-slate-700 uppercase">
                      Total Geral:
                    </td>
                    <td className="py-2.5 px-4 text-right text-emerald-700 text-sm">
                      {formatCurrency(valorTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Informações Complementares & Responsáveis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 font-bold text-[10px] uppercase block tracking-wider">
                Dados do Cliente / Pagador
              </span>
              <div className="font-bold text-slate-900">{pacienteNome}</div>
              {cpfCliente && <div className="text-slate-600">CPF: {cpfCliente}</div>}
              <div className="text-slate-500">Transação Ref: #{transacao.id}</div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-500 font-bold text-[10px] uppercase block tracking-wider">
                Profissional / Atendimento
              </span>
              <div className="font-bold text-slate-900">{profissionalResponsavel}</div>
              <div className="text-slate-600">{clinicaNome}</div>
              <div className="text-slate-500">Emitido por: {currentUser?.nome || 'Recepção / Financeiro'}</div>
            </div>
          </div>

          {/* Local, Data e Assinaturas */}
          <div className="pt-4 border-t border-slate-200 space-y-6">
            <div className="text-center text-xs text-slate-600 font-medium">
              {clinicaEndereco.split('-')[0]?.trim() || 'São Paulo'}, {dataExtenso}.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
              <div className="text-center space-y-1">
                <div className="border-t border-slate-400 w-3/4 mx-auto pt-2"></div>
                <div className="text-xs font-bold text-slate-900">{pacienteNome}</div>
                <div className="text-[10px] text-slate-500">Assinatura do Cliente / Pagador</div>
              </div>

              <div className="text-center space-y-1">
                <div className="border-t border-slate-400 w-3/4 mx-auto pt-2"></div>
                <div className="text-xs font-bold text-slate-900">{clinicaNome}</div>
                <div className="text-[10px] text-slate-500">
                  {profissionalResponsavel} • Responsável / Emissor
                </div>
              </div>
            </div>

            {/* Rodapé e Autenticação Digital */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 gap-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Documento emitido via Sistema de Gestão Clínica Integrada Aura</span>
              </div>
              <div className="font-mono">
                Autenticação: {codigoRecibo}-{Date.now().toString(36).toUpperCase()}
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
