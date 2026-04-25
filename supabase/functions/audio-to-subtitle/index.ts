import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SUPPORTED_LANGUAGES = new Set(['zh-TW', 'zh-CN', 'en', 'ja', 'ko']);
const LANGUAGE_LABELS: Record<string, string> = {
  'zh-TW': 'Traditional Chinese (繁體中文)',
  'zh-CN': 'Simplified Chinese (简体中文)',
  'en': 'English',
  'ja': 'Japanese (日本語)',
  'ko': 'Korean (한국어)',
};
const MAX_LANGUAGES = 5;
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7;
// Gemini inline_data limit ~20MB; keep a safety margin
const MAX_INLINE_BYTES = 18 * 1024 * 1024;

type AuthResult = { userId: string };
type CaptionSegment = { start: number; end: number; text: string };

async function verifyAuth(req: Request): Promise<AuthResult | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) return null;

  return { userId: data.claims.sub as string };
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function validateBody(body: any) {
  const conversionId = typeof body?.conversionId === 'string' ? body.conversionId : '';
  const sourcePath = typeof body?.sourcePath === 'string' && body.sourcePath.trim() ? body.sourcePath.trim() : null;
  const sourceUrl = typeof body?.sourceUrl === 'string' && body.sourceUrl.trim() ? body.sourceUrl.trim() : null;
  const languages: string[] = Array.isArray(body?.languages) ? body.languages.filter((lang: unknown): lang is string => typeof lang === 'string') : [];

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(conversionId)) {
    throw new Error('Invalid conversion id');
  }

  const uniqueLanguages: string[] = [...new Set(languages)];
  if (uniqueLanguages.length === 0 || uniqueLanguages.length > MAX_LANGUAGES || uniqueLanguages.some((lang) => !SUPPORTED_LANGUAGES.has(lang))) {
    throw new Error('Invalid subtitle language selection');
  }

  if (!sourcePath && !sourceUrl) {
    throw new Error('Missing audio or video source');
  }

  return { conversionId, sourcePath, sourceUrl, languages: uniqueLanguages };
}

