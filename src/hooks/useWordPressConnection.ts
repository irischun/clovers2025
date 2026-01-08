import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Only expose non-sensitive connection info to client
export interface WordPressConnectionInfo {
  id: string;
  site_url: string;
  username: string;
  is_connected: boolean;
  created_at: string;
  updated_at: string;
}

export function useWordPressConnection() {
  const [connection, setConnection] = useState<WordPressConnectionInfo | null>(null);
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

      // Only fetch non-sensitive fields - never fetch app_password
      const { data, error } = await supabase
        .from('wordpress_connections')
        .select('id, site_url, username, is_connected, created_at, updated_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setConnection(data as WordPressConnectionInfo | null);
    } catch (error) {
      console.error('Error fetching WordPress connection:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save credentials via edge function - credentials go directly to server
  const saveConnection = async (siteUrl: string, username: string, appPassword: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('wordpress-save', {
        body: { siteUrl, username, appPassword }
      });

      if (error) {
        console.error('Edge function error:', error);
        toast({ title: '保存失敗', variant: 'destructive' });
        throw error;
      }

      if (data?.success && data?.connection) {
        setConnection(data.connection as WordPressConnectionInfo);
        toast({ title: '設定已保存' });
      } else {
        toast({ title: '保存失敗', description: data?.error || '請稍後再試', variant: 'destructive' });
        throw new Error(data?.error || 'Save failed');
      }
    } catch (error) {
      console.error('Error saving WordPress connection:', error);
      throw error;
    }
  };

  // Test using stored credentials - credentials never leave server
  const testConnection = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('wordpress-test-stored', {
        body: {}
      });

      if (error) {
        console.error('Edge function error:', error);
        toast({ title: '連接失敗', description: '無法連接到 WordPress 網站', variant: 'destructive' });
        return false;
      }

      if (data?.success) {
        if (connection) {
          setConnection({ ...connection, is_connected: true });
        }
        toast({ title: '連接成功！', description: 'WordPress 連接測試通過' });
        return true;
      } else {
        if (connection) {
          setConnection({ ...connection, is_connected: false });
        }
        toast({ title: '連接失敗', description: data?.error || '請檢查您的認證資訊', variant: 'destructive' });
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
