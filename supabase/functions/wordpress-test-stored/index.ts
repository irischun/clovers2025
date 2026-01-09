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
    console.log('Testing stored WordPress connection for user:', auth.userId);

    // Use service role to access stored credentials and decrypt
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch stored connection
    const { data: connection, error } = await supabase
      .from('wordpress_connections')
      .select('id, site_url, username, app_password, is_encrypted')
      .eq('user_id', auth.userId)
      .maybeSingle();

    if (error) {
      console.error('Database error:', error);
      throw new Error('Failed to fetch connection');
    }

    if (!connection) {
      return new Response(
        JSON.stringify({ success: false, error: 'No WordPress connection found. Please save your credentials first.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decrypt password using database function
    let decryptedPassword = connection.app_password;
    if (connection.is_encrypted) {
      const { data: decryptResult, error: decryptError } = await supabase
        .rpc('decrypt_wordpress_password', {
          p_user_id: auth.userId,
          p_encrypted_password: connection.app_password
        });
      
      if (decryptError) {
        console.error('Decryption error:', decryptError);
        throw new Error('Failed to decrypt credentials');
      }
      decryptedPassword = decryptResult;
    }

    // Test WordPress REST API connection using decrypted credentials
    const apiUrl = `${connection.site_url}/wp-json/wp/v2/posts?per_page=1`;
    const credentials = btoa(`${connection.username}:${decryptedPassword}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'User-Agent': 'Clover WordPress Connector/1.0',
      },
    });

    if (response.ok) {
      // Update connection status to connected
      await supabase
        .from('wordpress_connections')
        .update({ is_connected: true, updated_at: new Date().toISOString() })
        .eq('id', connection.id);

      console.log('WordPress connection successful for user:', auth.userId);
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Update connection status to disconnected
      await supabase
        .from('wordpress_connections')
        .update({ is_connected: false, updated_at: new Date().toISOString() })
        .eq('id', connection.id);

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
