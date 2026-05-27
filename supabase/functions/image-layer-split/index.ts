import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function verifyAuth(req: Request): Promise<{ userId: string } | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return { userId: data.user.id };
}

// Layer definitions per layer count. Each layer is extracted independently
// with a transparent background. Prompts are tuned for Gemini image edit.
function getLayerSpecs(numLayers: 2 | 3 | 4): Array<{ key: string; name: string; prompt: string }> {
  const TRANSPARENT_RULES = `Output a PNG with a FULLY TRANSPARENT background (alpha=0 everywhere except the target subject). Keep the EXACT pixel position, scale, perspective, lighting and proportions from the original image so the layer can be re-stacked perfectly. Do NOT redraw, restyle, recolor or relight. Do NOT add a new background. Do NOT add borders, frames, watermarks, text or signatures. Crisp anti-aliased alpha edges, no white halo, no checkerboard, no fringing.`;

  if (numLayers === 2) {
    return [
      {
        key: "subject",
        name: "Subject (Foreground)",
        prompt: `Extract ONLY the main foreground subject(s) (people, characters, primary objects) from the supplied image. Remove EVERYTHING else (scenery, sky, walls, floor, props that are clearly background). ${TRANSPARENT_RULES}`,
      },
      {
        key: "background",
        name: "Background",
        prompt: `Extract ONLY the background scenery from the supplied image (sky, walls, floor, distant scene). Remove all foreground subjects (people, characters, primary objects) and inpaint the area they occupied using the surrounding background, matching texture, color and lighting seamlessly. The output must show the full background as if no subject were ever present. ${TRANSPARENT_RULES.replace("FULLY TRANSPARENT background (alpha=0 everywhere except the target subject)", "fully opaque background plate filling the entire frame")}`,
      },
    ];
  }

  if (numLayers === 3) {
    return [
      {
        key: "person",
        name: "Person / Skin",
        prompt: `Extract ONLY the bare body / skin / face / hair of the main person(s) from the supplied image, as if they were nude (but keep modest with simple skin-tone underwear if needed). Remove ALL clothing, accessories, props and background. ${TRANSPARENT_RULES}`,
      },
      {
        key: "clothing",
        name: "Clothing & Accessories",
        prompt: `Extract ONLY the clothing, hats, glasses, jewelry, bags and accessories worn or held by the main person(s) from the supplied image, in their EXACT shape and position, as floating apparel. Remove the person's body and the background entirely. ${TRANSPARENT_RULES}`,
      },
      {
        key: "background",
        name: "Background",
        prompt: `Extract ONLY the background scenery (sky, walls, floor, distant scene). Inpaint the area occupied by the foreground subject(s) using the surrounding background, matching texture, color and lighting seamlessly. Output a full opaque background plate covering the entire frame. Do NOT add borders, frames, watermarks or text.`,
      },
    ];
  }

  // 4 layers (default)
  return [
    {
      key: "person",
      name: "Person / Skin",
      prompt: `Extract ONLY the bare body / skin / face / hair of the main person(s) from the supplied image, as if they were nude (but keep modest with simple skin-tone underwear if needed). Remove ALL clothing, accessories, props, shadows and background. ${TRANSPARENT_RULES}`,
    },
    {
      key: "clothing",
      name: "Clothing & Accessories",
      prompt: `Extract ONLY the clothing, hats, glasses, jewelry, bags and accessories worn or held by the main person(s) from the supplied image, in their EXACT shape and position, as floating apparel. Remove the person's body, shadows and the background entirely. ${TRANSPARENT_RULES}`,
    },
    {
      key: "shadow",
      name: "Shadow",
      prompt: `Extract ONLY the cast shadows and ambient occlusion produced by the foreground subject(s) onto the ground or walls. Output them as soft semi-transparent dark gray/black shapes in their EXACT original position. Remove the subject(s), the background scenery, and any non-shadow detail. ${TRANSPARENT_RULES}`,
    },
    {
      key: "background",
      name: "Background",
      prompt: `Extract ONLY the background scenery (sky, walls, floor, distant scene). Inpaint the area occupied by the foreground subject(s) and their shadows using the surrounding background, matching texture, color and lighting seamlessly. Output a full opaque background plate covering the entire frame. Do NOT add borders, frames, watermarks or text.`,
    },
  ];
}

const MAX_RETRIES = 3;
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

