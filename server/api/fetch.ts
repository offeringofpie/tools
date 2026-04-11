import { parse } from 'node-html-parser';

type Mode = 'inspect' | 'screenshot';
type MetaMap = Record<string, string | string[]>;

const ALLOWED_CLIENT = 'jl-tools-fetch-proxy';
const CACHE_TTL = 3600;
const RATE_LIMIT_TTL = 60;
const MIN_GAP_MS = 5000;

const BLOCKED_HOSTS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '192.168.',
  '10.',
  '[::1]',
  ...Array.from({ length: 16 }, (_, i) => `172.${16 + i}.`),
];

function parseUrl(raw: string): URL | null {
  try {
    const input = /^https?:\/\//i.test(raw.trim())
      ? raw.trim()
      : `https://${raw.trim()}`;
    const url = new URL(input);
    const blocked = BLOCKED_HOSTS.some((h) =>
      url.hostname.toLowerCase().includes(h),
    );
    return !blocked && ['http:', 'https:'].includes(url.protocol) ? url : null;
  } catch {
    return null;
  }
}

function toAbsolute(href: string, base: URL): string {
  if (!href) return '';
  try {
    return new URL(href, base).href;
  } catch {
    return href;
  }
}

function setMeta(map: MetaMap, key: string, value: string, base: URL) {
  const k = key.trim();
  const v = value.trim();
  if (!k || !v) return;

  const resolved = /url|image|icon|logo|video|audio|canonical|manifest/i.test(k)
    ? toAbsolute(v, base)
    : v;

  if (!map[k]) {
    map[k] = resolved;
  } else if (Array.isArray(map[k])) {
    if (!(map[k] as string[]).includes(resolved))
      (map[k] as string[]).push(resolved);
  } else if (map[k] !== resolved) {
    map[k] = [map[k] as string, resolved];
  }
}

function firstVal(v?: string | string[]): string {
  return Array.isArray(v) ? (v[0] ?? '') : (v ?? '');
}

function dedupeBy<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const k = key(item);
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

async function checkRateLimit(
  storage: ReturnType<typeof useStorage>,
  key: string,
) {
  const now = Date.now();
  const state = (await storage.getItem<{ last: number; blockedUntil: number }>(
    key,
  )) ?? {
    last: 0,
    blockedUntil: 0,
  };

  if (now < state.blockedUntil) {
    const wait = Math.ceil((state.blockedUntil - now) / 1000);
    throw createError({
      statusCode: 429,
      message: `Rate limited. Try again in ${wait}s.`,
    });
  }

  if (now - state.last < MIN_GAP_MS) {
    await storage.setItem(key, {
      last: now,
      blockedUntil: now + RATE_LIMIT_TTL * 1000,
    });
    throw createError({
      statusCode: 429,
      message: `Wait 5s between requests.`,
    });
  }

  await storage.setItem(
    key,
    { last: now, blockedUntil: 0 },
    { ttl: RATE_LIMIT_TTL },
  );
}

