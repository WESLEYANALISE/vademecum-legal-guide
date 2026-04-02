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
  // 1 — Vinho & Marfim (padrão) — fundo vinho escuro + destaques marfim
  { id: 'vinho-marfim', name: 'Vinho & Marfim', description: 'Elegância vinho com destaques em marfim',
    colors: p('340 55% 12%','40 20% 95%','340 50% 16%','40 20% 95%','40 15% 92%','340 55% 12%','40 20% 96%','340 40% 21%','40 10% 90%','340 40% 18%','340 25% 55%','40 12% 88%','340 55% 12%','340 35% 24%','40 15% 92%','40 15% 92%','40 20% 96%','40 10% 82%') },

  // 2 — Púrpura Noturna — roxo profundo + branco suave
  { id: 'purpura-noturna', name: 'Púrpura Noturna', description: 'Profundidade roxa com brilho branco suave',
    colors: p('280 40% 8%','0 0% 95%','280 35% 12%','0 0% 95%','0 0% 93%','280 40% 8%','0 0% 96%','280 30% 17%','0 0% 90%','280 30% 14%','280 20% 48%','280 15% 85%','280 40% 8%','280 25% 20%','0 0% 93%','0 0% 93%','0 0% 96%','0 0% 80%') },

  // 3 — Rubi Claro — vermelho rubi + branco luminoso
  { id: 'rubi-claro', name: 'Rubi Claro', description: 'Vermelho rubi vibrante com branco luminoso',
    colors: p('350 60% 14%','0 0% 96%','350 55% 18%','0 0% 96%','0 0% 94%','350 60% 12%','0 0% 97%','350 45% 23%','0 0% 90%','350 45% 20%','350 30% 55%','350 15% 87%','350 60% 12%','350 40% 26%','0 0% 94%','0 0% 94%','0 0% 97%','0 0% 82%') },

  // 4 — Ameixa & Prata — ameixa escura + prata
  { id: 'ameixa-prata', name: 'Ameixa & Prata', description: 'Ameixa profunda com reflexos prateados',
    colors: p('300 35% 11%','220 10% 94%','300 30% 15%','220 10% 94%','220 8% 90%','300 35% 10%','220 12% 94%','300 25% 20%','220 5% 88%','300 25% 17%','300 18% 50%','220 8% 84%','300 35% 10%','300 20% 22%','220 8% 90%','220 8% 90%','220 12% 94%','220 5% 78%') },

  // 5 — Bordô & Pérola — bordô clássico + pérola rosada
  { id: 'bordo-perola', name: 'Bordô & Pérola', description: 'Bordô clássico com suavidade perolada',
    colors: p('345 58% 11%','20 15% 94%','345 52% 15%','20 15% 94%','20 12% 91%','345 58% 10%','20 18% 95%','345 42% 20%','20 8% 88%','345 42% 17%','345 28% 50%','20 10% 86%','345 58% 10%','345 37% 22%','20 12% 91%','20 12% 91%','20 18% 95%','20 8% 80%') },

  // 6 — Uva Imperial — roxo uva intenso + branco real
  { id: 'uva-imperial', name: 'Uva Imperial', description: 'Roxo uva intenso com branco real',
    colors: p('290 45% 13%','0 0% 96%','290 40% 17%','0 0% 96%','0 0% 94%','290 45% 10%','0 0% 97%','290 35% 22%','0 0% 90%','290 35% 19%','290 22% 52%','290 12% 87%','290 45% 10%','290 30% 24%','0 0% 94%','0 0% 94%','0 0% 97%','0 0% 82%') },

  // 7 — Ébano & Neve — preto com subtom vinho + branco puro
  { id: 'ebano-neve', name: 'Ébano & Neve', description: 'Preto elegante com branco neve',
    colors: p('340 10% 5%','0 0% 98%','340 8% 9%','0 0% 98%','0 0% 95%','340 10% 4%','0 0% 98%','340 6% 16%','0 0% 90%','340 6% 12%','340 4% 48%','0 0% 88%','340 10% 4%','340 5% 15%','0 0% 95%','0 0% 95%','0 0% 98%','0 0% 82%') },

  // 8 — Grafite Violeta — cinza com subtom violeta + branco
  { id: 'grafite-violeta', name: 'Grafite Violeta', description: 'Cinza sofisticado com nuance violeta',
    colors: p('270 12% 12%','260 8% 94%','270 10% 16%','260 8% 94%','260 6% 91%','270 12% 10%','260 10% 95%','270 8% 21%','260 4% 88%','270 8% 18%','270 5% 52%','260 6% 85%','270 12% 10%','270 6% 24%','260 6% 91%','260 6% 91%','260 10% 95%','260 4% 80%') },

  // 9 — Mogno & Creme — marrom avermelhado + creme suave
  { id: 'mogno-creme', name: 'Mogno & Creme', description: 'Calor do mogno com suavidade creme',
    colors: p('15 45% 13%','36 25% 93%','15 40% 17%','36 25% 93%','36 18% 90%','15 45% 10%','36 22% 94%','15 30% 22%','36 12% 88%','15 30% 19%','15 18% 52%','36 15% 85%','15 45% 10%','15 25% 25%','36 18% 90%','36 18% 90%','36 22% 94%','36 12% 78%') },

  // 10 — Obsidiana Púrpura — preto profundo com nuance roxa + branco gelado
  { id: 'obsidiana-purpura', name: 'Obsidiana Púrpura', description: 'Preto profundo com nuance violeta e branco gelado',
    colors: p('280 15% 6%','210 10% 96%','280 12% 10%','210 10% 96%','210 8% 93%','280 15% 5%','210 12% 96%','280 10% 19%','210 5% 90%','280 10% 13%','280 8% 48%','210 8% 86%','280 15% 5%','280 8% 17%','210 8% 93%','210 8% 93%','210 12% 96%','210 5% 80%') },
];

interface ThemeContextType {
  currentTheme: string;
  setTheme: (id: string) => void;
  palettes: ThemePalette[];
}

const ThemeContext = createContext<ThemeContextType>({
  currentTheme: 'vinho-marfim',
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
    return localStorage.getItem('vademecum-theme') || 'vinho-marfim';
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
