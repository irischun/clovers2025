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

// Validate and sanitize RSS URL to prevent SSRF attacks
function validateRssUrl(url: string): { valid: boolean; error?: string; normalized?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'RSS URL is required' };
  }

  const trimmedUrl = url.trim();
  if (trimmedUrl.length > 2000) {
    return { valid: false, error: 'URL is too long (max 2000 characters)' };
  }

  let urlObj: URL;
  try {
    urlObj = new URL(trimmedUrl);
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }

  // Only allow http and https protocols
  if (!['http:', 'https:'].includes(urlObj.protocol)) {
    return { valid: false, error: 'Only HTTP and HTTPS protocols are allowed' };
  }

  // Block internal/private IP ranges to prevent SSRF
  const hostname = urlObj.hostname.toLowerCase();
  const blockedPatterns = [
    /^localhost$/i,
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^169\.254\./, // AWS metadata endpoint
    /^0\./,
    /^::1$/,
    /^fc00:/i,
    /^fe80:/i,
    /^fd[0-9a-f]{2}:/i,
  ];

  for (const pattern of blockedPatterns) {
    if (pattern.test(hostname)) {
      return { valid: false, error: 'Internal/private addresses are not allowed' };
    }
  }

  // Block cloud metadata endpoints
  if (hostname === '169.254.169.254' || hostname.includes('metadata')) {
    return { valid: false, error: 'Access to metadata endpoints is not allowed' };
  }

  return { valid: true, normalized: trimmedUrl };
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
    const { url } = await req.json();
    
    // Validate URL
    const urlValidation = validateRssUrl(url);
    if (!urlValidation.valid) {
      return new Response(
        JSON.stringify({ error: urlValidation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Fetching RSS for user:", auth.userId, "from:", urlValidation.normalized);

    const response = await fetch(urlValidation.normalized!, {
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'User-Agent': 'Clover RSS Reader/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch RSS: ${response.status}`);
    }

    const xmlText = await response.text();
    
    // Parse XML to extract items
    const items: Array<{
      title: string;
      link: string;
      description: string;
      pubDate: string;
      author?: string;
    }> = [];
    
    // Simple XML parsing for RSS items
    const itemMatches = xmlText.matchAll(/<item>([\s\S]*?)<\/item>/g);
    
    for (const match of itemMatches) {
      const itemXml = match[1];
      
      const getTag = (tag: string) => {
        const tagMatch = itemXml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
        return tagMatch ? (tagMatch[1] || tagMatch[2] || '').trim() : '';
      };
      
      items.push({
        title: getTag('title'),
        link: getTag('link'),
        description: getTag('description').replace(/<[^>]*>/g, '').substring(0, 200),
        pubDate: getTag('pubDate'),
        author: getTag('author') || getTag('dc:creator'),
      });
    }

    // Get feed info
    const titleMatch = xmlText.match(/<channel>[\s\S]*?<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
    const descMatch = xmlText.match(/<channel>[\s\S]*?<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/);
    
    return new Response(
      JSON.stringify({
        feed: {
          title: titleMatch?.[1]?.trim() || 'Unknown Feed',
          description: descMatch?.[1]?.trim() || '',
          url: urlValidation.normalized
        },
        items: items.slice(0, 20)
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("rss-fetch error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});