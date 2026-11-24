// Sozdik word pictures: generates one illustration with OpenRouter, stores it in the public `til-images` bucket, returns its URL.
// Deploy: Supabase → Edge Functions (verify_jwt on). Needs the OPENROUTER_API_KEY secret; optional TIL_IMAGE_MODEL.
import { createClient } from "npm:@supabase/supabase-js@2.117.2";
import { IMAGE_MODEL, imagePrompt, parseImage, parseRequest } from "./core.js";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  // Owner gate: the image costs money from the owner's OpenRouter key.
  const publishable = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") ?? "{}").default ?? Deno.env.get("SUPABASE_ANON_KEY");
  const db = createClient(Deno.env.get("SUPABASE_URL")!, publishable, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    auth: { persistSession: false },
  });
  const { data: owner } = await db.rpc("is_hub_owner");
  if (owner !== true) return json({ error: "Бұл функция тек иесіне ашық." }, 403);

  const key = Deno.env.get("OPENROUTER_API_KEY");
  if (!key) return json({ error: "OpenRouter кілті әлі қосылмаған: Supabase → Edge Functions → Secrets бөліміне OPENROUTER_API_KEY қос." }, 500);

  const ask = parseRequest(await req.json().catch(() => null));
  if (!ask) return json({ error: "Сөз дұрыс емес." }, 400);

  try {
    const res = await fetch("https://openrouter.ai/api/v1/images", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Title": "Sozdik" },
      body: JSON.stringify({ model: Deno.env.get("TIL_IMAGE_MODEL") || IMAGE_MODEL, prompt: imagePrompt(ask), aspect_ratio: "1:1" }),
    });
    const body = await res.json().catch(() => ({}));
    const img = res.ok ? parseImage(body) : null;
    if (!img) return json({ error: `Сурет жасалмады: ${body?.error?.message ?? `HTTP ${res.status}`}` }, 502);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const path = `${crypto.randomUUID()}.${img.ext}`;
    const up = await admin.storage.from("til-images").upload(path, img.bytes, { contentType: img.type });
    if (up.error) return json({ error: `Сурет сақталмады: ${up.error.message}` }, 502);
    return json({ url: admin.storage.from("til-images").getPublicUrl(path).data.publicUrl });
  } catch (e) {
    return json({ error: `Сурет жасалмады: ${(e as Error).message}` }, 502);
  }
});
