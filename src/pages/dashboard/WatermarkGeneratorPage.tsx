import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Upload, Type, Image as ImageIcon, Trash2, Download, Plus, Loader2, Eraser, Bold, Italic, Underline } from 'lucide-react';
import JSZip from 'jszip';
import { removeBackground } from '@imgly/background-removal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/i18n/LanguageContext';
import { toast } from 'sonner';

type WMType = 'text' | 'image';
type Mode = 'single' | 'mosaic';
type OutputFormat = 'original' | 'png' | 'jpg';
type Pos = 'tl'|'tc'|'tr'|'cl'|'cc'|'cr'|'bl'|'bc'|'br';

interface Watermark {
  id: string;
  type: WMType;
  // text
  text?: string;
  fontFamily?: string;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  // image
  imgSrc?: string;
  imgEl?: HTMLImageElement;
  // shared (relative 0..1 to source image)
  xRel: number;
  yRel: number;
  scale: number;     // relative size factor
  rotation: number;  // degrees
  opacity: number;   // 0..1
  mode: Mode;
  tileGapX: number;  // mosaic horizontal gap (in scale units)
  tileGapY: number;  // mosaic vertical gap
}

interface SourceImage {
  id: string;
  name: string;
  src: string;
  type: string;
  el: HTMLImageElement;
  width: number;
  height: number;
}

const FONTS = ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Courier New', 'Verdana', 'Playfair Display', 'DM Sans'];
const POS_MAP: Record<Pos, { xRel: number; yRel: number }> = {
  tl: { xRel: 0.1, yRel: 0.1 }, tc: { xRel: 0.5, yRel: 0.1 }, tr: { xRel: 0.9, yRel: 0.1 },
  cl: { xRel: 0.1, yRel: 0.5 }, cc: { xRel: 0.5, yRel: 0.5 }, cr: { xRel: 0.9, yRel: 0.5 },
  bl: { xRel: 0.1, yRel: 0.9 }, bc: { xRel: 0.5, yRel: 0.9 }, br: { xRel: 0.9, yRel: 0.9 },
};

const uid = () => Math.random().toString(36).slice(2, 10);

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });

const fileToDataURL = (file: File): Promise<string> =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

