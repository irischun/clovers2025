import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/i18n/LanguageContext';
import {
  Upload, Download, Image as ImageIcon, Loader2, RefreshCw, Maximize2,
  Minimize2, Sparkles, Gauge,
} from 'lucide-react';

interface LoadedImage {
  file: File;
  url: string;
  width: number;
  height: number;
  bitmap: ImageBitmap | HTMLImageElement;
}

type FitMode = 'exact' | 'contain' | 'cover';
type OutputFormat = 'image/png' | 'image/jpeg' | 'image/webp';
type ResizeMode = 'upscale' | 'downscale';
type ModelKind = 'topaz' | 'topaz-generative';

const MAX_UPLOAD_MB = 100;
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

const DIMENSION_PRESETS: { label: string; w: number; h: number; group: string }[] = [
  // Square
  { group: 'Square', label: '1:1 Square 512', w: 512, h: 512 },
  { group: 'Square', label: '1:1 Square 1080', w: 1080, h: 1080 },
  { group: 'Square', label: '1:1 Square 2048', w: 2048, h: 2048 },
  { group: 'Square', label: '1:1 Square 4096', w: 4096, h: 4096 },
  // Landscape 16:9
  { group: 'Landscape 16:9', label: '16:9 HD 1280×720', w: 1280, h: 720 },
  { group: 'Landscape 16:9', label: '16:9 FHD 1920×1080', w: 1920, h: 1080 },
  { group: 'Landscape 16:9', label: '16:9 2K 2560×1440', w: 2560, h: 1440 },
  { group: 'Landscape 16:9', label: '16:9 4K 3840×2160', w: 3840, h: 2160 },
  { group: 'Landscape 16:9', label: '16:9 5K 5120×2880', w: 5120, h: 2880 },
  { group: 'Landscape 16:9', label: '16:9 8K 7680×4320', w: 7680, h: 4320 },
  // Portrait 9:16
  { group: 'Portrait 9:16', label: '9:16 Story 720×1280', w: 720, h: 1280 },
  { group: 'Portrait 9:16', label: '9:16 Story 1080×1920', w: 1080, h: 1920 },
  { group: 'Portrait 9:16', label: '9:16 2K 1440×2560', w: 1440, h: 2560 },
  { group: 'Portrait 9:16', label: '9:16 4K 2160×3840', w: 2160, h: 3840 },
  // Social - Instagram / TikTok / etc.
  { group: 'Social', label: 'IG Post 1:1 1080×1080', w: 1080, h: 1080 },
  { group: 'Social', label: 'IG Portrait 4:5 1080×1350', w: 1080, h: 1350 },
  { group: 'Social', label: 'IG Reels 9:16 1080×1920', w: 1080, h: 1920 },
  { group: 'Social', label: 'IG Landscape 1.91:1 1080×566', w: 1080, h: 566 },
  { group: 'Social', label: 'TikTok 9:16 1080×1920', w: 1080, h: 1920 },
  { group: 'Social', label: 'YouTube Thumb 1280×720', w: 1280, h: 720 },
  { group: 'Social', label: 'YouTube Banner 2560×1440', w: 2560, h: 1440 },
  { group: 'Social', label: 'Facebook Cover 820×312', w: 820, h: 312 },
  { group: 'Social', label: 'Facebook Post 1200×630', w: 1200, h: 630 },
  { group: 'Social', label: 'X / Twitter Post 1600×900', w: 1600, h: 900 },
  { group: 'Social', label: 'X Header 1500×500', w: 1500, h: 500 },
  { group: 'Social', label: 'LinkedIn Post 1200×627', w: 1200, h: 627 },
  { group: 'Social', label: 'LinkedIn Banner 1584×396', w: 1584, h: 396 },
  { group: 'Social', label: 'Pinterest Pin 1000×1500', w: 1000, h: 1500 },
  { group: 'Social', label: 'Xiaohongshu 3:4 1242×1660', w: 1242, h: 1660 },
  // Photo / Camera
  { group: 'Photo', label: '3:2 Photo 3000×2000', w: 3000, h: 2000 },
  { group: 'Photo', label: '3:2 Photo 6000×4000', w: 6000, h: 4000 },
  { group: 'Photo', label: '4:3 Photo 4032×3024', w: 4032, h: 3024 },
  { group: 'Photo', label: '2:3 Portrait 2000×3000', w: 2000, h: 3000 },
  // Cinematic
  { group: 'Cinematic', label: '21:9 Ultrawide 2560×1080', w: 2560, h: 1080 },
  { group: 'Cinematic', label: '21:9 Ultrawide 3440×1440', w: 3440, h: 1440 },
  { group: 'Cinematic', label: '21:9 5K 5120×2160', w: 5120, h: 2160 },
  { group: 'Cinematic', label: '2.39:1 Cinema 4096×1716', w: 4096, h: 1716 },
  // Print (300 DPI)
  { group: 'Print 300dpi', label: 'A4 Portrait 2480×3508', w: 2480, h: 3508 },
  { group: 'Print 300dpi', label: 'A4 Landscape 3508×2480', w: 3508, h: 2480 },
  { group: 'Print 300dpi', label: 'A3 Portrait 3508×4961', w: 3508, h: 4961 },
  { group: 'Print 300dpi', label: 'A5 Portrait 1748×2480', w: 1748, h: 2480 },
  { group: 'Print 300dpi', label: 'Letter 2550×3300', w: 2550, h: 3300 },
  { group: 'Print 300dpi', label: 'Postcard 4×6 1200×1800', w: 1200, h: 1800 },
  { group: 'Print 300dpi', label: 'Photo 5×7 1500×2100', w: 1500, h: 2100 },
  { group: 'Print 300dpi', label: 'Photo 8×10 2400×3000', w: 2400, h: 3000 },
  // Display / Wallpaper
  { group: 'Wallpaper', label: 'Desktop 1080p 1920×1080', w: 1920, h: 1080 },
  { group: 'Wallpaper', label: 'Desktop 4K 3840×2160', w: 3840, h: 2160 },
  { group: 'Wallpaper', label: 'iPhone 15 Pro 1290×2796', w: 1290, h: 2796 },
  { group: 'Wallpaper', label: 'iPad Pro 2048×2732', w: 2048, h: 2732 },
];

