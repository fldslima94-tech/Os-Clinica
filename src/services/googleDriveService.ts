import { getValidAccessToken, GOOGLE_DRIVE_SCOPE } from './googleAuthService';

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  webContentLink?: string;
  createdTime?: string;
  size?: string;
}

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3';

/**
 * Cria ou localiza uma pasta pelo nome dentro do Drive do usuário
 */
export async function getOrCreateDriveFolder(
  folderName: string,
  parentFolderId?: string
): Promise<string> {
  const token = await getValidAccessToken(GOOGLE_DRIVE_SCOPE);

  // Busca se a pasta já existe
  let q = `mimeType = 'application/vnd.google-apps.folder' and name = '${folderName.replace(/'/g, "\\'")}' and trashed = false`;
  if (parentFolderId) {
    q += ` and '${parentFolderId}' in parents`;
  }

  const searchRes = await fetch(`${DRIVE_API_URL}/files?q=${encodeURIComponent(q)}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!searchRes.ok) {
    const err = await searchRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Erro ao buscar pasta no Google Drive (${searchRes.status})`);
  }

  const data = await searchRes.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }

  // Cria a pasta
  const folderMetadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder'
  };
  if (parentFolderId) {
    folderMetadata.parents = [parentFolderId];
  }

  const createRes = await fetch(`${DRIVE_API_URL}/files?fields=id,name`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(folderMetadata)
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Erro ao criar pasta no Google Drive (${createRes.status})`);
  }

  const newFolder = await createRes.json();
  return newFolder.id;
}

/**
 * Faz upload de um arquivo para o Google Drive
 */
export async function uploadFileToDrive(
  fileName: string,
  content: string | Blob,
  mimeType: string = 'application/json',
  parentFolderId?: string
): Promise<GoogleDriveFile> {
  const token = await getValidAccessToken(GOOGLE_DRIVE_SCOPE);

  const metadata: any = {
    name: fileName,
    mimeType
  };

  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const bodyBlobParts: (string | Blob)[] = [];
  bodyBlobParts.push(
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n\r\n`
  );
  bodyBlobParts.push(content);
  bodyBlobParts.push(closeDelimiter);

  const multipartBody = new Blob(bodyBlobParts, { type: `multipart/related; boundary=${boundary}` });

  const res = await fetch(`${DRIVE_UPLOAD_URL}/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,webContentLink,createdTime,size`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: multipartBody
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Falha no upload para o Google Drive (${res.status})`);
  }

  return await res.json();
}

/**
 * Lista arquivos de uma pasta específica ou da raiz
 */
export async function listDriveFiles(folderId?: string): Promise<GoogleDriveFile[]> {
  const token = await getValidAccessToken(GOOGLE_DRIVE_SCOPE);

  let q = 'trashed = false';
  if (folderId) {
    q += ` and '${folderId}' in parents`;
  }

  const url = `${DRIVE_API_URL}/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,webViewLink,webContentLink,createdTime,size)&orderBy=createdTime desc&pageSize=50`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Falha ao listar arquivos do Google Drive (${res.status})`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Exclui um arquivo do Drive
 */
export async function deleteDriveFile(fileId: string): Promise<void> {
  const token = await getValidAccessToken(GOOGLE_DRIVE_SCOPE);
  const res = await fetch(`${DRIVE_API_URL}/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok && res.status !== 404) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Falha ao excluir arquivo do Google Drive (${res.status})`);
  }
}
