// Application version configuration
// Update this file when releasing new versions

export const APP_VERSION = "68.1.0";
// Version 68.1.0: Personal Gallery performance fix — removed expensive canvas
// re-encoding for file-size estimation (was decoding every image into a canvas
// and re-encoding as PNG, blocking the main thread). File sizes now use a
// lightweight HEAD request (or base64 string math for legacy data URLs),
// processed in small batches after paint, so the page is interactive instantly.
export const VERSION_NAME = "Version";
export const VERSION_DATE = "2026-05-23";