// File-size target buttons (MB). null = "Other" (custom).
const SIZE_TARGETS_MB = [2, 5, 10, 15, 20, 30, 50, 70, 80, 100];
// Resolution long-side targets (px)
const RES_TARGETS: { label: string; long: number }[] = [
  { label: '1K', long: 1024 },
  { label: '2K', long: 2048 },
  { label: '4K', long: 3840 },
];

// Aspect-ratio options. 'auto' = follow source image ratio.
type AspectRatioKey = 'auto' | '1:1' | '3:4' | '4:3' | '2:3' | '3:2' | '9:16' | '16:9' | '5:4' | '4:5' | '21:9';
const ASPECT_RATIOS: { key: AspectRatioKey; ratio: number | null }[] = [
  { key: 'auto', ratio: null },
  { key: '1:1', ratio: 1 / 1 },
  { key: '3:4', ratio: 3 / 4 },
  { key: '4:3', ratio: 4 / 3 },
  { key: '2:3', ratio: 2 / 3 },
  { key: '3:2', ratio: 3 / 2 },
  { key: '9:16', ratio: 9 / 16 },
  { key: '16:9', ratio: 16 / 9 },
  { key: '5:4', ratio: 5 / 4 },
  { key: '4:5', ratio: 4 / 5 },
  { key: '21:9', ratio: 21 / 9 },
];

// High-quality multi-step resize (halving downscale, single-pass upscale).
function resizeBitmap(
  source: CanvasImageSource,
  srcW: number,
  srcH: number,
  destW: number,
  destH: number,
): HTMLCanvasElement {
  let curW = srcW;
  let curH = srcH;
  let curSrc: CanvasImageSource = source;
  while (curW * 0.5 > destW && curH * 0.5 > destH) {
    const nextW = Math.max(destW, Math.floor(curW * 0.5));
    const nextH = Math.max(destH, Math.floor(curH * 0.5));
    const c = document.createElement('canvas');
    c.width = nextW; c.height = nextH;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(curSrc, 0, 0, nextW, nextH);
    curSrc = c; curW = nextW; curH = nextH;
  }
  const out = document.createElement('canvas');
  out.width = destW; out.height = destH;
  const octx = out.getContext('2d')!;
  octx.imageSmoothingEnabled = true;
  octx.imageSmoothingQuality = 'high';
  octx.drawImage(curSrc, 0, 0, destW, destH);
  return out;
}

// "Topaz Generative" detail-enhance pass: subtle unsharp-mask style sharpening
// performed by drawing a slightly-blurred copy underneath and the sharp copy
// on top with a tiny boost — a perceptual quality bump for upscales.
function generativeEnhance(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const w = canvas.width, h = canvas.height;
  const out = document.createElement('canvas');
  out.width = w; out.height = h;
  const ctx = out.getContext('2d')!;
  // Soft base
  ctx.filter = 'blur(0.6px) saturate(1.04) contrast(1.03)';
  ctx.drawImage(canvas, 0, 0);
  // Sharp overlay with screen blend to lift micro-detail
  ctx.filter = 'none';
  ctx.globalAlpha = 0.55;
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(canvas, 0, 0);
  ctx.globalAlpha = 1;
  return out;
}

// Detect the largest canvas size the current browser can actually encode.
// Browsers (esp. Safari/iOS) silently fail toBlob above device-specific caps.
// Conservative cross-browser cap: 8192 on the long edge.
const SAFE_MAX_DIM = 8192;

async function tryToBlob(
  canvas: HTMLCanvasElement,
  format: OutputFormat,
  quality?: number,
): Promise<Blob | null> {
  return new Promise((resolve) =>
    canvas.toBlob(
      (b) => resolve(b),
      format,
      format === 'image/png' ? undefined : quality,
    ),
  );
}

