const $=s=>document.querySelector(s);
const COL=['#ffffff','#e53935','#1e88e5','#fdd835','#8e24aa','#fb8c00','#00acc1','#d81b60','#43a047','#6d4c41','#3949ab','#00897b','#c0ca33','#f48fb1','#90a4ae','#212121'];
const R=8,Q=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]],TAU=Math.PI*2;
// Dificuldades: hr=raio do buraco, k=atrito, cap=vel. máx. p/ encaçapar, max=limite de tacadas, sp=vel. dos obstáculos, aim=guia (2 trajetória, 1 reta, 0 nenhuma)
const DIF=[{n:'Fácil',hr:17,k:1,cap:640,max:8,sp:.7,aim:2},{n:'Normal',hr:14,k:1.1,cap:520,max:6,sp:1,aim:1},{n:'Difícil',hr:12,k:1.2,cap:440,max:6,sp:1.3,aim:0},{n:'Extremo',hr:10,k:1.3,cap:380,max:5,sp:1.7,aim:0}];
// Obstáculos (z): s=plasma lento, v=vácuo (penalidade), u=turbo, b=bumper, m=bloco móvel, r=barra giratória. d=dificuldade mínima
const H=[
{par:3,s:[400,430],h:[200,120],w:[[[320,470],[320,300],[120,300],[120,60],[420,60],[420,200],[480,200],[480,470]]],z:[{k:'s',p:Q(330,340,140,60),d:1},{k:'b',x:220,y:180,r:16,d:2}]},
{par:3,s:[300,430],h:[300,110],w:[Q(60,60,480,410),Q(200,220,200,40)],z:[{k:'b',x:130,y:300,r:18,d:1},{k:'b',x:470,y:300,r:18,d:1},{k:'m',x0:200,y0:380,x1:400,y1:380,w:40,h:16,T:3,d:2}]},
{par:4,s:[130,110],h:[470,110],w:[[[60,470],[60,60],[200,60],[200,380],[400,380],[400,60],[540,60],[540,470]]],z:[{k:'u',p:Q(215,395,170,65),a:0,d:0},{k:'s',p:Q(410,200,125,40),d:1},{k:'m',x0:445,y0:290,x1:495,y1:290,w:56,h:14,T:2.6,d:2}]},
{par:3,s:[300,430],h:[300,110],w:[Q(60,60,480,410)],z:[{k:'v',p:Q(220,190,160,110),d:0},{k:'v',p:Q(90,320,90,110),d:2},{k:'v',p:Q(420,320,90,110),d:2},{k:'b',x:140,y:150,r:16,d:1},{k:'b',x:460,y:150,r:16,d:1}]},
{par:3,s:[100,265],h:[500,265],w:[Q(60,60,480,410)],z:[{k:'r',x:300,y:265,L:100,T:1.5,d:0},{k:'r',x:300,y:265,L:100,T:1.5,ph:1.5708,d:1},{k:'b',x:300,y:110,r:16,d:2},{k:'b',x:300,y:420,r:16,d:2},{k:'s',p:Q(420,160,90,60),d:3}]},
{par:4,s:[90,430],h:[510,90],w:[Q(60,60,480,410),Q(280,60,40,260)],z:[{k:'m',x0:300,y0:345,x1:300,y1:440,w:50,h:16,T:3,d:0},{k:'s',p:Q(380,60,160,130),d:1},{k:'b',x:430,y:390,r:16,d:1},{k:'r',x:170,y:200,L:55,T:1.8,d:2},{k:'v',p:Q(420,300,100,60),d:3}]}];

