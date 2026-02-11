type UploadInput = { uri: string; name: string; mimeType: string };

// CHANGE THIS depending on device:
const UPLOAD_URL = "http://192.168.0.254:4000/upload"; // <-- your PC IP

export async function uploadFile(file: UploadInput) {
  const form = new FormData();
  form.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.mimeType,
  } as any);

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