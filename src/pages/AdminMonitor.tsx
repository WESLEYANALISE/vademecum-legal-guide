import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Clock, Play, Loader2, Activity, Key, Zap, MinusCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CronJob {
  jobid: number;
  jobname: string;
  schedule: string;
  active: boolean;
  functionName: string | null;
}

interface ApiKeyStatus {
  status: 'ok' | 'warning' | 'error' | 'missing';
  message: string;
}

interface MonitorData {
  cronJobs: CronJob[];
  apiKeys: Record<string, ApiKeyStatus>;
  edgeFunctions: string[];
  timestamp: string;
}

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'ok': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    case 'error': return <XCircle className="w-4 h-4 text-red-400" />;
    case 'missing': return <MinusCircle className="w-4 h-4 text-muted-foreground" />;
    default: return <Clock className="w-4 h-4 text-muted-foreground" />;
  }
};

const statusBadgeVariant = (status: string) => {
  switch (status) {
    case 'ok': return 'default';
    case 'warning': return 'secondary';
    case 'error': return 'destructive';
    default: return 'outline';
  }
};

const AdminMonitor = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<MonitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [invoking, setInvoking] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('admin-monitor');
      if (error) throw error;
      setData(result);
    } catch (e: any) {
      toast.error('Erro ao carregar monitoramento: ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const invokeFunction = async (fnName: string) => {
    setInvoking(fnName);
    try {
      // Some functions require specific payloads to avoid validation errors
      const payloads: Record<string, object> = {
        'otimizar-imagem': { url: 'https://via.placeholder.com/1' },
      };
      const body = payloads[fnName] || {};
      const { error } = await supabase.functions.invoke(fnName, { body });
      if (error) throw error;
      toast.success(`${fnName} executada com sucesso`);
    } catch (e: any) {
      toast.error(`Erro ao executar ${fnName}: ${e.message || ''}`);
    } finally {
      setInvoking(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <ArrowLeft className="w-4 h-4 text-foreground" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-foreground">Monitoramento</h1>
              {data && (
                <p className="text-[11px] text-muted-foreground">
                  Atualizado: {new Date(data.timestamp).toLocaleTimeString('pt-BR')}
                </p>
              )}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-5">
        {/* API Keys */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Key className="w-5 h-5 text-primary" />
              Chaves de API
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading && !data ? (
              <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : data?.apiKeys ? (
              Object.entries(data.apiKeys).map(([name, info]) => (
                <div key={name} className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-2.5">
                    <StatusIcon status={info.status} />
                    <span className="text-sm font-medium text-foreground">{name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{info.message}</span>
                    <Badge variant={statusBadgeVariant(info.status) as any} className="text-[10px]">
                      {info.status === 'ok' ? 'Ativa' : info.status === 'warning' ? 'Alerta' : info.status === 'error' ? 'Erro' : 'Ausente'}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Sem dados</p>
            )}
          </CardContent>
        </Card>

        {/* Edge Functions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="w-5 h-5 text-primary" />
              Edge Functions ({data?.edgeFunctions?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && !data ? (
              <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {data?.edgeFunctions?.map((fn) => (
                  <div key={fn} className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-xs font-mono text-foreground">{fn}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={invoking === fn || fn === 'admin-monitor'}
                      onClick={() => invokeFunction(fn)}
                    >
                      {invoking === fn ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5 text-primary" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cron Jobs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="w-5 h-5 text-primary" />
              Cron Jobs ({data?.cronJobs?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading && !data ? (
              <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : data?.cronJobs && data.cronJobs.length > 0 ? (
              data.cronJobs.map((job) => (
                <div key={job.jobid} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full ${job.active ? 'bg-emerald-400' : 'bg-muted-foreground'}`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{job.jobname}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{job.schedule}</p>
                    </div>
                  </div>
                  <Badge variant={job.active ? 'default' : 'outline'} className="text-[10px]">
                    {job.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum cron job encontrado. Os jobs podem não estar acessíveis via API.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminMonitor;
