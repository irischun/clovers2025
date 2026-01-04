import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Leaf, ArrowRight, Users, Sparkles, Star } from 'lucide-react';

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 sm:py-32 relative overflow-hidden">
      {/* Premium Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      
      {/* Decorative organic blobs */}
      <div className="absolute top-1/2 left-1/4 w-80 h-80 bg-primary/15 rounded-full blur-3xl -translate-y-1/2 animate-pulse-glow" />
      <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-seedling/15 rounded-full blur-3xl -translate-y-1/2" />
      <div className="absolute bottom-20 left-1/2 w-96 h-32 bg-meadow/10 rounded-full blur-3xl -translate-x-1/2" />

      <div className="section-container relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="badge-nature mb-8 animate-slide-up inline-flex">
            <Leaf className="w-4 h-4" />
            <span>開始您的 AI 旅程</span>
          </div>

          {/* Heading */}
          <h2 className="heading-display text-4xl sm:text-5xl lg:text-6xl mb-8 animate-slide-up leading-tight" style={{ animationDelay: '100ms' }}>
            準備好讓 AI 幫你
            <br />
            <span className="text-gradient-nature">提升生產力</span> 了嗎？
          </h2>

          {/* Description */}
          <p className="text-lg sm:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto animate-slide-up leading-relaxed" style={{ animationDelay: '200ms' }}>
            加入數千位已經使用 Clover 來自動化內容創作、管理社交媒體和發展業務的創業者
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '300ms' }}>
            <Button 
              size="lg" 
              className="btn-primary text-lg px-10 py-7 gap-3 group"
              onClick={() => navigate('/auth')}
            >
              <Leaf className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
              免費開始使用
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
            <Button 
              size="lg" 
              className="btn-secondary text-lg px-10 py-7"
              onClick={() => {
                const pricingSection = document.getElementById('pricing');
                pricingSection?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              查看定價方案
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-16 sm:mt-20 animate-slide-up" style={{ animationDelay: '400ms' }}>
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-primary">
                  <Users className="w-5 h-5" />
                  <span className="text-3xl sm:text-4xl font-bold text-foreground">5,000+</span>
                </div>
                <span className="text-sm text-muted-foreground">活躍用戶</span>
              </div>
              
              <div className="hidden sm:block w-px h-12 bg-border" />
              
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-seedling">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-3xl sm:text-4xl font-bold text-foreground">100K+</span>
                </div>
                <span className="text-sm text-muted-foreground">內容已生成</span>
              </div>
              
              <div className="hidden sm:block w-px h-12 bg-border" />
              
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-meadow">
                  <Star className="w-5 h-5" />
                  <span className="text-3xl sm:text-4xl font-bold text-foreground">4.9/5</span>
                </div>
                <span className="text-sm text-muted-foreground">用戶評分</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;