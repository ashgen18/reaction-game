'use strict';

/* ═══════════════════════════════════════════
   THREE.JS SCENE
═══════════════════════════════════════════ */

const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || innerWidth < 768;

const canvas3d = document.getElementById('canvas3d');
const renderer = new THREE.WebGLRenderer({ canvas: canvas3d, antialias: !isMobile, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.5 : 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputEncoding   = THREE.sRGBEncoding;
renderer.toneMapping      = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0F172A);
scene.fog = new THREE.FogExp2(0x0F172A, 0.036);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 80);
camera.position.z = 7;

scene.add(new THREE.AmbientLight(0x1E293B, 2.2));
const sun = new THREE.DirectionalLight(0xffffff, 1.4);
sun.position.set(5, 6, 5);
scene.add(sun);

const accentA = new THREE.PointLight(0x3B82F6, 5, 20);
accentA.position.set(-4, 2, 4);
scene.add(accentA);

const accentB = new THREE.PointLight(0x3B82F6, 3, 14);
accentB.position.set(4, -3, 3);
scene.add(accentB);

const mainGeo = new THREE.TorusKnotGeometry(1.35, 0.42, isMobile ? 80 : 160, isMobile ? 12 : 18, 2, 3);
const mainMat = new THREE.MeshStandardMaterial({
  color: new THREE.Color(0x3B82F6), emissive: new THREE.Color(0x0d1f4a),
  emissiveIntensity: 0.7, metalness: 0.85, roughness: 0.12,
});
const mainMesh = new THREE.Mesh(mainGeo, mainMat);
scene.add(mainMesh);

const wireGeo = new THREE.TorusKnotGeometry(1.38, 0.43, isMobile ? 40 : 80, isMobile ? 8 : 12, 2, 3);
const wireMat = new THREE.MeshBasicMaterial({ color: 0x60A5FA, wireframe: true, transparent: true, opacity: 0.09 });
const wireMesh = new THREE.Mesh(wireGeo, wireMat);
scene.add(wireMesh);

const pCount = isMobile ? 120 : 380;
const pPos = new Float32Array(pCount * 3);
for (let i = 0; i < pCount; i++) {
  const r = 9 + Math.random() * 14;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  pPos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
  pPos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
  pPos[i*3+2] = r * Math.cos(phi);
}
const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0x94A3B8, size: 0.045, transparent: true, opacity: 0.42 })));

const PALETTE = {
  idle:        { color: 0x3B82F6, emissive: 0x0d1f4a, light: 0x3B82F6, li: 5 },
  waiting:     { color: 0xF59E0B, emissive: 0x4d2f00, light: 0xD97706, li: 6 },
  ready:       { color: 0x10B981, emissive: 0x043b28, light: 0x10B981, li: 9 },
  result:      { color: 0x3B82F6, emissive: 0x0d1f4a, light: 0x3B82F6, li: 5 },
  false_start: { color: 0xEF4444, emissive: 0x4a0808, light: 0xEF4444, li: 7 },
};

const tColor = new THREE.Color(0x3B82F6), tEmissive = new THREE.Color(0x0d1f4a);
const tLight = new THREE.Color(0x3B82F6), cLight    = new THREE.Color(0x3B82F6);
let tLightInt = 5;

function setPalette(key) {
  const p = PALETTE[key];
  tColor.setHex(p.color); tEmissive.setHex(p.emissive);
  tLight.setHex(p.light); tLightInt = p.li;
}

/* ═══════════════════════════════════════════
   GAME STATE MACHINE
═══════════════════════════════════════════ */

const S    = { IDLE: 0, WAITING: 1, READY: 2, RESULT: 3, FALSE: 4 };
const PKEY = ['idle', 'waiting', 'ready', 'result', 'false_start'];

let gState = S.IDLE, waitTimer = null, reactStart = null;
let session = { n: 0, times: [] };

