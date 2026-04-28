import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function verifyAuth(req: Request): Promise<{ userId: string } | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims) return null;
  return { userId: data.claims.sub as string };
}

// Comprehensive style prompt map covering all styles
const stylePromptMap: Record<string, string> = {
  // Original existing styles
  cute: "kawaii style, adorable character design, soft pastel colors, rounded shapes, cute facial expressions, chibi proportions, glossy highlights, sticker-ready with bold clean outlines",
  minimal: "minimalist design, clean geometric lines, flat illustration, simple elegant shapes, limited color palette, modern graphic design, negative space, Scandinavian design influence",
  bold: "bold vibrant colors, strong graphic design, thick outlines, pop art influence, high contrast, dynamic composition, eye-catching, street art energy",
  vintage: "vintage retro style, muted warm color palette, distressed texture, 1970s illustration, nostalgic atmosphere, film grain effect, hand-drawn aesthetic",
  neon: "neon glow effect, cyberpunk aesthetic, dark background with vivid glowing colors, electric blue and hot pink, futuristic design, holographic shimmer, synthwave style",
  watercolor: "watercolor painting style, soft flowing colors, artistic brush strokes, delicate washes, paper texture, impressionistic, organic shapes, hand-painted feel",

  // New: Original & Realistic
  original: "faithful reproduction of the original image style, maintain original colors and composition, clean and accurate rendering, high fidelity, preserve all details exactly as they are",
  realistic: "photorealistic rendering, ultra-realistic detail, lifelike textures, natural lighting, accurate shadows, sharp focus, professional photography quality, hyperrealism",

  // Kling AI Style Library — Fun/Cartoon
  cartoon_c4d: "Cinema 4D cartoon style, 3D rendered, smooth plastic-like surfaces, vibrant saturated colors, playful proportions, soft lighting, toy-like quality, Pixar-inspired",
  cg_rendering: "high quality CG rendering, 3D computer graphics, professional lighting setup, subsurface scattering, photorealistic materials, studio render quality",
  ghibli: "Studio Ghibli anime style, Hayao Miyazaki inspired, soft watercolor backgrounds, whimsical atmosphere, detailed hand-drawn animation, warm nostalgic colors, magical realism",
  anime_cartoon: "Japanese anime style, vibrant colors, large expressive eyes, dynamic poses, clean cel-shading, manga-inspired character design, detailed hair rendering",
  retro_comic: "retro comic book style, halftone dots, bold ink outlines, vintage color printing, speech bubbles aesthetic, 1960s pop art comics, Ben-Day dots pattern",
  q_version: "Q-version chibi style, super-deformed proportions, oversized head, tiny body, extremely cute, big round eyes, simplified features, adorable expression",
  chibi_3d: "3D chibi character, cute super-deformed 3D model, big head small body, glossy plastic-like surface, kawaii 3D rendering, soft shadows",
  cotton_doll: "cotton doll style, soft plush toy aesthetic, fabric texture, stitched details, button eyes, stuffed animal quality, handmade craft feel, cozy warm tones",
  jellycat: "Jellycat plush toy style, ultra-soft knitted texture, rounded cuddly shape, pastel baby colors, premium stuffed animal quality, huggable design",
  squishy_toy: "squishy toy style, marshmallow-soft 3D render, squeezable texture, pastel kawaii colors, jiggly bouncy feel, foam-like material, stress ball aesthetic",
  childrens_illustration: "children's book illustration, gentle watercolor, simple charming characters, warm friendly colors, storybook quality, innocent whimsical atmosphere",
  sticker_style: "classic sticker design, bold outlines, vibrant flat colors, die-cut shape, fun expressive design, glossy vinyl sticker quality, clear readable at small sizes",

  // Realistic/Photography
  photography: "professional photography style, natural lighting, shallow depth of field, bokeh background, high resolution, DSLR camera quality, lifestyle photography",
  teal_orange: "teal and orange color grading, cinematic color correction, complementary colors, Hollywood film look, warm highlights cool shadows, dramatic mood",
  retro_film: "vintage film photography, analog film grain, faded warm tones, light leaks, Kodak Portra color profile, nostalgic old photo aesthetic",
  ricoh: "Ricoh GR street photography style, high contrast black and white or muted tones, candid documentary feel, sharp wide-angle, urban atmosphere",
  surreal_photo: "surreal photography, dreamlike compositions, impossible perspectives, magical realism photo manipulation, fantasy elements blended with reality",

  // Art & Painting styles
  impasto_oil: "impasto oil painting, thick textured brushstrokes, rich oil colors, visible paint layers, classical fine art technique, gallery-quality painting",
  traditional_chinese: "traditional Chinese ink painting, sumi-e style, black ink on rice paper, fluid brushwork, mountain and water landscape, zen minimalism, calligraphic strokes",
  ink_wash: "ink wash painting, gradient ink tones, wet brush technique, atmospheric fog, East Asian ink art, monochrome beauty, contemplative mood",
  monet: "Claude Monet impressionist style, soft dappled light, broken color technique, water lily garden atmosphere, plein air painting, dreamy pastel palette",
  colored_pencil: "colored pencil illustration, visible pencil strokes, textured paper surface, hand-drawn quality, detailed shading, art school quality, warm toned",
  sketch: "pencil sketch style, graphite drawing, loose expressive linework, artistic hatching and cross-hatching, sketchbook quality, raw artistic energy",

  // Design & Craft styles
  glass: "glass morphism style, frosted glass effect, transparent and translucent materials, light refraction, crystal clear, elegant glassware aesthetic",
  paper_carving: "paper carving art, layered paper cut-out, kirigami style, dimensional paper sculpture, intricate cut details, shadow play between layers",
  knit_fabric: "knitted fabric texture, cozy knit pattern, yarn-based illustration, sweater texture, warm winter craft feel, handmade knitting quality",
  wool_felt: "wool felt craft style, needle felted characters, soft fuzzy texture, handmade felt art, warm organic colors, tactile crafty quality",
  plush_texture: "plush velvet texture, soft fuzzy surface, toy-like quality, premium plush material, touchable softness, rich fabric feel",
  ice_cream: "ice cream style, pastel dessert colors, creamy smooth texture, sweet delicious aesthetic, sprinkles and toppings, candy-colored palette",
  macaron_color: "macaron color palette, soft French pastel tones, elegant delicate colors, sweet confection inspired, pink lavender mint, sophisticated pastel harmony",
  liquid_metal: "liquid metal effect, chrome mercury-like surface, reflective metallic sheen, molten metal flow, futuristic material, T-1000 aesthetic",
  iridescent_pvc: "iridescent PVC material, holographic rainbow sheen, transparent plastic, prismatic light effects, fashion accessory quality, trendy Y2K aesthetic",
  plaster: "plaster sculpture style, white gypsum texture, classical bust aesthetic, smooth matte surface, sculptural form, museum artifact quality",

  // Digital & Modern styles
  pixel_art: "pixel art style, retro 8-bit/16-bit game graphics, blocky pixels, limited color palette, nostalgic video game aesthetic, crisp pixel edges",
  dreamcore: "dreamcore aesthetic, surreal liminal spaces, hazy ethereal atmosphere, nostalgic yet unsettling, soft bloom lighting, pastel surrealism",
  single_line: "single continuous line drawing, one-line art, minimalist line illustration, elegant flowing stroke, artistic simplicity, wire sculpture feel",
  graffiti: "street graffiti art style, spray paint texture, urban wall art, bold wild style lettering, vibrant aerosol colors, hip-hop culture influence",
  logo_design: "professional logo design style, clean vector graphics, brand identity quality, scalable design, iconic simplified shapes, corporate design standards",
  computer_graphics: "computer generated graphics, digital art, vector illustration, clean digital rendering, modern graphic design, Adobe Illustrator quality",
  ultra_flat: "ultra-flat design style, completely flat illustration, no gradients, bold solid colors, geometric simplification, modern UI design aesthetic",

  // Fantasy & Themed styles
  steampunk: "steampunk aesthetic, Victorian era machinery, brass gears and cogs, steam-powered gadgets, industrial revolution fantasy, clockwork mechanism details",
  wasteland: "post-apocalyptic wasteland style, dystopian atmosphere, rusted metal textures, Mad Max inspired, desolate landscape, survival aesthetic",
  future_scifi: "futuristic sci-fi style, advanced technology, holographic interfaces, sleek metallic surfaces, space age design, cyberpunk-meets-utopia",
  eastern_fantasy: "Eastern fantasy style, xianxia wuxia inspired, flowing robes, mystical Chinese mythology, ethereal clouds, celestial palace, immortal cultivation aesthetic",
  dunhuang: "Dunhuang mural art style, ancient Buddhist cave painting, mineral pigment colors, flying apsaras, Tang Dynasty art, Silk Road cultural fusion",

  // City & Lifestyle styles
  city_capsule: "city capsule miniature, tiny world in a bottle, miniature diorama, tilt-shift effect, detailed small-scale urban scene, whimsical micro world",
  miniature_landscape: "miniature landscape, tilt-shift photography effect, tiny world illusion, dollhouse scale scenery, shallow depth of field, model train set quality",
  healing_japanese: "healing Japanese illustration, warm soothing atmosphere, slice-of-life daily scenes, soft muted watercolors, cozy peaceful mood, iyashikei aesthetic",
  colorful_dream: "colorful dream style, vivid rainbow palette, fantastical surreal scenes, whimsical imagination, candy-colored world, childlike wonder",
  wu_guanzhong: "Wu Guanzhong painting style, blend of Chinese ink and Western color, abstract landscape, rhythmic brushwork, modernist Chinese art, architectural sketches",

  // 3D & Material styles
  three_d_polaroid: "3D Polaroid photo style, instant film frame, vintage snapshot, white border frame, slightly overexposed, casual candid photo, nostalgic memory",
  design_draft: "design wireframe draft style, blueprint sketch, technical drawing, construction lines, architectural plan aesthetic, prototype visualization",
  chinese_3d: "Chinese 3D clay style, traditional Chinese cultural elements in 3D, red and gold colors, festive lucky motifs, clay figurine texture, folk art 3D",
  pvc_model: "PVC figure model, anime figurine quality, glossy painted surface, articulated model, collectible figure aesthetic, display-ready quality",
  festive: "festive celebration style, holiday decorations, sparkles and confetti, warm golden lighting, party atmosphere, joyful celebratory mood",

  // Japanese styles
  japanese_anime: "Japanese anime illustration, detailed manga art, beautiful character design, dynamic composition, professional anime studio quality, light novel cover art",
  realistic_illustration: "realistic illustration, detailed digital painting, concept art quality, semi-realistic style, fantasy realism, book cover illustration quality",

  // Character & IP Styles
  pixar: "Pixar animation studio style, 3D CGI character, smooth rounded forms, expressive eyes and face, vibrant Pixar color palette, subsurface scattering skin, cinematic lighting, Toy Story and Inside Out quality, heartwarming and polished",
  disney: "Disney animation style, classic Disney character design, beautiful flowing lines, magical sparkle effects, rich saturated Disney colors, fairytale aesthetic, princess-quality animation, enchanting and whimsical, Walt Disney Studios quality",
  snoopy: "Snoopy and Peanuts comic style by Charles Schulz, simple clean black outlines, minimal color fills, round head proportions, expressive with minimal detail, newspaper comic strip aesthetic, white beagle dog style, cheerful innocent charm",
  irasutoya: `Irasutoya (いらすとや) Japanese clip-art illustration style by Takashi Mifune. This is a soft, warm, approachable Japanese clip-art illustration with a hand-drawn watercolor feel. NOT a sticker. Reference: irasutoya.com

=== NO OUTLINES / NO BORDER LINES (CRITICAL — TOP PRIORITY) ===
There must be ZERO visible outlines, border lines, contour strokes, or edge lines around characters, clothing, hair, hands, shoes, or any object. NO black lines, NO charcoal lines, NO gray lines, NO dark edge lines of ANY color or opacity. Shapes are defined ONLY by adjacent color fields meeting each other and by the watercolor edge grain texture. The silhouette and forms emerge naturally from where one color area ends and another begins — NEVER from drawn lines. If ANY outline, border stroke, or contour line is visible anywhere in the image, the image is INVALID and must be regenerated.

=== WATERCOLOR EDGE GRAIN (THE SIGNATURE FEATURE — CRITICAL) ===
This is THE most distinct and essential feature of Irasutoya style. Large areas of color are NEVER perfectly flat or digitally smooth. They MUST have:
• A visible subtle "salt-like" grain or stippling texture throughout all color fills, as if watercolor paint granulated on textured washi paper.
• Slightly uneven color density — lighter in some spots, slightly darker in others within the same fill area.
• Soft, organic edges where colors meet — NOT hard pixel-perfect boundaries.
• Apply a "Film Grain" or "Noise" filter at 1-3% to ALL color layers.
• The overall feel must be HAND-PAINTED watercolor, never flat digital vector art.

=== CORE PANTONE-LOCKED COLOR PALETTE ===
Use ONLY these warm, slightly desaturated colors — never harsh, vivid, neon, or "digital" primaries:
• Eyes: Pantone 440 C — Dark Charcoal-Brown #3C3C3C. Tiny simple dot circles, NO pupils, NO highlights, NO anime eyes.
• Soft Red (cheeks, clothing accents): Pantone 1767 C — #FF9AA2.
• Deep Red (fruits, warning signs): Pantone 1788 C — #FF5E5E.
• Soft Blue (denim, water, office wear): Pantone 291 C — #A2D2FF.
• Sky Blue (backgrounds): Pantone 298 C — #41B6E6.
• Nature Green (leaves, grass): Pantone 358 C — #A7D08E.
• Forest Green (deep foliage): Pantone 362 C — #44AA00.
• Warm Yellow (sun, accents): Pantone 121 C — #FFD966.
• Skin Tone Fair: Pantone 468 C — #F3E5AB. Gently warm, NOT orange.
• Skin Tone Warm: Pantone 466 C — #D4BE8D.
• Earth Brown (wood, hair, animals, shoes): Pantone 464 C — #8B5A2B.
• Paper White (highlights): #FFFFFF.

=== SECONDARY PALETTES ===
• Office: Cool Grey (429 C) + Navy Blue (534 C) for suits and tech.
• Traditional Japanese: Deep Vermilion (7623 C) + Jade Green (7724 C).
• Dark themes: Deep Purple (268 C) + Black Coffee (426 C) — still with soft grainy texture.

=== FACES (CRITICAL — MATCH REFERENCE EXACTLY) ===
• Eyes: Small dot circles in charcoal-brown (#3C3C3C). Simple. No detail inside. These are the LARGEST facial feature dots.
• Cheek blush: TWO perfectly round rosy circles (Pantone 1767 C #FF9AA2) on BOTH cheeks, always present, soft-edged with watercolor grain, similar size to or slightly larger than eye dots.
• Nose: A SINGLE TINY round reddish-pink dot (same Pantone 1767 C hue as cheeks). This dot must be SIGNIFICANTLY SMALLER than the eye dots — approximately 1/3 to 1/2 the diameter of each eye dot. NOT a drawn nose shape, NOT a triangle, NOT nostrils, NOT a line — just ONE very tiny dot, smaller than eyes.
• Mouth: A simple small curved line or open oval. Simple and minimal.

=== EYELASHES — ABSOLUTE ZERO RULE ===
ZERO (0) eyelashes on both eyes for ALL characters (female, male, child, any gender). No lash strokes, no flicks, no ticks, no corner marks near eyes. NON-NEGOTIABLE.

=== TEXTURE & FINISHING ===
• Watercolor grain throughout ALL color areas (REPEAT — most important visual feature).
• Stippled shading: Shadows are soft, speckled airbrush in slightly darker/warmer base color. NOT solid blocks. "Dissolve" blending at low opacity.
• Matte finish: Almost NO gloss highlights. "Shine" = simple white shapes, not reflections.
• Overall paper tooth texture, like watercolor on textured off-white washi paper.

=== PROPORTIONS ===
Semi-realistic, slightly large head, about 1:3.5 to 1:4 head-to-body ratio. NOT chibi. Natural body with just slightly oversized head.

=== COMPOSITION ===
Character on clean white/transparent background. NO decorative borders, NO sticker borders. Simple, quiet, gentle, educational Japanese clip-art.`,
  crayon_shin: "Crayon Shin-chan (蠟筆小新) anime style, thick crude outlines, simple flat coloring, exaggerated facial expressions, childlike drawing quality, comedic proportions, bold primary colors, Yoshito Usui manga aesthetic",
  doraemon: "Doraemon (多啦A夢) anime style by Fujiko F. Fujio, round simple character design, bright blue and white color scheme, clean bold outlines, cute robotic cat aesthetic, futuristic gadget feel, cheerful Japanese manga, nostalgic Showa-era anime quality",
  toriyama: "Akira Toriyama (鳥山明) art style, Dragon Ball manga aesthetic, dynamic action poses, muscular character proportions, spiky dramatic hair, bold clean ink lines, vibrant energy aura effects, manga screentone shading, powerful and expressive",
  jojo: "JoJo's Bizarre Adventure (ジョジョ) style by Hirohiko Araki, dramatic exaggerated poses, heavy muscular anatomy, bold fashion-forward character design, intense hatching and shading, vivid contrasting colors, menacing aura effects, flamboyant and powerful aesthetic",
  nana: "Nana manga style by Ai Yazawa, elegant punk-rock fashion illustration, slender stylized proportions, detailed clothing and accessories, moody atmospheric tones, gothic-romantic aesthetic, high-fashion manga quality, emotional and stylish",
  crayon_doodle: "crayon doodle style (蠟筆塗鴉), childlike crayon drawing, rough waxy texture, uneven coloring, hand-drawn by a child aesthetic, bright primary crayon colors, sketchy imperfect lines, playful naive art, textured paper background",
  three_d_q: "3D Q-version chibi style (3D Q版), super-deformed 3D character with oversized head, tiny cute body, big sparkling eyes, smooth glossy plastic-like 3D rendering, soft studio lighting, Funko Pop meets anime figurine quality",
  three_d_rendering_animation: "3D rendering animation style, high-quality 3D animated character, Pixar-Dreamworks hybrid, smooth polygon mesh, professional studio lighting, ray-traced reflections, cinematic depth of field, movie-quality 3D animation frame",
  cyberpunk_cool: "stylish cyberpunk aesthetic (型格Cyberpunk), dark neon-lit cityscape, sleek futuristic fashion, glowing circuit patterns, rain-soaked streets, holographic HUD overlays, cool confident character design, Blade Runner meets Ghost in the Shell",
  cyberpunk_q: "Q-version cute cyberpunk style (Q版Cyberpunk), chibi character with cyberpunk elements, neon glow accents on cute round body, tiny robot arms, LED eye effects, miniature futuristic city background, adorable meets high-tech",
  y2k: "Y2K millennium aesthetic (千禧風格), early 2000s design, glossy chrome text, butterfly motifs, baby pink and electric blue, frosted translucent plastic, flip phone era, bedazzled sparkle effects, Bratz doll energy, nostalgic cyber-cute",
  minecraft: "top-notch Minecraft voxel style, blocky cubic 3D pixel-art aesthetic, every form built from clean uniform cubes, crisp 16x16 pixelated block textures, characteristic Minecraft palette (grass green, dirt brown, stone gray, oak wood, diamond cyan, redstone red), boxy character with square head and rectangular limbs (Steve/Alex proportions), sharp 90-degree edges, no curves, no anti-aliasing on textures, soft ambient Minecraft world lighting, subtle cube shading, sandbox game look, official Mojang Minecraft visual quality",
};

