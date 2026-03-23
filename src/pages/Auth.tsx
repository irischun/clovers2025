import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import cloversLogo from '@/assets/clovers-logo-icon.jpeg';
import { useLanguage } from '@/i18n/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const AUTH_REDIRECT_STORAGE_KEY = 'post-auth-redirect';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { t } = useLanguage();

  const redirectPath = useMemo(() => {
    const target =
      searchParams.get('redirect') ||
      sessionStorage.getItem(AUTH_REDIRECT_STORAGE_KEY) ||
      '/dashboard';
    return target.startsWith('/dashboard') ? target : '/dashboard';
  }, [searchParams]);

  const emailRedirectTo = useMemo(() => {
    const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
    return `${window.location.origin}${basePath}/auth?redirect=${encodeURIComponent(redirectPath)}`;
  }, [redirectPath]);

  useEffect(() => {
    const target = searchParams.get('redirect');
    if (target?.startsWith('/dashboard')) {
      sessionStorage.setItem(AUTH_REDIRECT_STORAGE_KEY, target);
    }
  }, [searchParams]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        sessionStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY);
        navigate(redirectPath, { replace: true });
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        sessionStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY);
        navigate(redirectPath, { replace: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate, redirectPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message === 'Invalid login credentials') {
            toast({ title: t('auth.loginFailed'), description: t('auth.wrongCredentials'), variant: 'destructive' });
          } else {
            toast({ title: t('auth.error'), description: error.message, variant: 'destructive' });
          }
          return;
        }
        toast({ title: t('auth.loginSuccess'), description: t('auth.welcomeBack') });
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo, data: { full_name: fullName } },
        });
        if (error) {
          if (error.message.includes('already registered')) {
            toast({ title: t('auth.signupFailed'), description: t('auth.emailExists'), variant: 'destructive' });
          } else {
            toast({ title: t('auth.error'), description: error.message, variant: 'destructive' });
          }
          return;
        }
        toast({ title: t('auth.signupSuccess'), description: t('auth.welcomeJoin') });
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast({ title: t('auth.error'), description: t('auth.unknownError'), variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Language switcher */}
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <img src={cloversLogo} alt="Clovers Logo" className="w-12 h-12 object-contain" />
            <span className="font-display text-2xl font-bold">CLOVERS</span>
          </div>
          <p className="text-muted-foreground">
            {isLogin ? t('auth.loginTitle') : t('auth.signupTitle')}
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">{t('auth.name')}</Label>
                <Input id="fullName" type="text" placeholder={t('auth.namePlaceholder')} value={fullName} onChange={(e) => setFullName(e.target.value)} required={!isLogin} className="bg-secondary border-border" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="bg-secondary border-border pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full btn-primary" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {isLogin ? t('auth.loginBtn') : t('auth.signupBtn')}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-sm">
              {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}
              <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline ml-1 font-medium">
                {isLogin ? t('auth.signupNow') : t('auth.loginNow')}
              </button>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <a href="/" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
            {t('auth.backHome')}
          </a>
        </div>
      </div>
    </div>
  );
};

export default Auth;
