import {makeScene2D, Rect, Txt, Layout, Grid} from '@motion-canvas/2d';
import {createRef, createSignal, all, sequence, waitFor, waitUntil, loop, cancel} from '@motion-canvas/core';
import {ConnectedNode, ConnectionArrow} from '../../components';
import {PALETTE} from '../../theme';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  // ── Signals externes (compteurs animés depuis la scène) ───────────────
  const serverOneCount   = createSignal(0);
  const serverTwoCount   = createSignal(0);
  const serverThreeCount = createSignal(0);

  // ── Refs ──────────────────────────────────────────────────────────────
  const gridRef    = createRef<Grid>();
  const titleRef   = createRef<Txt>();

  const clientRef  = createRef<ConnectedNode>();
  const lbRef      = createRef<ConnectedNode>();
  const serverOneRef   = createRef<ConnectedNode>();
  const serverTwoRef   = createRef<ConnectedNode>();
  const serverThreeRef = createRef<ConnectedNode>();

  const arrowClientLbRef    = createRef<ConnectionArrow>();
  const arrowLbOneRef       = createRef<ConnectionArrow>();
  const arrowLbTwoRef       = createRef<ConnectionArrow>();
  const arrowLbThreeRef     = createRef<ConnectionArrow>();

  // ── Scene tree ────────────────────────────────────────────────────────
  view.add(
    <Layout key="root" width={'100%'} height={'100%'}>

      <Rect key="bg" width={'100%'} height={'100%'} fill={PALETTE.bg} />

      <Grid key="grid" ref={gridRef} width={'100%'} height={'100%'}
        spacing={() => vW() * 0.05} stroke={PALETTE.ghost} lineWidth={1} opacity={0} />

      <Txt key="title" ref={titleRef}
        text="ConnectedNode" fill={PALETTE.cream}
        fontSize={() => vW() * 0.035} fontFamily={'Space Grotesk, sans-serif'} fontWeight={700}
        y={() => vH() * -0.4} opacity={0} />

      {/* Client */}
      <ConnectedNode key="client" ref={clientRef}
        icon="◈" label="Client" sublabel="browser"
        color={PALETTE.ghost}
        width={() => vW() * 0.14} height={() => vH() * 0.3}
        x={() => vW() * -0.38} opacity={0} />

      {/* Load Balancer */}
      <ConnectedNode key="lb" ref={lbRef}
        icon="⊕" label="LB" sublabel="nginx"
        color={PALETTE.jaune}
        width={() => vW() * 0.14} height={() => vH() * 0.3}
        x={() => vW() * -0.1} opacity={0} />

      {/* Serveurs */}
      <ConnectedNode key="server-1" ref={serverOneRef}
        icon="▣" label="Server 1" sublabel=":8001"
        counterLabel="conn:" counterValue={serverOneCount}
        color={PALETTE.vert}
        width={() => vW() * 0.14} height={() => vH() * 0.28}
        x={() => vW() * 0.22} y={() => vH() * -0.2} opacity={0} />

      <ConnectedNode key="server-2" ref={serverTwoRef}
        icon="▣" label="Server 2" sublabel=":8002"
        counterLabel="conn:" counterValue={serverTwoCount}
        color={PALETTE.vert}
        width={() => vW() * 0.14} height={() => vH() * 0.28}
        x={() => vW() * 0.22} y={() => vH() * 0.06} opacity={0} />

      <ConnectedNode key="server-3" ref={serverThreeRef}
        icon="▣" label="Server 3" sublabel=":8003"
        counterLabel="conn:" counterValue={serverThreeCount}
        color={PALETTE.blue}
        width={() => vW() * 0.14} height={() => vH() * 0.28}
        x={() => vW() * 0.22} y={() => vH() * 0.32} opacity={0} />

      {/* Flèches */}
      <ConnectionArrow key="arrow-client-lb" ref={arrowClientLbRef}
        from={() => [vW() * -0.31, vH() *  0.0]}
        to={() =>   [vW() * -0.17, vH() *  0.0]}
        stroke={PALETTE.ghost} end={0} opacity={0} />

      <ConnectionArrow key="arrow-lb-s1" ref={arrowLbOneRef}
        from={() => [vW() * -0.03, vH() * -0.05]}
        to={() =>   [vW() *  0.15, vH() * -0.2]}
        stroke={PALETTE.vert} end={0} opacity={0} />

      <ConnectionArrow key="arrow-lb-s2" ref={arrowLbTwoRef}
        from={() => [vW() * -0.03, vH() * 0.0]}
        to={() =>   [vW() *  0.15, vH() * 0.06]}
        stroke={PALETTE.vert} end={0} opacity={0} />

      <ConnectionArrow key="arrow-lb-s3" ref={arrowLbThreeRef}
        from={() => [vW() * -0.03, vH() *  0.05]}
        to={() =>   [vW() *  0.15, vH() *  0.32]}
        stroke={PALETTE.blue} dashed end={0} opacity={0} />

    </Layout>
  );

  // ── Animation ─────────────────────────────────────────────────────────
  yield* waitUntil('intro');
  yield* all(
    gridRef().opacity(0.12, 0.6),
    titleRef().opacity(1, 0.5),
  );

  // Nœuds
  yield* waitUntil('showNodes');
  yield* sequence(0.1,
    clientRef().opacity(1, 0.4),
    lbRef().opacity(1, 0.4),
    serverOneRef().opacity(1, 0.35),
    serverTwoRef().opacity(1, 0.35),
    serverThreeRef().opacity(1, 0.35),
  );

  // Flèches
  yield* waitUntil('drawArrows');
  arrowClientLbRef().opacity(1);
  yield* arrowClientLbRef().end(1, 0.4);

  arrowLbOneRef().opacity(1);
  arrowLbTwoRef().opacity(1);
  arrowLbThreeRef().opacity(1);
  yield* all(
    arrowLbOneRef().end(1, 0.4),
    arrowLbTwoRef().end(1, 0.4),
    arrowLbThreeRef().end(1, 0.4),
  );

  // Compteurs animés — round-robin simulé
  yield* waitUntil('animate');
  yield* sequence(0.3,
    serverOneCount(1, 0.2),
    serverTwoCount(1, 0.2),
    serverThreeCount(1, 0.2),
    serverOneCount(2, 0.2),
    serverTwoCount(2, 0.2),
    serverOneCount(3, 0.2),
  );

  yield* waitFor(1.5);

  // ── Fin ───────────────────────────────────────────────────────────────
  yield* waitUntil('end');
  yield* all(
    gridRef().opacity(0, 0.4),
    titleRef().opacity(0, 0.4),
    clientRef().opacity(0, 0.4),
    lbRef().opacity(0, 0.4),
    serverOneRef().opacity(0, 0.4),
    serverTwoRef().opacity(0, 0.4),
    serverThreeRef().opacity(0, 0.4),
    arrowClientLbRef().opacity(0, 0.4),
    arrowLbOneRef().opacity(0, 0.4),
    arrowLbTwoRef().opacity(0, 0.4),
    arrowLbThreeRef().opacity(0, 0.4),
  );
  yield* waitFor(0.3);
});
