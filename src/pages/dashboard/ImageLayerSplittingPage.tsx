import { useState, useRef, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { usePointConsumption } from '@/hooks/usePointConsumption';
import {
  Upload, Download, Image as ImageIcon, Loader2, Sparkles, Layers, Info,
} from 'lucide-react';

const POINTS_COST = 1;
const MAX_UPLOAD_MB = 20;

interface LayerResult {
  key: string;
  name: string;
  url?: string;
  error?: string;
}

const L = {
  en: {
    pageTitle: 'Image Layer Splitter',
    pageDesc: 'Upload one photo — AI splits it into transparent layers (person, clothing, background, shadow). Perfect for Canva, Photoshop, Figma.',
    badge: 'AI Image Layer Splitter',
    cost: '1 point/run',
    uploadTitle: 'Upload Image',
    uploadDesc: 'Supports JPG / PNG. Clear photos work best.',
    dropHere: 'Drop image here',
    orClick: 'or click to select a file',
    chooseImage: 'Choose Image',
    replace: 'Replace Image',
    settingsTitle: 'Generation Settings',
    layerCount: 'Number of Layers',
    layer2: '2 Layers (Subject + Background)',
    layer3: '3 Layers (Person + Clothing + Background)',
    layer4: '4 Layers (Person + Clothing + Background + Shadow) — Default',
    imageFormat: 'Image Format',
    pngHigh: 'PNG (highest quality)',
    fastMode: 'Fast Mode',
    fastModeHint: 'Use a smaller/faster model. Slightly lower quality.',
    safetyCheck: 'Safety Check',
    safetyHint: 'Enforce safety guidelines on outputs.',
    autoVariation: 'Auto-Variation',
    autoVariationHint: 'Add subtle randomness on each run.',
    fixedSeed: 'Fixed Result',
    fixedSeedHint: 'Reproducible result for the same image.',
    generate: 'Generate Layers (1 point)',
    generating: 'Generating layers...',
    resultsTitle: 'Layer Results',
    resultsDesc: 'Upload an image and click Generate — results appear here.',
    waiting: 'Waiting for results…',
    waitingHint: 'After uploading and configuring, click "Generate Layers".',
    downloadAll: 'Download All',
    download: 'Download',
    tipsTitle: 'Tips',
    tip1: 'Best results: clear photos that are not too cluttered (heavy overlap may reduce layer accuracy).',
    tip2: 'Points: only 1 point per run — simple and transparent.',
    tip3: 'All outputs include transparency — compatible with Canva, Photoshop, Figma.',
    tip4: 'Great for social posts, IG Stories, Reels, memes, product images, background/outfit swaps.',
    errInsufficient: 'Insufficient points. Please top up to continue.',
    errNoImage: 'Please upload an image first.',
    errTooLarge: `File too large. Max ${MAX_UPLOAD_MB} MB.`,
    errNotImage: 'Selected file is not an image.',
    successTitle: 'Layers generated',
    successDesc: (n: number) => `${n} layers ready to download.`,
    partialTitle: 'Partial success',
    partialDesc: (ok: number, total: number) => `${ok}/${total} layers generated. Failed layers were not charged extra.`,
    failedTitle: 'Generation failed',
    layerSubject: 'Subject (Foreground)',
    layerBackground: 'Background',
    layerPerson: 'Person / Skin',
    layerClothing: 'Clothing & Accessories',
    layerShadow: 'Shadow',
  },
  'zh-TW': {
    pageTitle: '圖片自動分層神器',
    pageDesc: '上傳一張相片，AI 自動幫你拆成多層帶透明背景的圖層！每一層獨立（人物、衣服、背景、陰影），完美支援 Canva、Photoshop、Figma。',
    badge: 'AI 圖片分層神器',
    cost: '1 點/次',
    uploadTitle: '上傳圖片',
    uploadDesc: '支援 JPG/PNG，建議使用清晰的相片效果最佳',
    dropHere: '拖放圖片到這裡',
    orClick: '或點擊選擇檔案',
    chooseImage: '選擇圖片',
    replace: '更換圖片',
    settingsTitle: '生成設定',
    layerCount: '分層數量',
    layer2: '2 層（主體 + 背景）',
    layer3: '3 層（人物 + 衣服 + 背景）',
    layer4: '4 層（人物 + 衣服 + 背景 + 陰影）— 預設',
    imageFormat: '圖片格式',
    pngHigh: 'PNG（最高品質）',
    fastMode: '高速模式',
    fastModeHint: '使用較快的模型，品質略低。',
    safetyCheck: '安全檢查',
    safetyHint: '對輸出強制執行安全準則。',
    autoVariation: '自動生成變奏版',
    autoVariationHint: '每次生成加入少量隨機變化。',
    fixedSeed: '固定結果',
    fixedSeedHint: '對相同圖片產生可重現的結果。',
    generate: '生成分層（1 點數）',
    generating: '正在生成分層…',
    resultsTitle: '分層結果',
    resultsDesc: '上傳圖片並點擊生成後，結果將顯示在這裡',
    waiting: '等待生成結果…',
    waitingHint: '上傳圖片並選擇設定後，點擊「生成分層」按鈕',
    downloadAll: '全部下載',
    download: '下載',
    tipsTitle: '小提示',
    tip1: '效果最好係唔太複雜、清晰嘅相（太多重疊物件可能分層唔夠完美）',
    tip2: '點數扣除：每次生成只扣 1 點數，簡單透明',
    tip3: '輸出全部支援透明通道，完美兼容 Canva、Photoshop、Figma',
    tip4: '超適合自媒體做 IG 故事、Reels、meme、商品圖、換背景、換裝等！',
    errInsufficient: '點數不足，請先充值。',
    errNoImage: '請先上傳一張圖片。',
    errTooLarge: `檔案太大，上限 ${MAX_UPLOAD_MB} MB。`,
    errNotImage: '所選檔案不是圖片。',
    successTitle: '分層完成',
    successDesc: (n: number) => `${n} 個圖層已準備好下載。`,
    partialTitle: '部分成功',
    partialDesc: (ok: number, total: number) => `已生成 ${ok}/${total} 個圖層，失敗的不會額外扣點。`,
    failedTitle: '生成失敗',
    layerSubject: '主體（前景）',
    layerBackground: '背景',
    layerPerson: '人物 / 皮膚',
    layerClothing: '衣服與配件',
    layerShadow: '陰影',
  },
  'zh-CN': {
    pageTitle: '图片自动分层神器',
    pageDesc: '上传一张相片，AI 自动帮你拆成多层带透明背景的图层！每一层独立（人物、衣服、背景、阴影），完美支持 Canva、Photoshop、Figma。',
    badge: 'AI 图片分层神器',
    cost: '1 点/次',
    uploadTitle: '上传图片',
    uploadDesc: '支持 JPG/PNG，建议使用清晰的相片效果最佳',
    dropHere: '拖放图片到这里',
    orClick: '或点击选择文件',
    chooseImage: '选择图片',
    replace: '更换图片',
    settingsTitle: '生成设置',
    layerCount: '分层数量',
    layer2: '2 层（主体 + 背景）',
    layer3: '3 层（人物 + 衣服 + 背景）',
    layer4: '4 层（人物 + 衣服 + 背景 + 阴影）— 默认',
    imageFormat: '图片格式',
    pngHigh: 'PNG（最高品质）',
    fastMode: '高速模式',
    fastModeHint: '使用较快的模型，品质略低。',
    safetyCheck: '安全检查',
    safetyHint: '对输出强制执行安全准则。',
    autoVariation: '自动生成变奏版',
    autoVariationHint: '每次生成加入少量随机变化。',
    fixedSeed: '固定结果',
    fixedSeedHint: '对相同图片产生可重现的结果。',
    generate: '生成分层（1 点数）',
    generating: '正在生成分层…',
    resultsTitle: '分层结果',
    resultsDesc: '上传图片并点击生成后，结果将显示在这里',
    waiting: '等待生成结果…',
    waitingHint: '上传图片并选择设置后，点击"生成分层"按钮',
    downloadAll: '全部下载',
    download: '下载',
    tipsTitle: '小提示',
    tip1: '效果最好的是不太复杂、清晰的相片（太多重叠物件可能分层不够完美）',
    tip2: '点数扣除：每次生成只扣 1 点数，简单透明',
    tip3: '输出全部支持透明通道，完美兼容 Canva、Photoshop、Figma',
    tip4: '超适合自媒体做 IG 故事、Reels、meme、商品图、换背景、换装等！',
    errInsufficient: '点数不足，请先充值。',
    errNoImage: '请先上传一张图片。',
    errTooLarge: `文件太大，上限 ${MAX_UPLOAD_MB} MB。`,
    errNotImage: '所选文件不是图片。',
    successTitle: '分层完成',
    successDesc: (n: number) => `${n} 个图层已准备好下载。`,
    partialTitle: '部分成功',
    partialDesc: (ok: number, total: number) => `已生成 ${ok}/${total} 个图层，失败的不会额外扣点。`,
    failedTitle: '生成失败',
    layerSubject: '主体（前景）',
    layerBackground: '背景',
    layerPerson: '人物 / 皮肤',
    layerClothing: '衣服与配件',
    layerShadow: '阴影',
  },
} as const;

const LAYER_NAME_MAP: Record<string, keyof typeof L['en']> = {
  subject: 'layerSubject',
  background: 'layerBackground',
  person: 'layerPerson',
  clothing: 'layerClothing',
  shadow: 'layerShadow',
};

const ImageLayerSplittingPage = () => {
  const { language } = useLanguage();
  const t = L[language as keyof typeof L] ?? L.en;
  const { toast } = useToast();
  const { consumePoints, checkBalance, refundPoints } = usePointConsumption();

  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const [numLayers, setNumLayers] = useState<2 | 3 | 4>(4);
  const [format] = useState<'png'>('png');
  const [fastMode, setFastMode] = useState(false);
  const [safetyCheck, setSafetyCheck] = useState(true);
  const [autoVariation, setAutoVariation] = useState(false);
  const [fixedSeed, setFixedSeed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [layers, setLayers] = useState<LayerResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        toast({ title: t.errNotImage, variant: 'destructive' });
        return;
      }
      if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
        toast({ title: t.errTooLarge, variant: 'destructive' });
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        setImageDataUrl(url);
        setImagePreview(url);
        setImageName(file.name);
        setLayers([]);
      };
      reader.readAsDataURL(file);
    },
    [t, toast],
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const f = e.dataTransfer.files?.[0];
      if (f) handleFile(f);
    },
    [handleFile],
  );

  const handleGenerate = useCallback(async () => {
    if (!imageDataUrl) {
      toast({ title: t.errNoImage, variant: 'destructive' });
      return;
    }
    const ok = await checkBalance(POINTS_COST);
    if (!ok) return;

    setProcessing(true);
    setLayers([]);

    // Deduct first; refund failed layers proportionally if all fail.
    let deducted = false;
    try {
      await consumePoints({ amount: POINTS_COST, description: `Image layer split (${numLayers} layers)` });
      deducted = true;
    } catch (e: any) {
      if (e?.message === 'INSUFFICIENT_POINTS') {
        toast({ title: t.errInsufficient, variant: 'destructive' });
        setProcessing(false);
        return;
      }
    }

    try {
      const { data, error } = await supabase.functions.invoke('image-layer-split', {
        body: {
          image: imageDataUrl,
          numLayers,
          format,
          fastMode,
          safetyCheck,
          autoVariation,
          fixedSeed,
        },
      });

      if (error) throw error;
      if (data?.error && !data?.layers) throw new Error(data.error);

      const out: LayerResult[] = (data.layers || []).map((l: any) => ({
        key: l.key,
        name: l.name,
        url: l.url,
        error: l.error,
      }));
      setLayers(out);

      const successCount = out.filter((l) => l.url).length;
      const total = out.length || numLayers;
      if (successCount === total) {
        toast({ title: t.successTitle, description: t.successDesc(successCount) });
      } else if (successCount > 0) {
        toast({ title: t.partialTitle, description: t.partialDesc(successCount, total) });
      } else {
        throw new Error('No layers generated');
      }
    } catch (err: any) {
      console.error('Layer split error:', err);
      // Refund if user got nothing
      if (deducted) {
        await refundPoints({
          amount: POINTS_COST,
          description: `Refund — image layer split failed (${numLayers} layers)`,
        });
      }
      toast({
        title: t.failedTitle,
        description: err?.message ?? 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  }, [
    imageDataUrl, numLayers, format, fastMode, safetyCheck, autoVariation, fixedSeed,
    checkBalance, consumePoints, refundPoints, t, toast,
  ]);

  const downloadOne = useCallback(async (url: string, name: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement('a');
      const obj = URL.createObjectURL(blob);
      a.href = obj;
      a.download = `${imageName.replace(/\.[^.]+$/, '') || 'image'}-${name}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(obj), 1000);
    } catch (e) {
      console.error(e);
    }
  }, [imageName]);

  const downloadAll = useCallback(async () => {
    for (const l of layers) {
      if (l.url) {
        await downloadOne(l.url, l.key);
        await new Promise((r) => setTimeout(r, 250));
      }
    }
  }, [layers, downloadOne]);

  const layerLabel = (key: string, fallback: string) => {
    const k = LAYER_NAME_MAP[key];
    return k ? (t[k] as string) : fallback;
  };

  const hasResults = useMemo(() => layers.some((l) => l.url), [layers]);

  return (
    <div className="space-y-6">
      <Helmet>
        <title>{t.pageTitle} | Clovers</title>
        <meta name="description" content={t.pageDesc} />
      </Helmet>

      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <Layers className="w-4 h-4" />
          {t.badge}
          <span className="ml-2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs">{t.cost}</span>
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold">{t.pageTitle}</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">{t.pageDesc}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT — Upload + Settings */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" /> {t.uploadTitle}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{t.uploadDesc}</p>
            </CardHeader>
            <CardContent>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors min-h-[280px] flex flex-col items-center justify-center gap-3"
              >
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt={imageName} className="max-h-64 max-w-full object-contain rounded" />
                    <p className="text-xs text-muted-foreground truncate max-w-full">{imageName}</p>
                    <Button variant="outline" size="sm" type="button">
                      {t.replace}
                    </Button>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-12 h-12 text-muted-foreground" />
                    <p className="font-medium">{t.dropHere}</p>
                    <p className="text-xs text-muted-foreground">{t.orClick}</p>
                    <Button type="button" variant="secondary">{t.chooseImage}</Button>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                    e.target.value = '';
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" /> {t.settingsTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>{t.layerCount}</Label>
                <Select value={String(numLayers)} onValueChange={(v) => setNumLayers(Number(v) as 2 | 3 | 4)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">{t.layer2}</SelectItem>
                    <SelectItem value="3">{t.layer3}</SelectItem>
                    <SelectItem value="4">{t.layer4}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t.imageFormat}</Label>
                <Select value={format} onValueChange={() => { /* PNG only for transparency */ }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="png">{t.pngHigh}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ToggleRow
                label={t.fastMode}
                hint={t.fastModeHint}
                checked={fastMode}
                onChange={setFastMode}
              />
              <ToggleRow
                label={t.safetyCheck}
                hint={t.safetyHint}
                checked={safetyCheck}
                onChange={setSafetyCheck}
              />
              <ToggleRow
                label={t.autoVariation}
                hint={t.autoVariationHint}
                checked={autoVariation}
                onChange={setAutoVariation}
              />
              <ToggleRow
                label={t.fixedSeed}
                hint={t.fixedSeedHint}
                checked={fixedSeed}
                onChange={setFixedSeed}
              />

              <Button
                className="w-full"
                size="lg"
                onClick={handleGenerate}
                disabled={processing || !imageDataUrl}
              >
                {processing ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t.generating}</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" />{t.generate}</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT — Results + Tips */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2"><Layers className="w-5 h-5" /> {t.resultsTitle}</span>
                {hasResults && (
                  <Button size="sm" variant="outline" onClick={downloadAll}>
                    <Download className="w-4 h-4 mr-1" />{t.downloadAll}
                  </Button>
                )}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{t.resultsDesc}</p>
            </CardHeader>
            <CardContent>
              {processing ? (
                <div className="min-h-[300px] flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <Loader2 className="w-10 h-10 animate-spin" />
                  <p>{t.generating}</p>
                </div>
              ) : layers.length === 0 ? (
                <div className="min-h-[300px] flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Layers className="w-10 h-10" />
                  <p className="font-medium">{t.waiting}</p>
                  <p className="text-xs">{t.waitingHint}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {layers.map((l) => (
                    <div key={l.key} className="border border-border rounded-lg overflow-hidden bg-secondary/30">
                      <div
                        className="h-40 flex items-center justify-center bg-[conic-gradient(at_top_left,_#0001_25%,_transparent_25%_50%,_#0001_50%_75%,_transparent_75%)] [background-size:16px_16px]"
                      >
                        {l.url ? (
                          <img src={l.url} alt={l.name} className="max-h-full max-w-full object-contain" />
                        ) : (
                          <div className="text-xs text-destructive p-2 text-center">{l.error || '—'}</div>
                        )}
                      </div>
                      <div className="p-3 flex items-center justify-between gap-2">
                        <span className="text-sm font-medium truncate">{layerLabel(l.key, l.name)}</span>
                        {l.url && (
                          <Button size="sm" variant="ghost" onClick={() => downloadOne(l.url!, l.key)}>
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" /> {t.tipsTitle}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                <li>{t.tip1}</li>
                <li>{t.tip2}</li>
                <li>{t.tip3}</li>
                <li>{t.tip4}</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const ToggleRow = ({
  label, hint, checked, onChange,
}: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-start justify-between gap-3">
    <div className="flex-1">
      <Label className="cursor-pointer">{label}</Label>
      <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
    </div>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

export default ImageLayerSplittingPage;
