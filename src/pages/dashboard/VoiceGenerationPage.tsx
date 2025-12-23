import { useState } from 'react';
import { Volume2, Loader2, Play, Pause, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';

const voices = [
  { id: 'female-1', label: '女聲 - 溫柔', language: 'zh-TW' },
  { id: 'female-2', label: '女聲 - 專業', language: 'zh-TW' },
  { id: 'male-1', label: '男聲 - 穩重', language: 'zh-TW' },
  { id: 'male-2', label: '男聲 - 活力', language: 'zh-TW' },
  { id: 'child', label: '童聲', language: 'zh-TW' },
];

const VoiceGenerationPage = () => {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('female-1');
  const [speed, setSpeed] = useState([1.0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast({ title: '請輸入要轉換的文字', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    
    // Simulate TTS generation (would need actual TTS API like ElevenLabs)
    setTimeout(() => {
      toast({ 
        title: '語音生成功能', 
        description: '此功能需要連接語音合成 API（如 ElevenLabs）。請在設定中配置 API 金鑰。' 
      });
      setIsGenerating(false);
    }, 1500);
  };

  const handlePlay = () => {
    if (!audioUrl) return;
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="heading-display text-2xl mb-1">AI 語音生成</h1>
        <p className="text-muted-foreground">將文字轉換為自然語音</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-primary" />
              文字轉語音
            </CardTitle>
            <CardDescription>輸入要轉換的文字內容</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="輸入您想要轉換成語音的文字..."
              rows={6}
              className="resize-none"
            />
            
            <div className="space-y-2">
              <label className="text-sm font-medium">語音選擇</label>
              <Select value={voice} onValueChange={setVoice}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {voices.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">語速: {speed[0]}x</label>
              <Slider
                value={speed}
                onValueChange={setSpeed}
                min={0.5}
                max={2}
                step={0.1}
                className="w-full"
              />
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || !text.trim()}
              className="w-full gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  生成語音
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>播放器</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
              <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center mb-6">
                <Volume2 className="w-16 h-16 opacity-50" />
              </div>
              
              {audioUrl ? (
                <div className="flex items-center gap-4">
                  <Button size="lg" onClick={handlePlay}>
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  </Button>
                  <Button size="lg" variant="outline">
                    <Download className="w-6 h-6" />
                  </Button>
                </div>
              ) : (
                <>
                  <p>輸入文字並生成語音</p>
                  <p className="text-sm mt-1">支援多種語音風格</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">使用提示</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• <strong>文字長度</strong> - 建議每次不超過 5000 字</li>
            <li>• <strong>標點符號</strong> - 正確使用標點可以讓語音更自然</li>
            <li>• <strong>數字處理</strong> - 數字會自動轉換為讀音</li>
            <li>• <strong>語速調整</strong> - 根據用途調整合適的語速</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default VoiceGenerationPage;
