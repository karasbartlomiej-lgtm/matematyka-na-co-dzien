import { grades } from './math.mjs'
export const animals=[
 ['Chomik',50],['Kot',100],['Pies',150],['Królik',120],['Papuga',180],['Żółw',200],
 ['Lis',250],['Pingwin',300],['Lew',400],['Tygrys',450],['Słoń',550],['Panda',600],
 ['Tyranozaur',800],['Brachiozaur',850],['Jednorożec',1000],['Kosmita',1100],['Feniks',1300],['Smok',1500]]
export const groups=['Zwierzęta domowe','Dzikie zwierzęta','Fantastyczne stworzenia']
export const ranks=['🌱 Początkujący','🥉 Uczeń matematyki','🥈 Specjalista','🥇 Ekspert','🏆 Mistrz matematyki','💎 Matematyczny geniusz','👑 Legenda matematyki']
export const thresholds=[0,1,3,6,10,16,24]
const dayFormat=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Warsaw'})
export const today=now=>dayFormat.format(now)
export const pointsForAnswer=correct=>correct?10:-5
export const feedingCost=15
export const config=()=>({type:'preset',preset:0,face:0,hair:0,shirt:0,accessory:0,pet:0})
export const profile=(name='Gracz')=>({id:crypto.randomUUID(),name,avatar:config(),grade:4,coins:0,food:0,toys:0,correct:0,stats:{},daily:{},pets:{}})
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
export const rank=p=>{const total=Object.values(p.stats).filter(r=>progress(r)===100).length;return {total,index:thresholds.findLastIndex(t=>total>=t)}}
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
export function gradeAnswer(p,g,id,l,ok,date=today()){
 const rows=record(p,g,id)
 p.stats[key(g,id)]=rows
 rows[l-1][0]++
 const d=dailyStats(p,g,date)
 p.daily[date+':'+g]=d
 d.any++
 p.coins+=pointsForAnswer(ok)
 if(!ok){d.streak=0;return}
 rows[l-1][1]++
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
export function buy(p,i){
 const item=animals[i]
 if(!item||p.pets[i]||p.coins<item[1])return false
 p.coins-=item[1]
 p.pets[i]={food:75,happy:75,energy:75,sleep:0,updated:Date.now()}
 return true
}
export function feedingStatus(p,date=today()){
 let correct=0
 for(let grade=1;grade<grades.length;grade++)correct+=dailyStats(p,grade,date).correct
 const pets=Object.values(p.pets)
 const fed=pets.filter(pet=>pet.fedOn===date).length
 return {fed,total:pets.length,available:Math.max(0,correct-fed*feedingCost)}
}
export function readPet(pet,now=Date.now(),date=today(now)){
 const elapsed=Math.max(0,Math.floor((now-pet.updated)/3600000))
 const sleep=pet.sleep>now
 return {...pet,food:pet.fedOn===date?100:Math.max(25,Math.min(45,pet.food)-2*elapsed),happy:Math.max(25,pet.happy-elapsed),energy:pet.sleep&&!sleep?100:Math.max(25,pet.energy-elapsed),sleep:sleep?pet.sleep:0}
}
export function care(p,i,action,now=Date.now()){
 if(!p.pets[i])return false
 const date=today(now)
 const pet=readPet(p.pets[i],now,date)
 if(action==='wake'&&pet.sleep){pet.sleep=0;pet.energy=Math.min(100,pet.energy+12)}
 else if(pet.sleep)return false
 else if(action==='food'&&pet.fedOn!==date&&feedingStatus(p,date).available>=feedingCost){
  pet.fedOn=date
  pet.food=100
  pet.happy=Math.min(100,pet.happy+5)
 }
 else if(action==='play'&&p.toys&&pet.happy<100&&pet.energy>=30){p.toys--;pet.happy=Math.min(100,pet.happy+30);pet.energy-=8}
 else if(action==='sleep'){pet.sleep=now+120000}
 else return false
 p.pets[i]={...pet,updated:now}
 return true
}
const int=(n,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(n)&&n>=0&&n<=max
const obj=o=>o!==null&&typeof o==='object'&&!Array.isArray(o)
export function valid(data){
 const validRows=r=>Array.isArray(r)&&r.length===5&&r.every(x=>Array.isArray(x)&&x.length===2&&int(x[0])&&int(x[1],x[0]))
 const validStats=o=>obj(o)&&Object.entries(o).every(([k,v])=>{const [g,id]=k.split(':');return grades[g]?.some(c=>c.id===id)&&validRows(v)})
 const validPets=o=>obj(o)&&Object.entries(o).every(([i,p])=>String(+i)===i&&int(+i,17)&&obj(p)&&['food','happy','energy'].every(k=>int(p[k],100))&&int(p.updated)&&int(p.sleep)&&(p.fedOn===undefined||typeof p.fedOn==='string'&&/^\d{4}-\d\d-\d\d$/.test(p.fedOn)))
 const validDaily=o=>obj(o)&&Object.entries(o).every(([k,v])=>/^\d{4}-\d\d-\d\d:[1-8]$/.test(k)&&obj(v)&&['any','correct','streak','best'].every(s=>int(v[s]))&&obj(v.topics)&&Object.values(v.topics).every(n=>int(n))&&Array.isArray(v.claimed)&&v.claimed.every(n=>int(n,2)))
 const validAvatar=(a,p)=>obj(a)&&['preset','custom','pet'].includes(a.type)&&int(a.preset,5)&&['face','hair','shirt','accessory'].every(k=>int(a[k],3))&&int(a.pet,17)&&(a.type!=='pet'||!!p.pets[a.pet])
 return obj(data)&&data.version===1&&(data.keepScreenAwake===undefined||typeof data.keepScreenAwake==='boolean')&&['light','dark'].includes(data.theme)&&typeof data.motion==='boolean'&&Array.isArray(data.profiles)&&data.profiles.length>0&&new Set(data.profiles.map(p=>p?.id)).size===data.profiles.length&&data.profiles.every(p=>obj(p)&&typeof p.id==='string'&&/^[\da-f-]{36}$/.test(p.id)&&typeof p.name==='string'&&p.name.trim().length>0&&p.name.length<=28&&int(p.grade,8)&&p.grade>0&&Number.isSafeInteger(p.coins)&&['food','toys','correct'].every(k=>int(p[k]))&&validStats(p.stats)&&validPets(p.pets)&&validDaily(p.daily)&&validAvatar(p.avatar,p))&&data.profiles.some(p=>p.id===data.active)
}
