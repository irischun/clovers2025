import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Prompt {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export function usePrompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPrompts = async () => {
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPrompts(data || []);
    } catch (error) {
      console.error('Error fetching prompts:', error);
      toast({ title: '無法載入提示詞', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const createPrompt = async (prompt: Omit<Prompt, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('prompts')
        .insert({ ...prompt, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      setPrompts(prev => [data, ...prev]);
      toast({ title: '提示詞已創建' });
      return data;
    } catch (error) {
      console.error('Error creating prompt:', error);
      toast({ title: '創建失敗', variant: 'destructive' });
      throw error;
    }
  };

  const updatePrompt = async (id: string, updates: Partial<Prompt>) => {
    try {
      const { data, error } = await supabase
        .from('prompts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setPrompts(prev => prev.map(p => p.id === id ? data : p));
      toast({ title: '提示詞已更新' });
      return data;
    } catch (error) {
      console.error('Error updating prompt:', error);
      toast({ title: '更新失敗', variant: 'destructive' });
      throw error;
    }
  };

  const deletePrompt = async (id: string) => {
    try {
      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setPrompts(prev => prev.filter(p => p.id !== id));
      toast({ title: '提示詞已刪除' });
    } catch (error) {
      console.error('Error deleting prompt:', error);
      toast({ title: '刪除失敗', variant: 'destructive' });
      throw error;
    }
  };

  const toggleFavorite = async (id: string) => {
    const prompt = prompts.find(p => p.id === id);
    if (prompt) {
      await updatePrompt(id, { is_favorite: !prompt.is_favorite });
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  return {
    prompts,
    loading,
    createPrompt,
    updatePrompt,
    deletePrompt,
    toggleFavorite,
    refetch: fetchPrompts,
  };
}
