// YouTube Video Downloader edge function
//
// Strategy (in order, first success wins):
//   1) Piped public API instances  — community-hosted, residential IPs,
//      returns direct googlevideo URLs in `videoStreams` / `audioStreams`.
//   2) Invidious public API instances — same idea, different schema
//      (`formatStreams` + `adaptiveFormats`).
//   3) YouTube InnerTube (ANDROID_VR / IOS / TVHTML5) as a last resort.
//
// Each instance is tried with a short per-request timeout so a single dead
// mirror cannot stall the whole call. We always respond HTTP 200 so the
// supabase-js client never throws on a non-2xx; failures are encoded as
// { error } JSON.

import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

type YTFormat = {
  itag?: number;
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
  const parts = url.pathname.split('/').filter(Boolean);
  const map = ['shorts', 'embed', 'live', 'v'];
  if (parts.length >= 2 && map.includes(parts[0])) {
    if (/^[A-Za-z0-9_-]{11}$/.test(parts[1])) return parts[1];
  }
  return null;
}

// ---------------------------------------------------------------------------
// 0) Self-hosted yt-dlp proxy (preferred when configured)
// ---------------------------------------------------------------------------
async function tryYtdlpProxy(videoId: string): Promise<YTResult | null> {
  const base = (Deno.env.get('YTDLP_PROXY_URL') || '').trim().replace(/\/+$/, '');
  const token = (Deno.env.get('YTDLP_PROXY_TOKEN') || '').trim();
  if (!base) return null;

  // Two attempts in case of cold-start (Render free tier sleeps after 15min).
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetchWithTimeout(
        `${base}/extract?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`,
        {
          headers: token
            ? { 'X-Auth-Token': token, Accept: 'application/json' }
            : { Accept: 'application/json' },
        },
        attempt === 0 ? 12000 : 35000, // 2nd attempt waits longer for cold-start
      );
      if (!res.ok) {
        if (attempt === 0 && (res.status === 502 || res.status === 503 || res.status === 504)) {
          // Likely cold-start; retry once with longer timeout.
          await new Promise((r) => setTimeout(r, 1500));
          continue;
        }
        return null;
      }
      const data: any = await res.json();
      if (!data || !Array.isArray(data.formats) || data.formats.length === 0) {
        return null;
      }
      return {
        title: data.title || 'YouTube Video',
        author: data.author || null,
        duration: typeof data.duration === 'number' ? data.duration : null,
        thumbnail: data.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        formats: data.formats as YTFormat[],
        source: `https://www.youtube.com/watch?v=${videoId}`,
      };
    } catch {
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }
      return null;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// 0b) Apify actor (preferred when APIFY_API_TOKEN is configured)
//    Default actor: streamers/youtube-video-downloader (override via APIFY_ACTOR_ID)
// ---------------------------------------------------------------------------
async function tryApify(videoId: string): Promise<YTResult | null> {
  const token = (Deno.env.get('APIFY_API_TOKEN') || '').trim();
  if (!token) return null;
  const actorId = (Deno.env.get('APIFY_ACTOR_ID') || 'streamers/youtube-video-downloader').trim();
  const actorPath = actorId.replace('/', '~');
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    const res = await fetchWithTimeout(
      `https://api.apify.com/v2/acts/${actorPath}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}&timeout=90`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          startUrls: [{ url: videoUrl }],
          videoUrls: [videoUrl],
          urls: [videoUrl],
          maxItems: 1,
          proxy: { useApifyProxy: true },
        }),
      },
      90000,
    );
    if (!res.ok) return null;
    const items: any = await res.json();
    const item = Array.isArray(items) ? items[0] : items;
    if (!item) return null;

    const rawFormats: any[] =
      (Array.isArray(item.formats) && item.formats) ||
      (Array.isArray(item.downloadUrls) && item.downloadUrls) ||
      (Array.isArray(item.videos) && item.videos) ||
      [];

    const formats: YTFormat[] = [];
    for (const f of rawFormats) {
      const url = f?.url || f?.downloadUrl || f?.src;
      if (!url || typeof url !== 'string') continue;
      const mime: string = f.mimeType || f.mime || (f.ext === 'mp4' ? 'video/mp4' : 'video/mp4');
      const height = f.height || (typeof f.quality === 'string' ? parseInt(f.quality) : undefined);
      formats.push({
        quality: f.quality || (height ? `${height}p` : f.label || 'unknown'),
        mime,
        hasVideo: f.hasVideo !== false,
        hasAudio: f.hasAudio !== false,
        url,
        contentLength: f.contentLength?.toString?.() || f.filesize?.toString?.(),
      });
    }
    // Single top-level url fallback
    if (formats.length === 0 && typeof item.url === 'string' && /^https?:\/\//.test(item.url) && item.url !== videoUrl) {
      formats.push({
        quality: item.quality || 'best',
        mime: 'video/mp4',
        hasVideo: true,
        hasAudio: true,
        url: item.url,
      });
    }
    if (formats.length === 0) return null;

    return {
      title: item.title || item.name || 'YouTube Video',
      author: item.author || item.channelName || item.uploader || null,
      duration: typeof item.duration === 'number' ? item.duration : null,
      thumbnail: item.thumbnail || item.thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      formats,
      source: videoUrl,
    };
  } catch {
    return null;
  }
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, ms = 8000): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

