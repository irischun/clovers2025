import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { GeneratedImage } from '@/hooks/useGeneratedImages';
import type { VoiceGeneration } from '@/hooks/useVoiceGenerations';
import type { SubtitleConversion } from '@/hooks/useSubtitleConversions';

const QUERY_TIMEOUT_MS = 15_000;

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

// ── Fetchers ──
async function fetchImageCount(): Promise<number> {
  const { data: { user } } = await withTimeout(
    async () => supabase.auth.getUser(),
    QUERY_TIMEOUT_MS,
    '使用者驗證逾時，請稍後重試'
  );
  if (!user) return 0;
  const { count, error } = await withTimeout(
    async () => await supabase
      .from('generated_images')
      .select('*', { count: 'exact', head: true }),
    QUERY_TIMEOUT_MS,
    '圖片計數逾時，請稍後重試'
  );
  if (error) throw error;
  return count ?? 0;
}

async function fetchImages(page: number): Promise<GeneratedImage[]> {
  const { data: { user } } = await withTimeout(
    async () => supabase.auth.getUser(),
    QUERY_TIMEOUT_MS,
    '使用者驗證逾時，請稍後重試'
  );
  if (!user) return [];
  const from = page * IMAGES_PAGE_SIZE;
  const to = from + IMAGES_PAGE_SIZE - 1;
  const { data, error } = await withTimeout(
    async () => await supabase
      .from('generated_images')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to),
    QUERY_TIMEOUT_MS,
    '圖片畫廊載入逾時，請稍後重試'
  );
  if (error) throw error;
  return (data as GeneratedImage[]) || [];
}

async function fetchVoices(): Promise<VoiceGeneration[]> {
  const { data: { user } } = await withTimeout(
    async () => supabase.auth.getUser(),
    QUERY_TIMEOUT_MS,
    '使用者驗證逾時，請稍後重試'
  );
  if (!user) return [];
  const { data, error } = await withTimeout(
    async () => await supabase
      .from('voice_generations')
      .select('*')
      .order('created_at', { ascending: false }),
    QUERY_TIMEOUT_MS,
    '音頻畫廊載入逾時，請稍後重試'
  );
  if (error) throw error;
  return (data as VoiceGeneration[]) || [];
}

async function fetchSubtitles(): Promise<SubtitleConversion[]> {
  const { data: { user } } = await withTimeout(
    async () => supabase.auth.getUser(),
    QUERY_TIMEOUT_MS,
    '使用者驗證逾時，請稍後重試'
  );
  if (!user) return [];
  const { data, error } = await withTimeout(
    async () => await supabase
      .from('subtitle_conversions')
      .select('*')
      .order('created_at', { ascending: false }),
    QUERY_TIMEOUT_MS,
    '字幕畫廊載入逾時，請稍後重試'
  );
  if (error) throw error;
  return (data as unknown as SubtitleConversion[]) || [];
}

async function fetchTextWorks(): Promise<TextWork[]> {
  const { data: { user } } = await withTimeout(
    async () => supabase.auth.getUser(),
    QUERY_TIMEOUT_MS,
    '使用者驗證逾時，請稍後重試'
  );
  if (!user) return [];

  const [aiRes, rewriteRes] = await Promise.all([
    withTimeout(
      async () => await supabase.from('ai_generations').select('*').order('created_at', { ascending: false }),
      QUERY_TIMEOUT_MS,
      '文字作品載入逾時，請稍後重試'
    ),
    withTimeout(
      async () => await supabase.from('content_rewrites').select('*').order('created_at', { ascending: false }),
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

// ── Shared query options: cache for 30s, show stale data instantly ──
const QUERY_OPTS = {
  staleTime: 30_000,
  refetchOnWindowFocus: true,
  retry: 1,
  retryDelay: 1000,
} as const;

// ── Hooks ──
export function useGalleryImages(page: number = 0) {
  return useQuery({ queryKey: [...GALLERY_IMAGES_KEY, page], queryFn: () => fetchImages(page), ...QUERY_OPTS });
}

export function useGalleryImageCount() {
  return useQuery({ queryKey: GALLERY_IMAGES_COUNT_KEY, queryFn: fetchImageCount, ...QUERY_OPTS });
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
    qc.invalidateQueries({ queryKey: GALLERY_IMAGES_COUNT_KEY });
    qc.invalidateQueries({ queryKey: GALLERY_VOICES_KEY });
    qc.invalidateQueries({ queryKey: GALLERY_SUBTITLES_KEY });
    qc.invalidateQueries({ queryKey: GALLERY_TEXT_KEY });
  };
}
