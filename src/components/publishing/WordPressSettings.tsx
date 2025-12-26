import { useState, useEffect } from 'react';
import { Globe, User, Key, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWordPressConnection } from '@/hooks/useWordPressConnection';

export function WordPressSettings() {
  const { connection, loading, testing, saveConnection, testConnection } = useWordPressConnection();
  
  const [siteUrl, setSiteUrl] = useState('');
  const [username, setUsername] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (connection) {
      setSiteUrl(connection.site_url);
      setUsername(connection.username);
      setAppPassword(connection.app_password);
    }
  }, [connection]);

  const handleSave = async () => {
    if (!siteUrl || !username || !appPassword) return;
    setIsSaving(true);
    try {
      await saveConnection(siteUrl, username, appPassword);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!siteUrl || !username || !appPassword) return;
    await testConnection(siteUrl, username, appPassword);
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
        <div className="space-y-2">
          <Label htmlFor="site-url" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            WordPress 網站網址
          </Label>
          <Input
            id="site-url"
            placeholder="https://yoursite.com"
            value={siteUrl}
            onChange={(e) => setSiteUrl(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="username" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            用戶名
          </Label>
          <Input
            id="username"
            placeholder="admin"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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
            onChange={(e) => setAppPassword(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            在 WordPress 後台 → 用戶 → 個人資料 → 應用程式密碼 中生成
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={testing || !siteUrl || !username || !appPassword}
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
              '保存設定'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
