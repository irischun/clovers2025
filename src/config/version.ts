// Application version configuration
// Update this file when releasing new versions

export const APP_VERSION = "84.5.0";
// Version 84.5.0: Hardened Apify integration for YouTube downloader.
// - Verbose error logging in tryApify (HTTP body, item keys) for debuggability.
// - Residential proxy group + extended 120s timeout for tough videos.
// - Multi-shape input payload covers all known actor schema variants.
// - 1080p / 720p formats ranked to the top of the results list.
// - Frontend shows explicit "Analyzing 5–15s" hint while Apify runs.
// (No `apify-client` npm dependency needed — REST works perfectly from Deno.)
export const VERSION_NAME = "Version";
export const VERSION_DATE = "2026-06-04";
