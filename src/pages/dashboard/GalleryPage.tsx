import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Star, Grid3X3, ImageIcon, Video, Filter, Trash2, Download, Copy, Check, ChevronDown, ChevronUp, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useGeneratedImages, GeneratedImage } from '@/hooks/useGeneratedImages';
import { useToast } from '@/hooks/use-toast';

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const GalleryPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { images: generatedImages, loading, toggleFavorite, deleteImage } = useGeneratedImages();

  const [activeTab, setActiveTab] = useState<'images' | 'videos'>('images');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GeneratedImage | null>(null);
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [fileSizes, setFileSizes] = useState<Record<string, number>>({});

  // Fetch file sizes using Image + Canvas to avoid CORS issues
  useEffect(() => {
    if (generatedImages.length === 0) return;

    generatedImages.forEach((img) => {
      if (fileSizes[img.id]) return; // already measured

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
            if (blob) {
              setFileSizes(prev => ({ ...prev, [img.id]: blob.size }));
            }
          }, 'image/png');
        } catch {
          // Canvas tainted by CORS - estimate from dimensions
          const estimatedSize = image.naturalWidth * image.naturalHeight * 4; // raw RGBA
          const compressedEstimate = Math.round(estimatedSize * 0.15); // ~15% for PNG compression
          setFileSizes(prev => ({ ...prev, [img.id]: compressedEstimate }));
        }
      };
      image.onerror = () => {
        // Can't load cross-origin - estimate from URL patterns
        setFileSizes(prev => ({ ...prev, [img.id]: -1 })); // -1 = unknown
      };
      image.src = img.image_url;
    });
  }, [generatedImages]);
  // Filter images
  const filteredImages = generatedImages.filter(img => {
    const createdAt = new Date(img.created_at);
    if (startDate && createdAt < startDate) return false;
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      if (createdAt > endOfDay) return false;
    }
    if (showFavoritesOnly && !img.is_favorite) return false;
    return true;
  });

  const togglePromptExpand = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedPrompts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyPrompt = async (prompt: string, id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiedId(id);
      toast({ title: '已複製提示詞' });
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
      link.download = `clovers-${(title || 'image').substring(0, 30)}-${Date.now()}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast({ title: '下載開始' });
    } catch {
      // Fallback
      const link = document.createElement('a');
      link.href = url;
      link.download = `clovers-${Date.now()}.png`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getFileFormat = (url: string): string => {
    const lower = url.toLowerCase();
    if (lower.includes('.webp')) return 'webp';
    if (lower.includes('.jpg') || lower.includes('.jpeg')) return 'jpg';
    if (lower.includes('.gif')) return 'gif';
    if (lower.includes('.svg')) return 'svg';
    return 'png';
  };

  const getFileFormatLabel = (url: string): string => {
    return getFileFormat(url).toUpperCase();
  };

  const renderImageCard = (img: GeneratedImage, index: number) => {
    const isExpanded = expandedPrompts.has(img.id);
    const isCopied = copiedId === img.id;
    const promptText = img.prompt || '';
    const shouldTruncate = promptText.length > 80;

    return (
      <div
        key={img.id}
        className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 animate-slide-up"
        style={{ animationDelay: `${index * 30}ms` }}
      >
        {/* Image */}
        <div
          className="relative aspect-square overflow-hidden cursor-pointer"
          onClick={() => setSelectedItem(img)}
        >
          <img
            src={img.image_url}
            alt={img.title || img.prompt?.substring(0, 50)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {/* Favorite button */}
          <button
            onClick={(e) => { e.stopPropagation(); toggleFavorite(img.id, img.is_favorite); }}
            className="absolute top-2 left-2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
          >
            <Star className={cn("w-4 h-4", img.is_favorite ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground")} />
          </button>

          {/* Hover actions */}
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => handleDownload(img.image_url, img.title || '', e)}
              className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
              title="下載"
            >
              <Download className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedItem(img); }}
              className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
              title="放大"
            >
              <Maximize2 className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); deleteImage(img.id); }}
              className="p-1.5 rounded-full bg-background/80 backdrop-blur-sm hover:bg-destructive/80 transition-colors"
              title="刪除"
            >
              <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive-foreground" />
            </button>
          </div>

          {/* AR Badge */}
          {img.aspect_ratio && (
            <div className="absolute bottom-2 left-2">
              <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-xs font-mono">
                {img.aspect_ratio}
              </Badge>
            </div>
          )}

          {/* Format Badge */}
          <div className="absolute bottom-2 right-2">
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-xs font-mono">
              {getFileFormatLabel(img.image_url)}
            </Badge>
          </div>
        </div>

        {/* Metadata Section */}
        <div className="p-3 space-y-2">
          {/* Date & Model Row */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{format(new Date(img.created_at), 'yyyy-MM-dd HH:mm')}</span>
            {img.model && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {img.model}
              </Badge>
            )}
          </div>

          {/* File Size */}
          {fileSizes[img.id] ? (
            <div className="text-xs text-muted-foreground">
              檔案大小: <span className="text-foreground">{formatFileSize(fileSizes[img.id])}</span>
            </div>
          ) : null}
          {img.style && (
            <div className="text-xs text-muted-foreground">
              風格: <span className="text-foreground">{img.style}</span>
            </div>
          )}

          {/* Prompt Section */}
          {promptText && (
            <div className="space-y-1">
              <p className={cn(
                "text-xs text-muted-foreground leading-relaxed",
                !isExpanded && shouldTruncate && "line-clamp-2"
              )}>
                {promptText}
              </p>
              <div className="flex items-center gap-1">
                {shouldTruncate && (
                  <button
                    onClick={(e) => togglePromptExpand(img.id, e)}
                    className="text-xs text-primary hover:text-primary/80 flex items-center gap-0.5 transition-colors"
                  >
                    {isExpanded ? (
                      <>收起 <ChevronUp className="w-3 h-3" /></>
                    ) : (
                      <>展開 <ChevronDown className="w-3 h-3" /></>
                    )}
                  </button>
                )}
                <button
                  onClick={(e) => copyPrompt(promptText, img.id, e)}
                  className="text-xs text-primary hover:text-primary/80 flex items-center gap-0.5 transition-colors ml-auto"
                >
                  {isCopied ? (
                    <><Check className="w-3 h-3" /> 已複製</>
                  ) : (
                    <><Copy className="w-3 h-3" /> 複製</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Grid3X3 className="w-16 h-16 text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-medium text-muted-foreground mb-2">畫廊為空</h3>
      <p className="text-muted-foreground mb-6">
        {activeTab === 'images' ? '開始生成一些圖像吧' : '開始生成一些視頻吧'}
      </p>
      <Button
        onClick={() => navigate(activeTab === 'images' ? '/dashboard/image-generation' : '/dashboard/video-generation')}
        className="gap-2"
      >
        {activeTab === 'images' ? (
          <><ImageIcon className="w-4 h-4" />前往圖像生成</>
        ) : (
          <><Video className="w-4 h-4" />前往視頻生成</>
        )}
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">我的畫廊</h1>
        <p className="text-muted-foreground mt-1">瀏覽您生成的所有圖像和視頻</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'images' | 'videos')}>
        <TabsList className="w-full max-w-md">
          <TabsTrigger value="images" className="flex-1 gap-2">
            <ImageIcon className="w-4 h-4" />
            圖片畫廊
          </TabsTrigger>
          <TabsTrigger value="videos" className="flex-1 gap-2">
            <Video className="w-4 h-4" />
            視頻畫廊
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mt-6 p-4 bg-card rounded-lg border border-border">
          <Filter className="w-5 h-5 text-muted-foreground" />

          {/* Start Date */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">開始日期</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-[180px] justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "yyyy-MM-dd") : "選擇開始日期"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus className="pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>

          {/* End Date */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">結束日期</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-[180px] justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "yyyy-MM-dd") : "選擇結束日期"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus className="pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>

          {/* Favorites Toggle */}
          <Button
            variant={showFavoritesOnly ? "default" : "outline"}
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className="gap-2"
          >
            <Star className={cn("w-4 h-4", showFavoritesOnly && "fill-current")} />
            只顯示收藏
          </Button>

          {/* Clear filters */}
          {(startDate || endDate || showFavoritesOnly) && (
            <Button
              variant="ghost"
              onClick={() => { setStartDate(undefined); setEndDate(undefined); setShowFavoritesOnly(false); }}
              className="gap-2 text-muted-foreground"
            >
              清除篩選
            </Button>
          )}
        </div>

        {/* Count */}
        <div className="text-sm text-muted-foreground mt-4">
          共 {filteredImages.length} 張圖片
        </div>

        {/* Gallery Content */}
        <TabsContent value="images" className="mt-4">
          {filteredImages.length === 0
            ? renderEmptyState()
            : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredImages.map((img, index) => renderImageCard(img, index))}
              </div>
            )}
        </TabsContent>

        <TabsContent value="videos" className="mt-4">
          {renderEmptyState()}
        </TabsContent>
      </Tabs>

      {/* Lightbox Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-4xl p-0 bg-background border-border overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>{selectedItem?.title || '媒體預覽'}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="flex flex-col">
              <img
                src={selectedItem.image_url}
                alt={selectedItem.title || selectedItem.prompt?.substring(0, 50)}
                className="w-full h-auto max-h-[70vh] object-contain bg-muted"
              />
              <div className="p-5 space-y-4">
                {/* Title & Actions */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-medium text-lg">
                      {selectedItem.title || selectedItem.prompt?.substring(0, 60)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(selectedItem.image_url, selectedItem.title || '')}
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      下載
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFavorite(selectedItem.id, selectedItem.is_favorite)}
                    >
                      <Star className={cn("w-5 h-5", selectedItem.is_favorite ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground")} />
                    </Button>
                  </div>
                </div>

                {/* Metadata Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {format(new Date(selectedItem.created_at), 'yyyy-MM-dd HH:mm')}
                  </Badge>
                  {selectedItem.aspect_ratio && (
                    <Badge variant="outline" className="text-xs font-mono">
                      AR: {selectedItem.aspect_ratio}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs font-mono">
                    {getFileFormatLabel(selectedItem.image_url)}
                  </Badge>
                  {fileSizes[selectedItem.id] ? (
                    <Badge variant="outline" className="text-xs font-mono">
                      {formatFileSize(fileSizes[selectedItem.id])}
                    </Badge>
                  ) : null}
                  {selectedItem.model && (
                    <Badge variant="outline" className="text-xs">
                      {selectedItem.model}
                    </Badge>
                  )}
                  {selectedItem.style && (
                    <Badge variant="outline" className="text-xs">
                      {selectedItem.style}
                    </Badge>
                  )}
                </div>

                {/* Prompt */}
                {selectedItem.prompt && (
                  <div className="space-y-2 bg-muted/50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">提示詞</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyPrompt(selectedItem.prompt, selectedItem.id)}
                        className="h-7 gap-1 text-xs"
                      >
                        {copiedId === selectedItem.id ? (
                          <><Check className="w-3 h-3" /> 已複製</>
                        ) : (
                          <><Copy className="w-3 h-3" /> 複製</>
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                      {selectedItem.prompt}
                    </p>
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
