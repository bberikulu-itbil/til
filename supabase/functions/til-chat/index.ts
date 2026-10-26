// Sozdik chat: persona chat, translate, grammar rule, word explanation, reply hints. Deploy: Supabase → Edge Functions (verify_jwt on).
import { createClient } from "npm:@supabase/supabase-js@2.117.2";
import { buildChain, buildMessages, callOpenRouter, freeModels, parseHints } from "./core.js";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  // Same owner gate as the Hub assistant: the model key is the owner's, so nobody else may spend it.
  const publishable = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") ?? "{}").default ?? Deno.env.get("SUPABASE_ANON_KEY");
  const db = createClient(Deno.env.get("SUPABASE_URL")!, publishable, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    auth: { persistSession: false },
  });
  const { data: owner } = await db.rpc("is_hub_owner");
  if (owner !== true) return json({ error: "Бұл чат тек иесіне ашық." }, 403);

  const key = Deno.env.get("OPENROUTER_API_KEY");
  if (!key) return json({ error: "OpenRouter кілті әлі қосылмаған: Supabase → Edge Functions → Secrets бөліміне OPENROUTER_API_KEY қос." }, 500);

  const body = (await req.json().catch(() => null)) ?? {};
  const messages = buildMessages(body);
  if (!messages) return json({ error: "Сұраныс дұрыс емес не хабарлама бос." }, 400);

  try {
    const chain = buildChain(body.models, await freeModels().catch(() => []));
    const { content, model } = await callOpenRouter(key, chain, messages);
    if (body.action !== "hint") return json({ reply: content, model });
    const hints = parseHints(content);
    return hints ? json({ hints, model }) : json({ error: "Модель кеңестерді дұрыс бермеді, қайта көр." }, 502);
  } catch (e) {
    return json({ error: `Модельдер жауап бермеді: ${(e as Error).message}` }, 502);
  }
});
