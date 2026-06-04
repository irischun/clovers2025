// Application version configuration
// Update this file when releasing new versions

export const APP_VERSION = "84.0.0";
// Version 84: YouTube downloader repaired.
// - Fixed Apify result parsing for downloadedFileUrl / videoOnlyUrl outputs.
// - Added async Apify job polling so the page no longer hangs on long analysis.
// - Allowed trusted Apify file hosts in the download proxy so downloads can start.
// - Faster mirror checks and safer frontend handling for returned quality options.
export const VERSION_NAME = "Version";
export const VERSION_DATE = "2026-06-04";
