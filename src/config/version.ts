// Application version configuration
// Update this file when releasing new versions

export const APP_VERSION = "53.0.0";
// Version 53: Tri-language audit & enforcement
// - Removed hardcoded Chinese strings from FeaturesSection, WorkflowSection,
//   TestimonialsSection, ShowcasesSection (now use t() translation keys).
// - GalleriesSection item titles now wrapped in <TranslatedText sourceLang="zh-TW" />
//   so they auto-translate for EN / zh-CN visitors.
// - Added features.*, workflow.*, testimonials.*, showcases.* keys across en/zh-TW/zh-CN.
// - Added scripts/audit-i18n.mjs static audit + .github/workflows/i18n-audit.yml
//   monthly cron to detect untranslated content and missing keys automatically.
export const VERSION_NAME = "Version";
export const VERSION_DATE = "2026-04-25";
