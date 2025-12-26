import { useState } from 'react';
import { Check, Zap, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const monthlyPlans = [
  {
    name: '輕量版',
    pointsPerMonth: 150,
    price: 90,
    period: '月',
    pricePerPoint: 0.6,
    features: [
      '每月150點數',
      '平均每點 $0.6',
      '適合輕度使用',
      '基本功能支援',
    ],
    popular: false,
  },
  {
    name: '標準版',
    pointsPerMonth: 450,
    price: 200,
    period: '月',
    pricePerPoint: 0.4,
    features: [
      '每月450點數',
      '平均每點 $0.4',
      '適合標準使用',
      '完整功能支援',
      '優先客服',
    ],
    popular: true,
  },
  {
    name: '高級版',
    pointsPerMonth: 1200,
    price: 400,
    period: '月',
    pricePerPoint: 0.33,
    features: [
      '每月1200點數',
      '平均每點 $0.33',
      '適合高級使用',
      '所有功能無限制',
      '專屬客服支援',
      'API 訪問權限',
    ],
    popular: false,
  },
];

const yearlyPlans = [
  {
    name: '輕量版',
    pointsPerMonth: 150,
    price: 900,
    period: '年',
    monthlyPrice: 75,
    originalMonthlyPrice: 90,
    savings: 180,
    pricePerPoint: 0.5,
    features: [
      '每月150點數',
      '平均每點 $0.5',
      '適合輕度使用',
      '基本功能支援',
    ],
    popular: false,
  },
  {
    name: '標準版',
    pointsPerMonth: 450,
    price: 1800,
    period: '年',
    monthlyPrice: 150,
    originalMonthlyPrice: 200,
    savings: 600,
    pricePerPoint: 0.33,
    features: [
      '每月450點數',
      '平均每點 $0.33',
      '適合標準使用',
      '完整功能支援',
      '優先客服',
    ],
    popular: true,
  },
  {
    name: '高級版',
    pointsPerMonth: 1200,
    price: 4000,
    period: '年',
    monthlyPrice: 333.3,
    originalMonthlyPrice: 400,
    savings: 800,
    pricePerPoint: 0.28,
    features: [
      '每月1200點數',
      '平均每點 $0.28',
      '適合高級使用',
      '所有功能無限制',
      '專屬客服支援',
      'API 訪問權限',
    ],
    popular: false,
  },
];

const SubscriptionPage = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  
  const plans = billingPeriod === 'monthly' ? monthlyPlans : yearlyPlans;

  const handleSubscribe = (planName: string) => {
    toast.info(`即將訂閱 ${planName}`, {
      description: '付款功能即將推出',
    });
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Important Notice */}
      <Alert className="bg-primary/10 border-primary/30">
        <div className="flex items-start gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-primary" />
            <Zap className="h-5 w-5 text-primary animate-pulse" />
          </div>
          <div>
            <AlertTitle className="text-primary font-semibold text-base">
              重要提示：訂閱後才能購買額外點數
            </AlertTitle>
            <AlertDescription className="text-muted-foreground mt-1">
              購買額外點數套餐是訂閱會員的專屬福利。請先選擇並訂閱下方任一方案，即可在需要時隨時購買額外點數補充帳戶。
            </AlertDescription>
          </div>
        </div>
      </Alert>

      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <h1 className="text-3xl md:text-4xl font-bold">選擇您的訂閱計劃</h1>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent text-accent-foreground text-sm font-medium animate-pulse">
            <Sparkles className="w-4 h-4" />
            限時優惠
          </span>
        </div>
        <p className="text-muted-foreground text-lg">
          選擇最適合您的計劃，隨時可以升級或降級
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center bg-secondary rounded-full p-1">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={cn(
              "px-6 py-2 rounded-full text-sm font-medium transition-all",
              billingPeriod === 'monthly'
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            月付
          </button>
          <button
            onClick={() => setBillingPeriod('yearly')}
            className={cn(
              "px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
              billingPeriod === 'yearly'
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            年付
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs",
              billingPeriod === 'yearly'
                ? "bg-accent text-accent-foreground"
                : "bg-accent/50 text-accent-foreground"
            )}>
              慳更多
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan, index) => (
          <div
            key={plan.name}
            className={cn(
              "relative rounded-2xl p-6 transition-all duration-300",
              plan.popular
                ? "bg-primary text-primary-foreground ring-2 ring-primary scale-105 shadow-2xl shadow-primary/25"
                : "bg-card border border-border hover:border-primary/50"
            )}
          >
            {/* Popular Badge */}
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-4 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium">
                  最受歡迎
                </span>
              </div>
            )}

            {/* Plan Name */}
            <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
            
            {/* Points per month */}
            <p className={cn(
              "text-sm mb-4",
              plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"
            )}>
              每月 {plan.pointsPerMonth} 點數
            </p>

            {/* Price */}
            <div className="mb-6">
              <span className="text-4xl font-bold">${plan.price}</span>
              <span className={cn(
                "text-sm ml-1",
                plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"
              )}>
                / {plan.period}
              </span>
              
              {/* Yearly savings */}
              {billingPeriod === 'yearly' && 'savings' in plan && (
                <div className="mt-2 space-y-1">
                  <p className={cn(
                    "text-sm",
                    plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}>
                    平均每月 ${(plan as typeof yearlyPlans[0]).monthlyPrice}
                  </p>
                  <p className={cn(
                    "text-sm font-medium",
                    plan.popular ? "text-accent" : "text-primary"
                  )}>
                    年費慳 ${(plan as typeof yearlyPlans[0]).savings}
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
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            {/* Subscribe Button */}
            <Button
              onClick={() => handleSubscribe(plan.name)}
              className={cn(
                "w-full",
                plan.popular
                  ? "bg-background text-foreground hover:bg-background/90"
                  : ""
              )}
              variant={plan.popular ? "secondary" : "outline"}
            >
              立即訂閱
            </Button>
          </div>
        ))}
      </div>

      {/* Footer Note */}
      <p className="text-center text-sm text-muted-foreground">
        所有計劃都可以隨時取消。點數每月自動發放。
      </p>
    </div>
  );
};

export default SubscriptionPage;
