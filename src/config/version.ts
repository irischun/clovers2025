// Application version configuration
// Update this file when releasing new versions

export const APP_VERSION = "79.4.0";
// Version 79.4: Watermark Generator now auto-detects light/uniform backgrounds
// and uses pixel-accurate chroma-key removal instead of ML segmentation for
// those cases. This correctly clears interior holes (e.g. the thin gap between
// concentric rings) to 100% transparency, matching iloveimg's output exactly,
// with smoothstep anti-aliased edges and zero halo. Falls back to the ISNet
// segmentation model only for busy/non-uniform backgrounds.
export const VERSION_NAME = "Version";
export const VERSION_DATE = "2026-05-29";
