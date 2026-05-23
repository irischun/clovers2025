// Application version configuration
// Update this file when releasing new versions

export const APP_VERSION = "68.3.0";
// Version 68.3.0: Multi-image compositing / object swap fix. The image
// generator now forwards EVERY uploaded reference image to the model
// (previously only the first one was sent), auto-upgrades to Nano Banana
// Pro for 2+ image edits, and ships an explicit "IMAGE 1 = source asset,
// IMAGE 2 = scene to keep" system prompt so prompts like "replace the
// bottle in image 2 with the bottle from image 1" now actually work.
export const VERSION_NAME = "Version";
export const VERSION_DATE = "2026-05-23";
