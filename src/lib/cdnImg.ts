/** Detect if URL is already on Supabase Storage CDN */
const isSupabaseStorage = (url: string) =>
  url.includes('supabase.co/storage') || url.includes('supabase.co/object');

/** Image proxy — skips proxy for Supabase Storage URLs (already fast CDN) */
export const cdnImg = (url: string, w = 800) => {
  if (!url) return '';
  if (isSupabaseStorage(url)) return url;
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${w}&q=80&output=webp`;
};

/** Direct image — uses Supabase CDN directly, only proxies external URLs */
export const directImg = (url: string, w = 400) => {
  if (!url) return '';
  if (isSupabaseStorage(url)) return url;
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${w}&q=80&output=webp`;
};

/** Direct image proxy for news — bypasses Edge Function for instant loading */
export const newsImg = (url: string, w = 640) => {
  if (!url) return '';
  if (isSupabaseStorage(url)) return url;
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${w}&q=80&output=webp`;
};
