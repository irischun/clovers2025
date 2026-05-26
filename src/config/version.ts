// Application version configuration
// Update this file when releasing new versions

export const APP_VERSION = "75.0.0";
// Version 75.0.0: Hardened the local Image Upscale & Resize pipeline.
// - Added img.onerror handling with a clear, trilingual message for
//   unsupported (e.g. HEIC/HEIF) or corrupted files.
// - canvas.toBlob now has a 3-layer fallback chain: original format ->
//   JPEG fallback -> downscale-then-retry, so encoding never fails
//   silently on Safari/iOS or for very large canvases.
// - Target dimensions are clamped to SAFE_MAX_DIM (8192px on the long
//   edge), the conservative cross-browser canvas encoder cap, with a
//   user-visible notice when the cap is applied.
// - encodeToTargetSize uses the same 8192px cap, preventing the upscale
//   loop from producing canvases that the browser cannot encode.
export const VERSION_NAME = "Version";
export const VERSION_DATE = "2026-05-26";
