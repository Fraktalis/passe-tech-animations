// litellm/pth-diagram.tsx
// CUT 1 - pip/uv/conda → site-packages → .pth → Python
// CUT 2 - litellm_init.pth file content with annotations

import {makeScene2D} from '@motion-canvas/2d';
import {Grid, Layout, Rect, Txt, Line} from '@motion-canvas/2d/lib/components';
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
    rose:   '#FF3E6C',
    vert:   '#6DFF8A',
    jaune:  '#FFE14D',
    cream:  '#F9F9F6',
    ghost:  '#484F58',
    term:   '#161B22',
    blue:   '#58A6FF',
    danger: '#F85149',
  };

  const COL = [-0.33, 0.0, 0.33] as const;
  const PM_COLOR = [C.blue, C.vert, C.jaune] as const;

  // ──────────────────────────────────────────────
  // REFS
  // ──────────────────────────────────────────────
  const grid      = createRef<Grid>();
  const title     = createRef<Txt>();
  const subtitle  = createRef<Txt>();

  // Phase 1 - package managers
  const pm0       = createRef<Rect>();
  const pm1       = createRef<Rect>();
  const pm2       = createRef<Rect>();

  // Phase 1 - arrows pm → sp
  const aPmSp0    = createRef<Line>();
  const aPmSp1    = createRef<Line>();
  const aPmSp2    = createRef<Line>();

  // Phase 1 - site-packages boxes
  const sp0       = createRef<Rect>();
  const sp1       = createRef<Rect>();
  const sp2       = createRef<Rect>();

  // .pth filenames inside sp boxes
  const pth0      = createRef<Txt>();
  const pth1      = createRef<Txt>();
  const pth2      = createRef<Txt>();

  // Phase 1 - arrows sp → python (converging)
  const aSpPy0    = createRef<Line>();
  const aSpPy1    = createRef<Line>();
  const aSpPy2    = createRef<Line>();

  // Phase 1 - Python box
  const pyBox     = createRef<Rect>();
  const autoLabel = createRef<Txt>();

  // Phase 2 - file content
  const fileCard   = createRef<Rect>();
  const codeLayout = createRef<Layout>();
  const fnLabel    = createRef<Txt>();
  const cl1        = createRef<Txt>(); // # comment
  const cl2        = createRef<Txt>(); // import base64
  const cl3        = createRef<Txt>(); // base64.b64decode(
  const cl4        = createRef<Txt>(); // b'...'

  // Phase 2 - annotations
  const ab1        = createRef<Rect>(); // 2× base64
  const ab2        = createRef<Rect>(); // exec auto
  const aLine1     = createRef<Line>();
  const aLine2     = createRef<Line>();
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
        text="LES FICHIERS .pth"
        fill={C.cream}
        fontSize={() => vW() * 0.042}
        fontWeight={800}
        fontFamily={'Space Grotesk'}
        y={() => vH() * -0.43}
        opacity={0}
      />
      <Txt
        ref={subtitle}
        text="exécutés automatiquement au démarrage - peu importe le gestionnaire"
        fill={C.ghost}
        fontSize={() => vW() * 0.017}
        fontFamily={'DM Mono, monospace'}
        y={() => vH() * -0.355}
        opacity={0}
      />

      {/* ══════════════════════ PHASE 1 ══════════════════════ */}

      {/* ── pip ── */}
      <Rect
        ref={pm0}
        x={() => vW() * COL[0]} y={() => vH() * -0.255}
        width={() => vW() * 0.135} height={() => vH() * 0.115}
        fill={`${PM_COLOR[0]}18`} stroke={PM_COLOR[0]} lineWidth={2}
        radius={() => vW() * 0.005} opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={5}
      >
        <Txt text="pip" fill={PM_COLOR[0]} fontSize={() => vW() * 0.024} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt text="standard" fill={PM_COLOR[0]} fontSize={() => vW() * 0.012} fontFamily={'DM Mono, monospace'} opacity={0.65} />
      </Rect>

      {/* ── uv ── */}
      <Rect
        ref={pm1}
        x={() => vW() * COL[1]} y={() => vH() * -0.255}
        width={() => vW() * 0.135} height={() => vH() * 0.115}
        fill={`${PM_COLOR[1]}18`} stroke={PM_COLOR[1]} lineWidth={2}
        radius={() => vW() * 0.005} opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={5}
      >
        <Txt text="uv" fill={PM_COLOR[1]} fontSize={() => vW() * 0.024} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt text="ultra-rapide" fill={PM_COLOR[1]} fontSize={() => vW() * 0.012} fontFamily={'DM Mono, monospace'} opacity={0.65} />
      </Rect>

      {/* ── conda ── */}
      <Rect
        ref={pm2}
        x={() => vW() * COL[2]} y={() => vH() * -0.255}
        width={() => vW() * 0.135} height={() => vH() * 0.115}
        fill={`${PM_COLOR[2]}18`} stroke={PM_COLOR[2]} lineWidth={2}
        radius={() => vW() * 0.005} opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={5}
      >
        <Txt text="conda" fill={PM_COLOR[2]} fontSize={() => vW() * 0.024} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt text="Anaconda" fill={PM_COLOR[2]} fontSize={() => vW() * 0.012} fontFamily={'DM Mono, monospace'} opacity={0.65} />
      </Rect>

      {/* ── arrows pm → sp ── */}
      <Line
        ref={aPmSp0} stroke={PM_COLOR[0]} lineWidth={2} opacity={0}
        endArrow arrowSize={8}
        points={() => [[vW() * COL[0], vH() * -0.192], [vW() * COL[0], vH() * -0.098]]}
        end={0}
      />
      <Line
        ref={aPmSp1} stroke={PM_COLOR[1]} lineWidth={2} opacity={0}
        endArrow arrowSize={8}
        points={() => [[vW() * COL[1], vH() * -0.192], [vW() * COL[1], vH() * -0.098]]}
        end={0}
      />
      <Line
        ref={aPmSp2} stroke={PM_COLOR[2]} lineWidth={2} opacity={0}
        endArrow arrowSize={8}
        points={() => [[vW() * COL[2], vH() * -0.192], [vW() * COL[2], vH() * -0.098]]}
        end={0}
      />

      {/* ── site-packages boxes ── */}
      <Rect
        ref={sp0}
        x={() => vW() * COL[0]} y={() => vH() * 0.02}
        width={() => vW() * 0.175} height={() => vH() * 0.22}
        fill={`${C.ghost}0C`} stroke={C.ghost} lineWidth={1}
        radius={() => vW() * 0.005} opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={10}
      >
        <Txt text="site-packages/" fill={C.ghost} fontSize={() => vW() * 0.012} fontFamily={'DM Mono, monospace'} />
        <Txt
          ref={pth0} text="litellm_init.pth"
          fill={PM_COLOR[0]} fontSize={() => vW() * 0.013}
          fontFamily={'DM Mono, monospace'} fontWeight={600} opacity={0}
        />
      </Rect>

      <Rect
        ref={sp1}
        x={() => vW() * COL[1]} y={() => vH() * 0.02}
        width={() => vW() * 0.175} height={() => vH() * 0.22}
        fill={`${C.ghost}0C`} stroke={C.ghost} lineWidth={1}
        radius={() => vW() * 0.005} opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={10}
      >
        <Txt text="site-packages/" fill={C.ghost} fontSize={() => vW() * 0.012} fontFamily={'DM Mono, monospace'} />
        <Txt
          ref={pth1} text="litellm_init.pth"
          fill={PM_COLOR[1]} fontSize={() => vW() * 0.013}
          fontFamily={'DM Mono, monospace'} fontWeight={600} opacity={0}
        />
      </Rect>

      <Rect
        ref={sp2}
        x={() => vW() * COL[2]} y={() => vH() * 0.02}
        width={() => vW() * 0.175} height={() => vH() * 0.22}
        fill={`${C.ghost}0C`} stroke={C.ghost} lineWidth={1}
        radius={() => vW() * 0.005} opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={10}
      >
        <Txt text="site-packages/" fill={C.ghost} fontSize={() => vW() * 0.012} fontFamily={'DM Mono, monospace'} />
        <Txt
          ref={pth2} text="litellm_init.pth"
          fill={PM_COLOR[2]} fontSize={() => vW() * 0.013}
          fontFamily={'DM Mono, monospace'} fontWeight={600} opacity={0}
        />
      </Rect>

      {/* ── arrows sp → Python (converging) ── */}
      <Line
        ref={aSpPy0} stroke={C.rose} lineWidth={2} opacity={0}
        endArrow arrowSize={8}
        points={() => [[vW() * COL[0], vH() * 0.135], [vW() * -0.04, vH() * 0.305]]}
        end={0}
      />
      <Line
        ref={aSpPy1} stroke={C.rose} lineWidth={2} opacity={0}
        endArrow arrowSize={8}
        points={() => [[vW() * COL[1], vH() * 0.135], [vW() * 0.0, vH() * 0.305]]}
        end={0}
      />
      <Line
        ref={aSpPy2} stroke={C.rose} lineWidth={2} opacity={0}
        endArrow arrowSize={8}
        points={() => [[vW() * COL[2], vH() * 0.135], [vW() * 0.04, vH() * 0.305]]}
        end={0}
      />

      {/* ── Python interpreter box ── */}
      <Rect
        ref={pyBox}
        x={0} y={() => vH() * 0.375}
        width={() => vW() * 0.19} height={() => vH() * 0.115}
        fill={`${C.rose}18`} stroke={C.rose} lineWidth={2}
        radius={() => vW() * 0.006} opacity={0}
        shadowColor={C.rose} shadowBlur={() => vW() * 0.018}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={5}
      >
        <Txt text="Python" fill={C.rose} fontSize={() => vW() * 0.024} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt text="interpréteur" fill={C.rose} fontSize={() => vW() * 0.012} fontFamily={'DM Mono, monospace'} opacity={0.65} />
      </Rect>

      {/* ── auto-exec label ── */}
      <Txt
        ref={autoLabel}
        text="exécuté automatiquement - sans permission, sans exception"
        fill={C.jaune}
        fontSize={() => vW() * 0.017}
        fontWeight={600}
        fontFamily={'Space Grotesk'}
        y={() => vH() * 0.463}
        opacity={0}
      />

      {/* ══════════════════════ PHASE 2 ══════════════════════ */}

      {/* file name label */}
      <Txt
        ref={fnLabel}
        text="litellm_init.pth - contenu réel"
        fill={C.ghost}
        fontSize={() => vW() * 0.016}
        fontFamily={'DM Mono, monospace'}
        y={() => vH() * -0.36}
        opacity={0}
      />

      {/* code card background */}
      <Rect
        ref={fileCard}
        x={() => vW() * -0.1} y={() => vH() * 0.03}
        width={() => vW() * 0.56} height={() => vH() * 0.46}
        fill={C.term} stroke={C.ghost} lineWidth={1}
        radius={() => vW() * 0.006}
        opacity={0}
      />

      {/* code lines - left-aligned via Layout */}
      <Layout
        ref={codeLayout}
        x={() => vW() * -0.1} y={() => vH() * 0.03}
        direction={'column'} alignItems={'start'} justifyContent={'center'}
        gap={18}
        width={() => vW() * 0.52}
        height={() => vH() * 0.42}
        opacity={0}
      >
        <Txt
          ref={cl1}
          text="# litellm_init.pth"
          fill={C.ghost} fontSize={() => vW() * 0.017}
          fontFamily={'DM Mono, monospace'}
        />
        <Txt
          ref={cl2}
          text="import base64,sys;exec(base64.b64decode("
          fill={C.blue} fontSize={() => vW() * 0.017}
          fontFamily={'DM Mono, monospace'}
        />
        <Txt
          ref={cl3}
          text="  base64.b64decode("
          fill={C.jaune} fontSize={() => vW() * 0.017}
          fontFamily={'DM Mono, monospace'}
        />
        <Txt
          ref={cl4}
          text={"    b'aW1wb3J0IHN1YnByb2Nlc3Mu...' ).decode()))"}
          fill={C.vert} fontSize={() => vW() * 0.017}
          fontFamily={'DM Mono, monospace'}
        />
      </Layout>

      {/* annotation - exec auto */}
      <Rect
        ref={ab2}
        x={() => vW() * 0.35} y={() => vH() * -0.07}
        width={() => vW() * 0.2} height={() => vH() * 0.115}
        fill={`${C.danger}14`} stroke={C.danger} lineWidth={2}
        radius={() => vW() * 0.005} opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={6}
      >
        <Txt text="exec() auto" fill={C.danger} fontSize={() => vW() * 0.017} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt text="à chaque python" fill={C.danger} fontSize={() => vW() * 0.012} fontFamily={'DM Mono, monospace'} opacity={0.85} />
      </Rect>

      {/* annotation - double base64 */}
      <Rect
        ref={ab1}
        x={() => vW() * 0.35} y={() => vH() * 0.1}
        width={() => vW() * 0.2} height={() => vH() * 0.13}
        fill={`${C.jaune}14`} stroke={C.jaune} lineWidth={2}
        radius={() => vW() * 0.005} opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={6}
      >
        <Txt text="2× base64" fill={C.jaune} fontSize={() => vW() * 0.017} fontWeight={700} fontFamily={'Space Grotesk'} />
        <Txt text="aucun string lisible" fill={C.jaune} fontSize={() => vW() * 0.012} fontFamily={'DM Mono, monospace'} opacity={0.85} />
        <Txt text="passe les grep naïfs" fill={C.jaune} fontSize={() => vW() * 0.012} fontFamily={'DM Mono, monospace'} opacity={0.85} />
      </Rect>

      {/* annotation lines */}
      <Line
        ref={aLine2}
        stroke={C.danger} lineWidth={1.5} lineDash={[6, 4]} opacity={0}
        points={() => [
          [vW() * 0.245, vH() * -0.07],
          [vW() * 0.155, vH() * -0.025],
        ]}
      />
      <Line
        ref={aLine1}
        stroke={C.jaune} lineWidth={1.5} lineDash={[6, 4]} opacity={0}
        points={() => [
          [vW() * 0.245, vH() * 0.1],
          [vW() * 0.155, vH() * 0.065],
        ]}
      />
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
    subtitle().opacity(1, 0.45),
  );
  yield* waitFor(0.5);

  // ─── Package managers appear ───
  yield* waitUntil('pmAppear');
  yield* sequence(0.15,
    pm0().opacity(1, 0.45),
    pm1().opacity(1, 0.45),
    pm2().opacity(1, 0.45),
  );
  yield* waitFor(0.5);

  // ─── Arrows pm → sp, then SP boxes ───
  yield* waitUntil('spAppear');
  yield* all(
    aPmSp0().opacity(1, 0.1),
    aPmSp1().opacity(1, 0.1),
    aPmSp2().opacity(1, 0.1),
  );
  yield* all(
    aPmSp0().end(1, 0.35, easeOutCubic),
    aPmSp1().end(1, 0.35, easeOutCubic),
    aPmSp2().end(1, 0.35, easeOutCubic),
  );
  yield* sequence(0.12,
    sp0().opacity(1, 0.4),
    sp1().opacity(1, 0.4),
    sp2().opacity(1, 0.4),
  );
  yield* waitFor(0.6);

  // ─── .pth files appear inside SP boxes ───
  yield* waitUntil('pthAppear');
  yield* sequence(0.1,
    pth0().opacity(1, 0.35),
    pth1().opacity(1, 0.35),
    pth2().opacity(1, 0.35),
  );
  yield* waitFor(0.7);

  // ─── Arrows sp → Python, Python box appears ───
  yield* waitUntil('pythonAppear');
  yield* all(
    aSpPy0().opacity(1, 0.1),
    aSpPy1().opacity(1, 0.1),
    aSpPy2().opacity(1, 0.1),
  );
  yield* all(
    aSpPy0().end(1, 0.45, easeOutCubic),
    aSpPy1().end(1, 0.45, easeOutCubic),
    aSpPy2().end(1, 0.45, easeOutCubic),
  );
  yield* pyBox().opacity(1, 0.5);
  yield* waitFor(0.4);
  yield* autoLabel().opacity(1, 0.5);
  yield* waitFor(1.8);

 
});
