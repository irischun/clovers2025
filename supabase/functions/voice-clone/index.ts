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

    const { voiceName, voiceId, audioData, audioFormat, noiseReduction } = await req.json();

    if (!voiceName || !audioData) {
      return new Response(
        JSON.stringify({ error: 'Voice name and audio data are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate voiceId format: must start with letter, at least 8 chars, alphanumeric only
    const voiceIdRegex = /^[a-zA-Z][a-zA-Z0-9]{7,}$/;
    if (voiceId && !voiceIdRegex.test(voiceId)) {
      return new Response(
        JSON.stringify({ error: 'Voice ID must start with a letter, be at least 8 characters, and contain only letters and numbers' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const finalVoiceId = voiceId || `clone_${Date.now()}`;
    console.log('Cloning voice with name:', voiceName, 'ID:', finalVoiceId, 'Noise reduction:', noiseReduction);

    // MiniMax Voice Clone API
    const response = await fetch('https://api.minimax.chat/v1/voice_clone', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MINIMAX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        voice_id: finalVoiceId,
        name: voiceName,
        audio: audioData,
        audio_format: audioFormat || 'mp3',
        description: `Cloned voice: ${voiceName}`,
        noise_reduction: noiseReduction !== false, // Default to true
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
        JSON.stringify({ error: data.base_resp?.status_msg || 'Voice cloning failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Voice cloned successfully:', data);

    return new Response(
      JSON.stringify({ 
        voiceId: data.voice_id || finalVoiceId,
        message: 'Voice cloned successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Voice cloning error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to clone voice';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
