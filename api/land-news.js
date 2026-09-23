type NewsArticle = {
  title: string;
  source: { name: string };
  url: string;
  publishedAt: string;
};

type GNewsArticle = {
  title?: string;
  source?: { name?: string };
  url?: string;
  publishedAt?: string;
};

type CacheEntry = {
  expiresAt: number;
  articles: NewsArticle[];
};

const cacheKey = '__landWatchNewsCache';
const cacheDuration = 15 * 60 * 1000;

function getCache(): CacheEntry | undefined {
  return (globalThis as typeof globalThis & { [cacheKey]?: CacheEntry })[cacheKey];
}

function setCache(entry: CacheEntry) {
  (globalThis as typeof globalThis & { [cacheKey]?: CacheEntry })[cacheKey] = entry;
}

export async function GET() {
  const cached = getCache();
  if (cached && cached.expiresAt > Date.now()) {
    return Response.json({ articles: cached.articles });
  }

  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'fetch_failed' }, { status: 503 });
  }

  const url = new URL('https://gnews.io/api/v4/search');
  url.searchParams.set('q', '"land acquisition" OR "land dispute" OR "compensation delay" India');
  url.searchParams.set('lang', 'en');
  url.searchParams.set('country', 'in');
  url.searchParams.set('max', '10');
  url.searchParams.set('sortby', 'publishedAt');
  url.searchParams.set('apikey', apiKey);

  try {
    const response = await fetch(url, { next: { revalidate: 900 } });
    if (response.status === 403 || response.status === 429) {
      return Response.json({ error: 'rate_limited' }, { status: response.status });
    }
    if (!response.ok) {
      return Response.json({ error: 'fetch_failed' }, { status: 502 });
    }

    const payload = await response.json() as { articles?: GNewsArticle[] };
    const articles = (payload.articles || []).flatMap(article => {
      if (!article.title || !article.url || !article.publishedAt) return [];
      return [{
        title: article.title,
        source: { name: article.source?.name || 'Public source' },
        url: article.url,
        publishedAt: article.publishedAt
      }];
    });
    setCache({ articles, expiresAt: Date.now() + cacheDuration });
    return Response.json({ articles });
  } catch {
    return Response.json({ error: 'fetch_failed' }, { status: 502 });
  }
}

