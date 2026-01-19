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

  // Verify authentication
  const auth = await verifyAuth(req);
  if (!auth) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const MINIMAX_API_KEY = Deno.env.get('MINIMAX_API_KEY');
    
    if (!MINIMAX_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'MiniMax API key not configured. Please add MINIMAX_API_KEY in settings.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    
    const { 
      text, 
      language, 
      voiceId, 
      model, 
      speed, 
      volume, 
      pitch, 
      emotion,
      textNormalization,
      sampleRate,
      bitrate,
      format,
      channel 
    } = body;

    // Validate text
    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Text is required and must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const trimmedText = text.trim();
    if (trimmedText.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Text cannot be empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (trimmedText.length > 5000) {
      return new Response(
        JSON.stringify({ error: 'Text must be under 5000 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate speed (0.5 to 2.0)
    const validatedSpeed = typeof speed === 'number' ? Math.max(0.5, Math.min(2.0, speed)) : 1.0;
    
    // Validate volume (0 to 2.0)
    const validatedVolume = typeof volume === 'number' ? Math.max(0, Math.min(2.0, volume)) : 1.0;
    
    // Validate pitch (-12 to 12)
    const validatedPitch = typeof pitch === 'number' ? Math.max(-12, Math.min(12, pitch)) : 0;
    
    // Validate sampleRate (allowed values)
    const allowedSampleRates = [8000, 16000, 22050, 24000, 32000, 44100, 48000];
    const validatedSampleRate = allowedSampleRates.includes(sampleRate) ? sampleRate : 44100;
    
    // Validate bitrate (allowed values)
    const allowedBitrates = [64000, 128000, 192000, 256000, 320000];
    const validatedBitrate = allowedBitrates.includes(bitrate) ? bitrate : 256000;
    
    // Validate format
    const allowedFormats = ['mp3', 'wav', 'pcm', 'flac'];
    const validatedFormat = allowedFormats.includes(format) ? format : 'mp3';
    
    // Validate channel (1 or 2)
    const validatedChannel = channel === 2 ? 2 : 1;
    
    // Validate emotion
    const allowedEmotions = ['neutral', 'happy', 'sad', 'angry', 'fear', 'disgust', 'surprise'];
    const validatedEmotion = allowedEmotions.includes(emotion) ? emotion : 'neutral';

    console.log('Voice generation for user:', auth.userId, { 
      language, 
      voiceId, 
      model, 
      speed: validatedSpeed, 
      volume: validatedVolume, 
      pitch: validatedPitch, 
      emotion: validatedEmotion,
      textLength: trimmedText.length 
    });

    // MiniMax TTS API
    const response = await fetch('https://api.minimax.chat/v1/t2a_v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MINIMAX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model === 'hd' ? 'speech-01-hd' : 'speech-01-turbo',
        text: trimmedText,
        voice_setting: {
          voice_id: voiceId,
          speed: validatedSpeed,
          vol: validatedVolume,
          pitch: validatedPitch,
          emotion: validatedEmotion,
        },
        audio_setting: {
          sample_rate: validatedSampleRate,
          bitrate: validatedBitrate,
          format: validatedFormat,
          channel: validatedChannel,
        },
        language_boost: language,
        text_normalization: textNormalization ?? true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      // Log detailed error server-side only
      console.error('Voice API error:', {
        status: response.status,
        error: errorText,
        userId: auth.userId,
        timestamp: new Date().toISOString()
      });
      
      // Return generic error to client
      let clientMessage = 'Voice generation failed. Please try again.';
      
      if (response.status === 429) {
        clientMessage = 'Too many requests. Please wait and try again.';
      } else if (response.status >= 500) {
        clientMessage = 'Service temporarily unavailable. Please try again later.';
      } else if (response.status === 400) {
        clientMessage = 'Invalid request. Please check your input.';
      }
      
      return new Response(
        JSON.stringify({ 
          error: clientMessage,
          errorId: crypto.randomUUID() // For support correlation
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    if (data.base_resp?.status_code !== 0) {
      console.error('MiniMax API error response:', data);
      return new Response(
        JSON.stringify({ error: data.base_resp?.status_msg || 'Voice generation failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        audioContent: data.data?.audio,
        extraInfo: data.extra_info 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Voice generation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate voice';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});