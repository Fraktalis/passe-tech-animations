// litellm/teampcp-timeline.tsx
// Frise chronologique — Campagne TeamPCP · fév–mars 2024
// 4 jalons : hackerbot-claw (27/02) → trivy-action (19/03)
//           → Checkmarx KICS (23/03) → litellm Phase 09 (24/03)
// Le 24/03 se divise en deux vecteurs simultanés : 1.82.7 / 1.82.8

import {makeScene2D} from '@motion-canvas/2d';
import {Circle, Grid, Layout, Line, Rect, Txt} from '@motion-canvas/2d/lib/components';
import {
  all,
  createRef,
  easeInOutCubic,
  easeOutCubic,
  sequence,
  waitFor,
  waitUntil,
} from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  const C = {
    bg:     '#0D1117',
    panel:  '#161B22',
    border: '#30363D',
    ghost:  '#484F58',
    cream:  '#F9F9F6',
    rose:   '#FF3E6C',
    vert:   '#6DFF8A',
    jaune:  '#FFE14D',
    blue:   '#58A6FF',
    danger: '#F85149',
  };

  // ── Layout constants (vW / vH fractions) ───────────────────────────────────
  // Spine
  const SPINE_X = -0.20;   // center of the vertical spine

  // Date labels — centered to the left of the spine
  const DATE_X  = -0.33;

  // Cards — left edge just past the spine, widths proportional
  const CARD_LEFT        = SPINE_X + 0.03; // = -0.17
  const FULL_CARD_W      = 0.44;
  const FULL_CARD_CX     = CARD_LEFT + FULL_CARD_W / 2;     // ≈  0.05

  const SPLIT_CARD_W     = 0.215;
  const SPLIT_CARD_GAP   = 0.01;
  const SPLIT_CARD_A_CX  = CARD_LEFT + SPLIT_CARD_W / 2;                              // ≈ -0.0625
  const SPLIT_CARD_B_CX  = CARD_LEFT + SPLIT_CARD_W + SPLIT_CARD_GAP + SPLIT_CARD_W / 2; // ≈  0.1625

  // Y positions for each event (vH fraction)
  const EVENT_Y = [-0.25, -0.08, 0.09, 0.26] as const;

  // Spine endpoints
  const SPINE_TOP    = EVENT_Y[0] - 0.04;
  const SPINE_BOTTOM = EVENT_Y[3] + 0.04;

  // Card heights
  const CARD_H_STANDARD = 0.115;
  const CARD_H_SPLIT    = 0.145;

  // ── Refs ───────────────────────────────────────────────────────────────────
  const gridRef    = createRef<Grid>();
  const titleRef   = createRef<Txt>();
  const subtitleRef = createRef<Txt>();
  const spineRef   = createRef<Line>();

  // Spine nodes
  const nodeRef0 = createRef<Circle>();
  const nodeRef1 = createRef<Circle>();
  const nodeRef2 = createRef<Circle>();
  const nodeRef3 = createRef<Circle>();

  // Date labels
  const dateLbl0 = createRef<Txt>();
  const dateLbl1 = createRef<Txt>();
  const dateLbl2 = createRef<Txt>();
  const dateLbl3 = createRef<Txt>();

  // Phase badge (next to 24 mars date)
  const phaseBadgeRef = createRef<Rect>();

  // Event cards
  const eventCard0   = createRef<Rect>();
  const eventCard1   = createRef<Rect>();
  const eventCard2   = createRef<Rect>();
  const splitCard3a  = createRef<Rect>();
  const splitCard3b  = createRef<Rect>();

  // ── Scene tree ─────────────────────────────────────────────────────────────
  view.add(
    <Layout key="root">

      {/* Background */}
      <Rect key="bg" width={'100%'} height={'100%'} fill={C.bg} zIndex={-2} />
      <Grid
        key="grid"
        ref={gridRef}
        width={'100%'} height={'100%'}
        stroke={C.ghost} lineWidth={1} opacity={0}
        spacing={() => vW() * 0.055} zIndex={-1}
      />

      {/* ── Title block ── */}
      <Txt
        key="title"
        ref={titleRef}
        text="CAMPAGNE TEAMPCP"
        fill={C.rose}
        fontSize={() => vW() * 0.022}
        fontFamily={'Space Grotesk'}
        fontWeight={800}
        x={0}
        y={() => vH() * -0.43}
        opacity={0}
      />
      <Txt
        key="subtitle"
        ref={subtitleRef}
        text="février – mars 2024  ·  9 phases documentées  ·  Aikido Security"
        fill={C.ghost}
        fontSize={() => vW() * 0.012}
        fontFamily={'DM Mono, monospace'}
        x={0}
        y={() => vH() * -0.385}
        opacity={0}
      />

      {/* ── Vertical spine ── */}
      <Line
        key="spine"
        ref={spineRef}
        points={() => [
          [vW() * SPINE_X, vH() * SPINE_TOP],
          [vW() * SPINE_X, vH() * SPINE_BOTTOM],
        ]}
        stroke={C.ghost}
        lineWidth={2}
        end={0}
      />

      {/* ══════════════════════════════════════════════════════════════════
          EVENT 0 — 27 FÉV  ·  hackerbot-claw / Aqua Security Trivy
      ══════════════════════════════════════════════════════════════════ */}
      <Circle
        key="node-27fev"
        ref={nodeRef0}
        x={() => vW() * SPINE_X}
        y={() => vH() * EVENT_Y[0]}
        width={() => vW() * 0.018}
        height={() => vW() * 0.018}
        fill={C.jaune}
        opacity={0}
      />
      <Txt
        key="date-27fev"
        ref={dateLbl0}
        text="27 FÉV"
        fill={C.jaune}
        fontSize={() => vW() * 0.012}
        fontFamily={'DM Mono, monospace'}
        fontWeight={700}
        x={() => vW() * DATE_X}
        y={() => vH() * EVENT_Y[0]}
        opacity={0}
      />

      {/* Card 0 */}
      <Rect
        key="card-27fev"
        ref={eventCard0}
        x={() => vW() * FULL_CARD_CX}
        y={() => vH() * EVENT_Y[0]}
        width={() => vW() * FULL_CARD_W}
        height={() => vH() * CARD_H_STANDARD}
        fill={C.panel}
        stroke={C.jaune}
        lineWidth={2}
        radius={() => vW() * 0.005}
        opacity={0}
        layout direction={'column'}
        alignItems={'start'} justifyContent={'center'}
        padding={[0, 24]}
        gap={() => vH() * 0.007}
      >
        <Rect
          key="tag-27fev"
          fill={`${C.jaune}20`} stroke={C.jaune} lineWidth={1}
          radius={4} padding={[3, 8]}
        >
          <Txt
            key="tag-27fev-txt"
            text="AGENT IA AUTONOME"
            fill={C.jaune}
            fontSize={() => vW() * 0.0085}
            fontFamily={'DM Mono, monospace'}
            fontWeight={700}
          />
        </Rect>
        <Txt
          key="title-27fev"
          text="hackerbot-claw · Aqua Security / Trivy"
          fill={C.cream}
          fontSize={() => vW() * 0.013}
          fontFamily={'Space Grotesk'}
          fontWeight={700}
        />
        <Txt
          key="line1-27fev"
          text="Workflow GitHub mal configuré → PAT volé"
          fill={C.ghost}
          fontSize={() => vW() * 0.0105}
          fontFamily={'DM Mono, monospace'}
        />
        <Txt
          key="line2-27fev"
          text="178 releases GitHub supprimées"
          fill={C.ghost}
          fontSize={() => vW() * 0.0105}
          fontFamily={'DM Mono, monospace'}
        />
      </Rect>

      {/* ══════════════════════════════════════════════════════════════════
          EVENT 1 — 19 MARS  ·  trivy-action
      ══════════════════════════════════════════════════════════════════ */}
      <Circle
        key="node-19mars"
        ref={nodeRef1}
        x={() => vW() * SPINE_X}
        y={() => vH() * EVENT_Y[1]}
        width={() => vW() * 0.018}
        height={() => vW() * 0.018}
        fill={C.rose}
        opacity={0}
      />
      <Txt
        key="date-19mars"
        ref={dateLbl1}
        text="19 MARS"
        fill={C.rose}
        fontSize={() => vW() * 0.012}
        fontFamily={'DM Mono, monospace'}
        fontWeight={700}
        x={() => vW() * DATE_X}
        y={() => vH() * EVENT_Y[1]}
        opacity={0}
      />

      {/* Card 1 */}
      <Rect
        key="card-19mars"
        ref={eventCard1}
        x={() => vW() * FULL_CARD_CX}
        y={() => vH() * EVENT_Y[1]}
        width={() => vW() * FULL_CARD_W}
        height={() => vH() * CARD_H_STANDARD}
        fill={C.panel}
        stroke={C.rose}
        lineWidth={2}
        radius={() => vW() * 0.005}
        opacity={0}
        layout direction={'column'}
        alignItems={'start'} justifyContent={'center'}
        padding={[0, 24]}
        gap={() => vH() * 0.007}
      >
        <Txt
          key="title-19mars"
          text="trivy-action · 76 / 77 tags écrasés"
          fill={C.cream}
          fontSize={() => vW() * 0.013}
          fontFamily={'Space Grotesk'}
          fontWeight={700}
        />
        <Txt
          key="line1-19mars"
          text="Credentials survivants d'une rotation incomplète"
          fill={C.ghost}
          fontSize={() => vW() * 0.0105}
          fontFamily={'DM Mono, monospace'}
        />
        <Txt
          key="line2-19mars"
          text="Tags overwrite → commits malveillants injectés"
          fill={C.ghost}
          fontSize={() => vW() * 0.0105}
          fontFamily={'DM Mono, monospace'}
        />
      </Rect>

      {/* ══════════════════════════════════════════════════════════════════
          EVENT 2 — 23 MARS  ·  Checkmarx KICS
      ══════════════════════════════════════════════════════════════════ */}
      <Circle
        key="node-23mars"
        ref={nodeRef2}
        x={() => vW() * SPINE_X}
        y={() => vH() * EVENT_Y[2]}
        width={() => vW() * 0.018}
        height={() => vW() * 0.018}
        fill={C.rose}
        opacity={0}
      />
      <Txt
        key="date-23mars"
        ref={dateLbl2}
        text="23 MARS"
        fill={C.rose}
        fontSize={() => vW() * 0.012}
        fontFamily={'DM Mono, monospace'}
        fontWeight={700}
        x={() => vW() * DATE_X}
        y={() => vH() * EVENT_Y[2]}
        opacity={0}
      />

      {/* Card 2 */}
      <Rect
        key="card-23mars"
        ref={eventCard2}
        x={() => vW() * FULL_CARD_CX}
        y={() => vH() * EVENT_Y[2]}
        width={() => vW() * FULL_CARD_W}
        height={() => vH() * CARD_H_STANDARD}
        fill={C.panel}
        stroke={C.rose}
        lineWidth={2}
        radius={() => vW() * 0.005}
        opacity={0}
        layout direction={'column'}
        alignItems={'start'} justifyContent={'center'}
        padding={[0, 24]}
        gap={() => vH() * 0.007}
      >
        <Txt
          key="title-23mars"
          text="Checkmarx KICS"
          fill={C.cream}
          fontSize={() => vW() * 0.013}
          fontFamily={'Space Grotesk'}
          fontWeight={700}
        />
        <Txt
          key="line1-23mars"
          text="Même infrastructure C2 · même méthode d'injection"
          fill={C.ghost}
          fontSize={() => vW() * 0.0105}
          fontFamily={'DM Mono, monospace'}
        />
        <Txt
          key="line2-23mars"
          text="C2 : checkmarx.zone"
          fill={C.ghost}
          fontSize={() => vW() * 0.0105}
          fontFamily={'DM Mono, monospace'}
        />
      </Rect>

      {/* ══════════════════════════════════════════════════════════════════
          EVENT 3 — 24 MARS  ·  litellm  ·  Phase 09
          Split : 1.82.7 (silencieuse) + 1.82.8 (bruyante)
      ══════════════════════════════════════════════════════════════════ */}
      <Circle
        key="node-24mars"
        ref={nodeRef3}
        x={() => vW() * SPINE_X}
        y={() => vH() * EVENT_Y[3]}
        width={() => vW() * 0.022}
        height={() => vW() * 0.022}
        fill={C.danger}
        opacity={0}
      />
      <Txt
        key="date-24mars"
        ref={dateLbl3}
        text="24 MARS"
        fill={C.danger}
        fontSize={() => vW() * 0.012}
        fontFamily={'DM Mono, monospace'}
        fontWeight={700}
        x={() => vW() * DATE_X}
        y={() => vH() * (EVENT_Y[3] - 0.03)}
        opacity={0}
      />

      {/* Phase 09 badge — sous la date */}
      <Rect
        key="phase-badge"
        ref={phaseBadgeRef}
        x={() => vW() * DATE_X}
        y={() => vH() * (EVENT_Y[3] + 0.025)}
        width={() => vW() * 0.085}
        height={() => vH() * 0.036}
        fill={`${C.danger}18`}
        stroke={C.danger}
        lineWidth={1}
        radius={() => vW() * 0.003}
        opacity={0}
        layout direction={'row'}
        alignItems={'center'} justifyContent={'center'}
      >
        <Txt
          key="phase-badge-txt"
          text="PHASE 09"
          fill={C.danger}
          fontSize={() => vW() * 0.009}
          fontFamily={'DM Mono, monospace'}
          fontWeight={700}
        />
      </Rect>

      {/* Split card A — litellm 1.82.7 — plus silencieuse */}
      <Rect
        key="card-1827"
        ref={splitCard3a}
        x={() => vW() * SPLIT_CARD_A_CX}
        y={() => vH() * EVENT_Y[3]}
        width={() => vW() * SPLIT_CARD_W}
        height={() => vH() * CARD_H_SPLIT}
        fill={C.panel}
        stroke={C.jaune}
        lineWidth={2}
        radius={() => vW() * 0.005}
        opacity={0}
        layout direction={'column'}
        alignItems={'start'} justifyContent={'center'}
        padding={[0, 20]}
        gap={() => vH() * 0.007}
      >
        <Rect
          key="tag-1827"
          fill={`${C.jaune}20`} stroke={C.jaune} lineWidth={1}
          radius={4} padding={[3, 8]}
        >
          <Txt
            key="tag-1827-txt"
            text="SILENCIEUSE"
            fill={C.jaune}
            fontSize={() => vW() * 0.0085}
            fontFamily={'DM Mono, monospace'}
            fontWeight={700}
          />
        </Rect>
        <Txt
          key="title-1827"
          text="litellm 1.82.7"
          fill={C.cream}
          fontSize={() => vW() * 0.013}
          fontFamily={'Space Grotesk'}
          fontWeight={700}
        />
        <Txt
          key="line1-1827"
          text="inject → proxy_server.py"
          fill={C.ghost}
          fontSize={() => vW() * 0.0095}
          fontFamily={'DM Mono, monospace'}
        />
        <Txt
          key="line2-1827"
          text="si litellm.proxy importé"
          fill={C.ghost}
          fontSize={() => vW() * 0.0095}
          fontFamily={'DM Mono, monospace'}
        />
        <Txt
          key="line3-1827"
          text="C2 : checkmarx.zone"
          fill={C.jaune}
          fontSize={() => vW() * 0.0095}
          fontFamily={'DM Mono, monospace'}
        />
      </Rect>

      {/* Split card B — litellm 1.82.8 — bruyante */}
      <Rect
        key="card-1828"
        ref={splitCard3b}
        x={() => vW() * SPLIT_CARD_B_CX}
        y={() => vH() * EVENT_Y[3]}
        width={() => vW() * SPLIT_CARD_W}
        height={() => vH() * CARD_H_SPLIT}
        fill={C.panel}
        stroke={C.danger}
        lineWidth={2}
        radius={() => vW() * 0.005}
        opacity={0}
        layout direction={'column'}
        alignItems={'start'} justifyContent={'center'}
        padding={[0, 20]}
        gap={() => vH() * 0.007}
      >
        <Rect
          key="tag-1828"
          fill={`${C.danger}20`} stroke={C.danger} lineWidth={1}
          radius={4} padding={[3, 8]}
        >
          <Txt
            key="tag-1828-txt"
            text="+13 MINUTES"
            fill={C.danger}
            fontSize={() => vW() * 0.0085}
            fontFamily={'DM Mono, monospace'}
            fontWeight={700}
          />
        </Rect>
        <Txt
          key="title-1828"
          text="litellm 1.82.8"
          fill={C.cream}
          fontSize={() => vW() * 0.013}
          fontFamily={'Space Grotesk'}
          fontWeight={700}
        />
        <Txt
          key="line1-1828"
          text=".pth + fork bomb"
          fill={C.ghost}
          fontSize={() => vW() * 0.0095}
          fontFamily={'DM Mono, monospace'}
        />
        <Txt
          key="line2-1828"
          text="crash machine garanti"
          fill={C.ghost}
          fontSize={() => vW() * 0.0095}
          fontFamily={'DM Mono, monospace'}
        />
        <Txt
          key="line3-1828"
          text="C2 : models.litellm.cloud"
          fill={C.danger}
          fontSize={() => vW() * 0.0095}
          fontFamily={'DM Mono, monospace'}
        />
      </Rect>

    </Layout>,
  );

  // ── Animations ─────────────────────────────────────────────────────────────

  yield* waitUntil('intro');
  yield* all(
    gridRef().opacity(0.12, 0.8),
    titleRef().opacity(1, 0.5),
    subtitleRef().opacity(1, 0.45),
  );

  // Spine draws from top to bottom
  yield* waitUntil('spine');
  yield* spineRef().end(1, 0.9, easeInOutCubic);

  // ── Event 0 : 27 février ───────────────────────────────────────────────────
  yield* waitUntil('event1');
  yield* all(
    nodeRef0().opacity(1, 0.25),
    dateLbl0().opacity(1, 0.3),
  );
  yield* eventCard0().opacity(1, 0.4);

  // ── Event 1 : 19 mars ─────────────────────────────────────────────────────
  yield* waitUntil('event2');
  yield* all(
    nodeRef1().opacity(1, 0.25),
    dateLbl1().opacity(1, 0.3),
  );
  yield* eventCard1().opacity(1, 0.4);

  // ── Event 2 : 23 mars ─────────────────────────────────────────────────────
  yield* waitUntil('event3');
  yield* all(
    nodeRef2().opacity(1, 0.25),
    dateLbl2().opacity(1, 0.3),
  );
  yield* eventCard2().opacity(1, 0.4);

  // ── Event 3 : 24 mars — split litellm ────────────────────────────────────
  yield* waitUntil('event4');
  yield* all(
    nodeRef3().opacity(1, 0.25),
    dateLbl3().opacity(1, 0.3),
    phaseBadgeRef().opacity(1, 0.3),
  );
  // Pulse — met en valeur la criticité
  yield* nodeRef3().scale(1.45, 0.22, easeOutCubic);
  yield* nodeRef3().scale(1.0, 0.18, easeOutCubic);
  // Les deux vecteurs apparaissent en séquence rapide
  yield* sequence(
    0.1,
    splitCard3a().opacity(1, 0.4),
    splitCard3b().opacity(1, 0.4),
  );

  // ── End ────────────────────────────────────────────────────────────────────
  yield* waitUntil('endScene');
  yield* all(
    gridRef().opacity(0, 0.5),
    titleRef().opacity(0, 0.4),
    subtitleRef().opacity(0, 0.4),
    spineRef().opacity(0, 0.5),
    nodeRef0().opacity(0, 0.3),
    nodeRef1().opacity(0, 0.3),
    nodeRef2().opacity(0, 0.3),
    nodeRef3().opacity(0, 0.3),
    dateLbl0().opacity(0, 0.3),
    dateLbl1().opacity(0, 0.3),
    dateLbl2().opacity(0, 0.3),
    dateLbl3().opacity(0, 0.3),
    phaseBadgeRef().opacity(0, 0.3),
    eventCard0().opacity(0, 0.4),
    eventCard1().opacity(0, 0.4),
    eventCard2().opacity(0, 0.4),
    splitCard3a().opacity(0, 0.4),
    splitCard3b().opacity(0, 0.4),
  );
});
