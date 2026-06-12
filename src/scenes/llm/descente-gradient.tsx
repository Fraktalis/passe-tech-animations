/**
 * @file descente-gradient.tsx
 * @description Vidéo 1 LLM — Chapitre « L'entraînement », temps 3 : la descente de gradient.
 *
 * Show, don't tell :
 *   1. Un paysage d'erreur (vallée). Une bille tombe haut sur la pente.
 *   2. « Le gradient, c'est juste la pente » → on dessine la TANGENTE sous la bille.
 *   3. « On cherche la direction qui fait descendre l'erreur » → la bille fait des
 *      pas, à chaque fois dans le sens inverse de la pente, et descend vers le creux.
 *   4. L'axe vertical EST l'erreur : à chaque pas, la valeur affichée baisse.
 *
 * Pas calculés par vraie descente : x ← x − η·f'(x), f(x)=0.85·(x−0.1)²+0.05, η=0.2.
 * Couleur active = vert (l'erreur qui baisse), pente/erreur de départ en rose.
 */

import {makeScene2D, Circle, Grid, Layout, Line, Rect, Txt} from '@motion-canvas/2d';
import {
  all, waitFor, waitUntil, createRef, createSignal, easeInOutCubic, easeOutCubic,
} from '@motion-canvas/core';
import {Callout} from '../../components';
import {PALETTE} from '../../theme';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  const MONO = 'JetBrains Mono, DM Mono, monospace';
  const SANS = 'Space Grotesk';

  // ── Paysage d'erreur ──────────────────────────────────────────────────────
  const f  = (x: number) => 0.85 * Math.pow(x - 0.1, 2) + 0.05;
  const fp = (x: number) => 1.7 * (x - 0.1);
  const sx = (x: number) => vW() * 0.42 * x;
  const sy = (x: number) => vH() * 0.30 - f(x) * vH() * 0.52;

  // trajectoire de la descente (5 pas)
  const STEPS = [-0.8, -0.494, -0.292, -0.159, -0.071, -0.013];
  const ballX = createSignal(STEPS[0]);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const gridRef   = createRef<Grid>();
  const titleRef  = createRef<Txt>();
  const curveRef  = createRef<Line>();
  const axisY     = createRef<Line>();
  const axisLabel = createRef<Txt>();
  const minLine   = createRef<Line>();
  const ball      = createRef<Circle>();
  const tangent   = createRef<Line>();
  const errLine   = createRef<Line>();
  const errLabel  = createRef<Txt>();
  const slopeTag  = createRef<Txt>();
  const errCallout = createRef<Callout>();

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
        text="DESCENTE DE GRADIENT"
        fill={PALETTE.secondary}
        fontSize={() => vW() * 0.014}
        fontFamily={MONO} fontWeight={700}
        y={() => vH() * -0.43}
        opacity={0} />

      {/* axe vertical = erreur */}
      <Line key="axis-y" ref={axisY}
        points={() => [[sx(-1), sy(-1)], [sx(-1), vH() * 0.30]]}
        stroke={PALETTE.ghost} lineWidth={2} opacity={0} />
      <Txt key="axis-label" ref={axisLabel}
        text="erreur ↑" fill={PALETTE.secondary}
        fontSize={() => vW() * 0.013} fontFamily={MONO}
        rotation={-90}
        x={() => sx(-1) - vW() * 0.03} y={() => vH() * 0.0}
        opacity={0} />

      {/* ligne du minimum (erreur ≈ 0) */}
      <Line key="min-line" ref={minLine}
        points={() => [[sx(-1), vH() * 0.30], [sx(1), vH() * 0.30]]}
        stroke={PALETTE.vert} lineWidth={1} lineDash={[6, 6]} opacity={0} />

      {/* courbe de perte */}
      <Line key="curve" ref={curveRef}
        points={() => {
          const pts: [number, number][] = [];
          for (let k = 0; k <= 60; k++) {
            const x = -1 + (2 * k) / 60;
            pts.push([sx(x), sy(x)]);
          }
          return pts;
        }}
        stroke={PALETTE.secondary} lineWidth={3} end={0} />

      {/* trait d'erreur horizontal (bille → axe) */}
      <Line key="err-line" ref={errLine}
        points={() => [[sx(-1), sy(ballX())], [sx(ballX()), sy(ballX())]]}
        stroke={PALETTE.rose} lineWidth={1.5} lineDash={[5, 5]} opacity={0} />
      <Txt key="err-label" ref={errLabel}
        text="erreur 0.74" fill={PALETTE.rose}
        fontSize={() => vW() * 0.016} fontFamily={MONO} fontWeight={700}
        x={() => sx(-1) + vW() * 0.10} y={() => sy(ballX()) - vH() * 0.03}
        opacity={0} />

      {/* tangente = gradient */}
      <Line key="tangent" ref={tangent}
        points={() => {
          const x = ballX(), m = fp(x), dx = 0.24;
          const yL = vH() * 0.30 - (f(x) - m * dx) * vH() * 0.52;
          const yR = vH() * 0.30 - (f(x) + m * dx) * vH() * 0.52;
          return [[sx(x - dx), yL], [sx(x + dx), yR]];
        }}
        stroke={PALETTE.rose} lineWidth={3} opacity={0} />
      <Txt key="slope-tag" ref={slopeTag}
        text="pente" fill={PALETTE.rose}
        fontSize={() => vW() * 0.013} fontFamily={MONO}
        x={() => sx(ballX()) + vW() * 0.06} y={() => sy(ballX()) - vH() * 0.05}
        opacity={0} />

      {/* la bille */}
      <Circle key="ball" ref={ball}
        width={() => vW() * 0.026} height={() => vW() * 0.026}
        fill={PALETTE.vert}
        shadowColor={PALETTE.vert} shadowBlur={() => vW() * 0.012}
        x={() => sx(ballX())} y={() => sy(ballX())}
        opacity={0} />

      <Callout key="err-callout" ref={errCallout}
        title="erreur = écart"
        body="entre ce que le modèle produit et ce qu'il aurait dû produire"
        color={PALETTE.rose}
        width={() => vW() * 0.32} height={() => vH() * 0.14}
        x={() => vW() * 0.27} y={() => vH() * -0.22}
        opacity={0} />
    </Layout>,
  );

  // ════════════════════════════════════════════════════════════════════════
  // ANIMATIONS
  // ════════════════════════════════════════════════════════════════════════

  const errVal = (x: number) => f(x).toFixed(2);

  yield* waitUntil('intro');
  yield* all(
    gridRef().opacity(0.1, 0.8),
    titleRef().opacity(1, 0.5),
    axisY().opacity(1, 0.5),
    axisLabel().opacity(1, 0.5),
  );
  yield* curveRef().end(1, 0.9, easeInOutCubic);
  yield* minLine().opacity(0.6, 0.4);

  // la bille apparaît haut sur la pente
  yield* waitUntil('ball');
  yield* ball().opacity(1, 0.3);
  yield* all(
    errLine().opacity(1, 0.3),
    errLabel().opacity(1, 0.3),
  );

  // « le gradient, c'est juste la pente »
  yield* waitUntil('slope');
  yield* all(
    tangent().opacity(1, 0.4),
    slopeTag().opacity(1, 0.4),
  );
  yield* tangent().scale(1.05, 0.2).to(1, 0.2);

  // « on cherche la direction qui fait descendre l'erreur » → la bille descend
  yield* waitUntil('descend');
  for (let i = 1; i < STEPS.length; i++) {
    yield* all(
      ballX(STEPS[i], 0.55, easeInOutCubic),
      errLabel().text(`erreur ${errVal(STEPS[i])}`, 0.55),
    );
    yield* waitFor(0.12);
  }
  // arrivée au creux : tout passe au vert
  yield* all(
    errLabel().fill(PALETTE.vert, 0.4),
    errLine().stroke(PALETTE.vert, 0.4),
    tangent().opacity(0.2, 0.4),
    slopeTag().opacity(0, 0.4),
  );

  // « il mesure l'erreur entre produit et attendu »
  yield* waitUntil('error');
  yield* errCallout().opacity(1, 0.4);
  yield* errCallout().hold();

  yield* waitUntil('end');
  yield* all(
    gridRef().opacity(0, 0.5),
    titleRef().opacity(0, 0.5),
    curveRef().opacity(0, 0.5),
    axisY().opacity(0, 0.5),
    axisLabel().opacity(0, 0.5),
    minLine().opacity(0, 0.5),
    ball().opacity(0, 0.5),
    tangent().opacity(0, 0.5),
    errLine().opacity(0, 0.5),
    errLabel().opacity(0, 0.5),
    errCallout().opacity(0, 0.5),
  );
  yield* waitFor(0.3);
});
