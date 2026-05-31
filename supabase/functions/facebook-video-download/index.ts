// Facebook Video Downloader edge function
// Strategy: fetch the public Facebook page with a Googlebot User-Agent so the
// crawler-friendly HTML (which embeds the public DASH manifest) is returned,
// then extract the highest-quality (HD) and lowest-quality (SD) progressive
// MP4 BaseURLs from the manifest. Falls back to browser_native_hd_url /
// browser_native_sd_url when the manifest cannot be parsed.
//
// IMPORTANT: this function ALWAYS responds with HTTP 200 so the client never
// trips the supabase-js "non-2xx status code" exception. Failure cases are
// expressed via the JSON `{ error: "..." }` shape that the frontend already
// handles.

import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

type FBResult = {
  title: string;
  thumbnail: string | null;
  hd: string | null;
  sd: string | null;
  source: string;
};

const GOOGLEBOT_UA =
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';
const BINGBOT_UA =
  'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function normalizeUrl(input: string): string {
  let u = (input || '').trim();
  if (!u) throw new Error('Empty URL');
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  let parsed: URL;
  try {
    parsed = new URL(u);
  } catch {
    throw new Error('Invalid URL');
  }
  const host = parsed.hostname.toLowerCase();
  if (!/(^|\.)facebook\.com$|(^|\.)fb\.watch$/.test(host)) {
    throw new Error('URL must be from facebook.com or fb.watch');
  }
  // Strip tracking params that sometimes break crawler rendering
  ['mibextid', 'rdid', 'share_url'].forEach((k) => parsed.searchParams.delete(k));
  // Use www.facebook.com canonically except for fb.watch short links
  if (/(^|\.)facebook\.com$/.test(host)) {
    parsed.hostname = 'www.facebook.com';
  }
  return parsed.toString();
}

async function fetchAsCrawler(url: string): Promise<{ html: string; finalUrl: string }> {
  const headers = {
    'User-Agent': GOOGLEBOT_UA,
    'Accept-Language': 'en-US,en;q=0.9',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  };
  let res = await fetch(url, { headers, redirect: 'follow' });
  // Some pages (notably /watch redirects to a login wall) fail with Googlebot,
  // so retry once with Bingbot before giving up.
  if (!res.ok) {
    res = await fetch(url, {
      headers: { ...headers, 'User-Agent': BINGBOT_UA },
      redirect: 'follow',
    });
  }
  if (!res.ok) throw new Error(`Facebook responded ${res.status}`);
  const html = await res.text();
  return { html, finalUrl: res.url || url };
}

function decodeJsonStringEscapes(s: string): string {
  // Unescape backslash escapes that Facebook embeds inside JSON string values
  return s
    .replace(/\\\//g, '/')
    .replace(/\\u003C/gi, '<')
    .replace(/\\u003E/gi, '>')
    .replace(/\\u0026/gi, '&')
    .replace(/\\u0022/gi, '"')
    .replace(/\\u0027/gi, "'")
    .replace(/\\u002F/gi, '/')
    .replace(/\\u0025/gi, '%')
    .replace(/\\"/g, '"')
    .replace(/\\n/g, '\n')
    .replace(/\\\\/g, '\\');
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => {
      try { return String.fromCodePoint(parseInt(h, 16)); } catch { return _; }
    })
    .replace(/&#(\d+);/g, (_, d) => {
      try { return String.fromCodePoint(parseInt(d, 10)); } catch { return _; }
    })
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

type Variant = { url: string; height: number; bandwidth: number; quality: 'hd' | 'sd' };

function extractFromDashManifest(html: string): Variant[] {
  const out: Variant[] = [];
  const mpdMatch = html.match(/"dash_manifest_xml_string"\s*:\s*"((?:\\.|[^"\\])*)"/);
  if (!mpdMatch) return out;
  const mpd = decodeHtmlEntities(decodeJsonStringEscapes(mpdMatch[1]));

  // Iterate over every <Representation ...>...</Representation> block that is
  // a video stream. Audio-only Representations don't have a height attribute.
  const repRegex = /<Representation\b([^>]*)>([\s\S]*?)<\/Representation>/g;
  let m: RegExpExecArray | null;
  while ((m = repRegex.exec(mpd)) !== null) {
    const attrs = m[1];
    const body = m[2];
    const mime = /mimeType="([^"]+)"/.exec(attrs)?.[1] || '';
    if (!/^video\//i.test(mime)) continue;
    const heightStr = /\bheight="(\d+)"/.exec(attrs)?.[1];
    const bandwidthStr = /\bbandwidth="(\d+)"/.exec(attrs)?.[1];
    const quality = /FBQualityClass="hd"/.test(attrs) ? 'hd' : 'sd';
    const baseUrl = /<BaseURL>([\s\S]*?)<\/BaseURL>/.exec(body)?.[1]?.trim();
    if (!baseUrl) continue;
    out.push({
      url: baseUrl,
      height: heightStr ? Number(heightStr) : 0,
      bandwidth: bandwidthStr ? Number(bandwidthStr) : 0,
      quality,
    });
  }
  return out;
}

