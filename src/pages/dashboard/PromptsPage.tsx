import { useState } from 'react';
import { Plus, Search, Star, Copy, Pencil, Trash2, Filter, BookOpen, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePrompts, Prompt } from '@/hooks/usePrompts';
import { useToast } from '@/hooks/use-toast';
import { promptTemplates, templateCategories, PromptTemplate } from '@/data/promptTemplates';

const categories = [
  { value: 'general', label: '一般' },
  { value: 'social', label: '社交媒體' },
  { value: 'video', label: '視頻腳本' },
  { value: 'blog', label: '部落格' },
  { value: 'email', label: '電子郵件' },
  { value: 'marketing', label: '行銷' },
];

const PromptsPage = () => {
  const { prompts, loading, createPrompt, updatePrompt, deletePrompt, toggleFavorite } = usePrompts();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showFavorites, setShowFavorites] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: '',
  });
  
  // Template library state
  const [activeTab, setActiveTab] = useState('my-prompts');
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateCategory, setTemplateCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          prompt.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || prompt.category === filterCategory;
    const matchesFavorite = !showFavorites || prompt.is_favorite;
    return matchesSearch && matchesCategory && matchesFavorite;
  });

  const filteredTemplates = promptTemplates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(templateSearch.toLowerCase()) ||
                          template.content.toLowerCase().includes(templateSearch.toLowerCase()) ||
                          template.tags.some(tag => tag.toLowerCase().includes(templateSearch.toLowerCase()));
    const matchesCategory = templateCategory === 'all' || template.category === templateCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenDialog = (prompt?: Prompt) => {
    if (prompt) {
      setEditingPrompt(prompt);
      setFormData({
        title: prompt.title,
        content: prompt.content,
        category: prompt.category,
        tags: prompt.tags.join(', '),
      });
    } else {
      setEditingPrompt(null);
      setFormData({ title: '', content: '', category: 'general', tags: '' });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.content) {
      toast({ title: '請填寫標題和內容', variant: 'destructive' });
      return;
    }

    const promptData = {
      title: formData.title,
      content: formData.content,
      category: formData.category,
      tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      is_favorite: editingPrompt?.is_favorite || false,
    };

    if (editingPrompt) {
      await updatePrompt(editingPrompt.id, promptData);
    } else {
      await createPrompt(promptData);
    }
    setIsDialogOpen(false);
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({ title: '已複製到剪貼板' });
  };

  const handleImportTemplate = async (template: PromptTemplate) => {
    await createPrompt({
      title: template.title,
      content: template.content,
      category: template.category,
      tags: template.tags,
      is_favorite: false,
    });
    toast({ title: '模板已導入到我的提示詞庫' });
    setActiveTab('my-prompts');
  };

  const handleViewTemplate = (template: PromptTemplate) => {
    setSelectedTemplate(template);
    setIsTemplateDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="heading-display text-2xl mb-1">提示詞庫</h1>
          <p className="text-muted-foreground">管理和組織您的 AI 提示詞</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsTutorialOpen(true)} className="gap-2">
            <BookOpen className="w-4 h-4" />
            觀看教學
          </Button>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="w-4 h-4" />
            新增提示詞
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="my-prompts">我的提示詞</TabsTrigger>
          <TabsTrigger value="template-library">提示詞庫</TabsTrigger>
        </TabsList>

        {/* My Prompts Tab */}
        <TabsContent value="my-prompts" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜尋提示詞..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部分類</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant={showFavorites ? "default" : "outline"} 
              onClick={() => setShowFavorites(!showFavorites)}
              className="gap-2"
            >
              <Star className={`w-4 h-4 ${showFavorites ? 'fill-current' : ''}`} />
              收藏
            </Button>
          </div>

          {/* Prompts Grid */}
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse">
                  <div className="h-5 bg-muted rounded w-3/4 mb-3"></div>
                  <div className="h-20 bg-muted rounded mb-4"></div>
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : filteredPrompts.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <p className="text-muted-foreground mb-2">
                {prompts.length === 0 ? '還沒有提示詞' : '沒有找到匹配的提示詞'}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                試試從提示詞庫導入模板開始
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => handleOpenDialog()} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  創建提示詞
                </Button>
                <Button onClick={() => setActiveTab('template-library')}>
                  <BookOpen className="w-4 h-4 mr-2" />
                  瀏覽模板庫
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPrompts.map(prompt => (
                <div 
                  key={prompt.id} 
                  className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-foreground line-clamp-1">{prompt.title}</h3>
                    <button 
                      onClick={() => toggleFavorite(prompt.id)}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Star className={`w-4 h-4 ${prompt.is_favorite ? 'fill-primary text-primary' : ''}`} />
                    </button>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{prompt.content}</p>
                  
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      {categories.find(c => c.value === prompt.category)?.label || prompt.category}
                    </Badge>
                    
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" onClick={() => handleCopy(prompt.content)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(prompt)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => deletePrompt(prompt.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Template Library Tab */}
        <TabsContent value="template-library" className="space-y-6">
          {/* Template Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜尋模板..."
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={templateCategory} onValueChange={setTemplateCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {templateCategories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-muted-foreground">
            共 {filteredTemplates.length} 個模板
          </div>

          {/* Templates Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map(template => (
              <div 
                key={template.id} 
                className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors group"
              >
                <h3 className="font-semibold text-foreground line-clamp-2 mb-2">{template.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{template.content}</p>
                
                <div className="flex flex-wrap gap-1 mb-4">
                  {template.tags.slice(0, 3).map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                  ))}
                </div>
                
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">
                    {templateCategories.find(c => c.value === template.category)?.label || template.category}
                  </Badge>
                  
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleViewTemplate(template)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleCopy(template.content)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleImportTemplate(template)}>
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPrompt ? '編輯提示詞' : '新增提示詞'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">標題</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="提示詞標題"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">內容</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="輸入您的提示詞內容..."
                rows={6}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">分類</label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">標籤 (以逗號分隔)</label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="例：行銷, AI, 創意"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave}>{editingPrompt ? '更新' : '創建'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template View Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.title}</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[50vh]">
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">內容</label>
                <div className="mt-2 p-4 bg-muted/50 rounded-lg whitespace-pre-wrap text-sm">
                  {selectedTemplate?.content}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {selectedTemplate?.tags.map((tag, i) => (
                  <Badge key={i} variant="outline">{tag}</Badge>
                ))}
              </div>
            </div>
          </ScrollArea>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>關閉</Button>
            <Button variant="outline" onClick={() => selectedTemplate && handleCopy(selectedTemplate.content)}>
              <Copy className="w-4 h-4 mr-2" />
              複製
            </Button>
            <Button onClick={() => {
              if (selectedTemplate) {
                handleImportTemplate(selectedTemplate);
                setIsTemplateDialogOpen(false);
              }
            }}>
              <Download className="w-4 h-4 mr-2" />
              導入到我的提示詞
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tutorial Dialog */}
      <Dialog open={isTutorialOpen} onOpenChange={setIsTutorialOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>提示詞庫使用教學</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-6 py-4 text-sm">
              <section>
                <h3 className="font-semibold text-base mb-2">📚 什麼是提示詞庫？</h3>
                <p className="text-muted-foreground">
                  提示詞庫是一個集中管理所有 AI 提示詞的工具。您可以保存、組織和重複使用最有效的提示詞，
                  大幅提高 AI 創作的效率和質量。
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">🎯 主要功能</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li><strong>我的提示詞</strong> - 保存和管理個人創建的提示詞</li>
                  <li><strong>提示詞庫</strong> - 瀏覽 100+ 預設模板，一鍵導入使用</li>
                  <li><strong>分類篩選</strong> - 按類別快速找到需要的提示詞</li>
                  <li><strong>收藏功能</strong> - 標記常用提示詞，方便快速訪問</li>
                  <li><strong>一鍵複製</strong> - 快速複製提示詞到剪貼板</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">📝 模板分類說明</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li><strong>一般</strong> - 通用型提示詞，適用於各種場景</li>
                  <li><strong>社交媒體</strong> - YouTube封面、WhatsApp貼紙、漫畫等</li>
                  <li><strong>視頻/鏡頭</strong> - 攝影角度、鏡頭運動、構圖技巧</li>
                  <li><strong>行銷/海報</strong> - 電影海報、商業廣告、產品展示</li>
                  <li><strong>部落格</strong> - 文章寫作、內容創作</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">💡 使用技巧</h3>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>從模板庫導入後可以自由編輯，創建個人化版本</li>
                  <li>使用標籤功能幫助組織和搜尋提示詞</li>
                  <li>將常用提示詞標記為收藏，快速訪問</li>
                  <li>結合多個提示詞創建更複雜的創作指令</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">🎬 鏡頭提示詞說明</h3>
                <p className="text-muted-foreground mb-2">
                  模板庫包含大量攝影鏡頭相關的提示詞，適用於圖像和視頻生成：
                </p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li><strong>高角度/低角度</strong> - 改變拍攝視角</li>
                  <li><strong>特寫/中景/全身</strong> - 控制畫面範圍</li>
                  <li><strong>過肩鏡頭</strong> - 對話場景構圖</li>
                  <li><strong>FPV/無人機</strong> - 動態視角效果</li>
                </ul>
              </section>
            </div>
          </ScrollArea>
          
          <DialogFooter>
            <Button onClick={() => setIsTutorialOpen(false)}>開始使用</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PromptsPage;
