// Client-side chat helpers. A slash command is "/translate", "/grammar" or "/explain" optionally followed by text;
// without text it applies to the partner's last message (the caller fills that in).
export const SLASH = { "/translate": "translate", "/grammar": "rule", "/explain": "explain" };
export function parseSlash(input) {
  const m = String(input).trim().match(/^(\/\S+)(?:\s+([\s\S]*))?$/);
  if (!m) return null;
  const action = SLASH[m[1].toLowerCase()];
  return action ? { action, text: (m[2] ?? "").trim() } : { error: `Белгісіз команда: ${m[1]}. Бар командалар: ${Object.keys(SLASH).join(", ")}` };
}
