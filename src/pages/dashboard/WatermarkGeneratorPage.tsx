import { useMemo, useState } from 'react';
import { Download, Loader2, Plus, Upload } from 'lucide-react';
import JSZip from 'jszip';
import { removeBackground } from '@imgly/background-removal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/i18n/LanguageContext';
import { toast } from 'sonner';

interface SourceImage {
  id: string;
  name: string;
  src: string;
  type: string;
  el: HTMLImageElement;
  width: number;
  height: number;
}

interface ProcessedImage {
  src: string;
  blob: Blob;
  el: HTMLImageElement;
  width: number;
  height: number;
}

const uid = () => Math.random().toString(36).slice(2, 10);

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const fileToDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const blobToDataURL = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

export default function WatermarkGeneratorPage() {
  const { language } = useLanguage();

  const L = useMemo(() => {
    const isCN = language === 'zh-CN';
    const isTW = language === 'zh-TW';

    if (isTW) {
      return {
        title: '浮水印生成器',
        subtitle: '此頁面已簡化為純去背工具：只移除背景並輸出完全透明的 PNG，不再加入任何額外浮水印、文字或圖層。',
        selectImages: '選擇圖片',
        orDrop: '或將圖片拖曳到此處',
        pageOf: (a: number, b: number) => `${a} / ${b}`,
        transparentPreview: '透明 PNG 預覽',
        originalPreview: '原圖預覽',
        outputFixed: '輸出格式固定為 PNG（透明背景）',
        ready: '結果已準備完成，可直接下載',
        pending: '尚未去背，點擊下方按鈕開始處理',
        removeAndDownloadOne: '移除背景並下載 PNG',
        removeAndDownloadAll: '全部去背並下載 ZIP',
        processing: '處理中...',
        noImages: '請先上傳圖片',
        successOne: '透明 PNG 已下載',
        successAll: '透明 PNG 壓縮檔已下載',
        failed: '背景移除失敗',
        addMore: '加入更多圖片',
        files: '檔案數量',
        processed: '已完成',
      };
    }

    if (isCN) {
      return {
        title: '水印生成器',
        subtitle: '此页面已简化为纯抠图工具：只移除背景并输出完全透明的 PNG，不再加入任何额外水印、文字或图层。',
        selectImages: '选择图片',
        orDrop: '或将图片拖到此处',
        pageOf: (a: number, b: number) => `${a} / ${b}`,
        transparentPreview: '透明 PNG 预览',
        originalPreview: '原图预览',
        outputFixed: '输出格式固定为 PNG（透明背景）',
        ready: '结果已准备完成，可直接下载',
        pending: '尚未去背，点击下方按钮开始处理',
        removeAndDownloadOne: '移除背景并下载 PNG',
        removeAndDownloadAll: '全部去背并下载 ZIP',
        processing: '处理中...',
        noImages: '请先上传图片',
        successOne: '透明 PNG 已下载',
        successAll: '透明 PNG 压缩包已下载',
        failed: '背景移除失败',
        addMore: '添加更多图片',
        files: '文件数量',
        processed: '已完成',
      };
    }

    return {
      title: 'Watermark Generator',
      subtitle: 'This page is now simplified to background removal only: it removes the background and exports a fully transparent PNG with no extra watermark, text, or overlay.',
      selectImages: 'Select images',
      orDrop: 'or drop images here',
      pageOf: (a: number, b: number) => `${a} / ${b}`,
      transparentPreview: 'Transparent PNG preview',
      originalPreview: 'Original preview',
      outputFixed: 'Output is fixed to PNG with a transparent background',
      ready: 'The transparent result is ready to download',
      pending: 'Background removal has not run yet',
      removeAndDownloadOne: 'Remove background & download PNG',
      removeAndDownloadAll: 'Remove background for all & download ZIP',
      processing: 'Processing...',
      noImages: 'Please upload at least one image',
      successOne: 'Transparent PNG downloaded',
      successAll: 'Transparent PNG ZIP downloaded',
      failed: 'Background removal failed',
      addMore: 'Add more images',
      files: 'Files',
      processed: 'Processed',
    };
  }, [language]);

  const [images, setImages] = useState<SourceImage[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [processedMap, setProcessedMap] = useState<Record<string, ProcessedImage>>({});
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const current = images[currentIdx] ?? null;
  const currentProcessed = current ? processedMap[current.id] : null;

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;

    const accepted = Array.from(files).filter((file) => /image\/(jpeg|jpg|png|gif|webp)/.test(file.type));
    if (!accepted.length) {
      toast.error('Only JPG/PNG/GIF/WEBP supported');
      return;
    }

    const loaded: SourceImage[] = [];
    for (const file of accepted) {
      try {
        const src = await fileToDataURL(file);
        const el = await loadImage(src);
        loaded.push({
          id: uid(),
          name: file.name,
          src,
          type: file.type,
          el,
          width: el.naturalWidth,
          height: el.naturalHeight,
        });
      } catch {
        // skip unreadable file
      }
    }

    setImages((prev) => [...prev, ...loaded]);
    if (loaded.length && images.length === 0) {
      setCurrentIdx(0);
    }
  };

  const removeBg = async (image: SourceImage): Promise<ProcessedImage> => {
    const sourceBlob = await (await fetch(image.src)).blob();
    // Highest-quality config: full-precision ISNet model + lossless PNG output at
    // native resolution. This matches the smoothness/quality of iloveimg's output.
    const outputBlob = await removeBackground(sourceBlob, {
      model: 'isnet',
      output: {
        format: 'image/png',
        quality: 1,
      },
    });
    const outputSrc = await blobToDataURL(outputBlob);
    const outputEl = await loadImage(outputSrc);

    return {
      src: outputSrc,
      blob: outputBlob,
      el: outputEl,
      width: outputEl.naturalWidth,
      height: outputEl.naturalHeight,
    };
  };

  const ensureProcessed = async (image: SourceImage) => {
    const existing = processedMap[image.id];
    if (existing) return existing;

    const processed = await removeBg(image);
    setProcessedMap((prev) => ({ ...prev, [image.id]: processed }));
    return processed;
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleProcessAndDownload = async () => {
    if (!images.length) {
      toast.error(L.noImages);
      return;
    }

    setProcessing(true);
    try {
      if (images.length === 1) {
        const source = images[0];
        const result = await ensureProcessed(source);
        downloadBlob(result.blob, `${source.name.replace(/\.[^.]+$/, '')}.png`);
        toast.success(L.successOne);
      } else {
        const zip = new JSZip();

        for (const source of images) {
          const result = await ensureProcessed(source);
          zip.file(`${source.name.replace(/\.[^.]+$/, '')}.png`, result.blob);
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        downloadBlob(zipBlob, 'transparent_png_images.zip');
        toast.success(L.successAll);
      }
    } catch (error) {
      console.error(error);
      toast.error(L.failed);
    } finally {
      setProcessing(false);
    }
  };

  const previewImage = currentProcessed?.src ?? current?.src ?? null;
  const previewLabel = currentProcessed ? L.transparentPreview : L.originalPreview;

  return (
    <div className="container mx-auto space-y-6 p-4 md:p-6">
      <div className="space-y-2 text-center">
        <h1 className="font-display text-3xl font-bold md:text-5xl">{L.title}</h1>
        <p className="mx-auto max-w-3xl text-muted-foreground">{L.subtitle}</p>
      </div>

      {!images.length ? (
        <Card
          className={`mx-auto max-w-3xl border-2 border-dashed p-10 text-center transition md:p-16 ${
            dragOver ? 'border-primary bg-primary/5' : 'border-border'
          }`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            handleFiles(event.dataTransfer.files);
          }}
        >
          <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <label>
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(event) => handleFiles(event.target.files)}
            />
            <Button size="lg" className="px-8 py-6 text-lg" asChild>
              <span>{L.selectImages}</span>
            </Button>
          </label>
          <p className="mt-4 text-sm text-muted-foreground">{L.orDrop}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{current?.name}</div>
                <div className="text-xs text-muted-foreground">{previewLabel}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx((value) => Math.max(0, value - 1))}
                >
                  ‹
                </Button>
                <span className="text-sm">{L.pageOf(currentIdx + 1, images.length)}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentIdx >= images.length - 1}
                  onClick={() => setCurrentIdx((value) => Math.min(images.length - 1, value + 1))}
                >
                  ›
                </Button>

                <label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => handleFiles(event.target.files)}
                  />
                  <Button variant="outline" size="sm" asChild>
                    <span>
                      <Plus className="h-4 w-4" />
                    </span>
                  </Button>
                </label>
              </div>
            </div>

            <div className="flex min-h-[420px] items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40 p-4 md:min-h-[520px]">
              {previewImage ? (
                <img
                  src={previewImage}
                  alt={current?.name}
                  className="max-h-[68vh] max-w-full object-contain"
                  loading="lazy"
                />
              ) : null}
            </div>
          </div>

          <Card className="h-fit space-y-4 p-4 lg:sticky lg:top-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                <span className="text-muted-foreground">{L.files}</span>
                <span className="font-medium">{images.length}</span>
              </div>
              <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
                <span className="text-muted-foreground">{L.processed}</span>
                <span className="font-medium">{Object.keys(processedMap).length}</span>
              </div>
            </div>

            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
              {L.outputFixed}
            </div>

            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
              {currentProcessed ? L.ready : L.pending}
            </div>

            <Button className="w-full" size="lg" onClick={handleProcessAndDownload} disabled={processing}>
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {L.processing}
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  {images.length === 1 ? L.removeAndDownloadOne : L.removeAndDownloadAll}
                </>
              )}
            </Button>

            <label>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(event) => handleFiles(event.target.files)}
              />
              <Button variant="outline" className="w-full" asChild>
                <span>
                  <Plus className="mr-2 h-4 w-4" />
                  {L.addMore}
                </span>
              </Button>
            </label>
          </Card>
        </div>
      )}
    </div>
  );
}