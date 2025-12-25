import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const MINIMAX_API_KEY = Deno.env.get('MINIMAX_API_KEY');
    
    if (!MINIMAX_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'MiniMax API key not configured. Please add MINIMAX_API_KEY in settings.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
      format 
    } = await req.json();

    if (!text || text.length > 5000) {
      return new Response(
        JSON.stringify({ error: 'Text is required and must be under 5000 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generating voice with params:', { language, voiceId, model, speed, volume, pitch, emotion });

    // MiniMax TTS API
    const response = await fetch('https://api.minimax.chat/v1/t2a_v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MINIMAX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model === 'hd' ? 'speech-01-hd' : 'speech-01-turbo',
        text: text,
        voice_setting: {
          voice_id: voiceId,
          speed: speed || 1.0,
          vol: volume || 1.0,
          pitch: pitch || 0,
          emotion: emotion || 'neutral',
        },
        audio_setting: {
          sample_rate: sampleRate || 44100,
          bitrate: bitrate || 128000,
          format: format || 'mp3',
        },
        language_boost: language,
        text_normalization: textNormalization ?? true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('MiniMax API error:', errorText);
      return new Response(
        JSON.stringify({ error: `MiniMax API error: ${errorText}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
