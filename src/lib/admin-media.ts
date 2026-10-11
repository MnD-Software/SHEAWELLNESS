import { uploadMedia } from "./bulk-media";

export async function uploadAdminMedia(file: File) {
  if (file.size > 3 * 1024 * 1024) return (await uploadMedia(file)).url;
  const form = new FormData();
  form.set("file", file);
  const response = await fetch("/api/admin/upload", { method: "POST", body: form });
  const responseText = await response.text();
  let payload: { data?: { url?: unknown }; error?: unknown } = {};

  try {
    payload = responseText ? JSON.parse(responseText) as { data?: { url?: unknown }; error?: unknown } : {};
  } catch {
    // The HTTP status remains useful if a proxy returns a non-JSON error page.
  }

  const errorMessage = typeof payload.error === "string" ? payload.error : "Unable to upload media.";
  const url = typeof payload.data?.url === "string" ? payload.data.url : null;
  if (!response.ok || !url) throw new Error(errorMessage);
  return url;
}
