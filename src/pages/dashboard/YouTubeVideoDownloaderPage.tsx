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
  itag?: number;
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

interface YTPendingResult {
  status: "processing";
  provider: "apify";
  runId: string;
  datasetId?: string;
  videoId: string;
  pollAfterMs: number;
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
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string>("");

  const getFormatKey = (fmt: YTFormat) => `${fmt.itag ?? fmt.quality}-${fmt.hasAudio ? "av" : "v"}`;

  const pollApifyResult = async (pending: YTPendingResult) => {
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    for (let attempt = 0; attempt < 18; attempt++) {
      await new Promise((resolve) => window.setTimeout(resolve, pending.pollAfterMs || 4000));

      const endpoint = new URL(`${baseUrl}/functions/v1/youtube-video-download`);
      endpoint.searchParams.set("action", "apify-status");
      endpoint.searchParams.set("runId", pending.runId);
      endpoint.searchParams.set("videoId", pending.videoId);
      if (pending.datasetId) endpoint.searchParams.set("datasetId", pending.datasetId);

      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;

      const res = await fetch(endpoint.toString(), {
        headers: {
          ...(publishableKey ? { apikey: publishableKey } : {}),
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });
      const data = await res.json();

      if (data?.status === "processing") {
        setStatusText("Still preparing the video qualities. Please wait a few more seconds…");
        continue;
      }

      if (data?.error) throw new Error(data.error);
      setResult(data as YTResult);
      setStatusText("");
      return;
    }

    throw new Error("Video analysis took too long. Please try again.");
  };

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
    setStatusText("");
    try {
      const { data, error } = await supabase.functions.invoke("youtube-video-download", {
        body: { url: trimmed },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      if ((data as any)?.status === "processing") {
        setStatusText("Analyzing video and preparing 360p / 720p / 1080p options…");
        await pollApifyResult(data as YTPendingResult);
      } else {
        setResult(data as YTResult);
      }
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

  const handleDownload = async (fmt: YTFormat) => {
    const key = getFormatKey(fmt);
    setDownloadingKey(key);
    try {
      const safeTitle = (result?.title || "youtube-video").replace(/[^\w\-]+/g, "_").slice(0, 80);
      const extension = /webm/i.test(fmt.mime) || /\.webm(?:$|\?)/i.test(fmt.url) ? "webm" : "mp4";
      const filename = `${safeTitle}-${fmt.quality}.${extension}`;
      const baseUrl = import.meta.env.VITE_SUPABASE_URL;
      const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const proxyUrl =
        `${baseUrl}/functions/v1/youtube-video-download` +
        `?stream=${encodeURIComponent(fmt.url)}&filename=${encodeURIComponent(filename)}`;
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;
      const response = await fetch(proxyUrl, {
        headers: {
          ...(publishableKey ? { apikey: publishableKey } : {}),
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });
      if (!response.ok) throw new Error(`Download failed (${response.status})`);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      const message = err instanceof Error ? err.message : t("ytdl.toast.failedDesc");
      toast({
        title: t("ytdl.toast.failedTitle"),
        description: message,
        variant: "destructive",
      });
    } finally {
      setTimeout(() => setDownloadingKey(null), 800);
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
            {(loading || statusText) && (
              <p className="text-xs text-primary/80 animate-pulse">
                {statusText || "Analyzing video via residential proxy — this usually takes 5–15 seconds. Please wait…"}
              </p>
            )}
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
                    key={getFormatKey(f)}
                    className="w-full justify-between"
                    variant={f.hasAudio ? "default" : "secondary"}
                    disabled={downloadingKey === getFormatKey(f)}
                    onClick={() => handleDownload(f)}
                  >
                    <span className="flex items-center gap-2">
                      {downloadingKey === getFormatKey(f) ? (
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
