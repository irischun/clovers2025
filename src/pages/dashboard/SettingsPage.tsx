import { useState, useEffect } from 'react';
import { User, Mail, Lock, Save, Loader2, Info } from 'lucide-react';
import { APP_VERSION, VERSION_NAME, VERSION_DATE } from '@/config/version';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const SettingsPage = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState('');
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    full_name: '',
    bio: '',
    avatar_url: '',
  });
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        setEmail(user.email || '');
        setCreatedAt(user.created_at || null);

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        
        if (data) {
          setProfile({
            full_name: data.full_name || '',
            bio: data.bio || '',
            avatar_url: data.avatar_url || '',
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleUpdateProfile = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: profile.full_name,
          bio: profile.bio,
          avatar_url: profile.avatar_url,
        });

      if (error) throw error;
      toast({ title: '個人資料已更新' });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({ title: '更新失敗', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      toast({ title: '新密碼不一致', variant: 'destructive' });
      return;
    }

    if (passwords.new.length < 6) {
      toast({ title: '密碼至少需要 6 個字元', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwords.new });
      if (error) throw error;
      
      setPasswords({ current: '', new: '', confirm: '' });
      toast({ title: '密碼已更新' });
    } catch (error) {
      console.error('Error changing password:', error);
      toast({ title: '密碼更新失敗', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    return profile.full_name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || email?.slice(0, 2).toUpperCase() || 'U';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="heading-display text-2xl mb-1">用戶資料</h1>
        <p className="text-muted-foreground">管理您的個人資訊</p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            個人資料
          </CardTitle>
          <CardDescription>更新您的個人資訊</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-6">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Input
                value={profile.avatar_url}
                onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
                placeholder="頭像 URL"
              />
              <p className="text-xs text-muted-foreground mt-1">輸入圖片網址作為頭像</p>
            </div>
          </div>

          <Separator />

          {/* Name */}
          <div>
            <label className="text-sm font-medium mb-2 block">姓名</label>
            <Input
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              placeholder="您的姓名"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="text-sm font-medium mb-2 block flex items-center gap-2">
              <Mail className="w-4 h-4" />
              電子郵件
            </label>
            <Input value={email} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground mt-1">電子郵件無法更改</p>
          </div>

          {/* Registration time (read-only) */}
          <div>
            <label className="text-sm font-medium mb-2 block">註冊時間</label>
            <Input 
              value={createdAt ? new Date(createdAt).toLocaleString('zh-TW', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : ''} 
              disabled 
              className="bg-muted" 
            />
          </div>

          {/* Bio */}
          <div>
            <label className="text-sm font-medium mb-2 block">個人簡介</label>
            <Textarea
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="簡單介紹一下自己..."
              rows={3}
            />
          </div>

          <Button onClick={handleUpdateProfile} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            儲存變更
          </Button>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            安全設定
          </CardTitle>
          <CardDescription>更新您的密碼</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">新密碼</label>
            <Input
              type="password"
              value={passwords.new}
              onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
              placeholder="輸入新密碼"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">確認新密碼</label>
            <Input
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
              placeholder="再次輸入新密碼"
            />
          </div>

          <Button 
            onClick={handleChangePassword} 
            disabled={saving || !passwords.new || !passwords.confirm}
            variant="outline"
            className="gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            更新密碼
          </Button>
        </CardContent>
      </Card>

      {/* Version Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            版本資訊
          </CardTitle>
          <CardDescription>系統版本與更新資訊</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground">版本號碼</span>
            <span className="font-mono text-sm">v{APP_VERSION}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground">版本名稱</span>
            <span className="text-sm">{VERSION_NAME}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-muted-foreground">發布日期</span>
            <span className="text-sm">{VERSION_DATE}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
