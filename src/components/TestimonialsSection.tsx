import { useState } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface Testimonial {
  id: number;
  title: string;
  videoId: string;
}

const testimonials: Testimonial[] = [
  { id: 1, title: 'Clover 分享篇 01', videoId: 'dDXg2ZQWE7Q' },
  { id: 2, title: 'Clover 分享篇 02', videoId: 'tzTO2o-SUH4' },
  { id: 3, title: 'Clover 分享篇 03', videoId: 'dOnZAJwIA3w' },
  { id: 4, title: 'Clover 分享篇 04', videoId: 'Jb0mNtye-WQ' },
  { id: 5, title: 'Clover 分享篇 05', videoId: 'RIs8C2jI3Uc' },
];

const TestimonialsSection = () => {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('testimonials-container');
    if (container) {
      const scrollAmount = 320;
      const newPosition = direction === 'left' 
        ? scrollPosition - scrollAmount 
        : scrollPosition + scrollAmount;
      container.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  return (
    <section className="py-24 bg-card relative overflow-hidden">
      <div className="section-container">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="heading-display text-3xl sm:text-4xl mb-4">
            <span className="mr-3">🎬</span>
            學員分享篇
          </h2>
          <p className="text-muted-foreground text-lg">
            聽聽我們學員的真實體驗和成功故事
          </p>
        </div>

        {/* Carousel container */}
        <div className="relative">
          {/* Navigation buttons */}
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-secondary/80 backdrop-blur-sm rounded-full flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-all -ml-6"
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-secondary/80 backdrop-blur-sm rounded-full flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-all -mr-6"
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Cards container */}
          <div
            id="testimonials-container"
            className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 px-4 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="flex-shrink-0 w-72 snap-center"
              >
                <div
                  className="feature-card cursor-pointer group"
                  onClick={() => setSelectedVideo(testimonial.videoId)}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={`https://img.youtube.com/vi/${testimonial.videoId}/maxresdefault.jpg`}
                      alt={testimonial.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {/* Play overlay */}
                    <div className="absolute inset-0 bg-background/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center glow-clover">
                        <Play className="w-6 h-6 text-primary-foreground ml-1" />
                      </div>
                    </div>
                    {/* Number badge */}
                    <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-sm font-bold px-3 py-1 rounded-full">
                      #{testimonial.id}
                    </div>
                  </div>
                  
                  {/* Title */}
                  <div className="p-4">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {testimonial.title}
                    </h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
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

export default TestimonialsSection;
