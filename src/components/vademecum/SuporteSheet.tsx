import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface SuporteSheetProps {
  open: boolean;
  onClose: () => void;
}

const SuporteSheet = ({ open, onClose }: SuporteSheetProps) => {
  const { user } = useAuth();
  const [assunto, setAssunto] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!assunto.trim() || !mensagem.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.from('mensagens_suporte').insert({
        user_id: user!.id,
        email: user!.email || '',
        assunto: assunto.trim(),
        mensagem: mensagem.trim(),
      });
      if (error) throw error;
      toast.success('Mensagem enviada! Responderemos em breve.');
      setAssunto('');
      setMensagem('');
      onClose();
    } catch {
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh]">
        <SheetHeader>
          <SheetTitle className="font-display">Fale com o Suporte</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 pt-4">
          <div>
            <label className="text-sm font-medium text-foreground font-body mb-1 block">Assunto</label>
            <Input
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
              placeholder="Ex: Problema ao carregar artigos"
              maxLength={100}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground font-body mb-1 block">Mensagem</label>
            <Textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Descreva seu problema ou sugestão..."
              rows={4}
              maxLength={1000}
            />
          </div>
          <Button onClick={handleSubmit} disabled={sending} className="w-full gap-2">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Enviar mensagem
          </Button>
          <p className="text-[11px] text-muted-foreground text-center font-body">
            Sua mensagem será enviada para a equipe do Vacatio
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SuporteSheet;
