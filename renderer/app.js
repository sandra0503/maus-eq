// ─────────────────────────────────────────────────────────────────────────
//  CONFIG
//  Each band has ONE value (0..127, centred at BASE). The DOWN and UP knobs
//  (placed side by side) both show and drive that value. Press and HOLD a knob
//  to ramp it; release to stop. Preset buttons jump to the extremes/centre.
//  Keyboard keys step by a fixed amount (KEY_STEP); the mouse hold-ramp step is
//  the live-adjustable one in the Settings bar.
// ─────────────────────────────────────────────────────────────────────────
// A band can be an EQ band (centre-detented) or a VOLUME band (starts full).
// Volume uses the standard MIDI Channel Volume CC (7).
const CHANNELS = [
  {
    name: 'CH 1',
    midi: 0, // MIDI channel 1
    bands: [
      { name: 'VOL', cc: 7, down: '1', up: '2', kind: 'vol' },
      { name: 'HIGH', cc: 16, down: 'q', up: 'w' },
      { name: 'MID', cc: 17, down: 'a', up: 's' },
      { name: 'LOW', cc: 18, down: 'y', up: 'x' },
    ],
  },
  {
    name: 'CH 2',
    midi: 1, // MIDI channel 2
    mirror: true, // lay this strip out as a mirror image of CH 1
    bands: [
      { name: 'VOL', cc: 7, down: '9', up: '0', kind: 'vol' },
      { name: 'HIGH', cc: 16, down: 'o', up: 'p' },
      { name: 'MID', cc: 17, down: 'k', up: 'l' },
      { name: 'LOW', cc: 18, down: 'n', up: 'm' },
    ],
  },
];

const BASE = 64;     // centre / reset value
const MIN_V = 0;
const MAX_V = 127;
const cfg = { step: 2 }; // live-configurable mouse hold-ramp step (Settings bar)
const KEY_STEP = 5;   // fixed step per keyboard press (independent of the slider)
const TICK_MS = 55;   // hold-ramp re-fire interval
const MAX_ANGLE = 135;
// halfway between MIN and centre
const MID_VALUE = Math.round((MIN_V + BASE) / 2);

const clamp = (v) => Math.max(MIN_V, Math.min(MAX_V, v));
const keyToStep = new Map(); // key char -> step function
let activeStop = null; // stops the knob currently held down (if any)

