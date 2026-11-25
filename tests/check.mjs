import assert from 'node:assert/strict'
import {grades,activeGrade,activeTopics,exercise,matches,parse} from '../dist/math.mjs'
import {animals, profile, gradeAnswer, record, rank, progress, dailySet, claim, buy, care, readPet, feedingStatus, valid, today} from '../dist/game.mjs'

const placeNames=[
 'jedności','dziesiątek','setek','tysięcy','dziesiątek tysięcy','setek tysięcy',
 'milionów','dziesiątek milionów','setek milionów','miliardów'
]
function solvePlaceValue(prompt){
 if(prompt.startsWith('Zapisz jedną liczbą: ')){
  return prompt.slice('Zapisz jedną liczbą: '.length).split(' + ').reduce((sum,part)=>{
   const [digit,unit]=part.split(' × ').map(value=>Number(value.replaceAll(' ','')))
   return sum+digit*unit
  },0)
 }
 const [,place,number]=prompt.match(/na miejscu (.+) w liczbie ([\d ]+)\?$/)
 const offset=placeNames.indexOf(place)
 assert(offset>=0)
 const digits=number.replaceAll(' ','')
 const digit=Number(digits.at(-1-offset))
 return prompt.startsWith('Jaka cyfra')?digit:Number(String(digit)+'0'.repeat(offset))
}
assert.equal(activeGrade,4)
assert.equal(activeTopics.length,11)
assert(activeTopics.some(topic=>topic.id==='placeValue'))
assert.equal(parse('1 234 567 890'),1234567890)
assert.equal(parse('1\u202f234\u202f567\u202f890'),1234567890)
assert.equal(parse('12 34'),null)
assert(matches('9 000 000 000','9000000000'))

function solve(q){
 const s=q.prompt, nums=s.match(/\d+(?:,\d+)?/g)?.map(n=>+n.replace(',','.'))??[]
 const [a,b,c,d]=nums
 if(/^(Jaka cyfra|Jaką wartość|Zapisz jedną liczbą)/.test(s))return solvePlaceValue(s)
 if(s.startsWith('Policz kropki'))return [...s].filter(x=>x==='●').length
 if(/^\d+  \?/.test(s))return a===b?'=':a<b?'<':'>'
 if(s.startsWith('Ola'))return s.includes('pudełek')?a*b+c:a+b
 if(s.startsWith('Jest'))return (b+c)%60
 if(s.startsWith('Płacisz'))return a-b
 if(s.startsWith('Ile wielokrotności'))return Math.floor(c/a)
 if(/^Ile (cm|g|m|mm) to/.test(s)){
  const [,target,n,unit]=s.match(/^Ile (\w+) to (\d+) (\w+)/)
  const units={mm:1,cm:10,m:1000,km:1000000,g:1,kg:1000}
  return +n*units[unit]/units[target]
 }
 if(s.startsWith('Kąty'))return 180-a-b
 if(/^(Prostokąt ma|Obwód prostokąta)/.test(s))return 2*(a+b)
 if(s.startsWith('Pole trójkąta'))return a*b/2
 if(s.startsWith('Pole prostokąta'))return a*b
 if(s.startsWith('Oblicz średnią'))return ((s.includes('liczb -')?-a:a)+b+c)/3
 if(s.startsWith('Oblicz '))return a*c+b
 if(s.startsWith('Ile to '))return a*b/100
 if(s.startsWith('Objętość'))return a*b*c
 if(s.startsWith('Trójkąt prostokątny'))return Math.hypot(a,b)
 if(s.startsWith('W woreczku'))return a/(a+b)
 if(s.startsWith('√'))return Math.sqrt(a)
 if(s.startsWith('∛'))return Math.cbrt(a)
 if(s.endsWith('²'))return a*a
 if(s.endsWith('³'))return a*a*a
 if(s.includes('Ile wynosi x?'))return ((s.includes('= -')?-c:c)-b)/a
 if(/^−/.test(s))return b-a
 if(s.includes('/'))return a/b+(s.includes('−')?-1:1)*c/d
 if(s.includes('÷'))return a/b
 if(s.startsWith('('))return (a+b)*c-(d??0)
 if(s.includes('+')&&s.includes('×'))return a+b*c
 if(s.includes('×'))return a*b
 if(s.includes('+'))return a+b
 if(s.includes('−'))return a-b
 throw Error('Brak niezależnej reguły: '+s)
}
function solveOrder(prompt){
 assert.match(prompt,/^[\d ()²+−×÷]+$/)
 const js=prompt.replaceAll('²','**2').replaceAll('−','-').replaceAll('×','*').replaceAll('÷','/')
 return Function('return ('+js+')')()
}
const orderTypes=[
 /^\d+ ÷ \d+ × \d+$/,
 /^\d+ × \d+ ÷ \d+$/,
 /^\d+ \+ \d+ ÷ \d+ × \d+$/,
 /^\(\d+ \+ \d+\) × \d+ ÷ \d+$/,
 /^\d+² − \d+$/,
 /^\d+ − \d+ \+ \d+$/
]
const random=Math.random
try{
 for(const [type,pattern] of orderTypes.entries())for(let i=0;i<100;i++){
  let chooseType=true
  Math.random=()=>{
   if(chooseType){chooseType=false;return (type+0.5)/orderTypes.length}
   return i/100
  }
  const q=exercise('order',4,3)
  assert.match(q.prompt,pattern)
  const result=solveOrder(q.prompt)
  assert.equal(parse(q.answer),result)
  const steps=q.steps.slice(1)
  assert(steps.length>=2)
  for(const equation of steps){
   const [calculation,answer]=equation.split(' = ')
   assert.equal(solveOrder(calculation),Number(answer))
  }
  assert.equal(Number(steps.at(-1).split(' = ').at(-1)),result)
  for(const number of [q.prompt,...steps].join(' ').match(/\d+/g).map(Number)){
   assert(number>=0&&number<=100,JSON.stringify(q))
  }
 }
}finally{Math.random=random}