const irasutoyaEyelashLockPrompt = "IRASUTOYA EYELASH LOCK (ABSOLUTE OVERRIDE): For every character (female, male, child, any gender), draw ZERO eyelashes on both eyes. Left eye lash count must be 0 and right eye lash count must be 0. Do not draw any lash stroke, flick, tick, or corner line near either eye. If any eyelash is visible, the image is invalid.";

function buildSystemMessage(hasReferenceImage: boolean): string {
  let msg = `You are an expert image stylist and sticker designer. Your task is to create high-quality stylized images with these standards:

1. STYLE ACCURACY: Match the requested visual style with absolute precision. Each style must feel authentic and distinct — as if created by a specialist in that genre.

2. QUALITY: Render with professional-grade execution. Clean lines, smooth gradients, crisp details, no artifacts, no blurriness. Output must match commercial quality.

3. COLOR & CONTRAST: Use well-contrasted colors that are vibrant and harmonious. The image should look polished on any background.

4. COMPOSITION: Subject should fill the frame well, be well-composed, and have clear visual hierarchy. For sticker use: centered with appropriate padding.

5. EXPRESSIVENESS: Results should be visually striking, instantly recognizable, and emotionally engaging. Exaggerated features are welcome for sticker styles.

6. DETAIL: Render textures, materials, and surfaces accurately for the chosen style. A watercolor should look painted, a 3D render should look rendered, etc.

7. SPEECH BUBBLE RULE (CRITICAL — NON-NEGOTIABLE):
   Every generated sticker that contains a speech bubble MUST have EXACTLY ONE speech bubble tail/pointer. 
   - There must be only ONE tail/pointer in the entire image — no duplicates, no extras.
   - The single tail/pointer must point toward the character.
   - If more than one tail/pointer is visible, the image is INVALID and must be regenerated.
   - This rule applies to ALL styles without exception.`;

  if (hasReferenceImage) {
    msg += `

REFERENCE IMAGE INSTRUCTIONS (CRITICAL):
You have been provided with reference image(s). Follow these rules strictly:
- The reference image is your PRIMARY subject. PRESERVE the subject's identity, key features, face, body, and distinctive characteristics
- Apply ONLY the requested visual style/aesthetic TO the reference subject
- The output must be clearly recognizable as the SAME subject from the reference, just rendered in the new style
- Maintain facial features, proportions, clothing details, and unique characteristics
- Think of this as "style transfer" — same subject, different artistic rendering
- Do NOT replace or substitute the subject with a generic character`;
  }

  msg += `

Generate the image now with these principles. Make it expressive, stylish, and professional quality.`;
  return msg;
}

