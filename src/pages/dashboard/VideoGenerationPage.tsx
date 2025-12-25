import { useState, useRef } from 'react';
import { Video, Loader2, Play, Download, Plus, RefreshCw, Upload, Image, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Camera angles data
const cameraAngles = [
  { id: 'mid-shot-half-body', label: '中景半身平視鏡頭', description: '用於從全身圖像中創建中景半身鏡頭', prompt: 'medium shot, half body, eye level' },
  { id: 'close-up-looking', label: '特寫鏡頭望向鏡頭', description: '用於從四分之三身鏡頭中創建特寫鏡頭', prompt: 'close-up shot, looking at camera' },
  { id: 'half-body-view', label: '半身鏡頭視圖', description: '用來取得四分之三身鏡頭的替代提示詞', prompt: 'half body view, three-quarter shot' },
  { id: 'low-angle-action', label: '低角度動作鏡頭', description: '用於創建低角度動作鏡頭', prompt: 'low angle action shot' },
  { id: 'medium-shot', label: '中景鏡頭', description: 'Nano Banana 模型對此關鍵詞反應良好', prompt: 'medium shot' },
  { id: 'high-angle-overhead', label: '高角度俯視', description: '從上方俯視的高角度鏡頭', prompt: 'high angle overhead shot' },
  { id: 'rotating-shot', label: '旋轉鏡頭', description: '展示另一側成功取得從後方拍攝鏡頭', prompt: 'rotating shot, reveal other side' },
  { id: 'show-other-side', label: '顯示另一側', description: '取得從後方拍攝鏡頭', prompt: 'show other side, from behind' },
  { id: 'close-up-emotion', label: '特寫鏡頭', description: '用於揭示角色的情緒', prompt: 'close-up shot, reveal emotion' },
  { id: 'over-shoulder', label: '過肩鏡頭', description: '創建過肩鏡頭', prompt: 'over the shoulder shot' },
  { id: 'side-profile', label: '側臉鏡頭', description: '創建側臉鏡頭', prompt: 'side profile shot' },
  { id: 'aerial-shot', label: '空拍鏡頭', description: '空拍角度鏡頭', prompt: 'aerial shot' },
  { id: 'drone-overhead', label: '無人機俯視鏡頭', description: '極端高角度鏡頭', prompt: 'drone overhead shot, extreme high angle' },
  { id: 'extreme-low-angle', label: '極低角度鏡頭', description: '創建極端低角度鏡頭', prompt: 'extreme low angle shot' },
  { id: 'extreme-high-angle', label: '極高角度鏡頭', description: '極高角度向下拍攝', prompt: 'extreme high angle shot, looking down' },
  { id: 'extreme-closeup-eyes', label: '極端特寫眼睛', description: '極端特寫鏡頭，聚焦眼睛', prompt: 'extreme close-up, focus on eyes' },
  { id: 'extreme-wide-angle', label: '極端廣角鏡頭', description: 'Nano Banana 模型對此關鍵詞反應良好', prompt: 'extreme wide angle shot' },
  { id: 'subject-right-side', label: '主體在畫面右側', description: '使主體位於畫面右側', prompt: 'subject on right side of frame' },
];

// Video generation actions
const videoActions = [
  { id: 'pull-back-forward', label: '鏡頭後拉人物前進', description: '展示人物跑向鏡頭的動態', prompt: 'camera pulls back, subject moves forward' },
  { id: 'zoom-out-pan-right', label: '拉遠並右移平移', description: '創建高角度鏡頭影片', prompt: 'zoom out and pan right, high angle' },
  { id: 'quick-zoom-escape', label: '快速拉近後逃跑', description: '快速拉近並轉身逃跑', prompt: 'quick zoom in, turn and escape' },
  { id: 'camera-zoom-out', label: '鏡頭拉遠', description: '從靜態圖像創建變焦拉遠', prompt: 'camera zoom out from still image' },
  { id: 'zoom-out-drone-view', label: '拉遠並傾斜成無人機視角', description: '極端廣角鏡頭，以無人機視角結束', prompt: 'zoom out and tilt to drone view, extreme wide angle' },
  { id: 'high-speed-toward-camera', label: '高速衝向鏡頭', description: 'FPV高速動作鏡頭', prompt: 'high speed toward camera, FPV action shot' },
];

// Angle creation keywords
const angleKeywords = [
  { id: 'change-angle', label: '改變角度', description: '對於取得更複雜的角度轉換非常有幫助', prompt: 'change angle' },
  { id: 'dynamic-action', label: '動態動作', description: '為鏡頭帶來良好的運動感', prompt: 'dynamic action' },
  { id: 'dutch-angle', label: '失衡傾斜', description: '創建更具戲劇性的傾斜角度', prompt: 'dutch angle, tilted' },
  { id: 'cinematic-angle', label: '電影角度', description: '創建更具戲劇性的角度', prompt: 'cinematic angle' },
  { id: 'rotating-shot-keyword', label: '旋轉鏡頭', description: '添加到提示詞中增強效果', prompt: 'rotating shot' },
  { id: 'vast-sky', label: '廣闊天空', description: '極低角度鏡頭，確保攝影機下降更多', prompt: 'vast sky, extreme low angle' },
  { id: 'desert-ground', label: '沙漠地面', description: '極高角度鏡頭，確保攝影機上升', prompt: 'desert ground, extreme high angle' },
  { id: 'focus-eyes', label: '聚焦眼睛', description: '極端特寫鏡頭，更靠近人物', prompt: 'focus on eyes, extreme close-up' },
];

const aspectRatios = [
  { id: '16:9', label: '16:9 (橫向)' },
  { id: '1:1', label: '1:1 (正方形)' },
  { id: '9:16', label: '9:16 (直向)' },
];

const durations = [
  { id: '5', label: '5秒' },
  { id: '10', label: '10秒' },
];

const VideoGenerationPage = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [duration, setDuration] = useState('5');
  const [videoCount, setVideoCount] = useState('1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [firstFrameImage, setFirstFrameImage] = useState<string | null>(null);
  const [lastFrameImage, setLastFrameImage] = useState<string | null>(null);
  const [generatedVideos, setGeneratedVideos] = useState<Array<{ id: string; url: string; thumbnail: string; createdAt: Date }>>([]);
  
  const [cameraAnglesOpen, setCameraAnglesOpen] = useState(true);
  const [videoActionsOpen, setVideoActionsOpen] = useState(true);
  const [angleKeywordsOpen, setAngleKeywordsOpen] = useState(true);
  
  const firstFrameInputRef = useRef<HTMLInputElement>(null);
  const lastFrameInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'first' | 'last') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (type === 'first') {
          setFirstFrameImage(reader.result as string);
        } else {
          setLastFrameImage(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const addToPrompt = (text: string) => {
    setPrompt(prev => prev ? `${prev}, ${text}` : text);
    toast({ title: '已加入提示詞', description: text });
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    // Simulate video generation
    setTimeout(() => {
      toast({ 
        title: '視頻生成功能', 
        description: '此功能需要連接 Kling AI API。請在設定中配置相關服務。' 
      });
      setIsGenerating(false);
    }, 2000);
  };

  const pointsCost = parseInt(videoCount) * 6;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="heading-display text-2xl mb-1">AI 視頻生成</h1>
        <p className="text-muted-foreground">使用 Kling AI 從圖片生成高質量視頻</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Main Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Frame Images */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">幀圖片設定</CardTitle>
              <CardDescription>設定視頻的首幀和尾幀圖片（可選）</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {/* First Frame */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">首幀圖片 (可選)</label>
                  <p className="text-xs text-muted-foreground">設定視頻第一幀的畫面</p>
                  <input
                    ref={firstFrameInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'first')}
                    className="hidden"
                  />
                  {firstFrameImage ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
                      <img src={firstFrameImage} alt="First frame" className="w-full h-full object-cover" />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={() => setFirstFrameImage(null)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => firstFrameInputRef.current?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        選擇首幀圖片
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <Image className="w-4 h-4 mr-2" />
                        從畫廊選擇
                      </Button>
                    </div>
                  )}
                </div>

                {/* Last Frame */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">尾幀圖片 (可選)</label>
                  <p className="text-xs text-muted-foreground">設定視頻最後一幀的畫面</p>
                  <input
                    ref={lastFrameInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'last')}
                    className="hidden"
                  />
                  {lastFrameImage ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden border bg-muted">
                      <img src={lastFrameImage} alt="Last frame" className="w-full h-full object-cover" />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={() => setLastFrameImage(null)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => lastFrameInputRef.current?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        選擇尾幀圖片
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <Image className="w-4 h-4 mr-2" />
                        從畫廊選擇
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Video Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">視頻設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">長寬比</label>
                  <Select value={aspectRatio} onValueChange={setAspectRatio}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {aspectRatios.map((ar) => (
                        <SelectItem key={ar.id} value={ar.id}>
                          {ar.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">持續時間</label>
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

                <div className="space-y-2">
                  <label className="text-sm font-medium">生成數量</label>
                  <Select value={videoCount} onValueChange={setVideoCount}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                        <SelectItem key={n} value={n.toString()}>
                          {n}個視頻
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">一次生成多個視頻，每個視頻將獨立處理</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prompt Library */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">提示詞庫</CardTitle>
              <CardDescription>選擇提示詞後點擊「加入」按鈕，將提示詞加入到上方的提示詞框</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Camera Angles */}
              <Collapsible open={cameraAnglesOpen} onOpenChange={setCameraAnglesOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                    <span className="font-medium">鏡頭角度 ({cameraAngles.length})</span>
                    {cameraAnglesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <div className="grid gap-2">
                    {cameraAngles.map((angle) => (
                      <div key={angle.id} className="flex items-start justify-between gap-2 p-2 rounded-lg border bg-muted/50 hover:bg-muted transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{angle.label}</p>
                          <p className="text-xs text-muted-foreground">{angle.description}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => addToPrompt(angle.prompt)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          加入
                        </Button>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Video Actions */}
              <Collapsible open={videoActionsOpen} onOpenChange={setVideoActionsOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                    <span className="font-medium">影片生成動作 ({videoActions.length})</span>
                    {videoActionsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <div className="grid gap-2">
                    {videoActions.map((action) => (
                      <div key={action.id} className="flex items-start justify-between gap-2 p-2 rounded-lg border bg-muted/50 hover:bg-muted transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{action.label}</p>
                          <p className="text-xs text-muted-foreground">{action.description}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => addToPrompt(action.prompt)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          加入
                        </Button>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Angle Keywords */}
              <Collapsible open={angleKeywordsOpen} onOpenChange={setAngleKeywordsOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-2 h-auto">
                    <span className="font-medium">角度創作關鍵詞 ({angleKeywords.length})</span>
                    {angleKeywordsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <div className="grid gap-2">
                    {angleKeywords.map((keyword) => (
                      <div key={keyword.id} className="flex items-start justify-between gap-2 p-2 rounded-lg border bg-muted/50 hover:bg-muted transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{keyword.label}</p>
                          <p className="text-xs text-muted-foreground">{keyword.description}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => addToPrompt(keyword.prompt)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          加入
                        </Button>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>

          {/* Prompt Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">提示詞</CardTitle>
              <CardDescription>描述您希望的視頻動作和效果（可選）</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="描述您希望的視頻動作和效果（可選）..."
                rows={4}
                className="resize-none"
              />
              
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating}
                className="w-full gap-2"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Video className="w-4 h-4" />
                    生成{videoCount}個視頻（需{pointsCost}點數）
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Generated Videos */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">生成的視頻</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setGeneratedVideos([])}>
                  <RefreshCw className="w-4 h-4 mr-1" />
                  刷新列表
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {generatedVideos.length > 0 ? (
                <div className="space-y-4">
                  {generatedVideos.map((video) => (
                    <div key={video.id} className="relative aspect-video rounded-lg overflow-hidden bg-muted group">
                      <video src={video.url} controls className="w-full h-full" poster={video.thumbnail} />
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="secondary" className="h-8 w-8">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Play className="w-10 h-10 opacity-50" />
                  </div>
                  <p className="text-center">還沒有生成任何視頻</p>
                  <p className="text-sm text-center mt-1">選擇設定並點擊生成按鈕</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">使用提示</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• <strong>首幀圖片</strong> - 設定視頻開始的畫面</li>
                <li>• <strong>尾幀圖片</strong> - 設定視頻結束的畫面</li>
                <li>• <strong>鏡頭角度</strong> - 選擇合適的拍攝角度</li>
                <li>• <strong>動作效果</strong> - 添加動態效果增強視覺</li>
                <li>• <strong>多個視頻</strong> - 每個視頻獨立處理</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VideoGenerationPage;
