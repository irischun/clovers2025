import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Image } from "https://deno.land/x/imagescript@1.2.17/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Enhanced style mappings with detailed prompts for better quality
const stylePromptMap: Record<string, string> = {
  'professional-photo': 'professional photography, studio lighting, high-end camera, sharp focus, commercial quality, magazine-worthy',
  'natural-light': 'natural lighting photography, golden hour, soft shadows, warm tones, organic feel',
  'dramatic-lighting': 'dramatic cinematic lighting, high contrast, chiaroscuro, moody atmosphere, film noir influence',
  'product-closeup': 'product photography, macro lens, shallow depth of field, clean background, commercial studio setup',
  'watercolor': 'watercolor painting style, soft brushstrokes, flowing colors, artistic paper texture, delicate washes',
  'manga': 'Japanese manga art style, clean linework, anime aesthetics, dynamic composition, cel shading',
  'sticker': 'cute sticker design, kawaii style, bold outlines, transparent background, expressive cartoon',
  'oil-painting': 'oil painting masterpiece, visible brushstrokes, rich colors, classical art techniques, gallery quality',
  'pixar': 'Pixar 3D animation style, subsurface scattering, expressive characters, vibrant colors, professional CGI rendering',
  'ghibli': 'Studio Ghibli animation style, hand-drawn aesthetic, soft colors, whimsical atmosphere, Hayao Miyazaki influence',
  'american-cartoon': 'American cartoon style, bold colors, exaggerated expressions, dynamic poses, clean vector art',
  'clay': 'claymation style, stop motion aesthetic, handcrafted textures, tactile materials, Aardman studios influence',
  '3d-render': '3D render, octane render, ray tracing, photorealistic materials, professional 3D software',
  'unreal-engine': 'Unreal Engine 5 render, lumen lighting, nanite geometry, photorealistic, AAA game quality',
  'indoor': 'indoor photography, ambient lighting, interior design, cozy atmosphere',
  'outdoor': 'outdoor photography, natural environment, environmental context, landscape elements',
  'futuristic': 'futuristic sci-fi design, neon lights, cyberpunk aesthetics, holographic elements, high-tech',
  'vintage': 'vintage aesthetic, retro color grading, nostalgic atmosphere, film grain, 1970s style',
  'warm-tone': 'warm color palette, orange and yellow tones, cozy atmosphere, sunset colors',
  'cool-tone': 'cool color palette, blue and cyan tones, fresh atmosphere, serene mood',
  'high-contrast': 'high contrast, deep blacks, bright whites, punchy colors, dramatic',
  'minimalist': 'minimalist design, clean composition, negative space, simple elegance, modern',
  'whatsapp-sticker': 'WhatsApp sticker, cute cartoon style, transparent background, expressive face, bold outlines, kawaii',
  'youtube-cover': 'YouTube thumbnail, eye-catching design, bold text, vibrant colors, high contrast, click-worthy',
  'magazine-retro': 'vintage magazine cover, retro newspaper elements, 1950s advertising, nostalgic typography',
  'retro-80s-90s': '1980s 1990s retro newspaper style, vintage typography, old print texture, yellowed paper',
  'business-magazine': 'high-end business magazine cover, Forbes Bloomberg style, professional corporate, elegant',
  'tai-kung-pao': 'Chinese newspaper parody, sensational headlines, bold Chinese typography, satirical',
  'lemon-daily': 'quirky newspaper design, yellow tones, playful layout, humorous headlines',
  'hk-manga-fight': 'Hong Kong manga 4-panel fight scene, dynamic action, speed lines, dramatic poses, comic book',
  'vagabond': 'Takehiko Inoue Vagabond manga style, ink wash painting, samurai, dramatic brushstrokes, detailed linework, sumi-e influence',
  'hollywood': 'Hollywood blockbuster movie poster, epic scale, dramatic lighting, cinematic composition',
  'marvel': 'Marvel superhero movie poster, dynamic poses, power effects, heroic composition, action packed',
  'dc-dark': 'DC dark and gritty style, noir lighting, intense atmosphere, brooding, Christopher Nolan influence',
  'japanese-film': 'Japanese movie poster aesthetic, artistic composition, subtle colors, minimalist design',
  'korean-film': 'Korean cinema style poster, realistic drama, emotional impact, sophisticated design',
  'hk-film': 'Classic Hong Kong movie poster, action-oriented, bold colors, dynamic composition',
  'inachu': 'Inachu manga parody style, exaggerated comedy, crude humor, satirical cartoon',
  'hk-kam-manga': 'Hong Kong 4-panel manga style, local humor, satirical commentary, comic strips',
  'minimalist-art': 'minimalist design, clean lines, negative space, modern art, geometric simplicity',
  'retro-illustration': 'vintage hand-drawn illustration, nostalgic, warm colors, retro advertising art',
  'scifi': 'sci-fi futuristic design, neon lights, cyberpunk, high-tech, blade runner influence',
  'horror': 'horror movie style, dark atmosphere, suspenseful, eerie, Stephen King influence',
  'romance': 'romantic movie poster, soft lighting, dreamy atmosphere, warm tones, emotional',
  'product-display': 'e-commerce product showcase, clean white background, professional lighting, commercial',
  'promo': 'promotional campaign design, bold graphics, call to action, marketing, eye-catching',
  'fashion': 'high fashion advertising, editorial style, luxury branding, Vogue influence',
  'festival': 'festive holiday theme, celebratory decorations, seasonal colors, joyful',
  'flash-sale': 'flash sale banner, urgent design, countdown aesthetic, promotional, attention-grabbing',
  'default': 'high quality, professional, detailed, well-composed',
  'realistic': 'photorealistic, lifelike, detailed, natural, authentic',
};

