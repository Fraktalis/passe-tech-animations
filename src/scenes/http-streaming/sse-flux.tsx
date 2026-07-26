/**
 * sse-flux — La réponse HTTP qui ne se ferme jamais (ACTE 1 — SSE).
 *
 * Du texte brut qui s'empile dans une réponse HTTP restée ouverte. La seule
 * règle héritée d'HTTP — la ligne vide qui sépare deux morceaux — est répétée
 * à l'infini. Proxy, cache, gateway continuent de voir une réponse normale.
 * Limite : le canal est unidirectionnel — un talkie-walkie bouton enfoncé.
 *
 * Couleur active : vert (flux vivant). Rose uniquement pour le rebond client.
 */
import {makeScene2D, Grid, Layout, Rect, Txt, Line, Icon} from '@motion-canvas/2d';
import {
  createRef,
  Reference,
  all,
  sequence,
  waitUntil,
  waitFor,
  easeInOutCubic,
  easeOutCubic,
  loop,
  cancel,
} from '@motion-canvas/core';
import {DiagramNode, Packet, Terminal, ConnectionArrow} from '../../components';
import {PALETTE} from '../../theme';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  view.fill(PALETTE.bg);

  // ── Dimensions communes ────────────────────────────────────────────────────
  const NW = () => vW() * 0.12;
  const NH = () => vH() * 0.22;
  const clientX = () => -vW() * 0.34;
  const serverX = () => +vW() * 0.34;
  const proxyX  = () => 0;
  const nodesY  = () => -vH() * 0.27;
  const terminalY = () => +vH() * 0.17;
  const terminalFontSize = () => vW() * 0.0125;

  // ── Refs ───────────────────────────────────────────────────────────────────
  const gridRef            = createRef<Grid>();
  const cameraLayout       = createRef<Layout>();
  const clientNode         = createRef<DiagramNode>();
  const serverNode         = createRef<DiagramNode>();
  const proxyNode          = createRef<DiagramNode>();
  const linkLine           = createRef<Line>();
  const sseRequestCard     = createRef<Rect>();
  const sseTerminal        = createRef<Terminal>();
  const emptyLineHighlight = createRef<Rect>();
  const streamPacketA      = createRef<Packet>();
  const streamPacketB      = createRef<Packet>();
  const bounceArrow        = createRef<ConnectionArrow>();
  const radioIcon          = createRef<Icon>();

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

    <Layout key="camera" ref={cameraLayout}>
      <DiagramNode key="client-node" ref={clientNode}
        iconName="mdi:web"
        label="CLIENT"
        color={PALETTE.secondary}
        initialState="idle"
        width={NW} height={NH}
        x={clientX} y={nodesY}
        opacity={0}
      />
      <DiagramNode key="server-node" ref={serverNode}
        iconName="mdi:server"
        label="SERVEUR"
        color={PALETTE.secondary}
        initialState="idle"
        width={NW} height={NH}
        x={serverX} y={nodesY}
        opacity={0}
      />

      {/* Connexion client ↔ serveur — le proxy apparaîtra dessus */}
      <Line key="link-line" ref={linkLine}
        points={() => [
          [clientX() + NW() / 2 + vW() * 0.012, nodesY()],
          [serverX() - NW() / 2 - vW() * 0.012, nodesY()],
        ]}
        stroke={PALETTE.ghost}
        lineWidth={1}
        end={0}
        opacity={0}
      />

      {/* Proxy muted — traversé sans alerte */}
      <DiagramNode key="proxy-node" ref={proxyNode}
        iconName="mdi:swap-horizontal"
        label="PROXY"
        color={PALETTE.secondary}
        initialState="idle"
        width={() => vW() * 0.095}
        height={() => vH() * 0.18}
        x={proxyX} y={nodesY}
        opacity={0}
      />

      {/* Requête GET + header Accept visible */}
      <Rect key="sse-request-card" ref={sseRequestCard}
        fill={PALETTE.vert + '18'}
        stroke={PALETTE.vert}
        lineWidth={1}
        radius={6}
        layout
        direction={'column'}
        alignItems={'start'}
        gap={() => vH() * 0.008}
        padding={() => vW() * 0.008}
        x={() => clientX() + vW() * 0.02}
        y={() => nodesY() + vH() * 0.14}
        opacity={0}
      >
        <Txt key="sse-request-line" text="GET /events HTTP/1.1"
          fill={PALETTE.vert}
          fontSize={() => vW() * 0.011}
          fontFamily={'JetBrains Mono, DM Mono, monospace'}
          fontWeight={700}
        />
        <Txt key="sse-request-header" text="Accept: text/event-stream"
          fill={PALETTE.vert}
          fontSize={() => vW() * 0.010}
          fontFamily={'JetBrains Mono, DM Mono, monospace'}
        />
      </Rect>

      {/* La réponse qui ne se referme pas — bord pulsant vert */}
      <Terminal key="sse-terminal" ref={sseTerminal}
        title="HTTP/1.1 200 — text/event-stream"
        maxLines={9}
        fontSize={terminalFontSize}
        width={() => vW() * 0.36}
        height={() => vH() * 0.52}
        x={0} y={terminalY}
        stroke={PALETTE.vert}
        opacity={0}
      />

      {/* Surbrillance ambre de la ligne vide */}
      <Rect key="empty-line-highlight" ref={emptyLineHighlight}
        width={() => vW() * 0.30}
        height={() => terminalFontSize() * 1.6}
        fill={PALETTE.amber + '2E'}
        stroke={PALETTE.amber}
        lineWidth={1}
        radius={4}
        opacity={0}
      />

      {/* Flux qui traverse le proxy */}
      <Packet key="stream-packet-a" ref={streamPacketA}
        content="data:"
        color={PALETTE.vert}
        packetSize="sm"
        width={() => vW() * 0.05}
        height={() => vH() * 0.042}
        x={() => serverX() - NW() / 2 - vW() * 0.03}
        y={() => nodesY() - vH() * 0.05}
        opacity={0}
      />
      <Packet key="stream-packet-b" ref={streamPacketB}
        content="data:"
        color={PALETTE.vert}
        packetSize="sm"
        width={() => vW() * 0.05}
        height={() => vH() * 0.042}
        x={() => serverX() - NW() / 2 - vW() * 0.03}
        y={() => nodesY() - vH() * 0.05}
        opacity={0}
      />

      {/* Tentative de retour client → serveur — rebond */}
      <ConnectionArrow key="bounce-arrow" ref={bounceArrow}
        from={() => [clientX() + NW() / 2 + vW() * 0.012, nodesY() + vH() * 0.04]}
        to={() =>   [serverX() - NW() / 2 - vW() * 0.012, nodesY() + vH() * 0.04]}
        stroke={PALETTE.rose}
        routing={0}
        end={0}
        opacity={0}
      />

      {/* Talkie-walkie — bouton enfoncé */}
      <Icon key="radio-icon" ref={radioIcon}
        icon="lucide:radio"
        size={() => vW() * 0.035}
        color={PALETTE.vert}
        x={clientX}
        y={() => nodesY() - NH() / 2 - vH() * 0.09}
        opacity={0}
      />
    </Layout>
  </>);

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Position monde du centre horizontal du terminal, à la hauteur d'une ligne. */
  const emptyLineWorldPos = (lineIndex: number): [number, number] => {
    const terminalWorld = sseTerminal().absolutePosition();
    const lineNode = sseTerminal().line(lineIndex);
    const lineY = lineNode ? lineNode.absolutePosition().y : terminalWorld.y;
    return [terminalWorld.x, lineY];
  };

  // Trajet serveur → client pour les paquets qui livrent chaque événement SSE.
  const eventPacketY      = () => nodesY() - vH() * 0.05;
  const eventPacketStartX = () => serverX() - NW() / 2 - vW() * 0.03;
  const eventPacketEndX   = () => clientX() + NW() / 2 + vW() * 0.03;

  /** Fait voler un paquet du serveur jusqu'au client — livraison d'un événement SSE. */
  function* deliverEvent(packetRef: Reference<Packet>) {
    packetRef().position([eventPacketStartX(), eventPacketY()]);
    yield* packetRef().opacity(1, 0.15);
    yield* packetRef().flyTo([eventPacketEndX(), eventPacketY()], 0.6);
    yield* packetRef().opacity(0, 0.15);
  }

  // ── ANIMATION ──────────────────────────────────────────────────────────────

  yield* waitUntil('setup');
  yield* gridRef().opacity(0.07, 1.2);
  yield* sequence(0.24,
    clientNode().opacity(1, 0.9),
    serverNode().opacity(1, 0.9),
  );
  linkLine().opacity(1);
  yield* linkLine().end(1, 1, easeInOutCubic);
  yield* waitFor(0.6);

  // Requête GET avec Accept: text/event-stream
  yield* waitUntil('sse-request');
  yield* sseRequestCard().opacity(1, 0.7);
  yield* sseRequestCard().position(
    [serverX() - vW() * 0.02, nodesY() + vH() * 0.14],
    2, easeInOutCubic,
  );
  yield* all(
    sseRequestCard().opacity(0, 0.6),
    serverNode().setState('active', 0.6),
  );
  yield* waitFor(0.4);

  // La réponse s'ouvre… et ne se referme pas
  yield* waitUntil('stream-open');
  yield* sseTerminal().opacity(1, 1);
  const strokePulse = yield loop(Infinity, function* () {
    yield* sseTerminal().stroke(PALETTE.vert + '44', 1.4);
    yield* sseTerminal().stroke(PALETTE.vert, 1.4);
  });
  sseTerminal().writeLine('HTTP/1.1 200 OK', 'ghost');
  sseTerminal().writeLine('Content-Type: text/event-stream', 'ghost');
  sseTerminal().writeLine('');
  yield* waitFor(0.8);

  // Les événements s'empilent — texte brut, séparé par des lignes vides
  yield* waitUntil('events');
  const cursorBlink = yield sseTerminal().startBlink();
  yield* deliverEvent(streamPacketA);
  yield* sseTerminal().typewrite('data: {"progress": 42}', {color: 'vert', charDelay: 0.07});
  sseTerminal().writeLine('');
  yield* waitFor(0.7);
  yield* deliverEvent(streamPacketB);
  yield* sseTerminal().typewrite('data: {"progress": 87}', {color: 'vert', charDelay: 0.07});
  sseTerminal().writeLine('');
  yield* waitFor(0.7);
  yield* deliverEvent(streamPacketA);
  yield* sseTerminal().typewrite('data: {"progress": 100}', {color: 'vert', charDelay: 0.07});
  sseTerminal().writeLine('');
  cancel(cursorBlink);
  yield* sseTerminal().hideCursor();
  yield* waitFor(0.6);

  // Zoom sur LA règle héritée d'HTTP : la ligne vide, répétée
  yield* waitUntil('ligne-vide');
  const zoomScale = 1.7;
  const focusY = terminalY() - vH() * 0.04;
  yield* all(
    cameraLayout().scale(zoomScale, 1.4, easeInOutCubic),
    cameraLayout().position([0, -zoomScale * focusY], 1.4, easeInOutCubic),
  );
  // Lignes vides : 2 (fin des headers), 4, 6, 8 (séparateurs d'événements)
  emptyLineHighlight().absolutePosition(emptyLineWorldPos(2));
  yield* emptyLineHighlight().opacity(1, 0.6);
  yield* waitFor(1);
  for (const emptyLineIndex of [4, 6, 8]) {
    yield* emptyLineHighlight().absolutePosition(
      emptyLineWorldPos(emptyLineIndex), 0.8, easeInOutCubic,
    );
    yield* waitFor(0.9);
  }
  yield* emptyLineHighlight().opacity(0, 0.6);

  // Dézoom — un proxy sur le chemin, le flux le traverse sans le perturber
  yield* waitUntil('proxy');
  yield* all(
    cameraLayout().scale(1, 1.2, easeInOutCubic),
    cameraLayout().position([0, 0], 1.2, easeInOutCubic),
  );
  yield* proxyNode().opacity(1, 0.9);
  yield* waitFor(0.5);
  for (const streamPacket of [streamPacketA, streamPacketB]) {
    streamPacket().position([serverX() - NW() / 2 - vW() * 0.03, nodesY() - vH() * 0.05]);
    yield* streamPacket().opacity(1, 0.2);
    yield* streamPacket().flyTo([clientX() + NW() / 2 + vW() * 0.03, nodesY() - vH() * 0.05], 1.8);
    yield* streamPacket().opacity(0, 0.24);
  }
  yield* waitFor(0.6);

  // Limite : le client tente de parler — rebond
  yield* waitUntil('rebond-client');
  bounceArrow().opacity(1);
  yield* bounceArrow().end(0.45, 0.8, easeOutCubic);
  yield* all(
    bounceArrow().end(0.08, 0.9, easeOutCubic),
    bounceArrow().opacity(0, 0.9),
  );
  yield* waitFor(0.4);
  yield* radioIcon().opacity(1, 0.8);
  yield* loop(2, function* () {
    yield* radioIcon().scale(1.15, 0.8, easeInOutCubic);
    yield* radioIcon().scale(1, 0.8, easeInOutCubic);
  });
  yield* waitFor(1);

  // ── Fade-out ───────────────────────────────────────────────────────────────
  yield* waitUntil('end');
  cancel(strokePulse);
  yield* all(
    gridRef().opacity(0, 1),
    clientNode().opacity(0, 1),
    serverNode().opacity(0, 1),
    proxyNode().opacity(0, 1),
    linkLine().opacity(0, 1),
    sseTerminal().opacity(0, 1),
    radioIcon().opacity(0, 1),
  );
  yield* waitFor(0.4);
});
