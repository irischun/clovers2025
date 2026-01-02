import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { landingPlans } from '@/data/subscriptionPlans';

const PricingSection = () => {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="py-16 sm:py-20 md:py-24 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12 md:mb-16">
          <span className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-4 sm:mb-6">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
            透明定價
          </span>
          <h2 className="heading-display text-3xl sm:text-4xl md:text-5xl mb-4 sm:mb-6">
            選擇適合您的方案
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground px-4">
            無論您是剛起步還是正在擴展，我們都有適合您的方案。隨時升級或降級，無需長期合約。
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
          {landingPlans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-6 sm:p-8 transition-all duration-300 ${
                plan.popular
                  ? 'bg-primary text-primary-foreground sm:scale-105 shadow-2xl shadow-primary/25 order-first sm:order-none'
                  : 'bg-card border border-border hover:border-primary/50'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {plan.popular && (
                <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2">
                  <span className="px-3 sm:px-4 py-0.5 sm:py-1 rounded-full bg-accent text-accent-foreground text-xs sm:text-sm font-medium whitespace-nowrap">
                    最受歡迎
                  </span>
                </div>
              )}

              <div className="mb-4 sm:mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-xs sm:text-sm opacity-75">{plan.nameEn}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-2">{plan.name}</h3>
                <p className={`text-xs sm:text-sm ${plan.popular ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {plan.description}
                </p>
              </div>

              <div className="mb-4 sm:mb-6">
                <span className="text-4xl sm:text-5xl font-bold">{plan.price}</span>
                <span className={`text-xs sm:text-sm ml-2 ${plan.popular ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {plan.period}
                </span>
              </div>

              <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 sm:gap-3">
                    <Check className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5 ${plan.popular ? 'text-primary-foreground' : 'text-primary'}`} />
                    <span className={`text-xs sm:text-sm ${plan.popular ? 'text-primary-foreground/90' : ''}`}>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => navigate('/auth')}
                className={`w-full ${
                  plan.popular
                    ? 'bg-background text-foreground hover:bg-background/90'
                    : ''
                }`}
                variant={plan.popular ? 'secondary' : 'outline'}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <p className="text-center text-sm text-muted-foreground mt-12">
          所有方案均提供 14 天免費試用。無需信用卡。
        </p>
      </div>
    </section>
  );
};

export default PricingSection;
