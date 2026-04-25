import { useState } from 'react';
import { Play } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useLanguage } from '@/i18n/LanguageContext';
import TranslatedText from '@/components/TranslatedText';

interface Showcase {
  id: number;
  channel: string;
  videoId: string;
}

// i18n-allow-block-start: channel names are brand strings, rendered via <TranslatedText sourceLang="zh-TW" />
const showcases: Showcase[] = [
  { id: 1, channel: 'Boni - 富邦財務全新私人貸款App', videoId: 'R-LUG7R2ZcA' },
  { id: 2, channel: '命之書', videoId: 'NLGJoOzUZmA' },
  { id: 3, channel: 'Lion AI 獅子智能', videoId: 'nacTkkvqkL4' },
  { id: 4, channel: 'Lion AI 獅子智能', videoId: 'cpmPWhKCmSQ' },
  { id: 5, channel: 'Lion AI 獅子智能', videoId: 'ZiaJJz-bJhs' },
  { id: 6, channel: 'Lion AI 獅子智能', videoId: 'KrMVwIJedKk' },
  { id: 7, channel: 'Lion AI 獅子智能', videoId: 'gYRWQfroffw' },
  { id: 8, channel: 'Lion AI 獅子智能', videoId: 'jIhwco0fP-w' },
  { id: 9, channel: 'Lion AI 獅子智能', videoId: 'iqxCZjS-ecA' },
];
// i18n-allow-block-end

const ShowcasesSection = () => {
  const { t } = useLanguage();
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  return (
    <section className="py-24 bg-background">
      <div className="section-container">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="heading-display text-3xl sm:text-4xl">
            {t('showcases.heading')}
            <span className="text-muted-foreground ml-3">{t('showcases.label')}</span>
          </h2>
        </div>

        {/* Showcases grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {showcases.map((showcase, index) => (
            <div
              key={showcase.id}
              className="feature-card cursor-pointer group animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => setSelectedVideo(showcase.videoId)}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={`https://img.youtube.com/vi/${showcase.videoId}/hqdefault.jpg`}
                  alt={`${t('showcases.item')} ${showcase.id}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Play overlay */}
                <div className="absolute inset-0 bg-background/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
                    <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                  {t('showcases.item')} {showcase.id}
                </h3>
                <TranslatedText text={showcase.channel} sourceLang="zh-TW" as="p" className="text-sm text-muted-foreground" />
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

export default ShowcasesSection;
