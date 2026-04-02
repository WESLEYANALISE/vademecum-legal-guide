import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ThemePalette {
  id: string;
  name: string;
  description: string;
  colors: Record<string, string>;
}

function p(bg: string, fg: string, card: string, cardFg: string, primary: string, primaryFg: string, primaryLight: string, secondary: string, secondaryFg: string, muted: string, mutedFg: string, accent: string, accentFg: string, border: string, ring: string, copper: string, copperLight: string, copperDark: string): Record<string, string> {
  return {
    '--background': bg, '--foreground': fg,
    '--card': card, '--card-foreground': cardFg,
    '--popover': card, '--popover-foreground': cardFg,
    '--primary': primary, '--primary-foreground': primaryFg, '--primary-light': primaryLight,
    '--secondary': secondary, '--secondary-foreground': secondaryFg,
    '--muted': muted, '--muted-foreground': mutedFg,
    '--accent': accent, '--accent-foreground': accentFg,
    '--destructive': '0 70% 55%', '--destructive-foreground': '0 0% 100%',
    '--border': border, '--input': border, '--ring': ring,
    '--sidebar-background': bg, '--sidebar-foreground': secondaryFg,
    '--sidebar-primary': primary, '--sidebar-primary-foreground': primaryFg,
    '--sidebar-accent': muted, '--sidebar-accent-foreground': secondaryFg,
    '--sidebar-border': border, '--sidebar-ring': ring,
    '--copper': copper, '--copper-light': copperLight, '--copper-dark': copperDark,
  };
}

