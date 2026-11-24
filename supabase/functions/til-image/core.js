// Helpers for the Sozdik word-picture Edge Function. Plain ESM so Deno and node --test both import it.
export const IMAGE_MODEL = "black-forest-labs/flux.2-klein-4b"; // ~$0.014 per image; override with the TIL_IMAGE_MODEL secret

// Request body -> clean { word, pos, en } or null.
export function parseRequest(body) {
  const word = String(body?.word ?? "").trim();
  if (!/^[A-Za-z]+(?:['’ -][A-Za-z]+){0,3}$/.test(word) || word.length > 40) return null;
  const clean = (v, max) => String(v ?? "").trim().slice(0, max);
  return { word, pos: clean(body.pos, 20), en: clean(body.en, 160) };
}

export const imagePrompt = ({ word, pos, en }) =>
  `A simple, friendly flat illustration that helps a learner remember the English word "${word}"${pos ? ` (${pos})` : ""}${en ? `, meaning: ${en}` : ""}. Soft colors, one clear subject, plain background. No text, no letters, no logos.`;

const EXT = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
// OpenRouter /images response -> { bytes, type, ext } or null.
export function parseImage(res) {
  const item = res?.data?.[0], type = String(item?.media_type ?? "image/png");
  if (typeof item?.b64_json !== "string" || !EXT[type]) return null;
  try {
    const bytes = Uint8Array.from(atob(item.b64_json), (c) => c.charCodeAt(0));
    return bytes.length > 1000 && bytes.length <= 5_000_000 ? { bytes, type, ext: EXT[type] } : null;
  } catch { return null; }
}
