import { useState } from 'react';
import { Video, Loader2, Play, Download, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const videoStyles = [
  { id: 'cinematic', label: '電影感', description: '專業電影級畫面' },
  { id: 'animation', label: '動畫', description: '2D/3D 動畫效果' },
  { id: 'documentary', label: '紀錄片', description: '真實紀錄風格' },
  { id: 'commercial', label: '廣告', description: '商業廣告風格' },
  { id: 'social', label: '社交媒體', description: '適合短視頻平台' },
];

const durations = [
  { id: '5', label: '5 秒' },
  { id: '10', label: '10 秒' },
  { id: '15', label: '15 秒' },
  { id: '30', label: '30 秒' },
];

const VideoGenerationPage = () => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('cinematic');
  const [duration, setDuration] = useState('5');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: '請輸入視頻描述', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    
    // Simulate video generation
    setTimeout(() => {
      toast({ 
        title: '視頻生成功能', 
        description: '此功能需要連接視頻生成 API（如 Runway、Pika Labs）。請在設定中配置相關服務。' 
      });
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="heading-display text-2xl mb-1">AI 視頻生成</h1>
        <p className="text-muted-foreground">使用 AI 從文字描述生成視頻</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-primary" />
              創建視頻
            </CardTitle>
            <CardDescription>描述您想要的視頻內容</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="例如：一隻小狗在沙灘上奔跑，陽光明媚，海浪輕柔拍打沙灘..."
              rows={4}
              className="resize-none"
            />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">視頻風格</label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {videoStyles.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">視頻長度</label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {durations.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                  <Video className="w-4 h-4" />
                  生成視頻
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>預覽</CardTitle>
              {videoUrl && (
                <Button size="sm" variant="outline">
                  <Download className="w-4 h-4 mr-1" />
                  下載
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {videoUrl ? (
              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                <video src={videoUrl} controls className="w-full h-full" />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
                  <Play className="w-12 h-12 opacity-50" />
                </div>
                <p>輸入描述後點擊生成</p>
                <p className="text-sm mt-1">AI 將為您創建視頻</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">提示</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• <strong>詳細描述</strong> - 描述越具體，生成效果越好</li>
            <li>• <strong>場景說明</strong> - 包含環境、光線、氛圍等細節</li>
            <li>• <strong>動作描述</strong> - 說明主體的動作和移動方向</li>
            <li>• <strong>鏡頭提示</strong> - 可以指定鏡頭運動，如推進、旋轉等</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoGenerationPage;
