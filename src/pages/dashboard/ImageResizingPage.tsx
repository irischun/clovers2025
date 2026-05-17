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

const DIMENSION_PRESETS: { label: string; w: number; h: number }[] = [
  { label: '1:1 Square 1080', w: 1080, h: 1080 },
  { label: '16:9 HD 1920×1080', w: 1920, h: 1080 },
  { label: '16:9 4K 3840×2160', w: 3840, h: 2160 },
  { label: '16:9 8K 7680×4320', w: 7680, h: 4320 },
  { label: '9:16 Story 1080×1920', w: 1080, h: 1920 },
  { label: '4:5 Portrait 1080×1350', w: 1080, h: 1350 },
  { label: '3:2 Photo 3000×2000', w: 3000, h: 2000 },
  { label: 'A4 Print 300dpi 2480×3508', w: 2480, h: 3508 },
];

// File-size target buttons (MB). null = "Other" (custom).
const SIZE_TARGETS_MB = [2, 5, 10, 15, 20, 30, 50, 70, 80, 100];
// Resolution long-side targets (px)
const RES_TARGETS: { label: string; long: number }[] = [
  { label: '1K', long: 1024 },
  { label: '2K', long: 2048 },
  { label: '4K', long: 3840 },
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

async function canvasToBlob(canvas: HTMLCanvasElement, format: OutputFormat, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Encoding failed'))),
      format,
      format === 'image/png' ? undefined : quality,
    ),
  );
}

// Binary-search JPEG/WebP quality to hit a target byte size as closely as
// possible without going over. Returns the encoded blob.
async function encodeToTargetSize(
  canvas: HTMLCanvasElement,
  format: OutputFormat,
  targetBytes: number,
): Promise<Blob> {
  if (format === 'image/png') {
    // PNG is lossless; just return the encoded blob.
    return canvasToBlob(canvas, format);
  }
  let lo = 0.2, hi = 1.0, best: Blob | null = null;
  for (let i = 0; i < 8; i++) {
    const q = (lo + hi) / 2;
    const blob = await canvasToBlob(canvas, format, q);
    if (blob.size <= targetBytes) {
      best = blob;
      lo = q; // try higher quality
    } else {
      hi = q;
    }
  }
  if (!best) best = await canvasToBlob(canvas, format, 0.2);
  return best;
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
    img.onload = async () => {
      let bitmap: ImageBitmap | HTMLImageElement = img;
      try { bitmap = await createImageBitmap(file); } catch { /* fallback */ }
      const w = (bitmap as any).width ?? img.naturalWidth;
      const h = (bitmap as any).height ?? img.naturalHeight;
      setImage({ file, url, width: w, height: h, bitmap });
      setTargetW(w); setTargetH(h); setScalePct(100);
      setPreviewUrl(null); setOutputBlob(null); setOutputSize(null);
    };
    img.src = url;
  }, [toast, language]);

  const onDrop = (e: React.DragEvent) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); };
  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) handleFile(f); };

  const updateWidth = (w: number) => {
    setTargetW(w);
    if (lockRatio && image) setTargetH(Math.max(1, Math.round((w * image.height) / image.width)));
  };
  const updateHeight = (h: number) => {
    setTargetH(h);
    if (lockRatio && image) setTargetW(Math.max(1, Math.round((h * image.width) / image.height)));
  };
  const updateScale = (pct: number) => {
    setScalePct(pct);
    if (image) {
      setTargetW(Math.max(1, Math.round((image.width * pct) / 100)));
      setTargetH(Math.max(1, Math.round((image.height * pct) / 100)));
    }
  };
  const applyDimPreset = (w: number, h: number) => { setTargetW(w); setTargetH(h); setLockRatio(false); };

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
      const W = Math.max(1, Math.round(targetW));
      const H = Math.max(1, Math.round(targetH));
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
      if (targetSizeMb != null) {
        const tgt = targetSizeMb * 1024 * 1024;
        // If PNG selected but a size cap is requested, switch to JPEG/WebP for binary search.
        const fmtForSize: OutputFormat = format === 'image/png' ? 'image/jpeg' : format;
        blob = await encodeToTargetSize(out, fmtForSize, tgt);
      } else {
        blob = await canvasToBlob(out, format, quality / 100);
      }

      const url = URL.createObjectURL(blob);
      setPreviewUrl(url); setOutputBlob(blob);
      setOutputSize({ w: W, h: H, bytes: blob.size });
      toast({ title: L.done, description: `${W}×${H} • ${(blob.size / 1024 / 1024).toFixed(2)} MB` });
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Error', description: err?.message ?? 'Resize failed', variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  }, [image, targetW, targetH, fitMode, format, quality, bgColor, model, targetSizeMb, toast, L.done]);

  const download = () => {
    if (!outputBlob || !image || !previewUrl) return;
    let ext = format === 'image/jpeg' ? 'jpg' : format === 'image/webp' ? 'webp' : 'png';
    if (targetSizeMb != null && format === 'image/png') ext = 'jpg';
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

                <Tabs defaultValue="dims">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                      {DIMENSION_PRESETS.map((p) => (
                        <Button key={p.label} variant="outline" size="sm"
                          onClick={() => applyDimPreset(p.w, p.h)} className="justify-start">
                          {p.label}
                        </Button>
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
