import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Calendar as CalendarIcon, Star, Grid3X3, ImageIcon, Video, Filter, Trash2,
  Download, Copy, Check, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Maximize2, Music, FileText, Play, Pause, Type, RefreshCw,
  Globe, GlobeLock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { DASHBOARD_STATS_KEY } from '@/hooks/useDashboardStats';
import { useAuthReady } from '@/hooks/useAuthReady';
import {
  useGalleryImages, useGalleryImageCount, useGalleryVoices, useGallerySubtitles, useGalleryTextWorks,
  GALLERY_IMAGES_KEY, GALLERY_VOICES_KEY, GALLERY_SUBTITLES_KEY, GALLERY_TEXT_KEY,
  type TextWork,
} from '@/hooks/useGalleryData';
import { useMyPublishedSourceIds, useCommunityActions } from '@/hooks/useCommunityPublish';
import type { GeneratedImage } from '@/hooks/useGeneratedImages';
import type { VoiceGeneration } from '@/hooks/useVoiceGenerations';
import type { SubtitleConversion } from '@/hooks/useSubtitleConversions';

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatDateSafe = (value?: string): string => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : format(date, 'yyyy-MM-dd HH:mm');
};

type ActiveTab = 'images' | 'videos' | 'audio' | 'subtitles' | 'text';

