import {useTime} from '@motion-canvas/core';

/** Doit rester aligné sur les clés de `SOUNDS` dans library.mjs (le script signale toute intention inconnue). */
export const SFX_INTENTS = [
  'appear', 'disappear', 'draw', 'travel', 'tick', 'land',
  'collapse', 'emphasis', 'activate', 'success', 'warning', 'failure', 'fill', 'swap', 'transition',
] as const;

export type SfxIntent = (typeof SFX_INTENTS)[number];

type SfxParams = Record<string, number | number[]>;
type SfxEvent = {time: number; kind: SfxIntent; volume: number; params?: SfxParams};

let recordedEvents: SfxEvent[] = [];

/** Repart de zéro : à appeler au début de chaque scène (le preview la rejoue à chaque seek). */
export function sfxReset() {
  recordedEvents = [];
}

/** Note un son à l'instant courant de l'animation (rien n'est joué : voir scripts/render-sfx.mjs). */
export function sfx(intent: SfxIntent, volume = 1, delay = 0, params?: SfxParams) {
  recordedEvents.push({time: useTime() + delay, kind: intent, volume, params});
}

/**
 * Jauge qui se remplit (from < to, hauteur qui monte) ou se vide (from > to) de 0 à 1 en `duration` secondes,
 * puis s'arrête sur une note plus longue. À lancer en parallèle de l'animation de la barre, avec la même durée.
 * Chaque barre d'un histogramme = un appel (décaler avec `delay`).
 *  - ease  : la fonction d'easing de l'animation (ex. `easeInOutCubic`) ; les notes suivent la barre, pas le temps
 *  - steps : nombre de notes sur 0 → 1 (3 à 21, défaut 11) ; plus il y en a, plus le grain est fin
 */
export function sfxFill(
  from: number,
  to: number,
  duration: number,
  {ease, steps, delay = 0, volume = 1}: {ease?: (value: number) => number; steps?: number; delay?: number; volume?: number} = {},
) {
  const curve = ease ? Array.from({length: 65}, (_, j) => ease(j / 64)) : [0, 1];
  sfx('fill', volume, delay, {from, to, duration, curve, ...(steps ? {steps} : {})});
}

/** Envoie les événements au dev server, qui écrit sfx/<sceneName>.json. */
export function sfxFlush(sceneName: string) {
  // ponytail: fire-and-forget, le dev server (vite.config.ts) est la seule destination
  fetch(`/__sfx/${sceneName}`, {method: 'POST', body: JSON.stringify(recordedEvents)}).catch(() => {});
}
