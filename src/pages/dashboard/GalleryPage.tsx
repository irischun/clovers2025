import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Star, Youtube, Grid3X3, ImageIcon, Video, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface GalleryItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  title: string;
  createdAt: Date;
  isFavorite: boolean;
  isYouTube?: boolean;
}

const GalleryPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'images' | 'videos'>('images');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showYouTube, setShowYouTube] = useState(true);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  // Mock data - will be replaced with actual data from database
  const [galleryItems] = useState<GalleryItem[]>([]);

  // Filter items based on current filters
  const filteredItems = galleryItems.filter(item => {
    // Filter by type
    if (activeTab === 'images' && item.type !== 'image') return false;
    if (activeTab === 'videos' && item.type !== 'video') return false;

    // Filter by date range
    if (startDate && item.createdAt < startDate) return false;
    if (endDate && item.createdAt > endDate) return false;

    // Filter by favorites
    if (showFavoritesOnly && !item.isFavorite) return false;

    // Filter YouTube videos
    if (!showYouTube && item.isYouTube) return false;

    return true;
  });

  const imageCount = filteredItems.filter(item => item.type === 'image').length;
  const videoCount = filteredItems.filter(item => item.type === 'video').length;

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
          {item.isFavorite && (
            <div className="absolute top-2 left-2">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-xs text-foreground truncate">{item.title}</p>
          </div>
        </div>
      ))}
    </div>
  );

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

          {/* Favorites Toggle */}
          <Toggle
            pressed={showFavoritesOnly}
            onPressedChange={setShowFavoritesOnly}
            variant="outline"
            className="gap-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            <Star className="w-4 h-4" />
            只顯示收藏
          </Toggle>

          {/* YouTube Toggle (only for videos) */}
          {activeTab === 'videos' && (
            <Toggle
              pressed={showYouTube}
              onPressedChange={setShowYouTube}
              variant="outline"
              className="gap-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              <Youtube className="w-4 h-4" />
              顯示YouTube
            </Toggle>
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
                <p className="text-foreground font-medium">{selectedItem.title}</p>
                {selectedItem.isFavorite && (
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
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
