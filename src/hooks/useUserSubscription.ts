import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

interface UserSubscription {
  id: string;
  user_id: string;
  plan_name: string;
  billing_period: 'monthly' | 'yearly';
  points_per_month: number;
  price: number;
  start_date: string;
  expiration_date: string;
  status: 'active' | 'cancelled' | 'expired';
  created_at: string;
  updated_at: string;
}

interface SubscribeParams {
  plan_name: string;
  billing_period: 'monthly' | 'yearly';
  points_per_month: number;
  price: number;
}

export const useUserSubscription = () => {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  const { data: subscription, isLoading, error } = useQuery({
    queryKey: ['user-subscription', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .maybeSingle();
      
      if (error) throw error;
      return data as UserSubscription | null;
    },
    enabled: !!userId,
  });

  const subscribeMutation = useMutation({
    mutationFn: async (params: SubscribeParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Calculate expiration date based on billing period
      const startDate = new Date();
      const expirationDate = new Date();
      if (params.billing_period === 'monthly') {
        expirationDate.setMonth(expirationDate.getMonth() + 1);
      } else {
        expirationDate.setFullYear(expirationDate.getFullYear() + 1);
      }

      // Cancel any existing active subscriptions
      await supabase
        .from('user_subscriptions')
        .update({ status: 'cancelled' })
        .eq('user_id', user.id)
        .eq('status', 'active');

      // Create new subscription
      const { data, error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          plan_name: params.plan_name,
          billing_period: params.billing_period,
          points_per_month: params.points_per_month,
          price: params.price,
          start_date: startDate.toISOString(),
          expiration_date: expirationDate.toISOString(),
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      return data as UserSubscription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-subscription'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_subscriptions')
        .update({ status: 'cancelled' })
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-subscription'] });
    },
  });

  return {
    subscription,
    isLoading,
    error,
    subscribe: subscribeMutation.mutate,
    isSubscribing: subscribeMutation.isPending,
    cancelSubscription: cancelMutation.mutate,
    isCancelling: cancelMutation.isPending,
  };
};