let P=[],me=0,hole=0,mode='',cur=0,segs=[],Z=[],peer,conn,conns=[],started=false,drag=null,an=null,last=0,fr=0,sendT=0,endT=0,locked=false,dif=1,D=DIF[1],ht=0,acc=0,PT=[];
const S=Array.from({length:40},()=>[Math.random()*600,Math.random()*500,Math.random()*1.5+.5,Math.random()*6]);
const PO={debug:0,config:{iceCandidatePoolSize:4,iceServers:[
{urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302','stun:global.stun.twilio.com:3478']},
{urls:['turn:openrelay.metered.ca:80','turn:openrelay.metered.ca:443','turn:openrelay.metered.ca:443?transport=tcp'],username:'openrelayproject',credential:'openrelayproject'}]}};
const cv=$('#c'),g=cv.getContext('2d');
function fit(){const d=Math.min(window.devicePixelRatio||1,2),w=cv.clientWidth||600;cv.width=Math.round(w*d);cv.height=Math.round(w*d*5/6);g.setTransform(cv.width/600,0,0,cv.height/500,0,0)}
addEventListener('resize',fit);addEventListener('orientationchange',()=>setTimeout(fit,200));

let AC;const snd=(f,d=.08,ty='sine',v=.04)=>{try{AC=AC||new AudioContext();const o=AC.createOscillator(),x=AC.createGain();o.type=ty;o.frequency.value=f;x.gain.value=v;o.connect(x);x.connect(AC.destination);o.start();x.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+d);o.stop(AC.currentTime+d)}catch(e){}};
const fx=(x,y,c,n)=>{for(let i=0;i<n;i++){const a=Math.random()*TAU,s=40+Math.random()*140;PT.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:1,c})}};

function show(id){document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('on',s.id==id))}
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>show(b.dataset.go));
function setDif(i){dif=i;D=DIF[i];document.querySelectorAll('.dif button').forEach(b=>b.classList.toggle('on',b.dataset.i==i))}
document.querySelectorAll('.dif').forEach(c=>{c.innerHTML=DIF.map((d,i)=>`<button data-i="${i}">${d.n}</button>`).join('');c.onclick=e=>{const i=e.target.dataset.i;if(i!=null)setDif(+i)}});setDif(1);
const mk=(n,i)=>({n,c:COL[i%16],x:0,y:0,vx:0,vy:0,st:0,done:false,sunk:false,moved:false,total:0,h:[],tr:[]});

/* ---------- LOCAL ---------- */
$('#iniL').onclick=()=>{
  const q=Math.max(2,Math.min(16,+$('#qtd').value||2));
  P=Array.from({length:q},(_,i)=>mk('Jogador '+(i+1),i));
  mode='local';me=0;cur=0;begin();
};

