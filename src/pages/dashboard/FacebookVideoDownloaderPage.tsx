import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Facebook, Loader2, Link as LinkIcon, ClipboardPaste } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";

interface FBResult {
  title: string;
  thumbnail: string | null;
  hd: string | null;
  sd: string | null;
  source: string;
}

const FacebookVideoDownloaderPage = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FBResult | null>(null);

  const handleFetch = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      toast({ title: t("fbdl.toast.missingTitle"), description: t("fbdl.toast.missingDesc"), variant: "destructive" });
      return;
    }
    if (!/facebook\.com|fb\.watch/i.test(trimmed)) {
      toast({ title: t("fbdl.toast.invalidTitle"), description: t("fbdl.toast.invalidDesc"), variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("facebook-video-download", {
        body: { url: trimmed },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setResult(data as FBResult);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("fbdl.toast.failedDesc");
      toast({ title: t("fbdl.toast.failedTitle"), description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setUrl(text);
    } catch {
      toast({ title: t("fbdl.toast.clipboardTitle"), description: t("fbdl.toast.clipboardDesc"), variant: "destructive" });
    }
  };

  const handleDownload = async (videoUrl: string, quality: string) => {
    try {
      const res = await fetch(videoUrl);
      if (!res.ok) throw new Error("Network error");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `facebook-video-${quality}-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: open in new tab
      window.open(videoUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-display font-bold flex items-center gap-3">
          <Facebook className="w-8 h-8 text-primary" />
          {t("fbdl.title")}
        </h1>
        <p className="text-muted-foreground">{t("fbdl.subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("fbdl.card.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fb-url">{t("fbdl.input.label")}</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="fb-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.facebook.com/watch/?v=..."
                  className="pl-9"
                  onKeyDown={(e) => e.key === "Enter" && !loading && handleFetch()}
                />
              </div>
              <Button type="button" variant="outline" onClick={handlePaste} title={t("fbdl.btn.paste")}>
                <ClipboardPaste className="w-4 h-4" />
              </Button>
              <Button onClick={handleFetch} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span className="ml-2">{loading ? t("fbdl.btn.fetching") : t("fbdl.btn.download")}</span>
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{t("fbdl.note")}</p>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg truncate">{result.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              {result.thumbnail && (
                <div className="rounded-lg overflow-hidden border bg-muted">
                  <img src={result.thumbnail} alt={result.title} className="w-full h-auto object-cover" />
                </div>
              )}
              <div className="space-y-3">
                {result.hd && (
                  <Button className="w-full" onClick={() => handleDownload(result.hd!, "hd")}>
                    <Download className="w-4 h-4 mr-2" />
                    {t("fbdl.quality.hd")}
                  </Button>
                )}
                {result.sd && (
                  <Button variant="secondary" className="w-full" onClick={() => handleDownload(result.sd!, "sd")}>
                    <Download className="w-4 h-4 mr-2" />
                    {t("fbdl.quality.sd")}
                  </Button>
                )}
                {!result.hd && !result.sd && (
                  <p className="text-sm text-muted-foreground">{t("fbdl.noLinks")}</p>
                )}
                <p className="text-xs text-muted-foreground">{t("fbdl.tip")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FacebookVideoDownloaderPage;
