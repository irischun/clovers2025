// Application version configuration
// Update this file when releasing new versions

export const APP_VERSION = "84.3.0";
// Version 84.3.0: YouTube downloader rewritten for zero-setup operation.
// Edge function now exposes a streaming proxy (?stream=...) that pipes
// googlevideo URLs through with Content-Disposition: attachment, so the
// browser triggers a true file download with no CORS and no blob in memory.
// Extraction chain (Piped → Invidious → InnerTube) unchanged; the optional
// self-hosted yt-dlp proxy still wins when YTDLP_PROXY_URL is set.
export const VERSION_NAME = "Version";
export const VERSION_DATE = "2026-06-03";
