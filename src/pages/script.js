document.getElementById('refresh').addEventListener('click', () => {
  const btn = document.getElementById('refresh');
  const originalText = btn.innerHTML;
  btn.innerHTML = '🔄 Atualizando...';
  btn.disabled = true;

  fetch('/api/update')
    .then(r => r.json())
    .then(data => {
      console.log('Atualização iniciada:', data);
      loadNews();
    })
    .catch(() => alert('Erro ao atualizar. Tente novamente.'))
    .finally(() => {
      btn.innerHTML = originalText;
      btn.disabled = false;
    });
});

async function loadNews() {
  const feed = document.getElementById('news-feed');
  feed.innerHTML = '<div class="loading"><div class="spinner"></div><p>Carregando notícias...</p></div>';

  try {
    const res = await fetch('/api/news');
    if (!res.ok) throw new Error('Falha na rede');

    const news = await res.json();

    if (news.length === 0) {
      feed.innerHTML = '<div class="empty">Nenhuma notícia encontrada.<br>Tente novamente em 5 minutos.</div>';
      return;
    }

    feed.innerHTML = '';

    news.forEach(item => {
      const card = document.createElement('article');
      card.className = 'news-card';

      let mediaHtml = '';
      if (item.images.length > 0) {
        mediaHtml = `<img src="${item.images[0]}" alt="${item.title}" loading="lazy">`;
      } else if (item.video && item.video.length > 0) {
        mediaHtml = `<video controls preload="metadata"><source src="${item.video[0]}" type="video/mp4">Seu navegador não suporta vídeo.</video>`;
      } else if (item.audio && item.audio.length > 0) {
        mediaHtml = `<audio controls preload="none"><source src="${item.audio[0]}" type="audio/mpeg">Seu navegador não suporta áudio.</audio>`;
      }

      card.innerHTML = `
        <h3>${item.title}</h3>
        <small>${item.source} • ${new Date(item.publishedAt).toLocaleString('pt-MZ', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        })}</small>
        ${mediaHtml}
        <p>${item.summary}</p>
        <a href="${item.url}" target="_blank">Ler mais →</a>
      `;
      feed.appendChild(card);
    });

  } catch (err) {
    console.error(err);
    feed.innerHTML = '<div class="empty">Erro ao carregar notícias.<br>Tente novamente mais tarde.</div>';
  }
}

// Carrega imediatamente
loadNews();

// Atualiza a cada 5 minutos
setInterval(loadNews, 300000);

// Se o usuário voltar ao site após estar em segundo plano, recarrega
window.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    loadNews();
  }
});