type ChatMessage = {
  role: string;
  content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
};


async function generateStickerCandidate(messages: ChatMessage[], apiKey: string, style: string): Promise<string> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3.1-flash-image-preview",
      messages,
      modalities: ["image", "text"],
      temperature: style === 'irasutoya' ? 0.1 : 0.8,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error("Sticker generation failed") as Error & { status?: number; details?: string };
    error.status = response.status;
    error.details = errorText;

    if (response.status === 429) {
      error.message = "Rate limit exceeded. Please try again later.";
    } else if (response.status === 402) {
      error.message = "AI credits exhausted. Please add credits.";
    }

    throw error;
  }

  const data = await response.json();
  
  // Try multiple extraction paths for the generated image
  let imageUrl = data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  
  // Fallback: check for inline_data (base64) in content parts
  if (!imageUrl) {
    const content = data?.choices?.[0]?.message?.content;
    if (Array.isArray(content)) {
      for (const part of content) {
        if (part?.type === "image_url" && part?.image_url?.url) {
          imageUrl = part.image_url.url;
          break;
        }
        if (part?.type === "image" && part?.image_url?.url) {
          imageUrl = part.image_url.url;
          break;
        }
        // Handle inline base64 data
        if (part?.type === "image" && part?.data) {
          imageUrl = `data:image/png;base64,${part.data}`;
          break;
        }
        if (part?.inline_data?.data) {
          const mimeType = part.inline_data.mime_type || "image/png";
          imageUrl = `data:${mimeType};base64,${part.inline_data.data}`;
          break;
        }
      }
    }
  }

  // Fallback: check top-level images array
  if (!imageUrl && data?.choices?.[0]?.message?.images?.[0]?.url) {
    imageUrl = data.choices[0].message.images[0].url;
  }

  // Fallback: check for base64 in images array
  if (!imageUrl && data?.choices?.[0]?.message?.images?.[0]?.b64_json) {
    imageUrl = `data:image/png;base64,${data.choices[0].message.images[0].b64_json}`;
  }

  if (!imageUrl) {
    console.error("No image found in response. Response structure:", JSON.stringify(data?.choices?.[0]?.message || {}).slice(0, 2000));
    throw new Error("No sticker generated");
  }

  return imageUrl;
}

