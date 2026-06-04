/**
 * @file temperature.tsx
 * @description Vidéo 1 LLM — La température (échantillonnage).
 *
 * Question : si le modèle prenait TOUJOURS le token le plus probable, il donnerait
 * toujours la même réponse. Mais il ne fait pas ça — il ÉCHANTILLONNE dans la
 * distribution. Et avant de tirer, on peut déformer cette distribution : c'est la
 * température.
 *
 * Show, don't tell :
 *   1. Une distribution de probabilités (barres) sur le prochain token.
 *   2. argmax → toujours « bleu ». Échantillonnage → réponses variées.
 *   3. Un BOUTON « température » :
 *        - basse  → la distribution se PIQUE (bleu écrase tout) → prévisible, cohérent.
 *        - haute  → la distribution s'APLATIT → surprenant, créatif, parfois faux.
 *   4. Même modèle, mêmes poids — un seul bouton change tout.
 *
 * Rigueur : softmax avec température, p ∝ exp(logit / T).
 *   logits = [3.0, 2.0, 1.5, 0.8, 0.2]
 *   T=1.0 → [.57 .21 .13 .06 .03] · T=0.3 → [.96 .03 .01 .00 .00] · T=1.8 → [.40 .23 .17 .12 .08]
 *
 * Couleurs : froid = cyan (basse T, déterministe), chaud = ambre (haute T, créatif).
 */

