// Application version configuration
// Update this file when releasing new versions

export const APP_VERSION = "68.4.0";
// Version 68.4.0: Surgical object-swap edit pipeline. When 2+ reference
// images are uploaded the generator now (1) forces Nano Banana Pro,
// (2) strips out the "ultra HD 4K, masterpiece" filler that caused the
// model to regenerate from scratch and return IMAGE 2 unchanged,
// (3) drops temperature to 0.2, and (4) ships a tight "you are a
// precision editor — replace foreground subject in IMAGE 2 with subject
// from IMAGE 1, keep everything else pixel-faithful" contract.
export const VERSION_NAME = "Version";
export const VERSION_DATE = "2026-05-23";
