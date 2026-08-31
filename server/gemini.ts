import { GoogleGenAI } from "@google/genai";

let genAiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!genAiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("A chave GEMINI_API_KEY não foi configurada no ambiente.");
    }
    genAiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return genAiClient;
}

export type ChatRole = 'clinical_consultant' | 'sales_growth' | 'cost_auditor' | 'system_support';
export type ChatSpeedMode = 'fast' | 'general' | 'complex';

const SYSTEM_INSTRUCTIONS: Record<ChatRole, string> = {
  clinical_consultant: `Você é a Aura Copilot Clínico, uma inteligência artificial especialista em Biomedicina Estética, Dermatologia e Cosmetologia Avançada.
Sua missão é auxiliar profissionais de clínicas de estética com:
1. Protocolos estéticos detalhados (ex: Toxina Botulínica, Preenchimento com Ácido Hialurônico, Bioestimuladores de Colágeno, Peelings Químicos, Limpeza de Pele Profunda, Microagulhamento, Harmonização Facial).
2. Avaliação de contraindicações, fototipos de Fitzpatrick, cuidados pré e pós-procedimento.
3. Orientações de intercorrências leves (edema, hematoma, eritema) e quando encaminhar.
4. Linguagem técnica, precisa, empática e estruturada em tópicos claros (Indicações, Preparo, Passo a Passo, Cuidados Pós).
Aviso importante: Sempre enfatize que as sugestões servem como apoio à decisão do profissional habilitado responsável.`,

  sales_growth: `Você é a Aura Growth & Vendas, consultora sênior em Gestão Comercial, Pós-Venda e Fidelização para Clínicas de Estética e Spas de Luxo.
Sua missão é:
1. Criar campanhas de venda de pacotes e combos atrativos sem desvalorizar a marca.
2. Escrever roteiros de mensagens humanizadas para WhatsApp (confirmação, anti-falta, recuperação de clientes inativos, retorno de 15/30 dias).
3. Estratégias de upsell e cross-sell para tratamentos de Home Care.
4. Responder com tom entusiasmado, persuasivo e focado em alta taxa de conversão e encantamento.`,

  cost_auditor: `Você é o Aura Auditor Financeiro & Custos, especialista em Precificação e Rentabilidade para Clínicas de Estética.
Sua missão é:
1. Calcular custo por sessão (insumos descartáveis, ampolas fracionadas, pigmentos, seringas, agulhas, EPIs, depreciação de equipamentos).
2. Sugerir markup ideal e margem de lucro líquida saudável (40% a 70%).
3. Identificar pontos de desperdício em estoque e insumos vencidos ou mal estocados.
4. Apresentar respostas analíticas com fórmulas claras, tabelas estruturadas e dicas práticas de economia.`,

  system_support: `Você é o Suporte AuraEstética / EstéticaOS, especialista em todas as funcionalidades deste software de gestão.
Você ajuda a equipe a:
1. Utilizar o Balcão do Dia, Agenda Dinâmica, Prontuários com Anamnese e Assinatura Digital.
2. Cadastrar e controlar Insumos, Fornecedores e Bens Patrimoniais.
3. Gerenciar o Fluxo de Caixa, Despesas Recorrentes, Permissões da Matriz RBAC e Mural da Equipe.
4. Responder de forma didática, objetiva e com passos numerados fáceis de seguir.`
};

export async function handleGeminiChat(params: {
  message: string;
  history?: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
  role?: ChatRole;
  mode?: ChatSpeedMode;
}) {
  const ai = getGeminiClient();
  const role = params.role || 'clinical_consultant';
  const mode = params.mode || 'general';

  // Select model according to intent and task requirements
  let modelName = 'gemini-3.7-flash';
  if (mode === 'fast') {
    modelName = 'gemini-3.1-flash-lite';
  } else if (mode === 'complex') {
    modelName = 'gemini-3.1-pro-preview';
  }

  const systemInstruction = SYSTEM_INSTRUCTIONS[role] || SYSTEM_INSTRUCTIONS.clinical_consultant;

  // Format contents for multi-turn conversation
  const contents: any[] = [];
  if (params.history && Array.isArray(params.history)) {
    for (const h of params.history) {
      if (h && h.parts && h.parts.length > 0) {
        contents.push({
          role: h.role === 'model' ? 'model' : 'user',
          parts: h.parts.map(p => ({ text: p.text || '' }))
        });
      }
    }
  }

  // Add the current latest message
  contents.push({
    role: 'user',
    parts: [{ text: params.message }]
  });

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    return {
      text: response.text || "Sem resposta gerada pelo modelo.",
      model: modelName,
      role
    };
  } catch (err: any) {
    // If complex pro model encounters any quota issue, fallback gracefully to gemini-3.7-flash
    if (modelName === 'gemini-3.1-pro-preview') {
      console.warn("Fallback de gemini-3.1-pro-preview para gemini-3.7-flash:", err?.message);
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });
      return {
        text: fallbackResponse.text || "Sem resposta gerada.",
        model: 'gemini-3.7-flash',
        role
      };
    }
    throw err;
  }
}

