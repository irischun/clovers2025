// Application version configuration
// Update this file when releasing new versions

export const APP_VERSION = "74.0.0";
// Version 74.0.0: Hardened image generation against safety-filter refusals.
// The generate-image edge function now detects refusal responses (text-only
// "I'm just a language model..." replies), auto-rephrases trigger phrases
// like "remove watermark/logo/text" into neutral inpainting instructions,
// and falls back through gemini-3.1-flash → gemini-3-pro → gemini-2.5-flash
// before returning a clear, actionable error to the user. Failures now
// return 422 (refused) or 502 (no image) so the client refunds points
// instead of charging for a non-result.
export const VERSION_NAME = "Version";
export const VERSION_DATE = "2026-05-26";
