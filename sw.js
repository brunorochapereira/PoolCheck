const CACHE='poolcheck-v3-7-0';
const ASSETS=['./','index.html','css/styles.css','js/storage.js','js/chemistry.js','js/weather.js','js/water.js','js/app.js','manifest.json'];
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));});
self.addEventListener('activate',event=>event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)));await self.clients.claim();})()));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 event.respondWith((async()=>{
  try{const response=await fetch(event.request,{cache:'no-store'});const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response;}
  catch(error){return (await caches.match(event.request))||(await caches.match(new URL(event.request.url).pathname.split('/').pop()))||Response.error();}
 })());
});
