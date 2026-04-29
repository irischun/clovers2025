import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Explicit dimensional directive — many image models honor explicit pixel targets in the prompt.
    parts.push(
      `OUTPUT DIMENSIONS: render at exactly ${width} x ${height} pixels (width x height), full-bleed, no letterboxing, no padding, no borders, fill the entire ${width}x${height} canvas`
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

function buildSystemMessage(hasReferenceImage: boolean, preserveFace: boolean): string {
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
    const { prompt, style = "realistic", model, width, height, referenceImage, mode, preserveFace = false } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const hasReferenceImage = !!referenceImage;
    const isImageToImageMode = mode === 'image-to-image';
    
    console.log("Image generation request from user:", auth.userId, { 
      prompt: prompt?.substring(0, 100), style, model, width, height,
      hasReference: hasReferenceImage, mode, preserveFace
    });

    const aiModel = model || "google/gemini-3.1-flash-image-preview";
    const enhancedPrompt = buildEnhancedPrompt(prompt, style, width, height);
    console.log("Enhanced prompt:", enhancedPrompt.substring(0, 200) + "...");

    const messages: Array<{role: string; content: string | Array<{type: string; text?: string; image_url?: {url: string}}>}> = [];
    messages.push({ role: "system", content: buildSystemMessage(hasReferenceImage, preserveFace) });
    
    if (referenceImage) {
      let referencePrompt: string;
      if (isImageToImageMode) {
        referencePrompt = `IMPORTANT: This reference image contains the EXACT subject I want you to use. The subject(s) MUST appear with the SAME identity and key features.\n\nYour task: Take the subject(s) and generate a new image applying:\n\n${enhancedPrompt}\n\nPreserve the subject's identity while applying the requested style.`;
      } else {
        referencePrompt = `Use this reference image as inspiration for the style and composition. Generate: ${enhancedPrompt}`;
      }
      messages.push({
        role: "user",
        content: [
          { type: "image_url", image_url: { url: referenceImage } },
          { type: "text", text: referencePrompt }
        ]
      });
    } else {
      messages.push({ role: "user", content: enhancedPrompt });
    }

    const response = await callAIGateway({
      model: aiModel,
      messages,
      modalities: ["image", "text"],
      temperature: 0.8,
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
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Image generation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    console.log("Image generation response received successfully");
    
    const rawImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const textContent = data.choices?.[0]?.message?.content;

    if (!rawImageUrl) {
      console.error("No image URL in response:", JSON.stringify(data).substring(0, 500));
      return new Response(
        JSON.stringify({ error: "No image generated. The AI model returned text only. Please try again or use a different model." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ───── Upload base64 to Storage so DB only holds a small URL (massive perf win) ─────
    let finalUrl = rawImageUrl;
    try {
      if (rawImageUrl.startsWith("data:")) {
        const match = rawImageUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
        if (match) {
          const mimeType = match[1];
          const ext = mimeType.split("/")[1].split("+")[0] || "png";
          const base64 = match[2];
          const binary = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

          const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
          const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
          const admin = createClient(supabaseUrl, serviceKey);

          const path = `${auth.userId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
          const { error: upErr } = await admin.storage
            .from("generated-images")
            .upload(path, binary, { contentType: mimeType, upsert: false });

          if (upErr) {
            console.error("Storage upload failed, falling back to data URL:", upErr.message);
          } else {
            const { data: pub } = admin.storage.from("generated-images").getPublicUrl(path);
            finalUrl = pub.publicUrl;
            console.log("Uploaded image to storage:", finalUrl);
          }
        }
      }
    } catch (e) {
      console.error("Image upload error (non-fatal):", e);
    }

    return new Response(
      JSON.stringify({ imageUrl: finalUrl, description: textContent }),
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
