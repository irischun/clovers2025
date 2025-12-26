import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PublishingRecord {
  id: string;
  user_id: string;
  title: string;
  content: string;
  platform: string;
  status: string;
  published_url: string | null;
  image_url: string | null;
  created_at: string;
}

export function usePublishingHistory() {
  const [records, setRecords] = useState<PublishingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('publishing_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecords((data || []) as PublishingRecord[]);
    } catch (error) {
      console.error('Error fetching publishing history:', error);
    } finally {
      setLoading(false);
    }
  };

  const addRecord = async (record: Omit<PublishingRecord, 'id' | 'user_id' | 'created_at'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('publishing_history')
        .insert({ ...record, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      setRecords(prev => [data as PublishingRecord, ...prev]);
      return data as PublishingRecord;
    } catch (error) {
      console.error('Error adding publishing record:', error);
      throw error;
    }
  };

  const deleteRecord = async (id: string) => {
    try {
      const { error } = await supabase
        .from('publishing_history')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setRecords(prev => prev.filter(r => r.id !== id));
      toast({ title: '記錄已刪除' });
    } catch (error) {
      console.error('Error deleting publishing record:', error);
      toast({ title: '刪除失敗', variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  return {
    records,
    loading,
    addRecord,
    deleteRecord,
    refetch: fetchRecords,
  };
}
