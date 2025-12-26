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
      {/* Points Banner */}
      <div className="w-full rounded-lg border border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 p-4">
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-yellow-600" />
          <span className="font-semibold text-yellow-700 dark:text-yellow-400">點數消耗：1 點/次</span>
        </div>
      </div>

      {/* Tutorial Button Banner */}
      <Button 
        variant="outline" 
        className="w-full h-11 border-2 border-primary/50 hover:border-primary hover:bg-primary/10 group"
        onClick={() => setShowTutorial(true)}
      >
        <Play className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
        <span className="text-lg font-semibold">📺 觀看教學：如何一鍵發佈到不同Social Media平台</span>
      </Button>

      {/* Tutorial Video Modal - Add your YouTube video ID below */}
      <Dialog open={showTutorial} onOpenChange={setShowTutorial}>
        <DialogContent className="max-w-4xl p-6">
          <div className="text-center space-y-4">
            <Play className="h-16 w-16 mx-auto text-muted-foreground" />
            <h3 className="text-xl font-semibold">教學影片即將推出</h3>
            <p className="text-muted-foreground">
              我們正在準備詳細的教學影片，敬請期待！
            </p>
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
