import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

/**
 * Waits for the Supabase auth state to be fully restored from storage
 * before returning the user. Prevents race conditions where queries
 * fire before the session is available.
 */
export function useAuthReady() {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // getSession restores from localStorage first
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsReady(true);
    });

    // Listen for subsequent auth changes (sign in/out/token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        // If not yet ready (edge case), mark ready now
        setIsReady(true);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, isReady };
}
