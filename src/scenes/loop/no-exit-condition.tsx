/**
 * @scene no-exit-condition
 * @video Loop Engineering — ACTE 3 : Sans condition de sortie
 *
 * Dan Bochman (fashn.ai) : 87 itérations, 13 heures.
 * Critère d'arrêt : "ça me semble raisonnable ?"
 * Chaque "tu as raison, j'ai sur-ingénié" rebondit plus haut que le pic précédent.
 */

import {makeScene2D, Rect, Txt} from '@motion-canvas/2d';
import {Grid} from '@motion-canvas/2d/lib/components';
import {
  createRef,
  all,
  waitUntil,
  waitFor,
  easeInOutCubic,
  linear,
} from '@motion-canvas/core';
import {DiagramNode, ConnectionArrow, Callout} from '../../components';
import {PALETTE} from '../../theme';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  // ── Bar geometry (horizontal LOC indicator) ───────────────────────────────
  // Bar spans most of the width, sits below the nodes
  const BAR_W    = () => vW() * 0.70;
  const BAR_H    = () => vH() * 0.075;
  const BAR_CY   = () => vH() * 0.22;
  // Left edge of the bar (pivot for fill rect)
  const BAR_LEFT = () => -BAR_W() / 2;
  // "objectif" target marker at 12% of bar width
  const TARGET_X = () => BAR_LEFT() + BAR_W() * 0.12;

  // ── Refs ───────────────────────────────────────────────────────────────────
  const gridRef      = createRef<Grid>();
  const devNode      = createRef<DiagramNode>();
  const claudeNode   = createRef<DiagramNode>();
  const barBg        = createRef<Rect>();
  const barFill      = createRef<Rect>();
  const targetMarker = createRef<Rect>();
  const targetLabel  = createRef<Txt>();
  const barLabel     = createRef<Txt>();
  const locCount     = createRef<Txt>();
  const counterLabel = createRef<Txt>();
  const clockLabel   = createRef<Txt>();
  const arrowTask    = createRef<ConnectionArrow>();
  const arrowBack    = createRef<ConnectionArrow>();
  const exitCallout  = createRef<Callout>();

  // Node Y — nodes sit above the bar
  const NODE_Y = () => vH() * -0.13;

  // ── Scene tree ─────────────────────────────────────────────────────────────
  view.add(
    <>
      <Rect key="bg" width={'100%'} height={'100%'} fill={PALETTE.bg} />
      <Grid
        key="scene-grid"
        ref={gridRef}
        width={'100%'}
        height={'100%'}
        stroke={PALETTE.ghost}
        lineWidth={1}
        spacing={80}
        opacity={0}
      />

      {/* Dev — human developer, left */}
      <DiagramNode
        key="dev-node"
        ref={devNode}
        iconName="mdi:account"
        label="Dev"
        sublabel="Dan Bochman"
        color={PALETTE.cyan}
        width={() => vW() * 0.15}
        height={() => vH() * 0.28}
        x={() => vW() * -0.35}
        y={NODE_Y}
        initialState="active"
        opacity={0}
      />

      {/* Claude — LLM agent, right */}
      <DiagramNode
        key="claude-node"
        ref={claudeNode}
        iconName="mdi:robot-outline"
        label="Claude"
        sublabel="Opus 4.8"
        color={PALETTE.rose}
        width={() => vW() * 0.15}
        height={() => vH() * 0.28}
        x={() => vW() * 0.35}
        y={NODE_Y}
        initialState="idle"
        opacity={0}
      />

      {/* Arrow: Dev → Claude (task assignment) */}
      <ConnectionArrow
        key="arrow-task"
        ref={arrowTask}
        from={() => [vW() * -0.275, NODE_Y() - vH() * 0.04]}
        to={() => [vW() * 0.275, NODE_Y() - vH() * 0.04]}
        stroke={PALETTE.cyan}
        end={0}
        opacity={0}
      />

      {/* Arrow: Claude → Dev (dashed — "you're right!") */}
      <ConnectionArrow
        key="arrow-back"
        ref={arrowBack}
        from={() => [vW() * 0.275, NODE_Y() + vH() * 0.06]}
        to={() => [vW() * -0.275, NODE_Y() + vH() * 0.06]}
        stroke={PALETTE.ghost}
        dashed
        end={0}
        opacity={0}
      />

      {/* Bar label "lignes de code" — above bar, left-aligned */}
      <Txt
        key="bar-label"
        ref={barLabel}
        text="lignes de code"
        fill={PALETTE.secondary}
        fontSize={() => vW() * 0.014}
        fontFamily={'JetBrains Mono, DM Mono, monospace'}
        x={() => BAR_LEFT() + vW() * 0.075}
        y={() => BAR_CY() - BAR_H() / 2 - vH() * 0.035}
        opacity={0}
      />

      {/* Bar background */}
      <Rect
        key="bar-bg"
        ref={barBg}
        width={BAR_W}
        height={BAR_H}
        x={0}
        y={BAR_CY}
        fill={PALETTE.nodeBg}
        radius={() => vW() * 0.004}
        opacity={0}
      />

      {/* Bar fill — grows right from left edge (offsetX={-1} anchors pivot at left) */}
      <Rect
        key="bar-fill"
        ref={barFill}
        width={0}
        height={() => BAR_H() - vH() * 0.010}
        x={BAR_LEFT}
        y={BAR_CY}
        offsetX={-1}
        fill={PALETTE.rose}
        radius={() => vW() * 0.003}
        opacity={0}
      />

      {/* Target marker — vertical line at "objectif" position */}
      <Rect
        key="target-marker"
        ref={targetMarker}
        width={2}
        height={BAR_H}
        x={TARGET_X}
        y={BAR_CY}
        fill={PALETTE.dsGreen}
        opacity={0}
      />
      <Txt
        key="target-label"
        ref={targetLabel}
        text="objectif"
        fill={PALETTE.dsGreen}
        fontSize={() => vW() * 0.012}
        fontFamily={'JetBrains Mono, DM Mono, monospace'}
        x={TARGET_X}
        y={() => BAR_CY() + BAR_H() / 2 + vH() * 0.03}
        opacity={0}
      />

      {/* LOC counter — right of the bar */}
      <Txt
        key="loc-count"
        ref={locCount}
        text="0 LOC"
        fill={PALETTE.rose}
        fontSize={() => vW() * 0.022}
        fontFamily={'JetBrains Mono, DM Mono, monospace'}
        fontWeight={700}
        x={() => BAR_W() / 2 + vW() * 0.06}
        y={BAR_CY}
        opacity={0}
      />

      {/* Iteration counter */}
      <Txt
        key="counter-label"
        ref={counterLabel}
        text="×1"
        fill={PALETTE.amber}
        fontSize={() => vW() * 0.038}
        fontFamily={'JetBrains Mono, DM Mono, monospace'}
        fontWeight={700}
        x={() => vW() * -0.1}
        y={() => vH() * -0.40}
        opacity={0}
      />

      {/* Clock */}
      <Txt
        key="clock-label"
        ref={clockLabel}
        text="0h"
        fill={PALETTE.ghost}
        fontSize={() => vW() * 0.022}
        fontFamily={'JetBrains Mono, DM Mono, monospace'}
        x={() => vW() * 0.1}
        y={() => vH() * -0.40}
        opacity={0}
      />

      {/* Exit condition — no objective criterion, just a gut feeling */}
      <Callout
        key="callout-exit"
        ref={exitCallout}
        title="condition de sortie"
        body={"ça me semble\nraisonnable ?"}
        color={PALETTE.amber}
        width={() => vW() * 0.26}
        height={() => vH() * 0.16}
        x={0}
        y={() => vH() * 0.42}
        opacity={0}
      />
    </>,
  );

  // ── INTRO — nodes + bar ───────────────────────────────────────────────────
  yield* waitUntil('intro');
  yield* all(
    gridRef().opacity(0.12, 0.6),
    devNode().opacity(1, 0.4),
    claudeNode().opacity(1, 0.4),
    barBg().opacity(1, 0.4),
    barLabel().opacity(1, 0.4),
  );
  yield* all(
    barFill().opacity(1, 0.2),
    targetMarker().opacity(1, 0.4),
    targetLabel().opacity(1, 0.4),
    locCount().opacity(1, 0.35),
    counterLabel().opacity(1, 0.35),
    clockLabel().opacity(1, 0.35),
  );

  // ── TASK — Dev sends task to Claude ───────────────────────────────────────
  yield* waitUntil('task');
  arrowTask().opacity(1);
  yield* arrowTask().end(1, 0.5, easeInOutCubic);
  yield* claudeNode().setState('active', 0.15);

  // ── CODE-GROWS — 0 → 350 LOC (bar fills to 45%) ───────────────────────────
  yield* waitUntil('code-grows');
  yield* all(
    barFill().width(BAR_W() * 0.45, 1.0, easeInOutCubic),
    (function* () { locCount().text('350 LOC'); })(),
  );

  // ── PUSHBACK — "Why?" → 350 → 240 LOC (dips to 32%) ─────────────────────
  yield* waitUntil('pushback');
  arrowBack().opacity(1);
  yield* arrowBack().end(1, 0.5, easeInOutCubic);
  yield* claudeNode().setState('idle', 0.1);
  yield* all(
    barFill().width(BAR_W() * 0.32, 0.6, easeInOutCubic),
    (function* () { locCount().text('240 LOC'); })(),
  );

  // ── REBOUND — "You're right!" → 240 → 580 LOC (rebounds HIGHER) ──────────
  yield* waitUntil('rebound');
  yield* claudeNode().setState('active', 0.1);
  yield* all(
    barFill().width(BAR_W() * 0.68, 0.9, easeInOutCubic),
    (function* () { locCount().text('580 LOC'); })(),
  );

  // ── FAST-FORWARD — ×2 → ×87, 0h → 13h, 580 → 8500 LOC ──────────────────
  // Arrows alternate at each iteration to show the back-and-forth exchange
  yield* waitUntil('fast-forward');
  const runCounter = function* () {
    for (let i = 2; i <= 87; i++) {
      counterLabel().text(`×${i}`);
      clockLabel().text(`${Math.round((i / 87) * 13)}h`);
      locCount().text(`${Math.round(580 + (i / 87) * 7920)} LOC`);
      // Alternate arrows: even = task active, odd = back active
      if (i % 2 === 0) {
        arrowTask().opacity(1);
        arrowBack().opacity(0.2);
      } else {
        arrowTask().opacity(0.2);
        arrowBack().opacity(1);
      }
      yield* waitFor(0.030);
    }
    yield* all(arrowTask().opacity(1, 0.2), arrowBack().opacity(1, 0.2));
  };
  yield* all(
    barFill().width(BAR_W() * 0.97, 2.61, linear),
    runCounter(),
  );

  // ── EXIT-CONDITION ────────────────────────────────────────────────────────
  yield* waitUntil('exit-condition');
  yield* exitCallout().opacity(1, 0.3);
  yield* exitCallout().hold();

  // ── END ───────────────────────────────────────────────────────────────────
  yield* waitUntil('end');
  yield* all(
    gridRef().opacity(0, 0.5),
    devNode().opacity(0, 0.5),
    claudeNode().opacity(0, 0.5),
    barBg().opacity(0, 0.5),
    barFill().opacity(0, 0.5),
    barLabel().opacity(0, 0.5),
    targetMarker().opacity(0, 0.5),
    targetLabel().opacity(0, 0.5),
    locCount().opacity(0, 0.5),
    counterLabel().opacity(0, 0.5),
    clockLabel().opacity(0, 0.5),
    arrowTask().opacity(0, 0.5),
    arrowBack().opacity(0, 0.5),
    exitCallout().opacity(0, 0.5),
  );
});
