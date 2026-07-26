import {makeScene2D, Grid, Txt, Line, Layout} from '@motion-canvas/2d';
import {createRef, all, sequence, waitUntil, waitFor, easeInOutCubic, easeOutCubic, loop, cancel} from '@motion-canvas/core';
import {ConnectionArrow, DiagramNode, Packet} from '../../components';
import {PALETTE} from '../../theme';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  view.fill(PALETTE.bg);

  // ── Dimensions communes ────────────────────────────────────────────────────
  const nodeY   = () => -vH() * 0.06;
  const mainW   = () => vW() * 0.13;
  const mainH   = () => vH() * 0.26;
  const clientX = () => -vW() * 0.30;
  const serverX = () => +vW() * 0.30;

  const clientEdgeX = () => clientX() + mainW() / 2;
  const serverEdgeX = () => serverX() - mainW() / 2;
  const requestY    = () => nodeY() - vH() * 0.045;
  const responseY   = () => nodeY() + vH() * 0.045;

  // Split-screen — colonne gauche (Streamable HTTP) vs colonne droite (WebSocket)
  const splitTitleY      = () => -vH() * 0.40;
  const splitNodeY       = () => -vH() * 0.08;
  const splitMainW       = () => vW() * 0.075;
  const splitMainH       = () => vH() * 0.15;
  const leftColX         = () => -vW() * 0.25;
  const rightColX        = () => +vW() * 0.25;
  const leftClientX      = () => leftColX() - vW() * 0.085;
  const leftServerX      = () => leftColX() + vW() * 0.085;
  const rightClientX     = () => rightColX() - vW() * 0.085;
  const rightServerX     = () => rightColX() + vW() * 0.085;
  const leftClientEdgeX  = () => leftClientX() + splitMainW() / 2;
  const leftServerEdgeX  = () => leftServerX() - splitMainW() / 2;
  const rightClientEdgeX = () => rightClientX() + splitMainW() / 2;
  const rightServerEdgeX = () => rightServerX() - splitMainW() / 2;
  const splitRequestY    = () => splitNodeY() - vH() * 0.035;
  const splitResponseY   = () => splitNodeY() + vH() * 0.035;

  // ── Refs ──────────────────────────────────────────────────────────────────
  const gridRef    = createRef<Grid>();
  const clientNode = createRef<DiagramNode>();
  const serverNode = createRef<DiagramNode>();

  const requestArrow  = createRef<ConnectionArrow>();
  const responseArrow = createRef<ConnectionArrow>();

  const postPacket     = createRef<Packet>();
  const responsePacket = createRef<Packet>();
  const ssePacket      = createRef<Packet>();

  const sseStack = createRef<Layout>();
  const sseLine1 = createRef<Txt>();
  const sseLine2 = createRef<Txt>();
  const sseLine3 = createRef<Txt>();

  const splitDivider = createRef<Line>();
  const leftTitle  = createRef<Txt>();
  const rightTitle = createRef<Txt>();

  const splitClientNode = createRef<DiagramNode>();
  const splitServerNode = createRef<DiagramNode>();
  const splitRequestArrow  = createRef<ConnectionArrow>();
  const splitResponseArrow = createRef<ConnectionArrow>();
  const splitPostPacket     = createRef<Packet>();
  const splitResponsePacket = createRef<Packet>();

  const wsClientNode = createRef<DiagramNode>();
  const wsServerNode = createRef<DiagramNode>();
  const wsTube        = createRef<Line>();
  const frameToServerWs = createRef<Packet>();
  const frameToClientWs = createRef<Packet>();

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

    {/* ── Client + serveur MCP, un seul endpoint ──────────────────────────── */}
    <DiagramNode key="client-node" ref={clientNode}
      iconName="mdi:laptop"
      label="CLIENT"
      color={PALETTE.secondary}
      initialState="idle"
      width={mainW} height={mainH}
      x={clientX} y={nodeY}
      opacity={0}
    />
    <DiagramNode key="server-node" ref={serverNode}
      iconName="mdi:server"
      label="SERVEUR MCP"
      sublabel="/mcp"
      color={PALETTE.dsGreen}
      initialState="idle"
      width={mainW} height={mainH}
      x={serverX} y={nodeY}
      opacity={0}
    />

    {/* ── Flèches d'échange (éphémères) ───────────────────────────────────── */}
    <ConnectionArrow key="request-arrow" ref={requestArrow}
      from={() => [clientEdgeX(), requestY()]}
      to={() => [serverEdgeX(), requestY()]}
      stroke={PALETTE.dsGreen}
      routing={0}
      end={0} opacity={0}
    />
    <ConnectionArrow key="response-arrow" ref={responseArrow}
      from={() => [serverEdgeX(), responseY()]}
      to={() => [clientEdgeX(), responseY()]}
      stroke={PALETTE.dsGreen}
      routing={0}
      end={0} opacity={0}
    />

    {/* ── Paquets ─────────────────────────────────────────────────────────── */}
    <Packet key="post-packet" ref={postPacket}
      content="POST /mcp"
      color={PALETTE.dsGreen}
      packetSize="md"
      width={() => vW() * 0.09} height={() => vH() * 0.05}
      x={clientEdgeX} y={requestY}
      opacity={0}
    />
    <Packet key="response-packet" ref={responsePacket}
      content={'{ "result": … }'}
      color={PALETTE.dsGreen}
      packetSize="lg"
      width={() => vW() * 0.12} height={() => vH() * 0.055}
      x={serverEdgeX} y={responseY}
      opacity={0}
    />
    <Packet key="sse-packet" ref={ssePacket}
      content="data:"
      color={PALETTE.dsGreen}
      packetSize="sm"
      width={() => vW() * 0.05} height={() => vH() * 0.038}
      x={serverEdgeX} y={responseY}
      opacity={0}
    />

    {/* ── Flux SSE — lignes empilées ──────────────────────────────────────── */}
    <Layout
      key="sse-stack"
      ref={sseStack}
      layout
      direction={'column'}
      alignItems={'start'}
      gap={() => vH() * 0.045}
      x={0} y={() => vH() * 0.28}
    >
      <Txt key="sse-line-1" ref={sseLine1}
        text={'data: {"chunk": 1}'}
        fill={PALETTE.dsGreen}
        fontSize={() => vW() * 0.015}
        fontFamily={'JetBrains Mono, DM Mono, monospace'}
        opacity={0}
      />
      <Txt key="sse-line-2" ref={sseLine2}
        text={'data: {"chunk": 2}'}
        fill={PALETTE.dsGreen}
        fontSize={() => vW() * 0.015}
        fontFamily={'JetBrains Mono, DM Mono, monospace'}
        opacity={0}
      />
      <Txt key="sse-line-3" ref={sseLine3}
        text={'data: {"done": true}'}
        fill={PALETTE.dsGreen}
        fontSize={() => vW() * 0.015}
        fontFamily={'JetBrains Mono, DM Mono, monospace'}
        opacity={0}
      />
    </Layout>

    {/* ── Split-screen : Streamable HTTP (gauche) vs WebSocket (droite) ───── */}
    <Line
      key="split-divider"
      ref={splitDivider}
      points={() => [[0, -vH() * 0.32], [0, vH() * 0.32]]}
      stroke={PALETTE.ghost}
      lineWidth={1}
      end={0}
      opacity={0}
    />

    <Txt key="left-title" ref={leftTitle}
      text="Streamable HTTP"
      fill={PALETTE.dsGreen}
      fontSize={() => vW() * 0.019}
      fontFamily={'Space Grotesk, sans-serif'}
      fontWeight={700}
      x={leftColX} y={splitTitleY}
      opacity={0}
    />
    <Txt key="right-title" ref={rightTitle}
      text="WebSocket"
      fill={PALETTE.amber}
      fontSize={() => vW() * 0.019}
      fontFamily={'Space Grotesk, sans-serif'}
      fontWeight={700}
      x={rightColX} y={splitTitleY}
      opacity={0}
    />

    {/* Colonne gauche : mini paire client/serveur — échanges POST qui s'ouvrent et se referment */}
    <DiagramNode key="split-client-node" ref={splitClientNode}
      iconName="mdi:laptop"
      label="CLIENT"
      color={PALETTE.dsGreen}
      initialState="idle"
      width={splitMainW} height={splitMainH}
      x={leftClientX} y={splitNodeY}
      opacity={0}
    />
    <DiagramNode key="split-server-node" ref={splitServerNode}
      iconName="mdi:server"
      label="SERVEUR"
      color={PALETTE.dsGreen}
      initialState="idle"
      width={splitMainW} height={splitMainH}
      x={leftServerX} y={splitNodeY}
      opacity={0}
    />
    <ConnectionArrow key="split-request-arrow" ref={splitRequestArrow}
      from={() => [leftClientEdgeX(), splitRequestY()]}
      to={() => [leftServerEdgeX(), splitRequestY()]}
      stroke={PALETTE.dsGreen}
      routing={0}
      end={0} opacity={0}
    />
    <ConnectionArrow key="split-response-arrow" ref={splitResponseArrow}
      from={() => [leftServerEdgeX(), splitResponseY()]}
      to={() => [leftClientEdgeX(), splitResponseY()]}
      stroke={PALETTE.dsGreen}
      routing={0}
      end={0} opacity={0}
    />
    <Packet key="split-post-packet" ref={splitPostPacket}
      content="POST"
      color={PALETTE.dsGreen}
      packetSize="sm"
      width={() => vW() * 0.055} height={() => vH() * 0.035}
      x={leftClientEdgeX} y={splitRequestY}
      opacity={0}
    />
    <Packet key="split-response-packet" ref={splitResponsePacket}
      content="200"
      color={PALETTE.dsGreen}
      packetSize="sm"
      width={() => vW() * 0.05} height={() => vH() * 0.035}
      x={leftServerEdgeX} y={splitResponseY}
      opacity={0}
    />

    {/* Colonne droite : mini paire client/serveur — tube WebSocket persistant */}
    <DiagramNode key="ws-client-node" ref={wsClientNode}
      iconName="mdi:laptop"
      label="CLIENT"
      color={PALETTE.amber}
      initialState="idle"
      width={splitMainW} height={splitMainH}
      x={rightClientX} y={splitNodeY}
      opacity={0}
    />
    <DiagramNode key="ws-server-node" ref={wsServerNode}
      iconName="mdi:server"
      label="SERVEUR"
      color={PALETTE.amber}
      initialState="idle"
      width={splitMainW} height={splitMainH}
      x={rightServerX} y={splitNodeY}
      opacity={0}
    />
    <Line
      key="ws-tube"
      ref={wsTube}
      points={() => [[rightClientEdgeX(), splitNodeY()], [rightServerEdgeX(), splitNodeY()]]}
      stroke={PALETTE.amber}
      lineWidth={5}
      shadowColor={PALETTE.amber}
      shadowBlur={() => vW() * 0.008}
      end={0}
      opacity={0}
    />
    <Packet key="frame-to-server-ws" ref={frameToServerWs}
      content="01"
      color={PALETTE.amber}
      packetSize="sm"
      width={() => vW() * 0.035} height={() => vH() * 0.028}
      x={rightClientEdgeX} y={() => splitNodeY() - vH() * 0.025}
      opacity={0}
    />
    <Packet key="frame-to-client-ws" ref={frameToClientWs}
      content="10"
      color={PALETTE.amber}
      packetSize="sm"
      width={() => vW() * 0.035} height={() => vH() * 0.028}
      x={rightServerEdgeX} y={() => splitNodeY() + vH() * 0.025}
      opacity={0}
    />
  </>);

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Ouvre un échange : la flèche de requête se dessine, le POST vole. */
  function* postExchangeOpen() {
    requestArrow().end(0);
    requestArrow().opacity(1);
    yield* requestArrow().end(1, 0.9, easeInOutCubic);
    postPacket().position([clientEdgeX(), requestY()]);
    yield* postPacket().opacity(1, 0.24);
    yield* postPacket().flyTo([serverEdgeX(), requestY()], 1.4);
    yield* all(
      postPacket().opacity(0, 0.3),
      serverNode().setState('active', 0.4),
    );
  }

  /** Referme l'échange : tout se dissout, la scène redevient calme. */
  function* exchangeClose() {
    yield* all(
      requestArrow().opacity(0, 0.8),
      responseArrow().opacity(0, 0.8),
      serverNode().setState('idle', 0.8),
      clientNode().setState('idle', 0.8),
    );
    responseArrow().end(0);
  }

  // ── ANIMATION ──────────────────────────────────────────────────────────────

  // Phase 1 : client + serveur MCP, un seul endpoint
  yield* waitUntil('setup');
  yield* gridRef().opacity(0.07, 1.6);
  yield* sequence(0.3,
    clientNode().opacity(1, 0.9),
    serverNode().opacity(1, 0.9),
  );
  yield* waitFor(1);

  // Phase 2 : POST n°1 → réponse JSON d'un bloc
  yield* waitUntil('post-1');
  yield* postExchangeOpen();
  yield* waitFor(0.4);
  responseArrow().opacity(1);
  yield* responseArrow().end(1, 0.9, easeInOutCubic);
  responsePacket().position([serverEdgeX(), responseY()]);
  yield* responsePacket().opacity(1, 0.24);
  yield* responsePacket().flyTo([clientEdgeX(), responseY()], 1.4);
  yield* all(
    responsePacket().opacity(0, 0.3),
    clientNode().setState('active', 0.4),
  );
  yield* waitFor(0.8);

  yield* waitUntil('close-1');
  yield* exchangeClose();
  yield* waitFor(1.2);

  // Phase 3 : POST n°2 → la réponse coule en flux SSE
  yield* waitUntil('post-2');
  yield* postExchangeOpen();
  yield* waitFor(0.4);
  responseArrow().opacity(1);
  yield* responseArrow().end(1, 0.9, easeInOutCubic);

  const sseLines = [sseLine1, sseLine2, sseLine3];
  for (const sseLineRef of sseLines) {
    ssePacket().position([serverEdgeX(), responseY()]);
    yield* ssePacket().opacity(1, 0.2);
    yield* ssePacket().flyTo([clientEdgeX(), responseY()], 1.1);
    yield* all(
      ssePacket().opacity(0, 0.2),
      sseLineRef().opacity(1, 0.6, easeOutCubic),
    );
    yield* waitFor(0.3);
  }
  yield* waitFor(1.2);

  yield* waitUntil('close-2');
  yield* all(
    exchangeClose(),
    sseLine1().opacity(0, 0.8),
    sseLine2().opacity(0, 0.8),
    sseLine3().opacity(0, 0.8),
  );
  yield* waitFor(1);

  // Phase 4 : split-screen — Streamable HTTP (échanges qui se referment) vs WebSocket (tube permanent)
  yield* waitUntil('split');
  yield* all(
    clientNode().opacity(0, 1),
    serverNode().opacity(0, 1),
  );
  splitDivider().opacity(1);
  yield* splitDivider().end(1, 1, easeInOutCubic);
  yield* sequence(0.3,
    leftTitle().opacity(1, 0.7),
    rightTitle().opacity(1, 0.7),
  );
  yield* sequence(0.2,
    all(splitClientNode().opacity(1, 0.7), splitServerNode().opacity(1, 0.7)),
    all(wsClientNode().opacity(1, 0.7), wsServerNode().opacity(1, 0.7)),
  );
  yield* waitFor(0.6);

  // Droite : le tube WebSocket s'ouvre et reste ouvert, pulsant en continu, des frames y circulent
  wsTube().opacity(1);
  yield* wsTube().end(1, 1, easeInOutCubic);
  const wsTubePulseTask = yield loop(Infinity, function* () {
    yield* all(
      wsTube().lineWidth(7, 1.1, easeInOutCubic),
      wsTube().shadowBlur(vW() * 0.018, 1.1, easeInOutCubic),
    );
    yield* all(
      wsTube().lineWidth(5, 1.1, easeInOutCubic),
      wsTube().shadowBlur(vW() * 0.008, 1.1, easeInOutCubic),
    );
  });
  const wsFramesTask = yield loop(Infinity, function* () {
    frameToServerWs().position([rightClientEdgeX(), splitNodeY() - vH() * 0.025]);
    frameToClientWs().position([rightServerEdgeX(), splitNodeY() + vH() * 0.025]);
    yield* all(
      frameToServerWs().opacity(1, 0.2),
      frameToClientWs().opacity(1, 0.2),
    );
    yield* all(
      frameToServerWs().flyTo([rightServerEdgeX(), splitNodeY() - vH() * 0.025], 1.2),
      frameToClientWs().flyTo([rightClientEdgeX(), splitNodeY() + vH() * 0.025], 1.2),
    );
    yield* all(
      frameToServerWs().opacity(0, 0.2),
      frameToClientWs().opacity(0, 0.2),
    );
    yield* waitFor(0.5);
  });

  // Gauche : trois échanges POST successifs — chacun s'ouvre, se referme, avant le suivant
  for (let exchangeIndex = 0; exchangeIndex < 3; exchangeIndex++) {
    splitRequestArrow().end(0);
    splitRequestArrow().opacity(1);
    yield* splitRequestArrow().end(1, 0.7, easeInOutCubic);
    splitPostPacket().position([leftClientEdgeX(), splitRequestY()]);
    yield* splitPostPacket().opacity(1, 0.2);
    yield* splitPostPacket().flyTo([leftServerEdgeX(), splitRequestY()], 1);
    yield* all(
      splitPostPacket().opacity(0, 0.2),
      splitServerNode().setState('active', 0.3),
    );

    splitResponseArrow().end(0);
    splitResponseArrow().opacity(1);
    yield* splitResponseArrow().end(1, 0.7, easeInOutCubic);
    splitResponsePacket().position([leftServerEdgeX(), splitResponseY()]);
    yield* splitResponsePacket().opacity(1, 0.2);
    yield* splitResponsePacket().flyTo([leftClientEdgeX(), splitResponseY()], 1);
    yield* all(
      splitResponsePacket().opacity(0, 0.2),
      splitServerNode().setState('idle', 0.4),
      splitClientNode().setState('active', 0.3),
    );
    yield* waitFor(0.4);

    // L'échange se referme entièrement avant le suivant
    yield* all(
      splitRequestArrow().opacity(0, 0.6),
      splitResponseArrow().opacity(0, 0.6),
      splitClientNode().setState('idle', 0.6),
    );
    splitRequestArrow().end(0);
    splitResponseArrow().end(0);
    yield* waitFor(0.6);
  }
  yield* waitFor(1.6);

  // Phase 5 : contraste final — le tube WebSocket et sa paire s'estompent, Streamable reste plein
  yield* waitUntil('ws-fades');
  cancel(wsTubePulseTask);
  cancel(wsFramesTask);
  yield* all(
    wsTube().opacity(0.15, 1.6),
    wsClientNode().opacity(0.15, 1.6),
    wsServerNode().opacity(0.15, 1.6),
    rightTitle().opacity(0.15, 1.6),
  );
  yield* waitFor(3);

  // ── Fade-out ───────────────────────────────────────────────────────────────
  yield* waitUntil('end');
  yield* all(
    gridRef().opacity(0, 1),
    splitDivider().opacity(0, 1),
    leftTitle().opacity(0, 1),
    rightTitle().opacity(0, 1),
    splitClientNode().opacity(0, 1),
    splitServerNode().opacity(0, 1),
    wsTube().opacity(0, 1),
    wsClientNode().opacity(0, 1),
    wsServerNode().opacity(0, 1),
  );
  yield* waitFor(0.6);
});
