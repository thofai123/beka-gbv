// BEKA service worker — offline support with fresh app shell updates.
const VERSION = "v5-2026-06-04";
const SHELL_CACHE = `beka-shell-${VERSION}`;
const DATA_CACHE = `beka-data-${VERSION}`;
const ASSET_CACHE = `beka-assets-${VERSION}`;

const SHELL_URLS = ["/", "/panic", "/contacts", "/resources", "/index.html", "/manifest.json"];
const DEV_PATHS = ["/src/", "/node_modules/.vite/", "/@vite", "/@react-refresh"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((key) => {
      if (![SHELL_CACHE, DATA_CACHE, ASSET_CACHE].includes(key)) return caches.delete(key);
      return Promise.resolve();
    })))
  );
  self.clients.claim();
});

async function networkFirst(req, cacheName, fallbackUrl = null) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req, { cache: "no-store" });
    if (res?.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return (await cache.match(req)) || (fallbackUrl ? cache.match(fallbackUrl) : undefined) || Response.error();
  }
}

async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const network = fetch(req).then((res) => {
    if (res?.ok) cache.put(req, res.clone());
    return res;
  }).catch(() => null);

  return cached || (await network) || new Response(JSON.stringify({ offline: true }), {
    status: 503,
    headers: { "Content-Type": "application/json" },
  });
}

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res?.ok) cache.put(req, res.clone());
  return res;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (req.method !== "GET") return;

  if (url.origin === self.location.origin && DEV_PATHS.some((path) => url.pathname.startsWith(path))) {
    event.respondWith(fetch(req, { cache: "no-store" }));
    return;
  }

  if (url.origin !== self.location.origin) {
    event.respondWith(cacheFirst(req, ASSET_CACHE));
    return;
  }

  if (req.mode === "navigate" || req.headers.get("accept")?.includes("text/html")) {
    event.respondWith(networkFirst(req, SHELL_CACHE, "/"));
    return;
  }

  if (/\.(js|css)$/i.test(url.pathname)) {
    event.respondWith(networkFirst(req, SHELL_CACHE));
    return;
  }

  if (/\.(woff2?|png|jpg|jpeg|svg|ico|webp)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(req, ASSET_CACHE));
    return;
  }

  const isCriticalApi =
    url.pathname.includes("/entities/Resource") ||
    url.pathname.includes("/entities/EmergencyContact") ||
    url.pathname.includes("/auth/me");

  if (isCriticalApi) {
    event.respondWith(staleWhileRevalidate(req, DATA_CACHE));
  }
});