import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function usePresenceTracker() {
  const { user } = useAuth();
  const location = useLocation();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user) return;

    const payload = {
      user_id: user.id,
      email: user.email ?? '',
      display_name: user.user_metadata?.display_name ?? user.email?.split('@')[0] ?? '',
      current_route: location.pathname,
      online_at: new Date().toISOString(),
    };

    // Presence channel
    const channel = supabase.channel('online-users', {
      config: { presence: { key: user.id } },
    });

    channel
      .on('presence', { event: 'sync' }, () => {})
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track(payload);
        }
      });

    channelRef.current = channel;

    // Heartbeat: upsert activity log every 30s
    const upsert = () => {
      supabase
        .from('user_activity_log')
        .upsert(
          {
            user_id: user.id,
            email: user.email ?? '',
            display_name: user.user_metadata?.display_name ?? user.email?.split('@')[0] ?? '',
            current_route: location.pathname,
            last_seen_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )
        .then(() => {});
    };

    upsert();
    intervalRef.current = setInterval(upsert, 30_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (channelRef.current) {
        channelRef.current.untrack();
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user, location.pathname]);
}
