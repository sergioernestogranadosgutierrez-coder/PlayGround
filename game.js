import * as THREE from 'three';

// ============ TODO-BOT 3D — bot que hace TODO ============
const $ = id => document.getElementById(id);
const canvas = $('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0e1a);
scene.fog = new THREE.Fog(0x0a0e1a, 30, 90);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 200);
scene.add(new THREE.HemisphereLight(0x8ecbff, 0x1a1033, 0.9));
const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(14, 24, 10); sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);
const botGlow = new THREE.PointLight(0x4ade80, 0, 18); scene.add(botGlow);

// Arena
const ARENA = 20;
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(ARENA * 2 + 4, ARENA * 2 + 4),
  new THREE.MeshStandardMaterial({ color: 0x111a33, roughness: 0.9 })
);
ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
scene.add(new THREE.GridHelper(ARENA * 2 + 4, 22, 0x22d3ee, 0x223355));
const wallMat = new THREE.MeshStandardMaterial({ color: 0x22d3ee, emissive: 0x0e7490, emissiveIntensity: 1 });
for (const [w, h, x, z] of [[44, 1, 0, -22], [44, 1, 0, 22], [1, 44, -22, 0], [1, 44, 22, 0]]) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, 1.2, h), wallMat);
  m.position.set(x, 0.6, z); scene.add(m);
}
// decoración
for (let i = 0; i < 24; i++) {
  const p = new THREE.Mesh(new THREE.BoxGeometry(1, 2 + Math.random() * 5, 1),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, emissive: 0x312e81, emissiveIntensity: .6 }));
  const a = Math.random() * Math.PI * 2, r = 28 + Math.random() * 14;
  p.position.set(Math.cos(a) * r, 1, Math.sin(a) * r); scene.add(p);
}

// ---- Jugador (robot) ----
function makeRobot(bodyColor, eyeColor) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.9, 1.1),
    new THREE.MeshStandardMaterial({ color: bodyColor, roughness: .4, metalness: .3 }));
  body.position.y = 0.75; body.castShadow = true; g.add(body);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.7),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: .3 }));
  head.position.y = 1.45; head.castShadow = true; g.add(head);
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 12),
      new THREE.MeshStandardMaterial({ color: eyeColor, emissive: eyeColor, emissiveIntensity: 2 }));
    eye.position.set(0.18 * s, 1.45, 0.36); g.add(eye);
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.06, 8, 32),
    new THREE.MeshStandardMaterial({ color: eyeColor, emissive: eyeColor, emissiveIntensity: 1.4 }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.12; g.add(ring);
  scene.add(g); return g;
}
const player = makeRobot(0x22d3ee, 0x4ade80);

// ---- Orbes ----
const orbs = [];
const orbGeo = new THREE.SphereGeometry(0.45, 20, 20);
function spawnOrb() {
  const color = [0xfde047, 0x22d3ee, 0xf0abfc][Math.floor(Math.random() * 3)];
  const m = new THREE.Mesh(orbGeo, new THREE.MeshStandardMaterial({
    color, emissive: color, emissiveIntensity: 1.6, roughness: .2 }));
  m.position.set((Math.random() * 2 - 1) * (ARENA - 2), 0.9, (Math.random() * 2 - 1) * (ARENA - 2));
  m.castShadow = true; scene.add(m);
  orbs.push({ mesh: m, phase: Math.random() * 6 });
}
for (let i = 0; i < 12; i++) spawnOrb();

// ---- Cazadores ----
const hunters = [];
function spawnHunter(speed) {
  const g = new THREE.Group();
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.4, 6),
    new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x991b1b, emissiveIntensity: 1 }));
  cone.position.y = 1; cone.rotation.x = Math.PI; cone.castShadow = true; g.add(cone);
  const eye = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12),
    new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 3 }));
  eye.position.y = 0.8; g.add(eye);
  g.position.set((Math.random() * 2 - 1) * ARENA, 0, (Math.random() * 2 - 1) * ARENA);
  scene.add(g);
  hunters.push({ mesh: g, vel: new THREE.Vector3(), speed });
}
spawnHunter(4); spawnHunter(4);

// ---- Partículas ----
const parts = [];
function burst(pos, color, n = 14) {
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 6),
      new THREE.MeshBasicMaterial({ color }));
    m.position.copy(pos);
    scene.add(m);
    parts.push({ m, v: new THREE.Vector3((Math.random() - .5) * 10, Math.random() * 7, (Math.random() - .5) * 10), life: 0.7 });
  }
}

// ---- Línea de visión del bot ----
const botLineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
const botLine = new THREE.Line(botLineGeo, new THREE.LineBasicMaterial({ color: 0x4ade80, transparent: true, opacity: 0.9 }));
scene.add(botLine);

