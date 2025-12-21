import { useState } from 'react';
import { Sparkles, Copy, RefreshCw, Instagram, Youtube, Mail, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAIGeneration } from '@/hooks/useAIGeneration';
import { useToast } from '@/hooks/use-toast';

const tools = [
  { 
    id: 'social', 
    label: '社交媒體', 
    icon: Instagram,
    description: '生成吸引眼球的社交媒體帖子',
    placeholder: '描述您想要的帖子內容，例如：推廣新產品上市，強調環保材質和限時優惠...'
  },
  { 
    id: 'video', 
    label: '視頻腳本', 
    icon: Youtube,
    description: '創建專業的視頻腳本結構',
    placeholder: '描述您的視頻主題，例如：5分鐘教學視頻，教觀眾如何使用我們的應用程式...'
  },
  { 
    id: 'blog', 
    label: '部落格文章', 
    icon: FileText,
    description: '撰寫引人入勝的部落格內容',
    placeholder: '描述文章主題，例如：關於2024年數位行銷趨勢的深度分析...'
  },
  { 
    id: 'email', 
    label: '電子郵件', 
    icon: Mail,
    description: '打造高轉換率的行銷郵件',
    placeholder: '描述郵件目的，例如：給新訂閱者的歡迎郵件，介紹品牌故事和首次購買優惠...'
  },
];

const AIToolsPage = () => {
  const [selectedTool, setSelectedTool] = useState('social');
  const [prompt, setPrompt] = useState('');
  const { generateContent, isGenerating, generatedContent, setGeneratedContent } = useAIGeneration();
  const { toast } = useToast();

  const currentTool = tools.find(t => t.id === selectedTool)!;

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: '請輸入提示詞', variant: 'destructive' });
      return;
    }
    await generateContent(prompt, selectedTool as 'social' | 'video' | 'blog' | 'email');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    toast({ title: '已複製到剪貼板' });
  };

  const handleRegenerate = () => {
    if (prompt.trim()) {
      generateContent(prompt, selectedTool as 'social' | 'video' | 'blog' | 'email');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="heading-display text-2xl mb-1">AI 內容工具</h1>
        <p className="text-muted-foreground">使用 AI 快速生成高質量創意內容</p>
      </div>

      {/* Tools Tabs */}
      <Tabs value={selectedTool} onValueChange={setSelectedTool}>
        <TabsList className="grid grid-cols-2 lg:grid-cols-4 w-full h-auto gap-2 bg-transparent p-0">
          {tools.map(tool => (
            <TabsTrigger 
              key={tool.id} 
              value={tool.id}
              className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-border data-[state=active]:border-primary py-3"
            >
              <tool.icon className="w-4 h-4" />
              {tool.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tools.map(tool => (
          <TabsContent key={tool.id} value={tool.id} className="mt-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Input Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <tool.icon className="w-5 h-5 text-primary" />
                    {tool.label}生成器
                  </CardTitle>
                  <CardDescription>{tool.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={tool.placeholder}
                    rows={8}
                    className="resize-none"
                  />
                  <Button 
                    onClick={handleGenerate} 
                    disabled={isGenerating || !prompt.trim()}
                    className="w-full gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        生成內容
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Output Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>生成結果</CardTitle>
                    {generatedContent && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={handleCopy}>
                          <Copy className="w-4 h-4 mr-1" />
                          複製
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleRegenerate} disabled={isGenerating}>
                          <RefreshCw className={`w-4 h-4 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
                          重新生成
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {generatedContent ? (
                    <div className="prose prose-invert max-w-none">
                      <div className="bg-muted/50 rounded-lg p-4 whitespace-pre-wrap text-sm leading-relaxed max-h-[400px] overflow-y-auto">
                        {generatedContent}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                      <Sparkles className="w-12 h-12 mb-4 opacity-50" />
                      <p>輸入提示詞後點擊生成按鈕</p>
                      <p className="text-sm mt-1">AI 將為您創建內容</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Tips Section */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">使用技巧</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• <strong>具體描述</strong> - 提供越多細節，生成的內容越精準</li>
            <li>• <strong>指定風格</strong> - 告訴 AI 您想要的語調，如專業、幽默、親切等</li>
            <li>• <strong>目標受眾</strong> - 說明內容是給誰看的，AI 會調整用語</li>
            <li>• <strong>多次嘗試</strong> - 不滿意可以重新生成或調整提示詞</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIToolsPage;