for(const [level,place] of [[1,'jedności'],[1,'dziesiątek'],[3,'milionów'],[5,'miliardów']]){
 const index=placeNames.indexOf(place)
 const min=level===1?0:index-2
 const rolls=[(index-min+0.5)/(level===1?2:3),0.23,0]
 try{
  Math.random=()=>rolls.shift()
  const q=exercise('placeValue',4,level)
  assert(q.prompt.includes('na miejscu '+place+' w liczbie'))
  assert.equal(parse(q.answer),solvePlaceValue(q.prompt))
 }finally{Math.random=random}
}

let samples=0, variants=0
for(let g=1;g<=8;g++)for(const {id} of grades[g])for(let l=1;l<=5;l++){
 variants++
 for(let i=0;i<80;i++){
  const q=exercise(id,g,l), answer=id==='order'&&g===4&&l===3?solveOrder(q.prompt):solve(q),actual=parse(q.answer)
  if(typeof answer==='number')assert(Math.abs(answer-actual)<1e-9,JSON.stringify(q))
  else assert.equal(actual,answer,q.prompt)
  assert(matches(q.answer,q.answer),q.prompt)
  assert(q.steps.length>=1&&q.steps.every(x=>x.length>2&&!/undefined|NaN|Infinity/.test(x)))
  samples++
 }
}
assert(matches(' 2/4 ', '0,5'))
assert(matches('−3', '-3'))
assert.equal(parse('1/0'),null)
assert.equal(parse(''),null)
assert.equal(matches('1,2,3','1,2'),false)
const p=profile('Test A'), b=profile('Test B'), date='2026-11-21'
for(let i=0;i<12;i++)gradeAnswer(p,4,'add',3,true,date)
assert.deepEqual(record(p,4,'add')[2],[12,12])
assert.deepEqual([p.coins,p.food,p.toys],[120,0,1])
assert.equal(progress(record(p,4,'add')),100)
assert.equal(rank(p).index,1)
assert.equal(rank(b).index,0)
const legacy=profile('Starszy profil')
legacy.grade=7
for(let i=0;i<12;i++)gradeAnswer(legacy,7,'pct',3,true,date)
assert.equal(progress(record(legacy,7,'pct')),100)
assert.equal(rank(legacy).index,1)
assert.equal(record(legacy,activeGrade,'pct')[2][0],0)
assert.equal(progress([[100,100],[20,20],[1,1],[0,0],[0,0]])<100,true)
assert.equal(progress([[0,0],[0,0],[13,10],[0,0],[0,0]])<100,true)
assert.equal(progress(record(p,3,'add')),0)
gradeAnswer(p,4,'add',3,false,date)
assert.equal(p.coins,115)
assert.equal(dailySet(4,date).length,3)
assert.notDeepEqual(dailySet(4,date),dailySet(4,'2026-11-22'))
assert(claim(p,4,'any',date))
assert(!claim(p,4,'any',date))
for(let i=0;i<12;i++)gradeAnswer(p,2,'add',1,true,date)
assert(!claim(p,2,'any',date))
assert(!claim(p,4,'any','2026-11-22'))
assert(!buy(b,0))
p.coins=10000
for(let i=0;i<animals.length;i++){
 const balance=p.coins
 assert(buy(p,i))
 assert.equal(p.coins,balance-animals[i][1])
 assert(!buy(p,i))
}
const now=Date.parse(date+'T12:00:00Z')
assert(care(p,0,'food',now))
assert(care(p,0,'play',now))
assert.equal(p.pets[0].food,100)
assert.equal(p.pets[0].happy,100)
assert(care(p,0,'sleep',now))
assert(!care(p,0,'play',now))
assert.equal(readPet(p.pets[0],now+120001).energy,100)
assert(care(p,0,'wake',now+1))
assert.equal(readPet(p.pets[0],now+999e7).food,25)
assert.deepEqual([b.coins,b.food,b.toys,Object.keys(b.pets).length],[0,0,0,0])
const snapshot={version:1,active:p.id,profiles:[p,b],theme:'dark',motion:false}
assert(valid(JSON.parse(JSON.stringify(snapshot))))
assert(valid({...snapshot,active:legacy.id,profiles:[legacy]}))
assert(valid({...snapshot,keepScreenAwake:true}))
assert(!valid({...snapshot,keepScreenAwake:'true'}))
assert(!valid({...snapshot,version:2}))
assert(!valid({...snapshot,profiles:[p,p]}))
assert(valid({...snapshot,profiles:[{...p,coins:-5},b]}))
assert(!valid({...snapshot,profiles:[{...p,coins:-0.5},b]}))

