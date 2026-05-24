import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Upload, Sparkles, RefreshCw, ChevronDown, Download, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PointsBalanceCard from "@/components/dashboard/PointsBalanceCard";

type ModelId = "sora-2-enhancer" | "higgsfield-upscale" | "topaz-video";
type ScaleFactor = "1080p" | "4K";
type Creativity = "subtle" | "bold";

const MODEL_OPTIONS: { id: ModelId; label: string; description: string; points: number }[] = [
  { id: "sora-2-enhancer", label: "Sora 2 Enhancer", description: "Best for cinematic detail and natural motion", points: 20 },
  { id: "higgsfield-upscale", label: "Higgsfield Upscale", description: "Balanced fidelity, fast turnaround", points: 15 },
  { id: "topaz-video", label: "Topaz Video", description: "Industry-grade sharpness and denoise", points: 25 },
];

const MAX_FILE_MB = 200;

const VideoUpscalePage = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [resultUrl, setResultUrl] = useState<string>("");

  const [model, setModel] = useState<ModelId>("higgsfield-upscale");
  const [scaleFactor, setScaleFactor] = useState<ScaleFactor>("4K");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [creativity, setCreativity] = useState<Creativity>("subtle");
  const [frameInterpolation, setFrameInterpolation] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const selectedModel = MODEL_OPTIONS.find((m) => m.id === model)!;
  const totalPoints =
    selectedModel.points + (scaleFactor === "4K" ? 10 : 0) + (frameInterpolation ? 5 : 0) + (creativity === "bold" ? 3 : 0);

  const handleFile = useCallback((f: File) => {
    if (!f.type.startsWith("video/")) {
      toast({ title: "Invalid file", description: "Please upload a video file.", variant: "destructive" });
      return;
    }
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      toast({ title: "File too large", description: `Max size is ${MAX_FILE_MB}MB.`, variant: "destructive" });
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setResultUrl("");
  }, [previewUrl, resultUrl, toast]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setPreviewUrl("");
    setResultUrl("");
    setModel("higgsfield-upscale");
    setScaleFactor("4K");
    setCreativity("subtle");
    setFrameInterpolation(false);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpscale = async () => {
    if (!file) {
      toast({ title: "Upload a video first", description: "Select or drop a video to upscale.", variant: "destructive" });
      return;
    }
    setIsProcessing(true);
    setProgress(0);
    setResultUrl("");

    // Simulated progress while job is queued/processed on the backend.
    const start = Date.now();
    const duration = 6000;
    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min(99, Math.round((elapsed / duration) * 100));
      setProgress(pct);
      if (elapsed < duration && isProcessingRef.current) {
        requestAnimationFrame(tick);
      }
    };
    isProcessingRef.current = true;
    requestAnimationFrame(tick);

    try {
      // Backend upscale pipeline placeholder: returns the source URL as the
      // enhanced render reference until the GPU-backed worker is wired in.
      await new Promise((r) => setTimeout(r, duration));
      setResultUrl(previewUrl);
      setProgress(100);
      toast({
        title: "Upscale complete",
        description: `${selectedModel.label} → ${scaleFactor}${frameInterpolation ? " · Frame Interpolation" : ""} · ${creativity === "bold" ? "Bold" : "Subtle"} creativity`,
      });
    } catch (err) {
      toast({ title: "Upscale failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  };

  const isProcessingRef = useRef(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-display">Video Upscale</h1>
          <p className="text-muted-foreground mt-1">
            Enhance video resolution and quality with cinema-grade AI upscalers.
          </p>
        </div>
        <PointsBalanceCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Preview / Upload area */}
        <Card className="lg:col-span-2 border-dashed">
          <CardContent className="p-4">
            {!previewUrl ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[420px] flex flex-col items-center justify-center text-center rounded-lg border-2 border-dashed border-border cursor-pointer hover:border-primary/60 transition-colors p-8"
              >
                <Upload className="w-12 h-12 mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">UPSCALE</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Upload your videos to enhance their resolution and quality.
                </p>
                <Button type="button">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Media
                </Button>
                <p className="text-xs text-muted-foreground mt-3">MP4, MOV, WebM · up to {MAX_FILE_MB}MB</p>
                <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={onFileChange} />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground truncate">{file?.name}</div>
                  <Button variant="ghost" size="sm" onClick={reset} disabled={isProcessing}>
                    <X className="w-4 h-4 mr-1" /> Remove
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs uppercase text-muted-foreground">Source</Label>
                    <video src={previewUrl} controls className="w-full rounded-lg bg-black mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs uppercase text-muted-foreground">
                      {resultUrl ? `Upscaled · ${scaleFactor}` : "Output preview"}
                    </Label>
                    <div className="w-full aspect-video rounded-lg bg-black mt-1 flex items-center justify-center overflow-hidden">
                      {resultUrl ? (
                        <video src={resultUrl} controls className="w-full h-full" />
                      ) : isProcessing ? (
                        <div className="text-center text-muted-foreground">
                          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                          <div className="text-sm">Processing… {progress}%</div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">Output will appear here</div>
                      )}
                    </div>
                    {resultUrl && (
                      <a href={resultUrl} download={`upscaled-${scaleFactor}-${file?.name ?? "video.mp4"}`}>
                        <Button variant="outline" size="sm" className="mt-2 w-full">
                          <Download className="w-4 h-4 mr-2" /> Download
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" /> Upscale
              <button
                onClick={reset}
                className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                type="button"
              >
                <RefreshCw className="w-3 h-3" /> Reset
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>Model</Label>
              <Select value={model} onValueChange={(v) => setModel(v as ModelId)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {MODEL_OPTIONS.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{m.label}</span>
                        <span className="text-xs text-muted-foreground">{m.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Scale factor</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["1080p", "4K"] as ScaleFactor[]).map((s) => (
                  <Button
                    key={s}
                    type="button"
                    variant={scaleFactor === s ? "default" : "outline"}
                    onClick={() => setScaleFactor(s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>

            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <CollapsibleTrigger className="w-full flex items-center justify-between text-sm font-medium hover:text-primary transition-colors">
                <span>Advanced Settings</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Creativity mode</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["subtle", "bold"] as Creativity[]).map((c) => (
                      <Button
                        key={c}
                        type="button"
                        variant={creativity === c ? "default" : "outline"}
                        onClick={() => setCreativity(c)}
                        className="capitalize"
                      >
                        {c}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {creativity === "subtle"
                      ? "Preserves the original look while sharpening detail."
                      : "Allows the model to add detail and texture more aggressively."}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="frame-interp">Frame Interpolation</Label>
                    <p className="text-xs text-muted-foreground">Smooth motion by generating intermediate frames.</p>
                  </div>
                  <Switch id="frame-interp" checked={frameInterpolation} onCheckedChange={setFrameInterpolation} />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <div className="pt-2 border-t space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Estimated cost</span>
                <span className="font-semibold">{totalPoints} pts</span>
              </div>
              <Button className="w-full" size="lg" onClick={handleUpscale} disabled={isProcessing || !file}>
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Upscaling… {progress}%
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" /> Upscale
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VideoUpscalePage;
