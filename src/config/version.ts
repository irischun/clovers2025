// Application version configuration
// Update this file when releasing new versions

export const APP_VERSION = "79.7.0";
// Version 79.7: Raised chroma-key NEAR threshold to 55 so pearlescent/textured
// off-white backgrounds (which have natural pixel variance of ~15-40 from the
// median) are now fully cleared to 100% transparency — no more grey checker
// tint. Narrow 23-unit anti-aliased band (55→78) plus decontamination keeps
// the gold edges crisp and halo-free.
export const VERSION_NAME = "Version";
export const VERSION_DATE = "2026-05-29";
