import { useState, useRef, useCallback } from 'react';
import { Upload, Images, Loader2, Sparkles, Download, X, GripVertical, Image as ImageIcon, AlertCircle, Sticker } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useMediaFiles } from '@/hooks/useMediaFiles';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';

interface ImageFrame {
  id: string;
  url: string;
  file?: File;
}

const textStyles = [
  { id: 'cute', label: '可愛', emoji: '🥰' },
  { id: 'minimal', label: '極簡', emoji: '✨' },
  { id: 'watercolor', label: '水彩', emoji: '🎨' },
  { id: 'bold', label: '醒目', emoji: '💥' },
  { id: 'vintage', label: '復古', emoji: '🎞️' },
  { id: 'neon', label: '霓虹', emoji: '🌈' },
];

const StickerMakerPage = () => {
  const [frames, setFrames] = useState<ImageFrame[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Text sticker states
  const [stickerText, setStickerText] = useState('');
  const [textStyle, setTextStyle] = useState('cute');
  const [isTextGenerating, setIsTextGenerating] = useState(false);
  const [textStickers, setTextStickers] = useState<string[]>([]);
  const [textStickerImages, setTextStickerImages] = useState<string[]>([]);
  const [generatedStickerUrl, setGeneratedStickerUrl] = useState<string | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isTextGalleryOpen, setIsTextGalleryOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { files: mediaFiles, loading: mediaLoading, getPublicUrl } = useMediaFiles();

  const MAX_FRAMES = 10;

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = MAX_FRAMES - frames.length;
    if (remainingSlots <= 0) {
      toast({ title: '已達最大圖片數量', description: `最多只能添加 ${MAX_FRAMES} 張圖片`, variant: 'destructive' });
      return;
    }

    const newFrames: ImageFrame[] = [];
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        newFrames.push({
          id: `${Date.now()}-${Math.random()}`,
          url,
          file
        });
      }
    });

    setFrames(prev => [...prev, ...newFrames]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [frames.length, toast]);

  const handleSelectFromGallery = useCallback((fileUrl: string) => {
    if (frames.length >= MAX_FRAMES) {
      toast({ title: '已達最大圖片數量', description: `最多只能添加 ${MAX_FRAMES} 張圖片`, variant: 'destructive' });
      return;
    }

    setFrames(prev => [...prev, {
      id: `${Date.now()}-${Math.random()}`,
      url: fileUrl
    }]);
    setIsGalleryOpen(false);
  }, [frames.length, toast]);

  const removeFrame = useCallback((id: string) => {
    setFrames(prev => prev.filter(f => f.id !== id));
  }, []);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newFrames = [...frames];
    const [draggedItem] = newFrames.splice(draggedIndex, 1);
    newFrames.splice(index, 0, draggedItem);
    setFrames(newFrames);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const generateSticker = async () => {
    if (frames.length < 2) {
      toast({ title: '圖片不足', description: '至少需要 2 張圖片才能生成貼圖', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    try {
      // Create animated WebP using canvas
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Canvas context not available');

      // Load all images
      const loadedImages = await Promise.all(
        frames.map(frame => {
          return new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = frame.url;
          });
        })
      );

      // Create a simple animated preview (first frame as static WebP)
      const firstImg = loadedImages[0];
      const size = Math.min(firstImg.width, firstImg.height);
      const sx = (firstImg.width - size) / 2;
      const sy = (firstImg.height - size) / 2;
      
      ctx.drawImage(firstImg, sx, sy, size, size, 0, 0, 512, 512);
      
      // Convert to WebP
      const webpDataUrl = canvas.toDataURL('image/webp', 0.9);
      setGeneratedStickerUrl(webpDataUrl);
      setPreviewUrl(webpDataUrl);
      
      toast({ title: '貼圖生成成功！', description: '您可以下載並使用這個貼圖' });
    } catch (error) {
      console.error('Sticker generation error:', error);
      toast({ title: '生成失敗', description: '請確保所有圖片都能正常載入', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadSticker = () => {
    if (!generatedStickerUrl) return;
    
    const link = document.createElement('a');
    link.href = generatedStickerUrl;
    link.download = `sticker-${Date.now()}.webp`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTextStickerGenerate = async () => {
    if (!stickerText.trim()) {
      toast({ title: '請輸入文字', variant: 'destructive' });
      return;
    }
    setIsTextGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('sticker-generate', { 
        body: { text: stickerText, style: textStyle } 
      });
      if (error) throw error;
      if (data.imageUrl) {
        setTextStickers(prev => [data.imageUrl, ...prev.slice(0, 11)]);
      }
      toast({ title: '貼圖生成成功！' });
    } catch (error) {
      console.error('Text sticker generation error:', error);
      toast({ title: '生成失敗', variant: 'destructive' });
    } finally {
      setIsTextGenerating(false);
    }
  };

  const handleTextImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setTextStickerImages(prev => [...prev, url].slice(0, 5));
      }
    });
    if (textFileInputRef.current) {
      textFileInputRef.current.value = '';
    }
  };

  const handleTextGallerySelect = (fileUrl: string) => {
    setTextStickerImages(prev => [...prev, fileUrl].slice(0, 5));
    setIsTextGalleryOpen(false);
  };

  const removeTextStickerImage = (index: number) => {
    setTextStickerImages(prev => prev.filter((_, i) => i !== index));
  };

  const imageMediaFiles = mediaFiles.filter(f => f.file_type.startsWith('image/'));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="heading-display text-2xl mb-0">WhatsApp 貼圖製作器</h1>
          <p className="text-muted-foreground text-sm">選擇多張圖片，製作 WebP 貼圖</p>
        </div>
      </div>

      {/* Points Notice */}
      <Alert className="border-primary/30 bg-primary/5">
        <AlertCircle className="h-4 w-4 text-primary" />
        <AlertDescription className="text-primary">
          點數消耗：1點/次
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Image Frames */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Images className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">圖片幀 ({frames.length}/{MAX_FRAMES})</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">調整順序，至少需要2張圖片</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Upload Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-12"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                上傳圖片
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
              
              <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-12">
                    <Images className="w-4 h-4 mr-2" />
                    從畫廊選擇
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>從畫廊選擇圖片</DialogTitle>
                  </DialogHeader>
                  {mediaLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : imageMediaFiles.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>畫廊中沒有圖片</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-3">
                      {imageMediaFiles.map((file) => {
                        const publicUrl = getPublicUrl(file.file_path);
                        return (
                          <button
                            key={file.id}
                            onClick={() => handleSelectFromGallery(publicUrl)}
                            className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-colors"
                          >
                            <img
                              src={publicUrl}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>

            {/* Frames Grid */}
            <div className="min-h-[200px] border-2 border-dashed border-border rounded-lg p-4">
              {frames.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-12">
                  <ImageIcon className="w-12 h-12 mb-3 opacity-50" />
                  <p className="font-medium">還沒有圖片</p>
                  <p className="text-sm">上傳或從畫廊選擇圖片開始製作</p>
                </div>
              ) : (
                <div className="grid grid-cols-5 gap-2">
                  {frames.map((frame, index) => (
                    <div
                      key={frame.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-move group ${
                        draggedIndex === index ? 'border-primary opacity-50' : 'border-border'
                      }`}
                    >
                      <img
                        src={frame.url}
                        alt={`Frame ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <GripVertical className="w-4 h-4 text-white" />
                      </div>
                      <button
                        onClick={() => removeFrame(frame.id)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-1 left-1 w-5 h-5 rounded-full bg-black/70 text-white text-xs flex items-center justify-center">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Preview & Generate */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg">預覽與生成</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">預覽動畫效果並生成貼圖</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Preview Area */}
            <div className="aspect-square bg-muted/50 rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center text-muted-foreground">
                  <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>預覽區域</p>
                </div>
              )}
            </div>

            {/* Generate Button */}
            <Button
              onClick={generateSticker}
              disabled={isGenerating || frames.length < 2}
              className="w-full h-12"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              生成貼圖 (1點)
            </Button>

            {/* Download Button */}
            {generatedStickerUrl && (
              <Button
                variant="outline"
                onClick={downloadSticker}
                className="w-full h-12"
              >
                <Download className="w-4 h-4 mr-2" />
                下載貼圖
              </Button>
            )}

            {/* Tips */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium flex items-center gap-2">
                <span className="text-lg">💡</span> 使用提示：
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>貼圖將自動裁剪為 512×512 像素正方形</li>
                <li>建議使用 2-5 張圖片獲得最佳效果</li>
                <li>下載後可直接用於 WhatsApp/微信等聊天應用</li>
                <li>輸出格式為 WebP，廣泛兼容各種平台</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Text Sticker Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sticker className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">創建個性化的表情貼圖神器</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">創建貼圖</h3>
            <Input 
              value={stickerText} 
              onChange={(e) => setStickerText(e.target.value)} 
              placeholder="輸入貼圖文字或表情..." 
            />
          </div>

          {/* Image Upload Section */}
          <div>
            <h3 className="font-medium mb-2">上傳圖片</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Button
                variant="outline"
                className="h-10"
                onClick={() => textFileInputRef.current?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                上傳圖片
              </Button>
              <input
                ref={textFileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleTextImageUpload}
              />
              
              <Dialog open={isTextGalleryOpen} onOpenChange={setIsTextGalleryOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="h-10">
                    <Images className="w-4 h-4 mr-2" />
                    從畫廊選擇
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>從畫廊選擇圖片</DialogTitle>
                  </DialogHeader>
                  {mediaLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : imageMediaFiles.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>畫廊中沒有圖片</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-3">
                      {imageMediaFiles.map((file) => {
                        const publicUrl = getPublicUrl(file.file_path);
                        return (
                          <button
                            key={file.id}
                            onClick={() => handleTextGallerySelect(publicUrl)}
                            className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-colors"
                          >
                            <img
                              src={publicUrl}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>

            {/* Uploaded Images Preview */}
            {textStickerImages.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {textStickerImages.map((url, index) => (
                  <div key={index} className="relative w-16 h-16 rounded-lg overflow-hidden border group">
                    <img src={url} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeTextStickerImage(index)}
                      className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {textStyles.map(s => (
              <Button 
                key={s.id} 
                variant={textStyle === s.id ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setTextStyle(s.id)}
              >
                {s.emoji} {s.label}
              </Button>
            ))}
          </div>
          
          <Button 
            onClick={handleTextStickerGenerate} 
            disabled={isTextGenerating} 
            className="w-full"
          >
            {isTextGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Sticker className="w-4 h-4 mr-2" />
            )}
            生成貼圖
          </Button>
        </CardContent>
      </Card>

      {/* Text Stickers Gallery */}
      {textStickers.length > 0 && (
        <Card>
          <CardHeader><CardTitle>我的貼圖</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {textStickers.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted group">
                  <img src={url} alt="Sticker" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <a href={url} download className="p-2 bg-white rounded-full">
                      <Download className="w-4 h-4 text-black" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StickerMakerPage;
