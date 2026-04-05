import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Wifi, Clock, CalendarDays, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PresenceUser {
  user_id: string;
  email: string;
  display_name: string;
  current_route: string;
  online_at: string;
}

interface ActivityRow {
  user_id: string;
  email: string | null;
  display_name: string | null;
  current_route: string | null;
  last_seen_at: string;
}

const ROUTE_LABELS: Record<string, string> = {
  '/': 'Início',
  '/auth': 'Autenticação',
  '/ferramentas': 'Ferramentas',
  '/estudar': 'Estudar',
  '/biblioteca': 'Biblioteca',
  '/gamificacao': 'Gamificação',
  '/radar-360': 'Radar 360',
  '/noticias': 'Notícias',
  '/configuracoes': 'Configurações',
  '/perfil': 'Perfil',
  '/narracao': 'Narração',
  '/explicacao-lei': 'Explicação de Lei',
  '/mapa-mental': 'Mapa Mental',
  '/resumos': 'Resumos',
  '/simulado': 'Simulado',
  '/aprender': 'Aprender',
  '/sobre': 'Sobre',
};

function getRouteLabel(route: string | null) {
  if (!route) return 'Desconhecida';
  if (ROUTE_LABELS[route]) return ROUTE_LABELS[route];
  if (route.startsWith('/legislacao/')) return 'Legislação';
  if (route.startsWith('/radar/')) return 'Radar Legislativo';
  if (route.startsWith('/aprender/')) return 'Aprender';
  if (route.startsWith('/legislacao-estadual')) return 'Legislação Estadual';
  return route;
}

const AdminMonitorUsuarios = () => {
  const navigate = useNavigate();
  const [realtimeUsers, setRealtimeUsers] = useState<PresenceUser[]>([]);
  const [last5min, setLast5min] = useState<ActivityRow[]>([]);
  const [today, setToday] = useState<ActivityRow[]>([]);

  // Presence listener
  useEffect(() => {
    const channel = supabase.channel('online-users');

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: PresenceUser[] = [];
        Object.values(state).forEach((presences: any[]) => {
          presences.forEach((p) => {
            users.push({
              user_id: p.user_id,
              email: p.email,
              display_name: p.display_name,
              current_route: p.current_route,
              online_at: p.online_at,
            });
          });
        });
        setRealtimeUsers(users);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Fetch history
  const fetchHistory = useCallback(async () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [r5, rToday] = await Promise.all([
      supabase
        .from('user_activity_log')
        .select('*')
        .gte('last_seen_at', fiveMinAgo)
        .order('last_seen_at', { ascending: false }),
      supabase
        .from('user_activity_log')
        .select('*')
        .gte('last_seen_at', startOfDay.toISOString())
        .order('last_seen_at', { ascending: false }),
    ]);

    if (r5.data) setLast5min(r5.data as ActivityRow[]);
    if (rToday.data) setToday(rToday.data as ActivityRow[]);
  }, []);

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 30_000);
    return () => clearInterval(interval);
  }, [fetchHistory]);

  const blocks = [
    {
      title: 'Em tempo real',
      icon: Wifi,
      color: 'from-green-500/20 to-green-600/10',
      iconColor: 'text-green-400',
      badgeColor: 'bg-green-500',
      count: realtimeUsers.length,
      users: realtimeUsers.map((u) => ({
        id: u.user_id,
        email: u.email,
        name: u.display_name,
        route: u.current_route,
        time: u.online_at,
        isOnline: true,
      })),
    },
    {
      title: 'Últimos 5 minutos',
      icon: Clock,
      color: 'from-blue-500/20 to-blue-600/10',
      iconColor: 'text-blue-400',
      badgeColor: 'bg-blue-500',
      count: last5min.length,
      users: last5min.map((u) => ({
        id: u.user_id,
        email: u.email ?? '',
        name: u.display_name ?? '',
        route: u.current_route,
        time: u.last_seen_at,
        isOnline: realtimeUsers.some((r) => r.user_id === u.user_id),
      })),
    },
    {
      title: 'Hoje',
      icon: CalendarDays,
      color: 'from-purple-500/20 to-purple-600/10',
      iconColor: 'text-purple-400',
      badgeColor: 'bg-purple-500',
      count: today.length,
      users: today.map((u) => ({
        id: u.user_id,
        email: u.email ?? '',
        name: u.display_name ?? '',
        route: u.current_route,
        time: u.last_seen_at,
        isOnline: realtimeUsers.some((r) => r.user_id === u.user_id),
      })),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <Users className="w-5 h-5 text-primary" />
          <h1 className="font-display text-lg font-bold text-foreground">Usuários Online</h1>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-3xl mx-auto">
        {blocks.map((block, bi) => {
          const Icon = block.icon;
          return (
            <motion.div
              key={block.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: bi * 0.1 }}
              className={`rounded-2xl bg-gradient-to-br ${block.color} border border-border/50 overflow-hidden`}
            >
              {/* Block header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30">
                <div className={`w-8 h-8 rounded-xl bg-background/50 flex items-center justify-center ${block.iconColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="font-body text-sm font-semibold text-foreground">{block.title}</span>
                <span className={`ml-auto ${block.badgeColor} text-background text-xs font-bold px-2 py-0.5 rounded-full`}>
                  {block.count}
                </span>
              </div>

              {/* User list */}
              {block.users.length === 0 ? (
                <div className="px-4 py-6 text-center text-muted-foreground text-xs">Nenhum usuário</div>
              ) : (
                <div className="divide-y divide-border/20 max-h-[320px] overflow-y-auto">
                  {block.users.map((u) => (
                    <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                      {/* Online dot */}
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground uppercase">
                          {(u.name || u.email)?.[0] ?? '?'}
                        </div>
                        {u.isOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-background animate-pulse" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{u.name || u.email}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-medium text-primary truncate max-w-[100px]">
                          {getRouteLabel(u.route)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(u.time), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminMonitorUsuarios;
