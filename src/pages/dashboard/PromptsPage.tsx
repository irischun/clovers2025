import { useState } from 'react';
import { Plus, Search, Star, Copy, Pencil, Trash2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePrompts, Prompt } from '@/hooks/usePrompts';
import { useToast } from '@/hooks/use-toast';

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

  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          prompt.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || prompt.category === filterCategory;
    const matchesFavorite = !showFavorites || prompt.is_favorite;
    return matchesSearch && matchesCategory && matchesFavorite;
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="heading-display text-2xl mb-1">提示詞庫</h1>
          <p className="text-muted-foreground">管理和組織您的 AI 提示詞</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          新增提示詞
        </Button>
      </div>

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
          <Button onClick={() => handleOpenDialog()} variant="outline" className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            創建第一個提示詞
          </Button>
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
    </div>
  );
};

export default PromptsPage;
