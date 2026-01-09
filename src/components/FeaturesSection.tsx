import { Play, Sparkles } from 'lucide-react';
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
    <section id="features" className="py-24 sm:py-32 bg-background relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="absolute top-40 right-0 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-40 left-0 w-80 h-80 rounded-full bg-seedling/5 blur-3xl" />
      
      <div className="section-container relative z-10">
        {/* Section header */}
        <div className="text-center mb-16 sm:mb-20">
          <div className="badge-nature mb-6 inline-flex">
            <Sparkles className="w-4 h-4" />
            <span>Features</span>
          </div>
          <h2 className="heading-display text-4xl sm:text-5xl lg:text-6xl mb-6">
            Clovers 有咩用？
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore the powerful tools designed to transform your marketing workflow
          </p>
        </div>

        {/* Features grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.id}
              className="card-elevated cursor-pointer group animate-slide-up overflow-hidden"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => feature.videoId && setSelectedVideo(feature.videoId)}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video overflow-hidden rounded-t-3xl">
                <img
                  src={feature.imageUrl || `https://img.youtube.com/vi/${feature.videoId}/hqdefault.jpg`}
                  alt={feature.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                
                {/* Play overlay */}
                {feature.videoId && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <div className="w-16 h-16 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-xl shadow-primary/30 transform scale-90 group-hover:scale-100 transition-transform duration-300">
                      <Play className="w-6 h-6 text-primary-foreground ml-1" />
                    </div>
                  </div>
                )}
                
                {/* Number badge */}
                <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-md text-foreground text-base font-bold w-10 h-10 rounded-xl flex items-center justify-center border border-border/50">
                  {feature.id}
                </div>
              </div>

              {/* Title */}
              <div className="p-6">
                <h3 className="font-heading font-semibold text-foreground group-hover:text-primary transition-colors duration-300 leading-relaxed">
                  {feature.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Video modal */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-5xl p-0 bg-background border-border/50 overflow-hidden rounded-2xl shadow-2xl">
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