/* ---------- ONLINE ---------- */
const bc=(m,ex)=>conns.forEach(c=>c!==ex&&c.open&&c.send(m));
function lobby(code){
  show('lobby');$('#sala').textContent=code;
  $('#lista').innerHTML=P.map(p=>`<li>⛳ ${p.n}</li>`).join('');
  $('#ini').style.display=$('#difH').style.display=mode=='host'?'':'none';
  $('#espera').textContent=mode=='host'?(P.length<2?'Aguardando jogadores...':P.length+' jogadores na sala'):'Aguardando o anfitrião iniciar...';
}
$('#criar').onclick=()=>{
  const code=Array.from({length:4},()=>'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.random()*24|0]).join('');
  $('#msg').textContent='Criando sala...';
  peer=new Peer('bgolf-'+code,PO);
  peer.on('open',()=>{mode='host';me=0;conns=[];started=false;P=[mk($('#nome').value||'Anfitrião',0)];lobby(code)});
  peer.on('connection',c=>{
    c.on('data',d=>{
      if(d.t=='j'){
        if(P.length>=16||started){c.send({t:'full'});return}
        c.i=P.length;P.push(mk(d.n||'Jogador',c.i));conns.push(c);
        c.send({t:'w',i:c.i});bc({t:'l',n:P.map(p=>p.n)});lobby($('#sala').textContent);
      }else if(d.t=='p'){upd2(d);bc(d,c)}
    });
    c.on('close',()=>{const p=P[c.i];if(p&&started){p.done=true;p.away=true}});
  });
  peer.on('error',e=>$('#msg').textContent='Erro: '+e.type+' (tente novamente)');
};
$('#entrar').onclick=()=>{
  const code=$('#cod').value.trim().toUpperCase();if(code.length!=4){$('#msg').textContent='Digite o código de 4 letras';return}
  $('#msg').textContent='Conectando...';mode='client';
  peer=new Peer(undefined,PO);
  peer.on('open',()=>{
    conn=peer.connect('bgolf-'+code,{reliable:true});setTimeout(()=>{if(conn&&!conn.open)$('#msg').textContent='Sem resposta... confira o código ou tente de novo'},12000);
    conn.on('open',()=>conn.send({t:'j',n:$('#nome').value||'Jogador'}));
    conn.on('data',d=>{
      if(d.t=='w')me=d.i;
      else if(d.t=='l'){P=d.n.map((n,i)=>P[i]||mk(n,i));lobby(code)}
      else if(d.t=='s'){setDif(d.d|0);begin()}
      else if(d.t=='p')upd2(d);
      else if(d.t=='e')endHole(d.sc);
      else if(d.t=='full'){$('#msg').textContent='Sala cheia ou já iniciada';show('online')}
    });
    conn.on('close',()=>{if(!$('#fim').classList.contains('on')){alert('Conexão perdida');location.reload()}});
  });
  peer.on('error',e=>$('#msg').textContent=e.type=='peer-unavailable'?'Sala não encontrada':'Erro: '+e.type);
};
$('#ini').onclick=()=>{if(P.length<2){$('#espera').textContent='Mínimo de 2 jogadores';return}started=true;bc({t:'s',d:dif});begin()};
// jogadores remotos: guarda alvo (tx,ty) e suaviza no loop
function upd2(d){const p=P[d.i];if(!p||d.i==me)return;Object.assign(p,{tx:d.x,ty:d.y,st:d.s,done:d.d,sunk:d.k})}
function sendMe(){
  const p=P[me],m={t:'p',i:me,x:p.x,y:p.y,s:p.st,d:p.done,k:p.sunk};
  mode=='host'?bc(m):conn&&conn.open&&conn.send(m);
}

/* ---------- JOGO ---------- */
function begin(){hole=0;P.forEach(p=>{p.total=0;p.h=[]});startHole();show('game');fit()}
function startHole(){
  const h=H[hole];segs=[];Z=h.z.filter(z=>z.d<=dif);PT=[];
  h.w.forEach(poly=>poly.forEach((a,i)=>segs.push({a,b:poly[(i+1)%poly.length],th:0})));
  P.forEach(p=>{[p.x,p.y]=h.s;p.tx=p.x;p.ty=p.y;p.lx=p.x;p.ly=p.y;p.vx=p.vy=0;p.st=0;p.done=!!p.away;p.sunk=false;p.moved=false;p.tr=[]});
  cur=0;endT=0;locked=false;ht=0;acc=0;toast(`Buraco ${hole+1} • Par ${h.par} • ${D.n}`,1800);
}
function toast(t,ms){const e=$('#toast');e.innerHTML=t;e.style.display='block';e.style.animation='none';e.offsetWidth;e.style.animation='';clearTimeout(e.t);e.t=setTimeout(()=>e.style.display='none',ms)}
const score=p=>p.sunk?p.st:D.max+1;

function inP(p,poly){let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p.y)!=(b[1]>p.y)&&p.x<(b[0]-a[0])*(p.y-a[1])/(b[1]-a[1])+a[0])c=!c}return c}
// posição/velocidade do bloco móvel no tempo t
function mv(z,t){const f=TAU/(z.T/D.sp),s=(1-Math.cos(f*t))/2,v=Math.sin(f*t)*f/2;return{x:z.x0+(z.x1-z.x0)*s,y:z.y0+(z.y1-z.y0)*s,vx:(z.x1-z.x0)*v,vy:(z.y1-z.y0)*v}}
function dyn(t){const o=[];Z.forEach(z=>{
  if(z.k=='m'){const m=mv(z,t),x=m.x-z.w/2,y=m.y-z.h/2,c=Q(x,y,z.w,z.h);c.forEach((a,i)=>o.push({a,b:c[(i+1)%4],th:0,v:[m.vx,m.vy]}))}
  else if(z.k=='r'){const a=t*z.T*D.sp+(z.ph||0),dx=Math.cos(a)*z.L,dy=Math.sin(a)*z.L;o.push({a:[z.x-dx,z.y-dy],b:[z.x+dx,z.y+dy],th:3,c:[z.x,z.y,z.T*D.sp]})}});return o}