async function inspectUrl(url: URL) {
  const html = await $fetch<string>(url.href, {
    timeout: 8000,
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml',
    },
  });

  const root = parse(html);
  const og: MetaMap = {};
  const tw: MetaMap = {};
  const meta: MetaMap = {};

  for (const tag of root.querySelectorAll('meta')) {
    const prop = tag.getAttribute('property')?.trim();
    const name = tag.getAttribute('name')?.trim();
    const content = tag.getAttribute('content')?.trim();
    if (!content) continue;

    if (prop?.startsWith('og:')) setMeta(og, prop, content, url);
    else if (name?.startsWith('twitter:')) setMeta(tw, name, content, url);
    else if (name) setMeta(meta, name, content, url);
  }

  const icons: any[] = [];
  const alternates: any[] = [];
  const feeds: any[] = [];
  let canonical = '';
  let manifest = '';

  for (const link of root.querySelectorAll('link')) {
    const href = link.getAttribute('href');
    if (!href) continue;

    const abs = toAbsolute(href, url);
    const rel = link.getAttribute('rel') ?? '';
    const type = link.getAttribute('type') ?? undefined;

    if (
      rel.includes('icon') ||
      rel === 'apple-touch-icon' ||
      rel === 'mask-icon'
    ) {
      icons.push({
        href: abs,
        rel,
        sizes: link.getAttribute('sizes') ?? undefined,
        type,
      });
    } else if (rel === 'alternate') {
      const isFeed = type && /(rss|atom|json)/i.test(type);
      if (isFeed) {
        feeds.push({
          href: abs,
          title: link.getAttribute('title') ?? undefined,
          type,
        });
      } else {
        alternates.push({
          href: abs,
          hreflang: link.getAttribute('hreflang') ?? undefined,
          title: link.getAttribute('title') ?? undefined,
          media: link.getAttribute('media') ?? undefined,
          type,
        });
      }
    } else if (rel === 'canonical') {
      canonical = abs;
    } else if (rel === 'manifest') {
      manifest = abs;
    }
  }

  const jsonLd: any[] = [];
  for (const node of root.querySelectorAll(
    'script[type="application/ld+json"]',
  )) {
    const raw = node.innerText?.trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      Array.isArray(parsed) ? jsonLd.push(...parsed) : jsonLd.push(parsed);
    } catch {
      jsonLd.push({ _raw: raw, _invalid: true });
    }
  }

  const favicon = icons[0]?.href ?? toAbsolute('/favicon.ico', url);
  const title =
    firstVal(og['og:title']) ||
    firstVal(tw['twitter:title']) ||
    root.querySelector('title')?.text?.trim() ||
    'No title';

  return {
    url: url.href,
    title,
    description:
      firstVal(og['og:description']) ||
      firstVal(tw['twitter:description']) ||
      firstVal(meta.description) ||
      '',
    image: firstVal(og['og:image']) || firstVal(tw['twitter:image']) || '',
    favicon,
    openGraph: og,
    twitter: tw,
    meta,
    jsonLd,
    html: {
      lang: root.querySelector('html')?.getAttribute('lang') ?? '',
      titleTag: root.querySelector('title')?.text?.trim() ?? '',
    },
    links: {
      canonical,
      manifest,
      icons: dedupeBy(icons, (i) => i.href),
      alternates: dedupeBy(
        alternates,
        (a) => `${a.href}:${a.hreflang ?? ''}:${a.type ?? ''}`,
      ),
      feeds: dedupeBy(feeds, (f) => f.href),
    },
    derived: {
      siteName: firstVal(og['og:site_name']),
      type: firstVal(og['og:type']),
      locale: firstVal(og['og:locale']),
      robots: firstVal(meta.robots),
      themeColor: firstVal(meta['theme-color']),
      author: firstVal(meta.author),
      generator: firstVal(meta.generator),
    },
  };
}

async function screenshot(url: URL) {
  const res = await $fetch<any>('https://api.microlink.io/', {
    query: { url: url.href, screenshot: true },
    timeout: 15000,
  });

  if (!res?.data?.screenshot?.url) {
    throw createError({
      statusCode: 502,
      message: 'Screenshot could not be generated.',
    });
  }

  return { url: res.data.screenshot.url };
}

export default defineEventHandler(async (event) => {
  if (getHeader(event, 'x-og-client') !== ALLOWED_CLIENT) {
    throw createError({ statusCode: 403, message: 'Forbidden' });
  }

  const {
    url: rawUrl,
    mode,
    refresh,
  } = getQuery(event) as Record<string, string>;

  if (mode !== 'inspect' && mode !== 'screenshot') {
    throw createError({ statusCode: 400, message: 'Invalid mode.' });
  }

  if (!rawUrl) {
    throw createError({ statusCode: 400, message: 'URL required.' });
  }

  const url = parseUrl(rawUrl);
  if (!url) {
    throw createError({
      statusCode: 400,
      message: 'Invalid or forbidden URL.',
    });
  }

  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown';
  const rateLimitKey = `${ip}:${mode}:${btoa(url.href)}`;
  const cacheKey = `fetch:${mode}:${btoa(url.href)}`;

  const rateLimit = useStorage('rate-limit');
  const cache = useStorage('cache');

  await checkRateLimit(rateLimit, rateLimitKey);

  setResponseHeaders(event, {
    'Cache-Control': 'no-store',
    Pragma: 'no-cache',
  });

  if (refresh !== 'true') {
    const cached = await cache.getItem(cacheKey);
    if (cached) return cached;
  } else {
    await cache.removeItem(cacheKey);
  }

  try {
    const data =
      mode === 'inspect' ? await inspectUrl(url) : await screenshot(url);
    await cache.setItem(cacheKey, data, { ttl: CACHE_TTL });
    return data;
  } catch (err: any) {
    throw createError({
      statusCode: err?.statusCode ?? 500,
      message: err?.message ?? 'The target website could not be reached.',
    });
  }
});
