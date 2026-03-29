import { useImageGenerationContext, GenerationJob } from '@/contexts/ImageGenerationContext';
import { Loader2, CheckCircle2, XCircle, Image, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

const GenerationFloatingIndicator = () => {
  const { currentJob, clearCurrentJob, clearCompletedJob } = useImageGenerationContext();
  const location = useLocation();
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissed when a new job starts
  useEffect(() => {
    if (currentJob?.status === 'generating') {
      setDismissed(false);
    }
  }, [currentJob?.id, currentJob?.status]);

  // Don't show on the image generation page itself
  const isOnImageGenPage = location.pathname.includes('/image-generation');
  
  if (!currentJob || dismissed) return null;
  if (isOnImageGenPage && currentJob.status === 'generating') return null;

  const isGenerating = currentJob.status === 'generating';
  const isCompleted = currentJob.status === 'completed';
  const isFailed = currentJob.status === 'failed';

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
      <div className={`
        rounded-xl shadow-2xl border p-4 max-w-xs w-72
        backdrop-blur-md
        ${isGenerating ? 'bg-primary/10 border-primary/30' : ''}
        ${isCompleted ? 'bg-green-500/10 border-green-500/30' : ''}
        ${isFailed ? 'bg-destructive/10 border-destructive/30' : ''}
      `}>
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            {isGenerating && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
            {isCompleted && <CheckCircle2 className="w-5 h-5 text-green-500" />}
            {isFailed && <XCircle className="w-5 h-5 text-destructive" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {isGenerating && '圖片生成中...'}
              {isCompleted && `已生成 ${currentJob.images.length} 張圖片！`}
              {isFailed && '生成失敗'}
            </p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {currentJob.prompt.slice(0, 40)}{currentJob.prompt.length > 40 ? '...' : ''}
            </p>
            {isGenerating && (
              <p className="text-xs text-muted-foreground mt-1">
                您可以繼續瀏覽其他頁面
              </p>
            )}
            {isCompleted && !isOnImageGenPage && (
              <Link 
                to="/dashboard/image-generation"
                className="text-xs text-primary hover:underline mt-1 inline-block"
              >
                查看結果 →
              </Link>
            )}
          </div>
          <button 
            onClick={() => {
              if (!isGenerating) {
                clearCompletedJob(currentJob.id);
              }
              setDismissed(true);
            }}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {isGenerating && (
          <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        )}
        {isCompleted && currentJob.images.length > 0 && (
          <div className="mt-3 flex gap-1 overflow-hidden">
            {currentJob.images.slice(0, 3).map((img, i) => (
              <div key={i} className="w-12 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                <img src={img} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
            {currentJob.images.length > 3 && (
              <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground flex-shrink-0">
                +{currentJob.images.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerationFloatingIndicator;