export async function handleMapsGrounding(params: {
  query: string;
  location?: string;
}) {
  const ai = getGeminiClient();
  const locationCtx = params.location ? ` na região de ${params.location}` : '';
  const prompt = `Localize informações atualizadas, endereços, contatos e avaliações no Google Maps para a seguinte consulta de estética/saúde:${locationCtx} "${params.query}".
Estruture o resultado com:
1. Nome dos estabelecimentos / fornecedores / laboratórios encontrados
2. Endereço completo e bairro/cidade
3. Principais produtos ou serviços atendidos
4. Recomendações práticas e logística de acesso.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
      },
    });

    const candidate = response.candidates?.[0];
    const groundingMetadata = candidate?.groundingMetadata;

    return {
      text: response.text || "Nenhuma informação localizada para o local especificado.",
      groundingMetadata,
      model: 'gemini-2.5-flash'
    };
  } catch (err: any) {
    console.warn("Maps grounding com ferramenta googleMaps falhou, tentando fallback com gemini-2.5-flash:", err?.message);
    const fallbackResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.5,
      }
    });

    return {
      text: fallbackResponse.text || "Informações de fornecedores e clínicas na região solicitada.",
      groundingMetadata: undefined,
      model: 'gemini-2.5-flash'
    };
  }
}

export async function handleGenerateImage(params: {
  prompt: string;
  aspectRatio?: string;
  imageSize?: string;
  base64Image?: string;
  mimeType?: string;
  mode?: 'create' | 'edit';
}) {
  const ai = getGeminiClient();
  const aspectRatio = params.aspectRatio || "1:1";
  const imageSize = params.imageSize || "1K";

  const parts: any[] = [];
  if (params.base64Image) {
    let cleanBase64 = params.base64Image;
    let mime = params.mimeType || "image/jpeg";
    if (cleanBase64.includes(";base64,")) {
      const split = cleanBase64.split(";base64,");
      const mimeMatch = split[0].match(/data:(.*?);/);
      if (mimeMatch) mime = mimeMatch[1];
      cleanBase64 = split[1];
    }
    parts.push({
      inlineData: {
        data: cleanBase64,
        mimeType: mime
      }
    });
  }

  parts.push({
    text: params.prompt
  });

  const modelName = 'gemini-3.1-flash-image';

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
          imageSize: imageSize as any,
        }
      }
    });

    let imageUrl: string | null = null;
    let textFeedback: string = "";

    const candidateParts = response.candidates?.[0]?.content?.parts || [];
    for (const part of candidateParts) {
      if (part.inlineData && part.inlineData.data) {
        const mime = part.inlineData.mimeType || "image/png";
        imageUrl = `data:${mime};base64,${part.inlineData.data}`;
      } else if (part.text) {
        textFeedback += part.text + " ";
      }
    }

    if (!imageUrl && textFeedback) {
      return {
        imageUrl: null,
        text: textFeedback.trim(),
        model: modelName
      };
    }

    return {
      imageUrl,
      text: textFeedback.trim() || "Imagem gerada com sucesso!",
      model: modelName
    };
  } catch (err: any) {
    console.warn("Tentando fallback de imagem para gemini-3.1-flash-lite-image...", err?.message);
    const fallbackResponse = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-image',
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
        }
      }
    });

    let imageUrl: string | null = null;
    let textFeedback: string = "";
    const candidateParts = fallbackResponse.candidates?.[0]?.content?.parts || [];
    for (const part of candidateParts) {
      if (part.inlineData && part.inlineData.data) {
        const mime = part.inlineData.mimeType || "image/png";
        imageUrl = `data:${mime};base64,${part.inlineData.data}`;
      } else if (part.text) {
        textFeedback += part.text + " ";
      }
    }

    return {
      imageUrl,
      text: textFeedback.trim() || "Imagem gerada com sucesso via Lite Image!",
      model: 'gemini-3.1-flash-lite-image'
    };
  }
}
