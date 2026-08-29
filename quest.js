/* Quest league + oriented pen physics + God Pen & Auth integration */
const RIVALS = [
  {name:'Kavi', title:'BACKBENCH ROOKIE', pen:'brick', skill:.28, prize:'Brickline 0.5'},
  {name:'Nisha', title:'NOTEBOOK RACER', pen:'violet', skill:.40, prize:'Violet Note'},
  {name:'Omar', title:'HEAVY HAND', pen:'gold', skill:.53, prize:'Sunset Roller'},
  {name:'Mira', title:'SPIN SPECIALIST', pen:'mint', skill:.66, prize:'Mint Circuit'},
  {name:'Ash', title:'CLASS CAPTAIN', pen:'graphite', skill:.80, prize:'Graphite Line'}
];

Object.assign(PEN.sky, {name:'Cello Butterflow', price:'₹10', art:'assets/pen-cello-starter.png', power:.88, balance:-.18, spin:.62, grip:.972, owned:true, protected:true});
Object.assign(PEN.brick, {name:'Flair Writo-meter', price:'₹23', art:'assets/pen-skyline.png', power:1.12, balance:.31, spin:.40, grip:.968});
Object.assign(PEN.violet, {name:'Rorito Teramax', price:'₹41', art:'assets/pen-skyline.png', power:.96, balance:-.08, spin:1.18, grip:.973});
Object.assign(PEN.gold, {name:'Reynolds Trimax', price:'₹49', art:'assets/pen-trimax-roller.png', power:1.34, balance:.42, spin:.28, grip:.965});
Object.assign(PEN.mint, {name:'Pilot V5', price:'₹75', art:'assets/pen-skyline.png', power:.92, balance:-.26, spin:1.34, grip:.975});
Object.assign(PEN.graphite, {name:'Parker Vector', price:'₹265', art:'assets/pen-parker-premium.png', power:1.18, balance:.05, spin:.82, grip:.970});
Object.assign(PEN.madara, {name:'Madara Uchiha', price:'CHAKRA ∞', art:'assets/pen-madara.png', power:2.85, balance:.95, spin:2.4, grip:.993, mass:3.2, isGod:true, protected:true});

const penImages = {};
Object.entries(PEN).forEach(([id, p]) => {
  const image = new Image();
  image.src = p.art || 'assets/pen-skyline.png';
  penImages[id] = image;
  image.onload = () => resize();
});

save.quest = Math.min(save.quest || 0, RIVALS.length);
if (!save.owned.includes('sky')) save.owned.push('sky');
persist();

let leagueLoop = 0, botScheduled = false;
var practiceMode = false, marathonMode = false;
let adaptive = JSON.parse(localStorage.getItem('lastBenchAdaptive') || '{"shots":[],"rounds":0}');

window.observeShot = function (shot) {
  if (!marathonMode) return;
  adaptive.shots.push(shot);
  if (adaptive.shots.length > 80) adaptive.shots.shift();
  localStorage.setItem('lastBenchAdaptive', JSON.stringify(adaptive));
};

function rival() {
  return RIVALS[Math.min(save.quest, RIVALS.length - 1)];
}

function chalk() {
  cx.save();
  cx.fillStyle = 'rgba(236,238,204,.80)';
  cx.shadowColor = '#e7edd1';
  cx.shadowBlur = 2;
  cx.font = '17px Kalam';
  cx.textAlign = 'center';
  const r = rival();
  cx.fillText(`LEAGUE SCORE   YOU ${score.you}  —  ${score.bot} ${r.name.toUpperCase()}`, ww * .60, hh * .105);
  cx.font = '11px Kalam';
  cx.fillText(`Chapter ${Math.min(save.quest + 1, 5)} / 5  •  best of three`, ww * .60, hh * .132);
  cx.restore();
}

window.classroom = function () {
  if (!coverImage()) {
    cx.fillStyle = '#273528';
    cx.fillRect(0, 0, ww, hh);
  }
  const shade = cx.createLinearGradient(0, 0, 0, hh);
  shade.addColorStop(0, 'rgba(8,16,14,.08)');
  shade.addColorStop(1, 'rgba(12,9,5,.19)');
  cx.fillStyle = shade;
  cx.fillRect(0, 0, ww, hh);
  if (battle) chalk();
};

window.arena = function () {
  classroom();
  return board();
};

