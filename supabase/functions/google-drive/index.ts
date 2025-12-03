import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_DRIVE_CLIENT_ID = Deno.env.get('GOOGLE_DRIVE_CLIENT_ID');
const GOOGLE_DRIVE_CLIENT_SECRET = Deno.env.get('GOOGLE_DRIVE_CLIENT_SECRET');
const GOOGLE_DRIVE_REFRESH_TOKEN = Deno.env.get('GOOGLE_DRIVE_REFRESH_TOKEN');

async function getAccessToken(): Promise<string> {
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token?supportsAllDrives=true', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });
      client_id: GOOGLE_DRIVE_CLIENT_ID,
      client_secret: GOOGLE_DRIVE_CLIENT_SECRET,
      refresh_token: GOOGLE_DRIVE_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    console.error('Google API Error:', errorText);
    throw new Error(`Failed to create folder: ${errorText}`);
  }
return await response.json();
}
  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

async function uploadFile(accessToken: string, fileName: string, fileContent: string, mimeType: string, folderId?: string) {
  const metadata = {
    name: fileName,
    ...(folderId && { parents: [folderId] }),
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([fileContent], { type: mimeType }));

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    body: form,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to upload file:', error);
    throw new Error('Failed to upload file');
  }

  return await response.json();
}

async function listFiles(accessToken: string, folderId?: string, pageSize: number = 10) {
  const query = folderId ? `'${folderId}' in parents` : '';
  const params = new URLSearchParams({
    pageSize: pageSize.toString(),
    fields: 'files(id, name, mimeType, createdTime, modifiedTime, size)',
    ...(query && { q: query }),
  });

  const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to list files:', error);
    throw new Error('Failed to list files');
  }

  return await response.json();
}

async function downloadFile(accessToken: string, fileId: string) {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to download file:', error);
    throw new Error('Failed to download file');
  }

  return await response.blob();
}

async function deleteFile(accessToken: string, fileId: string) {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to delete file:', error);
    throw new Error('Failed to delete file');
  }

  return { success: true };
}

async function createFolder(accessToken: string, folderName: string, parentFolderId?: string) {
  const metadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    ...(parentFolderId && { parents: [parentFolderId] }),
  };

  const response = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to create folder:', error);
    throw new Error('Failed to create folder');
  }

  return await response.json();
}

async function uploadFileMultipart(accessToken: string, fileName: string, fileData: ArrayBuffer, mimeType: string, folderId?: string) {
  const metadata = {
    name: fileName,
    ...(folderId && { parents: [folderId] }),
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadataPart = delimiter + 'Content-Type: application/json\r\n\r\n' + JSON.stringify(metadata);
  const dataPart = delimiter + `Content-Type: ${mimeType}\r\n\r\n`;

  const body = new Uint8Array([
    ...new TextEncoder().encode(metadataPart),
    ...new TextEncoder().encode(dataPart),
    ...new Uint8Array(fileData),
    ...new TextEncoder().encode(closeDelimiter)
  ]);

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: body,
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Failed to upload file:', error);
    throw new Error('Failed to upload file');
  }

  return await response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...params } = await req.json();
    console.log('Google Drive action:', action, 'params:', params);

    const accessToken = await getAccessToken();

    let result;
    switch (action) {
      case 'upload':
        result = await uploadFile(
          accessToken,
          params.fileName,
          params.fileContent,
          params.mimeType || 'application/octet-stream',
          params.folderId
        );
        break;
      case 'uploadBinary':
        // Handle binary file uploads (from File objects)
        result = await uploadFileMultipart(
          accessToken,
          params.fileName,
          params.fileData,
          params.mimeType || 'application/octet-stream',
          params.folderId
        );
        break;
      case 'createFolder':
        result = await createFolder(accessToken, params.folderName, params.parentFolderId);
        break;
      case 'list':
        result = await listFiles(accessToken, params.folderId, params.pageSize);
        break;
      case 'download':
        const blob = await downloadFile(accessToken, params.fileId);
        return new Response(blob, {
          headers: { ...corsHeaders, 'Content-Type': 'application/octet-stream' },
        });
      case 'delete':
        result = await deleteFile(accessToken, params.fileId);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in google-drive function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
