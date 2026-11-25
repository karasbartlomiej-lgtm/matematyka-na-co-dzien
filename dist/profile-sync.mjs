const api='https://matematyka-profile-rodzinne.karas-bartlomiej.chatgpt.site/v1/'
const hex=data=>Array.from(new Uint8Array(data),x=>x.toString(16).padStart(2,'0')).join('')
const bytes=s=>Uint8Array.from(s.match(/../g),x=>parseInt(x,16))
export const newToken=()=>hex(crypto.getRandomValues(new Uint8Array(32)))
export async function openSync(token,pin){
 if(!/^[a-f0-9]{64}$/.test(token))throw Error('Niepoprawny link profilu.')
 const secret=bytes(token)
 const url=api+hex(await crypto.subtle.digest('SHA-256',secret))
 if([...pin].length<1||[...pin].length>4)throw Error('Hasło powinno mieć od 1 do 4 znaków.')
 const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(pin),'PBKDF2',false,['deriveKey'])
 const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:secret,hash:'SHA-256',iterations:210000},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])
 return {
  async read(){
   const res=await fetch(url,{cache:'no-store'})
   if(!res.ok)throw Error('Nie udało się pobrać profilu.')
   const data=new Uint8Array(await res.arrayBuffer())
   const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:data.slice(0,12)},key,data.slice(12))
   return {profile:JSON.parse(new TextDecoder().decode(plain)),tag:res.headers.get('ETag')}
  },
  async write(profile,tag){
   const iv=crypto.getRandomValues(new Uint8Array(12))
   const data=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(JSON.stringify(profile)))
   const res=await fetch(url,{method:'PUT',headers:tag?{'If-Match':tag}:{'If-None-Match':'*'},body:new Blob([iv,data],{type:'application/octet-stream'})})
   if(!res.ok)throw Error(res.status===412?'Na drugim telefonie jest nowsza wersja. Zapisz kopię lokalną i ponownie otwórz link profilu.':'Synchronizacja niedostępna. Postępy są na tym urządzeniu.')
   const next=res.headers.get('ETag')
   if(!next)throw Error('Brak potwierdzenia wersji.')
   return next
  }
 }
}