const GalleryPage = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Wait for auth to be fully restored before firing any queries
  const { user, isReady: authReady } = useAuthReady();
  const queriesEnabled = authReady && !!user;

  // Pagination for images (base64 data is huge — ~1.6MB per image)
  const [imagePage, setImagePage] = useState(0);

  // React Query cached data — gated on auth readiness
  const {
    data: generatedImages = [],
    isLoading: imgLoading,
    isError: imgError,
    error: imgErrorObj,
    refetch: refetchImages,
  } = useGalleryImages(imagePage, queriesEnabled);
  const {
    data: totalImageCount = 0,
  } = useGalleryImageCount(queriesEnabled);
  const {
    data: voices = [],
    isLoading: voiceLoading,
    isError: voiceError,
    error: voiceErrorObj,
    refetch: refetchVoices,
  } = useGalleryVoices(queriesEnabled);
  const {
    data: subtitles = [],
    isLoading: subLoading,
    isError: subError,
    error: subErrorObj,
    refetch: refetchSubtitles,
  } = useGallerySubtitles(queriesEnabled);
  const {
    data: textWorks = [],
    isLoading: textLoading,
    isError: textError,
    error: textErrorObj,
    refetch: refetchText,
  } = useGalleryTextWorks(queriesEnabled);

  const [activeTab, setActiveTab] = useState<ActiveTab>('images');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GeneratedImage | null>(null);
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [fileSizes, setFileSizes] = useState<Record<string, number>>({});
  const [audioFileSizes, setAudioFileSizes] = useState<Record<string, number>>({});
  const [subtitleFileSizes, setSubtitleFileSizes] = useState<Record<string, number>>({});
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioElements, setAudioElements] = useState<Record<string, HTMLAudioElement>>({});

  // Per-tab loading — includes auth-not-ready state
  const tabLoading: Record<ActiveTab, boolean> = {
    images: !queriesEnabled || imgLoading,
    videos: false,
    audio: !queriesEnabled || voiceLoading,
    subtitles: !queriesEnabled || subLoading,
    text: !queriesEnabled || textLoading,
  };

  const resolveErrorMessage = (error: unknown) =>
    error instanceof Error && error.message ? error.message : '載入失敗，請稍後重試';

  const tabErrors: Record<ActiveTab, string | null> = {
    images: imgError ? resolveErrorMessage(imgErrorObj) : null,
    videos: null,
    audio: voiceError ? resolveErrorMessage(voiceErrorObj) : null,
    subtitles: subError ? resolveErrorMessage(subErrorObj) : null,
    text: textError ? resolveErrorMessage(textErrorObj) : null,
  };

  // Mutation helpers that update cache + DB
  const toggleFavorite = async (id: string, isFavorite: boolean) => {
    // Optimistic update
    queryClient.setQueryData(GALLERY_IMAGES_KEY, (old: GeneratedImage[] | undefined) =>
      (old || []).map(img => img.id === id ? { ...img, is_favorite: !isFavorite } : img)
    );
    const { error } = await supabase.from('generated_images').update({ is_favorite: !isFavorite }).eq('id', id);
    if (error) {
      queryClient.invalidateQueries({ queryKey: GALLERY_IMAGES_KEY });
      toast({ title: '操作失敗', variant: 'destructive' });
    } else {
      toast({ title: !isFavorite ? '已添加到收藏' : '已取消收藏' });
    }
  };

  const deleteImage = async (id: string) => {
    queryClient.setQueryData(GALLERY_IMAGES_KEY, (old: GeneratedImage[] | undefined) =>
      (old || []).filter(img => img.id !== id)
    );
    const { error } = await supabase.from('generated_images').delete().eq('id', id);
    if (error) queryClient.invalidateQueries({ queryKey: GALLERY_IMAGES_KEY });
    else { queryClient.invalidateQueries({ queryKey: DASHBOARD_STATS_KEY }); toast({ title: '圖片已刪除' }); }
  };

  const toggleVoiceFav = async (id: string, isFavorite: boolean) => {
    queryClient.setQueryData(GALLERY_VOICES_KEY, (old: VoiceGeneration[] | undefined) =>
      (old || []).map(v => v.id === id ? { ...v, is_favorite: !isFavorite } : v)
    );
    const { error } = await supabase.from('voice_generations').update({ is_favorite: !isFavorite }).eq('id', id);
    if (error) queryClient.invalidateQueries({ queryKey: GALLERY_VOICES_KEY });
    else toast({ title: !isFavorite ? '已添加到收藏' : '已取消收藏' });
  };

  const deleteVoice = async (id: string) => {
    queryClient.setQueryData(GALLERY_VOICES_KEY, (old: VoiceGeneration[] | undefined) =>
      (old || []).filter(v => v.id !== id)
    );
    const { error } = await supabase.from('voice_generations').delete().eq('id', id);
    if (error) queryClient.invalidateQueries({ queryKey: GALLERY_VOICES_KEY });
    else { queryClient.invalidateQueries({ queryKey: DASHBOARD_STATS_KEY }); toast({ title: '音頻已刪除' }); }
  };

  const deleteSubtitle = async (id: string) => {
    queryClient.setQueryData(GALLERY_SUBTITLES_KEY, (old: SubtitleConversion[] | undefined) =>
      (old || []).filter(s => s.id !== id)
    );
    const { error } = await supabase.from('subtitle_conversions').delete().eq('id', id);
    if (error) queryClient.invalidateQueries({ queryKey: GALLERY_SUBTITLES_KEY });
    else { queryClient.invalidateQueries({ queryKey: DASHBOARD_STATS_KEY }); toast({ title: '字幕已刪除' }); }
  };

  const fetchRemoteFileSize = async (url: string): Promise<number> => {
    try {
      const head = await fetch(url, { method: 'HEAD' });
      const contentLength = head.headers.get('content-length');
      if (contentLength) return Number(contentLength);
    } catch {
      // fallback below
    }

    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return blob.size;
    } catch {
      return -1;
    }
  };

  // Fetch image file sizes
  useEffect(() => {
    if (generatedImages.length === 0) return;

    generatedImages.forEach((img) => {
      if (fileSizes[img.id] !== undefined) return;

      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          ctx.drawImage(image, 0, 0);
          canvas.toBlob((blob) => {
            setFileSizes(prev => ({ ...prev, [img.id]: blob?.size ?? -1 }));
          }, 'image/png');
        } catch {
          const est = Math.round(image.naturalWidth * image.naturalHeight * 4 * 0.15);
          setFileSizes(prev => ({ ...prev, [img.id]: est }));
        }
      };
      image.onerror = () => setFileSizes(prev => ({ ...prev, [img.id]: -1 }));
      image.src = img.image_url;
    });
  }, [generatedImages, fileSizes]);

  // Fetch audio file sizes
  useEffect(() => {
    const loadAudioSizes = async () => {
      const pending = voices.filter(v => v.audio_url && audioFileSizes[v.id] === undefined);
      if (pending.length === 0) return;

      const results = await Promise.all(
        pending.map(async (v) => ({ id: v.id, size: await fetchRemoteFileSize(v.audio_url!) }))
      );

      setAudioFileSizes(prev => {
        const next = { ...prev };
        results.forEach(({ id, size }) => { next[id] = size; });
        return next;
      });
    };

    loadAudioSizes();
  }, [voices, audioFileSizes]);

  // Fetch subtitle file sizes (sum all generated subtitle files per item)
  useEffect(() => {
    const loadSubtitleSizes = async () => {
      const pending = subtitles.filter(s => subtitleFileSizes[s.id] === undefined);
      if (pending.length === 0) return;

      const results = await Promise.all(
        pending.map(async (s) => {
          const urls = s.subtitle_urls ? Object.values(s.subtitle_urls) : [];
          if (urls.length === 0) return { id: s.id, size: -1 };
          const sizes = await Promise.all(urls.map((url) => fetchRemoteFileSize(String(url))));
          if (sizes.every((size) => size < 0)) return { id: s.id, size: -1 };
          const total = sizes.filter((size) => size > 0).reduce((sum, size) => sum + size, 0);
          return { id: s.id, size: total || -1 };
        })
      );

      setSubtitleFileSizes(prev => {
        const next = { ...prev };
        results.forEach(({ id, size }) => { next[id] = size; });
        return next;
      });
    };

    loadSubtitleSizes();
  }, [subtitles, subtitleFileSizes]);

  useEffect(() => {
    return () => {
      Object.values(audioElements).forEach((audio) => audio.pause());
    };
  }, [audioElements]);

  // Date filter helper
  const passesDateFilter = (dateStr: string) => {
    const d = new Date(dateStr);
    if (startDate && d < startDate) return false;
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (d > end) return false;
    }
    return true;
  };

  const filteredImages = generatedImages.filter(img => {
    if (!passesDateFilter(img.created_at)) return false;
    if (showFavoritesOnly && !img.is_favorite) return false;
    return true;
  });

  const filteredVoices = voices.filter(v => {
    if (!passesDateFilter(v.created_at)) return false;
    if (showFavoritesOnly && !v.is_favorite) return false;
    return true;
  });

  const filteredSubtitles = subtitles.filter(s => passesDateFilter(s.created_at));

  const filteredTextWorks = textWorks.filter(tw => passesDateFilter(tw.created_at));

  const togglePromptExpand = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedPrompts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const copyText = async (text: string, id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast({ title: '已複製' });
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast({ title: '複製失敗', variant: 'destructive' });
    }
  };

  const handleDownload = async (url: string, title: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const ext = getFileFormat(url);
      link.download = `clovers-${(title || 'file').substring(0, 30)}-${Date.now()}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast({ title: '下載開始' });
    } catch {
      const link = document.createElement('a');
      link.href = url;
      link.download = `clovers-${Date.now()}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getFileFormat = (url: string): string => {
    const cleanUrl = url.split('?')[0].toLowerCase();
    if (cleanUrl.endsWith('.webp')) return 'webp';
    if (cleanUrl.endsWith('.jpg') || cleanUrl.endsWith('.jpeg')) return 'jpg';
    if (cleanUrl.endsWith('.gif')) return 'gif';
    if (cleanUrl.endsWith('.svg')) return 'svg';
    if (cleanUrl.endsWith('.mp3')) return 'mp3';
    if (cleanUrl.endsWith('.flac')) return 'flac';
    if (cleanUrl.endsWith('.wav')) return 'wav';
    if (cleanUrl.endsWith('.pcm')) return 'pcm';
    if (cleanUrl.endsWith('.srt')) return 'srt';
    if (cleanUrl.endsWith('.vtt')) return 'vtt';
    return 'png';
  };

  const getSubtitleFormatLabel = (subtitleUrls: SubtitleConversion['subtitle_urls']): string => {
    const urls = subtitleUrls ? Object.values(subtitleUrls) : [];
    if (urls.length === 0) return 'SRT';
    const formats = Array.from(new Set(urls.map((u) => getFileFormat(String(u)).toUpperCase())));
    return formats.join('/');
  };

  const toggleAudioPlay = (id: string, url: string) => {
    if (playingAudioId === id) {
      audioElements[id]?.pause();
      setPlayingAudioId(null);
      return;
    }
    // Stop any playing
    if (playingAudioId && audioElements[playingAudioId]) {
      audioElements[playingAudioId].pause();
    }
    let audio = audioElements[id];
    if (!audio) {
      audio = new Audio(url);
      audio.onended = () => setPlayingAudioId(null);
      setAudioElements(prev => ({ ...prev, [id]: audio }));
    }
    audio.play();
    setPlayingAudioId(id);
  };

  const IMAGES_PAGE_SIZE = 12;
  const totalImagePages = Math.max(1, Math.ceil(totalImageCount / IMAGES_PAGE_SIZE));

  const currentCount = activeTab === 'images' ? totalImageCount
    : activeTab === 'audio' ? filteredVoices.length
    : activeTab === 'subtitles' ? filteredSubtitles.length
    : activeTab === 'text' ? filteredTextWorks.length : 0;

  const countLabel = activeTab === 'images' ? '張圖片'
    : activeTab === 'audio' ? '個音頻'
    : activeTab === 'subtitles' ? '個字幕'
    : activeTab === 'text' ? '篇文字作品' : '個視頻';

  // ─── Image Card ───
  const renderImageCard = (img: GeneratedImage, index: number) => {
    const isExpanded = expandedPrompts.has(img.id);
    const isCopied = copiedId === img.id;
    const promptText = img.prompt || '';
    const shouldTruncate = promptText.length > 80;

    return (
      <div key={img.id} className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 animate-slide-up" style={{ animationDelay: `${index * 30}ms` }}>
        <div className="relative aspect-square overflow-hidden cursor-pointer" onClick={() => setSelectedItem(img)}>
          <img src={img.image_url} alt={img.title || img.prompt?.substring(0, 50)} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
          <button onClick={(e) => { e.stopPropagation(); toggleFavorite(img.id, img.is_favorite); }} className="absolute top-2 left-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors">
            <Star className={cn("w-4 h-4", img.is_favorite ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground")} />
          </button>
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={(e) => handleDownload(img.image_url, img.title || '', e)} className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors" title="下載"><Download className="w-4 h-4 text-muted-foreground" /></button>
            <button onClick={(e) => { e.stopPropagation(); setSelectedItem(img); }} className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors" title="放大"><Maximize2 className="w-4 h-4 text-muted-foreground" /></button>
            <button onClick={(e) => { e.stopPropagation(); deleteImage(img.id); }} className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-destructive/80 transition-colors" title="刪除"><Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive-foreground" /></button>
          </div>
          {img.aspect_ratio && <div className="absolute bottom-2 left-2"><Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-xs font-mono">{img.aspect_ratio}</Badge></div>}
          <div className="absolute bottom-2 right-2"><Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-xs font-mono">{getFileFormat(img.image_url).toUpperCase()}</Badge></div>
        </div>
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatDateSafe(img.created_at)}</span>
            {img.model && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{img.model}</Badge>}
          </div>
          <div className="text-xs text-muted-foreground">
            檔案大小: <span className="text-foreground">{fileSizes[img.id] && fileSizes[img.id] > 0 ? formatFileSize(fileSizes[img.id]) : fileSizes[img.id] === -1 ? '無法取得' : '計算中...'}</span>
          </div>
          {img.style && <div className="text-xs text-muted-foreground">風格: <span className="text-foreground">{img.style}</span></div>}
          {promptText && (
            <div className="space-y-1">
              <p className={cn("text-xs text-muted-foreground leading-relaxed", !isExpanded && shouldTruncate && "line-clamp-2")}>{promptText}</p>
              <div className="flex items-center gap-1">
                {shouldTruncate && (
                  <button onClick={(e) => togglePromptExpand(img.id, e)} className="text-xs text-primary hover:text-primary/80 flex items-center gap-0.5 transition-colors">
                    {isExpanded ? <>收起 <ChevronUp className="w-3 h-3" /></> : <>展開 <ChevronDown className="w-3 h-3" /></>}
                  </button>
                )}
                <button onClick={(e) => copyText(promptText, img.id, e)} className="text-xs text-primary hover:text-primary/80 flex items-center gap-0.5 transition-colors ml-auto">
                  {isCopied ? <><Check className="w-3 h-3" /> 已複製</> : <><Copy className="w-3 h-3" /> 複製</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── Audio Card ───
  const renderAudioCard = (v: VoiceGeneration, index: number) => {
    const isExpanded = expandedPrompts.has(v.id);
    const isCopied = copiedId === v.id;
    const textContent = v.text_content || '';
    const shouldTruncate = textContent.length > 80;
    const isPlaying = playingAudioId === v.id;
    const audioFormat = v.format?.toUpperCase() || 'MP3';

    return (
      <div key={v.id} className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 animate-slide-up" style={{ animationDelay: `${index * 30}ms` }}>
        {/* Audio player area */}
        <div className="relative aspect-square overflow-hidden flex items-center justify-center bg-muted/30">
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Music className="w-10 h-10 text-primary" />
            </div>
            {v.audio_url && (
              <Button variant="outline" size="sm" className="gap-2" onClick={() => toggleAudioPlay(v.id, v.audio_url!)}>
                {isPlaying ? <><Pause className="w-4 h-4" /> 暫停</> : <><Play className="w-4 h-4" /> 播放</>}
              </Button>
            )}
          </div>
          {/* Favorite */}
          <button onClick={() => toggleVoiceFav(v.id, v.is_favorite)} className="absolute top-2 left-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors">
            <Star className={cn("w-4 h-4", v.is_favorite ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground")} />
          </button>
          {/* Hover actions */}
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {v.audio_url && (
              <button onClick={(e) => handleDownload(v.audio_url!, v.voice_name, e)} className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors" title="下載"><Download className="w-4 h-4 text-muted-foreground" /></button>
            )}
            <button onClick={() => deleteVoice(v.id)} className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-destructive/80 transition-colors" title="刪除"><Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive-foreground" /></button>
          </div>
          {/* Format badge */}
          <div className="absolute bottom-2 right-2"><Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-xs font-mono">{audioFormat}</Badge></div>
        </div>
        {/* Metadata */}
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatDateSafe(v.created_at)}</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{v.model}</Badge>
          </div>

          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-[10px] px-1 py-0 font-mono">AR: N/A</Badge>
            <Badge variant="outline" className="text-[10px] px-1 py-0 font-mono">{audioFormat}</Badge>
            <Badge variant="outline" className="text-[10px] px-1 py-0 font-mono">
              {audioFileSizes[v.id] === undefined
                ? '計算中...'
                : audioFileSizes[v.id] > 0
                  ? formatFileSize(audioFileSizes[v.id])
                  : '無法取得'}
            </Badge>
            {v.sample_rate && <Badge variant="outline" className="text-[10px] px-1 py-0">{v.sample_rate}Hz</Badge>}
            {v.bitrate && <Badge variant="outline" className="text-[10px] px-1 py-0">{Math.round(v.bitrate / 1000)}kbps</Badge>}
            {v.speed && v.speed !== 1 && <Badge variant="outline" className="text-[10px] px-1 py-0">速度:{v.speed}x</Badge>}
          </div>

          <div className="text-xs text-muted-foreground">聲音: <span className="text-foreground">{v.voice_name}</span></div>
          <div className="text-xs text-muted-foreground">語言: <span className="text-foreground">{v.language}</span></div>
          {v.emotion && v.emotion !== 'neutral' && <div className="text-xs text-muted-foreground">情感: <span className="text-foreground">{v.emotion}</span></div>}

          {textContent && (
            <div className="space-y-1">
              <p className={cn("text-xs text-muted-foreground leading-relaxed", !isExpanded && shouldTruncate && "line-clamp-2")}>{textContent}</p>
              <div className="flex items-center gap-1">
                {shouldTruncate && (
                  <button onClick={(e) => togglePromptExpand(v.id, e)} className="text-xs text-primary hover:text-primary/80 flex items-center gap-0.5 transition-colors">
                    {isExpanded ? <>收起 <ChevronUp className="w-3 h-3" /></> : <>展開 <ChevronDown className="w-3 h-3" /></>}
                  </button>
                )}
                <button onClick={(e) => copyText(textContent, v.id, e)} className="text-xs text-primary hover:text-primary/80 flex items-center gap-0.5 transition-colors ml-auto">
                  {isCopied ? <><Check className="w-3 h-3" /> 已複製</> : <><Copy className="w-3 h-3" /> 複製</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── Subtitle Card ───
  const renderSubtitleCard = (s: SubtitleConversion, index: number) => {
    const isCopied = copiedId === s.id;
    const isExpanded = expandedPrompts.has(s.id);
    const sourceName = s.source_name || '';
    const shouldTruncate = sourceName.length > 80;
    const subtitleUrls = s.subtitle_urls || {};
    const languageCount = s.languages?.length || 0;

    return (
      <div key={s.id} className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 animate-slide-up" style={{ animationDelay: `${index * 30}ms` }}>
        {/* Icon area */}
        <div className="relative aspect-square overflow-hidden flex items-center justify-center bg-muted/30">
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="w-10 h-10 text-primary" />
            </div>
            <Badge variant="secondary" className="text-xs">{languageCount} 種語言</Badge>
          </div>
          {/* Hover actions */}
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => deleteSubtitle(s.id)} className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-destructive/80 transition-colors" title="刪除"><Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive-foreground" /></button>
          </div>
          {/* Format badge */}
          <div className="absolute bottom-2 right-2"><Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-xs font-mono">{getSubtitleFormatLabel(s.subtitle_urls)}</Badge></div>
          {/* Status badge */}
          <div className="absolute bottom-2 left-2">
            <Badge variant={s.status === 'completed' ? 'secondary' : 'outline'} className="bg-background/80 backdrop-blur-sm text-xs">
              {s.status === 'completed' ? '已完成' : s.status === 'processing' ? '處理中' : s.status}
            </Badge>
          </div>
        </div>
        {/* Metadata */}
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatDateSafe(s.created_at)}</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{s.source_type}</Badge>
          </div>

          <div className="flex flex-wrap gap-1">
            <Badge variant="outline" className="text-[10px] px-1 py-0 font-mono">AR: N/A</Badge>
            <Badge variant="outline" className="text-[10px] px-1 py-0 font-mono">{getSubtitleFormatLabel(s.subtitle_urls)}</Badge>
            <Badge variant="outline" className="text-[10px] px-1 py-0 font-mono">
              {subtitleFileSizes[s.id] === undefined
                ? '計算中...'
                : subtitleFileSizes[s.id] > 0
                  ? formatFileSize(subtitleFileSizes[s.id])
                  : '無法取得'}
            </Badge>
          </div>

          <div className="text-xs text-muted-foreground">語言: <span className="text-foreground">{s.languages?.join(', ') || '—'}</span></div>

          {/* Download links for each language */}
          {Object.keys(subtitleUrls).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {Object.entries(subtitleUrls).map(([lang, url]) => (
                <Button key={lang} variant="outline" size="sm" className="h-6 text-[10px] gap-1 px-2" onClick={(e) => handleDownload(url as string, `${s.source_name}-${lang}`, e)}>
                  <Download className="w-3 h-3" /> {lang}
                </Button>
              ))}
            </div>
          )}

          {/* Source name as "prompt" equivalent */}
          {sourceName && (
            <div className="space-y-1">
              <p className={cn("text-xs text-muted-foreground leading-relaxed", !isExpanded && shouldTruncate && "line-clamp-2")}>{sourceName}</p>
              <div className="flex items-center gap-1">
                {shouldTruncate && (
                  <button onClick={(e) => togglePromptExpand(s.id, e)} className="text-xs text-primary hover:text-primary/80 flex items-center gap-0.5 transition-colors">
                    {isExpanded ? <>收起 <ChevronUp className="w-3 h-3" /></> : <>展開 <ChevronDown className="w-3 h-3" /></>}
                  </button>
                )}
                <button onClick={(e) => copyText(sourceName, s.id, e)} className="text-xs text-primary hover:text-primary/80 flex items-center gap-0.5 transition-colors ml-auto">
                  {isCopied ? <><Check className="w-3 h-3" /> 已複製</> : <><Copy className="w-3 h-3" /> 複製</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── Text Work Card ───
  const renderTextCard = (tw: TextWork, index: number) => {
    const isExpanded = expandedPrompts.has(tw.id);
    const isCopied = copiedId === tw.id;
    const shouldTruncate = tw.content.length > 120;
    const typeLabel = tw.type === 'ai_generation' ? 'AI 文案' : '內容重整';

    const handleDeleteTextWork = async () => {
      try {
        const table = tw.type === 'ai_generation' ? 'ai_generations' : 'content_rewrites';
        const { error } = await supabase.from(table).delete().eq('id', tw.id);
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: GALLERY_TEXT_KEY });
        queryClient.invalidateQueries({ queryKey: DASHBOARD_STATS_KEY });
        toast({ title: '已刪除' });
      } catch {
        toast({ title: '刪除失敗', variant: 'destructive' });
      }
    };

    return (
      <div key={tw.id} className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 animate-slide-up" style={{ animationDelay: `${index * 30}ms` }}>
        <div className="relative aspect-square overflow-hidden flex items-center justify-center bg-muted/30">
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Type className="w-10 h-10 text-primary" />
            </div>
            <Badge variant="secondary" className="text-xs">{typeLabel}</Badge>
          </div>
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={handleDeleteTextWork} className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-destructive/80 transition-colors" title="刪除">
              <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive-foreground" />
            </button>
          </div>
          <div className="absolute bottom-2 right-2">
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-xs font-mono">{tw.tool_type}</Badge>
          </div>
        </div>
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatDateSafe(tw.created_at)}</span>
          </div>
          <p className="text-sm font-medium text-foreground line-clamp-1">{tw.title}</p>
          {tw.content && (
            <div className="space-y-1">
              <p className={cn("text-xs text-muted-foreground leading-relaxed", !isExpanded && shouldTruncate && "line-clamp-3")}>{tw.content}</p>
              <div className="flex items-center gap-1">
                {shouldTruncate && (
                  <button onClick={(e) => togglePromptExpand(tw.id, e)} className="text-xs text-primary hover:text-primary/80 flex items-center gap-0.5 transition-colors">
                    {isExpanded ? <>收起 <ChevronUp className="w-3 h-3" /></> : <>展開 <ChevronDown className="w-3 h-3" /></>}
                  </button>
                )}
                <button onClick={(e) => copyText(tw.content, tw.id, e)} className="text-xs text-primary hover:text-primary/80 flex items-center gap-0.5 transition-colors ml-auto">
                  {isCopied ? <><Check className="w-3 h-3" /> 已複製</> : <><Copy className="w-3 h-3" /> 複製</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderEmptyState = () => {
    const config: Record<ActiveTab, { icon: React.ReactNode; label: string; cta: string; path: string }> = {
      images: { icon: <ImageIcon className="w-4 h-4" />, label: '圖像', cta: '前往圖像生成', path: '/dashboard/image-generation' },
      videos: { icon: <Video className="w-4 h-4" />, label: '視頻', cta: '前往視頻生成', path: '/dashboard/video-generation' },
      audio: { icon: <Music className="w-4 h-4" />, label: '音頻', cta: '前往語音生成', path: '/dashboard/voice-generation' },
      subtitles: { icon: <FileText className="w-4 h-4" />, label: '字幕', cta: '前往語音轉字幕', path: '/dashboard/speech-to-text' },
      text: { icon: <Type className="w-4 h-4" />, label: '文字作品', cta: '前往 AI 文案', path: '/dashboard/ai-copy-writing' },
    };
    const c = config[activeTab];
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Grid3X3 className="w-16 h-16 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">尚無{c.label}收藏</h3>
        <p className="text-muted-foreground mb-6">開始生成一些{c.label}吧</p>
        <Button onClick={() => navigate(c.path)} className="gap-2">{c.icon}{c.cta}</Button>
      </div>
    );
  };

  const renderTabLoading = () => (
    <div className="flex items-center justify-center py-24">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground">正在連線資料庫，請稍候…</p>
      </div>
    </div>
  );

  const renderTabError = (message: string, onRetry: () => void) => (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-base font-medium text-foreground">連線暫時中斷</p>
      <p className="text-sm text-muted-foreground mt-2 max-w-md">{message}</p>
      <p className="text-xs text-muted-foreground mt-1">系統將自動重試，或您可以手動重試</p>
      <Button variant="outline" className="mt-4 gap-2" onClick={onRetry}>
        <RefreshCw className="w-4 h-4" /> 重試
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">我的畫廊</h1>
        <p className="text-muted-foreground mt-1">瀏覽您生成的所有圖像、視頻、音頻、字幕和文字作品</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ActiveTab)}>
        <TabsList className="w-full max-w-full overflow-x-auto whitespace-nowrap">
          <TabsTrigger value="images" className="gap-2 shrink-0"><ImageIcon className="w-4 h-4" />圖片畫廊</TabsTrigger>
          <TabsTrigger value="videos" className="gap-2 shrink-0"><Video className="w-4 h-4" />視頻畫廊</TabsTrigger>
          <TabsTrigger value="audio" className="gap-2 shrink-0"><Music className="w-4 h-4" />音頻收藏</TabsTrigger>
          <TabsTrigger value="subtitles" className="gap-2 shrink-0"><FileText className="w-4 h-4" />字幕收藏</TabsTrigger>
          <TabsTrigger value="text" className="gap-2 shrink-0"><Type className="w-4 h-4" />文字作品</TabsTrigger>
        </TabsList>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mt-6 p-4 bg-card rounded-lg border border-border">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">開始日期</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />{startDate ? format(startDate, "yyyy-MM-dd") : "選擇開始日期"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus className="pointer-events-auto" /></PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">結束日期</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[180px] justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />{endDate ? format(endDate, "yyyy-MM-dd") : "選擇結束日期"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus className="pointer-events-auto" /></PopoverContent>
            </Popover>
          </div>
          {activeTab !== 'subtitles' && activeTab !== 'text' && (
            <Button variant={showFavoritesOnly ? "default" : "outline"} onClick={() => setShowFavoritesOnly(!showFavoritesOnly)} className="gap-2">
              <Star className={cn("w-4 h-4", showFavoritesOnly && "fill-current")} />只顯示收藏
            </Button>
          )}
          {(startDate || endDate || showFavoritesOnly) && (
            <Button variant="ghost" onClick={() => { setStartDate(undefined); setEndDate(undefined); setShowFavoritesOnly(false); }} className="gap-2 text-muted-foreground">清除篩選</Button>
          )}
        </div>

        <div className="text-sm text-muted-foreground mt-4">共 {currentCount} {countLabel}</div>

        <TabsContent value="images" className="mt-4">
          {tabErrors.images ? renderTabError(tabErrors.images, () => { void refetchImages(); })
            : tabLoading.images ? renderTabLoading() : filteredImages.length === 0 ? renderEmptyState() : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredImages.map((img, i) => renderImageCard(img, i))}
              </div>
              {totalImagePages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-6">
                  <Button variant="outline" size="sm" disabled={imagePage === 0} onClick={() => setImagePage(p => p - 1)} className="gap-1">
                    <ChevronLeft className="w-4 h-4" /> 上一頁
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    第 {imagePage + 1} / {totalImagePages} 頁
                  </span>
                  <Button variant="outline" size="sm" disabled={imagePage >= totalImagePages - 1} onClick={() => setImagePage(p => p + 1)} className="gap-1">
                    下一頁 <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="videos" className="mt-4">{renderEmptyState()}</TabsContent>

        <TabsContent value="audio" className="mt-4">
          {tabErrors.audio ? renderTabError(tabErrors.audio, () => { void refetchVoices(); })
            : tabLoading.audio ? renderTabLoading() : filteredVoices.length === 0 ? renderEmptyState() : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredVoices.map((v, i) => renderAudioCard(v, i))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="subtitles" className="mt-4">
          {tabErrors.subtitles ? renderTabError(tabErrors.subtitles, () => { void refetchSubtitles(); })
            : tabLoading.subtitles ? renderTabLoading() : filteredSubtitles.length === 0 ? renderEmptyState() : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredSubtitles.map((s, i) => renderSubtitleCard(s, i))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="text" className="mt-4">
          {tabErrors.text ? renderTabError(tabErrors.text, () => { void refetchText(); })
            : tabLoading.text ? renderTabLoading() : filteredTextWorks.length === 0 ? renderEmptyState() : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredTextWorks.map((tw, i) => renderTextCard(tw, i))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Image Lightbox */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-4xl p-0 bg-background border-border overflow-hidden">
          <DialogHeader className="sr-only"><DialogTitle>{selectedItem?.title || '媒體預覽'}</DialogTitle></DialogHeader>
          {selectedItem && (
            <div className="flex flex-col">
              <img src={selectedItem.image_url} alt={selectedItem.title || selectedItem.prompt?.substring(0, 50)} className="w-full h-auto max-h-[70vh] object-contain bg-muted" />
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-foreground font-medium text-lg flex-1 min-w-0">{selectedItem.title || selectedItem.prompt?.substring(0, 60)}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => handleDownload(selectedItem.image_url, selectedItem.title || '')} className="gap-2"><Download className="w-4 h-4" />下載</Button>
                    <Button variant="ghost" size="sm" onClick={() => toggleFavorite(selectedItem.id, selectedItem.is_favorite)}>
                      <Star className={cn("w-5 h-5", selectedItem.is_favorite ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground")} />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="text-xs">{formatDateSafe(selectedItem.created_at)}</Badge>
                  {selectedItem.aspect_ratio && <Badge variant="outline" className="text-xs font-mono">AR: {selectedItem.aspect_ratio}</Badge>}
                  <Badge variant="outline" className="text-xs font-mono">{getFileFormat(selectedItem.image_url).toUpperCase()}</Badge>
                  <Badge variant="outline" className="text-xs font-mono">{fileSizes[selectedItem.id] && fileSizes[selectedItem.id] > 0 ? formatFileSize(fileSizes[selectedItem.id]) : '計算中...'}</Badge>
                  {selectedItem.model && <Badge variant="outline" className="text-xs">{selectedItem.model}</Badge>}
                  {selectedItem.style && <Badge variant="outline" className="text-xs">{selectedItem.style}</Badge>}
                </div>
                {selectedItem.prompt && (
                  <div className="space-y-2 bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">提示詞</p>
                      <Button variant="ghost" size="sm" onClick={() => copyText(selectedItem.prompt, selectedItem.id)} className="h-7 gap-1 text-xs">
                        {copiedId === selectedItem.id ? <><Check className="w-3 h-3" /> 已複製</> : <><Copy className="w-3 h-3" /> 複製</>}
                      </Button>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{selectedItem.prompt}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GalleryPage;