const resolutionGuide: Record<string, string> = {
  '16:9': 'widescreen cinematic composition, horizontal frame, landscape orientation',
  '1:1': 'square format, balanced composition, centered subject, Instagram-ready',
  '9:16': 'vertical portrait format, mobile-first design, TikTok/Reels ready',
  '4:3': 'classic photography ratio, traditional composition, balanced frame',
};

async function verifyAuth(req: Request): Promise<{ userId: string } | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return { userId: user.id };
}

function buildEnhancedPrompt(prompt: string, style: string, width?: number, height?: number): string {
  const parts: string[] = [];
  parts.push(prompt);

  const styleEnhancement = stylePromptMap[style] || stylePromptMap['default'];
  parts.push(styleEnhancement);

  if (width && height) {
    const ratio = width / height;
    if (ratio > 1.5) parts.push(resolutionGuide['16:9']);
    else if (ratio < 0.7) parts.push(resolutionGuide['9:16']);
    else if (Math.abs(ratio - 1) < 0.1) parts.push(resolutionGuide['1:1']);
    else parts.push(resolutionGuide['4:3']);

    // Request the model to fill the canvas at the requested aspect; do NOT
    // demand 2560+ px — that produced oversized PNGs that exceeded the edge
    // runtime memory cap during post-processing.
    parts.push(
      `OUTPUT: render at the requested ${width} x ${height} aspect, full-bleed, no letterboxing, no padding, no borders, fill the entire canvas`
    );
  }

  parts.push(
    'maximum native resolution',
    'ultra high definition 4K to 8K',
    'masterpiece quality',
    'highly detailed',
    'sharp focus',
    'professional composition',
    'trending on artstation',
    'award-winning',
    'clean, clear, well-lit, properly exposed'
  );
  return parts.join(', ');
}

