import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Copy, RefreshCw, Loader2, Home, FileText, Hash, Smile, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAIGeneration } from '@/hooks/useAIGeneration';
import { useToast } from '@/hooks/use-toast';

const copywritingStructures = [
  { id: 'aida', label: 'AIDA模型', description: 'Attention → Interest → Desire → Action' },
  { id: 'pas', label: 'PAS結構', description: 'Problem → Agitation → Solution' },
  { id: 'fab', label: 'FAB框架', description: 'Features → Advantages → Benefits' },
  { id: '4p', label: '4P模型', description: 'Picture → Promise → Prove → Push' },
  { id: 'bab', label: 'Before-After-Bridge', description: '現狀 → 理想狀態 → 解決方案' },
  { id: 'hero', label: '英雄之旅', description: '召喚 → 挑戰 → 轉變 → 回歸' },
  { id: 'three-act', label: '三幕式結構', description: '設置 → 對抗 → 解決' },
  { id: 'sensory', label: '感官沉浸法', description: '視覺 → 聽覺 → 觸覺 → 嗅覺 → 味覺' },
  { id: 'disney', label: '迪士尼魔法結構', description: '夢想 → 冒險 → 成長 → 歸來' },
  { id: 'xiaohongshu', label: '小紅書風格', description: '真實分享、種草風格、互動感強' },
  { id: 'laogao', label: '老高風格', description: '懸念開頭、故事敘述、觀點輸出' },
  { id: 'custom', label: '自定義風格', description: '根據您的自定義要求生成' },
];

const languages = [
  { id: 'zh-TW', label: '繁體中文' },
  { id: 'zh-CN', label: '簡體中文' },
  { id: 'en', label: '英文' },
];

const lengths = [
  { id: 'short', label: '短篇', description: '100-200字' },
  { id: 'medium', label: '中篇', description: '300-500字' },
  { id: 'long', label: '長篇', description: '800-1200字' },
  { id: 'custom', label: '自訂字數', description: '自行指定' },
];