const PALETTES: ThemePalette[] = [
  // 1 — Grafite Dourado (padrão) — cinza escuro neutro + amarelo ouro vibrante
  { id: 'grafite-dourado', name: 'Grafite Dourado', description: 'Elegância escura com destaques em ouro',
    colors: p('220 12% 12%','45 15% 95%','220 10% 16%','45 15% 95%','45 85% 55%','220 12% 10%','45 90% 65%','220 8% 21%','45 10% 90%','220 8% 18%','220 8% 55%','42 75% 50%','220 12% 10%','220 8% 24%','45 85% 55%','45 85% 55%','45 75% 65%','45 60% 38%') },

  // 2 — Carvão Âmbar — cinza mais quente + âmbar profundo
  { id: 'carvao-ambar', name: 'Carvão Âmbar', description: 'Tons quentes de carvão e âmbar',
    colors: p('30 8% 11%','40 12% 94%','30 7% 15%','40 12% 94%','38 80% 50%','30 8% 10%','38 85% 62%','30 6% 20%','40 8% 90%','30 5% 17%','30 6% 52%','35 70% 48%','30 8% 10%','30 5% 22%','38 80% 50%','38 80% 50%','38 70% 62%','38 58% 36%') },

  // 3 — Aço Limão — cinza azulado frio + amarelo limão
  { id: 'aco-limao', name: 'Aço & Limão', description: 'Cinza industrial com amarelo vivo',
    colors: p('215 10% 13%','50 12% 94%','215 8% 17%','50 12% 94%','52 90% 52%','215 10% 10%','52 92% 64%','215 7% 22%','50 8% 90%','215 6% 19%','215 6% 54%','50 80% 48%','215 10% 10%','215 6% 25%','52 90% 52%','52 90% 52%','52 80% 64%','52 65% 38%') },

  // 4 — Fumaça Mel — cinza suave + mel dourado
  { id: 'fumaca-mel', name: 'Fumaça & Mel', description: 'Suavidade cinzenta com calor de mel',
    colors: p('210 6% 15%','42 14% 93%','210 5% 19%','42 14% 93%','40 72% 52%','210 6% 12%','40 78% 64%','210 4% 24%','42 10% 88%','210 4% 21%','210 4% 54%','38 65% 48%','210 6% 12%','210 4% 26%','40 72% 52%','40 72% 52%','40 62% 64%','40 52% 38%') },

  // 5 — Obsidiana Solar — preto profundo + amarelo solar intenso
  { id: 'obsidiana-solar', name: 'Obsidiana Solar', description: 'Escuridão profunda com brilho solar',
    colors: p('0 0% 8%','48 10% 94%','0 0% 12%','48 10% 94%','48 95% 54%','0 0% 6%','48 98% 66%','0 0% 16%','48 6% 88%','0 0% 13%','0 0% 50%','46 85% 50%','0 0% 6%','0 0% 18%','48 95% 54%','48 95% 54%','48 85% 66%','48 68% 38%') },

  // 6 — Prata Mostarda — cinza claro prateado + mostarda
  { id: 'prata-mostarda', name: 'Prata & Mostarda', description: 'Prata sofisticada com mostarda refinada',
    colors: p('220 6% 16%','44 8% 92%','220 5% 20%','44 8% 92%','42 65% 48%','220 6% 14%','42 70% 60%','220 4% 25%','44 6% 87%','220 4% 22%','220 4% 52%','40 58% 45%','220 6% 14%','220 4% 27%','42 65% 48%','42 65% 48%','42 55% 60%','42 48% 35%') },

  // 7 — Concreto Ouro — cinza médio brutalista + ouro escuro
  { id: 'concreto-ouro', name: 'Concreto & Ouro', description: 'Força bruta do concreto com ouro',
    colors: p('200 5% 14%','46 10% 93%','200 4% 18%','46 10% 93%','43 78% 48%','200 5% 10%','43 82% 60%','200 3% 23%','46 7% 88%','200 3% 20%','200 3% 52%','40 68% 45%','200 5% 10%','200 3% 25%','43 78% 48%','43 78% 48%','43 68% 60%','43 55% 35%') },

  // 8 — Névoa Canário — cinza nebuloso + amarelo canário
  { id: 'nevoa-canario', name: 'Névoa & Canário', description: 'Atmosfera enevoada com amarelo vibrante',
    colors: p('210 8% 14%','50 10% 94%','210 7% 18%','50 10% 94%','50 88% 56%','210 8% 10%','50 90% 68%','210 5% 23%','50 7% 90%','210 5% 20%','210 5% 55%','48 78% 52%','210 8% 10%','210 5% 25%','50 88% 56%','50 88% 56%','50 78% 68%','50 62% 40%') },

  // 9 — Ardósia Champanhe — ardósia escura + champanhe/dourado suave
  { id: 'ardosia-champanhe', name: 'Ardósia & Champanhe', description: 'Ardósia nobre com tons de champanhe',
    colors: p('215 8% 13%','38 15% 92%','215 7% 17%','38 15% 92%','38 55% 58%','215 8% 12%','38 60% 70%','215 5% 22%','38 10% 88%','215 5% 19%','215 5% 53%','36 48% 52%','215 8% 12%','215 5% 24%','38 55% 58%','38 55% 58%','38 48% 70%','38 42% 42%') },

  // 10 — Tungstênio — cinza metálico denso + amarelo elétrico
  { id: 'tungstenio', name: 'Tungstênio', description: 'Metal denso com faísca elétrica',
    colors: p('225 6% 11%','48 12% 94%','225 5% 15%','48 12% 94%','48 92% 50%','225 6% 8%','48 95% 62%','225 4% 20%','48 8% 88%','225 4% 17%','225 4% 50%','46 82% 46%','225 6% 8%','225 4% 22%','48 92% 50%','48 92% 50%','48 82% 62%','48 65% 36%') },

  // 11 — Vacatio — preto puro elegante + amarelo ouro intenso + branco puro
  { id: 'vacatio', name: 'Vacatio', description: 'Preto elegante com ouro e branco puro',
    colors: p('0 0% 4%','0 0% 100%','0 0% 8%','0 0% 100%','51 100% 50%','0 0% 4%','51 100% 62%','0 0% 20%','0 0% 90%','0 0% 12%','0 0% 50%','51 90% 48%','0 0% 4%','0 0% 16%','51 100% 50%','51 100% 50%','51 90% 62%','51 75% 36%') },

  // 12 — Vacatio Azulado — preto com toque azulado + ouro
  { id: 'vacatio-azulado', name: 'Vacatio Azulado', description: 'Preto azulado noturno com ouro luminoso',
    colors: p('220 15% 5%','0 0% 100%','220 12% 9%','0 0% 100%','51 100% 50%','220 15% 4%','51 100% 62%','220 10% 18%','0 0% 90%','220 10% 11%','220 8% 48%','51 90% 48%','220 15% 4%','220 10% 15%','51 100% 50%','51 100% 50%','51 90% 62%','51 75% 36%') },

  // 13 — Vacatio Quente — preto avermelhado + ouro âmbar
  { id: 'vacatio-quente', name: 'Vacatio Quente', description: 'Preto com calor sutil e âmbar dourado',
    colors: p('15 8% 5%','0 0% 100%','15 6% 9%','0 0% 100%','45 100% 50%','15 8% 4%','45 100% 62%','15 5% 18%','0 0% 90%','15 5% 11%','15 4% 48%','45 85% 48%','15 8% 4%','15 5% 15%','45 100% 50%','45 100% 50%','45 85% 62%','45 70% 36%') },

  // 14 — Vacatio Verde — preto esverdeado + ouro esverdeado
  { id: 'vacatio-verde', name: 'Vacatio Verde', description: 'Preto profundo com reflexo esmeralda e ouro',
    colors: p('160 10% 4%','0 0% 100%','160 8% 8%','0 0% 100%','48 95% 50%','160 10% 4%','48 95% 62%','160 6% 17%','0 0% 90%','160 6% 10%','160 5% 46%','48 80% 48%','160 10% 4%','160 6% 14%','48 95% 50%','48 95% 50%','48 85% 62%','48 68% 36%') },

  // 15 — Vacatio Violeta — preto arroxeado + ouro contrastante
  { id: 'vacatio-violeta', name: 'Vacatio Violeta', description: 'Preto com nuance violeta e ouro intenso',
    colors: p('270 12% 5%','0 0% 100%','270 10% 9%','0 0% 100%','51 100% 50%','270 12% 4%','51 100% 62%','270 8% 18%','0 0% 90%','270 8% 11%','270 6% 48%','51 90% 48%','270 12% 4%','270 8% 15%','51 100% 50%','51 100% 50%','51 90% 62%','51 75% 36%') },

  // 16 — Vacatio Sépia — preto acastanhado + ouro envelhecido
  { id: 'vacatio-sepia', name: 'Vacatio Sépia', description: 'Preto com tom sépia e ouro envelhecido',
    colors: p('30 12% 5%','0 0% 100%','30 10% 9%','0 0% 100%','42 88% 48%','30 12% 4%','42 88% 60%','30 8% 18%','0 0% 90%','30 8% 11%','30 6% 46%','42 75% 45%','30 12% 4%','30 8% 15%','42 88% 48%','42 88% 48%','42 78% 60%','42 62% 34%') },
];

