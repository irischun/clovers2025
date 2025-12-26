import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, Check, Zap } from "lucide-react";
import { toast } from "sonner";

const pointPackages = [
  {
    points: 100,
    price: 60,
    pricePerPoint: 0.6,
    savings: null,
  },
  {
    points: 350,
    price: 140,
    pricePerPoint: 0.4,
    savings: 70,
  },
  {
    points: 1000,
    price: 330,
    pricePerPoint: 0.33,
    savings: 270,
  },
];

const BuyPointsPage = () => {
  const handlePurchase = (points: number, price: number) => {
    toast.info(`購買 ${points} 點數 ($${price}) - 功能即將推出`);
  };

  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Coins className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">購買點數套餐</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          選擇合適的點數套餐
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
                  最優惠
                </span>
              </div>
            )}
            
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Coins className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">
                {pkg.points} 點數
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
                  <span>平均每點數：港幣${pkg.pricePerPoint.toFixed(2)}/點</span>
                </div>
                
                {pkg.savings && (
                  <div className="flex items-center justify-center gap-2 text-primary font-medium">
                    <Check className="w-4 h-4" />
                    <span>節省 ${pkg.savings}</span>
                  </div>
                )}
              </div>
              
              <Button 
                className="w-full"
                variant={index === 2 ? "default" : "outline"}
                onClick={() => handlePurchase(pkg.points, pkg.price)}
              >
                立即購買
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer Note */}
      <p className="text-center text-sm text-muted-foreground">
        點數購買後即時發放到您的帳戶，可用於所有 AI 功能。
      </p>
    </div>
  );
};

export default BuyPointsPage;
