import {makeScene2D, Grid, Rect, Txt, Icon, Line, Layout} from '@motion-canvas/2d';
import {createRef, all, sequence, waitUntil, waitFor, easeInOutCubic, loop, cancel} from '@motion-canvas/core';
import {DiagramNode, Packet} from '../../components';
import {PALETTE} from '../../theme';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  view.fill(PALETTE.bg);

  // ── Dimensions communes ────────────────────────────────────────────────────
  const nodeY   = () => vH() * 0.16;
  const mainW   = () => vW() * 0.115;
  const mainH   = () => vH() * 0.22;
  const midW    = () => vW() * 0.095;
  const midH    = () => vH() * 0.185;
  const clientX = () => -vW() * 0.38;
  const proxyX  = () => -vW() * 0.13;
  const cacheX  = () => +vW() * 0.13;
  const serverX = () => +vW() * 0.38;

  const clientEdgeX = () => clientX() + mainW() / 2;
  const serverEdgeX = () => serverX() - mainW() / 2;
  const frameUpperY = () => nodeY() - vH() * 0.035;
  const frameLowerY = () => nodeY() + vH() * 0.035;
  const eyeY        = () => nodeY() - midH() / 2 - vH() * 0.075;

  // ── Refs ──────────────────────────────────────────────────────────────────
  const gridRef   = createRef<Grid>();
  const clientNode = createRef<DiagramNode>();
  const proxyNode  = createRef<DiagramNode>();
  const cacheNode  = createRef<DiagramNode>();
  const serverNode = createRef<DiagramNode>();

  const httpLine = createRef<Line>();
  const rawTube  = createRef<Line>();

  const eyeProxyOpen   = createRef<Icon>();
  const eyeProxyClosed = createRef<Icon>();
  const eyeCacheOpen   = createRef<Icon>();
  const eyeCacheClosed = createRef<Icon>();

  const requestPanel       = createRef<Rect>();
  const headerLineGet        = createRef<Txt>();
  const headerLineHost       = createRef<Txt>();
  const headerLineConnection = createRef<Txt>();
  const headerLineUpgrade    = createRef<Txt>();
  const headerLineKey        = createRef<Txt>();

  const requestPacket  = createRef<Packet>();
  const responsePacket = createRef<Packet>();
  const frameToServer  = createRef<Packet>();
  const frameToClient  = createRef<Packet>();

  // ── Scene tree ─────────────────────────────────────────────────────────────
  view.add(<>
    <Grid
      key="bg-grid"
      ref={gridRef}
      width={'100%'} height={'100%'}
      spacing={() => vW() * 0.05}
      stroke={PALETTE.ghost}
      lineWidth={1}
      opacity={0}
    />

    {/* ── Lignes (sous les nœuds) ─────────────────────────────────────────── */}
    <Line
      key="http-line"
      ref={httpLine}
      points={() => [[clientEdgeX(), nodeY()], [serverEdgeX(), nodeY()]]}
      stroke={PALETTE.cyan}
      lineWidth={2}
      lineDash={[10, 8]}
      end={0}
      opacity={0}
    />
    <Line
      key="raw-tube"
      ref={rawTube}
      points={() => [[serverEdgeX(), nodeY()], [clientEdgeX(), nodeY()]]}
      stroke={PALETTE.amber}
      lineWidth={5}
      shadowColor={PALETTE.amber}
      shadowBlur={() => vW() * 0.008}
      end={0}
      opacity={0}
    />

    {/* ── Nœuds ───────────────────────────────────────────────────────────── */}
    <DiagramNode key="client-node" ref={clientNode}
      iconName="mdi:laptop"
      label="CLIENT"
      color={PALETTE.cyan}
      initialState="idle"
      width={mainW} height={mainH}
      x={clientX} y={nodeY}
      opacity={0}
    />
    <DiagramNode key="proxy-node" ref={proxyNode}
      iconName="mdi:swap-horizontal"
      label="PROXY"
      color={PALETTE.secondary}
      initialState="idle"
      width={midW} height={midH}
      x={proxyX} y={nodeY}
      opacity={0}
    />
    <DiagramNode key="cache-node" ref={cacheNode}
      iconName="mdi:archive-outline"
      label="CACHE"
      color={PALETTE.secondary}
      initialState="idle"
      width={midW} height={midH}
      x={cacheX} y={nodeY}
      opacity={0}
    />
    <DiagramNode key="server-node" ref={serverNode}
      iconName="mdi:server"
      label="SERVEUR"
      color={PALETTE.cyan}
      initialState="idle"
      width={mainW} height={mainH}
      x={serverX} y={nodeY}
      opacity={0}
    />

    {/* ── Yeux des intermédiaires ─────────────────────────────────────────── */}
    <Icon key="eye-proxy-open" ref={eyeProxyOpen}
      icon="lucide:eye"
      size={() => vW() * 0.028}
      color={PALETTE.cyan}
      x={proxyX} y={eyeY}
      opacity={0}
    />
    <Icon key="eye-proxy-closed" ref={eyeProxyClosed}
      icon="lucide:eye-off"
      size={() => vW() * 0.028}
      color={PALETTE.ghost}
      x={proxyX} y={eyeY}
      opacity={0}
    />
    <Icon key="eye-cache-open" ref={eyeCacheOpen}
      icon="lucide:eye"
      size={() => vW() * 0.028}
      color={PALETTE.cyan}
      x={cacheX} y={eyeY}
      opacity={0}
    />
    <Icon key="eye-cache-closed" ref={eyeCacheClosed}
      icon="lucide:eye-off"
      size={() => vW() * 0.028}
      color={PALETTE.ghost}
      x={cacheX} y={eyeY}
      opacity={0}
    />

    {/* ── Panneau requête GET ─────────────────────────────────────────────── */}
    <Rect key="request-panel" ref={requestPanel}
      width={() => vW() * 0.46} height={() => vH() * 0.36}
      x={0} y={() => -vH() * 0.26}
      fill={PALETTE.bgCard}
      stroke={PALETTE.ghost}
      lineWidth={1.5}
      radius={10}
      opacity={0}
    >
      <Layout
        key="request-panel-body"
        layout
        direction={'column'}
        alignItems={'start'}
        gap={() => vH() * 0.028}
      >
        <Txt key="header-line-get" ref={headerLineGet}
          text="GET /chat HTTP/1.1"
          fill={PALETTE.cream}
          fontSize={() => vW() * 0.016}
          fontFamily={'JetBrains Mono, DM Mono, monospace'}
          opacity={0}
        />
        <Txt key="header-line-host" ref={headerLineHost}
          text="Host: api.example.com"
          fill={PALETTE.ghost}
          fontSize={() => vW() * 0.016}
          fontFamily={'JetBrains Mono, DM Mono, monospace'}
          opacity={0}
        />
        <Txt key="header-line-connection" ref={headerLineConnection}
          text="Connection: Upgrade"
          fill={PALETTE.ghost}
          fontSize={() => vW() * 0.016}
          fontFamily={'JetBrains Mono, DM Mono, monospace'}
          opacity={0}
        />
        <Txt key="header-line-upgrade" ref={headerLineUpgrade}
          text="Upgrade: websocket"
          fill={PALETTE.ghost}
          fontSize={() => vW() * 0.016}
          fontFamily={'JetBrains Mono, DM Mono, monospace'}
          opacity={0}
        />
        <Txt key="header-line-key" ref={headerLineKey}
          text="Sec-WebSocket-Key: dGhlIHNhbXBsZQ=="
          fill={PALETTE.ghost}
          fontSize={() => vW() * 0.016}
          fontFamily={'JetBrains Mono, DM Mono, monospace'}
          opacity={0}
        />
      </Layout>
    </Rect>

    {/* ── Paquets ─────────────────────────────────────────────────────────── */}
    <Packet key="request-packet" ref={requestPacket}
      content="GET /chat"
      color={PALETTE.cyan}
      packetSize="md"
      width={() => vW() * 0.085} height={() => vH() * 0.05}
      x={clientEdgeX} y={() => nodeY() - vH() * 0.05}
      opacity={0}
    />
    <Packet key="response-packet" ref={responsePacket}
      content="101 Switching Protocols"
      color={PALETTE.amber}
      packetSize="lg"
      width={() => vW() * 0.17} height={() => vH() * 0.055}
      x={serverEdgeX} y={() => nodeY() + vH() * 0.055}
      opacity={0}
    />
    <Packet key="frame-to-server" ref={frameToServer}
      content="01001101"
      color={PALETTE.amber}
      packetSize="sm"
      width={() => vW() * 0.06} height={() => vH() * 0.038}
      x={clientEdgeX} y={frameUpperY}
      opacity={0}
    />
    <Packet key="frame-to-client" ref={frameToClient}
      content="10110010"
      color={PALETTE.amber}
      packetSize="sm"
      width={() => vW() * 0.06} height={() => vH() * 0.038}
      x={serverEdgeX} y={frameLowerY}
      opacity={0}
    />
  </>);

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Deux frames binaires qui se croisent simultanément sur le tube. */
  function* frameCrossing(duration = 1.8) {
    frameToServer().position([clientEdgeX(), frameUpperY()]);
    frameToClient().position([serverEdgeX(), frameLowerY()]);
    yield* all(
      frameToServer().opacity(1, 0.24),
      frameToClient().opacity(1, 0.24),
    );
    yield* all(
      frameToServer().flyTo([serverEdgeX(), frameUpperY()], duration),
      frameToClient().flyTo([clientEdgeX(), frameLowerY()], duration),
    );
    yield* all(
      frameToServer().opacity(0, 0.24),
      frameToClient().opacity(0, 0.24),
    );
  }

  // ── ANIMATION ──────────────────────────────────────────────────────────────

  // Phase 1 : mise en place — chaîne HTTP client → proxy → cache → serveur
  yield* waitUntil('setup');
  yield* gridRef().opacity(0.07, 1.6);
  yield* sequence(0.2,
    clientNode().opacity(1, 0.8),
    proxyNode().opacity(1, 0.8),
    cacheNode().opacity(1, 0.8),
    serverNode().opacity(1, 0.8),
  );
  httpLine().opacity(1);
  yield* httpLine().end(1, 1.4, easeInOutCubic);
  yield* all(
    eyeProxyOpen().opacity(1, 0.7),
    eyeCacheOpen().opacity(1, 0.7),
  );
  yield* waitFor(0.8);

  // Phase 2 : la requête GET et ses headers d'upgrade
  yield* waitUntil('request');
  yield* requestPanel().opacity(1, 0.8);
  yield* sequence(0.24,
    headerLineGet().opacity(1, 0.6),
    headerLineHost().opacity(1, 0.6),
    headerLineConnection().opacity(1, 0.6),
    headerLineUpgrade().opacity(1, 0.6),
    headerLineKey().opacity(1, 0.6),
  );
  yield* waitFor(0.8);

  yield* waitUntil('highlight-upgrade');
  yield* all(
    headerLineConnection().fill(PALETTE.cyan, 0.8),
    headerLineUpgrade().fill(PALETTE.cyan, 0.8),
    headerLineGet().fill(PALETTE.ghost, 0.8),
  );
  yield* waitFor(1.2);

  // La requête voyage — chaque intermédiaire la lit au passage
  requestPacket().position([clientEdgeX(), nodeY() - vH() * 0.05]);
  yield* requestPacket().opacity(1, 0.3);
  yield* requestPacket().flyTo([proxyX(), nodeY() - vH() * 0.05], 0.8);
  yield* proxyNode().setState('active', 0.3);
  yield* requestPacket().flyTo([cacheX(), nodeY() - vH() * 0.05], 0.7);
  yield* all(
    proxyNode().setState('idle', 0.5),
    cacheNode().setState('active', 0.3),
  );
  yield* requestPacket().flyTo([serverEdgeX(), nodeY() - vH() * 0.05], 0.8);
  yield* all(
    cacheNode().setState('idle', 0.5),
    requestPacket().opacity(0, 0.3),
    serverNode().setState('active', 0.4),
  );
  yield* waitFor(0.6);

  // Phase 3 : 101 — la connexion change de nature
  yield* waitUntil('switching');
  responsePacket().position([serverEdgeX(), nodeY() + vH() * 0.055]);
  yield* responsePacket().opacity(1, 0.3);
  yield* responsePacket().flyTo([clientEdgeX(), nodeY() + vH() * 0.055], 2);
  yield* all(
    responsePacket().opacity(0, 0.4),
    clientNode().setState('active', 0.4),
  );
  yield* waitFor(0.4);
  // Transformation : la ligne HTTP structurée devient tube brut
  rawTube().opacity(1);
  yield* all(
    httpLine().opacity(0, 1.2),
    rawTube().end(1, 1.6, easeInOutCubic),
    requestPanel().opacity(0, 1.2),
    headerLineGet().opacity(0, 1.2),
    headerLineHost().opacity(0, 1.2),
    headerLineConnection().opacity(0, 1.2),
    headerLineUpgrade().opacity(0, 1.2),
    headerLineKey().opacity(0, 1.2),
  );
  yield* waitFor(0.8);

  // Phase 4 : frames binaires dans les deux sens, simultanément
  yield* waitUntil('frames');
  yield* frameCrossing(1.8);
  yield* waitFor(0.4);
  yield* frameCrossing(1.6);
  yield* waitFor(0.6);

  // Phase 5 : les intermédiaires deviennent aveugles
  yield* waitUntil('blind');
  yield* all(
    proxyNode().opacity(0.3, 1.4),
    cacheNode().opacity(0.3, 1.4),
    eyeProxyOpen().opacity(0, 1),
    eyeCacheOpen().opacity(0, 1),
    eyeProxyClosed().opacity(1, 1.4),
    eyeCacheClosed().opacity(1, 1.4),
  );
  yield* waitFor(0.6);
  // Les frames les traversent comme des octets opaques
  yield* frameCrossing(1.6);
  yield* waitFor(0.6);

  // Phase 6 : contraste final — le tube pulse, les intermédiaires sont éteints
  yield* waitUntil('pulse');
  const tubePulseTask = yield loop(Infinity, function* () {
    yield* all(
      rawTube().lineWidth(7, 1.2, easeInOutCubic),
      rawTube().shadowBlur(vW() * 0.02, 1.2, easeInOutCubic),
    );
    yield* all(
      rawTube().lineWidth(5, 1.2, easeInOutCubic),
      rawTube().shadowBlur(vW() * 0.008, 1.2, easeInOutCubic),
    );
  });
  yield* frameCrossing(2);
  yield* waitFor(3.2);
  cancel(tubePulseTask);

  // ── Fade-out ───────────────────────────────────────────────────────────────
  yield* waitUntil('end');
  yield* all(
    gridRef().opacity(0, 1),
    clientNode().opacity(0, 1),
    proxyNode().opacity(0, 1),
    cacheNode().opacity(0, 1),
    serverNode().opacity(0, 1),
    rawTube().opacity(0, 1),
    eyeProxyClosed().opacity(0, 1),
    eyeCacheClosed().opacity(0, 1),
  );
  yield* waitFor(0.6);
});
