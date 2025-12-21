import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';

const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-primary/5 to-background" />
      
      {/* Decorative elements */}
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2" />
      <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-accent/20 rounded-full blur-3xl -translate-y-1/2" />

      <div className="section-container relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-2 mb-6 animate-slide-up">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">開始您的 AI 旅程</span>
          </div>

          {/* Heading */}
          <h2 className="heading-display text-3xl sm:text-4xl lg:text-5xl mb-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
            準備好讓 AI 幫你<br />
            <span className="text-primary">提升生產力</span> 了嗎？
          </h2>

          {/* Description */}
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto animate-slide-up" style={{ animationDelay: '200ms' }}>
            加入數千位已經使用 Clover 來自動化內容創作、管理社交媒體和發展業務的創業者
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '300ms' }}>
            <Button 
              size="lg" 
              className="btn-primary text-lg px-8 gap-2 group"
              onClick={() => navigate('/auth')}
            >
              免費開始使用
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8"
              onClick={() => {
                const pricingSection = document.getElementById('pricing');
                pricingSection?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              查看定價方案
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-muted-foreground animate-slide-up" style={{ animationDelay: '400ms' }}>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">5,000+</span>
              <span className="text-sm">活躍用戶</span>
            </div>
            <div className="w-px h-8 bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">100K+</span>
              <span className="text-sm">內容已生成</span>
            </div>
            <div className="w-px h-8 bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-foreground">4.9/5</span>
              <span className="text-sm">用戶評分</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
