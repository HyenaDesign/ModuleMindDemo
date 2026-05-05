type UploadInput = { uri: string; name: string; mimeType: string; model: string };

const RENDER_UPLOAD_URL = "https://moduleminddemo.onrender.com/upload";
const UPLOAD_URL = process.env.EXPO_PUBLIC_UPLOAD_URL || RENDER_UPLOAD_URL;

function assertUploadUrlIsReachableForThisHost() {
  if (typeof window === "undefined") return;

  const pageHost = window.location.hostname;
  const uploadHost = new URL(UPLOAD_URL, window.location.origin).hostname;
  const isLocalPage = ["localhost", "127.0.0.1", ""].includes(pageHost);
  const isPrivateUploadHost =
    uploadHost === "localhost" ||
    uploadHost === "127.0.0.1" ||
    uploadHost.startsWith("10.") ||
    uploadHost.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(uploadHost);

  if (!isLocalPage && isPrivateUploadHost) {
    throw new Error(
      "The upload server must be a public HTTPS URL for the live web app. Set EXPO_PUBLIC_UPLOAD_URL before building for GitHub Pages."
    );
  }
}

export async function uploadFile(file: UploadInput) {
  assertUploadUrlIsReachableForThisHost();

  const form = new FormData();
  form.append("model", file.model);
  
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
