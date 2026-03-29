import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { Loader2 } from 'lucide-react';
import { ImageGenerationProvider } from '@/contexts/ImageGenerationContext';
import GenerationFloatingIndicator from '@/components/dashboard/GenerationFloatingIndicator';

const AUTH_REDIRECT_STORAGE_KEY = 'post-auth-redirect';

const DashboardContent = ({ user }: { user: User }) => {
  const { open, openMobile, isMobile } = useSidebar();
  
  // Determine if sidebar is currently showing
  const sidebarVisible = isMobile ? openMobile : open;

  return (
    <div className="min-h-screen flex w-full bg-background overflow-hidden">
      <DashboardSidebar user={user} />
      <div 
        className="flex-1 flex flex-col min-w-0 transition-all duration-200 ease-linear"
        style={{
          marginLeft: isMobile && sidebarVisible ? '18rem' : '0',
          width: isMobile && sidebarVisible ? 'calc(100% - 18rem)' : '100%'
        }}
      >
        <DashboardHeader user={user} />
        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const redirectTarget = `${location.pathname}${location.search}${location.hash}`;
    const authRedirectUrl = `/auth?redirect=${encodeURIComponent(redirectTarget)}`;
    const rememberRedirect = () => {
      if (redirectTarget.startsWith('/dashboard')) {
        sessionStorage.setItem(AUTH_REDIRECT_STORAGE_KEY, redirectTarget);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        rememberRedirect();
        navigate(authRedirectUrl, { replace: true });
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        rememberRedirect();
        navigate(authRedirectUrl, { replace: true });
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname, location.search, location.hash]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <ImageGenerationProvider>
      <SidebarProvider>
        <DashboardContent user={user} />
        <GenerationFloatingIndicator />
      </SidebarProvider>
    </ImageGenerationProvider>
  );
};

export default Dashboard;
