import { User } from '@supabase/supabase-js';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import cloversLogo from '@/assets/clovers-logo-icon.jpeg';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
} from '@/components/ui/sidebar';
import { 
  LayoutDashboard, FileText, Image, Sparkles, Settings, LogOut, ChevronDown, ChevronRight,
  ImagePlus, Mic, AudioLines, Video, Tv, Youtube, GalleryHorizontalEnd, BookOpen, Rss,
  FolderEdit, Sticker, Rocket, Send, CreditCard, Coins, History, Home
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface DashboardSidebarProps {
  user: User;
}

const DashboardSidebar = ({ user }: DashboardSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const mainMenuItems = [
    { title: t('nav.item.dashboard'), icon: LayoutDashboard, path: '/dashboard' },
    { title: t('nav.item.subscription'), icon: CreditCard, path: '/dashboard/subscription' },
    { title: t('nav.item.buyPoints'), icon: Coins, path: '/dashboard/buy-points' },
    { title: t('nav.item.pointHistory'), icon: History, path: '/dashboard/point-history' },
    { title: t('nav.item.gallery'), icon: GalleryHorizontalEnd, path: '/dashboard/personal_gallery' },
    { title: t('nav.item.prompts'), icon: FileText, path: '/dashboard/prompts' },
    { title: t('nav.item.settings'), icon: Settings, path: '/dashboard/settings' },
  ];

  const aiToolsItems = [
    { title: t('nav.item.aiCopywriting'), icon: Sparkles, path: '/dashboard/ai-copy-writing' },
    { title: t('nav.item.imageGen'), icon: ImagePlus, path: '/dashboard/image-generation' },
    { title: t('nav.item.stickerMaker'), icon: Sticker, path: '/dashboard/sticker-maker-many-marvelous_styles' },
    { title: t('nav.item.voiceGen'), icon: Mic, path: '/dashboard/voice-generation' },
    { title: t('nav.item.speechToText'), icon: AudioLines, path: '/dashboard/speech-to-text' },
    { title: t('nav.item.videoGen'), icon: Video, path: '/dashboard/video-generation' },
    { title: t('nav.item.videoGen2'), icon: Video, path: '/dashboard/video-generation-2' },
    { title: t('nav.item.lipSync'), icon: Tv, path: '/dashboard/lip-sync' },
  ];

  const mediaToolsItems = [
    { title: t('nav.item.youtubeSearch'), icon: Youtube, path: '/dashboard/youtube-search' },
    { title: t('nav.item.xiaohongshuSearch'), icon: BookOpen, path: '/dashboard/xiaohongshu-search' },
    { title: t('nav.item.rss'), icon: Rss, path: '/dashboard/rss' },
    { title: t('nav.item.mediaLibrary'), icon: Image, path: '/dashboard/media' },
  ];

  const publishToolsItems = [
    { title: t('nav.item.socialPublish'), icon: Send, path: '/dashboard/scheduler' },
    { title: t('nav.item.contentOrganize'), icon: FolderEdit, path: '/dashboard/content-organize' },
    { title: t('nav.item.smartPublish'), icon: Rocket, path: '/dashboard/smart-publish' },
  ];

  const sectionKeys = [t('nav.menu.aiTools'), t('nav.menu.mediaTools'), t('nav.menu.publishTools')];
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    sectionKeys.forEach(k => initial[k] = true);
    return initial;
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const getUserName = () => user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  const getUserInitials = () => getUserName().substring(0, 2).toUpperCase();

  const toggleSection = (title: string) => {
    setOpenSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const renderMenuItem = (item: { title: string; icon: any; path: string }) => (
    <SidebarMenuItem key={item.path}>
      <SidebarMenuButton onClick={() => navigate(item.path)} isActive={location.pathname === item.path} className="gap-3">
        <item.icon className="w-4 h-4" />
        <span className="text-sm">{item.title}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  const renderCollapsibleSection = (title: string, items: typeof mainMenuItems) => (
    <Collapsible key={title} open={openSections[title] ?? true} onOpenChange={() => toggleSection(title)} className="group/collapsible">
      <SidebarGroup>
        <CollapsibleTrigger className="w-full">
          <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:text-foreground transition-colors">
            <span>{title}</span>
            {openSections[title] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </SidebarGroupLabel>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>{items.map(renderMenuItem)}</SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );

  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="p-4 border-b border-border space-y-3">
        <div className="flex items-center gap-3">
          <img src={cloversLogo} alt="Clovers Logo" className="w-10 h-10 object-contain" />
          <span className="font-display text-xl font-bold">CLOVERS</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => navigate('/main')}>
            <Home className="w-4 h-4" />
            {t('dash.backToHome')}
          </Button>
          <LanguageSwitcher className="!px-2 !py-1.5 !text-xs" />
        </div>
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto">
        <SidebarGroup>
          <SidebarGroupLabel>{t('nav.menu.main')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{mainMenuItems.map(renderMenuItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {renderCollapsibleSection(t('nav.menu.aiTools'), aiToolsItems)}
        {renderCollapsibleSection(t('nav.menu.mediaTools'), mediaToolsItems)}
        {renderCollapsibleSection(t('nav.menu.publishTools'), publishToolsItems)}
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-primary text-primary-foreground">{getUserInitials()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{getUserName()}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title={t('nav.logout')}>
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default DashboardSidebar;
