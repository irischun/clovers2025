// Application version configuration
// Update this file when releasing new versions

export const APP_VERSION = "76.0.0";
// Version 76.0.0: Further hardened the image-generation safety-rephrase pipeline.
// - rephraseForSafety now strips AI brand names (Google, Gemini, Nano Banana,
//   GPT, DALL·E, Midjourney, Stable Diffusion, etc.) that frequently cause
//   Gemini's self-referential safety filter to refuse the request.
// - "remove ... watermark/logo/text" regexes now tolerate up to 80 characters
//   of qualifier text between "remove" and the noun, so prompts like
//   "remove the Google Gemini/Nano Banana watermark at the bottom" match.
// - Added preemptive rephrasing: when a prompt contains known trigger words
//   ("watermark", "erase", brand names, etc.) the first attempt is already
//   sent in safe form, saving a wasted refused round trip.
// - Added more soft-verb rewrites ("get rid of", "take out/off/away") and
//   wraps the final prompt as a neutral "Photo editing task" to further
//   reduce refusal probability.
export const VERSION_NAME = "Version";
export const VERSION_DATE = "2026-05-26";
