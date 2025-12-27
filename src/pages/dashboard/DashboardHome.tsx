import { useEffect, useState } from 'react';
import { FileText, Calendar, Image, Sparkles, ArrowRight, Coins, Crown, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { useUserPoints } from '@/hooks/useUserPoints';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { Badge } from '@/components/ui/badge';

interface Stats {
  prompts: number;
  scheduledPosts: number;
  mediaFiles: number;
  aiGenerations: number;
}

interface RecentActivity {
  id: string;
  type: 'prompt' | 'post' | 'media' | 'ai';
  title: string;
  timestamp: string;
}

const DashboardHome = () => {
  const [stats, setStats] = useState<Stats>({
    prompts: 0,
    scheduledPosts: 0,
    mediaFiles: 0,
    aiGenerations: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [promptsRes, postsRes, mediaRes, aiRes] = await Promise.all([
          supabase.from('prompts').select('id, title, created_at', { count: 'exact' }).order('created_at', { ascending: false }).limit(5),
          supabase.from('scheduled_posts').select('id, title, created_at', { count: 'exact' }).order('created_at', { ascending: false }).limit(5),
          supabase.from('media_files').select('id, name, created_at', { count: 'exact' }).order('created_at', { ascending: false }).limit(5),
          supabase.from('ai_generations').select('id, prompt, created_at', { count: 'exact' }).order('created_at', { ascending: false }).limit(5),
        ]);

        setStats({
          prompts: promptsRes.count || 0,
          scheduledPosts: postsRes.count || 0,
          mediaFiles: mediaRes.count || 0,
          aiGenerations: aiRes.count || 0,
        });

        // Combine and sort recent activity
        const activities: RecentActivity[] = [
          ...(promptsRes.data || []).map((p) => ({
            id: p.id,
            type: 'prompt' as const,
            title: p.title,
            timestamp: p.created_at,
          })),
          ...(postsRes.data || []).map((p) => ({
            id: p.id,
            type: 'post' as const,
            title: p.title,
            timestamp: p.created_at,
          })),
          ...(mediaRes.data || []).map((m) => ({
            id: m.id,
            type: 'media' as const,
            title: m.name,
            timestamp: m.created_at,
          })),
          ...(aiRes.data || []).map((a) => ({
            id: a.id,
            type: 'ai' as const,
            title: a.prompt.slice(0, 50) + (a.prompt.length > 50 ? '...' : ''),
            timestamp: a.created_at,
          })),
        ]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 5);

        setRecentActivity(activities);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    { title: '總提示詞', value: stats.prompts, icon: FileText, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    { title: '已排程內容', value: stats.scheduledPosts, icon: Calendar, color: 'text-green-500', bgColor: 'bg-green-500/10' },
    { title: '媒體檔案', value: stats.mediaFiles, icon: Image, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
    { title: 'AI 使用量', value: stats.aiGenerations, icon: Sparkles, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
  ];

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'prompt':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'post':
        return <Calendar className="w-4 h-4 text-green-500" />;
      case 'media':
        return <Image className="w-4 h-4 text-purple-500" />;
      case 'ai':
        return <Sparkles className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getActivityLabel = (type: RecentActivity['type']) => {
    switch (type) {
      case 'prompt':
        return '新增提示詞';
      case 'post':
        return '排程內容';
      case 'media':
        return '上傳媒體';
      case 'ai':
        return 'AI 生成';
    }
  };

  const { points, isLoading: pointsLoading } = useUserPoints();
  const { subscription, isLoading: subscriptionLoading } = useUserSubscription();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="heading-display text-3xl mb-2">儀表板</h1>
          <p className="text-muted-foreground">
            歡迎回來！這是您的 Clover 儀表板，開始創建精彩內容吧。
          </p>
        </div>
        
        {/* Subscription & Points Info */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Subscription Plan */}
          <Link 
            to="/dashboard/subscription"
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 rounded-xl px-4 py-2.5 hover:border-amber-500/50 transition-colors group"
          >
            <Crown className="w-5 h-5 text-amber-500" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">已訂閱方案</span>
              {subscriptionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
              ) : (
                <span className="font-semibold text-amber-600 dark:text-amber-400 group-hover:text-amber-500 transition-colors">
                  {subscription ? `${subscription.plan_name} ${subscription.billing_period === 'monthly' ? '月付' : '年付'}` : '尚未訂閱'}
                </span>
              )}
            </div>
          </Link>
          
          {/* Points Balance */}
          <Link 
            to="/dashboard/buy-points"
            className="flex items-center gap-2 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/30 rounded-xl px-4 py-2.5 hover:border-primary/50 transition-colors group"
          >
            <Coins className="w-5 h-5 text-primary" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">所剩點數</span>
              {pointsLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              ) : (
                <span className="font-semibold text-primary group-hover:text-primary/80 transition-colors">
                  {points.toLocaleString()} 點
                </span>
              )}
            </div>
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${stat.bgColor} ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold mb-1">
              {loading ? (
                <span className="inline-block w-12 h-8 bg-muted animate-pulse rounded" />
              ) : (
                stat.value
              )}
            </p>
            <p className="text-sm text-muted-foreground">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">快速操作</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickActionCard
            title="創建提示詞"
            description="新增自定義提示詞到您的庫中"
            icon={FileText}
            href="/dashboard/prompts"
          />
          <QuickActionCard
            title="排程內容"
            description="計劃並排程您的社交媒體內容"
            icon={Calendar}
            href="/dashboard/scheduler"
          />
          <QuickActionCard
            title="AI 生成"
            description="使用 AI 生成創意內容"
            icon={Sparkles}
            href="/dashboard/ai-tools"
          />
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <h2 className="text-xl font-semibold mb-4">最近活動</h2>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-muted animate-pulse rounded-lg" />
                  <div className="flex-1">
                    <div className="h-4 bg-muted animate-pulse rounded w-1/2 mb-2" />
                    <div className="h-3 bg-muted animate-pulse rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">暫無活動記錄</p>
              <p className="text-sm text-muted-foreground mt-1">
                開始使用 Clover 後，您的活動將會顯示在這裡。
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentActivity.map((activity) => (
                <div
                  key={`${activity.type}-${activity.id}`}
                  className="px-6 py-4 flex items-center gap-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-secondary">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{activity.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {getActivityLabel(activity.type)}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {format(new Date(activity.timestamp), 'MM/dd HH:mm', { locale: zhTW })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

const QuickActionCard = ({ title, description, icon: Icon, href }: QuickActionCardProps) => {
  return (
    <Link
      to={href}
      className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 hover:bg-card/80 transition-all group block"
    >
      <div className="flex items-start gap-4">
        <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </Link>
  );
};

export default DashboardHome;