export type ChatRole = 'clinical_consultant' | 'sales_growth' | 'cost_auditor' | 'system_support';
export type ChatSpeedMode = 'fast' | 'general' | 'complex';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  model?: string;
  role?: ChatRole;
  isError?: boolean;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    placeId?: string;
    title?: string;
    address?: string;
    rating?: number;
    userRatingsTotal?: number;
    uri?: string;
  };
}

export interface GroundingMetadata {
  webSearchQueries?: string[];
  groundingChunks?: GroundingChunk[];
  groundingSupports?: any[];
}

export interface MapsGroundingResult {
  text: string;
  groundingMetadata?: GroundingMetadata;
  model: string;
}

export interface ImageGenerationResult {
  imageUrl: string | null;
  text?: string;
  model: string;
}

export async function callGeminiChat(params: {
  message: string;
  history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
  role: ChatRole;
  mode: ChatSpeedMode;
}): Promise<{ text: string; model: string; role: ChatRole }> {
  const response = await fetch('/api/gemini/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erro ${response.status}: Falha ao comunicar com Aura Gemini Copilot`);
  }

  return response.json();
}

export async function callMapsGrounding(params: {
  query: string;
  location?: string;
}): Promise<MapsGroundingResult> {
  const response = await fetch('/api/gemini/maps-grounding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erro ${response.status}: Falha ao buscar no Google Maps`);
  }

  return response.json();
}

export async function callGenerateImage(params: {
  prompt: string;
  aspectRatio?: string;
  imageSize?: string;
  base64Image?: string;
  mimeType?: string;
  mode?: 'create' | 'edit';
}): Promise<ImageGenerationResult> {
  const response = await fetch('/api/gemini/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erro ${response.status}: Falha ao gerar imagem com Gemini`);
  }

  return response.json();
}
