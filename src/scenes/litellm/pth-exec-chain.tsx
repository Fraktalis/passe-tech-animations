// litellm/pth-exec-chain.tsx
// CUT 3 - chaîne d'exécution complète
// pip install → Python démarre → .pth lu → fork git-style
//   main row  : terminal output visible → stop
//   child row : subprocess spawné → collecte → chiffrement → exfil

import {makeScene2D} from '@motion-canvas/2d';
import {Grid, Layout, Rect, Txt, Line} from '@motion-canvas/2d/lib/components';
import {
  all,
  createRef,
  createSignal,
  easeInOutCubic,
  easeOutCubic,
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

  // ── Layout ──────────────────────────────────────
  // Main row (processus pip - visible) : boxes 0, 1, 2  +  terminal block
  const Y_MAIN  = -0.15;
  const MX      = [-0.375, -0.25, -0.125] as const; // b0 pip, b1 python, b2 .pth

  // Child row (sous-processus malveillant) : boxes 3, 4, 5, 6
  const Y_CHILD = 0.14;
  const CX      = [0.0, 0.125, 0.25, 0.375] as const;

  const BOX_W = 0.105;
  const BOX_H = 0.165;

  // Terminal output block (end of main row)
  const TERM_X = 0.04;
  const TERM_W = 0.155;

  // ── Refs ─────────────────────────────────────────
  const grid     = createRef<Grid>();
  const title    = createRef<Txt>();
  const tagLine  = createRef<Txt>();

  const b0 = createRef<Rect>(), b1 = createRef<Rect>(), b2 = createRef<Rect>();
  const b3 = createRef<Rect>(), b4 = createRef<Rect>();
  const b5 = createRef<Rect>(), b6 = createRef<Rect>();

  const a01      = createRef<Line>(), a12      = createRef<Line>();
  const a23_main = createRef<Line>(); // b2 → termBlock  (dashed, main line)
  const a_fork   = createRef<Line>(); // b2 bottom → L-shape → b3  (fork)
  const a34      = createRef<Line>(), a45 = createRef<Line>(), a56 = createRef<Line>();

  const termBlock     = createRef<Rect>();
  const labelMainRow  = createRef<Txt>();
  const labelChildRow = createRef<Txt>();
  const pivotRing     = createRef<Rect>();
  const exfilGlow     = createSignal(0.5);
  const insightBox    = createRef<Rect>();

  // ── Scene tree ───────────────────────────────────
  view.add(
    <Layout>
      <Rect width={'100%'} height={'100%'} fill={C.bg} zIndex={-2} />
      <Grid
        ref={grid}
        width={'100%'} height={'100%'}
        stroke={C.ghost} opacity={0} lineWidth={1}
        spacing={() => vW() * 0.055} zIndex={-1}
      />

      {/* ── Title ── */}
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
        y={() => vH() * -0.345}
        opacity={0}
      />

      {/* ══ MAIN ROW ══ */}

      {/* 0 - pip install */}
      <Rect
        ref={b0}
        x={() => vW() * MX[0]} y={() => vH() * Y_MAIN}
        width={() => vW() * BOX_W} height={() => vH() * BOX_H}
        fill={`${C.ghost}14`} stroke={C.ghost} lineWidth={2}
        radius={() => vW() * 0.005} opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={8}
      >
        <Txt text="pip install" fill={C.ghost} fontSize={() => vW() * 0.014} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt text="litellm"     fill={C.ghost} fontSize={() => vW() * 0.014} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt text="déclencheur" fill={C.ghost} fontSize={() => vW() * 0.011} fontFamily={'DM Mono, monospace'} opacity={0.6} />
      </Rect>

      {/* 1 - Python démarre */}
      <Rect
        ref={b1}
        x={() => vW() * MX[1]} y={() => vH() * Y_MAIN}
        width={() => vW() * BOX_W} height={() => vH() * BOX_H}
        fill={`${C.blue}14`} stroke={C.blue} lineWidth={2}
        radius={() => vW() * 0.005} opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={8}
      >
        <Txt text="Python"       fill={C.blue} fontSize={() => vW() * 0.014} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt text="démarre"      fill={C.blue} fontSize={() => vW() * 0.014} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt text="site.py lancé" fill={C.blue} fontSize={() => vW() * 0.011} fontFamily={'DM Mono, monospace'} opacity={0.6} />
      </Rect>

      {/* 2 - .pth lu  ← fork point */}
      <Rect
        ref={b2}
        x={() => vW() * MX[2]} y={() => vH() * Y_MAIN}
        width={() => vW() * BOX_W} height={() => vH() * BOX_H}
        fill={`${C.jaune}14`} stroke={C.jaune} lineWidth={2}
        radius={() => vW() * 0.005} opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={8}
      >
        <Txt text=".pth"        fill={C.jaune} fontSize={() => vW() * 0.018} fontWeight={800} fontFamily={'Space Grotesk'} />
        <Txt text="lu"          fill={C.jaune} fontSize={() => vW() * 0.014} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt text="automatique" fill={C.jaune} fontSize={() => vW() * 0.011} fontFamily={'DM Mono, monospace'} opacity={0.6} />
      </Rect>

      {/* Pivot ring highlight */}
      <Rect
        ref={pivotRing}
        x={() => vW() * MX[2]} y={() => vH() * Y_MAIN}
        width={() => vW() * (BOX_W + 0.015)} height={() => vH() * (BOX_H + 0.025)}
        fill={'#00000000'} stroke={C.jaune} lineWidth={3}
        radius={() => vW() * 0.008} opacity={0}
        shadowColor={C.jaune} shadowBlur={() => vW() * 0.025}
      />

      {/* Terminal output block - what the user actually sees */}
      <Rect
        ref={termBlock}
        x={() => vW() * TERM_X} y={() => vH() * Y_MAIN}
        width={() => vW() * TERM_W} height={() => vH() * BOX_H}
        fill={C.term} stroke={`${C.ghost}44`} lineWidth={1}
        radius={() => vW() * 0.005} opacity={0}
        layout direction={'column'} alignItems={'start'} justifyContent={'center'} gap={3}
        padding={() => vW() * 0.012}
      >
        <Txt text={'$ pip install litellm'}    fill={`${C.ghost}BB`} fontSize={() => vW() * 0.0095} fontFamily={'DM Mono, monospace'} />
        <Txt text={'Collecting litellm...'}     fill={`${C.ghost}77`} fontSize={() => vW() * 0.0095} fontFamily={'DM Mono, monospace'} />
        <Txt text={'Installing packages...'}    fill={`${C.ghost}77`} fontSize={() => vW() * 0.0095} fontFamily={'DM Mono, monospace'} />
        <Txt text={'Successfully installed ✓'} fill={C.vert}         fontSize={() => vW() * 0.0095} fontFamily={'DM Mono, monospace'} />
      </Rect>

      {/* ══ CHILD ROW ══ */}

      {/* 3 - subprocess spawné */}
      <Rect
        ref={b3}
        x={() => vW() * CX[0]} y={() => vH() * Y_CHILD}
        width={() => vW() * BOX_W} height={() => vH() * BOX_H}
        fill={`${C.rose}14`} stroke={C.rose} lineWidth={2}
        radius={() => vW() * 0.005} opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={8}
      >
        <Txt text="subprocess"    fill={C.rose} fontSize={() => vW() * 0.014} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt text="spawné"        fill={C.rose} fontSize={() => vW() * 0.014} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt text="premier signal" fill={C.rose} fontSize={() => vW() * 0.011} fontFamily={'DM Mono, monospace'} opacity={0.6} />
      </Rect>

      {/* 4 - collecte */}
      <Rect
        ref={b4}
        x={() => vW() * CX[1]} y={() => vH() * Y_CHILD}
        width={() => vW() * BOX_W} height={() => vH() * BOX_H}
        fill={`${C.danger}14`} stroke={C.danger} lineWidth={2}
        radius={() => vW() * 0.005} opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={8}
      >
        <Txt text="collecte"     fill={C.danger} fontSize={() => vW() * 0.014} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt text="données"      fill={C.danger} fontSize={() => vW() * 0.014} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt text="env, secrets…" fill={C.danger} fontSize={() => vW() * 0.011} fontFamily={'DM Mono, monospace'} opacity={0.6} />
      </Rect>

      {/* 5 - chiffrement */}
      <Rect
        ref={b5}
        x={() => vW() * CX[2]} y={() => vH() * Y_CHILD}
        width={() => vW() * BOX_W} height={() => vH() * BOX_H}
        fill={`${C.danger}14`} stroke={C.danger} lineWidth={2}
        radius={() => vW() * 0.005} opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={8}
      >
        <Txt text="chiffrement"  fill={C.danger} fontSize={() => vW() * 0.014} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt text="AES / base64" fill={C.danger} fontSize={() => vW() * 0.011} fontFamily={'DM Mono, monospace'} opacity={0.6} />
      </Rect>

      {/* 6 - exfil */}
      <Rect
        ref={b6}
        x={() => vW() * CX[3]} y={() => vH() * Y_CHILD}
        width={() => vW() * BOX_W} height={() => vH() * BOX_H}
        fill={`${C.danger}14`} stroke={C.danger} lineWidth={3}
        radius={() => vW() * 0.005} opacity={0}
        shadowColor={C.danger} shadowBlur={() => exfilGlow() * vW() * 0.03}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={8}
      >
        <Txt text="exfil"         fill={C.danger} fontSize={() => vW() * 0.02}  fontWeight={800} fontFamily={'Space Grotesk'} />
        <Txt text="réseau sortant" fill={C.danger} fontSize={() => vW() * 0.011} fontFamily={'DM Mono, monospace'} opacity={0.6} />
      </Rect>

      {/* ══ ARROWS ══ */}

      {/* Main row: b0 → b1 */}
      <Line
        ref={a01} stroke={C.ghost} lineWidth={2} opacity={0}
        endArrow arrowSize={8}
        points={() => [
          [vW() * (MX[0] + BOX_W / 2), vH() * Y_MAIN],
          [vW() * (MX[1] - BOX_W / 2), vH() * Y_MAIN],
        ]}
        end={0}
      />
      {/* Main row: b1 → b2 */}
      <Line
        ref={a12} stroke={C.blue} lineWidth={2} opacity={0}
        endArrow arrowSize={8}
        points={() => [
          [vW() * (MX[1] + BOX_W / 2), vH() * Y_MAIN],
          [vW() * (MX[2] - BOX_W / 2), vH() * Y_MAIN],
        ]}
        end={0}
      />

      {/* Main line continuation: b2 right → termBlock  (dashed = "process continues normally") */}
      <Line
        ref={a23_main} stroke={`${C.ghost}99`} lineWidth={2} opacity={0}
        lineDash={[6, 4]}
        endArrow arrowSize={8}
        points={() => [
          [vW() * (MX[2] + BOX_W / 2),  vH() * Y_MAIN],
          [vW() * (TERM_X - TERM_W / 2), vH() * Y_MAIN],
        ]}
        end={0}
      />

      {/* Fork arrow: b2 bottom → straight down to Y_CHILD → right into b3  (git-tree L-shape) */}
      <Line
        ref={a_fork} stroke={C.jaune} lineWidth={2} opacity={0}
        endArrow arrowSize={10}
        points={() => [
          [vW() * MX[2],                   vH() * (Y_MAIN + BOX_H / 2)], // bottom-center of b2
          [vW() * MX[2],                   vH() * Y_CHILD],               // elbow - down to child row
          [vW() * (CX[0] - BOX_W / 2),     vH() * Y_CHILD],               // right to b3 left edge
        ]}
        end={0}
      />

      {/* Child row: b3 → b4 */}
      <Line
        ref={a34} stroke={C.rose} lineWidth={2} opacity={0}
        endArrow arrowSize={8}
        points={() => [
          [vW() * (CX[0] + BOX_W / 2), vH() * Y_CHILD],
          [vW() * (CX[1] - BOX_W / 2), vH() * Y_CHILD],
        ]}
        end={0}
      />
      {/* Child row: b4 → b5 */}
      <Line
        ref={a45} stroke={C.danger} lineWidth={2} opacity={0}
        endArrow arrowSize={8}
        points={() => [
          [vW() * (CX[1] + BOX_W / 2), vH() * Y_CHILD],
          [vW() * (CX[2] - BOX_W / 2), vH() * Y_CHILD],
        ]}
        end={0}
      />
      {/* Child row: b5 → b6 */}
      <Line
        ref={a56} stroke={C.danger} lineWidth={2} opacity={0}
        endArrow arrowSize={8}
        points={() => [
          [vW() * (CX[2] + BOX_W / 2), vH() * Y_CHILD],
          [vW() * (CX[3] - BOX_W / 2), vH() * Y_CHILD],
        ]}
        end={0}
      />

      {/* ══ ROW LABELS ══ */}
      {/* Below main row, centred on boxes 0-2 */}
      <Txt
        ref={labelMainRow}
        text="processus pip · visible par l'utilisateur"
        fill={C.ghost}
        fontSize={() => vW() * 0.012}
        fontFamily={'DM Mono, monospace'}
        x={() => vW() * -0.17}
        y={() => vH() * (Y_MAIN + BOX_H / 2 + 0.055)}
        opacity={0}
      />
      {/* Above child row, centred on boxes 3-6 */}
      <Txt
        ref={labelChildRow}
        text="sous-processus · invisible · malveillant"
        fill={C.danger}
        fontSize={() => vW() * 0.012}
        fontFamily={'DM Mono, monospace'}
        x={() => vW() * 0.19}
        y={() => vH() * (Y_CHILD - BOX_H / 2 - 0.04)}
        opacity={0}
      />

      {/* ══ KEY INSIGHT ══ */}
      <Rect
        ref={insightBox}
        x={0} y={() => vH() * 0.40}
        width={() => vW() * 0.6} height={() => vH() * 0.09}
        fill={`${C.danger}10`} stroke={C.danger} lineWidth={2}
        radius={() => vW() * 0.006} opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={5}
      >
        <Txt
          text="installer = exécuter - tu n'as pas besoin de lancer ton projet"
          fill={C.danger}
          fontSize={() => vW() * 0.017}
          fontWeight={600}
          fontFamily={'Space Grotesk'}
        />
      </Rect>
    </Layout>,
  );

  // ── Animations ───────────────────────────────────

  yield* waitUntil('intro');
  yield* grid().opacity(0.12, 0.8);
  yield* all(
    title().opacity(1, 0.55),
    tagLine().opacity(1, 0.45),
  );
  yield* waitFor(0.6);

  // ─── Main row: pip → Python → .pth ───
  yield* waitUntil('chainReveal');

  yield* b0().opacity(1, 0.4);
  yield* waitFor(0.3);

  yield* a01().opacity(1, 0.1);
  yield* a01().end(1, 0.3, easeOutCubic);
  yield* b1().opacity(1, 0.4);
  yield* waitFor(0.25);

  yield* a12().opacity(1, 0.1);
  yield* a12().end(1, 0.3, easeOutCubic);
  yield* b2().opacity(1, 0.4);
  yield* waitFor(0.35);

  // ─── .pth pivot highlight ───
  yield* waitUntil('pthPivot');
  yield* pivotRing().opacity(1, 0.4);
  yield* waitFor(0.6);
  yield* pivotRing().opacity(0, 0.3);
  yield* waitFor(0.2);

  // ─── Fork moment ───
  // Both arrows start simultaneously from b2:
  //   • dashed arrow → right to terminal output  (main process continues, user sees pip output)
  //   • L-shape arrow → down then right to subprocess  (invisible to user)
  yield* waitUntil('fork');
  yield* all(
    a23_main().opacity(1, 0.15),
    a_fork().opacity(1, 0.15),
  );
  yield* all(
    a23_main().end(1, 0.3, easeOutCubic),
    a_fork().end(1, 0.55, easeOutCubic), // longer path - L-shape
  );
  // Terminal output and first subprocess box appear together
  yield* all(
    termBlock().opacity(1, 0.4),
    b3().opacity(1, 0.4),
  );
  yield* waitFor(0.15);

  // Row labels
  yield* all(
    labelMainRow().opacity(0.6, 0.4),
    labelChildRow().opacity(1,   0.4),
  );
  yield* waitFor(0.5);

  // ─── Child chain: collecte → chiffrement → exfil ───
  yield* waitUntil('childChain');

  yield* a34().opacity(1, 0.1);
  yield* a34().end(1, 0.25, easeOutCubic);
  yield* b4().opacity(1, 0.35);
  yield* waitFor(0.2);

  yield* a45().opacity(1, 0.1);
  yield* a45().end(1, 0.25, easeOutCubic);
  yield* b5().opacity(1, 0.35);
  yield* waitFor(0.2);

  yield* a56().opacity(1, 0.1);
  yield* a56().end(1, 0.25, easeOutCubic);
  yield* b6().opacity(1, 0.45);
  yield* exfilGlow(2.2, 0.3, easeOutCubic);
  yield* exfilGlow(0.8, 0.5, easeInOutCubic);
  yield* waitFor(0.5);

  // ─── Key insight ───
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
    a01().opacity(0, 0.3), a12().opacity(0, 0.3),
    a23_main().opacity(0, 0.3), a_fork().opacity(0, 0.3),
    a34().opacity(0, 0.3), a45().opacity(0, 0.3), a56().opacity(0, 0.3),
    termBlock().opacity(0, 0.4),
    labelMainRow().opacity(0, 0.3),
    labelChildRow().opacity(0, 0.3),
    insightBox().opacity(0, 0.4),
  );
});
