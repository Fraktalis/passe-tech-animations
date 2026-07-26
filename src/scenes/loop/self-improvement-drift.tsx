/**
 * @file self-improvement-drift.tsx
 * @description Self-improvement loop — la dérive par accumulation.
 * Chaque mauvaise suggestion entrée dans context.md décale la session suivante.
 * Résultat : une chaîne de nœuds qui diverge de plus en plus de l'objectif.
 *
 * Trajectoire idéale  (pointillés) ─────────────────────── ✦ OBJECTIF
 * Trajectoire réelle  Session 1 ↘ Session 2 ↘ Session 3 ↘ Session 4 (perdu)
 */

import {makeScene2D, Grid, Rect, Txt} from '@motion-canvas/2d';
import {createRef, all, waitUntil, waitFor, easeInOutCubic} from '@motion-canvas/core';
import {DiagramNode, ConnectionArrow} from '../../components';
import {PALETTE} from '../../theme';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  view.fill(PALETTE.bg);

  // ── Layout ───────────────────────────────────────────────────────────────────

  const NODE_W = () => vW() * 0.115;
  const NODE_H = () => vH() * 0.22;

  // Positions X des 4 sessions + objectif
  const xS1  = () => vW() * -0.37;
  const xS2  = () => vW() * -0.16;
  const xS3  = () => vW() *  0.05;
  const xS4  = () => vW() *  0.26;
  const xObj = () => vW() *  0.44;

  // Trajectoire idéale — horizontale en haut de l'écran
  const yIdeal = () => vH() * -0.18;

  // Positions Y des sessions — dérive progressive vers le bas
  const yS1 = () => yIdeal();          // Session 1 encore sur la trajectoire
  const yS2 = () => vH() * -0.01;     // +0.17 vH de dérive
  const yS3 = () => vH() *  0.17;     // +0.18 vH supplémentaire
  const yS4 = () => vH() *  0.36;     // +0.19 vH — hors de portée

  // ── Refs ─────────────────────────────────────────────────────────────────────

  const gridRef    = createRef<Grid>();

  // Ligne trajectoire idéale (pointillés)
  const idealRef   = createRef<ConnectionArrow>();

  // Nœuds sessions
  const nodeS1Ref  = createRef<DiagramNode>();
  const nodeS2Ref  = createRef<DiagramNode>();
  const nodeS3Ref  = createRef<DiagramNode>();
  const nodeS4Ref  = createRef<DiagramNode>();
  const nodeObjRef = createRef<DiagramNode>();

  // Flèches entre sessions (chacune penche plus bas)
  const arrowS1S2Ref = createRef<ConnectionArrow>();
  const arrowS2S3Ref = createRef<ConnectionArrow>();
  const arrowS3S4Ref = createRef<ConnectionArrow>();

  // "Biais ✗" — badges mauvaises suggestions qui déclenchent chaque dérive
  const bias1Ref   = createRef<Rect>();
  const bias1Txt   = createRef<Txt>();
  const bias2Ref   = createRef<Rect>();
  const bias2Txt   = createRef<Txt>();
  const bias3Ref   = createRef<Rect>();
  const bias3Txt   = createRef<Txt>();

  // Flèche montrant le fossé entre S4 et l'objectif
  const gapArrowRef  = createRef<ConnectionArrow>();
  const gapLabelRef  = createRef<Txt>();

  // Label DÉRIVE final
  const driftLabelRef = createRef<Txt>();

  // ── Helper : badge "biais ✗" ─────────────────────────────────────────────────

  function biasBadge(
    badgeRef: ReturnType<typeof createRef<Rect>>,
    txtRef:   ReturnType<typeof createRef<Txt>>,
    xPos: () => number,
    yPos: () => number,
    badgeKey: string,
  ) {
    return (
      <Rect
        key={badgeKey}
        ref={badgeRef}
        x={xPos}
        y={yPos}
        width={() => vW() * 0.095}
        height={() => vH() * 0.045}
        fill={PALETTE.rose + '22'}
        stroke={PALETTE.rose}
        lineWidth={1}
        radius={4}
        opacity={0}
      >
        <Txt
          key={`${badgeKey}-txt`}
          ref={txtRef}
          text="biais ✗"
          fill={PALETTE.rose}
          fontSize={() => vW() * 0.012}
          fontFamily={'JetBrains Mono, DM Mono, monospace'}
          fontWeight={700}
        />
      </Rect>
    );
  }

  // ── Scene tree ───────────────────────────────────────────────────────────────

  view.add(
    <>
      {/* Grille fond */}
      <Grid
        key="bg-grid"
        ref={gridRef}
        width={'100%'}
        height={'100%'}
        spacing={() => vW() * 0.05}
        stroke={PALETTE.ghost}
        lineWidth={1}
        opacity={0}
      />

      {/* Trajectoire idéale — pointillés de l'extrême gauche à l'objectif */}
      <ConnectionArrow
        key="ideal-line"
        ref={idealRef}
        from={() => [vW() * -0.49, yIdeal()]}
        to={() =>   [xObj() - NODE_W() / 2, yIdeal()]}
        stroke={PALETTE.dsGreen}
        dashed
        lineWidth={2}
        end={0}
        opacity={0}
      />

      {/* ── Nœud OBJECTIF ── */}
      <DiagramNode
        key="node-objectif"
        ref={nodeObjRef}
        iconName="mdi:flag-checkered"
        label="Objectif"
        sublabel="cible fixe"
        color={PALETTE.dsGreen}
        width={NODE_W}
        height={NODE_H}
        x={xObj}
        y={yIdeal}
        initialState="success"
        opacity={0}
      />

      {/* ── Session 1 — sur la trajectoire idéale ── */}
      <DiagramNode
        key="node-s1"
        ref={nodeS1Ref}
        iconName="mdi:console"
        label="Session 1"
        sublabel="sur la trajectoire"
        color={PALETTE.dsGreen}
        width={NODE_W}
        height={NODE_H}
        x={xS1}
        y={yS1}
        initialState="success"
        opacity={0}
      />

      {/* ── Session 2 — légère dérive ── */}
      <DiagramNode
        key="node-s2"
        ref={nodeS2Ref}
        iconName="mdi:console"
        label="Session 2"
        sublabel="dérive #1"
        color={PALETTE.amber}
        width={NODE_W}
        height={NODE_H}
        x={xS2}
        y={yS2}
        initialState="active"
        opacity={0}
      />

      {/* ── Session 3 — dérive marquée ── */}
      <DiagramNode
        key="node-s3"
        ref={nodeS3Ref}
        iconName="mdi:console"
        label="Session 3"
        sublabel="dérive #2"
        color={PALETTE.dsRose}
        width={NODE_W}
        height={NODE_H}
        x={xS3}
        y={yS3}
        initialState="error"
        opacity={0}
      />

      {/* ── Session 4 — perdue ── */}
      <DiagramNode
        key="node-s4"
        ref={nodeS4Ref}
        iconName="mdi:console"
        label="Session 4"
        sublabel="perdue"
        color={PALETTE.rose}
        width={NODE_W}
        height={NODE_H}
        x={xS4}
        y={yS4}
        initialState="error"
        opacity={0}
      />

      {/* ── Flèches entre sessions — routing horizontal forcé pour sortir ── */}
      {/* orthogonalement des bords même quand dy > dx                      */}
      <ConnectionArrow
        key="arrow-s1-s2"
        ref={arrowS1S2Ref}
        from={() => [xS1() + NODE_W() / 2, yS1()]}
        to={() =>   [xS2() - NODE_W() / 2, yS2()]}
        stroke={PALETTE.amber}
        lineWidth={2}
        routing={0.45}
        routingAxis="horizontal"
        end={0}
        opacity={0}
      />
      <ConnectionArrow
        key="arrow-s2-s3"
        ref={arrowS2S3Ref}
        from={() => [xS2() + NODE_W() / 2, yS2()]}
        to={() =>   [xS3() - NODE_W() / 2, yS3()]}
        stroke={PALETTE.dsRose}
        lineWidth={2}
        routing={0.45}
        routingAxis="horizontal"
        end={0}
        opacity={0}
      />
      <ConnectionArrow
        key="arrow-s3-s4"
        ref={arrowS3S4Ref}
        from={() => [xS3() + NODE_W() / 2, yS3()]}
        to={() =>   [xS4() - NODE_W() / 2, yS4()]}
        stroke={PALETTE.rose}
        lineWidth={2}
        routing={0.45}
        routingAxis="horizontal"
        end={0}
        opacity={0}
      />

      {/* ── Badges "biais ✗" — centrés sur chaque flèche descendante ── */}
      {biasBadge(
        bias1Ref, bias1Txt,
        () => (xS1() + xS2()) / 2,
        () => (yS1() + yS2()) / 2 - vH() * 0.06,
        'bias-1',
      )}
      {biasBadge(
        bias2Ref, bias2Txt,
        () => (xS2() + xS3()) / 2,
        () => (yS2() + yS3()) / 2 - vH() * 0.06,
        'bias-2',
      )}
      {biasBadge(
        bias3Ref, bias3Txt,
        () => (xS3() + xS4()) / 2,
        () => (yS3() + yS4()) / 2 - vH() * 0.06,
        'bias-3',
      )}

      {/* ── Flèche montrant le fossé S4 → Objectif ── */}
      <ConnectionArrow
        key="gap-arrow"
        ref={gapArrowRef}
        from={() => [xS4() + NODE_W() / 2, yS4()]}
        to={() =>   [xObj() - NODE_W() / 2, yIdeal()]}
        stroke={PALETTE.rose}
        dashed
        lineWidth={2}
        end={0}
        opacity={0}
      />
      <Txt
        key="gap-label"
        ref={gapLabelRef}
        text="fossé"
        fill={PALETTE.rose}
        fontSize={() => vW() * 0.016}
        fontFamily={'JetBrains Mono, DM Mono, monospace'}
        fontWeight={700}
        x={() => (xS4() + xObj()) / 2 + vW() * 0.03}
        y={() => (yS4() + yIdeal()) / 2 - vH() * 0.04}
        opacity={0}
      />

      {/* ── Label DÉRIVE ── */}
      <Txt
        key="drift-label"
        ref={driftLabelRef}
        text="DÉRIVE"
        fill={PALETTE.rose}
        fontSize={() => vW() * 0.038}
        fontFamily={'Space Grotesk, DM Sans, sans-serif'}
        fontWeight={800}
        x={() => xS4() + vW() * 0.01}
        y={() => yS4() + vH() * 0.19}
        opacity={0}
      />
    </>,
  );

  // ── ANIMATION ─────────────────────────────────────────────────────────────────

  // intro — grille + trajectoire idéale + objectif
  yield* waitUntil('intro');
  yield* gridRef().opacity(0.10, 0.5);
  yield* idealRef().opacity(0.5, 0.4);
  yield* idealRef().end(1, 0.7, easeInOutCubic);
  yield* nodeObjRef().opacity(1, 0.35);

  // session-1 — sur la trajectoire, tout va bien
  yield* waitUntil('session-1');
  yield* nodeS1Ref().opacity(1, 0.3);

  // drift-1 — mauvaise suggestion → S1→S2 plonge, S2 apparaît plus bas
  yield* waitUntil('drift-1');
  yield* bias1Ref().opacity(1, 0.25);
  yield* waitFor(0.25);
  arrowS1S2Ref().opacity(1);
  yield* arrowS1S2Ref().end(1, 0.5, easeInOutCubic);
  yield* bias1Ref().opacity(0, 0.2);
  yield* nodeS2Ref().opacity(1, 0.3);

  // drift-2 — deuxième biais, dérive s'accentue
  yield* waitUntil('drift-2');
  yield* bias2Ref().opacity(1, 0.25);
  yield* waitFor(0.25);
  arrowS2S3Ref().opacity(1);
  yield* arrowS2S3Ref().end(1, 0.5, easeInOutCubic);
  yield* bias2Ref().opacity(0, 0.2);
  yield* nodeS3Ref().opacity(1, 0.3);

  // drift-3 — troisième biais, l'agent est franchement perdu
  yield* waitUntil('drift-3');
  yield* bias3Ref().opacity(1, 0.25);
  yield* waitFor(0.25);
  arrowS3S4Ref().opacity(1);
  yield* arrowS3S4Ref().end(1, 0.5, easeInOutCubic);
  yield* bias3Ref().opacity(0, 0.2);
  yield* nodeS4Ref().opacity(1, 0.3);

  // gap-reveal — fossé entre S4 et l'objectif + label DÉRIVE
  yield* waitUntil('gap-reveal');
  gapArrowRef().opacity(1);
  yield* all(
    gapArrowRef().end(1, 0.6, easeInOutCubic),
    gapLabelRef().opacity(1, 0.4),
  );
  yield* driftLabelRef().opacity(1, 0.4);

  // end
  yield* waitUntil('end');
  yield* all(
    gridRef().opacity(0, 0.4),
    idealRef().opacity(0, 0.4),
    nodeObjRef().opacity(0, 0.4),
    nodeS1Ref().opacity(0, 0.4),
    nodeS2Ref().opacity(0, 0.4),
    nodeS3Ref().opacity(0, 0.4),
    nodeS4Ref().opacity(0, 0.4),
    arrowS1S2Ref().opacity(0, 0.3),
    arrowS2S3Ref().opacity(0, 0.3),
    arrowS3S4Ref().opacity(0, 0.3),
    gapArrowRef().opacity(0, 0.3),
    gapLabelRef().opacity(0, 0.25),
    driftLabelRef().opacity(0, 0.35),
  );
  yield* waitFor(0.3);
});