function formatSRTTime(totalSeconds: number) {
  const boundedSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(boundedSeconds / 3600);
  const minutes = Math.floor((boundedSeconds % 3600) / 60);
  const seconds = Math.floor(boundedSeconds % 60);
  const milliseconds = Math.floor((boundedSeconds - Math.floor(boundedSeconds)) * 1000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
}

function toSRT(segments: CaptionSegment[]) {
  // Standard SRT format with CRLF line endings — maximally compatible with CapCut, Premiere, DaVinci, etc.
  const blocks = segments.map((segment, index) => {
    const idx = index + 1;
    const time = `${formatSRTTime(segment.start)} --> ${formatSRTTime(segment.end)}`;
    const text = segment.text.trim().replace(/\r\n?/g, '\n');
    return `${idx}\r\n${time}\r\n${text}\r\n`;
  });
  return blocks.join('\r\n');
}

function inferMimeType(path: string | null, fallback = 'audio/mpeg'): string {
  if (!path) return fallback;
  const lower = path.toLowerCase();
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  if (lower.endsWith('.wav')) return 'audio/wav';
  if (lower.endsWith('.m4a')) return 'audio/mp4';
  if (lower.endsWith('.aac')) return 'audio/aac';
  if (lower.endsWith('.ogg') || lower.endsWith('.oga')) return 'audio/ogg';
  if (lower.endsWith('.flac')) return 'audio/flac';
  if (lower.endsWith('.mp4')) return 'video/mp4';
  if (lower.endsWith('.mov')) return 'video/quicktime';
  if (lower.endsWith('.webm')) return 'video/webm';
  if (lower.endsWith('.mkv')) return 'video/x-matroska';
  if (lower.endsWith('.avi')) return 'video/x-msvideo';
  return fallback;
}

async function fetchSourceBytes(supabase: any, sourcePath: string | null, sourceUrl: string | null): Promise<{ bytes: Uint8Array; mimeType: string }> {
  if (sourcePath) {
    // Download directly from storage using service role
    const { data, error } = await supabase.storage.from('media').download(sourcePath);
    if (error || !data) throw new Error(`Cannot download media file: ${error?.message || 'unknown error'}`);
    const buf = new Uint8Array(await (data as Blob).arrayBuffer());
    const mime = (data as Blob).type || inferMimeType(sourcePath);
    return { bytes: buf, mimeType: mime };
  }
  // Fallback: fetch from URL (e.g., voice library audio_url)
  const resp = await fetch(sourceUrl!);
  if (!resp.ok) throw new Error(`Cannot fetch source URL (${resp.status})`);
  const buf = new Uint8Array(await resp.arrayBuffer());
  const mime = resp.headers.get('content-type') || inferMimeType(sourceUrl);
  return { bytes: buf, mimeType: mime };
}

async function transcribeWithGemini(bytes: Uint8Array, mimeType: string, language: string): Promise<CaptionSegment[]> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) throw new Error('AI gateway not configured');

  if (bytes.byteLength > MAX_INLINE_BYTES) {
    throw new Error(`File too large for transcription (${(bytes.byteLength / 1024 / 1024).toFixed(1)}MB). Please upload a file under ${(MAX_INLINE_BYTES / 1024 / 1024).toFixed(0)}MB.`);
  }

  const langLabel = LANGUAGE_LABELS[language] || language;
  // Encode bytes to base64 in chunks to avoid call-stack overflow on large arrays
  const base64Audio = base64Encode(bytes);

  const systemPrompt = `You are a professional audio/video transcription engine. Listen to the supplied media carefully and produce accurate, time-aligned captions in ${langLabel}. Preserve the speaker's meaning, punctuation, and natural sentence breaks. Never invent content. If a portion is unclear, transcribe what you can hear.`;

  const userInstructions = `Transcribe the attached media into ${langLabel} captions.

Rules:
- Output ONLY a JSON object that matches the provided tool schema.
- Each segment should be a single readable line, typically 1–15 seconds long, broken on natural sentence or phrase boundaries.
- Use accurate timestamps in SECONDS (decimal allowed). The first segment should start at 0 or the moment speech begins.
- Segments must not overlap; each end > start; segments in chronological order.
- Translate to ${langLabel} if the source audio is in another language. Keep meaning faithful.
- Do not add narration like "[music]" or "[silence]". Only spoken/sung words.
- If the media truly contains no intelligible speech, return an empty segments array.`;

  const requestBody = {
    model: 'google/gemini-2.5-flash',
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'text', text: userInstructions },
          {
            type: 'input_audio',
            input_audio: {
              data: base64Audio,
              format: mimeType.includes('wav') ? 'wav' : mimeType.includes('mp3') || mimeType.includes('mpeg') ? 'mp3' : mimeType.split('/')[1] || 'mp3',
            },
          },
        ],
      },
    ],
    tools: [
      {
        type: 'function',
        function: {
          name: 'emit_captions',
          description: 'Emit time-aligned caption segments for the transcribed media.',
          parameters: {
            type: 'object',
            properties: {
              segments: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    start: { type: 'number', description: 'Start time in seconds.' },
                    end: { type: 'number', description: 'End time in seconds.' },
                    text: { type: 'string', description: `Caption text in ${langLabel}.` },
                  },
                  required: ['start', 'end', 'text'],
                  additionalProperties: false,
                },
              },
            },
            required: ['segments'],
            additionalProperties: false,
          },
        },
      },
    ],
    tool_choice: { type: 'function', function: { name: 'emit_captions' } },
  };

  // First attempt: input_audio shape (works with audio MIME)
  let response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  });

  // If gateway rejects input_audio shape, retry with image_url-style data URL (Gemini accepts media via data URL too)
  if (!response.ok) {
    const errorText = await response.text();
    console.warn('Caption AI primary call failed, retrying with data URL. Status:', response.status, errorText.slice(0, 300));

    const dataUrlBody = {
      ...requestBody,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: userInstructions },
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Audio}` } },
          ],
        },
      ],
    };

    response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(dataUrlBody),
    });
  }

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 429) throw new Error('AI rate limit reached. Please try again in a moment.');
    if (response.status === 402) throw new Error('AI credits exhausted. Please add credits in Settings → Workspace → Usage.');
    throw new Error(`AI transcription failed (${response.status}): ${errorText.slice(0, 200)}`);
  }

  const result = await response.json();
  const message = result?.choices?.[0]?.message;
  let segments: any[] = [];

  // Prefer tool call output
  const toolCall = message?.tool_calls?.[0];
  if (toolCall?.function?.arguments) {
    try {
      const args = JSON.parse(toolCall.function.arguments);
      if (Array.isArray(args?.segments)) segments = args.segments;
    } catch (e) {
      console.error('Tool args parse error:', e);
    }
  }

  // Fallback to JSON in content
  if (segments.length === 0 && typeof message?.content === 'string') {
    try {
      const cleaned = message.content.replace(/```(?:json)?\s*|\s*```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed?.segments)) segments = parsed.segments;
    } catch {
      // ignore
    }
  }

  const cleanSegments: CaptionSegment[] = segments
    .map((segment: any) => ({
      start: Number(segment.start),
      end: Number(segment.end),
      text: String(segment.text || '').trim(),
    }))
    .filter((segment: CaptionSegment) =>
      Number.isFinite(segment.start) &&
      Number.isFinite(segment.end) &&
      segment.end > segment.start &&
      segment.text.length > 0
    )
    .sort((a, b) => a.start - b.start);

  if (cleanSegments.length === 0) {
    throw new Error('Transcription returned no captions. The media may contain no speech, or the audio quality is too low.');
  }

  return cleanSegments;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const auth = await verifyAuth(req);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  let conversionId: string | null = null;

  try {
    const parsedBody = validateBody(await req.json());
    conversionId = parsedBody.conversionId;
    const { sourcePath, sourceUrl, languages } = parsedBody;

    console.log('Audio to subtitle request:', {
      userId: auth.userId,
      conversionId,
      languageCount: languages.length,
      hasSourcePath: Boolean(sourcePath),
      hasSourceUrl: Boolean(sourceUrl),
    });

    const { data: conversion, error: conversionError } = await supabase
      .from('subtitle_conversions')
      .select('id, user_id, status')
      .eq('id', conversionId)
      .eq('user_id', auth.userId)
      .single();

    if (conversionError || !conversion) throw new Error('Conversion record not found');

    // Fetch source ONCE, reuse across languages
    const { bytes, mimeType } = await fetchSourceBytes(supabase, sourcePath, sourceUrl);
    console.log(`Source loaded: ${bytes.byteLength} bytes, mime=${mimeType}`);

    const subtitleUrls: Record<string, string> = {};

    for (const language of languages) {
      console.log(`Transcribing language: ${language}`);
      const segments = await transcribeWithGemini(bytes, mimeType, language);
      console.log(`Got ${segments.length} segments for ${language}`);

      const srtContent = toSRT(segments);
      // Add UTF-8 BOM so editors like CapCut on Windows pick up encoding correctly,
      // while remaining a plain editable text file.
      const srtWithBom = '\ufeff' + srtContent;
      const fileName = `${auth.userId}/subtitles/${conversionId}/${language}.srt`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(fileName, new Blob([srtWithBom], { type: 'application/x-subrip;charset=utf-8' }), {
          contentType: 'application/x-subrip;charset=utf-8',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: signedData, error: signedError } = await supabase.storage
        .from('media')
        .createSignedUrl(fileName, SIGNED_URL_TTL_SECONDS);

      if (signedError || !signedData?.signedUrl) throw new Error(`Cannot create subtitle download link for ${language}`);
      subtitleUrls[language] = signedData.signedUrl;
    }

    const { error: updateError } = await supabase
      .from('subtitle_conversions')
      .update({ status: 'completed', subtitle_urls: subtitleUrls })
      .eq('id', conversionId)
      .eq('user_id', auth.userId);

    if (updateError) throw updateError;

    return jsonResponse({ success: true, subtitleUrls, message: 'Subtitles generated successfully' });
  } catch (error) {
    console.error('Error in audio-to-subtitle function:', error);

    if (conversionId) {
      await supabase
        .from('subtitle_conversions')
        .update({ status: 'failed' })
        .eq('id', conversionId)
        .eq('user_id', auth.userId);
    }

    return jsonResponse({ error: error instanceof Error ? error.message : 'An error occurred', success: false }, 500);
  }
});
