import { useState } from 'react';
import { Check, Zap, AlertCircle, Sparkles, Wallet, Crown, Calendar, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useUserPoints } from '@/hooks/useUserPoints';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { monthlyPlans, yearlyPlans, type YearlyPlan } from '@/data/subscriptionPlans';

const SubscriptionPage = () => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const { points, isLoading: isLoadingPoints, addPoints } = useUserPoints();
  const { 
    subscription, 
    isLoading: isLoadingSubscription, 
    subscribe, 
    isSubscribing,
    cancelSubscription,
    isCancelling,
    subscriptionHistory,
    isLoadingHistory,
    isExpiringSoon,
    daysUntilExpiration,
  } = useUserSubscription();
  const navigate = useNavigate();
  
  const plans = billingPeriod === 'monthly' ? monthlyPlans : yearlyPlans;

  const handleSubscribe = (planName: string, pointsAmount: number, price: number) => {
    subscribe({
      plan_name: planName,
      billing_period: billingPeriod,
      points_per_month: pointsAmount,
      price: price,
    }, {
      onSuccess: () => {
        addPoints(pointsAmount);
        toast.success(`已訂閱 ${planName}`, {
          description: `已發放 ${pointsAmount} 點數到您的帳戶`,
        });
      },
      onError: (error) => {
        toast.error('訂閱失敗', {
          description: error.message,
        });
      },
    });
  };

  const handleCancelSubscription = () => {
    cancelSubscription(undefined, {
      onSuccess: () => {
        toast.success('訂閱取消成功');
      },
      onError: (error) => {
        toast.error('取消訂閱失敗', {
          description: error.message,
        });
      },
    });
  };

  const handleChangeSubscription = () => {
    navigate('/dashboard/change-subscription');
  };

  const isCurrentPlan = (planName: string) => {
    if (!subscription) return false;
    return subscription.plan_name === planName && 
           subscription.billing_period === billingPeriod;
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Current Subscription & Points Display */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="py-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Points Balance */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                <Wallet className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">目前點數餘額</p>
                {isLoadingPoints ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-3xl font-bold text-primary">{points} 點</p>
                )}
              </div>
            </div>

            {/* Current Subscription Info */}
            {isLoadingSubscription ? (
              <div className="flex items-center gap-4">
                <Skeleton className="h-14 w-14 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-6 w-32" />
                </div>
              </div>
            ) : subscription ? (
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center">
                  <Crown className="w-7 h-7 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">目前訂閱計劃</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xl font-bold">{subscription.plan_name}</p>
                    <Badge variant="secondary">
                      {subscription.billing_period === 'monthly' ? '月付' : '年付'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>到期日: {format(new Date(subscription.expiration_date), 'yyyy/MM/dd')}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center">
                  <Crown className="w-7 h-7 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">目前訂閱計劃</p>
                  <p className="text-xl font-bold text-muted-foreground">尚未訂閱</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
        {plans.map((plan) => {
          const isCurrent = isCurrentPlan(plan.name);
          return (
            <div
              key={plan.name}
              className={cn(
                "relative rounded-2xl p-6 transition-all duration-300",
                plan.popular
                  ? "bg-primary text-primary-foreground ring-2 ring-primary scale-105 shadow-2xl shadow-primary/25"
                  : "bg-card border border-border hover:border-primary/50",
                isCurrent && "ring-2 ring-accent"
              )}
            >
              {/* Current Plan Badge */}
              {isCurrent && (
                <div className="absolute -top-3 right-4">
                  <span className="px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium">
                    目前計劃
                  </span>
                </div>
              )}

              {/* Popular Badge */}
              {plan.popular && !isCurrent && (
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

              {/* Subscribe Button */}
              <Button
                onClick={() => handleSubscribe(plan.name, plan.pointsPerMonth, plan.price)}
                disabled={isSubscribing || isCurrent}
                className={cn(
                  "w-full",
                  plan.popular
                    ? "bg-background text-foreground hover:bg-background/90"
                    : ""
                )}
                variant={plan.popular ? "secondary" : "outline"}
              >
                {isCurrent ? '目前計劃' : isSubscribing ? "處理中..." : "立即訂閱"}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Expiration Warning */}
      {isExpiringSoon && daysUntilExpiration !== null && (
        <Alert className="bg-destructive/10 border-destructive/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <div>
              <AlertTitle className="text-destructive font-semibold text-base">
                訂閱即將到期
              </AlertTitle>
              <AlertDescription className="text-muted-foreground mt-1">
                您的訂閱將在 {daysUntilExpiration} 天後到期。請及時續訂以確保服務不中斷。
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}

      {/* Subscription History */}
      {subscriptionHistory.length > 0 && (
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center gap-3 mb-4">
              <History className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">訂閱歷史</h2>
            </div>
            {isLoadingHistory ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>計劃</TableHead>
                    <TableHead>付款方式</TableHead>
                    <TableHead>價格</TableHead>
                    <TableHead>開始日期</TableHead>
                    <TableHead>到期日期</TableHead>
                    <TableHead>狀態</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptionHistory.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">{sub.plan_name}</TableCell>
                      <TableCell>{sub.billing_period === 'monthly' ? '月付' : '年付'}</TableCell>
                      <TableCell>${sub.price}</TableCell>
                      <TableCell>{format(new Date(sub.start_date), 'yyyy/MM/dd')}</TableCell>
                      <TableCell>{format(new Date(sub.expiration_date), 'yyyy/MM/dd')}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={sub.status === 'active' ? 'default' : 'secondary'}
                          className={cn(
                            sub.status === 'active' && 'bg-green-500 hover:bg-green-600',
                            sub.status === 'cancelled' && 'bg-muted text-muted-foreground'
                          )}
                        >
                          {sub.status === 'active' ? '生效中' : sub.status === 'cancelled' ? '已取消' : '已過期'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {subscription && (
        <div className="flex justify-center gap-3">
          <Button
            onClick={handleChangeSubscription}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            更改訂閱
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                disabled={isCancelling}
              >
                {isCancelling ? '處理中...' : '取消訂閱'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>確定要取消訂閱嗎？</AlertDialogTitle>
                <AlertDialogDescription>
                  取消訂閱後，您將在當前計費週期結束後失去以下權益：
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>每月自動發放的點數</li>
                    <li>購買額外點數的權限</li>
                    <li>訂閱專屬功能</li>
                  </ul>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>返回</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleCancelSubscription}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  確定取消
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* Footer Note */}
      <p className="text-center text-sm text-muted-foreground">
        所有計劃都可以隨時取消。點數每月自動發放。
      </p>
    </div>
  );
};

export default SubscriptionPage;
