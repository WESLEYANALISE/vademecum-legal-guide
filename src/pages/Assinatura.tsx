import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Crown, Zap, Check, Sparkles, Shield, BookOpen, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const benefits = [
  { icon: BookOpen, text: "Acesso a todas as legislações" },
  { icon: Brain, text: "Questões ilimitadas com IA" },
  { icon: Sparkles, text: "Explicações, resumos e mapas mentais" },
  { icon: Shield, text: "Radar Legislativo em tempo real" },
];

export default function Assinatura() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [loading, setLoading] = useState<"mensal" | "anual" | null>(null);

  const handleAssinar = async (plano: "mensal" | "anual") => {
    if (!session) {
      toast.error("Faça login para assinar");
      return;
    }
    setLoading(plano);
    try {
      const { data, error } = await supabase.functions.invoke("criar-assinatura", {
        body: { plano },
      });
      if (error) throw error;
      if (data?.paymentLink) {
        window.open(data.paymentLink, "_blank");
        toast.success("Redirecionando para o pagamento...");
      } else {
        toast.error("Link de pagamento não disponível");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao criar assinatura. Tente novamente.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-muted/60 transition">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            <h1 className="text-lg font-bold text-foreground">Assinatura</h1>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Hero */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg mb-2">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Vacatio Premium</h2>
          <p className="text-sm text-muted-foreground">
            Desbloqueie todo o potencial dos seus estudos jurídicos
          </p>
        </div>

        {/* Benefits */}
        <div className="rounded-2xl border border-border/60 bg-card/50 p-4 space-y-3">
          {benefits.map((b, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                <b.icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm text-foreground">{b.text}</span>
              <Check className="w-4 h-4 text-emerald-500 ml-auto flex-shrink-0" />
            </div>
          ))}
        </div>

        {/* Plans */}
        <div className="space-y-4">
          {/* Annual - featured */}
          <div className="relative rounded-2xl border-2 border-amber-500/60 bg-gradient-to-br from-amber-500/10 to-amber-600/5 p-5 space-y-4">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white border-0 px-3 py-0.5 text-xs font-semibold">
              Mais popular
            </Badge>
            <div className="flex items-end justify-between pt-1">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Plano Anual</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-extrabold text-foreground">R$ 119,90</span>
                  <span className="text-sm text-muted-foreground">/ano</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">≈ R$ 9,99/mês</p>
              </div>
              <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-600 border-0 text-xs font-semibold">
                Economia de 54%
              </Badge>
            </div>
            <Button
              onClick={() => handleAssinar("anual")}
              disabled={loading !== null}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-base shadow-lg shadow-amber-500/25"
            >
              {loading === "anual" ? (
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4 animate-pulse" /> Processando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Crown className="w-4 h-4" /> Assinar Anual
                </span>
              )}
            </Button>
          </div>

          {/* Monthly */}
          <div className="rounded-2xl border border-border/60 bg-card/50 p-5 space-y-4">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Plano Mensal</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-extrabold text-foreground">R$ 21,90</span>
                <span className="text-sm text-muted-foreground">/mês</span>
              </div>
            </div>
            <Button
              onClick={() => handleAssinar("mensal")}
              disabled={loading !== null}
              variant="outline"
              className="w-full h-12 rounded-xl font-semibold text-base border-border"
            >
              {loading === "mensal" ? (
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4 animate-pulse" /> Processando...
                </span>
              ) : (
                "Assinar Mensal"
              )}
            </Button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground px-4">
          Pagamento seguro via Asaas. Cancele a qualquer momento.
          Ao assinar, você concorda com os Termos de Uso.
        </p>
      </div>
    </div>
  );
}
