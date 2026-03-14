import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function verifyAuth(req: Request): Promise<{ userId: string } | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getClaims(token);
  
  if (error || !data?.claims) {
    return null;
  }

  return { userId: data.claims.sub as string };
}

// Enhanced style descriptions matching generate-image quality
const stylePromptMap: Record<string, string> = {
  cute: "kawaii style, adorable character design, soft pastel colors, rounded shapes, cute facial expressions, chibi proportions, glossy highlights, sticker-ready with bold clean outlines",
  minimal: "minimalist design, clean geometric lines, flat illustration, simple elegant shapes, limited color palette, modern graphic design, negative space, Scandinavian design influence",
  bold: "bold vibrant colors, strong graphic design, thick outlines, pop art influence, high contrast, dynamic composition, eye-catching typography, street art energy",
  vintage: "vintage retro style, muted warm color palette, distressed texture, 1970s illustration, nostalgic atmosphere, film grain effect, hand-drawn aesthetic, classic typography",
  neon: "neon glow effect, cyberpunk aesthetic, dark background with vivid glowing colors, electric blue and hot pink, futuristic design, holographic shimmer, synthwave style",
  watercolor: "watercolor painting style, soft flowing colors, artistic brush strokes, delicate washes, paper texture, impressionistic, organic shapes, hand-painted feel",
};

function buildSystemMessage(hasReferenceImage: boolean): string {
  let msg = `You are an expert sticker designer specializing in messaging app stickers. Create high-quality, expressive sticker designs with these standards:

1. STICKER FORMAT: Design as a self-contained sticker — bold outlines, transparent/clean background feel, centered composition, 512×512 optimal size.

2. EXPRESSIVENESS: Stickers must be instantly readable at small sizes. Use exaggerated expressions, clear silhouettes, and bold visual elements.

3. STYLE ACCURACY: Match the requested style precisely with professional-grade execution. Each style should feel distinct and polished.

4. COLOR & CONTRAST: Use vibrant, well-contrasted colors that pop on any chat background. Ensure the sticker stands out.

5. DETAIL QUALITY: Render clean lines, smooth gradients, and crisp details. No artifacts, no blurriness.

6. COMPOSITION: Subject should fill the frame well, be centered, and have clear visual hierarchy. Leave appropriate padding for sticker border.

7. PROFESSIONAL QUALITY: Output should match commercial sticker packs on LINE, WhatsApp, or Telegram stores.`;

  if (hasReferenceImage) {
    msg += `

REFERENCE IMAGE INSTRUCTIONS:
You have been provided with reference image(s). Use them as the PRIMARY basis for the sticker:
- PRESERVE the subject's identity, key features, and distinctive characteristics from the reference
- Apply the requested sticker style TO the reference subject — stylize but keep recognizable
- Maintain facial features, body proportions, and unique details from the reference
- The sticker should clearly depict the same subject as the reference, just in sticker art style`;
  }

  msg += `

Generate the sticker now with these principles. Make it expressive, stylish, and ready to use in messaging apps.`;

  return msg;
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
    const { text, style = "cute", emoji = "", referenceImages = [] } = await req.json();
    
    if (!text && !emoji && referenceImages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Text, emoji, or reference image is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const hasReferenceImage = referenceImages.length > 0;
    console.log("Sticker generation for user:", auth.userId, { text, style, hasRef: hasReferenceImage, refCount: referenceImages.length });

    const styleDesc = stylePromptMap[style] || stylePromptMap.cute;
    
    // Build enhanced prompt
    const promptParts: string[] = [];
    promptParts.push(`Create a premium messaging app sticker design`);
    if (text || emoji) {
      promptParts.push(`depicting: "${text || emoji}"`);
    }
    promptParts.push(`Style: ${styleDesc}`);
    promptParts.push("transparent background feel, centered composition, bold clean outlines");
    promptParts.push("sticker-ready, expressive, high quality, professional sticker pack quality");
    promptParts.push("512x512 optimal sticker size, clear at small sizes");
    
    const enhancedPrompt = promptParts.join('. ');

    // Build messages
    const messages: Array<{role: string; content: string | Array<{type: string; text?: string; image_url?: {url: string}}>}> = [];
    
    messages.push({ role: "system", content: buildSystemMessage(hasReferenceImage) });

    if (hasReferenceImage) {
      // Include reference images with the prompt
      const contentParts: Array<{type: string; text?: string; image_url?: {url: string}}> = [];
      
      for (const refImg of referenceImages.slice(0, 3)) {
        contentParts.push({ type: "image_url", image_url: { url: refImg } });
      }
      
      contentParts.push({
        type: "text",
        text: `Use the reference image(s) above as the subject for the sticker. Transform the subject into a stylish sticker with: ${enhancedPrompt}`
      });
      
      messages.push({ role: "user", content: contentParts });
    } else {
      messages.push({ role: "user", content: enhancedPrompt });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages,
        modalities: ["image", "text"],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Sticker generation failed");
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error("No image URL in response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "No sticker generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ imageUrl, text, style }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("sticker-generate error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
