import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export interface GenerationJob {
  id: string;
  status: 'generating' | 'completed' | 'failed';
  prompt: string;
  title: string;
  images: string[];
  error?: string;
  startedAt: number;
  completedAt?: number;
  // Config snapshot
  config: {
    model: string;
    modelId: string;
    quantity: number;
    totalPoints: number;
    pointsPerImage: number;
    aspectRatio: { id: string; width: number; height: number };
    style: string;
    preserveFace: boolean;
    generationMode: 'image-to-image' | 'text-to-image';
    avatarGeneration: boolean;
    referenceImage: string | null;
    selectedStyleTags: string[];
    selectedPosterStyle: string;
  };
}

interface ImageGenerationContextValue {
  currentJob: GenerationJob | null;
  completedJobs: GenerationJob[];
  startJob: (job: Omit<GenerationJob, 'id' | 'status' | 'images' | 'startedAt'> & { 
    generateFn: () => Promise<{ images: string[]; error?: string }>;
    onComplete?: (images: string[]) => Promise<void>;
    onFailed?: () => void;
  }) => void;
  clearCurrentJob: () => void;
  clearCompletedJob: (id: string) => void;
}

const ImageGenerationContext = createContext<ImageGenerationContextValue | null>(null);

export const useImageGenerationContext = () => {
  const ctx = useContext(ImageGenerationContext);
  if (!ctx) throw new Error('useImageGenerationContext must be used within ImageGenerationProvider');
  return ctx;
};

export const ImageGenerationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentJob, setCurrentJob] = useState<GenerationJob | null>(null);
  const [completedJobs, setCompletedJobs] = useState<GenerationJob[]>([]);
  const jobRef = useRef<GenerationJob | null>(null);

  const startJob = useCallback(({ generateFn, onComplete, onFailed, ...jobData }: Omit<GenerationJob, 'id' | 'status' | 'images' | 'startedAt'> & {
    generateFn: () => Promise<{ images: string[]; error?: string }>;
    onComplete?: (images: string[]) => Promise<void>;
    onFailed?: () => void;
  }) => {
    const job: GenerationJob = {
      ...jobData,
      id: crypto.randomUUID(),
      status: 'generating',
      images: [],
      startedAt: Date.now(),
    };
    
    setCurrentJob(job);
    jobRef.current = job;

    // Run generation in background
    generateFn().then(async (result) => {
      const completed: GenerationJob = {
        ...job,
        status: result.error ? 'failed' : 'completed',
        images: result.images,
        error: result.error,
        completedAt: Date.now(),
      };
      
      jobRef.current = null;
      setCurrentJob(completed);
      setCompletedJobs(prev => [completed, ...prev.slice(0, 9)]);

      if (!result.error && result.images.length > 0 && onComplete) {
        try {
          await onComplete(result.images);
        } catch (e) {
          console.warn('Post-generation callback failed:', e);
        }
      } else if (result.error || result.images.length === 0) {
        onFailed?.();
      }
    }).catch((err) => {
      const failed: GenerationJob = {
        ...job,
        status: 'failed',
        error: err instanceof Error ? err.message : '生成失敗',
        completedAt: Date.now(),
      };
      jobRef.current = null;
      setCurrentJob(failed);
      setCompletedJobs(prev => [failed, ...prev.slice(0, 9)]);
      onFailed?.();
    });
  }, []);

  const clearCurrentJob = useCallback(() => {
    if (currentJob?.status !== 'generating') {
      setCurrentJob(null);
    }
  }, [currentJob]);

  const clearCompletedJob = useCallback((id: string) => {
    setCompletedJobs(prev => prev.filter(j => j.id !== id));
    if (currentJob?.id === id) setCurrentJob(null);
  }, [currentJob]);

  return (
    <ImageGenerationContext.Provider value={{ currentJob, completedJobs, startJob, clearCurrentJob, clearCompletedJob }}>
      {children}
    </ImageGenerationContext.Provider>
  );
};
