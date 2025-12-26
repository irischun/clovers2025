import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useUserPoints = () => {
  const queryClient = useQueryClient();

  const { data: points, isLoading } = useQuery({
    queryKey: ["user-points"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_points")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      // Create initial record if none exists
      if (!data) {
        const { data: newData, error: insertError } = await supabase
          .from("user_points")
          .insert({ user_id: user.id, balance: 0 })
          .select()
          .single();

        if (insertError) throw insertError;
        return newData;
      }

      return data;
    },
  });

  const addPoints = useMutation({
    mutationFn: async (amount: number) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const currentBalance = points?.balance || 0;
      const newBalance = currentBalance + amount;

      const { data, error } = await supabase
        .from("user_points")
        .update({ balance: newBalance })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user-points"] });
      toast.success(`成功增加點數！目前餘額：${data.balance} 點`);
    },
    onError: (error) => {
      toast.error("增加點數失敗");
      console.error(error);
    },
  });

  return {
    points: points?.balance ?? 0,
    isLoading,
    addPoints: addPoints.mutate,
    isAddingPoints: addPoints.isPending,
  };
};
