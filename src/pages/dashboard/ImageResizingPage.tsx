import { useState, useRef, useCallback, useEffect } from 'react';
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
import { Upload, Download, Image as ImageIcon, Loader2, RefreshCw, Maximize2 } from 'lucide-react';

interface LoadedImage {
  file: File;
  url: string;
  width: number;
  height: number;
  bitmap: ImageBitmap | HTMLImageElement;
}

type FitMode = 'exact' | 'contain' | 'cover';
type OutputFormat = 'image/png' | 'image/jpeg' | 'image/webp';

const PRESETS: { label: string; w: number; h: number }[] = [
  { label: '1:1 Square 1080', w: 1080, h: 1080 },
  { label: '16:9 HD 1920×1080', w: 1920, h: 1080 },
  { label: '16:9 4K 3840×2160', w: 3840, h: 2160 },
  { label: '16:9 8K 7680×4320', w: 7680, h: 4320 },
  { label: '9:16 Story 1080×1920', w: 1080, h: 1920 },
  { label: '4:5 Portrait 1080×1350', w: 1080, h: 1350 },
  { label: '3:2 Photo 3000×2000', w: 3000, h: 2000 },
  { label: 'A4 Print 300dpi 2480×3508', w: 2480, h: 3508 },
];

// High-quality multi-step resize. For large downscales, step by halves to
// approximate a Lanczos-quality result using the browser's high quality
// bilinear, which avoids aliasing. For upscales, do a single high-quality
// pass — the browser uses bicubic when imageSmoothingQuality='high'.
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
  // Downscale halving loop
  while (curW * 0.5 > destW && curH * 0.5 > destH) {
    const nextW = Math.max(destW, Math.floor(curW * 0.5));
    const nextH = Math.max(destH, Math.floor(curH * 0.5));
    const c = document.createElement('canvas');
    c.width = nextW;
    c.height = nextH;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(curSrc, 0, 0, nextW, nextH);
    curSrc = c;
    curW = nextW;
    curH = nextH;
  }
  const out = document.createElement('canvas');
  out.width = destW;
  out.height = destH;
  const octx = out.getContext('2d')!;
  octx.imageSmoothingEnabled = true;
  octx.imageSmoothingQuality = 'high';
  octx.drawImage(curSrc, 0, 0, destW, destH);
  return out;
}