window.drawTrail = function (p) {
  const isGod = p.id === 'madara' || PEN[p.id]?.isGod;
  for (let i = 0; i < p.trail.length; i++) {
    let t = p.trail[i];
    if (isGod) {
      cx.save();
      cx.fillStyle = `rgba(230, 57, 70, ${i / 35})`;
      cx.shadowColor = '#ff0055';
      cx.shadowBlur = 8;
      cx.beginPath();
      cx.arc(t[0], t[1], 3.5 + i * .35, 0, Math.PI * 2);
      cx.fill();
      cx.fillStyle = `rgba(114, 9, 183, ${i / 50})`;
      cx.beginPath();
      cx.arc(t[0], t[1], 2 + i * .2, 0, Math.PI * 2);
      cx.fill();
      cx.restore();
    } else {
      cx.fillStyle = `rgba(255,239,196,${i / 100})`;
      cx.beginPath();
      cx.arc(t[0], t[1], 2 + i * .24, 0, Math.PI * 2);
      cx.fill();
    }
  }
};

window.drawPen = function (p) {
  if (!p.alive) return;
  const isGod = p.id === 'madara' || PEN[p.id]?.isGod;
  const art = penImages[p.id];
  cx.save();
  cx.translate(p.x, p.y);
  cx.rotate(p.a + Math.PI);
  
  if (isGod) {
    // Natural glowing aura without any box outline
    cx.shadowColor = '#ff0055';
    cx.shadowBlur = 14;
    cx.shadowOffsetY = 0;
  } else {
    cx.shadowColor = 'rgba(0,0,0,.68)';
    cx.shadowBlur = 10;
    cx.shadowOffsetY = 7;
  }
  
  if (art && art.complete) {
    cx.drawImage(art, -72, -24, 144, 48);
  } else {
    cx.fillStyle = PEN[p.id]?.color || '#178ec8';
    cx.fillRect(-60, -9, 120, 18);
  }
  
  cx.restore();
};

function endpoints(p) {
  const c = Math.cos(p.a), s = Math.sin(p.a), l = 67;
  return [
    { x: p.x - c * l, y: p.y - s * l },
    { x: p.x + c * l, y: p.y + s * l }
  ];
}

function closest(a, b, c, d) {
  const ux = b.x - a.x, uy = b.y - a.y, vx = d.x - c.x, vy = d.y - c.y, wx = a.x - c.x, wy = a.y - c.y;
  const A = ux * ux + uy * uy, B = ux * vx + uy * vy, C = vx * vx + vy * vy, D = ux * wx + uy * wy, E = vx * wx + vy * wy, den = A * C - B * B;
  let sc, tc;
  if (den < .0001) {
    sc = 0;
    tc = Math.max(0, Math.min(1, E / C));
  } else {
    sc = Math.max(0, Math.min(1, (B * E - C * D) / den));
    tc = Math.max(0, Math.min(1, (A * E - B * D) / den));
  }
  return [{ x: a.x + ux * sc, y: a.y + uy * sc }, { x: c.x + vx * tc, y: c.y + vy * tc }, sc, tc];
}

function penCollision(a, b) {
  const ea = endpoints(a), eb = endpoints(b), hit = closest(ea[0], ea[1], eb[0], eb[1]);
  const dx = hit[1].x - hit[0].x, dy = hit[1].y - hit[0].y, dist = Math.hypot(dx, dy), radius = 18;
  if (dist > radius) return;
  let nx = dist > .001 ? dx / dist : Math.cos(a.a + Math.PI / 2), ny = dist > .001 ? dy / dist : Math.sin(a.a + Math.PI / 2);
  let push = (radius - dist) * .5;
  a.x -= nx * push; b.x += nx * push;
  a.y -= ny * push; b.y += ny * push;
  const closing = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
  if (closing >= 0) return;
  
  const ma = PEN[a.id]?.mass || 1, mb = PEN[b.id]?.mass || 1;
  const aGod = PEN[a.id]?.isGod, bGod = PEN[b.id]?.isGod;
  let restitution = (aGod || bGod) ? -1.15 : -.48;
  const j = restitution * closing / (1 / ma + 1 / mb);

  const aMult = aGod ? 0.35 : (bGod ? 2.2 : 1.0);
  const bMult = bGod ? 0.35 : (aGod ? 2.2 : 1.0);

  a.vx -= (j / ma * nx) * aMult;
  a.vy -= (j / ma * ny) * aMult;
  b.vx += (j / mb * nx) * bMult;
  b.vy += (j / mb * ny) * bMult;
  
  a.av += j * (hit[2] - .5) * .018 * (PEN[a.id]?.spin || 1) * aMult;
  b.av -= j * (hit[3] - .5) * .018 * (PEN[b.id]?.spin || 1) * bMult;
  
  tap(aGod || bGod ? .08 : .035);
}

