import { useState } from 'react';
import PointsBalanceCard from '@/components/dashboard/PointsBalanceCard';
import { Search, Loader2, Heart, MessageCircle, BookOpen, History, Coins, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SearchHistoryItem {
  id: string;
  keyword: string;
  sortBy: string;
  resultCount: number;
  searchDate: string;
  resultsFound: number;
}

interface SearchResult {
  title: string;
  content: string;
  author: string;
  likes: number;
  comments: number;
  publishedAt: string;
  tags: string[];
}

const RESULT_OPTIONS = [
  { value: '10', label: '10 個', points: 1 },
  { value: '20', label: '20 個', points: 2 },
  { value: '50', label: '50 個', points: 5 },
  { value: '100', label: '100 個', points: 10 },
];

const SORT_OPTIONS = [
  { value: 'popular', label: '最熱門' },
  { value: 'newest', label: '最新' },
];

const XiaohongshuSearchPage = () => {
  const [keyword, setKeyword] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [resultCount, setResultCount] = useState('10');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState('search');
  const [userPoints] = useState(100); // Mock user points
  const { toast } = useToast();

  const getPointsCost = () => {
    return RESULT_OPTIONS.find(opt => opt.value === resultCount)?.points || 1;
  };

  const handleSearch = async () => {
    if (!keyword.trim()) {
      toast({ title: '請輸入關鍵詞', variant: 'destructive' });
      return;
    }

    const cost = getPointsCost();
    if (userPoints < cost) {
      toast({ title: '點數不足', description: '請購買更多點數', variant: 'destructive' });
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('xiaohongshu-search', {
        body: { 
          query: keyword,
          sortBy,
          maxResults: parseInt(resultCount)
        }
      });
      
      if (error) throw error;
      
      const searchResults = data.results || [];
      setResults(searchResults);

      // Add to history
      const historyItem: SearchHistoryItem = {
        id: Date.now().toString(),
        keyword,
        sortBy,
        resultCount: parseInt(resultCount),
        searchDate: new Date().toLocaleString('zh-TW'),
        resultsFound: searchResults.length,
      };
      setSearchHistory(prev => [historyItem, ...prev.slice(0, 19)]);

      toast({ title: '搜尋完成', description: `找到 ${searchResults.length} 個結果` });
    } catch (error) {
      toast({ title: '搜尋失敗', variant: 'destructive' });
    } finally {
      setIsSearching(false);
    }
  };

  const handleReSearch = (item: SearchHistoryItem) => {
    setKeyword(item.keyword);
    setSortBy(item.sortBy);
    setResultCount(item.resultCount.toString());
    setActiveTab('search');
  };

  const clearHistory = () => {
    setSearchHistory([]);
    toast({ title: '歷史記錄已清除' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Points Balance */}
      <PointsBalanceCard />

      {/* Header */}
      <div>
        <h1 className="heading-display text-2xl mb-1">小紅書熱門貼文搜尋</h1>
        <Card className="mt-4 bg-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm">
              <Coins className="w-4 h-4 text-primary" />
              <span className="text-primary font-medium">
                點數消耗：1 點/10 個結果
              </span>
              <span className="text-muted-foreground">
                (結果數量越多消耗越多點數)
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            搜尋
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="w-4 h-4" />
            歷史記錄
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-6">
              {/* Section Header */}
              <div>
                <h2 className="text-lg font-semibold text-primary mb-1">搜尋小紅書貼文</h2>
                <p className="text-sm text-muted-foreground">輸入關鍵詞搜尋熱門貼文</p>
              </div>

              {/* Keyword Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">關鍵詞</label>
                <Input 
                  value={keyword} 
                  onChange={(e) => setKeyword(e.target.value)} 
                  placeholder="例如：美妝、旅遊、美食..."
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full"
                />
              </div>

              {/* Filters Row */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Sort By */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">排序方式</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Result Count */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">結果數量</label>
                  <Select value={resultCount} onValueChange={setResultCount}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RESULT_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Coins className="w-3 h-3" />
                    將消耗 {getPointsCost()} 點數
                  </p>
                </div>
              </div>

              {/* Search Button */}
              <Button 
                onClick={handleSearch} 
                disabled={isSearching || !keyword.trim()}
                className="w-full h-12 text-base"
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
                    搜尋
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Search Results */}
          {results.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">搜尋結果 ({results.length} 個)</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {results.map((item, i) => (
                  <Card key={i} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2 line-clamp-2">{item.title}</h4>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{item.content}</p>
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                        <span className="font-medium text-foreground">@{item.author}</span>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4 text-red-500" />
                            {item.likes?.toLocaleString() || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            {item.comments?.toLocaleString() || 0}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1 flex-wrap">
                          {item.tags?.slice(0, 3).map((tag: string, j: number) => (
                            <Badge key={j} variant="secondary" className="text-xs">#{tag}</Badge>
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">{item.publishedAt}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {results.length === 0 && !isSearching && (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>輸入關鍵詞探索小紅書熱門內容</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">搜尋歷史</h3>
            {searchHistory.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearHistory}>
                清除全部
              </Button>
            )}
          </div>

          {searchHistory.length > 0 ? (
            <div className="space-y-3">
              {searchHistory.map((item) => (
                <Card key={item.id} className="hover:bg-accent/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{item.keyword}</Badge>
                          <Badge variant="secondary" className="text-xs">
                            {SORT_OPTIONS.find(s => s.value === item.sortBy)?.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.searchDate}
                          </span>
                          <span>結果數量：{item.resultCount} 個</span>
                          <span>找到：{item.resultsFound} 個</span>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleReSearch(item)}
                      >
                        重新搜尋
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <History className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>暫無搜尋歷史</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default XiaohongshuSearchPage;
