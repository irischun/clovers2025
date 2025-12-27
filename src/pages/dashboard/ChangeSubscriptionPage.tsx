import { useState } from 'react';
import { Check, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

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
      '年費慳 $600',
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

const ChangeSubscriptionPage = () => {
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleChangePlan = (planName: string, period: string) => {
    setIsUpdating(true);
    // Simulate API call
    setTimeout(() => {
      setIsUpdating(false);
      toast.success('你的訂閱計劃已更新', {
        description: `已更改為 ${planName} (${period}付)`,
      });
      navigate('/dashboard/subscription');
    }, 1000);
  };

  const renderPlanCard = (plan: typeof monthlyPlans[0] | typeof yearlyPlans[0], isYearly: boolean) => (
    <div
      key={`${plan.name}-${plan.period}`}
      className={cn(
        "relative rounded-2xl p-6 transition-all duration-300",
        plan.popular
          ? "bg-primary text-primary-foreground ring-2 ring-primary shadow-2xl shadow-primary/25"
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
        {isYearly && 'savings' in plan && (
          <div className="mt-2 space-y-1">
            <p className={cn(
              "text-sm",
              plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"
            )}>
              平均每月 ${(plan as typeof yearlyPlans[0]).monthlyPrice}
            </p>
            <p className={cn(
              "text-sm font-medium",
              plan.popular ? "text-primary-foreground" : "text-primary"
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

      {/* Change Plan Button */}
      <Button
        onClick={() => handleChangePlan(plan.name, isYearly ? '年' : '月')}
        disabled={isUpdating}
        className={cn(
          "w-full",
          plan.popular
            ? "bg-background text-foreground hover:bg-background/90"
            : ""
        )}
        variant={plan.popular ? "secondary" : "outline"}
      >
        {isUpdating ? "處理中..." : "選擇此計劃"}
      </Button>
    </div>
  );

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
        <h1 className="text-3xl md:text-4xl font-bold">更改訂閱</h1>
      </div>

      {/* Monthly Plans Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">月付</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {monthlyPlans.map((plan) => renderPlanCard(plan, false))}
        </div>
      </div>

      {/* Yearly Plans Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">年付</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {yearlyPlans.map((plan) => renderPlanCard(plan, true))}
        </div>
      </div>

      {/* Footer Note */}
      <p className="text-center text-sm text-muted-foreground">
        更改計劃後，新計劃將在下個計費週期生效。
      </p>
    </div>
  );
};

export default ChangeSubscriptionPage;
