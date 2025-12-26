import { useState } from 'react';
import { Search, Loader2, Youtube, X, Info, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const [videoFeatures, setVideoFeatures] = useState({
    hd: false,
    fourK: false,
    live: false,
    subtitles: false
  });
  
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
          features: videoFeatures
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

  const toggleFeature = (feature: keyof typeof videoFeatures) => {
    setVideoFeatures(prev => ({ ...prev, [feature]: !prev[feature] }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-display text-2xl mb-1">熱門 YouTube 影片搜尋</h1>
          <p className="text-muted-foreground">搜尋 YouTube 熱門內容和趨勢</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">點數消耗：</span>
          <Badge variant="secondary">{pointsRequired} 點/{videoCount} 部影片</Badge>
          <span className="text-muted-foreground ml-2">剩餘點數：</span>
          <Badge variant="outline">{userPoints} 點</Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="search" className="gap-2">
            <Search className="w-4 h-4" />
            搜尋影片
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Clock className="w-4 h-4" />
            歷史記錄
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6 mt-6">
          {/* Usage Tip */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              💡 使用提示：請逐個輸入關鍵字，每個關鍵字單獨添加。例如先輸入「AI Agent」點擊添加，再輸入「工作流」點擊添加。其他篩選功能保持不變。
            </AlertDescription>
          </Alert>

          {/* Keyword Input */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>搜尋關鍵字</Label>
                <div className="flex gap-2">
                  <Input 
                    value={keywordInput} 
                    onChange={(e) => setKeywordInput(e.target.value)} 
                    placeholder="請輸入一個關鍵字，例如: AI Agent" 
                    onKeyDown={handleKeyDown}
                    className="flex-1"
                  />
                  <Button onClick={handleAddKeyword} variant="secondary">
                    添加
                  </Button>
                </div>
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
            </CardContent>
          </Card>

          {/* Filter Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Sort By */}
            <Card>
              <CardContent className="p-4 space-y-2">
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
              </CardContent>
            </Card>

            {/* Published Date */}
            <Card>
              <CardContent className="p-4 space-y-2">
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
              </CardContent>
            </Card>

            {/* Video Count */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <Label>影片數量</Label>
                <Select value={videoCount} onValueChange={setVideoCount}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 部影片 (1 點)</SelectItem>
                    <SelectItem value="20">20 部影片 (2 點)</SelectItem>
                    <SelectItem value="30">30 部影片 (3 點)</SelectItem>
                    <SelectItem value="40">40 部影片 (4 點)</SelectItem>
                    <SelectItem value="50">50 部影片 (5 點)</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Video Features */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <Label>影片特性</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="hd" 
                      checked={videoFeatures.hd}
                      onCheckedChange={() => toggleFeature('hd')}
                    />
                    <Label htmlFor="hd" className="text-sm cursor-pointer">HD 高畫質</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="fourK" 
                      checked={videoFeatures.fourK}
                      onCheckedChange={() => toggleFeature('fourK')}
                    />
                    <Label htmlFor="fourK" className="text-sm cursor-pointer">4K 超高畫質</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="live" 
                      checked={videoFeatures.live}
                      onCheckedChange={() => toggleFeature('live')}
                    />
                    <Label htmlFor="live" className="text-sm cursor-pointer">正在直播</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="subtitles" 
                      checked={videoFeatures.subtitles}
                      onCheckedChange={() => toggleFeature('subtitles')}
                    />
                    <Label htmlFor="subtitles" className="text-sm cursor-pointer">包含字幕</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
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
