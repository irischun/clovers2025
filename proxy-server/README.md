# Clovers yt-dlp extraction proxy

Tiny self-hosted service that extracts YouTube video download URLs using
`yt-dlp` and exposes them to the Clovers `/dashboard/youtube_video_downloader`
page. You host this on a server with a residential or clean datacenter IP so
YouTube doesn't block the requests.

## What you get

- `GET /health` — returns `{ "ok": true }`
- `GET /extract?url=<youtube_url>` with header `X-Auth-Token: <token>` —
  returns JSON consumed by the Supabase edge function.

## Deploy in 5 minutes

### Option A — Render.com (recommended, has a free tier)

1. Push this `proxy-server/` folder to a GitHub repo (it can be its own repo
   or a subfolder of an existing one).
2. Render → **New +** → **Web Service** → connect that repo.
3. Settings:
   - **Runtime**: Docker (Render detects the Dockerfile automatically).
   - **Root Directory**: `proxy-server` (if it's in a subfolder).
   - **Environment Variable**: `PROXY_TOKEN` = a long random string you make
     up (e.g. `openssl rand -hex 32`). Save this — you'll paste it into
     Clovers as `YTDLP_PROXY_TOKEN`.
4. Deploy. Copy the public URL Render gives you (e.g.
   `https://clovers-ytdlp.onrender.com`).

### Option B — Railway / Fly.io / Hetzner / your own VPS

Any platform that runs a Dockerfile works. Same two requirements:
- Expose port `8000` (or whatever `$PORT` Railway/Fly inject).
- Set env var `PROXY_TOKEN` to your shared secret.

### Option C — Run locally for testing

```bash
cd proxy-server
pip install -r requirements.txt
PROXY_TOKEN=devtoken uvicorn main:app --host 0.0.0.0 --port 8000
```

Then test:

```bash
curl -H "X-Auth-Token: devtoken" \
  "http://localhost:8000/extract?url=https://youtu.be/dQw4w9WgXcQ" | jq .
```

## Wire it into Clovers

In the Clovers chat, paste the two secrets when prompted:

- `YTDLP_PROXY_URL` = your deployed URL (e.g. `https://clovers-ytdlp.onrender.com`)
- `YTDLP_PROXY_TOKEN` = the same value you set as `PROXY_TOKEN` on the server

That's it. The edge function will now prefer your proxy and the YouTube
Downloader page will work for every public video.

## Notes

- **Render free tier sleeps** after 15 min of inactivity. First request after
  sleep takes ~30 s to spin up. The edge function tolerates this (10 s
  per-request timeout, then retries the proxy once). For zero cold-start use
  Render Starter ($7/mo) or Railway/Fly.
- **Keep `PROXY_TOKEN` private.** Without it anyone on the internet could use
  your bandwidth.
- **Update `yt-dlp` periodically.** YouTube changes its API constantly. Bump
  the version in `requirements.txt` every 1–2 months and redeploy.
