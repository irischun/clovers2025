import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Star, Youtube, Grid3X3, ImageIcon, Video, Filter, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useGeneratedImages, GeneratedImage } from '@/hooks/useGeneratedImages';
import { useToast } from '@/hooks/use-toast';

interface GalleryItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  title: string;
  createdAt: Date;
  isFavorite: boolean;
  isYouTube?: boolean;
  prompt?: string;
}

const GalleryPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { images: generatedImages, loading, toggleFavorite, deleteImage } = useGeneratedImages();
  
  const [activeTab, setActiveTab] = useState<'images' | 'videos'>('images');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showYouTube, setShowYouTube] = useState(true);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  // Convert generated images to gallery items
  const galleryItems: GalleryItem[] = generatedImages.map(img => ({
    id: img.id,
    type: 'image' as const,
    url: img.image_url,
    title: img.title || img.prompt.substring(0, 50) + (img.prompt.length > 50 ? '...' : ''),
    createdAt: new Date(img.created_at),
    isFavorite: img.is_favorite,
    prompt: img.prompt,
  }));

  // Filter items based on current filters
  const filteredItems = galleryItems.filter(item => {
    // Filter by type
    if (activeTab === 'images' && item.type !== 'image') return false;
    if (activeTab === 'videos' && item.type !== 'video') return false;

    // Filter by date range
    if (startDate && item.createdAt < startDate) return false;
    if (endDate) {
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      if (item.createdAt > endOfDay) return false;
    }

    // Filter by favorites
    if (showFavoritesOnly && !item.isFavorite) return false;

    // Filter YouTube videos
    if (!showYouTube && item.isYouTube) return false;

    return true;
  });

  const imageCount = filteredItems.filter(item => item.type === 'image').length;
  const videoCount = filteredItems.filter(item => item.type === 'video').length;

  const handleToggleFavorite = async (id: string, isFavorite: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleFavorite(id, isFavorite);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteImage(id);
    if (selectedItem?.id === id) {
      setSelectedItem(null);
    }
  };

  const handleDownload = async (url: string, title: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = `clovers-${title.substring(0, 30)}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: '下載開始' });
    } catch (error) {
      toast({ title: '下載失敗', variant: 'destructive' });
    }
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
          <>
            <ImageIcon className="w-4 h-4" />
            前往圖像生成
          </>
        ) : (
          <>
            <Video className="w-4 h-4" />
            前往視頻生成
          </>
        )}
      </Button>
    </div>
  );

  const renderGalleryGrid = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {filteredItems.map((item) => (
        <div
          key={item.id}
          className="group relative aspect-square rounded-lg overflow-hidden bg-card border border-border cursor-pointer hover:border-primary/50 transition-all"
          onClick={() => setSelectedItem(item)}
        >
          {item.type === 'image' ? (
            <img
              src={item.url}
              alt={item.title}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="relative w-full h-full">
              <img
                src={item.thumbnail || item.url}
                alt={item.title}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-background/30">
                <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center">
                  <Video className="w-6 h-6 text-primary-foreground" />
                </div>
              </div>
              {item.isYouTube && (
                <div className="absolute top-2 right-2 bg-red-600 rounded px-1.5 py-0.5">
                  <Youtube className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          )}
          
          {/* Favorite button */}
          <button
            onClick={(e) => handleToggleFavorite(item.id, item.isFavorite, e)}
            className="absolute top-2 left-2 p-1 rounded-full bg-background/80 hover:bg-background transition-colors"
          >
            <Star className={cn("w-4 h-4", item.isFavorite ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground")} />
          </button>
          
          {/* Action buttons on hover */}
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => handleDownload(item.url, item.title, e)}
              className="p-1 rounded-full bg-background/80 hover:bg-background transition-colors"
            >
              <Download className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={(e) => handleDelete(item.id, e)}
              className="p-1 rounded-full bg-background/80 hover:bg-destructive/80 transition-colors"
            >
              <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive-foreground" />
            </button>
          </div>
          
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-xs text-foreground truncate">{item.title}</p>
          </div>
        </div>
      ))}
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">我的畫廊</h1>
          <p className="text-muted-foreground mt-1">瀏覽您生成的所有圖像和視頻</p>
        </div>
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
                  className={cn(
                    "w-[180px] justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "yyyy-MM-dd") : "選擇開始日期"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                  className="pointer-events-auto"
                />
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
                  className={cn(
                    "w-[180px] justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "yyyy-MM-dd") : "選擇結束日期"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Favorites Toggle Button */}
          <Button
            variant={showFavoritesOnly ? "default" : "outline"}
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className="gap-2"
          >
            <Star className={cn("w-4 h-4", showFavoritesOnly && "fill-current")} />
            {showFavoritesOnly ? '只顯示收藏' : '全部'}
          </Button>

          {/* Clear filters */}
          {(startDate || endDate || showFavoritesOnly) && (
            <Button
              variant="ghost"
              onClick={() => {
                setStartDate(undefined);
                setEndDate(undefined);
                setShowFavoritesOnly(false);
              }}
              className="gap-2 text-muted-foreground"
            >
              清除篩選
            </Button>
          )}
        </div>

        {/* Count */}
        <div className="text-sm text-muted-foreground mt-4">
          共 {activeTab === 'images' ? imageCount : videoCount} {activeTab === 'images' ? '張圖片' : '個視頻'}
        </div>

        {/* Gallery Content */}
        <TabsContent value="images" className="mt-4">
          {filteredItems.filter(i => i.type === 'image').length === 0 
            ? renderEmptyState() 
            : renderGalleryGrid()}
        </TabsContent>

        <TabsContent value="videos" className="mt-4">
          {filteredItems.filter(i => i.type === 'video').length === 0 
            ? renderEmptyState() 
            : renderGalleryGrid()}
        </TabsContent>
      </Tabs>

      {/* Lightbox */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-4xl p-2 bg-background border-border">
          <DialogHeader className="sr-only">
            <DialogTitle>{selectedItem?.title || '媒體預覽'}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-3">
              {selectedItem.type === 'image' ? (
                <img
                  src={selectedItem.url}
                  alt={selectedItem.title}
                  className="w-full h-auto rounded-lg"
                />
              ) : (
                <video
                  src={selectedItem.url}
                  controls
                  className="w-full h-auto rounded-lg"
                />
              )}
              <div className="flex items-center justify-between px-4 pb-2">
                <div className="flex-1">
                  <p className="text-foreground font-medium">{selectedItem.title}</p>
                  {selectedItem.prompt && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{selectedItem.prompt}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(selectedItem.url, selectedItem.title)}
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    下載
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFavorite(selectedItem.id, selectedItem.isFavorite)}
                  >
                    <Star className={cn("w-5 h-5", selectedItem.isFavorite ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground")} />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GalleryPage;
