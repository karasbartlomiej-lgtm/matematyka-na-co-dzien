const cacheName='matematyka-v2-klasa3'
const files=['./','./index.html','./style.css','./app.mjs','./math.mjs','./grade3-bank.mjs','./game.mjs','./profile-lock.mjs','./profile-sync.mjs','./wake-lock.mjs','./logo.svg','./icon-192.png','./icon-512.png','./app.webmanifest',...Array.from({length:18},(_,i)=>'./pets/pet-'+i+'.png')]
self.addEventListener('install',event=>event.waitUntil(caches.open(cacheName).then(cache=>cache.addAll(files.map(path=>new Request(path,{cache:'reload'})))).then(()=>self.skipWaiting())))
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('matematyka-')&&key!==cacheName).map(key=>caches.delete(key)))).then(()=>self.clients.claim())))
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url)
 if(event.request.method!=='GET'||url.origin!==self.location.origin)return
 if(event.request.mode==='navigate'){
  event.respondWith(fetch(event.request).catch(()=>caches.match('./index.html')))
  return
 }
 event.respondWith(caches.open(cacheName).then(cache=>cache.match(event.request)).then(hit=>hit??fetch(event.request)))
})
