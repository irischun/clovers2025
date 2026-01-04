import { useState } from 'react';
import { ChevronLeft, ChevronRight, Play, MessageCircle } from 'lucide-react';
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
      const scrollAmount = 340;
      const newPosition = direction === 'left' 
        ? scrollPosition - scrollAmount 
        : scrollPosition + scrollAmount;
      container.scrollTo({ left: newPosition, behavior: 'smooth' });
      setScrollPosition(newPosition);
    }
  };

  return (
    <section className="py-24 sm:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-card via-background to-card" />
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-seedling/5 blur-3xl" />
      
      <div className="section-container relative z-10">
        {/* Section header */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="badge-nature mb-6 inline-flex">
            <MessageCircle className="w-4 h-4" />
            <span>Testimonials</span>
          </div>
          <h2 className="heading-display text-4xl sm:text-5xl lg:text-6xl mb-6">
            學員分享篇
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            聽聽我們學員的真實體驗和成功故事
          </p>
        </div>

        {/* Carousel container */}
        <div className="relative">
          {/* Navigation buttons */}
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-14 h-14 bg-secondary/90 backdrop-blur-xl rounded-2xl flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 -ml-4 sm:-ml-6 border border-border/50 shadow-lg"
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-14 h-14 bg-secondary/90 backdrop-blur-xl rounded-2xl flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300 -mr-4 sm:-mr-6 border border-border/50 shadow-lg"
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Cards container */}
          <div
            id="testimonials-container"
            className="flex gap-6 overflow-x-auto scrollbar-hide pb-6 px-4 sm:px-6 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="flex-shrink-0 w-80 snap-center"
              >
                <div
                  className="card-elevated cursor-pointer group overflow-hidden"
                  onClick={() => setSelectedVideo(testimonial.videoId)}
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video overflow-hidden rounded-t-3xl">
                    <img
                      src={`https://img.youtube.com/vi/${testimonial.videoId}/maxresdefault.jpg`}
                      alt={testimonial.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                    
                    {/* Play overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                      <div className="w-18 h-18 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-xl shadow-primary/30 glow-clover transform scale-90 group-hover:scale-100 transition-transform duration-300">
                        <Play className="w-7 h-7 text-primary-foreground ml-1" />
                      </div>
                    </div>
                    
                    {/* Number badge */}
                    <div className="absolute top-4 left-4 bg-gradient-to-br from-primary to-seedling text-primary-foreground text-sm font-bold px-3 py-1.5 rounded-lg shadow-lg">
                      #{testimonial.id}
                    </div>
                  </div>
                  
                  {/* Title */}
                  <div className="p-5">
                    <h3 className="font-heading font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
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

export default TestimonialsSection;