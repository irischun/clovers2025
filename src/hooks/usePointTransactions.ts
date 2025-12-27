import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PointTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'add' | 'deduct';
  description: string;
  balance_after: number;
  created_at: string;
}

export const usePointTransactions = () => {
  const queryClient = useQueryClient();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["point-transactions"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("point_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as PointTransaction[];
    },
  });

  const addTransaction = useMutation({
    mutationFn: async ({
      amount,
      type,
      description,
      balanceAfter,
    }: {
      amount: number;
      type: 'add' | 'deduct';
      description: string;
      balanceAfter: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("point_transactions")
        .insert({
          user_id: user.id,
          amount,
          type,
          description,
          balance_after: balanceAfter,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["point-transactions"] });
    },
    onError: (error) => {
      toast.error("記錄交易失敗");
      console.error(error);
    },
  });

  return {
    transactions: transactions ?? [],
    isLoading,
    addTransaction: addTransaction.mutate,
    addTransactionAsync: addTransaction.mutateAsync,
    isAddingTransaction: addTransaction.isPending,
  };
};
