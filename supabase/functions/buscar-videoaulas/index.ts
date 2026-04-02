const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function fetchTranscript(videoId: string): Promise<string> {
  try {
    // Fetch the YouTube video page to extract caption tracks
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: { 'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8' },
    });
    if (!pageRes.ok) return '';
    const html = await pageRes.text();

    // Extract captionTracks JSON from the page
    const captionMatch = html.match(/"captionTracks":\s*(\[.*?\])/);
    if (!captionMatch) return '';

    let tracks: Array<{ baseUrl: string; languageCode: string; kind?: string }>;
    try {
      tracks = JSON.parse(captionMatch[1]);
    } catch {
      return '';
    }
    if (!tracks || tracks.length === 0) return '';

    // Prefer Portuguese manual captions, then Portuguese auto, then any
    const ptManual = tracks.find(t => t.languageCode === 'pt' && t.kind !== 'asr');
    const ptAuto = tracks.find(t => t.languageCode === 'pt');
    const anyTrack = tracks[0];
    const chosen = ptManual || ptAuto || anyTrack;
    if (!chosen?.baseUrl) return '';

    // Fetch the XML captions
    const captionRes = await fetch(chosen.baseUrl);
    if (!captionRes.ok) return '';
    const xml = await captionRes.text();

    // Parse XML to extract text content
    const texts: string[] = [];
    const regex = /<text[^>]*>([\s\S]*?)<\/text>/g;
    let match;
    while ((match = regex.exec(xml)) !== null) {
      let t = match[1]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\n/g, ' ')
        .trim();
      if (t) texts.push(t);
    }

    return texts.join(' ').substring(0, 12000);
  } catch (e) {
    console.error('Error fetching transcript:', e);
    return '';
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
    if (!YOUTUBE_API_KEY) {
      throw new Error('YOUTUBE_API_KEY is not configured');
    }

    const { artigoNumero, artigoTexto, leiNome } = await req.json();
    if (!artigoNumero || !artigoTexto) {
      return new Response(JSON.stringify({ error: 'artigoNumero and artigoTexto are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build search query
    const query = `${artigoNumero} ${leiNome || 'legislação brasileira'} aula direito`;

    // YouTube Data API v3 - Search
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.set('part', 'snippet');
    searchUrl.searchParams.set('q', query);
    searchUrl.searchParams.set('type', 'video');
    searchUrl.searchParams.set('order', 'relevance');
    searchUrl.searchParams.set('maxResults', '1');
    searchUrl.searchParams.set('relevanceLanguage', 'pt');
    searchUrl.searchParams.set('key', YOUTUBE_API_KEY);

    const searchRes = await fetch(searchUrl.toString());
    if (!searchRes.ok) {
      const errBody = await searchRes.json().catch(() => ({}));
      const isQuota = errBody?.error?.errors?.some((e: any) => e.reason === 'quotaExceeded');
      if (isQuota) {
        return new Response(JSON.stringify({ videos: [], quotaExceeded: true }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`YouTube API error [${searchRes.status}]: ${errBody?.error?.message || 'unknown'}`);
    }

    const searchData = await searchRes.json();
    const items = searchData.items || [];

    const videos = await Promise.all(items.map(async (item: any) => {
      const videoId = item.id?.videoId || '';
      const snippet = item.snippet || {};
      const transcricao = videoId ? await fetchTranscript(videoId) : '';
      return {
        titulo: snippet.title || 'Sem título',
        url: `https://www.youtube.com/watch?v=${videoId}`,
        canal: snippet.channelTitle || 'Canal desconhecido',
        videoId,
        transcricao,
      };
    }));

    return new Response(JSON.stringify({ videos }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: unknown) {
    console.error('Error in buscar-videoaulas:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