function makeBand(chanMidi, band) {
  const row = document.createElement('div');
  row.className = 'band';

  const label = document.createElement('div');
  label.className = 'band-label';
  label.textContent = band.name;

  const knobs = document.createElement('div');
  knobs.className = 'band-knobs';

  // Volume faders start at full; EQ bands start centred.
  const isVol = band.kind === 'vol';
  if (isVol) row.classList.add('vol');
  const start = isVol ? MAX_V : BASE;
  const state = { value: start, dials: [] };

  const send = () => window.synth && window.synth.sendCC(chanMidi, band.cc, state.value);
  const render = () => {
    const angle = ((state.value - BASE) / (MAX_V - BASE || 1)) * MAX_ANGLE;
    for (const d of state.dials) d.style.transform = `rotate(${angle}deg)`;
  };
  const flash = (el) => {
    el.classList.add('active');
    clearTimeout(el._offT);
    el._offT = setTimeout(() => el.classList.remove('active'), 120);
  };
  const step = (dir, knobEl, amount = cfg.step) => {
    const before = state.value;
    state.value = clamp(state.value + dir * amount);
    if (state.value !== before) { send(); render(); }
    if (knobEl) flash(knobEl);
  };
  const jump = (v, el) => {
    state.value = clamp(v);
    send(); render();
    if (el) flash(el);
  };

  const makeKnobCell = (dir) => {
    const key = dir === 'down' ? band.down : band.up;
    const sign = dir === 'down' ? -1 : 1;

    const cell = document.createElement('div');
    cell.className = `knob-cell ${dir}`;
    cell.innerHTML = `
      <div class="knob">
        <div class="knob-ring"></div>
        <div class="knob-body"><div class="knob-dial"><span class="knob-indicator"></span></div></div>
        <div class="knob-arrow">${dir === 'down' ? '▼' : '▲'}</div>
      </div>
      <div class="keycap">${key.toUpperCase()}</div>`;

    const knobEl = cell.querySelector('.knob');
    state.dials.push(cell.querySelector('.knob-dial'));

    // Press and HOLD a knob to ramp it in that direction; release to stop.
    let timer = null;
    const stopRamp = () => {
      clearInterval(timer); timer = null;
      if (activeStop === stopRamp) activeStop = null;
    };
    const startRamp = () => {
      if (timer) return;
      activeStop = stopRamp;
      step(sign, knobEl);
      timer = setInterval(() => step(sign, knobEl), TICK_MS);
    };
    cell.addEventListener('mousedown', (e) => { e.preventDefault(); startRamp(); });
    cell.addEventListener('mouseup', stopRamp);
    cell.addEventListener('mouseleave', stopRamp);

    // Keyboard steps by a fixed, larger amount (independent of the mouse slider).
    keyToStep.set(key, () => step(sign, knobEl, KEY_STEP));
    return cell;
  };

  // Preset buttons — mouse only, instant jumps — sit to the right of the knobs.
  const btns = document.createElement('div');
  btns.className = 'band-btns';
  const makeBtn = (cls, text, title, value) => {
    const b = document.createElement('button');
    b.className = `eq-btn ${cls}`;
    b.textContent = text;
    b.title = title;
    b.addEventListener('click', () => jump(value, b));
    return b;
  };
  // Volume: MAX / MIDDLE / MIN (starts full). EQ: RESET / MIDDLE / MIN.
  const presets = isVol
    ? [['max', 'MAX', 'Full up (127)', MAX_V],
       ['mid', 'MIDDLE', 'Half (64)', BASE],
       ['min', 'MIN', 'Silence (0)', MIN_V]]
    : [['rst', 'RESET', 'Centre (64)', BASE],
       ['mid', 'MIDDLE', `Half-down (${MID_VALUE})`, MID_VALUE],
       ['min', 'MIN', 'Full down (0)', MIN_V]];
  for (const [cls, text, title, value] of presets) {
    btns.appendChild(makeBtn(cls, text, title, value));
  }

  knobs.appendChild(makeKnobCell('down'));
  knobs.appendChild(makeKnobCell('up'));

  row.appendChild(label);
  row.appendChild(knobs);
  row.appendChild(btns);
  render();
  send(); // push initial value so rekordbox starts synced
  return row;
}

function build() {
  const root = document.getElementById('channels');
  for (const ch of CHANNELS) {
    const strip = document.createElement('section');
    strip.className = 'strip';
    if (ch.mirror) strip.classList.add('mirror');

    const label = document.createElement('div');
    label.className = 'strip-label';
    label.textContent = ch.name;
    strip.appendChild(label);

    for (const band of ch.bands) strip.appendChild(makeBand(ch.midi, band));
    root.appendChild(strip);
  }
}

// Keyboard: each mapped key steps its band (hold to auto-repeat). The buttons
// are intentionally mouse-only.
window.addEventListener('keydown', (e) => {
  const fn = keyToStep.get(e.key.toLowerCase());
  if (fn) { fn(); e.preventDefault(); }
});

// Releasing the mouse button anywhere stops a held knob.
window.addEventListener('mouseup', () => { if (activeStop) activeStop(); });

// ── Settings bar: step size (persisted across launches) ─────────────────────
function initSettings() {
  const stepRange = document.getElementById('stepRange');
  const stepVal = document.getElementById('stepVal');

  const setStep = (s) => {
    cfg.step = s;
    stepRange.value = s;
    stepVal.textContent = s;
    localStorage.setItem('maus-step', String(s));
  };

  stepRange.addEventListener('input', () => setStep(parseInt(stepRange.value, 10)));
  setStep(parseInt(localStorage.getItem('maus-step') || '2', 10));
}

build();
initSettings();
