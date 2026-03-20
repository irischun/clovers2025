import { Coins } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserPoints } from '@/hooks/useUserPoints';
import { useLanguage } from '@/i18n/LanguageContext';

interface PointsBalanceCardProps {
  className?: string;
}

const PointsBalanceCard = ({ className = '' }: PointsBalanceCardProps) => {
  const { points, isLoading } = useUserPoints();
  const { t } = useLanguage();

  return (
    <Card className={`bg-primary/5 border-primary/20 ${className}`}>
      <CardContent className="py-2 sm:py-3 px-3 sm:px-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Coins className="w-3 h-3 sm:w-4 sm:h-4 text-primary shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{t('points.balance')}</span>
          {isLoading ? (
            <Skeleton className="h-4 sm:h-5 w-10 sm:w-12" />
          ) : (
            <span className="text-primary font-bold text-xs sm:text-sm">{points} {t('points.unit')}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PointsBalanceCard;
