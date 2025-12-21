import { FileText, Calendar, Image, Sparkles } from 'lucide-react';

const stats = [
  { title: '總提示詞', value: '0', icon: FileText, color: 'text-blue-500' },
  { title: '已排程內容', value: '0', icon: Calendar, color: 'text-green-500' },
  { title: '媒體檔案', value: '0', icon: Image, color: 'text-purple-500' },
  { title: 'AI 使用量', value: '0', icon: Sparkles, color: 'text-yellow-500' },
];

const DashboardHome = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome section */}
      <div>
        <h1 className="heading-display text-3xl mb-2">歡迎回來！ 👋</h1>
        <p className="text-muted-foreground">
          這是您的 Clover 儀表板，開始創建精彩內容吧。
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg bg-secondary ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-bold mb-1">{stat.value}</p>
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

      {/* Recent activity placeholder */}
      <div>
        <h2 className="text-xl font-semibold mb-4">最近活動</h2>
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <p className="text-muted-foreground">暫無活動記錄</p>
          <p className="text-sm text-muted-foreground mt-1">
            開始使用 Clover 後，您的活動將會顯示在這裡。
          </p>
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
    <a
      href={href}
      className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 hover:bg-card/80 transition-all group block"
    >
      <div className="flex items-start gap-4">
        <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </a>
  );
};

export default DashboardHome;
