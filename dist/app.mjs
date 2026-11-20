import { grades, levels, exercise, matches, parse } from './math.mjs'
import { animals, groups, ranks, thresholds, profile, initial, record, progress, rank, dailyStats, dailySet, value, claim, claimed, gradeAnswer, buy, care, readPet, valid, today } from './game.mjs'

const $=id=>document.getElementById(id)
const storage='matematyka-na-co-dzien-v1'
let state=initial()
let loadError=false
try {const raw=localStorage.getItem(storage);if(raw){const saved=JSON.parse(raw);if(valid(saved))state=saved;else loadError=true}}
catch {loadError=true}
const active=()=>state.profiles.find(x=>x.id===state.active)
let page='learn', chosen=null, level=1, limit=10, session=null, group=0, draft=null, fx=null, toastTimer
const esc=x=>String(x).replace(/[&<>"']/g,k=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[k]))
const coins='<span class="coin" aria-hidden="true">✦</span>'
const format=n=>n.toLocaleString('pl-PL')
const icons={
 learn:'M3 5c4-1 7 0 9 2 2-2 5-3 9-2v14c-4-1-7 0-9 2-2-2-5-3-9-2z M12 7v14',
 challenges:'M13 2 4 14h7l-1 8 10-12h-7z',
 shop:'M4 9h16l-1 12H5z M8 9V7a4 4 0 0 1 8 0v2',
 pets:'M12 12c3 0 7 4 7 7 0 2-2 3-4 2-2-1-4-1-6 0-2 1-4 0-4-2 0-3 4-7 7-7z M4 12c-3 0-3-5 0-5s3 5 0 5z M9 8c-3 0-3-6 0-6s3 6 0 6z M15 8c-3 0-3-6 0-6s3 6 0 6z M20 12c-3 0-3-5 0-5s3 5 0 5z',
 profile:'M16 7a4 4 0 1 1-8 0 4 4 0 1 1 8 0z M4 21v-2c0-4 4-6 8-6s8 2 8 6v2z',
 stats:'M3 20h18 M6 16v-5m6 5V4m6 12V8', rank:'M5 3h14v6c0 5-3 7-7 7s-7-2-7-7z M5 6H2v3c0 3 2 4 4 4m13-7h3v3c0 3-2 4-4 4m-6 3v5m-5 0h10',
 users:'M16 17h6m-3-3v6 M13 7a4 4 0 1 1-8 0 4 4 0 1 1 8 0z M2 21v-2c0-4 4-6 8-6 2 0 3 .4 4 1',
 settings:'M4 6h16M4 12h16M4 18h16 M8 3v6m8 0v6m-5 0v6',
 menu:'M4 6h16M4 12h16M4 18h16', close:'m6 6 12 12m0-12L6 18', next:'m9 5 7 7-7 7', star:'m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z'
}
const icon=id=>'<svg class="ico" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="'+icons[id]+'"/></svg>'
const nav=[['learn','Nauka'],['challenges','Wyzwania'],['shop','Sklep'],['pets','Zwierzęta'],['profile','Profil']]
const side=[['learn','Nauka'],['challenges','Codzienne wyzwania'],['shop','Sklep'],['pets','Moje zwierzęta'],['stats','Statystyki'],['rank','Moja ranga'],['profile','Profil'],['users','Zmień użytkownika'],['settings','Ustawienia']]
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
function save(){
 try {localStorage.setItem(storage,JSON.stringify(state));return true}
 catch {toast('Nie udało się zapisać danych na urządzeniu. Wyeksportuj kopię w ustawieniach.');return false}
}
function go(target){
 page=target
 if(target==='learn'){session=null;chosen=null}
 if(target==='profile')draft=null
 if($('menu').open)$('menu').close()
 render(true)
}
function head(title,note=''){return '<header class="stack"><h1>'+title+'</h1>'+(note?'<p>'+note+'</p>':'')+'</header>'}
function header(p){
 $('top').innerHTML='<div class="top-inner">'+route('learn','<img src="./logo.svg" alt=""><b>Matematyka<br>na co dzień</b>','brand')+'<div class="top-actions">'+balance(p)+button('go',avatar(p.avatar),{val:'profile',class:'icon-btn',label:'Profil: '+esc(p.name)})+button('menu',icon('menu'),{class:'icon-btn',label:'Otwórz menu boczne'})+'</div></div>'
 $('bottom').innerHTML='<div class="nav-inner">'+nav.map(([id,label])=>route(id,icon(id)+esc(label),(page===id||id==='learn'&&['setup','task','result'].includes(page))?'selected':'')).join('')+'</div>'
 $('menu').innerHTML='<div class="menu-head"><h2>Menu</h2>'+button('close-menu',icon('close'),{class:'icon-btn',label:'Zamknij menu'})+'</div><nav>'+side.map(([id,label])=>route(id,icon(id)+esc(label),page===id?'selected':'')).join('')+'</nav>'
}
function gradeButtons(p){
 return '<div class="grade-list" aria-label="Wybór klasy">'+grades.slice(1).map((_,i)=>button('grade',i+1,{val:i+1,pressed:p.grade===i+1,class:p.grade===i+1?'primary':'',label:'Klasa '+(i+1)})).join('')+'</div>'
}
function challengeCards(p,compact){
 const date=today(),d=dailyStats(p,p.grade,date)
 return dailySet(p.grade,date).map(c=>{
  const n=Math.min(c.target,value(d,c)), done=claimed(p,c.id,date)
  return '<article class="'+(compact?'mini-challenge':'challenge')+'"><div class="row"><strong>'+esc(c.name)+'</strong><span class="reward" title="Monety">+'+c.reward+'</span></div>'+bar(100*n/c.target,c.name)+'<small>'+n+' / '+c.target+(done?' · Nagroda odebrana':'')+'</small>'+(!compact&&!done?button('claim','Odbierz nagrodę',{val:c.id,disabled:n<c.target,class:'primary'}):'')+'</article>'
 }).join('')
}
function learn(p){
 const r=rank(p)
 return '<div class="dashboard"><div class="stack"><section class="hero"><div class="hero-art" aria-hidden="true"><img src="./logo.svg" alt=""><span>+</span><span>✦</span></div><div class="kicker">Trening matematyczny</div><h1 class="hero-title">Cześć, '+esc(p.name)+'!</h1><p>Rozwiązuj zadania, zbieraj monety i odkrywaj zwierzęta.</p></section><div class="mobile-status"><span>'+ranks[r.index]+'</span>'+route('challenges',icon('challenges')+' Wyzwania dnia')+'</div><section class="panel"><div class="section-top"><h2>Wybierz klasę</h2><small>Szkoła podstawowa</small></div>'+gradeButtons(p)+'</section><section><div class="section-top"><h2>Kategorie matematyczne</h2><small>Klasa '+p.grade+'</small></div><div class="topics">'+grades[p.grade].map(c=>{
  const percent=progress(record(p,p.grade,c.id))
  return button('topic','<span class="symbol" aria-hidden="true">'+c.icon+'</span><strong>'+c.name+'</strong><span class="topic-meta"><small>'+percent+'%</small>'+bar(percent,c.name)+'</span>'+icon('next'),{val:c.id,class:'topic'})
 }).join('')+'</div></section></div><aside class="stack"><section class="panel"><div class="section-top"><h2>Wyzwania dnia</h2>'+icon('challenges')+'</div>'+challengeCards(p,true)+route('challenges','Zobacz wyzwania','wide')+'</section><section class="rank-card"><div class="kicker">Twoja ranga</div><h3>'+ranks[r.index]+'</h3><p>'+r.total+' opanowanych kategorii</p>'+route('rank','Zobacz rangi')+'</section></aside></div>'
}
function setup(){
 return '<div class="screen narrow">'+head(chosen.name,'Klasa '+active().grade)+'<div class="panel stack"><fieldset><legend>Poziom trudności</legend><div class="choice">'+levels.map((x,i)=>button('level','<span class="stars">'+('★'.repeat(i+1))+'</span>'+x,{val:i+1,class:'level '+(level===i+1?'selected':''),pressed:level===i+1})).join('')+'</div></fieldset><fieldset><legend>Liczba zadań</legend><div class="choice">'+[5,10,15,20,30,50,0].map(n=>button('limit',n||'Bez limitu',{val:n,class:limit===n?'selected':'',pressed:limit===n})).join('')+'</div></fieldset></div><div class="actions">'+button('start','Rozpocznij trening',{class:'primary'})+route('learn','Wróć do kategorii')+'</div></div>'
}
function taskScreen(){
 const s=session,q=s.question, comparison=/^[<=>]$/.test(q.answer)
 const keys=comparison?['<','=','>','⌫']:['1','2','3','⌫','4','5','6','−','7','8','9','/','0',',']
 const feedback=s.checked?'<div class="feedback '+(s.ok?'':'error')+'" role="status">'+(s.ok?'<strong>Świetnie! +10 monet</strong>':'<strong>Spróbujmy to razem rozwiązać.</strong><ol>'+q.steps.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol><p>Prawidłowy wynik <strong>'+esc(q.answer)+'</strong></p>')+'</div>':''
 return '<section class="screen narrow"><div class="row spaced"><h2>'+chosen.name+'</h2><span class="badge">Zadanie '+(s.done+(s.checked?0:1))+(s.limit?' / '+s.limit:'')+'</span></div><form id="answer-form" class="panel stack"><div class="question">'+esc(q.prompt)+'</div><label class="form-row">Twoja odpowiedź<input class="answer" id="answer" type="text" inputmode="none" autocomplete="off" spellcheck="false" maxlength="32" value="'+esc(s.input)+'" '+(s.checked?'readonly':'')+'></label><div class="keypad" aria-label="Klawiatura zadania">'+keys.map(k=>button('key',esc(k),{val:k,disabled:s.checked,label:k==='⌫'?'Usuń znak':undefined})).join('')+'</div>'+feedback+'<div class="actions"><button type="submit" class="primary" '+(s.checked?'disabled':'')+'>Sprawdź</button>'+button('next',s.limit&&s.done===s.limit?'Zobacz podsumowanie':'Następne zadanie',{disabled:!s.checked,class:s.checked?'primary':''})+'</div></form>'+button('finish','Zakończ trening')+'</section>'
}
function result(){
 return '<section class="screen narrow panel result"><div class="symbol" aria-hidden="true">✓</div><h1>Trening ukończony!</h1><p>Dobra robota! Każde zadanie pomaga Ci ćwiczyć.</p><div class="score">'+session.good+'/'+session.done+'</div><p>Poprawne odpowiedzi</p><div class="row">'+coins+' <strong>'+session.good*10+' zdobytych monet</strong></div><div class="actions">'+button('again','Nowy trening',{class:'primary'})+route('learn','Wróć do nauki')+'</div></section>'
}
function shop(p){
 return '<section class="screen"><div class="row spaced">'+head('Sklep ze zwierzętami','Kup towarzysza za monety zdobyte w treningu.')+balance(p)+'</div><div class="choice" aria-label="Kategorie zwierząt">'+groups.map((n,i)=>button('group',n,{val:i,pressed:group===i,class:group===i?'selected':''})).join('')+'</div><div class="grid">'+animals.map(([name,price],i)=>Math.floor(i/6)!==group?'':'<article class="pet-card">'+animal(i,null,true)+'<h3>'+name+'</h3><div class="row">'+coins+' <strong>'+format(price)+'</strong></div>'+button('buy',p.pets[i]?'Kupione':p.coins<price?'Brakuje '+format(price-p.coins)+' monet':'Kup',{val:i,class:'primary',disabled:!!p.pets[i]||p.coins<price})+'</article>').join('')+'</div></section>'
}
function pets(p){
 return '<section class="screen">'+head('Moje zwierzęta')+'<div class="panel"><div class="row spaced"><strong>Jedzenie '+p.food+'</strong><strong>Zabawki '+p.toys+'</strong></div><p>Co 3 poprawne odpowiedzi zdobywasz porcję jedzenia, a co 7 zabawkę. Drzemka trwa 2 minuty.</p></div>'+(Object.keys(p.pets).length?'<div class="grid">'+Object.entries(p.pets).map(([i,raw])=>{
  const pet=readPet(raw)
  const meter=(label,n)=>'<div><div class="row"><small>'+label+'</small><small>'+n+'%</small></div>'+bar(n,label)+'</div>'
  return '<article class="pet-card">'+animal(+i,pet,true)+'<h3>'+animals[i][0]+(pet.sleep?' · śpi':'')+'</h3><div class="pet-bars">'+meter('Szczęście',pet.happy)+meter('Najedzenie',pet.food)+meter('Energia',pet.energy)+'</div><div class="actions">'+button('care','Nakarm',{val:i+':food',disabled:!!pet.sleep||!p.food||pet.food===100})+button('care','Baw się',{val:i+':play',disabled:!!pet.sleep||!p.toys||pet.happy===100||pet.energy<30})+button('care',pet.sleep?'Obudź':'Połóż spać',{val:i+(pet.sleep?':wake':':sleep')})+'</div></article>'
 }).join('')+'</div>':'<div class="panel empty stack"><h2>Jeszcze nie masz zwierząt</h2><p>Za 50 monet możesz kupić swojego pierwszego chomika.</p>'+route('shop','Przejdź do sklepu','primary')+'</div>')+'</section>'
}
function stats(p){
 return '<section class="screen">'+head('Statystyki')+'<div class="panel">'+gradeButtons(p)+'</div><div class="stack">'+grades[p.grade].map(c=>{
  const rows=record(p,p.grade,c.id),attempts=rows.reduce((s,r)=>s+r[0],0),correct=rows.reduce((s,r)=>s+r[1],0),pct=progress(rows)
  return '<article class="panel stat-row"><div class="row"><span class="symbol">'+c.icon+'</span><strong>'+c.name+'</strong></div><div class="row"><span>Rozwiązane <b>'+attempts+'</b></span><span>Poprawne <b>'+correct+'</b></span><span>Błędne <b>'+(attempts-correct)+'</b></span><span>Skuteczność <b>'+(attempts?Math.round(100*correct/attempts):0)+'%</b></span></div><small>Opanowanie '+pct+'%</small>'+bar(pct,c.name)+'</article>'
 }).join('')+'</div></section>'
}
function rankScreen(p){
 const r=rank(p)
 return '<section class="screen narrow">'+head('Moja ranga')+'<div class="rank-card"><h2>'+ranks[r.index]+'</h2><p>Opanowane kategorie we wszystkich klasach <b>'+r.total+'</b></p>'+(r.index<6?'<p>Do rangi '+ranks[r.index+1]+' potrzebujesz jeszcze '+(thresholds[r.index+1]-r.total)+' kategorii.</p>'+bar(Math.round(100*r.total/thresholds[r.index+1]),'Postęp do następnej rangi'):'<p>Zdobywasz najwyższą rangę!</p>')+'</div><div class="panel stack"><h3>Jak opanować kategorię?</h3><p>Na poziomach 3–5 rozwiąż co najmniej 12 zadań, podaj co najmniej 10 poprawnych odpowiedzi i utrzymaj skuteczność co najmniej 80%. Wyniki liczą się osobno dla każdej kategorii w każdej klasie.</p></div>'+ranks.map((x,i)=>'<div class="panel row spaced"><strong>'+x+'</strong><small>'+thresholds[i]+' kategorii'+(r.index===i?' · Twoja ranga':'')+'</small></div>').join('')+'</section>'
}
function profileScreen(p){
 if(!draft)return '<section class="screen narrow">'+head('Profil')+'<div class="panel stack"><div class="row">'+avatar(p.avatar)+'<div><h2>'+esc(p.name)+'</h2><small>Klasa '+p.grade+'</small></div></div><div class="row spaced">'+balance(p)+'<strong>'+ranks[rank(p).index]+'</strong></div><p>Jedzenie '+p.food+' · Zabawki '+p.toys+' · Zwierzęta '+Object.keys(p.pets).length+'</p><div class="actions">'+button('edit','Edytuj profil',{class:'primary'})+route('stats','Statystyki')+route('users','Zmień użytkownika')+route('settings','Ustawienia')+'</div></div></section>'
 const a=draft.avatar, select=(key,label,choices)=>'<label class="form-row">'+label+'<select data-avatar="'+key+'">'+choices.map((n,i)=>'<option value="'+i+'" '+(a[key]===i?'selected':'')+'>'+n+'</option>').join('')+'</select></label>'
 return '<section class="screen narrow">'+head('Edytuj profil')+'<form class="panel stack" id="profile-form"><div id="avatar-live">'+avatar(a)+'</div><label class="form-row">Imię lub pseudonim<input id="profile-name" name="name" value="'+esc(draft.name)+'" maxlength="28" required></label><div class="choice">'+[['preset','Gotowy awatar'],['custom','Własna postać'],['pet','Moje zwierzę']].map(([id,label])=>button('avatar-type',label,{val:id,pressed:a.type===id,class:a.type===id?'selected':'',disabled:id==='pet'&&!Object.keys(p.pets).length})).join('')+'</div>'+
 (a.type==='preset'?'<div class="avatar-options">'+preset.map((x,i)=>button('preset',x,{val:i,pressed:a.preset===i,label:'Awatar '+(i+1),class:a.preset===i?'selected':''})).join('')+'</div>':a.type==='custom'?select('face','Twarz',['Jasna','Brzoskwiniowa','Karmelowa','Brązowa'])+select('hair','Fryzura',['Krótka','Długa','Kręcona','Grzywka'])+select('shirt','Ubranie',['Turkusowe','Niebieskie','Różowe','Pomarańczowe'])+select('accessory','Akcesoria',['Bez akcesoriów','Czapka','Okulary','Mucha']):'<div class="choice">'+Object.keys(p.pets).map(i=>button('pet-avatar',animals[i][0],{val:i,pressed:a.pet===+i,class:a.pet===+i?'selected':''})).join('')+'</div>')+'<div class="actions"><button class="primary" type="submit">Zapisz profil</button>'+route('profile','Anuluj')+'</div></form></section>'
}
function users(){
 return '<section class="screen narrow">'+head('Profile na tym urządzeniu')+'<div class="panel stack switcher">'+state.profiles.map(p=>'<div class="row"><span class="row">'+avatar(p.avatar)+'<span><strong>'+esc(p.name)+'</strong><br><small>Klasa '+p.grade+(p.id===state.active?' · aktywny':'')+'</small></span></span><div class="actions">'+button('switch','Wybierz',{val:p.id,disabled:p.id===state.active})+button('delete','Usuń',{val:p.id,class:'danger',label:'Usuń profil '+esc(p.name)})+'</div></div>').join('')+'</div><form id="new-profile" class="panel stack"><label class="form-row">Imię lub pseudonim nowego profilu<input name="name" maxlength="28" required></label><div><button class="primary" type="submit">Dodaj profil</button></div></form></section>'
}
function settings(){
 return '<section class="screen narrow">'+head('Ustawienia')+'<div class="panel stack"><h2>Wygląd</h2><div class="choice">'+[['light','Tryb jasny'],['dark','Tryb ciemny']].map(([id,n])=>button('theme',n,{val:id,class:state.theme===id?'selected':'',pressed:state.theme===id})).join('')+'</div><label class="row"><input type="checkbox" id="motion" '+(state.motion?'checked':'')+'> Włącz animacje</label></div><div class="panel stack"><h2>Dane i profile</h2><p>Kopia JSON obejmuje wszystkie profile i ustawienia z tego urządzenia.</p><div class="actions">'+route('users','Zarządzaj profilami')+button('export','Eksportuj kopię')+button('import','Importuj kopię')+button('reset','Resetuj postępy aktywnego profilu',{class:'danger'})+'</div></div><div class="panel stack"><h2>O aplikacji</h2><p>Matematyka na co dzień · wersja 1.0. Ćwiczenia matematyczne dla klas 1–8. Profile i postępy są zapisywane w tej przeglądarce.</p><p>Po pierwszym pełnym uruchomieniu z HTTPS aplikacja może działać offline. Na iPhonie wybierz w Safari „Udostępnij”, potem „Dodaj do ekranu początkowego”. Na Androidzie użyj polecenia instalacji w menu przeglądarki.</p></div></section>'
}
function render(scroll=false){
 const p=active()
 document.documentElement.dataset.theme=state.theme
 document.documentElement.dataset.motion=state.motion?'on':'off'
 header(p)
 const views={learn,setup,task:taskScreen,result,shop,pets,stats,rank:rankScreen,profile:profileScreen,users,settings,challenges:p=>'<section class="screen narrow">'+head('Codzienne wyzwania','Klasa '+p.grade+' · Zmiana wyzwań o północy czasu polskiego.')+challengeCards(p,false)+'</section>'}
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
  toast(newRank>oldRank?'Nowa ranga! '+ranks[newRank]:'+10 monet',true)
 }
 $('main').querySelector('[data-action="next"]').focus()
}
function start(){
 const g=active().grade
 session={grade:g,limit,question:exercise(chosen.id,g,level),done:0,good:0,input:'',checked:false}
 page='task';render(true)
}
function next(){
 if(!session.checked)return
 if(session.limit&&session.done>=session.limit){page='result';render(true);return}
 const old=session.question.prompt
 for(let i=0;i<8;i++){
  session.question=exercise(chosen.id,session.grade,level)
  if(session.question.prompt!==old)break
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
const actions={
 go:v=>go(v),menu:()=>$('menu').showModal(),'close-menu':()=>$('menu').close(),
 grade:v=>{active().grade=+v;save();render()},
 topic:v=>{chosen=grades[active().grade].find(c=>c.id===v);page='setup';render(true)},
 level:v=>{level=+v;render()},limit:v=>{limit=+v;render()},start,next,
 finish:()=>{page='result';render(true)},again:()=>{page='setup';render(true)},key:useKey,
 group:v=>{group=+v;render()},
 buy:v=>{if(buy(active(),+v)){save();animatePet(+v,'buy','Kupiono: '+animals[v][0]+'!')}},
 care:v=>{const [i,a]=v.split(':');if(care(active(),+i,a)){save();animatePet(+i,a,{food:'Smacznego!',play:'Ale zabawa!',sleep:'Dobrej drzemki!',wake:'Pobudka!'}[a])}},
 claim:v=>{const p=active();if(claim(p,p.grade,v)){save();render();toast('Wyzwanie ukończone! Nagroda odebrana.',true)}},
 edit:()=>{draft=structuredClone({name:active().name,avatar:active().avatar});render()},
 'avatar-type':v=>{draft.avatar.type=v;if(v==='pet'&&!active().pets[draft.avatar.pet])draft.avatar.pet=+Object.keys(active().pets)[0];render()},
 preset:v=>{draft.avatar.preset=+v;render()},'pet-avatar':v=>{draft.avatar.pet=+v;render()},
 switch:v=>{state.active=v;save();go('learn')},
 delete:v=>{const p=state.profiles.find(x=>x.id===v);confirmAction('Usunąć profil „'+p.name+'” wraz z postępami?',()=>{
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
document.addEventListener('submit',e=>{
 if(e.target.id==='answer-form'){e.preventDefault();check();return}
 if(!['new-profile','profile-form'].includes(e.target.id))return
 e.preventDefault()
 const name=new FormData(e.target).get('name').trim()
 if(!name){toast('Wpisz imię lub pseudonim.');return}
 if(e.target.id==='new-profile'){const p=profile(name);state.profiles.push(p);state.active=p.id;save();go('learn')}
 else {Object.assign(active(),{name,avatar:draft.avatar});save();go('profile');toast('Profil zapisany.')}
})
document.addEventListener('change',async e=>{
 if(e.target.id==='motion'){state.motion=e.target.checked;save();render()}
 if(e.target.dataset.avatar&&draft){draft.avatar[e.target.dataset.avatar]=+e.target.value;$('avatar-live').innerHTML=avatar(draft.avatar)}
 if(e.target.id==='backup'){
  const file=e.target.files[0];e.target.value='';if(!file)return
  try{
   const imported=JSON.parse(await file.text())
   if(!valid(imported))throw Error('invalid')
   confirmAction('Zastąpić wszystkie profile i ustawienia danymi z kopii?',()=>{
    const previous=state
    state=imported
    if(save()){go('learn');toast('Kopia zaimportowana.')}
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
  else if(!document.activeElement.closest?.('.pet-card'))render()
 }
 if(dateChanged&&['learn','challenges'].includes(page))render()
},5000)
window.addEventListener('storage',e=>{
 if(e.key!==storage||!e.newValue)return
 try{const changed=JSON.parse(e.newValue);if(valid(changed)){state=changed;go('learn');toast('Zapis z innej karty został wczytany.')}}catch{}
})
render()
if(loadError)toast('Nie udało się odczytać wcześniejszego zapisu. Możesz przywrócić kopię w ustawieniach.')
if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{})