import {makeScene2D, Circle, Grid, Layout, Line, Rect, Txt} from '@motion-canvas/2d';
import {
  all, sequence, waitFor, waitUntil, createRef,
  easeInOutCubic, easeOutCubic, easeOutBack,
} from '@motion-canvas/core';
import {Callout} from '../../components';
import {PALETTE} from '../../theme';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  const MONO = 'JetBrains Mono, DM Mono, monospace';
  const SANS = 'Space Grotesk';

  const COLD = PALETTE.cyan;   // basse température
  const HOT  = PALETTE.amber;  // haute température

  // ── Distribution (softmax avec température, logits fixes) ──────────────────
  const TOKENS = ['bleu', 'gris', 'clair', 'orange', 'vert'];
  const DIST_BASE = [0.57, 0.21, 0.13, 0.06, 0.03]; // T = 1.0
  const DIST_LOW  = [0.96, 0.03, 0.01, 0.00, 0.00]; // T = 0.3
  const DIST_HIGH = [0.40, 0.23, 0.17, 0.12, 0.08]; // T = 1.8
  const NT = TOKENS.length;

  const barX     = (i: number) => () => (i - (NT - 1) / 2) * vW() * 0.105;
  const barBaseY = () => vH() * 0.20;
  const barMaxH  = () => vH() * 0.30;
  const barW     = () => vW() * 0.06;

  const fmtP = (p: number) => p.toFixed(2).replace(/^0/, '');

  // ── Refs ──────────────────────────────────────────────────────────────────
  const gridRef   = createRef<Grid>();
  const titleRef  = createRef<Txt>();

  const bars       = TOKENS.map(() => createRef<Rect>());
  const tokenLabels = TOKENS.map(() => createRef<Txt>());
  const probLabels  = TOKENS.map(() => createRef<Txt>());

  // bouton température (slider)
  const sliderGroup = createRef<Layout>();
  const sliderTrack = createRef<Rect>();
  const sliderKnob  = createRef<Rect>();
  const tempValue   = createRef<Txt>();
  const sliderLabel = createRef<Txt>();
  const lowEnd      = createRef<Txt>();
  const highEnd     = createRef<Txt>();

  const pointer    = createRef<Circle>();
  const resultHead = createRef<Txt>();
  const resultTxt  = createRef<Txt>();

  const phaseTag   = createRef<Txt>();
  const useCaseTag = createRef<Txt>();
  const formulaCallout = createRef<Callout>();

  const sliderHalf = () => vW() * 0.18;

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
        text="LE PROCHAIN TOKEN"
        fill={PALETTE.secondary}
        fontSize={() => vW() * 0.014}
        fontFamily={MONO} fontWeight={700}
        y={() => vH() * -0.44}
        opacity={0} />

      {/* ── distribution : barres ─────────────────────────────────────────── */}
      {TOKENS.map((_, i) => (
        <Rect key={`bar-${i}`} ref={bars[i]}
          width={barW} height={0}
          offset={[0, 1]}
          fill={COLD} radius={() => vW() * 0.004}
          x={barX(i)} y={barBaseY}
          opacity={0} />
      ))}
      {TOKENS.map((tok, i) => (
        <Txt key={`tok-${i}`} ref={tokenLabels[i]}
          text={tok} fill={PALETTE.secondary}
          fontSize={() => vW() * 0.015} fontFamily={MONO}
          x={barX(i)} y={() => barBaseY() + vH() * 0.035}
          opacity={0} />
      ))}
      {TOKENS.map((_, i) => (
        <Txt key={`prob-${i}`} ref={probLabels[i]}
          text={fmtP(DIST_BASE[i])} fill={PALETTE.cream}
          fontSize={() => vW() * 0.014} fontFamily={MONO} fontWeight={700}
          x={barX(i)} y={() => barBaseY() - bars[i]().height() - vH() * 0.025}
          opacity={0} />
      ))}

      {/* curseur d'échantillonnage */}
      <Circle key="pointer" ref={pointer}
        width={() => vW() * 0.016} height={() => vW() * 0.016}
        fill={PALETTE.cream}
        shadowColor={PALETTE.cream} shadowBlur={() => vW() * 0.01}
        x={barX(0)} y={() => vH() * -0.16}
        opacity={0} />

      {/* ── bouton température (slider) ────────────────────────────────────── */}
      <Layout key="slider" ref={sliderGroup} opacity={0} y={() => vH() * -0.30}>
        <Txt ref={sliderLabel} text="température"
          fill={PALETTE.cream}
          fontSize={() => vW() * 0.015} fontFamily={SANS} fontWeight={700}
          y={() => vH() * -0.05} />
        <Rect ref={sliderTrack}
          width={() => sliderHalf() * 2} height={() => vH() * 0.012}
          fill={PALETTE.nodeActiveBg} radius={() => vH() * 0.006} />
        <Txt ref={lowEnd} text="basse" fill={COLD}
          fontSize={() => vW() * 0.012} fontFamily={MONO}
          x={() => -sliderHalf() - vW() * 0.035} />
        <Txt ref={highEnd} text="haute" fill={HOT}
          fontSize={() => vW() * 0.012} fontFamily={MONO}
          x={() => sliderHalf() + vW() * 0.035} />
        <Rect ref={sliderKnob}
          width={() => vW() * 0.018} height={() => vH() * 0.04}
          fill={COLD} stroke={PALETTE.cream} lineWidth={2}
          radius={() => vW() * 0.004}
          x={0} y={0} />
        <Txt ref={tempValue} text="T = 1.0"
          fill={PALETTE.cream}
          fontSize={() => vW() * 0.014} fontFamily={MONO} fontWeight={700}
          y={() => vH() * 0.045} />
      </Layout>

      {/* formule (rigueur) */}
      <Callout key="formula" ref={formulaCallout}
        title="Température"
        body="p = softmax(logits / T)"
        color={PALETTE.secondary}
        width={() => vW() * 0.24} height={() => vH() * 0.11}
        x={() => vW() * 0.36} y={() => vH() * -0.34}
        opacity={0} />

      {/* panneau gauche : comportement + cas d'usage */}
      <Txt key="phase-tag" ref={phaseTag}
        text="" fill={COLD}
        fontSize={() => vW() * 0.018} fontFamily={SANS} fontWeight={700}
        textAlign={'center'}
        x={() => vW() * -0.38} y={() => vH() * -0.02}
        opacity={0} />
      <Txt key="usecase-tag" ref={useCaseTag}
        text="" fill={PALETTE.secondary}
        fontSize={() => vW() * 0.013} fontFamily={MONO}
        textAlign={'center'}
        x={() => vW() * -0.38} y={() => vH() * 0.06}
        opacity={0} />

      {/* panneau droit : échantillons tirés */}
      <Txt key="result-head" ref={resultHead}
        text="échantillons" fill={PALETTE.secondary}
        fontSize={() => vW() * 0.012} fontFamily={MONO}
        x={() => vW() * 0.38} y={() => vH() * -0.10}
        opacity={0} />
      <Txt key="result" ref={resultTxt}
        text="" fill={PALETTE.cream}
        fontSize={() => vW() * 0.02} fontFamily={MONO} fontWeight={700}
        textAlign={'center'} lineHeight={() => vW() * 0.03}
        x={() => vW() * 0.38} y={() => vH() * 0.02}
        opacity={0} />
    </Layout>,
  );

  // ════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ════════════════════════════════════════════════════════════════════════

  // applique une distribution (hauteurs + probas + couleur)
  const applyDist = (dist: number[], color: string, dur: number) =>
    all(
      ...bars.map((b, i) => b().height(dist[i] * barMaxH(), dur, easeInOutCubic)),
      ...bars.map(b => b().fill(color, dur)),
      ...probLabels.map((l, i) => l().text(fmtP(dist[i]), dur)),
    );

  // position du knob + valeur
  const setTemp = function* (xFrac: number, label: string, color: string) {
    yield* all(
      sliderKnob().x(xFrac * sliderHalf(), 0.6, easeInOutCubic),
      sliderKnob().fill(color, 0.5),
      tempValue().text(label, 0.4),
      tempValue().fill(color, 0.4),
    );
  };

  // un tirage : le curseur se pose sur la barre i, qui sursaute
  const drawSample = function* (i: number, color: string) {
    yield* pointer().x(barX(i)(), 0.3, easeInOutCubic);
    yield* all(
      bars[i]().scale(1.06, 0.12).to(1, 0.12),
      pointer().fill(color, 0.1).to(PALETTE.cream, 0.2),
    );
  };

  // joue une série de tirages et accumule les résultats
  const runSamples = function* (indices: number[], color: string) {
    yield* resultTxt().opacity(0, 0.2);
    resultTxt().text('').fill(color);
    yield* resultTxt().opacity(1, 0.01);
    const acc: string[] = [];
    for (const idx of indices) {
      yield* drawSample(idx, color);
      acc.push(TOKENS[idx]);
      resultTxt().text(acc.join('\n'));
      yield* waitFor(0.25);
    }
  };

  // ════════════════════════════════════════════════════════════════════════
  // ANIMATIONS
  // ════════════════════════════════════════════════════════════════════════

  yield* waitUntil('intro');
  yield* all(
    gridRef().opacity(0.1, 0.8),
    titleRef().opacity(1, 0.5),
  );
  // la distribution apparaît (T = 1)
  yield* sequence(0.07, ...tokenLabels.map(l => l().opacity(1, 0.25)));
  yield* all(
    ...bars.map(b => b().opacity(1, 0.3)),
    applyDist(DIST_BASE, COLD, 0.6),
  );
  yield* all(...probLabels.map(l => l().opacity(1, 0.3)));

  // ── argmax : toujours le plus probable → toujours pareil ──────────────────
  yield* waitUntil('argmax');
  yield* all(
    ...bars.slice(1).map(b => b().opacity(0.25, 0.4)),
    bars[0]().scale(1.04, 0.2).to(1, 0.2),
    pointer().opacity(1, 0.3),
  );
  pointer().x(barX(0)());
  yield* runSamples([0, 0, 0], COLD);
  yield* waitFor(0.4);

  // ── échantillonnage : non, il tire au hasard selon p ──────────────────────
  yield* waitUntil('sample');
  yield* all(
    ...bars.map(b => b().opacity(1, 0.4)),
    titleRef().text('ÉCHANTILLONNAGE', 0.4),
  );
  yield* runSamples([0, 1, 2], COLD);
  yield* waitFor(0.4);

  // ── la température entre en jeu ───────────────────────────────────────────
  yield* waitUntil('temperature');
  yield* all(
    sliderGroup().opacity(1, 0.5),
    formulaCallout().opacity(1, 0.4),
  );

  // ── basse température : distribution piquée → déterministe ────────────────
  yield* waitUntil('low');
  yield* setTemp(-1, 'T = 0.3', COLD);
  yield* applyDist(DIST_LOW, COLD, 0.7);
  yield* all(
    phaseTag().text('prévisible\ncohérent', 0.4),
    phaseTag().fill(COLD, 0.3),
    phaseTag().opacity(1, 0.4),
    useCaseTag().text('code · analyse factuelle', 0.4),
    useCaseTag().opacity(1, 0.4),
  );
  // l'échantillonnage retombe presque toujours sur « bleu »
  yield* runSamples([0, 0, 0], COLD);
  yield* waitFor(0.4);

  // ── haute température : distribution aplatie → créatif ────────────────────
  yield* waitUntil('high');
  yield* setTemp(1, 'T = 1.8', HOT);
  yield* applyDist(DIST_HIGH, HOT, 0.7);
  yield* all(
    phaseTag().text('créatif\nsurprenant · parfois faux', 0.4),
    phaseTag().fill(HOT, 0.3),
    useCaseTag().text('brainstorming · création', 0.4),
    tokenLabels[3]().fill(HOT, 0.3),
    tokenLabels[4]().fill(HOT, 0.3),
  );
  // les tokens rares passent maintenant : orange, vert…
  yield* runSamples([3, 1, 4], HOT);
  yield* waitFor(0.5);

  // ── clôture : retour au centre, le bouton seul reste au premier plan ──────
  yield* waitUntil('conclusion');
  yield* setTemp(0, 'T = 1.0', PALETTE.cream);
  yield* all(
    ...bars.map(b => b().opacity(0.18, 0.5)),
    ...tokenLabels.map(l => l().opacity(0.18, 0.5)),
    ...probLabels.map(l => l().opacity(0, 0.5)),
    pointer().opacity(0, 0.4),
    resultHead().opacity(0, 0.4),
    resultTxt().opacity(0, 0.4),
    phaseTag().opacity(0, 0.4),
    useCaseTag().opacity(0, 0.4),
    formulaCallout().opacity(0, 0.4),
    titleRef().opacity(0, 0.4),
  );
  yield* all(
    sliderGroup().position.y(vH() * -0.05, 0.6, easeInOutCubic),
    sliderGroup().scale(1.15, 0.6, easeInOutCubic),
  );
  yield* sliderKnob().scale(1.2, 0.2).to(1, 0.2);
  yield* waitFor(0.8);

  yield* waitUntil('end');
  yield* all(
    gridRef().opacity(0, 0.5),
    sliderGroup().opacity(0, 0.5),
    ...bars.map(b => b().opacity(0, 0.5)),
    ...tokenLabels.map(l => l().opacity(0, 0.5)),
  );
  yield* waitFor(0.3);
});
