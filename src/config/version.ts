// Application version configuration
// Update this file when releasing new versions

export const APP_VERSION = "78.0.0";
// Version 78.0.0: Fixed Image Resizing target-file-size overshoot.
// Previously the encoder could return blobs exceeding the requested cap
// (e.g. 5 MB → 5.1 / 6.6 MB), breaking uploads to platforms with strict
// limits. The encoder now guarantees output ≤ target by binary-searching
// quality (and downscaling dimensions when needed) to stay strictly under
// the cap, then pads zero bytes to land at exactly the requested size.
export const VERSION_NAME = "Version";
export const VERSION_DATE = "2026-05-27";
