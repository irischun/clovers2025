import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, Check, Zap, Wallet, Sparkles, AlertCircle } from "lucide-react";
import { useUserPoints } from "@/hooks/useUserPoints";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslatedPlans } from '@/data/useTranslatedPlans';

const pointPackages = [
  { points: 100, price: 60, pricePerPoint: 0.6, savings: null },
  { points: 350, price: 140, pricePerPoint: 0.4, savings: 70 },
  { points: 1000, price: 330, pricePerPoint: 0.33, savings: 270 },
];

const BuyPointsPage = () => {
  const { t } = useTranslatedPlans();
  const { points, isLoading, addPoints, isAddingPoints } = useUserPoints();

  const handlePurchase = (pointsAmount: number, price: number) => {
    addPoints(pointsAmount);
  };

  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      {/* Important Notice */}
      <Card className="border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
        <CardContent className="py-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 animate-pulse">
              <AlertCircle className="w-6 h-6 text-amber-500" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-bounce" />
                {t('buyPoints.importantNotice')}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t('buyPoints.importantDesc')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Points Balance Display */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                <Wallet className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('buyPoints.currentBalance')}</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-3xl font-bold text-primary">{points} {t('sub.points')}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Animated Limited Offer Badge */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 animate-pulse">
          <Sparkles className="w-5 h-5 text-amber-500 animate-bounce" />
          <span className="text-amber-600 dark:text-amber-400 font-semibold">{t('buyPoints.limitedOffer')}</span>
          <Sparkles className="w-5 h-5 text-amber-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>
      </div>

      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Coins className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">{t('buyPoints.title')}</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          {t('buyPoints.subtitle')}
        </p>
      </div>

      {/* Point Packages */}
      <div className="grid gap-6 md:grid-cols-3">
        {pointPackages.map((pkg, index) => (
          <Card 
            key={pkg.points} 
            className={`relative overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] ${
              index === 2 ? 'border-primary' : ''
            }`}
          >
            {pkg.savings && pkg.savings > 100 && (
              <div className="absolute top-3 right-3">
                <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {t('buyPoints.bestValue')}
                </span>
              </div>
            )}
            
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Coins className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">
                {pkg.points} {t('buyPoints.points')}
              </CardTitle>
            </CardHeader>
            
            <CardContent className="text-center space-y-4">
              <div>
                <div className="text-4xl font-bold text-primary">
                  ${pkg.price}
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>{t('buyPoints.avgPerPoint', { price: pkg.pricePerPoint.toFixed(2) })}</span>
                </div>
                
                {pkg.savings && (
                  <div className="flex items-center justify-center gap-2 text-primary font-medium">
                    <Check className="w-4 h-4" />
                    <span>{t('buyPoints.save', { amount: String(pkg.savings) })}</span>
                  </div>
                )}
              </div>
              
              <Button 
                className="w-full"
                variant={index === 2 ? "default" : "outline"}
                onClick={() => handlePurchase(pkg.points, pkg.price)}
                disabled={isAddingPoints}
              >
                {isAddingPoints ? t('buyPoints.processing') : t('buyPoints.buyNow')}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer Note */}
      <p className="text-center text-sm text-muted-foreground">
        {t('buyPoints.footerNote')}
      </p>
    </div>
  );
};

export default BuyPointsPage;
