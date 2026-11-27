import {openSync,newToken} from './profile-sync.mjs'
import { createFamilyVault, sealPassword, verifyProfile } from './profile-lock.mjs'
import { grades, levels, exercise, matches, parse } from './math.mjs'
import { supplies, stock, buySupply, getSupply, animals, groups, ranks, thresholds, profile, initial, record, progress, rank, dailyStats, dailySet, value, claim, claimed, gradeAnswer, buy, care, readPet, feedingCost, feedingStatus, pointsForAnswer, valid, today } from './game.mjs'

import { createScreenWakeLock } from './wake-lock.mjs'

const $=id=>document.getElementById(id)
const storage='matematyka-na-co-dzien-v1'
let state=initial()
let unlocked=null
let loginTarget=null
let loadError=false
try {const raw=localStorage.getItem(storage);if(raw){const saved=JSON.parse(raw);if(valid(saved))state=saved;else loadError=true}}
catch {loadError=true}
const screenWakeStatus={
 off:'Ekran wygasza się zgodnie z ustawieniami urządzenia.',
 pending:'Włączam zapobieganie wygaszaniu…',
 active:'Ekran pozostanie włączony, gdy aplikacja jest widoczna.',
 paused:'Po powrocie aplikacja ponowi próbę.',
 blocked:'Urządzenie nie utrzymuje teraz ekranu włączonego. Przełącz opcję ponownie lub sprawdź tryb oszczędzania energii.',
 unsupported:'Ta przeglądarka nie obsługuje zapobiegania wygaszaniu.'
}
let wakeStatus='off'
const wakeLock=createScreenWakeLock({
 request:typeof navigator.wakeLock?.request==='function'?()=>navigator.wakeLock.request('screen'):null,
 isVisible:()=>document.visibilityState==='visible',
 onStatus:status=>{
  wakeStatus=status
  const message=$('wake-status')
  if(message)message.textContent=screenWakeStatus[status]
 }
})
const syncWakeLock=()=>wakeLock.sync(state.keepScreenAwake===true)
const active=()=>state.profiles.find(x=>x.id===state.active)
let page='learn', chosen=null, level=4, limit=10, session=null, group=0, draft=null, fx=null, toastTimer
const esc=x=>String(x).replace(/[&<>"']/g,k=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[k]))
const coins='<span class="coin" aria-hidden="true">✦</span>'
const format=n=>n.toLocaleString('pl-PL')
const signedPoints=n=>n>0?'+'+format(n):n<0?'−'+format(-n):'0'
const icons={
 learn:'M3 5c4-1 7 0 9 2 2-2 5-3 9-2v14c-4-1-7 0-9 2-2-2-5-3-9-2z M12 7v14',
 challenges:'M13 2 4 14h7l-1 8 10-12h-7z',
 shop:'M4 9h16l-1 12H5z M8 9V7a4 4 0 0 1 8 0v2',
 pets:'M12 12c3 0 7 4 7 7 0 2-2 3-4 2-2-1-4-1-6 0-2 1-4 0-4-2 0-3 4-7 7-7z M4 12c-3 0-3-5 0-5s3 5 0 5z M9 8c-3 0-3-6 0-6s3 6 0 6z M15 8c-3 0-3-6 0-6s3 6 0 6z M20 12c-3 0-3-5 0-5s3 5 0 5z',
 profile:'M16 7a4 4 0 1 1-8 0 4 4 0 1 1 8 0z M4 21v-2c0-4 4-6 8-6s8 2 8 6v2z',
 stats:'M3 20h18 M6 16v-5m6 5V4m6 12V8', rank:'M5 3h14v6c0 5-3 7-7 7s-7-2-7-7z M5 6H2v3c0 3 2 4 4 4m13-7h3v3c0 3-2 4-4 4m-6 3v5m-5 0h10',
 users:'M16 17h6m-3-3v6 M13 7a4 4 0 1 1-8 0 4 4 0 1 1 8 0z M2 21v-2c0-4 4-6 8-6 2 0 3 .4 4 1',
 inventory:'M3 8h18v13H3z M2 4h20v4H2z M9 12h6',settings:'M4 6h16M4 12h16M4 18h16 M8 3v6m8 0v6m-5 0v6',
 menu:'M4 6h16M4 12h16M4 18h16', close:'m6 6 12 12m0-12L6 18', next:'m9 5 7 7-7 7', star:'m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z'
}
const icon=id=>'<svg class="ico" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="'+icons[id]+'"/></svg>'
const nav=[['learn','Nauka'],['challenges','Wyzwania'],['shop','Sklep'],['pets','Zwierzęta'],['profile','Profil']]
const side=[['learn','Nauka'],['challenges','Codzienne wyzwania'],['shop','Sklep'],['pets','Moje zwierzęta'],['inventory','Przedmioty dla zwierząt'],['stats','Statystyki'],['rank','Moja ranga'],['profile','Profil'],['users','Zmień użytkownika'],['settings','Ustawienia']]
const button=(action,label,opt={})=>'<button type="button" data-action="'+action+'"'+(opt.val!==undefined?' data-value="'+esc(opt.val)+'"':'')+(opt.class?' class="'+opt.class+'"':'')+(opt.label?' aria-label="'+opt.label+'"':'')+(opt.pressed!==undefined?' aria-pressed="'+opt.pressed+'"':'')+(opt.disabled?' disabled':'')+'>'+label+'</button>'
const route=(id,label,cls='')=>button('go',label,{val:id,class:cls})
const bar=(n,label='Postęp')=>'<span class="bar" role="progressbar" aria-label="'+esc(label)+'" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+n+'"><span style="width:'+n+'%"></span></span>'
const balance=p=>button('go',coins+' '+format(p.coins),{val:'shop',class:'balance',label:format(p.coins)+' monet, przejdź do sklepu'})
const preset=['🧑‍🚀','🧙','👩‍🔬','🥷','👨‍🎨','🦸']
const skin=['#f6c299','#dc9569','#a66145','#734530']
const faceShapes=[[14,16],[13,17],[15,15],[16,15]]
const shirts=['#00a89c','#526de0','#db5377','#e29b32']
const hairs=[
 '<path d="M20 31q1-18 13-17 11-2 14 17-11 1-18-7-2 5-9 7" fill="#382838"/>',
 '<path d="M17 38q-1-25 15-25 16 0 16 25l-7-2-2-17-19 14z" fill="#9b5139"/>',
 '<path d="M18 27q-2-8 4-9-1-8 7-5 5-7 10 0 9-1 9 12l-5 5-8-6-9 4z" fill="#513620"/>',
 '<path d="M20 26q0-14 12-14 11 0 15 13l-9 1-4-4-7 5z" fill="#d69b39"/>'
]
const accents=['','<path d="M17 23q2-14 15-14t15 14H17m12 0h25" fill="#168aa9" stroke="#168aa9" stroke-width="3"/>','<g fill="none" stroke="#263941" stroke-width="2"><rect x="22" y="31" width="8" height="6" rx="2"/><rect x="34" y="31" width="8" height="6" rx="2"/><path d="M30 33h4"/></g>','<path d="m26 49 6 5 6-5v10l-6-5-6 5z" fill="#b92f57"/>']
function animal(i,pet,animate){
 const action=animate&&fx?.i===i?fx.action:''
 const effect={food:'♥',play:'✦',sleep:'zZ',wake:'☀',buy:'✦'}[action]??(pet?.sleep?'zZ':'')
 return '<div class="animal '+(pet?.sleep?'sleep ':'')+(action?'fx-'+action:'')+'"><img src="./pets/pet-'+i+'.png" alt="" width="240" height="220">'+(effect?'<span class="fx" aria-hidden="true">'+effect+'</span>':'')+'</div>'
}
function avatar(a){
 let art=preset[a.preset]
 if(a.type==='pet')art=animal(a.pet)
 if(a.type==='custom')art='<svg class="person" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" fill="#c8f3fa"/><path d="M10 64q0-18 22-18t22 18z" fill="'+shirts[a.shirt]+'"/><ellipse cx="32" cy="33" rx="'+faceShapes[a.face][0]+'" ry="'+faceShapes[a.face][1]+'" fill="'+skin[a.face]+'"/>'+hairs[a.hair]+'<circle cx="27" cy="34" r="1.6" fill="#1d2532"/><circle cx="37" cy="34" r="1.6" fill="#1d2532"/><path d="M28 40q4 5 8 0" fill="none" stroke="#582f30" stroke-width="1.7"/>'+accents[a.accessory]+'</svg>'
 return '<span class="avatar" aria-hidden="true">'+art+'</span>'
}
function toast(message,celebrate=false){
 clearTimeout(toastTimer)
 $('toast').textContent=message
 if(celebrate&&state.motion){
  const burst=document.createElement('div')
  burst.className='confetti';burst.setAttribute('aria-hidden','true')
  for(let i=0;i<21;i++){
   const dot=document.createElement('i'), angle=i*2.4,r=65+(i%5)*18
   dot.style.cssText='--x:'+Math.round(Math.cos(angle)*r)+'px;--y:'+Math.round(Math.sin(angle)*r)+'px;--c:'+['#f9bf39','#00b8a9','#48cae4','#e778af'][i%4]
   burst.append(dot)
  }
  document.body.append(burst);setTimeout(()=>burst.remove(),1000)
 }
 toastTimer=setTimeout(()=>$('toast').textContent='',3800)
}
const linkedToken=new URLSearchParams(location.hash.slice(1)).get('profil')
let pendingLink=linkedToken,cloud=null,loginPin=null
let syncQueue=Promise.resolve()
function syncSave(){
 const conn=cloud
 if(!conn||conn.id!==unlocked||conn.id!==active().id)return
 const data=structuredClone(active()), meta=state.links[conn.id]
 meta.dirty=true
 syncQueue=syncQueue.then(async()=>{
  try{
   meta.tag=await conn.api.write(data,meta.tag)
   if(JSON.stringify(state.profiles.find(x=>x.id===conn.id))===JSON.stringify(data)){meta.dirty=false;if(published.get(conn.id)!==boardEntry(data))void updateBoard()}
   localStorage.setItem(storage,JSON.stringify(state))
  }catch(err){toast(err.message)}
 })
}
async function connectProfile(){
 const p=active()
 await syncQueue
 let meta=state.links?.[p.id]
 if(!meta){
  const token=newToken(),api=await openSync(token,loginPin)
  const tag=await api.write(p,null)
  meta={token,tag};(state.links??={})[p.id]=meta
  cloud={api,id:p.id}
  localStorage.setItem(storage,JSON.stringify(state))
 }
 const url=new URL(location.href);url.hash='profil='+meta.token
 prompt('Skopiuj prywatny link na drugi telefon. Do otwarcia profilu potrzebne jest także jego hasło.',url.href)
}
async function sessionStore(){
 return new Promise((resolve,reject)=>{
  const r=indexedDB.open('mat-zaufane-urzadzenie',1)
  r.onupgradeneeded=()=>r.result.createObjectStore('session')
  r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)
 })
}
async function rememberLogin(p,pw){
 const key=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt'])
 const iv=crypto.getRandomValues(new Uint8Array(12))
 const data=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(pw))
 const db=await sessionStore()
 const tx=db.transaction('session','readwrite')
 tx.objectStore('session').put({id:p.id,iv,key,data},'last')
 await new Promise((ok,no)=>{tx.oncomplete=ok;tx.onerror=no})
 db.close();localStorage.setItem('mat-last',p.id)
}
async function resumeLogin(){
 if(pendingLink||localStorage.getItem('mat-last')!==active().id)return
 const db=await sessionStore(),r=db.transaction('session').objectStore('session').get('last')
 const v=await new Promise((ok,no)=>{r.onsuccess=()=>ok(r.result);r.onerror=no});db.close()
 if(v?.id!==active().id||!active().lock)return
 const pw=new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:v.iv},v.key,v.data))
 const form=$('login-form')
 if(form&&loginTarget===null){form.elements.password.value=pw;form.requestSubmit()}
}
function downloadJson(name,data){
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}))
 const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500)
}
async function rememberPassword(p,pw){
 if(!state.vault)return
 state.vault.entries[p.id]={name:p.name,ciphertext:await sealPassword(state.vault.publicKey,pw)}
}
function save(){
 try {syncSave();localStorage.setItem(storage,JSON.stringify(state));if(unlocked===active().id&&published.get(unlocked)!==boardEntry(active()))void updateBoard();return true}
 catch {toast('Nie udało się zapisać danych na urządzeniu. Wyeksportuj kopię w ustawieniach.');return false}
}
function go(target){
 page=target
 if(target==='learn'){session=null;chosen=null}
 if(target==='profile')draft=null
 if($('menu').open)$('menu').close()
 render(true)
 if(target==='learn')void updateBoard()
}
function head(title,note=''){return '<header class="stack"><h1>'+title+'</h1>'+(note?'<p>'+note+'</p>':'')+'</header>'}
function header(p){
 $('top').innerHTML='<div class="top-inner">'+route('learn','<img src="./logo.svg" alt=""><b>Matematyka<br>na co dzień</b>','brand')+'<div class="top-actions">'+balance(p)+button('go',avatar(p.avatar),{val:'profile',class:'icon-btn',label:'Profil: '+esc(p.name)})+button('menu',icon('menu'),{class:'icon-btn',label:'Otwórz menu boczne'})+'</div></div>'
 $('bottom').innerHTML='<div class="nav-inner">'+nav.map(([id,label])=>route(id,icon(id)+esc(label),(page===id||id==='learn'&&['setup','task','result'].includes(page))?'selected':'')).join('')+'</div>'
 $('menu').innerHTML='<div class="menu-head"><h2>Menu</h2>'+button('close-menu',icon('close'),{class:'icon-btn',label:'Zamknij menu'})+'</div><nav>'+side.map(([id,label])=>route(id,icon(id)+esc(label),page===id?'selected':'')).join('')+'</nav>'
}
function challengeCards(p,compact){
 const date=today(),d=dailyStats(p,active().grade,date)
 return dailySet(active().grade,date).map(c=>{
  const n=Math.min(c.target,value(d,c)), done=claimed(p,c.id,date)
  return '<article class="'+(compact?'mini-challenge':'challenge')+'"><div class="row"><strong>'+esc(c.name)+'</strong><span class="reward" title="Monety">+'+c.reward+'</span></div>'+bar(100*n/c.target,c.name)+'<small>'+n+' / '+c.target+(done?' · Nagroda odebrana':'')+'</small>'+(!compact&&!done?button('claim','Odbierz nagrodę',{val:c.id,disabled:n<c.target,class:'primary'}):'')+'</article>'
 }).join('')
}
const boardUrl='https://matematyka-profile-rodzinne.karas-bartlomiej.chatgpt.site/ranking'
let boardRows=null, boardOpen=false, boardMessage='',boardBusy=false,boardAgain=false
const published=new Map()
const boardEntry=p=>JSON.stringify({name:p.name,pets:Object.keys(p.pets).map(Number).sort((a,b)=>a-b)})
try{boardRows=JSON.parse(localStorage.getItem('ostatni-ranking')||'null')}catch{}
async function boardAuth(p){
 const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('ranking/v1/'+p.id+'/'+p.lock.digest))
 return 'Bearer '+Array.from(new Uint8Array(hash),n=>n.toString(16).padStart(2,'0')).join('')
}
function leaderboard(){
 const rows=boardRows??[],list=boardOpen?rows:rows.slice(0,4)
 let place=0
 return '<section id="ranking-online" class="panel stack"><h2>Ranking zwierząt</h2><small>Wspólny ranking według wartości zakupionych zwierząt</small>'+list.map((r,i)=>{
  if(!i||rows[i-1].value!==r.value)place=i+1
  return '<div class="row spaced"><strong>'+place+'. '+esc(r.name)+'</strong><span>'+r.count+' szt. · '+format(r.value)+' monet</span></div>'
 }).join('')+(rows.length>4?button('more-ranks',boardOpen?'Zwiń listę':'Pokaż pozostałych ('+(rows.length-4)+')',{pressed:boardOpen}):'')+'<small role="status">'+esc(boardMessage||(!boardRows?'Pobieranie rankingu…':!rows.length?'Brak wyników.':''))+'</small></section>'
}
function paintBoard(){const node=$('ranking-online');if(node)node.outerHTML=leaderboard()}
async function updateBoard(){
 const p=active()
 if(!p?.lock||unlocked!==p.id)return
 if(boardBusy){boardAgain=true;return}
 boardBusy=true
 try{
  const entry=boardEntry(p)
  const options={cache:'no-store',signal:AbortSignal.timeout(12000)}
  if(!state.links?.[p.id]?.dirty&&published.get(p.id)!==entry){
   const response=await fetch(boardUrl,{...options,method:'PUT',headers:{Authorization:await boardAuth(p),'Content-Type':'application/json'},body:entry})
   if(!response.ok)throw Error()
   published.set(p.id,entry)
  }
  if(page==='learn'){
   const response=await fetch(boardUrl,options)
   if(!response.ok)throw Error()
   boardRows=await response.json()
   localStorage.setItem('ostatni-ranking',JSON.stringify(boardRows))
  }
  boardMessage=''
 }catch{boardMessage=boardRows?'Brak połączenia z rankingiem. Wyświetlono ostatnio pobraną listę.':'Nie udało się pobrać rankingu. Ponowimy próbę.'}
 finally{boardBusy=false;paintBoard();if(boardAgain){boardAgain=false;void updateBoard()}}
}
setInterval(()=>{if(!document.hidden&&page==='learn')void updateBoard()},30000)
window.addEventListener('online',updateBoard)
function learn(p){
 const r=rank(p)
 return '<div class="dashboard"><div class="stack"><section class="hero"><div class="hero-art" aria-hidden="true"><img src="./logo.svg" alt=""><span>+</span><span>✦</span></div><div class="kicker">Trening matematyczny · Klasa '+p.grade+'</div><h1 class="hero-title">Cześć, '+esc(p.name)+'!</h1><p>Rozwiązuj zadania, zbieraj monety i odkrywaj zwierzęta.</p></section>'+leaderboard()+'<div class="mobile-status"><span>'+ranks[r.index]+'</span>'+route('challenges',icon('challenges')+' Wyzwania dnia')+'</div><div>'+route('users',icon('users')+' Zmień użytkownika')+'</div><section class="stack"><h2>Wybierz klasę</h2><div class="grade-list">'+grades.slice(1).map((_,i)=>button('grade',i+1,{val:i+1,pressed:p.grade===i+1,class:p.grade===i+1?'primary':'',label:'Klasa '+(i+1)})).join('')+'</div></section><section><div class="section-top"><h2>Kategorie matematyczne</h2><small>Klasa '+active().grade+'</small></div><div class="topics">'+grades[active().grade].map(c=>{
  const percent=progress(record(p,active().grade,c.id))
  return button('topic','<span class="symbol" aria-hidden="true">'+c.icon+'</span><strong>'+c.name+'</strong><span class="topic-meta"><small>'+percent+'%</small>'+bar(percent,c.name)+'</span>'+icon('next'),{val:c.id,class:'topic'})
 }).join('')+'</div></section></div><aside class="stack"><section class="panel"><div class="section-top"><h2>Wyzwania dnia</h2>'+icon('challenges')+'</div>'+challengeCards(p,true)+route('challenges','Zobacz wyzwania','wide')+'</section><section class="rank-card"><div class="kicker">Twoja ranga</div><h3>'+ranks[r.index]+'</h3><p>'+r.total+' opanowanych kategorii</p>'+route('rank','Zobacz rangi')+'</section></aside></div>'
}
function setup(){
 return '<div class="screen narrow">'+head(chosen.name,'Klasa '+active().grade+' · '+signedPoints(pointsForAnswer(true,level))+' pkt za poprawną, '+signedPoints(pointsForAnswer(false,level))+' pkt za błędną odpowiedź')+'<div class="panel stack"><fieldset><legend>Poziom trudności</legend><div class="choice">'+levels.map((x,i)=>button('level','<span class="stars">'+('★'.repeat(i+1))+'</span>'+x,{val:i+3,class:'level '+(level===i+3?'selected':''),pressed:level===i+3})).join('')+'</div></fieldset><fieldset><legend>Liczba zadań</legend><div class="choice">'+[5,10,15,20,30,50,0].map(n=>button('limit',n||'Bez limitu',{val:n,class:limit===n?'selected':'',pressed:limit===n})).join('')+'</div></fieldset></div><div class="actions">'+button('start','Rozpocznij trening',{class:'primary'})+route('learn','Wróć do kategorii')+'</div></div>'
}
function exerciseClock(q){
 if(!q.clock)return '';
 const {h,m}=q.clock, point=(n,r)=>[100+Math.sin(n*Math.PI/6)*r,100-Math.cos(n*Math.PI/6)*r], hand=(n,r,w)=>{const [x,y]=point(n,r);return '<line x1="100" y1="100" x2="'+x+'" y2="'+y+'" stroke="currentColor" stroke-width="'+w+'" stroke-linecap="round"/>'};
 return '<svg viewBox="0 0 200 200" width="210" height="210" role="img" aria-label="Zegar wskazówkowy" style="display:block;max-width:100%;margin:12px auto"><circle cx="100" cy="100" r="94" fill="none" stroke="currentColor" stroke-width="3"/>'+Array.from({length:60},(_,i)=>{const a=point(i/5,89),b=point(i/5,i%5===0?82:86);return '<line x1="'+a[0]+'" y1="'+a[1]+'" x2="'+b[0]+'" y2="'+b[1]+'" stroke="currentColor" stroke-width="'+(i%5===0?2:1)+'"/>'}).join('')+Array.from({length:12},(_,i)=>{const n=i+1,[x,y]=point(n,69);return '<text x="'+x+'" y="'+y+'" text-anchor="middle" dominant-baseline="central" font-size="15" fill="currentColor">'+n+'</text>'}).join('')+hand(h+m/60,43,7)+hand(m/5,65,4)+'<circle cx="100" cy="100" r="4" fill="currentColor"/></svg>';
}
function taskScreen(){
 const s=session,q=s.question, comparison=/^[<=>]$/.test(q.answer)
 const keys=comparison?['<','=','>','⌫']:/^\d{2}:\d{2}$/.test(q.answer)?['1','2','3','⌫','4','5','6',':','7','8','9','0']:['1','2','3','⌫','4','5','6','−','7','8','9','/','0',',']
 const feedback=s.checked?'<div class="feedback '+(s.ok?'':'error')+'" role="status">'+(s.ok?'<strong>Świetnie! '+signedPoints(pointsForAnswer(true,level))+' pkt</strong>':'<strong>Spróbujmy to razem rozwiązać. '+signedPoints(pointsForAnswer(false,level))+' pkt</strong><ol>'+q.steps.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol><p>Prawidłowy wynik <strong>'+esc(q.answer)+'</strong></p>')+'</div>':''
 return '<section class="screen narrow"><div class="row spaced"><h2>'+chosen.name+'</h2><span class="badge">Zadanie '+(s.done+(s.checked?0:1))+(s.limit?' / '+s.limit:'')+'</span></div><form id="answer-form" class="panel stack"><div class="question">'+esc(q.prompt)+exerciseClock(q)+'</div><label class="form-row">Twoja odpowiedź<input class="answer" id="answer" type="text" inputmode="none" autocomplete="off" spellcheck="false" maxlength="32" value="'+esc(s.input)+'" '+(s.checked?'readonly':'')+'></label><div class="keypad" aria-label="Klawiatura zadania">'+keys.map(k=>button('key',esc(k),{val:k,disabled:s.checked,label:k==='⌫'?'Usuń znak':undefined})).join('')+'</div>'+feedback+'<div class="actions"><button type="submit" class="primary" '+(s.checked?'disabled':'')+'>Sprawdź</button>'+button('next',s.limit&&s.done===s.limit?'Zobacz podsumowanie':'Następne zadanie',{disabled:!s.checked,class:s.checked?'primary':''})+'</div></form>'+button('finish','Zakończ trening')+'</section>'
}
function result(){
 const score=session.good*pointsForAnswer(true,level)+(session.done-session.good)*pointsForAnswer(false,level)
 return '<section class="screen narrow panel result"><div class="symbol" aria-hidden="true">✓</div><h1>Trening ukończony!</h1><p>Dobra robota! Każde zadanie pomaga Ci ćwiczyć.</p><div class="score">'+session.good+'/'+session.done+'</div><p>Poprawne odpowiedzi</p><div class="row">'+coins+' <strong>'+signedPoints(score)+' pkt w tym treningu</strong></div><div class="actions">'+button('again','Nowy trening',{class:'primary'})+route('learn','Wróć do nauki')+'</div></section>'
}
const supplyEffects=item=>item.action==='food'
 ? 'Pełny posiłek (15 odpowiedzi)'+' · Szczęście +'+item.happy
 : 'Szczęście +'+item.happy+' · Energia −'+item.energy
const supplyIcon=item=>'<span class="supply-icon" aria-hidden="true">'+item.icon+'</span>'
function accessoryShop(p){
 return [['food','Jedzenie'],['play','Zabawki']].map(([action,label])=>'<section class="stack"><h2>'+label+'</h2><div class="grid">'+supplies.filter(item=>item.action===action&&item.price).map(item=>
  '<article class="pet-card supply-card">'+supplyIcon(item)+'<h3>'+item.name+'</h3><small>'+supplyEffects(item)+'</small><small>'+(
   action==='food'?'Porcje w zapasie: '+stock(p,item):'Zabawy w zapasie: '+stock(p,item)+' · +'+item.uses+' po zakupie'
  )+'</small><div class="row">'+coins+' <strong>'+item.price+'</strong></div>'+
  button('buy-supply',p.coins<item.price?'Brakuje '+format(item.price-p.coins)+' monet':'Kup',{val:item.id,class:'primary',label:'Kup: '+item.name,disabled:p.coins<item.price})+'</article>'
 ).join('')+'</div></section>').join('')
}
function inventory(p){
 return '<section class="screen stack">'+head('Przedmioty dla zwierząt','Wybierz jedzenie lub zabawki. Kupione przedmioty możesz wykorzystać w zakładce Zwierzęta.')+balance(p)+accessoryShop(p)+route('pets','Moje zwierzęta')+'</section>'
}
function shop(p){
 return '<section class="screen"><div class="row spaced">'+head('Sklep ze zwierzętami','Kup towarzysza za monety zdobyte w treningu.')+balance(p)+'</div><div class="choice" aria-label="Kategorie zwierząt">'+route('inventory','Przedmioty dla zwierząt')+''+groups.map((n,i)=>button('group',n,{val:i,pressed:group===i,class:group===i?'selected':''})).join('')+'</div><div class="grid">'+animals.map(([name,price],i)=>Math.floor(i/6)!==group?'':'<article class="pet-card">'+animal(i,null,true)+'<h3>'+name+'</h3><div class="row">'+coins+' <strong>'+format(price)+'</strong></div>'+button('buy',p.pets[i]?'Kupione':p.coins<price?'Brakuje '+format(price-p.coins)+' monet':'Kup',{val:i,class:'primary',disabled:!!p.pets[i]||p.coins<price})+'</article>').join('')+'</div></section>'
}
function pets(p){
 const now=Date.now(), date=today(now), {fed,total,available}=feedingStatus(p,now)
 const missing=Math.max(0,feedingCost-available)
 return '<section class="screen">'+head('Moje zwierzęta')+route('inventory','Przedmioty dla zwierząt')+'<div class="panel stack"><div class="row spaced"><strong>Poprawne odpowiedzi do wykorzystania: '+format(available)+'</strong><strong>Nakarmione w ostatnich 24 h: '+fed+' / '+total+'</strong></div><p>Każde zwierzę potrzebuje co dzień '+feedingCost+' poprawnych odpowiedzi. Kup jedzenie w sklepie. Karmienie zużywa 15 poprawnych odpowiedzi z ostatnich 24 godzin. Pełny posiłek wystarcza na 24 godziny, a pełne szczęście i energia na 48 godzin.</p><small>Zabawki: '+p.toys+' · Drzemka trwa 2 minuty.</small>'+route('learn','Ćwicz i zdobądź odpowiedzi')+'</div>'+(total?'<div class="grid">'+Object.entries(p.pets).map(([i,raw])=>{
  const pet=readPet(raw,now,date), fedToday=pet.fedAt>now-86400000
  const meter=(label,n)=>'<div><div class="row"><small>'+label+'</small><small>'+Math.round(n)+' / 150 · '+Math.round(n/1.5)+'%</small></div>'+bar(n/1.5,label)+'</div>'
  return '<article class="pet-card">'+animal(+i,pet,true)+'<h3>'+animals[i][0]+(pet.sleep?' · śpi':'')+'</h3>'+
   '<small>'+ (fedToday?'Nakarmiony w ostatnich 24 h':missing?'Głodny · brakuje '+missing+' do '+feedingCost+' poprawnych odpowiedzi':pet.sleep?'Głodny · obudź przed karmieniem':'Głodny · posiłek gotowy')+'</small>'+
   '<div class="pet-bars">'+meter('Szczęście',pet.happy)+meter('Najedzenie',pet.food)+meter('Energia',pet.energy)+'</div><div class="actions">'+supplies.filter(item=>item.id!=='meal'&&stock(p,item)>0).map(item=>button('care',item.action==='food'?'Nakarm · '+item.name:'Baw się · '+item.name,{val:i+':'+item.action+':'+item.id,disabled:!!pet.sleep||(item.action==='food'?fedToday||missing>0:pet.happy>=150||pet.energy<45)})).join('')+button('care',pet.sleep?'Obudź':'Połóż spać',{val:i+(pet.sleep?':wake':':sleep')})+'</div></article>'
 }).join('')+'</div>':'<div class="panel empty stack"><h2>Jeszcze nie masz zwierząt</h2><p>Za 50 monet możesz kupić swojego pierwszego chomika.</p>'+route('shop','Przejdź do sklepu','primary')+'</div>')+'</section>'
}
function summaryStats(p){
 const days={}
 for(const [key,row] of Object.entries(p.daily)){
  const day=key.slice(0,10), sum=days[day]??={any:0,correct:0}
  sum.any+=row.any;sum.correct+=row.correct
 }
 days[today()]??={any:0,correct:0}
 const total=Object.values(p.stats).flat().reduce((sum,[n,c])=>({any:sum.any+n,correct:sum.correct+c}),{any:0,correct:0})
 return '<section class="panel stack"><h2>Wszystkie klasy</h2>'+[['Od początku profilu',total],...Object.entries(days).sort(([a],[b])=>b.localeCompare(a))].map(([label,v])=>'<div><strong>'+label+'</strong><p>Razem '+v.any+' · Dobre '+v.correct+' · Błędne '+(v.any-v.correct)+'</p></div>').join('')+'</section>'
}
function stats(p){
 return '<section class="screen">'+head('Statystyki','Klasa '+active().grade)+summaryStats(p)+'<div class="stack">'+grades[active().grade].map(c=>{
  const rows=record(p,active().grade,c.id),attempts=rows.reduce((s,r)=>s+r[0],0),correct=rows.reduce((s,r)=>s+r[1],0),pct=progress(rows)
  return '<article class="panel stat-row"><div class="row"><span class="symbol">'+c.icon+'</span><strong>'+c.name+'</strong></div><div class="row"><span>Rozwiązane <b>'+attempts+'</b></span><span>Poprawne <b>'+correct+'</b></span><span>Błędne <b>'+(attempts-correct)+'</b></span><span>Skuteczność <b>'+(attempts?Math.round(100*correct/attempts):0)+'%</b></span></div><small>Opanowanie '+pct+'%</small>'+bar(pct,c.name)+'</article>'
 }).join('')+'</div></section>'
}
function rankScreen(p){
 const r=rank(p)
 return '<section class="screen narrow">'+head('Moja ranga')+'<div class="rank-card"><h2>'+ranks[r.index]+'</h2><p>Opanowane kategorie we wszystkich klasach <b>'+r.total+'</b></p>'+(r.index<6?'<p>Do rangi '+ranks[r.index+1]+' potrzebujesz jeszcze '+(thresholds[r.index+1]-r.total)+' kategorii.</p>'+bar(Math.round(100*r.total/thresholds[r.index+1]),'Postęp do następnej rangi'):'<p>Zdobywasz najwyższą rangę!</p>')+'</div><div class="panel stack"><h3>Jak opanować kategorię?</h3><p>Na dostępnych poziomach rozwiąż co najmniej 12 zadań, podaj co najmniej 10 poprawnych odpowiedzi i utrzymaj skuteczność co najmniej 80%. Wyniki liczą się osobno dla każdej kategorii.</p></div>'+ranks.map((x,i)=>'<div class="panel row spaced"><strong>'+x+'</strong><small>'+thresholds[i]+' kategorii'+(r.index===i?' · Twoja ranga':'')+'</small></div>').join('')+'</section>'
}
function profileScreen(p){
 if(!draft)return '<section class="screen narrow">'+head('Profil')+'<div class="panel stack"><div class="row">'+avatar(p.avatar)+'<div><h2>'+esc(p.name)+'</h2><small>Klasa '+active().grade+'</small></div></div><div class="row spaced">'+balance(p)+'<strong>'+ranks[rank(p).index]+'</strong></div><p>Poprawne odpowiedzi do wykorzystania na karmienie: '+format(feedingStatus(p).available)+' · Zabawki '+p.toys+' · Zwierzęta '+Object.keys(p.pets).length+'</p><div class="actions">'+button('edit','Edytuj profil',{class:'primary'})+route('stats','Statystyki')+route('users','Zmień użytkownika')+route('settings','Ustawienia')+'</div></div></section>'
 const a=draft.avatar, select=(key,label,choices)=>'<label class="form-row">'+label+'<select data-avatar="'+key+'">'+choices.map((n,i)=>'<option value="'+i+'" '+(a[key]===i?'selected':'')+'>'+n+'</option>').join('')+'</select></label>'
 return '<section class="screen narrow">'+head('Edytuj profil')+'<form class="panel stack" id="profile-form"><div id="avatar-live">'+avatar(a)+'</div><label class="form-row">Imię lub pseudonim<input id="profile-name" name="name" value="'+esc(draft.name)+'" maxlength="28" required></label><div class="choice">'+[['preset','Gotowy awatar'],['custom','Własna postać'],['pet','Moje zwierzę']].map(([id,label])=>button('avatar-type',label,{val:id,pressed:a.type===id,class:a.type===id?'selected':'',disabled:id==='pet'&&!Object.keys(p.pets).length})).join('')+'</div>'+
 (a.type==='preset'?'<div class="avatar-options">'+preset.map((x,i)=>button('preset',x,{val:i,pressed:a.preset===i,label:'Awatar '+(i+1),class:a.preset===i?'selected':''})).join('')+'</div>':a.type==='custom'?select('face','Twarz',['Jasna','Brzoskwiniowa','Karmelowa','Brązowa'])+select('hair','Fryzura',['Krótka','Długa','Kręcona','Grzywka'])+select('shirt','Ubranie',['Turkusowe','Niebieskie','Różowe','Pomarańczowe'])+select('accessory','Akcesoria',['Bez akcesoriów','Czapka','Okulary','Mucha']):'<div class="choice">'+Object.keys(p.pets).map(i=>button('pet-avatar',animals[i][0],{val:i,pressed:a.pet===+i,class:a.pet===+i?'selected':''})).join('')+'</div>')+'<div class="actions"><button class="primary" type="submit">Zapisz profil</button>'+route('profile','Anuluj')+'</div></form></section>'
}
function users(){
 return '<section class="screen narrow">'+head('Zmień użytkownika','Wybierz profil lub dodaj nowy. Każdy ma własne punkty, zwierzęta i postępy.')+'<div class="panel stack switcher">'+state.profiles.map(p=>'<div class="row"><span class="row">'+avatar(p.avatar)+'<span><strong>'+esc(p.name)+'</strong><br><small>Klasa '+p.grade+(p.id===state.active?' · aktywny':'')+'</small></span></span><div class="actions">'+button('switch',p.id===state.active?'Wybrany':'Wybierz',{val:p.id,disabled:p.id===state.active,label:p.id===state.active?'Wybrany profil: '+esc(p.name):'Wybierz profil: '+esc(p.name)})+button('delete','Usuń',{val:p.id,class:'danger',label:'Usuń profil '+esc(p.name)})+'</div></div>').join('')+'</div><form id="new-profile" class="panel stack"><label class="form-row">Imię lub pseudonim nowego profilu<input name="name" maxlength="28" required></label><div><button class="primary" type="submit">Dodaj profil</button></div></form></section>'
}
function settings(){
 return '<section class="screen narrow">'+head('Ustawienia')+'<div class="panel stack"><h2>Wygląd</h2><div class="choice">'+[['light','Tryb jasny'],['dark','Tryb ciemny']].map(([id,n])=>button('theme',n,{val:id,class:state.theme===id?'selected':'',pressed:state.theme===id})).join('')+'</div><fieldset><legend>Ustawienia koloru</legend><div class="choice">'+Object.entries(palettes).map(([id,name])=>button('accent',name,{val:id,class:(state.accent??'blue')===id?'selected':'',pressed:(state.accent??'blue')===id})).join('')+'</div></fieldset><label class="row"><input type="checkbox" id="motion" '+(state.motion?'checked':'')+'> Włącz animacje</label></div><div class="panel stack"><h2>Ekran</h2><label class="row"><input type="checkbox" id="keep-screen-awake" aria-describedby="wake-status" '+(state.keepScreenAwake?'checked':'')+(wakeLock.supported?'':' disabled')+'> Nie wygaszaj ekranu</label><p id="wake-status" role="status">'+screenWakeStatus[wakeStatus]+'</p></div><div class="panel stack"><h2>Dane i profile</h2><p>Kopia JSON obejmuje wszystkie profile i ustawienia z tego urządzenia.</p><div class="actions">'+button('parent-mail','Adres e-mail rodzica')+button('vault',state.vault?'Pobierz zaszyfrowaną kopię haseł':'Włącz kopię haseł i pobierz klucz rodzica')+route('users','Zarządzaj profilami')+button('link-profile','Link do logowania na drugim telefonie')+button('export-one','Zapisz mój profil na drugi telefon')+button('import-one','Wczytaj mój profil z pliku')+button('export','Eksportuj kopię')+button('import','Importuj kopię')+button('reset','Resetuj postępy aktywnego profilu',{class:'danger'})+'</div></div><div class="panel stack"><h2>O aplikacji</h2><p>Matematyka na co dzień · wersja 1.0. Ćwiczenia matematyczne dla klas 1–8. Profile i postępy są zapisywane w tej przeglądarce.</p><p>Po pierwszym pełnym uruchomieniu z HTTPS aplikacja może działać offline. Na iPhonie wybierz w Safari „Udostępnij”, potem „Dodaj do ekranu początkowego”. Na Androidzie użyj polecenia instalacji w menu przeglądarki.</p></div></section>'
}
function render(scroll=false){
 const p=active()
 document.documentElement.dataset.accent=state.accent??'blue'
 document.documentElement.dataset.theme=state.theme
 document.documentElement.dataset.motion=state.motion?'on':'off'
 if(unlocked!==p.id){
  if(pendingLink){$('top').innerHTML='';$('bottom').innerHTML='';$('main').innerHTML='<form id="cloud-login" class="screen narrow panel stack"><h1>Otwórz profil z linku</h1><label>Hasło profilu <input type="password" name="password" required autocomplete="current-password"></label><button class="primary">Zaloguj się</button>'+button('remind','Przypomnij hasło')+button('cancel-link','Wróć do lokalnych profili')+'</form>';return}
  const candidate=state.profiles.find(x=>x.id===loginTarget)??p
  $('top').innerHTML='';$('bottom').innerHTML='';$('menu').innerHTML=''
  $('main').innerHTML='<section class="screen narrow panel stack"><h1>Wybierz swój profil</h1><div class="choice">'+state.profiles.map(x=>button('login-profile',esc(x.name),{val:x.id,pressed:x.id===candidate.id,class:x.id===candidate.id?'selected':''})).join('')+'</div><form class="stack" id="login-form"><label class="form-row">'+(candidate.lock?'Hasło profilu':'Ustal pierwsze hasło')+' · '+esc(candidate.name)+'<input name="password" type="password" required autocomplete="'+(candidate.lock?'current-password':'new-password')+'"></label><small>Od 1 do 4 znaków</small><button class="primary">'+(candidate.lock?'Zaloguj się':'Zapisz hasło i wejdź')+'</button></form>'+button('remind','Przypomnij hasło')+button('import-one','Wczytaj swój profil z pliku')+'</section>'
  return
 }
 header(p)
 const views={inventory,learn,setup,task:taskScreen,result,shop,pets,stats,rank:rankScreen,profile:profileScreen,users,settings,challenges:p=>'<section class="screen narrow">'+head('Codzienne wyzwania','Klasa '+active().grade+' · Zmiana wyzwań o północy czasu polskiego.')+challengeCards(p,false)+'</section>'}
 $('main').innerHTML=views[page](p)
 if(scroll)window.scrollTo(0,0)
}
function confirmAction(message,action){
 const d=$('confirm')
 d.querySelector('p').textContent=message
 d.returnValue='cancel'
 d.addEventListener('close',()=>{if(d.returnValue==='ok')action()},{once:true})
 d.showModal()
}
function check(){
 if(!session||page!=='task'||session.checked)return
 if(parse(session.input)===null){toast('Wpisz poprawnie zapisaną odpowiedź.');$('answer').focus();return}
 const p=active(),oldRank=rank(p).index
 session.checked=true
 session.ok=matches(session.input,session.question.answer)
 session.done++
 if(session.ok)session.good++
 gradeAnswer(p,session.grade,chosen.id,level,session.ok)
 const stored=save()
 render()
 if(session.ok&&stored){
  const newRank=rank(p).index
  toast(newRank>oldRank?'Nowa ranga! '+ranks[newRank]:signedPoints(pointsForAnswer(true,level))+' pkt',true)
 }
 $('main').querySelector('[data-action="next"]').focus()
}
function start(){
 session={grade:active().grade,limit,question:exercise(chosen.id,active().grade,level),done:0,good:0,input:'',checked:false}
 page='task';render(true)
}
function next(){
 if(!session.checked)return
 if(session.limit&&session.done>=session.limit){page='result';render(true);return}
 const old=session.question.prompt+'|'+session.question.answer
 for(let i=0;i<8;i++){
  session.question=exercise(chosen.id,session.grade,level)
  if(session.question.prompt+'|'+session.question.answer!==old)break
 }
 session.checked=false;session.input='';render(true)
}
function useKey(v){
 const field=$('answer')
 const a=field.selectionStart,b=field.selectionEnd
 const start=v==='⌫'&&a===b?Math.max(0,a-1):a
 const insert=v==='⌫'?'':v
 if(field.value.length-(b-start)+insert.length>32)return
 field.setRangeText(insert,start,b,'end')
 session.input=field.value
}
function animatePet(i,action,message){
 fx={i,action};render();toast(message,action==='buy')
 const current=fx
 setTimeout(()=>{if(fx!==current)return;fx=null;if(['shop','pets'].includes(page))render()},1700)
}
const palettes={blue:'Niebieski',purple:'Fioletowy',green:'Zielony',berry:'Malinowy'}
const actions={
 'parent-mail':()=>{const mail=prompt('Adres e-mail rodzica do przypomnień',localStorage.getItem('mat-parent-mail')||'');if(mail&&/^[^\s@?,;]+@[^\s@?,;]+\.[^\s@?,;]+$/.test(mail.trim())){localStorage.setItem('mat-parent-mail',mail.trim());toast('Adres zapisany na urządzeniu.')}},
 remind:()=>{const mail=localStorage.getItem('mat-parent-mail')||'',p=state.profiles.find(x=>x.id===loginTarget)??active();location.href='mailto:'+encodeURIComponent(mail)+'?subject='+encodeURIComponent('Matematyka na co dzień – przypomnienie hasła')+'&body='+encodeURIComponent('Proszę o pomoc w odzyskaniu hasła do '+(pendingLink?'profilu z prywatnego linku':'profilu „'+p.name+'”')+'.');},

 'more-ranks':()=>{boardOpen=!boardOpen;paintBoard()},
 'vault':async()=>{
  if(!state.vault){
   const keys=await createFamilyVault()
   state.vault={publicKey:keys.publicKey,entries:{}}
   await rememberPassword(active(),loginPin)
   if(!save())return
   downloadJson('klucz-rodzica.json',{privateKey:keys.privateKey})
   render();toast('Zachowaj osobno pobrany klucz. Kolejne hasła zapiszą się przy logowaniu.')
  }else downloadJson('zaszyfrowane-hasla-rodziny.json',state.vault)
 },
 'cancel-link':()=>{pendingLink=null;history.replaceState(null,'',location.pathname+location.search);render()},
 'link-profile':()=>connectProfile().catch(()=>toast('Nie udało się utworzyć linku. Sprawdź połączenie i spróbuj ponownie.')),

 'login-profile':id=>{loginTarget=id;render()},
 'import-one':()=>$('transfer').click(),
 'export-one':()=>{
  const url=URL.createObjectURL(new Blob([JSON.stringify({...state,vault:undefined,links:undefined,profiles:[active()]})],{type:'application/json'}))
  const a=document.createElement('a');a.href=url;a.download='moj-profil.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500)
 },

 grade:v=>{active().grade=Number(v);save();go('learn')},
 accent:v=>{if(Object.hasOwn(palettes,v)){state.accent=v;save();render()}},

 go:v=>go(v),menu:()=>$('menu').showModal(),'close-menu':()=>$('menu').close(),
 topic:v=>{const topic=grades[active().grade].find(c=>c.id===v);if(topic){chosen=topic;page='setup';render(true)}},
 level:v=>{level=+v;render()},limit:v=>{limit=+v;render()},start,next,
 finish:()=>{page='result';render(true)},again:()=>{page='setup';render(true)},key:useKey,
 group:v=>{group=+v;render()},
 buy:v=>{if(buy(active(),+v)){save();animatePet(+v,'buy','Kupiono: '+animals[v][0]+'!')}},
 'buy-supply':id=>{
  const p=active(),previous={coins:p.coins,supplies:p.supplies}
  if(!buySupply(p,id))return
  if(!save()){Object.assign(p,previous);return}
  render();toast('Kupiono: '+getSupply(id).name)
 },
 care:v=>{
  const [i,a,item]=v.split(':'), p=active(), pet=p.pets[i], toys=p.toys,inventory=p.supplies,credits=p.credits
  if(!care(p,+i,a,Date.now(),item)){render();return}
  if(!save()){p.pets[i]=pet;p.toys=toys;p.supplies=inventory;p.credits=credits;return}
  animatePet(+i,a,{food:'Smacznego! Wykorzystano '+feedingCost+' poprawnych odpowiedzi.',play:'Ale zabawa!',sleep:'Dobrej drzemki!',wake:'Pobudka!'}[a])
 },
 claim:v=>{const p=active();if(claim(p,active().grade,v)){save();render();toast('Wyzwanie ukończone! Nagroda odebrana.',true)}},
 edit:()=>{draft=structuredClone({name:active().name,avatar:active().avatar});render()},
 'avatar-type':v=>{draft.avatar.type=v;if(v==='pet'&&!active().pets[draft.avatar.pet])draft.avatar.pet=+Object.keys(active().pets)[0];render()},
 preset:v=>{draft.avatar.preset=+v;render()},'pet-avatar':v=>{draft.avatar.pet=+v;render()},
 switch:v=>{
  const p=state.profiles.find(profile=>profile.id===v)
  if(!p)return
  localStorage.removeItem('mat-last');unlocked=null;loginTarget=p.id
  const previous=state.active
  state.active=p.id
  if(!save()){state.active=previous;return}
  fx=null
  go('learn')
 },
 delete:v=>{const p=state.profiles.find(x=>x.id===v);if(p.id!==unlocked){toast('Zaloguj się do tego profilu, aby go usunąć.');return}confirmAction('Usunąć profil „'+p.name+'” wraz z postępami?',async()=>{
  try{while(boardBusy)await new Promise(resolve=>setTimeout(resolve,50));const r=await fetch(boardUrl,{method:'DELETE',headers:{Authorization:await boardAuth(p)},signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error()}catch{toast('Aby usunąć profil i wpis z rankingu, połącz się z internetem.');return}
  published.delete(p.id)
  state.profiles=state.profiles.filter(x=>x.id!==v)
  if(!state.profiles.length)state.profiles.push(profile())
  if(state.active===v)state.active=state.profiles[0].id
  session=null;save();render();toast('Profil usunięty.')
 })},
 theme:v=>{state.theme=v;save();render()},
 export:()=>{
  const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}))
  const a=document.createElement('a');a.href=url;a.download='matematyka-kopia-'+today()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500)
 },
 import:()=>$('backup').click(),
 reset:()=>confirmAction('Wyzerować monety, zwierzęta, wyzwania i postępy aktywnego profilu?',()=>{
  const p=active(), clean=profile(p.name)
  Object.assign(p,{...clean,id:p.id,grade:p.grade,avatar:p.avatar.type==='pet'?clean.avatar:p.avatar})
  session=null;save();render();toast('Postępy wyzerowane.')
 })
}
document.addEventListener('click',e=>{const b=e.target.closest('button[data-action]');if(b&&!b.disabled)actions[b.dataset.action]?.(b.dataset.value)})
document.addEventListener('mousedown',e=>{if(e.target.closest('[data-action="key"]')&&document.activeElement===$('answer'))e.preventDefault()})
document.addEventListener('input',e=>{
 if(e.target.id==='answer'&&session&&!session.checked) session.input=e.target.value
 if(e.target.id==='profile-name'&&draft)draft.name=e.target.value
})
document.addEventListener('submit',async e=>{
 if(e.target.id==='cloud-login'){
  e.preventDefault()
  const pw=new FormData(e.target).get('password')
  try{
   const api=await openSync(pendingLink,pw),{profile:p,tag}=await api.read()
   if(!valid({...state,active:p.id,profiles:[p]})||!p.lock||!await verifyProfile(p,pw))throw Error()
   if(state.links?.[p.id]?.dirty&&!confirm('Pobrać wersję z drugiego telefonu i zastąpić lokalne niezsynchronizowane zmiany?'))return
   state.profiles=state.profiles.filter(x=>x.id!==p.id).concat(p)
   state.active=p.id;(state.links??={})[p.id]={token:pendingLink,tag}
   localStorage.setItem(storage,JSON.stringify(state))
   await rememberPassword(p,pw);localStorage.setItem(storage,JSON.stringify(state))
   await rememberLogin(p,pw).catch(()=>{});loginPin=pw;unlocked=p.id;cloud={api,id:p.id};pendingLink=null
   history.replaceState(null,'',location.pathname+location.search);go('learn')
  }catch{toast('Sprawdź hasło, link do profilu i połączenie z internetem.')}
  return
 }
 if(e.target.id==='login-form'){
  e.preventDefault()
  const p=state.profiles.find(x=>x.id===loginTarget)??active(),pw=new FormData(e.target).get('password')
  if(!(await verifyProfile(p,pw))){toast('Sprawdź hasło (1–4 znaki).');return}
  cloud=null;loginPin=pw
  const meta=state.links?.[p.id]
  if(meta){
   try{
    const api=await openSync(meta.token,pw)
    if(!meta.dirty){
     const remote=await api.read()
     if(remote.profile.id!==p.id||!valid({...state,active:p.id,profiles:[remote.profile]}))throw Error()
     state.profiles=state.profiles.map(x=>x.id===p.id?remote.profile:x);meta.tag=remote.tag
    }
    cloud={api,id:p.id}
   }catch{toast('Otwarto zapis lokalny. Ponów logowanie po połączeniu z internetem.')}
  }
  await rememberPassword(p,pw)
  state.active=p.id
  if(!save())return
  await rememberLogin(p,pw).catch(()=>{});unlocked=p.id;if(meta?.dirty)syncSave();loginTarget=null;go('learn');return
 }

 if(e.target.id==='answer-form'){e.preventDefault();check();return}
 if(!['new-profile','profile-form'].includes(e.target.id))return
 e.preventDefault()
 const name=new FormData(e.target).get('name').trim()
 if(!name){toast('Wpisz imię lub pseudonim.');return}
 if(e.target.id==='new-profile'){
  const p=profile(name), previous=state.active
  state.profiles.push(p)
  state.active=p.id
  if(!save()){state.profiles.pop();state.active=previous;return}
  fx=null
  go('learn')
 }
 else {Object.assign(active(),{name,avatar:draft.avatar});save();go('profile');toast('Profil zapisany.')}
})
document.addEventListener('change',async e=>{
 if(e.target.id==='keep-screen-awake'){
  state.keepScreenAwake=e.target.checked
  save()
  syncWakeLock()
 }
 if(e.target.id==='motion'){state.motion=e.target.checked;save();render()}
 if(e.target.dataset.avatar&&draft){draft.avatar[e.target.dataset.avatar]=+e.target.value;$('avatar-live').innerHTML=avatar(draft.avatar)}
 if(e.target.id==='transfer'){
  const file=e.target.files[0];e.target.value='';if(!file)return
  try{
   const data=JSON.parse(await file.text())
   if(!valid(data)||data.profiles.length!==1||!data.profiles[0].lock)throw Error()
   const incoming=data.profiles[0],existing=state.profiles.find(x=>x.id===incoming.id)
   const pw=prompt('Wpisz hasło przenoszonego profilu')
   if(!pw||!await verifyProfile(incoming,pw)||(existing&&!await verifyProfile(existing,pw))){toast('Niepoprawne hasło.');return}
   confirmAction('Wczytać profil '+incoming.name+' z tego pliku? Zapis tego samego profilu zostanie zastąpiony.',async()=>{
    state.profiles=state.profiles.filter(x=>x.id!==incoming.id).concat(incoming);state.active=incoming.id;await rememberLogin(incoming,pw).catch(()=>{});unlocked=incoming.id;loginPin=pw;cloud=null
    save();go('learn')
   })
  }catch{toast('Wybierz plik zapisany opcją „Zapisz mój profil na drugi telefon”.')}
 }
 if(e.target.id==='backup'){
  const file=e.target.files[0];e.target.value='';if(!file)return
  try{
   const imported=JSON.parse(await file.text())
   if(!valid(imported))throw Error('invalid')
   confirmAction('Zastąpić wszystkie profile i ustawienia danymi z kopii?',()=>{
    const previous=state
    state=imported;unlocked=null;loginTarget=null
    if(save()){syncWakeLock();go('learn');toast('Kopia zaimportowana.')}
    else state=previous
   })
  }catch{toast('Plik nie jest poprawną kopią tej aplikacji.')}
 }
})
document.addEventListener('keydown',e=>{
 if(page!=='task'||$('menu').open||$('confirm').open||e.ctrlKey||e.metaKey||e.altKey)return
 if(session.checked&&e.key==='Enter'&&e.target===$('answer')){e.preventDefault();next();return}
 if(session.checked||e.target===$('answer'))return
 if(/^[\d,./+\-<=>]$/.test(e.key)||e.key==='Backspace'){
  e.preventDefault();const field=$('answer');field.focus();field.setSelectionRange(field.value.length,field.value.length)
  useKey(e.key==='Backspace'?'⌫':e.key)
 }
})
let date=today()
setInterval(()=>{
 const current=today(), dateChanged=current!==date
 date=current
 if(page==='pets'){
  const p=active(), sleeping=Object.entries(p.pets).filter(([,pet])=>pet.sleep&&pet.sleep<=Date.now())
  for(const [i,pet] of sleeping)p.pets[i]={...readPet(pet),updated:Date.now()}
  if(sleeping.length){save();animatePet(+sleeping[0][0],'wake','Zwierzak się obudził!')}
  else if(dateChanged||!document.activeElement.closest?.('.pet-card'))render()
 }
 if(dateChanged&&['learn','challenges'].includes(page))render()
},5000)
window.addEventListener('storage',e=>{
 if(e.key!==storage||!e.newValue)return
 try{const changed=JSON.parse(e.newValue);if(valid(changed)){state=changed;syncWakeLock();go('learn');toast('Zapis z innej karty został wczytany.')}}catch{}
})
document.addEventListener('visibilitychange',syncWakeLock)
window.addEventListener('pageshow',syncWakeLock)
render()
resumeLogin().catch(()=>{})
syncWakeLock()
if(loadError)toast('Nie udało się odczytać wcześniejszego zapisu. Możesz przywrócić kopię w ustawieniach.')
if('serviceWorker' in navigator){
 const hadController=!!navigator.serviceWorker.controller
 let reloading=false
 navigator.serviceWorker.addEventListener('controllerchange',()=>{
  if(hadController&&!reloading){reloading=true;location.reload()}
 })
 navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(r=>r.update()).catch(()=>{})
}