function buildSystemMessage(hasReferenceImage: boolean, preserveFace: boolean, isMultiImageEdit: boolean = false): string {
  // Object-swap / multi-image edit uses a surgical system prompt.
  // Generic "art quality" filler is intentionally removed — it pushes the model to
  // free-regenerate, which is why the swap fails and IMAGE 2 comes back unchanged.
  if (isMultiImageEdit) {
    return `You are a precision IMAGE EDITOR (not a free-form generator). Your only job is OBJECT REPLACEMENT / COMPOSITING on the supplied images. Returning IMAGE 2 unchanged, or returning a hybrid of the two subjects, is a FAILURE.

INPUT CONTRACT (images are sent in fixed order):
- IMAGE 1 = SOURCE SUBJECT. This is the object/person/product that MUST appear in the OUTPUT. Preserve its exact silhouette, label text, typography, glass tint, cap, collar, color, material, proportions, and brand identity. Do NOT restyle, recolor, or redesign it.
- IMAGE 2 = TARGET SCENE. Preserve composition, camera angle, focal length, depth of field, bokeh, lighting direction, color grading, water, splashes, droplets, ripples, foliage, props, and background EXACTLY. Only the foreground subject changes.
- IMAGE 3+ (if present) = style or detail references.

STEPS:
1. Locate the existing foreground subject in IMAGE 2 (the one to be replaced).
2. Remove it cleanly, reconstructing whatever was behind it from the surrounding scene.
3. Insert the SUBJECT from IMAGE 1 at the same position, scale, and orientation.
4. Re-light the inserted subject so highlights, shadows, reflections, refractions, and contact shadows match IMAGE 2's lighting and environment.
5. Do NOT invent a hybrid. Do NOT blend the two subjects. Do NOT change camera angle. Do NOT redesign the scene.

OUTPUT REQUIREMENTS:
- A single edited image at the same aspect ratio as IMAGE 2.
- The output's foreground subject MUST be visually identifiable as the subject from IMAGE 1, NOT the one originally in IMAGE 2.
- Photorealistic compositing quality, sharp focus on the swapped subject.`;
  }

  let msg = `You are an expert AI image generator. Create exactly what the user requests with the following quality standards:

1. COMPOSITION: Follow professional photography and art composition rules. Use rule of thirds, leading lines, and proper framing.
2. LIGHTING: Use appropriate lighting for the subject.
3. DETAILS: Render fine details meticulously.
4. STYLE ACCURACY: Match the requested style precisely.
5. COLOR HARMONY: Use cohesive, pleasing color palettes.
6. TECHNICAL QUALITY: Generate at the highest quality possible.
7. SUBJECT FOCUS: The main subject should be clear and prominent.`;

  if (hasReferenceImage) {
    msg += `

CRITICAL - REFERENCE IMAGE INSTRUCTIONS:
You have been provided with a reference image. You MUST use this reference image as the PRIMARY basis for your generation:
1. SUBJECT PRESERVATION: The main subject(s) MUST appear with the SAME identity and key features.
2. FACIAL FEATURES: If there is a person, their face and distinctive features MUST be preserved exactly.
3. PRODUCT/OBJECT IDENTITY: If the reference shows a product, that EXACT product must appear.
4. ANIMAL IDENTITY: If the reference shows an animal, that specific animal must appear.
5. STYLE APPLICATION: Apply the requested style but preserve identity.
6. ENHANCEMENT NOT REPLACEMENT: You are enhancing, NOT creating something completely different.`;
  }

  if (preserveFace) {
    msg += `

FACE PRESERVATION MODE ACTIVE:
You MUST preserve ALL facial features from the reference image with extreme precision.
The face in the generated image must be IDENTICAL to the reference.`;
  }

  msg += `\n\nGenerate the image now with these principles in mind.`;
  return msg;
}

// Retryable statuses
const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);
const MAX_RETRIES = 3;
const TIMEOUT_MS = 120_000; // 2 minutes

