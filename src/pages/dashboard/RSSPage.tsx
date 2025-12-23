import { useState } from 'react';
import { Rss, Plus, Loader2, ExternalLink, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const RSSPage = () => {
  const [feedUrl, setFeedUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feeds, setFeeds] = useState<any[]>([]);
  const [selectedFeed, setSelectedFeed] = useState<any>(null);
  const { toast } = useToast();

  const handleAddFeed = async () => {
    if (!feedUrl.trim()) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('rss-fetch', { body: { url: feedUrl } });
      if (error) throw error;
      setFeeds(prev => [...prev, { ...data.feed, items: data.items }]);
      setFeedUrl('');
      toast({ title: 'RSS 訂閱成功' });
    } catch (error) {
      toast({ title: '訂閱失敗', description: '請檢查 RSS 網址是否正確', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="heading-display text-2xl mb-1">RSS 訂閱</h1>
        <p className="text-muted-foreground">訂閱並追蹤您喜愛的內容來源</p>
      </div>

      <div className="flex gap-2">
        <Input value={feedUrl} onChange={(e) => setFeedUrl(e.target.value)} placeholder="輸入 RSS Feed 網址..." />
        <Button onClick={handleAddFeed} disabled={isLoading}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          <h3 className="font-medium mb-3">訂閱源</h3>
          {feeds.map((feed, i) => (
            <Card key={i} className={`cursor-pointer transition-colors ${selectedFeed === feed ? 'border-primary' : ''}`} onClick={() => setSelectedFeed(feed)}>
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Rss className="w-4 h-4 text-primary" />
                  <span className="text-sm truncate">{feed.title}</span>
                </div>
                <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); setFeeds(prev => prev.filter((_, j) => j !== i)); }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
          {feeds.length === 0 && <p className="text-sm text-muted-foreground">尚未添加訂閱源</p>}
        </div>

        <div className="lg:col-span-2">
          {selectedFeed ? (
            <div className="space-y-3">
              <h3 className="font-medium">{selectedFeed.title}</h3>
              {selectedFeed.items?.map((item: any, i: number) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{item.description}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{item.pubDate}</span>
                      <a href={item.link} target="_blank" className="flex items-center gap-1 hover:text-primary">
                        閱讀原文 <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Rss className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>選擇訂閱源查看內容</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RSSPage;