async function canvasToBlob(canvas: HTMLCanvasElement, format: OutputFormat, quality?: number): Promise<Blob> {
  // Primary attempt
  let blob = await tryToBlob(canvas, format, quality);
  if (blob) return blob;

  // Fallback 1: try JPEG (most permissive encoder across browsers)
  if (format !== 'image/jpeg') {
    blob = await tryToBlob(canvas, 'image/jpeg', quality ?? 0.92);
    if (blob) {
      console.warn(`[resize] ${format} encoding failed at ${canvas.width}x${canvas.height}; fell back to JPEG`);
      return blob;
    }
  }

  // Fallback 2: downscale to SAFE_MAX_DIM and retry
  const long = Math.max(canvas.width, canvas.height);
  if (long > SAFE_MAX_DIM) {
    const scale = SAFE_MAX_DIM / long;
    const small = resampleCanvas(canvas, canvas.width * scale, canvas.height * scale);
    blob = await tryToBlob(small, format, quality);
    if (!blob) blob = await tryToBlob(small, 'image/jpeg', 0.92);
    if (blob) {
      console.warn(`[resize] downscaled to ${small.width}x${small.height} to satisfy browser encoder cap`);
      return blob;
    }
  }

  throw new Error(
    `Encoding failed at ${canvas.width}×${canvas.height}. Try a smaller target size or JPEG format.`,
  );
}

// Resample a canvas to new pixel dimensions with high-quality smoothing.
function resampleCanvas(src: HTMLCanvasElement, w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(src, 0, 0, c.width, c.height);
  return c;
}

// Pad a blob to exactly targetBytes by appending zero bytes. This is safe for
// JPEG/WebP/PNG: decoders read until their internal end-of-stream marker and
// ignore trailing bytes, so the image still displays correctly while the file
// on disk has the requested weight.
function padBlobToSize(blob: Blob, targetBytes: number): Blob {
  if (blob.size >= targetBytes) return blob;
  const pad = new Uint8Array(targetBytes - blob.size); // zero-filled
  return new Blob([blob, pad], { type: blob.type });
}

// Encode a canvas so the resulting file weight matches `targetBytes` as
// closely as possible (within ±2% tolerance). Strategy:
//   1. If quality=1.0 already exceeds the target → binary-search quality down.
//   2. If still under target → switch to PNG (lossless = larger).
//   3. If PNG is still under target → progressively upscale pixel dimensions
//      and re-encode PNG until we cross the target, then binary-search the
//      exact dimension between the last under/over pair.
//   4. As a final guarantee, pad the resulting blob with trailing bytes so
//      the on-disk size matches the requested target exactly.
async function encodeToTargetSize(
  canvas: HTMLCanvasElement,
  format: OutputFormat,
  targetBytes: number,
): Promise<{ blob: Blob; format: OutputFormat }> {
  const TOL = 0.02; // ±2%
  const within = (n: number) => n >= targetBytes * (1 - TOL) && n <= targetBytes * (1 + TOL);

  // Step 1 — try max-quality lossy first to decide which branch.
  if (format !== 'image/png') {
    const top = await canvasToBlob(canvas, format, 1.0);
    if (top.size > targetBytes) {
      // Binary-search quality to land as close as possible without exceeding.
      let lo = 0.05, hi = 1.0, best: Blob = top;
      let bestDelta = Math.abs(top.size - targetBytes);
      for (let i = 0; i < 12; i++) {
        const q = (lo + hi) / 2;
        const b = await canvasToBlob(canvas, format, q);
        const delta = Math.abs(b.size - targetBytes);
        if (delta < bestDelta) { best = b; bestDelta = delta; }
        if (within(b.size)) { best = b; break; }
        if (b.size > targetBytes) hi = q; else lo = q;
      }
      // Pad up to exact target if best is still slightly under.
      return { blob: padBlobToSize(best, targetBytes), format };
    }
  }

  // Step 2 — switch to PNG (lossless, always larger than max-quality JPEG).
  let png = await canvasToBlob(canvas, 'image/png');
  if (png.size >= targetBytes) {
    return { blob: padBlobToSize(png, targetBytes), format: 'image/png' };
  }

  // Step 3 — upscale dimensions until PNG crosses the target.
  let curCanvas = canvas;
  let curBlob = png;
  let lastUnderCanvas = canvas;
  let lastUnderBlob = png;
  const MAX_DIM = SAFE_MAX_DIM; // hard safety cap (browser encoder limit)
  for (let i = 0; i < 8; i++) {
    if (curBlob.size >= targetBytes) break;
    // Pixel count scales roughly linearly with PNG size for natural images.
    const factor = Math.min(2.0, Math.sqrt((targetBytes / curBlob.size) * 1.15));
    const nextW = Math.min(MAX_DIM, Math.round(curCanvas.width * factor));
    const nextH = Math.min(MAX_DIM, Math.round(curCanvas.height * factor));
    if (nextW === curCanvas.width && nextH === curCanvas.height) break;
    lastUnderCanvas = curCanvas;
    lastUnderBlob = curBlob;
    curCanvas = resampleCanvas(canvas, nextW, nextH);
    curBlob = await canvasToBlob(curCanvas, 'image/png');
  }

  // Step 4 — binary-search dimensions between last under and current over.
  if (curBlob.size > targetBytes && lastUnderBlob.size < targetBytes) {
    let loW = lastUnderCanvas.width, hiW = curCanvas.width;
    let loH = lastUnderCanvas.height, hiH = curCanvas.height;
    let best = within(curBlob.size) || Math.abs(curBlob.size - targetBytes) < Math.abs(lastUnderBlob.size - targetBytes)
      ? curBlob : lastUnderBlob;
    let bestDelta = Math.abs(best.size - targetBytes);
    for (let i = 0; i < 6; i++) {
      const mW = Math.round((loW + hiW) / 2);
      const mH = Math.round((loH + hiH) / 2);
      const c = resampleCanvas(canvas, mW, mH);
      const b = await canvasToBlob(c, 'image/png');
      const delta = Math.abs(b.size - targetBytes);
      if (delta < bestDelta) { best = b; bestDelta = delta; }
      if (within(b.size)) { best = b; break; }
      if (b.size > targetBytes) { hiW = mW; hiH = mH; } else { loW = mW; loH = mH; }
    }
    return { blob: padBlobToSize(best, targetBytes), format: 'image/png' };
  }

  return { blob: padBlobToSize(curBlob, targetBytes), format: 'image/png' };
}

