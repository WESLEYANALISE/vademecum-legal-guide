import { useEffect, useState } from 'react';
import { Users, Landmark, FileText, Vote, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { fetchProposicoes, fetchVotacoes } from '@/services/radarService';

const RadarDashboard = () => {
  const [stats, setStats] = useState({ deputados: 0, senadores: 0, proposicoes: 0, votacoes: 0 });
  const [recentProps, setRecentProps] = useState<any[]>([]);
  const [recentVotes, setRecentVotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [depCount, senCount, props, votes] = await Promise.all([
        supabase.from('radar_deputados').select('id', { count: 'exact', head: true }),
        supabase.from('radar_senadores').select('codigo', { count: 'exact', head: true }),
        fetchProposicoes(undefined, undefined, 1),
        fetchVotacoes(),
      ]);

      setStats({
        deputados: depCount.count || 0,
        senadores: senCount.count || 0,
        proposicoes: props.length,
        votacoes: votes.length,
      });
      setRecentProps(props.slice(0, 5));
      setRecentVotes(votes.slice(0, 5));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  const cards = [
    { label: 'Deputados', value: stats.deputados, icon: Users, color: 'text-blue-400' },
    { label: 'Senadores', value: stats.senadores, icon: Landmark, color: 'text-emerald-400' },
    { label: 'Proposições', value: stats.proposicoes, icon: FileText, color: 'text-amber-400' },
    { label: 'Votações', value: stats.votacoes, icon: Vote, color: 'text-purple-400' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label} className="bg-card/50 border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted/50 ${c.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold font-display">{c.value}</p>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent propositions */}
      <div>
        <h3 className="font-display text-sm font-semibold text-foreground mb-3">Proposições Recentes</h3>
        <div className="space-y-2">
          {recentProps.map((p: any, i: number) => (
            <Card key={i} className="bg-card/50 border-border/50">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <span className="text-xs font-mono font-bold text-primary shrink-0">
                    {p.sigla_tipo} {p.numero}/{p.ano}
                  </span>
                  <p className="text-xs text-muted-foreground line-clamp-2">{p.ementa}</p>
                </div>
              </CardContent>
            </Card>
          ))}
          {recentProps.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Nenhuma proposição encontrada. Execute a função de popular dados.
            </p>
          )}
        </div>
      </div>

      {/* Recent votes */}
      <div>
        <h3 className="font-display text-sm font-semibold text-foreground mb-3">Votações Recentes</h3>
        <div className="space-y-2">
          {recentVotes.map((v: any, i: number) => (
            <Card key={i} className="bg-card/50 border-border/50">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{v.descricao || 'Votação'}</p>
                  {v.resultado && (
                    <span className={`text-xs font-bold shrink-0 ${
                      v.resultado === 'Aprovado' ? 'text-emerald-400' : 'text-destructive'
                    }`}>
                      {v.resultado}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {recentVotes.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Nenhuma votação encontrada.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RadarDashboard;
