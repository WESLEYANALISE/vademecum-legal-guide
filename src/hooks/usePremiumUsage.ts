import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const LIMITS: Record<string, number> = {
  questoes: 3,
  explicacao: 3,
  narracao: 3,
};

export function usePremiumUsage() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    supabase
      .from('premium_usage')
      .select('feature')
      .eq('user_id', user.id)
      .gte('used_at', startOfMonth.toISOString())
      .then(({ data }) => {
        const c: Record<string, number> = {};
        (data || []).forEach(r => { c[r.feature] = (c[r.feature] || 0) + 1; });
        setCounts(c);
        setLoading(false);
      });
  }, [user]);

  const canUse = useCallback((feature: string) => {
    const limit = LIMITS[feature] ?? 0;
    return (counts[feature] || 0) < limit;
  }, [counts]);

  const usageCount = useCallback((feature: string) => counts[feature] || 0, [counts]);

  const remaining = useCallback((feature: string) => {
    const limit = LIMITS[feature] ?? 0;
    return Math.max(0, limit - (counts[feature] || 0));
  }, [counts]);

  const registerUsage = useCallback(async (feature: string, refKey?: string) => {
    if (!user) return;
    await supabase.from('premium_usage').insert({
      user_id: user.id,
      feature,
      ref_key: refKey || null,
    });
    setCounts(prev => ({ ...prev, [feature]: (prev[feature] || 0) + 1 }));
  }, [user]);

  return { canUse, usageCount, remaining, registerUsage, loading };
}
