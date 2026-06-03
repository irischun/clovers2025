import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Youtube, Loader2, Link as LinkIcon, ClipboardPaste, Volume2, VolumeX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";

interface YTFormat {
  itag: number;
  quality: string;
  mime: string;
  hasAudio: boolean;
  hasVideo: boolean;
  url: string;
  contentLength?: string;
}

interface YTResult {
  title: string;
  author: string | null;
  duration: number | null;
  thumbnail: string | null;
  formats: YTFormat[];
  source: string;
}

function formatBytes(bytes?: string) {
  if (!bytes) return null;
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return null;
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v >= 100 ? 0 : 1)} ${units[i]}`;
}

function formatDuration(seconds: number | null) {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
}

const YouTubeVideoDownloaderPage = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<YTResult | null>(null);
  const [downloadingItag, setDownloadingItag] = useState<number | null>(null);

  const handleFetch = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      toast({ title: t("ytdl.toast.missingTitle"), description: t("ytdl.toast.missingDesc"), variant: "destructive" });
      return;
    }
    if (!/youtube\.com|youtu\.be/i.test(trimmed)) {
      toast({ title: t("ytdl.toast.invalidTitle"), description: t("ytdl.toast.invalidDesc"), variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("youtube-video-download", {
        body: { url: trimmed },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setResult(data as YTResult);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("ytdl.toast.failedDesc");
      toast({ title: t("ytdl.toast.failedTitle"), description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text);
    } catch {
      toast({ title: t("ytdl.toast.clipboardTitle"), description: t("ytdl.toast.clipboardDesc"), variant: "destructive" });
    }
  };

  const handleDownload = (fmt: YTFormat) => {
    setDownloadingItag(fmt.itag);
    try {
      const safeTitle = (result?.title || "youtube-video").replace(/[^\w\-]+/g, "_").slice(0, 80);
      const filename = `${safeTitle}-${fmt.quality}.mp4`;
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const proxyUrl =
        `https://${projectId}.supabase.co/functions/v1/youtube-video-download` +
        `?stream=${encodeURIComponent(fmt.url)}&filename=${encodeURIComponent(filename)}`;
      const a = document.createElement("a");
      a.href = proxyUrl;
      a.download = filename;
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } finally {
      setTimeout(() => setDownloadingItag(null), 800);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-display font-bold flex items-center gap-3">
          <Youtube className="w-8 h-8 text-primary" />
          {t("ytdl.title")}
        </h1>
        <p className="text-muted-foreground">{t("ytdl.subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("ytdl.card.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="yt-url">{t("ytdl.input.label")}</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="yt-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="pl-9"
                  onKeyDown={(e) => e.key === "Enter" && !loading && handleFetch()}
                />
              </div>
              <Button type="button" variant="outline" onClick={handlePaste} title={t("ytdl.btn.paste")}>
                <ClipboardPaste className="w-4 h-4" />
              </Button>
              <Button onClick={handleFetch} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span className="ml-2">{loading ? t("ytdl.btn.fetching") : t("ytdl.btn.download")}</span>
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{t("ytdl.note")}</p>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg truncate">{result.title}</CardTitle>
            {(result.author || result.duration) && (
              <p className="text-sm text-muted-foreground">
                {[result.author, formatDuration(result.duration)].filter(Boolean).join(" • ")}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              {result.thumbnail && (
                <div className="rounded-lg overflow-hidden border bg-muted">
                  <img src={result.thumbnail} alt={result.title} className="w-full h-auto object-cover" />
                </div>
              )}
              <div className="space-y-2">
                {result.formats.length === 0 && (
                  <p className="text-sm text-muted-foreground">{t("ytdl.noLinks")}</p>
                )}
                {result.formats.map((f) => (
                  <Button
                    key={f.itag}
                    className="w-full justify-between"
                    variant={f.hasAudio ? "default" : "secondary"}
                    disabled={downloadingItag === f.itag}
                    onClick={() => handleDownload(f)}
                  >
                    <span className="flex items-center gap-2">
                      {downloadingItag === f.itag ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      MP4 {f.quality}
                      {f.hasAudio ? (
                        <Volume2 className="w-3 h-3 opacity-70" />
                      ) : (
                        <VolumeX className="w-3 h-3 opacity-70" />
                      )}
                    </span>
                    <span className="text-xs opacity-80">
                      {f.hasAudio ? t("ytdl.tag.videoAudio") : t("ytdl.tag.videoOnly")}
                      {formatBytes(f.contentLength) ? ` • ${formatBytes(f.contentLength)}` : ""}
                    </span>
                  </Button>
                ))}
                <p className="text-xs text-muted-foreground pt-2">{t("ytdl.tip")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default YouTubeVideoDownloaderPage;
