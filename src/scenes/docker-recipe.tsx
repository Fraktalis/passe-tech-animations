import {makeScene2D} from '@motion-canvas/2d';
import {Grid, Layout, Rect, Txt} from '@motion-canvas/2d/lib/components';
import {all, createRef, easeOutCubic, sequence, waitFor, waitUntil} from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  const COLORS = {
    bg:            '#0D1117',
    cream:         '#F9F9F6',
    ghost:         '#3D444D',
    ghostText:     '#484F58',
    jaune:         '#FFE14D',
    vert:          '#6DFF8A',
    rose:          '#FF3E6C',
    bleu:          '#58A6FF',
    processBg:     '#1C2128',
    processBorder: '#30363D',
  };

  // ─── Refs ─────────────────────────────────────────────────────────────────
  const gridRef    = createRef<Grid>();
  const titleRef   = createRef<Txt>();

  const processBox = createRef<Rect>();
  const fsLayer    = createRef<Rect>();
  const nsLayer    = createRef<Rect>();
  const cgLayer    = createRef<Rect>();

  // Cgroups resource badges
  const cgCpu      = createRef<Rect>();
  const cgRam      = createRef<Rect>();
  const cgIo       = createRef<Rect>();

  // Ghost processes (context — outside all layers)
  const ghostLeft  = createRef<Rect>();
  const ghostRight = createRef<Rect>();

  // FS path labels
  const fsPaths    = createRef<Layout>();

  // Caption row
  const captionNum = createRef<Txt>();
  const captionTxt = createRef<Txt>();

  // ═══════════════════════════════════════════════════════════════════════════
  // SCENE TREE
  // ═══════════════════════════════════════════════════════════════════════════
  view.add(
    <Layout>
      {/* Background */}
      <Rect width={'100%'} height={'100%'} fill={COLORS.bg} zIndex={-2} />
      <Grid
        ref={gridRef}
        width={'100%'} height={'100%'}
        stroke={COLORS.ghost}
        lineWidth={1}
        spacing={() => vW() * 0.031}
        opacity={0}
        zIndex={-1}
      />

      {/* Title */}
      <Txt
        ref={titleRef}
        text="UN CONTENEUR EN 4 ÉTAPES"
        fill={COLORS.cream}
        fontSize={() => vW() * 0.028}
        fontWeight={800}
        fontFamily={'Space Grotesk'}
        y={() => vH() * -0.41}
        opacity={0}
      />

      {/* ─── Cgroups layer — outermost, drawn first (behind) ─── */}
      <Rect
        ref={cgLayer}
        width={() => vW() * 0.44}
        height={() => vH() * 0.56}
        fill={`${COLORS.bleu}06`}
        stroke={COLORS.bleu}
        lineWidth={2}
        radius={() => vW() * 0.013}
        opacity={0}
      />

      {/* Cgroups resource badges — in the gap between CG top and NS top */}
      <Rect
        ref={cgCpu}
        x={() => vW() * -0.10}
        y={() => vH() * -0.24}
        width={() => vW() * 0.085}
        height={() => vH() * 0.048}
        fill={`${COLORS.bleu}12`}
        stroke={`${COLORS.bleu}50`}
        lineWidth={1}
        radius={() => vW() * 0.004}
        opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'}
        gap={() => vH() * 0.005}
      >
        <Txt text="CPU" fill={COLORS.bleu} fontSize={() => vW() * 0.009} fontWeight={700} fontFamily={'DM Mono, monospace'} />
        <Txt text="0.5 core" fill={COLORS.ghostText} fontSize={() => vW() * 0.008} fontFamily={'DM Mono, monospace'} />
      </Rect>
      <Rect
        ref={cgRam}
        x={0}
        y={() => vH() * -0.24}
        width={() => vW() * 0.085}
        height={() => vH() * 0.048}
        fill={`${COLORS.bleu}12`}
        stroke={`${COLORS.bleu}50`}
        lineWidth={1}
        radius={() => vW() * 0.004}
        opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'}
        gap={() => vH() * 0.005}
      >
        <Txt text="RAM" fill={COLORS.bleu} fontSize={() => vW() * 0.009} fontWeight={700} fontFamily={'DM Mono, monospace'} />
        <Txt text="256 MB" fill={COLORS.ghostText} fontSize={() => vW() * 0.008} fontFamily={'DM Mono, monospace'} />
      </Rect>
      <Rect
        ref={cgIo}
        x={() => vW() * 0.10}
        y={() => vH() * -0.24}
        width={() => vW() * 0.085}
        height={() => vH() * 0.048}
        fill={`${COLORS.bleu}12`}
        stroke={`${COLORS.bleu}50`}
        lineWidth={1}
        radius={() => vW() * 0.004}
        opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'}
        gap={() => vH() * 0.005}
      >
        <Txt text="I/O" fill={COLORS.bleu} fontSize={() => vW() * 0.009} fontWeight={700} fontFamily={'DM Mono, monospace'} />
        <Txt text="50 MB/s" fill={COLORS.ghostText} fontSize={() => vW() * 0.008} fontFamily={'DM Mono, monospace'} />
      </Rect>

      {/* ─── Namespace layer ─── */}
      <Rect
        ref={nsLayer}
        width={() => vW() * 0.30}
        height={() => vH() * 0.40}
        fill={'#FF3E6C06'}
        stroke={COLORS.rose}
        lineWidth={3}
        radius={() => vW() * 0.010}
        opacity={0}
        shadowColor={COLORS.rose}
        shadowBlur={() => vW() * 0.015}
      />

      {/* ─── Filesystem layer — dashed border ─── */}
      <Rect
        ref={fsLayer}
        width={() => vW() * 0.20}
        height={() => vH() * 0.27}
        fill={`${COLORS.vert}06`}
        stroke={COLORS.vert}
        lineWidth={2}
        lineDash={[10, 6]}
        radius={() => vW() * 0.008}
        opacity={0}
      />

      {/* ─── Ghost processes — outside all layers, represent the host ─── */}
      <Rect
        ref={ghostLeft}
        x={() => vW() * -0.35}
        y={0}
        width={() => vW() * 0.09}
        height={() => vH() * 0.12}
        fill={COLORS.processBg}
        stroke={COLORS.ghostText}
        lineWidth={1}
        radius={() => vW() * 0.005}
        opacity={0}
        layout direction={'column'}
        alignItems={'center'} justifyContent={'center'}
        gap={() => vH() * 0.007}
      >
        <Txt text="PID 47" fill={COLORS.ghostText} fontSize={() => vW() * 0.012} fontWeight={700} fontFamily={'DM Mono, monospace'} />
        <Txt text="nginx" fill={COLORS.ghostText} fontSize={() => vW() * 0.008} fontFamily={'DM Sans, Space Grotesk'} opacity={0.5} />
      </Rect>
      <Rect
        ref={ghostRight}
        x={() => vW() * 0.35}
        y={0}
        width={() => vW() * 0.09}
        height={() => vH() * 0.12}
        fill={COLORS.processBg}
        stroke={COLORS.ghostText}
        lineWidth={1}
        radius={() => vW() * 0.005}
        opacity={0}
        layout direction={'column'}
        alignItems={'center'} justifyContent={'center'}
        gap={() => vH() * 0.007}
      >
        <Txt text="PID 89" fill={COLORS.ghostText} fontSize={() => vW() * 0.012} fontWeight={700} fontFamily={'DM Mono, monospace'} />
        <Txt text="sshd" fill={COLORS.ghostText} fontSize={() => vW() * 0.008} fontFamily={'DM Sans, Space Grotesk'} opacity={0.5} />
      </Rect>

      {/* ─── FS path labels — inside the FS layer, above the process box ─── */}
      <Layout
        ref={fsPaths}
        x={0}
        y={() => vH() * -0.108}
        layout direction={'row'}
        alignItems={'center'}
        gap={() => vW() * 0.018}
        opacity={0}
      >
        <Txt text="/bin" fill={COLORS.vert} fontSize={() => vW() * 0.010} fontWeight={700} fontFamily={'DM Mono, monospace'} opacity={0.75} />
        <Txt text="·" fill={COLORS.ghostText} fontSize={() => vW() * 0.010} fontFamily={'DM Mono, monospace'} />
        <Txt text="/dev" fill={COLORS.vert} fontSize={() => vW() * 0.010} fontWeight={700} fontFamily={'DM Mono, monospace'} opacity={0.75} />
        <Txt text="·" fill={COLORS.ghostText} fontSize={() => vW() * 0.010} fontFamily={'DM Mono, monospace'} />
        <Txt text="/etc" fill={COLORS.vert} fontSize={() => vW() * 0.010} fontWeight={700} fontFamily={'DM Mono, monospace'} opacity={0.75} />
      </Layout>

      {/* ─── Process box — innermost ─── */}
      <Rect
        ref={processBox}
        width={() => vW() * 0.12}
        height={() => vH() * 0.17}
        fill={COLORS.processBg}
        stroke={COLORS.jaune}
        lineWidth={3}
        radius={() => vW() * 0.006}
        opacity={0}
        scale={0.7}
        layout direction={'column'}
        alignItems={'center'} justifyContent={'center'}
        gap={() => vH() * 0.008}
      >
        <Txt
          text="PID 123"
          fill={COLORS.jaune}
          fontSize={() => vW() * 0.016}
          fontWeight={700}
          fontFamily={'DM Mono, monospace'}
        />
        <Txt
          text="myapp"
          fill={COLORS.cream}
          fontSize={() => vW() * 0.009}
          fontFamily={'DM Sans, Space Grotesk'}
          opacity={0.6}
        />
      </Rect>

      {/* ─── Caption row ─── */}
      <Layout
        x={0}
        y={() => vH() * 0.41}
        layout direction={'row'}
        alignItems={'center'}
        gap={() => vW() * 0.010}
      >
        <Txt
          ref={captionNum}
          text="01"
          fill={COLORS.jaune}
          fontSize={() => vW() * 0.017}
          fontWeight={700}
          fontFamily={'DM Mono, monospace'}
          opacity={0}
        />
        <Txt
          text="—"
          fill={COLORS.ghostText}
          fontSize={() => vW() * 0.017}
          fontFamily={'DM Mono, monospace'}
          opacity={0}
        />
        <Txt
          ref={captionTxt}
          text="NOUVEAU PROCESSUS"
          fill={COLORS.cream}
          fontSize={() => vW() * 0.017}
          fontFamily={'Space Grotesk'}
          fontWeight={600}
          opacity={0}
        />
      </Layout>
    </Layout>,
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  // The "—" separator shares opacity with captionNum — we update it in sync
  // by targeting its parent Layout children. Simpler: just fade num+txt together.
  function* showCaption(num: string, text: string, color: string) {
    // Fade out if visible
    if (captionNum().opacity() > 0) {
      yield* all(
        captionNum().opacity(0, 0.2),
        captionTxt().opacity(0, 0.2),
      );
    }
    captionNum().text(num);
    captionNum().fill(color);
    captionTxt().text(text);
    yield* all(
      captionNum().opacity(1, 0.35),
      captionTxt().opacity(1, 0.35),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ANIMATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── Intro: grid + title ──────────────────────────────────────────────────
  yield* waitUntil('intro');

  yield* all(
    gridRef().opacity(0.12, 0.8),
    titleRef().opacity(1, 0.6),
  );
  yield* waitFor(0.3);

  // ─── Step 1: Nouveau processus ────────────────────────────────────────────
  yield* waitUntil('step1');

  yield* showCaption('01', 'NOUVEAU PROCESSUS', COLORS.jaune);
  yield* waitFor(0.15);
  yield* all(
    processBox().opacity(1, 0.4),
    processBox().scale(1, 0.5, easeOutCubic),
    ghostLeft().opacity(0.3, 0.6),
    ghostRight().opacity(0.3, 0.6),
  );

  yield* waitFor(1);

  // ─── Step 2: Son propre file system ───────────────────────────────────────
  yield* waitUntil('step2');

  yield* showCaption('02', 'SON PROPRE FILE SYSTEM', COLORS.vert);
  yield* waitFor(0.15);
  yield* fsLayer().opacity(1, 0.5);
  // Brief scale pulse to draw attention
  yield* fsLayer().scale(1.03, 0.18, easeOutCubic);
  yield* fsLayer().scale(1.0,  0.18, easeOutCubic);
  // FS paths appear after the layer settles
  yield* fsPaths().opacity(1, 0.4);

  yield* waitFor(1);

  // ─── Step 3: Isolé des autres processus ───────────────────────────────────
  yield* waitUntil('step3');

  yield* showCaption('03', 'ISOLÉ DES AUTRES PROCESSUS', COLORS.rose);
  yield* waitFor(0.15);
  yield* all(
    nsLayer().opacity(1, 0.6),
    // Ghosts fade almost to invisible — the wall "cuts them off"
    ghostLeft().opacity(0.07, 0.6),
    ghostRight().opacity(0.07, 0.6),
  );

  yield* waitFor(1);

  // ─── Step 4: Limites de ressources ────────────────────────────────────────
  yield* waitUntil('step4');

  yield* showCaption('04', 'LIMITES DE RESSOURCES', COLORS.bleu);
  yield* waitFor(0.15);
  yield* cgLayer().opacity(1, 0.5);
  yield* sequence(0.12,
    cgCpu().opacity(1, 0.4),
    cgRam().opacity(1, 0.4),
    cgIo().opacity(1, 0.4),
  );

  yield* waitFor(1.5);

  // ─── End ──────────────────────────────────────────────────────────────────
  yield* waitUntil('endScene');

  yield* all(
    processBox().opacity(0, 0.5),
    ghostLeft().opacity(0, 0.5),
    ghostRight().opacity(0, 0.5),
    fsPaths().opacity(0, 0.5),
    fsLayer().opacity(0, 0.5),
    nsLayer().opacity(0, 0.5),
    cgLayer().opacity(0, 0.5),
    cgCpu().opacity(0, 0.5),
    cgRam().opacity(0, 0.5),
    cgIo().opacity(0, 0.5),
    captionNum().opacity(0, 0.5),
    captionTxt().opacity(0, 0.5),
    titleRef().opacity(0, 0.5),
    gridRef().opacity(0, 0.5),
  );
});
