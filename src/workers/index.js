// src/workers/index.js — Versão SIMPLES: só scrape, sem banco, sem token, sem cron

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/news') {
      return getLatestNews();
    }

    if (url.pathname === '/') {
      return new Response(await Deno.readTextFile('./pages/index.html'), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    return new Response('Not Found', { status: 404 });
  },
};

async function getLatestNews() {
  // Lista de sites moçambicanos — copiada do seu sources.json
  const sources = [
    { name: "Jornal de Moçambique", url: "https://www.jornaldemocambique.co.mz" },
    { name: "Canal de Moçambique", url: "https://canaldemozambique.com" },
    { name: "STV News", url: "https://stv.co.mz" },
    { name: "O País", url: "https://www.opais.co.mz" },
    { name: "Fénix FM", url: "https://fenixfm.co.mz" },
    { name: "Notícias ao Minuto MZ", url: "https://noticiasaoeminuto.co.mz" },
  ];

  const newsItems = [];

  for (const source of sources) {
    try {
      const response = await fetch(source.url);
      const html = await response.text();

      // Extrai títulos e links usando regex simples (sem CSS ou parser complexo)
      const regex = /<h[23][^>]*>([\s\S]*?)<\/h[23]>/g;
      let match;

      while ((match = regex.exec(html))) {
        const title = match[1].replace(/<[^>]*>/g, '').trim();
        if (title.length < 10 || title.includes('Publicidade')) continue; // filtra lixo

        // Pega o primeiro link da página
        const linkMatch = html.match(/<a\s+href=["']([^"']+)["'][^>]*>.*?\/?<\/a>/i);
        const url = linkMatch ? linkMatch[1] : source.url;

        newsItems.push({
          id: crypto.randomUUID(),
          title: title,
          source: source.name,
          url: url.startsWith('http') ? url : source.url + url,
          images: [],
          audio: [],
          video: [],
          publishedAt: new Date().toISOString()
        });

        // Limita a 5 notícias por site para não sobrecarregar
        if (newsItems.length >= 30) break;
      }
    } catch (e) {
      console.warn(`❌ Falha em ${source.name}:`, e.message);
    }
  }

  // Ordena por data (mais recente primeiro)
  newsItems.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

  return new Response(JSON.stringify(newsItems.slice(0, 20)), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300'
    }
  });
}
