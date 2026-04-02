export const cdnImg = (url: string, w = 640) => {
  if (!url) return '';
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  return `https://${projectId}.supabase.co/functions/v1/otimizar-imagem?url=${encodeURIComponent(url)}&w=${w}`;
};

/** Direct image proxy for news — bypasses Edge Function for instant loading */
export const newsImg = (url: string, w = 640) => {
  if (!url) return '';
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${w}&q=80&output=webp`;
};
