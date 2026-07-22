const APP_VERSION='5.0.0-rc.3';
const CACHE=`poolcheck-v${APP_VERSION}`;
const ASSETS=['./','./index.html','./manifest.json','./css/styles.css','./js/storage.js?v=5.0.0-rc.3','./js/chemistry.js?v=5.0.0-rc.3','./js/weather.js?v=5.0.0-rc.3','./js/water.js?v=5.0.0-rc.3','./js/intelligence.js?v=5.0.0-rc.3','./js/vision.js?v=5.0.0-rc.3','./js/app.js?v=5.0.0-rc.3','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('poolcheck-v')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{
      const copy=response.clone();
      caches.open(CACHE).then(cache=>cache.put('./index.html',copy));
      return response;
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
    if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
    return response;
  })));
});