function ringOut(p) {
  const b = board(), r = 12;
  return p.x < b.x + r || p.x > b.x + b.w - r || p.y < b.y + r || p.y > b.y + b.h - r;
}

function settle() {
  return Math.hypot(me.vx, me.vy) < .045 && Math.hypot(enemy.vx, enemy.vy) < .045 && Math.abs(me.av) < .004 && Math.abs(enemy.av) < .004;
}

function move(p) {
  p.x += p.vx;
  p.y += p.vy;
  p.a += p.av;
  p.vx *= PEN[p.id]?.grip || 0.97;
  p.vy *= PEN[p.id]?.grip || 0.97;
  p.av *= .92;
  p.trail.push([p.x, p.y]);
  if (p.trail.length > 13) p.trail.shift();
}

function botShot() {
  if (roundDone || turn !== 'bot') return;
  const r = rival(), dx = me.x - enemy.x, dy = me.y - enemy.y, d = Math.hypot(dx, dy);
  let skill = r.skill, err, angle, force;
  if (marathonMode) {
    const shots = adaptive.shots;
    const learn = Math.min(.72, .12 + shots.length / 120 + adaptive.rounds / 180);
    const avgPower = shots.length ? shots.reduce((n, s) => n + s.power, 0) / shots.length : 4;
    const avgBias = shots.length ? shots.reduce((n, s) => n + s.lateral, 0) / shots.length : 0;
    skill = .24 + learn * .7;
    err = (Math.random() - .5) * (1 - skill) * 1.05;
    angle = Math.atan2(dy, dx) + err - avgBias * .07;
    force = Math.min(5.8, 2.2 + avgPower * .58 + learn * .9);
    setObjective('ADAPTIVE BOT', 'Pattern model ' + Math.round(learn * 100) + '% • ' + shots.length + ' shots read');
  } else {
    err = (Math.random() - .5) * (1 - skill) * 1.25;
    angle = Math.atan2(dy, dx) + err;
    force = (2.55 + skill * 2.65) * (0.78 + Math.random() * .18);
  }
  enemy.vx = Math.cos(angle) * force;
  enemy.vy = Math.sin(angle) * force;
  enemy.av = (Math.random() - .5) * skill * .34;
  botFired = true;
  botScheduled = false;
  tap(.025);
}

function leagueRound(winner) {
  if (roundDone) return;
  roundDone = true;
  score[winner]++;
  if (marathonMode) adaptive.rounds++;
  $('#youScore').textContent = score.you;
  $('#botScore').textContent = score.bot;
  const target = marathonMode ? 50 : 2;
  setObjective(winner === 'you' ? 'POINT TO YOU' : 'POINT TO ' + (marathonMode ? 'ADAPTIVE BOT' : rival().name.toUpperCase()), marathonMode ? `${score.you}–${score.bot} / first to 50` : (winner === 'you' ? 'One more round to take the pen.' : 'Reset. Read the contact point.'));
  setTimeout(() => {
    if (score[winner] >= target) leagueResult(winner);
    else startLeagueRound();
  }, marathonMode ? 420 : 900);
}

