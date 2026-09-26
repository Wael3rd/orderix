// KitKat Fighters : service worker (hors ligne)
const VERSION = "kkf-v3";
const SHELL = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/maskable-512.png",
  "icons/apple-touch-icon.png",
  "icons/favicon-64.png",
  "img/sakura-kinako.jpg",
  "img/otona-berry.jpg",
  "img/ny-cheesecake.jpg",
  "img/choco-orange.jpg",
  "img/matcha.jpg",
  "img/peche.jpg",
  "img/fraise-choco.jpg",
  "img/melon.jpg",
  "img/fraise-cheesecake.jpg",
  "img/pine-ame.jpg",
  "img/shima-lemon.jpg",
  "img/wasabi.jpg",
  "img/beni-imo.jpg",
  "thumb/sakura-kinako.jpg",
  "thumb/otona-berry.jpg",
  "thumb/ny-cheesecake.jpg",
  "thumb/choco-orange.jpg",
  "thumb/matcha.jpg",
  "thumb/peche.jpg",
  "thumb/fraise-choco.jpg",
  "thumb/melon.jpg",
  "thumb/fraise-cheesecake.jpg",
  "thumb/pine-ame.jpg",
  "thumb/shima-lemon.jpg",
  "thumb/wasabi.jpg",
  "thumb/beni-imo.jpg"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.hostname.endsWith("supabase.co")) return;              // avis : toujours en direct
  const isPage = req.mode === "navigate" || url.pathname.endsWith("/index.html");
  if (isPage) {                                                  // page : réseau d'abord, cache si hors ligne
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(VERSION).then(ca => ca.put("index.html", c)); return r; })
      .catch(() => caches.match("index.html")));
    return;
  }
  e.respondWith(caches.match(req).then(hit => {                  // le reste : cache d'abord, mise à jour en fond
    const net = fetch(req).then(r => { if (r.ok || r.type === "opaque") { const c = r.clone(); caches.open(VERSION).then(ca => ca.put(req, c)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
