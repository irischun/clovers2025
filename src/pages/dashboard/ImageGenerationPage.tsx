import { useState } from 'react';
import { Image, Loader2, Download, Wand2, Camera, Film, Palette, ShoppingBag, Share2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Category definitions with all styles
const categories = {
  product: {
    label: '產品或主角圖片',
    icon: Camera,
    description: '產品展示與人物攝影',
    styles: [
      { id: 'product-hero', label: '產品主角圖', description: '突出產品特色' },
      { id: 'portrait-hero', label: '人物主角圖', description: '專業人像攝影' },
      { id: 'lifestyle', label: '生活場景', description: '產品融入生活' },
    ],
    cameraAngles: [
      { id: 'eye-level', label: '平視角', prompt: 'eye level shot' },
      { id: 'high-angle', label: '俯視角', prompt: 'high angle shot, bird\'s eye view' },
      { id: 'low-angle', label: '仰視角', prompt: 'low angle shot, heroic perspective' },
      { id: 'dutch-angle', label: '傾斜角', prompt: 'dutch angle, tilted frame' },
      { id: 'close-up', label: '特寫', prompt: 'extreme close-up, macro shot' },
      { id: 'wide-shot', label: '廣角', prompt: 'wide shot, establishing shot' },
      { id: 'over-shoulder', label: '過肩鏡頭', prompt: 'over the shoulder shot' },
      { id: 'bokeh', label: '散景', prompt: 'shallow depth of field, beautiful bokeh' },
    ],
  },
  poster: {
    label: '海報風格選擇器',
    icon: Film,
    description: '雜誌封面與復古報紙',
    styles: [
      { id: 'magazine-cover', label: '雜誌封面', description: '高端時尚雜誌風格' },
      { id: 'retro-newspaper-80s', label: '80-90年代復古報紙', description: '懷舊報紙版面設計' },
      { id: 'business-magazine', label: '高端商業評論雜誌', description: '專業商業雜誌風格' },
      { id: 'tai-kung-pao', label: '太公報惡搞風格', description: '經典報章惡搞' },
      { id: 'lemon-daily', label: '檸檬日報風格', description: '趣味日報設計' },
      { id: 'hk-manga-4panel', label: '港漫四格打鬥', description: '香港漫畫打鬥場面' },
    ],
  },
  social: {
    label: '社交媒體',
    icon: Share2,
    description: '貼紙生成與封面圖',
    styles: [
      { id: 'whatsapp-sticker', label: 'WhatsApp Sticker', description: '可愛表情貼紙' },
      { id: 'youtube-thumbnail', label: 'YouTube火爆封面圖', description: '吸睛YouTube縮圖' },
      { id: 'instagram-post', label: 'Instagram 貼文', description: 'IG風格正方圖' },
      { id: 'facebook-cover', label: 'Facebook 封面', description: 'FB橫幅封面' },
    ],
  },
  movie: {
    label: '電影海報',
    icon: Film,
    description: '荷里活到亞洲電影',
    subCategories: {
      hollywood: {
        label: '主流商業電影',
        styles: [
          { id: 'hollywood-blockbuster', label: '荷里活大片', description: '好萊塢商業大片風格' },
          { id: 'marvel-superhero', label: 'Marvel 超級英雄', description: '漫威英雄風格' },
          { id: 'dc-dark', label: 'DC 暗黑風格', description: 'DC黑暗風格' },
        ],
      },
      asian: {
        label: '亞洲電影',
        styles: [
          { id: 'japanese-movie', label: '日本電影', description: '日式電影海報' },
          { id: 'korean-movie', label: '韓國電影', description: '韓式電影風格' },
          { id: 'hk-movie', label: '香港電影', description: '港片經典風格' },
          { id: 'inachu', label: '稻中兵團', description: '搞笑漫畫風格' },
          { id: 'hk-kam-manga', label: '香港甘小文四格漫畫', description: '本土四格漫畫' },
        ],
      },
    },
  },
  art: {
    label: '藝術風格',
    icon: Palette,
    description: '藝術與獨立電影風格',
    subCategories: {
      artistic: {
        label: '藝術與獨立電影',
        styles: [
          { id: 'minimalist', label: '極簡主義', description: '簡約設計風格' },
          { id: 'retro-illustration', label: '復古懷舊手繪插畫', description: '手繪復古風' },
        ],
      },
      genre: {
        label: '特定類型',
        styles: [
          { id: 'scifi-futuristic', label: '科幻未來', description: '未來科技感' },
          { id: 'horror-thriller', label: '恐怖驚悚', description: '暗黑恐怖風格' },
          { id: 'romance', label: '浪漫愛情', description: '浪漫唯美風格' },
        ],
      },
    },
  },
  commercial: {
    label: '商業應用',
    icon: ShoppingBag,
    description: '電商海報與促銷',
    subCategories: {
      ecommerce: {
        label: '電商海報',
        styles: [
          { id: 'product-showcase', label: '產品展示', description: '專業產品展示' },
          { id: 'promo-campaign', label: '促銷活動', description: '促銷廣告設計' },
          { id: 'fashion-style', label: '時尚風格', description: '時尚潮流設計' },
          { id: 'festival-theme', label: '節慶主題', description: '節日慶典風格' },
          { id: 'flash-sale', label: '限時優惠', description: '限時搶購設計' },
        ],
      },
    },
  },
};

// Model options
const models = [
  { id: 'nano-banana', label: 'Nano Banana', description: '快速生成，適合大部分需求', model: 'google/gemini-2.5-flash-image-preview' },
  { id: 'nano-banana-pro', label: 'Nano Banana Pro', description: '更高質量，適合專業需求', model: 'google/gemini-3-pro-image-preview' },
];

// Aspect ratio options
const aspectRatios = [
  { id: '16:9', label: '16:9 橫向', description: 'YouTube、電影', width: 1920, height: 1080 },
  { id: '1:1', label: '1:1 正方形', description: 'Instagram、頭像', width: 1024, height: 1024 },
  { id: '9:16', label: '9:16 直向', description: 'Reels、Stories', width: 1080, height: 1920 },
  { id: '4:3', label: '4:3 傳統', description: '傳統相片比例', width: 1024, height: 768 },
];

// Style prompt mappings
const stylePrompts: Record<string, string> = {
  // Product styles
  'product-hero': 'professional product photography, studio lighting, clean white background, commercial quality',
  'portrait-hero': 'professional portrait photography, soft lighting, shallow depth of field, high-end fashion',
  'lifestyle': 'lifestyle product photography, natural setting, warm lighting, authentic atmosphere',
  
  // Poster styles
  'magazine-cover': 'high fashion magazine cover, Vogue style, elegant typography, professional layout',
  'retro-newspaper-80s': '1980s retro newspaper layout, vintage printing style, old paper texture, classic typography',
  'business-magazine': 'Forbes or Bloomberg Businessweek style cover, corporate, professional, authoritative',
  'tai-kung-pao': 'Chinese newspaper parody style, traditional Chinese typography, sensational headlines',
  'lemon-daily': 'quirky newspaper design, yellow tones, fun headlines, playful layout',
  'hk-manga-4panel': 'Hong Kong martial arts manga style, dynamic action, speed lines, dramatic poses',
  
  // Social media styles
  'whatsapp-sticker': 'cute sticker design, transparent background, expressive character, simple bold lines, kawaii style',
  'youtube-thumbnail': 'eye-catching YouTube thumbnail, bold text, shocked expression, vibrant colors, high contrast',
  'instagram-post': 'Instagram aesthetic, warm tones, lifestyle photography, trendy composition',
  'facebook-cover': 'Facebook cover banner, wide format, professional branding, engaging visual',
  
  // Movie poster styles
  'hollywood-blockbuster': 'Hollywood blockbuster movie poster, dramatic lighting, epic scale, professional typography',
  'marvel-superhero': 'Marvel superhero movie poster style, dynamic poses, power effects, comic book inspired',
  'dc-dark': 'DC dark and gritty style, noir lighting, dramatic shadows, intense atmosphere',
  'japanese-movie': 'Japanese movie poster aesthetic, artistic composition, subtle colors, emotional depth',
  'korean-movie': 'Korean cinema style poster, realistic drama, emotional impact, sophisticated design',
  'hk-movie': 'Classic Hong Kong movie poster, action-oriented, bold colors, martial arts aesthetic',
  'inachu': 'Inachu manga parody style, exaggerated comedy, crude humor, simple art style',
  'hk-kam-manga': 'Hong Kong 4-panel manga style, local humor, simple drawings, satirical',
  
  // Art styles
  'minimalist': 'minimalist design, clean lines, negative space, simple color palette, modern aesthetic',
  'retro-illustration': 'vintage hand-drawn illustration, nostalgic, warm colors, textured paper feel',
  'scifi-futuristic': 'sci-fi futuristic design, neon lights, cyberpunk, high-tech, dystopian',
  'horror-thriller': 'horror movie style, dark atmosphere, suspenseful, eerie lighting, unsettling',
  'romance': 'romantic movie poster, soft lighting, dreamy atmosphere, warm tones, emotional',
  
  // Commercial styles
  'product-showcase': 'e-commerce product showcase, clean background, professional lighting, commercial quality',
  'promo-campaign': 'promotional campaign design, bold graphics, call to action, sale aesthetics',
  'fashion-style': 'high fashion advertising, editorial style, luxury branding, sophisticated',
  'festival-theme': 'festive holiday theme, celebratory, seasonal decorations, joyful atmosphere',
  'flash-sale': 'flash sale banner, urgent design, countdown aesthetic, eye-catching colors, promotional',
};

const ImageGenerationPage = () => {
  const [prompt, setPrompt] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('product');
  const [selectedStyle, setSelectedStyle] = useState<string>('product-hero');
  const [selectedCameraAngle, setSelectedCameraAngle] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState('nano-banana');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('1:1');
  const [quantity, setQuantity] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [history, setHistory] = useState<Array<{ prompt: string; imageUrl: string }>>([]);
  const [expandedSubCategory, setExpandedSubCategory] = useState<string | null>(null);
  const { toast } = useToast();

  const currentCategory = categories[selectedCategory as keyof typeof categories];
  const aspectRatio = aspectRatios.find(ar => ar.id === selectedAspectRatio);

  const buildFullPrompt = () => {
    const parts = [prompt];
    
    // Add style prompt
    if (stylePrompts[selectedStyle]) {
      parts.push(stylePrompts[selectedStyle]);
    }
    
    // Add camera angle if product category
    if (selectedCategory === 'product' && selectedCameraAngle) {
      const angle = categories.product.cameraAngles.find(a => a.id === selectedCameraAngle);
      if (angle) {
        parts.push(angle.prompt);
      }
    }
    
    // Add aspect ratio hint
    if (aspectRatio) {
      parts.push(`${aspectRatio.id} aspect ratio`);
    }
    
    return parts.join('. ') + '. Ultra high resolution, professional quality.';
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: '請輸入圖片描述', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    setGeneratedImages([]);
    
    try {
      const fullPrompt = buildFullPrompt();
      const model = models.find(m => m.id === selectedModel)?.model || 'google/gemini-2.5-flash-image-preview';
      
      // Generate images (simulating multiple generations)
      const images: string[] = [];
      
      for (let i = 0; i < quantity; i++) {
        const { data, error } = await supabase.functions.invoke('generate-image', {
          body: { 
            prompt: fullPrompt, 
            style: selectedStyle,
            model,
            width: aspectRatio?.width,
            height: aspectRatio?.height,
          }
        });

        if (error) throw error;

        if (data.imageUrl) {
          images.push(data.imageUrl);
          setGeneratedImages([...images]);
        } else if (data.error) {
          throw new Error(data.error);
        }
      }
      
      if (images.length > 0) {
        setSelectedImage(images[0]);
        // Add to history
        images.forEach(imageUrl => {
          setHistory(prev => [{ prompt, imageUrl }, ...prev.slice(0, 19)]);
        });
        toast({ title: `成功生成 ${images.length} 張圖片！` });
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

  const handleDownload = async (imageUrl?: string) => {
    const url = imageUrl || selectedImage;
    if (!url) return;
    
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = `clover-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: '下載開始' });
    } catch (error) {
      toast({ title: '下載失敗', variant: 'destructive' });
    }
  };

  const renderCategoryStyles = () => {
    const cat = currentCategory;
    
    // Check if category has subCategories
    if ('subCategories' in cat) {
      return (
        <div className="space-y-3">
          {Object.entries(cat.subCategories).map(([key, subCat]) => (
            <Collapsible 
              key={key} 
              open={expandedSubCategory === key}
              onOpenChange={(open) => setExpandedSubCategory(open ? key : null)}
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                <span className="font-medium">{subCat.label}</span>
                {expandedSubCategory === key ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {subCat.styles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        selectedStyle === style.id 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium text-sm">{style.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">{style.description}</div>
                    </button>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      );
    }
    
    // Regular styles without subCategories
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {cat.styles?.map((style) => (
          <button
            key={style.id}
            onClick={() => setSelectedStyle(style.id)}
            className={`p-3 rounded-lg border text-left transition-all ${
              selectedStyle === style.id 
                ? 'border-primary bg-primary/10' 
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="font-medium text-sm">{style.label}</div>
            <div className="text-xs text-muted-foreground mt-1">{style.description}</div>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="heading-display text-2xl mb-1">AI 圖片生成</h1>
        <p className="text-muted-foreground">使用 AI 根據文字描述生成精美圖片</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Panel - Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Category Selection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">選擇圖片類型</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedCategory} onValueChange={(val) => {
                setSelectedCategory(val);
                // Reset style when category changes
                const cat = categories[val as keyof typeof categories];
                if ('styles' in cat && cat.styles.length > 0) {
                  setSelectedStyle(cat.styles[0].id);
                } else if ('subCategories' in cat) {
                  const firstSubCat = Object.values(cat.subCategories)[0];
                  if (firstSubCat.styles.length > 0) {
                    setSelectedStyle(firstSubCat.styles[0].id);
                  }
                }
                setExpandedSubCategory(null);
              }}>
                <TabsList className="grid grid-cols-3 lg:grid-cols-6 h-auto gap-2 bg-transparent p-0">
                  {Object.entries(categories).map(([key, cat]) => {
                    const Icon = cat.icon;
                    return (
                      <TabsTrigger 
                        key={key} 
                        value={key}
                        className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-primary/10 data-[state=active]:border-primary border border-border rounded-lg"
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs text-center leading-tight">{cat.label}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>

                {Object.entries(categories).map(([key, cat]) => (
                  <TabsContent key={key} value={key} className="mt-4">
                    <p className="text-sm text-muted-foreground mb-3">{cat.description}</p>
                    {renderCategoryStyles()}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {/* Camera Angles (only for product category) */}
          {selectedCategory === 'product' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  快速選擇鏡頭提示詞
                </CardTitle>
                <CardDescription>選擇攝影角度增強效果</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {categories.product.cameraAngles.map((angle) => (
                    <Badge
                      key={angle.id}
                      variant={selectedCameraAngle === angle.id ? 'default' : 'outline'}
                      className="cursor-pointer hover:bg-primary/20 transition-colors"
                      onClick={() => setSelectedCameraAngle(
                        selectedCameraAngle === angle.id ? '' : angle.id
                      )}
                    >
                      {angle.label}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Prompt Input */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wand2 className="w-5 h-5 text-primary" />
                圖片描述
              </CardTitle>
              <CardDescription>描述您想要的圖片內容</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="例如：一隻可愛的柴犬在櫻花樹下奔跑..."
                rows={4}
                className="resize-none"
              />
            </CardContent>
          </Card>

          {/* Generation Options */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                生成選項
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Model Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">生成模型選擇</label>
                <div className="grid grid-cols-2 gap-3">
                  {models.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => setSelectedModel(model.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        selectedModel === model.id 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium text-sm">{model.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">{model.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio */}
              <div className="space-y-2">
                <label className="text-sm font-medium">長寬比</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {aspectRatios.map((ar) => (
                    <button
                      key={ar.id}
                      onClick={() => setSelectedAspectRatio(ar.id)}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        selectedAspectRatio === ar.id 
                          ? 'border-primary bg-primary/10' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium text-sm">{ar.label}</div>
                      <div className="text-xs text-muted-foreground">{ar.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">生成數量</label>
                  <span className="text-sm text-muted-foreground">{quantity} 張</span>
                </div>
                <Slider
                  value={[quantity]}
                  onValueChange={([val]) => setQuantity(val)}
                  min={1}
                  max={10}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1</span>
                  <span>10</span>
                </div>
              </div>

              {/* Generate Button */}
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !prompt.trim()}
                className="w-full gap-2 h-12 text-lg"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    生成圖片
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Results */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>生成結果</CardTitle>
                {selectedImage && (
                  <Button size="sm" variant="outline" onClick={() => handleDownload()}>
                    <Download className="w-4 h-4 mr-1" />
                    下載
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {selectedImage ? (
                <div className="space-y-4">
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                    <img 
                      src={selectedImage} 
                      alt="Generated" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Thumbnails for multiple images */}
                  {generatedImages.length > 1 && (
                    <div className="grid grid-cols-5 gap-2">
                      {generatedImages.map((img, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(img)}
                          className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                            selectedImage === img ? 'border-primary' : 'border-transparent hover:border-primary/50'
                          }`}
                        >
                          <img 
                            src={img} 
                            alt={`Generated ${index + 1}`} 
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : isGenerating ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                  <Loader2 className="w-16 h-16 mb-4 animate-spin text-primary" />
                  <p>正在生成圖片...</p>
                  <p className="text-sm mt-1">請稍候</p>
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

          {/* History */}
          {history.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">歷史記錄</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
                  {history.map((item, index) => (
                    <button 
                      key={index} 
                      className="relative aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition-all group"
                      onClick={() => setSelectedImage(item.imageUrl)}
                    >
                      <img 
                        src={item.imageUrl} 
                        alt={item.prompt} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Download 
                          className="w-5 h-5 text-white cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(item.imageUrl);
                          }}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageGenerationPage;
