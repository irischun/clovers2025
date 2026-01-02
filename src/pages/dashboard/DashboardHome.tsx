import { useEffect, useState } from 'react';
import { FileText, Calendar, Image, Sparkles, ArrowRight, Coins, Crown, Loader2, Clock, TrendingUp, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { useUserPoints } from '@/hooks/useUserPoints';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { monthlyPlans, yearlyPlans } from '@/data/subscriptionPlans';

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
    { title: '總提示詞', value: stats.prompts, icon: FileText, color: 'text-blue-500', bgColor: 'bg-blue-500/10', gradient: 'from-blue-500/20 to-blue-600/5' },
    { title: '已排程內容', value: stats.scheduledPosts, icon: Calendar, color: 'text-green-500', bgColor: 'bg-green-500/10', gradient: 'from-green-500/20 to-green-600/5' },
    { title: '媒體檔案', value: stats.mediaFiles, icon: Image, color: 'text-purple-500', bgColor: 'bg-purple-500/10', gradient: 'from-purple-500/20 to-purple-600/5' },
    { title: 'AI 使用量', value: stats.aiGenerations, icon: Sparkles, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10', gradient: 'from-yellow-500/20 to-yellow-600/5' },
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

  // Get monthly points from subscription plan
  const getMonthlyPoints = () => {
    if (!subscription) return 0;
    const plans = subscription.billing_period === 'monthly' ? monthlyPlans : yearlyPlans;
    const plan = plans.find(p => p.name === subscription.plan_name);
    return plan?.pointsPerMonth || subscription.points_per_month || 0;
  };

  const monthlyPoints = getMonthlyPoints();
  const pointsUsagePercent = monthlyPoints > 0 ? Math.min((points / monthlyPoints) * 100, 100) : 0;

  // Calculate days until expiration
  const getDaysUntilExpiration = () => {
    if (!subscription) return null;
    return differenceInDays(new Date(subscription.expiration_date), new Date());
  };

  const daysUntilExpiration = getDaysUntilExpiration();

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div>
          <h1 className="heading-display text-2xl sm:text-3xl mb-1 sm:mb-2">儀表板</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            歡迎回來！這是您的 Clover 儀表板，開始創建精彩內容吧。
          </p>
        </div>
      </div>

      {/* Subscription & Points Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Subscription Card */}
        <Link 
          to="/dashboard/subscription"
          className="relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-orange-500/10 border border-amber-500/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-amber-500/50 transition-all group hover:shadow-lg hover:shadow-amber-500/10"
        >
          <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-bl from-amber-500/20 to-transparent rounded-full blur-2xl" />
          <div className="relative">
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 text-white shadow-lg shadow-amber-500/30">
                  <Crown className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm text-muted-foreground">已訂閱方案</span>
                  {subscriptionLoading ? (
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-amber-500 mt-1" />
                  ) : (
                    <h3 className="text-lg sm:text-xl font-bold text-amber-600 dark:text-amber-400 group-hover:text-amber-500 transition-colors">
                      {subscription ? subscription.plan_name : '尚未訂閱'}
                    </h3>
                  )}
                </div>
              </div>
              {subscription && (
                <Badge variant="outline" className="border-amber-500/50 text-amber-600 dark:text-amber-400 text-xs hidden sm:inline-flex">
                  {subscription.billing_period === 'monthly' ? '月付' : '年付'}
                </Badge>
              )}
            </div>
            
            {subscription && (
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>到期：{format(new Date(subscription.expiration_date), 'yyyy/MM/dd', { locale: zhTW })}</span>
                </div>
                {daysUntilExpiration !== null && daysUntilExpiration <= 7 && (
                  <Badge variant="destructive" className="animate-pulse text-xs">
                    剩餘 {daysUntilExpiration} 天
                  </Badge>
                )}
              </div>
            )}
            
            {!subscription && !subscriptionLoading && (
              <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500" />
                立即訂閱解鎖全部功能
              </p>
            )}
          </div>
          <ArrowRight className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 w-4 h-4 sm:w-5 sm:h-5 text-amber-500/50 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
        </Link>

        {/* Points Card */}
        <Link 
          to="/dashboard/buy-points"
          className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-emerald-500/10 border border-primary/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-primary/50 transition-all group hover:shadow-lg hover:shadow-primary/10"
        >
          <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-gradient-to-bl from-primary/20 to-transparent rounded-full blur-2xl" />
          <div className="relative">
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary to-emerald-500 text-white shadow-lg shadow-primary/30">
                  <Coins className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm text-muted-foreground">所剩點數</span>
                  {pointsLoading ? (
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-primary mt-1" />
                  ) : (
                    <h3 className="text-lg sm:text-xl font-bold text-primary group-hover:text-primary/80 transition-colors">
                      {points.toLocaleString()} 點
                    </h3>
                  )}
                </div>
              </div>
              {monthlyPoints > 0 && (
                <Badge variant="outline" className="border-primary/50 text-primary text-xs hidden sm:inline-flex">
                  每月 {monthlyPoints.toLocaleString()} 點
                </Badge>
              )}
            </div>
            
            {monthlyPoints > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">本月用量</span>
                  <span className="font-medium">{points.toLocaleString()} / {monthlyPoints.toLocaleString()}</span>
                </div>
                <Progress value={pointsUsagePercent} className="h-1.5 sm:h-2" />
              </div>
            )}
            
            {!subscription && !subscriptionLoading && (
              <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-2">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                訂閱後可獲得每月點數
              </p>
            )}
          </div>
          <ArrowRight className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 w-4 h-4 sm:w-5 sm:h-5 text-primary/50 group-hover:text-primary group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className={`relative overflow-hidden bg-gradient-to-br ${stat.gradient} border border-border rounded-lg sm:rounded-xl p-4 sm:p-6 hover:border-primary/50 transition-all hover:shadow-md group`}
          >
            <div className="absolute -top-4 -right-4 w-16 sm:w-24 h-16 sm:h-24 bg-gradient-to-bl from-current opacity-10 rounded-full blur-2xl" />
            <div className="relative">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <div className={`p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl ${stat.bgColor} ${stat.color} group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-bold mb-0.5 sm:mb-1">
                {loading ? (
                  <span className="inline-block w-10 sm:w-12 h-6 sm:h-8 bg-muted animate-pulse rounded" />
                ) : (
                  stat.value
                )}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">快速操作</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <QuickActionCard
            title="創建提示詞"
            description="新增自定義提示詞到您的庫中"
            icon={FileText}
            href="/dashboard/prompts"
            color="blue"
          />
          <QuickActionCard
            title="排程內容"
            description="計劃並排程您的社交媒體內容"
            icon={Calendar}
            href="/dashboard/scheduler"
            color="green"
          />
          <QuickActionCard
            title="AI 生成"
            description="使用 AI 生成創意內容"
            icon={Sparkles}
            href="/dashboard/ai-tools"
            color="yellow"
          />
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">最近活動</h2>
        <div className="bg-card border border-border rounded-lg sm:rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-muted animate-pulse rounded-xl" />
                  <div className="flex-1">
                    <div className="h-4 bg-muted animate-pulse rounded w-1/2 mb-2" />
                    <div className="h-3 bg-muted animate-pulse rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground font-medium">暫無活動記錄</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                開始使用 Clover 後，您的活動將會顯示在這裡。
              </p>
              <Link 
                to="/dashboard/ai-tools" 
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 text-sm font-medium"
              >
                開始使用 AI 工具
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentActivity.map((activity) => (
                <div
                  key={`${activity.type}-${activity.id}`}
                  className="px-6 py-4 flex items-center gap-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="p-2.5 rounded-xl bg-secondary">
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
  color: 'blue' | 'green' | 'yellow';
}

const QuickActionCard = ({ title, description, icon: Icon, href, color }: QuickActionCardProps) => {
  const colorClasses = {
    blue: 'from-blue-500/10 to-blue-600/5 hover:border-blue-500/50 group-hover:from-blue-500 group-hover:to-blue-600',
    green: 'from-green-500/10 to-green-600/5 hover:border-green-500/50 group-hover:from-green-500 group-hover:to-green-600',
    yellow: 'from-yellow-500/10 to-yellow-600/5 hover:border-yellow-500/50 group-hover:from-yellow-500 group-hover:to-yellow-600',
  };

  return (
    <Link
      to={href}
      className={`relative overflow-hidden bg-gradient-to-br ${colorClasses[color].split(' ').slice(0, 2).join(' ')} border border-border rounded-xl p-5 ${colorClasses[color].split(' ')[2]} transition-all group block hover:shadow-md`}
    >
      <div className="flex items-start gap-4">
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${colorClasses[color].split(' ').slice(3).join(' ')} text-primary group-hover:text-white transition-colors shadow-sm`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
      </div>
    </Link>
  );
};

export default DashboardHome;