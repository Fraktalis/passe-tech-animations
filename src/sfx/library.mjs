/**
 * Librairie de sound effects Passe-Tech (≥ 2026-10-29) — synthèse pure, sans échantillon.
 *
 * Caractère : doux mais « techno » — sinus et FM légère (timbre de petite cloche numérique),
 * aucune attaque sèche, aucun bruit large bande. Aucune musique de fond : ces sons sont seuls.
 *
 * Cohérence :
 *  - une seule gamme : pentatonique la mineur (= do majeur pentatonique), aucune note hors gamme ;
 *  - un seul bus : passe-bas + réverb de petite pièce, dosée par un « send » propre à chaque son ;
 *  - trois niveaux (LEVELS), réglés ici et jamais dans les scènes ;
 *  - variation de hauteur ±3 % avec graine fixe : le rendu est identique d'une exécution à l'autre.
 *
 * Les scènes appellent des INTENTIONS (`sfx('appear')`), pas des sons : changer un son ici
 * change toutes les scènes. Liste des intentions côté TypeScript : `src/sfx/index.ts`.
 */

export const SAMPLE_RATE = 48000;

const BUS = {
  masterGain: 0.2,
  cutoffHz: 2500,       // passe-bas à deux pôles : plus bas = plus feutré
  attackSeconds: 0.004, // rampe d'entrée de chaque son
  reverbWet: 0.6,       // part de la réverb dans le mix
  reverbTailSeconds: 1.2,
};

const LEVELS = {background: 0.45, main: 1, accent: 1.3};

// Gamme : la mineur pentatonique
const NOTES = {A3: 220, E4: 329.63, A4: 440, C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880};

// Marches de `fill` : la mineur pentatonique, la note la plus haute est toujours la5 (880 Hz) ;
// 11 marches = deux octaves (la3 → la5), davantage de marches descendent plus bas.
const DESCENDING_SEMITONES = [0, -2, -5, -7, -9]; // la, sol, mi, ré, do
const stepFrequency = (step, stepCount) => {
  const stepsBelowTop = stepCount - 1 - step;
  return NOTES.A5 * 2 ** ((Math.floor(stepsBelowTop / 5) * -12 + DESCENDING_SEMITONES[stepsBelowTop % 5]) / 12);
};

/** Instant (0 → 1) où la courbe d'easing échantillonnée atteint `target` ; première traversée. */
function timeWhenReaching(curve, target) {
  if (curve[0] >= target) return 0;
  for (let j = 1; j < curve.length; j++) {
    if (curve[j] >= target) {
      const previous = curve[j - 1];
      return (j - 1 + (target - previous) / (curve[j] - previous)) / (curve.length - 1);
    }
  }
  return 1;
}

// ── Briques de synthèse ──────────────────────────────────────────────────────

const rise = (t, seconds) => Math.min(t / seconds, 1);
const fall = (t, tau) => Math.exp(-t / tau);

/** Sinus avec glissando de départ (`glide` relatif) et FM légère qui s'éteint avec le son. */
function blip({frequency, glide = 0, glideTau = 0.03, tau, fmIndex = 0, fmRatio = 2, rampSeconds = 0.006}) {
  return t => {
    const phase = 2 * Math.PI * frequency * (t + glide * glideTau * (1 - fall(t, glideTau)));
    const modulation = fmIndex * fall(t, tau) * Math.sin(phase * fmRatio);
    return Math.sin(phase + modulation) * rise(t, rampSeconds) * fall(t, tau);
  };
}

/** Bruit passe-bas à un pôle ; `coefficient` ∈ ]0, 1[ (petit = grave). */
function softNoise(random) {
  let low = 0;
  return coefficient => (low += coefficient * ((random() * 2 - 1) - low));
}

const bell = (t, duration) => Math.sin(Math.PI * Math.min(t / duration, 1)) ** 3;