const CopywritingTool = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { generateContent, isGenerating, generatedContent, setGeneratedContent } = useAIGeneration();

  // Form states
  const [keyInfo, setKeyInfo] = useState('');
  const [outputFormat, setOutputFormat] = useState('text');
  const [structure, setStructure] = useState('aida');
  const [language, setLanguage] = useState('zh-TW');
  const [length, setLength] = useState('medium');
  const [customLength, setCustomLength] = useState('');
  const [includeCTA, setIncludeCTA] = useState(false);
  const [includeHashtag, setIncludeHashtag] = useState(false);
  const [includeEmoji, setIncludeEmoji] = useState(false);
  const [customRequirements, setCustomRequirements] = useState('');

  const getStructurePrompt = (structureId: string) => {
    const structurePrompts: Record<string, string> = {
      aida: '使用AIDA模型結構：首先吸引注意力(Attention)，然後激發興趣(Interest)，接著創造慾望(Desire)，最後引導行動(Action)。',
      pas: '使用PAS結構：首先描述問題(Problem)，然後放大痛點(Agitation)，最後提供解決方案(Solution)。',
      fab: '使用FAB框架：先介紹產品特點(Features)，再說明優勢(Advantages)，最後強調對用戶的好處(Benefits)。',
      '4p': '使用4P模型：先描繪畫面(Picture)，再做出承諾(Promise)，接著提供證據(Prove)，最後推動行動(Push)。',
      bab: '使用Before-After-Bridge結構：先描述現狀問題，再展示理想的未來狀態，最後說明如何達到目標的橋樑。',
      hero: '使用英雄之旅結構：從平凡世界的召喚開始，經歷挑戰與考驗，獲得轉變與成長，最後凱旋歸來。',
      'three-act': '使用三幕式結構：第一幕設置背景與衝突，第二幕展開對抗與發展，第三幕達成解決與結局。',
      sensory: '使用感官沉浸法：通過視覺、聽覺、觸覺、嗅覺、味覺的描述，讓讀者身臨其境。',
      disney: '使用迪士尼魔法結構：從夢想開始，經歷冒險挑戰，獲得成長轉變，最後實現願望歸來。',
      xiaohongshu: '使用小紅書風格：真實分享體驗、種草推薦風格、加入互動問句、使用口語化表達、分享個人心得。',
      laogao: '使用老高風格：開頭設置懸念吸引觀眾、用故事敘述方式展開、最後輸出獨特觀點、語言通俗易懂有趣味。',
      custom: '根據用戶的自定義要求來組織文案結構。',
    };
    return structurePrompts[structureId] || structurePrompts.aida;
  };

  const getLengthPrompt = (lengthId: string) => {
    const lengthPrompts: Record<string, string> = {
      short: '文案長度控制在100-200字之間（短篇）。',
      medium: '文案長度控制在300-500字之間（中篇）。',
      long: '文案長度控制在800-1200字之間（長篇）。',
      custom: customLength ? `文案長度控制在約${customLength}字。` : '文案長度適中。',
    };
    return lengthPrompts[lengthId] || lengthPrompts.medium;
  };

  const getLanguagePrompt = (langId: string) => {
    const langPrompts: Record<string, string> = {
      'zh-TW': '使用繁體中文撰寫。',
      'zh-CN': '使用简体中文撰写。',
      en: 'Write in English.',
    };
    return langPrompts[langId] || langPrompts['zh-TW'];
  };

  const buildPrompt = () => {
    const parts = [
      `請根據以下需求生成專業文案：`,
      `\n\n【核心內容】\n${keyInfo}`,
      `\n\n【文案結構】\n${getStructurePrompt(structure)}`,
      `\n\n【語言要求】\n${getLanguagePrompt(language)}`,
      `\n\n【長度要求】\n${getLengthPrompt(length)}`,
    ];

    if (outputFormat === 'html') {
      parts.push('\n\n【輸出格式】\n請使用HTML格式輸出，包含適當的標題標籤、段落標籤和列表標籤。');
    } else {
      parts.push('\n\n【輸出格式】\n請使用純文字格式輸出。');
    }

    if (includeCTA) {
      parts.push('\n\n【行動呼籲】\n請在文案結尾加入強有力的Call to Action行動呼籲。');
    }

    if (includeHashtag) {
      parts.push('\n\n【Hashtag】\n請在文案結尾加入3-5個相關的Hashtag標籤。');
    }

    if (includeEmoji) {
      parts.push('\n\n【Emoji】\n請在文案中適當加入相關的Emoji表情符號，增加親和力和可讀性。');
    }

    if (customRequirements.trim()) {
      parts.push(`\n\n【自定義要求】\n${customRequirements}`);
    }

    return parts.join('');
  };

  const handleGenerate = async () => {
    if (!keyInfo.trim()) {
      toast({ title: '請填寫關鍵信息', variant: 'destructive' });
      return;
    }
    const fullPrompt = buildPrompt();
    await generateContent(fullPrompt, 'blog');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    toast({ title: '已複製到剪貼板' });
  };

  const handleRegenerate = () => {
    if (keyInfo.trim()) {
      const fullPrompt = buildPrompt();
      generateContent(fullPrompt, 'blog');
    }
  };

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-display text-2xl mb-1 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            AI 文案創作工具
          </h1>
          <p className="text-muted-foreground">專業文案，一鍵生成</p>
        </div>
        <Button variant="outline" onClick={handleGoHome} className="gap-2">
          <Home className="w-4 h-4" />
          返回主頁
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Settings Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              文案設置
            </CardTitle>
            <CardDescription>配置您的文案生成參數</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Key Information */}
            <div className="space-y-2">
              <Label htmlFor="keyInfo" className="text-base font-medium">關鍵信息</Label>
              <Textarea
                id="keyInfo"
                value={keyInfo}
                onChange={(e) => setKeyInfo(e.target.value)}
                placeholder="填寫您的文案需求，例如：產品名稱、特點、目標受眾、想要傳達的訊息等..."
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Output Format */}
            <div className="space-y-2">
              <Label className="text-base font-medium">輸出格式</Label>
              <RadioGroup value={outputFormat} onValueChange={setOutputFormat} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="text" id="format-text" />
                  <Label htmlFor="format-text" className="cursor-pointer">純文字</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="html" id="format-html" />
                  <Label htmlFor="format-html" className="cursor-pointer">HTML</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Copywriting Structure */}
            <div className="space-y-2">
              <Label className="text-base font-medium">文案結構</Label>
              <Select value={structure} onValueChange={setStructure}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {copywritingStructures.map((s) => (
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

            {/* Language */}
            <div className="space-y-2">
              <Label className="text-base font-medium">語言</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.id} value={lang.id}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Length */}
            <div className="space-y-2">
              <Label className="text-base font-medium">文案長度</Label>
              <Select value={length} onValueChange={setLength}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {lengths.map((len) => (
                    <SelectItem key={len.id} value={len.id}>
                      <div className="flex flex-col">
                        <span>{len.label}</span>
                        <span className="text-xs text-muted-foreground">{len.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {length === 'custom' && (
                <Input
                  type="number"
                  value={customLength}
                  onChange={(e) => setCustomLength(e.target.value)}
                  placeholder="輸入字數，例如：600"
                  className="mt-2"
                />
              )}
            </div>

            {/* Toggle Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="cta" className="cursor-pointer">加入 Call to Action</Label>
                </div>
                <Switch id="cta" checked={includeCTA} onCheckedChange={setIncludeCTA} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="hashtag" className="cursor-pointer">加入 Hashtag</Label>
                </div>
                <Switch id="hashtag" checked={includeHashtag} onCheckedChange={setIncludeHashtag} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smile className="w-4 h-4 text-muted-foreground" />
                  <Label htmlFor="emoji" className="cursor-pointer">加入 Emoji</Label>
                </div>
                <Switch id="emoji" checked={includeEmoji} onCheckedChange={setIncludeEmoji} />
              </div>
            </div>

            {/* Custom Requirements */}
            <div className="space-y-2">
              <Label htmlFor="customReq" className="text-base font-medium">自定義要求</Label>
              <Textarea
                id="customReq"
                value={customRequirements}
                onChange={(e) => setCustomRequirements(e.target.value)}
                placeholder="輸入其他特殊要求，例如：語氣輕鬆活潑、加入數據支持、避免使用某些詞彙等..."
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !keyInfo.trim()}
                className="flex-1 gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    生成文案
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Output Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>生成結果</CardTitle>
              {generatedContent && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={handleCopy}>
                    <Copy className="w-4 h-4 mr-1" />
                    複製
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleRegenerate} disabled={isGenerating}>
                    <RefreshCw className={`w-4 h-4 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
                    重新生成
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {generatedContent ? (
              <div className="prose prose-invert max-w-none">
                {outputFormat === 'html' ? (
                  <div 
                    className="bg-muted/50 rounded-lg p-4 text-sm leading-relaxed max-h-[600px] overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: generatedContent }}
                  />
                ) : (
                  <div className="bg-muted/50 rounded-lg p-4 whitespace-pre-wrap text-sm leading-relaxed max-h-[600px] overflow-y-auto">
                    {generatedContent}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                <Sparkles className="w-12 h-12 mb-4 opacity-50" />
                <p>配置文案設置後點擊生成按鈕</p>
                <p className="text-sm mt-1">AI 將為您創建專業文案</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Structure Info */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">文案結構說明</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {copywritingStructures.map((s) => (
              <div 
                key={s.id} 
                className={`p-3 rounded-lg border transition-colors ${
                  structure === s.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                }`}
              >
                <h4 className="font-medium mb-1">{s.label}</h4>
                <p className="text-xs text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CopywritingTool;
