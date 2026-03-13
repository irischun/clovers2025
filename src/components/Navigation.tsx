import { useState, useEffect, useRef } from 'react';
import { LogIn, User, LogOut, Menu, X, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import cloversLogo from '@/assets/clovers-logo-icon.jpeg';

const LANDING_AUDIO_VOLUME = 0.1;

const Navigation = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('clovers-landing-muted') === 'true';
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isLandingPage = location.pathname === '/' || location.pathname.includes('/main');

  useEffect(() => {
    if (isLandingPage) {
      if (!audioRef.current) {
        const audio = new Audio(`${import.meta.env.BASE_URL}audio/Midnight_Facets.mp3`);
        audio.loop = true;
        audio.volume = LANDING_AUDIO_VOLUME;
        audio.preload = 'auto';
        audio.muted = isMuted;
        audioRef.current = audio;
      }

      audioRef.current.play().catch(() => {});
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }

    return () => {
      // cleanup only on unmount
    };
  }, [isLandingPage]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
    window.localStorage.setItem('clovers-landing-muted', String(isMuted));
  }, [isMuted]);

  useEffect(() => {
    if (!isLandingPage || !audioRef.current) return;

    const handleFirstInteraction = () => {
      if (audioRef.current && !isMuted && audioRef.current.paused) {
        audioRef.current.play().catch(() => {});
      }
    };

    window.addEventListener('pointerdown', handleFirstInteraction, { once: true });
    return () => window.removeEventListener('pointerdown', handleFirstInteraction);
  }, [isLandingPage, isMuted]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
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

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (audioRef.current) {
      audioRef.current.muted = newMuted;
      audioRef.current.volume = LANDING_AUDIO_VOLUME;
      if (!newMuted && audioRef.current.paused && isLandingPage) {
        audioRef.current.play().catch(() => {});
      }
    }
  };

  return (
    <nav
      className={`py-4 px-4 sm:px-6 lg:px-8 sticky top-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-background/90 backdrop-blur-2xl border-b border-border/50 shadow-lg shadow-background/20'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-3 group">
          <img
            src={cloversLogo}
            alt="Clovers AI Logo"
            className="w-11 h-11 object-contain rounded-lg group-hover:scale-105 transition-transform duration-300"
          />
          <span className="font-heading text-xl font-bold text-foreground tracking-tight uppercase">
            Clovers <span className="text-primary">AI</span>
          </span>
        </a>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          <button
            onClick={() => scrollToSection('pricing')}
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-300 relative group uppercase tracking-widest"
          >
            Pricing/定價
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300 rounded-full" />
          </button>

          <button
            onClick={() => scrollToSection('faq')}
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-300 relative group uppercase tracking-widest"
          >
            FAQ
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300 rounded-full" />
          </button>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 shrink-0">
{isLandingPage && (
            <button
              onClick={toggleMute}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-foreground bg-card/85 border border-border hover:bg-secondary rounded-xl transition-all duration-300 uppercase tracking-wider shadow-sm animate-pulse-glow"
              aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
              title={isMuted ? 'Unmute/取消靜音' : 'Mute/靜音'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span className="hidden sm:inline">{isMuted ? 'Unmute/取消靜音' : 'Mute/靜音'}</span>
            </button>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:bg-secondary/50 rounded-xl p-1.5 pr-3 transition-all duration-300">
                  <Avatar className="w-9 h-9 ring-2 ring-primary/20">
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-sm font-medium">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden sm:block">{getUserName()}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-52 bg-card/95 backdrop-blur-xl border-border/50 rounded-xl shadow-xl"
              >
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
              className="gap-2 border-primary/30 hover:bg-primary hover:text-primary-foreground hover:border-primary rounded-xl hidden sm:flex transition-all duration-300 text-primary"
              onClick={() => navigate('/auth')}
            >
              <LogIn className="w-4 h-4" />
              <span>登入</span>
            </Button>
          )}

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
            <button
              onClick={() => scrollToSection('pricing')}
              className="block w-full text-left px-4 py-3.5 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/30 rounded-xl transition-all duration-300 uppercase tracking-widest text-sm"
            >
              Pricing/定價
            </button>

            <button
              onClick={() => scrollToSection('faq')}
              className="block w-full text-left px-4 py-3.5 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/30 rounded-xl transition-all duration-300 uppercase tracking-widest text-sm"
            >
              FAQ
            </button>

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

      {isLandingPage && (
        <button
          onClick={toggleMute}
          className="sm:hidden fixed bottom-24 left-4 z-[60] inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-foreground bg-card/90 border border-border rounded-xl shadow-lg"
          aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          <span>{isMuted ? 'Unmute' : 'Mute'}</span>
        </button>
      )}
    </nav>
  );
};

export default Navigation;
