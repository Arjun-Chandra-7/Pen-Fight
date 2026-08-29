/* Visual and input pass: loaded after the base game so local-file play stays simple. */
var arenaImage = new Image();
arenaImage.src = 'assets/classroom-arena.png';
var penArt = new Image();
penArt.src = 'assets/pen-skyline.png';

function coverImage() {
  if (!arenaImage.complete || !arenaImage.naturalWidth) return false;
  const sourceRatio = arenaImage.naturalWidth / arenaImage.naturalHeight;
  const targetRatio = ww / hh;
  let sx = 0, sy = 0, sw = arenaImage.naturalWidth, sh = arenaImage.naturalHeight;
  if (targetRatio > sourceRatio) { sh = sw / targetRatio; sy = (arenaImage.naturalHeight - sh) / 2; }
  else { sw = sh * targetRatio; sx = (arenaImage.naturalWidth - sw) / 2; }
  const zoom = 1.2; sx += sw * (1 - 1 / zoom) / 2; sy += sh * (1 - 1 / zoom) / 2; sw /= zoom; sh /= zoom;
  cx.drawImage(arenaImage, sx, sy, sw, sh, 0, 0, ww, hh);
  return true;
}

window.classroom = function () {
  if (!coverImage()) { cx.fillStyle = '#233428'; cx.fillRect(0, 0, ww, hh); }
  const shade = cx.createLinearGradient(0, 0, 0, hh);
  shade.addColorStop(0, 'rgba(8,16,14,.10)'); shade.addColorStop(1, 'rgba(12,9,5,.18)');
  cx.fillStyle = shade; cx.fillRect(0, 0, ww, hh);
};

window.board = function () { return { x: ww * .15, y: hh * .33, w: ww * .70, h: hh * .42 }; };

window.arena = function () {
  classroom(); const b = board();
  cx.save(); cx.strokeStyle = 'rgba(255,226,159,.55)'; cx.lineWidth = 2; cx.shadowColor = '#000'; cx.shadowBlur = 16;
  cx.strokeRect(b.x + 5, b.y + 5, b.w - 10, b.h - 10); cx.restore();
  return b;
};

window.impact = function (a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), min = 74;
  if (!d || d >= min) return;
  const nx = dx / d, ny = dy / d, push = (min - d) * .5;
  a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
  const closing = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
  if (closing > 0) return;
  const ma = PEN[a.id]?.mass || 1, mb = PEN[b.id]?.mass || 1;
  const aGod = PEN[a.id]?.isGod, bGod = PEN[b.id]?.isGod;
  const restitution = (aGod || bGod) ? -0.9 : -0.38;
  const j = restitution * closing / (1 / ma + 1 / mb);
  const aMul = aGod ? 0.35 : (bGod ? 2.2 : 1.0);
  const bMul = bGod ? 0.35 : (aGod ? 2.2 : 1.0);
  a.vx -= (j / ma * nx) * aMul; a.vy -= (j / ma * ny) * aMul;
  b.vx += (j / mb * nx) * bMul; b.vy += (j / mb * ny) * bMul;
  a.av += j * .003 * aMul; b.av -= j * .003 * bMul;
  tap(aGod || bGod ? .07 : .035);
};

Object.values(PEN).forEach(p => { if (!p.isGod) p.grip = Math.min(p.grip, .974); });

