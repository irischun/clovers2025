import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Enhanced style mappings with detailed prompts for better quality
const stylePromptMap: Record<string, string> = {
  // Photography styles
  'professional-photo': 'professional photography, studio lighting, high-end camera, sharp focus, commercial quality, magazine-worthy',
  'natural-light': 'natural lighting photography, golden hour, soft shadows, warm tones, organic feel',
  'dramatic-lighting': 'dramatic cinematic lighting, high contrast, chiaroscuro, moody atmosphere, film noir influence',
  'product-closeup': 'product photography, macro lens, shallow depth of field, clean background, commercial studio setup',
  
  // Artistic styles
  'watercolor': 'watercolor painting style, soft brushstrokes, flowing colors, artistic paper texture, delicate washes',
  'manga': 'Japanese manga art style, clean linework, anime aesthetics, dynamic composition, cel shading',
  'sticker': 'cute sticker design, kawaii style, bold outlines, transparent background, expressive cartoon',
  'oil-painting': 'oil painting masterpiece, visible brushstrokes, rich colors, classical art techniques, gallery quality',
  'pixar': 'Pixar 3D animation style, subsurface scattering, expressive characters, vibrant colors, professional CGI rendering',
  'ghibli': 'Studio Ghibli animation style, hand-drawn aesthetic, soft colors, whimsical atmosphere, Hayao Miyazaki influence',
  'american-cartoon': 'American cartoon style, bold colors, exaggerated expressions, dynamic poses, clean vector art',
  'clay': 'claymation style, stop motion aesthetic, handcrafted textures, tactile materials, Aardman studios influence',
  
  // 3D rendering
  '3d-render': '3D render, octane render, ray tracing, photorealistic materials, professional 3D software',
  'unreal-engine': 'Unreal Engine 5 render, lumen lighting, nanite geometry, photorealistic, AAA game quality',
  
  // Scene atmospheres
  'indoor': 'indoor photography, ambient lighting, interior design, cozy atmosphere',
  'outdoor': 'outdoor photography, natural environment, environmental context, landscape elements',
  'futuristic': 'futuristic sci-fi design, neon lights, cyberpunk aesthetics, holographic elements, high-tech',
  'vintage': 'vintage aesthetic, retro color grading, nostalgic atmosphere, film grain, 1970s style',
  
  // Color tones
  'warm-tone': 'warm color palette, orange and yellow tones, cozy atmosphere, sunset colors',
  'cool-tone': 'cool color palette, blue and cyan tones, fresh atmosphere, serene mood',
  'high-contrast': 'high contrast, deep blacks, bright whites, punchy colors, dramatic',
  'minimalist': 'minimalist design, clean composition, negative space, simple elegance, modern',
  
  // Social media
  'whatsapp-sticker': 'WhatsApp sticker, cute cartoon style, transparent background, expressive face, bold outlines, kawaii',
  'youtube-cover': 'YouTube thumbnail, eye-catching design, bold text, vibrant colors, high contrast, click-worthy',
  
  // Poster styles
  'magazine-retro': 'vintage magazine cover, retro newspaper elements, 1950s advertising, nostalgic typography',
  'retro-80s-90s': '1980s 1990s retro newspaper style, vintage typography, old print texture, yellowed paper',
  'business-magazine': 'high-end business magazine cover, Forbes Bloomberg style, professional corporate, elegant',
  'tai-kung-pao': 'Chinese newspaper parody, sensational headlines, bold Chinese typography, satirical',
  'lemon-daily': 'quirky newspaper design, yellow tones, playful layout, humorous headlines',
  'hk-manga-fight': 'Hong Kong manga 4-panel fight scene, dynamic action, speed lines, dramatic poses, comic book',
  
  // Movie poster styles
  'hollywood': 'Hollywood blockbuster movie poster, epic scale, dramatic lighting, cinematic composition',
  'marvel': 'Marvel superhero movie poster, dynamic poses, power effects, heroic composition, action packed',
  'dc-dark': 'DC dark and gritty style, noir lighting, intense atmosphere, brooding, Christopher Nolan influence',
  'japanese-film': 'Japanese movie poster aesthetic, artistic composition, subtle colors, minimalist design',
  'korean-film': 'Korean cinema style poster, realistic drama, emotional impact, sophisticated design',
  'hk-film': 'Classic Hong Kong movie poster, action-oriented, bold colors, dynamic composition',
  'inachu': 'Inachu manga parody style, exaggerated comedy, crude humor, satirical cartoon',
  'hk-kam-manga': 'Hong Kong 4-panel manga style, local humor, satirical commentary, comic strips',
  
  // Art styles
  'minimalist-art': 'minimalist design, clean lines, negative space, modern art, geometric simplicity',
  'retro-illustration': 'vintage hand-drawn illustration, nostalgic, warm colors, retro advertising art',
  'scifi': 'sci-fi futuristic design, neon lights, cyberpunk, high-tech, blade runner influence',
  'horror': 'horror movie style, dark atmosphere, suspenseful, eerie, Stephen King influence',
  'romance': 'romantic movie poster, soft lighting, dreamy atmosphere, warm tones, emotional',
  
  // Commercial
  'product-display': 'e-commerce product showcase, clean white background, professional lighting, commercial',
  'promo': 'promotional campaign design, bold graphics, call to action, marketing, eye-catching',
  'fashion': 'high fashion advertising, editorial style, luxury branding, Vogue influence',
  'festival': 'festive holiday theme, celebratory decorations, seasonal colors, joyful',
  'flash-sale': 'flash sale banner, urgent design, countdown aesthetic, promotional, attention-grabbing',
  
  // Default
  'default': 'high quality, professional, detailed, well-composed',
  'realistic': 'photorealistic, lifelike, detailed, natural, authentic',
};

