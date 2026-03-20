import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TranslateRequest {
  texts: { key: string; text: string }[];
  sourceLang: string;
  targetLangs: string[];
}

const langNames: Record<string, string> = {
  en: "English",
  "zh-TW": "Traditional Chinese (繁體中文)",
  "zh-CN": "Simplified Chinese (简体中文)",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { texts, sourceLang, targetLangs } = (await req.json()) as TranslateRequest;

    if (!texts?.length || !targetLangs?.length) {
      return new Response(
        JSON.stringify({ error: "Missing texts or targetLangs" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate inputs
    if (texts.length > 50) {
      return new Response(
        JSON.stringify({ error: "Maximum 50 texts per request" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Truncate excessively long texts
    const sanitizedTexts = texts.map((t) => ({
      key: t.key.slice(0, 200),
      text: t.text.slice(0, 5000),
    }));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Translation service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: Record<string, Record<string, string>> = {};

    for (const targetLang of targetLangs) {
      if (targetLang === sourceLang) continue;
      if (!langNames[targetLang]) continue;

      const textList = sanitizedTexts
        .map((t, i) => `${i + 1}. [KEY: ${t.key}] ${t.text}`)
        .join("\n");

      const prompt = `You are a professional translator for a modern web application. Translate the following texts from ${langNames[sourceLang] || sourceLang} to ${langNames[targetLang]}.

Rules:
- Maintain the exact same tone, style, and meaning
- Keep technical terms, brand names (like "Clovers", "WhatsApp", "WordPress"), and proper nouns unchanged
- For UI text, keep it concise and natural for the target language
- Use professional, fluent language suitable for an international audience
- Ensure zero grammar or spelling errors
- Return ONLY a valid JSON object with keys matching the [KEY: ...] values and translated text as values
- Do NOT include any markdown formatting, code blocks, or extra text outside the JSON

Texts to translate:
${textList}`;

      try {
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1,
          }),
        });

        if (response.status === 429) {
          console.error("Rate limited during translation");
          continue;
        }

        if (response.status === 402) {
          console.error("Payment required for translation");
          continue;
        }

        if (!response.ok) {
          console.error(`Translation API error for ${targetLang}:`, await response.text());
          continue;
        }

        const data = await response.json();
        let content = data.choices?.[0]?.message?.content || "";

        // Clean markdown code blocks if present
        content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

        try {
          results[targetLang] = JSON.parse(content);
        } catch {
          console.error(`Failed to parse translation for ${targetLang}:`, content.slice(0, 200));
          // Try to extract JSON from the content
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              results[targetLang] = JSON.parse(jsonMatch[0]);
            } catch {
              results[targetLang] = {};
            }
          } else {
            results[targetLang] = {};
          }
        }
      } catch (e) {
        console.error(`Translation request failed for ${targetLang}:`, e);
        results[targetLang] = {};
      }
    }

    return new Response(JSON.stringify({ translations: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Auto-translate error:", error);
    return new Response(
      JSON.stringify({ error: "Translation service temporarily unavailable" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
