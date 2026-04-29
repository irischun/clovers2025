// Application version configuration
// Update this file when releasing new versions

export const APP_VERSION = "59.0.0";
// Version 59: Guarantee high-resolution image output. The
// `generate-image` edge function now (1) explicitly instructs the
// image model to render at the user's requested pixel dimensions
// (e.g., 1920x1080) with full-bleed framing, and (2) post-processes
// every generated image: it decodes the model output and, when the
// native render is smaller than the requested width/height, performs
// a high-quality Lanczos upscale (via ImageScript) so BOTH dimensions
// always meet or exceed the requested size before the PNG is uploaded
// to storage. Result: Clovers images are never smaller than the
// selected aspect-ratio resolution (up to 1920x1920) and consistently
// match or exceed the dimensions produced by other platforms.
export const VERSION_NAME = "Version";
export const VERSION_DATE = "2026-04-29";
