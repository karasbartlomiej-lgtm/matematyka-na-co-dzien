import { grades, activeGrade, activeTopics } from './math.mjs'
export const animals=[
 ['Chomik',50],['Kot',100],['Pies',150],['Królik',120],['Papuga',180],['Żółw',200],
 ['Lis',250],['Pingwin',300],['Lew',400],['Tygrys',450],['Słoń',550],['Panda',600],
 ['Tyranozaur',800],['Brachiozaur',850],['Jednorożec',1000],['Kosmita',1100],['Feniks',1300],['Smok',1500]]
export const groups=['Zwierzęta domowe','Dzikie zwierzęta','Fantastyczne stworzenia']
export const supplies=[
 {id:'meal',name:'Porcja karmy',icon:'🥣',action:'food',food:28,happy:5,stock:'food'},
 {id:'apple',name:'Jabłko',icon:'🍎',action:'food',food:18,happy:4,price:10,uses:1},
 {id:'crunch',name:'Chrupki',icon:'🍪',action:'food',food:25,happy:10,price:18,uses:1},
 {id:'feast',name:'Miseczka przysmaków',icon:'🍲',action:'food',food:42,happy:12,price:30,uses:1},
 {id:'rewardToy',name:'Zabawka z treningu',icon:'🧸',action:'play',happy:30,energy:8,stock:'toys'},
 {id:'ball',name:'Piłka',icon:'⚽',action:'play',happy:20,energy:6,price:20,uses:3},
 {id:'teddy',name:'Pluszak',icon:'🧸',action:'play',happy:28,energy:4,price:35,uses:3},
 {id:'frisbee',name:'Frisbee',icon:'🥏',action:'play',happy:38,energy:12,price:45,uses:3}
]
export const getSupply=id=>supplies.find(item=>item.id===id)
export const stock=(p,item)=>item.stock?p[item.stock]:(p.supplies?.[item.id]??0)
export const totalStock=(p,action)=>supplies.reduce((sum,item)=>sum+(item.action===action?stock(p,item):0),0)
export function buySupply(p,id){
 const item=getSupply(id)
 if(!item?.price||p.coins<item.price)return false
 const quantity=stock(p,item)+item.uses
 if(!Number.isSafeInteger(quantity))return false
 p.coins-=item.price
 p.supplies={...p.supplies,[id]:quantity}
 return true
}
export const ranks=['🌱 Początkujący','🥉 Uczeń matematyki','🥈 Specjalista','🥇 Ekspert','🏆 Mistrz matematyki','💎 Matematyczny geniusz','👑 Legenda matematyki']
export const thresholds=[0,1,2,4,6,8,11]
const dayFormat=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Warsaw'})
export const today=now=>dayFormat.format(now)
export const pointsForAnswer=(correct,l=4)=>correct?(l<=3?8:l===4?10:13):(l<=3?-4:l===4?-5:-7)
export const feedingCost=15
export const config=()=>({type:'preset',preset:0,face:0,hair:0,shirt:0,accessory:0,pet:0})
export const profile=(name='Gracz')=>({id:crypto.randomUUID(),name,avatar:config(),grade:activeGrade,coins:0,food:0,supplies:{},toys:0,correct:0,stats:{},daily:{},pets:{}})
export const initial=()=>{const p=profile();return {version:1,active:p.id,theme:'light',keepScreenAwake:false,motion:!matchMedia('(prefers-reduced-motion: reduce)').matches,profiles:[p]}}
export const key=(g,id)=>g+':'+id
export const record=(p,g,id)=>p.stats[key(g,id)]??Array.from({length:5},()=>[0,0])
export function progress(rows){
 const hard=rows.slice(2)
 const attempts=hard.reduce((s,r)=>s+r[0],0), correct=hard.reduce((s,r)=>s+r[1],0)
 const accuracy=attempts?correct/attempts:0
 const mastery=Math.min(1,attempts/12,correct/10,accuracy/.8)
 return Math.min(mastery===1?100:99,Math.round(mastery*100))
}
export const rank=p=>{const total=grades.slice(1).reduce((n,list,i)=>n+list.filter(topic=>progress(record(p,i+1,topic.id))===100).length,0);return {total,index:thresholds.findLastIndex(t=>total>=t)}}
export function dailySet(g,date){
 const rotation=Number(date.replaceAll('-',''))%3
 const category=grades[g][(Number(date.slice(-2))+g)%grades[g].length]
 return [
  {id:'any',name:'Rozwiąż '+[5,6,8][rotation]+' zadań',target:[5,6,8][rotation],reward:50},
  rotation===1?{id:'topic',name:'Podaj 8 poprawnych odpowiedzi • '+category.name,target:8,reward:100,category:category.id}:{id:'correct',name:'Podaj '+[10,10,12][rotation]+' poprawnych odpowiedzi',target:[10,10,12][rotation],reward:100},
  {id:'streak',name:'Rozwiąż '+[20,12,15][rotation]+' zadań z rzędu bez błędu',target:[20,12,15][rotation],reward:200}
 ]
}
export function dailyStats(p,g,date=today()){
 return p.daily[date+':'+g]??{any:0,correct:0,streak:0,best:0,topics:{},claimed:[]}
}
export const value=(d,c)=>c.id==='streak'?d.best:c.id==='topic'?(d.topics[c.category]??0):d[c.id]
export function gradeAnswer(p,g,id,l,ok,date=today(),now=Date.now()){
 const rows=record(p,g,id)
 p.stats[key(g,id)]=rows
 rows[l-1][0]++
 const d=dailyStats(p,g,date)
 p.daily[date+':'+g]=d
 d.any++
 p.coins+=pointsForAnswer(ok,l)
 if(!ok){d.streak=0;return}
 rows[l-1][1]++
 p.credits=[...recentCredits(p,now),now]
 p.correct++
 if(p.correct%7===0)p.toys++
 d.correct++
 d.streak++
 d.best=Math.max(d.best,d.streak)
 d.topics[id]=(d.topics[id]??0)+1
}
export function claim(p,g,id,date=today()){
 const d=dailyStats(p,g,date), c=dailySet(g,date).find(x=>x.id===id)
 // Each challenge slot can be rewarded once per day across classes.
 const slot=id==='streak'?2:id==='any'?0:1
 if(!c||value(d,c)<c.target||Object.entries(p.daily).some(([k,v])=>k.startsWith(date+':')&&v.claimed.includes(slot)))return false
 d.claimed.push(slot);p.coins+=c.reward;return true
}
export const claimed=(p,id,date=today())=>Object.entries(p.daily).some(([k,v])=>k.startsWith(date+':')&&v.claimed.includes(id==='streak'?2:id==='any'?0:1))
export function buy(p,i,now=Date.now()){
 const item=animals[i]
 if(!item||p.pets[i]||p.coins<item[1])return false
 p.coins-=item[1]
 p.pets[i]={scale:150,pricePaid:item[1],food:0,happy:112.5,energy:112.5,sleep:0,updated:now,fedUntil:now}
 return true
}
const day=86400000
export const feedingPointMs=576000
export const hungerGraceMs=day
const recentCredits=(p,now)=>(p.credits??[]).filter(t=>t>now-day&&t<=now)
const foodDeadline=(pet,now)=>pet.fedUntil??Math.max(now,Math.round(pet.updated+pet.food*(pet.scale===150?1:1.5)*feedingPointMs))
export const petExpired=(pet,now=Date.now())=>pet.fedUntil!==undefined&&now-pet.fedUntil>day
export function sweepPets(p,now=Date.now()){
 const removed=[]
 let changed=false
 for(const [i,pet] of Object.entries(p.pets)){
  if(pet.fedUntil===undefined){p.pets[i]=readPet(pet,now);changed=true}
  else if(petExpired(pet,now)){delete p.pets[i];removed.push(Number(i));changed=true}
 }
 if(p.avatar.type==='pet'&&!p.pets[p.avatar.pet]){p.avatar={...p.avatar,type:'preset'};changed=true}
 return {changed,removed}
}
export function feedingStatus(p,now=Date.now()){
 const pets=Object.values(p.pets).filter(pet=>!petExpired(pet,now))
 return {fed:pets.filter(pet=>foodDeadline(pet,now)>now).length,total:pets.length,available:recentCredits(p,now).length}
}
export function readPet(pet,now=Date.now()){
 const scale=pet.scale===150?1:1.5
 const elapsed=Math.max(0,now-pet.updated)/day
 const decayed=(v,rate)=>Math.max(0,v*scale-rate*elapsed)
 const woke=pet.sleep&&pet.sleep<=now
 const fedUntil=foodDeadline(pet,now)
 return {...pet,scale:150,fedUntil,food:Math.min(150,Math.max(0,(fedUntil-now)/feedingPointMs)),happy:decayed(pet.happy,75),
  energy:woke?Math.max(0,150-75*(now-pet.sleep)/day):decayed(pet.energy,75),
  sleep:woke?0:pet.sleep,updated:now}
}
export function care(p,i,action,now=Date.now(),id=action==='food'?'meal':'rewardToy',points=feedingCost*10){
 if(!p.pets[i]||petExpired(p.pets[i],now))return false
 const date=today(now)
 const pet=readPet(p.pets[i],now,date)
 const item=getSupply(id)
 if(action==='food'||action==='play'){
  if(item?.action!==action||item.id==='meal'||stock(p,item)<=0)return false
 }
 if(action==='wake'&&pet.sleep){pet.sleep=0;pet.energy=Math.min(150,pet.energy+18)}
 else if(action==='food'){
  const cost=points/10,credits=recentCredits(p,now)
  if(!Number.isSafeInteger(cost)||cost<1||cost>credits.length)return false
  const until=Math.max(now,pet.fedUntil)+points*feedingPointMs
  if(!Number.isSafeInteger(until)||until>8640000000000000)return false
  pet.fedAt=now;pet.fedUntil=until;p.credits=credits.slice(cost)
  pet.food=Math.min(150,(until-now)/feedingPointMs)
  pet.happy=Math.min(150,pet.happy+1.5*item.happy)
 }
 else if(pet.sleep)return false
 else if(action==='play'&&pet.happy<150&&pet.energy>=45){pet.happy=Math.min(150,pet.happy+1.5*item.happy);pet.energy-=1.5*item.energy}
 else if(action==='sleep'){pet.sleep=now+120000}
 else return false
 if(action==='food'||action==='play'){
  if(item.id==='rewardToy')p.toys--
  else if(item.price)p.supplies={...p.supplies,[id]:stock(p,item)-1}
 }
 p.pets[i]={...pet,updated:now}
 return true
}
const int=(n,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(n)&&n>=0&&n<=max
const obj=o=>o!==null&&typeof o==='object'&&!Array.isArray(o)
export function valid(data){
 const validRows=r=>Array.isArray(r)&&r.length===5&&r.every(x=>Array.isArray(x)&&x.length===2&&int(x[0])&&int(x[1],x[0]))
 const validStats=o=>obj(o)&&Object.entries(o).every(([k,v])=>{const [g,id]=k.split(':');return grades[g]?.some(c=>c.id===id)&&validRows(v)})
 const validPets=o=>obj(o)&&Object.entries(o).every(([i,p])=>String(+i)===i&&int(+i,17)&&obj(p)&&['food','happy','energy'].every(k=>Number.isFinite(p[k])&&p[k]>=0&&p[k]<=(p.scale===150?150:100))&&int(p.updated)&&int(p.sleep)&&(p.fedUntil===undefined||int(p.fedUntil,8640000000000000))&&(p.fedOn===undefined||typeof p.fedOn==='string'&&/^\d{4}-\d\d-\d\d$/.test(p.fedOn)))
 const validDaily=o=>obj(o)&&Object.entries(o).every(([k,v])=>/^\d{4}-\d\d-\d\d:[1-8]$/.test(k)&&obj(v)&&['any','correct','streak','best'].every(s=>int(v[s]))&&obj(v.topics)&&Object.values(v.topics).every(n=>int(n))&&Array.isArray(v.claimed)&&v.claimed.every(n=>int(n,2)))
 const validAvatar=(a,p)=>obj(a)&&['preset','custom','pet'].includes(a.type)&&int(a.preset,5)&&['face','hair','shirt','accessory'].every(k=>int(a[k],3))&&int(a.pet,17)&&(a.type!=='pet'||!!p.pets[a.pet])
 return obj(data)&&data.version===1&&(data.keepScreenAwake===undefined||typeof data.keepScreenAwake==='boolean')&&['light','dark'].includes(data.theme)&&typeof data.motion==='boolean'&&Array.isArray(data.profiles)&&data.profiles.length>0&&new Set(data.profiles.map(p=>p?.id)).size===data.profiles.length&&data.profiles.every(p=>obj(p)&&typeof p.id==='string'&&/^[\da-f-]{36}$/.test(p.id)&&typeof p.name==='string'&&p.name.trim().length>0&&p.name.length<=28&&int(p.grade,8)&&p.grade>0&&Number.isSafeInteger(p.coins)&&['food','toys','correct'].every(k=>int(p[k]))&&(p.supplies===undefined||obj(p.supplies)&&Object.entries(p.supplies).every(([id,n])=>getSupply(id)?.price&&int(n)))&&(p.credits===undefined||Array.isArray(p.credits)&&p.credits.every(t=>int(t)))&&(p.lock===undefined||obj(p.lock)&&/^[0-9a-f]{32}$/.test(p.lock.salt)&&/^[0-9a-f]{64}$/.test(p.lock.digest))&&validStats(p.stats)&&validPets(p.pets)&&validDaily(p.daily)&&validAvatar(p.avatar,p))&&data.profiles.some(p=>p.id===data.active)
}
