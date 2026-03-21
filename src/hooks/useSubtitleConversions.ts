import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { DASHBOARD_STATS_KEY } from '@/hooks/useDashboardStats';

export interface SubtitleConversion {
  id: string;
  user_id: string;
  source_name: string;
  source_type: string;
  source_url: string | null;
  languages: string[];
  status: string;
  subtitle_urls: Record<string, string> | null;
  created_at: string;
  updated_at: string;
}

export function useSubtitleConversions() {
  const [subtitles, setSubtitles] = useState<SubtitleConversion[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fetchSubtitles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setSubtitles([]); setLoading(false); return; }

      const { data, error } = await supabase
        .from('subtitle_conversions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubtitles((data as unknown as SubtitleConversion[]) || []);
    } catch (error) {
      console.error('Error fetching subtitle conversions:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteSubtitle = async (id: string) => {
    try {
      const { error } = await supabase
        .from('subtitle_conversions')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setSubtitles(prev => prev.filter(s => s.id !== id));
      toast({ title: '字幕已刪除' });
    } catch {
      toast({ title: '刪除失敗', variant: 'destructive' });
    }
  };

  useEffect(() => { fetchSubtitles(); }, []);

  return { subtitles, loading, deleteSubtitle, refetch: fetchSubtitles };
}
