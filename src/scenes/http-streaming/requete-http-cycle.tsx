/**
 * requete-http-cycle — Le cycle requête-réponse HTTP qui se referme aussitôt.
 *
 * Transition vidéo SSE/Streamable HTTP : un aller-retour, quelques dizaines de
 * millisecondes, et la réponse n'existe plus. C'est toujours le client qui
 * parle en premier — le serveur ne peut rien initier.
 *
 * Anatomie montrée : requête (méthode, chemin, headers, body optionnel),
 * verbes GET/POST, header Authorization (login/mdp ou token), réponse
 * (statut, headers, body) et les familles de codes 1xx–5xx.
 *
 * Couleur active : cyan (data en transit).
 */
import {makeScene2D, Grid, Txt, Line, Rect, Layout} from '@motion-canvas/2d';
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
  const verbBadge       = createRef<Rect>();
  const verbBadgeText   = createRef<Txt>();

  const elapsedMs = createSignal(0);

  // ── Familles de codes de statut — pills colorées, une par famille ──────────
  const codeFamilies = [
    {label: '1xx', color: PALETTE.secondary},
    {label: '2xx', color: PALETTE.vert},
    {label: '3xx', color: PALETTE.cyan},
    {label: '4xx', color: PALETTE.jaune},
    {label: '5xx', color: PALETTE.rose},
  ] as const;
  const familyPillRefs = codeFamilies.map(() => createRef<Rect>());
  const statusFamilyRow = createRef<Layout>();

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
      maxLines={11}
      fontSize={payloadFontSize}
      width={() => vW() * 0.40}
      height={() => vH() * 0.62}
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

    {/* Badge verbe — GET·lire ↔ POST·créer, la base des API REST */}
    <Rect key="verb-badge" ref={verbBadge}
      width={() => vW() * 0.105} height={() => vH() * 0.045}
      fill={PALETTE.bgCard} stroke={PALETTE.cyan} lineWidth={2} radius={8}
      layout alignItems={'center'} justifyContent={'center'}
      x={() => -vW() * 0.19} y={() => -vH() * 0.36}
      opacity={0}
    >
      <Txt key="verb-badge-text" ref={verbBadgeText}
        text={'GET · lire'}
        fill={PALETTE.cyan}
        fontSize={() => vW() * 0.015}
        fontFamily={'JetBrains Mono, DM Mono, monospace'}
        fontWeight={700}
      />
    </Rect>

    {/* Familles de codes de statut — 1xx→5xx, la famille active pulse */}
    <Layout key="status-family-row" ref={statusFamilyRow}
      layout direction={'row'} gap={() => vW() * 0.01}
      x={0} y={() => vH() * 0.36}
      opacity={0}
    >
      {codeFamilies.map((family, familyIndex) => (
        <Rect key={`family-pill-${family.label}`} ref={familyPillRefs[familyIndex]}
          width={() => vW() * 0.045} height={() => vH() * 0.032}
          fill={PALETTE.bgCard} stroke={family.color} lineWidth={2} radius={6}
          layout alignItems={'center'} justifyContent={'center'}
        >
          <Txt
            text={family.label}
            fill={family.color}
            fontSize={() => vW() * 0.013}
            fontFamily={'JetBrains Mono, DM Mono, monospace'}
            fontWeight={700}
          />
        </Rect>
      ))}
    </Layout>
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
  yield* sequence(0.18,
    clientNode().opacity(1, 0.6),
    serverNode().opacity(1, 0.6),
  );
  yield* waitFor(0.3);

  // Cycle 1 — tempo normal
  yield* waitUntil('cycle-1');
  yield* httpCycle(0.6, 0.9);
  yield* waitFor(0.8);

  // ── Payload brut — anatomie complète de la requête et de la réponse ────────
  const requestLineIndices     = [0, 1, 2] as const; // méthode+chemin, host, authorization
  const requestBodyLineIndex   = 4;                  // vide pour un GET — révélé pour un POST
  const separatorLineIndex     = 3;                  // fin des headers de requête
  const statusLineIndex        = 5;
  const responseHeaderIndices  = [6, 8] as const;     // content-type, length, cache
  const responseSeparatorIndex = 9;
  const bodyLineIndex          = 10;

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

  /** Fondu sortant → changement de texte/couleur → fondu entrant, sur une ligne du terminal. */
  function* swapLine(lineIndex: number, text: string, color: string = PALETTE.cream) {
    const lineNode = payloadTerminal().line(lineIndex);
    if (!lineNode) return;
    yield* lineNode.opacity(0, 0.15);
    lineNode.text(text);
    lineNode.fill(color);
    yield* lineNode.opacity(1, 0.2);
  }

  /** Fait pulser la pill de famille de code active, éteint les autres. */
  function* highlightFamily(activeIndex: number) {
    yield* all(
      ...codeFamilies.map((family, familyIndex) => {
        const pill = familyPillRefs[familyIndex]();
        const isActive = familyIndex === activeIndex;
        return all(
          pill.scale(isActive ? 1.2 : 1, 0.3),
          pill.fill(isActive ? family.color + '33' : PALETTE.bgCard, 0.3),
        );
      }),
    );
  }

  yield* waitUntil('payload');
  yield* all(
    clientNode().opacity(0.15, 0.6),
    serverNode().opacity(0.15, 0.6),
  );
  yield* payloadTerminal().opacity(1, 0.8);
  yield* verbBadge().opacity(1, 0.5);
  const payloadCursorBlink = yield payloadTerminal().startBlink();
  yield* payloadTerminal().typewrite('GET /articles/42 HTTP/1.1', {color: PALETTE.cyan, charDelay: 0.022});
  yield* payloadTerminal().typewrite('Host: passe-tech.fr', {charDelay: 0.022});
  yield* payloadTerminal().typewrite('Authorization: Bearer eyJhbGciOi...', {charDelay: 0.022});
  payloadTerminal().writeLine('');           // fin des headers de requête
  payloadTerminal().writeLine('');           // body — vide pour ce GET
  yield* payloadTerminal().typewrite('HTTP/1.1 200 OK', {color: PALETTE.vert, charDelay: 0.022});
  yield* payloadTerminal().typewrite('Content-Type: application/json', {charDelay: 0.022});
  yield* payloadTerminal().typewrite('Content-Length: 842', {charDelay: 0.022});
  yield* payloadTerminal().typewrite('Cache-Control: max-age=3600', {charDelay: 0.022});
  payloadTerminal().writeLine('');           // fin des headers de réponse
  yield* payloadTerminal().typewrite('{"id":42,"title":"Piraterie 2.0"}', {charDelay: 0.022});
  cancel(payloadCursorBlink);
  yield* payloadTerminal().hideCursor();
  yield* waitFor(0.2);

  // Focus a — le bloc requête entier : méthode, chemin, headers
  yield* waitUntil('focus-request');
  {
    const box = lineSpanBox(requestLineIndices[0], requestLineIndices[2]);
    focusHighlight().absolutePosition([box.x, box.y]);
    focusHighlight().height(box.height);
    yield* focusHighlight().opacity(1, 0.6);
  }
  yield* waitFor(0.8);

  // Focus b — la méthode seule, pulse du badge GET·lire
  yield* waitUntil('focus-method');
  {
    const box = lineSpanBox(requestLineIndices[0], requestLineIndices[0]);
    yield* all(
      focusHighlight().absolutePosition([box.x, box.y], 0.5, easeInOutCubic),
      focusHighlight().height(box.height, 0.5, easeInOutCubic),
      verbBadge().scale(1.12, 0.3),
    );
    yield* verbBadge().scale(1, 0.3);
  }
  yield* waitFor(0.6);

  // Verbes GET/POST — bascule vers POST, le body apparaît (base des API REST)
  yield* waitUntil('verb-post');
  yield* all(
    swapLine(requestLineIndices[0], 'POST /articles HTTP/1.1', PALETTE.jaune),
    verbBadgeText().text('POST · créer', 0.2),
    verbBadge().stroke(PALETTE.jaune, 0.3),
    verbBadgeText().fill(PALETTE.jaune, 0.3),
  );
  yield* all(
    swapLine(requestBodyLineIndex, '{"title":"Nouvel article"}', PALETTE.jaune),
    (function* () {
      const box = lineSpanBox(requestLineIndices[0], requestBodyLineIndex);
      yield* all(
        focusHighlight().absolutePosition([box.x, box.y], 0.5, easeInOutCubic),
        focusHighlight().height(box.height, 0.5, easeInOutCubic),
      );
    })(),
  );
  yield* waitFor(1);

  // Retour au GET de référence — le body redevient vide
  yield* waitUntil('verb-get');
  yield* all(
    swapLine(requestLineIndices[0], 'GET /articles/42 HTTP/1.1', PALETTE.cyan),
    swapLine(requestBodyLineIndex, ''),
    verbBadgeText().text('GET · lire', 0.2),
    verbBadge().stroke(PALETTE.cyan, 0.3),
    verbBadgeText().fill(PALETTE.cyan, 0.3),
  );
  {
    const box = lineSpanBox(requestLineIndices[0], requestLineIndices[0]);
    yield* all(
      focusHighlight().absolutePosition([box.x, box.y], 0.5, easeInOutCubic),
      focusHighlight().height(box.height, 0.5, easeInOutCubic),
    );
  }
  yield* waitFor(0.4);

  // Focus c — le header Authorization : login/mdp OU token
  yield* waitUntil('focus-auth');
  {
    const box = lineSpanBox(requestLineIndices[2], requestLineIndices[2]);
    focusHighlight().stroke(PALETTE.jaune);
    focusHighlight().fill(PALETTE.jaune + '2E');
    yield* all(
      focusHighlight().absolutePosition([box.x, box.y], 0.6, easeInOutCubic),
      focusHighlight().height(box.height, 0.6, easeInOutCubic),
    );
  }
  yield* waitFor(0.5);
  yield* swapLine(requestLineIndices[2], 'Authorization: Basic dXNlcjpwYXNz', PALETTE.jaune);
  yield* waitFor(0.9);
  yield* swapLine(requestLineIndices[2], 'Authorization: Bearer eyJhbGciOi...', PALETTE.jaune);
  yield* waitFor(0.9);
  focusHighlight().stroke(PALETTE.cyan);
  focusHighlight().fill(PALETTE.cyan + '2E');

  // Focus d — LA ligne vide qui sépare requête et réponse (surbrillance ambre appuyée)
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

  // Focus e — la status line de la réponse + la famille 2xx s'allume
  yield* waitUntil('status-line');
  {
    const box = lineSpanBox(statusLineIndex, statusLineIndex);
    focusHighlight().stroke(PALETTE.cyan);
    focusHighlight().fill(PALETTE.cyan + '2E');
    yield* all(
      focusHighlight().absolutePosition([box.x, box.y], 0.8, easeInOutCubic),
      focusHighlight().height(box.height, 0.8, easeInOutCubic),
      statusFamilyRow().opacity(1, 0.6),
    );
  }
  yield* highlightFamily(1); // 2xx
  yield* waitFor(0.8);

  // Focus f — les headers de réponse (type, longueur, cache)
  yield* waitUntil('response-headers');
  {
    const box = lineSpanBox(responseHeaderIndices[0], responseHeaderIndices[1]);
    yield* all(
      focusHighlight().absolutePosition([box.x, box.y], 0.8, easeInOutCubic),
      focusHighlight().height(box.height, 0.8, easeInOutCubic),
    );
  }
  yield* waitFor(0.8);

  // Focus g — le body
  yield* waitUntil('body');
  {
    const box = lineSpanBox(bodyLineIndex, bodyLineIndex);
    yield* all(
      focusHighlight().absolutePosition([box.x, box.y], 0.8, easeInOutCubic),
      focusHighlight().height(box.height, 0.8, easeInOutCubic),
    );
  }
  yield* waitFor(0.8);

  // Familles d'erreur — 4xx (pas authentifié / pas les droits) puis 5xx (erreur serveur)
  // Pas de payload sur une erreur : le body se vide, seuls les headers restent.
  yield* waitUntil('status-4xx');
  yield* all(
    swapLine(statusLineIndex, 'HTTP/1.1 401 Unauthorized', PALETTE.jaune),
    swapLine(bodyLineIndex, ''),
    highlightFamily(3),
  );
  yield* waitFor(0.9);

  yield* waitUntil('status-5xx');
  yield* all(
    swapLine(statusLineIndex, 'HTTP/1.1 500 Internal Server Error', PALETTE.rose),
    highlightFamily(4),
  );
  yield* waitFor(0.9);

  // Retour au 200 OK de référence — le body réapparaît avec la réponse
  yield* waitUntil('status-2xx');
  yield* all(
    swapLine(statusLineIndex, 'HTTP/1.1 200 OK', PALETTE.vert),
    swapLine(bodyLineIndex, '{"id":42,"title":"Piraterie 2.0"}', PALETTE.cream),
    highlightFamily(1),
  );
  yield* waitFor(0.6);
  yield* focusHighlight().opacity(0, 0.6);

  // Le Terminal se dissout — même langage visuel que la réponse (fade + scale down)
  yield* waitUntil('payload-dissolve');
  yield* all(
    payloadTerminal().opacity(0, 0.9),
    payloadTerminal().scale(0.5, 0.9, easeOutCubic),
    verbBadge().opacity(0, 0.6),
    statusFamilyRow().opacity(0, 0.6),
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
