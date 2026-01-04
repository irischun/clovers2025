import { Check, Sparkles, Crown, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { landingPlans } from '@/data/subscriptionPlans';

const PricingSection = () => {
  const navigate = useNavigate();

  const getPlanIcon = (index: number) => {
    const icons = [Leaf, Crown, Sparkles];
    return icons[index] || Leaf;
  };

  return (
    <section id="pricing" className="py-24 sm:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/50 to-background" />
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-1/4 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 rounded-full bg-seedling/5 blur-3xl" />
      
      <div className="section-container relative z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-20">
          <div className="badge-nature mb-6 inline-flex">
            <Sparkles className="w-4 h-4" />
            <span>透明定價 / Pricing</span>
          </div>
          <h2 className="heading-display text-4xl sm:text-5xl lg:text-6xl mb-6">
            選擇適合您的方案
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            無論您是剛起步還是正在擴展，我們都有適合您的方案。隨時升級或降級，無需長期合約。
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {landingPlans.map((plan, index) => {
            const IconComponent = getPlanIcon(index);
            return (
              <div
                key={plan.name}
                className={`relative overflow-hidden transition-all duration-500 animate-slide-up ${
                  plan.popular
                    ? 'card-elevated lg:-mt-4 lg:mb-4 ring-2 ring-primary/50 shadow-2xl shadow-primary/10'
                    : 'card-elevated'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-seedling to-primary" />
                )}
                
                <div className="p-8">
                  {plan.popular && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold mb-4">
                      <Crown className="w-3.5 h-3.5" />
                      最受歡迎
                    </div>
                  )}

                  {/* Plan header */}
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        plan.popular 
                          ? 'bg-gradient-to-br from-primary to-seedling' 
                          : 'bg-secondary border border-border'
                      }`}>
                        <IconComponent className={`w-5 h-5 ${plan.popular ? 'text-primary-foreground' : 'text-primary'}`} />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">{plan.nameEn}</p>
                        <h3 className="text-xl font-heading font-bold text-foreground">{plan.name}</h3>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-8">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-foreground">{plan.price}</span>
                      <span className="text-muted-foreground text-sm">{plan.period}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          plan.popular 
                            ? 'bg-primary/20' 
                            : 'bg-secondary'
                        }`}>
                          <Check className={`w-3 h-3 ${plan.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button
                    onClick={() => navigate('/auth')}
                    className={`w-full py-6 font-semibold transition-all duration-300 ${
                      plan.popular
                        ? 'btn-primary'
                        : 'btn-secondary'
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom note */}
        <p className="text-center text-sm text-muted-foreground mt-12 sm:mt-16">
          所有方案均提供 14 天免費試用。無需信用卡。
        </p>
      </div>
    </section>
  );
};

export default PricingSection;