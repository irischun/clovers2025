import { useState, useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { Loader2 } from 'lucide-react';

const DashboardContent = ({ user }: { user: User }) => {
  const { open, openMobile, isMobile } = useSidebar();
  
  // Determine if sidebar is currently showing
  const sidebarVisible = isMobile ? openMobile : open;

  return (
    <div className="min-h-screen flex w-full bg-background">
      <DashboardSidebar user={user} />
      <div 
        className="flex-1 flex flex-col transition-all duration-200 ease-linear"
        style={{
          marginLeft: isMobile && sidebarVisible ? '18rem' : '0'
        }}
      >
        <DashboardHeader user={user} />
        <main className="flex-1 p-6 overflow-auto">
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

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate('/auth');
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate('/auth');
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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
    <SidebarProvider>
      <DashboardContent user={user} />
    </SidebarProvider>
  );
};

export default Dashboard;
