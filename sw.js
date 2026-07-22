const APP_VERSION='5.0.0-rc.2';
const CACHE=`poolcheck-v${APP_VERSION}`;
const ASSETS=['./','./index.html','./manifest.json','./css/styles.css','./js/storage.js?v=5.0.0-rc.2','./js/chemistry.js?v=5.0.0-rc.2','./js/weather.js?v=5.0.0-rc.2','./js/water.js?v=5.0.0-rc.2','./js/intelligence.js?v=5.0.0-rc.2','./js/vision.js?v=5.0.0-rc.2','./js/app.js?v=5.0.0-rc.2','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 e.respondWith(fetch(e.request).then(r=>{if(r&&r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));}return r;}).catch(async()=>{
  const cached=await caches.match(e.request);
  if(cached)return cached;
  if(e.request.mode==='navigate')return caches.match('./index.html');
  return new Response('Offline',{status:503,statusText:'Offline'});
 }));
});
