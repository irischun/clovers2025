import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, Image, Music, Wand2, Play, RefreshCw, Sparkles, Film, Shield, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const VideoGeneration2Page = () => {
  const { toast } = useToast();
  
  // Image selection
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  
  // Voice selection
  const [selectedVoice, setSelectedVoice] = useState<File | null>(null);
  const [voiceName, setVoiceName] = useState<string>("");
  
  // Storyboard
  const [contentDescription, setContentDescription] = useState("");
  const [storyboardPrompt, setStoryboardPrompt] = useState(
    "將以上嘅內容做成一個分鏡劇本，大概係15秒，可以有四個分鏡，你同我設計將呢個劇本加入埋主角。我只需要係劇本分鏡嘅內容，唔使其他文字同埋描述, 要一個觀眾eyecatching，引人入勝的劇本。"
  );
  const [generatedStoryboard, setGeneratedStoryboard] = useState("");
  const [isGeneratingStoryboard, setIsGeneratingStoryboard] = useState(false);
  
  // Action settings
  const [actionPrompt, setActionPrompt] = useState("");
  const [usePresetPrompt, setUsePresetPrompt] = useState(false);
  const [negativePrompt, setNegativePrompt] = useState("blurry, low quality, distorted face, deformed");
  
  // Video settings
  const [videoLength, setVideoLength] = useState("5");
  const [resolution, setResolution] = useState("1080p");
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [enablePromptExpansion, setEnablePromptExpansion] = useState(false);
  const [enableMultiShot, setEnableMultiShot] = useState(false);
  const [enableSafetyCheck, setEnableSafetyCheck] = useState(true);
  
  // Points
  const userPoints = 100;
  const [isGenerating, setIsGenerating] = useState(false);

  const presetActionPrompt = `動作提示：
上傳圖是我的主角，要保留所有面部特徵。主角要lipsync同步上傳的語音。第一個畫面要由第一個分鏡開始。 ratio is 9:16. use 3d render, unreal engine.`;

  const calculatePoints = () => {
    let basePoints = 10;
    if (videoLength === "10") basePoints = 15;
    if (videoLength === "15") basePoints = 20;
    if (resolution === "1080p") basePoints += 5;
    if (enablePromptExpansion) basePoints += 3;
    if (enableMultiShot) basePoints += 5;
    return basePoints;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVoiceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedVoice(file);
      setVoiceName(file.name);
    }
  };

  const handleApplyPresetPrompt = () => {
    setUsePresetPrompt(true);
    let newPrompt = presetActionPrompt;
    if (generatedStoryboard) {
      newPrompt += `\n\n已加入分鏡劇本：\n${generatedStoryboard}`;
    }
    setActionPrompt(newPrompt);
    toast({ title: "已套用預設提示詞" });
  };

  const handleGenerateStoryboard = async () => {
    if (!contentDescription.trim()) {
      toast({ title: "請輸入內容描述", variant: "destructive" });
      return;
    }
    
    setIsGeneratingStoryboard(true);
    // Simulate storyboard generation
    setTimeout(() => {
      const mockStoryboard = `分鏡 1: 主角面向鏡頭，自信微笑，開始介紹
分鏡 2: 特寫產品，主角手指向產品重點功能
分鏡 3: 中景，主角展示產品使用方式
分鏡 4: 特寫主角，總結並呼籲觀眾行動`;
      setGeneratedStoryboard(mockStoryboard);
      setIsGeneratingStoryboard(false);
      toast({ title: "分鏡劇本生成完成" });
    }, 2000);
  };

  const handleGenerate = async () => {
    if (!selectedImage) {
      toast({ title: "請選擇圖片", variant: "destructive" });
      return;
    }
    
    const pointsNeeded = calculatePoints();
    if (pointsNeeded > userPoints) {
      toast({ title: "點數不足", variant: "destructive" });
      return;
    }
    
    setIsGenerating(true);
    toast({ title: "開始生成視頻 2.0..." });
    
    // Simulate video generation
    setTimeout(() => {
      setIsGenerating(false);
      toast({ title: "視頻生成完成！" });
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">視頻生成 2.0</h1>
        <p className="text-muted-foreground mt-2">
          使用先進 AI 進行更動態動作的進階影片生成
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Image Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Image className="h-5 w-5" />
                選擇圖片
              </CardTitle>
              <CardDescription>選擇或上傳作為視頻主角的圖片</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
                  <Image className="h-6 w-6" />
                  <span>從圖庫選擇</span>
                </Button>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/bmp,image/webp"
                    onChange={handleImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                    <Upload className="h-6 w-6" />
                    <span>上傳圖片</span>
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                支援 JPEG、PNG、BMP、WEBP
              </p>
              {imagePreview && (
                <div className="mt-4">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full max-h-48 object-contain rounded-lg border"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Voice Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Music className="h-5 w-5" />
                選擇語音（選填）
              </CardTitle>
              <CardDescription>選擇語音作為背景音訊，時長 3-30 秒</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
                  <Music className="h-6 w-6" />
                  <span>從語音庫選擇</span>
                </Button>
                <div className="relative">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleVoiceUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                    <Upload className="h-6 w-6" />
                    <span>上傳音訊</span>
                  </Button>
                </div>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  選擇語音 (0 個可用)
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  尚無已生成的語音
                </p>
              </div>
              {voiceName && (
                <div className="p-3 bg-primary/10 rounded-lg">
                  <p className="text-sm">已選擇：{voiceName}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Storyboard Generation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Film className="h-5 w-5" />
                分鏡劇本生成
              </CardTitle>
              <CardDescription>輸入您的內容，AI 將根據設定生成分鏡劇本</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>內容描述</Label>
                <Textarea
                  placeholder="輸入您想要製作的視頻內容描述，例如：一個人在介紹新產品，展示產品功能"
                  value={contentDescription}
                  onChange={(e) => setContentDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>分鏡生成提示詞（可修改）</Label>
                <Textarea
                  value={storyboardPrompt}
                  onChange={(e) => setStoryboardPrompt(e.target.value)}
                  rows={4}
                  className="text-sm"
                />
              </div>
              <Button 
                onClick={handleGenerateStoryboard} 
                disabled={isGeneratingStoryboard}
                className="w-full"
              >
                {isGeneratingStoryboard ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    生成分鏡劇本
                  </>
                )}
              </Button>
              {generatedStoryboard && (
                <div className="p-3 bg-muted rounded-lg">
                  <Label className="text-sm font-medium">生成的分鏡劇本：</Label>
                  <Textarea
                    value={generatedStoryboard}
                    onChange={(e) => setGeneratedStoryboard(e.target.value)}
                    rows={5}
                    className="mt-2"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Action Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5" />
                動作設定
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant="outline" 
                onClick={handleApplyPresetPrompt}
                className="w-full"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                套用預設提示詞
              </Button>
              
              {usePresetPrompt && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-sm text-green-600 dark:text-green-400">
                    ✓ 已加入預設提示詞
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>動作提示</Label>
                <p className="text-xs text-muted-foreground">
                  描述您希望人物執行的動作，例如：「人物充滿活力地說話，頭部自然擺動，面帶微笑」
                </p>
                <Textarea
                  placeholder="描述您希望的動作效果..."
                  value={actionPrompt}
                  onChange={(e) => setActionPrompt(e.target.value)}
                  rows={6}
                />
              </div>

              <div className="space-y-2">
                <Label>負面提示（選填）</Label>
                <Textarea
                  placeholder="輸入您不想要的元素..."
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Video Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">視頻設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Video Length */}
              <div className="space-y-3">
                <Label>影片長度</Label>
                <RadioGroup
                  value={videoLength}
                  onValueChange={setVideoLength}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="5" id="length-5" />
                    <Label htmlFor="length-5" className="cursor-pointer">5秒</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="10" id="length-10" />
                    <Label htmlFor="length-10" className="cursor-pointer">10秒</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="15" id="length-15" />
                    <Label htmlFor="length-15" className="cursor-pointer">15秒</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Resolution */}
              <div className="space-y-3">
                <Label>解析度</Label>
                <RadioGroup
                  value={resolution}
                  onValueChange={setResolution}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="720p" id="res-720" />
                    <Label htmlFor="res-720" className="cursor-pointer">720p</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1080p" id="res-1080" />
                    <Label htmlFor="res-1080" className="cursor-pointer">1080p</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Aspect Ratio */}
              <div className="space-y-3">
                <Label>畫面比例</Label>
                <RadioGroup
                  value={aspectRatio}
                  onValueChange={setAspectRatio}
                  className="flex flex-wrap gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="9:16" id="ratio-916" />
                    <Label htmlFor="ratio-916" className="cursor-pointer">9:16 (直向)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="16:9" id="ratio-169" />
                    <Label htmlFor="ratio-169" className="cursor-pointer">16:9 (橫向)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="1:1" id="ratio-11" />
                    <Label htmlFor="ratio-11" className="cursor-pointer">1:1 (正方形)</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Toggles */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>啟用提示詞擴展</Label>
                    <p className="text-xs text-muted-foreground">讓 AI 自動增強你的提示</p>
                  </div>
                  <Switch
                    checked={enablePromptExpansion}
                    onCheckedChange={setEnablePromptExpansion}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>多鏡頭</Label>
                    <p className="text-xs text-muted-foreground">自動分段場景（需啟用提示擴展）</p>
                  </div>
                  <Switch
                    checked={enableMultiShot}
                    onCheckedChange={setEnableMultiShot}
                    disabled={!enablePromptExpansion}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      安全檢查
                    </Label>
                  </div>
                  <Switch
                    checked={enableSafetyCheck}
                    onCheckedChange={setEnableSafetyCheck}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generate Button */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">預計消耗點數：</span>
                  <span className="text-lg font-bold text-primary">{calculatePoints()} 點</span>
                </div>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>您目前擁有點數：</span>
                  <span>{userPoints} 點</span>
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !selectedImage}
                className="w-full h-12 text-lg"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5" />
                    生成影片
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Generated Videos Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>生成的視頻</CardTitle>
            <CardDescription>您的視頻 2.0 生成歷史</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新列表
          </Button>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Film className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>還沒有生成任何視頻...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoGeneration2Page;
