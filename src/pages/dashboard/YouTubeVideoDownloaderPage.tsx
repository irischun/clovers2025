import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Download,
  Youtube,
  Loader2,
  Link as LinkIcon,
  ClipboardPaste,
  Volume2,
  VolumeX,
  Music,
  Film,
  Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";

interface YTFormat {
  itag?: number;
  quality: string;
  kind?: "video" | "audio";
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
  source?: string;
}

interface YTPendingResult {
  status: "processing";
  provider: "apify";
  runId: string;
  datasetId?: string;
  videoId: string;
  pollAfterMs: number;
}

const QUALITY_RANK: Record<string, number> = {
  "2160p": 2160, "1440p": 1440, "1080p": 1080, "720p": 720,
  "480p": 480, "360p": 360, "240p": 240, "144p": 144,
};

function qualityScore(q: string) {
  if (QUALITY_RANK[q]) return QUALITY_RANK[q];
  const m = q.match(/(\d+)/);
  return m ? Number(m[1]) : 0;
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
  const [activeTab, setActiveTab] = useState<"mp4" | "mp3">("mp4");

  const getFormatKey = (fmt: YTFormat) =>
    `${fmt.itag ?? fmt.quality}-${fmt.kind ?? (fmt.hasVideo ? "video" : "audio")}-${fmt.hasAudio ? "av" : "v"}`;

  const { videoFormats, audioFormats } = useMemo(() => {
    const v: YTFormat[] = [];
    const a: YTFormat[] = [];
    (result?.formats ?? []).forEach((f) => {
      const isAudio = f.kind === "audio" || (!f.hasVideo && f.hasAudio);
      if (isAudio) a.push(f);
      else if (f.hasVideo) v.push(f);
    });
    v.sort((x, y) => qualityScore(y.quality) - qualityScore(x.quality) || Number(y.hasAudio) - Number(x.hasAudio));
    a.sort((x, y) => qualityScore(y.quality) - qualityScore(x.quality));
    return { videoFormats: v, audioFormats: a };
  }, [result]);

  const pollApifyResult = async (pending: YTPendingResult) => {
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    for (let attempt = 0; attempt < 24; attempt++) {
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
        setStatusText(`Still preparing the video qualities… (${attempt + 1}/24)`);
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
    setStatusText("Analyzing video and preparing 360p / 720p / 1080p options…");
    try {
      const { data, error } = await supabase.functions.invoke("youtube-video-download", {
        body: { url: trimmed },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      if ((data as any)?.status === "processing") {
        await pollApifyResult(data as YTPendingResult);
      } else {
        setResult(data as YTResult);
        setStatusText("");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("ytdl.toast.failedDesc");
      setStatusText("");
      toast({ title: t("ytdl.toast.failedTitle"), description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        // Auto-fetch on paste, yt1s-style
        setTimeout(() => handleFetch(), 50);
      }
    } catch {
      toast({ title: t("ytdl.toast.clipboardTitle"), description: t("ytdl.toast.clipboardDesc"), variant: "destructive" });
    }
  };

  const handleDownload = async (fmt: YTFormat) => {
    const key = getFormatKey(fmt);
    setDownloadingKey(key);
    try {
      const safeTitle = (result?.title || "youtube-video").replace(/[^\w\-]+/g, "_").slice(0, 80);
      const isAudio = fmt.kind === "audio" || (!fmt.hasVideo && fmt.hasAudio);
      const extension = isAudio
        ? (/m4a/i.test(fmt.mime) ? "m4a" : "mp3")
        : (/webm/i.test(fmt.mime) || /\.webm(?:$|\?)/i.test(fmt.url) ? "webm" : "mp4");
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
      toast({ title: t("ytdl.toast.failedTitle"), description: message, variant: "destructive" });
    } finally {
      setTimeout(() => setDownloadingKey(null), 800);
    }
  };

  const renderFormatRow = (f: YTFormat) => {
    const key = getFormatKey(f);
    const isAudio = f.kind === "audio" || (!f.hasVideo && f.hasAudio);
    const ext = isAudio
      ? (/m4a/i.test(f.mime) ? "M4A" : "MP3")
      : (/webm/i.test(f.mime) ? "WEBM" : "MP4");
    const size = formatBytes(f.contentLength);
    return (
      <div
        key={key}
        className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card/50 px-4 py-3 hover:bg-card transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          {isAudio ? (
            <Music className="w-4 h-4 text-primary shrink-0" />
          ) : (
            <Film className="w-4 h-4 text-primary shrink-0" />
          )}
          <div className="min-w-0">
            <div className="font-medium text-sm truncate">
              {ext} · {f.quality}
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              {!isAudio && (f.hasAudio
                ? <span className="inline-flex items-center gap-1"><Volume2 className="w-3 h-3" />{t("ytdl.tag.videoAudio")}</span>
                : <span className="inline-flex items-center gap-1"><VolumeX className="w-3 h-3" />{t("ytdl.tag.videoOnly")}</span>)}
              {size && <span>· {size}</span>}
            </div>
          </div>
        </div>
        <Button
          size="sm"
          disabled={downloadingKey === key}
          onClick={() => handleDownload(f)}
          className="shrink-0"
        >
          {downloadingKey === key ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span className="ml-1.5">Download</span>
        </Button>
      </div>
    );
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
                {statusText || "Analyzing video via residential proxy — usually 5–15 seconds…"}
              </p>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{t("ytdl.note")}</p>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardContent className="pt-6 space-y-5">
            <div className="grid md:grid-cols-[280px_1fr] gap-5">
              {result.thumbnail && (
                <div className="rounded-lg overflow-hidden border bg-muted aspect-video">
                  <img
                    src={result.thumbnail}
                    alt={result.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="space-y-2 min-w-0">
                <h2 className="text-lg font-semibold leading-snug line-clamp-3">{result.title}</h2>
                <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                  {result.author && <span>{result.author}</span>}
                  {result.duration && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {formatDuration(result.duration)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "mp4" | "mp3")}>
              <TabsList className="grid w-full max-w-xs grid-cols-2">
                <TabsTrigger value="mp4" className="gap-2">
                  <Film className="w-4 h-4" /> MP4
                </TabsTrigger>
                <TabsTrigger value="mp3" className="gap-2" disabled={audioFormats.length === 0}>
                  <Music className="w-4 h-4" /> MP3
                </TabsTrigger>
              </TabsList>

              <TabsContent value="mp4" className="space-y-2 mt-4">
                {videoFormats.length === 0
                  ? <p className="text-sm text-muted-foreground">{t("ytdl.noLinks")}</p>
                  : videoFormats.map(renderFormatRow)}
              </TabsContent>
              <TabsContent value="mp3" className="space-y-2 mt-4">
                {audioFormats.length === 0
                  ? <p className="text-sm text-muted-foreground">No audio-only streams available for this video.</p>
                  : audioFormats.map(renderFormatRow)}
              </TabsContent>
            </Tabs>

            <p className="text-xs text-muted-foreground">{t("ytdl.tip")}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default YouTubeVideoDownloaderPage;
