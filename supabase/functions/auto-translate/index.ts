import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TranslateRequest {
  texts: { key: string; text: string }[];
  sourceLang: string;
  targetLangs: string[];
}

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

    const langNames: Record<string, string> = {
      en: "English",
      "zh-TW": "Traditional Chinese (繁體中文)",
      "zh-CN": "Simplified Chinese (简体中文)",
    };

    const results: Record<string, Record<string, string>> = {};

    for (const targetLang of targetLangs) {
      if (targetLang === sourceLang) continue;

      const textList = texts.map((t, i) => `${i + 1}. [KEY: ${t.key}] ${t.text}`).join("\n");

      const prompt = `You are a professional translator. Translate the following texts from ${langNames[sourceLang] || sourceLang} to ${langNames[targetLang] || targetLang}.

Rules:
- Maintain the exact same tone, style, and meaning
- Keep technical terms, brand names, and proper nouns unchanged
- For UI text, keep it concise and natural for the target language
- Return ONLY a valid JSON object with keys matching the [KEY: ...] values and translated text as values
- Do NOT include any markdown formatting, code blocks, or extra text

Texts to translate:
${textList}`;

      const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
        }),
      });

      if (!response.ok) {
        console.error(`Translation API error for ${targetLang}:`, await response.text());
        continue;
      }

      const data = await response.json();
      let content = data.choices?.[0]?.message?.content || "";
      
      // Clean markdown code blocks if present
      content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

      try {
        results[targetLang] = JSON.parse(content);
      } catch (e) {
        console.error(`Failed to parse translation for ${targetLang}:`, content);
        results[targetLang] = {};
      }
    }

    return new Response(JSON.stringify({ translations: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Auto-translate error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
