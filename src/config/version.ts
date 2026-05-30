// Application version configuration
// Update this file when releasing new versions

export const APP_VERSION = "79.9.0";
// Version 79.9: Added gold-affinity color gate to the hybrid pipeline. Root
// cause of the residual black arc between the two concentric rings: it was a
// dark scanner artifact that both ML (treats it as inside-subject) and
// chroma-key (treats it as "far from white") kept. The new gate forces alpha
// to 0 for any pixel that is dark+achromatic (black/grey) or cool-toned,
// since the true subject is exclusively warm gold. Result: iloveimg-grade
// smoothness with zero stray black/grey pixels between the rings.
export const VERSION_NAME = "Version";
export const VERSION_DATE = "2026-05-30";

