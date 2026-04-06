import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SubscriptionState {
  isPremium: boolean;
  loading: boolean;
  plano: string | null;
}

export function useSubscription(): SubscriptionState {
  const { user } = useAuth();
  const [state, setState] = useState<SubscriptionState>({ isPremium: false, loading: true, plano: null });

  useEffect(() => {
    if (!user) {
      setState({ isPremium: false, loading: false, plano: null });
      return;
    }

    let cancelled = false;

    supabase
      .from('assinaturas')
      .select('plano, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setState({
          isPremium: !!data,
          loading: false,
          plano: data?.plano ?? null,
        });
      });

    return () => { cancelled = true; };
  }, [user]);

  return state;
}
