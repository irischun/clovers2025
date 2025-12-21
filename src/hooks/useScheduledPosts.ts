import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type PostStatus = 'scheduled' | 'published' | 'draft' | 'failed';

export interface ScheduledPost {
  id: string;
  user_id: string;
  title: string;
  content: string;
  platform: string;
  scheduled_at: string;
  status: PostStatus;
  media_urls: string[];
  created_at: string;
  updated_at: string;
}

export function useScheduledPosts() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('scheduled_posts')
        .select('*')
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      setPosts((data || []).map(post => ({ ...post, status: post.status as PostStatus })));
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({ title: '無法載入排程', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const createPost = async (post: Omit<ScheduledPost, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('scheduled_posts')
        .insert({ ...post, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      const typedData = { ...data, status: data.status as PostStatus };
      setPosts(prev => [...prev, typedData].sort((a, b) => 
        new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
      ));
      toast({ title: '排程已創建' });
      return typedData;
    } catch (error) {
      console.error('Error creating post:', error);
      toast({ title: '創建失敗', variant: 'destructive' });
      throw error;
    }
  };

  const updatePost = async (id: string, updates: Partial<ScheduledPost>) => {
    try {
      const { data, error } = await supabase
        .from('scheduled_posts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      const typedData = { ...data, status: data.status as PostStatus };
      setPosts(prev => prev.map(p => p.id === id ? typedData : p));
      toast({ title: '排程已更新' });
      return typedData;
    } catch (error) {
      console.error('Error updating post:', error);
      toast({ title: '更新失敗', variant: 'destructive' });
      throw error;
    }
  };

  const deletePost = async (id: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setPosts(prev => prev.filter(p => p.id !== id));
      toast({ title: '排程已刪除' });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({ title: '刪除失敗', variant: 'destructive' });
      throw error;
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return {
    posts,
    loading,
    createPost,
    updatePost,
    deletePost,
    refetch: fetchPosts,
  };
}
