import { Play } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface Feature {
  id: number;
  title: string;
  videoId?: string;
  imageUrl?: string;
}

const features: Feature[] = [
  { id: 1, title: '快速俾AI知道你product，免費幫你引流 - GEO', videoId: '7GaLcKz7Yc8' },
  { id: 2, title: '30分鐘做好一個星期social media post', videoId: 'YwxE7JSh15Y' },
  { id: 3, title: '低成本快速做到價值$8000商業級視頻', videoId: 'aNwTFt-uCJo' },
  { id: 4, title: '簡易打造專業個人品牌IP，提升形象', videoId: 'Ty9k8gaIVWE' },
  { id: 5, title: '大量原創提示詞，及你的個人提示詞庫', videoId: 'YwxE7JSh15Y' },
  { id: 6, title: '99%嘅人都唔知可以咁樣用AI搵客', imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop' },
];

const FeaturesSection = () => {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  return (
    <section className="py-24 bg-background">
      <div className="section-container">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="heading-display text-3xl sm:text-4xl mb-4">
            Clover 有咩用？
          </h2>
        </div>

        {/* Features grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.id}
              className="feature-card cursor-pointer group animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => feature.videoId && setSelectedVideo(feature.videoId)}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={feature.imageUrl || `https://img.youtube.com/vi/${feature.videoId}/hqdefault.jpg`}
                  alt={feature.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Play overlay */}
                {feature.videoId && (
                  <div className="absolute inset-0 bg-background/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
                      <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
                    </div>
                  </div>
                )}
                {/* Number badge */}
                <div className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm text-foreground text-lg font-bold w-10 h-10 rounded-full flex items-center justify-center">
                  {feature.id}.
                </div>
              </div>

              {/* Title */}
              <div className="p-5">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors leading-relaxed">
                  {feature.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Video modal */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl p-0 bg-background border-border overflow-hidden">
          <div className="aspect-video">
            {selectedVideo && (
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default FeaturesSection;
