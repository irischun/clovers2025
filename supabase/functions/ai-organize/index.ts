import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Maximum content length (50,000 characters)
const MAX_CONTENT_LENGTH = 50000;

// Allowed actions
const ALLOWED_ACTIONS = ['summarize', 'rewrite', 'translate_en', 'translate_zh', 'expand', 'simplify', 'keywords', 'outline'];

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

// Validate content input
function validateContent(content: unknown): { valid: boolean; error?: string; sanitized?: string } {
  if (!content || typeof content !== 'string') {
    return { valid: false, error: 'Content is required and must be a string' };
  }
  
  const trimmed = content.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Content cannot be empty' };
  }
  
  if (trimmed.length > MAX_CONTENT_LENGTH) {
    return { valid: false, error: `Content exceeds maximum length of ${MAX_CONTENT_LENGTH} characters` };
  }
  
  return { valid: true, sanitized: trimmed };
}

// Validate action input
function validateAction(action: unknown): { valid: boolean; error?: string; sanitized?: string } {
  if (!action || typeof action !== 'string') {
    // Default to summarize if no action provided
    return { valid: true, sanitized: 'summarize' };
  }
  
  const trimmed = action.trim().toLowerCase();
  if (!ALLOWED_ACTIONS.includes(trimmed)) {
    return { valid: false, error: `Invalid action. Allowed actions: ${ALLOWED_ACTIONS.join(', ')}` };
  }
  
  return { valid: true, sanitized: trimmed };
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
    const body = await req.json();
    
    // Validate content
    const contentValidation = validateContent(body.content);
    if (!contentValidation.valid) {
      return new Response(
        JSON.stringify({ error: contentValidation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Validate action
    const actionValidation = validateAction(body.action);
    if (!actionValidation.valid) {
      return new Response(
        JSON.stringify({ error: actionValidation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const content = contentValidation.sanitized!;
    const action = actionValidation.sanitized!;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Organizing content for user:", auth.userId, "action:", action, "content length:", content.length);

    const actionPrompts: Record<string, string> = {
      summarize: "請將以下內容總結為簡潔的要點，保留關鍵信息：",
      rewrite: "請重寫以下內容，使其更專業、更有吸引力：",
      translate_en: "Please translate the following content to English:",
      translate_zh: "請將以下內容翻譯成繁體中文：",
      expand: "請擴展以下內容，添加更多細節和例子：",
      simplify: "請簡化以下內容，使其更容易理解：",
      keywords: "請提取以下內容的關鍵詞和標籤，以JSON數組格式返回：",
      outline: "請為以下內容創建一個結構化的大綱：",
    };

    const prompt = actionPrompts[action] || actionPrompts.summarize;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "你是一個專業的內容整理助手，幫助用戶組織和優化他們的內容。" },
          { role: "user", content: `${prompt}\n\n${content}` }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("AI processing failed");
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ result, action }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("ai-organize error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});