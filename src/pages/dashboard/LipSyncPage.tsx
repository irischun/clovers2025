import { useState, useRef } from 'react';
import PointsBalanceCard from '@/components/dashboard/PointsBalanceCard';
import { Video, Upload, Loader2, Play, Download, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

const LipSyncPage = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setVideoFile(file);
      toast({ title: '視頻已上傳', description: file.name });
    }
  };

  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioFile(file);
      toast({ title: '音頻已上傳', description: file.name });
    }
  };

  const handleGenerate = async () => {
    if (!videoFile) {
      toast({ title: '請上傳視頻文件', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    
    setTimeout(() => {
      toast({ 
        title: 'LipSync 功能', 
        description: '此功能需要連接 LipSync API（如 Wav2Lip、SadTalker）。請在設定中配置相關服務。' 
      });
      setIsProcessing(false);
    }, 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Points Balance */}
      <PointsBalanceCard />

      <div>
        <h1 className="heading-display text-2xl mb-1">LipSync 影片</h1>
        <p className="text-muted-foreground">讓視頻中的人物說出任何語言</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5 text-primary" />
              上傳素材
            </CardTitle>
            <CardDescription>上傳視頻和音頻文件</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              className="hidden"
            />
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              onChange={handleAudioUpload}
              className="hidden"
            />
            
            <div 
              onClick={() => videoInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
            >
              <Video className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              {videoFile ? (
                <p className="text-sm font-medium">{videoFile.name}</p>
              ) : (
                <>
                  <p className="text-muted-foreground">點擊上傳視頻</p>
                  <p className="text-xs text-muted-foreground mt-1">MP4, MOV, AVI</p>
                </>
              )}
            </div>

            <Tabs defaultValue="audio">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="audio">上傳音頻</TabsTrigger>
                <TabsTrigger value="text">文字轉語音</TabsTrigger>
              </TabsList>

              <TabsContent value="audio" className="mt-4">
                <div 
                  onClick={() => audioInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                >
                  <Mic className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                  {audioFile ? (
                    <p className="text-sm font-medium">{audioFile.name}</p>
                  ) : (
                    <>
                      <p className="text-muted-foreground">點擊上傳音頻</p>
                      <p className="text-xs text-muted-foreground mt-1">MP3, WAV, M4A</p>
                    </>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="text" className="mt-4">
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="輸入要說的文字內容..."
                  rows={4}
                  className="resize-none"
                />
              </TabsContent>
            </Tabs>

            <Button 
              onClick={handleGenerate} 
              disabled={isProcessing || !videoFile}
              className="w-full gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  處理中...
                </>
              ) : (
                <>
                  <Video className="w-4 h-4" />
                  生成 LipSync 影片
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>預覽</CardTitle>
              {resultUrl && (
                <Button size="sm" variant="outline">
                  <Download className="w-4 h-4 mr-1" />
                  下載
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {resultUrl ? (
              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                <video src={resultUrl} controls className="w-full h-full" />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
                  <Play className="w-12 h-12 opacity-50" />
                </div>
                <p>上傳素材後點擊生成</p>
                <p className="text-sm mt-1">AI 將為您製作 LipSync 影片</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">使用說明</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• <strong>視頻要求</strong> - 視頻中需要有清晰可見的人臉</li>
            <li>• <strong>音頻長度</strong> - 音頻長度應與視頻長度接近</li>
            <li>• <strong>畫質建議</strong> - 使用高清視頻可獲得更好效果</li>
            <li>• <strong>處理時間</strong> - 根據視頻長度，處理可能需要數分鐘</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default LipSyncPage;
