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
  // 1 — Marsala & Ouro (padrão) — bordô escuro + dourado fiel ao logo
  { id: 'marsala-ouro', name: 'Marsala & Ouro', description: 'Elegância bordô com destaques em ouro',
    colors: p('340 55% 12%','40 15% 95%','340 50% 16%','40 15% 95%','42 75% 55%','340 55% 10%','42 80% 65%','340 40% 21%','40 10% 90%','340 40% 18%','340 30% 55%','42 70% 50%','340 55% 10%','340 35% 24%','42 75% 55%','42 75% 55%','42 65% 65%','42 55% 38%') },

  // 2 — Vinho Noturno — bordô profundo/preto + ouro suave
  { id: 'vinho-noturno', name: 'Vinho Noturno', description: 'Profundidade noturna com brilho dourado suave',
    colors: p('340 50% 8%','38 12% 94%','340 45% 12%','38 12% 94%','40 65% 52%','340 50% 6%','40 70% 64%','340 35% 17%','38 8% 88%','340 35% 14%','340 25% 48%','38 58% 48%','340 50% 6%','340 30% 20%','40 65% 52%','40 65% 52%','40 55% 64%','40 48% 36%') },

  // 3 — Rubi Imperial — vermelho rubi vibrante + ouro intenso
  { id: 'rubi-imperial', name: 'Rubi Imperial', description: 'Vermelho rubi vibrante com ouro intenso',
    colors: p('350 60% 14%','42 14% 95%','350 55% 18%','42 14% 95%','45 85% 54%','350 60% 10%','45 88% 66%','350 45% 23%','42 10% 90%','350 45% 20%','350 35% 55%','44 78% 50%','350 60% 10%','350 40% 26%','45 85% 54%','45 85% 54%','45 75% 66%','45 62% 38%') },

  // 4 — Mogno & Champanhe — marrom avermelhado + champanhe
  { id: 'mogno-champanhe', name: 'Mogno & Champanhe', description: 'Calor do mogno com suavidade champanhe',
    colors: p('15 45% 13%','38 18% 93%','15 40% 17%','38 18% 93%','38 55% 58%','15 45% 10%','38 60% 70%','15 30% 22%','38 12% 88%','15 30% 19%','15 20% 52%','36 48% 52%','15 45% 10%','15 25% 25%','38 55% 58%','38 55% 58%','38 48% 70%','38 42% 42%') },

  // 5 — Carmesim & Bronze — vermelho escuro + bronze metálico
  { id: 'carmesim-bronze', name: 'Carmesim & Bronze', description: 'Força carmesim com reflexos em bronze',
    colors: p('355 52% 13%','35 14% 94%','355 48% 17%','35 14% 94%','30 65% 48%','355 52% 10%','30 70% 60%','355 38% 22%','35 10% 88%','355 38% 19%','355 28% 52%','28 58% 45%','355 52% 10%','355 33% 24%','30 65% 48%','30 65% 48%','30 55% 60%','30 48% 35%') },

  // 6 — Borgonha Clássica — borgonha pura + ouro antigo
  { id: 'borgonha-classica', name: 'Borgonha Clássica', description: 'Borgonha pura com ouro envelhecido',
    colors: p('345 58% 11%','40 12% 94%','345 52% 15%','40 12% 94%','42 68% 48%','345 58% 8%','42 72% 60%','345 42% 20%','40 8% 87%','345 42% 17%','345 32% 50%','40 60% 45%','345 58% 8%','345 37% 22%','42 68% 48%','42 68% 48%','42 58% 60%','42 50% 35%') },

  // 7 — Ébano & Ouro — preto elegante + ouro do logo
  { id: 'ebano-ouro', name: 'Ébano & Ouro', description: 'Preto puro elegante com ouro luminoso',
    colors: p('0 0% 5%','0 0% 100%','0 0% 9%','0 0% 100%','42 80% 52%','0 0% 4%','42 85% 64%','0 0% 18%','0 0% 90%','0 0% 12%','0 0% 50%','42 72% 48%','0 0% 4%','0 0% 16%','42 80% 52%','42 80% 52%','42 72% 64%','42 58% 36%') },

  // 8 — Grafite Bordeaux — cinza com subtom bordô + ouro
  { id: 'grafite-bordeaux', name: 'Grafite Bordeaux', description: 'Cinza sofisticado com nuance bordô e ouro',
    colors: p('340 12% 12%','40 10% 94%','340 10% 16%','40 10% 94%','42 72% 52%','340 12% 10%','42 78% 64%','340 8% 21%','40 6% 88%','340 8% 18%','340 6% 52%','40 62% 48%','340 12% 10%','340 6% 24%','42 72% 52%','42 72% 52%','42 62% 64%','42 50% 36%') },

  // 9 — Terracota & Mel — terracota quente + mel dourado
  { id: 'terracota-mel', name: 'Terracota & Mel', description: 'Calor terroso com doçura de mel dourado',
    colors: p('12 40% 14%','40 16% 93%','12 35% 18%','40 16% 93%','40 72% 52%','12 40% 10%','40 78% 64%','12 28% 23%','40 10% 88%','12 28% 20%','12 18% 52%','38 65% 48%','12 40% 10%','12 22% 25%','40 72% 52%','40 72% 52%','40 62% 64%','40 52% 38%') },

  // 10 — Obsidiana Régia — preto com nuance roxa + ouro real
  { id: 'obsidiana-regia', name: 'Obsidiana Régia', description: 'Preto profundo com nuance violeta e ouro real',
    colors: p('280 15% 6%','0 0% 100%','280 12% 10%','0 0% 100%','42 82% 50%','280 15% 5%','42 86% 62%','280 10% 19%','0 0% 90%','280 10% 13%','280 8% 48%','42 74% 48%','280 15% 5%','280 8% 17%','42 82% 50%','42 82% 50%','42 74% 62%','42 58% 36%') },
];

interface ThemeContextType {
  currentTheme: string;
  setTheme: (id: string) => void;
  palettes: ThemePalette[];
}

const ThemeContext = createContext<ThemeContextType>({
  currentTheme: 'marsala-ouro',
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
    return localStorage.getItem('vademecum-theme') || 'marsala-ouro';
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
