(() => {
  'use strict';

  const endpoint = '/api/land-news';
  const refreshInterval = 15 * 60 * 1000;

  function relativeTime(value) {
    const published = new Date(value).getTime();
    if (!Number.isFinite(published)) return 'Recently';
    const minutes = Math.max(0, Math.floor((Date.now() - published) / 60000));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[character]));
  }

  function renderState(list, status, articles, error) {
    list.setAttribute('aria-busy', 'false');
    if (error) {
      status.textContent = error === 'rate_limited'
        ? 'News quota temporarily unavailable'
        : 'Live news temporarily unavailable';
      list.innerHTML = `<div class="lw-news-empty" role="status">Live news temporarily unavailable. Please check back after the next refresh.</div>`;
      return;
    }
    if (!articles.length) {
      status.textContent = 'No matching reports found';
      list.innerHTML = '<div class="lw-news-empty" role="status">No current land acquisition reports are available.</div>';
      return;
    }
    status.textContent = `Updated ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    list.innerHTML = articles.map(article => `
      <article class="lw-news-card">
        <div class="lw-news-card-heading">
          <span class="lw-chip">${escapeHtml(article.source?.name || 'Public source')}</span>
          <time datetime="${escapeHtml(article.publishedAt)}">${relativeTime(article.publishedAt)}</time>
        </div>
        <h3>${escapeHtml(article.title)}</h3>
        <a href="${escapeHtml(article.url)}" target="_blank" rel="noopener noreferrer">Read original report <span aria-hidden="true">↗</span></a>
      </article>
    `).join('');
  }

  async function fetchNews(list, status) {
    try {
      const response = await fetch(endpoint, { headers: { Accept: 'application/json' } });
      const payload = await response.json();
      if (!response.ok || payload.error) {
        renderState(list, status, [], payload.error || 'fetch_failed');
        return;
      }
      renderState(list, status, Array.isArray(payload.articles) ? payload.articles : [], null);
    } catch {
      renderState(list, status, [], 'fetch_failed');
    }
  }

  function init() {
    const list = document.getElementById('land-news-list');
    const status = document.getElementById('land-news-status');
    if (!list || !status) return;
    fetchNews(list, status);
    window.setInterval(() => fetchNews(list, status), refreshInterval);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
