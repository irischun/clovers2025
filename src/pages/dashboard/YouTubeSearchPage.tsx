import { useState } from 'react';
import PointsBalanceCard from '@/components/dashboard/PointsBalanceCard';
import { Search, Loader2, Youtube, X, Info, Clock, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/i18n/LanguageContext';

interface SearchHistoryItem {
  id: string;
  keywords: string[];
  searchedAt: string;
  resultCount: number;
}

interface VideoResult {
  title: string;
  channel: string;
  views: string;
  duration: string;
  publishedAt: string;
  thumbnail: string;
  description: string;
  videoId?: string;
}

const YouTubeSearchPage = () => {
  const { t } = useLanguage();
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<VideoResult[]>([]);
  const [activeTab, setActiveTab] = useState('search');
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  
  // Filter options
  const [sortBy, setSortBy] = useState('relevance');
  const [publishedDate, setPublishedDate] = useState('all');
  const [videoCount, setVideoCount] = useState('10');
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  
  const { toast } = useToast();

  // Points calculation
  const userPoints = 100;
  const pointsRequired = Math.ceil(parseInt(videoCount) / 10);

  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const handleFeatureToggle = (feature: string) => {
    setSelectedFeature(prev => prev === feature ? null : feature);
  };

  const handleSearch = async () => {
    if (keywords.length === 0) {
      toast({ title: '請至少添加一個關鍵字', variant: 'destructive' });
      return;
    }

    if (userPoints < pointsRequired) {
      toast({ title: '點數不足', description: `需要 ${pointsRequired} 點`, variant: 'destructive' });
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('youtube-search', {
        body: { 
          query: keywords.join(' '), 
          maxResults: parseInt(videoCount),
          sortBy,
          publishedDate,
          feature: selectedFeature
        }
      });
      if (error) throw error;
      setResults(data.results || []);
      
      // Add to history
      const historyItem: SearchHistoryItem = {
        id: Date.now().toString(),
        keywords: [...keywords],
        searchedAt: new Date().toLocaleString('zh-TW'),
        resultCount: data.results?.length || 0
      };
      setSearchHistory(prev => [historyItem, ...prev.slice(0, 9)]);
      
      toast({ title: '搜尋完成', description: `找到 ${data.results?.length || 0} 部影片，消耗 ${pointsRequired} 點` });
    } catch (error) {
      toast({ title: '搜尋失敗', variant: 'destructive' });
    } finally {
      setIsSearching(false);
    }
  };

  const handleHistorySearch = (item: SearchHistoryItem) => {
    setKeywords(item.keywords);
    setActiveTab('search');
  };

  const handleClearHistory = () => {
    setSearchHistory([]);
    toast({ title: '歷史記錄已清除' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Points Balance */}
      <PointsBalanceCard />

      {/* Header */}
      <div className="flex items-center gap-3">
        <Search className="w-7 h-7 text-primary" />
        <h1 className="heading-display text-2xl">熱門 YouTube 影片搜尋</h1>
      </div>

      {/* Points Info Banner */}
      <div className="bg-muted/50 border border-border rounded-lg px-4 py-3">
        <span className="text-primary font-semibold">點數消耗：1 點/10 部影片</span>
        <span className="text-muted-foreground ml-1">(影片數量越多消耗越多點數)</span>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-auto">
          <TabsTrigger value="search">搜尋影片</TabsTrigger>
          <TabsTrigger value="history">歷史記錄</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6 mt-6">
          {/* Usage Tip */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              💡 <strong>使用提示：</strong>請逐個輸入關鍵字，每個關鍵字單獨添加。例如先輸入「AI Agent」點擊添加，再輸入「工作流」點擊添加。其他篩選功能保持不變。
            </AlertDescription>
          </Alert>

          {/* Keyword Input */}
          <div className="space-y-3">
            <Label className="text-base">搜尋關鍵字</Label>
            <div className="flex gap-2">
              <Input 
                value={keywordInput} 
                onChange={(e) => setKeywordInput(e.target.value)} 
                placeholder="請輸入一個關鍵字，例如: AI Agent" 
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button onClick={handleAddKeyword} variant="secondary" size="icon" className="shrink-0">
                <Plus className="w-5 h-5" />
              </Button>
            </div>

            {/* Keyword Chips */}
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {keywords.map((keyword, index) => (
                  <Badge key={index} variant="default" className="gap-1 px-3 py-1.5">
                    {keyword}
                    <button 
                      onClick={() => handleRemoveKeyword(keyword)}
                      className="ml-1 hover:bg-primary-foreground/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Filter Options - 2 columns for Sort & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>排序方式</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">相關性最高</SelectItem>
                  <SelectItem value="viewCount">觀看次數最多</SelectItem>
                  <SelectItem value="date">上傳日期最新</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>發佈日期</Label>
              <Select value={publishedDate} onValueChange={setPublishedDate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部時間</SelectItem>
                  <SelectItem value="week">過去一週</SelectItem>
                  <SelectItem value="month">過去一個月</SelectItem>
                  <SelectItem value="year">過去一年</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Video Count */}
          <div className="space-y-2">
            <Label>影片數量</Label>
            <Select value={videoCount} onValueChange={setVideoCount}>
              <SelectTrigger className="md:w-1/2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 部影片 (1 點數)</SelectItem>
                <SelectItem value="20">20 部影片 (2 點數)</SelectItem>
                <SelectItem value="30">30 部影片 (3 點數)</SelectItem>
                <SelectItem value="40">40 部影片 (4 點數)</SelectItem>
                <SelectItem value="50">50 部影片 (5 點數)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Video Features - Radio style (single select) */}
          <div className="space-y-3">
            <Label>影片特性</Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'hd', label: 'HD 高畫質' },
                { key: 'fourK', label: '4K 超高畫質' },
                { key: 'live', label: '正在直播' },
                { key: 'subtitles', label: '包含字幕' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleFeatureToggle(key)}
                  className="flex items-center gap-3 text-left"
                >
                  <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selectedFeature === key 
                      ? 'border-primary' 
                      : 'border-muted-foreground/40'
                  }`}>
                    {selectedFeature === key && (
                      <span className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </span>
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Search Button */}
          <Button 
            onClick={handleSearch} 
            disabled={isSearching || keywords.length === 0}
            className="w-full h-12 text-lg"
            size="lg"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                搜尋中...
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                開始搜尋
              </>
            )}
          </Button>

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">搜尋結果 ({results.length} 部影片)</h2>
              <div className="grid gap-4">
                {results.map((item, i) => (
                  <Card key={i} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex gap-4">
                      <div className="w-48 h-28 bg-muted rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                        {item.thumbnail && item.thumbnail !== 'placeholder' ? (
                          <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <Youtube className="w-10 h-10 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <h3 className="font-medium line-clamp-2 hover:text-primary cursor-pointer">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {item.channel} • {item.views} 觀看 • {item.publishedAt}
                          {item.duration && ` • ${item.duration}`}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {results.length === 0 && !isSearching && (
            <div className="text-center py-16 text-muted-foreground">
              <Youtube className="w-20 h-20 mx-auto mb-4 opacity-30" />
              <p className="text-lg">添加關鍵字並點擊「開始搜尋」</p>
              <p className="text-sm mt-2">搜尋 YouTube 熱門影片和趨勢內容</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">搜尋歷史記錄</h2>
              {searchHistory.length > 0 && (
                <Button variant="ghost" size="sm" onClick={handleClearHistory}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  清除全部
                </Button>
              )}
            </div>

            {searchHistory.length > 0 ? (
              <div className="grid gap-3">
                {searchHistory.map((item) => (
                  <Card 
                    key={item.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleHistorySearch(item)}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex flex-wrap gap-2">
                          {item.keywords.map((keyword, index) => (
                            <Badge key={index} variant="secondary">{keyword}</Badge>
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {item.searchedAt} • {item.resultCount} 部影片
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        重新搜尋
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <Clock className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>尚無搜尋歷史記錄</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default YouTubeSearchPage;
