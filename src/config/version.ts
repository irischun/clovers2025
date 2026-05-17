// Application version configuration
// Update this file when releasing new versions

export const APP_VERSION = "63.0.0";
// Version 63: Image Resizer — file-size targets now hit the chosen weight
// accurately (±2%). New adaptive encoder: binary-searches JPEG/WebP quality
// when over-target, falls back to lossless PNG and progressively upscales
// pixel dimensions when under-target, then pads the final blob to land on
// the exact requested MB. Works for 2/5/10/15/20/30/50/70/80/100 MB and
// custom sizes regardless of source image weight.
export const VERSION_NAME = "Version";
export const VERSION_DATE = "2026-05-17";
