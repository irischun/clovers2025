import { useState } from 'react';
import { Search, Loader2, ExternalLink, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const YouTubeSearchPage = () => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('youtube-search', {
        body: { query, maxResults: 10 }
      });
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
        <h1 className="heading-display text-2xl mb-1">YouTube 搜尋</h1>
        <p className="text-muted-foreground">搜尋 YouTube 熱門內容和趨勢</p>
      </div>

      <div className="flex gap-2">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="輸入搜尋關鍵詞..." onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
        <Button onClick={handleSearch} disabled={isSearching}>
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </div>

      <div className="grid gap-4">
        {results.map((item, i) => (
          <Card key={i}>
            <CardContent className="p-4 flex gap-4">
              <div className="w-40 h-24 bg-muted rounded flex items-center justify-center shrink-0">
                <Youtube className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.channel} • {item.views} 觀看 • {item.publishedAt}</p>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
        {results.length === 0 && !isSearching && (
          <div className="text-center py-12 text-muted-foreground">
            <Youtube className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>輸入關鍵詞搜尋 YouTube 內容</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default YouTubeSearchPage;
