// Application version configuration
// Update this file when releasing new versions

export const APP_VERSION = "79.10.0";
// Version 79.10: Added a neighbor-aware corridor cleanup pass on top of the
// hybrid ML + chroma-key pipeline. Root cause of the remaining white/grey/
// light residue between the two concentric rings: many surviving pixels were
// not dark artifacts, but pale warm bridge pixels that ML still marked as
// inside-subject and the old dark/cool gate intentionally spared. The new
// pass removes these near-background bridge pixels only when they are trapped
// between opposing opaque edges, which clears the ring gap while preserving
// smooth gold contours and transparent output.
export const VERSION_NAME = "Version";
export const VERSION_DATE = "2026-05-30";