window.drawPen = function (p) {
  if (!p.alive) return;
  const isGod = p.id === 'madara' || PEN[p.id]?.isGod;
  cx.save(); cx.translate(p.x, p.y); cx.rotate(p.a + Math.PI);
  if (isGod) {
    cx.shadowColor = '#ff0055'; cx.shadowBlur = 18; cx.shadowOffsetY = 0;
  } else {
    cx.shadowColor = 'rgba(0,0,0,.68)'; cx.shadowBlur = 10; cx.shadowOffsetY = 7;
  }
  if (p.id === 'mint') cx.filter = 'hue-rotate(104deg) saturate(.72) brightness(.94)';
  else if (p.id === 'brick') cx.filter = 'hue-rotate(326deg) saturate(1.1)';
  else if (p.id === 'violet') cx.filter = 'hue-rotate(210deg) saturate(1.15)';
  else if (p.id === 'gold') cx.filter = 'hue-rotate(42deg) saturate(1.25)';
  else if (p.id === 'graphite') cx.filter = 'grayscale(1) brightness(.75)';
  else if (isGod) cx.filter = 'drop-shadow(0 0 10px #ff0055)';
  if (penArt.complete && penArt.naturalWidth) cx.drawImage(penArt, -72, -24, 144, 48);
  else { cx.fillStyle = PEN[p.id]?.color || '#c41e3a'; cx.fillRect(-58, -9, 116, 18); }
  cx.restore();
};

var contact = { axial: 0, lateral: 0 }, aimAnchor = null;
function pointOnPen(q, pen) {
  const ux = Math.cos(pen.a), uy = Math.sin(pen.a);
  const px = q.x - pen.x, py = q.y - pen.y;
  const axial = px * ux + py * uy, lateral = -px * uy + py * ux;
  return { axial, lateral };
}

cv.addEventListener('pointerdown', e => {
  if (!battle || turn !== 'player' || !waitingShot || roundDone) return;
  const q = pos(e), point = pointOnPen(q, me);
  if (point.axial < -72 || point.axial > 78 || Math.abs(point.lateral) > 31) return;
  e.stopImmediatePropagation();
  drag = q; contact = { axial: Math.max(-1, Math.min(1, point.axial / 67)), lateral: Math.max(-1, Math.min(1, point.lateral / 24)) };
  cv.setPointerCapture(e.pointerId);
}, true);

cv.addEventListener('pointermove', e => {
  if (!drag) return;
  e.stopImmediatePropagation(); drag = pos(e);
  const pull = Math.min(100, Math.hypot(me.x - drag.x, me.y - drag.y) / 2.4);
  const meter = $('#aimMeter i'); if (meter) meter.style.height = pull + '%'; draw();
}, true);

cv.addEventListener('pointerup', e => {
  if (!drag) return;
  e.stopImmediatePropagation(); const q = pos(e), dx = me.x - q.x, dy = me.y - q.y, distance = Math.hypot(dx, dy);
  drag = null; const meter = $('#aimMeter i'); if (meter) meter.style.height = '0';
  if (distance < 12) return;
  const isGod = PEN[me.id]?.isGod;
  const contactPower = 1 + contact.axial * .28;
  const force = Math.min(7.1, distance * .027) * contactPower * (isGod ? 1.5 : 1);
  const ux = dx / distance, uy = dy / distance;
  me.vx = ux * force; me.vy = uy * force;
  me.av = (-contact.lateral * .115 + contact.axial * .065) * force;
  waitingShot = false; tap(isGod ? .06 : .03);
}, true);

arenaImage.onload = () => resize();
penArt.onload = () => resize();

window.addEventListener('pointerdown', e => {
  if (e.target !== cv || !battle || turn !== 'player' || !waitingShot || roundDone) return;
  e.stopImmediatePropagation();
  const q = pos(e), point = pointOnPen(q, me);
  drag = q; aimAnchor = q;
  contact = { axial: point.axial / 67, lateral: point.lateral / 24 };
  cv.setPointerCapture(e.pointerId);
}, true);

window.addEventListener('pointermove', e => {
  if (e.target !== cv || !drag) return;
  e.stopImmediatePropagation(); drag = pos(e);
  const pull = Math.min(100, Math.hypot(me.x - drag.x, me.y - drag.y) / 2.8);
  const meter = $('#aimMeter i'); if (meter) meter.style.height = pull + '%'; draw();
}, true);

