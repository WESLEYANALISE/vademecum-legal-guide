/** Image proxy — bypasses broken TinyPNG Edge Function, goes direct to wsrv.nl */
export const cdnImg = (url: string, w = 800) => {
  if (!url) return '';
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${w}&q=80&output=webp`;
};

/** Direct image proxy for news — bypasses Edge Function for instant loading */
export const newsImg = (url: string, w = 640) => {
  if (!url) return '';
  return `https://wsrv.nl/?url=${encodeURIComponent(url)}&w=${w}&q=80&output=webp`;
};
