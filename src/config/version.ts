// Application version configuration
// Update this file when releasing new versions

export const APP_VERSION = "84.0.0";
// Version 84.0.0: Added YouTube Video Downloader page at
// /dashboard/youtube_video_downloader (sidebar link placed right after the
// Facebook Video Downloader). Paste a YouTube URL (watch, shorts, embed,
// live, or youtu.be), fetch metadata + a list of progressive and adaptive
// MP4 streams via a new `youtube-video-download` edge function that calls
// the InnerTube ANDROID client, then download each quality directly as an
// MP4 file. Mirrors the TurboScribe YouTube-to-MP4 downloader flow.
export const VERSION_NAME = "Version";
export const VERSION_DATE = "2026-06-03";