window.addEventListener('pointerup', e => {
  if (e.target !== cv || !drag) return;
  e.stopImmediatePropagation(); const q = pos(e), dx = me.x - q.x, dy = me.y - q.y, distance = Math.hypot(dx, dy);
  drag = null; aimAnchor = null; const meter = $('#aimMeter i'); if (meter) meter.style.height = '0'; if (distance < 12) return;
  const penStats = PEN[me.id] || { balance: 0, power: 1, spin: 1, mass: 1 };
  const axial = Math.max(-1.45, Math.min(1.45, contact.axial));
  const lateral = Math.max(-1.45, Math.min(1.45, contact.lateral));
  const contactPower = 1 + axial * (.18 + (penStats.balance || 0) * .08);
  const isGod = penStats.isGod;
  const force = Math.min(7.35, distance * .024) * contactPower * (penStats.power || 1);
  const fx = dx / distance * force, fy = dy / distance * force;
  me.vx = fx; me.vy = fy;
  const c = Math.cos(me.a), s = Math.sin(me.a);
  const rx = c * axial * 67 - s * lateral * 24;
  const ry = s * axial * 67 + c * lateral * 24;
  me.av = (rx * fy - ry * fx) / ((penStats.mass || 1) * 620) * (penStats.spin || 1);
  if (window.observeShot) window.observeShot({ angle: Math.atan2(fy, fx), power: force, axial, lateral });
  waitingShot = false; tap(isGod ? .06 : .03);
}, true);

window.draw = function () {
  cx.clearRect(0, 0, ww, hh);
  if (!battle) { classroom(); return; }
  arena(); if (!me) return;
  drawTrail(me); drawTrail(enemy); drawPen(me); drawPen(enemy);
  if (drag && aimAnchor) {
    cx.save(); cx.strokeStyle = '#fff5d9'; cx.shadowColor = '#4b260f'; cx.shadowBlur = 4;
    cx.setLineDash([7, 7]); cx.lineWidth = 2;
    cx.beginPath(); cx.moveTo(aimAnchor.x, aimAnchor.y); cx.lineTo(drag.x, drag.y); cx.stroke();
    cx.setLineDash([]); cx.fillStyle = '#ffdb9a'; cx.beginPath(); cx.arc(aimAnchor.x, aimAnchor.y, 4, 0, Math.PI * 2); cx.fill(); cx.restore();
  }
};

window.renderCase = function () {
  const root = $('#caseGrid'); if (!root) return; root.innerHTML = '';
  if (typeof window.isDeveloperAccount === 'function' && window.isDeveloperAccount()) {
    Object.values(PEN).forEach(p => { p.owned = true; p.protected = true; });
  }
  for (const [id, p] of Object.entries(PEN)) {
    const card = document.createElement('button');
    const isGod = p.isGod || id === 'madara';
    card.className = 'pen-card art-card ' + (isGod ? 'god-tier ' : '') + (!p.owned ? 'locked ' : '') + (selected === id ? 'selected' : '');
    const filter = id === 'mint' ? 'mint' : id === 'brick' ? 'brick' : id === 'gold' ? 'gold' : id === 'violet' ? 'violet' : id === 'graphite' ? 'graphite' : '';
    card.innerHTML = `<div class="case-pen-stage"><img class="case-pen ${filter}" src="${p.art || 'assets/pen-skyline.png'}" alt="${p.name}"></div><small>${p.owned ? (isGod ? '✦ GOD TIER • IN CASE' : 'IN CASE') : (isGod ? 'DEVELOPER ONLY' : 'WIN FROM RIVAL')}</small><b>${p.name}</b><div class="stats"><span>WT ${p.mass}</span><span>GRIP ${Math.round(p.grip * 100)}</span></div>`;
    if (p.owned) card.onclick = () => { selected = id; $('#selectedName').textContent = p.name; $('#startBtn').disabled = false; renderCase(); tap(isGod ? .06 : .02); };
    root.append(card);
  }
};

resize();
