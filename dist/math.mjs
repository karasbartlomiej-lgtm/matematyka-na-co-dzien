const c=(id,name,icon)=>({id,name,icon})
const topics=Object.fromEntries([
c('add','Dodawanie','+'),c('sub','Odejmowanie','−'),c('compare','Porównywanie liczb','≶'),c('count','Liczenie przedmiotów','●'),c('word','Zadania tekstowe','?'),c('mul','Mnożenie','×'),c('div','Dzielenie','÷'),c('clock','Zegar','◷'),c('money','Pieniądze','zł'),c('measure','Jednostki miary','↔'),c('geo','Geometria','△'),c('order','Kolejność działań','( )'),c('frac','Ułamki zwykłe','½'),c('dec','Ułamki dziesiętne','0,1'),c('rules','Podzielność liczb','÷'),c('area','Pola i obwody','□'),c('signed','Liczby dodatnie i ujemne','±'),c('expr','Wyrażenia algebraiczne','2x'),c('pct','Procenty','%'),c('volume','Bryły i objętości','▧'),c('power','Potęgi','x²'),c('root','Pierwiastki','√'),c('eq','Równania','x='),c('pyth','Twierdzenie Pitagorasa','△'),c('prob','Prawdopodobieństwo','⅙'),c('stat','Statystyka','▥'),c('exam','Trening egzaminacyjny','✓')].map(x=>[x.id,x]))
export const grades=[null,'add sub compare count word','add sub mul div clock money word','mul div add sub measure geo','add sub mul div order frac dec geo measure word','order frac dec rules area geo word','signed frac dec expr pct area volume','pct power root eq expr geo','eq power root pyth volume prob stat exam'].map(x=>x?.split(' ').map(id=>topics[id]))
export const levels=['Bardzo łatwy','Łatwy','Średni','Trudny','Ekspert']
const rand=(lo,hi)=>lo+Math.floor(Math.random()*(hi-lo+1))
const pick=xs=>xs[rand(0,xs.length-1)]
const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a)
const fraction=(a,b)=>{const d=gcd(a,b);return b/d===1?String(a/d):a/d+'/'+b/d}
export const pl=n=>String(n).replace('.',',')
export function parse(raw){
 const s=raw.trim().replaceAll('−','-').replace(',','.')
 if (/^[<=>]$/.test(s)) return s
 if (/^-?\d+\/\d+$/.test(s)){const [a,b]=s.split('/').map(Number);return b&&Number.isSafeInteger(a)&&Number.isSafeInteger(b)?a/b:null}
 if (/^-?(?:\d+(?:\.\d+)?|\.\d+)$/.test(s)&&Number.isFinite(+s)) return +s
 return null
}
export function matches(input,answer){
 const a=parse(input),b=parse(answer)
 return a!==null&&(typeof a==='number'&&typeof b==='number'?Math.abs(a-b)<1e-10:a===b)
}
const task=(prompt,result,...steps)=>({prompt,answer:typeof result==='number'?pl(result):result,steps})

