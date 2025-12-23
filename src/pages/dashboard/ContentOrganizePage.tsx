import { useState } from 'react';
import { FileText, Loader2, Copy, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const actions = [
  { id: 'summarize', label: '總結', icon: '📝' },
  { id: 'rewrite', label: '改寫', icon: '✏️' },
  { id: 'translate_en', label: '翻譯成英文', icon: '🇺🇸' },
  { id: 'translate_zh', label: '翻譯成中文', icon: '🇹🇼' },
  { id: 'expand', label: '擴展', icon: '📖' },
  { id: 'simplify', label: '簡化', icon: '🎯' },
  { id: 'keywords', label: '提取關鍵詞', icon: '🏷️' },
  { id: 'outline', label: '生成大綱', icon: '📋' },
];

const ContentOrganizePage = () => {
  const [content, setContent] = useState('');
  const [result, setResult] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedAction, setSelectedAction] = useState('');
  const { toast } = useToast();

  const handleProcess = async (action: string) => {
    if (!content.trim()) { toast({ title: '請輸入內容', variant: 'destructive' }); return; }
    setSelectedAction(action);
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-organize', { body: { content, action } });
      if (error) throw error;
      setResult(data.result);
    } catch (error) {
      toast({ title: '處理失敗', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="heading-display text-2xl mb-1">內容整理</h1>
        <p className="text-muted-foreground">使用 AI 整理和優化您的內容</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>原始內容</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="貼上您要整理的內容..." rows={10} />
            <div className="grid grid-cols-4 gap-2">
              {actions.map(a => (
                <Button key={a.id} variant="outline" size="sm" onClick={() => handleProcess(a.id)} disabled={isProcessing}>
                  {isProcessing && selectedAction === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{a.icon} {a.label}</span>}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>處理結果</CardTitle>
            {result && <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(result); toast({ title: '已複製' }); }}><Copy className="w-4 h-4" /></Button>}
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="bg-muted/50 rounded-lg p-4 whitespace-pre-wrap text-sm max-h-[400px] overflow-y-auto">{result}</div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <FileText className="w-12 h-12 mb-4 opacity-50" />
                <p>選擇操作後結果將顯示在這裡</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ContentOrganizePage;
