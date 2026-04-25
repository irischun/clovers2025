// Application version configuration
// Update this file when releasing new versions

export const APP_VERSION = "50.0.0";
// Version 50: Admin Upload Console
// - New /main/admin page (only visible to irischun2018@gmail.com)
// - Admin button appears in main navigation only when admin is signed in
// - Admin uploads images/videos categorized as manga / cover / product
// - Uploaded media automatically appears in 漫畫生成案例, 封面圖生成案例, 產品圖片生成案例
//   sections on the public landing page (/main), in addition to the curated defaults
// - Backend: admin_uploads table + public admin-uploads storage bucket, RLS enforces
//   admin-email-only writes/deletes while allowing public read
export const VERSION_NAME = "Version";
export const VERSION_DATE = "2026-04-25";