function orderMedium(){
 const type=rand(0,5)
 const a=rand(3,10), b=rand(2,10)
 const product=a*b
 const leftToRight='Mnożenie i dzielenie mają to samo pierwszeństwo. Zacznij od lewej.'

 switch(type){
 case 0: {
  const multiplier=rand(2,10)
  return task(`${product} ÷ ${b} × ${multiplier}`,a*multiplier,
   leftToRight,`${product} ÷ ${b} = ${a}`,`${a} × ${multiplier} = ${a*multiplier}`)
 }
 case 1:
  return task(`${a} × ${b} ÷ ${a}`,b,
   leftToRight,`${a} × ${b} = ${product}`,`${product} ÷ ${a} = ${b}`)
 case 2: {
  const multiplier=rand(2,9), multiplied=a*multiplier
  const addend=rand(2,100-multiplied)
  return task(`${addend} + ${product} ÷ ${b} × ${multiplier}`,addend+multiplied,
   'Najpierw wykonaj dzielenie i mnożenie od lewej do prawej. Potem dodaj.',
   `${product} ÷ ${b} = ${a}`,`${a} × ${multiplier} = ${multiplied}`,
   `${addend} + ${multiplied} = ${addend+multiplied}`)
 }
 case 3: {
  const part=rand(1,a-1), other=a-part
  return task(`(${part} + ${other}) × ${b} ÷ ${a}`,b,
   'Najpierw oblicz nawias. Potem mnóż i dziel od lewej do prawej.',
   `${part} + ${other} = ${a}`,`${a} × ${b} = ${product}`,`${product} ÷ ${a} = ${b}`)
 }
 case 4: {
  const base=rand(2,9), square=base*base
  const subtract=rand(1,square-1)
  return task(`${base}² − ${subtract}`,square-subtract,
   'Najpierw oblicz kwadrat liczby, czyli pomnóż ją przez samą siebie.',
   `${base} × ${base} = ${square}`,`${square} − ${subtract} = ${square-subtract}`)
 }
 default: {
  const first=rand(10,90), subtract=rand(2,first-1), remaining=first-subtract
  return task(`${first} − ${subtract} + ${b}`,remaining+b,
   'Dodawanie i odejmowanie mają to samo pierwszeństwo. Zacznij od lewej.',
   `${first} − ${subtract} = ${remaining}`,`${remaining} + ${b} = ${remaining+b}`)
 }
 }
}
export function exercise(id,g,l){
 if(id==='order'&&g===4&&l===3)return orderMedium()
 const caps=g===1?[5,8,10,15,20]:g===2?[12,20,40,70,100]:g===3?[20,45,100,300,1000]:[30,90,250,800,3000]
 const cap=caps[l-1], a=rand(2,Math.floor(cap/2)),b=rand(1,a),m=rand(2,l+2),n=rand(2,Math.min(g===2?5:10,l+4))
 switch(id){
 case 'add': return task(a+' + '+b,a+b,'Zacznij od '+a+' i dodaj '+b+'.',a+' + '+b+' = '+(a+b)+'.')
 case 'sub': return task(a+' − '+b,a-b,'Od '+a+' odejmij '+b+'.',a+' − '+b+' = '+(a-b)+'.')
 case 'compare': {const x=rand(1,cap),y=rand(Math.max(1,x-3),Math.min(cap,x+3));return task(x+'  ?  '+y,x===y?'=':x<y?'<':'>',x===y?'Obie liczby są równe.':(Math.max(x,y))+' jest większe niż '+Math.min(x,y)+'.','Szersza strona znaku jest zwrócona ku większej liczbie.')}
 case 'count':{const x=rand(2,Math.min(cap,16));return task('Policz kropki\n'+Array.from({length:x},()=> '●').join(' '),x,'Licz po jednej kropce od lewej do prawej.','Ostatnia liczba to '+x+'.')}
 case 'mul':{const x=g>=4&&l>=4?rand(11,l===5?35:19):g===2&&l===5?5:m;return task(x+' × '+n,x*n,'Masz '+n+' grup po '+x+'.',Array(n).fill(x).join(' + ')+' = '+x*n+'.')}
 case 'div':{const x=g>=4&&l>=4?rand(11,l===5?35:19):m;return task(x*n+' ÷ '+n,x,'Podziel '+x*n+' na '+n+' równych grup.','Sprawdź mnożeniem: '+n+' × '+x+' = '+x*n+'.')}
 case 'word':{const x=g>=3&&l>=4?m*n:a,verb=g>=3&&l>=4?' ma '+n+' pudełek po '+m+' kredek.':' ma '+a+' kredek.';return task('Ola'+verb+' Dostała jeszcze '+b+'. Ile kredek ma teraz?',x+b,...(g>=3&&l>=4?[n+' × '+m+' = '+x+ ' kredek przed prezentem.']:[]),x+' + '+b+' = '+(x+b)+' kredek.')}
 case 'clock':{
  const hour=rand(7,18), minute=l<3?0:5*rand(3,10), elapsed=l===1?rand(1,4)*10:l===2?rand(2,11)*5:5*rand(6,10+3*l)
  const mm=x=>String(x).padStart(2,'0')
  const sum=minute+elapsed
  return task('Jest '+hour+':'+mm(minute)+'. Po upływie '+elapsed+' min odczytaj minuty na zegarze. Wpisz tylko liczbę minut.',sum%60,minute+' + '+elapsed+' = '+sum+' minut od pełnej godziny.','Każde 60 minut to godzina. Na zegarze pozostaje '+mm(sum%60)+' minut.')
 }
 case 'money':{
  const paid=5*(l+rand(1,l+3)),cost=rand(1,paid-1)
  return task('Płacisz '+paid+' zł za zakupy za '+cost+' zł. Ile złotych reszty dostaniesz?',paid-cost,'Reszta to kwota zapłacona minus cena.',paid+' − '+cost+' = '+(paid-cost)+' zł.')
 }
 case 'measure':{const [u,v,k]=pick(l<3?[['m','cm',100],['kg','g',1000]]:[['km','m',1000],['m','mm',1000],['cm','mm',10]]);const x=m*n;return task('Ile '+v+' to '+x+' '+u+'?',x*k,'1 '+u+' to '+k+' '+v+'.',x+' × '+k+' = '+x*k+' '+v+'.')}
 case 'geo':{if(g>=7){const x=rand(25,55+l*4),y=rand(18,30+l*6);return task('Kąty w trójkącie mają '+x+'° i '+y+'°. Ile stopni ma trzeci kąt?',180-x-y,'Suma kątów trójkąta to 180°.', '180 − '+x+' − '+y+' = '+(180-x-y)+'°.')};return task('Prostokąt ma boki '+m+' cm i '+n+' cm. Oblicz obwód w cm.',2*(m+n),'Dodaj długości wszystkich czterech boków.','2 × ('+m+' + '+n+') = '+2*(m+n)+' cm.')}
 case 'order':{const grouped=l>=3;const x=grouped?(a+m)*n:m*n;const delta=l>=4?b:0;return task((grouped?'('+a+' + '+m+') × '+n:a+' + '+m+' × '+n)+(delta?' − '+delta:''),x+(grouped?0:a)-delta,grouped?'Najpierw nawias: '+a+' + '+m+' = '+(a+m)+'.':'Najpierw mnożenie: '+m+' × '+n+' = '+x+'.',grouped?'Pomnóż '+(a+m)+' przez '+n+': '+x+'.':'Dodaj '+a+' i '+x+'.',...(delta?[x+' − '+delta+' = '+(x-delta)+'.']:[]))}
 case 'frac':{const d=rand(5,9+l),x=rand(1,d-2),y=rand(1,d-x),k=g>=5&&l>=3?rand(2,l):1,z=l>=4?Math.min(x,y):y;return task(x+'/'+d+(l>=4?' − ':' + ')+z+'/'+(d*k),fraction(x*k+(l>=4?-z:z),d*k),'Sprowadź ułamki do mianownika '+d*k+': '+x*k+'/'+d*k+' oraz '+z+'/'+d*k+'.',l>=4?'Odejmij liczniki, zachowując mianownik.':'Dodaj liczniki, zachowując mianownik.')}
 case 'dec':{const k=l>=3?100:10, x=a+b,y=b, subtract=l%2===0;return task(pl(x/k)+(subtract?' − ':' + ')+pl(y/k), (x+(subtract?-y:y))/k,'Zapisz obie liczby tak, by przecinki znalazły się pod sobą.',(subtract?'Odejmij ':'Dodaj ')+x+' i '+y+' w jednostkach 1/'+k+' i wpisz wynik z przecinkiem.')}
 case 'rules':return task('Ile wielokrotności liczby '+m+' jest od 1 do '+(m*n+b)+'?',Math.floor((m*n+b)/m),'Pierwsza dodatnia wielokrotność to '+m+'.','Podziel '+(m*n+b)+' przez '+m+' i pomiń resztę.')
 case 'area':{const triangle=g>=6&&l>=3;if(!triangle&&Math.random()<.5)return task('Obwód prostokąta o bokach '+m+' cm i '+n+' cm. Podaj wynik w cm.',2*(m+n),'Prostokąt ma dwie pary równych boków.','2 × ('+m+' + '+n+') = '+2*(m+n)+' cm.');return task(triangle?'Pole trójkąta o podstawie '+2*m+' cm i wysokości '+n+' cm. Podaj wynik w cm².':'Pole prostokąta o bokach '+m+' cm i '+n+' cm. Podaj wynik w cm².',m*n,triangle?'Pomnóż podstawę przez wysokość i podziel przez 2.':'Pomnóż długości sąsiednich boków.',triangle?2*m+' × '+n+' ÷ 2 = '+m*n+'.':m+' × '+n+' = '+m*n+'.')}
 case 'signed':{const x=rand(1,l*10),y=rand(1,l*12),sub=l>=3;return task('−'+x+(sub?' − (−'+y+')':' + '+y),y-x,sub?'Odejmowanie liczby ujemnej zastąp dodawaniem liczby dodatniej.':'Na osi liczbowej zacznij od −'+x+'.','Przesuń się o '+y+' w prawo: −'+x+' + '+y+' = '+(y-x)+'.')}
 case 'expr':return task('Oblicz '+m+'x + '+b+' dla x = '+n+'.',m*n+b,'Wstaw '+n+' w miejsce x.',m+' × '+n+' + '+b+' = '+(m*n+b)+'.')
 case 'pct':{const p=pick(l<=2?[10,25,50]:[5,15,20,30,35,45,60,75]);const x=20*m;return task('Ile to '+p+'% z '+x+'?',p*x/100,p+'% to '+p+'/100.',p+' × '+x+' ÷ 100 = '+pl(p*x/100)+'.')}
 case 'volume':{const h=rand(2,l+4);return task('Objętość prostopadłościanu o wymiarach '+m+' × '+n+' × '+h+' cm. Podaj wynik w cm³.',m*n*h,'Pole podstawy: '+m+' × '+n+' = '+m*n+' cm².','Pomnóż pole podstawy przez '+h+': '+m*n*h+' cm³.')}
 case 'power':{const e=l>=4?3:2;return task(m+(e===2?'²':'³'),m**e,Array(e).fill(m).join(' × ')+' = '+m**e+'.','Wykładnik '+e+' mówi, ile jednakowych czynników mnożymy.')}
 case 'root':{const x=m+(l>=4?4:0);if(l>=4&&Math.random()<.5)return task('∛'+x**3,x,'Szukamy liczby, której sześcian jest równy '+x**3+'.',Array(3).fill(x).join(' × ')+' = '+x**3+'.');return task('√'+x*x,x,'Szukamy liczby nieujemnej, której kwadrat to '+x*x+'.',x+' × '+x+' = '+x*x+'.')}
 case 'eq':{const x=l>=3?-n:n;return task(m+'x + '+b+' = '+(m*x+b)+'. Ile wynosi x?',x,'Odejmij '+b+' od obu stron: '+m+'x = '+m*x+'.','Podziel obie strony przez '+m+': x = '+x+'.')}
 case 'pyth':{const [p,q,r]=pick(l<=2?[[3,4,5],[6,8,10]]:[[5,12,13],[8,15,17],[9,12,15],[7,24,25]]).map(x=>l===5?2*x:x);return task('Trójkąt prostokątny ma przyprostokątne '+p+' cm i '+q+' cm. Podaj długość przeciwprostokątnej w cm.',r,p+'² + '+q+'² = '+(p*p+q*q)+'.','Oblicz pierwiastek: √'+r*r+' = '+r+'.')}
 case 'prob':return task('W woreczku jest '+m+' czerwonych i '+n+' niebieskich kul. Jakie jest prawdopodobieństwo wylosowania czerwonej? Wpisz ułamek.',fraction(m,m+n),'Wszystkich kul jest '+m+' + '+n+' = '+(m+n)+'.','Podziel liczbę czerwonych kul przez liczbę wszystkich kul.')
 case 'stat':{const x=m+n,e=rand(1,l+1);return task('Oblicz średnią liczb '+(x-e)+', '+x+' i '+(x+e)+'.',x,'Suma trzech liczb to '+3*x+'.','Podziel sumę przez 3: '+x+'.')}
 case 'exam':return exercise(pick(['eq','pct','pyth','prob','stat','volume','order']),g,l)
 default: throw Error('Nieznana kategoria: '+id)
 }
}
