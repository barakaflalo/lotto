/* Lotto Israel SW v1 — network-first pages with offline fallback, cache-first static files,
   deletes ONLY its own old caches, cleans "redirected" page responses (Cloudflare pretty URLs). */
const CACHE='lotto-v1';
const FILES=['./','./manifest.json','./icon-192.png','./icon-512.png','./privacy_policy.html'];
function cleanNav(r){ if(!r||!r.redirected) return r; return r.blob().then(b=>new Response(b,{status:r.status,statusText:r.statusText,headers:r.headers})); }
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>Promise.allSettled(FILES.map(p=>fetch(new Request(p,{cache:'reload'})).then(r=>{ if(r&&r.ok) return c.put(p,r); }))) ).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('lotto-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET') return;
  const url=new URL(req.url); if(url.origin!==self.location.origin) return;
  if(req.mode==='navigate'){
    e.respondWith(fetch(req).then(r=>{ if(r&&r.ok){ const cp=r.clone(); caches.open(CACHE).then(c=>c.put('./',cp)); } return r; })
      .catch(()=>caches.match('./').then(r=>cleanNav(r)||new Response('<h2 style="font-family:sans-serif;text-align:center;margin-top:40vh">אין חיבור — נסה שוב</h2>',{headers:{'content-type':'text/html; charset=utf-8'}}))));
    return;
  }
  e.respondWith(caches.match(req).then(hit=>{ const net=fetch(req).then(r=>{ if(r&&r.ok){ const cp=r.clone(); caches.open(CACHE).then(c=>c.put(req,cp)); } return r; }).catch(()=>hit); return hit||net; }));
});
