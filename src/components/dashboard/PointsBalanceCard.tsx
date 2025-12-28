import { Coins } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserPoints } from '@/hooks/useUserPoints';

interface PointsBalanceCardProps {
  className?: string;
}

const PointsBalanceCard = ({ className = '' }: PointsBalanceCardProps) => {
  const { points, isLoading } = useUserPoints();

  return (
    <Card className={`bg-primary/5 border-primary/20 ${className}`}>
      <CardContent className="py-3 px-4">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">目前點數餘額：</span>
          {isLoading ? (
            <Skeleton className="h-5 w-12" />
          ) : (
            <span className="text-primary font-bold">{points} 點</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PointsBalanceCard;
