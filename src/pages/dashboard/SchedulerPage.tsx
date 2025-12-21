import { useState } from 'react';
import { Plus, Calendar as CalendarIcon, Clock, Instagram, Youtube, Twitter, Linkedin, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useScheduledPosts, ScheduledPost } from '@/hooks/useScheduledPosts';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { zhTW } from 'date-fns/locale';

const platforms = [
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'youtube', label: 'YouTube', icon: Youtube },
  { value: 'twitter', label: 'Twitter/X', icon: Twitter },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
];

const statusColors: Record<string, string> = {
  scheduled: 'bg-primary/20 text-primary',
  published: 'bg-green-500/20 text-green-500',
  draft: 'bg-muted text-muted-foreground',
  failed: 'bg-destructive/20 text-destructive',
};

const statusLabels: Record<string, string> = {
  scheduled: '已排程',
  published: '已發布',
  draft: '草稿',
  failed: '失敗',
};

const SchedulerPage = () => {
  const { posts, loading, createPost, updatePost, deletePost } = useScheduledPosts();
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMonth, setViewMonth] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    content: string;
    platform: string;
    scheduled_at: string;
    status: 'scheduled' | 'draft';
  }>({
    title: '',
    content: '',
    platform: 'instagram',
    scheduled_at: '',
    status: 'scheduled',
  });

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(viewMonth),
    end: endOfMonth(viewMonth),
  });

  const getPostsForDay = (day: Date) => {
    return posts.filter(post => isSameDay(new Date(post.scheduled_at), day));
  };

  const todaysPosts = posts.filter(post => isSameDay(new Date(post.scheduled_at), selectedDate));

  const handleOpenDialog = (post?: ScheduledPost) => {
    if (post) {
      setEditingPost(post);
      setFormData({
        title: post.title,
        content: post.content,
        platform: post.platform,
        scheduled_at: post.scheduled_at.slice(0, 16),
        status: post.status,
      });
    } else {
      setEditingPost(null);
      const defaultDate = new Date(selectedDate);
      defaultDate.setHours(12, 0, 0, 0);
      setFormData({
        title: '',
        content: '',
        platform: 'instagram',
        scheduled_at: defaultDate.toISOString().slice(0, 16),
        status: 'scheduled' as const,
        status: 'scheduled',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.content || !formData.scheduled_at) return;

    const postData = {
      title: formData.title,
      content: formData.content,
      platform: formData.platform,
      scheduled_at: new Date(formData.scheduled_at).toISOString(),
      status: formData.status,
      media_urls: editingPost?.media_urls || [],
    };

    if (editingPost) {
      await updatePost(editingPost.id, postData);
    } else {
      await createPost(postData);
    }
    setIsDialogOpen(false);
  };

  const getPlatformIcon = (platform: string) => {
    const p = platforms.find(pl => pl.value === platform);
    return p ? <p.icon className="w-4 h-4" /> : null;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="heading-display text-2xl mb-1">內容排程</h1>
          <p className="text-muted-foreground">計劃和排程您的社交媒體內容</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <Plus className="w-4 h-4" />
          新增排程
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold">{format(viewMonth, 'yyyy年 MMMM', { locale: zhTW })}</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setViewMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}>
                上月
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewMonth(new Date())}>
                今天
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}>
                下月
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {['日', '一', '二', '三', '四', '五', '六'].map(day => (
              <div key={day} className="text-center text-sm text-muted-foreground py-2 font-medium">
                {day}
              </div>
            ))}
            
            {/* Empty cells for days before the month starts */}
            {Array.from({ length: daysInMonth[0].getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            
            {daysInMonth.map(day => {
              const dayPosts = getPostsForDay(day);
              const isSelected = isSameDay(day, selectedDate);
              const isToday = isSameDay(day, new Date());
              
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    aspect-square p-1 rounded-lg text-sm transition-colors relative
                    ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
                    ${isToday && !isSelected ? 'ring-2 ring-primary' : ''}
                  `}
                >
                  <span className="block">{day.getDate()}</span>
                  {dayPosts.length > 0 && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {dayPosts.slice(0, 3).map((_, i) => (
                        <div key={i} className={`w-1 h-1 rounded-full ${isSelected ? 'bg-primary-foreground' : 'bg-primary'}`} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Posts for selected day */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">
            {format(selectedDate, 'MM月 dd日', { locale: zhTW })} 的排程
          </h3>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="p-3 bg-muted rounded-lg animate-pulse">
                  <div className="h-4 bg-muted-foreground/20 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted-foreground/20 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : todaysPosts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">這天沒有排程</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => handleOpenDialog()}>
                新增排程
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {todaysPosts.map(post => (
                <div key={post.id} className="p-3 bg-muted/50 rounded-lg group">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getPlatformIcon(post.platform)}
                      <span className="font-medium text-sm line-clamp-1">{post.title}</span>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleOpenDialog(post)}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => deletePost(post.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{post.content}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(post.scheduled_at), 'HH:mm')}
                    </span>
                    <Badge className={statusColors[post.status]} variant="secondary">
                      {statusLabels[post.status]}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPost ? '編輯排程' : '新增排程'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">標題</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="帖子標題"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">內容</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="輸入帖子內容..."
                rows={4}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">平台</label>
                <Select value={formData.platform} onValueChange={(v) => setFormData({ ...formData, platform: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map(p => (
                      <SelectItem key={p.value} value={p.value}>
                        <span className="flex items-center gap-2">
                          <p.icon className="w-4 h-4" />
                          {p.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">狀態</label>
                <Select 
                  value={formData.status} 
                  onValueChange={(v) => setFormData({ ...formData, status: v as 'scheduled' | 'draft' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">已排程</SelectItem>
                    <SelectItem value="draft">草稿</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">排程時間</label>
              <Input
                type="datetime-local"
                value={formData.scheduled_at}
                onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave}>{editingPost ? '更新' : '創建'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchedulerPage;
