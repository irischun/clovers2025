import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import cloversLogo from '@/assets/clovers-logo-new.png';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/dashboard');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message === 'Invalid login credentials') {
            toast({
              title: '登入失敗',
              description: '電郵或密碼錯誤，請重試。',
              variant: 'destructive',
            });
          } else {
            toast({
              title: '錯誤',
              description: error.message,
              variant: 'destructive',
            });
          }
          return;
        }

        toast({
          title: '登入成功！',
          description: '歡迎回來！',
        });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: '註冊失敗',
              description: '此電郵已被註冊，請使用其他電郵或登入。',
              variant: 'destructive',
            });
          } else {
            toast({
              title: '錯誤',
              description: error.message,
              variant: 'destructive',
            });
          }
          return;
        }

        toast({
          title: '註冊成功！',
          description: '歡迎加入 Clovers！',
        });
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: '錯誤',
        description: '發生未知錯誤，請重試。',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <img 
              src={cloversLogo} 
              alt="Clovers Logo" 
              className="w-12 h-12 object-contain"
            />
            <span className="font-display text-2xl font-bold">CLOVERS</span>
          </div>
          <p className="text-muted-foreground">
            {isLogin ? '登入您的帳戶' : '建立新帳戶'}
          </p>
        </div>

        {/* Form */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName">姓名</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="請輸入您的姓名"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={!isLogin}
                  className="bg-secondary border-border"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">電郵地址</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">密碼</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="bg-secondary border-border pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {isLogin ? '登入' : '註冊'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-sm">
              {isLogin ? '還沒有帳戶？' : '已經有帳戶？'}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline ml-1 font-medium"
              >
                {isLogin ? '立即註冊' : '立即登入'}
              </button>
            </p>
          </div>
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <a href="/" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
            ← 返回首頁
          </a>
        </div>
      </div>
    </div>
  );
};

export default Auth;
