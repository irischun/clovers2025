import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Upload, Type, Image as ImageIcon, Trash2, Download, Plus, Loader2, Eraser } from 'lucide-react';
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

interface Watermark {
  id: string;
  type: WMType;
  // text
  text?: string;
  fontFamily?: string;
  color?: string;
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
  tileGap: number;   // for mosaic, in scale units (1 = watermark size)
}

interface SourceImage {
  id: string;
  name: string;
  src: string;
  el: HTMLImageElement;
  width: number;
  height: number;
}

const FONTS = ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Courier New', 'Verdana', 'Playfair Display', 'DM Sans'];

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
  const { t, language } = useLanguage();

  const L = useMemo(() => {
    const isCN = language === 'zh-CN';
    const isTW = language === 'zh-TW';
    if (isTW) return {
      title: '浮水印生成器',
      subtitle: '為 JPG、PNG 或 GIF 圖片加上浮水印。一次為您的圖片蓋上圖片或文字浮水印。',
      selectImages: '選擇圖片',
      orDrop: '或將圖片拖曳到此處',
      watermarks: '浮水印',
      addImage: '加入圖片',
      addText: '加入文字',
      textWM: '文字浮水印',
      imageWM: '圖片浮水印',
      textContent: '文字內容',
      font: '字型',
      color: '顏色',
      mode: '位置模式',
      single: '單個位置',
      mosaic: '馬賽克(平鋪)',
      opacity: '透明度',
      rotation: '旋轉',
      size: '大小',
      gap: '間距',
      remove: '移除',
      apply: '套用浮水印',
      processing: '處理中...',
      noImages: '請先上傳圖片',
      noWatermarks: '請先加入至少一個浮水印',
      preview: '預覽',
      pageOf: (a: number, b: number) => `${a} / ${b}`,
      dragHint: '在預覽圖上拖曳可移動單個浮水印',
      yourText: '您的文字',
      useOriginal: '使用原圖作為浮水印(去背)',
      removeBg: '移除背景並透明化',
      removingBg: '正在移除背景...',
      bgRemoved: '背景已移除',
      bgRemoveFailed: '背景移除失敗',
    };
    if (isCN) return {
      title: '水印生成器',
      subtitle: '为 JPG、PNG 或 GIF 图片添加水印。一次为您的图片盖上图片或文字水印。',
      selectImages: '选择图片',
      orDrop: '或将图片拖到此处',
      watermarks: '水印',
      addImage: '添加图片',
      addText: '添加文字',
      textWM: '文字水印',
      imageWM: '图片水印',
      textContent: '文字内容',
      font: '字体',
      color: '颜色',
      mode: '位置模式',
      single: '单个位置',
      mosaic: '马赛克(平铺)',
      opacity: '透明度',
      rotation: '旋转',
      size: '大小',
      gap: '间距',
      remove: '移除',
      apply: '应用水印',
      processing: '处理中...',
      noImages: '请先上传图片',
      noWatermarks: '请先添加至少一个水印',
      preview: '预览',
      pageOf: (a: number, b: number) => `${a} / ${b}`,
      dragHint: '在预览图上拖动可移动单个水印',
      yourText: '您的文字',
      useOriginal: '使用原图作为水印(去背)',
      removeBg: '移除背景并透明化',
      removingBg: '正在移除背景...',
      bgRemoved: '背景已移除',
      bgRemoveFailed: '背景移除失败',
    };
    return {
      title: 'Watermark Generator',
      subtitle: 'Watermark JPG, PNG or GIF images. Stamp images or text over your images at once.',
      selectImages: 'Select images',
      orDrop: 'or drop images here',
      watermarks: 'Watermarks',
      addImage: 'Add image',
      addText: 'Add text',
      textWM: 'Text watermark',
      imageWM: 'Image watermark',
      textContent: 'Text content',
      font: 'Font',
      color: 'Color',
      mode: 'Position mode',
      single: 'Single position',
      mosaic: 'Mosaic (tiled)',
      opacity: 'Opacity',
      rotation: 'Rotation',
      size: 'Size',
      gap: 'Gap',
      remove: 'Remove',
      apply: 'Watermark IMAGES',
      processing: 'Processing...',
      noImages: 'Please upload at least one image',
      noWatermarks: 'Please add at least one watermark',
      preview: 'Preview',
      pageOf: (a: number, b: number) => `${a} / ${b}`,
      dragHint: 'Drag on the preview to move a single watermark',
      yourText: 'Your Text',
      useOriginal: 'Use original image as watermark (remove background)',
      removeBg: 'Remove background & make transparent',
      removingBg: 'Removing background...',
      bgRemoved: 'Background removed',
      bgRemoveFailed: 'Background removal failed',
    };
  }, [language]);

  const [images, setImages] = useState<SourceImage[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [watermarks, setWatermarks] = useState<Watermark[]>([]);
  const [selectedWmId, setSelectedWmId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [bgRemovingIds, setBgRemovingIds] = useState<Set<string>>(new Set());
  const [useOrigAsWm, setUseOrigAsWm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageWmInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewWrapRef = useRef<HTMLDivElement>(null);

  const current = images[currentIdx];
  const selectedWm = watermarks.find(w => w.id === selectedWmId) || null;

  // Upload source images
  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    const accepted = Array.from(files).filter(f => /image\/(jpeg|jpg|png|gif|webp)/.test(f.type));
    if (!accepted.length) {
      toast.error('Only JPG/PNG/GIF/WEBP supported');
      return;
    }
    const loaded: SourceImage[] = [];
    for (const f of accepted) {
      try {
        const src = await fileToDataURL(f);
        const el = await loadImage(src);
        loaded.push({ id: uid(), name: f.name, src, el, width: el.naturalWidth, height: el.naturalHeight });
      } catch {/* skip */}
    }
    setImages(prev => [...prev, ...loaded]);
    if (!images.length && loaded.length) setCurrentIdx(0);
  };

  // Add watermarks
  const addTextWatermark = () => {
    const wm: Watermark = {
      id: uid(), type: 'text', text: L.yourText, fontFamily: 'Arial', color: '#ffffff',
      xRel: 0.5, yRel: 0.5, scale: 0.15, rotation: 0, opacity: 0.6, mode: 'single', tileGap: 0.5,
    };
    setWatermarks(p => [...p, wm]);
    setSelectedWmId(wm.id);
  };

  const handleImageWmFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    for (const f of Array.from(files)) {
      if (!/image\//.test(f.type)) continue;
      const src = await fileToDataURL(f);
      const imgEl = await loadImage(src);
      const wm: Watermark = {
        id: uid(), type: 'image', imgSrc: src, imgEl,
        xRel: 0.5, yRel: 0.5, scale: 0.25, rotation: 0, opacity: 0.6, mode: 'single', tileGap: 0.5,
      };
      setWatermarks(p => [...p, wm]);
      setSelectedWmId(wm.id);
    }
  };

  const updateWm = (id: string, patch: Partial<Watermark>) => {
    setWatermarks(prev => prev.map(w => w.id === id ? { ...w, ...patch } : w));
  };
  const removeWm = (id: string) => {
    setWatermarks(prev => prev.filter(w => w.id !== id));
    if (selectedWmId === id) setSelectedWmId(null);
  };

  // === Render watermarks onto canvas ===
  const renderToCanvas = useCallback((canvas: HTMLCanvasElement, src: SourceImage, wms: Watermark[]) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = src.width;
    canvas.height = src.height;
    ctx.drawImage(src.el, 0, 0, src.width, src.height);

    const baseUnit = Math.min(src.width, src.height);

    for (const wm of wms) {
      ctx.save();
      ctx.globalAlpha = wm.opacity;

      const drawOne = (cx: number, cy: number) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((wm.rotation * Math.PI) / 180);
        if (wm.type === 'text') {
          const fontPx = Math.max(8, baseUnit * wm.scale);
          ctx.font = `bold ${fontPx}px ${wm.fontFamily || 'Arial'}`;
          ctx.fillStyle = wm.color || '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = 'rgba(0,0,0,0.3)';
          ctx.shadowBlur = fontPx * 0.05;
          ctx.fillText(wm.text || '', 0, 0);
        } else if (wm.imgEl) {
          const w = baseUnit * wm.scale;
          const h = w * (wm.imgEl.naturalHeight / wm.imgEl.naturalWidth);
          ctx.drawImage(wm.imgEl, -w / 2, -h / 2, w, h);
        }
        ctx.restore();
      };

      if (wm.mode === 'mosaic') {
        // compute tile size
        let tileW: number;
        let tileH: number;
        if (wm.type === 'text') {
          const fontPx = Math.max(8, baseUnit * wm.scale);
          ctx.font = `bold ${fontPx}px ${wm.fontFamily || 'Arial'}`;
          const m = ctx.measureText(wm.text || '');
          tileW = m.width;
          tileH = fontPx * 1.2;
        } else if (wm.imgEl) {
          tileW = baseUnit * wm.scale;
          tileH = tileW * (wm.imgEl.naturalHeight / wm.imgEl.naturalWidth);
        } else { ctx.restore(); continue; }

        const gap = (1 + wm.tileGap);
        const stepX = tileW * gap;
        const stepY = tileH * gap;
        // expand bounds to cover rotation
        const diag = Math.sqrt(src.width ** 2 + src.height ** 2);
        for (let y = -diag; y < diag; y += stepY) {
          for (let x = -diag; x < diag; x += stepX) {
            // rotate-aware: draw in a rotated coord around image center
            const cx = src.width / 2 + x;
            const cy = src.height / 2 + y;
            drawOne(cx, cy);
          }
        }
      } else {
        drawOne(wm.xRel * src.width, wm.yRel * src.height);
      }
      ctx.restore();
    }
  }, []);

  // Live preview
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

  // Export all images
  const exportAll = async () => {
    if (!images.length) { toast.error(L.noImages); return; }
    if (!watermarks.length) { toast.error(L.noWatermarks); return; }
    setProcessing(true);
    try {
      for (const src of images) {
        const c = document.createElement('canvas');
        renderToCanvas(c, src, watermarks);
        const isPng = /\.png$/i.test(src.name);
        const blob: Blob = await new Promise(res =>
          c.toBlob(b => res(b!), isPng ? 'image/png' : 'image/jpeg', 0.95)!
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const base = src.name.replace(/\.[^.]+$/, '');
        a.download = `${base}_watermarked.${isPng ? 'png' : 'jpg'}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
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

  // Drag-drop on dropzone
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

            <div className="space-y-2 max-h-[40vh] overflow-y-auto">
              <Label className="text-xs uppercase tracking-wide">{L.watermarks}</Label>
              {!watermarks.length && (
                <p className="text-sm text-muted-foreground">—</p>
              )}
              {watermarks.map(wm => (
                <div key={wm.id}
                  onClick={() => setSelectedWmId(wm.id)}
                  className={`p-2 rounded border cursor-pointer flex items-center justify-between ${
                    selectedWmId === wm.id ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {wm.type === 'text'
                      ? <Type className="w-4 h-4 shrink-0" />
                      : <ImageIcon className="w-4 h-4 shrink-0" />}
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
                  </>
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
                  <div>
                    <Label className="text-xs">{L.gap} · {Math.round(selectedWm.tileGap * 100)}%</Label>
                    <Slider min={0} max={300} step={5} value={[selectedWm.tileGap * 100]}
                      onValueChange={([v]) => updateWm(selectedWm.id, { tileGap: v / 100 })} />
                  </div>
                )}
              </div>
            )}

            <Button className="w-full" size="lg" onClick={exportAll} disabled={processing}>
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