const panelEls = {
  [S.IDLE]:    document.getElementById('p-idle'),
  [S.WAITING]: document.getElementById('p-waiting'),
  [S.READY]:   document.getElementById('p-ready'),
  [S.RESULT]:  document.getElementById('p-result'),
  [S.FALSE]:   document.getElementById('p-false'),
};

const gameZone    = document.getElementById('game-zone');
const card        = document.getElementById('card');
const instructions = document.getElementById('instructions');
const falseNotice  = document.getElementById('false-notice');
const btnAgain     = document.getElementById('btn-again');
const elMs  = document.getElementById('r-ms');
const elRate = document.getElementById('r-rating');
const elAtt  = document.getElementById('s-att');
const elBest = document.getElementById('s-best');
const elAvg  = document.getElementById('s-avg');

const CARD_STYLE = {
  idle:        { border: 'rgba(148,163,184,0.12)', glow: '' },
  waiting:     { border: 'rgba(245,158,11,0.4)',   glow: ', 0 0 50px rgba(245,158,11,0.09)' },
  ready:       { border: 'rgba(16,185,129,0.55)',  glow: ', 0 0 65px rgba(16,185,129,0.18)' },
  result:      { border: 'rgba(59,130,246,0.4)',   glow: ', 0 0 50px rgba(59,130,246,0.1)'  },
  false_start: { border: 'rgba(239,68,68,0.5)',    glow: ', 0 0 50px rgba(239,68,68,0.1)'   },
};

function showPanel(s) {
  Object.values(panelEls).forEach(p => p.classList.remove('active'));
  panelEls[s].classList.add('active');
}

function applyCardStyle(key) {
  const cs = CARD_STYLE[key];
  const base = '0 4px 6px rgba(0,0,0,0.15),0 20px 40px rgba(0,0,0,0.38)';
  card.style.borderColor = cs.border;
  card.style.boxShadow   = base + cs.glow;
}

function go(s) {
  gState = s;
  const key = PKEY[s];
  showPanel(s);
  setPalette(key);
  applyCardStyle(key);

  /* Instructions only visible in IDLE */
  instructions.classList.toggle('hidden', s !== S.IDLE);

  /* False notice only in FALSE state */
  falseNotice.classList.toggle('hidden', s !== S.FALSE);

  btnAgain.classList.toggle('hidden', s !== S.RESULT && s !== S.FALSE);

  /* Pointer cursor when zone accepts clicks */
  gameZone.classList.toggle('clickable', s === S.IDLE || s === S.WAITING || s === S.READY);
}

function beginGame() {
  clearTimeout(waitTimer);
  go(S.WAITING);
  const delay = 1000 + Math.random() * 4000;
  waitTimer = setTimeout(() => {
    go(S.READY);
    reactStart = performance.now();
  }, delay);
}

function onGameClick(e) {
  const now = performance.now(); /* Capture immediately */
  if (e.target && e.target.closest && e.target.closest('button')) return;

  if      (gState === S.IDLE)    { beginGame(); }
  else if (gState === S.WAITING) { clearTimeout(waitTimer); playFalse(); go(S.FALSE); }
  else if (gState === S.READY)   {
    const elapsed = now - reactStart;
    session.n++;
    session.times.push(elapsed);
    updateStats();
    renderResult(elapsed);
    playResult(elapsed);
    go(S.RESULT);
  }
}

function renderResult(ms) {
  elMs.textContent = Math.round(ms);
  let label, cls;
  if      (ms < 150) { label = 'Superhuman ⚡'; cls = 'r-elite'; }
  else if (ms < 200) { label = 'Amazing';        cls = 'r-elite'; }
  else if (ms < 250) { label = 'Very Good';      cls = 'r-excellent'; }
  else if (ms < 300) { label = 'Good';           cls = 'r-great'; }
  else if (ms < 400) { label = 'Average';        cls = 'r-average'; }
  else if (ms < 600) { label = 'Below Average';  cls = 'r-average'; }
  else               { label = 'Keep Practicing'; cls = 'r-slow'; }
  elRate.textContent = label;
  elRate.className   = 'rating-pill ' + cls;
}

