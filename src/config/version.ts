// Application version configuration
// Update this file when releasing new versions

export const APP_VERSION = "79.8.0";
// Version 79.8: Hybrid ML + chroma-key removal. ML segmentation provides the
// outer subject mask (kills stray dark scanner artifacts like the faint black
// arc between concentric rings), chroma-key punches transparent holes in
// interior light regions that ML would fill in (e.g. the gap between two
// rings). Alphas are AND-combined (min), giving iloveimg-grade output: smooth,
// halo-free, with no stray black pixels and fully transparent ring gaps.
export const VERSION_NAME = "Version";
export const VERSION_DATE = "2026-05-30";
