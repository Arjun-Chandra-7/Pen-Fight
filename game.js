const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const cv=$('#world'),cx=cv.getContext('2d');let ww=0,hh=0,dpr=1,battle=false,running=false,drag=null,turn='player',waitingShot=true,botFired=false,roundDone=false;
const PEN={
  sky:{name:'Skyline Gel',color:'#178ec8',mass:1,grip:.985,spin:.12,owned:true,protected:true},
  brick:{name:'Brickline 0.5',color:'#d35b40',mass:1.3,grip:.981,spin:.08,owned:true},
  mint:{name:'Mint Circuit',color:'#34a98d',mass:.8,grip:.989,spin:.18,owned:false},
  gold:{name:'Sunset Roller',color:'#d69a28',mass:1.55,grip:.978,spin:.06,owned:false},
  violet:{name:'Violet Note',color:'#8552c4',mass:.95,grip:.987,spin:.15,owned:false},
  graphite:{name:'Graphite Line',color:'#506071',mass:1.2,grip:.984,spin:.09,owned:false},
  madara:{name:'Madara Uchiha',color:'#c41e3a',mass:3.2,grip:.993,spin:.25,owned:false,isGod:true,protected:true}
};
let save=JSON.parse(localStorage.getItem('lastBenchSave')||'{"owned":["sky","brick"],"wins":0}');Object.keys(PEN).forEach(k=>PEN[k].owned=save.owned.includes(k));let selected=null,mode='bot',score={you:0,bot:0},me,enemy,soundOn=true;
function show(s){const el=$(s);if(el)el.classList.remove('hidden')}function hide(s){const el=$(s);if(el)el.classList.add('hidden')}function toast(t){const e=$('#toast');if(!e)return;e.textContent=t;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),2800)}
function persist(){save.owned=Object.entries(PEN).filter(([,p])=>p.owned).map(([k])=>k);localStorage.setItem('lastBenchSave',JSON.stringify(save))}
function resize(){dpr=devicePixelRatio||1;ww=innerWidth;hh=innerHeight;cv.width=ww*dpr;cv.height=hh*dpr;cv.style.width=ww+'px';cv.style.height=hh+'px';cx.setTransform(dpr,0,0,dpr,0,0);draw()}
function wood(x,y,w,h){let g=cx.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,'#7f401e');g.addColorStop(.5,'#bc7135');g.addColorStop(1,'#5f2e1b');cx.fillStyle=g;cx.fillRect(x,y,w,h);cx.strokeStyle='#3c1b12';cx.lineWidth=5;cx.strokeRect(x,y,w,h);cx.strokeStyle='#e1a65c33';cx.lineWidth=1;for(let i=0;i<10;i++){cx.beginPath();cx.moveTo(x+8,y+12+i*h/12);cx.bezierCurveTo(x+w*.3,y+4+i*h/11,x+w*.7,y+20+i*h/12,x+w-8,y+10+i*h/12);cx.stroke()}}
function desk(x,y,w,h){wood(x,y,w,h);cx.strokeStyle='#1c1815';cx.lineWidth=12;cx.beginPath();cx.moveTo(x+16,y+h);cx.lineTo(x+5,y+h+180);cx.moveTo(x+w-16,y+h);cx.lineTo(x+w+4,y+h+180);cx.stroke()}
function classroom(){cx.fillStyle='#596f4a';cx.fillRect(0,0,ww,hh*.43);cx.fillStyle='#d2c7ae';cx.fillRect(0,hh*.43,ww,hh*.57);cx.strokeStyle='#837d68';cx.lineWidth=2;for(let x=-20;x<ww;x+=60){cx.beginPath();cx.moveTo(x,hh*.43);cx.lineTo(x,hh);cx.stroke()}for(let y=hh*.43;y<hh;y+=56){cx.beginPath();cx.moveTo(0,y);cx.lineTo(ww,y);cx.stroke()}cx.fillStyle='#202c22';cx.fillRect(ww*.33,55,ww*.34,125);cx.strokeStyle='#7c542a';cx.lineWidth=10;cx.strokeRect(ww*.33,55,ww*.34,125);cx.fillStyle='#d6d6a6';cx.font='21px Kalam';cx.fillText('ROOM 7B',ww*.47,96);cx.font='14px Kalam';cx.fillText('lunch break league',ww*.44,128);desk(-80,135,ww*.29,68);desk(ww*.78,145,ww*.27,70);desk(-45,hh*.42,ww*.29,105);desk(ww*.80,hh*.40,ww*.27,96);desk(ww*.38,hh*.40,ww*.25,80);cx.fillStyle='#27324d';cx.beginPath();cx.roundRect(ww*.69,190,70,90,14);cx.fill();cx.fillStyle='#742e2f';cx.beginPath();cx.roundRect(ww*.70,hh*.48,70,90,14);cx.fill()}
function arena(){classroom();let x=ww*.23,y=hh*.22,w=ww*.54,h=hh*.63;cx.save();cx.shadowColor='#000a';cx.shadowBlur=28;cx.shadowOffsetY=20;wood(x,y,w,h);cx.restore();cx.fillStyle='#ffffff0d';for(let i=0;i<18;i++){cx.strokeStyle='#f7d49a22';cx.beginPath();cx.moveTo(x+20,y+30+i*26);cx.lineTo(x+w-18,y+20+i*26);cx.stroke()}cx.fillStyle='#42261c';cx.fillRect(x-5,y-5,w+10,8);cx.fillRect(x-5,y+h-3,w+10,8);cx.fillStyle='#e5b66e';cx.font='12px DM Mono';cx.save();cx.translate(x+w-20,y+h*.65);cx.rotate(-Math.PI/2);cx.fillText('LAST BENCH',0,0);cx.restore();return{x,y,w,h}}
function draw(){cx.clearRect(0,0,ww,hh);if(!battle){classroom();return}arena();if(me){drawTrail(me);drawTrail(enemy);drawPen(me);drawPen(enemy);if(drag){cx.save();cx.strokeStyle='#f9efd4';cx.setLineDash([7,7]);cx.lineWidth=2;cx.beginPath();cx.moveTo(me.x,me.y);cx.lineTo(drag.x,drag.y);cx.stroke();cx.restore()}}}
function makePen(id,x,y,a,label){return{id,x,y,a,label,vx:0,vy:0,av:0,alive:true,trail:[]}}
function drawTrail(p){
  const isGod = p.id==='madara';
  for(let i=0;i<p.trail.length;i++){
    let t=p.trail[i];
    if(isGod){
      cx.fillStyle=`rgba(230,57,70,${i/40})`;
      cx.beginPath();cx.arc(t[0],t[1],3+i*.38,0,7);cx.fill();
      cx.fillStyle=`rgba(114,9,183,${i/60})`;
      cx.beginPath();cx.arc(t[0],t[1],2+i*.22,0,7);cx.fill();
    } else {
      cx.fillStyle=`rgba(255,239,196,${i/100})`;
      cx.beginPath();cx.arc(t[0],t[1],2+i*.24,0,7);cx.fill();
    }
  }
}
function drawPen(p){
  if(!p.alive)return;
  let color=PEN[p.id]?.color||'#178ec8';
  cx.save();
  cx.translate(p.x,p.y);
  cx.rotate(p.a);
  if(p.id==='madara'){
    cx.shadowColor='#e63946';cx.shadowBlur=16;cx.shadowOffsetY=0;
    cx.strokeStyle='rgba(255,42,109,0.7)';cx.lineWidth=3;
    cx.beginPath();cx.roundRect(-66,-14,126,28,14);cx.stroke();
  } else {
    cx.shadowColor='#1a0d08aa';cx.shadowBlur=8;cx.shadowOffsetY=7;
  }
  let g=cx.createLinearGradient(-58,0,62,0);
  g.addColorStop(0,p.id==='madara'?'#110408':'#e7e8de');
  g.addColorStop(.12,color);
  g.addColorStop(.74,p.id==='madara'?'#7209b7':color);
  g.addColorStop(.76,'#1b2c4d');
  g.addColorStop(.86,'#d7e3e8');
  g.addColorStop(1,'#e2d7bd');
  cx.fillStyle=g;cx.beginPath();cx.roundRect(-60,-10,114,20,10);cx.fill();
  cx.shadowColor='transparent';cx.fillStyle='#fff9';cx.fillRect(-43,-6,33,3);
  cx.fillStyle=p.id==='madara'?'#ffccd5':'#132342';
  cx.font='bold 7px DM Mono';cx.fillText(p.label,-5,2);
  cx.fillStyle=p.id==='madara'?'#ffd700':'#dbe7e5';
  cx.beginPath();cx.moveTo(54,-8);cx.lineTo(70,0);cx.lineTo(54,8);cx.fill();
  cx.restore();
}
function board(){return{x:ww*.23,y:hh*.22,w:ww*.54,h:hh*.63}}
function settled(){return Math.hypot(me.vx,me.vy)<.08&&Math.hypot(enemy.vx,enemy.vy)<.08}
function impact(a,b){
  let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),min=100;
  if(d>=min||!d)return;
  let nx=dx/d,ny=dy/d,over=(min-d)/2;
  a.x-=nx*over;a.y-=ny*over;b.x+=nx*over;b.y+=ny*over;
  let rv=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
  if(rv>0)return;
  let ma=PEN[a.id].mass,mb=PEN[b.id].mass;
  let j=-1.03*rv/(1/ma+1/mb);
  a.vx-=j/ma*nx;a.vy-=j/ma*ny;b.vx+=j/mb*nx;b.vy+=j/mb*ny;
  a.av+=j*.005;b.av-=j*.005;tap(.04);
}
function tick(){
  if(!running)return;
  for(const p of[me,enemy]){
    if(!p.alive)continue;
    p.x+=p.vx;p.y+=p.vy;p.a+=p.av;p.av*=.975;
    p.vx*=PEN[p.id].grip;p.vy*=PEN[p.id].grip;
    p.trail.push([p.x,p.y]);
    if(p.trail.length>15)p.trail.shift();
    let b=board();
    if(p.x<b.x-33||p.x>b.x+b.w+33||p.y<b.y-33||p.y>b.y+b.h+33){
      p.alive=false;finish(p===me?'bot':'you');
    }
  }
  impact(me,enemy);draw();
  if(!roundDone&&turn==='player'&&!waitingShot&&settled()){
    turn='bot';botFired=false;setObjective('MIRA IS AIMING','Keep an eye on the edge.');setTimeout(botTurn,700);
  } else if(!roundDone&&turn==='bot'&&botFired&&settled()){
    turn='player';waitingShot=true;setObjective('YOUR TURN','Pull back from your pen, then release.');
  }
  requestAnimationFrame(tick);
}
function botTurn(){
  if(roundDone||turn!=='bot')return;
  let dx=me.x-enemy.x,dy=me.y-enemy.y,d=Math.hypot(dx,dy),power=8.5+Math.random()*3;
  enemy.vx=dx/d*power;enemy.vy=dy/d*power;enemy.av=(Math.random()-.5)*.14;botFired=true;tap(.03);
}
function setObjective(a,b){const el=$('#objective');if(el)el.innerHTML=`<b>${a}</b><span>${b}</span>`}
function finish(winner){
  if(roundDone)return;roundDone=true;running=false;score[winner]++;
  $('#youScore').textContent=score.you;$('#botScore').textContent=score.bot;
  setTimeout(()=>{if(score[winner]>=2)endMatch(winner);else beginRound()},850);
}
function beginRound(){
  let b=board();
  me=makePen(selected,b.x+b.w*.52,b.y+b.h*.77,-Math.PI/2,'YOU');
  enemy=makePen('mint',b.x+b.w*.49,b.y+b.h*.24,Math.PI/2,'MIRA');
  turn='player';waitingShot=true;botFired=false;roundDone=false;running=true;
  setObjective('YOUR TURN','Pull back from your pen, then release.');tick();
}
function endMatch(winner){
  battle=false;hide('#battleUI');show('#result');
  let win=winner==='you';
  const isDev=typeof window.isDeveloperAccount==='function'&&window.isDeveloperAccount();
  const isProtected=isDev||selected==='sky'||PEN[selected]?.isGod||PEN[selected]?.protected;
  if(win){
    PEN.mint.owned=true;save.wins=(save.wins||0)+1;persist();
    $('#resultEyebrow').textContent='DESK CLEARED';$('#resultTitle').innerHTML='YOU <em>WON.</em>';
    $('#resultCopy').textContent='Mira’s Mint Circuit is now in your case. Keep your streak alive.';
    $('#rewardCard').innerHTML='<div class="reward"><small>NEW PEN CLAIMED</small><b>Mint Circuit</b></div>';
  } else if(isProtected){
    persist();
    $('#resultEyebrow').textContent=isDev?'⚡ DEVELOPER PROTECTED':'PEN PROTECTED';
    $('#resultTitle').innerHTML='PEN <em>SAVED.</em>';
    $('#resultCopy').textContent=isDev?'Developer immunity active: all pens are protected.':'Your selected pen is protected and cannot be lost.';
    $('#rewardCard').innerHTML='<div class="reward"><small>PROTECTION ACTIVE</small><b>Pen preserved in case</b></div>';
  } else {
    PEN[selected].owned=false;persist();
    $('#resultEyebrow').textContent='OUT OF BOUNDS';$('#resultTitle').innerHTML='PEN <em>LOST.</em>';
    $('#resultCopy').textContent='Your selected pen went over the edge. Pick another and get back in the game.';
    $('#rewardCard').innerHTML='<div class="reward"><small>CASE STATUS</small><b>One pen removed</b></div>';
  }
  draw();
}
function renderCase(){
  let root=$('#caseGrid');if(!root)return;root.innerHTML='';
  for(const[id,p]of Object.entries(PEN)){
    let b=document.createElement('button');
    const isGod=p.isGod||id==='madara';
    b.className='pen-card '+(isGod?'god-tier ':'')+(!p.owned?'locked ':'')+(selected===id?'selected':'');
    b.innerHTML=`<div class="pen-preview" style="--c:${p.color}"></div><small>${p.owned?(isGod?'✦ GOD TIER • IN CASE':'IN CASE'):'WIN FROM RIVAL'}</small><b>${p.name}</b><div class="stats"><span>WT ${p.mass}</span><span>GRIP ${Math.round(p.grip*100)}</span></div>`;
    if(p.owned)b.onclick=()=>{selected=id;$('#selectedName').textContent=p.name;$('#startBtn').disabled=false;renderCase();tap(.02)};
    root.append(b);
  }
}
function start(){
  if(!selected)return;hide('#casePanel');hide('#modePanel');show('#battleUI');battle=true;
  score={you:0,bot:0};$('#youScore').textContent='0';$('#botScore').textContent='0';
  $('#playerName').textContent=PEN[selected].name.toUpperCase();resize();beginRound();
}
function pos(e){let r=cv.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
cv.addEventListener('pointerdown',e=>{
  if(!battle||turn!=='player'||!waitingShot||roundDone)return;
  let q=pos(e);if(Math.hypot(q.x-me.x,q.y-me.y)<100){drag=q;cv.setPointerCapture(e.pointerId)}
});
cv.addEventListener('pointermove',e=>{
  if(!drag)return;drag=pos(e);let power=Math.min(100,Math.hypot(me.x-drag.x,me.y-drag.y)/1.6);
  const meter=$('#aimMeter i');if(meter)meter.style.height=power+'%';draw();
});
cv.addEventListener('pointerup',e=>{
  if(!drag)return;let q=pos(e),dx=me.x-q.x,dy=me.y-q.y,m=Math.hypot(dx,dy);drag=null;
  const meter=$('#aimMeter i');if(meter)meter.style.height='0';
  if(m>10){
    let force=Math.min(14,m*.052)*(PEN[me.id]?.isGod?1.5:1);
    me.vx=dx/m*force;me.vy=dy/m*force;
    me.av=(dx*dy>0?1:-1)*PEN[me.id].spin;
    waitingShot=false;tap(.03);
  }
});
function tap(v){
  if(!soundOn)return;let A=window.AudioContext||window.webkitAudioContext;if(!A)return;
  let ac=new A(),o=ac.createOscillator(),g=ac.createGain();
  o.frequency.value=selected==='madara'?130:220;g.gain.value=v*(selected==='madara'?1.8:1);
  o.connect(g).connect(ac.destination);o.start();o.stop(ac.currentTime+.06);
}
$$('.mode-card').forEach(b=>b.onclick=()=>{$$('.mode-card').forEach(x=>x.classList.remove('selected'));b.classList.add('selected');mode=b.dataset.mode;toast(mode==='local'?'Pass & Play ready after selecting pens.':'Practice duel selected.')});
$('#continueBtn').onclick=()=>{hide('#modePanel');show('#casePanel');renderCase()};
$('#openCase').onclick=()=>{hide('#modePanel');show('#casePanel');renderCase()};
const closeBtn=$('[data-close]');if(closeBtn)closeBtn.onclick=()=>{hide('#casePanel');show('#modePanel')};
$('#startBtn').onclick=start;
$('#exitBattle').onclick=()=>{running=false;battle=false;hide('#battleUI');show('#modePanel');draw()};
$('#againBtn').onclick=()=>{hide('#result');show('#casePanel');renderCase()};
$('#lobbyBtn').onclick=()=>{hide('#result');show('#modePanel')};
$('#resetData').onclick=()=>{localStorage.removeItem('lastBenchSave');localStorage.removeItem('lastBenchUser');location.reload()};
$('#sound').onclick=()=>{soundOn=!soundOn;$('#sound').textContent=soundOn?'♬':'♩'};
window.addEventListener('resize',resize);
resize();