// ============ Estado ============
const S = {
  mode: 'menu', score: 0, best: +(localStorage.getItem('todobot_best') || 0),
  lives: 3, level: 1, combo: 1, comboT: 0, inv: 0,
  dashCD: 0, dashT: 0, bot: true, state: 'BUSCANDO ORBE',
  vel: new THREE.Vector3(), joy: { x: 0, y: 0 }, keys: {},
  target: null, time: 0,
};
$('best').textContent = S.best;

// ============ Sonido (WebAudio, sin assets) ============
let AC = null;
function beep(f = 440, d = 0.08, type = 'square', v = 0.06) {
  try {
    AC ||= new (window.AudioContext || window.webkitAudioContext)();
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.value = f; g.gain.value = v;
    o.connect(g); g.connect(AC.destination); o.start();
    g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + d);
    o.stop(AC.currentTime + d);
  } catch { }
}

// ============ Entrada: teclado + joystick táctil ============
addEventListener('keydown', e => { S.keys[e.key.toLowerCase()] = true; if (e.key === ' ') dash(); });
addEventListener('keyup', e => { S.keys[e.key.toLowerCase()] = false; });
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

const joy = $('joystick'), stick = $('stick');
let joyId = null;
function joyMove(t) {
  const r = joy.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  let dx = (t.clientX - cx) / (r.width / 2), dy = (t.clientY - cy) / (r.height / 2);
  const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
  S.joy.x = dx; S.joy.y = dy;
  stick.style.transform = `translate(calc(-50% + ${dx * 34}px), calc(-50% + ${dy * 34}px))`;
}
joy.addEventListener('touchstart', e => { e.preventDefault(); joyId = e.changedTouches[0].identifier; joyMove(e.changedTouches[0]); }, { passive: false });
addEventListener('touchmove', e => {
  for (const t of e.changedTouches) if (t.identifier === joyId) { e.preventDefault(); joyMove(t); }
}, { passive: false });
addEventListener('touchend', e => {
  for (const t of e.changedTouches) if (t.identifier === joyId) {
    joyId = null; S.joy.x = S.joy.y = 0; stick.style.transform = 'translate(-50%,-50%)';
  }
});
$('btn-dash').addEventListener('touchstart', e => { e.preventDefault(); dash(); }, { passive: false });
$('btn-dash').addEventListener('click', dash);
$('btn-pause').addEventListener('click', () => pauseGame(true));

// ============ BOT 🤖 — hace TODO ============
function botThink(dt) {
  // Elige el orbe más rentable: cerca pero lejos de cazadores
  let bestO = null, bestS = -1e9;
  for (const o of orbs) {
    const p = o.mesh.position;
    const dPlayer = p.distanceTo(player.position);
    let danger = 0;
    for (const h of hunters) {
      const d = p.distanceTo(h.mesh.position);
      danger += 14 / (d + 1);
      // penaliza si el cazador está entre el jugador y el orbe
      const mid = player.position.clone().add(p).multiplyScalar(0.5);
      danger += 6 / (mid.distanceTo(h.mesh.position) + 1);
    }
    const s = 30 / (dPlayer + 1) - danger + Math.random() * 0.3;
    if (s > bestS) { bestS = s; bestO = o; }
  }
  S.target = bestO;

  // Vector de huida de cazadores cercanos
  const flee = new THREE.Vector3();
  let nearestD = 1e9, nearestH = null;
  for (const h of hunters) {
    const d = h.mesh.position.distanceTo(player.position);
    if (d < nearestD) { nearestD = d; nearestH = h; }
    if (d < 9) {
      const away = player.position.clone().sub(h.mesh.position).setY(0).normalize().multiplyScalar((9 - d) * 1.6);
      flee.add(away);
    }
  }
  let move = new THREE.Vector3();
  if (bestO) move.add(bestO.mesh.position.clone().sub(player.position).setY(0).normalize().multiplyScalar(1.4));
  move.add(flee);

  if (nearestD < 4.5) {
    S.state = '⚠️ HUYENDO';
    if (S.dashCD <= 0 && move.length() > 0.1) dash(); // el bot usa el dash solo
  } else if (flee.length() > 1.5) S.state = '🌀 ESQUIVANDO';
  else S.state = '🎯 BUSCANDO ORBE';

  if (move.length() > 2.2) move.setLength(2.2);
  return move;
}

function dash() {
  if (S.mode !== 'play' || S.dashCD > 0) return;
  S.dashCD = 1.6; S.dashT = 0.22; beep(220, 0.15, 'sawtooth');
  burst(player.position.clone().setY(1), 0x22d3ee, 10);
}

function toast(msg) {
  const t = $('toast'); t.textContent = msg; t.classList.remove('hidden');
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.add('hidden'), 1800);
}

