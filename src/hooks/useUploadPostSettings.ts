import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UploadPostSettings {
  id: string;
  user_id: string;
  api_key: string;
  managed_user: string;
  facebook_page_ids: string[];
  created_at: string;
  updated_at: string;
}

export function useUploadPostSettings() {
  const [settings, setSettings] = useState<UploadPostSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('upload_post_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setSettings(data as UploadPostSettings | null);
    } catch (error) {
      console.error('Error fetching upload post settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (
    apiKey: string,
    managedUser: string,
    facebookPageIds: string[]
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const settingsData = {
        user_id: user.id,
        api_key: apiKey,
        managed_user: managedUser,
        facebook_page_ids: facebookPageIds,
      };

      if (settings) {
        const { data, error } = await supabase
          .from('upload_post_settings')
          .update(settingsData)
          .eq('id', settings.id)
          .select()
          .single();

        if (error) throw error;
        setSettings(data as UploadPostSettings);
      } else {
        const { data, error } = await supabase
          .from('upload_post_settings')
          .insert(settingsData)
          .select()
          .single();

        if (error) throw error;
        setSettings(data as UploadPostSettings);
      }

      toast({ title: '設定已保存' });
      return true;
    } catch (error) {
      console.error('Error saving upload post settings:', error);
      toast({ title: '保存失敗', variant: 'destructive' });
      return false;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    saveSettings,
    refetch: fetchSettings,
  };
}
