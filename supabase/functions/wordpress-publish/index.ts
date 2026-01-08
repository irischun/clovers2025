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

// Validate and sanitize content
function sanitizeContent(content: string, maxLength: number): string {
  if (!content || typeof content !== 'string') return '';
  return content.slice(0, maxLength);
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
    const { title, content, status, imageUrl, seoEnabled } = await req.json();

    // Validate inputs
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Title is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize inputs
    const sanitizedTitle = sanitizeContent(title, 500);
    const sanitizedContent = sanitizeContent(content, 100000);
    const sanitizedStatus = ['publish', 'draft', 'pending'].includes(status) ? status : 'draft';

    console.log('Publishing to WordPress for user:', auth.userId);

    // Use service role to access stored credentials
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch stored connection with credentials (server-side only)
    const { data: connection, error } = await supabase
      .from('wordpress_connections')
      .select('id, site_url, username, app_password')
      .eq('user_id', auth.userId)
      .maybeSingle();

    if (error) {
      console.error('Database error:', error);
      throw new Error('Failed to fetch connection');
    }

    if (!connection) {
      return new Response(
        JSON.stringify({ success: false, error: 'No WordPress connection found. Please configure your WordPress settings first.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare post content
    let postContent = sanitizedContent;
    if (seoEnabled) {
      postContent = `<!-- SEO Optimized -->\n${sanitizedContent}`;
    }
    if (imageUrl && typeof imageUrl === 'string' && imageUrl.length < 2000) {
      postContent = `<img src="${imageUrl}" alt="${sanitizedTitle}" />\n${postContent}`;
    }

    // Publish to WordPress
    const apiUrl = `${connection.site_url}/wp-json/wp/v2/posts`;
    const credentials = btoa(`${connection.username}:${connection.app_password}`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Clover WordPress Publisher/1.0',
      },
      body: JSON.stringify({
        title: sanitizedTitle,
        content: postContent,
        status: sanitizedStatus,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('WordPress publish successful for user:', auth.userId, 'post id:', result.id);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          postId: result.id,
          link: result.link,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('WordPress publish failed for user:', auth.userId, 'status:', response.status, 'error:', errorData);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorData.message || 'Failed to publish to WordPress' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('WordPress publish error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Failed to publish to WordPress' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
