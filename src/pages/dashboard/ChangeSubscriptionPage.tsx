import { Check, ArrowLeft, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { useUserPoints } from '@/hooks/useUserPoints';
import { monthlyPlans } from '@/data/subscriptionPlans';
import { useTranslatedPlans } from '@/data/useTranslatedPlans';

const ChangeSubscriptionPage = () => {
  const { translatePlanName, translateFeature, t } = useTranslatedPlans();
  const navigate = useNavigate();
  const { subscription, subscribe, isSubscribing } = useUserSubscription();
  const { addPoints } = useUserPoints();

  const handleChangePlan = (planName: string, pointsPerMonth: number, price: number) => {
    subscribe({
      plan_name: planName,
      billing_period: billingPeriod,
      points_per_month: pointsPerMonth,
      price: price,
    }, {
      onSuccess: () => {
        addPoints(pointsPerMonth);
        toast.success(t('sub.planChanged'), {
          description: t('sub.planChangedDesc', { plan: translatePlanName(planName), period: billingPeriod === 'monthly' ? t('sub.monthly') : t('sub.yearly') }),
        });
        navigate('/dashboard/subscription');
      },
      onError: (error) => {
        toast.error(t('sub.changeFailed'), {
          description: error.message,
        });
      },
    });
  };

  const isCurrentPlan = (planName: string, billingPeriod: 'monthly' | 'yearly') => {
    if (!subscription) return false;
    return subscription.plan_name === planName && subscription.billing_period === billingPeriod;
  };

  const renderPlanCard = (plan: typeof monthlyPlans[0] | typeof yearlyPlans[0], isYearly: boolean) => {
    const billingPeriod = isYearly ? 'yearly' : 'monthly';
    const isCurrent = isCurrentPlan(plan.name, billingPeriod);

    return (
      <div
        key={`${plan.name}-${plan.period}`}
        className={cn(
          "relative rounded-2xl p-6 transition-all duration-300",
          plan.popular
            ? "bg-primary text-primary-foreground ring-2 ring-primary shadow-2xl shadow-primary/25"
            : "bg-card border border-border hover:border-primary/50",
          isCurrent && "ring-2 ring-accent"
        )}
      >
        {/* Current Plan Badge */}
        {isCurrent && (
          <div className="absolute -top-3 right-4">
            <span className="px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium flex items-center gap-1">
              <Crown className="w-3 h-3" />
              {t('sub.currentPlanLabel')}
            </span>
          </div>
        )}

        {/* Popular Badge */}
        {plan.popular && !isCurrent && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="px-4 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium">
              {t('sub.mostPopular')}
            </span>
          </div>
        )}

        {/* Plan Name */}
        <h3 className="text-xl font-bold mb-2">{translatePlanName(plan.name)}</h3>
        
        {/* Points per month */}
        <p className={cn(
          "text-sm mb-4",
          plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          {t('plan.pointsPerMonth', { points: String(plan.pointsPerMonth) })}
        </p>

        {/* Price */}
        <div className="mb-6">
          <span className="text-4xl font-bold">${plan.price}</span>
          <span className={cn(
            "text-sm ml-1",
            plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"
          )}>
            {isYearly ? t('plan.period.year') : t('plan.period.month')}
          </span>
          
          {/* Yearly savings */}
          {isYearly && 'savings' in plan && (
            <div className="mt-2 space-y-1">
              <p className={cn(
                "text-sm",
                plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"
              )}>
                {t('plan.monthlyAvgPrice', { price: String((plan as typeof yearlyPlans[0]).monthlyPrice) })}
              </p>
              <p className={cn(
                "text-sm font-medium",
                plan.popular ? "text-primary-foreground" : "text-primary"
              )}>
                {t('plan.annualSave', { amount: String((plan as typeof yearlyPlans[0]).savings) })}
              </p>
            </div>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-3 mb-6">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <Check className={cn(
                "w-5 h-5 shrink-0 mt-0.5",
                plan.popular ? "text-primary-foreground" : "text-primary"
              )} />
              <span className={cn(
                "text-sm",
                plan.popular ? "text-primary-foreground/90" : ""
              )}>
                {translateFeature(feature)}
              </span>
            </li>
          ))}
        </ul>

        {/* Change Plan Button */}
        <Button
          onClick={() => handleChangePlan(plan.name, billingPeriod, plan.pointsPerMonth, plan.price)}
          disabled={isSubscribing || isCurrent}
          className={cn(
            "w-full",
            plan.popular
              ? "bg-background text-foreground hover:bg-background/90"
              : ""
          )}
          variant={plan.popular ? "secondary" : "outline"}
        >
          {isCurrent ? t('sub.currentPlanLabel') : isSubscribing ? t('sub.cancelling') : t('changeSub.selectPlan')}
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Back Button and Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/dashboard/subscription')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">{t('changeSub.title')}</h1>
          {subscription && (
            <p className="text-muted-foreground mt-1">
              {t('changeSub.currentPlan')} <Badge variant="secondary">{translatePlanName(subscription.plan_name)} ({subscription.billing_period === 'monthly' ? t('sub.monthly') : t('sub.yearly')})</Badge>
            </p>
          )}
        </div>
      </div>

      {/* Monthly Plans Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">{t('changeSub.monthlyPlans')}</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {monthlyPlans.map((plan) => renderPlanCard(plan, false))}
        </div>
      </div>

      {/* Yearly Plans Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">{t('changeSub.yearlyPlans')}</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {yearlyPlans.map((plan) => renderPlanCard(plan, true))}
        </div>
      </div>

      {/* Footer Note */}
      <p className="text-center text-sm text-muted-foreground">
        {t('sub.footerNote')}
      </p>
    </div>
  );
};

export default ChangeSubscriptionPage;
