import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

// Validate URL format and ensure it's a valid WordPress site URL
function validateWordPressSiteUrl(url: string): { valid: boolean; error?: string; normalized?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'Site URL is required' };
  }

  const trimmedUrl = url.trim();
  if (trimmedUrl.length > 500) {
    return { valid: false, error: 'Site URL is too long' };
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

  // Block internal/private IP ranges
  const hostname = urlObj.hostname.toLowerCase();
  const blockedPatterns = [
    /^localhost$/i,
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^169\.254\./,
    /^0\./,
    /^::1$/,
    /^fc00:/i,
    /^fe80:/i,
  ];

  for (const pattern of blockedPatterns) {
    if (pattern.test(hostname)) {
      return { valid: false, error: 'Internal/private addresses are not allowed' };
    }
  }

  // Normalize the URL (remove trailing slash)
  const normalized = trimmedUrl.replace(/\/$/, '');
  return { valid: true, normalized };
}

// Validate username
function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'Username is required' };
  }
  
  const trimmed = username.trim();
  if (trimmed.length < 1 || trimmed.length > 100) {
    return { valid: false, error: 'Username must be between 1 and 100 characters' };
  }
  
  return { valid: true };
}

// Validate app password
function validateAppPassword(appPassword: string): { valid: boolean; error?: string } {
  if (!appPassword || typeof appPassword !== 'string') {
    return { valid: false, error: 'App password is required' };
  }
  
  const trimmed = appPassword.trim();
  if (trimmed.length < 1 || trimmed.length > 200) {
    return { valid: false, error: 'App password must be between 1 and 200 characters' };
  }
  
  return { valid: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
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
    const { siteUrl, username, appPassword } = await req.json();

    // Validate all inputs
    const urlValidation = validateWordPressSiteUrl(siteUrl);
    if (!urlValidation.valid) {
      return new Response(
        JSON.stringify({ success: false, error: urlValidation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return new Response(
        JSON.stringify({ success: false, error: usernameValidation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const passwordValidation = validateAppPassword(appPassword);
    if (!passwordValidation.valid) {
      return new Response(
        JSON.stringify({ success: false, error: passwordValidation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('WordPress connection test for user:', auth.userId, 'site:', urlValidation.normalized);

    // Test WordPress REST API connection server-side
    const apiUrl = `${urlValidation.normalized}/wp-json/wp/v2/posts?per_page=1`;
    const credentials = btoa(`${username.trim()}:${appPassword.trim()}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'User-Agent': 'Clover WordPress Connector/1.0',
      },
    });

    if (response.ok) {
      console.log('WordPress connection successful for user:', auth.userId);
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.log('WordPress connection failed for user:', auth.userId, 'status:', response.status);
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication failed. Please check your credentials.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('WordPress test error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to connect to WordPress site' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
