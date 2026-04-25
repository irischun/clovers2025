import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type CommunityMediaType = 'image' | 'video';

export interface CommunityItem {
  id: string;
  user_id: string;
  media_type: CommunityMediaType;
  source_id: string;
  media_url: string;
  title: string | null;
  prompt: string | null;
  thumbnail_url: string | null;
  created_at: string;
}

export const COMMUNITY_PUBLISHED_KEY = ['community-published'] as const;
export const MY_PUBLISHED_KEY = ['my-published'] as const;

/** Public list — anyone can read (RLS allows). */
export function useCommunityGallery(enabled: boolean = true) {
  return useQuery({
    queryKey: COMMUNITY_PUBLISHED_KEY,
    queryFn: async (): Promise<CommunityItem[]> => {
      const { data, error } = await supabase
        .from('community_published')
        .select('id, user_id, media_type, source_id, media_url, title, prompt, thumbnail_url, created_at')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data as CommunityItem[]) || [];
    },
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

/** Lightweight set of source_ids the current user has already published. */
export function useMyPublishedSourceIds(enabled: boolean = true) {
  return useQuery({
    queryKey: MY_PUBLISHED_KEY,
    queryFn: async (): Promise<Set<string>> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return new Set<string>();
      const { data, error } = await supabase
        .from('community_published')
        .select('source_id, media_type')
        .eq('user_id', user.id);
      if (error) throw error;
      return new Set((data || []).map((r: any) => `${r.media_type}:${r.source_id}`));
    },
    enabled,
    staleTime: 30_000,
  });
}

export function useCommunityActions() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const publish = async (input: {
    media_type: CommunityMediaType;
    source_id: string;
    media_url: string;
    title?: string | null;
    prompt?: string | null;
    thumbnail_url?: string | null;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: '請先登入', variant: 'destructive' });
      return false;
    }
    const { error } = await supabase.from('community_published').insert({
      user_id: user.id,
      media_type: input.media_type,
      source_id: input.source_id,
      media_url: input.media_url,
      title: input.title ?? null,
      prompt: input.prompt ?? null,
      thumbnail_url: input.thumbnail_url ?? null,
    });
    if (error) {
      // Unique-constraint violation = already published
      if ((error as any).code === '23505') {
        toast({ title: '此項目已發布到社群' });
        qc.invalidateQueries({ queryKey: MY_PUBLISHED_KEY });
        return true;
      }
      toast({ title: '發布失敗', description: error.message, variant: 'destructive' });
      return false;
    }
    qc.invalidateQueries({ queryKey: MY_PUBLISHED_KEY });
    qc.invalidateQueries({ queryKey: COMMUNITY_PUBLISHED_KEY });
    toast({ title: '已發布到社群畫廊' });
    return true;
  };

  const unpublish = async (input: { media_type: CommunityMediaType; source_id: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: '請先登入', variant: 'destructive' });
      return false;
    }
    const { error } = await supabase
      .from('community_published')
      .delete()
      .eq('user_id', user.id)
      .eq('media_type', input.media_type)
      .eq('source_id', input.source_id);
    if (error) {
      toast({ title: '取消發布失敗', description: error.message, variant: 'destructive' });
      return false;
    }
    qc.invalidateQueries({ queryKey: MY_PUBLISHED_KEY });
    qc.invalidateQueries({ queryKey: COMMUNITY_PUBLISHED_KEY });
    toast({ title: '已從社群畫廊移除' });
    return true;
  };

  return { publish, unpublish };
}
