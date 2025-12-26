import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface WordPressConnection {
  id: string;
  user_id: string;
  site_url: string;
  username: string;
  app_password: string;
  is_connected: boolean;
  created_at: string;
  updated_at: string;
}

export function useWordPressConnection() {
  const [connection, setConnection] = useState<WordPressConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  const fetchConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('wordpress_connections')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setConnection(data as WordPressConnection | null);
    } catch (error) {
      console.error('Error fetching WordPress connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConnection = async (siteUrl: string, username: string, appPassword: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const connectionData = {
        user_id: user.id,
        site_url: siteUrl,
        username,
        app_password: appPassword,
        is_connected: false,
      };

      if (connection) {
        const { data, error } = await supabase
          .from('wordpress_connections')
          .update(connectionData)
          .eq('id', connection.id)
          .select()
          .single();

        if (error) throw error;
        setConnection(data as WordPressConnection);
      } else {
        const { data, error } = await supabase
          .from('wordpress_connections')
          .insert(connectionData)
          .select()
          .single();

        if (error) throw error;
        setConnection(data as WordPressConnection);
      }

      toast({ title: '設定已保存' });
    } catch (error) {
      console.error('Error saving WordPress connection:', error);
      toast({ title: '保存失敗', variant: 'destructive' });
      throw error;
    }
  };

  const testConnection = async (siteUrl: string, username: string, appPassword: string) => {
    setTesting(true);
    try {
      // Test WordPress REST API connection
      const apiUrl = `${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/posts?per_page=1`;
      const credentials = btoa(`${username}:${appPassword}`);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`,
        },
      });

      if (response.ok) {
        // Update connection status
        if (connection) {
          await supabase
            .from('wordpress_connections')
            .update({ is_connected: true })
            .eq('id', connection.id);
          
          setConnection({ ...connection, is_connected: true });
        }
        toast({ title: '連接成功！', description: 'WordPress 連接測試通過' });
        return true;
      } else {
        toast({ title: '連接失敗', description: '請檢查您的認證資訊', variant: 'destructive' });
        return false;
      }
    } catch (error) {
      console.error('Error testing WordPress connection:', error);
      toast({ title: '連接失敗', description: '無法連接到 WordPress 網站', variant: 'destructive' });
      return false;
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    fetchConnection();
  }, []);

  return {
    connection,
    loading,
    testing,
    saveConnection,
    testConnection,
    refetch: fetchConnection,
  };
}
