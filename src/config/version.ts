// Application version configuration
// Update this file when releasing new versions

export const APP_VERSION = "79.1.0";
// Version 79.1: Watermark Generator — removed the redundant
// "一鍵生成浮水印 / To Generate a Watermark" auto button that was
// silently removing the source image's background and stamping it back
// on top (causing the duplicate "D" overlay). Now the page behaves
// exactly like iloveimg.com/watermark-image: the user must explicitly
// add an image or text watermark before clicking "Watermark IMAGES".
// Single "Apply" button with its own spinner — no more shared state.
export const VERSION_NAME = "Version";
export const VERSION_DATE = "2026-05-29";
