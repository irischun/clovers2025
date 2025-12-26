import { useState, useEffect } from 'react';
import { Key, User, Plus, X, Loader2, CheckCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUploadPostSettings } from '@/hooks/useUploadPostSettings';

export function UploadPostSettings() {
  const { settings, loading, saveSettings } = useUploadPostSettings();
  
  const [apiKey, setApiKey] = useState('');
  const [managedUser, setManagedUser] = useState('');
  const [facebookPageIds, setFacebookPageIds] = useState<string[]>([]);
  const [newPageId, setNewPageId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setApiKey(settings.api_key);
      setManagedUser(settings.managed_user);
      setFacebookPageIds(settings.facebook_page_ids || []);
    }
  }, [settings]);

  const handleAddPageId = () => {
    if (newPageId.trim() && !facebookPageIds.includes(newPageId.trim())) {
      setFacebookPageIds([...facebookPageIds, newPageId.trim()]);
      setNewPageId('');
    }
  };

  const handleRemovePageId = (pageId: string) => {
    setFacebookPageIds(facebookPageIds.filter(id => id !== pageId));
  };

  const handleSave = async () => {
    if (!apiKey || !managedUser) return;
    setIsSaving(true);
    try {
      await saveSettings(apiKey, managedUser, facebookPageIds);
    } finally {
      setIsSaving(false);
    }
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
              <Key className="w-5 h-5" />
              社交媒體 Upload-Post 設定
            </CardTitle>
            <CardDescription>
              設定您的 Upload-Post 用戶識別碼，用於發布到社交媒體
            </CardDescription>
          </div>
          {settings && (
            <span className="flex items-center gap-1 text-sm text-green-500">
              <CheckCircle className="w-4 h-4" />
              已設定
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="api-key" className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            Upload-Post API Key
          </Label>
          <Input
            id="api-key"
            type="password"
            placeholder="輸入您的Upload-Post API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="managed-user" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Managed User *
          </Label>
          <Input
            id="managed-user"
            placeholder="在 Upload-Post 的 Managed Users 頁面創建的用戶名稱"
            value={managedUser}
            onChange={(e) => setManagedUser(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            在 Managed Users 頁面創建的 user
          </p>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            Facebook Page IDs（可選）
          </Label>
          
          <div className="flex gap-2">
            <Input
              placeholder="輸入 Page ID"
              value={newPageId}
              onChange={(e) => setNewPageId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddPageId();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddPageId}
              disabled={!newPageId.trim()}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              添加 Page ID
            </Button>
          </div>

          {facebookPageIds.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {facebookPageIds.map((pageId) => (
                <Badge key={pageId} variant="secondary" className="gap-1">
                  {pageId}
                  <button
                    onClick={() => handleRemovePageId(pageId)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            如有多個 Facebook Page 需要發布，可以添加多個 Page ID。
            <a 
              href="https://app.upload-post.com/login" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline ml-1"
            >
              前往 Upload-Post 平台 設定
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving || !apiKey || !managedUser}
          className="w-full"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              保存中...
            </>
          ) : (
            '確認並保存設定'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
