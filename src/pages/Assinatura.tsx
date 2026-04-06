import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Crown, Zap, Check, Sparkles, Shield, BookOpen, Brain, CreditCard, Copy, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const benefits = [
  { icon: BookOpen, text: "Acesso a todas as legislações" },
  { icon: Brain, text: "Questões ilimitadas com IA" },
  { icon: Sparkles, text: "Explicações, resumos e mapas mentais" },
  { icon: Shield, text: "Radar Legislativo em tempo real" },
];

// ── Masks ──
const maskCard = (v: string) => v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
const maskCpf = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
};
const maskCep = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0,5)}-${d.slice(5)}`;
};
const maskExpiry = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  if (d.length <= 2) return d;
  return `${d.slice(0,2)}/${d.slice(2)}`;
};
const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
};

type Plano = "mensal" | "anual";

export default function Assinatura() {
  const navigate = useNavigate();
  const { session } = useAuth();

  // ── View state ──
  const [view, setView] = useState<"plans" | "checkout">("plans");
  const [selectedPlano, setSelectedPlano] = useState<Plano>("anual");

  // ── Card form ──
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cpf, setCpf] = useState("");
  const [cep, setCep] = useState("");
  const [phone, setPhone] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [addressData, setAddressData] = useState<{ logradouro?: string; bairro?: string; localidade?: string; uf?: string } | null>(null);
  const [installments, setInstallments] = useState("1");

  // ── PIX state ──
  const [pixQrImage, setPixQrImage] = useState<string | null>(null);
  const [pixPayload, setPixPayload] = useState<string | null>(null);
  const [pixPaymentId, setPixPaymentId] = useState<string | null>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [pixConfirmed, setPixConfirmed] = useState(false);

  // ── Loading ──
  const [processing, setProcessing] = useState(false);

  // ── CEP lookup ──
  useEffect(() => {
    const raw = cep.replace(/\D/g, '');
    if (raw.length === 8) {
      fetch(`https://viacep.com.br/ws/${raw}/json/`)
        .then(r => r.json())
        .then(d => { if (!d.erro) setAddressData(d); })
        .catch(() => {});
    } else {
      setAddressData(null);
    }
  }, [cep]);

  // ── PIX polling ──
  useEffect(() => {
    if (!pixPaymentId || pixConfirmed) return;
    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase.functions.invoke("processar-pagamento", {
          body: { action: "check-pix-status", paymentId: pixPaymentId },
        });
        if (!error && (data?.status === 'RECEIVED' || data?.status === 'CONFIRMED')) {
          setPixConfirmed(true);
          toast.success("Pagamento PIX confirmado! 🎉");
          clearInterval(interval);
        }
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [pixPaymentId, pixConfirmed]);

  // ── Get remote IP ──
  const getRemoteIp = useCallback(async () => {
    try {
      const r = await fetch('https://api.ipify.org?format=json');
      const d = await r.json();
      return d.ip;
    } catch { return '0.0.0.0'; }
  }, []);

  // ── Handle select plan ──
  const handleSelectPlan = (plano: Plano) => {
    if (!session) { toast.error("Faça login para assinar"); return; }
    setSelectedPlano(plano);
    setView("checkout");
  };

  // ── Handle card payment ──
  const handleCardPayment = async () => {
    if (!cardNumber || !cardName || !cardExpiry || !cardCvv || !cpf || !cep) {
      toast.error("Preencha todos os campos");
      return;
    }
    setProcessing(true);
    try {
      const [month, year] = cardExpiry.split('/');
      const remoteIp = await getRemoteIp();

      const { data, error } = await supabase.functions.invoke("processar-pagamento", {
        body: {
          plano: selectedPlano,
          metodo: 'cartao',
          cpf,
          cep,
          numero_endereco: addressNumber || 'S/N',
          telefone: phone,
          remoteIp,
          installments: selectedPlano === 'anual' ? parseInt(installments) : 1,
          creditCard: {
            holderName: cardName,
            number: cardNumber,
            expiryMonth: month,
            expiryYear: `20${year}`,
            ccv: cardCvv,
          },
        },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success("Pagamento processado com sucesso! 🎉");
        navigate("/");
      } else {
        toast.error(data?.error || "Erro no pagamento");
      }
    } catch (err: any) {
      console.error(err);
      const details = err?.message || '';
      toast.error(`Erro ao processar pagamento. ${details}`);
    } finally {
      setProcessing(false);
    }
  };

  // ── Handle PIX ──
  const handlePixPayment = async () => {
    if (!cpf || !cep) { toast.error("Preencha CPF e CEP"); return; }
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("processar-pagamento", {
        body: { plano: 'anual', metodo: 'pix', cpf, cep, numero_endereco: addressNumber || 'S/N', telefone: phone },
      });
      if (error) throw error;
      if (data?.success) {
        setPixQrImage(data.qrCodeImage);
        setPixPayload(data.qrCodePayload);
        setPixPaymentId(data.paymentId);
      } else {
        toast.error(data?.error || "Erro ao gerar PIX");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao gerar PIX");
    } finally {
      setProcessing(false);
    }
  };

  const copyPix = () => {
    if (pixPayload) {
      navigator.clipboard.writeText(pixPayload);
      setPixCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setPixCopied(false), 3000);
    }
  };

  const valor = selectedPlano === 'mensal' ? 21.90 : 119.90;
  const valorParcela = selectedPlano === 'anual' ? (119.90 / parseInt(installments)).toFixed(2) : null;

  // ── PLANS VIEW ──
  if (view === "plans") {
    return (
      <div className="min-h-screen bg-background">
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
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg mb-2">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Vacatio Premium</h2>
            <p className="text-sm text-muted-foreground">Desbloqueie todo o potencial dos seus estudos jurídicos</p>
          </div>

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

          {/* Annual */}
          <div className="relative rounded-2xl border-2 border-amber-500/60 bg-gradient-to-br from-amber-500/10 to-amber-600/5 p-5 space-y-4">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white border-0 px-3 py-0.5 text-xs font-semibold">Mais popular</Badge>
            <div className="flex items-end justify-between pt-1">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Plano Anual</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-extrabold text-foreground">R$ 119,90</span>
                  <span className="text-sm text-muted-foreground">/ano</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">ou até 12x de R$ 9,99</p>
              </div>
              <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-600 border-0 text-xs font-semibold">Economia de 54%</Badge>
            </div>
            <Button onClick={() => handleSelectPlan("anual")} className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-base shadow-lg shadow-amber-500/25">
              <Crown className="w-4 h-4 mr-2" /> Assinar Anual
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
            <Button onClick={() => handleSelectPlan("mensal")} variant="outline" className="w-full h-12 rounded-xl font-semibold text-base border-border">
              Assinar Mensal
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground px-4">Pagamento seguro via Asaas. Cancele a qualquer momento.</p>
        </div>
      </div>
    );
  }

  // ── CHECKOUT VIEW ──
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => { setView("plans"); setPixQrImage(null); setPixPaymentId(null); }} className="p-1.5 rounded-full hover:bg-muted/60 transition">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground">Checkout</h1>
          </div>
          <Badge variant="secondary" className="ml-auto text-xs">{selectedPlano === 'mensal' ? 'Mensal' : 'Anual'}</Badge>
        </div>
      </div>

      <div className="px-4 py-6 max-w-lg mx-auto space-y-5">
        {/* PIX confirmed */}
        {pixConfirmed && (
          <div className="text-center space-y-4 py-8">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
            <h2 className="text-xl font-bold text-foreground">Pagamento confirmado!</h2>
            <p className="text-sm text-muted-foreground">Seu plano Premium já está ativo.</p>
            <Button onClick={() => navigate("/")} className="rounded-xl">Voltar ao app</Button>
          </div>
        )}

        {!pixConfirmed && (
          <Tabs defaultValue="cartao" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="cartao" className="flex-1 gap-1.5"><CreditCard className="w-4 h-4" /> Cartão</TabsTrigger>
              {selectedPlano === 'anual' && (
                <TabsTrigger value="pix" className="flex-1 gap-1.5">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.66 6.34l-3.54 3.54a2 2 0 01-2.83 0L7.76 6.34a2 2 0 00-2.83 0L2.1 9.17a2 2 0 000 2.83l2.83 2.83a2 2 0 000 2.83l2.83 2.83a2 2 0 002.83 0l3.54-3.54a2 2 0 012.83 0l3.54 3.54a2 2 0 002.83 0l2.83-2.83a2 2 0 000-2.83l-2.83-2.83a2 2 0 010-2.83l2.83-2.83a2 2 0 000-2.83L20.49 6.34a2 2 0 00-2.83 0z"/></svg>
                  PIX
                </TabsTrigger>
              )}
            </TabsList>

            {/* ── CARTÃO TAB ── */}
            <TabsContent value="cartao" className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Número do cartão</Label>
                <Input placeholder="0000 0000 0000 0000" value={cardNumber} onChange={e => setCardNumber(maskCard(e.target.value))} className="rounded-xl h-11" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Nome no cartão</Label>
                <Input placeholder="Nome como está no cartão" value={cardName} onChange={e => setCardName(e.target.value.toUpperCase())} className="rounded-xl h-11" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Validade</Label>
                  <Input placeholder="MM/AA" value={cardExpiry} onChange={e => setCardExpiry(maskExpiry(e.target.value))} className="rounded-xl h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">CVV</Label>
                  <Input placeholder="000" maxLength={4} value={cardCvv} onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} className="rounded-xl h-11" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">CPF do titular</Label>
                <Input placeholder="000.000.000-00" value={cpf} onChange={e => setCpf(maskCpf(e.target.value))} className="rounded-xl h-11" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Telefone</Label>
                <Input placeholder="(00) 00000-0000" value={phone} onChange={e => setPhone(maskPhone(e.target.value))} className="rounded-xl h-11" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs text-muted-foreground">CEP</Label>
                  <Input placeholder="00000-000" value={cep} onChange={e => setCep(maskCep(e.target.value))} className="rounded-xl h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Nº</Label>
                  <Input placeholder="Nº" value={addressNumber} onChange={e => setAddressNumber(e.target.value)} className="rounded-xl h-11" />
                </div>
              </div>
              {addressData && (
                <div className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground space-y-0.5">
                  <p>{addressData.logradouro}</p>
                  <p>{addressData.bairro} - {addressData.localidade}/{addressData.uf}</p>
                </div>
              )}

              {selectedPlano === 'anual' && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Parcelas</Label>
                  <Select value={installments} onValueChange={setInstallments}>
                    <SelectTrigger className="rounded-xl h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                        <SelectItem key={n} value={String(n)}>
                          {n}x de R$ {(119.90 / n).toFixed(2)} {n === 1 ? '(à vista)' : 'sem juros'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button onClick={handleCardPayment} disabled={processing} className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold text-base mt-2">
                {processing ? (
                  <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Processando...</span>
                ) : (
                  `Pagar R$ ${selectedPlano === 'anual' && parseInt(installments) > 1 ? `${parseInt(installments)}x de R$ ${valorParcela}` : valor.toFixed(2).replace('.', ',')}`
                )}
              </Button>
            </TabsContent>

            {/* ── PIX TAB ── */}
            {selectedPlano === 'anual' && (
              <TabsContent value="pix" className="space-y-4 mt-4">
                {!pixQrImage ? (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">CPF</Label>
                      <Input placeholder="000.000.000-00" value={cpf} onChange={e => setCpf(maskCpf(e.target.value))} className="rounded-xl h-11" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2 space-y-1.5">
                        <Label className="text-xs text-muted-foreground">CEP</Label>
                        <Input placeholder="00000-000" value={cep} onChange={e => setCep(maskCep(e.target.value))} className="rounded-xl h-11" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Nº</Label>
                        <Input placeholder="Nº" value={addressNumber} onChange={e => setAddressNumber(e.target.value)} className="rounded-xl h-11" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Telefone</Label>
                      <Input placeholder="(00) 00000-0000" value={phone} onChange={e => setPhone(maskPhone(e.target.value))} className="rounded-xl h-11" />
                    </div>
                    <Button onClick={handlePixPayment} disabled={processing} className="w-full h-12 rounded-xl font-semibold text-base">
                      {processing ? (
                        <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Gerando PIX...</span>
                      ) : (
                        `Gerar PIX — R$ 119,90`
                      )}
                    </Button>
                  </>
                ) : (
                  <div className="text-center space-y-4">
                    <p className="text-sm font-medium text-foreground">Escaneie o QR Code ou copie o código</p>
                    <div className="inline-block p-4 bg-white rounded-2xl shadow-md">
                      <img src={`data:image/png;base64,${pixQrImage}`} alt="QR Code PIX" className="w-52 h-52" />
                    </div>
                    <div className="relative">
                      <Input readOnly value={pixPayload || ''} className="rounded-xl h-11 pr-12 text-xs font-mono" />
                      <button onClick={copyPix} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-muted/60 transition">
                        {pixCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                      </button>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Aguardando confirmação do pagamento...
                    </div>
                  </div>
                )}
              </TabsContent>
            )}
          </Tabs>
        )}

        <p className="text-center text-xs text-muted-foreground mt-4">🔒 Criptografia SSL · Processado por Asaas</p>
      </div>
    </div>
  );
}
