// Application version configuration
// Update this file when releasing new versions

export const APP_VERSION = "79.6.0";
// Version 79.6: Tightened chroma-key thresholds (NEAR 32 / FAR 56) so the
// background goes fully transparent without a wide semi-transparent ring that
// rendered as a grey checkerboard tint. Only a narrow 1–2px rim is now
// anti-aliased, with decontamination preserved on that rim to keep edges
// halo-free.
export const VERSION_NAME = "Version";
export const VERSION_DATE = "2026-05-29";
