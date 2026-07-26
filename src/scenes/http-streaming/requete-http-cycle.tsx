/**
 * requete-http-cycle — Le cycle requête-réponse HTTP qui se referme aussitôt.
 *
 * Transition vidéo SSE/Streamable HTTP : un aller-retour, quelques dizaines de
 * millisecondes, et la réponse n'existe plus. C'est toujours le client qui
 * parle en premier — le serveur ne peut rien initier.
 *
 * Couleur active : cyan (data en transit).
 */
import {makeScene2D, Grid, Txt, Line, Rect} from '@motion-canvas/2d';
import {
  createRef,
  createSignal,
  all,
  sequence,
  waitUntil,
  waitFor,
  easeInOutCubic,
  easeOutCubic,
  linear,
  loop,
  cancel,
} from '@motion-canvas/core';
import {DiagramNode, Packet, Terminal} from '../../components';
import {PALETTE} from '../../theme';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  view.fill(PALETTE.bg);

  // ── Dimensions communes ────────────────────────────────────────────────────
  const NW = () => vW() * 0.13;   // largeur nœud
  const NH = () => vH() * 0.24;   // hauteur nœud
  const clientX = () => -vW() * 0.30;
  const serverX = () => +vW() * 0.30;
  const nodeY   = () => -vH() * 0.02;
  const edgeStartX = () => clientX() + NW() / 2 + vW() * 0.012;
  const edgeEndX   = () => serverX() - NW() / 2 - vW() * 0.012;
  const packetY    = () => nodeY() - vH() * 0.055;
  const payloadFontSize = () => vW() * 0.0125;

  // ── Refs / signaux ─────────────────────────────────────────────────────────
  const gridRef        = createRef<Grid>();
  const clientNode     = createRef<DiagramNode>();
  const serverNode     = createRef<DiagramNode>();
  const tcpLine        = createRef<Line>();
  const requestPacket  = createRef<Packet>();
  const responsePacket = createRef<Packet>();
  const msCounter      = createRef<Txt>();
  const questionMark   = createRef<Txt>();
  const payloadTerminal = createRef<Terminal>();
  const focusHighlight  = createRef<Rect>();

  const elapsedMs = createSignal(0);

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

    <DiagramNode key="client-node" ref={clientNode}
      iconName="mdi:web"
      label="CLIENT"
      color={PALETTE.secondary}
      initialState="idle"
      width={NW} height={NH}
      x={clientX} y={nodeY}
      opacity={0}
    />
    <DiagramNode key="server-node" ref={serverNode}
      iconName="mdi:server"
      label="SERVEUR"
      color={PALETTE.secondary}
      initialState="idle"
      width={NW} height={NH}
      x={serverX} y={nodeY}
      opacity={0}
    />

    {/* Connexion TCP — fine, muted, redessinée à chaque cycle */}
    <Line key="tcp-line" ref={tcpLine}
      points={() => [
        [edgeStartX(), nodeY()],
        [edgeEndX(),   nodeY()],
      ]}
      stroke={PALETTE.ghost}
      lineWidth={1}
      end={0}
      opacity={0}
    />

    <Packet key="request-packet" ref={requestPacket}
      content="GET /page"
      color={PALETTE.cyan}
      packetSize="md"
      width={() => vW() * 0.085}
      height={() => vH() * 0.055}
      x={edgeStartX} y={packetY}
      opacity={0}
    />
    <Packet key="response-packet" ref={responsePacket}
      content="200 OK"
      color={PALETTE.cyan}
      packetSize="md"
      width={() => vW() * 0.075}
      height={() => vH() * 0.055}
      x={edgeEndX} y={packetY}
      opacity={0}
    />

    {/* Compteur ms discret */}
    <Txt key="ms-counter" ref={msCounter}
      text={() => `${Math.round(elapsedMs())} ms`}
      fill={PALETTE.ghost}
      fontSize={() => vW() * 0.016}
      fontFamily={'JetBrains Mono, DM Mono, monospace'}
      x={0} y={() => vH() * 0.28}
      opacity={0}
    />

    {/* Silence du serveur — le client attend */}
    <Txt key="question-mark" ref={questionMark}
      text="?"
      fill={PALETTE.ghost}
      fontSize={() => vW() * 0.045}
      fontFamily={'Space Grotesk, DM Sans, sans-serif'}
      fontWeight={700}
      x={clientX} y={() => nodeY() - NH() / 2 - vH() * 0.10}
      opacity={0}
    />

    {/* Payload brut — le texte de la requête et de la réponse, séparation visible */}
    <Terminal key="payload-terminal" ref={payloadTerminal}
      title="HTTP/1.1 — échange brut"
      maxLines={9}
      fontSize={payloadFontSize}
      width={() => vW() * 0.40}
      height={() => vH() * 0.52}
      stroke={PALETTE.cyan}
      x={0} y={0}
      opacity={0}
    />
    {/* Surbrillance de focus — glisse d'un bloc du payload à l'autre */}
    <Rect key="focus-highlight" ref={focusHighlight}
      width={() => vW() * 0.39}
      height={() => payloadFontSize() * 1.6}
      fill={PALETTE.cyan + '2E'}
      stroke={PALETTE.cyan}
      lineWidth={1}
      radius={4}
      opacity={0}
    />
  </>);

  // ── Cycle requête → réponse → dissolution ──────────────────────────────────
  function* httpCycle(
    flightDuration: number,
    dissolveDuration: number,
  ) {
    // Connexion TCP
    tcpLine().opacity(1);
    yield* tcpLine().end(1, flightDuration * 0.6, easeInOutCubic);

    // Compteur ms démarre
    elapsedMs(0);
    msCounter().opacity(1);

    // Requête client → serveur
    requestPacket().position([edgeStartX(), packetY()]);
    yield* requestPacket().opacity(1, 0.2);
    yield* all(
      requestPacket().flyTo([edgeEndX(), packetY()], flightDuration),
      elapsedMs(18, flightDuration, linear),
    );
    yield* requestPacket().opacity(0, 0.2);

    // Réponse serveur → client
    responsePacket().position([edgeEndX(), packetY()]);
    responsePacket().scale(1);
    yield* responsePacket().opacity(1, 0.2);
    yield* all(
      responsePacket().flyTo([edgeStartX(), packetY()], flightDuration),
      elapsedMs(40, flightDuration, linear),
    );

    // Le compteur s'arrête (~40 ms), puis tout se dissout
    yield* waitFor(dissolveDuration * 0.5);
    yield* all(
      responsePacket().opacity(0, dissolveDuration),
      responsePacket().scale(0.5, dissolveDuration, easeOutCubic),
      tcpLine().opacity(0, dissolveDuration),
      msCounter().opacity(0, dissolveDuration),
    );
    tcpLine().end(0);
  }

  // ── ANIMATION ──────────────────────────────────────────────────────────────

  yield* waitUntil('setup');
  yield* gridRef().opacity(0.07, 1.2);
  yield* sequence(0.24,
    clientNode().opacity(1, 0.9),
    serverNode().opacity(1, 0.9),
  );
  yield* waitFor(0.6);

  // Cycle 1 — tempo normal
  yield* waitUntil('cycle-1');
  yield* httpCycle(1.7, 0.9);
  yield* waitFor(0.8);

  // ── Payload brut — le texte de l'échange, séparation requête/réponse ───────
  const requestLineIndices     = [0, 1, 2] as const;
  const separatorLineIndex     = 3;
  const statusLineIndex        = 4;
  const responseHeaderIndices  = [5, 6] as const;
  const bodyLineIndex          = 8;

  /** Position + hauteur (monde) du rectangle englobant les lignes [startIndex, endIndex]. */
  const lineSpanBox = (startIndex: number, endIndex: number) => {
    const terminalWorld = payloadTerminal().absolutePosition();
    const firstLineNode = payloadTerminal().line(startIndex);
    const lastLineNode  = payloadTerminal().line(endIndex);
    const firstY = firstLineNode ? firstLineNode.absolutePosition().y : terminalWorld.y;
    const lastY  = lastLineNode  ? lastLineNode.absolutePosition().y  : terminalWorld.y;
    return {
      x: terminalWorld.x,
      y: (firstY + lastY) / 2,
      height: Math.abs(lastY - firstY) + payloadFontSize() * 1.6,
    };
  };

  yield* waitUntil('payload');
  yield* all(
    clientNode().opacity(0.15, 0.6),
    serverNode().opacity(0.15, 0.6),
  );
  yield* payloadTerminal().opacity(1, 0.8);
  const payloadCursorBlink = yield payloadTerminal().startBlink();
  yield* payloadTerminal().typewrite('GET /page HTTP/1.1', {color: PALETTE.cyan, charDelay: 0.044});
  yield* payloadTerminal().typewrite('Host: passe-tech.fr', {color: PALETTE.cyan, charDelay: 0.044});
  yield* payloadTerminal().typewrite('Accept: text/html', {color: PALETTE.cyan, charDelay: 0.044});
  payloadTerminal().writeLine('');
  yield* payloadTerminal().typewrite('HTTP/1.1 200 OK', {color: 'vert', charDelay: 0.044});
  yield* payloadTerminal().typewrite('Content-Type: text/html', {color: 'cream', charDelay: 0.044});
  yield* payloadTerminal().typewrite('Content-Length: 1256', {color: 'cream', charDelay: 0.044});
  payloadTerminal().writeLine('');
  yield* payloadTerminal().typewrite('<html>…</html>', {color: 'cream', charDelay: 0.044});
  cancel(payloadCursorBlink);
  yield* payloadTerminal().hideCursor();
  yield* waitFor(0.6);

  // Focus a — le bloc requête entier
  yield* waitUntil('focus-request');
  {
    const box = lineSpanBox(requestLineIndices[0], requestLineIndices[2]);
    focusHighlight().absolutePosition([box.x, box.y]);
    focusHighlight().height(box.height);
    yield* focusHighlight().opacity(1, 0.6);
  }
  yield* waitFor(1);

  // Focus b — LA ligne vide qui sépare requête et réponse (surbrillance ambre appuyée)
  yield* waitUntil('separation');
  {
    const box = lineSpanBox(separatorLineIndex, separatorLineIndex);
    focusHighlight().stroke(PALETTE.amber);
    focusHighlight().fill(PALETTE.amber + '3A');
    yield* all(
      focusHighlight().absolutePosition([box.x, box.y], 0.8, easeInOutCubic),
      focusHighlight().height(box.height, 0.8, easeInOutCubic),
    );
  }
  yield* loop(2, function* () {
    yield* focusHighlight().opacity(0.5, 0.7);
    yield* focusHighlight().opacity(1, 0.7);
  });
  yield* waitFor(0.6);

  // Focus c — la status line de la réponse
  yield* waitUntil('status-line');
  {
    const box = lineSpanBox(statusLineIndex, statusLineIndex);
    focusHighlight().stroke(PALETTE.cyan);
    focusHighlight().fill(PALETTE.cyan + '2E');
    yield* all(
      focusHighlight().absolutePosition([box.x, box.y], 0.8, easeInOutCubic),
      focusHighlight().height(box.height, 0.8, easeInOutCubic),
    );
  }
  yield* waitFor(0.8);

  // Focus d — les headers de réponse
  yield* waitUntil('response-headers');
  {
    const box = lineSpanBox(responseHeaderIndices[0], responseHeaderIndices[1]);
    yield* all(
      focusHighlight().absolutePosition([box.x, box.y], 0.8, easeInOutCubic),
      focusHighlight().height(box.height, 0.8, easeInOutCubic),
    );
  }
  yield* waitFor(0.8);

  // Focus e — le body
  yield* waitUntil('body');
  {
    const box = lineSpanBox(bodyLineIndex, bodyLineIndex);
    yield* all(
      focusHighlight().absolutePosition([box.x, box.y], 0.8, easeInOutCubic),
      focusHighlight().height(box.height, 0.8, easeInOutCubic),
    );
  }
  yield* waitFor(0.8);
  yield* focusHighlight().opacity(0, 0.6);

  // Le Terminal se dissout — même langage visuel que la réponse (fade + scale down)
  yield* waitUntil('payload-dissolve');
  yield* all(
    payloadTerminal().opacity(0, 0.9),
    payloadTerminal().scale(0.5, 0.9, easeOutCubic),
    clientNode().opacity(1, 0.6),
    serverNode().opacity(1, 0.6),
  );
  payloadTerminal().scale(1);
  yield* waitFor(0.4);

  // Cycles 2 et 3 — accélérés
  yield* waitUntil('cycles-rapides');
  yield* httpCycle(0.7, 0.44);
  yield* waitFor(0.24);
  yield* httpCycle(0.56, 0.36);
  yield* waitFor(0.8);

  // Le client attend — le serveur reste inerte, rien ne vient
  yield* waitUntil('silence-serveur');
  yield* clientNode().setState('active', 0.7);
  yield* questionMark().opacity(0.9, 1);
  yield* loop(3, function* () {
    yield* questionMark().opacity(0.35, 1.1);
    yield* questionMark().opacity(0.9, 1.1);
  });
  yield* waitFor(1.2);

  // ── Fade-out ───────────────────────────────────────────────────────────────
  yield* waitUntil('end');
  yield* all(
    gridRef().opacity(0, 1),
    clientNode().opacity(0, 1),
    serverNode().opacity(0, 1),
    questionMark().opacity(0, 1),
  );
  yield* waitFor(0.4);
});
