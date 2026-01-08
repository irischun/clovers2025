import { useState } from 'react';
import { Globe, User, Key, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWordPressConnection } from '@/hooks/useWordPressConnection';

export function WordPressSettings() {
  const { connection, loading, testing, saveConnection, testConnection } = useWordPressConnection();
  
  // Local form state - only for new input, not pre-filled with stored credentials
  const [siteUrl, setSiteUrl] = useState('');
  const [username, setUsername] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleInputChange = (field: 'siteUrl' | 'username' | 'appPassword', value: string) => {
    setHasUnsavedChanges(true);
    switch (field) {
      case 'siteUrl':
        setSiteUrl(value);
        break;
      case 'username':
        setUsername(value);
        break;
      case 'appPassword':
        setAppPassword(value);
        break;
    }
  };

  const handleSave = async () => {
    if (!siteUrl || !username || !appPassword) return;
    setIsSaving(true);
    try {
      await saveConnection(siteUrl, username, appPassword);
      // Clear form after successful save - credentials are now stored server-side
      setSiteUrl('');
      setUsername('');
      setAppPassword('');
      setHasUnsavedChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    // Test uses stored credentials via edge function
    await testConnection();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              WordPress 連接設定
            </CardTitle>
            <CardDescription>輸入您的 WordPress 網站資訊</CardDescription>
          </div>
          {connection && (
            <div className="flex items-center gap-2">
              {connection.is_connected ? (
                <span className="flex items-center gap-1 text-sm text-green-500">
                  <CheckCircle className="w-4 h-4" />
                  已連接
                </span>
              ) : (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <XCircle className="w-4 h-4" />
                  未連接
                </span>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {connection && !hasUnsavedChanges && (
          <div className="p-3 bg-muted rounded-lg space-y-2">
            <p className="text-sm font-medium">目前連接的網站</p>
            <p className="text-sm text-muted-foreground">{connection.site_url}</p>
            <p className="text-sm text-muted-foreground">用戶名: {connection.username}</p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="site-url" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            WordPress 網站網址
          </Label>
          <Input
            id="site-url"
            placeholder={connection ? "輸入新網址以更新" : "https://yoursite.com"}
            value={siteUrl}
            onChange={(e) => handleInputChange('siteUrl', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="username" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            用戶名
          </Label>
          <Input
            id="username"
            placeholder={connection ? "輸入新用戶名以更新" : "admin"}
            value={username}
            onChange={(e) => handleInputChange('username', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="app-password" className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            應用程式密碼
          </Label>
          <Input
            id="app-password"
            type="password"
            placeholder="xxxx xxxx xxxx xxxx"
            value={appPassword}
            onChange={(e) => handleInputChange('appPassword', e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            在 WordPress 後台 → 用戶 → 個人資料 → 應用程式密碼 中生成
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={testing || !connection}
            className="flex-1"
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                測試中...
              </>
            ) : (
              '測試連接'
            )}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !siteUrl || !username || !appPassword}
            className="flex-1"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              connection ? '更新設定' : '保存設定'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
