type UploadInput = {
  uri: string;
  name: string;
  mimeType: string;
};

/**
 * DEMO upload: sends a file as multipart/form-data.
 * Replace UPLOAD_URL with your backend endpoint later.
 */
const UPLOAD_URL = "https://httpbin.org/post"; // demo endpoint

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
    // NOTE: don't manually set Content-Type for FormData in RN
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Upload failed (${res.status}). ${text}`);
  }

  return res.json();
}