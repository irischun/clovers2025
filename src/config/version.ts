// Application version configuration
// Update this file when releasing new versions

export const APP_VERSION = "84.0.2";
// Version 84.0.2: Watermark Generator — always export watermarked images as PNG
// to preserve transparency. The previous build forced JPEG for non-PNG sources,
// which baked a white/checker background into images that had transparent
// regions (visible after uploading to YouTube). Output now matches iloveimg.com
// alpha behaviour for every input format.
export const VERSION_NAME = "Version";
export const VERSION_DATE = "2026-05-28";