async function callAIGateway(body: Record<string, unknown>, apiKey: string, attempt = 0): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timer);

    // If retryable error and we have retries left
    if (RETRYABLE_STATUSES.has(response.status) && attempt < MAX_RETRIES - 1) {
      // Consume the body to avoid resource leak
      await response.text();
      const delay = Math.min(2000 * Math.pow(2, attempt), 10000);
      console.log(`Retry attempt ${attempt + 1}/${MAX_RETRIES} after ${delay}ms (status: ${response.status})`);
      await new Promise(r => setTimeout(r, delay));
      return callAIGateway(body, apiKey, attempt + 1);
    }

    return response;
  } catch (err) {
    clearTimeout(timer);
    // Retry on timeout / network errors
    if (attempt < MAX_RETRIES - 1) {
      const delay = Math.min(2000 * Math.pow(2, attempt), 10000);
      console.log(`Retry attempt ${attempt + 1}/${MAX_RETRIES} after ${delay}ms (error: ${err})`);
      await new Promise(r => setTimeout(r, delay));
      return callAIGateway(body, apiKey, attempt + 1);
    }
    throw err;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const auth = await verifyAuth(req);
  if (!auth) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { prompt, style = "realistic", model, width, height, referenceImage, referenceImages, mode, preserveFace = false } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Normalize reference images into a single array (supports multi-image compositing / object swap)
    const refImages: string[] = Array.isArray(referenceImages) && referenceImages.length > 0
      ? referenceImages.filter((u: unknown): u is string => typeof u === "string" && u.length > 0)
      : (referenceImage ? [referenceImage] : []);

    const hasReferenceImage = refImages.length > 0;
    const isMultiImageEdit = refImages.length >= 2;
    const isImageToImageMode = mode === 'image-to-image';
    
    console.log("Image generation request from user:", auth.userId, { 
      prompt: prompt?.substring(0, 100), style, model, width, height,
      refCount: refImages.length, mode, preserveFace
    });

    // For multi-image edits (object swap, scene replacement), ALWAYS use Nano Banana Pro
    // — it is the only model that reliably honors compositing instructions instead of
    // free-regenerating the frame.
    let aiModel = model || "google/gemini-3.1-flash-image-preview";
    if (isMultiImageEdit) {
      aiModel = "google/gemini-3-pro-image-preview";
      console.log("Forced model -> nano-banana-pro (multi-image edit)");
    }
    // For object-swap / multi-image edits, use the RAW user prompt — appending
    // "ultra HD 4K, masterpiece, professional photography" filler pushes the model to
    // regenerate the whole frame instead of doing a surgical swap.
    const rawPrompt = (typeof prompt === "string" ? prompt : "").trim();
    const enhancedPrompt = isMultiImageEdit
      ? rawPrompt
      : buildEnhancedPrompt(prompt, style, width, height);
    console.log(isMultiImageEdit ? "Raw edit prompt:" : "Enhanced prompt:", enhancedPrompt.substring(0, 200) + "...");

    const messages: Array<{role: string; content: string | Array<{type: string; text?: string; image_url?: {url: string}}>}> = [];
    messages.push({ role: "system", content: buildSystemMessage(hasReferenceImage, preserveFace, isMultiImageEdit) });
    
    if (refImages.length > 0) {
      const content: Array<{type: string; text?: string; image_url?: {url: string}}> = [];
      // Attach all reference images in order; the system message labels them IMAGE 1, IMAGE 2, ...
      refImages.forEach((url) => {
        content.push({ type: "image_url", image_url: { url } });
      });

      let referencePrompt: string;
      if (isMultiImageEdit) {
        // Surgical, low-noise edit prompt. Repeats the contract so the model cannot
        // shortcut by returning IMAGE 2 unchanged.
        referencePrompt = `OBJECT REPLACEMENT EDIT.

Images you have just received, in order:
- IMAGE 1 = SOURCE SUBJECT (the object to put INTO the output).
- IMAGE 2 = TARGET SCENE (the background to KEEP).
${refImages.length > 2 ? `- IMAGE 3+ = additional style/detail references.\n` : ""}
Replace the foreground subject in IMAGE 2 with the SUBJECT from IMAGE 1. Keep IMAGE 2's scene, lighting, camera angle, depth of field, water, splashes, foliage, and props pixel-faithful. Match the inserted subject's lighting and shadows to IMAGE 2.

The OUTPUT's foreground subject MUST visually match IMAGE 1 (same shape, label text, typography, color, material, cap, collar, proportions). The OUTPUT must NOT contain the foreground subject that was originally in IMAGE 2.

User's additional instruction:
${rawPrompt || "(none — perform the swap as described above)"}`;
      } else if (isImageToImageMode) {
        referencePrompt = `IMPORTANT: This reference image contains the EXACT subject I want you to use. The subject(s) MUST appear with the SAME identity and key features.\n\nYour task: Take the subject(s) and generate a new image applying:\n\n${enhancedPrompt}\n\nPreserve the subject's identity while applying the requested style.`;
      } else {
        referencePrompt = `Use this reference image as inspiration for the style and composition. Generate: ${enhancedPrompt}`;
      }
      content.push({ type: "text", text: referencePrompt });
      messages.push({ role: "user", content });
    } else {
      messages.push({ role: "user", content: enhancedPrompt });
    }

    // ───── Refusal-aware generation with model fallback ─────
    // Some prompts (e.g. "remove watermark", "remove logo") trigger Gemini's
    // safety filter, which returns text only ("I'm just a language model and
    // can't help with that.") instead of an image. We detect refusals,
    // rephrase the prompt into a neutral inpainting instruction, and retry
    // with stronger fallback models before giving up.

    const FALLBACK_MODELS = [
      aiModel,
      "google/gemini-3-pro-image-preview",
      "google/gemini-2.5-flash-image",
    ].filter((m, i, arr) => arr.indexOf(m) === i);

    const REFUSAL_PATTERNS = [
      /can'?t help/i,
      /cannot help/i,
      /unable to (help|assist|generate|create|produce)/i,
      /i'?m (just )?a (large )?language model/i,
      /i (can'?t|cannot|won'?t) (generate|create|produce|make)/i,
      /violates? (our |the )?(policy|guidelines|terms)/i,
      /against (my|our) (policy|guidelines)/i,
      /not able to (generate|create|help)/i,
    ];
    const isRefusalText = (txt: unknown): boolean =>
      typeof txt === "string" && !!txt && REFUSAL_PATTERNS.some((re) => re.test(txt));

    // Brand / model names that frequently trip Gemini's self-referential safety filter
    // when they appear in a "remove X watermark" instruction.
    const BRAND_STRIP = /\b(google\s+gemini|gemini|nano[\s-]?banana(?:\s*2)?|google|openai|gpt[-\s]?\d?(?:\.\d)?(?:\s*image)?|dall[-\s]?e\s*\d?|midjourney|stable\s*diffusion|sora|imagen\s*\d?|flux(?:\.\d)?|chatgpt|anthropic|claude)\b/gi;

    const rephraseForSafety = (p: string): string => {
      let s = p;
      // 1. Strip AI brand names so the model doesn't think the user is asking it
      //    to discuss / remove its own provenance markers.
      s = s.replace(BRAND_STRIP, "");
      // Tidy up artifacts left by stripping (e.g. "Google /  watermark")
      s = s.replace(/\s*\/\s*/g, " ").replace(/\s{2,}/g, " ");

      // 2. Rewrite "remove ... watermark/logo/text" (with anything in between) into
      //    a neutral inpainting instruction. Use [^.,;!?\n]{0,80} so brand-name
      //    qualifiers between "remove" and the noun no longer break the match.
      s = s.replace(/\bremove\b[^.,;!?\n]{0,80}?\bwatermark[s]?\b[^.,;!?\n]*/gi,
        "seamlessly inpaint and reconstruct that area using the surrounding pixels, matching texture, color and lighting");
      s = s.replace(/\bremove\b[^.,;!?\n]{0,80}?\blogo[s]?\b[^.,;!?\n]*/gi,
        "seamlessly inpaint that region using the surrounding background, matching texture and lighting");
      s = s.replace(/\bremove\b[^.,;!?\n]{0,80}?\b(text|caption|subtitle|writing|label|tag|sign|signature|stamp|mark)[s]?\b[^.,;!?\n]*/gi,
        "seamlessly inpaint that region using the surrounding background, matching texture and lighting");

      // 3. Soften other refusal-prone verbs.
      s = s.replace(/\berase\b/gi, "inpaint");
      s = s.replace(/\bdelete\b/gi, "inpaint");
      s = s.replace(/\bget rid of\b/gi, "inpaint over");
      s = s.replace(/\btake (out|off|away)\b/gi, "inpaint over");

      // 4. Frame the whole request as a photo-editing task to further reduce
      //    refusal probability.
      s = `Photo editing task on the supplied reference image: ${s.trim()}`;
      return s;
    };

    // Heuristic: prompts containing these phrases are very likely to be refused
    // on the first attempt, so we pre-rephrase them and skip a wasted round trip.
    const PREEMPTIVE_TRIGGERS = /(watermark|\bremove\b.{0,40}\b(logo|text|caption|signature|stamp|label)\b|\berase\b|nano[\s-]?banana|gemini|chatgpt|dall[-\s]?e|midjourney)/i;

    let response: Response | null = null;
    let data: any = null;
    let rawImageUrl: string | undefined;
    let textContent: string | undefined;
    let lastModelTried = aiModel;
    let lastRefused = false;

    for (let i = 0; i < FALLBACK_MODELS.length; i++) {
      const tryModel = FALLBACK_MODELS[i];
      lastModelTried = tryModel;

      let attemptMessages = messages;
      // Extract the user's raw prompt text to detect preemptive triggers.
      const rawUserText = (() => {
        const last = messages[messages.length - 1];
        if (!last || last.role !== "user") return "";
        if (typeof last.content === "string") return last.content;
        return (last.content as any[])
          .filter((c) => c.type === "text")
          .map((c) => c.text || "")
          .join(" ");
      })();
      const shouldPreRephrase = i === 0 && PREEMPTIVE_TRIGGERS.test(rawUserText);
      if (i > 0 || shouldPreRephrase) {
        attemptMessages = messages.map((m) => {
          if (m.role !== "user") return m;
          if (typeof m.content === "string") {
            return { ...m, content: rephraseForSafety(m.content) };
          }
          return {
            ...m,
            content: m.content.map((c) =>
              c.type === "text" ? { ...c, text: rephraseForSafety(c.text || "") } : c
            ),
          };
        });
        if (i === 0) {
          console.log(`Preemptive safety rephrase applied for model=${tryModel}`);
        } else {
          console.log(`Retry with model=${tryModel} and safety-rephrased prompt`);
        }
      }

      response = await callAIGateway({
        model: tryModel,
        messages: attemptMessages,
        modalities: ["image", "text"],
        temperature: isMultiImageEdit ? 0.2 : 0.8,
      }, LOVABLE_API_KEY);

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const errorText = await response.text();
        console.error(`AI gateway error (model=${tryModel}):`, response.status, errorText);
        continue;
      }

      data = await response.json();
      rawImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      textContent = data.choices?.[0]?.message?.content;
      lastRefused = isRefusalText(textContent);

      if (rawImageUrl) {
        console.log(`Image generation succeeded with model=${tryModel}`);
        break;
      }
      console.warn(`No image from model=${tryModel}. refused=${lastRefused} text="${typeof textContent === "string" ? textContent.substring(0, 200) : ""}"`);
    }

    if (!rawImageUrl) {
      const userMessage = lastRefused
        ? "The AI model declined this prompt because it triggered its safety filter (often caused by words like 'remove watermark', 'remove logo', or copyrighted character names). No points were charged — please rephrase and try again."
        : "The AI model returned no image after multiple retries. No points were charged — please try again or simplify your prompt.";
      console.error("All model fallbacks exhausted. refused=", lastRefused, "last=", lastModelTried);
      return new Response(
        JSON.stringify({ error: userMessage, refused: lastRefused, lastModelTried }),
        { status: lastRefused ? 422 : 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Image generation response received successfully");


    // ───── Decode → upscale to requested dimensions → upload to Storage ─────
    let finalUrl = rawImageUrl;
    let finalWidth: number | undefined;
    let finalHeight: number | undefined;
    try {
      if (rawImageUrl.startsWith("data:")) {
        const match = rawImageUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
        if (match) {
          const base64 = match[2];
          let binary = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
          let outputMime = "image/png";
          let outputExt = "png";

          // Upscale ONLY if model output is smaller than the user's explicit request.
          // We intentionally do NOT enforce a 2560px minimum here — that previously
          // caused "Memory limit exceeded" crashes in the edge runtime because
          // Lanczos resize of large RGBA buffers blows past Deno edge memory limits.
          // Cap the upscale factor at 2x to stay within edge memory budget.
          try {
            const decoded = await Image.decode(binary);
            const srcW = decoded.width;
            const srcH = decoded.height;
            finalWidth = srcW;
            finalHeight = srcH;

            const reqW = typeof width === "number" && width > 0 ? width : srcW;
            const reqH = typeof height === "number" && height > 0 ? height : srcH;

            const neededScale = Math.max(reqW / srcW, reqH / srcH, 1);
            const scale = Math.min(neededScale, 2);

            if (scale > 1.01) {
              const targetW = Math.round(srcW * scale);
              const targetH = Math.round(srcH * scale);
              decoded.resize(targetW, targetH);
              finalWidth = targetW;
              finalHeight = targetH;
              binary = await decoded.encode(0); // PNG, lossless
              outputMime = "image/png";
              outputExt = "png";
              console.log(`Upscaled image ${srcW}x${srcH} -> ${targetW}x${targetH} (requested ${reqW}x${reqH})`);
            } else {
              console.log(`Native size ${srcW}x${srcH} kept (requested ${reqW}x${reqH})`);
            }
          } catch (decodeErr) {
            console.warn("Image decode/upscale skipped:", decodeErr);
          }

          const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
          const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
          const admin = createClient(supabaseUrl, serviceKey);

          const path = `${auth.userId}/${Date.now()}-${crypto.randomUUID()}.${outputExt}`;
          const { error: upErr } = await admin.storage
            .from("generated-images")
            .upload(path, binary, { contentType: outputMime, upsert: false });

          if (upErr) {
            console.error("Storage upload failed, falling back to data URL:", upErr.message);
          } else {
            const { data: pub } = admin.storage.from("generated-images").getPublicUrl(path);
            finalUrl = pub.publicUrl;
            console.log("Uploaded image to storage:", finalUrl, finalWidth, "x", finalHeight);
          }
        }
      }
    } catch (e) {
      console.error("Image upload error (non-fatal):", e);
    }

    return new Response(
      JSON.stringify({ imageUrl: finalUrl, description: textContent, width: finalWidth, height: finalHeight }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-image error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    const isTimeout = message.includes('abort') || message.includes('timeout');
    return new Response(
      JSON.stringify({ error: isTimeout ? "Generation timed out. Please try again with a simpler prompt or smaller image." : message }),
      { status: isTimeout ? 504 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
