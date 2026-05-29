// Application version configuration
// Update this file when releasing new versions

export const APP_VERSION = "79.5.0";
// Version 79.5: Watermark Generator now decontaminates edge pixels by
// un-premultiplying their color against the detected white background. This
// mathematically removes the residual white halo around gold/colored edges,
// producing a clean cutout that matches iloveimg's output exactly — no more
// "white things" around the rings or letter edges.
export const VERSION_NAME = "Version";
export const VERSION_DATE = "2026-05-29";
