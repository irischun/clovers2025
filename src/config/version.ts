// Application version configuration
// Update this file when releasing new versions

export const APP_VERSION = "79.11.0";
// Version 79.11: Upgraded the ring-gap cleanup from one-pass corridor gating
// to iterative corridor peeling. Root cause of the latest remaining white/
// grey/light contamination: the residue was often a connected semi-transparent
// warm strip spanning multiple adjacent pixels, so removing only individually
// detected bridge pixels left the rest of the strip behind. The new multi-pass
// logic repeatedly peels non-gold, near-background corridor residue trapped
// between opposing opaque edges, which more aggressively clears the thin gap
// while preserving smooth gold contours and full transparency.
export const VERSION_NAME = "Version";
export const VERSION_DATE = "2026-05-30";

