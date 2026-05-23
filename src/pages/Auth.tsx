import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2, Volume2, VolumeX } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import cloversLogo from '@/assets/clovers-logo-icon.jpeg';
import { useLanguage } from '@/i18n/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const AUTH_REDIRECT_STORAGE_KEY = 'post-auth-redirect';
const AUDIO_MUTED_KEY = 'auth-audio-muted';
const FORGOT_PASSWORD_SAFE_RETRY_SECONDS = 60 * 60;
const RECOVERY_ERROR_STORAGE_KEY = 'auth-recovery-error';
const EMAIL_VERIFICATION_STORAGE_KEY = 'auth-pending-email-verification';
const VERIFICATION_RESEND_SAFE_RETRY_SECONDS = 60;

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Forgot password
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSending, setForgotSending] = useState(false);
  const [forgotCooldown, setForgotCooldown] = useState(0); // seconds remaining
  const [forgotNotice, setForgotNotice] = useState<{ type: 'success' | 'error' | 'rate'; message: string } | null>(null);
  const [verificationNotice, setVerificationNotice] = useState<{ email: string; message: string } | null>(null);
  const [verificationSending, setVerificationSending] = useState(false);
  const [verificationCooldown, setVerificationCooldown] = useState(0);

  // Recovery (set new password)
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  // Audio
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);

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

  const basePath = useMemo(() => (import.meta.env.BASE_URL || '/').replace(/\/$/, ''), []);

  const emailRedirectTo = useMemo(
    () => `${window.location.origin}${basePath}/auth?redirect=${encodeURIComponent(redirectPath)}`,
    [basePath, redirectPath],
  );

  const resetRedirectTo = useMemo(
    () => `${window.location.origin}${basePath}/auth?type=recovery`,
    [basePath],
  );

  const authPath = useMemo(() => `${basePath}/auth`, [basePath]);

  const showVerificationNotice = (targetEmail: string, message: string) => {
    const normalizedEmail = targetEmail.trim();
    if (!normalizedEmail) return;

    sessionStorage.setItem(EMAIL_VERIFICATION_STORAGE_KEY, normalizedEmail);
    setVerificationNotice({ email: normalizedEmail, message });
    setEmail((currentEmail) => currentEmail || normalizedEmail);
  };

  const readRecoveryErrorFromUrl = () => {
    const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
    const hashParams = new URLSearchParams(hash);
    const searchError = searchParams.get('error');
    const hashError = hashParams.get('error');
    const description =
      searchParams.get('error_description') ||
      hashParams.get('error_description') ||
      searchParams.get('error_code') ||
      hashParams.get('error_code');

    if (!searchError && !hashError) return null;

    const normalized = decodeURIComponent(description || '').replace(/\+/g, ' ').trim().toLowerCase();
    if (normalized.includes('expired') || normalized.includes('invalid')) {
      return 'This password reset link is invalid or has expired. Please request a new reset email below.';
    }

    return description
      ? `${decodeURIComponent(description).replace(/\+/g, ' ').trim()}. Please request a new reset email below.`
      : 'Unable to verify this password reset link. Please request a new reset email below.';
  };

  // Persist forgot redirect target
  useEffect(() => {
    const target = searchParams.get('redirect');
    if (target?.startsWith('/dashboard')) {
      sessionStorage.setItem(AUTH_REDIRECT_STORAGE_KEY, target);
    }
  }, [searchParams]);

  useEffect(() => {
    const pendingEmail = sessionStorage.getItem(EMAIL_VERIFICATION_STORAGE_KEY);
    if (!pendingEmail) return;

    setVerificationNotice({
      email: pendingEmail,
      message: t('auth.verifyEmailPending'),
    });
    setEmail((currentEmail) => currentEmail || pendingEmail);
  }, [t]);

  useEffect(() => {
    const storedRedirect = sessionStorage.getItem('spa-redirect');
    if (!storedRedirect) return;

    sessionStorage.removeItem('spa-redirect');
    const normalized = storedRedirect.startsWith(basePath)
      ? storedRedirect.slice(basePath.length) || '/'
      : storedRedirect;

    if (normalized.startsWith('/auth')) {
      window.history.replaceState({}, '', `${basePath}${normalized}`);
      return;
    }

    sessionStorage.setItem('spa-redirect', storedRedirect);
  }, [basePath]);

  useEffect(() => {
    const messageFromUrl = readRecoveryErrorFromUrl();
    const storedMessage = sessionStorage.getItem(RECOVERY_ERROR_STORAGE_KEY);
    const nextMessage = messageFromUrl || storedMessage;

    if (storedMessage) {
      sessionStorage.removeItem(RECOVERY_ERROR_STORAGE_KEY);
    }

    if (!nextMessage) return;

    setRecoveryMode(false);
    setRecoveryError(nextMessage);
    setForgotOpen(true);
    toast({
      title: 'Reset link expired',
      description: nextMessage,
      variant: 'destructive',
    });

    window.history.replaceState({}, '', authPath);
  }, [authPath, searchParams, toast]);

  // Auth state listener — handles login + recovery
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryError(null);
        setRecoveryMode(true);
        return;
      }
      if (session && !recoveryMode && searchParams.get('type') !== 'recovery') {
        sessionStorage.removeItem(EMAIL_VERIFICATION_STORAGE_KEY);
        setVerificationNotice(null);
        sessionStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY);
        navigate(redirectPath, { replace: true });
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      const hasRecoveryError = Boolean(readRecoveryErrorFromUrl());
      const isRecovery = searchParams.get('type') === 'recovery' || window.location.hash.includes('type=recovery');
      if (hasRecoveryError) {
        setRecoveryMode(false);
        return;
      }
      if (isRecovery) {
        setRecoveryError(null);
        setRecoveryMode(true);
        return;
      }
      if (session) {
        sessionStorage.removeItem(EMAIL_VERIFICATION_STORAGE_KEY);
        setVerificationNotice(null);
        sessionStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY);
        navigate(redirectPath, { replace: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate, redirectPath, searchParams, recoveryMode]);

  // Audio init
  useEffect(() => {
    const audio = new Audio(`${basePath}/audio/Midnight_Facets.mp3`);
    audio.loop = true;
    audio.volume = 0.1;
    audioRef.current = audio;

    const stored = localStorage.getItem(AUDIO_MUTED_KEY);
    const startMuted = stored === null ? true : stored === 'true';
    setIsMuted(startMuted);

    if (!startMuted) {
      audio.play().catch(() => { /* autoplay blocked — wait for user gesture */ });
    }
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [basePath]);

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = !isMuted;
    setIsMuted(next);
    localStorage.setItem(AUDIO_MUTED_KEY, String(next));
    if (next) {
      audio.pause();
    } else {
      audio.play().catch((err) => {
        console.warn('Audio play failed:', err);
        toast({ title: t('auth.error') || 'Audio', description: 'Unable to play audio.', variant: 'destructive' });
      });
    }
  };

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

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: `${window.location.origin}${basePath}/auth?redirect=${encodeURIComponent(redirectPath)}`,
      });
      if (result.error) {
        toast({ title: t('auth.error'), description: (result.error as Error).message, variant: 'destructive' });
        return;
      }
      if (result.redirected) return;
      // Session set — navigate handled by listener
    } catch (err) {
      console.error('Google sign-in error:', err);
      toast({ title: t('auth.error'), description: String(err), variant: 'destructive' });
    } finally {
      setGoogleLoading(false);
    }
  };

  // Countdown ticker for forgot-password cooldown
  useEffect(() => {
    if (forgotCooldown <= 0) return;
    const id = setInterval(() => {
      setForgotCooldown((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [forgotCooldown]);

  const formatCooldown = (s: number) => {
    if (s >= 60) {
      const m = Math.floor(s / 60);
      const r = s % 60;
      return r ? `${m}m ${r}s` : `${m}m`;
    }
    return `${s}s`;
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || forgotCooldown > 0) return;
    setForgotSending(true);
    setForgotNotice(null);
    setRecoveryError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: resetRedirectTo,
      });
      if (error) {
        const msg = (error.message || '').toLowerCase();
        const status = (error as any)?.status;
        const isRate =
          status === 429 ||
          msg.includes('rate limit') ||
          msg.includes('over_email_send_rate_limit') ||
          msg.includes('too many');
        if (isRate) {
          const match = error.message?.match(/(\d+)\s*(second|seconds|sec|s)\b/i);
          const wait = match
            ? Math.max(parseInt(match[1], 10), 30)
            : FORGOT_PASSWORD_SAFE_RETRY_SECONDS;
          setForgotCooldown(wait);
          const notice = match
            ? `You've reached the email send limit. Please wait ${formatCooldown(wait)} before requesting another reset link on this page.`
            : `Password reset emails are temporarily unavailable because the email send limit has been reached. Please wait up to ${formatCooldown(wait)} before trying again.`;
          setForgotNotice({ type: 'rate', message: notice });
          toast({ title: 'Please wait', description: notice, variant: 'destructive' });
        } else {
          setForgotNotice({ type: 'error', message: error.message });
          toast({ title: t('auth.error'), description: error.message, variant: 'destructive' });
        }
        return;
      }
      // Success — apply a short client cooldown to prevent accidental repeat clicks.
      setForgotCooldown(60);
      setForgotNotice({
        type: 'success',
        message: 'Reset link sent. Check your inbox (and spam folder). You can request another link in 60s.',
      });
      toast({
        title: 'Reset link sent',
        description: 'Check your email for a secure link to reset your password.',
      });
      setForgotEmail('');
    } finally {
      setForgotSending(false);
    }
  };


  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({ title: 'Password too short', description: 'Use at least 6 characters.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwords do not match', description: 'Please re-enter the same password.', variant: 'destructive' });
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast({ title: t('auth.error'), description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Password updated', description: 'You can now sign in with your new password.' });
      await supabase.auth.signOut();
      setRecoveryMode(false);
      setNewPassword('');
      setConfirmPassword('');
      setRecoveryError(null);
      // Clean URL
      window.history.replaceState({}, '', `${basePath}/auth`);
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      <div className="w-full max-w-md">
        <div className="flex justify-end items-center mb-4">
          <LanguageSwitcher />
        </div>


        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <img src={cloversLogo} alt="Clovers Logo" className="w-12 h-12 object-contain" />
            <span className="font-display text-2xl font-bold">CLOVERS</span>
          </div>
          <p className="text-muted-foreground">
            {recoveryMode ? 'Set a new password' : (isLogin ? t('auth.loginTitle') : t('auth.signupTitle'))}
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl">
          {/* Mute/Unmute toggle — placed right above the sign-in form for easy access */}
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute background music' : 'Mute background music'}
              title={isMuted ? 'Unmute' : 'Mute'}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-secondary border-2 border-primary/40 text-foreground hover:bg-accent hover:text-accent-foreground transition-colors shadow-lg text-xs font-semibold uppercase tracking-wider animate-pulse-glow"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>{isMuted ? 'Unmute' : 'Mute'}</span>
            </button>
          </div>

          {recoveryError && !recoveryMode && (
            <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive-foreground">
              <p>{recoveryError}</p>
            </div>
          )}

          {recoveryMode ? (
            <form onSubmit={handleSetNewPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <Input id="newPassword" type="password" placeholder="••••••••" value={newPassword}
                       onChange={(e) => setNewPassword(e.target.value)} required minLength={6}
                       className="bg-secondary border-border" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input id="confirmPassword" type="password" placeholder="••••••••" value={confirmPassword}
                       onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6}
                       className="bg-secondary border-border" />
              </div>
              <Button type="submit" className="w-full btn-primary" disabled={savingPassword}>
                {savingPassword && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Update password
              </Button>
            </form>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName">{t('auth.name')}</Label>
                    <Input id="fullName" type="text" placeholder={t('auth.namePlaceholder')} value={fullName}
                           onChange={(e) => setFullName(e.target.value)} required={!isLogin}
                           className="bg-secondary border-border" />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth.email')}</Label>
                  <Input id="email" type="email" placeholder="your@email.com" value={email}
                         onChange={(e) => setEmail(e.target.value)} required className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">{t('auth.password')}</Label>
                    {isLogin && (
                      <button type="button" onClick={() => { setForgotEmail(email); setForgotOpen(true); }}
                              className="text-xs text-primary hover:underline">
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password}
                           onChange={(e) => setPassword(e.target.value)} required minLength={6}
                           className="bg-secondary border-border pr-10" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full btn-primary" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {isLogin ? t('auth.loginBtn') : t('auth.signupBtn')}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">or</span>
                </div>
              </div>

              {/* Google sign-in */}
              <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={googleLoading}>
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.3 14.7 2.3 12 2.3 6.9 2.3 2.8 6.4 2.8 11.5S6.9 20.7 12 20.7c6.9 0 9.5-4.8 9.5-7.3 0-.5 0-.9-.1-1.3H12z"/>
                  </svg>
                )}
                Continue with Google
              </Button>

              <div className="mt-6 text-center">
                <p className="text-muted-foreground text-sm">
                  {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}
                  <button type="button" onClick={() => setIsLogin(!isLogin)}
                          className="text-primary hover:underline ml-1 font-medium">
                    {isLogin ? t('auth.signupNow') : t('auth.loginNow')}
                  </button>
                </p>
              </div>
            </>
          )}
        </div>

        <div className="text-center mt-6">
          <a href="/" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
            {t('auth.backHome')}
          </a>
        </div>
      </div>

      {/* Forgot password dialog */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset your password</DialogTitle>
            <DialogDescription>
              Enter your account email. We'll send you a secure link to verify your identity and set a new password. The link expires shortly for your safety.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgotEmail">Email</Label>
              <Input id="forgotEmail" type="email" placeholder="your@email.com" value={forgotEmail}
                     onChange={(e) => setForgotEmail(e.target.value)} required
                     className="bg-secondary border-border" />
            </div>

            {forgotNotice && (
              <div
                role="alert"
                className={`rounded-md border p-3 text-sm ${
                  forgotNotice.type === 'success'
                    ? 'border-primary/40 bg-primary/10 text-primary-foreground'
                    : 'border-destructive/50 bg-destructive/10 text-destructive-foreground'
                }`}
              >
                <p>{forgotNotice.message}</p>
                {forgotCooldown > 0 && (
                  <p className="mt-1 font-semibold">
                    Try again in {formatCooldown(forgotCooldown)}.
                  </p>
                )}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setForgotOpen(false)} disabled={forgotSending}>
                Cancel
              </Button>
              <Button type="submit" disabled={forgotSending || forgotCooldown > 0}>
                {forgotSending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {forgotCooldown > 0 ? `Wait ${formatCooldown(forgotCooldown)}` : 'Send reset link'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Auth;
