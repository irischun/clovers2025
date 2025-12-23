import { useState } from 'react';
import { Image, Loader2, Download, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const styles = [
  { id: 'realistic', label: '寫實風格', description: '逼真的照片級效果' },
  { id: 'anime', label: '動漫風格', description: '日式動漫插畫' },
  { id: 'watercolor', label: '水彩風格', description: '柔和的水彩畫效果' },
  { id: 'oil-painting', label: '油畫風格', description: '經典油畫質感' },
  { id: '3d-render', label: '3D渲染', description: '3D建模渲染效果' },
  { id: 'cartoon', label: '卡通風格', description: '可愛卡通插畫' },
  { id: 'pixel-art', label: '像素藝術', description: '復古像素遊戲風格' },
  { id: 'minimalist', label: '極簡風格', description: '簡潔現代的設計' },
];

const ImageGenerationPage = () => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('realistic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ prompt: string; imageUrl: string }>>([]);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: '請輸入圖片描述', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { prompt, style }
      });

      if (error) throw error;

      if (data.imageUrl) {
        setGeneratedImage(data.imageUrl);
        setHistory(prev => [{ prompt, imageUrl: data.imageUrl }, ...prev.slice(0, 9)]);
        toast({ title: '圖片生成成功！' });
      } else {
        throw new Error(data.error || 'Failed to generate image');
      }
    } catch (error) {
      console.error('Image generation error:', error);
      toast({ 
        title: '生成失敗', 
        description: error instanceof Error ? error.message : '請稍後重試',
        variant: 'destructive' 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;
    
    try {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `clover-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: '下載開始' });
    } catch (error) {
      toast({ title: '下載失敗', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="heading-display text-2xl mb-1">AI 圖片生成</h1>
        <p className="text-muted-foreground">使用 AI 根據文字描述生成精美圖片</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-primary" />
              創建圖片
            </CardTitle>
            <CardDescription>描述您想要的圖片內容</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="例如：一隻可愛的柴犬在櫻花樹下奔跑..."
              rows={4}
              className="resize-none"
            />
            
            <div className="space-y-2">
              <label className="text-sm font-medium">圖片風格</label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {styles.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex flex-col">
                        <span>{s.label}</span>
                        <span className="text-xs text-muted-foreground">{s.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || !prompt.trim()}
              className="w-full gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  生成圖片
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>生成結果</CardTitle>
              {generatedImage && (
                <Button size="sm" variant="outline" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-1" />
                  下載
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {generatedImage ? (
              <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                <img 
                  src={generatedImage} 
                  alt="Generated" 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <Image className="w-16 h-16 mb-4 opacity-50" />
                <p>輸入描述後點擊生成</p>
                <p className="text-sm mt-1">AI 將為您創建圖片</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>歷史記錄</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {history.map((item, index) => (
                <div 
                  key={index} 
                  className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                  onClick={() => setGeneratedImage(item.imageUrl)}
                >
                  <img 
                    src={item.imageUrl} 
                    alt={item.prompt} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ImageGenerationPage;