function leagueResult(winner) {
  running = false;
  battle = false;
  hide('#battleUI');
  show('#result');
  const r = rival(), won = winner === 'you';
  const isDev = typeof window.isDeveloperAccount === 'function' && window.isDeveloperAccount();
  const isProtected = isDev || selected === 'sky' || PEN[selected]?.isGod || PEN[selected]?.protected;

  if (marathonMode) {
    $('#resultEyebrow').textContent = 'MARATHON COMPLETE';
    $('#resultTitle').innerHTML = won ? '50 <em>WINS.</em>' : 'BOT <em>ADAPTED.</em>';
    $('#resultCopy').textContent = `Final score ${score.you}–${score.bot}. The bot learned from ${adaptive.shots.length} of your shots.`;
    $('#rewardCard').innerHTML = '<div class="reward"><small>MARATHON</small><b>No pens at stake</b></div>';
  } else if (practiceMode) {
    $('#resultEyebrow').textContent = 'PRACTICE COMPLETE';
    $('#resultTitle').innerHTML = won ? 'CLEAN <em>WIN.</em>' : 'KEEP <em>TRAINING.</em>';
    $('#resultCopy').textContent = 'No pens were at stake. Try different contact points and shot angles.';
    $('#rewardCard').innerHTML = '<div class="reward"><small>TRAINING RESULT</small><b>No case changes</b></div>';
  } else if (won) {
    PEN[r.pen].owned = true;
    save.quest = Math.min(save.quest + 1, RIVALS.length);
    persist();
    $('#resultEyebrow').textContent = 'RIVAL DEFEATED';
    $('#resultTitle').innerHTML = 'PEN <em>CLAIMED.</em>';
    $('#resultCopy').textContent = `${r.prize} is now in your case. The next chapter is waiting.`;
    $('#rewardCard').innerHTML = `<div class="reward"><small>NEW PEN</small><b>${r.prize}</b><span>Chapter ${Math.min(save.quest + 1, 5)} unlocked</span></div>`;
  } else if (isProtected) {
    persist();
    $('#resultEyebrow').textContent = isDev ? '⚡ DEVELOPER PROTECTION' : (PEN[selected]?.isGod ? 'SUSANOO IMMUNITY' : 'CELLO SAVED');
    $('#resultTitle').innerHTML = 'PEN <em>SAVED.</em>';
    $('#resultCopy').textContent = isDev
      ? 'Developer immunity active: all pens in your case are permanently protected.'
      : (PEN[selected]?.isGod ? 'Madara Uchiha stands undefeated across dimensions. Pen preserved.' : 'Starter pen is permanent and cannot be lost.');
    $('#rewardCard').innerHTML = '<div class="reward"><small>PROTECTION ACTIVE</small><b>Pen preserved in your case</b></div>';
  } else {
    PEN[selected].owned = false;
    persist();
    $('#resultEyebrow').textContent = 'MATCH LOST';
    $('#resultTitle').innerHTML = 'PEN <em>FORFEITED.</em>';
    $('#resultCopy').textContent = 'Your selected pen is out for now. Choose another and challenge the same rival again.';
    $('#rewardCard').innerHTML = '<div class="reward"><small>QUEST STATUS</small><b>Rival remains</b></div>';
  }
  draw();
}

function leagueTick() {
  if (!running || !battle) return;
  const speed = Math.max(Math.hypot(me.vx, me.vy), Math.hypot(enemy.vx, enemy.vy));
  const steps = Math.min(12, Math.max(1, Math.ceil(speed / 1.15)));
  for (let i = 0; i < steps && !roundDone; i++) {
    for (const p of [me, enemy]) {
      p.x += p.vx / steps;
      p.y += p.vy / steps;
      p.a += p.av / steps;
      const g = PEN[p.id]?.grip || 0.97;
      p.vx *= Math.pow(g, 1 / steps);
      p.vy *= Math.pow(g, 1 / steps);
      p.av *= Math.pow(.92, 1 / steps);
    }
    penCollision(me, enemy);
    if (ringOut(me)) leagueRound('bot');
    else if (ringOut(enemy)) leagueRound('you');
  }
  for (const p of [me, enemy]) {
    p.trail.push([p.x, p.y]);
    if (p.trail.length > 13) p.trail.shift();
  }
  draw();
  if (!roundDone && turn === 'player' && !waitingShot && settle()) {
    turn = 'bot';
    botFired = false;
    setObjective(`${rival().name.toUpperCase()} IS AIMING`, rival().title);
    if (!botScheduled) {
      botScheduled = true;
      setTimeout(botShot, 850);
    }
  } else if (!roundDone && turn === 'bot' && botFired && settle()) {
    turn = 'player';
    waitingShot = true;
    setObjective('YOUR TURN', 'Contact point controls drive and spin.');
  }
  leagueLoop = requestAnimationFrame(leagueTick);
}

function startLeagueRound() {
  const b = board(), r = rival();
  me = makePen(selected, b.x + b.w * .52, b.y + b.h * .75, 0, 'YOU');
  enemy = makePen(r.pen, b.x + b.w * .49, b.y + b.h * .25, Math.PI, r.name.toUpperCase());
  turn = 'player';
  waitingShot = true;
  botFired = false;
  botScheduled = false;
  roundDone = false;
  running = true;
  setObjective('YOUR TURN', 'Contact point controls drive and spin.');
  leagueTick();
}

