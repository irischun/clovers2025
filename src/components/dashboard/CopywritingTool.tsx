import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { Sparkles, Copy, RefreshCw, Loader2, FileText, Hash, Smile, Phone, Mail, Building2, Globe, Wand2, History, Trash2, Eye } from 'lucide-react';
import PointsBalanceCard from '@/components/dashboard/PointsBalanceCard';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAIGeneration } from '@/hooks/useAIGeneration';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface HistoryItem {
  id: string;
  prompt: string;
  result: string;
  tool_type: string;
  created_at: string;
}

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

const emailTones = [
  { id: 'formal', label: '正式 (Formal)' },
  { id: 'casual', label: '輕鬆 (Casual)' },
  { id: 'humorous', label: '幽默 (Humorous)' },
];

const emailLengths = [
  { id: 'short', label: '簡短', description: '100-200字' },
  { id: 'medium', label: '中等', description: '200-400字' },
  { id: 'long', label: '詳細', description: '400字以上' },
];

const defaultEmailPrompt = `你是一位專業的商務郵件撰寫專家。請根據以下要求撰寫一封商務開發郵件。

**郵件結構要求：**

你必須按照以下格式輸出完整的郵件：

1. **主題行 (Subject)**：簡潔有力，吸引收件人開啟郵件

2. **問候語 (Greeting)**：適當的開場問候

3. **正文 (Body)**：分為兩段

   - **第一段**：說明發件人公司（A公司）如何幫助目標公司解決問題、帶來的好處及預期成效

   - **第二段**：A公司服務或產品，全部重點及詳細內容介紹，必要包含所有嘅服務重點，不要skip. 

4. **結尾語 (Closing)**：禮貌的結束語，包含明確的行動呼籲（例如：安排會議、回覆郵件等）

5. **簽名 (Signature)**：使用提供的公司簽名資訊

**重要規則：**

- 必須完整輸出所有部分

- 每個部分需有明確標記

- 不要使用任何 Markdown 符號（#、*、**、_、-、>、\`等）

- 直接輸出可以立即複製使用的郵件內容

- 確保內容自然流暢，不生硬

**輸出格式：**

【主題】

[郵件主題]

【問候語】

[問候內容]

【正文】

[第一段：A公司如何幫助目標公司]

[第二段：A公司服務詳情]

【結尾】

[結尾語和行動呼籲]

【簽名】

[簽名內容]`;

