import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { landingPlans } from '@/data/subscriptionPlans';

const PricingSection = () => {
  const navigate = useNavigate();

  return (
    <section id="pricing" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            透明定價
          </span>
          <h2 className="heading-display text-4xl md:text-5xl mb-6">
            選擇適合您的方案
          </h2>
          <p className="text-lg text-muted-foreground">
            無論您是剛起步還是正在擴展，我們都有適合您的方案。隨時升級或降級，無需長期合約。
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {landingPlans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 transition-all duration-300 ${
                plan.popular
                  ? 'bg-primary text-primary-foreground scale-105 shadow-2xl shadow-primary/25'
                  : 'bg-card border border-border hover:border-primary/50'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full bg-accent text-accent-foreground text-sm font-medium">
                    最受歡迎
                  </span>
                </div>
              )}

              <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-sm opacity-75">{plan.nameEn}</span>
                </div>
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className={`text-sm ${plan.popular ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                <span className="text-5xl font-bold">{plan.price}</span>
                <span className={`text-sm ml-2 ${plan.popular ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {plan.period}
                </span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 shrink-0 mt-0.5 ${plan.popular ? 'text-primary-foreground' : 'text-primary'}`} />
                    <span className={`text-sm ${plan.popular ? 'text-primary-foreground/90' : ''}`}>{feature}</span>
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
