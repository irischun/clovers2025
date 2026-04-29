// Application version configuration
// Update this file when releasing new versions

export const APP_VERSION = "57.0.0";
// Version 57: Added an inline trilingual "下載 / Download / 下载" button next
// to the file size on every generated image card in the Personal Gallery
// (/dashboard/personal_gallery). The button reuses the existing high-perf
// blob-fetch download flow with correct file extension detection, and is
// localized via the existing common.download translation key (EN, zh-TW, zh-CN).
export const VERSION_NAME = "Version";
export const VERSION_DATE = "2026-04-29";