// ── Catalogue ────────────────────────────────────────────────────────────────
// make({random, detune}) est appelé une fois par événement → {duration, sample(t)}.
// level : background | main | accent ; send : part envoyée à la réverb (0 → 1).

export const SOUNDS = {
  // Vrai pop : sinus pur qui chute vite de ~660 à 330 Hz (mi), sans FM (la FM sonnait désaccordée),
  // avec un souffle très bref au départ pour la « bulle ».
  appear: {level: 'main', send: 0.3, make: ({random}) => {
    const noise = softNoise(random);
    const body = blip({frequency: NOTES.E4, glide: 1, glideTau: 0.022, tau: 0.045, rampSeconds: 0.003});
    return {duration: 0.3, sample: t => body(t) + noise(0.3) * fall(t, 0.004) * 0.12};
  }},

  disappear: {level: 'main', send: 0.2, make: ({detune}) => ({
    duration: 0.3,
    sample: blip({frequency: NOTES.A4 * detune, glide: -0.35, glideTau: 0.05, tau: 0.05, fmIndex: 0.6}),
  })},

  draw: {level: 'main', send: 0.1, make: ({random}) => {
    const noise = softNoise(random);
    const tone = blip({frequency: NOTES.A3, glide: -0.5, glideTau: 0.25, tau: 0.5, rampSeconds: 0.05});
    return {duration: 0.45, sample: t => {
      const progress = Math.min(t / 0.45, 1);
      return noise(0.01 + 0.07 * progress) * bell(t, 0.45) * 1.3 + tone(t) * 0.08;
    }};
  }},

  // Petit whoosh de passage : bruit feutré dont le ton monte puis redescend (le paquet passe), sans hauteur
  travel: {level: 'background', send: 0.08, make: ({random}) => {
    const noise = softNoise(random);
    return {duration: 0.4, sample: t => {
      const progress = Math.min(t / 0.4, 1);
      return noise(0.015 + 0.05 * Math.sin(Math.PI * progress)) * bell(t, 0.4) * 1.6;
    }};
  }},

  tick: {level: 'background', send: 0, make: ({random, detune}) => ({
    duration: 0.04,
    sample: t => (Math.sin(2 * Math.PI * 1500 * detune * t) * 0.8 + (random() * 2 - 1) * 0.15 * fall(t, 0.002))
      * rise(t, 0.001) * fall(t, 0.008),
  })},

  land: {level: 'main', send: 0.25, make: ({detune}) => ({
    duration: 0.3,
    sample: blip({frequency: 80 * detune, glide: 0.6, glideTau: 0.04, tau: 0.09, rampSeconds: 0.004}),
  })},

  collapse: {level: 'main', send: 0.4, make: ({random, detune}) => {
    const noise = softNoise(random);
    const thud = blip({frequency: 65 * detune, glide: 0.6, glideTau: 0.06, tau: 0.18, rampSeconds: 0.004});
    return {duration: 0.6, sample: t => thud(t) + noise(0.02) * fall(t, 0.12) * rise(t, 0.01) * 1.5};
  }},

  emphasis: {level: 'accent', send: 0.3, make: ({detune}) => ({
    duration: 0.35,
    sample: blip({frequency: NOTES.D5 * detune, glide: -0.15, tau: 0.12, fmIndex: 0.8, rampSeconds: 0.01}),
  })},

  activate: {level: 'main', send: 0.4, make: ({detune}) => {
    const first = blip({frequency: NOTES.A4 * detune, tau: 0.1, fmIndex: 0.8});
    const second = blip({frequency: NOTES.E5 * detune, tau: 0.14, fmIndex: 0.8});
    return {duration: 0.5, sample: t => first(t) * 0.8 + second(t - 0.06) * (t >= 0.06 ? 1 : 0)};
  }},

  success: {level: 'accent', send: 0.5, make: ({detune}) => {
    const notes = [NOTES.C5, NOTES.E5, NOTES.G5].map(frequency => blip({frequency: frequency * detune, tau: 0.18, fmIndex: 0.7}));
    return {duration: 0.8, sample: t => notes.reduce((sum, note, i) => sum + (t >= i * 0.09 ? note(t - i * 0.09) : 0), 0) / 2};
  }},

  // Dramatique « tin-tin-tiiiin » : deux frappes brèves sur ré, puis un la plus bas qui se tient ~2 s
  // avec un léger vibrato et une octave grave dessous. Dans la gamme, pas de dissonance.
  warning: {level: 'accent', send: 0.7, make: ({detune}) => {
    const stab = start => {
      const note = blip({frequency: NOTES.D5 * detune, tau: 0.1, rampSeconds: 0.008});
      const overtone = blip({frequency: NOTES.D5 * detune * 2, tau: 0.05, rampSeconds: 0.008});
      return t => (t >= start ? note(t - start) + overtone(t - start) * 0.25 : 0);
    };
    const firstStab = stab(0);
    const secondStab = stab(0.18);
    const heldStart = 0.4;
    const heldFrequency = NOTES.A4 * detune;
    const held = t => {
      if (t < 0) return 0;
      const vibrato = 0.006 * heldFrequency / 5.5 * Math.min(t / 0.5, 1) * Math.sin(2 * Math.PI * 5.5 * t);
      const phase = 2 * Math.PI * heldFrequency * t + vibrato;
      const body = Math.sin(phase) + 0.2 * Math.sin(phase * 2) + 0.5 * Math.sin(phase / 2);
      return body * rise(t, 0.015) * fall(t, 0.8);
    };
    return {duration: 2.4, sample: t => (firstStab(t) * 0.8 + secondStab(t) * 0.9 + held(t - heldStart) * 1.1) / 1.5};
  }},

  // Échec : deux bips secs sur le même mi grave (sinus + 3e harmonique pour un timbre « creux »), sans réverb
  failure: {level: 'accent', send: 0.05, make: ({detune}) => {
    const beep = t => {
      if (t < 0 || t > 0.07) return 0;
      const phase = 2 * Math.PI * NOTES.E4 * detune * t;
      return (Math.sin(phase) + 0.3 * Math.sin(phase * 3)) * Math.min(t / 0.003, 1) * Math.min((0.07 - t) / 0.008, 1);
    };
    return {duration: 0.25, sample: t => (beep(t) + beep(t - 0.115)) * 0.8};
  }},

  // Jauge qui se remplit ou se vide (barre de progression, histogramme) : une note par marche de la gamme,
  // de `from` à `to` (0 → 1, le sens se déduit), arrivée à `duration`, dernière note plus longue = « arrêt ».
  // params = {from = 0, to = 1, duration = 1.5, steps = 11, curve = [0, 1]}
  //  - steps : nombre de marches de la gamme sur 0 → 1 (3 à 21) ; plus il y en a, plus le grain est fin
  //  - curve : easing de la barre échantillonné sur [0, 1] ; chaque note tombe quand la barre franchit sa marche
  fill: {level: 'main', send: 0.3, make: ({detune, params}) => {
    const {from = 0, to = 1, duration = 1.5, curve = [0, 1]} = params ?? {};
    const stepCount = Math.min(Math.max(Math.round(params?.steps ?? 11), 3), 21);
    const toStep = value => Math.round(Math.min(Math.max(value, 0), 1) * (stepCount - 1));
    const first = toStep(from);
    const last = toStep(to);
    const direction = last >= first ? 1 : -1;
    const steps = [];
    for (let step = first; ; step += direction) {
      steps.push(step);
      if (step === last) break;
    }
    const notes = steps.map((step, i) => {
      const isLast = i === steps.length - 1;
      return {
        start: steps.length > 1 ? duration * timeWhenReaching(curve, i / (steps.length - 1)) : 0,
        voice: blip({frequency: stepFrequency(step, stepCount) * detune, tau: isLast ? 0.3 : 0.05, rampSeconds: 0.004}),
        gain: isLast ? 1.2 : 0.6,
      };
    });
    return {
      duration: duration + 0.9,
      sample: t => notes.reduce((sum, {start, voice, gain}) => (t >= start ? sum + voice(t - start) * gain : sum), 0),
    };
  }},

  swap: {level: 'background', send: 0.2, make: ({random, detune}) => {
    const noise = softNoise(random);
    return {duration: 0.25, sample: t => noise(0.03 + 0.04 * (t < 0.12 ? t / 0.12 : 1 - (t - 0.12) / 0.13)) * bell(t, 0.25) * 2.5
      + blip({frequency: NOTES.G5 * detune, tau: 0.04})(t) * 0.2};
  }},

  transition: {level: 'main', send: 0.7, make: ({random}) => {
    const noise = softNoise(random);
    return {duration: 1.2, sample: t => (noise(0.015) * 2 + Math.sin(2 * Math.PI * NOTES.A3 * t) * 0.5) * bell(t, 1.2)};
  }},
};