// ============ Flujo ============
function startGame(bot) {
  S.bot = bot; S.mode = 'play'; S.score = 0; S.lives = 3; S.level = 1;
  S.combo = 1; S.comboT = 0; S.inv = 0; S.vel.set(0, 0, 0);
  player.position.set(0, 0, 8);
  hunters.length && hunters.forEach(h => scene.remove(h.mesh)); hunters.length = 0;
  spawnHunter(4); spawnHunter(4);
  $('menu').classList.add('hidden'); $('gameover').classList.add('hidden'); $('pause-menu').classList.add('hidden');
  setBotUI(); updateHUD();
  toast(bot ? '🤖 El bot juega TODO por ti' : '🎮 ¡Juegas tú! El bot descansa');
  beep(660, 0.12);
}
function setBotUI() {
  const b = $('bot-toggle');
  b.textContent = S.bot ? '🤖 BOT: ON' : '🤖 BOT: OFF';
  b.classList.toggle('bot-on', S.bot); b.classList.toggle('bot-off', !S.bot);
  b.setAttribute('aria-pressed', S.bot);
  botLine.visible = S.bot; $('bot-vision-tag').style.display = S.bot ? 'block' : 'none';
  botGlow.intensity = S.bot ? 2 : 0;
}
$('bot-toggle').addEventListener('click', () => {
  S.bot = !S.bot; setBotUI();
  toast(S.bot ? '🤖 Bot activado: hace TODO' : '🎮 Bot desactivado: control manual');
  beep(S.bot ? 880 : 330, 0.1);
});
$('btn-play-bot').addEventListener('click', () => startGame(true));
$('btn-play-me').addEventListener('click', () => startGame(false));
$('btn-again').addEventListener('click', () => startGame(S.bot));
$('btn-menu2').addEventListener('click', () => { S.mode = 'menu'; $('gameover').classList.add('hidden'); $('menu').classList.remove('hidden'); });
$('btn-restart').addEventListener('click', () => startGame(S.bot));
$('btn-quit').addEventListener('click', () => { S.mode = 'menu'; $('pause-menu').classList.add('hidden'); $('menu').classList.remove('hidden'); });
$('btn-resume').addEventListener('click', () => pauseGame(false));
function pauseGame(on) {
  if (S.mode !== 'play' && on) return;
  S.mode = on ? 'pause' : 'play';
  $('pause-menu').classList.toggle('hidden', !on);
}
function updateHUD() {
  $('score').textContent = S.score; $('level').textContent = S.level;
  $('lives').textContent = '❤'.repeat(S.lives) + '🖤'.repeat(Math.max(0, 3 - S.lives));
  $('best').textContent = S.best;
  $('bot-state-text').textContent = S.bot ? S.state : 'MANUAL (tú juegas)';
}
function gameOver() {
  S.mode = 'over';
  S.best = Math.max(S.best, S.score);
  localStorage.setItem('todobot_best', S.best);
  $('final-score').textContent = `Puntos: ${S.score}`;
  $('final-best').textContent = `Récord: ${S.best}`;
  $('gameover').classList.remove('hidden');
  beep(160, 0.4, 'sawtooth');
  // El bot hace TODO: incluso reinicia solo
  if (S.bot) {
    $('auto-restart-note').classList.remove('hidden');
    let n = 3; $('auto-count').textContent = n;
    const iv = setInterval(() => {
      if (S.mode !== 'over') { clearInterval(iv); return; }
      if (--n <= 0) { clearInterval(iv); $('auto-restart-note').classList.add('hidden'); startGame(true); }
      else $('auto-count').textContent = n;
    }, 1000);
  } else $('auto-restart-note').classList.add('hidden');
  updateHUD();
}

