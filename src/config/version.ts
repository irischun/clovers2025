// Application version configuration
// Update this file when releasing new versions

export const APP_VERSION = "84.2.0";
// Version 84.2.0: YouTube Video Downloader now supports a self-hosted yt-dlp
// proxy via YTDLP_PROXY_URL + YTDLP_PROXY_TOKEN secrets. When set, the edge
// function calls the proxy first (residential IP, bypasses YouTube's
// datacenter block) and falls back to Piped/Invidious/InnerTube only if the
// proxy is unreachable. Deployable proxy template lives in /proxy-server.
export const VERSION_NAME = "Version";
export const VERSION_DATE = "2026-06-03";
