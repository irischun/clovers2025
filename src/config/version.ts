// Application version configuration
// Update this file when releasing new versions

export const APP_VERSION = "83.1.0";
// Version 83.1.0: Real client-side video upscaler. Replaces the previous
// mock that returned the input file unchanged. Now demuxes the source video
// with mp4box.js, decodes frames via WebCodecs VideoDecoder, scales to the
// chosen target height (480p / 720p / 1080p / 2K / 4K) with high-quality
// resampling and an unsharp-mask sharpen pass (Subtle vs Bold), re-encodes
// via H.264 VideoEncoder at a resolution-aware bitrate, and muxes the
// result into a downloadable MP4. Aspect ratio is preserved and dimensions
// are forced even for H.264 compliance. Falls back with a clear message on
// browsers without WebCodecs support (Safari).
export const VERSION_NAME = "Version";
export const VERSION_DATE = "2026-05-31";