function updateStats() {
  const { n, times } = session;
  elAtt.textContent = n;
  if (times.length) {
    elBest.textContent = Math.round(Math.min(...times)) + ' ms';
    elAvg.textContent  = Math.round(times.reduce((a,b) => a+b, 0) / times.length) + ' ms';
  }
}

function resetAll() {
  clearTimeout(waitTimer);
  session = { n: 0, times: [] };
  elAtt.textContent = '0'; elBest.textContent = '—'; elAvg.textContent = '—';
  go(S.IDLE);
}

/* Game clicks confined to the game zone */
gameZone.addEventListener('mousedown',  onGameClick);
gameZone.addEventListener('touchstart', onGameClick, { passive: true });

/* Keyboard */
document.addEventListener('keydown', e => {
  if (e.code !== 'Space' && e.code !== 'Enter') return;
  e.preventDefault();
  if      (gState === S.IDLE)                          beginGame();
  else if (gState === S.WAITING || gState === S.READY) onGameClick({ target: null });
  else if (gState === S.RESULT  || gState === S.FALSE) beginGame();
});

window.addEventListener('contextmenu', e => e.preventDefault());

/* Initialise UI state */
go(S.IDLE);

/* ═══════════════════════════════════════════
   WEB AUDIO
═══════════════════════════════════════════ */

let audioCtx = null;
function getAudio() {
  if (!audioCtx) try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(_) {}
  return audioCtx;
}

function tone(freq, dur, type, vol) {
  const ctx = getAudio(); if (!ctx) return;
  try {
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = type || 'sine'; osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol || 0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.start(); osc.stop(ctx.currentTime + dur);
  } catch(_) {}
}

function playFalse() {
  tone(110, 0.32, 'sawtooth', 0.16);
  setTimeout(() => tone(85, 0.22, 'sawtooth', 0.1), 110);
}

function playResult(ms) {
  const f = Math.min(1500, Math.max(280, 1900 - ms * 2.2));
  tone(f, 0.08, 'sine', 0.14);
  setTimeout(() => tone(f * 1.26, 0.16, 'sine', 0.1), 65);
}

/* ═══════════════════════════════════════════
   ANIMATION LOOP
═══════════════════════════════════════════ */

const clock = new THREE.Clock();
let smoothScale = 1;

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta(), t = clock.getElapsedTime();

  const rs = gState===S.WAITING?0.6 : gState===S.READY?2.8 : gState===S.FALSE?0.18 : gState===S.RESULT?0.32 : 0.42;
  mainMesh.rotation.x += dt * rs * 0.5;
  mainMesh.rotation.y += dt * rs * 0.72;
  wireMesh.rotation.x -= dt * rs * 0.36;
  wireMesh.rotation.y -= dt * rs * 0.5;

  const sTarget = gState===S.READY ? 1+Math.sin(t*12)*0.08 : gState===S.WAITING ? 1+Math.sin(t*3)*0.04 : gState===S.FALSE ? 1+Math.abs(Math.sin(t*22))*0.05 : 1;
  smoothScale += (sTarget - smoothScale) * 0.13;
  mainMesh.scale.setScalar(smoothScale);
  wireMesh.scale.setScalar(smoothScale * 1.013);

  const L = 0.055;
  mainMat.color.lerp(tColor, L);
  mainMat.emissive.lerp(tEmissive, L);
  cLight.lerp(tLight, L);
  accentA.color.copy(cLight); accentB.color.copy(cLight);
  accentA.intensity += (tLightInt       - accentA.intensity) * 0.07;
  accentB.intensity += (tLightInt * 0.6 - accentB.intensity) * 0.07;
  wireMat.color.lerp(tColor, L * 0.65);

  camera.position.x = Math.sin(t * 0.17) * 0.35;
  camera.position.y = Math.cos(t * 0.11) * 0.22;
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
});

animate();
