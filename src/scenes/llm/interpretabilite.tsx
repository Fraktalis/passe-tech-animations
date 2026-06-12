/**
 * @file interpretabilite.tsx
 * @description Vidéo 1 LLM — Chapitre « L'entraînement », temps 5 : les poids encodent quelque chose.
 *
 * Show, don't tell :
 *   1. Une matrice de poids. Au départ : du BRUIT — les cellules grésillent au hasard
 *      pendant que le compteur d'itérations s'emballe (→ 4 milliards).
 *   2. À la fin, le grésillement s'arrête : la matrice se fige en une STRUCTURE
 *      organisée. Les poids ne sont plus aléatoires — ils encodent quelque chose.
 *   3. Zoom sur une région → « ? ». Personne ne sait ce qui est encodé :
 *      c'est l'interprétabilité, un problème ouvert.
 *   4. Mais « ça marche » → la sortie produit enfin une réponse correcte (vert).
 *
 * Couleur active = cyan (la structure). « ? » en ambre (l'inconnu), « ça marche » en vert.
 */

import {makeScene2D, Grid, Layout, Rect, Txt} from '@motion-canvas/2d';
import {
  all, sequence, waitFor, waitUntil, createRef, createSignal, linear, easeInOutCubic, easeOutCubic,
} from '@motion-canvas/core';
import {Callout} from '../../components';
import {PALETTE} from '../../theme';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  const MONO = 'JetBrains Mono, DM Mono, monospace';
  const SANS = 'Space Grotesk';

  // ── Matrice de poids ──────────────────────────────────────────────────────
  const COLS = 14;
  const ROWS = 8;
  const cellPitchX = () => vW() * 0.05;
  const cellPitchY = () => vH() * 0.078;
  const cellX = (c: number) => () => (c - (COLS - 1) / 2) * cellPitchX();
  const cellY = (r: number) => () => (r - (ROWS - 1) / 2) * cellPitchY();

  // interpolation hex nodeBg → cyan
  const toRGB = (hex: string): [number, number, number] => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const A = toRGB(PALETTE.nodeBg);
  const B = toRGB(PALETTE.cyan);
  const lerpHex = (t: number): string => {
    const ch = (i: number) => Math.round(A[i] + (B[i] - A[i]) * t).toString(16).padStart(2, '0');
    return `#${ch(0)}${ch(1)}${ch(2)}`;
  };
  const noiseColor = () => lerpHex(Math.random());

  // structure cible : deux « blobs » gaussiens → motif organisé
  const seeded = (k: number) => {
    const x = Math.sin(k * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };
  const structured: string[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const dx1 = (c - COLS * 0.32) / 4, dy1 = (r - ROWS * 0.4) / 3;
      const dx2 = (c - COLS * 0.72) / 4, dy2 = (r - ROWS * 0.65) / 3;
      const blob = Math.exp(-(dx1 * dx1 + dy1 * dy1)) + 0.8 * Math.exp(-(dx2 * dx2 + dy2 * dy2));
      structured.push(lerpHex(Math.min(1, blob)));
    }
  }
  const idxOf = (r: number, c: number) => r * COLS + c;

  // ── Refs ──────────────────────────────────────────────────────────────────
  const gridRef    = createRef<Grid>();
  const titleRef   = createRef<Txt>();
  const matrixGroup = createRef<Layout>();
  const cells = Array.from({length: ROWS * COLS}, () => createRef<Rect>());

  const counterRef = createRef<Txt>();
  const iterSignal = createSignal(1);

  const zoomBox   = createRef<Rect>();
  const questionMark = createRef<Txt>();
  const interpCallout = createRef<Callout>();
  const worksRef  = createRef<Txt>();

  // région de zoom : 3×3 cellules centrées
  const zr0 = 3, zc0 = 5; // coin haut-gauche de la région 3×3
  const zoomCells: number[] = [];
  for (let r = zr0; r < zr0 + 2; r++) for (let c = zc0; c < zc0 + 3; c++) zoomCells.push(idxOf(r, c));

  // ════════════════════════════════════════════════════════════════════════
  // SCENE TREE
  // ════════════════════════════════════════════════════════════════════════
  view.add(
    <Layout key="root" width={'100%'} height={'100%'}>
      <Rect key="bg" width={'100%'} height={'100%'} fill={PALETTE.bg} zIndex={-2} />
      <Grid key="grid" ref={gridRef}
        width={'100%'} height={'100%'}
        spacing={() => vW() * 0.05}
        stroke={PALETTE.ghost} lineWidth={1} opacity={0} zIndex={-1} />

      <Txt key="title" ref={titleRef}
        text="LES POIDS"
        fill={PALETTE.secondary}
        fontSize={() => vW() * 0.014}
        fontFamily={MONO} fontWeight={700}
        y={() => vH() * -0.43}
        opacity={0} />

      <Layout key="matrix" ref={matrixGroup} opacity={0} y={() => vH() * -0.03}>
        {Array.from({length: ROWS * COLS}, (_, k) => {
          const r = Math.floor(k / COLS), c = k % COLS;
          return (
            <Rect key={`cell-${k}`} ref={cells[k]}
              width={() => cellPitchX() * 0.86} height={() => cellPitchY() * 0.82}
              fill={noiseColor()} radius={() => vW() * 0.003}
              x={cellX(c)} y={cellY(r)} />
          );
        })}
      </Layout>

      {/* compteur d'itérations */}
      <Txt key="counter" ref={counterRef}
        text={() => `${Math.floor(iterSignal()).toLocaleString('fr-FR')} itérations`}
        fill={PALETTE.secondary}
        fontSize={() => vW() * 0.018} fontFamily={MONO} fontWeight={700}
        y={() => vH() * 0.40}
        opacity={0} />

      {/* boîte de zoom + « ? » */}
      <Rect key="zoom-box" ref={zoomBox}
        width={() => cellPitchX() * 3.1} height={() => cellPitchY() * 2.1}
        fill={'#00000000'} stroke={PALETTE.amber} lineWidth={3}
        radius={() => vW() * 0.005}
        x={() => cellX(zc0 + 1)()}
        y={() => cellY(zr0)() + cellPitchY() * 0.5 - vH() * 0.03}
        opacity={0} />
      <Txt key="qmark" ref={questionMark}
        text="?" fill={PALETTE.amber}
        fontSize={() => vW() * 0.06} fontFamily={SANS} fontWeight={700}
        x={() => cellX(zc0 + 1)()}
        y={() => cellY(zr0)() + cellPitchY() * 0.5 - vH() * 0.03}
        opacity={0} />

      <Callout key="interp-callout" ref={interpCallout}
        title="Interprétabilité"
        body="Expliquer concrétement ce que les poids encodent reste un problème ouvert"
        color={PALETTE.amber}
        width={() => vW() * 0.32} height={() => vH() * 0.13}
        x={() => vW() * 0.30} y={() => vH() * -0.28}
        opacity={0} />

      <Txt key="works" ref={worksRef}
        text="✓ mais ça marche"
        fill={PALETTE.vert}
        fontSize={() => vW() * 0.034} fontFamily={SANS} fontWeight={700}
        y={() => vH() * 0.40}
        opacity={0} />
    </Layout>,
  );

  // ════════════════════════════════════════════════════════════════════════
  // ANIMATIONS
  // ════════════════════════════════════════════════════════════════════════

  // grésillement : N rondes de couleurs aléatoires
  const flicker = function* (rounds: number, dur: number) {
    for (let k = 0; k < rounds; k++) {
      yield* all(...cells.map(c => c().fill(noiseColor(), dur)));
    }
  };

  yield* waitUntil('intro');
  yield* all(
    gridRef().opacity(0.1, 0.8),
    titleRef().opacity(1, 0.5),
    matrixGroup().opacity(1, 0.5),
  );

  // « On fait ça des milliards de fois » → le compteur s'emballe, ça grésille
  yield* waitUntil('billions');
  yield* counterRef().opacity(1, 0.3);
  yield* all(
    iterSignal(4_000_000_000, 2.0, linear),
    flicker(9, 0.2),
  );

  // « les poids ne sont plus du tout aléatoires » → la matrice se fige en structure
  yield* waitUntil('settle');
  yield* all(
    titleRef().text('LES POIDS · ENTRAÎNÉS', 0.4),
    ...cells.map((c, k) => c().fill(structured[k], 0.7, easeInOutCubic)),
  );

  // « ils encodent quelque chose » → ondulation cyan sur la structure
  yield* waitUntil('encode');
  yield* sequence(0.015,
    ...cells.map(c => c().scale(1.18, 0.18, easeOutCubic).to(1, 0.22)),
  );

  // « quoi exactement ? personne ne le sait » → zoom + « ? »
  yield* waitUntil('unknown');
  yield* all(
    ...cells.map((c, k) => zoomCells.includes(k) ? c().opacity(1, 0.3) : c().opacity(0.25, 0.4)),
    zoomBox().opacity(1, 0.4),
  );
  yield* all(
    ...zoomCells.map(k => cells[k]().fill(PALETTE.amber + '40', 0.3)),
    questionMark().opacity(1, 0.4),
  );
  yield* questionMark().scale(1.15, 0.2).to(1, 0.2);

  // « ce qu'on appelle l'interprétabilité »
  yield* waitUntil('interp');
  yield* interpCallout().opacity(1, 0.4);
  yield* interpCallout().hold();

  // « mais ce qu'on sait, c'est que ça marche »
  yield* waitUntil('works');
  yield* all(
    zoomBox().opacity(0, 0.4),
    questionMark().opacity(0, 0.4),
    interpCallout().opacity(0, 0.4),
    counterRef().opacity(0, 0.4),
    ...cells.map((c, k) => all(c().opacity(1, 0.4), c().fill(structured[k], 0.4))),
  );
  yield* worksRef().opacity(1, 0.5);
  yield* worksRef().scale(1.1, 0.2).to(1, 0.2);
  yield* waitFor(1.0);

  yield* waitUntil('end');
  yield* all(
    gridRef().opacity(0, 0.5),
    titleRef().opacity(0, 0.5),
    matrixGroup().opacity(0, 0.5),
    worksRef().opacity(0, 0.5),
  );
  yield* waitFor(0.3);
});
