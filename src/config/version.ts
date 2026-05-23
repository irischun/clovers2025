// Application version configuration
// Update this file when releasing new versions

export const APP_VERSION = "65.0.0";
// Version 65: Auth page — added Mute/Unmute background music toggle
// (Midnight_Facets.mp3 @ 0.1 volume, persisted in localStorage),
// "Forgot password?" link with secure email-based reset flow (uses
// Supabase resetPasswordForEmail with redirect back to /auth?type=recovery
// for setting a new password), and "Continue with Google" sign-in via
// Lovable Cloud Managed OAuth. All existing email/password flows
// preserved.
export const VERSION_NAME = "Version";
export const VERSION_DATE = "2026-05-17";
