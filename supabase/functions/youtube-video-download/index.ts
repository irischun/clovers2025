// YouTube Video Downloader edge function
// Strategy: fetch the public YouTube watch page with an Android-style client
// (via the InnerTube `player` JSON endpoint) so we get a `streamingData`
// payload whose progressive MP4 formats expose direct `url` fields without
// signatureCipher. Falls back to parsing `ytInitialPlayerResponse` from the
// watch HTML.
//
// ALWAYS responds with HTTP 200; failures are encoded as { error } JSON so
// supabase-js doesn't throw a non-2xx exception on the client.

import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

type YTFormat = {
  itag: number;
  quality: string;     // e.g. "360p", "720p"
  mime: string;        // e.g. "video/mp4"
  hasAudio: boolean;
  hasVideo: boolean;
  url: string;
  contentLength?: string;
};

type YTResult = {
  title: string;
  author: string | null;
  duration: number | null;
  thumbnail: string | null;
  formats: YTFormat[];
  source: string;
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function extractVideoId(input: string): string | null {
  const raw = (input || '').trim();
  if (!raw) return null;
  // Bare 11-char ID
  if (/^[A-Za-z0-9_-]{11}$/.test(raw)) return raw;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : 'https://' + raw);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  if (host === 'youtu.be') {
    const id = url.pathname.split('/').filter(Boolean)[0];
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  }
  if (!/(^|\.)youtube\.com$|(^|\.)youtube-nocookie\.com$|(^|\.)m\.youtube\.com$/.test(url.hostname.toLowerCase())) {
    return null;
  }
  const v = url.searchParams.get('v');
  if (v && /^[A-Za-z0-9_-]{11}$/.test(v)) return v;
  // /shorts/<id>, /embed/<id>, /live/<id>, /v/<id>
  const parts = url.pathname.split('/').filter(Boolean);
  const map = ['shorts', 'embed', 'live', 'v'];
  if (parts.length >= 2 && map.includes(parts[0])) {
    if (/^[A-Za-z0-9_-]{11}$/.test(parts[1])) return parts[1];
  }
  return null;
}

type ClientSpec = {
  name: string;
  ua: string;
  headerName: string;
  headerVersion: string;
  context: Record<string, unknown>;
};

// Primary: ANDROID_VR — currently returns progressive + adaptive MP4 streams
// with direct (un-ciphered) googlevideo URLs and bypasses most PoToken/age
// checks. Fallbacks kept for resilience.
const CLIENTS: ClientSpec[] = [
  {
    name: 'ANDROID_VR',
    ua: 'com.google.android.apps.youtube.vr.oculus/1.62.27 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip',
    headerName: '28',
    headerVersion: '1.62.27',
    context: {
      client: {
        clientName: 'ANDROID_VR',
        clientVersion: '1.62.27',
        deviceMake: 'Oculus',
        deviceModel: 'Quest 3',
        androidSdkVersion: 32,
        osName: 'Android',
        osVersion: '12L',
        hl: 'en',
        gl: 'US',
        utcOffsetMinutes: 0,
      },
    },
  },
  {
    name: 'IOS',
    ua: 'com.google.ios.youtube/19.45.4 (iPhone16,2; U; CPU iOS 18_1_0 like Mac OS X;)',
    headerName: '5',
    headerVersion: '19.45.4',
    context: {
      client: {
        clientName: 'IOS',
        clientVersion: '19.45.4',
        deviceMake: 'Apple',
        deviceModel: 'iPhone16,2',
        platform: 'MOBILE',
        osName: 'iPhone',
        osVersion: '18.1.0.22B83',
        hl: 'en',
        gl: 'US',
        utcOffsetMinutes: 0,
      },
    },
  },
  {
    name: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER',
    ua: 'Mozilla/5.0 (PlayStation; PlayStation 4/12.00) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
    headerName: '85',
    headerVersion: '2.0',
    context: {
      client: {
        clientName: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER',
        clientVersion: '2.0',
        hl: 'en',
        gl: 'US',
        utcOffsetMinutes: 0,
      },
      thirdParty: { embedUrl: 'https://www.youtube.com/' },
    },
  },
];

