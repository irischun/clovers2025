import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MediaFile {
  id: string;
  user_id: string;
  name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

export function useMediaFiles() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('media_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast({ title: '無法載入媒體', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data, error: insertError } = await supabase
        .from('media_files')
        .insert({
          user_id: user.id,
          name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setFiles(prev => [data, ...prev]);
      toast({ title: '檔案已上傳' });
      return data;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({ title: '上傳失敗', variant: 'destructive' });
      throw error;
    }
  };

  const deleteFile = async (id: string, filePath: string) => {
    try {
      const { error: storageError } = await supabase.storage
        .from('media')
        .remove([filePath]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('media_files')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;

      setFiles(prev => prev.filter(f => f.id !== id));
      toast({ title: '檔案已刪除' });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({ title: '刪除失敗', variant: 'destructive' });
      throw error;
    }
  };

  const getSignedUrl = async (filePath: string): Promise<string> => {
    const { data, error } = await supabase.storage.from('media').createSignedUrl(filePath, 3600);
    if (error || !data?.signedUrl) {
      console.error('Error creating signed URL:', error);
      return '';
    }
    return data.signedUrl;
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return {
    files,
    loading,
    uploadFile,
    deleteFile,
    getSignedUrl,
    refetch: fetchFiles,
  };
}
