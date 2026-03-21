import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { GeneratedImage } from '@/hooks/useGeneratedImages';
import type { VoiceGeneration } from '@/hooks/useVoiceGenerations';
import type { SubtitleConversion } from '@/hooks/useSubtitleConversions';

// ── Query keys (exported so generators can invalidate them) ──
export const GALLERY_IMAGES_KEY = ['gallery-images'];
export const GALLERY_VOICES_KEY = ['gallery-voices'];
export const GALLERY_SUBTITLES_KEY = ['gallery-subtitles'];
export const GALLERY_TEXT_KEY = ['gallery-text'];

export interface TextWork {
  id: string;
  type: 'ai_generation' | 'content_rewrite';
  title: string;
  content: string;
  tool_type: string;
  created_at: string;
}

// ── Fetchers ──
async function fetchImages(): Promise<GeneratedImage[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('generated_images')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as GeneratedImage[]) || [];
}

async function fetchVoices(): Promise<VoiceGeneration[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('voice_generations')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as VoiceGeneration[]) || [];
}

async function fetchSubtitles(): Promise<SubtitleConversion[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('subtitle_conversions')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as SubtitleConversion[]) || [];
}

async function fetchTextWorks(): Promise<TextWork[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const [aiRes, rewriteRes] = await Promise.all([
    supabase.from('ai_generations').select('*').order('created_at', { ascending: false }),
    supabase.from('content_rewrites').select('*').order('created_at', { ascending: false }),
  ]);

  const aiWorks: TextWork[] = (aiRes.data || []).map((d: any) => ({
    id: d.id,
    type: 'ai_generation' as const,
    title: d.prompt?.substring(0, 60) || 'AI 生成',
    content: d.result || '',
    tool_type: d.tool_type || 'general',
    created_at: d.created_at,
  }));

  const rewriteWorks: TextWork[] = (rewriteRes.data || []).map((d: any) => ({
    id: d.id,
    type: 'content_rewrite' as const,
    title: d.source_url?.substring(0, 60) || '內容重整',
    content: d.rewritten_content || d.original_content || '',
    tool_type: d.style || 'rewrite',
    created_at: d.created_at,
  }));

  return [...aiWorks, ...rewriteWorks].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

// ── Shared query options: cache for 30s, show stale data instantly ──
const QUERY_OPTS = { staleTime: 30_000, refetchOnWindowFocus: true } as const;

// ── Hooks ──
export function useGalleryImages() {
  return useQuery({ queryKey: GALLERY_IMAGES_KEY, queryFn: fetchImages, ...QUERY_OPTS });
}

export function useGalleryVoices() {
  return useQuery({ queryKey: GALLERY_VOICES_KEY, queryFn: fetchVoices, ...QUERY_OPTS });
}

export function useGallerySubtitles() {
  return useQuery({ queryKey: GALLERY_SUBTITLES_KEY, queryFn: fetchSubtitles, ...QUERY_OPTS });
}

export function useGalleryTextWorks() {
  return useQuery({ queryKey: GALLERY_TEXT_KEY, queryFn: fetchTextWorks, ...QUERY_OPTS });
}

/** Invalidate all gallery caches — call after any generation saves */
export function useInvalidateGallery() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: GALLERY_IMAGES_KEY });
    qc.invalidateQueries({ queryKey: GALLERY_VOICES_KEY });
    qc.invalidateQueries({ queryKey: GALLERY_SUBTITLES_KEY });
    qc.invalidateQueries({ queryKey: GALLERY_TEXT_KEY });
  };
}
