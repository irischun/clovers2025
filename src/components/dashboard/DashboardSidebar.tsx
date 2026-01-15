import { User } from '@supabase/supabase-js';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import cloversLogo from '@/assets/clovers-logo.png';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { 
  LayoutDashboard, 
  FileText, 
  Calendar, 
  Image, 
  Sparkles, 
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  ImagePlus,
  Mic,
  AudioLines,
  Video,
  Tv,
  Youtube,
  GalleryHorizontalEnd,
  BookOpen,
  Rss,
  FolderEdit,
  Sticker,
  Rocket,
  Send,
  CreditCard,
  Coins,
  History,
  Home
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const mainMenuItems = [
  { title: '儀表板', icon: LayoutDashboard, path: '/dashboard' },
  { title: '訂閱方案', icon: CreditCard, path: '/dashboard/subscription' },
  { title: '購買點數', icon: Coins, path: '/dashboard/buy-points' },
  { title: '點數紀錄', icon: History, path: '/dashboard/point-history' },
  { title: '作品畫廊', icon: GalleryHorizontalEnd, path: '/dashboard/gallery' },
  { title: '提示詞管理', icon: FileText, path: '/dashboard/prompts' },
  { title: '用戶資料', icon: Settings, path: '/dashboard/settings' },
];

const aiToolsItems = [
  { title: 'AI 文案創作', icon: Sparkles, path: '/dashboard/ai-tools' },
  { title: '圖片生成', icon: ImagePlus, path: '/dashboard/image-generation' },
  { title: '語音生成', icon: Mic, path: '/dashboard/voice-generation' },
  { title: '語音轉字幕', icon: AudioLines, path: '/dashboard/speech-to-text' },
  { title: '視頻生成', icon: Video, path: '/dashboard/video-generation' },
  { title: '視頻生成 2.0', icon: Video, path: '/dashboard/video-generation-2' },
  { title: 'LipSync 影片', icon: Tv, path: '/dashboard/lip-sync' },
];

const mediaToolsItems = [
  { title: 'YouTube 搜尋', icon: Youtube, path: '/dashboard/youtube-search' },
  { title: '小紅書搜尋', icon: BookOpen, path: '/dashboard/xiaohongshu-search' },
  { title: 'RSS 訂閱', icon: Rss, path: '/dashboard/rss' },
  { title: '媒體庫', icon: Image, path: '/dashboard/media' },
];

const publishToolsItems = [
  { title: '自媒體發佈工具', icon: Send, path: '/dashboard/scheduler' },
  { title: '內容整理', icon: FolderEdit, path: '/dashboard/content-organize' },
  { title: '貼圖製作器', icon: Sticker, path: '/dashboard/sticker-maker' },
  { title: '智能內容發布', icon: Rocket, path: '/dashboard/smart-publish' },
];


interface DashboardSidebarProps {
  user: User;
}

interface MenuSection {
  title: string;
  items: typeof mainMenuItems;
  defaultOpen?: boolean;
}

const DashboardSidebar = ({ user }: DashboardSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'AI 內容工具': true,
    '自媒體工具': true,
    '發佈工具': true,
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const getUserName = () => {
    return user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  };

  const getUserInitials = () => {
    const name = getUserName();
    return name.substring(0, 2).toUpperCase();
  };

  const toggleSection = (title: string) => {
    setOpenSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const renderMenuItem = (item: typeof mainMenuItems[0]) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton
        onClick={() => navigate(item.path)}
        isActive={location.pathname === item.path}
        className="gap-3"
      >
        <item.icon className="w-4 h-4" />
        <span className="text-sm">{item.title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  const renderCollapsibleSection = (title: string, items: typeof mainMenuItems) => (
    <Collapsible
      key={title}
      open={openSections[title]}
      onOpenChange={() => toggleSection(title)}
      className="group/collapsible"
    >
      <SidebarGroup>
        <CollapsibleTrigger className="w-full">
          <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:text-foreground transition-colors">
            <span>{title}</span>
            {openSections[title] ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="p-4 border-b border-border space-y-3">
        <div className="flex items-center gap-3">
          <img 
            src={cloversLogo} 
            alt="Clovers Logo" 
            className="w-10 h-10 object-contain"
          />
          <span className="font-display text-xl font-bold">CLOVERS</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={() => navigate('/main')}
        >
          <Home className="w-4 h-4" />
          返回主頁
        </Button>
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto">
        {/* Main Menu */}
        <SidebarGroup>
          <SidebarGroupLabel>主選單</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map(renderMenuItem)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* AI Tools */}
        {renderCollapsibleSection('AI 內容工具', aiToolsItems)}

        {/* Media Tools */}
        {renderCollapsibleSection('自媒體工具', mediaToolsItems)}

        {/* Publish Tools */}
        {renderCollapsibleSection('發佈工具', publishToolsItems)}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{getUserName()}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title="登出"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default DashboardSidebar;
