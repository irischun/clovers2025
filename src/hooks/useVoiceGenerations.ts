import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { DASHBOARD_STATS_KEY } from '@/hooks/useDashboardStats';

export interface VoiceGeneration {
  id: string;
  user_id: string;
  text_content: string;
  voice_name: string;
  model: string;
  language: string;
  voice_id: string;
  audio_url: string | null;
  speed: number | null;
  volume: number | null;
  pitch: number | null;
  sample_rate: number | null;
  bitrate: number | null;
  emotion: string | null;
  format: string | null;
  is_favorite: boolean;
  created_at: string;
}

export function useVoiceGenerations() {
  const [voices, setVoices] = useState<VoiceGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fetchVoices = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setVoices([]); setLoading(false); return; }

      const { data, error } = await supabase
        .from('voice_generations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVoices((data as VoiceGeneration[]) || []);
    } catch (error) {
      console.error('Error fetching voice generations:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (id: string, isFavorite: boolean) => {
    try {
      const { error } = await supabase
        .from('voice_generations')
        .update({ is_favorite: !isFavorite })
        .eq('id', id);
      if (error) throw error;
      setVoices(prev => prev.map(v => v.id === id ? { ...v, is_favorite: !isFavorite } : v));
      toast({ title: !isFavorite ? '已添加到收藏' : '已取消收藏' });
    } catch {
      toast({ title: '操作失敗', variant: 'destructive' });
    }
  };

  const deleteVoice = async (id: string) => {
    try {
      const { error } = await supabase
        .from('voice_generations')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setVoices(prev => prev.filter(v => v.id !== id));
      toast({ title: '音頻已刪除' });
    } catch {
      toast({ title: '刪除失敗', variant: 'destructive' });
    }
  };

  useEffect(() => { fetchVoices(); }, []);

  return { voices, loading, toggleFavorite, deleteVoice, refetch: fetchVoices };
}
