import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Central hook for consuming (deducting) points after a successful generation.
 * Usage:
 *   const { consumePoints } = usePointConsumption();
 *   // After successful generation:
 *   await consumePoints({ amount: 2, description: 'Image generation (2 images)' });
 */
export const usePointConsumption = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      amount,
      description,
    }: {
      amount: number;
      description: string;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get current balance
      const { data: pointsData, error: fetchError } = await supabase
        .from("user_points")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      const currentBalance = pointsData?.balance ?? 0;

      if (currentBalance < amount) {
        throw new Error("INSUFFICIENT_POINTS");
      }

      const newBalance = currentBalance - amount;

      // Update balance
      const { error: updateError } = await supabase
        .from("user_points")
        .update({ balance: newBalance })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      // Log transaction
      await supabase.from("point_transactions").insert({
        user_id: user.id,
        amount,
        type: "deduct",
        description,
        balance_after: newBalance,
      });

      return { newBalance, amount };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-points"] });
      queryClient.invalidateQueries({ queryKey: ["point-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
    onError: (error) => {
      if (error.message === "INSUFFICIENT_POINTS") {
        // Caller handles this — don't double-toast
        return;
      }
      console.error("Point consumption error:", error);
    },
  });

  /**
   * Check if user has enough points before starting a generation.
   * Returns true if enough, false otherwise (shows toast).
   */
  const checkBalance = async (required: number): Promise<boolean> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please log in first");
      return false;
    }

    const { data } = await supabase
      .from("user_points")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();

    const balance = data?.balance ?? 0;
    if (balance < required) {
      toast.error(`Insufficient points: need ${required} but only ${balance} remaining`);
      return false;
    }
    return true;
  };

  /**
   * Refund points back to the user after a failed generation.
   * Logs a 'refund' transaction and shows a toast notification.
   */
  const refundPoints = async ({
    amount,
    description,
  }: {
    amount: number;
    description: string;
  }) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || amount <= 0) return;

    const { data: pointsData } = await supabase
      .from("user_points")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();

    const currentBalance = pointsData?.balance ?? 0;
    const newBalance = currentBalance + amount;

    await supabase
      .from("user_points")
      .update({ balance: newBalance })
      .eq("user_id", user.id);

    await supabase.from("point_transactions").insert({
      user_id: user.id,
      amount,
      type: "refund",
      description,
      balance_after: newBalance,
    });

    queryClient.invalidateQueries({ queryKey: ["user-points"] });
    queryClient.invalidateQueries({ queryKey: ["point-transactions"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });

    toast.success(`已退還 ${amount} 點 (${description})`);
  };

  return {
    consumePoints: mutation.mutateAsync,
    isConsuming: mutation.isPending,
    checkBalance,
    refundPoints,
  };
};
