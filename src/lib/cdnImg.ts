export const cdnImg = (url: string, w = 640) => {
  if (!url) return '';
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  return `https://${projectId}.supabase.co/functions/v1/otimizar-imagem?url=${encodeURIComponent(url)}&w=${w}`;
};
