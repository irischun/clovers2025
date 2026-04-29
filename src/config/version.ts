// Application version configuration
// Update this file when releasing new versions

export const APP_VERSION = "60.0.0";
// Version 60: Big-screen image guarantee. Every Clovers-generated image
// is now produced and post-processed so its long side is at least
// 2560px (4K-class), regardless of the user's selected aspect ratio.
// The `generate-image` edge function (1) instructs the model to render
// at this larger pixel target with full-bleed framing, and (2) decodes
// every output and Lanczos-upscales it whenever the native render is
// smaller than either the requested dimensions OR the 2560px long-side
// minimum. Result: Clovers images are consistently larger and higher
// resolution than typical outputs from comparable platforms, suitable
// for very large displays without quality loss.
export const VERSION_NAME = "Version";
export const VERSION_DATE = "2026-04-29";
