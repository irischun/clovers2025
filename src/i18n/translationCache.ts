import { Language } from './LanguageContext';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'clovers-translation-cache';
const CACHE_VERSION = 1;
const MAX_CACHE_ENTRIES = 2000;
const BATCH_DELAY_MS = 150; // Collect texts for 150ms before sending batch
const MAX_BATCH_SIZE = 30;

interface CacheStore {
  version: number;
  entries: Record<string, string>; // "lang::text" -> translated
}

/**
 * Persistent translation cache with localStorage + in-memory layers
 * and intelligent batch queuing for efficient API calls.
 */
class TranslationCacheManager {
  private memoryCache = new Map<string, string>();
  private batchQueue: Map<string, { text: string; sourceLang: Language; targetLang: Language; resolvers: ((v: string) => void)[] }> = new Map();
  private batchTimer: ReturnType<typeof setTimeout> | null = null;
  private initialized = false;

  constructor() {
    this.loadFromStorage();
  }

  private getCacheKey(text: string, targetLang: Language): string {
    return `${targetLang}::${text}`;
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const store: CacheStore = JSON.parse(raw);
        if (store.version === CACHE_VERSION && store.entries) {
          for (const [key, value] of Object.entries(store.entries)) {
            this.memoryCache.set(key, value);
          }
        }
      }
    } catch {
      // Silently ignore corrupt cache
    }
    this.initialized = true;
  }

  private saveToStorage(): void {
    try {
      // Evict oldest entries if over limit
      const entries: Record<string, string> = {};
      const allEntries = Array.from(this.memoryCache.entries());
      const start = Math.max(0, allEntries.length - MAX_CACHE_ENTRIES);
      for (let i = start; i < allEntries.length; i++) {
        entries[allEntries[i][0]] = allEntries[i][1];
      }
      const store: CacheStore = { version: CACHE_VERSION, entries };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      // Storage full — silently continue with memory-only cache
    }
  }

  /** Get a cached translation (memory + localStorage) */
  get(text: string, targetLang: Language): string | null {
    if (!this.initialized) this.loadFromStorage();
    return this.memoryCache.get(this.getCacheKey(text, targetLang)) || null;
  }

  /** Store a translation in both caches */
  set(text: string, targetLang: Language, translated: string): void {
    this.memoryCache.set(this.getCacheKey(text, targetLang), translated);
    this.saveToStorage();
  }

  /**
   * Queue a text for batch translation. Returns a promise that resolves
   * with the translated text. Multiple calls within BATCH_DELAY_MS are
   * batched into a single API call.
   */
  queueTranslation(text: string, sourceLang: Language, targetLang: Language): Promise<string> {
    const cacheKey = this.getCacheKey(text, targetLang);
    
    // Check cache first
    const cached = this.memoryCache.get(cacheKey);
    if (cached) return Promise.resolve(cached);

    return new Promise<string>((resolve) => {
      const existing = this.batchQueue.get(cacheKey);
      if (existing) {
        existing.resolvers.push(resolve);
        return;
      }

      this.batchQueue.set(cacheKey, { text, sourceLang, targetLang, resolvers: [resolve] });

      // Start or reset batch timer
      if (this.batchTimer) clearTimeout(this.batchTimer);
      
      if (this.batchQueue.size >= MAX_BATCH_SIZE) {
        this.flushBatch();
      } else {
        this.batchTimer = setTimeout(() => this.flushBatch(), BATCH_DELAY_MS);
      }
    });
  }

  private async flushBatch(): Promise<void> {
    if (this.batchQueue.size === 0) return;
    this.batchTimer = null;

    // Grab current batch and clear queue
    const batch = new Map(this.batchQueue);
    this.batchQueue.clear();

    // Group by sourceLang -> targetLang
    const groups = new Map<string, { texts: { key: string; text: string }[]; entries: typeof batch }>();
    
    for (const [cacheKey, entry] of batch) {
      const groupKey = `${entry.sourceLang}->${entry.targetLang}`;
      if (!groups.has(groupKey)) {
        groups.set(groupKey, { texts: [], entries: new Map() });
      }
      const group = groups.get(groupKey)!;
      group.texts.push({ key: cacheKey, text: entry.text });
      group.entries.set(cacheKey, entry);
    }

    for (const [groupKey, group] of groups) {
      const [sourceLang, targetLang] = groupKey.split('->') as [Language, Language];
      
      try {
        const { data, error } = await supabase.functions.invoke('auto-translate', {
          body: { texts: group.texts, sourceLang, targetLangs: [targetLang] },
        });

        if (error) throw error;

        const translations = data?.translations?.[targetLang] || {};

        for (const [cacheKey, entry] of group.entries) {
          const translated = translations[cacheKey] || entry.text;
          this.set(entry.text, targetLang, translated);
          entry.resolvers.forEach((r) => r(translated));
        }
      } catch (err) {
        console.error('Batch translation failed:', err);
        // Resolve with original text on failure
        for (const [, entry] of group.entries) {
          entry.resolvers.forEach((r) => r(entry.text));
        }
      }
    }
  }

  /** Clear all caches */
  clear(): void {
    this.memoryCache.clear();
    localStorage.removeItem(STORAGE_KEY);
  }
}

export const translationCacheManager = new TranslationCacheManager();
