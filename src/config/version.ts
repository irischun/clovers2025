// Application version configuration
// Update this file when releasing new versions

export const APP_VERSION = "84.1.0";
// Version 84.1.0: Hardened YouTube Video Downloader extraction. The edge
// function now tries multiple Piped and Invidious public mirrors first
// (residential IPs, immune to YouTube's datacenter block) before falling
// back to the InnerTube ANDROID_VR / IOS clients. Each mirror has a 7s
// per-request timeout, the first success wins, and all errors are aggregated
// so the page never silently fails.
export const VERSION_NAME = "Version";
export const VERSION_DATE = "2026-06-03";