const CopywritingTool = () => {
  const { toast } = useToast();
  const { generateContent, isGenerating, generatedContent, setGeneratedContent } = useAIGeneration();

  const [activeTab, setActiveTab] = useState('copywriting');

  // Copywriting Form states
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

  // Email Form states
  const [emailCoreMessage, setEmailCoreMessage] = useState('');
  const [companyInfo, setCompanyInfo] = useState('');
  const [targetWebsite, setTargetWebsite] = useState('');
  const [emailWritingStyle, setEmailWritingStyle] = useState('aida');
  const [emailTone, setEmailTone] = useState('formal');
  const [emailLength, setEmailLength] = useState('medium');
  const [emailLanguage, setEmailLanguage] = useState('zh-TW');
  const [emailIncludeCTA, setEmailIncludeCTA] = useState(false);
  const [emailIncludeHashtag, setEmailIncludeHashtag] = useState(false);
  const [emailIncludeEmoji, setEmailIncludeEmoji] = useState(false);
  const [emailPrompt, setEmailPrompt] = useState(defaultEmailPrompt);
  const [isCustomPrompt, setIsCustomPrompt] = useState(false);

  // History states
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Fetch history when tab changes to history
  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: '請先登入', variant: 'destructive' });
        setHistoryLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('ai_generations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistoryItems(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast({ title: '載入歷史記錄失敗', variant: 'destructive' });
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleDeleteHistory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ai_generations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setHistoryItems(prev => prev.filter(item => item.id !== id));
      toast({ title: '已刪除記錄' });
    } catch (error) {
      console.error('Error deleting history:', error);
      toast({ title: '刪除失敗', variant: 'destructive' });
    }
  };

  const handleCopyHistoryResult = (result: string) => {
    navigator.clipboard.writeText(result);
    toast({ title: '已複製到剪貼板' });
  };

  const handleViewHistory = (item: HistoryItem) => {
    setSelectedHistoryItem(item);
    setViewDialogOpen(true);
  };

  const getToolTypeLabel = (toolType: string) => {
    const labels: Record<string, string> = {
      'blog': '創作文案',
      'email': 'Email 文案',
      'social': '社交媒體文案',
      'general': '一般文案',
    };
    return labels[toolType] || toolType;
  };

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

  const getEmailTonePrompt = (toneId: string) => {
    const tonePrompts: Record<string, string> = {
      formal: '語氣正式專業，用詞嚴謹。',
      casual: '語氣輕鬆友好，用詞親切。',
      humorous: '語氣幽默風趣，適當加入輕鬆元素。',
    };
    return tonePrompts[toneId] || tonePrompts.formal;
  };

  const getEmailLengthPrompt = (lengthId: string) => {
    const lengthPrompts: Record<string, string> = {
      short: '郵件長度控制在100-200字之間（簡短）。',
      medium: '郵件長度控制在200-400字之間（中等）。',
      long: '郵件長度控制在400字以上（詳細）。',
    };
    return lengthPrompts[lengthId] || lengthPrompts.medium;
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

  const buildEmailPrompt = () => {
    const parts = [emailPrompt];

    parts.push(`\n\n【核心訊息/推廣內容】\n${emailCoreMessage}`);
    parts.push(`\n\n【您的公司資訊（A公司）】\n${companyInfo}`);

    if (targetWebsite.trim()) {
      parts.push(`\n\n【目標公司網站（B公司）】\n${targetWebsite}`);
    }

    parts.push(`\n\n【寫作風格】\n${getStructurePrompt(emailWritingStyle)}`);
    parts.push(`\n\n【語氣風格】\n${getEmailTonePrompt(emailTone)}`);
    parts.push(`\n\n【郵件長度】\n${getEmailLengthPrompt(emailLength)}`);
    parts.push(`\n\n【語言要求】\n${getLanguagePrompt(emailLanguage)}`);

    if (emailIncludeCTA) {
      parts.push('\n\n【行動呼籲】\n請在郵件結尾加入明確的Call to Action行動呼籲。');
    }

    if (emailIncludeHashtag) {
      parts.push('\n\n【Hashtag】\n請在郵件結尾加入3-5個相關的Hashtag標籤。');
    }

    if (emailIncludeEmoji) {
      parts.push('\n\n【Emoji】\n請在郵件中適當加入相關的Emoji表情符號。');
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

  const handleGenerateEmail = async () => {
    if (!emailCoreMessage.trim()) {
      toast({ title: '請填寫核心訊息/推廣內容', variant: 'destructive' });
      return;
    }
    if (!companyInfo.trim()) {
      toast({ title: '請填寫您的公司資訊', variant: 'destructive' });
      return;
    }
    const fullPrompt = buildEmailPrompt();
    await generateContent(fullPrompt, 'email');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    toast({ title: '已複製到剪貼板' });
  };

  const handleRegenerate = () => {
    if (activeTab === 'copywriting' && keyInfo.trim()) {
      const fullPrompt = buildPrompt();
      generateContent(fullPrompt, 'blog');
    } else if (activeTab === 'email' && emailCoreMessage.trim() && companyInfo.trim()) {
      const fullPrompt = buildEmailPrompt();
      generateContent(fullPrompt, 'email');
    }
  };


  const handleGenerateDefaultPrompt = () => {
    setEmailPrompt(defaultEmailPrompt);
    setIsCustomPrompt(false);
    toast({ title: '已載入預設提示詞' });
  };

  const handleCustomPrompt = () => {
    setEmailPrompt('');
    setIsCustomPrompt(true);
    toast({ title: '可自定義 AI 生成郵件的規則和格式，系統會自動附加語氣、字數和語言設定' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Points Balance */}
      <PointsBalanceCard />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-display text-2xl mb-1 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            AI 文案創作工具
          </h1>
          <p className="text-muted-foreground">專業文案，一鍵生成</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="copywriting" className="gap-2">
            <FileText className="w-4 h-4" />
            創作文案
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="w-4 h-4" />
            Email 文案
          </TabsTrigger>
          <TabsTrigger value="social" className="gap-2">
            <Hash className="w-4 h-4" />
            社交媒體文案
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="w-4 h-4" />
            歷史記錄
          </TabsTrigger>
        </TabsList>

        {/* 創作文案 Tab */}
        <TabsContent value="copywriting" className="mt-6">
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
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(generatedContent) }}
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
        </TabsContent>

        {/* Email 文案 Tab */}
        <TabsContent value="email" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Email Settings Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  Email 文案生成
                </CardTitle>
                <CardDescription>輸入您的公司資訊和目標公司網站，AI 將自動生成專業的商務開發郵件</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Core Message */}
                <div className="space-y-2">
                  <Label htmlFor="emailCoreMessage" className="text-base font-medium">核心訊息 / 推廣內容</Label>
                  <Textarea
                    id="emailCoreMessage"
                    value={emailCoreMessage}
                    onChange={(e) => setEmailCoreMessage(e.target.value)}
                    placeholder="輸入您想傳達的核心信息，例如：產品介紹、促銷活動、合作提案等"
                    rows={4}
                    className="resize-none"
                  />
                </div>

                {/* Company Info */}
                <div className="space-y-2">
                  <Label htmlFor="companyInfo" className="text-base font-medium flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    您的公司資訊（A公司）
                  </Label>
                  <Textarea
                    id="companyInfo"
                    value={companyInfo}
                    onChange={(e) => setCompanyInfo(e.target.value)}
                    placeholder={`輸入您的公司相關資訊，例如：
- 公司名稱
- 品牌理念
- 聯絡方式
- Email 簽名`}
                    rows={5}
                    className="resize-none"
                  />
                </div>

                {/* Target Website */}
                <div className="space-y-2">
                  <Label htmlFor="targetWebsite" className="text-base font-medium flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    目標公司網站（B公司）
                    <span className="text-muted-foreground text-sm font-normal">(Optional)</span>
                  </Label>
                  <Input
                    id="targetWebsite"
                    value={targetWebsite}
                    onChange={(e) => setTargetWebsite(e.target.value)}
                    placeholder="系統將自動讀取目標公司網站內容，用於生成更個性化的郵件"
                  />
                </div>

                {/* Writing Style */}
                <div className="space-y-2">
                  <Label className="text-base font-medium">寫作風格</Label>
                  <Select value={emailWritingStyle} onValueChange={setEmailWritingStyle}>
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

                {/* Prompt Buttons */}
                <div className="space-y-2">
                  <Label className="text-base font-medium">提示詞設定</Label>
                  <div className="flex gap-3">
                    <Button 
                      variant={!isCustomPrompt ? "default" : "outline"} 
                      onClick={handleGenerateDefaultPrompt}
                      className="flex-1 gap-2"
                    >
                      <Wand2 className="w-4 h-4" />
                      生成提示詞
                    </Button>
                    <Button 
                      variant={isCustomPrompt ? "default" : "outline"} 
                      onClick={handleCustomPrompt}
                      className="flex-1 gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      自定義提示詞
                    </Button>
                  </div>
                  <Textarea
                    value={emailPrompt}
                    onChange={(e) => setEmailPrompt(e.target.value)}
                    placeholder={isCustomPrompt ? "可自定義 AI 生成郵件的規則和格式，系統會自動附加語氣、字數和語言設定" : "點擊「生成提示詞」按鈕載入預設提示詞"}
                    rows={6}
                    className="resize-none text-sm"
                  />
                </div>

                {/* Email Tone */}
                <div className="space-y-2">
                  <Label className="text-base font-medium">語氣風格</Label>
                  <Select value={emailTone} onValueChange={setEmailTone}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {emailTones.map((tone) => (
                        <SelectItem key={tone.id} value={tone.id}>
                          {tone.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Email Length */}
                <div className="space-y-2">
                  <Label className="text-base font-medium">郵件長度</Label>
                  <Select value={emailLength} onValueChange={setEmailLength}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {emailLengths.map((len) => (
                        <SelectItem key={len.id} value={len.id}>
                          <div className="flex flex-col">
                            <span>{len.label}</span>
                            <span className="text-xs text-muted-foreground">{len.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Email Language */}
                <div className="space-y-2">
                  <Label className="text-base font-medium">語言</Label>
                  <Select value={emailLanguage} onValueChange={setEmailLanguage}>
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

                {/* Email Toggle Options */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">額外選項</Label>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <Label htmlFor="email-cta" className="cursor-pointer">加入 Call to Action</Label>
                    </div>
                    <Switch id="email-cta" checked={emailIncludeCTA} onCheckedChange={setEmailIncludeCTA} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-muted-foreground" />
                      <Label htmlFor="email-hashtag" className="cursor-pointer">加入 Hashtag</Label>
                    </div>
                    <Switch id="email-hashtag" checked={emailIncludeHashtag} onCheckedChange={setEmailIncludeHashtag} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smile className="w-4 h-4 text-muted-foreground" />
                      <Label htmlFor="email-emoji" className="cursor-pointer">加入 Emoji</Label>
                    </div>
                    <Switch id="email-emoji" checked={emailIncludeEmoji} onCheckedChange={setEmailIncludeEmoji} />
                  </div>
                </div>

                {/* Generate Email Button */}
                <div className="flex gap-3 pt-2">
                  <Button 
                    onClick={handleGenerateEmail} 
                    disabled={isGenerating || !emailCoreMessage.trim() || !companyInfo.trim()}
                    className="flex-1 gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        生成 Email 文案
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Email Output Section */}
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
                    <div className="bg-muted/50 rounded-lg p-4 whitespace-pre-wrap text-sm leading-relaxed max-h-[600px] overflow-y-auto">
                      {generatedContent}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                    <Mail className="w-12 h-12 mb-4 opacity-50" />
                    <p>配置 Email 設置後點擊生成按鈕</p>
                    <p className="text-sm mt-1">AI 將為您創建專業商務郵件</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 社交媒體文案 Tab */}
        <TabsContent value="social" className="mt-6">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <Hash className="w-6 h-6 text-primary" />
                社交媒體文案
              </CardTitle>
              <CardDescription className="text-lg mt-4">Coming Soon</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Sparkles className="w-16 h-16 mb-6 opacity-30" />
              <p className="text-center">社交媒體文案功能即將推出</p>
              <p className="text-sm mt-2 text-center">敬請期待更多精彩功能</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 歷史記錄 Tab */}
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                歷史記錄
              </CardTitle>
              <CardDescription>查看之前生成的文案</CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">載入中...</p>
                </div>
              ) : historyItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <History className="w-16 h-16 mb-6 opacity-30" />
                  <p className="text-lg font-medium">暫無歷史記錄</p>
                  <p className="text-sm mt-2">您生成的文案將會顯示在這裡</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {historyItems.map((item) => (
                    <div 
                      key={item.id} 
                      className="p-4 border rounded-lg hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                              {getToolTypeLabel(item.tool_type)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(item.created_at), 'yyyy-MM-dd HH:mm')}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {item.prompt.slice(0, 100)}...
                          </p>
                          <p className="text-sm line-clamp-3">
                            {item.result.slice(0, 150)}...
                          </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleViewHistory(item)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleCopyHistoryResult(item.result)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteHistory(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* History View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              文案詳情
            </DialogTitle>
            <DialogDescription>
              {selectedHistoryItem && (
                <span className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                    {getToolTypeLabel(selectedHistoryItem.tool_type)}
                  </span>
                  <span className="text-xs">
                    {format(new Date(selectedHistoryItem.created_at), 'yyyy-MM-dd HH:mm')}
                  </span>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedHistoryItem && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">提示詞</Label>
                  <div className="mt-1 p-3 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap">
                    {selectedHistoryItem.prompt}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-sm font-medium text-muted-foreground">生成結果</Label>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleCopyHistoryResult(selectedHistoryItem.result)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      複製
                    </Button>
                  </div>
                  <div className="mt-1 p-3 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap">
                    {selectedHistoryItem.result}
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Structure Info - Shows for both tabs */}
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
                  (activeTab === 'copywriting' ? structure : emailWritingStyle) === s.id 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
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