// ---------------------------------------------------------------------------
// 1) Piped public instances
// ---------------------------------------------------------------------------
const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.adminforge.de',
  'https://pipedapi.r4fo.com',
  'https://pipedapi.reallyaweso.me',
  'https://piped-api.privacy.com.de',
  'https://api.piped.private.coffee',
  'https://pipedapi.drgns.space',
  'https://pipedapi.smnz.de',
  'https://pipedapi.ducks.party',
  'https://pipedapi.nosebs.ru',
];

function normalizePipedQuality(q: string | undefined, height?: number): string {
  if (q) return q;
  if (height) return `${height}p`;
  return 'unknown';
}

async function tryPiped(videoId: string): Promise<YTResult | null> {
  for (const base of PIPED_INSTANCES) {
    try {
      const res = await fetchWithTimeout(
        `${base}/streams/${videoId}`,
        { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' } },
        7000,
      );
      if (!res.ok) continue;
      const data: any = await res.json();
      if (!data || data.error) continue;
      const video: any[] = Array.isArray(data.videoStreams) ? data.videoStreams : [];
      if (video.length === 0) continue;

      const formats: YTFormat[] = [];
      for (const v of video) {
        if (!v?.url) continue;
        const mime: string = v.mimeType || (v.format === 'MPEG_4' ? 'video/mp4' : '');
        if (!/^video\/mp4/i.test(mime)) continue;
        formats.push({
          quality: normalizePipedQuality(v.quality, v.height),
          mime,
          hasVideo: true,
          hasAudio: v.videoOnly === false,
          url: v.url,
          contentLength: v.contentLength?.toString?.(),
        });
      }
      if (formats.length === 0) continue;

      // Sort progressive (av) first, then by height desc
      const score = (x: YTFormat) =>
        (x.hasAudio ? 100000 : 0) + (parseInt(x.quality, 10) || 0);
      formats.sort((a, b) => score(b) - score(a));

      // Dedupe
      const seen = new Set<string>();
      const deduped = formats.filter((f) => {
        const k = `${f.hasAudio ? 'av' : 'v'}-${f.quality}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });

      return {
        title: data.title || 'YouTube Video',
        author: data.uploader || null,
        duration: typeof data.duration === 'number' ? data.duration : null,
        thumbnail:
          data.thumbnailUrl || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        formats: deduped,
        source: `https://www.youtube.com/watch?v=${videoId}`,
      };
    } catch {
      // try next instance
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// 2) Invidious public instances
// ---------------------------------------------------------------------------
const INVIDIOUS_INSTANCES = [
  'https://invidious.nerdvpn.de',
  'https://invidious.privacyredirect.com',
  'https://inv.nadeko.net',
  'https://invidious.f5.si',
  'https://invidious.reallyaweso.me',
  'https://yewtu.be',
];

async function tryInvidious(videoId: string): Promise<YTResult | null> {
  for (const base of INVIDIOUS_INSTANCES) {
    try {
      const res = await fetchWithTimeout(
        `${base}/api/v1/videos/${videoId}?fields=title,author,lengthSeconds,videoThumbnails,formatStreams,adaptiveFormats`,
        { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' } },
        7000,
      );
      if (!res.ok) continue;
      const data: any = await res.json();
      if (!data || data.error) continue;

      const formats: YTFormat[] = [];
      const all: any[] = [
        ...(Array.isArray(data.formatStreams) ? data.formatStreams : []),  // progressive
        ...(Array.isArray(data.adaptiveFormats) ? data.adaptiveFormats : []),
      ];
      for (const f of all) {
        if (!f?.url) continue;
        const type: string = f.type || '';
        if (!/^video\/mp4/i.test(type)) continue;
        // Invidious format streams contain both audio+video; adaptive video-only are videoOnly:true-ish
        const isProgressive = Array.isArray(data.formatStreams) && data.formatStreams.includes(f);
        formats.push({
          itag: Number(f.itag) || undefined,
          quality: f.qualityLabel || f.quality || (f.resolution ? f.resolution : 'unknown'),
          mime: type,
          hasVideo: true,
          hasAudio: isProgressive,
          url: f.url,
          contentLength: f.clen?.toString?.(),
        });
      }
      if (formats.length === 0) continue;
      const score = (x: YTFormat) =>
        (x.hasAudio ? 100000 : 0) + (parseInt(x.quality, 10) || 0);
      formats.sort((a, b) => score(b) - score(a));
      const seen = new Set<string>();
      const deduped = formats.filter((f) => {
        const k = `${f.hasAudio ? 'av' : 'v'}-${f.quality}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });

      const thumbs = Array.isArray(data.videoThumbnails) ? data.videoThumbnails : [];
      const thumb =
        thumbs.find((t: any) => t.quality === 'maxresdefault') ||
        thumbs.find((t: any) => t.quality === 'sddefault') ||
        thumbs[thumbs.length - 1];

      return {
        title: data.title || 'YouTube Video',
        author: data.author || null,
        duration: typeof data.lengthSeconds === 'number' ? data.lengthSeconds : null,
        thumbnail: thumb?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        formats: deduped,
        source: `https://www.youtube.com/watch?v=${videoId}`,
      };
    } catch {
      // try next
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// 3) YouTube InnerTube fallback (datacenter IP may be blocked, but try anyway)
// ---------------------------------------------------------------------------
type ClientSpec = {
  name: string;
  ua: string;
  headerName: string;
  headerVersion: string;
  apiKey: string;
  context: Record<string, unknown>;
};

const INNERTUBE_CLIENTS: ClientSpec[] = [
  {
    name: 'ANDROID_VR',
    ua: 'com.google.android.apps.youtube.vr.oculus/1.62.27 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip',
    headerName: '28',
    headerVersion: '1.62.27',
    apiKey: 'AIzaSyA8eiZmM1FaDVjRy-df2KTyQ_vz_yYM39w',
    context: {
      client: {
        clientName: 'ANDROID_VR', clientVersion: '1.62.27',
        deviceMake: 'Oculus', deviceModel: 'Quest 3',
        androidSdkVersion: 32, osName: 'Android', osVersion: '12L',
        hl: 'en', gl: 'US', utcOffsetMinutes: 0,
      },
    },
  },
  {
    name: 'IOS',
    ua: 'com.google.ios.youtube/19.45.4 (iPhone16,2; U; CPU iOS 18_1_0 like Mac OS X;)',
    headerName: '5', headerVersion: '19.45.4',
    apiKey: 'AIzaSyB-63vPrdThhKuerbB2N_l7Kwwcxj6yUAc',
    context: {
      client: {
        clientName: 'IOS', clientVersion: '19.45.4',
        deviceMake: 'Apple', deviceModel: 'iPhone16,2',
        platform: 'MOBILE', osName: 'iPhone', osVersion: '18.1.0.22B83',
        hl: 'en', gl: 'US', utcOffsetMinutes: 0,
      },
    },
  },
];

async function tryInnerTubeClient(videoId: string, spec: ClientSpec): Promise<any> {
  const body = { ...spec.context, videoId, contentCheckOk: true, racyCheckOk: true };
  const res = await fetchWithTimeout(
    `https://music.youtube.com/youtubei/v1/player?key=${spec.apiKey}&prettyPrint=false`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': spec.ua,
        'X-YouTube-Client-Name': spec.headerName,
        'X-YouTube-Client-Version': spec.headerVersion,
        'Accept-Language': 'en-US,en;q=0.9',
      },
      body: JSON.stringify(body),
    },
    7000,
  );
  if (!res.ok) throw new Error(`${spec.name} HTTP ${res.status}`);
  return await res.json();
}

async function tryInnerTube(videoId: string): Promise<YTResult | null> {
  for (const spec of INNERTUBE_CLIENTS) {
    try {
      const data = await tryInnerTubeClient(videoId, spec);
      const sd = data?.streamingData;
      if (!sd) continue;
      const all: any[] = [
        ...(Array.isArray(sd.formats) ? sd.formats : []),
        ...(Array.isArray(sd.adaptiveFormats) ? sd.adaptiveFormats : []),
      ];
      const formats: YTFormat[] = [];
      for (const f of all) {
        if (!f?.url) continue;
        const mime: string = f.mimeType || '';
        if (!/^video\/mp4/i.test(mime)) continue;
        const codecs = /codecs="([^"]+)"/.exec(mime)?.[1] || '';
        const hasVideo = !!f.width || /avc1|av01|vp9|h264|hev1|hvc1/i.test(codecs);
        const hasAudio = !!f.audioQuality || /mp4a|opus|ac-3/i.test(codecs);
        if (!hasVideo) continue;
        formats.push({
          itag: f.itag,
          quality: f.qualityLabel || f.quality || (f.height ? `${f.height}p` : 'unknown'),
          mime, hasAudio, hasVideo, url: f.url,
          contentLength: f.contentLength,
        });
      }
      if (formats.length === 0) continue;
      const score = (x: YTFormat) =>
        (x.hasAudio ? 100000 : 0) + (parseInt(x.quality, 10) || 0);
      formats.sort((a, b) => score(b) - score(a));
      const seen = new Set<string>();
      const deduped = formats.filter((f) => {
        const k = `${f.hasAudio ? 'av' : 'v'}-${f.quality}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      const thumbs = data?.videoDetails?.thumbnail?.thumbnails;
      return {
        title: data?.videoDetails?.title || 'YouTube Video',
        author: data?.videoDetails?.author || null,
        duration: data?.videoDetails?.lengthSeconds
          ? Number(data.videoDetails.lengthSeconds)
          : null,
        thumbnail:
          (Array.isArray(thumbs) && thumbs.length > 0 && thumbs[thumbs.length - 1].url) ||
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        formats: deduped,
        source: `https://www.youtube.com/watch?v=${videoId}`,
      };
    } catch {
      // try next client
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// GET ?stream=<googlevideo url>&filename=...
//   Streams the upstream video back with Content-Disposition: attachment so a
//   plain <a href> click gives the user a real download with no CORS issue.
// ---------------------------------------------------------------------------
async function handleStreamProxy(req: Request): Promise<Response> {
  const u = new URL(req.url);
  const target = u.searchParams.get('stream') || '';
  const filename = (u.searchParams.get('filename') || 'youtube-video.mp4')
    .replace(/[^\w.\-]+/g, '_')
    .slice(0, 120);
  if (!target) return jsonResponse({ error: 'Missing stream param' }, 400);

  let parsed: URL;
  try { parsed = new URL(target); }
  catch { return jsonResponse({ error: 'Invalid stream URL' }, 400); }

  // SSRF guard: only allow Google's video CDN hosts.
  if (!/(^|\.)googlevideo\.com$|(^|\.)youtube\.com$/i.test(parsed.hostname)) {
    return jsonResponse({ error: 'Disallowed host' }, 400);
  }

  const upstream = await fetch(parsed.toString(), {
    headers: {
      ...(req.headers.get('range') ? { Range: req.headers.get('range')! } : {}),
      'User-Agent': 'Mozilla/5.0',
    },
  });

  const headers = new Headers(corsHeaders);
  headers.set('Content-Type', upstream.headers.get('content-type') || 'video/mp4');
  const len = upstream.headers.get('content-length');
  if (len) headers.set('Content-Length', len);
  const range = upstream.headers.get('content-range');
  if (range) headers.set('Content-Range', range);
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Content-Disposition', `attachment; filename="${filename}"`);
  headers.set('Cache-Control', 'no-store');
  return new Response(upstream.body, { status: upstream.status, headers });
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method === 'GET' && new URL(req.url).searchParams.has('stream')) {
    try {
      return await handleStreamProxy(req);
    } catch (err) {
      return jsonResponse({
        error: 'Stream proxy failed',
        detail: err instanceof Error ? err.message : String(err),
      }, 502);
    }
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

    // Try each strategy in order. First non-null wins.
    let result: YTResult | null = null;
    const errors: string[] = [];

    try {
      result = await tryYtdlpProxy(videoId);
    } catch (e) {
      errors.push(`ytdlp-proxy:${e instanceof Error ? e.message : String(e)}`);
    }
    if (!result) {
      try {
        result = await tryPiped(videoId);
      } catch (e) {
        errors.push(`piped:${e instanceof Error ? e.message : String(e)}`);
      }
    }
    if (!result) {
      try {
        result = await tryInvidious(videoId);
      } catch (e) {
        errors.push(`invidious:${e instanceof Error ? e.message : String(e)}`);
      }
    }
    if (!result) {
      try {
        result = await tryInnerTube(videoId);
      } catch (e) {
        errors.push(`innertube:${e instanceof Error ? e.message : String(e)}`);
      }
    }

    if (!result) {
      return jsonResponse({
        error:
          'Could not retrieve this video right now. All extraction mirrors failed. Please try again in a moment or use a different video.',
        detail: errors.join(' | ').slice(0, 500),
      });
    }

    if (result.formats.length === 0) {
      return jsonResponse({
        error:
          'No downloadable MP4 streams were found for this video. It may be a live stream or use protected streams only.',
      });
    }

    return jsonResponse(result);
  } catch (err) {
    return jsonResponse({
      error: 'Unexpected server error. Please try again with a different public YouTube URL.',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
});
