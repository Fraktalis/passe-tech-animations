/**
 * @file console-mixage.tsx
 * @description Vidéo 1 LLM — Chapitre « L'entraînement », temps 2 : poids aléatoires & console de mixage.
 *
 * Show, don't tell :
 *   1. Modèle vierge = bibliothèque de Babel. Un prompt entre → du BRUIT sort (rose).
 *   2. La console de mixage : une rangée de potards à des positions ALÉATOIRES.
 *      Chacun = un poids. Le compteur affiche l'échelle réelle (≈ 175 milliards).
 *   3. L'entraînement tourne chaque potard d'une fraction infime, dans le bon sens.
 *      Les potards glissent légèrement → la sortie passe du bruit (rose) au sens (vert).
 *
 * Exception palette autorisée : contraste bruit/correct → rose + vert.
 * (175 milliards = ordre de grandeur GPT-3, donné comme illustration.)
 */

import {makeScene2D, Grid, Layout, Line, Rect, Txt} from '@motion-canvas/2d';
import {
  all, sequence, waitFor, waitUntil, createRef, easeInOutCubic, easeOutCubic,
} from '@motion-canvas/core';
import {Callout} from '../../components';
import {PALETTE} from '../../theme';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  const MONO = 'JetBrains Mono, DM Mono, monospace';
  const SANS = 'Space Grotesk';

  // ── Console : 16 potards (faders) ─────────────────────────────────────────
  const N = 16;
  const trackTop    = () => vH() * 0.04;
  const trackBottom = () => vH() * 0.30;
  const faderX = (i: number) => () => (i - (N - 1) / 2) * vW() * 0.046;
  const knobY  = (frac: number) => () => trackTop() + frac * (trackBottom() - trackTop());

  // positions aléatoires de départ + cibles « accordées » (déterministes par seed simple)
  const seeded = (k: number) => {
    const x = Math.sin(k * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };
  const startFrac = Array.from({length: N}, (_, i) => 0.1 + seeded(i + 1) * 0.8);
  const tunedFrac = Array.from({length: N}, (_, i) => 0.35 + seeded(i + 11) * 0.3);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const gridRef   = createRef<Grid>();
  const titleRef  = createRef<Txt>();

  const promptRef = createRef<Rect>();
  const promptArrow = createRef<Line>();
  const outputBox = createRef<Rect>();
  const outputTxt = createRef<Txt>();
  const outputTag = createRef<Txt>();

  const consoleGroup = createRef<Layout>();
  const tracks = Array.from({length: N}, () => createRef<Rect>());
  const knobs  = Array.from({length: N}, () => createRef<Rect>());

  const countRef   = createRef<Txt>();
  const knobCallout = createRef<Callout>();

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
        text="MODÈLE NON ENTRAÎNÉ"
        fill={PALETTE.secondary}
        fontSize={() => vW() * 0.014}
        fontFamily={MONO} fontWeight={700}
        y={() => vH() * -0.43}
        opacity={0} />

      {/* ── prompt en entrée ──────────────────────────────────────────────── */}
      <Rect key="prompt" ref={promptRef}
        width={() => vW() * 0.30} height={() => vH() * 0.10}
        fill={PALETTE.nodeBg} stroke={PALETTE.secondary} lineWidth={2}
        radius={() => vW() * 0.008}
        x={() => vW() * -0.30} y={() => vH() * -0.30}
        opacity={0}>
        <Txt text="« La capitale de la France est »" fill={PALETTE.cream}
          fontSize={() => vW() * 0.014} fontFamily={MONO} />
      </Rect>

      <Line key="prompt-arrow" ref={promptArrow}
        points={() => [[vW() * -0.30, vH() * -0.24], [vW() * 0.28, vH() * -0.24]]}
        stroke={PALETTE.secondary} lineWidth={2} endArrow arrowSize={9}
        end={0} opacity={0} />

      {/* ── sortie ────────────────────────────────────────────────────────── */}
      <Rect key="output" ref={outputBox}
        width={() => vW() * 0.34} height={() => vH() * 0.12}
        fill={PALETTE.nodeBg} stroke={PALETTE.rose} lineWidth={2}
        radius={() => vW() * 0.008}
        x={() => vW() * 0.30} y={() => vH() * -0.30}
        opacity={0}>
        <Txt ref={outputTxt} text="qXp ##â7 ⍓ z%k lÔr ¿8"
          fill={PALETTE.rose}
          fontSize={() => vW() * 0.018} fontFamily={MONO} fontWeight={700} />
        <Txt ref={outputTag} text="bruit"
          fill={PALETTE.rose}
          fontSize={() => vW() * 0.012} fontFamily={MONO}
          y={() => vH() * 0.04} />
      </Rect>

      {/* ── console de mixage ─────────────────────────────────────────────── */}
      <Layout key="console" ref={consoleGroup} opacity={0} y={() => vH() * 0.04}>
        {Array.from({length: N}, (_, i) => (
          <Rect key={`track-${i}`} ref={tracks[i]}
            width={() => vW() * 0.004} height={() => trackBottom() - trackTop()}
            fill={PALETTE.nodeActiveBg}
            x={faderX(i)} y={() => (trackTop() + trackBottom()) / 2} />
        ))}
        {Array.from({length: N}, (_, i) => (
          <Rect key={`knob-${i}`} ref={knobs[i]}
            width={() => vW() * 0.024} height={() => vH() * 0.022}
            fill={PALETTE.nodeActiveBg} stroke={PALETTE.rose} lineWidth={2}
            radius={() => vW() * 0.003}
            x={faderX(i)} y={knobY(startFrac[i])} />
        ))}
      </Layout>

      <Txt key="count" ref={countRef}
        text="≈ 800 000 000 000 potards"
        fill={PALETTE.secondary}
        fontSize={() => vW() * 0.016} fontFamily={MONO} fontWeight={700}
        y={() => vH() * 0.40}
        opacity={0} />

      <Callout key="knob-callout" ref={knobCallout}
        title="1 potard = 1 poids"
        body="un nombre par lequel le réseau multiplie"
        color={PALETTE.rose}
        width={() => vW() * 0.30} height={() => vH() * 0.12}
        x={() => vW() * 0.30} y={() => vH() * 0.36}
        opacity={0} />
    </Layout>,
  );

  // ════════════════════════════════════════════════════════════════════════
  // ANIMATIONS
  // ════════════════════════════════════════════════════════════════════════

  yield* waitUntil('intro');
  yield* all(
    gridRef().opacity(0.1, 0.8),
    titleRef().opacity(1, 0.5),
  );

  // « bibliothèque de Babel — texte en entrée, bruit en sortie »
  yield* waitUntil('babel');
  yield* promptRef().opacity(1, 0.4);
  yield* promptArrow().opacity(1, 0.01);
  yield* promptArrow().end(1, 0.5, easeOutCubic);
  yield* outputBox().opacity(1, 0.4);
  // le bruit grésille
  yield* sequence(0.12,
    outputTxt().text('z%k ¿8 ⍓ qXp ##â', 0.08),
    outputTxt().text('lÔr ##â7 z%k ⍓ ¿', 0.08),
    outputTxt().text('qXp ##â7 ⍓ z%k lÔr', 0.08),
  );
  yield* waitFor(0.5);

  // « console de mixage avec des milliards de potards »
  yield* waitUntil('console');
  yield* all(
    titleRef().text('CONSOLE DE MIXAGE', 0.4),
    consoleGroup().opacity(1, 0.5),
  );
  // les potards arrivent à des positions aléatoires
  yield* sequence(0.03, ...knobs.map(k => k().scale(0, 0).to(1, 0.25, easeOutCubic)));
  yield* countRef().opacity(1, 0.4);

  // micro-jitter : positions aléatoires, instables
  yield* waitUntil('random');
  yield* all(
    ...knobs.map((k, i) =>
      k().y(knobY(startFrac[i])() + (seeded(i + 21) - 0.5) * vH() * 0.03, 0.4)
        .to(knobY(startFrac[i])(), 0.4),
    ),
  );

  // « chacun contrôle un poids dans le réseau »
  yield* waitUntil('eachKnob');
  const focus = 6;
  yield* all(
    knobs[focus]().stroke(PALETTE.cream, 0.3),
    knobs[focus]().scale(1.5, 0.3, easeOutCubic),
    knobCallout().opacity(1, 0.4),
  );
  yield* waitFor(0.4);
  yield* all(
    knobs[focus]().stroke(PALETTE.rose, 0.3),
    knobs[focus]().scale(1, 0.3),
    knobCallout().opacity(0, 0.3),
  );

  // « l'entraînement tourne chaque potard d'une fraction infime, dans le bon sens »
  yield* waitUntil('training');
  yield* titleRef().text('ENTRAÎNEMENT', 0.4);
  // les potards glissent par petits pas vers leur position accordée
  for (let step = 1; step <= 3; step++) {
    const t = step / 3;
    yield* all(
      ...knobs.map((k, i) => {
        const frac = startFrac[i] + (tunedFrac[i] - startFrac[i]) * t;
        return k().y(knobY(frac)(), 0.35, easeInOutCubic);
      }),
    );
  }

  // la sortie se rapproche de ce qu'on veut : bruit → sens, rose → vert
  yield* waitUntil('converge');
  yield* all(
    ...knobs.map(k => k().stroke(PALETTE.vert, 0.4)),
    outputBox().stroke(PALETTE.vert, 0.4),
    outputTxt().opacity(0, 0.3),
    outputTag().opacity(0, 0.3),
  );
  outputTxt().text('Paris').fill(PALETTE.vert);
  outputTag().text('réponse').fill(PALETTE.vert);
  yield* all(
    outputTxt().fontSize(() => vW() * 0.026, 0),
    outputTxt().opacity(1, 0.4),
    outputTag().opacity(1, 0.4),
  );
  yield* waitFor(1.0);

  yield* waitUntil('end');
  yield* all(
    gridRef().opacity(0, 0.5),
    titleRef().opacity(0, 0.5),
    promptRef().opacity(0, 0.5),
    promptArrow().opacity(0, 0.5),
    outputBox().opacity(0, 0.5),
    consoleGroup().opacity(0, 0.5),
    countRef().opacity(0, 0.5),
  );
  yield* waitFor(0.3);
});
