import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardStats {
  prompts: number;
  scheduledPosts: number;
  mediaFiles: number;
}

export const DASHBOARD_STATS_KEY = ['dashboard-stats'];

async function fetchDashboardStats(): Promise<DashboardStats> {
  const [
    promptsRes, aiRes, rewritesRes,
    postsRes, publishRes,
    mediaRes, imagesRes, voiceRes, subtitleRes,
  ] = await Promise.all([
    supabase.from('prompts').select('id', { count: 'exact', head: true }),
    supabase.from('ai_generations').select('id', { count: 'exact', head: true }),
    supabase.from('content_rewrites').select('id', { count: 'exact', head: true }),
    supabase.from('scheduled_posts').select('id', { count: 'exact', head: true }),
    supabase.from('publishing_history').select('id', { count: 'exact', head: true }),
    supabase.from('media_files').select('id', { count: 'exact', head: true }),
    supabase.from('generated_images').select('id', { count: 'exact', head: true }),
    supabase.from('voice_generations').select('id', { count: 'exact', head: true }),
    supabase.from('subtitle_conversions').select('id', { count: 'exact', head: true }),
  ]);

  return {
    prompts: (promptsRes.count || 0) + (aiRes.count || 0) + (rewritesRes.count || 0),
    scheduledPosts: (postsRes.count || 0) + (publishRes.count || 0),
    mediaFiles: (mediaRes.count || 0) + (imagesRes.count || 0) + (voiceRes.count || 0) + (subtitleRes.count || 0),
  };
}

export function useDashboardStats() {
  return useQuery({
    queryKey: DASHBOARD_STATS_KEY,
    queryFn: fetchDashboardStats,
    staleTime: 10_000, // 10s
    refetchOnWindowFocus: true,
  });
}
