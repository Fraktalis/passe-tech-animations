import {makeScene2D, Rect, Txt, Layout, Grid} from '@motion-canvas/2d';
import {createRef, all, sequence, waitFor, waitUntil, easeInOutCubic} from '@motion-canvas/core';
import {ConnectionArrow} from '../../components';
import {PALETTE} from '../../theme';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  // ── Refs ──────────────────────────────────────────────────────────────
  const gridRef      = createRef<Grid>();
  const titleRef     = createRef<Txt>();

  // Noeuds
  const nodeARef     = createRef<Rect>();
  const nodeBRef     = createRef<Rect>();
  const nodeCRef     = createRef<Rect>();
  const nodeLabelARef = createRef<Txt>();
  const nodeLabelBRef = createRef<Txt>();
  const nodeLabelCRef = createRef<Txt>();

  // Flèches
  const arrowBasicRef   = createRef<ConnectionArrow>();
  const arrowColoredRef = createRef<ConnectionArrow>();
  const arrowDashedRef  = createRef<ConnectionArrow>();

  // Labels flèches
  const labelBasicRef   = createRef<Txt>();
  const labelColoredRef = createRef<Txt>();
  const labelDashedRef  = createRef<Txt>();

  // ── Scene tree ────────────────────────────────────────────────────────
  view.add(
    <Layout key="root" width={'100%'} height={'100%'}>

      <Rect key="bg" width={'100%'} height={'100%'} fill={PALETTE.bg} />

      <Grid key="grid" ref={gridRef} width={'100%'} height={'100%'}
        spacing={() => vW() * 0.05} stroke={PALETTE.ghost} lineWidth={1} opacity={0} />

      {/* Titre */}
      <Txt key="title" ref={titleRef}
        text="ConnectionArrow" fill={PALETTE.cream}
        fontSize={() => vW() * 0.035} fontFamily={'Space Grotesk, sans-serif'} fontWeight={700}
        y={() => vH() * -0.4} opacity={0} />

      {/* Nœud A — gauche */}
      <Rect key="node-a" ref={nodeARef}
        width={() => vW() * 0.12} height={() => vH() * 0.12}
        fill={PALETTE.bgCard} stroke={PALETTE.blue} lineWidth={2} radius={8}
        x={() => vW() * -0.35} y={() => vH() * 0.0} opacity={0} layout
        alignItems={'center'} justifyContent={'center'}>
        <Txt key="node-a-label" ref={nodeLabelARef} text="A" fill={PALETTE.blue}
          fontSize={() => vW() * 0.025} fontFamily={'Space Grotesk'} fontWeight={700} />
      </Rect>

      {/* Nœud B — centre */}
      <Rect key="node-b" ref={nodeBRef}
        width={() => vW() * 0.12} height={() => vH() * 0.12}
        fill={PALETTE.bgCard} stroke={PALETTE.rose} lineWidth={2} radius={8}
        x={() => vW() * 0.0} y={() => vH() * 0.0} opacity={0} layout
        alignItems={'center'} justifyContent={'center'}>
        <Txt key="node-b-label" ref={nodeLabelBRef} text="B" fill={PALETTE.rose}
          fontSize={() => vW() * 0.025} fontFamily={'Space Grotesk'} fontWeight={700} />
      </Rect>

      {/* Nœud C — droite */}
      <Rect key="node-c" ref={nodeCRef}
        width={() => vW() * 0.12} height={() => vH() * 0.12}
        fill={PALETTE.bgCard} stroke={PALETTE.vert} lineWidth={2} radius={8}
        x={() => vW() * 0.35} y={() => vH() * 0.0} opacity={0} layout
        alignItems={'center'} justifyContent={'center'}>
        <Txt key="node-c-label" ref={nodeLabelCRef} text="C" fill={PALETTE.vert}
          fontSize={() => vW() * 0.025} fontFamily={'Space Grotesk'} fontWeight={700} />
      </Rect>

      {/* Flèche basique A → B */}
      <ConnectionArrow key="arrow-basic" ref={arrowBasicRef}
        from={() => [vW() * -0.29, vH() * 0.0]}
        to={() =>   [vW() * -0.06, vH() * 0.0]}
        stroke={PALETTE.ghost} end={0} opacity={0} />

      {/* Flèche colorée B → C */}
      <ConnectionArrow key="arrow-colored" ref={arrowColoredRef}
        from={() => [vW() * 0.06, vH() * 0.0]}
        to={() =>   [vW() * 0.29, vH() * 0.0]}
        stroke={PALETTE.rose} lineWidth={3} end={0} opacity={0} />

      {/* Flèche en tirets A → C (arc en dessous) */}
      <ConnectionArrow key="arrow-dashed" ref={arrowDashedRef}
        from={() => [vW() * -0.29, vH() * 0.06]}
        to={() =>   [vW() *  0.29, vH() * 0.06]}
        stroke={PALETTE.jaune} dashed end={0} opacity={0} />

      {/* Labels des flèches */}
      <Txt key="label-basic" ref={labelBasicRef}
        text="basique" fill={PALETTE.ghost}
        fontSize={() => vW() * 0.013} fontFamily={'DM Mono, monospace'}
        x={() => vW() * -0.175} y={() => vH() * -0.08} opacity={0} />

      <Txt key="label-colored" ref={labelColoredRef}
        text="colorée · lineWidth=3" fill={PALETTE.rose}
        fontSize={() => vW() * 0.013} fontFamily={'DM Mono, monospace'}
        x={() => vW() * 0.175} y={() => vH() * -0.08} opacity={0} />

      <Txt key="label-dashed" ref={labelDashedRef}
        text="dashed" fill={PALETTE.jaune}
        fontSize={() => vW() * 0.013} fontFamily={'DM Mono, monospace'}
        x={() => vW() * 0.0} y={() => vH() * 0.2} opacity={0} />

    </Layout>
  );

  // ── Animation ─────────────────────────────────────────────────────────
  yield* waitUntil('intro');
  yield* gridRef().opacity(0.12, 0.6);
  yield* titleRef().opacity(1, 0.5);

  // Nœuds apparaissent
  yield* waitUntil('showNodes');
  yield* sequence(0.12,
    nodeARef().opacity(1, 0.35),
    nodeBRef().opacity(1, 0.35),
    nodeCRef().opacity(1, 0.35),
  );

  // Flèche basique
  yield* waitUntil('arrowBasic');
  arrowBasicRef().opacity(1);
  yield* arrowBasicRef().end(1, 0.5, easeInOutCubic);
  yield* labelBasicRef().opacity(1, 0.3);

  // Flèche colorée
  yield* waitUntil('arrowColored');
  arrowColoredRef().opacity(1);
  yield* arrowColoredRef().end(1, 0.5, easeInOutCubic);
  yield* labelColoredRef().opacity(1, 0.3);

  // Flèche dashed
  yield* waitUntil('arrowDashed');
  arrowDashedRef().opacity(1);
  yield* arrowDashedRef().end(1, 0.6, easeInOutCubic);
  yield* labelDashedRef().opacity(1, 0.3);

  yield* waitFor(1.5);

  // ── Fin ───────────────────────────────────────────────────────────────
  yield* waitUntil('end');
  yield* all(
    gridRef().opacity(0, 0.4),
    titleRef().opacity(0, 0.4),
    nodeARef().opacity(0, 0.4),
    nodeBRef().opacity(0, 0.4),
    nodeCRef().opacity(0, 0.4),
    arrowBasicRef().opacity(0, 0.4),
    arrowColoredRef().opacity(0, 0.4),
    arrowDashedRef().opacity(0, 0.4),
    labelBasicRef().opacity(0, 0.4),
    labelColoredRef().opacity(0, 0.4),
    labelDashedRef().opacity(0, 0.4),
  );
  yield* waitFor(0.3);
});