// ============ Bucle ============
const clock = new THREE.Clock();
const camPos = new THREE.Vector3(0, 14, 18);
function clampArena(v) {
  v.x = Math.max(-ARENA, Math.min(ARENA, v.x));
  v.z = Math.max(-ARENA, Math.min(ARENA, v.z));
}
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  S.time += dt;
  $('loading').style.display = 'none';

  // animación ambiente siempre
  for (const o of orbs) {
    o.mesh.position.y = 0.9 + Math.sin(S.time * 3 + o.phase) * 0.2;
    o.mesh.rotation.y += dt * 2;
  }
  for (const p of [...parts]) {
    p.life -= dt; p.m.position.addScaledVector(p.v, dt); p.v.y -= 12 * dt;
    if (p.life <= 0) { scene.remove(p.m); parts.splice(parts.indexOf(p), 1); }
  }
  player.children[3].rotation.z += dt * (S.bot ? 3 : 1);

  if (S.mode === 'play') {
    // --- entrada ---
    let move;
    if (S.bot) move = botThink(dt);
    else {
      move = new THREE.Vector3(S.joy.x, 0, S.joy.y);
      if (S.keys.w || S.keys.arrowup) move.z -= 1;
      if (S.keys.s || S.keys.arrowdown) move.z += 1;
      if (S.keys.a || S.keys.arrowleft) move.x -= 1;
      if (S.keys.d || S.keys.arrowright) move.x += 1;
      if (move.length() > 1) move.normalize();
      S.state = 'MANUAL';
    }
    // --- física jugador ---
    const SPEED = 11, DASH = 26;
    const acc = move.clone().multiplyScalar(S.dashT > 0 ? DASH : SPEED);
    S.vel.lerp(acc, 1 - Math.pow(0.001, dt));
    player.position.addScaledVector(S.vel, dt);
    clampArena(player.position);
    if (S.vel.length() > 0.5) player.rotation.y = Math.atan2(S.vel.x, S.vel.z);
    player.position.y = S.dashT > 0 ? 0.35 : 0;
    S.dashCD = Math.max(0, S.dashCD - dt); S.dashT = Math.max(0, S.dashT - dt);
    S.inv = Math.max(0, S.inv - dt);
    player.visible = S.inv <= 0 || Math.floor(S.time * 12) % 2 === 0;

    // --- orbes: recoger ---
    for (let i = orbs.length - 1; i >= 0; i--) {
      if (orbs[i].mesh.position.distanceTo(player.position) < 1.3) {
        const op = orbs[i].mesh.position.clone();
        scene.remove(orbs[i].mesh); orbs.splice(i, 1);
        const pts = 10 * S.combo;
        S.score += pts; S.combo = Math.min(5, S.combo + (S.comboT > 0 ? 1 : 0)); S.comboT = 4;
        if (S.combo >= 2) { const c = $('combo'); c.textContent = `¡COMBO x${S.combo}!`; c.classList.remove('hidden'); clearTimeout(c._h); c._h = setTimeout(() => c.classList.add('hidden'), 700); }
        burst(op, 0xfde047); beep(520 + S.combo * 120, 0.09);
        spawnOrb();
        if (S.score >= S.level * 100) {
          S.level++; spawnHunter(4 + S.level * 0.5);
          toast(`⬆ Nivel ${S.level} · +1 cazador`); beep(990, 0.2);
        }
        updateHUD();
      }
    }
    S.comboT = Math.max(0, S.comboT - dt); if (S.comboT <= 0) S.combo = 1;

    // --- cazadores: persiguen ---
    for (const h of hunters) {
      const want = player.position.clone().sub(h.mesh.position).setY(0).normalize().multiplyScalar(h.speed);
      h.vel.lerp(want, 1 - Math.pow(0.05, dt));
      // separación entre cazadores
      for (const o of hunters) if (o !== h) {
        const d = h.mesh.position.distanceTo(o.mesh.position);
        if (d < 3 && d > 0.01) h.vel.add(h.mesh.position.clone().sub(o.mesh.position).normalize().multiplyScalar(2));
      }
      h.mesh.position.addScaledVector(h.vel, dt);
      clampArena(h.mesh.position);
      h.mesh.rotation.y = Math.atan2(h.vel.x, h.vel.z);
      h.mesh.position.y = Math.sin(S.time * 4 + h.speed) * 0.15;
      if (h.mesh.position.distanceTo(player.position) < 1.4 && S.inv <= 0) {
        S.lives--; S.inv = 1.6; S.combo = 1;
        burst(player.position.clone().setY(1), 0xef4444, 20);
        beep(140, 0.3, 'sawtooth'); updateHUD();
        if (S.lives <= 0) gameOver();
        else toast(S.bot ? `🤖 ¡Bot golpeado! Quedan ${S.lives}` : `¡Cuidado! Quedan ${S.lives} vidas`);
      }
    }

    // --- visual del bot ---
    if (S.bot && S.target) {
      const pts = botLine.geometry.attributes.position;
      pts.setXYZ(0, player.position.x, 1.2, player.position.z);
      pts.setXYZ(1, S.target.mesh.position.x, 1, S.target.mesh.position.z);
      pts.needsUpdate = true;
      const v = S.target.mesh.position.clone(); v.y += 2; v.project(camera);
      const tag = $('bot-vision-tag');
      tag.style.left = ((v.x * 0.5 + 0.5) * innerWidth) + 'px';
      tag.style.top = ((-v.y * 0.5 + 0.5) * innerHeight) + 'px';
      botGlow.position.copy(player.position).setY(2);
    }
    $('bot-state-text').textContent = S.bot ? S.state : 'MANUAL (tú juegas)';
  }

  // --- cámara seguidora suave ---
  const want = player.position.clone().add(new THREE.Vector3(0, 13, 15));
  camPos.lerp(want, 1 - Math.pow(0.01, dt));
  camera.position.copy(camPos); camera.lookAt(player.position.x, 0, player.position.z);
  renderer.render(scene, camera);
}
setBotUI(); updateHUD(); animate();
window.__todobot = S; // para tests
