// litellm/pth-exec-chain.tsx
// CUT 3 — chaîne d'exécution complète
// pip install → Python démarre → .pth lu → subprocess spawné → collecte → chiffrement → exfil

import {makeScene2D} from '@motion-canvas/2d';
import {Grid, Layout, Rect, Txt, Line} from '@motion-canvas/2d/lib/components';
import {
  all,
  createRef,
  createSignal,
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
    rose:   '#FF3E6C',
    vert:   '#6DFF8A',
    jaune:  '#FFE14D',
    cream:  '#F9F9F6',
    ghost:  '#484F58',
    term:   '#161B22',
    blue:   '#58A6FF',
    danger: '#F85149',
  };

  // 7 boxes, evenly spaced
  // Centers: x ∈ {-0.375, -0.25, -0.125, 0, 0.125, 0.25, 0.375} (step 0.125)
  // Box width = 0.105 vW  →  gap between boxes = 0.125 - 0.105 = 0.02 vW
  const BX = [-0.375, -0.25, -0.125, 0.0, 0.125, 0.25, 0.375] as const;
  const BY = -0.04; // vertical center of chain row

  const BOX_W  = 0.105;
  const BOX_H  = 0.185;
  const GAP_X  = 0.125 - BOX_W; // 0.02  — room for arrow

  const STEPS = [
    { id: 0, label: 'pip install\nlitellm',     sub: 'déclencheur',        color: C.ghost,  glow: false },
    { id: 1, label: 'Python\ndémarre',           sub: 'site.py lancé',      color: C.blue,   glow: false },
    { id: 2, label: '.pth\nlu',                  sub: 'automatique',        color: C.jaune,  glow: false },
    { id: 3, label: 'subprocess\nspawné',         sub: 'premier signal',     color: C.rose,   glow: false },
    { id: 4, label: 'collecte\ndonnées',          sub: 'env, secrets…',      color: C.danger, glow: false },
    { id: 5, label: 'chiffrement',               sub: 'AES / base64',       color: C.danger, glow: false },
    { id: 6, label: 'exfil',                     sub: 'réseau sortant',     color: C.danger, glow: true  },
  ] as const;

  // ──────────────────────────────────────────────
  // REFS
  // ──────────────────────────────────────────────
  const grid     = createRef<Grid>();
  const title    = createRef<Txt>();
  const tagLine  = createRef<Txt>();

  // Chain boxes
  const b0 = createRef<Rect>(), b1 = createRef<Rect>(), b2 = createRef<Rect>();
  const b3 = createRef<Rect>(), b4 = createRef<Rect>(), b5 = createRef<Rect>(), b6 = createRef<Rect>();
  const boxes = [b0, b1, b2, b3, b4, b5, b6];

  // Arrows between boxes (6 arrows)
  const a01 = createRef<Line>(), a12 = createRef<Line>(), a23 = createRef<Line>();
  const a34 = createRef<Line>(), a45 = createRef<Line>(), a56 = createRef<Line>();
  const arrows = [a01, a12, a23, a34, a45, a56];

  // Phase divider labels
  const labelLegit   = createRef<Txt>();
  const labelMalware = createRef<Txt>();
  const dividerLine  = createRef<Line>();

  // Key insight box
  const insightBox   = createRef<Rect>();
  const insightLabel = createRef<Txt>();

  // Pivot highlight ring around .pth box
  const pivotRing    = createRef<Rect>();
  const exfilGlow    = createSignal(0.5);

  // ──────────────────────────────────────────────
  // SCENE TREE
  // ──────────────────────────────────────────────
  view.add(
    <Layout>
      <Rect width={'100%'} height={'100%'} fill={C.bg} zIndex={-2} />
      <Grid
        ref={grid}
        width={'100%'} height={'100%'}
        stroke={C.ghost} opacity={0} lineWidth={1}
        spacing={() => vW() * 0.055} zIndex={-1}
      />

      {/* ── TITLE ── */}
      <Txt
        ref={title}
        text="L'INSTALLATION EST L'ATTAQUE"
        fill={C.cream}
        fontSize={() => vW() * 0.038}
        fontWeight={800}
        fontFamily={'Space Grotesk'}
        y={() => vH() * -0.41}
        opacity={0}
      />
      <Txt
        ref={tagLine}
        text="tu n'as pas besoin de lancer ton projet"
        fill={C.ghost}
        fontSize={() => vW() * 0.017}
        fontFamily={'DM Mono, monospace'}
        y={() => vH() * -0.335}
        opacity={0}
      />

      {/* ══════════════ CHAIN BOXES ══════════════ */}

      {/* 0 — pip install */}
      <Rect
        ref={b0}
        x={() => vW() * BX[0]} y={() => vH() * BY}
        width={() => vW() * BOX_W} height={() => vH() * BOX_H}
        fill={`${C.ghost}14`} stroke={C.ghost} lineWidth={2}
        radius={() => vW() * 0.005} opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={8}
      >
        <Txt text="pip install" fill={C.ghost} fontSize={() => vW() * 0.014} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt text="litellm" fill={C.ghost} fontSize={() => vW() * 0.014} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt text="déclencheur" fill={C.ghost} fontSize={() => vW() * 0.011} fontFamily={'DM Mono, monospace'} opacity={0.6} />
      </Rect>

      {/* 1 — Python démarre */}
      <Rect
        ref={b1}
        x={() => vW() * BX[1]} y={() => vH() * BY}
        width={() => vW() * BOX_W} height={() => vH() * BOX_H}
        fill={`${C.blue}14`} stroke={C.blue} lineWidth={2}
        radius={() => vW() * 0.005} opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={8}
      >
        <Txt text="Python" fill={C.blue} fontSize={() => vW() * 0.014} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt text="démarre" fill={C.blue} fontSize={() => vW() * 0.014} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt text="site.py lancé" fill={C.blue} fontSize={() => vW() * 0.011} fontFamily={'DM Mono, monospace'} opacity={0.6} />
      </Rect>

      {/* 2 — .pth lu */}
      <Rect
        ref={b2}
        x={() => vW() * BX[2]} y={() => vH() * BY}
        width={() => vW() * BOX_W} height={() => vH() * BOX_H}
        fill={`${C.jaune}14`} stroke={C.jaune} lineWidth={2}
        radius={() => vW() * 0.005} opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={8}
      >
        <Txt text=".pth" fill={C.jaune} fontSize={() => vW() * 0.018} fontWeight={800} fontFamily={'Space Grotesk'} />
        <Txt text="lu" fill={C.jaune} fontSize={() => vW() * 0.014} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt text="automatique" fill={C.jaune} fontSize={() => vW() * 0.011} fontFamily={'DM Mono, monospace'} opacity={0.6} />
      </Rect>

      {/* pivot highlight ring */}
      <Rect
        ref={pivotRing}
        x={() => vW() * BX[2]} y={() => vH() * BY}
        width={() => vW() * (BOX_W + 0.015)} height={() => vH() * (BOX_H + 0.025)}
        fill={'#00000000'} stroke={C.jaune} lineWidth={3}
        radius={() => vW() * 0.008} opacity={0}
        shadowColor={C.jaune} shadowBlur={() => vW() * 0.025}
      />

      {/* 3 — subprocess spawné */}
      <Rect
        ref={b3}
        x={() => vW() * BX[3]} y={() => vH() * BY}
        width={() => vW() * BOX_W} height={() => vH() * BOX_H}
        fill={`${C.rose}14`} stroke={C.rose} lineWidth={2}
        radius={() => vW() * 0.005} opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={8}
      >
        <Txt text="subprocess" fill={C.rose} fontSize={() => vW() * 0.014} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt text="spawné" fill={C.rose} fontSize={() => vW() * 0.014} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt text="premier signal" fill={C.rose} fontSize={() => vW() * 0.011} fontFamily={'DM Mono, monospace'} opacity={0.6} />
      </Rect>

      {/* 4 — collecte */}
      <Rect
        ref={b4}
        x={() => vW() * BX[4]} y={() => vH() * BY}
        width={() => vW() * BOX_W} height={() => vH() * BOX_H}
        fill={`${C.danger}14`} stroke={C.danger} lineWidth={2}
        radius={() => vW() * 0.005} opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={8}
      >
        <Txt text="collecte" fill={C.danger} fontSize={() => vW() * 0.014} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt text="données" fill={C.danger} fontSize={() => vW() * 0.014} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt text="env, secrets…" fill={C.danger} fontSize={() => vW() * 0.011} fontFamily={'DM Mono, monospace'} opacity={0.6} />
      </Rect>

      {/* 5 — chiffrement */}
      <Rect
        ref={b5}
        x={() => vW() * BX[5]} y={() => vH() * BY}
        width={() => vW() * BOX_W} height={() => vH() * BOX_H}
        fill={`${C.danger}14`} stroke={C.danger} lineWidth={2}
        radius={() => vW() * 0.005} opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={8}
      >
        <Txt text="chiffrement" fill={C.danger} fontSize={() => vW() * 0.014} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt text="AES / base64" fill={C.danger} fontSize={() => vW() * 0.011} fontFamily={'DM Mono, monospace'} opacity={0.6} />
      </Rect>

      {/* 6 — exfil */}
      <Rect
        ref={b6}
        x={() => vW() * BX[6]} y={() => vH() * BY}
        width={() => vW() * BOX_W} height={() => vH() * BOX_H}
        fill={`${C.danger}14`} stroke={C.danger} lineWidth={3}
        radius={() => vW() * 0.005} opacity={0}
        shadowColor={C.danger} shadowBlur={() => exfilGlow() * vW() * 0.03}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={8}
      >
        <Txt text="exfil" fill={C.danger} fontSize={() => vW() * 0.02} fontWeight={800} fontFamily={'Space Grotesk'} />
        <Txt text="réseau sortant" fill={C.danger} fontSize={() => vW() * 0.011} fontFamily={'DM Mono, monospace'} opacity={0.6} />
      </Rect>

      {/* ══════════════ ARROWS ══════════════ */}
      {/* Arrow helper: right-edge of box[i] to left-edge of box[i+1] */}
      {/* Right edge of box[i] = BX[i] + BOX_W/2 = BX[i] + 0.0525 */}
      {/* Left edge of box[i+1] = BX[i+1] - 0.0525 */}

      <Line
        ref={a01} stroke={C.ghost} lineWidth={2} opacity={0}
        endArrow arrowSize={8}
        points={() => [
          [vW() * (BX[0] + BOX_W / 2), vH() * BY],
          [vW() * (BX[1] - BOX_W / 2), vH() * BY],
        ]}
        end={0}
      />
      <Line
        ref={a12} stroke={C.blue} lineWidth={2} opacity={0}
        endArrow arrowSize={8}
        points={() => [
          [vW() * (BX[1] + BOX_W / 2), vH() * BY],
          [vW() * (BX[2] - BOX_W / 2), vH() * BY],
        ]}
        end={0}
      />
      <Line
        ref={a23} stroke={C.jaune} lineWidth={2} opacity={0}
        endArrow arrowSize={8}
        points={() => [
          [vW() * (BX[2] + BOX_W / 2), vH() * BY],
          [vW() * (BX[3] - BOX_W / 2), vH() * BY],
        ]}
        end={0}
      />
      <Line
        ref={a34} stroke={C.rose} lineWidth={2} opacity={0}
        endArrow arrowSize={8}
        points={() => [
          [vW() * (BX[3] + BOX_W / 2), vH() * BY],
          [vW() * (BX[4] - BOX_W / 2), vH() * BY],
        ]}
        end={0}
      />
      <Line
        ref={a45} stroke={C.danger} lineWidth={2} opacity={0}
        endArrow arrowSize={8}
        points={() => [
          [vW() * (BX[4] + BOX_W / 2), vH() * BY],
          [vW() * (BX[5] - BOX_W / 2), vH() * BY],
        ]}
        end={0}
      />
      <Line
        ref={a56} stroke={C.danger} lineWidth={2} opacity={0}
        endArrow arrowSize={8}
        points={() => [
          [vW() * (BX[5] + BOX_W / 2), vH() * BY],
          [vW() * (BX[6] - BOX_W / 2), vH() * BY],
        ]}
        end={0}
      />

      {/* ══════════════ PHASE DIVIDER ══════════════ */}
      {/* Vertical dashed line between box 2 (.pth) and box 3 (subprocess) */}
      <Line
        ref={dividerLine}
        stroke={C.ghost} lineWidth={1} lineDash={[8, 5]} opacity={0}
        points={() => [
          [vW() * ((BX[2] + BX[3]) / 2), vH() * -0.26],
          [vW() * ((BX[2] + BX[3]) / 2), vH() * 0.21],
        ]}
      />
      <Txt
        ref={labelLegit}
        text="légitime"
        fill={C.ghost}
        fontSize={() => vW() * 0.013}
        fontFamily={'DM Mono, monospace'}
        x={() => vW() * ((BX[0] + BX[2]) / 2)}
        y={() => vH() * -0.23}
        opacity={0}
      />
      <Txt
        ref={labelMalware}
        text="malveillant"
        fill={C.danger}
        fontSize={() => vW() * 0.013}
        fontFamily={'DM Mono, monospace'}
        x={() => vW() * ((BX[3] + BX[6]) / 2)}
        y={() => vH() * -0.23}
        opacity={0}
      />

      {/* ══════════════ KEY INSIGHT ══════════════ */}
      <Rect
        ref={insightBox}
        x={0} y={() => vH() * 0.385}
        width={() => vW() * 0.6} height={() => vH() * 0.09}
        fill={`${C.danger}10`} stroke={C.danger} lineWidth={2}
        radius={() => vW() * 0.006} opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={5}
      >
        <Txt
          ref={insightLabel}
          text="installer = exécuter — tu n'as pas besoin de lancer ton projet"
          fill={C.danger}
          fontSize={() => vW() * 0.017}
          fontWeight={600}
          fontFamily={'Space Grotesk'}
        />
      </Rect>
    </Layout>,
  );

  // ──────────────────────────────────────────────
  // ANIMATIONS
  // ──────────────────────────────────────────────

  // ─── Intro ───
  yield* waitUntil('intro');
  yield* grid().opacity(0.12, 0.8);
  yield* all(
    title().opacity(1, 0.55),
    tagLine().opacity(1, 0.45),
  );
  yield* waitFor(0.6);

  // ─── Reveal chain step by step ───
  yield* waitUntil('chainReveal');

  // Step 0 — pip install
  yield* b0().opacity(1, 0.4);
  yield* waitFor(0.3);

  // Step 1 — Python démarre
  yield* a01().opacity(1, 0.1);
  yield* a01().end(1, 0.3, easeOutCubic);
  yield* b1().opacity(1, 0.4);
  yield* waitFor(0.25);

  // Step 2 — .pth lu
  yield* a12().opacity(1, 0.1);
  yield* a12().end(1, 0.3, easeOutCubic);
  yield* b2().opacity(1, 0.4);
  yield* waitFor(0.35);

  // Highlight the .pth pivot
  yield* waitUntil('pthPivot');
  yield* pivotRing().opacity(1, 0.4);
  yield* waitFor(0.8);
  yield* pivotRing().opacity(0, 0.3);

  // Step 3 — subprocess spawné (danger begins)
  yield* a23().opacity(1, 0.1);
  yield* a23().end(1, 0.3, easeOutCubic);
  yield* b3().opacity(1, 0.4);
  yield* waitFor(0.25);

  // Step 4 — collecte
  yield* a34().opacity(1, 0.1);
  yield* a34().end(1, 0.25, easeOutCubic);
  yield* b4().opacity(1, 0.35);
  yield* waitFor(0.2);

  // Step 5 — chiffrement
  yield* a45().opacity(1, 0.1);
  yield* a45().end(1, 0.25, easeOutCubic);
  yield* b5().opacity(1, 0.35);
  yield* waitFor(0.2);

  // Step 6 — exfil (dramatic)
  yield* a56().opacity(1, 0.1);
  yield* a56().end(1, 0.25, easeOutCubic);
  yield* b6().opacity(1, 0.45);
  // Exfil glow pulse
  yield* exfilGlow(2.2, 0.3, easeOutCubic);
  yield* exfilGlow(0.8, 0.5, easeInOutCubic);
  yield* waitFor(0.5);

  // ─── Phase divider + labels ───
  yield* waitUntil('phaseLabels');
  yield* all(
    dividerLine().opacity(0.5, 0.4),
    labelLegit().opacity(0.7, 0.4),
    labelMalware().opacity(1, 0.4),
  );
  yield* waitFor(1.2);

  // ─── Key insight box ───
  yield* waitUntil('insight');
  yield* insightBox().opacity(1, 0.5);
  yield* waitFor(2.5);

  // ─── End ───
  yield* waitUntil('endScene');
  yield* all(
    grid().opacity(0, 0.5),
    title().opacity(0, 0.5),
    tagLine().opacity(0, 0.4),
    b0().opacity(0, 0.4), b1().opacity(0, 0.4), b2().opacity(0, 0.4),
    b3().opacity(0, 0.4), b4().opacity(0, 0.4), b5().opacity(0, 0.4), b6().opacity(0, 0.4),
    a01().opacity(0, 0.3), a12().opacity(0, 0.3), a23().opacity(0, 0.3),
    a34().opacity(0, 0.3), a45().opacity(0, 0.3), a56().opacity(0, 0.3),
    dividerLine().opacity(0, 0.3),
    labelLegit().opacity(0, 0.3),
    labelMalware().opacity(0, 0.3),
    insightBox().opacity(0, 0.4),
  );
});
