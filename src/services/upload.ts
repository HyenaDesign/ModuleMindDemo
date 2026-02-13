type UploadInput = { uri: string; name: string; mimeType: string };

// Load from environment variable (set in .env file)
// Each collaborator can set their own server URL in .env
const UPLOAD_URL = process.env.EXPO_PUBLIC_UPLOAD_URL || "http://localhost:4000/upload";

export async function uploadFile(file: UploadInput) {
  const form = new FormData();
  
  // On web, uri is a File/Blob; on mobile it's a file:// path
  if (typeof file.uri === 'string' && file.uri.startsWith('file://')) {
    // Mobile: use the URI directly with the file name and type
    form.append("file", {
      uri: file.uri,
      name: file.name,
      type: file.mimeType,
    } as any);
  } else if (typeof file.uri === 'string') {
    // Web (blob URL): fetch and convert to blob
    const response = await fetch(file.uri);
    const blob = await response.blob();
    form.append("file", blob, file.name);
  } else {
    // Web (File object)
    form.append("file", file.uri as any, file.name);
  }

  const res = await fetch(UPLOAD_URL, {
    method: "POST",
    body: form,
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(json?.error ?? `Upload failed (${res.status})`);
  }

  return json; // { ok, filename, chars, quiz }
}