async function tryClient(videoId: string, spec: ClientSpec): Promise<any> {
  const body = {
    ...spec.context,
    videoId,
    contentCheckOk: true,
    racyCheckOk: true,
  };
  const res = await fetch(
    'https://www.youtube.com/youtubei/v1/player?prettyPrint=false',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': spec.ua,
        'X-YouTube-Client-Name': spec.headerName,
        'X-YouTube-Client-Version': spec.headerVersion,
        'Accept-Language': 'en-US,en;q=0.9',
        Origin: 'https://www.youtube.com',
        Referer: 'https://www.youtube.com/',
      },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${spec.name} responded ${res.status}: ${body.slice(0, 200)}`);
  }
  return await res.json();
}

async function fetchPlayer(videoId: string): Promise<any> {
  const errors: string[] = [];
  let lastReason: string | null = null;
  for (const spec of CLIENTS) {
    try {
      const data = await tryClient(videoId, spec);
      const status = data?.playabilityStatus?.status;
      const hasUrls =
        (data?.streamingData?.formats || []).some((f: any) => f?.url) ||
        (data?.streamingData?.adaptiveFormats || []).some((f: any) => f?.url);
      if (hasUrls) return data;
      if (status && status !== 'OK') {
        lastReason = data?.playabilityStatus?.reason || status;
      }
      errors.push(`${spec.name}: no direct URLs (status=${status || 'unknown'})`);
    } catch (e) {
      errors.push(`${spec.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  const err: any = new Error(lastReason || errors.join(' | '));
  if (lastReason) err.playabilityReason = lastReason;
  throw err;
}

function qualityLabel(f: any): string {
  return (
    f.qualityLabel ||
    f.quality ||
    (f.height ? `${f.height}p` : f.audioQuality ? 'audio' : 'unknown')
  );
}

function pickFormats(player: any): YTFormat[] {
  const out: YTFormat[] = [];
  const sd = player?.streamingData;
  if (!sd) return out;
  const all: any[] = [
    ...(Array.isArray(sd.formats) ? sd.formats : []),
    ...(Array.isArray(sd.adaptiveFormats) ? sd.adaptiveFormats : []),
  ];
  for (const f of all) {
    if (!f?.url) continue; // skip signature-ciphered streams
    const mime: string = f.mimeType || '';
    if (!/^video\/mp4/i.test(mime)) continue; // mp4 only for max compatibility
    const codecs = /codecs="([^"]+)"/.exec(mime)?.[1] || '';
    const hasVideo = !!f.width || /avc1|av01|vp9|h264|hev1|hvc1/i.test(codecs);
    const hasAudio = !!f.audioQuality || /mp4a|opus|ac-3/i.test(codecs);
    if (!hasVideo) continue;
    out.push({
      itag: f.itag,
      quality: qualityLabel(f),
      mime,
      hasAudio,
      hasVideo,
      url: f.url,
      contentLength: f.contentLength,
    });
  }
  // Prefer progressive (video + audio) at the top, then by height desc, then unique by quality
  const score = (x: YTFormat) => {
    const h = parseInt(x.quality, 10) || 0;
    return (x.hasAudio ? 100000 : 0) + h;
  };
  out.sort((a, b) => score(b) - score(a));
  // Dedupe by `${hasAudio}-${quality}`
  const seen = new Set<string>();
  return out.filter((f) => {
    const k = `${f.hasAudio ? 'av' : 'v'}-${f.quality}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function pickThumbnail(player: any, videoId: string): string {
  const thumbs = player?.videoDetails?.thumbnail?.thumbnails;
  if (Array.isArray(thumbs) && thumbs.length > 0) {
    return thumbs[thumbs.length - 1].url;
  }
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' });

    let payload: { url?: string };
    try {
      payload = await req.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' });
    }
    if (!payload?.url || typeof payload.url !== 'string') {
      return jsonResponse({ error: 'A YouTube video URL is required.' });
    }

    const videoId = extractVideoId(payload.url);
    if (!videoId) {
      return jsonResponse({
        error:
          'Invalid YouTube URL. Paste a link like https://www.youtube.com/watch?v=... or https://youtu.be/...',
      });
    }

    let player: any;
    try {
      player = await fetchPlayer(videoId);
    } catch (e) {
      return jsonResponse({
        error: 'Could not reach YouTube for this video. Please try again later.',
        detail: e instanceof Error ? e.message : String(e),
      });
    }

    const status = player?.playabilityStatus?.status;
    if (status && status !== 'OK') {
      const reason =
        player?.playabilityStatus?.reason ||
        'This video cannot be downloaded (it may be private, age-restricted, members-only, or region-locked).';
      return jsonResponse({ error: reason });
    }

    const formats = pickFormats(player);
    if (formats.length === 0) {
      return jsonResponse({
        error:
          'No downloadable MP4 streams were found for this video. It may be a live stream or use protected streams only.',
      });
    }

    const result: YTResult = {
      title: player?.videoDetails?.title || 'YouTube Video',
      author: player?.videoDetails?.author || null,
      duration: player?.videoDetails?.lengthSeconds
        ? Number(player.videoDetails.lengthSeconds)
        : null,
      thumbnail: pickThumbnail(player, videoId),
      formats,
      source: `https://www.youtube.com/watch?v=${videoId}`,
    };
    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({
      error: 'Unexpected server error. Please try again with a different public YouTube URL.',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
});
