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

  if (!['http:', 'https:'].includes(urlObj.protocol)) {
    return { valid: false, error: 'Only HTTP and HTTPS protocols are allowed' };
  }

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

  const normalized = trimmedUrl.replace(/\/$/, '');
  return { valid: true, normalized };
}

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

    console.log('Saving WordPress connection for user:', auth.userId);

    // Use service role to save credentials securely
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if connection exists
    const { data: existing } = await supabase
      .from('wordpress_connections')
      .select('id')
      .eq('user_id', auth.userId)
      .maybeSingle();

    const connectionData = {
      user_id: auth.userId,
      site_url: urlValidation.normalized,
      username: username.trim(),
      app_password: appPassword.trim(),
      is_connected: false,
      updated_at: new Date().toISOString(),
    };

    let result;
    if (existing) {
      result = await supabase
        .from('wordpress_connections')
        .update(connectionData)
        .eq('id', existing.id)
        .select('id, site_url, username, is_connected, created_at, updated_at')
        .single();
    } else {
      result = await supabase
        .from('wordpress_connections')
        .insert(connectionData)
        .select('id, site_url, username, is_connected, created_at, updated_at')
        .single();
    }

    if (result.error) {
      console.error('Database error:', result.error);
      throw new Error('Failed to save connection');
    }

    console.log('WordPress connection saved for user:', auth.userId);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        connection: result.data 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('WordPress save error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to save WordPress connection' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