function startLeague() {
  if (!selected) return;
  practiceMode = false;
  marathonMode = false;
  hide('#casePanel');
  hide('#modePanel');
  hide('#result');
  show('#battleUI');
  battle = true;
  score = { you: 0, bot: 0 };
  $('#youScore').textContent = '0';
  $('#botScore').textContent = '0';
  const r = rival();
  $('#playerName').textContent = PEN[selected].name.toUpperCase();
  $('#enemyName').textContent = r.name.toUpperCase();
  $('#enemyTag').textContent = r.title;
  resize();
  startLeagueRound();
}

window.renderCase = function () {
  const root = $('#caseGrid');
  if (!root) return;
  root.innerHTML = '';
  const r = rival();
  const subEl = $('.case-panel .sub');
  if (subEl) subEl.textContent = `Chapter ${Math.min(save.quest + 1, 5)} — defeat ${r.name} to claim ${r.prize}.`;
  
  if (typeof window.isDeveloperAccount === 'function' && window.isDeveloperAccount()) {
    Object.values(PEN).forEach(p => { p.owned = true; p.protected = true; });
  }

  for (const [id, p] of Object.entries(PEN)) {
    const card = document.createElement('button');
    const isGod = p.isGod || id === 'madara';
    card.className = 'pen-card art-card ' + (isGod ? 'god-tier ' : '') + (!p.owned ? 'locked ' : '') + (selected === id ? 'selected' : '');
    const badgeText = p.owned ? (isGod ? '✦ GOD TIER • IN CASE' : `${p.price || 'IN CASE'} • IN CASE`) : (isGod ? 'DEVELOPER EXCLUSIVE' : 'DEFEAT RIVAL TO CLAIM');
    card.innerHTML = `
      <div class="case-pen-stage">
        <img class="case-pen" src="${p.art || 'assets/pen-skyline.png'}" alt="${p.name}">
      </div>
      <small>${badgeText}</small>
      <b>${p.name}</b>
      <div class="stats">
        <span>POWER ${p.power}</span>
        <span>BAL ${p.balance}</span>
        <span>SPIN ${p.spin}</span>
      </div>
    `;
    if (p.owned) {
      card.onclick = () => {
        selected = id;
        $('#selectedName').textContent = p.name;
        $('#startBtn').disabled = false;
        renderCase();
        tap(isGod ? .06 : .02);
      };
    }
    root.append(card);
  }
};

$('#startBtn').onclick = startLeague;
const modeCards = $$('.mode-card');

function selectMode(next) {
  mode = next;
  modeCards.forEach(card => card.classList.toggle('selected', card.dataset.mode === next));
  const career = next === 'career', marathon = next === 'marathon';
  $('#continueBtn').innerHTML = career ? 'OPEN PEN CASE <span>→</span>' : marathon ? 'START MARATHON <span>∞</span>' : 'START PRACTICE <span>→</span>';
  $('#modeNote').textContent = career ? 'Career begins with Cello Butterflow. Win scheduled best-of-three matches to claim each rival’s pen.' : marathon ? 'First to 50 wins. The adaptive bot learns your shot angle, power, and contact bias as you play.' : 'Training has no risk. You receive the standard Cello Butterflow and your pencil case is untouched.';
}

modeCards.forEach(card => card.onclick = () => selectMode(card.dataset.mode));

$('#continueBtn').onclick = () => {
  if (mode === 'career') {
    practiceMode = false;
    hide('#modePanel');
    show('#casePanel');
    renderCase();
    return;
  }
  if (mode === 'marathon') {
    practiceMode = false;
    marathonMode = true;
    selected = 'sky';
    hide('#modePanel');
    hide('#casePanel');
    hide('#result');
    show('#battleUI');
    battle = true;
    score = { you: 0, bot: 0 };
    $('#youScore').textContent = '0';
    $('#botScore').textContent = '0';
    $('#playerName').textContent = 'CELLO BUTTERFLOW';
    $('#enemyName').textContent = 'ADAPTIVE BOT';
    $('#enemyTag').textContent = 'FIRST TO 50';
    resize();
    startLeagueRound();
    return;
  }
  practiceMode = true;
  marathonMode = false;
  selected = 'sky';
  hide('#modePanel');
  hide('#casePanel');
  hide('#result');
  show('#battleUI');
  battle = true;
  score = { you: 0, bot: 0 };
  $('#youScore').textContent = '0';
  $('#botScore').textContent = '0';
  $('#playerName').textContent = 'TRAINING CELLO';
  $('#enemyName').textContent = 'KAVI';
  $('#enemyTag').textContent = 'PRACTICE PARTNER';
  resize();
  startLeagueRound();
};

selectMode('practice');
