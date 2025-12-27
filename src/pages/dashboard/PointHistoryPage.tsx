import { usePointTransactions, PointTransaction } from "@/hooks/usePointTransactions";
import { useUserPoints } from "@/hooks/useUserPoints";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Coins, TrendingUp, TrendingDown, Clock, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { Link } from "react-router-dom";

const PointHistoryPage = () => {
  const { transactions, isLoading } = usePointTransactions();
  const { points, isLoading: pointsLoading } = useUserPoints();

  const totalAdded = transactions
    .filter(t => t.type === 'add')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalDeducted = transactions
    .filter(t => t.type === 'deduct')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-display text-3xl">點數紀錄</h1>
          <p className="text-muted-foreground">查看您的點數交易歷史</p>
        </div>
        <Link 
          to="/dashboard/buy-points"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Coins className="w-4 h-4" />
          購買點數
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">目前餘額</p>
                {pointsLoading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-primary">{points.toLocaleString()} 點</p>
                )}
              </div>
              <div className="p-3 rounded-full bg-primary/10">
                <Coins className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">總增加</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  +{totalAdded.toLocaleString()} 點
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-500/10">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">總扣除</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  -{totalDeducted.toLocaleString()} 點
                </p>
              </div>
              <div className="p-3 rounded-full bg-red-500/10">
                <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            交易紀錄
          </CardTitle>
          <CardDescription>最近 50 筆交易紀錄</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <Coins className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">尚無交易紀錄</p>
              <Link 
                to="/dashboard/buy-points"
                className="inline-flex items-center gap-1 text-primary hover:underline mt-2"
              >
                購買點數開始使用
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <TransactionItem key={transaction.id} transaction={transaction} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const TransactionItem = ({ transaction }: { transaction: PointTransaction }) => {
  const isAdd = transaction.type === 'add';
  
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`p-2.5 rounded-full ${isAdd ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
          {isAdd ? (
            <ArrowUpRight className="w-5 h-5 text-green-600 dark:text-green-400" />
          ) : (
            <ArrowDownRight className="w-5 h-5 text-red-600 dark:text-red-400" />
          )}
        </div>
        <div>
          <p className="font-medium">{transaction.description}</p>
          <p className="text-sm text-muted-foreground">
            {format(new Date(transaction.created_at), 'yyyy/MM/dd HH:mm', { locale: zhTW })}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-semibold ${isAdd ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {isAdd ? '+' : '-'}{transaction.amount.toLocaleString()} 點
        </p>
        <p className="text-xs text-muted-foreground">
          餘額：{transaction.balance_after.toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default PointHistoryPage;
