import { useState, useRef, useEffect } from 'react';
import { FileText, Upload, Image, Send, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useWordPressConnection } from '@/hooks/useWordPressConnection';
import { usePublishingHistory } from '@/hooks/usePublishingHistory';
import { useMediaFiles } from '@/hooks/useMediaFiles';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function ArticlePublisher() {
  const { connection } = useWordPressConnection();
  const { addRecord } = usePublishingHistory();
  const { files, uploadFile, getSignedUrl } = useMediaFiles();
  const { toast } = useToast();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [seoEnabled, setSeoEnabled] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const imageFiles = files.filter(f => f.file_type.startsWith('image/'));

  // Generate signed URLs for gallery images
  useEffect(() => {
    const generateUrls = async () => {
      const urls: Record<string, string> = {};
      for (const file of imageFiles) {
        const url = await getSignedUrl(file.file_path);
        if (url) {
          urls[file.file_path] = url;
        }
      }
      setSignedUrls(urls);
    };
    
    if (imageFiles.length > 0 && isGalleryOpen) {
      generateUrls();
    }
  }, [imageFiles.length, isGalleryOpen, getSignedUrl]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: '請選擇圖片文件', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    try {
      const uploaded = await uploadFile(file);
      if (uploaded) {
        const url = await getSignedUrl(uploaded.file_path);
        setSelectedImage(url);
        toast({ title: '圖片上傳成功' });
      }
    } catch (error) {
      toast({ title: '上傳失敗', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSelectFromGallery = async (filePath: string) => {
    const url = await getSignedUrl(filePath);
    setSelectedImage(url);
    setIsGalleryOpen(false);
    toast({ title: '已選擇圖片' });
  };

  const handlePublish = async () => {
    if (!connection) {
      toast({ title: '請先設定 WordPress 連接', variant: 'destructive' });
      return;
    }

    if (!title || !content) {
      toast({ title: '請填寫標題和內容', variant: 'destructive' });
      return;
    }

    setIsPublishing(true);
    try {
      // Publish via secure edge function - credentials handled server-side
      const { data, error } = await supabase.functions.invoke('wordpress-publish', {
        body: {
          title,
          content,
          status: 'publish',
          imageUrl: selectedImage,
          seoEnabled,
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        toast({ title: '發佈失敗', description: '無法連接到發佈服務', variant: 'destructive' });
        return;
      }

      if (data?.success) {
        // Add to publishing history
        await addRecord({
          title,
          content,
          platform: 'wordpress',
          status: 'published',
          published_url: data.link || null,
          image_url: selectedImage,
        });

        toast({ title: '發佈成功！', description: '文章已發佈到 WordPress' });
        
        // Reset form
        setTitle('');
        setContent('');
        setSelectedImage(null);
        setSeoEnabled(false);
      } else {
        toast({ 
          title: '發佈失敗', 
          description: data?.error || '無法發佈到 WordPress',
          variant: 'destructive' 
        });
      }
    } catch (error) {
      console.error('Error publishing to WordPress:', error);
      toast({ title: '發佈失敗', description: '連接 WordPress 時出錯', variant: 'destructive' });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            文章內容
          </CardTitle>
          <CardDescription>建立您要發布的文章</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="article-title">文章標題</Label>
            <Input
              id="article-title"
              placeholder="輸入文章標題"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="article-content">文章內容</Label>
            <Textarea
              id="article-content"
              placeholder="輸入文章內容..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">SEO優化</span>
            </div>
            <Switch
              checked={seoEnabled}
              onCheckedChange={setSeoEnabled}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              上傳圖片
            </Label>
            <p className="text-xs text-muted-foreground">
              選擇一張圖片上傳到 WordPress
            </p>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setIsGalleryOpen(true)}
                className="flex-1"
              >
                從圖庫選擇
              </Button>
            </div>

            {/* Drag-drop upload area */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
            >
              {isUploading ? (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>上傳中...</span>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  點擊選擇圖片或拖放圖片到此處
                </p>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {selectedImage && (
              <div className="relative mt-3">
                <img
                  src={selectedImage}
                  alt="Selected"
                  className="w-full h-40 object-cover rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => setSelectedImage(null)}
                >
                  移除
                </Button>
              </div>
            )}
          </div>

          <Button
            onClick={handlePublish}
            disabled={isPublishing || !connection || !title || !content}
            className="w-full"
            size="lg"
          >
            {isPublishing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                發佈中...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                發佈到 WordPress
              </>
            )}
          </Button>

          {!connection && (
            <p className="text-xs text-center text-muted-foreground">
              請先在上方設定 WordPress 連接
            </p>
          )}
        </CardContent>
      </Card>

      {/* Gallery Dialog */}
      <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
        <DialogContent className="max-w-2xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>從圖庫選擇</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
            {imageFiles.length === 0 ? (
              <div className="col-span-3 py-8 text-center text-muted-foreground">
                圖庫中沒有圖片
              </div>
            ) : (
              imageFiles.map((file) => {
                const url = signedUrls[file.file_path];
                return (
                  <button
                    key={file.id}
                    onClick={() => handleSelectFromGallery(file.file_path)}
                    className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-colors"
                  >
                    {url ? (
                      <img
                        src={url}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
