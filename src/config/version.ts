// Application version configuration
// Update this file when releasing new versions

export const APP_VERSION = "83.0.3";
// Version 83.0.3: Fix Facebook Video Downloader — edge function now fetches
// the public page with a Googlebot User-Agent so /share/v/, /watch, /reel
// and fb.watch URLs all resolve, parses the embedded DASH manifest to
// extract HD and SD MP4 BaseURLs, decodes HTML entities in the title, and
// always returns HTTP 200 with a structured JSON error so the UI never trips
// "Edge Function returned a non-2xx status code".
export const VERSION_NAME = "Version";
export const VERSION_DATE = "2026-05-31";