function extractBrowserNative(html: string): { hd?: string; sd?: string } {
  const out: { hd?: string; sd?: string } = {};
  const hd = /"browser_native_hd_url"\s*:\s*"([^"]+)"/.exec(html);
  const sd = /"browser_native_sd_url"\s*:\s*"([^"]+)"/.exec(html);
  if (hd && hd[1] !== 'null') out.hd = decodeJsonStringEscapes(hd[1]);
  if (sd && sd[1] !== 'null') out.sd = decodeJsonStringEscapes(sd[1]);
  return out;
}

function extractThumbnail(html: string): string | null {
  const m =
    /"preferred_thumbnail"\s*:\s*\{[^}]*"image"\s*:\s*\{[^}]*"uri"\s*:\s*"([^"]+)"/.exec(html) ||
    /<meta\s+property="og:image"\s+content="([^"]+)"/.exec(html);
  return m ? decodeHtmlEntities(decodeJsonStringEscapes(m[1])) : null;
}

function extractTitle(html: string): string {
  const m =
    /<meta\s+property="og:title"\s+content="([^"]+)"/.exec(html) ||
    /<meta\s+name="description"\s+content="([^"]+)"/.exec(html) ||
    /<title>([^<]+)<\/title>/.exec(html);
  if (!m) return 'Facebook Video';
  return decodeHtmlEntities(m[1]).replace(/\s*\|\s*Facebook\s*$/i, '').trim() || 'Facebook Video';
}

function pickHdSd(variants: Variant[]): { hd: string | null; sd: string | null } {
  if (variants.length === 0) return { hd: null, sd: null };
  // Highest available = HD, lowest = SD
  const sorted = [...variants].sort((a, b) =>
    (b.height || b.bandwidth) - (a.height || a.bandwidth),
  );
  const hd = sorted[0]?.url ?? null;
  const sd = sorted[sorted.length - 1]?.url ?? hd;
  return { hd, sd: sd === hd ? null : sd };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' });
    }

    let payload: { url?: string };
    try {
      payload = await req.json();
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' });
    }
    if (!payload?.url || typeof payload.url !== 'string') {
      return jsonResponse({ error: 'A Facebook video URL is required.' });
    }

    let target: string;
    try {
      target = normalizeUrl(payload.url);
    } catch (e) {
      return jsonResponse({ error: e instanceof Error ? e.message : 'Invalid URL' });
    }

    let html: string;
    let finalUrl: string;
    try {
      ({ html, finalUrl } = await fetchAsCrawler(target));
    } catch (e) {
      return jsonResponse({
        error:
          'Could not reach Facebook for this URL. The post may be private, removed, or temporarily unavailable.',
        detail: e instanceof Error ? e.message : String(e),
      });
    }

    // Extract video variants from the DASH manifest first; fall back to the
    // browser_native_* URLs Facebook exposes for crawlers.
    const variants = extractFromDashManifest(html);
    let hd: string | null = null;
    let sd: string | null = null;

    if (variants.length > 0) {
      const picked = pickHdSd(variants);
      hd = picked.hd;
      sd = picked.sd;
    }

    if (!hd && !sd) {
      const fallback = extractBrowserNative(html);
      if (fallback.hd) hd = fallback.hd;
      if (fallback.sd) sd = fallback.sd;
    }

    if (!hd && !sd) {
      return jsonResponse({
        error:
          'Could not extract a downloadable video. The post may be private, age-restricted, login-only, a live stream, or removed.',
      });
    }

    const result: FBResult = {
      title: extractTitle(html),
      thumbnail: extractThumbnail(html),
      hd,
      sd,
      source: finalUrl,
    };
    return jsonResponse(result);
  } catch (err) {
    // Last-resort safety net: never return a non-2xx response so the client
    // can show a friendly error instead of "Edge Function returned a non-2xx
    // status code".
    return jsonResponse({
      error: 'Unexpected server error. Please try again with a different public Facebook URL.',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
});
