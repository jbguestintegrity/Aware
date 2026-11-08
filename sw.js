/* Map Study offline cache. The publish workflow replaces __BUILD__ on every publish. */
const BUILD="__BUILD__";
const CACHE="mapstudy-"+BUILD;
const CORE=["./","index.html","lib/d3.min.js","manifest.webmanifest","version.json","media.json","icons/icon-192.png","icons/icon-512.png","icons/apple-touch-icon.png"];
const FONT_HOSTS=["fonts.googleapis.com","fonts.gstatic.com"];
self.addEventListener("install",e=>{
  e.waitUntil((async()=>{
    const c=await caches.open(CACHE);
    await c.addAll(CORE.map(u=>new Request(u,{cache:"reload"})));
    try{
      const m=await (await fetch("media.json",{cache:"reload"})).json();
      for(const f of (m.files||[])){
        const u=f.split("/").map(encodeURIComponent).join("/");
        try{ await c.add(new Request(u,{cache:"reload"})); }catch(err){}
      }
    }catch(err){}
  })());
});
self.addEventListener("activate",e=>{
  e.waitUntil((async()=>{
    for(const k of await caches.keys()) if(k!==CACHE && k.startsWith("mapstudy-")) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener("message",e=>{ if(e.data==="skipWaiting") self.skipWaiting(); });
self.addEventListener("fetch",e=>{
  const r=e.request; if(r.method!=="GET") return;
  const u=new URL(r.url);
  const font=FONT_HOSTS.includes(u.hostname);
  if(u.origin!==location.origin && !font) return;
  e.respondWith((async()=>{
    const c=await caches.open(CACHE);
    const hit=await c.match(r,{ignoreSearch:true});
    if(hit) return hit;
    try{
      const res=await fetch(r);
      if(res && (res.ok || res.type==="opaque")) c.put(r,res.clone());
      return res;
    }catch(err){
      if(r.mode==="navigate"){ const h=await c.match("index.html"); if(h) return h; }
      throw err;
    }
  })());
});
