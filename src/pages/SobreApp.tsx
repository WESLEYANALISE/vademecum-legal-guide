import { ArrowLeft, Scale, BookOpen, Brain, Gamepad2, Newspaper, Mic, Landmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import vacatioLogo from '@/assets/logo-vacatio.jpeg';

const SobreApp = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
        <button onClick={() => navigate(-1)} className="w-9 h-9 flex items-center justify-center rounded-full bg-secondary">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-display text-lg font-bold text-foreground">Sobre o App</h1>
      </header>

      <div className="p-4 space-y-6 max-w-lg mx-auto pb-16">
        {/* Logo + Title */}
        <div className="flex flex-col items-center gap-3 py-6">
          <img src={vacatioLogo} alt="Vacatio" className="w-20 h-20 rounded-2xl object-cover border-2 border-primary/30" />
          <h2 className="font-display text-2xl font-bold text-foreground">Vacatio</h2>
          <p className="text-sm text-muted-foreground font-body">Vade Mecum 2026 • Versão 1.0</p>
        </div>

        {/* O que é */}
        <section className="space-y-2">
          <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" /> O que é o Vacatio?
          </h3>
          <p className="text-sm text-muted-foreground font-body leading-relaxed">
            O Vacatio é uma plataforma jurídica completa, pensada para estudantes de Direito, concurseiros e profissionais da área.
            Reunimos toda a legislação brasileira em um único lugar, com ferramentas inteligentes que facilitam o estudo e a consulta diária.
          </p>
        </section>

        {/* Para quem */}
        <section className="space-y-2">
          <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" /> Para quem é?
          </h3>
          <ul className="text-sm text-muted-foreground font-body space-y-1.5 ml-1">
            <li>• Estudantes de Direito que precisam consultar leis com agilidade</li>
            <li>• Concurseiros que buscam ferramentas de estudo otimizadas</li>
            <li>• Advogados e profissionais jurídicos em sua rotina</li>
            <li>• Qualquer pessoa interessada em conhecer a legislação brasileira</li>
          </ul>
        </section>

        {/* Funcionalidades */}
        <section className="space-y-3">
          <h3 className="font-display text-base font-bold text-foreground">Principais funcionalidades</h3>
          <div className="grid grid-cols-1 gap-2.5">
            {[
              { icon: Landmark, title: 'Legislação Completa', desc: 'Constituição, Códigos, Estatutos, Leis Ordinárias, Decretos e Súmulas' },
              { icon: Brain, title: 'Estudo com IA', desc: 'Questões, flashcards, mapas mentais e resumos gerados por inteligência artificial' },
              { icon: Gamepad2, title: 'Gamificação', desc: 'Jogos educativos como forca, caça-palavras e cruzadas jurídicas' },
              { icon: Newspaper, title: 'Radar Legislativo', desc: 'Monitoramento em tempo real de projetos de lei e votações no Congresso' },
              { icon: Mic, title: 'Narração de Artigos', desc: 'Ouça os artigos de lei narrados por IA para estudar em qualquer lugar' },
              { icon: BookOpen, title: 'Biblioteca', desc: 'Upload e leitura de PDFs jurídicos com formatação inteligente' },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border">
                <f.icon className="w-5 h-5 text-primary/70 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground font-body">{f.title}</p>
                  <p className="text-xs text-muted-foreground font-body">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Credits */}
        <section className="pt-4 border-t border-border text-center space-y-1">
          <p className="text-xs text-muted-foreground font-body">Desenvolvido com 💛 para a comunidade jurídica brasileira</p>
          <p className="text-xs text-muted-foreground font-body">Vacatio © 2026 — Todos os direitos reservados</p>
        </section>
      </div>
    </div>
  );
};

export default SobreApp;
