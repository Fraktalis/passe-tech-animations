import {makeScene2D} from '@motion-canvas/2d';
import {Grid, Layout, Rect, Txt, Line, Circle} from '@motion-canvas/2d/lib/components';
import {all, chain, createRef, createSignal, easeInOutCubic, easeOutCubic, easeOutQuart, sequence, waitFor, waitUntil} from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  const COLORS = {
    bg:      '#0D1117',
    rose:    '#FF3E6C',
    vert:    '#6DFF8A',
    jaune:   '#FFE14D',
    cream:   '#F9F9F6',
    ghost:   '#484F58',
    terminal:'#161B22',
    // Languages
    cpp:     '#659AD2',  // C++ bleu
    rust:    '#F74C00',  // Rust orange
    go:      '#00ACD7',  // Go cyan
    zig:     '#F7A41D',  // Zig jaune
    // Compiler / wasm
    compiler:'#B392F0',  // violet
    wasm:    '#6DFF8A',  // vert Passe-Tech
    browser: '#58A6FF',  // bleu navigateur
    native:  '#FFE14D',  // jaune machine
  };

  // ─── Refs : Grid & Title ───
  const gridRef         = createRef<Grid>();
  const titleRef        = createRef<Txt>();
  const subtitleRef     = createRef<Txt>();

  // ─── Refs : Source files (left column) ───
  const srcCpp   = createRef<Rect>();
  const srcRust  = createRef<Rect>();
  const srcGo    = createRef<Rect>();
  const srcZig   = createRef<Rect>();

  // ─── Refs : Compiler (center) ───
  const compilerBox   = createRef<Rect>();
  const compilerLabel = createRef<Txt>();
  const compilerSub   = createRef<Txt>();

  // ─── Refs : Arrows in (src → compiler) ───
  const arrowCpp  = createRef<Line>();
  const arrowRust = createRef<Line>();
  const arrowGo   = createRef<Line>();
  const arrowZig  = createRef<Line>();

  // ─── Refs : .wasm output (right) ───
  const wasmFile  = createRef<Rect>();
  const wasmLabel = createRef<Txt>();
  const wasmSize  = createRef<Txt>();
  const arrowOut  = createRef<Line>();

  // ─── Refs : Binary detail rows ───
  const binaryBlock  = createRef<Rect>();
  const binaryRow1   = createRef<Txt>();
  const binaryRow2   = createRef<Txt>();
  const binaryRow3   = createRef<Txt>();
  const typesNote    = createRef<Txt>();

  // ─── Refs : Section 2 — Browser execution ───
  const browserBox    = createRef<Rect>();
  const browserLabel  = createRef<Txt>();
  const jitArrow      = createRef<Line>();
  const nativeBox     = createRef<Rect>();
  const nativeLabel   = createRef<Txt>();
  const portabilityTxt = createRef<Txt>();

  // Signal for compiler pulsing glow
  const compilerGlow = createSignal(0);

  // ═══════════════════════════════════════════
  // SCENE TREE
  // ═══════════════════════════════════════════
  view.add(
    <Layout>
      {/* Background */}
      <Rect width={'100%'} height={'100%'} fill={COLORS.bg} zIndex={-2} />
      <Grid
        ref={gridRef}
        width={'100%'}
        height={'100%'}
        stroke={COLORS.ghost}
        opacity={0}
        lineWidth={1}
        spacing={() => vW() * 0.055}
        zIndex={-1}
      />

      {/* ── TITLE ── */}
      <Txt
        ref={titleRef}
        text="WASM : UNE CIBLE DE COMPILATION"
        fill={COLORS.cream}
        fontSize={() => vW() * 0.038}
        fontWeight={800}
        fontFamily={'Space Grotesk'}
        y={() => vH() * -0.42}
        opacity={0}
      />
      <Txt
        ref={subtitleRef}
        text="pas un langage — un format binaire portable"
        fill={COLORS.ghost}
        fontSize={() => vW() * 0.018}
        fontFamily={'Space Grotesk'}
        y={() => vH() * -0.35}
        opacity={0}
      />

      {/* ══ SOURCE FILES — left column ══ */}

      {/* C++ */}
      <Rect
        ref={srcCpp}
        x={() => vW() * -0.37}
        y={() => vH() * -0.2}
        width={() => vW() * 0.14}
        height={() => vH() * 0.1}
        fill={`${COLORS.cpp}18`}
        stroke={COLORS.cpp}
        lineWidth={2}
        radius={() => vW() * 0.006}
        opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={6}
      >
        <Txt text="main.cpp" fill={COLORS.cpp} fontSize={() => vW() * 0.016} fontFamily={'DM Mono, monospace'} fontWeight={600} />
        <Txt text="C++" fill={COLORS.cpp} fontSize={() => vW() * 0.012} fontFamily={'Space Grotesk'} opacity={0.6} />
      </Rect>

      {/* Rust */}
      <Rect
        ref={srcRust}
        x={() => vW() * -0.37}
        y={() => vH() * -0.067}
        width={() => vW() * 0.14}
        height={() => vH() * 0.1}
        fill={`${COLORS.rust}18`}
        stroke={COLORS.rust}
        lineWidth={2}
        radius={() => vW() * 0.006}
        opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={6}
      >
        <Txt text="lib.rs" fill={COLORS.rust} fontSize={() => vW() * 0.016} fontFamily={'DM Mono, monospace'} fontWeight={600} />
        <Txt text="Rust" fill={COLORS.rust} fontSize={() => vW() * 0.012} fontFamily={'Space Grotesk'} opacity={0.6} />
      </Rect>

      {/* Go */}
      <Rect
        ref={srcGo}
        x={() => vW() * -0.37}
        y={() => vH() * 0.067}
        width={() => vW() * 0.14}
        height={() => vH() * 0.1}
        fill={`${COLORS.go}18`}
        stroke={COLORS.go}
        lineWidth={2}
        radius={() => vW() * 0.006}
        opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={6}
      >
        <Txt text="main.go" fill={COLORS.go} fontSize={() => vW() * 0.016} fontFamily={'DM Mono, monospace'} fontWeight={600} />
        <Txt text="Go" fill={COLORS.go} fontSize={() => vW() * 0.012} fontFamily={'Space Grotesk'} opacity={0.6} />
      </Rect>

      {/* Zig */}
      <Rect
        ref={srcZig}
        x={() => vW() * -0.37}
        y={() => vH() * 0.2}
        width={() => vW() * 0.14}
        height={() => vH() * 0.1}
        fill={`${COLORS.zig}18`}
        stroke={COLORS.zig}
        lineWidth={2}
        radius={() => vW() * 0.006}
        opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={6}
      >
        <Txt text="build.zig" fill={COLORS.zig} fontSize={() => vW() * 0.016} fontFamily={'DM Mono, monospace'} fontWeight={600} />
        <Txt text="Zig" fill={COLORS.zig} fontSize={() => vW() * 0.012} fontFamily={'Space Grotesk'} opacity={0.6} />
      </Rect>

      {/* ══ ARROWS src → compiler ══ */}

      <Line
        ref={arrowCpp}
        stroke={COLORS.cpp}
        lineWidth={2}
        opacity={0}
        endArrow
        arrowSize={10}
        points={() => [
          [vW() * -0.295, vH() * -0.2],
          [vW() * -0.125, vH() * 0],
        ]}
        end={0}
      />
      <Line
        ref={arrowRust}
        stroke={COLORS.rust}
        lineWidth={2}
        opacity={0}
        endArrow
        arrowSize={10}
        points={() => [
          [vW() * -0.295, vH() * -0.067],
          [vW() * -0.125, vH() * 0],
        ]}
        end={0}
      />
      <Line
        ref={arrowGo}
        stroke={COLORS.go}
        lineWidth={2}
        opacity={0}
        endArrow
        arrowSize={10}
        points={() => [
          [vW() * -0.295, vH() * 0.067],
          [vW() * -0.125, vH() * 0],
        ]}
        end={0}
      />
      <Line
        ref={arrowZig}
        stroke={COLORS.zig}
        lineWidth={2}
        opacity={0}
        endArrow
        arrowSize={10}
        points={() => [
          [vW() * -0.295, vH() * 0.2],
          [vW() * -0.125, vH() * 0],
        ]}
        end={0}
      />

      {/* ══ COMPILER — center ══ */}
      <Rect
        ref={compilerBox}
        x={0}
        y={0}
        width={() => vW() * 0.22}
        height={() => vH() * 0.22}
        fill={`${COLORS.compiler}15`}
        stroke={COLORS.compiler}
        lineWidth={3}
        radius={() => vW() * 0.008}
        opacity={0}
        shadowColor={COLORS.compiler}
        shadowBlur={() => compilerGlow() * vW() * 0.04}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={8}
      >
        <Txt
          ref={compilerLabel}
          text="COMPILATEUR"
          fill={COLORS.compiler}
          fontSize={() => vW() * 0.018}
          fontWeight={700}
          fontFamily={'Space Grotesk'}
        />
        <Txt
          ref={compilerSub}
          text="emcc · rustc · tinygo · zig"
          fill={COLORS.compiler}
          fontSize={() => vW() * 0.011}
          fontFamily={'DM Mono, monospace'}
          opacity={0.6}
        />
      </Rect>

      {/* ══ ARROW compiler → wasm ══ */}
      <Line
        ref={arrowOut}
        stroke={COLORS.wasm}
        lineWidth={3}
        opacity={0}
        endArrow
        arrowSize={12}
        points={() => [
          [vW() * 0.125, 0],
          [vW() * 0.26, 0],
        ]}
        end={0}
      />

      {/* ══ .wasm FILE — right ══ */}
      <Rect
        ref={wasmFile}
        x={() => vW() * 0.37}
        y={0}
        width={() => vW() * 0.16}
        height={() => vH() * 0.22}
        fill={`${COLORS.wasm}15`}
        stroke={COLORS.wasm}
        lineWidth={3}
        radius={() => vW() * 0.008}
        opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={8}
      >
        <Txt
          ref={wasmLabel}
          text="module.wasm"
          fill={COLORS.wasm}
          fontSize={() => vW() * 0.017}
          fontWeight={700}
          fontFamily={'DM Mono, monospace'}
        />
        <Txt
          ref={wasmSize}
          text="binaire compact"
          fill={COLORS.wasm}
          fontSize={() => vW() * 0.011}
          fontFamily={'Space Grotesk'}
          opacity={0.6}
        />
      </Rect>

      {/* ══ BINARY DETAIL — expanded view, slides from .wasm toward center ══ */}
      <Rect
        ref={binaryBlock}
        x={() => vW() * 0.1}
        y={() => vH() * 0.27}
        width={() => vW() * 0.38}
        height={() => vH() * 0.22}
        fill={COLORS.terminal}
        stroke={COLORS.ghost}
        lineWidth={2}
        radius={() => vW() * 0.006}
        opacity={0}
        layout direction={'column'} padding={20} gap={12}
      >
        <Txt
          ref={binaryRow1}
          text="00 61 73 6D  01 00 00 00"
          fill={COLORS.ghost}
          fontSize={() => vW() * 0.012}
          fontFamily={'DM Mono, monospace'}
          opacity={0}
        />
        <Txt
          ref={binaryRow2}
          text="60 02 7F 7F  01 7F  ← types: (i32,i32)→i32"
          fill={COLORS.vert}
          fontSize={() => vW() * 0.012}
          fontFamily={'DM Mono, monospace'}
          opacity={0}
        />
        <Txt
          ref={binaryRow3}
          text="20 00  20 01  6A  0B  ← add, end"
          fill={COLORS.cream}
          fontSize={() => vW() * 0.012}
          fontFamily={'DM Mono, monospace'}
          opacity={0}
        />
      </Rect>

      <Txt
        ref={typesNote}
        text="types gravés dans le binaire → pas de déoptimisation surprise"
        fill={COLORS.jaune}
        fontSize={() => vW() * 0.017}
        fontWeight={700}
        fontFamily={'Space Grotesk'}
        y={() => vH() * 0.4}
        opacity={0}
      />

      {/* ══ Section 2 — Browser execution ══ */}
      {/* Layout : wasm(-0.32) ──► browser(0) ──► native(0.32) */}

      {/* Browser box — center */}
      <Rect
        ref={browserBox}
        x={0}
        y={() => vH() * 0.05}
        width={() => vW() * 0.22}
        height={() => vH() * 0.2}
        fill={`${COLORS.browser}15`}
        stroke={COLORS.browser}
        lineWidth={3}
        radius={() => vW() * 0.008}
        opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={8}
      >
        <Txt
          ref={browserLabel}
          text="NAVIGATEUR"
          fill={COLORS.browser}
          fontSize={() => vW() * 0.018}
          fontWeight={700}
          fontFamily={'Space Grotesk'}
        />
        <Txt text="JIT compile .wasm" fill={COLORS.browser} fontSize={() => vW() * 0.012} fontFamily={'DM Mono, monospace'} opacity={0.6} />
      </Rect>

      {/* JIT arrow browser → native */}
      <Line
        ref={jitArrow}
        stroke={COLORS.jaune}
        lineWidth={3}
        opacity={0}
        endArrow
        arrowSize={12}
        points={() => [
          [vW() * 0.115, vH() * 0.05],
          [vW() * 0.21,  vH() * 0.05],
        ]}
        end={0}
      />

      {/* Native machine code box */}
      <Rect
        ref={nativeBox}
        x={() => vW() * 0.32}
        y={() => vH() * 0.05}
        width={() => vW() * 0.2}
        height={() => vH() * 0.2}
        fill={`${COLORS.native}15`}
        stroke={COLORS.native}
        lineWidth={3}
        radius={() => vW() * 0.008}
        opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={8}
      >
        <Txt
          ref={nativeLabel}
          text="CODE MACHINE"
          fill={COLORS.native}
          fontSize={() => vW() * 0.016}
          fontWeight={700}
          fontFamily={'Space Grotesk'}
        />
        <Txt text="x86 · ARM · natif" fill={COLORS.native} fontSize={() => vW() * 0.012} fontFamily={'DM Mono, monospace'} opacity={0.6} />
      </Rect>

      {/* Portability note */}
      <Txt
        ref={portabilityTxt}
        text="le même .wasm tourne sur n'importe quel OS, n'importe quelle archi"
        fill={COLORS.vert}
        fontSize={() => vW() * 0.018}
        fontWeight={600}
        fontFamily={'Space Grotesk'}
        y={() => vH() * 0.38}
        opacity={0}
      />
    </Layout>,
  );

  // ═══════════════════════════════════════════
  // ANIMATIONS
  // ═══════════════════════════════════════════

  // ─── Intro ───
  yield* waitUntil('intro');

  yield* gridRef().opacity(0.12, 0.8);
  yield* all(
    titleRef().opacity(1, 0.6),
    subtitleRef().opacity(1, 0.5),
  );

  yield* waitFor(1);

  // ─── Source files appear (sequence staggered) ───
  yield* waitUntil('sourcesAppear');

  yield* sequence(0.12,
    srcCpp().opacity(1, 0.4),
    srcRust().opacity(1, 0.4),
    srcGo().opacity(1, 0.4),
    srcZig().opacity(1, 0.4),
  );

  yield* waitFor(0.8);

  // ─── Compiler appears ───
  yield* waitUntil('compilerAppears');

  yield* compilerBox().opacity(1, 0.5);

  yield* waitFor(0.4);

  // ─── Arrows draw in toward compiler (all at once) ───
  yield* waitUntil('arrowsIn');

  yield* all(
    arrowCpp().opacity(1, 0.1),
    arrowRust().opacity(1, 0.1),
    arrowGo().opacity(1, 0.1),
    arrowZig().opacity(1, 0.1),
  );
  yield* all(
    arrowCpp().end(1, 0.5, easeInOutCubic),
    arrowRust().end(1, 0.5, easeInOutCubic),
    arrowGo().end(1, 0.5, easeInOutCubic),
    arrowZig().end(1, 0.5, easeInOutCubic),
  );

  // ─── Compiler pulses (compiling…) ───
  yield* chain(
    compilerGlow(1, 0.35, easeOutCubic),
    compilerGlow(0, 0.35, easeInOutCubic),
    compilerGlow(1, 0.25, easeOutCubic),
    compilerGlow(0, 0.25, easeInOutCubic),
  );

  // ─── Output arrow + .wasm file ───
  yield* waitUntil('wasmAppears');

  yield* arrowOut().opacity(1, 0.1);
  yield* arrowOut().end(1, 0.45, easeOutQuart);

  yield* wasmFile().opacity(1, 0.5);

  yield* waitFor(1);

  // ─── Binary detail panel ───
  yield* waitUntil('binaryDetail');

  yield* binaryBlock().opacity(1, 0.4);
  yield* sequence(0.25,
    binaryRow1().opacity(1, 0.4),
    binaryRow2().opacity(1, 0.4),
    binaryRow3().opacity(1, 0.4),
  );

  yield* waitFor(0.6);
  yield* typesNote().opacity(1, 0.6);

  yield* waitFor(1.5);

  // ─── Transition → Section 2 : Browser execution ───
  yield* waitUntil('browserSection');

  // Fade out section 1 (keep wasm file, reposition it visually via opacity trick)
  yield* all(
    titleRef().opacity(0, 0.3),
    subtitleRef().opacity(0, 0.3),
    srcCpp().opacity(0, 0.3),
    srcRust().opacity(0, 0.3),
    srcGo().opacity(0, 0.3),
    srcZig().opacity(0, 0.3),
    arrowCpp().opacity(0, 0.3),
    arrowRust().opacity(0, 0.3),
    arrowGo().opacity(0, 0.3),
    arrowZig().opacity(0, 0.3),
    compilerBox().opacity(0, 0.3),
    arrowOut().opacity(0, 0.3),
    wasmFile().opacity(0, 0.3),
    binaryBlock().opacity(0, 0.3),
    typesNote().opacity(0, 0.3),
  );

  yield* waitFor(0.2);

  // Section 2 title
  yield* all(
    titleRef().text('WASM DANS LE NAVIGATEUR', 0),
    titleRef().opacity(1, 0.5),
    subtitleRef().text('compilation JIT → code machine natif', 0),
    subtitleRef().opacity(1, 0.4),
  );

  yield* waitFor(0.4);

  // .wasm box reappears on the left of browser
  const wasmLeft = createRef<Rect>();
  const wasmLeftLabel = createRef<Txt>();
  const arrowWasmToBrowser = createRef<Line>();

  view.add(
    <>
      {/* wasmLeft at -0.32 so arrow → browser(0) is clean */}
      <Rect
        ref={wasmLeft}
        x={() => vW() * -0.32}
        y={() => vH() * 0.05}
        width={() => vW() * 0.16}
        height={() => vH() * 0.16}
        fill={`${COLORS.wasm}15`}
        stroke={COLORS.wasm}
        lineWidth={3}
        radius={() => vW() * 0.008}
        opacity={0}
        layout direction={'column'} alignItems={'center'} justifyContent={'center'} gap={6}
      >
        <Txt
          ref={wasmLeftLabel}
          text="module.wasm"
          fill={COLORS.wasm}
          fontSize={() => vW() * 0.016}
          fontWeight={700}
          fontFamily={'DM Mono, monospace'}
        />
        <Txt text="binaire portable" fill={COLORS.wasm} fontSize={() => vW() * 0.011} fontFamily={'Space Grotesk'} opacity={0.6} />
      </Rect>

      {/* Arrow: right edge of wasmLeft (-0.32+0.08=-0.24) → left edge of browser (0-0.11=-0.11) */}
      <Line
        ref={arrowWasmToBrowser}
        stroke={COLORS.browser}
        lineWidth={3}
        opacity={0}
        endArrow
        arrowSize={12}
        points={() => [
          [vW() * -0.235, vH() * 0.05],
          [vW() * -0.115, vH() * 0.05],
        ]}
        end={0}
      />
    </>,
  );

  yield* wasmLeft().opacity(1, 0.5);

  yield* waitFor(0.3);

  // Arrow wasm → browser
  yield* arrowWasmToBrowser().opacity(1, 0.1);
  yield* arrowWasmToBrowser().end(1, 0.4, easeOutCubic);

  // Browser box
  yield* browserBox().opacity(1, 0.5);

  yield* waitFor(0.5);

  // JIT arrow → native
  yield* waitUntil('jitCompile');

  yield* jitArrow().opacity(1, 0.1);
  yield* jitArrow().end(1, 0.45, easeOutCubic);

  yield* nativeBox().opacity(1, 0.5);

  yield* waitFor(0.8);

  // Portability note
  yield* waitUntil('portabilityNote');

  yield* portabilityTxt().opacity(1, 0.6);

  yield* waitFor(2);

  // ─── End ───
  yield* waitUntil('endScene');
  yield* all(
    titleRef().opacity(0, 0.5),
    subtitleRef().opacity(0, 0.5),
    browserBox().opacity(0, 0.5),
    jitArrow().opacity(0, 0.5),
    nativeBox().opacity(0, 0.5),
    portabilityTxt().opacity(0, 0.5),
    wasmLeft().opacity(0, 0.5),
    arrowWasmToBrowser().opacity(0, 0.5),
    gridRef().opacity(0, 0.5),
  );
});
