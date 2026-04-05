import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getPresenceState } from '@/hooks/usePresenceTracker';
import { ArrowLeft, Wifi, Clock, CalendarDays, Users, Trophy, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
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

interface NormalizedUser {
  id: string;
  email: string;
  name: string;
  route: string | null;
  time: string;
  isOnline: boolean;
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
  '/admin-funcoes': 'Admin',
  '/admin-monitor-usuarios': 'Monitor Usuários',
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

function formatPreciseTime(time: string) {
  const d = new Date(time);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 5) return 'agora';
  if (diffSec < 60) return `${diffSec}s atrás`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}min atrás`;
  if (diffSec < 86400) return format(d, 'HH:mm', { locale: ptBR });
  return formatDistanceToNow(d, { addSuffix: true, locale: ptBR });
}

function buildRouteRank(rows: ActivityRow[]): { label: string; count: number }[] {
  const map: Record<string, number> = {};
  rows.forEach((r) => {
    const label = getRouteLabel(r.current_route);
    map[label] = (map[label] || 0) + 1;
  });
  return Object.entries(map)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

const MEDAL_COLORS = ['text-yellow-400', 'text-gray-300', 'text-amber-600'];

interface BlockData {
  key: string;
  title: string;
  subtitle: string;
  icon: typeof Wifi;
  gradientFrom: string;
  gradientTo: string;
  iconBg: string;
  badgeBg: string;
  count: number;
  users: NormalizedUser[];
}

interface RankBlock {
  key: string;
  title: string;
  icon: typeof Trophy;
  gradientFrom: string;
  gradientTo: string;
  iconBg: string;
  badgeBg: string;
  ranks: { label: string; count: number }[];
}

const AdminMonitorUsuarios = () => {
  const navigate = useNavigate();
  const [realtimeUsers, setRealtimeUsers] = useState<PresenceUser[]>([]);
  const [last5min, setLast5min] = useState<ActivityRow[]>([]);
  const [today, setToday] = useState<ActivityRow[]>([]);
  const [weekData, setWeekData] = useState<ActivityRow[]>([]);
  const [monthData, setMonthData] = useState<ActivityRow[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [selectedRank, setSelectedRank] = useState<string | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Poll presence state
  useEffect(() => {
    const poll = () => {
      const state = getPresenceState();
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
    };
    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, []);

  // Fetch history
  const fetchHistory = useCallback(async () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [r5, rToday, rWeek, rMonth] = await Promise.all([
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
      supabase
        .from('user_activity_log')
        .select('*')
        .gte('last_seen_at', startOfWeek.toISOString())
        .order('last_seen_at', { ascending: false }),
      supabase
        .from('user_activity_log')
        .select('*')
        .gte('last_seen_at', startOfMonth.toISOString())
        .order('last_seen_at', { ascending: false }),
    ]);

    if (r5.data) setLast5min(r5.data as ActivityRow[]);
    if (rToday.data) setToday(rToday.data as ActivityRow[]);
    if (rWeek.data) setWeekData(rWeek.data as ActivityRow[]);
    if (rMonth.data) setMonthData(rMonth.data as ActivityRow[]);
  }, []);

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 15_000);
    return () => clearInterval(interval);
  }, [fetchHistory]);

  const blocks: BlockData[] = [
    {
      key: 'realtime',
      title: 'Em tempo real',
      subtitle: `${realtimeUsers.length} online`,
      icon: Wifi,
      gradientFrom: 'from-emerald-500/30',
      gradientTo: 'to-emerald-900/20',
      iconBg: 'bg-emerald-500/20',
      badgeBg: 'bg-emerald-500',
      count: realtimeUsers.length,
      users: realtimeUsers.map((u) => ({
        id: u.user_id, email: u.email, name: u.display_name,
        route: u.current_route, time: u.online_at, isOnline: true,
      })),
    },
    {
      key: 'last5',
      title: 'Últimos 5 min',
      subtitle: `${last5min.length} usuários`,
      icon: Clock,
      gradientFrom: 'from-blue-500/30',
      gradientTo: 'to-blue-900/20',
      iconBg: 'bg-blue-500/20',
      badgeBg: 'bg-blue-500',
      count: last5min.length,
      users: last5min.map((u) => ({
        id: u.user_id, email: u.email ?? '', name: u.display_name ?? '',
        route: u.current_route, time: u.last_seen_at,
        isOnline: realtimeUsers.some((r) => r.user_id === u.user_id),
      })),
    },
    {
      key: 'today',
      title: 'Hoje',
      subtitle: `${today.length} usuários`,
      icon: CalendarDays,
      gradientFrom: 'from-purple-500/30',
      gradientTo: 'to-purple-900/20',
      iconBg: 'bg-purple-500/20',
      badgeBg: 'bg-purple-500',
      count: today.length,
      users: today.map((u) => ({
        id: u.user_id, email: u.email ?? '', name: u.display_name ?? '',
        route: u.current_route, time: u.last_seen_at,
        isOnline: realtimeUsers.some((r) => r.user_id === u.user_id),
      })),
    },
  ];

  const rankBlocks: RankBlock[] = useMemo(() => [
    {
      key: 'rank-day',
      title: 'Hoje',
      icon: Trophy,
      gradientFrom: 'from-amber-500/25',
      gradientTo: 'to-amber-900/15',
      iconBg: 'bg-amber-500/20',
      badgeBg: 'bg-amber-500',
      ranks: buildRouteRank(today),
    },
    {
      key: 'rank-week',
      title: 'Semana',
      icon: BarChart3,
      gradientFrom: 'from-cyan-500/25',
      gradientTo: 'to-cyan-900/15',
      iconBg: 'bg-cyan-500/20',
      badgeBg: 'bg-cyan-500',
      ranks: buildRouteRank(weekData),
    },
    {
      key: 'rank-month',
      title: 'Mês',
      icon: BarChart3,
      gradientFrom: 'from-rose-500/25',
      gradientTo: 'to-rose-900/15',
      iconBg: 'bg-rose-500/20',
      badgeBg: 'bg-rose-500',
      ranks: buildRouteRank(monthData),
    },
  ], [today, weekData, monthData]);

  const activeBlock = blocks.find((b) => b.key === selectedBlock);
  const activeRank = rankBlocks.find((b) => b.key === selectedRank);

  const isDetail = !!selectedBlock || !!selectedRank;
  const detailTitle = selectedBlock
    ? activeBlock?.title
    : selectedRank
      ? `Rank — ${activeRank?.title}`
      : '';

  const goBack = () => {
    if (selectedBlock) setSelectedBlock(null);
    else if (selectedRank) setSelectedRank(null);
    else navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={goBack} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <Users className="w-5 h-5 text-primary" />
          <h1 className="font-display text-lg font-bold text-foreground">
            {isDetail ? detailTitle : 'Usuários Online'}
          </h1>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!isDetail ? (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -30 }}
            className="p-4 max-w-3xl mx-auto space-y-6"
          >
            {/* ── User cards row ── */}
            <div className="grid grid-cols-3 gap-3">
              {blocks.map((block, bi) => {
                const Icon = block.icon;
                return (
                  <motion.button
                    key={block.key}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: bi * 0.08 }}
                    onClick={() => setSelectedBlock(block.key)}
                    className={`relative rounded-2xl bg-gradient-to-br ${block.gradientFrom} ${block.gradientTo} border border-border/40 p-4 flex flex-col items-center gap-2 hover:border-border transition-all active:scale-95`}
                  >
                    <span className={`absolute -top-2 -right-2 ${block.badgeBg} text-background text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center shadow-lg`}>
                      {block.count}
                    </span>

                    <div className={`w-12 h-12 rounded-2xl ${block.iconBg} flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-foreground" />
                    </div>

                    <span className="text-xs font-semibold text-foreground text-center leading-tight">
                      {block.title}
                    </span>

                    <span className="text-[10px] text-muted-foreground">
                      {block.subtitle}
                    </span>

                    {block.key === 'realtime' && block.count > 0 && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        ao vivo
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* ── Online summary ── */}
            {realtimeUsers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-secondary/50 border border-border/30 p-3"
              >
                <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Online agora
                </p>
                <div className="space-y-2">
                  {realtimeUsers.slice(0, 5).map((u) => (
                    <div key={u.user_id} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-foreground uppercase">
                        {(u.display_name || u.email)?.[0] ?? '?'}
                      </div>
                      <span className="text-xs text-foreground truncate flex-1">{u.display_name || u.email}</span>
                      <span className="text-[10px] text-primary truncate max-w-[80px]">{getRouteLabel(u.current_route)}</span>
                    </div>
                  ))}
                  {realtimeUsers.length > 5 && (
                    <p className="text-[10px] text-muted-foreground text-center">+{realtimeUsers.length - 5} mais</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── Rank de Funções ── */}
            <div>
              <p className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-primary" />
                Rank de Funções
              </p>
              <div className="grid grid-cols-3 gap-3">
                {rankBlocks.map((rb, bi) => {
                  const Icon = rb.icon;
                  const top = rb.ranks[0];
                  return (
                    <motion.button
                      key={rb.key}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + bi * 0.08 }}
                      onClick={() => setSelectedRank(rb.key)}
                      className={`relative rounded-2xl bg-gradient-to-br ${rb.gradientFrom} ${rb.gradientTo} border border-border/40 p-4 flex flex-col items-center gap-2 hover:border-border transition-all active:scale-95`}
                    >
                      <span className={`absolute -top-2 -right-2 ${rb.badgeBg} text-background text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center shadow-lg`}>
                        {rb.ranks.length}
                      </span>

                      <div className={`w-12 h-12 rounded-2xl ${rb.iconBg} flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-foreground" />
                      </div>

                      <span className="text-xs font-semibold text-foreground text-center leading-tight">
                        {rb.title}
                      </span>

                      {top && (
                        <span className="text-[10px] text-muted-foreground truncate max-w-full text-center">
                          🥇 {top.label}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : selectedBlock && activeBlock ? (
          /* ── User Detail ── */
          <motion.div
            key="user-detail"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            className="p-4 max-w-3xl mx-auto space-y-2"
          >
            {activeBlock.users.length === 0 ? (
              <div className="rounded-2xl bg-secondary/30 border border-border/30 py-12 text-center">
                <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum usuário neste período</p>
              </div>
            ) : (
              activeBlock.users.map((u, i) => (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-xl bg-secondary/40 border border-border/30 p-3 flex items-center gap-3"
                >
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-foreground uppercase">
                      {(u.name || u.email)?.[0] ?? '?'}
                    </div>
                    {u.isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background animate-pulse" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{u.name || u.email}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <div className="text-right shrink-0 space-y-0.5">
                    <p className="text-[11px] font-medium text-primary truncate max-w-[110px]">
                      {getRouteLabel(u.route)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{formatPreciseTime(u.time)}</p>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        ) : selectedRank && activeRank ? (
          /* ── Rank Detail ── */
          <motion.div
            key="rank-detail"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            className="p-4 max-w-3xl mx-auto space-y-2"
          >
            {activeRank.ranks.length === 0 ? (
              <div className="rounded-2xl bg-secondary/30 border border-border/30 py-12 text-center">
                <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Sem dados neste período</p>
              </div>
            ) : (
              activeRank.ranks.map((r, i) => {
                const maxCount = activeRank.ranks[0]?.count || 1;
                const pct = Math.round((r.count / maxCount) * 100);
                return (
                  <motion.div
                    key={r.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="rounded-xl bg-secondary/40 border border-border/30 p-3"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-lg font-bold ${i < 3 ? MEDAL_COLORS[i] : 'text-muted-foreground'}`}>
                        {i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`}
                      </span>
                      <span className="text-sm font-semibold text-foreground flex-1 truncate">{r.label}</span>
                      <span className="text-sm font-bold text-primary">{r.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: i * 0.06, duration: 0.5 }}
                        className={`h-full rounded-full ${activeRank.badgeBg}`}
                      />
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default AdminMonitorUsuarios;