const caretaker=profile('Opiekun')
caretaker.coins=150
assert(buy(caretaker,0))
assert(buy(caretaker,1))
const evening=Date.parse('2026-11-24T22:59:00Z')
const morning=Date.parse('2026-11-24T23:00:00Z')
assert.equal(today(evening),'2026-11-24')
assert.equal(today(morning),'2026-11-25')
gradeAnswer(caretaker,4,'add',1,false,today(evening))
assert.equal(caretaker.coins,-5)
caretaker.food=100 // Legacy reserves cannot replace today's exercises.
for(let i=0;i<14;i++)gradeAnswer(caretaker,4,'add',1,true,today(evening))
assert.equal(caretaker.coins,135)
assert(!care(caretaker,0,'food',evening))
gradeAnswer(caretaker,2,'add',1,true,today(evening))
assert.deepEqual(feedingStatus(caretaker,today(evening)),{fed:0,total:2,available:15})
assert(care(caretaker,0,'food',evening))
assert.equal(readPet(caretaker.pets[0],evening).food,100)
assert(!care(caretaker,0,'food',evening))
assert(!care(caretaker,1,'food',evening))
for(let i=0;i<15;i++)gradeAnswer(caretaker,2,'add',1,true,today(evening))
assert(care(caretaker,1,'food',evening))
assert.deepEqual(feedingStatus(caretaker,today(evening)),{fed:2,total:2,available:0})
gradeAnswer(caretaker,4,'add',1,true,today(evening))
assert.deepEqual(feedingStatus(caretaker,today(morning)),{fed:0,total:2,available:0})
assert(!care(caretaker,0,'food',morning))
assert(readPet(caretaker.pets[0],morning).food<50)
const backup={...snapshot,active:caretaker.id,profiles:[caretaker]}
assert(valid(JSON.parse(JSON.stringify(backup))))
console.log(samples+' zadań, '+variants+' zestawień klasy, kategorii i trudności. Testy logiki gry i kopii zakończone pomyślnie.')
