import { useState } from 'react';
import { Plus, Calendar as CalendarIcon, Clock, Instagram, Youtube, Twitter, Linkedin, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

export function ScheduledPostsManager() {
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
      const statusValue = post.status === 'draft' || post.status === 'scheduled' ? post.status : 'scheduled';
      setFormData({
        title: post.title,
        content: post.content,
        platform: post.platform,
        scheduled_at: post.scheduled_at.slice(0, 16),
        status: statusValue,
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
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                排程貼文管理
              </CardTitle>
              <CardDescription>請先設置 Upload Post API 密鑰和用戶名稱</CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()} size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              新增排程
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Calendar */}
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-sm">{format(viewMonth, 'yyyy年 MMMM', { locale: zhTW })}</h3>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setViewMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}>
                    ‹
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setViewMonth(new Date())}>
                    今天
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setViewMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}>
                    ›
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                  <div key={day} className="text-center text-xs text-muted-foreground py-1 font-medium">
                    {day}
                  </div>
                ))}
                
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
                        aspect-square p-0.5 rounded text-xs transition-colors relative
                        ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
                        ${isToday && !isSelected ? 'ring-1 ring-primary' : ''}
                      `}
                    >
                      <span className="block">{day.getDate()}</span>
                      {dayPosts.length > 0 && (
                        <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                          {dayPosts.slice(0, 2).map((_, i) => (
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
            <div>
              <h4 className="font-medium text-sm mb-3">
                {format(selectedDate, 'MM月 dd日', { locale: zhTW })} 的排程
              </h4>
              
              {loading ? (
                <div className="space-y-2">
                  {[1, 2].map(i => (
                    <div key={i} className="p-2 bg-muted rounded animate-pulse">
                      <div className="h-3 bg-muted-foreground/20 rounded w-3/4 mb-1"></div>
                      <div className="h-2 bg-muted-foreground/20 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : todaysPosts.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground bg-muted/30 rounded-lg">
                  <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">這天沒有排程</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {todaysPosts.map(post => (
                    <div key={post.id} className="p-2 bg-muted/50 rounded group">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          {getPlatformIcon(post.platform)}
                          <span className="font-medium text-xs line-clamp-1">{post.title}</span>
                        </div>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => handleOpenDialog(post)}>
                            <Pencil className="w-2.5 h-2.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => deletePost(post.id)}>
                            <Trash2 className="w-2.5 h-2.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {format(new Date(post.scheduled_at), 'HH:mm')}
                        </span>
                        <Badge className={`${statusColors[post.status]} text-[10px] px-1.5 py-0`} variant="secondary">
                          {statusLabels[post.status]}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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
    </>
  );
}
