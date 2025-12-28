import { useState, useEffect } from 'react';
import PointsBalanceCard from '@/components/dashboard/PointsBalanceCard';
import { 
  Video, Loader2, Copy, Check, Trash2, RefreshCw, 
  Link2, FileText, Clock, ChevronRight, PlayCircle, X,
  FileSearch, PenLine, List, Languages, Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const outputLanguages = [
  { value: 'zh-TW', label: '繁體中文' },
  { value: 'zh-CN', label: '簡體中文' },
  { value: 'en', label: 'English' },
];

const rewriteStyles = [
  { value: 'xiaohongshu', label: '小紅書', icon: '📕' },
  { value: 'jinyong', label: '金庸武俠小說', icon: '⚔️' },
  { value: 'disney', label: '迪士尼', icon: '🏰' },
  { value: 'laogao', label: '老高風格', icon: '🎙️' },
  { value: 'aida', label: 'AIDA模型（注意力-興趣-渴望-行動）', icon: '🎯' },
  { value: 'pas', label: 'PAS結構（問題-煽動-解決方案）', icon: '💡' },
  { value: 'fab', label: 'FAB框架（特點-優勢-好處）', icon: '✨' },
  { value: '4p', label: '4P模型（圖畫-承諾-證明-推動）', icon: '📊' },
  { value: 'before-after-bridge', label: 'Before-After-Bridge（前後對比法）', icon: '🌉' },
  { value: 'heros-journey', label: '英雄之旅（經典故事結構）', icon: '🦸' },
  { value: 'three-acts', label: '三幕劇（設定-對抗-解決）', icon: '🎬' },
  { value: 'sensory-immersion', label: '感官沉浸法（細節描繪情感連結）', icon: '🎨' },
  { value: 'custom', label: '自訂風格', icon: '✏️' },
];

interface HistoryItem {
  id: string;
  source_url: string;
  rewritten_content: string;
  style: string;
  output_language: string;
  created_at: string;
  is_batch: boolean;
}

const ContentOrganizePage = () => {
  const [activeTab, setActiveTab] = useState<'rewrite' | 'history'>('rewrite');
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const { toast } = useToast();

  // Single link state
  const [url, setUrl] = useState('');
  const [outputLanguage, setOutputLanguage] = useState('zh-TW');
  const [style, setStyle] = useState('xiaohongshu');
  const [customStyle, setCustomStyle] = useState('');
  const [targetWordCount, setTargetWordCount] = useState('');
  const [geoOptimized, setGeoOptimized] = useState(false);
  const [customEnding, setCustomEnding] = useState(false);
  const [customEndingText, setCustomEndingText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [isActionProcessing, setIsActionProcessing] = useState<string | null>(null);

  // Raw content state for action buttons
  const [rawContent, setRawContent] = useState('');
  const [rawContentResult, setRawContentResult] = useState('');

  // Batch state
  const [batchUrls, setBatchUrls] = useState('');
  const [batchOutputLanguage, setBatchOutputLanguage] = useState('zh-TW');
  const [batchStyle, setBatchStyle] = useState('xiaohongshu');
  const [batchCustomStyle, setBatchCustomStyle] = useState('');
  const [batchTargetWordCount, setBatchTargetWordCount] = useState('');
  const [batchGeoOptimized, setBatchGeoOptimized] = useState(false);
  const [batchCustomEnding, setBatchCustomEnding] = useState(false);
  const [batchCustomEndingText, setBatchCustomEndingText] = useState('');
  const [batchResults, setBatchResults] = useState<Array<{ url: string; content: string; status: string }>>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  // History state
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Video dialog state
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  // RSS dialog state
  const [isRssOpen, setIsRssOpen] = useState(false);

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('content_rewrites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setHistory((data || []) as HistoryItem[]);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const saveToHistory = async (sourceUrl: string, content: string, isBatch = false) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('content_rewrites').insert({
        user_id: user.id,
        source_url: sourceUrl,
        source_type: sourceUrl.includes('youtube.com') || sourceUrl.includes('youtu.be') ? 'youtube' : 'website',
        rewritten_content: content,
        output_language: isBatch ? batchOutputLanguage : outputLanguage,
        style: isBatch ? batchStyle : style,
        custom_style: isBatch ? batchCustomStyle : customStyle,
        target_word_count: parseInt(isBatch ? batchTargetWordCount : targetWordCount) || null,
        geo_optimized: isBatch ? batchGeoOptimized : geoOptimized,
        custom_ending: isBatch ? batchCustomEnding : customEnding,
        custom_ending_text: isBatch ? batchCustomEndingText : customEndingText,
        is_batch: isBatch,
        status: 'completed'
      });
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  };

  const handleSingleRewrite = async () => {
    if (!url.trim()) {
      toast({ title: '請輸入網站或YouTube連結', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    setResult('');

    try {
      const { data, error } = await supabase.functions.invoke('content-rewrite', {
        body: {
          url,
          outputLanguage,
          style,
          customStyle: style === 'custom' ? customStyle : undefined,
          targetWordCount: targetWordCount ? parseInt(targetWordCount) : undefined,
          geoOptimized,
          customEnding,
          customEndingText: customEnding ? customEndingText : undefined,
        }
      });

      if (error) throw error;

      if (data?.success && data?.results?.content) {
        setResult(data.results.content);
        await saveToHistory(url, data.results.content);
        toast({ title: '改寫完成！' });
      } else if (data?.results?.status === 'rate_limited') {
        toast({ title: '請求過於頻繁，請稍後再試', variant: 'destructive' });
      } else if (data?.results?.status === 'credits_exhausted') {
        toast({ title: 'AI 額度已用完，請充值', variant: 'destructive' });
      } else {
        throw new Error('改寫失敗');
      }
    } catch (error) {
      console.error('Rewrite error:', error);
      toast({ title: '改寫失敗，請重試', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchRewrite = async () => {
    const urls = batchUrls.split('\n').filter(u => u.trim());
    if (urls.length === 0) {
      toast({ title: '請輸入至少一個連結', variant: 'destructive' });
      return;
    }

    setIsBatchProcessing(true);
    setBatchResults([]);

    try {
      const { data, error } = await supabase.functions.invoke('content-rewrite', {
        body: {
          isBatch: true,
          urls,
          outputLanguage: batchOutputLanguage,
          style: batchStyle,
          customStyle: batchStyle === 'custom' ? batchCustomStyle : undefined,
          targetWordCount: batchTargetWordCount ? parseInt(batchTargetWordCount) : undefined,
          geoOptimized: batchGeoOptimized,
          customEnding: batchCustomEnding,
          customEndingText: batchCustomEnding ? batchCustomEndingText : undefined,
        }
      });

      if (error) throw error;

      if (data?.success && data?.results) {
        setBatchResults(data.results);
        // Save each successful result to history
        for (const r of data.results) {
          if (r.status === 'success' && r.content) {
            await saveToHistory(r.url, r.content, true);
          }
        }
        toast({ title: `批量處理完成！成功 ${data.results.filter((r: any) => r.status === 'success').length}/${urls.length}` });
      }
    } catch (error) {
      console.error('Batch rewrite error:', error);
      toast({ title: '批量處理失敗，請重試', variant: 'destructive' });
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: '已複製到剪貼板' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteHistory = async (id: string) => {
    try {
      const { error } = await supabase.from('content_rewrites').delete().eq('id', id);
      if (error) throw error;
      setHistory(prev => prev.filter(h => h.id !== id));
      toast({ title: '已刪除' });
    } catch (error) {
      toast({ title: '刪除失敗', variant: 'destructive' });
    }
  };

  const handleUseHistory = (item: HistoryItem) => {
    setUrl(item.source_url);
    setOutputLanguage(item.output_language);
    setStyle(item.style);
    setResult(item.rewritten_content);
    setActiveTab('rewrite');
    setMode('single');
  };

  const getStyleLabel = (value: string) => {
    return rewriteStyles.find(s => s.value === value)?.label || value;
  };

  // Action button handlers for rewritten content
  const handleContentAction = async (action: string) => {
    if (!result) {
      toast({ title: '請先生成改寫結果', variant: 'destructive' });
      return;
    }

    setIsActionProcessing(action);

    try {
      let actionPrompt = '';
      switch (action) {
        case 'summarize':
          actionPrompt = `請將以下內容進行總結，提取核心要點，保持簡潔清晰：\n\n${result}`;
          break;
        case 'condense':
          actionPrompt = `請將以下內容進行撮寫，精簡內容但保留關鍵信息：\n\n${result}`;
          break;
        case 'outline':
          actionPrompt = `請為以下內容生成詳細大綱，包含主要標題和子標題：\n\n${result}`;
          break;
        case 'translate-en':
          actionPrompt = `請將以下內容翻譯成英文，保持原文的風格和語氣：\n\n${result}`;
          break;
        case 'translate-zh':
          actionPrompt = `請將以下內容翻譯成繁體中文，保持原文的風格和語氣：\n\n${result}`;
          break;
        case 'keywords':
          actionPrompt = `請從以下內容中提取5-10個關鍵字/關鍵詞，以逗號分隔：\n\n${result}`;
          break;
        default:
          throw new Error('未知操作');
      }

      const { data, error } = await supabase.functions.invoke('content-rewrite', {
        body: {
          directPrompt: actionPrompt,
          outputLanguage,
        }
      });

      if (error) throw error;

      if (data?.success && data?.results?.content) {
        setResult(data.results.content);
        toast({ title: `${getActionLabel(action)}完成！` });
      } else if (data?.results?.status === 'rate_limited') {
        toast({ title: '請求過於頻繁，請稍後再試', variant: 'destructive' });
      } else if (data?.results?.status === 'credits_exhausted') {
        toast({ title: 'AI 額度已用完，請充值', variant: 'destructive' });
      } else {
        throw new Error('處理失敗');
      }
    } catch (error) {
      console.error('Action error:', error);
      toast({ title: '處理失敗，請重試', variant: 'destructive' });
    } finally {
      setIsActionProcessing(null);
    }
  };

  // Action button handlers for raw content
  const handleRawContentAction = async (action: string) => {
    if (!rawContent.trim()) {
      toast({ title: '請先貼上原文內容', variant: 'destructive' });
      return;
    }

    setIsActionProcessing(action);

    try {
      let actionPrompt = '';
      switch (action) {
        case 'summarize':
          actionPrompt = `請將以下內容進行總結，提取核心要點，保持簡潔清晰：\n\n${rawContent}`;
          break;
        case 'condense':
          actionPrompt = `請將以下內容進行撮寫，精簡內容但保留關鍵信息：\n\n${rawContent}`;
          break;
        case 'outline':
          actionPrompt = `請為以下內容生成詳細大綱，包含主要標題和子標題：\n\n${rawContent}`;
          break;
        case 'translate-en':
          actionPrompt = `請將以下內容翻譯成英文，保持原文的風格和語氣：\n\n${rawContent}`;
          break;
        case 'translate-zh':
          actionPrompt = `請將以下內容翻譯成繁體中文，保持原文的風格和語氣：\n\n${rawContent}`;
          break;
        case 'keywords':
          actionPrompt = `請從以下內容中提取5-10個關鍵字/關鍵詞，以逗號分隔：\n\n${rawContent}`;
          break;
        default:
          throw new Error('未知操作');
      }

      const { data, error } = await supabase.functions.invoke('content-rewrite', {
        body: {
          directPrompt: actionPrompt,
          outputLanguage,
        }
      });

      if (error) throw error;

      if (data?.success && data?.results?.content) {
        setRawContentResult(data.results.content);
        toast({ title: `${getActionLabel(action)}完成！` });
      } else if (data?.results?.status === 'rate_limited') {
        toast({ title: '請求過於頻繁，請稍後再試', variant: 'destructive' });
      } else if (data?.results?.status === 'credits_exhausted') {
        toast({ title: 'AI 額度已用完，請充值', variant: 'destructive' });
      } else {
        throw new Error('處理失敗');
      }
    } catch (error) {
      console.error('Action error:', error);
      toast({ title: '處理失敗，請重試', variant: 'destructive' });
    } finally {
      setIsActionProcessing(null);
    }
  };

  const getActionLabel = (action: string): string => {
    const labels: Record<string, string> = {
      'summarize': '總結',
      'condense': '撮寫',
      'outline': '生成大綱',
      'translate-en': '翻譯成英文',
      'translate-zh': '翻譯成中文',
      'keywords': '提取關鍵字',
    };
    return labels[action] || action;
  };

  const renderActionButtons = (onAction: (action: string) => void) => (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => onAction('summarize')}
        disabled={isActionProcessing !== null}
      >
        {isActionProcessing === 'summarize' ? (
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        ) : (
          <FileSearch className="w-3 h-3 mr-1" />
        )}
        總結
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => onAction('condense')}
        disabled={isActionProcessing !== null}
      >
        {isActionProcessing === 'condense' ? (
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        ) : (
          <PenLine className="w-3 h-3 mr-1" />
        )}
        撮寫
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => onAction('outline')}
        disabled={isActionProcessing !== null}
      >
        {isActionProcessing === 'outline' ? (
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        ) : (
          <List className="w-3 h-3 mr-1" />
        )}
        生成大綱
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => onAction('translate-en')}
        disabled={isActionProcessing !== null}
      >
        {isActionProcessing === 'translate-en' ? (
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        ) : (
          <Languages className="w-3 h-3 mr-1" />
        )}
        翻譯成英文
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => onAction('translate-zh')}
        disabled={isActionProcessing !== null}
      >
        {isActionProcessing === 'translate-zh' ? (
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        ) : (
          <Languages className="w-3 h-3 mr-1" />
        )}
        翻譯成中文
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => onAction('keywords')}
        disabled={isActionProcessing !== null}
      >
        {isActionProcessing === 'keywords' ? (
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        ) : (
          <Tag className="w-3 h-3 mr-1" />
        )}
        提取關鍵字
      </Button>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Points Balance */}
      <PointsBalanceCard />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="heading-display text-2xl mb-1">內容整理</h1>
          <p className="text-muted-foreground">
            輸入網站連結或 YouTube 影片連結，選擇風格，讓 AI 幫您重寫內容
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setIsVideoOpen(true)}
          className="flex items-center gap-2"
        >
          <PlayCircle className="w-4 h-4" />
          📺 觀看教學：影片、文章內容提取
        </Button>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'rewrite' | 'history')}>
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="rewrite" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            內容改寫
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            歷史記錄
          </TabsTrigger>
        </TabsList>

        {/* Rewrite Tab */}
        <TabsContent value="rewrite" className="mt-6">
          {/* Mode Toggle */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={mode === 'single' ? 'default' : 'outline'}
              onClick={() => setMode('single')}
              className="flex items-center gap-2"
            >
              <Link2 className="w-4 h-4" />
              單一連結
            </Button>
            <Button
              variant={mode === 'batch' ? 'default' : 'outline'}
              onClick={() => setMode('batch')}
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              批量處理
            </Button>
          </div>

          {/* Single Link Mode */}
          {mode === 'single' && (
            <div className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Input Form */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Link2 className="w-5 h-5" />
                      輸入設定
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">填寫以下資訊開始改寫</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* URL Input */}
                    <div className="space-y-2">
                      <Label>網站或 YouTube 連結</Label>
                      <Input
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://example.com 或 https://youtube.com/watch?v=..."
                      />
                      <p className="text-xs text-muted-foreground">
                        💡 提示：為確保處理穩定，建議使用 10-15 分鐘以內的 YouTube 影片<br />
                        ⏱️ 處理時間通常需要 1-2 分鐘
                      </p>
                    </div>

                    {/* Output Language */}
                    <div className="space-y-2">
                      <Label>輸出語言</Label>
                      <Select value={outputLanguage} onValueChange={setOutputLanguage}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {outputLanguages.map(lang => (
                            <SelectItem key={lang.value} value={lang.value}>
                              {lang.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Rewrite Style */}
                    <div className="space-y-2">
                      <Label>改寫風格</Label>
                      <Select value={style} onValueChange={setStyle}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {rewriteStyles.map(s => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.icon} {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Custom Style Input */}
                    {style === 'custom' && (
                      <div className="space-y-2">
                        <Label>自訂風格描述</Label>
                        <Textarea
                          value={customStyle}
                          onChange={(e) => setCustomStyle(e.target.value)}
                          placeholder="描述您想要的改寫風格..."
                          rows={3}
                        />
                      </div>
                    )}

                    {/* Target Word Count */}
                    <div className="space-y-2">
                      <Label>目標字數（選填）</Label>
                      <Input
                        type="number"
                        value={targetWordCount}
                        onChange={(e) => setTargetWordCount(e.target.value)}
                        placeholder="例如：500"
                      />
                    </div>

                    {/* GEO Optimization */}
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>文章格式優化</Label>
                        <p className="text-xs text-muted-foreground">轉換為GEO優化格式</p>
                      </div>
                      <Switch checked={geoOptimized} onCheckedChange={setGeoOptimized} />
                    </div>

                    {/* Custom Ending */}
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>自訂結尾</Label>
                        <p className="text-xs text-muted-foreground">為重寫內容添加結尾</p>
                      </div>
                      <Switch checked={customEnding} onCheckedChange={setCustomEnding} />
                    </div>

                    {customEnding && (
                      <div className="space-y-2">
                        <Label>結尾內容</Label>
                        <Textarea
                          value={customEndingText}
                          onChange={(e) => setCustomEndingText(e.target.value)}
                          placeholder="輸入您想要的結尾內容..."
                          rows={3}
                        />
                      </div>
                    )}

                    {/* Submit Button */}
                    <Button
                      className="w-full"
                      onClick={handleSingleRewrite}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          處理中...
                        </>
                      ) : (
                        <>
                          開始改寫 <Badge variant="secondary" className="ml-2">扣1點數</Badge>
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Result */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>改寫結果</CardTitle>
                      <p className="text-sm text-muted-foreground">提交後結果將顯示在這裡</p>
                    </div>
                    {result && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(result)}
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Action Buttons for result */}
                    {result && (
                      <div className="pb-3 border-b">
                        {renderActionButtons(handleContentAction)}
                      </div>
                    )}
                    
                    {result ? (
                      <div className="bg-muted/50 rounded-lg p-4 whitespace-pre-wrap text-sm max-h-[600px] overflow-y-auto">
                        {result}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                        <FileText className="w-12 h-12 mb-4 opacity-50" />
                        <p className="text-center">填寫左側表單開始改寫</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Raw Content Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    原文內容處理
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    貼上原文內容，使用以下工具進行處理
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>原文內容</Label>
                        <Textarea
                          value={rawContent}
                          onChange={(e) => setRawContent(e.target.value)}
                          placeholder="貼上您要處理的原文內容..."
                          rows={10}
                        />
                      </div>
                      {/* Action Buttons for raw content */}
                      <div>
                        <Label className="mb-2 block">操作工具</Label>
                        {renderActionButtons(handleRawContentAction)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>處理結果</Label>
                        {rawContentResult && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopy(rawContentResult)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      {rawContentResult ? (
                        <div className="bg-muted/50 rounded-lg p-4 whitespace-pre-wrap text-sm max-h-[400px] overflow-y-auto">
                          {rawContentResult}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground bg-muted/30 rounded-lg">
                          <FileText className="w-12 h-12 mb-4 opacity-50" />
                          <p className="text-center">選擇操作後結果將顯示在這裡</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Batch Mode */}
          {mode === 'batch' && (
            <div className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Batch Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>批量處理選項</CardTitle>
                    <p className="text-sm text-muted-foreground">設定批量生成的參數</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Output Language */}
                    <div className="space-y-2">
                      <Label>輸出語言</Label>
                      <Select value={batchOutputLanguage} onValueChange={setBatchOutputLanguage}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {outputLanguages.map(lang => (
                            <SelectItem key={lang.value} value={lang.value}>
                              {lang.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Rewrite Style */}
                    <div className="space-y-2">
                      <Label>改寫風格</Label>
                      <Select value={batchStyle} onValueChange={setBatchStyle}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {rewriteStyles.map(s => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.icon} {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Custom Style Input */}
                    {batchStyle === 'custom' && (
                      <div className="space-y-2">
                        <Label>自訂風格描述</Label>
                        <Textarea
                          value={batchCustomStyle}
                          onChange={(e) => setBatchCustomStyle(e.target.value)}
                          placeholder="描述您想要的改寫風格..."
                          rows={3}
                        />
                      </div>
                    )}

                    {/* Target Word Count */}
                    <div className="space-y-2">
                      <Label>目標字數（選填）</Label>
                      <Input
                        type="number"
                        value={batchTargetWordCount}
                        onChange={(e) => setBatchTargetWordCount(e.target.value)}
                        placeholder="例如：500"
                      />
                    </div>

                    {/* GEO Optimization */}
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>文章格式優化</Label>
                        <p className="text-xs text-muted-foreground">轉換為GEO優化格式</p>
                      </div>
                      <Switch checked={batchGeoOptimized} onCheckedChange={setBatchGeoOptimized} />
                    </div>

                    {/* Custom Ending */}
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>自訂結尾</Label>
                        <p className="text-xs text-muted-foreground">為重寫內容添加結尾</p>
                      </div>
                      <Switch checked={batchCustomEnding} onCheckedChange={setBatchCustomEnding} />
                    </div>

                    {batchCustomEnding && (
                      <div className="space-y-2">
                        <Label>結尾內容</Label>
                        <Textarea
                          value={batchCustomEndingText}
                          onChange={(e) => setBatchCustomEndingText(e.target.value)}
                          placeholder="輸入您想要的結尾內容..."
                          rows={3}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Batch URLs Input */}
                <Card>
                  <CardHeader>
                    <CardTitle>批量連結輸入</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      每行輸入一個網頁或YouTube連結，或從RSS選擇
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      value={batchUrls}
                      onChange={(e) => setBatchUrls(e.target.value)}
                      placeholder={`https://example.com/article1\nhttps://youtube.com/watch?v=...\nhttps://example.com/article2`}
                      rows={10}
                    />

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsRssOpen(true)}
                        className="flex-1"
                      >
                        從RSS選擇
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={handleBatchRewrite}
                        disabled={isBatchProcessing}
                      >
                        {isBatchProcessing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            處理中...
                          </>
                        ) : (
                          '批量生成'
                        )}
                      </Button>
                    </div>

                    {/* Batch Results */}
                    {batchResults.length > 0 && (
                      <div className="space-y-4 mt-4">
                        <h4 className="font-medium">批量處理結果</h4>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto">
                          {batchResults.map((r, idx) => (
                            <Card key={idx} className="p-3">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <p className="text-xs text-muted-foreground truncate flex-1">{r.url}</p>
                                <Badge variant={r.status === 'success' ? 'default' : 'destructive'}>
                                  {r.status === 'success' ? '成功' : '失敗'}
                                </Badge>
                              </div>
                              {r.status === 'success' && r.content && (
                                <div className="relative">
                                  <div className="bg-muted/50 rounded p-2 text-xs max-h-32 overflow-y-auto">
                                    {r.content.substring(0, 300)}...
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="absolute top-1 right-1"
                                    onClick={() => handleCopy(r.content)}
                                  >
                                    <Copy className="w-3 h-3" />
                                  </Button>
                                </div>
                              )}
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Batch Raw Content Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    原文內容處理
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    貼上原文內容，使用以下工具進行處理
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>原文內容</Label>
                        <Textarea
                          value={rawContent}
                          onChange={(e) => setRawContent(e.target.value)}
                          placeholder="貼上您要處理的原文內容..."
                          rows={10}
                        />
                      </div>
                      {/* Action Buttons for raw content */}
                      <div>
                        <Label className="mb-2 block">操作工具</Label>
                        {renderActionButtons(handleRawContentAction)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>處理結果</Label>
                        {rawContentResult && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopy(rawContentResult)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      {rawContentResult ? (
                        <div className="bg-muted/50 rounded-lg p-4 whitespace-pre-wrap text-sm max-h-[400px] overflow-y-auto">
                          {rawContentResult}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground bg-muted/30 rounded-lg">
                          <FileText className="w-12 h-12 mb-4 opacity-50" />
                          <p className="text-center">選擇操作後結果將顯示在這裡</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>歷史記錄</CardTitle>
              <Button variant="outline" size="sm" onClick={loadHistory} disabled={isLoadingHistory}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                刷新
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>暫無歷史記錄</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => (
                    <Card key={item.id} className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline">{getStyleLabel(item.style)}</Badge>
                            {item.is_batch && <Badge variant="secondary">批量</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground truncate mb-2">
                            {item.source_url}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(item.created_at), 'yyyy-MM-dd HH:mm')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleUseHistory(item)}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopy(item.rewritten_content)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteHistory(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Video Tutorial Dialog */}
      <Dialog open={isVideoOpen} onOpenChange={setIsVideoOpen}>
        <DialogContent className="max-w-2xl" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>教學影片：影片、文章內容提取</DialogTitle>
          </DialogHeader>
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Video className="w-16 h-16 mx-auto mb-4" />
              <p>教學影片即將推出</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* RSS Selection Dialog */}
      <Dialog open={isRssOpen} onOpenChange={setIsRssOpen}>
        <DialogContent className="max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>從RSS選擇連結</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>請先在 RSS 訂閱頁面設定您的訂閱源</p>
            <Button variant="outline" className="mt-4" onClick={() => setIsRssOpen(false)}>
              關閉
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContentOrganizePage;