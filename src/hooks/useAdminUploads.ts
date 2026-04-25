import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const ADMIN_EMAIL = 'irischun2018@gmail.com';

export type AdminUploadCategory = 'manga' | 'cover' | 'product';
export type AdminUploadMediaType = 'image' | 'video';

export interface AdminUpload {
  id: string;
  uploaded_by: string;
  category: AdminUploadCategory;
  media_type: AdminUploadMediaType;
  media_url: string;
  storage_path: string | null;
  title: string | null;
  created_at: string;
}

export const ADMIN_UPLOADS_KEY = ['admin-uploads'];

export function useAdminUploads() {
  return useQuery({
    queryKey: ADMIN_UPLOADS_KEY,
    queryFn: async (): Promise<AdminUpload[]> => {
      const { data, error } = await supabase
        .from('admin_uploads' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AdminUpload[];
    },
    staleTime: 60_000,
  });
}

export function useDeleteAdminUpload() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (item: AdminUpload) => {
      if (item.storage_path) {
        await supabase.storage.from('admin-uploads').remove([item.storage_path]);
      }
      const { error } = await supabase
        .from('admin_uploads' as any)
        .delete()
        .eq('id', item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_UPLOADS_KEY });
      toast({ title: 'Deleted' });
    },
    onError: (e: any) => {
      toast({ title: 'Delete failed', description: e?.message, variant: 'destructive' });
    },
  });
}

export function useUploadAdminMedia() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (params: {
      file: File;
      category: AdminUploadCategory;
      title?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      if (user.email !== ADMIN_EMAIL) throw new Error('Only the administrator can upload');

      const isVideo = params.file.type.startsWith('video/');
      const mediaType: AdminUploadMediaType = isVideo ? 'video' : 'image';
      const ext = params.file.name.split('.').pop() || (isVideo ? 'mp4' : 'png');
      const path = `${params.category}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('admin-uploads')
        .upload(path, params.file, { contentType: params.file.type, upsert: false });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from('admin-uploads').getPublicUrl(path);

      const { error: insErr } = await supabase.from('admin_uploads' as any).insert({
        uploaded_by: user.id,
        category: params.category,
        media_type: mediaType,
        media_url: pub.publicUrl,
        storage_path: path,
        title: params.title || params.file.name,
      });
      if (insErr) throw insErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_UPLOADS_KEY });
      toast({ title: 'Uploaded successfully' });
    },
    onError: (e: any) => {
      toast({ title: 'Upload failed', description: e?.message, variant: 'destructive' });
    },
  });
}
