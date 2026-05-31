// Application version configuration
// Update this file when releasing new versions

export const APP_VERSION = "80.0.0";
// Version 80.0: Added a dedicated "Video Resizing & Rescaling" page at
// /dashboard/video-resizing_video-rescaling, placed in the sidebar directly
// after "Image Resizing & Rescaling". The new route replicates the
// higgsfield.ai/upscale workflow (upload → model select → scale factor →
// advanced settings → upscale with progress + download) by reusing the proven
// VideoUpscalePage component, so existing video-upscale functionality and
// performance are preserved unchanged.
export const VERSION_NAME = "Version";
export const VERSION_DATE = "2026-05-30";

