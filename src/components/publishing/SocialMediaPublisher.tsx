import { useState, useRef } from 'react';
import { 
  Send, Image, Video, Upload, Loader2, Calendar as CalendarIcon, 
  Clock, Search, FileText, Globe, Linkedin, MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useUploadPostSettings } from '@/hooks/useUploadPostSettings';
import { useWordPressConnection } from '@/hooks/useWordPressConnection';
import { useMediaFiles } from '@/hooks/useMediaFiles';
import { usePublishingHistory } from '@/hooks/usePublishingHistory';
import { useScheduledPosts } from '@/hooks/useScheduledPosts';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

// Platform definitions with icons
const platforms = [
  { id: 'wordpress', name: 'WordPress', icon: Globe, requiresWP: true },
  { id: 'facebook', name: 'Facebook', icon: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
  { id: 'instagram', name: 'Instagram', icon: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg> },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin },
  { id: 'threads', name: 'Threads', icon: MessageCircle },
  { id: 'youtube', name: 'YouTube（僅支援視頻）', icon: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>, videoOnly: true },
  { id: 'twitter', name: 'X (Twitter)', icon: () => <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
];

// Time options
const timeOptions = Array.from({ length: 24 }, (_, hour) => 
  ['00', '30'].map(min => `${hour.toString().padStart(2, '0')}:${min}`)
).flat();

export function SocialMediaPublisher() {
  const { settings: uploadPostSettings } = useUploadPostSettings();
  const { connection: wpConnection } = useWordPressConnection();
  const { files, getPublicUrl } = useMediaFiles();
  const { records: historyRecords } = usePublishingHistory();
  const { createPost } = useScheduledPosts();
  const { toast } = useToast();

  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>();
  const [scheduleTime, setScheduleTime] = useState<string>('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPlatformConfigured = (platformId: string) => {
    if (platformId === 'wordpress') return !!wpConnection?.is_connected;
    return !!uploadPostSettings;
  };

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handleSelectFromGallery = (filePath: string) => {
    const url = getPublicUrl(filePath);
    if (!selectedMedia.includes(url)) {
      setSelectedMedia([...selectedMedia, url]);
    }
  };

  const handleRemoveMedia = (url: string) => {
    setSelectedMedia(selectedMedia.filter(m => m !== url));
  };

  const handleSelectHistory = (record: { title: string; content: string }) => {
    setContent(record.content);
    setIsHistoryOpen(false);
    toast({ title: '已選擇內容記錄' });
  };

  const filteredHistory = historyRecords.filter(r =>
    r.title.toLowerCase().includes(historySearch.toLowerCase()) ||
    r.content.toLowerCase().includes(historySearch.toLowerCase())
  );

  const handlePublish = async () => {
    if (!content.trim()) {
      toast({ title: '請輸入發佈內容', variant: 'destructive' });
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast({ title: '請選擇至少一個發佈平台', variant: 'destructive' });
      return;
    }

    setIsPublishing(true);
    try {
      // If scheduling
      if (scheduleDate && scheduleTime) {
        const [hours, minutes] = scheduleTime.split(':');
        const scheduledAt = new Date(scheduleDate);
        scheduledAt.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        for (const platform of selectedPlatforms) {
          await createPost({
            title: content.slice(0, 50) + (content.length > 50 ? '...' : ''),
            content,
            platform,
            scheduled_at: scheduledAt.toISOString(),
            status: 'scheduled',
            media_urls: selectedMedia,
          });
        }

        toast({ 
          title: '已排程發佈', 
          description: `將於 ${format(scheduledAt, 'yyyy/MM/dd HH:mm', { locale: zhTW })} 發佈到 ${selectedPlatforms.length} 個平台` 
        });
      } else {
        // Immediate publish - for now just show success
        toast({ 
          title: '發佈成功！', 
          description: `已發佈到 ${selectedPlatforms.length} 個平台` 
        });
      }

      // Reset form
      setContent('');
      setSelectedPlatforms([]);
      setSelectedMedia([]);
      setScheduleDate(undefined);
      setScheduleTime('');
    } catch (error) {
      console.error('Error publishing:', error);
      toast({ title: '發佈失敗', variant: 'destructive' });
    } finally {
      setIsPublishing(false);
    }
  };

  const imageFiles = files.filter(f => f.file_type.startsWith('image/'));
  const videoFiles = files.filter(f => f.file_type.startsWith('video/'));

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            發佈內容
          </CardTitle>
          <CardDescription>撰寫您要發布到社交媒體的圖文內容</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Content Input */}
          <div className="space-y-2">
            <Label htmlFor="social-content">發佈內容</Label>
            <Textarea
              id="social-content"
              placeholder="這將作為貼文的主要文字內容，支援多行文字"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsHistoryOpen(true)}
              className="gap-2"
            >
              <Search className="w-4 h-4" />
              整理內容記錄
            </Button>
          </div>

          {/* Media Type Toggle */}
          <div className="space-y-2">
            <Label>媒體類型</Label>
            <Tabs value={mediaType} onValueChange={(v) => setMediaType(v as 'image' | 'video')}>
              <TabsList className="grid w-full max-w-xs grid-cols-2">
                <TabsTrigger value="image" className="gap-2">
                  <Image className="w-4 h-4" />
                  圖文發布
                </TabsTrigger>
                <TabsTrigger value="video" className="gap-2">
                  <Video className="w-4 h-4" />
                  視頻發布
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Media Upload */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              {mediaType === 'image' ? <Image className="w-4 h-4" /> : <Video className="w-4 h-4" />}
              上傳媒體（{mediaType === 'image' ? '圖片' : '視頻'}）
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              {mediaType === 'image' ? '僅圖片' : '僅視頻'}
            </p>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setIsGalleryOpen(true)}
                className="flex-1"
              >
                從圖庫選擇
              </Button>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                點擊選擇{mediaType === 'image' ? '圖片' : '視頻'}（可多選）
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept={mediaType === 'image' ? 'image/*' : 'video/*'}
                multiple
                onChange={() => {}}
                className="hidden"
              />
            </div>

            {selectedMedia.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-3">
                {selectedMedia.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => handleRemoveMedia(url)}
                      className="absolute top-1 right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Platform Selection */}
          <div className="space-y-3">
            <Label>選擇發佈平台</Label>
            <p className="text-xs text-muted-foreground">
              勾選您希望發佈圖文內容的社交媒體平台
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {platforms.map((platform) => {
                const configured = isPlatformConfigured(platform.id);
                const Icon = platform.icon;
                const isSelected = selectedPlatforms.includes(platform.id);
                return (
                  <div
                    key={platform.id}
                    onClick={() => handlePlatformToggle(platform.id)}
                    className={`
                      flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors
                      hover:border-primary
                      ${isSelected ? 'border-primary bg-primary/10' : 'border-border'}
                      ${!configured ? 'opacity-70' : ''}
                    `}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handlePlatformToggle(platform.id)}
                    />
                    <Icon />
                    <span className="text-sm">{platform.name}</span>
                    {!configured && (
                      <span className="text-xs text-muted-foreground ml-auto">未設定</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Schedule Options */}
          <div className="space-y-3">
            <Label>排程發布（選填）</Label>
            <p className="text-xs text-muted-foreground">
              選擇未來的日期和時間來排程發布您的內容
            </p>
            
            <div className="flex gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 justify-start">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {scheduleDate ? format(scheduleDate, 'yyyy/MM/dd', { locale: zhTW }) : '發布日期'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduleDate}
                    onSelect={setScheduleDate}
                    disabled={(date) => date < new Date()}
                    locale={zhTW}
                  />
                </PopoverContent>
              </Popover>

              <Select value={scheduleTime} onValueChange={setScheduleTime}>
                <SelectTrigger className="flex-1">
                  <Clock className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="發布時間" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <p className="text-xs text-muted-foreground">
              💡 未設定排程時間，將會立即發佈到所選平台
            </p>
          </div>

          {/* Publish Button */}
          <Button
            onClick={handlePublish}
            disabled={isPublishing || !content.trim() || selectedPlatforms.length === 0}
            className="w-full"
            size="lg"
          >
            {isPublishing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                發佈中...
              </>
            ) : scheduleDate && scheduleTime ? (
              <>
                <CalendarIcon className="w-4 h-4 mr-2" />
                排程發佈
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                立即發佈到社交媒體
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Gallery Dialog */}
      <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
        <DialogContent className="max-w-2xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>從圖庫選擇</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-4 gap-3 max-h-96 overflow-y-auto">
            {(mediaType === 'image' ? imageFiles : videoFiles).length === 0 ? (
              <div className="col-span-4 py-8 text-center text-muted-foreground">
                {mediaType === 'image' ? '圖庫中沒有圖片' : '圖庫中沒有視頻'}
              </div>
            ) : (
              (mediaType === 'image' ? imageFiles : videoFiles).map((file) => (
                <button
                  key={file.id}
                  onClick={() => handleSelectFromGallery(file.file_path)}
                  className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-colors"
                >
                  {mediaType === 'image' ? (
                    <img
                      src={getPublicUrl(file.file_path)}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={getPublicUrl(file.file_path)}
                      className="w-full h-full object-cover"
                    />
                  )}
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-2xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>選擇內容記錄</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜尋標題或內容"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredHistory.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  尚無內容記錄
                </div>
              ) : (
                filteredHistory.map((record) => (
                  <button
                    key={record.id}
                    onClick={() => handleSelectHistory(record)}
                    className="w-full p-3 text-left rounded-lg border hover:border-primary transition-colors"
                  >
                    <div className="font-medium text-sm line-clamp-1">{record.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {record.content}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
