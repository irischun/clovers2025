import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { GeneratedImage } from '@/hooks/useGeneratedImages';
import type { VoiceGeneration } from '@/hooks/useVoiceGenerations';
import type { SubtitleConversion } from '@/hooks/useSubtitleConversions';

const QUERY_TIMEOUT_MS = 30_000;

function withTimeout<T>(operation: () => Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    operation()
      .then((value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timeoutId);
        reject(error);
      });
  });
}

// ── Query keys (exported so generators can invalidate them) ──
export const GALLERY_IMAGES_KEY = ['gallery-images'] as const;
export const GALLERY_IMAGES_COUNT_KEY = ['gallery-images-count'];
export const GALLERY_VOICES_KEY = ['gallery-voices'];
export const GALLERY_SUBTITLES_KEY = ['gallery-subtitles'];
export const GALLERY_TEXT_KEY = ['gallery-text'];

const IMAGES_PAGE_SIZE = 12;

export interface TextWork {
  id: string;
  type: 'ai_generation' | 'content_rewrite';
  title: string;
  content: string;
  tool_type: string;
  created_at: string;
}

// ── Fetchers (no longer check auth — that's handled by `enabled`) ──

async function fetchImageCount(): Promise<number> {
  const { count, error } = await withTimeout(
    async () => await supabase
      .from('generated_images')
      .select('id', { count: 'exact', head: true }),
    QUERY_TIMEOUT_MS,
    '資料庫連線逾時，正在重試中…'
  );
  if (error) throw error;
  return count ?? 0;
}

async function fetchImages(page: number): Promise<GeneratedImage[]> {
  const from = page * IMAGES_PAGE_SIZE;
  const to = from + IMAGES_PAGE_SIZE - 1;
  const { data, error } = await withTimeout(
    async () => await supabase
      .from('generated_images')
      .select('id, image_url, title, prompt, created_at, is_favorite, aspect_ratio, model, style, user_id')
      .order('created_at', { ascending: false })
      .range(from, to),
    QUERY_TIMEOUT_MS,
    '資料庫連線逾時，正在重試中…'
  );
  if (error) throw error;
  return (data as GeneratedImage[]) || [];
}

async function fetchVoices(): Promise<VoiceGeneration[]> {
  const { data, error } = await withTimeout(
    async () => await supabase
      .from('voice_generations')
      .select('id, audio_url, text_content, created_at, is_favorite, voice_name, model, format, language, user_id')
      .order('created_at', { ascending: false }),
    QUERY_TIMEOUT_MS,
    '資料庫連線逾時，正在重試中…'
  );
  if (error) throw error;
  return (data as VoiceGeneration[]) || [];
}

async function fetchSubtitles(): Promise<SubtitleConversion[]> {
  const { data, error } = await withTimeout(
    async () => await supabase
      .from('subtitle_conversions')
      .select('id, user_id, source_name, source_type, source_url, languages, status, subtitle_urls, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(50),
    QUERY_TIMEOUT_MS,
    '資料庫連線逾時，正在重試中…'
  );
  if (error) throw error;
  return (data as unknown as SubtitleConversion[]) || [];
}

async function fetchTextWorks(): Promise<TextWork[]> {
  const [aiRes, rewriteRes] = await Promise.all([
    withTimeout(
      async () => await supabase.from('ai_generations').select('id, prompt, result, tool_type, created_at').order('created_at', { ascending: false }),
      QUERY_TIMEOUT_MS,
      '文字作品載入逾時，請稍後重試'
    ),
    withTimeout(
      async () => await supabase.from('content_rewrites').select('id, source_url, rewritten_content, original_content, style, created_at').order('created_at', { ascending: false }),
      QUERY_TIMEOUT_MS,
      '內容重整載入逾時，請稍後重試'
    ),
  ]);

  if (aiRes.error) throw aiRes.error;
  if (rewriteRes.error) throw rewriteRes.error;

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

// ── Shared query options ──
const QUERY_OPTS = {
  staleTime: 30_000,
  refetchOnWindowFocus: true,
  retry: 3,
  retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 8000),
} as const;

// ── Hooks — all accept `enabled` to gate on auth readiness ──
export function useGalleryImages(page: number = 0, enabled: boolean = true) {
  return useQuery({
    queryKey: [...GALLERY_IMAGES_KEY, page],
    queryFn: () => fetchImages(page),
    enabled,
    ...QUERY_OPTS,
  });
}

export function useGalleryImageCount(enabled: boolean = true) {
  return useQuery({
    queryKey: GALLERY_IMAGES_COUNT_KEY,
    queryFn: fetchImageCount,
    enabled,
    ...QUERY_OPTS,
  });
}

export function useGalleryVoices(enabled: boolean = true) {
  return useQuery({
    queryKey: GALLERY_VOICES_KEY,
    queryFn: fetchVoices,
    enabled,
    ...QUERY_OPTS,
  });
}

export function useGallerySubtitles(enabled: boolean = true) {
  return useQuery({
    queryKey: GALLERY_SUBTITLES_KEY,
    queryFn: fetchSubtitles,
    enabled,
    ...QUERY_OPTS,
  });
}

export function useGalleryTextWorks(enabled: boolean = true) {
  return useQuery({
    queryKey: GALLERY_TEXT_KEY,
    queryFn: fetchTextWorks,
    enabled,
    ...QUERY_OPTS,
  });
}

/** Invalidate all gallery caches — call after any generation saves */
export function useInvalidateGallery() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: GALLERY_IMAGES_KEY });
    qc.invalidateQueries({ queryKey: GALLERY_IMAGES_COUNT_KEY });
    qc.invalidateQueries({ queryKey: GALLERY_VOICES_KEY });
    qc.invalidateQueries({ queryKey: GALLERY_SUBTITLES_KEY });
    qc.invalidateQueries({ queryKey: GALLERY_TEXT_KEY });
  };
}
