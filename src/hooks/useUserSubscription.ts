import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState, useMemo } from 'react';
import { differenceInDays } from 'date-fns';

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

  // Fetch active subscription
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

  // Fetch subscription history (all subscriptions)
  const { data: subscriptionHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['user-subscription-history', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as UserSubscription[];
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
      queryClient.invalidateQueries({ queryKey: ['user-subscription-history'] });
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
      queryClient.invalidateQueries({ queryKey: ['user-subscription-history'] });
    },
  });

  // Check if subscription is about to expire (within specified days, default 7)
  const isExpiringSoon = useMemo(() => {
    if (!subscription) return false;
    const expirationDate = new Date(subscription.expiration_date);
    const daysUntilExpiration = differenceInDays(expirationDate, new Date());
    return daysUntilExpiration <= 7 && daysUntilExpiration >= 0;
  }, [subscription]);

  // Get days until expiration
  const daysUntilExpiration = useMemo(() => {
    if (!subscription) return null;
    const expirationDate = new Date(subscription.expiration_date);
    return differenceInDays(expirationDate, new Date());
  }, [subscription]);

  // Check if subscription has expired
  const isExpired = useMemo(() => {
    if (!subscription) return false;
    const expirationDate = new Date(subscription.expiration_date);
    return expirationDate < new Date();
  }, [subscription]);

  return {
    subscription,
    isLoading,
    error,
    subscribe: subscribeMutation.mutate,
    isSubscribing: subscribeMutation.isPending,
    cancelSubscription: cancelMutation.mutate,
    isCancelling: cancelMutation.isPending,
    isExpiringSoon,
    daysUntilExpiration,
    isExpired,
    subscriptionHistory: subscriptionHistory || [],
    isLoadingHistory,
  };
};