// colisão bola x segmento (com velocidade da parede). Retorna intensidade do impacto
function col(p,s){
  const a=s.a,b=s.b,dx=b[0]-a[0],dy=b[1]-a[1];let u=((p.x-a[0])*dx+(p.y-a[1])*dy)/(dx*dx+dy*dy);u=Math.max(0,Math.min(1,u));
  const cx=a[0]+u*dx,cy=a[1]+u*dy,r=R+s.th;let nx=p.x-cx,ny=p.y-cy,d=Math.hypot(nx,ny);if(d>=r)return 0;
  if(!d){nx=1;ny=0;d=1}nx/=d;ny/=d;p.x=cx+nx*r;p.y=cy+ny*r;
  const w=s.v||(s.c?[-s.c[2]*(cy-s.c[1]),s.c[2]*(cx-s.c[0])]:[0,0]),dot=(p.vx-w[0])*nx+(p.vy-w[1])*ny;
  if(dot<0){p.vx-=1.85*dot*nx;p.vy-=1.85*dot*ny;return -dot}return 1;
}
// Retorna: 'h' encaçapou, 'v' caiu no vácuo, 'o' saiu da pista, ou intensidade de impacto
function step(p,dt,t,pre){
  if(Math.hypot(p.vx,p.vy)<8){p.vx=p.vy=0;return 0}
  const h=H[hole];p.x+=p.vx*dt;p.y+=p.vy*dt;let hv=0,k=D.k;
  for(const s of segs)hv=Math.max(hv,col(p,s));
  for(const s of dyn(t))hv=Math.max(hv,col(p,s));
  for(const z of Z){
    if(z.k=='s'){if(inP(p,z.p))k+=3.5}
    else if(z.k=='u'){if(inP(p,z.p)){p.vx+=Math.cos(z.a)*1100*dt;p.vy+=Math.sin(z.a)*1100*dt}}
    else if(z.k=='b'){const dx=p.x-z.x,dy=p.y-z.y,d=Math.hypot(dx,dy),r=z.r+R;
      if(d<r){const nx=dx/d,ny=dy/d,dot=p.vx*nx+p.vy*ny;p.x=z.x+nx*r;p.y=z.y+ny*r;if(dot<0){p.vx-=2*dot*nx;p.vy-=2*dot*ny}p.vx+=nx*150;p.vy+=ny*150;hv=Math.max(hv,260);if(!pre)z.f=ht}}
    else if(z.k=='v'&&inP(p,z.p))return 'v';
  }
  const s2=Math.hypot(p.vx,p.vy),n=Math.max(0,s2*Math.exp(-k*dt)-28*dt)/(s2||1);p.vx*=n;p.vy*=n;
  const d=Math.hypot(p.x-h.h[0],p.y-h.h[1]),sp=Math.hypot(p.vx,p.vy);
  if(sp<D.cap){if(d<D.hr*.9)return 'h';if(d<D.hr*2){p.vx+=(h.h[0]-p.x)/d*420*dt;p.vy+=(h.h[1]-p.y)/d*420*dt}}
  if(!inP(p,h.w[0])||h.w.some((o,i)=>i&&inP(p,o)))return 'o';
  return hv;
}
function sink(p){
  const h=H[hole];p.done=p.sunk=true;p.vx=p.vy=0;p.x=h.h[0];p.y=h.h[1];fx(p.x,p.y,p.c,30);fx(p.x,p.y,'#00f5d4',16);
  [523,659,784].forEach((f,i)=>setTimeout(()=>snd(f,.15,'triangle'),i*90));navigator.vibrate&&navigator.vibrate(40);
  const d=p.st-h.par;toast(`<b>${p.n}</b><br>`+(p.st==1?'🎯 HOLE IN ONE!':d<0?'🔥 Birdie!':d==0?'✅ Par':'Bogey +'+d),1400);
}
function reset(p,r){
  p.x=p.lx;p.y=p.ly;p.vx=p.vy=0;p.st++;fx(p.x,p.y,'#ff2d6f',24);snd(90,.3,'sawtooth',.05);
  toast(r=='v'?'🕳️ Caiu no vácuo! +1 tacada':'⚠️ Fora da pista! +1 tacada',1300);
}
const H0=1/120;
function tick(){
  if(locked)return;const p=mode=='local'?P[cur]:P[me];if(!p||!(p.vx||p.vy))return;
  const r=step(p,H0,ht);
  if(r=='h')sink(p);else if(r=='v'||r=='o')reset(p,r);
  else if(r>170){fx(p.x,p.y,p.c,Math.min(r/70|0,10));snd(200+Math.min(r,500)/2,.05,'triangle')}
}
function update(dt){
  acc+=Math.min(dt,.05);while(acc>=H0){acc-=H0;ht+=H0;tick()}
  const k=Math.min(1,dt*14);
  P.forEach((q,i)=>{
    if(mode!='local'&&i!=me&&q.tx!=null){q.x+=(q.tx-q.x)*k;q.y+=(q.ty-q.y)*k}
    const l=q.tr[q.tr.length-1];if(!l||Math.hypot(q.x-l[0],q.y-l[1])>2.5)q.tr.push([q.x,q.y]);else if(q.tr.length)q.tr.shift();if(q.tr.length>14)q.tr.shift();
  });
  PT.forEach(q=>{q.x+=q.vx*dt;q.y+=q.vy*dt;q.vx*=.94;q.vy*=.94;q.l-=dt*1.8});PT=PT.filter(q=>q.l>0);
  if(locked)return;
  if(mode=='local'){
    const p=P[cur];me=cur;
    if(!p.vx&&!p.vy&&p.moved){
      p.moved=false;if(p.st>=D.max&&!p.sunk)p.done=true;
      if(P.every(q=>q.done))return endHole(P.map(score));
      do{cur=(cur+1)%P.length}while(P[cur].done);
      toast('Vez de '+P[cur].n,1200);
    }
    return;
  }
  const p=P[me],stopped=!p.vx&&!p.vy;
  if(p.moved&&stopped){p.moved=false;if(p.st>=D.max&&!p.sunk)p.done=true;sendMe()}
  else if(!stopped&&(sendT+=dt)>.05){sendT=0;sendMe()}
  if(mode=='host'){
    const nd=P.filter(q=>q.done).length;
    if(nd&&!endT&&nd<P.length)endT=performance.now()+20000;
    if(endT&&performance.now()>endT)P.forEach(q=>{if(!q.done)q.done=true});
    if(P.every(q=>q.done)&&!P.some(q=>q.vx||q.vy)){const sc=P.map(score);bc({t:'e',sc});endHole(sc)}
  }
}
function endHole(sc){
  if(locked)return;locked=true;
  P.forEach((p,i)=>{p.total+=sc[i];p.h.push(sc[i])});
  const best=Math.min(...sc);
  toast(`Buraco ${hole+1} concluído!<br>`+P.map((p,i)=>`${p.n}: ${sc[i]}`+(sc[i]==best?' 🏅':'')).join(' • '),3000);
  setTimeout(()=>{
    if(++hole>=H.length){
      const r=[...P].sort((a,b)=>a.total-b.total);
      $('#rank').innerHTML=r.map((p,i)=>`<li>${['🥇','🥈','🥉'][i]||(i+1)+'º'} ${p.n} — ${p.total} tacadas<small>${p.h.join(' · ')}</small></li>`).join('');
      show('fim');
    }else startHole();
  },3200);
}

