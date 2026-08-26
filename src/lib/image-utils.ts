// lib/image-utils.ts
/**
 * Utilitários para compressão e conversão de imagens e assinaturas em Base64 leve (15KB - 35KB)
 * Permite armazenamento direto no Cloud Firestore com ZERO dependência de Storage pago.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: 'image/webp' | 'image/jpeg' | 'image/png';
  targetMaxKB?: number;
}

/**
 * Calcula o tamanho aproximado em KB de uma string Base64
 */
export function getBase64SizeInKB(base64String: string): number {
  if (!base64String) return 0;
  const stringLength = base64String.length - (base64String.indexOf(',') + 1);
  const sizeInBytes = (stringLength * 3) / 4;
  return Math.round((sizeInBytes / 1024) * 10) / 10;
}

/**
 * Comprime um arquivo de imagem (File ou Blob) no cliente via Canvas HTML5
 * Retorna uma string Data URL Base64 ultraleve (15KB - 35KB) pronta para o Firestore.
 */
export async function compressImageFile(
  file: File | Blob,
  options: CompressionOptions = {}
): Promise<string> {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.7,
    mimeType = 'image/webp',
    targetMaxKB = 35,
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Redimensionamento proporcional
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Falha ao obter contexto 2D do Canvas'));
          return;
        }

        // Fundo branco para imagens com transparência se convertidas para JPEG
        if (mimeType === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Compressão iterativa caso exceda o targetMaxKB
        let currentQuality = quality;
        let dataUrl = canvas.toDataURL(mimeType, currentQuality);
        let sizeKB = getBase64SizeInKB(dataUrl);

        // Se o navegador não suportar WebP no toDataURL, ele cai para PNG; convertemos para JPEG
        if (mimeType === 'image/webp' && dataUrl.startsWith('data:image/png')) {
          dataUrl = canvas.toDataURL('image/jpeg', currentQuality);
          sizeKB = getBase64SizeInKB(dataUrl);
        }

        while (sizeKB > targetMaxKB && currentQuality > 0.2) {
          currentQuality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', currentQuality);
          sizeKB = getBase64SizeInKB(dataUrl);
        }

        resolve(dataUrl);
      };

      img.onerror = (err) => reject(err);
    };

    reader.onerror = (err) => reject(err);
  });
}

/**
 * Comprime o conteúdo de um elemento HTMLCanvasElement (ex: assinatura digital)
 * Retorna Base64 leve (geralmente < 20KB em WebP/JPEG)
 */
export function compressCanvasToLightBase64(
  canvas: HTMLCanvasElement,
  options: CompressionOptions = {}
): string {
  const { quality = 0.7, mimeType = 'image/webp' } = options;

  try {
    const dataUrl = canvas.toDataURL(mimeType, quality);
    // Validação se o formato WebP foi respeitado
    if (mimeType === 'image/webp' && dataUrl.startsWith('data:image/png')) {
      // Fallback para JPEG com fundo preservado
      return canvas.toDataURL('image/jpeg', quality);
    }
    return dataUrl;
  } catch {
    return canvas.toDataURL('image/png');
  }
}