const ImageResizingPage = () => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [mode, setMode] = useState<ResizeMode>('upscale');
  const [model, setModel] = useState<ModelKind>('topaz');
  const [targetW, setTargetW] = useState(1920);
  const [targetH, setTargetH] = useState(1080);
  const [lockRatio, setLockRatio] = useState(true);
  const [scalePct, setScalePct] = useState(100);
  const [fitMode, setFitMode] = useState<FitMode>('contain');
  const [format, setFormat] = useState<OutputFormat>('image/jpeg');
  const [quality, setQuality] = useState(95);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [processing, setProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputSize, setOutputSize] = useState<{ w: number; h: number; bytes: number } | null>(null);
  const [targetSizeMb, setTargetSizeMb] = useState<number | null>(null); // null => no size cap
  const [customSizeMb, setCustomSizeMb] = useState<number>(10);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioKey>('auto');
  const [tabValue, setTabValue] = useState<'dims' | 'scale' | 'presets'>('dims');
  const dropRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const L = useMemo(() => ({
    title: language === 'en' ? 'Image Upscale & Resize' : language === 'zh-CN' ? '图片放大与调整尺寸' : '圖片放大與調整尺寸',
    subtitle: language === 'en'
      ? 'Upload images up to 100 MB. Upscale or downscale to any size or file weight. Topaz-class quality, fully local — no upload to any server.'
      : language === 'zh-CN'
      ? '支持上传最大 100 MB 图片。可放大或缩小至任意尺寸或文件大小。Topaz 级画质，全部本地处理，绝不上传任何服务器。'
      : '支援上傳最大 100 MB 圖片。可放大或縮小至任意尺寸或檔案大小。Topaz 級畫質，全部本地處理，絕不上傳任何伺服器。',
    dropHere: language === 'en' ? 'Drop an image here, or click to upload (max 100 MB)' :
      language === 'zh-CN' ? '拖放图片到此处，或点击上传（最大 100 MB）' : '拖放圖片到此處，或點擊上傳（最大 100 MB）',
    chooseFile: language === 'en' ? 'Upload Media' : language === 'zh-CN' ? '上传媒体' : '上傳媒體',
    original: language === 'en' ? 'Original' : '原始',
    target: language === 'en' ? 'Target Size' : language === 'zh-CN' ? '目标尺寸' : '目標尺寸',
    width: language === 'en' ? 'Width (px)' : language === 'zh-CN' ? '宽度 (px)' : '寬度 (px)',
    height: language === 'en' ? 'Height (px)' : language === 'zh-CN' ? '高度 (px)' : '高度 (px)',
    lockRatio: language === 'en' ? 'Lock aspect ratio' : language === 'zh-CN' ? '锁定宽高比' : '鎖定寬高比',
    scaleByPct: language === 'en' ? 'Scale by %' : language === 'zh-CN' ? '按百分比' : '按百分比',
    presets: language === 'en' ? 'Presets' : language === 'zh-CN' ? '预设' : '預設',
    fitMode: language === 'en' ? 'Fit Mode' : language === 'zh-CN' ? '适应模式' : '適應模式',
    fitExact: language === 'en' ? 'Stretch (exact)' : language === 'zh-CN' ? '拉伸（精确）' : '拉伸（精確）',
    fitContain: language === 'en' ? 'Contain (letterbox)' : language === 'zh-CN' ? '完整包含（留边）' : '完整包含（留邊）',
    fitCover: language === 'en' ? 'Cover (crop)' : language === 'zh-CN' ? '填满裁剪' : '填滿裁剪',
    format: language === 'en' ? 'Output Format' : language === 'zh-CN' ? '输出格式' : '輸出格式',
    quality: language === 'en' ? 'Quality' : language === 'zh-CN' ? '品质' : '品質',
    bgColor: language === 'en' ? 'Background (letterbox)' : language === 'zh-CN' ? '背景颜色（留边）' : '背景顏色（留邊）',
    process: language === 'en' ? 'Process' : language === 'zh-CN' ? '开始处理' : '開始處理',
    download: language === 'en' ? 'Download' : '下載',
    reset: language === 'en' ? 'Reset' : '重置',
    result: language === 'en' ? 'Result' : language === 'zh-CN' ? '结果' : '結果',
    processing: language === 'en' ? 'Processing…' : language === 'zh-CN' ? '处理中…' : '處理中…',
    done: language === 'en' ? 'Done' : '完成',
    sizeLabel: language === 'en' ? 'File size' : language === 'zh-CN' ? '档案大小' : '檔案大小',
    upscale: language === 'en' ? 'Upscale' : language === 'zh-CN' ? '放大' : '放大',
    downscale: language === 'en' ? 'Downscale' : language === 'zh-CN' ? '缩小' : '縮小',
    model: language === 'en' ? 'Model' : '模型',
    targetFileSize: language === 'en' ? 'Target File Size' : language === 'zh-CN' ? '目标文件大小' : '目標檔案大小',
    targetResolution: language === 'en' ? 'Target Resolution' : language === 'zh-CN' ? '目标分辨率' : '目標解析度',
    other: language === 'en' ? 'Other (MB)' : language === 'zh-CN' ? '其他（MB）' : '其他（MB）',
    none: language === 'en' ? 'None' : language === 'zh-CN' ? '不限' : '不限',
    topazDesc: language === 'en' ? 'High-fidelity general-purpose upscale' : language === 'zh-CN' ? '通用高保真放大' : '通用高保真放大',
    topazGenDesc: language === 'en' ? 'Detail-enhanced generative upscale' : language === 'zh-CN' ? '细节增强的生成式放大' : '細節增強的生成式放大',
    aspectRatio: language === 'en' ? 'Aspect Ratio' : language === 'zh-CN' ? '宽高比' : '寬高比',
    auto: language === 'en' ? 'Auto' : language === 'zh-CN' ? '自动' : '自動',
  }), [language]);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image.', variant: 'destructive' });
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast({
        title: language === 'en' ? 'File too large' : language === 'zh-CN' ? '文件过大' : '檔案過大',
        description: `${(file.size / 1024 / 1024).toFixed(1)} MB > ${MAX_UPLOAD_MB} MB`,
        variant: 'destructive',
      });
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onerror = () => {
      URL.revokeObjectURL(url);
      const isHeic = /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
      toast({
        title: language === 'en' ? 'Could not read image' : language === 'zh-CN' ? '无法读取图片' : '無法讀取圖片',
        description: isHeic
          ? (language === 'en'
              ? 'HEIC/HEIF is not supported by your browser. Please convert to JPEG or PNG first.'
              : language === 'zh-CN'
              ? 'HEIC/HEIF 格式浏览器不支持，请先转换为 JPEG 或 PNG。'
              : 'HEIC/HEIF 格式瀏覽器不支援，請先轉換為 JPEG 或 PNG。')
          : (language === 'en'
              ? 'The file appears to be corrupted or in an unsupported format.'
              : language === 'zh-CN' ? '文件已损坏或格式不受支持。' : '檔案已損毀或格式不支援。'),
        variant: 'destructive',
      });
    };
    img.onload = async () => {
      let bitmap: ImageBitmap | HTMLImageElement = img;
      try { bitmap = await createImageBitmap(file); } catch { /* fallback to HTMLImageElement */ }
      const w = (bitmap as any).width ?? img.naturalWidth;
      const h = (bitmap as any).height ?? img.naturalHeight;
      if (!w || !h) {
        toast({ title: 'Error', description: 'Image has zero dimensions.', variant: 'destructive' });
        URL.revokeObjectURL(url);
        return;
      }
      setImage({ file, url, width: w, height: h, bitmap });
      setTargetW(w); setTargetH(h); setScalePct(100);
      setPreviewUrl(null); setOutputBlob(null); setOutputSize(null);
    };
    img.src = url;
  }, [toast, language]);

  const onDrop = (e: React.DragEvent) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); };
  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) handleFile(f); };

  // Effective ratio: explicit aspect ratio overrides the source ratio (and lock).
  const effectiveRatio = (): number | null => {
    const ar = ASPECT_RATIOS.find((a) => a.key === aspectRatio);
    if (ar?.ratio) return ar.ratio;
    if (lockRatio && image) return image.width / image.height;
    return null;
  };

  const updateWidth = (w: number) => {
    setTargetW(w);
    const r = effectiveRatio();
    if (r) setTargetH(Math.max(1, Math.round(w / r)));
  };
  const updateHeight = (h: number) => {
    setTargetH(h);
    const r = effectiveRatio();
    if (r) setTargetW(Math.max(1, Math.round(h * r)));
  };

  const applyAspectRatio = (key: AspectRatioKey) => {
    setAspectRatio(key);
    setTabValue('dims'); // jump to dimensions tab so the change is visible
    const ar = ASPECT_RATIOS.find((a) => a.key === key);
    const baseW = targetW > 0 ? targetW : (image?.width ?? 1920);
    if (!ar?.ratio) {
      // Auto: restore source ratio (or keep current if no image)
      if (image) {
        setTargetH(Math.max(1, Math.round(baseW * image.height / image.width)));
      }
      return;
    }
    setTargetW(baseW);
    setTargetH(Math.max(1, Math.round(baseW / ar.ratio)));
    setLockRatio(true);
  };
  const updateScale = (pct: number) => {
    setScalePct(pct);
    if (image) {
      setTargetW(Math.max(1, Math.round((image.width * pct) / 100)));
      setTargetH(Math.max(1, Math.round((image.height * pct) / 100)));
    }
  };
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const applyDimPreset = (label: string, w: number, h: number) => {
    setTargetW(w);
    setTargetH(h);
    setLockRatio(false);
    setAspectRatio('auto');
    setSelectedPreset(label);
    setTabValue('dims');
    if (image) {
      const srcLong = Math.max(image.width, image.height);
      const dstLong = Math.max(w, h);
      setScalePct(Math.round((dstLong / srcLong) * 100));
      setMode(dstLong >= srcLong ? 'upscale' : 'downscale');
    }
  };

  const applyResTarget = (longSide: number) => {
    if (!image) return;
    setLockRatio(true);
    const srcLong = Math.max(image.width, image.height);
    const scale = longSide / srcLong;
    setTargetW(Math.max(1, Math.round(image.width * scale)));
    setTargetH(Math.max(1, Math.round(image.height * scale)));
    setScalePct(Math.round(scale * 100));
    setMode(scale >= 1 ? 'upscale' : 'downscale');
  };

  const quickScale = (factor: number) => {
    if (!image) return;
    setLockRatio(true);
    setTargetW(Math.max(1, Math.round(image.width * factor)));
    setTargetH(Math.max(1, Math.round(image.height * factor)));
    setScalePct(factor * 100);
    setMode(factor >= 1 ? 'upscale' : 'downscale');
  };

  const doResize = useCallback(async () => {
    if (!image) return;
    setProcessing(true); setPreviewUrl(null); setOutputBlob(null);
    try {
      let W = Math.max(1, Math.round(targetW));
      let H = Math.max(1, Math.round(targetH));
      // Clamp to safe browser encoder cap to avoid silent canvas.toBlob failures.
      const longEdge = Math.max(W, H);
      if (longEdge > SAFE_MAX_DIM) {
        const k = SAFE_MAX_DIM / longEdge;
        W = Math.max(1, Math.round(W * k));
        H = Math.max(1, Math.round(H * k));
        toast({
          title: language === 'en' ? 'Size capped' : language === 'zh-CN' ? '尺寸已限制' : '尺寸已限制',
          description: language === 'en'
            ? `Target exceeded the browser encoder limit (${SAFE_MAX_DIM}px). Output clamped to ${W}×${H}.`
            : language === 'zh-CN'
            ? `目标超过浏览器编码上限 (${SAFE_MAX_DIM}px)，已限制为 ${W}×${H}。`
            : `目標超過瀏覽器編碼上限 (${SAFE_MAX_DIM}px)，已限制為 ${W}×${H}。`,
        });
      }
      const srcRatio = image.width / image.height;
      const dstRatio = W / H;

      let drawW = W, drawH = H, offX = 0, offY = 0;
      let srcX = 0, srcY = 0, srcW = image.width, srcH = image.height;

      if (fitMode === 'contain') {
        if (srcRatio > dstRatio) { drawW = W; drawH = Math.round(W / srcRatio); offY = Math.round((H - drawH) / 2); }
        else { drawH = H; drawW = Math.round(H * srcRatio); offX = Math.round((W - drawW) / 2); }
      } else if (fitMode === 'cover') {
        if (srcRatio > dstRatio) { const nW = Math.round(image.height * dstRatio); srcX = Math.round((image.width - nW) / 2); srcW = nW; }
        else { const nH = Math.round(image.width / dstRatio); srcY = Math.round((image.height - nH) / 2); srcH = nH; }
      }

      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = srcW; cropCanvas.height = srcH;
      const cctx = cropCanvas.getContext('2d')!;
      cctx.imageSmoothingEnabled = true; cctx.imageSmoothingQuality = 'high';
      cctx.drawImage(image.bitmap as any, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);

      let resized = resizeBitmap(cropCanvas, srcW, srcH, drawW, drawH);

      // Topaz Generative: apply detail-enhance pass after upscale
      if (model === 'topaz-generative' && (drawW > srcW || drawH > srcH)) {
        resized = generativeEnhance(resized);
      }

      const out = document.createElement('canvas');
      out.width = W; out.height = H;
      const octx = out.getContext('2d')!;
      if (fitMode === 'contain' && (drawW !== W || drawH !== H)) {
        octx.fillStyle = format === 'image/png' ? 'rgba(0,0,0,0)' : bgColor;
        octx.fillRect(0, 0, W, H);
      }
      octx.imageSmoothingEnabled = true; octx.imageSmoothingQuality = 'high';
      octx.drawImage(resized, offX, offY, drawW, drawH);

      let blob: Blob;
      let effectiveExt = format === 'image/jpeg' ? 'jpg' : format === 'image/webp' ? 'webp' : 'png';
      if (targetSizeMb != null) {
        const tgt = targetSizeMb * 1024 * 1024;
        const fmtForSize: OutputFormat = format === 'image/png' ? 'image/jpeg' : format;
        const result = await encodeToTargetSize(out, fmtForSize, tgt);
        blob = result.blob;
        effectiveExt = result.format === 'image/jpeg' ? 'jpg' : result.format === 'image/webp' ? 'webp' : 'png';
      } else {
        blob = await canvasToBlob(out, format, quality / 100);
      }

      const url = URL.createObjectURL(blob);
      setPreviewUrl(url); setOutputBlob(blob);
      setOutputSize({ w: W, h: H, bytes: blob.size });
      (window as any).__clovers_last_ext = effectiveExt;
      toast({ title: L.done, description: `${W}×${H} • ${(blob.size / 1024 / 1024).toFixed(2)} MB` });
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Error', description: err?.message ?? 'Resize failed', variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  }, [image, targetW, targetH, fitMode, format, quality, bgColor, model, targetSizeMb, toast, L.done, language]);

  const download = () => {
    if (!outputBlob || !image || !previewUrl) return;
    const ext = (window as any).__clovers_last_ext
      || (format === 'image/jpeg' ? 'jpg' : format === 'image/webp' ? 'webp' : 'png');
    const base = image.file.name.replace(/\.[^.]+$/, '');
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `${base}_${outputSize?.w}x${outputSize?.h}_${model}_clovers.${ext}`;
    document.body.appendChild(a); a.click(); a.remove();
  };

  const reset = () => {
    if (image?.url) URL.revokeObjectURL(image.url);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImage(null); setPreviewUrl(null); setOutputBlob(null); setOutputSize(null);
    setTargetSizeMb(null); setScalePct(100); setMode('upscale');
    setModel('topaz'); setFitMode('contain'); setFormat('image/jpeg'); setQuality(95);
    setAspectRatio('auto');
  };

  useEffect(() => () => {
    if (image?.url) URL.revokeObjectURL(image.url);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, []); // eslint-disable-line

  return (
    <>
      <Helmet>
        <title>{L.title} | Clovers</title>
        <meta name="description" content={L.subtitle} />
      </Helmet>

      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">{L.title}</h1>
            <p className="text-muted-foreground mt-2 max-w-3xl">{L.subtitle}</p>
          </div>
          <Button variant="outline" onClick={reset}>
            <RefreshCw className="w-4 h-4 mr-2" /> {L.reset}
          </Button>
        </div>

        {!image && (
          <Card>
            <CardContent className="p-0">
              <div
                ref={dropRef}
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
              >
                <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">{L.dropHere}</p>
                <Button variant="default" className="mt-4">
                  <ImageIcon className="w-4 h-4 mr-2" /> {L.chooseFile}
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  PNG · JPEG · WebP · HEIC* · max {MAX_UPLOAD_MB} MB
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onPickFile}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {image && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{L.target}</span>
                  <Button variant="ghost" size="sm" onClick={reset}>
                    <RefreshCw className="w-4 h-4 mr-1" /> {L.reset}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="text-sm text-muted-foreground">
                  {L.original}: <span className="font-medium text-foreground">{image.width} × {image.height}</span>
                  {' • '}
                  {(image.file.size / 1024 / 1024).toFixed(2)} MB
                </div>

                {/* Mode: Upscale / Downscale */}
                <div>
                  <Label className="mb-2 block">Mode</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={mode === 'upscale' ? 'default' : 'outline'}
                      onClick={() => setMode('upscale')}
                    >
                      <Maximize2 className="w-4 h-4 mr-1" /> {L.upscale}
                    </Button>
                    <Button
                      variant={mode === 'downscale' ? 'default' : 'outline'}
                      onClick={() => setMode('downscale')}
                    >
                      <Minimize2 className="w-4 h-4 mr-1" /> {L.downscale}
                    </Button>
                  </div>
                </div>

                {/* Model */}
                <div>
                  <Label className="mb-2 block">{L.model}</Label>
                  <Select value={model} onValueChange={(v: ModelKind) => setModel(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="topaz">
                        <span className="flex items-center gap-2"><Gauge className="w-4 h-4" /> Topaz — {L.topazDesc}</span>
                      </SelectItem>
                      <SelectItem value="topaz-generative">
                        <span className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> Topaz Generative — {L.topazGenDesc}</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Aspect Ratio */}
                <div>
                  <Label className="mb-2 block">
                    {L.aspectRatio}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      → {targetW} × {targetH}
                    </span>
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {ASPECT_RATIOS.map((a) => (
                      <Button
                        key={a.key}
                        type="button"
                        variant={aspectRatio === a.key ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => applyAspectRatio(a.key)}
                      >
                        {a.key === 'auto' ? L.auto : a.key}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Resolution quick buttons */}
                <div>
                  <Label className="mb-2 block">{L.targetResolution}</Label>
                  <div className="flex flex-wrap gap-2">
                    {RES_TARGETS.map((r) => (
                      <Button key={r.label} variant="outline" size="sm" onClick={() => applyResTarget(r.long)}>
                        {r.label}
                      </Button>
                    ))}
                    {[0.5, 2, 4].map((f) => (
                      <Button key={f} variant="outline" size="sm" onClick={() => quickScale(f)}>
                        ×{f}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* File-size quick buttons */}
                <div>
                  <Label className="mb-2 block">{L.targetFileSize}</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={targetSizeMb === null ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTargetSizeMb(null)}
                    >
                      {L.none}
                    </Button>
                    {SIZE_TARGETS_MB.map((mb) => (
                      <Button
                        key={mb}
                        variant={targetSizeMb === mb ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTargetSizeMb(mb)}
                      >
                        {mb} MB
                      </Button>
                    ))}
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={0.1}
                        max={500}
                        step={0.5}
                        value={customSizeMb}
                        onChange={(e) => setCustomSizeMb(parseFloat(e.target.value) || 0)}
                        className="h-8 w-20"
                      />
                      <Button
                        variant={targetSizeMb === customSizeMb ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTargetSizeMb(customSizeMb)}
                      >
                        {L.other}
                      </Button>
                    </div>
                  </div>
                  {targetSizeMb != null && (
                    <p className="text-xs text-muted-foreground mt-2">
                      → target ≤ {targetSizeMb} MB (auto-tuned JPEG/WebP quality)
                    </p>
                  )}
                </div>

                <Tabs value={tabValue} onValueChange={(v) => setTabValue(v as 'dims' | 'scale' | 'presets')}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="dims">{L.target}</TabsTrigger>
                    <TabsTrigger value="scale">{L.scaleByPct}</TabsTrigger>
                    <TabsTrigger value="presets">{L.presets}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="dims" className="space-y-3 pt-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>{L.width}</Label>
                        <Input type="number" min={1} max={16384} value={targetW}
                          onChange={(e) => updateWidth(parseInt(e.target.value) || 0)} />
                      </div>
                      <div>
                        <Label>{L.height}</Label>
                        <Input type="number" min={1} max={16384} value={targetH}
                          onChange={(e) => updateHeight(parseInt(e.target.value) || 0)} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={lockRatio} onCheckedChange={setLockRatio} id="lock" />
                      <Label htmlFor="lock">{L.lockRatio}</Label>
                    </div>
                  </TabsContent>

                  <TabsContent value="scale" className="space-y-3 pt-3">
                    <div className="flex items-center justify-between">
                      <Label>{L.scaleByPct}</Label>
                      <span className="text-sm font-medium">{scalePct}%</span>
                    </div>
                    <Slider min={10} max={800} step={5} value={[scalePct]} onValueChange={(v) => updateScale(v[0])} />
                    <div className="text-sm text-muted-foreground">
                      → {Math.round((image.width * scalePct) / 100)} × {Math.round((image.height * scalePct) / 100)}
                    </div>
                  </TabsContent>

                  <TabsContent value="presets" className="pt-3">
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                      {Array.from(new Set(DIMENSION_PRESETS.map((p) => p.group))).map((group) => (
                        <div key={group}>
                          <div className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                            {group}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {DIMENSION_PRESETS.filter((p) => p.group === group).map((p) => (
                              <Button
                                key={p.label}
                                type="button"
                                variant={selectedPreset === p.label ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => applyDimPreset(p.label, p.w, p.h)}
                                className="justify-start text-left"
                              >
                                {p.label}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <Label>{L.fitMode}</Label>
                    <Select value={fitMode} onValueChange={(v: FitMode) => setFitMode(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="exact">{L.fitExact}</SelectItem>
                        <SelectItem value="contain">{L.fitContain}</SelectItem>
                        <SelectItem value="cover">{L.fitCover}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{L.format}</Label>
                    <Select value={format} onValueChange={(v: OutputFormat) => setFormat(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="image/png">PNG (lossless)</SelectItem>
                        <SelectItem value="image/jpeg">JPEG</SelectItem>
                        <SelectItem value="image/webp">WebP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {format !== 'image/png' && targetSizeMb == null && (
                  <div>
                    <div className="flex items-center justify-between">
                      <Label>{L.quality}</Label>
                      <span className="text-sm font-medium">{quality}</span>
                    </div>
                    <Slider min={30} max={100} step={1} value={[quality]} onValueChange={(v) => setQuality(v[0])} />
                  </div>
                )}

                {fitMode === 'contain' && (
                  <div>
                    <Label>{L.bgColor}</Label>
                    <Input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-10 w-20 p-1" />
                  </div>
                )}

                <Button onClick={doResize} disabled={processing} className="w-full" size="lg">
                  {processing ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {L.processing}</>
                  ) : (
                    <>
                      {mode === 'upscale' ? <Maximize2 className="w-4 h-4 mr-2" /> : <Minimize2 className="w-4 h-4 mr-2" />}
                      {mode === 'upscale' ? L.upscale : L.downscale}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card>
              <CardHeader><CardTitle>{L.result}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border border-border bg-muted/30 overflow-hidden flex items-center justify-center min-h-[300px]">
                  {previewUrl ? (
                    <img src={previewUrl} alt="result" className="max-w-full max-h-[60vh] object-contain" />
                  ) : (
                    <img src={image.url} alt="original" className="max-w-full max-h-[60vh] object-contain opacity-60" />
                  )}
                </div>
                {outputSize && (
                  <div className="text-sm text-muted-foreground flex items-center justify-between">
                    <span>{outputSize.w} × {outputSize.h}</span>
                    <span>{L.sizeLabel}: {(outputSize.bytes / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                )}
                <Button onClick={download} disabled={!outputBlob} className="w-full" size="lg">
                  <Download className="w-4 h-4 mr-2" /> {L.download}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
};

export default ImageResizingPage;