export default function WatermarkGeneratorPage() {
  const { language } = useLanguage();

  const L = useMemo(() => {
    const isCN = language === 'zh-CN';
    const isTW = language === 'zh-TW';
    if (isTW) return {
      title: '浮水印生成器',
      subtitle: '為 JPG、PNG 或 GIF 圖片加上浮水印。一次為您的圖片蓋上圖片或文字浮水印。',
      selectImages: '選擇圖片', orDrop: '或將圖片拖曳到此處',
      watermarks: '浮水印', addImage: '加入圖片', addText: '加入文字',
      textWM: '文字浮水印', imageWM: '圖片浮水印',
      textContent: '文字內容', font: '字型', color: '顏色', style: '樣式',
      mode: '位置模式', single: '單個位置', mosaic: '馬賽克(平鋪)',
      opacity: '透明度', rotation: '旋轉', size: '大小',
      gapX: '橫向間距', gapY: '縱向間距',
      remove: '移除', apply: '套用浮水印', processing: '處理中...',
      noImages: '請先上傳圖片', preview: '預覽',
      pageOf: (a: number, b: number) => `${a} / ${b}`,
      dragHint: '在預覽圖上拖曳可移動浮水印',
      yourText: '您的文字',
      useOriginal: '使用原圖作為浮水印(去背)',
      removeBg: '移除背景', removingBg: '正在移除背景...',
      bgRemoved: '背景已移除', bgRemoveFailed: '背景移除失敗',
      generate: '一鍵生成浮水印', position: '位置',
      output: '輸出格式', outOriginal: '與原檔相同', outPng: 'PNG (透明)', outJpg: 'JPG',
      needWatermark: '請先加入圖片或文字浮水印',
    };
    if (isCN) return {
      title: '水印生成器',
      subtitle: '为 JPG、PNG 或 GIF 图片添加水印。一次为您的图片盖上图片或文字水印。',
      selectImages: '选择图片', orDrop: '或将图片拖到此处',
      watermarks: '水印', addImage: '添加图片', addText: '添加文字',
      textWM: '文字水印', imageWM: '图片水印',
      textContent: '文字内容', font: '字体', color: '颜色', style: '样式',
      mode: '位置模式', single: '单个位置', mosaic: '马赛克(平铺)',
      opacity: '透明度', rotation: '旋转', size: '大小',
      gapX: '横向间距', gapY: '纵向间距',
      remove: '移除', apply: '应用水印', processing: '处理中...',
      noImages: '请先上传图片', preview: '预览',
      pageOf: (a: number, b: number) => `${a} / ${b}`,
      dragHint: '在预览图上拖动可移动水印',
      yourText: '您的文字',
      useOriginal: '使用原图作为水印(去背)',
      removeBg: '移除背景', removingBg: '正在移除背景...',
      bgRemoved: '背景已移除', bgRemoveFailed: '背景移除失败',
      generate: '一键生成水印', position: '位置',
      output: '输出格式', outOriginal: '与原档相同', outPng: 'PNG (透明)', outJpg: 'JPG',
      needWatermark: '请先添加图片或文字水印',
    };
    return {
      title: 'Watermark Generator',
      subtitle: 'Watermark JPG, PNG or GIF images. Stamp images or text over your images at once.',
      selectImages: 'Select images', orDrop: 'or drop images here',
      watermarks: 'Watermarks', addImage: 'Add image', addText: 'Add text',
      textWM: 'Text watermark', imageWM: 'Image watermark',
      textContent: 'Text content', font: 'Font', color: 'Color', style: 'Style',
      mode: 'Position mode', single: 'Single position', mosaic: 'Mosaic (tiled)',
      opacity: 'Transparency', rotation: 'Rotation', size: 'Size',
      gapX: 'Horizontal margin', gapY: 'Vertical margin',
      remove: 'Remove', apply: 'Watermark IMAGES', processing: 'Processing...',
      noImages: 'Please upload at least one image', preview: 'Preview',
      pageOf: (a: number, b: number) => `${a} / ${b}`,
      dragHint: 'Drag on the preview to move the watermark',
      yourText: 'Your Text',
      useOriginal: 'Use original image as watermark (remove background)',
      removeBg: 'Remove background', removingBg: 'Removing background...',
      bgRemoved: 'Background removed', bgRemoveFailed: 'Background removal failed',
      generate: 'To Generate a Watermark', position: 'Position',
      output: 'Output format', outOriginal: 'Same as original', outPng: 'PNG (transparent)', outJpg: 'JPG',
    };
  }, [language]);

  const [images, setImages] = useState<SourceImage[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [watermarks, setWatermarks] = useState<Watermark[]>([]);
  const [selectedWmId, setSelectedWmId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processingMode, setProcessingMode] = useState<'apply' | 'auto' | null>(null);
  const [bgRemovingIds, setBgRemovingIds] = useState<Set<string>>(new Set());
  const [useOrigAsWm, setUseOrigAsWm] = useState(false);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('original');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageWmInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewWrapRef = useRef<HTMLDivElement>(null);

  const current = images[currentIdx];
  const selectedWm = watermarks.find(w => w.id === selectedWmId) || null;

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    const accepted = Array.from(files).filter(f => /image\/(jpeg|jpg|png|gif|webp)/.test(f.type));
    if (!accepted.length) { toast.error('Only JPG/PNG/GIF/WEBP supported'); return; }
    const loaded: SourceImage[] = [];
    for (const f of accepted) {
      try {
        const src = await fileToDataURL(f);
        const el = await loadImage(src);
        loaded.push({ id: uid(), name: f.name, src, type: f.type, el, width: el.naturalWidth, height: el.naturalHeight });
      } catch {/* skip */}
    }
    setImages(prev => [...prev, ...loaded]);
    if (!images.length && loaded.length) setCurrentIdx(0);
  };

  const addTextWatermark = () => {
    const wm: Watermark = {
      id: uid(), type: 'text', text: L.yourText, fontFamily: 'Arial', color: '#ffffff',
      bold: true, italic: false, underline: false,
      xRel: 0.5, yRel: 0.5, scale: 0.12, rotation: 0, opacity: 0.7, mode: 'single', tileGapX: 0.5, tileGapY: 0.5,
    };
    setWatermarks(p => [...p, wm]);
    setSelectedWmId(wm.id);
  };

  const handleImageWmFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    for (const f of Array.from(files)) {
      if (!/image\//.test(f.type)) continue;
      let src = await fileToDataURL(f);
      if (useOrigAsWm) {
        try { src = await removeBgFromDataUrl(src); }
        catch (e) { console.error(e); toast.error(L.bgRemoveFailed); }
      }
      const imgEl = await loadImage(src);
      const wm: Watermark = {
        id: uid(), type: 'image', imgSrc: src, imgEl,
        xRel: 0.5, yRel: 0.5, scale: 0.25, rotation: 0, opacity: 0.85, mode: 'single', tileGapX: 0.5, tileGapY: 0.5,
      };
      setWatermarks(p => [...p, wm]);
      setSelectedWmId(wm.id);
    }
  };

  const removeBgFromDataUrl = async (dataUrl: string): Promise<string> => {
    const blob = await (await fetch(dataUrl)).blob();
    const outBlob = await removeBackground(blob);
    return await new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = rej;
      r.readAsDataURL(outBlob);
    });
  };

  const handleRemoveBgFor = async (wmId: string) => {
    const wm = watermarks.find(w => w.id === wmId);
    if (!wm || wm.type !== 'image' || !wm.imgSrc) return;
    setBgRemovingIds(prev => new Set(prev).add(wmId));
    try {
      const transparent = await removeBgFromDataUrl(wm.imgSrc);
      const imgEl = await loadImage(transparent);
      updateWm(wmId, { imgSrc: transparent, imgEl });
      toast.success(L.bgRemoved);
    } catch (e) {
      console.error(e); toast.error(L.bgRemoveFailed);
    } finally {
      setBgRemovingIds(prev => { const n = new Set(prev); n.delete(wmId); return n; });
    }
  };

  const useCurrentAsWatermark = async () => {
    if (!current) { toast.error(L.noImages); return; }
    const tmpId = uid();
    setBgRemovingIds(prev => new Set(prev).add(tmpId));
    const loadingToast = toast.loading(L.removingBg);
    try {
      const transparent = await removeBgFromDataUrl(current.src);
      const imgEl = await loadImage(transparent);
      const wm: Watermark = {
        id: tmpId, type: 'image', imgSrc: transparent, imgEl,
        xRel: 0.5, yRel: 0.5, scale: 0.4, rotation: 0, opacity: 0.85, mode: 'single', tileGapX: 0.5, tileGapY: 0.5,
      };
      setWatermarks(p => [...p, wm]);
      setSelectedWmId(wm.id);
      toast.success(L.bgRemoved, { id: loadingToast });
    } catch (e) {
      console.error(e); toast.error(L.bgRemoveFailed, { id: loadingToast });
    } finally {
      setBgRemovingIds(prev => { const n = new Set(prev); n.delete(tmpId); return n; });
    }
  };

  const updateWm = (id: string, patch: Partial<Watermark>) => {
    setWatermarks(prev => prev.map(w => w.id === id ? { ...w, ...patch } : w));
  };
  const removeWm = (id: string) => {
    setWatermarks(prev => prev.filter(w => w.id !== id));
    if (selectedWmId === id) setSelectedWmId(null);
  };
  const setPosForSelected = (p: Pos) => {
    if (!selectedWm) return;
    const pos = POS_MAP[p];
    updateWm(selectedWm.id, { xRel: pos.xRel, yRel: pos.yRel, mode: 'single' });
  };

  // === Render watermarks onto canvas ===
  const renderToCanvas = useCallback((canvas: HTMLCanvasElement, src: SourceImage, wms: Watermark[]) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = src.width;
    canvas.height = src.height;
    ctx.drawImage(src.el, 0, 0, src.width, src.height);

    const baseUnit = Math.min(src.width, src.height);

    const fontStringFor = (wm: Watermark, fontPx: number) => {
      const weight = wm.bold ? 'bold' : 'normal';
      const style = wm.italic ? 'italic' : 'normal';
      return `${style} ${weight} ${fontPx}px ${wm.fontFamily || 'Arial'}`;
    };

    for (const wm of wms) {
      ctx.save();
      ctx.globalAlpha = wm.opacity;

      const drawOne = (cx: number, cy: number) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((wm.rotation * Math.PI) / 180);
        if (wm.type === 'text') {
          const fontPx = Math.max(8, baseUnit * wm.scale);
          ctx.font = fontStringFor(wm, fontPx);
          ctx.fillStyle = wm.color || '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = 'rgba(0,0,0,0.3)';
          ctx.shadowBlur = fontPx * 0.05;
          const text = wm.text || '';
          ctx.fillText(text, 0, 0);
          if (wm.underline) {
            const m = ctx.measureText(text);
            const w = m.width;
            const yOff = fontPx * 0.55;
            ctx.shadowBlur = 0;
            ctx.fillRect(-w / 2, yOff, w, Math.max(1, fontPx * 0.06));
          }
        } else if (wm.imgEl) {
          const w = baseUnit * wm.scale;
          const h = w * (wm.imgEl.naturalHeight / wm.imgEl.naturalWidth);
          ctx.drawImage(wm.imgEl, -w / 2, -h / 2, w, h);
        }
        ctx.restore();
      };

      if (wm.mode === 'mosaic') {
        let tileW: number, tileH: number;
        if (wm.type === 'text') {
          const fontPx = Math.max(8, baseUnit * wm.scale);
          ctx.font = fontStringFor(wm, fontPx);
          const m = ctx.measureText(wm.text || '');
          tileW = m.width; tileH = fontPx * 1.2;
        } else if (wm.imgEl) {
          tileW = baseUnit * wm.scale;
          tileH = tileW * (wm.imgEl.naturalHeight / wm.imgEl.naturalWidth);
        } else { ctx.restore(); continue; }

        const stepX = tileW * (1 + wm.tileGapX);
        const stepY = tileH * (1 + wm.tileGapY);
        const diag = Math.sqrt(src.width ** 2 + src.height ** 2);
        for (let y = -diag; y < diag; y += stepY) {
          for (let x = -diag; x < diag; x += stepX) {
            drawOne(src.width / 2 + x, src.height / 2 + y);
          }
        }
      } else {
        drawOne(wm.xRel * src.width, wm.yRel * src.height);
      }
      ctx.restore();
    }
  }, []);

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !current) return;
    renderToCanvas(canvas, current, watermarks);
  }, [current, watermarks, renderToCanvas]);

  // Drag to move on preview (single mode only)
  const dragRef = useRef<{ wmId: string } | null>(null);
  const onPreviewPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!selectedWm || selectedWm.mode !== 'single') return;
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = { wmId: selectedWm.id };
  };
  const onPreviewPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current || !current) return;
    const canvas = previewCanvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const xRel = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const yRel = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    updateWm(dragRef.current.wmId, { xRel, yRel });
  };
  const onPreviewPointerUp = () => { dragRef.current = null; };

  const pickOutput = (src: SourceImage): { mime: string; ext: string } => {
    if (outputFormat === 'png') return { mime: 'image/png', ext: 'png' };
    if (outputFormat === 'jpg') return { mime: 'image/jpeg', ext: 'jpg' };
    // original: preserve format. PNG/WebP/GIF -> PNG (alpha-safe). JPEG -> JPEG.
    if (/jpeg|jpg/.test(src.type)) return { mime: 'image/jpeg', ext: 'jpg' };
    return { mime: 'image/png', ext: 'png' };
  };

  const exportAll = async () => {
    if (!images.length) { toast.error(L.noImages); return; }
    if (!watermarks.length) { toast.error(L.needWatermark); return; }
    setProcessing(true);
    try {
      const activeWatermarks = watermarks;

      if (images.length === 1) {
        const src = images[0];
        const { mime, ext } = pickOutput(src);
        const c = document.createElement('canvas');
        renderToCanvas(c, src, activeWatermarks);
        const blob: Blob = await new Promise(res =>
          c.toBlob(b => res(b!), mime, mime === 'image/jpeg' ? 0.95 : undefined)!
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${src.name.replace(/\.[^.]+$/, '')}_watermarked.${ext}`;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        const zip = new JSZip();
        for (const src of images) {
          const { mime, ext } = pickOutput(src);
          const c = document.createElement('canvas');
          renderToCanvas(c, src, activeWatermarks);
          const blob: Blob = await new Promise(res =>
            c.toBlob(b => res(b!), mime, mime === 'image/jpeg' ? 0.95 : undefined)!
          );
          zip.file(`${src.name.replace(/\.[^.]+$/, '')}_watermarked.${ext}`, blob);
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url; a.download = 'watermarked_images.zip';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      toast.success('Done');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export');
    } finally {
      setProcessing(false);
    }
  };

  const [dragOver, setDragOver] = useState(false);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="font-display text-3xl md:text-5xl font-bold">{L.title}</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">{L.subtitle}</p>
      </div>

      {!images.length ? (
        <Card
          className={`mx-auto max-w-3xl p-10 md:p-16 text-center border-2 border-dashed transition ${
            dragOver ? 'border-primary bg-primary/5' : 'border-border'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <Button size="lg" className="text-lg px-8 py-6" onClick={() => fileInputRef.current?.click()}>
            {L.selectImages}
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">{L.orDrop}</p>
          <input
            ref={fileInputRef} type="file" multiple accept="image/*" className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">{current?.name}</div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}>‹</Button>
                <span className="text-sm">{L.pageOf(currentIdx + 1, images.length)}</span>
                <Button variant="outline" size="sm" disabled={currentIdx >= images.length - 1}
                  onClick={() => setCurrentIdx(i => Math.min(images.length - 1, i + 1))}>›</Button>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Plus className="w-4 h-4" />
                </Button>
                <input
                  ref={fileInputRef} type="file" multiple accept="image/*" className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </div>
            </div>
            <div ref={previewWrapRef} className="bg-muted rounded-lg overflow-hidden flex items-center justify-center p-2">
              <canvas
                ref={previewCanvasRef}
                className="max-w-full max-h-[70vh] object-contain touch-none cursor-move"
                onPointerDown={onPreviewPointerDown}
                onPointerMove={onPreviewPointerMove}
                onPointerUp={onPreviewPointerUp}
                onPointerCancel={onPreviewPointerUp}
              />
            </div>
            {selectedWm?.mode === 'single' && (
              <p className="text-xs text-muted-foreground text-center">{L.dragHint}</p>
            )}
          </div>

          {/* Right Panel */}
          <Card className="p-4 space-y-4 h-fit lg:sticky lg:top-4">
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => imageWmInputRef.current?.click()}>
                <ImageIcon className="w-4 h-4 mr-2" /> {L.addImage}
              </Button>
              <Button variant="outline" className="flex-1" onClick={addTextWatermark}>
                <Type className="w-4 h-4 mr-2" /> {L.addText}
              </Button>
              <input
                ref={imageWmInputRef} type="file" multiple accept="image/*" className="hidden"
                onChange={(e) => handleImageWmFiles(e.target.files)}
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
              <input type="checkbox" checked={useOrigAsWm}
                onChange={(e) => setUseOrigAsWm(e.target.checked)} className="rounded" />
              {L.removeBg}
            </label>
            <Button variant="secondary" className="w-full" onClick={useCurrentAsWatermark}
              disabled={!current || bgRemovingIds.size > 0}>
              {bgRemovingIds.size > 0
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{L.removingBg}</>
                : <><Eraser className="w-4 h-4 mr-2" />{L.useOriginal}</>}
            </Button>

            <div className="space-y-2 max-h-[28vh] overflow-y-auto">
              <Label className="text-xs uppercase tracking-wide">{L.watermarks}</Label>
              {!watermarks.length && <p className="text-sm text-muted-foreground">—</p>}
              {watermarks.map(wm => (
                <div key={wm.id}
                  onClick={() => setSelectedWmId(wm.id)}
                  className={`p-2 rounded border cursor-pointer flex items-center justify-between ${
                    selectedWmId === wm.id ? 'border-primary bg-primary/5' : 'border-border'
                  }`}>
                  <div className="flex items-center gap-2 min-w-0">
                    {wm.type === 'text' ? <Type className="w-4 h-4 shrink-0" /> : <ImageIcon className="w-4 h-4 shrink-0" />}
                    <span className="text-sm truncate">
                      {wm.type === 'text' ? (wm.text || L.textWM) : L.imageWM}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); removeWm(wm.id); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            {selectedWm && (
              <div className="space-y-3 border-t pt-3">
                {selectedWm.type === 'text' && (
                  <>
                    <div>
                      <Label className="text-xs">{L.textContent}</Label>
                      <Input value={selectedWm.text || ''}
                        onChange={(e) => updateWm(selectedWm.id, { text: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">{L.font}</Label>
                        <Select value={selectedWm.fontFamily}
                          onValueChange={(v) => updateWm(selectedWm.id, { fontFamily: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {FONTS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">{L.color}</Label>
                        <Input type="color" value={selectedWm.color}
                          onChange={(e) => updateWm(selectedWm.id, { color: e.target.value })}
                          className="h-10 p-1" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">{L.style}</Label>
                      <div className="flex gap-1 mt-1">
                        <Button type="button" size="sm" variant={selectedWm.bold ? 'default' : 'outline'}
                          onClick={() => updateWm(selectedWm.id, { bold: !selectedWm.bold })}>
                          <Bold className="w-4 h-4" />
                        </Button>
                        <Button type="button" size="sm" variant={selectedWm.italic ? 'default' : 'outline'}
                          onClick={() => updateWm(selectedWm.id, { italic: !selectedWm.italic })}>
                          <Italic className="w-4 h-4" />
                        </Button>
                        <Button type="button" size="sm" variant={selectedWm.underline ? 'default' : 'outline'}
                          onClick={() => updateWm(selectedWm.id, { underline: !selectedWm.underline })}>
                          <Underline className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {selectedWm.type === 'image' && (
                  <Button variant="outline" size="sm" className="w-full"
                    onClick={() => handleRemoveBgFor(selectedWm.id)}
                    disabled={bgRemovingIds.has(selectedWm.id)}>
                    {bgRemovingIds.has(selectedWm.id)
                      ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{L.removingBg}</>
                      : <><Eraser className="w-4 h-4 mr-2" />{L.removeBg}</>}
                  </Button>
                )}

                <div>
                  <Label className="text-xs">{L.mode}</Label>
                  <Select value={selectedWm.mode}
                    onValueChange={(v: Mode) => updateWm(selectedWm.id, { mode: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">{L.single}</SelectItem>
                      <SelectItem value="mosaic">{L.mosaic}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedWm.mode === 'single' && (
                  <div>
                    <Label className="text-xs">{L.position}</Label>
                    <div className="grid grid-cols-3 gap-1 mt-1">
                      {(['tl','tc','tr','cl','cc','cr','bl','bc','br'] as Pos[]).map(p => {
                        const pos = POS_MAP[p];
                        const active = Math.abs(selectedWm.xRel - pos.xRel) < 0.02 && Math.abs(selectedWm.yRel - pos.yRel) < 0.02;
                        return (
                          <button key={p} type="button" onClick={() => setPosForSelected(p)}
                            className={`h-8 rounded border transition ${
                              active ? 'bg-primary border-primary' : 'bg-background border-border hover:bg-muted'
                            }`} aria-label={p}>
                            <span className={`block w-1.5 h-1.5 rounded-full mx-auto ${active ? 'bg-primary-foreground' : 'bg-muted-foreground'}`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-xs">{L.size} · {Math.round(selectedWm.scale * 100)}%</Label>
                  <Slider min={2} max={100} step={1} value={[selectedWm.scale * 100]}
                    onValueChange={([v]) => updateWm(selectedWm.id, { scale: v / 100 })} />
                </div>
                <div>
                  <Label className="text-xs">{L.opacity} · {Math.round(selectedWm.opacity * 100)}%</Label>
                  <Slider min={5} max={100} step={1} value={[selectedWm.opacity * 100]}
                    onValueChange={([v]) => updateWm(selectedWm.id, { opacity: v / 100 })} />
                </div>
                <div>
                  <Label className="text-xs">{L.rotation} · {selectedWm.rotation}°</Label>
                  <Slider min={-180} max={180} step={1} value={[selectedWm.rotation]}
                    onValueChange={([v]) => updateWm(selectedWm.id, { rotation: v })} />
                </div>
                {selectedWm.mode === 'mosaic' && (
                  <>
                    <div>
                      <Label className="text-xs">{L.gapX} · {Math.round(selectedWm.tileGapX * 100)}%</Label>
                      <Slider min={0} max={300} step={5} value={[selectedWm.tileGapX * 100]}
                        onValueChange={([v]) => updateWm(selectedWm.id, { tileGapX: v / 100 })} />
                    </div>
                    <div>
                      <Label className="text-xs">{L.gapY} · {Math.round(selectedWm.tileGapY * 100)}%</Label>
                      <Slider min={0} max={300} step={5} value={[selectedWm.tileGapY * 100]}
                        onValueChange={([v]) => updateWm(selectedWm.id, { tileGapY: v / 100 })} />
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="border-t pt-3">
              <Label className="text-xs">{L.output}</Label>
              <Select value={outputFormat} onValueChange={(v: OutputFormat) => setOutputFormat(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="original">{L.outOriginal}</SelectItem>
                  <SelectItem value="png">{L.outPng}</SelectItem>
                  <SelectItem value="jpg">{L.outJpg}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full" size="lg" onClick={() => exportAll()} disabled={processing}>
              {processing
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{L.processing}</>
                : <><Download className="w-4 h-4 mr-2" />{L.apply}</>}
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
