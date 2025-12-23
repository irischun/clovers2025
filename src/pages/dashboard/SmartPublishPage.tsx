import { useState } from 'react';
import { Send, Loader2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

const platforms = [
  { id: 'facebook', label: 'Facebook', icon: '📘' },
  { id: 'instagram', label: 'Instagram', icon: '📸' },
  { id: 'twitter', label: 'X (Twitter)', icon: '🐦' },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { id: 'threads', label: 'Threads', icon: '🧵' },
  { id: 'xiaohongshu', label: '小紅書', icon: '📕' },
];

const SmartPublishPage = () => {
  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const { toast } = useToast();

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const handlePublish = async () => {
    if (!content.trim()) { toast({ title: '請輸入內容', variant: 'destructive' }); return; }
    if (selectedPlatforms.length === 0) { toast({ title: '請選擇平台', variant: 'destructive' }); return; }
    setIsPublishing(true);
    setTimeout(() => {
      toast({ title: '智能發布功能', description: '此功能需要連接各平台 API。請在設定中配置授權。' });
      setIsPublishing(false);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="heading-display text-2xl mb-1">智能內容發布</h1>
        <p className="text-muted-foreground">一鍵發布內容到多個平台</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>發布內容</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="輸入要發布的內容..." rows={8} />
            <Button onClick={handlePublish} disabled={isPublishing} className="w-full">
              {isPublishing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              發布到選定平台
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>選擇平台</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {platforms.map(p => (
              <label key={p.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer">
                <Checkbox checked={selectedPlatforms.includes(p.id)} onCheckedChange={() => togglePlatform(p.id)} />
                <span>{p.icon}</span>
                <span>{p.label}</span>
              </label>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SmartPublishPage;