/* ---------- ENTRADA: arraste em qualquer ponto da tela (estilingue) ---------- */
const pt=e=>{const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)*600/r.width,y:(e.clientY-r.top)*500/r.height}};
function canShoot(){const p=P[me];return p&&!locked&&!p.done&&!p.vx&&!p.vy&&!p.moved}
cv.onpointerdown=e=>{if(!canShoot())return;an=drag=pt(e);cv.setPointerCapture(e.pointerId)};
cv.onpointermove=e=>{if(drag)drag=pt(e)};
cv.onpointercancel=()=>{drag=null};
cv.onpointerup=()=>{
  if(!drag)return;const p=P[me],dx=an.x-drag.x,dy=an.y-drag.y,l=Math.hypot(dx,dy);drag=null;
  if(l<14||!canShoot())return;const pw=Math.min(l,140)/140*900;
  p.lx=p.x;p.ly=p.y;p.vx=dx/l*pw;p.vy=dy/l*pw;p.st++;p.moved=true;snd(140+pw/6,.1,'square',.03);
};

/* ---------- DESENHO ---------- */
function path(poly){g.beginPath();poly.forEach((a,i)=>i?g.lineTo(...a):g.moveTo(...a));g.closePath()}
function circ(x,y,r){g.beginPath();g.arc(x,y,r,0,TAU)}
function draw(){
  const h=H[hole],t=performance.now()/1000;
  const bg=g.createLinearGradient(0,0,0,500);bg.addColorStop(0,'#0a0f26');bg.addColorStop(1,'#05070f');g.fillStyle=bg;g.fillRect(0,0,600,500);
  g.strokeStyle='#00f5d410';g.lineWidth=1;const o=(t*8)%30;
  for(let i=-30;i<=630;i+=30){g.beginPath();g.moveTo(i+o,0);g.lineTo(i+o,500);g.stroke();g.beginPath();g.moveTo(0,i+o);g.lineTo(600,i+o);g.stroke()}
  S.forEach(s=>{g.fillStyle=`rgba(0,245,212,${.25+.25*Math.sin(t*2+s[3])})`;g.fillRect(s[0],s[1],s[2],s[2])});
  // pista
  g.save();path(h.w[0]);g.clip();
  const fg=g.createRadialGradient(300,250,30,300,250,420);fg.addColorStop(0,'#0f5f56');fg.addColorStop(1,'#07282e');g.fillStyle=fg;g.fillRect(0,0,600,500);
  g.strokeStyle='#00f5d41c';for(let i=0;i<=600;i+=25){g.beginPath();g.moveTo(i,0);g.lineTo(i,500);g.stroke();g.beginPath();g.moveTo(0,i);g.lineTo(600,i);g.stroke()}
  path(h.w[0]);g.shadowColor='#00f5d4';g.shadowBlur=30;g.strokeStyle='#00f5d466';g.lineWidth=16;g.stroke();g.restore();
  // zonas
  Z.forEach(z=>{
    if(z.k=='s'){path(z.p);g.fillStyle='#7b2ff744';g.fill();g.save();g.clip();g.strokeStyle='#b388ff55';g.lineWidth=2;const d=(t*20)%14;
      for(let i=-500;i<600;i+=14){g.beginPath();g.moveTo(i+d,0);g.lineTo(i+d+500,500);g.stroke()}g.restore();
      path(z.p);g.setLineDash([5,5]);g.strokeStyle='#b388ff';g.lineWidth=1.5;g.stroke();g.setLineDash([])}
    else if(z.k=='v'){z.c=z.c||[(z.p[0][0]+z.p[2][0])/2,(z.p[0][1]+z.p[2][1])/2];path(z.p);g.fillStyle='#000';g.fill();g.save();g.clip();
      for(let i=0;i<3;i++){const r=(t*28+i*34)%100;g.strokeStyle=`rgba(255,45,111,${.5-r/200})`;g.lineWidth=2;circ(z.c[0],z.c[1],r);g.stroke()}g.restore();
      path(z.p);g.shadowColor='#ff2d6f';g.shadowBlur=14;g.strokeStyle='#ff2d6f';g.lineWidth=2;g.stroke();g.shadowBlur=0}
    else if(z.k=='u'){z.c=z.c||[(z.p[0][0]+z.p[2][0])/2,(z.p[0][1]+z.p[2][1])/2];path(z.p);g.fillStyle='#ff9f1c33';g.fill();g.save();g.clip();g.translate(z.c[0],z.c[1]);g.rotate(z.a);
      g.strokeStyle='#ffc857';g.lineWidth=3;for(let i=-3;i<=3;i++){const x=((i*30+t*70)%180)-90;g.beginPath();g.moveTo(x-8,-12);g.lineTo(x+4,0);g.lineTo(x-8,12);g.stroke()}g.restore();
      path(z.p);g.strokeStyle='#ff9f1c';g.lineWidth=1.5;g.stroke()}
    else if(z.k=='b'){const f=Math.max(0,1-(ht-(z.f||-9))*5);g.shadowColor='#ff2d6f';g.shadowBlur=14+f*20;
      const bgd=g.createRadialGradient(z.x,z.y,2,z.x,z.y,z.r);bgd.addColorStop(0,f>0?'#fff':'#ff8fb4');bgd.addColorStop(1,'#a0114c');g.fillStyle=bgd;circ(z.x,z.y,z.r+f*3);g.fill();
      g.strokeStyle='#fff';g.lineWidth=2;g.stroke();g.shadowBlur=0}
    else if(z.k=='m'){const m=mv(z,ht);g.shadowColor='#ff9f1c';g.shadowBlur=14;g.fillStyle='#2a1450';g.strokeStyle='#ff9f1c';g.lineWidth=3;g.beginPath();g.rect(m.x-z.w/2,m.y-z.h/2,z.w,z.h);g.fill();g.stroke();g.shadowBlur=0}
    else if(z.k=='r'){const a=ht*z.T*D.sp+(z.ph||0),dx=Math.cos(a)*z.L,dy=Math.sin(a)*z.L;g.lineCap='round';g.shadowColor='#ff9f1c';g.shadowBlur=14;g.strokeStyle='#ff9f1c';g.lineWidth=9;
      g.beginPath();g.moveTo(z.x-dx,z.y-dy);g.lineTo(z.x+dx,z.y+dy);g.stroke();g.strokeStyle='#fff';g.lineWidth=2;g.stroke();g.shadowBlur=0;g.lineCap='butt';g.fillStyle='#ff9f1c';circ(z.x,z.y,6);g.fill()}
  });
  // paredes
  g.lineJoin='round';
  h.w.forEach((poly,i)=>{
    if(i){path(poly);g.fillStyle='#1a0b3d';g.fill()}
    g.shadowColor=i?'#ff9f1c':'#00f5d4';g.shadowBlur=18;path(poly);g.strokeStyle=i?'#ff9f1c':'#00f5d4';g.lineWidth=6;g.stroke();
    g.shadowBlur=0;g.strokeStyle='#fff';g.lineWidth=1.5;g.stroke();
  });
  // buraco
  const k=h.h,hr=D.hr;
  for(let i=0;i<3;i++){const r=hr+((t*14+i*8)%24);g.strokeStyle=`rgba(179,136,255,${.5-(r-hr)/48})`;g.lineWidth=1.5;circ(k[0],k[1],r);g.stroke()}
  const hg=g.createRadialGradient(k[0],k[1],1,k[0],k[1],hr+4);hg.addColorStop(0,'#000');hg.addColorStop(.7,'#140530');hg.addColorStop(1,'#7b2ff7');
  g.shadowColor='#7b2ff7';g.shadowBlur=22;g.fillStyle=hg;circ(k[0],k[1],hr+3);g.fill();g.shadowBlur=0;
  g.strokeStyle='#fff';g.lineWidth=2;g.beginPath();g.moveTo(k[0],k[1]);g.lineTo(k[0],k[1]-55);g.stroke();
  g.fillStyle='#ff2d6f';g.shadowColor='#ff2d6f';g.shadowBlur=12;g.beginPath();g.moveTo(k[0],k[1]-55);g.lineTo(k[0]+26+Math.sin(t*4)*2,k[1]-45);g.lineTo(k[0],k[1]-35);g.fill();g.shadowBlur=0;
  // bolas
  P.forEach((p,i)=>{
    if(p.done&&p.sunk)return;
    if(p.tr.length>2){g.lineCap='round';for(let j=1;j<p.tr.length;j++){g.strokeStyle=p.c;g.globalAlpha=j/p.tr.length*.45;g.lineWidth=R*1.4*j/p.tr.length;g.beginPath();g.moveTo(...p.tr[j-1]);g.lineTo(...p.tr[j]);g.stroke()}g.lineCap='butt'}
    g.globalAlpha=1;g.fillStyle='#0008';g.beginPath();g.ellipse(p.x+3,p.y+4,R,R*.7,0,0,TAU);g.fill();
    g.globalAlpha=i==me?1:.8;g.shadowColor=p.c;g.shadowBlur=i==me?18:10;
    const gr=g.createRadialGradient(p.x-3,p.y-3,1,p.x,p.y,R);gr.addColorStop(0,'#fff');gr.addColorStop(.4,p.c);gr.addColorStop(1,p.c);
    g.fillStyle=gr;circ(p.x,p.y,R);g.fill();g.shadowBlur=0;
    if(i==me&&canShoot()){g.strokeStyle=p.c;g.lineWidth=1.5;circ(p.x,p.y,R+5+Math.sin(t*5)*2);g.stroke()}
    g.globalAlpha=1;g.fillStyle='#fff';g.font='bold 11px Rajdhani,sans-serif';g.textAlign='center';
    g.strokeStyle='#000b';g.lineWidth=3;g.strokeText(p.n,p.x,p.y-15);g.fillText(p.n,p.x,p.y-15);
  });
  PT.forEach(q=>{g.globalAlpha=Math.max(0,q.l);g.fillStyle=q.c;g.fillRect(q.x-1.5,q.y-1.5,3,3)});g.globalAlpha=1;
  // mira
  const p=P[me];
  if(drag&&p){
    const dx=an.x-drag.x,dy=an.y-drag.y,l=Math.hypot(dx,dy),pw=Math.min(l,140)/140;
    if(l<14){g.fillStyle='#fff9';g.font='bold 12px Rajdhani,sans-serif';g.textAlign='center';g.fillText('puxe para mirar',p.x,p.y+26)}
    else{
      const ux=dx/l,uy=dy/l,col=`hsl(${120-pw*120},95%,55%)`;
      g.shadowColor=col;g.shadowBlur=12;g.strokeStyle=col;g.lineWidth=5;g.lineCap='round';
      g.beginPath();g.moveTo(p.x,p.y);g.lineTo(p.x-ux*pw*70,p.y-uy*pw*70);g.stroke();g.lineCap='butt';
      g.strokeStyle='#fff';g.lineWidth=2.5;g.setLineDash([5,7]);g.beginPath();g.moveTo(p.x,p.y);
      if(D.aim==2){const b={x:p.x,y:p.y,vx:ux*pw*900,vy:uy*pw*900};for(let i=0;i<300;i++){const r=step(b,H0,ht+i*H0,1);if(r=='h'||r=='v'||r=='o'||(!b.vx&&!b.vy))break;if(i%4==0)g.lineTo(b.x,b.y)}}
      else if(D.aim==1)g.lineTo(p.x+ux*(40+pw*150),p.y+uy*(40+pw*150));
      g.stroke();g.setLineDash([]);g.shadowBlur=0;
      g.fillStyle=col;g.font='bold 13px Orbitron,sans-serif';g.textAlign='center';g.fillText(Math.round(pw*100)+'%',p.x,p.y-26);
    }
  }
}
function hud(){
  const p=P[me],h=H[hole];if(!p)return;
  const tm=mode=='host'&&endT&&!locked?' • ⏱'+Math.max(0,Math.ceil((endT-performance.now())/1000))+'s':'';
  $('#info').textContent=`⛳ ${hole+1}/${H.length} • PAR ${h.par} • ${D.n.toUpperCase()}`;
  $('#tempo').textContent=(mode=='local'?p.n+' • ':'')+`TACADAS ${p.st}/${D.max}`+tm;
  $('#placar').innerHTML=P.map((q,i)=>`<li><i style="background:${q.c};color:${q.c}"></i>${q.n}: ${q.total}${q.done?(q.sunk?' ✅':' ❌'):''}</li>`).join('');
}
function loop(ts){
  const dt=Math.min((ts-last)/1000,.05)||0;last=ts;
  if($('#game').classList.contains('on')&&P.length){update(dt);draw();if(++fr%10==0)hud()}
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
