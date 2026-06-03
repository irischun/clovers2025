"""
Clovers yt-dlp extraction proxy.

A tiny FastAPI service you self-host so YouTube sees a residential IP instead
of Supabase's datacenter IP. Exposes ONE endpoint:

    GET  /extract?url=<youtube_url>
    Header: X-Auth-Token: <YTDLP_PROXY_TOKEN>

Returns JSON the Clovers edge function understands:
    {
      "title": "...",
      "author": "...",
      "duration": 123,
      "thumbnail": "https://...",
      "formats": [
        { "quality": "720p", "mime": "video/mp4",
          "hasAudio": true, "hasVideo": true,
          "url": "https://...", "contentLength": "12345" }
      ]
    }

Health check:  GET /health  ->  {"ok": true}

Deploy to Render, Railway, Fly.io, Hetzner — any host with a residential or
clean datacenter IP that is not on YouTube's deny list. Set environment
variable PROXY_TOKEN to the same value you store in Supabase as
YTDLP_PROXY_TOKEN.
"""

from __future__ import annotations

import os
import re
from typing import Any

from fastapi import FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import yt_dlp

PROXY_TOKEN = os.environ.get("PROXY_TOKEN", "").strip()

app = FastAPI(title="Clovers yt-dlp proxy", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["*"],
)


def _check_auth(token: str | None) -> None:
    if not PROXY_TOKEN:
        # No token configured — open mode (NOT recommended in production).
        return
    if not token or token != PROXY_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid auth token")


@app.get("/health")
def health() -> dict[str, Any]:
    return {"ok": True, "service": "clovers-ytdlp-proxy"}


@app.get("/extract")
def extract(
    url: str = Query(..., description="YouTube URL or 11-char video ID"),
    x_auth_token: str | None = Header(default=None, alias="X-Auth-Token"),
) -> dict[str, Any]:
    _check_auth(x_auth_token)

    raw = url.strip()
    if re.fullmatch(r"[A-Za-z0-9_-]{11}", raw):
        raw = f"https://www.youtube.com/watch?v={raw}"

    ydl_opts = {
        "quiet": True,
        "no_warnings": True,
        "skip_download": True,
        "noplaylist": True,
        # Use the Android client by default — it returns direct MP4 URLs
        # without signature ciphering.
        "extractor_args": {"youtube": {"player_client": ["android", "web"]}},
        # Generous timeout so 4K extractions don't bail.
        "socket_timeout": 30,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(raw, download=False)
    except yt_dlp.utils.DownloadError as exc:
        raise HTTPException(status_code=502, detail=f"yt-dlp error: {exc}") from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Unexpected: {exc}") from exc

    if not info:
        raise HTTPException(status_code=404, detail="No video info returned")

    formats_out: list[dict[str, Any]] = []
    seen: set[str] = set()
    for f in info.get("formats", []) or []:
        if not f.get("url"):
            continue
        ext = (f.get("ext") or "").lower()
        if ext != "mp4":
            # Restrict to mp4 for broad browser compatibility.
            continue
        vcodec = (f.get("vcodec") or "none").lower()
        acodec = (f.get("acodec") or "none").lower()
        has_video = vcodec != "none"
        has_audio = acodec != "none"
        if not has_video:
            continue
        height = f.get("height")
        quality = f.get("format_note") or (f"{height}p" if height else "unknown")
        key = f"{'av' if has_audio else 'v'}-{quality}"
        if key in seen:
            continue
        seen.add(key)
        formats_out.append(
            {
                "itag": f.get("format_id"),
                "quality": quality,
                "mime": f"video/mp4; codecs=\"{vcodec},{acodec}\"",
                "hasVideo": True,
                "hasAudio": has_audio,
                "url": f["url"],
                "contentLength": str(f["filesize"]) if f.get("filesize") else None,
            }
        )

    # Progressive (av) first, then by height desc
    def _score(x: dict[str, Any]) -> int:
        h = int(re.match(r"(\d+)", x["quality"]).group(1)) if re.match(r"(\d+)", x["quality"]) else 0
        return (100000 if x["hasAudio"] else 0) + h

    formats_out.sort(key=_score, reverse=True)

    thumb = info.get("thumbnail")
    if not thumb:
        thumbs = info.get("thumbnails") or []
        if thumbs:
            thumb = thumbs[-1].get("url")

    return {
        "title": info.get("title") or "YouTube Video",
        "author": info.get("uploader") or info.get("channel"),
        "duration": info.get("duration"),
        "thumbnail": thumb,
        "formats": formats_out,
    }
