import { useState } from 'react';
import { Search, Loader2, Heart, MessageCircle, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const XiaohongshuSearchPage = () => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('xiaohongshu-search', { body: { query } });
      if (error) throw error;
      setResults(data.results || []);
    } catch (error) {
      toast({ title: '搜尋失敗', variant: 'destructive' });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="heading-display text-2xl mb-1">小紅書搜尋</h1>
        <p className="text-muted-foreground">探索小紅書熱門內容和趨勢</p>
      </div>

      <div className="flex gap-2">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="輸入搜尋關鍵詞..." onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
        <Button onClick={handleSearch} disabled={isSearching}>
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {results.map((item, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{item.content}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                <span className="flex items-center gap-1"><Heart className="w-4 h-4" /> {item.likes}</span>
                <span className="flex items-center gap-1"><MessageCircle className="w-4 h-4" /> {item.comments}</span>
                <span>{item.publishedAt}</span>
              </div>
              <div className="flex gap-1 flex-wrap">
                {item.tags?.slice(0, 3).map((tag: string, j: number) => (
                  <Badge key={j} variant="secondary" className="text-xs">#{tag}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        {results.length === 0 && !isSearching && (
          <div className="col-span-2 text-center py-12 text-muted-foreground">
            <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>輸入關鍵詞探索小紅書內容</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default XiaohongshuSearchPage;
