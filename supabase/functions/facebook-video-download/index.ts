import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

function unescapeJson(s: string): string {
  return s
    .replace(/\\u0025/g, '%')
    .replace(/\\u002F/g, '/')
    .replace(/\\\//g, '/')
    .replace(/\\u0026/g, '&')
    .replace(/\\\\/g, '\\');
}

function extract(html: string): { hd?: string; sd?: string; thumb?: string; title?: string } {
  const out: { hd?: string; sd?: string; thumb?: string; title?: string } = {};

  const patterns: Array<[string, 'hd' | 'sd']> = [
    ['browser_native_hd_url', 'hd'],
    ['playable_url_quality_hd', 'hd'],
    ['hd_src_no_ratelimit', 'hd'],
    ['hd_src', 'hd'],
    ['browser_native_sd_url', 'sd'],
    ['playable_url', 'sd'],
    ['sd_src_no_ratelimit', 'sd'],
    ['sd_src', 'sd'],
  ];

  for (const [key, slot] of patterns) {
    if (out[slot]) continue;
    const re = new RegExp(`"${key}"\\s*:\\s*"([^"]+)"`);
    const m = html.match(re);
    if (m && m[1] && m[1] !== 'null') {
      out[slot] = unescapeJson(m[1]);
    }
  }

  const thumbMatch =
    html.match(/"preferred_thumbnail"\s*:\s*\{[^}]*"image"\s*:\s*\{[^}]*"uri"\s*:\s*"([^"]+)"/) ||
    html.match(/"thumbnailImage"\s*:\s*\{\s*"uri"\s*:\s*"([^"]+)"/) ||
    html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/);
  if (thumbMatch) out.thumb = unescapeJson(thumbMatch[1]);

  const titleMatch =
    html.match(/<meta\s+name="description"\s+content="([^"]+)"/) ||
    html.match(/<title>([^<]+)<\/title>/);
  if (titleMatch) out.title = titleMatch[1].replace(/\s*\|\s*Facebook\s*$/i, '').trim();

  return out;
}

async function fetchHtml(url: string, mobile = false): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': mobile
        ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
        : UA,
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    redirect: 'follow',
  });
  if (!res.ok) throw new Error(`Facebook responded ${res.status}`);
  return await res.text();
}

function normalizeUrl(input: string): string {
  let u = input.trim();
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  try {
    const parsed = new URL(u);
    if (!/facebook\.com$|fb\.watch$/i.test(parsed.hostname.replace(/^www\.|^m\.|^web\.|^mbasic\./i, ''))) {
      throw new Error('Not a Facebook URL');
    }
    if (/fb\.watch$/i.test(parsed.hostname)) return parsed.toString();
    parsed.hostname = 'www.facebook.com';
    return parsed.toString();
  } catch {
    throw new Error('Invalid URL');
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: 'url is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const target = normalizeUrl(url);

    let html = await fetchHtml(target, false);
    let data = extract(html);

    if (!data.hd && !data.sd) {
      const mobileUrl = target.replace('www.facebook.com', 'm.facebook.com');
      try {
        html = await fetchHtml(mobileUrl, true);
        const m = extract(html);
        data = { ...m, ...data };
        if (!data.hd && m.hd) data.hd = m.hd;
        if (!data.sd && m.sd) data.sd = m.sd;
      } catch (_) {/* ignore */}
    }

    if (!data.hd && !data.sd) {
      return new Response(
        JSON.stringify({
          error:
            'Could not extract video. The post may be private, age-restricted, login-only, or removed. Try a public video URL.',
        }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({
        title: data.title ?? 'Facebook Video',
        thumbnail: data.thumb ?? null,
        hd: data.hd ?? null,
        sd: data.sd ?? null,
        source: target,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
