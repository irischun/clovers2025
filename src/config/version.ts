// Application version configuration
// Update this file when releasing new versions

export const APP_VERSION = "68.2.0";
// Version 68.2.0: Personal Gallery emergency fix — migrated all 400+ legacy
// base64 image rows (each ~1.6MB) out of the database into Storage objects.
// The gallery query payload dropped from ~16MB per page to a few KB, so the
// "正在連線資料庫" stall is gone. Also kept the file-size HEAD optimisation
// from 68.1.0.
export const VERSION_NAME = "Version";
export const VERSION_DATE = "2026-05-23";
