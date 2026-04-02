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
    '--gold-accent': '45 65% 62%',
  };
}

const PALETTES: ThemePalette[] = [
  // 1 — Vinho & Marfim (padrão) — fundo vinho + branco/cinza quente
  { id: 'vinho-marfim', name: 'Vinho & Marfim', description: 'Elegância vinho com tons de marfim e cinza quente',
    colors: p('340 55% 12%','0 0% 92%','340 50% 16%','0 0% 92%','0 0% 88%','340 55% 14%','0 0% 94%','340 40% 21%','0 0% 85%','340 40% 18%','340 20% 52%','0 0% 78%','340 50% 14%','340 35% 24%','0 0% 88%','0 0% 88%','0 0% 94%','0 0% 68%') },

  // 2 — Púrpura Noturna — roxo profundo + cinza frio
  { id: 'purpura-noturna', name: 'Púrpura Noturna', description: 'Profundidade roxa com cinzas frios',
    colors: p('280 40% 8%','240 5% 90%','280 35% 12%','240 5% 90%','240 4% 85%','280 40% 10%','240 5% 92%','280 30% 17%','240 4% 82%','280 30% 14%','280 15% 46%','240 4% 72%','280 35% 10%','280 25% 20%','240 4% 85%','240 4% 85%','240 5% 92%','240 3% 62%') },

  // 3 — Rubi Claro — vermelho rubi + cinza neutro
  { id: 'rubi-claro', name: 'Rubi Claro', description: 'Vermelho rubi com cinzas neutros luminosos',
    colors: p('350 60% 14%','0 0% 91%','350 55% 18%','0 0% 91%','0 0% 86%','350 60% 14%','0 0% 93%','350 45% 23%','0 0% 84%','350 45% 20%','350 25% 52%','0 0% 74%','350 55% 14%','350 40% 26%','0 0% 86%','0 0% 86%','0 0% 93%','0 0% 65%') },

  // 4 — Ameixa & Prata — ameixa escura + prata/cinza azulado
  { id: 'ameixa-prata', name: 'Ameixa & Prata', description: 'Ameixa profunda com reflexos prateados',
    colors: p('300 35% 11%','220 8% 89%','300 30% 15%','220 8% 89%','220 6% 83%','300 35% 12%','220 8% 90%','300 25% 20%','220 5% 80%','300 25% 17%','300 15% 48%','220 6% 70%','300 30% 12%','300 20% 22%','220 6% 83%','220 6% 83%','220 8% 90%','220 4% 62%') },

  // 5 — Bordô & Pérola — bordô clássico + cinza rosado
  { id: 'bordo-perola', name: 'Bordô & Pérola', description: 'Bordô clássico com cinzas perolados',
    colors: p('345 58% 11%','350 5% 90%','345 52% 15%','350 5% 90%','350 4% 84%','345 58% 12%','350 5% 91%','345 42% 20%','350 3% 82%','345 42% 17%','345 22% 48%','350 4% 73%','345 52% 12%','345 37% 22%','350 4% 84%','350 4% 84%','350 5% 91%','350 3% 64%') },

  // 6 — Uva Imperial — roxo uva + cinza lavanda
  { id: 'uva-imperial', name: 'Uva Imperial', description: 'Roxo uva intenso com cinzas lavanda',
    colors: p('290 45% 13%','270 5% 90%','290 40% 17%','270 5% 90%','270 4% 85%','290 45% 12%','270 5% 92%','290 35% 22%','270 4% 82%','290 35% 19%','290 18% 50%','270 4% 72%','290 40% 12%','290 30% 24%','270 4% 85%','270 4% 85%','270 5% 92%','270 3% 63%') },

  // 7 — Ébano & Neve — preto com subtom vinho + cinzas puros
  { id: 'ebano-neve', name: 'Ébano & Neve', description: 'Preto elegante com escala de cinzas',
    colors: p('340 10% 5%','0 0% 90%','340 8% 9%','0 0% 90%','0 0% 85%','340 10% 6%','0 0% 92%','340 6% 16%','0 0% 82%','340 6% 12%','340 4% 45%','0 0% 72%','340 8% 6%','340 5% 15%','0 0% 85%','0 0% 85%','0 0% 92%','0 0% 62%') },

  // 8 — Grafite Violeta — cinza com subtom violeta
  { id: 'grafite-violeta', name: 'Grafite Violeta', description: 'Cinza sofisticado com nuance violeta',
    colors: p('270 12% 12%','260 5% 89%','270 10% 16%','260 5% 89%','260 4% 83%','270 12% 12%','260 5% 91%','270 8% 21%','260 3% 80%','270 8% 18%','270 5% 48%','260 4% 71%','270 10% 12%','270 6% 24%','260 4% 83%','260 4% 83%','260 5% 91%','260 3% 62%') },

  // 9 — Mogno & Creme — marrom avermelhado + cinza quente
  { id: 'mogno-creme', name: 'Mogno & Creme', description: 'Calor do mogno com cinzas acolhedores',
    colors: p('15 45% 13%','30 6% 88%','15 40% 17%','30 6% 88%','30 5% 83%','15 45% 12%','30 6% 90%','15 30% 22%','30 4% 80%','15 30% 19%','15 15% 50%','30 4% 71%','15 40% 12%','15 25% 25%','30 5% 83%','30 5% 83%','30 6% 90%','30 3% 63%') },

  // 10 — Obsidiana Púrpura — preto profundo com nuance roxa + cinza gelado
  { id: 'obsidiana-purpura', name: 'Obsidiana Púrpura', description: 'Preto profundo com cinzas gelados',
    colors: p('280 15% 6%','220 5% 89%','280 12% 10%','220 5% 89%','220 4% 84%','280 15% 7%','220 5% 91%','280 10% 19%','220 3% 81%','280 10% 13%','280 8% 46%','220 4% 72%','280 12% 7%','280 8% 17%','220 4% 84%','220 4% 84%','220 5% 91%','220 3% 63%') },
];

interface ThemeContextType {
  currentTheme: string;
  setTheme: (id: string) => void;
  palettes: ThemePalette[];
}

const ThemeContext = createContext<ThemeContextType>({
  currentTheme: 'obsidiana-purpura',
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
    return localStorage.getItem('vademecum-theme') || 'obsidiana-purpura';
  });

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
