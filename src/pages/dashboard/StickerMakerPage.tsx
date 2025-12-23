import { useState } from 'react';
import { Sticker, Loader2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const styles = [
  { id: 'cute', label: '可愛', emoji: '🥰' },
  { id: 'minimal', label: '極簡', emoji: '✨' },
  { id: 'bold', label: '醒目', emoji: '💥' },
  { id: 'vintage', label: '復古', emoji: '🎞️' },
  { id: 'neon', label: '霓虹', emoji: '🌈' },
  { id: 'watercolor', label: '水彩', emoji: '🎨' },
];

const StickerMakerPage = () => {
  const [text, setText] = useState('');
  const [style, setStyle] = useState('cute');
  const [isGenerating, setIsGenerating] = useState(false);
  const [stickers, setStickers] = useState<string[]>([]);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!text.trim()) { toast({ title: '請輸入文字', variant: 'destructive' }); return; }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('sticker-generate', { body: { text, style } });
      if (error) throw error;
      if (data.imageUrl) setStickers(prev => [data.imageUrl, ...prev.slice(0, 11)]);
      toast({ title: '貼圖生成成功！' });
    } catch (error) {
      toast({ title: '生成失敗', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="heading-display text-2xl mb-1">貼圖製作器</h1>
        <p className="text-muted-foreground">創建個性化的表情貼圖</p>
      </div>

      <Card>
        <CardHeader><CardTitle>創建貼圖</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="輸入貼圖文字或表情..." />
          <div className="flex gap-2 flex-wrap">
            {styles.map(s => (
              <Button key={s.id} variant={style === s.id ? 'default' : 'outline'} size="sm" onClick={() => setStyle(s.id)}>
                {s.emoji} {s.label}
              </Button>
            ))}
          </div>
          <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sticker className="w-4 h-4 mr-2" />}
            生成貼圖
          </Button>
        </CardContent>
      </Card>

      {stickers.length > 0 && (
        <Card>
          <CardHeader><CardTitle>我的貼圖</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {stickers.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted group">
                  <img src={url} alt="Sticker" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <a href={url} download className="p-2 bg-white rounded-full"><Download className="w-4 h-4 text-black" /></a>
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