interface ThemeContextType {
  currentTheme: string;
  setTheme: (id: string) => void;
  palettes: ThemePalette[];
}

const ThemeContext = createContext<ThemeContextType>({
  currentTheme: 'grafite-dourado',
  setTheme: () => {},
  palettes: PALETTES,
});

function applyTheme(palette: ThemePalette) {
  const root = document.documentElement;
  Object.entries(palette.colors).forEach(([prop, value]) => {
    root.style.setProperty(prop, value);
  });
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('vademecum-theme') || 'grafite-dourado';
  });

  // Load theme from Supabase on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;
      supabase
        .from('user_preferences')
        .select('theme_id')
        .eq('user_id', session.user.id)
        .single()
        .then(({ data }) => {
          if (data?.theme_id) {
            setCurrentTheme(data.theme_id);
            localStorage.setItem('vademecum-theme', data.theme_id);
          }
        });
    });
  }, []);

  useEffect(() => {
    const palette = PALETTES.find((p) => p.id === currentTheme) || PALETTES[0];
    applyTheme(palette);
  }, [currentTheme]);

  const setTheme = useCallback((id: string) => {
    setCurrentTheme(id);
    localStorage.setItem('vademecum-theme', id);
    // Persist to Supabase
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;
      supabase
        .from('user_preferences')
        .update({ theme_id: id, updated_at: new Date().toISOString() })
        .eq('user_id', session.user.id)
        .then(() => {});
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, palettes: PALETTES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