// Resolution quality descriptions
const resolutionGuide: Record<string, string> = {
  '16:9': 'widescreen cinematic composition, horizontal frame, landscape orientation',
  '1:1': 'square format, balanced composition, centered subject, Instagram-ready',
  '9:16': 'vertical portrait format, mobile-first design, TikTok/Reels ready',
  '4:3': 'classic photography ratio, traditional composition, balanced frame',
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

// Build enhanced prompt with comprehensive guidance
function buildEnhancedPrompt(
  prompt: string, 
  style: string, 
  width?: number, 
  height?: number
): string {
  const parts: string[] = [];
  
  // Start with the main user prompt
  parts.push(prompt);
  
  // Add comprehensive style enhancement
  const styleEnhancement = stylePromptMap[style] || stylePromptMap['default'];
  parts.push(styleEnhancement);
  
  // Add aspect ratio guidance
  if (width && height) {
    const ratio = width / height;
    if (ratio > 1.5) {
      parts.push(resolutionGuide['16:9']);
    } else if (ratio < 0.7) {
      parts.push(resolutionGuide['9:16']);
    } else if (Math.abs(ratio - 1) < 0.1) {
      parts.push(resolutionGuide['1:1']);
    } else {
      parts.push(resolutionGuide['4:3']);
    }
  }
  
  // Add universal quality boosters
  parts.push('masterpiece quality');
  parts.push('highly detailed');
  parts.push('sharp focus');
  parts.push('professional composition');
  parts.push('8K UHD resolution');
  parts.push('trending on artstation');
  parts.push('award-winning');
  
  // Add negative prompt guidance embedded in positive
  parts.push('clean, clear, well-lit, properly exposed');
  
  return parts.join(', ');
}

// Build system message for better guidance
function buildSystemMessage(): string {
  return `You are an expert AI image generator. Create exactly what the user requests with the following quality standards:

1. COMPOSITION: Follow professional photography and art composition rules. Use rule of thirds, leading lines, and proper framing.

2. LIGHTING: Use appropriate lighting for the subject - dramatic for cinematic, soft for portraits, even for products.

3. DETAILS: Render fine details meticulously - textures, materials, reflections, shadows.

4. STYLE ACCURACY: Match the requested style precisely. If anime is requested, use proper anime aesthetics. If photorealistic, make it indistinguishable from a real photo.

5. COLOR HARMONY: Use cohesive, pleasing color palettes that match the mood and style.

6. TECHNICAL QUALITY: Generate at the highest quality possible - sharp, well-exposed, properly composed.

7. SUBJECT FOCUS: The main subject should be clear and prominent. Avoid cluttered backgrounds unless specifically requested.

Generate the image now with these principles in mind.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify authentication
  const auth = await verifyAuth(req);
  if (!auth) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { prompt, style = "realistic", model, width, height, referenceImage } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Image generation request from user:", auth.userId, { prompt, style, model, width, height, hasReference: !!referenceImage });

    // Use the provided model or default to pro for better quality
    const aiModel = model || "google/gemini-2.5-flash-image-preview";
    
    // Build comprehensive enhanced prompt
    const enhancedPrompt = buildEnhancedPrompt(prompt, style, width, height);
    
    console.log("Enhanced prompt:", enhancedPrompt.substring(0, 200) + "...");

    // Build messages array
    const messages: Array<{role: string; content: string | Array<{type: string; text?: string; image_url?: {url: string}}>}> = [];
    
    // Add system message for better guidance
    messages.push({ role: "system", content: buildSystemMessage() });
    
    // If there's a reference image, include it in the message
    if (referenceImage) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: `Using this reference image as inspiration and guidance, create: ${enhancedPrompt}` },
          { type: "image_url", image_url: { url: referenceImage } }
        ]
      });
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
        model: aiModel,
        messages,
        modalities: ["image", "text"],
        // Add temperature for more creative outputs
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
    
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const textContent = data.choices?.[0]?.message?.content;

    if (!imageUrl) {
      console.error("No image URL in response:", JSON.stringify(data));
      return new Response(
        JSON.stringify({ error: "No image generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ imageUrl, description: textContent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-image error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
