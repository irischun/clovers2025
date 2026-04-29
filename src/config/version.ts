// Application version configuration
// Update this file when releasing new versions

export const APP_VERSION = "58.0.0";
// Version 58: Hardened Sticker Maker generation reliability. The
// `sticker-generate` edge function now retries transient errors
// (HTTP 429 Resource Exhausted, 5xx) with exponential backoff and
// automatically falls back from `gemini-3.1-flash-image-preview` to
// `gemini-2.5-flash-image` (Nano Banana) when the primary model is
// rate-limited. This eliminates the "Rate limit exceeded" failures
// observed previously and prevents user-visible generation failures.
export const VERSION_NAME = "Version";
export const VERSION_DATE = "2026-04-29";