// ── Mixage ───────────────────────────────────────────────────────────────────

/** PRNG déterministe (mulberry32) : même événement → mêmes variations et même bruit. */
function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return (((value ^ (value >>> 14)) >>> 0) / 4294967296);
  };
}

/** Réverb de petite pièce : quatre filtres en peigne avec amortissement des aigus. */
function reverb(input) {
  const output = new Float32Array(input.length);
  for (const [delayMilliseconds, feedback] of [[29.7, 0.77], [37.1, 0.75], [41.1, 0.73], [43.7, 0.71]]) {
    const delay = Math.round(delayMilliseconds / 1000 * SAMPLE_RATE);
    const buffer = new Float32Array(delay);
    let position = 0;
    let damped = 0;
    for (let i = 0; i < input.length; i++) {
      const echo = buffer[position];
      damped += 0.35 * (echo - damped);
      buffer[position] = input[i] + damped * feedback;
      output[i] += echo * 0.25;
      position = (position + 1) % delay;
    }
  }
  return output;
}

/** events : [{time, kind, volume}] → Float32Array mono dans [-1, 1]. Les intentions inconnues sont ignorées et listées. */
export function renderMix(events) {
  const unknown = new Set();
  const lastEnd = Math.max(0, ...events.map(event => event.time + (SOUNDS[event.kind] ? 1.2 + (event.params?.duration ?? 0) : 0)));
  const length = Math.ceil((lastEnd + BUS.reverbTailSeconds) * SAMPLE_RATE);
  const dry = new Float32Array(length);
  const send = new Float32Array(length);

  events.forEach(({time, kind, volume, params}, eventIndex) => {
    const definition = SOUNDS[kind];
    if (!definition) { unknown.add(kind); return; }
    const random = seededRandom(eventIndex * 7919 + 1);
    const detune = 1 + (random() - 0.5) * 0.06;
    const sound = definition.make({random, detune, params});
    const start = Math.round(time * SAMPLE_RATE);
    const count = Math.round(sound.duration * SAMPLE_RATE);
    const gain = LEVELS[definition.level] * volume;
    for (let i = 0; i < count && start + i < length; i++) {
      const value = sound.sample(i / SAMPLE_RATE) * gain * rise(i / SAMPLE_RATE, BUS.attackSeconds);
      dry[start + i] += value;
      send[start + i] += value * definition.send;
    }
  });

  const wet = reverb(send);
  const smoothing = 1 - Math.exp(-2 * Math.PI * BUS.cutoffHz / SAMPLE_RATE);
  let firstPole = 0;
  let secondPole = 0;
  const mix = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    firstPole += smoothing * (dry[i] + wet[i] * BUS.reverbWet - firstPole);
    secondPole += smoothing * (firstPole - secondPole);
    mix[i] = Math.tanh(secondPole * BUS.masterGain); // limiteur doux
  }
  if (unknown.size) console.warn(`Intentions inconnues ignorées : ${[...unknown].join(', ')}`);
  return mix;
}