async function callAI(body: unknown, apiKey: string, attempt = 0): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90_000);
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (RETRYABLE_STATUSES.has(res.status) && attempt < MAX_RETRIES - 1) {
      await res.text();
      await new Promise((r) => setTimeout(r, Math.min(2000 * 2 ** attempt, 8000)));
      return callAI(body, apiKey, attempt + 1);
    }
    return res;
  } catch (err) {
    clearTimeout(timer);
    if (attempt < MAX_RETRIES - 1) {
      await new Promise((r) => setTimeout(r, Math.min(2000 * 2 ** attempt, 8000)));
      return callAI(body, apiKey, attempt + 1);
    }
    throw err;
  }
}

async function generateLayer(
  imageDataUrl: string,
  prompt: string,
  apiKey: string,
  fastMode: boolean,
  safetyCheck: boolean,
  seedHint: string,
): Promise<{ imageUrl?: string; refused?: boolean; error?: string }> {
  const safetyLine = safetyCheck
    ? "Respect safety guidelines: no nudity (skin layer stays modest), no copyrighted logos, no violence."
    : "";
  const seedLine = seedHint
    ? `Variation seed: ${seedHint} — keep deterministic geometry but allow tiny alpha-edge variation.`
    : "";

  const model = fastMode
    ? "google/gemini-2.5-flash-image"
    : "google/gemini-3.1-flash-image-preview";

  const body = {
    model,
    modalities: ["image", "text"],
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You are a professional image-layer extraction assistant. You MUST return an EDITED image, not text. The output must preserve original pixel alignment so users can re-stack layers in Canva/Photoshop/Figma. Always output PNG with an alpha channel.",
      },
      {
        role: "user",
        content: [
          { type: "image_url", image_url: { url: imageDataUrl } },
          { type: "text", text: `${prompt}\n\n${safetyLine}\n${seedLine}`.trim() },
        ],
      },
    ],
  };

  const res = await callAI(body, apiKey);
  if (!res.ok) {
    const txt = await res.text();
    return { error: `AI gateway ${res.status}: ${txt.slice(0, 200)}` };
  }
  const data = await res.json();
  const url = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url as string | undefined;
  const text = data?.choices?.[0]?.message?.content as string | undefined;
  if (!url) {
    const refused = typeof text === "string" && /can'?t|cannot|unable|policy|guideline/i.test(text);
    return { refused, error: refused ? "AI declined this layer" : "No image returned" };
  }
  return { imageUrl: url };
}

async function uploadIfDataUrl(
  dataUrl: string,
  userId: string,
  layerKey: string,
): Promise<string> {
  if (!dataUrl.startsWith("data:")) return dataUrl;
  const m = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!m) return dataUrl;
  const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
  const ext = m[1].split("/")[1].replace("jpeg", "jpg");
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const path = `${userId}/layers/${Date.now()}-${layerKey}-${crypto.randomUUID()}.${ext}`;
  const { error } = await admin.storage
    .from("generated-images")
    .upload(path, bytes, { contentType: m[1], upsert: false });
  if (error) {
    console.error("Layer upload failed, returning data URL:", error.message);
    return dataUrl;
  }
  const { data: pub } = admin.storage.from("generated-images").getPublicUrl(path);
  return pub.publicUrl;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = await verifyAuth(req);
  if (!auth) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const {
      image,
      numLayers = 4,
      format = "png",
      fastMode = false,
      safetyCheck = true,
      autoVariation = false,
      fixedSeed = false,
    } = await req.json();

    if (!image || typeof image !== "string" || !image.startsWith("data:image/")) {
      return new Response(JSON.stringify({ error: "Invalid image (expect base64 data URL)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const n = [2, 3, 4].includes(numLayers) ? (numLayers as 2 | 3 | 4) : 4;

    const specs = getLayerSpecs(n);
    const seedBase = fixedSeed ? "fixed-v1" : crypto.randomUUID().slice(0, 8);

    console.log(`image-layer-split: user=${auth.userId} layers=${n} fast=${fastMode}`);

    // Run layer extractions in parallel for speed
    const results = await Promise.all(
      specs.map(async (s) => {
        const seedHint = autoVariation ? `${seedBase}-${s.key}-${Math.floor(Math.random() * 9999)}` : seedBase;
        const r = await generateLayer(image, s.prompt, apiKey, fastMode, safetyCheck, seedHint);
        if (!r.imageUrl) {
          return { key: s.key, name: s.name, error: r.error || "Failed", refused: r.refused };
        }
        const url = await uploadIfDataUrl(r.imageUrl, auth.userId, s.key);
        return { key: s.key, name: s.name, url, format };
      }),
    );

    const successCount = results.filter((r) => "url" in r && r.url).length;
    if (successCount === 0) {
      return new Response(
        JSON.stringify({ error: "All layers failed. No points were charged.", layers: results }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ layers: results, totalLayers: n, successCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("image-layer-split error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
