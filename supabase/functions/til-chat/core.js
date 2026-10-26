// Prompts and helpers for the Sozdik chat Edge Function. Plain ESM so Deno (the function) and node --test (tests) both import it.
const OPENROUTER = "https://openrouter.ai/api/v1";

const BASE = "The learner is a Kazakh speaker learning English for IELTS and the school exit exam (ENT). Keep every reply under 80 words. Never write about school pupils' or parents' personal data.";
export const PERSONAS = {
  baymax: { name: "Baymax", system: `You are Baymax, a kind, encouraging English tutor. Chat in simple English (A2-B1). If the learner makes a mistake, repeat the corrected sentence once, gently, then keep talking and end with one easy question. If the learner writes in Kazakh, answer briefly in Kazakh and invite them to try in English. ${BASE}` },
  examiner: { name: "IELTS Examiner", system: `You are a strict, neutral IELTS Speaking examiner. Run the test as text: Part 1 (short personal questions), then Part 2 (one cue card, then ask them to speak for about 2 minutes by writing a long answer), then Part 3 (abstract follow-ups). Ask exactly ONE question per turn, never help, never praise, never correct during the test. After about 8 answers, stop and give feedback in Kazakh: an estimated band for Fluency and Coherence, Lexical Resource and Grammatical Range and Accuracy (say that Pronunciation cannot be judged from text), with one concrete tip each. ${BASE}` },
  native: { name: "Native Speaker", system: `You are a friendly native English speaker chatting casually. Use everyday spoken English: contractions, slang and idioms, but at most two per message. After an idiom or slang word put a short Kazakh explanation in square brackets. Stay on everyday topics and ask a question back. ${BASE}` },
  grammar: { name: "Grammar Guru", system: `You are Grammar Guru, a patient grammar teacher. Explain in simple Kazakh, with short English examples (and their Kazakh meaning). When the learner sends an English sentence, check it: say if it is right, name the tense or structure, fix mistakes and give one similar example. If they ask a question in Kazakh, answer it directly. ${BASE}` },
};

const ACTIONS = {
  translate: "Translate the text into natural, fluent Kazakh (not word for word). Output only the translation.",
  rule: "Analyse the English text for a learner. In Kazakh, list at most 5 short lines, one per grammar item: the tense or structure used, and why it is used there. No introduction.",
  explain: "Explain the English word or phrase in simple Kazakh: meaning, how it is used, and one short English example with its Kazakh translation.",
  hint: 'Suggest 3 different short replies (4-15 words) that the learner could say next in this English conversation: one simple, one longer, one that asks a question back. Output ONLY a JSON array of 3 strings, nothing else.',
};
export const isAction = (a) => Object.hasOwn(ACTIONS, a);

export const cleanText = (v, max = 1500) => String(v ?? "").trim().slice(0, max);

// Last 20 chat turns, only user/assistant roles with text.
export function cleanHistory(messages) {
  return (Array.isArray(messages) ? messages : [])
    .filter((m) => (m?.role === "user" || m?.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .map((m) => ({ role: m.role, content: cleanText(m.content, 1000) }))
    .slice(-20);
}

// Messages for one model call; null when the request is not valid.
export function buildMessages({ persona, action, text, messages }) {
  if (!action || action === "chat") {
    const p = PERSONAS[persona], history = cleanHistory(messages);
    return p && history.at(-1)?.role === "user" ? [{ role: "system", content: p.system }, ...history] : null;
  }
  if (!isAction(action)) return null;
  const t = cleanText(text);
  if (!t) return null;
  const context = action === "hint" ? cleanHistory(messages).slice(-6).map((m) => `${m.role === "user" ? "Learner" : "Partner"}: ${m.content}`).join("\n") : "";
  return [{ role: "system", content: ACTIONS[action] }, { role: "user", content: context ? `Conversation so far:\n${context}\n\nPartner's last message:\n${t}` : t }];
}

// "[...]" anywhere in the model's text -> 3 short strings, else null.
export function parseHints(text) {
  const m = String(text ?? "").match(/\[[\s\S]*\]/);
  if (!m) return null;
  try {
    const list = JSON.parse(m[0]);
    const out = Array.isArray(list) ? list.filter((s) => typeof s === "string" && s.trim() && s.length <= 160).map((s) => s.trim()).slice(0, 3) : [];
    return out.length >= 2 ? out : null;
  } catch { return null; }
}

export function buildChain(userModels, free) {
  const mine = (Array.isArray(userModels) ? userModels : []).map((m) => String(m).trim()).filter((m) => /^[\w.\-\/:~]{3,100}$/.test(m)).slice(0, 6);
  return [...new Set([...mine, ...free.slice(0, 6)])];
}

let freeCache = { at: 0, ids: [] };
export async function freeModels(fetcher = fetch) {
  if (freeCache.ids.length && Date.now() - freeCache.at < 3_600_000) return freeCache.ids;
  const res = await fetcher(`${OPENROUTER}/models`);
  const { data = [] } = await res.json().catch(() => ({}));
  const ids = data.filter((m) => String(m.id).endsWith(":free")).map((m) => String(m.id));
  freeCache = { at: Date.now(), ids };
  return ids;
}

// Tries the chain three models at a time; OpenRouter itself falls through the three. Throws the last error.
export async function callOpenRouter(key, chain, messages, fetcher = fetch) {
  let last = "no models configured";
  for (let i = 0; i < chain.length; i += 3) {
    const res = await fetcher(`${OPENROUTER}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Title": "Sozdik" },
      body: JSON.stringify({ models: chain.slice(i, i + 3), messages, max_tokens: 400 }),
    });
    const body = await res.json().catch(() => ({}));
    const content = String(body.choices?.[0]?.message?.content ?? "").trim();
    if (res.ok && content) return { content, model: String(body.model ?? "") };
    last = body.error?.message ?? `HTTP ${res.status}`;
  }
  throw new Error(last);
}
