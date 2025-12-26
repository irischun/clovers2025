import { useState } from 'react';
import { Send, Globe, Share2, Play, Coins } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { WordPressSettings } from '@/components/publishing/WordPressSettings';
import { ArticlePublisher } from '@/components/publishing/ArticlePublisher';
import { ScheduledPostsManager } from '@/components/publishing/ScheduledPostsManager';
import { PublishingHistory } from '@/components/publishing/PublishingHistory';

const SchedulerPage = () => {
  const [activeTab, setActiveTab] = useState('wordpress');
  const [showTutorial, setShowTutorial] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="heading-display text-2xl mb-1 flex items-center gap-3">
            <Send className="w-7 h-7 text-primary" />
            自媒體發佈工具
          </h1>
          <p className="text-muted-foreground">一鍵發佈到不同 Social Media 平台</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1">
            <Coins className="w-3.5 h-3.5" />
            點數消耗：1 點/次
          </Badge>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowTutorial(true)}>
            <Play className="w-4 h-4" />
            觀看教學
          </Button>
        </div>
      </div>

      {/* Tutorial Video Modal */}
      <Dialog open={showTutorial} onOpenChange={setShowTutorial}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <div className="aspect-video">
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ"
              title="如何一鍵發佈到不同 Social Media 平台"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="border-0"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="wordpress" className="gap-2">
            <Globe className="w-4 h-4" />
            WordPress
          </TabsTrigger>
          <TabsTrigger value="social" className="gap-2">
            <Share2 className="w-4 h-4" />
            社交媒體
          </TabsTrigger>
        </TabsList>

        {/* WordPress Tab */}
        <TabsContent value="wordpress" className="space-y-6">
          {/* WordPress Connection Settings */}
          <WordPressSettings />

          {/* Article Publisher */}
          <ArticlePublisher />

          {/* Scheduled Posts Manager */}
          <ScheduledPostsManager />

          {/* Publishing History */}
          <PublishingHistory />
        </TabsContent>

        {/* Social Media Tab */}
        <TabsContent value="social" className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Share2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">社交媒體發佈</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              連接您的社交媒體帳號，實現一鍵發佈到 Instagram、Facebook、Twitter 等平台
            </p>
            <Button variant="outline" disabled>
              即將推出
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SchedulerPage;