const ImageResizingPage = () => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [targetW, setTargetW] = useState(1920);
  const [targetH, setTargetH] = useState(1080);
  const [lockRatio, setLockRatio] = useState(true);
  const [scalePct, setScalePct] = useState(100);
  const [fitMode, setFitMode] = useState<FitMode>('contain');
  const [format, setFormat] = useState<OutputFormat>('image/png');
  const [quality, setQuality] = useState(95);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [processing, setProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [outputSize, setOutputSize] = useState<{ w: number; h: number; bytes: number } | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // i18n labels
  const L = {
    title: language === 'en' ? 'Image Resizer' : language === 'zh-CN' ? '图片调整尺寸' : '圖片調整尺寸',
    subtitle:
      language === 'en'
        ? 'Upscale or downscale any image to any size — fast, lossless-quality, fully local.'
        : language === 'zh-CN'
        ? '快速、高画质地放大或缩小任意图片到任意尺寸，所有处理在本地完成，绝不上传。'
        : '快速、高畫質地放大或縮小任意圖片到任意尺寸，所有處理在本地完成，絕不上傳。',
    dropHere:
      language === 'en' ? 'Drop an image here, or click to upload' :
      language === 'zh-CN' ? '拖放图片到此处，或点击上传' : '拖放圖片到此處，或點擊上傳',
    chooseFile: language === 'en' ? 'Choose Image' : language === 'zh-CN' ? '选择图片' : '選擇圖片',
    original: language === 'en' ? 'Original' : language === 'zh-CN' ? '原始' : '原始',
    target: language === 'en' ? 'Target Size' : language === 'zh-CN' ? '目标尺寸' : '目標尺寸',
    width: language === 'en' ? 'Width (px)' : language === 'zh-CN' ? '宽度 (px)' : '寬度 (px)',
    height: language === 'en' ? 'Height (px)' : language === 'zh-CN' ? '高度 (px)' : '高度 (px)',
    lockRatio: language === 'en' ? 'Lock aspect ratio' : language === 'zh-CN' ? '锁定宽高比' : '鎖定寬高比',
    scaleByPct: language === 'en' ? 'Scale by percentage' : language === 'zh-CN' ? '按百分比缩放' : '按百分比縮放',
    presets: language === 'en' ? 'Presets' : language === 'zh-CN' ? '预设' : '預設',
    fitMode: language === 'en' ? 'Fit Mode' : language === 'zh-CN' ? '适应模式' : '適應模式',
    fitExact: language === 'en' ? 'Stretch (exact)' : language === 'zh-CN' ? '拉伸（精确）' : '拉伸（精確）',
    fitContain: language === 'en' ? 'Contain (letterbox)' : language === 'zh-CN' ? '完整包含（留边）' : '完整包含（留邊）',
    fitCover: language === 'en' ? 'Cover (crop)' : language === 'zh-CN' ? '填满裁剪' : '填滿裁剪',
    format: language === 'en' ? 'Output Format' : language === 'zh-CN' ? '输出格式' : '輸出格式',
    quality: language === 'en' ? 'Quality' : language === 'zh-CN' ? '品质' : '品質',
    bgColor: language === 'en' ? 'Background (letterbox)' : language === 'zh-CN' ? '背景颜色（留边）' : '背景顏色（留邊）',
    process: language === 'en' ? 'Resize Image' : language === 'zh-CN' ? '调整尺寸' : '調整尺寸',
    download: language === 'en' ? 'Download' : '下載',
    reset: language === 'en' ? 'Reset' : language === 'zh-CN' ? '重置' : '重置',
    result: language === 'en' ? 'Result' : language === 'zh-CN' ? '结果' : '結果',
    upscale4x: language === 'en' ? '×4 Upscale' : language === 'zh-CN' ? '×4 放大' : '×4 放大',
    upscale2x: language === 'en' ? '×2 Upscale' : language === 'zh-CN' ? '×2 放大' : '×2 放大',
    noImage: language === 'en' ? 'Upload an image to start' : language === 'zh-CN' ? '请先上传图片' : '請先上傳圖片',
    processing: language === 'en' ? 'Processing…' : language === 'zh-CN' ? '处理中…' : '處理中…',
    done: language === 'en' ? 'Done' : language === 'zh-CN' ? '完成' : '完成',
    sizeLabel: language === 'en' ? 'File size' : language === 'zh-CN' ? '档案大小' : '檔案大小',
  };

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image.', variant: 'destructive' });
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = async () => {
      let bitmap: ImageBitmap | HTMLImageElement = img;
      try {
        // Use ImageBitmap for faster, GPU-friendly drawing where available.
        bitmap = await createImageBitmap(file);
      } catch {
        /* fallback to HTMLImageElement */
      }
      const w = (bitmap as any).width ?? img.naturalWidth;
      const h = (bitmap as any).height ?? img.naturalHeight;
      setImage({ file, url, width: w, height: h, bitmap });
      setTargetW(w);
      setTargetH(h);
      setScalePct(100);
      setPreviewUrl(null);
      setOutputBlob(null);
      setOutputSize(null);
    };
    img.src = url;
  }, [toast]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const updateWidth = (w: number) => {
    setTargetW(w);
    if (lockRatio && image) {
      setTargetH(Math.max(1, Math.round((w * image.height) / image.width)));
    }
  };
  const updateHeight = (h: number) => {
    setTargetH(h);
    if (lockRatio && image) {
      setTargetW(Math.max(1, Math.round((h * image.width) / image.height)));
    }
  };
  const updateScale = (pct: number) => {
    setScalePct(pct);
    if (image) {
      setTargetW(Math.max(1, Math.round((image.width * pct) / 100)));
      setTargetH(Math.max(1, Math.round((image.height * pct) / 100)));
    }
  };

  const applyPreset = (w: number, h: number) => {
    setTargetW(w);
    setTargetH(h);
    setLockRatio(false);
  };

  const quickUpscale = (factor: number) => {
    if (!image) return;
    setLockRatio(true);
    setTargetW(image.width * factor);
    setTargetH(image.height * factor);
    setScalePct(factor * 100);
  };

  const doResize = useCallback(async () => {
    if (!image) return;
    setProcessing(true);
    setPreviewUrl(null);
    setOutputBlob(null);
    try {
      // Compute drawing rect based on fit mode
      const W = Math.max(1, Math.round(targetW));
      const H = Math.max(1, Math.round(targetH));
      const srcRatio = image.width / image.height;
      const dstRatio = W / H;

      let drawW = W;
      let drawH = H;
      let offX = 0;
      let offY = 0;
      let srcX = 0;
      let srcY = 0;
      let srcW = image.width;
      let srcH = image.height;

      if (fitMode === 'contain') {
        if (srcRatio > dstRatio) {
          drawW = W;
          drawH = Math.round(W / srcRatio);
          offY = Math.round((H - drawH) / 2);
        } else {
          drawH = H;
          drawW = Math.round(H * srcRatio);
          offX = Math.round((W - drawW) / 2);
        }
      } else if (fitMode === 'cover') {
        if (srcRatio > dstRatio) {
          // crop sides
          const newSrcW = Math.round(image.height * dstRatio);
          srcX = Math.round((image.width - newSrcW) / 2);
          srcW = newSrcW;
        } else {
          const newSrcH = Math.round(image.width / dstRatio);
          srcY = Math.round((image.height - newSrcH) / 2);
          srcH = newSrcH;
        }
      }

      // Build a source canvas for the cropped/full region first.
      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = srcW;
      cropCanvas.height = srcH;
      const cctx = cropCanvas.getContext('2d')!;
      cctx.imageSmoothingEnabled = true;
      cctx.imageSmoothingQuality = 'high';
      cctx.drawImage(image.bitmap as any, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);

      // High-quality resize to drawW x drawH
      const resized = resizeBitmap(cropCanvas, srcW, srcH, drawW, drawH);

      // Compose final at W x H (handles letterbox padding)
      const out = document.createElement('canvas');
      out.width = W;
      out.height = H;
      const octx = out.getContext('2d')!;
      if (fitMode === 'contain' && (drawW !== W || drawH !== H)) {
        octx.fillStyle = format === 'image/png' ? 'rgba(0,0,0,0)' : bgColor;
        octx.fillRect(0, 0, W, H);
      }
      octx.imageSmoothingEnabled = true;
      octx.imageSmoothingQuality = 'high';
      octx.drawImage(resized, offX, offY, drawW, drawH);

      const blob: Blob = await new Promise((resolve, reject) =>
        out.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Encoding failed'))),
          format,
          format === 'image/png' ? undefined : quality / 100,
        ),
      );

      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setOutputBlob(blob);
      setOutputSize({ w: W, h: H, bytes: blob.size });
      toast({ title: L.done, description: `${W}×${H} • ${(blob.size / 1024).toFixed(1)} KB` });
    } catch (err: any) {
      console.error(err);
      toast({ title: 'Error', description: err?.message ?? 'Resize failed', variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  }, [image, targetW, targetH, fitMode, format, quality, bgColor, toast, L.done]);

  const download = () => {
    if (!outputBlob || !image) return;
    const ext = format === 'image/jpeg' ? 'jpg' : format === 'image/webp' ? 'webp' : 'png';
    const base = image.file.name.replace(/\.[^.]+$/, '');
    const a = document.createElement('a');
    a.href = previewUrl!;
    a.download = `${base}_${outputSize?.w}x${outputSize?.h}_clovers.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const reset = () => {
    if (image?.url) URL.revokeObjectURL(image.url);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImage(null);
    setPreviewUrl(null);
    setOutputBlob(null);
    setOutputSize(null);
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
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">{L.title}</h1>
          <p className="text-muted-foreground mt-2">{L.subtitle}</p>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  {L.original}: <span className="font-medium text-foreground">{image.width} × {image.height}</span>
                  {' • '}
                  {(image.file.size / 1024).toFixed(1)} KB
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
                        <Input
                          type="number"
                          min={1}
                          max={16384}
                          value={targetW}
                          onChange={(e) => updateWidth(parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label>{L.height}</Label>
                        <Input
                          type="number"
                          min={1}
                          max={16384}
                          value={targetH}
                          onChange={(e) => updateHeight(parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={lockRatio} onCheckedChange={setLockRatio} id="lock" />
                      <Label htmlFor="lock">{L.lockRatio}</Label>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => quickUpscale(2)}>
                        <Maximize2 className="w-3 h-3 mr-1" /> {L.upscale2x}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => quickUpscale(4)}>
                        <Maximize2 className="w-3 h-3 mr-1" /> {L.upscale4x}
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="scale" className="space-y-3 pt-3">
                    <div className="flex items-center justify-between">
                      <Label>{L.scaleByPct}</Label>
                      <span className="text-sm font-medium">{scalePct}%</span>
                    </div>
                    <Slider
                      min={10}
                      max={800}
                      step={5}
                      value={[scalePct]}
                      onValueChange={(v) => updateScale(v[0])}
                    />
                    <div className="text-sm text-muted-foreground">
                      → {Math.round((image.width * scalePct) / 100)} × {Math.round((image.height * scalePct) / 100)}
                    </div>
                  </TabsContent>

                  <TabsContent value="presets" className="pt-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                      {PRESETS.map((p) => (
                        <Button
                          key={p.label}
                          variant="outline"
                          size="sm"
                          onClick={() => applyPreset(p.w, p.h)}
                          className="justify-start"
                        >
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

                {format !== 'image/png' && (
                  <div>
                    <div className="flex items-center justify-between">
                      <Label>{L.quality}</Label>
                      <span className="text-sm font-medium">{quality}</span>
                    </div>
                    <Slider min={30} max={100} step={1} value={[quality]} onValueChange={(v) => setQuality(v[0])} />
                  </div>
                )}

                {fitMode === 'contain' && format !== 'image/png' && (
                  <div>
                    <Label>{L.bgColor}</Label>
                    <Input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="h-10 w-20 p-1" />
                  </div>
                )}

                <Button onClick={doResize} disabled={processing} className="w-full" size="lg">
                  {processing ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {L.processing}</>
                  ) : (
                    <><Maximize2 className="w-4 h-4 mr-2" /> {L.process}</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle>{L.result}</CardTitle>
              </CardHeader>
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
                    <span>{L.sizeLabel}: {(outputSize.bytes / 1024).toFixed(1)} KB</span>
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