function normalizeEyelashDirection(input: unknown): "slash" | "backslash" | "none" | "unknown" {
  const value = String(input ?? "").toLowerCase().trim();

  if (!value || value === "unknown" || value === "unclear") return "unknown";
  if (value.includes("none") || value.includes("no lash") || value === "0") return "none";
  if (
    value.includes("backslash") ||
    value.includes("\\") ||
    value.includes("left-lean") ||
    value.includes("left leaning") ||
    value.includes("leftward") ||
    value.includes("left hand") ||
    value.includes("toward left")
  ) {
    return "backslash";
  }
  if (
    value.includes("slash") ||
    value.includes("/") ||
    value.includes("right-lean") ||
    value.includes("right leaning") ||
    value.includes("rightward") ||
    value.includes("right hand") ||
    value.includes("toward right")
  ) {
    return "slash";
  }

  return "unknown";
}

async function validateIrasutoyaEyelashes({
  apiKey,
  imageUrl,
}: {
  apiKey: string;
  imageUrl: string;
}): Promise<{ pass: boolean; reason: string }> {
  const validationPrompt = `You are a strict visual QA checker for Irasutoya characters.

Inspect ONLY eyelashes.
Absolute rule (non-negotiable):
- ALL characters must have ZERO eyelashes on both eyes.
- Left eye eyelash count must be 0.
- Right eye eyelash count must be 0.
- Any lash-like stroke/flick/tick at eye corners counts as an eyelash and must fail.

Return ONLY valid JSON with this schema:
{
  "left_eye_lash_count": number,
  "right_eye_lash_count": number,
  "left_eye_direction": "slash" | "backslash" | "none" | "unknown",
  "right_eye_direction": "slash" | "backslash" | "none" | "unknown",
  "pass": boolean
}

Set pass=true only when both eyes have zero visible eyelashes.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: validationPrompt },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      temperature: 0,
    }),
  });

  if (!response.ok) {
    return { pass: false, reason: `validator_http_${response.status}` };
  }

  const data = await response.json();
  const rawContent = data?.choices?.[0]?.message?.content;
  const contentText = typeof rawContent === "string"
    ? rawContent
    : Array.isArray(rawContent)
      ? rawContent.map((item: { text?: string }) => item?.text ?? "").join("\n")
      : "";

  const jsonMatch = contentText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { pass: false, reason: "validator_no_json" };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    const leftCount = Number(parsed?.left_eye_lash_count ?? -1);
    const rightCount = Number(parsed?.right_eye_lash_count ?? -1);
    const leftDirection = normalizeEyelashDirection(parsed?.left_eye_direction ?? parsed?.left_direction);
    const rightDirection = normalizeEyelashDirection(parsed?.right_eye_direction ?? parsed?.right_direction);

    const leftNoLash = leftCount === 0 && (leftDirection === "none" || leftDirection === "unknown");
    const rightNoLash = rightCount === 0 && (rightDirection === "none" || rightDirection === "unknown");
    const strictNoLashPass = leftNoLash && rightNoLash;

    const hasVisibleLashes =
      leftCount > 0 ||
      rightCount > 0 ||
      (leftDirection !== "none" && leftDirection !== "unknown") ||
      (rightDirection !== "none" && rightDirection !== "unknown");

    if (strictNoLashPass && !hasVisibleLashes) {
      return { pass: true, reason: "ok" };
    }

    return {
      pass: false,
      reason: `lashes_detected_l${leftCount}_r${rightCount}_${leftDirection}_${rightDirection}`,
    };
  } catch {
    return { pass: false, reason: "validator_parse_error" };
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
    const { text, style = "cute", emoji = "", referenceImages = [], removeBackground = false } = await req.json();
    
    if (!text && !emoji && referenceImages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Text, emoji, or reference image is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const hasReferenceImage = referenceImages.length > 0;
    console.log("Sticker generation for user:", auth.userId, { text, style, hasRef: hasReferenceImage, refCount: referenceImages.length, removeBackground });

    // Build messages based on mode
    const messages: Array<{role: string; content: string | Array<{type: string; text?: string; image_url?: {url: string}}>}> = [];

    if (removeBackground && hasReferenceImage) {
      // Background removal mode
      messages.push({
        role: "system",
        content: `You are an expert image editor specializing in background removal. Your task:
1. REMOVE the entire background from the provided image completely
2. Keep ONLY the main subject/character — preserve every detail, edge, color, and texture of the subject
3. The output MUST have a fully transparent/clean white background with NO background elements
4. Maintain crisp, clean edges around the subject — no jagged borders or artifacts
5. Do NOT alter, crop, resize, or modify the subject in any way
6. Output a clean cut-out suitable for use as a sticker overlay`
      });
      const contentParts: Array<{type: string; text?: string; image_url?: {url: string}}> = [];
      for (const refImg of referenceImages.slice(0, 3)) {
        contentParts.push({ type: "image_url", image_url: { url: refImg } });
      }
      contentParts.push({ type: "text", text: "Remove the background from this image completely. Output only the subject with a transparent/white background. Preserve all subject details perfectly." });
      messages.push({ role: "user", content: contentParts });
    } else {
      // Normal sticker generation mode
      const styleDesc = stylePromptMap[style] || stylePromptMap.cute;
      
      // Styles that should NOT use sticker/bold language
      const softStyles = ['irasutoya', 'watercolor', 'childrens_illustration'];
      const isSoftStyle = softStyles.includes(style);
      
      // Build enhanced prompt
      const promptParts: string[] = [];
      if (hasReferenceImage) {
        promptParts.push(`Transform the reference image subject using this style: ${styleDesc}`);
      } else if (isSoftStyle) {
        promptParts.push(`Create a gentle, soft illustration`);
      } else {
        promptParts.push(`Create a premium stylized sticker image`);
      }
      if (text || emoji) {
        promptParts.push(`Subject/theme: "${text || emoji}"`);
      }
      if (!hasReferenceImage) {
        promptParts.push(`Style: ${styleDesc}`);
      }
      if (isSoftStyle) {
        promptParts.push("soft, gentle, warm, natural illustration quality");
      } else {
        promptParts.push("high quality, professional, expressive, visually striking");
      }

      if (style === 'irasutoya') {
        promptParts.push(irasutoyaEyelashLockPrompt);
        promptParts.push("Final self-check before output: both eyes must have zero eyelashes for all characters, with no lash-like corner marks");
      }

      promptParts.push("512x512 optimal size, centered composition, clear at small sizes");
      
      const enhancedPrompt = promptParts.join('. ');

      messages.push({ role: "system", content: buildSystemMessage(hasReferenceImage) });

      if (hasReferenceImage) {
        const contentParts: Array<{type: string; text?: string; image_url?: {url: string}}> = [];
        for (const refImg of referenceImages.slice(0, 3)) {
          contentParts.push({ type: "image_url", image_url: { url: refImg } });
        }
        contentParts.push({ type: "text", text: enhancedPrompt });
        messages.push({ role: "user", content: contentParts });
      } else {
        messages.push({ role: "user", content: enhancedPrompt });
      }
    }

    const shouldEnforceIrasutoyaValidation = style === 'irasutoya' && !removeBackground;

    let imageUrl = "";

    if (shouldEnforceIrasutoyaValidation) {
      const maxAttempts = 8;
      let lastReason = "unknown";

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        const candidateImageUrl = await generateStickerCandidate(messages, LOVABLE_API_KEY, style);
        const validation = await validateIrasutoyaEyelashes({
          apiKey: LOVABLE_API_KEY,
          imageUrl: candidateImageUrl,
        });

        if (validation.pass) {
          imageUrl = candidateImageUrl;
          console.log(`Irasutoya eyelash validation passed on attempt ${attempt}/${maxAttempts}`);
          break;
        }

        lastReason = validation.reason;
        console.warn(`Irasutoya eyelash validation failed on attempt ${attempt}/${maxAttempts}: ${validation.reason}`);
      }

      if (!imageUrl) {
        return new Response(
          JSON.stringify({
            error: "Failed to satisfy strict Irasutoya no-eyelash rule after retries. Please try again.",
            details: lastReason,
          }),
          { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      imageUrl = await generateStickerCandidate(messages, LOVABLE_API_KEY, style);
    }

    return new Response(
      JSON.stringify({ imageUrl, text, style }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("sticker-generate error:", error);

    const status = typeof error === "object" && error !== null && "status" in error
      ? Number((error as { status?: number }).status)
      : 500;

    const safeStatus = [402, 429].includes(status) ? status : 500;
    const message = error instanceof Error ? error.message : "Unknown error";

    return new Response(
      JSON.stringify({ error: message }),
      { status: safeStatus, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
