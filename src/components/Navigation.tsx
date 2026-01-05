import { useState, useEffect } from 'react';
import { LogIn, User, LogOut, Menu, X, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Navigation = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMobileMenuOpen(false);
    navigate('/');
  };

  const getUserName = () => {
    return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  };

  const getUserInitials = () => {
    const name = getUserName();
    return name.substring(0, 2).toUpperCase();
  };

  const scrollToSection = (sectionId: string) => {
    setMobileMenuOpen(false);
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navLinks = [
    { label: '功能', sectionId: 'features' },
    { label: '定價', sectionId: 'pricing' },
    { label: 'FAQ', sectionId: 'faq' },
  ];

  return (
    <nav className={`py-4 px-4 sm:px-6 lg:px-8 sticky top-0 z-50 transition-all duration-500 ${
      scrolled 
        ? 'bg-background/90 backdrop-blur-2xl border-b border-border/50 shadow-lg shadow-background/20' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-seedling flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-all duration-300 group-hover:scale-105">
            <svg className="w-6 h-6 text-primary-foreground" viewBox="0 0 24 24" fill="currentColor">
              {/* 4-leaf clover */}
              <path d="M12 2C9.5 2 7.5 4 7.5 6.5C7.5 7.5 7.8 8.4 8.3 9.1C7.6 8.6 6.7 8.3 5.7 8.3C3.2 8.3 1.2 10.3 1.2 12.8C1.2 15.3 3.2 17.3 5.7 17.3C6.7 17.3 7.6 17 8.3 16.5C7.8 17.2 7.5 18.1 7.5 19.1C7.5 21.6 9.5 23.6 12 23.6C14.5 23.6 16.5 21.6 16.5 19.1C16.5 18.1 16.2 17.2 15.7 16.5C16.4 17 17.3 17.3 18.3 17.3C20.8 17.3 22.8 15.3 22.8 12.8C22.8 10.3 20.8 8.3 18.3 8.3C17.3 8.3 16.4 8.6 15.7 9.1C16.2 8.4 16.5 7.5 16.5 6.5C16.5 4 14.5 2 12 2Z"/>
              <circle cx="12" cy="12" r="2" fill="currentColor" opacity="0.6"/>
            </svg>
          </div>
          <span className="font-display text-2xl text-foreground tracking-tight">
            Clover
          </span>
        </a>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <button
              key={link.sectionId}
              onClick={() => scrollToSection(link.sectionId)}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-300 relative group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300 rounded-full" />
            </button>
          ))}
        </div>

        {/* Right side: Auth + Mobile Menu Toggle */}
        <div className="flex items-center gap-3">
          {/* Auth buttons */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:bg-secondary/50 rounded-xl p-1.5 pr-3 transition-all duration-300">
                  <Avatar className="w-9 h-9 ring-2 ring-primary/20">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-seedling text-primary-foreground text-sm font-medium">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden sm:block">{getUserName()}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-card/95 backdrop-blur-xl border-border/50 rounded-xl shadow-xl">
                <DropdownMenuItem onClick={() => navigate('/dashboard')} className="rounded-lg cursor-pointer">
                  <User className="w-4 h-4 mr-2" />
                  儀表板
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/50" />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive rounded-lg cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  登出
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              variant="outline" 
              className="gap-2 border-border/50 hover:bg-primary hover:text-primary-foreground hover:border-primary rounded-xl hidden sm:flex transition-all duration-300"
              onClick={() => navigate('/auth')}
            >
              <LogIn className="w-4 h-4" />
              <span>登入</span>
            </Button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2.5 text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-xl transition-all duration-300"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background/98 backdrop-blur-2xl border-b border-border/50 animate-slide-up shadow-2xl">
          <div className="px-4 py-6 space-y-2">
            {navLinks.map((link) => (
              <button
                key={link.sectionId}
                onClick={() => scrollToSection(link.sectionId)}
                className="block w-full text-left px-4 py-3.5 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/30 rounded-xl transition-all duration-300"
              >
                {link.label}
              </button>
            ))}
            
            {/* Mobile login button for non-authenticated users */}
            {!user && (
              <Button 
                className="w-full mt-4 gap-2 btn-primary"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/auth');
                }}
              >
                <LogIn className="w-4 h-4" />
                <span>登入</span>
              </Button>
            )}

            {/* Mobile dashboard link for authenticated users */}
            {user && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/dashboard');
                }}
                className="block w-full text-left px-4 py-3.5 text-base font-medium text-primary hover:bg-primary/10 rounded-xl transition-all duration-300"
              >
                前往儀表板
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;