/**
 * PASSE-TECH — Scene Boilerplate
 * Copy this file, rename it, then adapt phases and elements.
 * Register in src/project.ts when ready.
 */

import {makeScene2D, Rect, Txt, Layout, Line, Grid} from '@motion-canvas/2d';
import {
  createRef,
  all,
  sequence,
  waitFor,
  waitUntil,
  easeInOutCubic,
  easeOutCubic,
} from '@motion-canvas/core';

export default makeScene2D(function* (view) {
  // ── Responsive helpers ──────────────────────────────────────────────────
  const vW = () => view.width();
  const vH = () => view.height();

  // ── Brand palette ───────────────────────────────────────────────────────
  const COLORS = {
    bg:    '#0D1117',
    cream: '#F9F9F6',
    ghost: '#484F58',
    rose:  '#FF3E6C',
    vert:  '#6DFF8A',
    jaune: '#FFE14D',
    blue:  '#58A6FF',
  };

  // ── Refs ────────────────────────────────────────────────────────────────
  const camera    = createRef<Layout>();
  const gridRef   = createRef<Grid>();
  const titleRef  = createRef<Txt>();
  const panelRef  = createRef<Rect>();
  const arrowRef  = createRef<Line>();

  // ── Scene tree ──────────────────────────────────────────────────────────
  view.add(
    <Layout key="camera" ref={camera} width={'100%'} height={'100%'}>

      {/* Background */}
      <Rect key="bg" width={'100%'} height={'100%'} fill={COLORS.bg} />

      {/* Optional grid */}
      <Grid
        key="grid"
        ref={gridRef}
        width={'100%'}
        height={'100%'}
        spacing={() => vW() * 0.05}
        stroke={COLORS.ghost}
        lineWidth={1}
        opacity={0}
      />

      {/* Title */}
      <Txt
        key="title"
        ref={titleRef}
        text="Animation Title"
        fill={COLORS.cream}
        fontSize={() => vW() * 0.04}
        fontFamily={'Space Grotesk, sans-serif'}
        fontWeight={700}
        y={() => vH() * -0.38}
        opacity={0}
      />

      {/* Main panel */}
      <Rect
        key="main-panel"
        ref={panelRef}
        width={() => vW() * 0.7}
        height={() => vH() * 0.5}
        fill={'#00000000'}
        stroke={COLORS.rose}
        lineWidth={2}
        radius={() => vW() * 0.005}
        opacity={0}
      />

      {/* Example arrow — set end={0} to draw it later */}
      <Line
        key="main-arrow"
        ref={arrowRef}
        points={() => [
          [vW() * -0.15, vH() * 0.0],
          [vW() *  0.15, vH() * 0.0],
        ]}
        stroke={COLORS.rose}
        lineWidth={2}
        endArrow
        arrowSize={10}
        end={0}
        opacity={0}
      />

    </Layout>
  );

  // ── Phase 1 : Intro ─────────────────────────────────────────────────────
  yield* waitUntil('intro');
  yield* gridRef().opacity(0.12, 0.6);
  yield* titleRef().opacity(1, 0.5);

  // ── Phase 2 : Show diagram ──────────────────────────────────────────────
  yield* waitUntil('showDiagram');
  yield* panelRef().opacity(1, 0.45);

  // ── Phase 3 : Animate connection ────────────────────────────────────────
  yield* waitUntil('connect');
  arrowRef().opacity(1);
  yield* arrowRef().end(1, 0.5, easeInOutCubic);

  // ── Phase 4 : Zoom in on detail ─────────────────────────────────────────
  yield* waitUntil('zoomDetail');
  const zoomScale = 1.8;
  const focusX    = vW() * 0.05;
  const focusY    = vH() * 0.02;
  yield* all(
    camera().scale(zoomScale, 0.7, easeInOutCubic),
    camera().position([-zoomScale * focusX, -zoomScale * focusY], 0.7, easeInOutCubic),
  );

  yield* waitUntil('zoomOut');
  yield* all(
    camera().scale(1, 0.5, easeInOutCubic),
    camera().position([0, 0], 0.5, easeInOutCubic),
  );

  // ── End ─────────────────────────────────────────────────────────────────
  yield* waitUntil('end');
  yield* all(
    gridRef().opacity(0, 0.4),
    titleRef().opacity(0, 0.4),
    panelRef().opacity(0, 0.4),
    arrowRef().opacity(0, 0.4),
  );
  yield* waitFor(0.3);
});
