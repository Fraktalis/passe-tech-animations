import {makeScene2D, Rect, Txt, Icon, Line, Circle} from '@motion-canvas/2d';
import {
  createRef,
  all,
  sequence,
  waitUntil,
  waitFor,
  easeInOutCubic,
  easeOutCubic,
  range,
  Vector2,
} from '@motion-canvas/core';
import {ConnectionArrow, DiagramNode, Packet} from '../../components';
import {PALETTE} from '../../theme';

/**
 * BASCULE — le statelessness est un choix de PROTOCOLE, la connexion courte
 * un choix d'IMPLÉMENTATION de 1991. Deux rails, deux histoires : le rail
 * implémentation bouge sans arrêt (thread-per-connection, handshakes répétés,
 * keep-alive, C10K, event loop), le rail protocole reste plat… jusqu'à
 * QUERY · RFC 10008 en 2026.
 */
export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  view.fill(PALETTE.bg);

  // ── Géométrie ──────────────────────────────────────────────────────────────
  const protoRailY = () => -vH() * 0.34;
  const implRailY  = () => -vH() * 0.20;
  const railLeftX  = () => -vW() * 0.38;
  const railRightX = () => +vW() * 0.38;
  const yearX = (year: number) =>
    vW() * (-0.38 + ((year - 1991) / 35) * 0.76);
  const linkGap = () => implRailY() - protoRailY();
  const stageY = () => vH() * 0.17;

  const serverX     = () => vW() * 0.20;
  const serverLeftX = () => vW() * 0.145;
  const clientX     = () => -vW() * 0.26;
  const clientRightX = () => -vW() * 0.235;

  // ── Refs — rails & timeline ────────────────────────────────────────────────
  const protoRail      = createRef<Line>();
  const implRail       = createRef<Line>();
  const protoRailLabel = createRef<Txt>();
  const implRailLabel  = createRef<Txt>();
  const year1991Label  = createRef<Txt>();
  const year2026Label  = createRef<Txt>();
  const protoDot1991   = createRef<Circle>();
  const implDot1991    = createRef<Circle>();
  const linkTopHalf    = createRef<Line>();
  const linkBottomHalf = createRef<Line>();

  const milestoneYears = [1997, 1999, 2004, 2009];
  const milestoneNames = ['keep-alive', 'C10K', 'nginx', 'node'];
  // keep-alive (RFC 2068, 1997) est un changement de PROTOCOLE — les connexions
  // persistent par défaut en HTTP/1.1. C10K/nginx/node restent des techniques
  // d'IMPLÉMENTATION pour absorber la charge, elles.
  const milestoneRails: ('proto' | 'impl')[] = ['proto', 'impl', 'impl', 'impl'];
  const milestoneDots   = milestoneYears.map(() => createRef<Circle>());
  const milestoneLabels = milestoneYears.map(() => createRef<Txt>());

  // ── Refs — vignette A : thread-per-connection ──────────────────────────────
  const serverNode        = createRef<DiagramNode>();
  const clientIconsA      = range(3).map(() => createRef<Icon>());
  const clientArrowsA     = range(3).map(() => createRef<ConnectionArrow>());
  const threadBarsA       = range(3).map(() => createRef<Rect>());
  const threadColumnLabel = createRef<Txt>();

  // ── Refs — vignette B : pages complexes ────────────────────────────────────
  const clientIconB        = createRef<Icon>();
  const resourceIcons      = range(3).map(() => createRef<Icon>());
  const handshakeOutArrow  = createRef<ConnectionArrow>();
  const handshakeBackArrow = createRef<ConnectionArrow>();
  const handshakeStepLabel = createRef<Txt>();
  const handshakeCounter   = createRef<Txt>();
  const requestDot         = createRef<Circle>();

  // ── Refs — vignette C : keep-alive ─────────────────────────────────────────
  const tcpLine   = createRef<Line>();
  const getPacket = createRef<Packet>();

  // ── Refs — C10K ────────────────────────────────────────────────────────────
  const c10kBars     = range(12).map(() => createRef<Rect>());
  const oneMegLabel  = createRef<Txt>();
  const memGaugeShell = createRef<Rect>();
  const memGaugeFill  = createRef<Rect>();
  const memLabel      = createRef<Txt>();

  // ── Refs — event loop ──────────────────────────────────────────────────────
  const eventClientIcons = range(4).map(() => createRef<Icon>());
  const eventLines       = range(4).map(() => createRef<Line>());
  const singleThreadBar   = createRef<Rect>();
  const singleThreadLabel = createRef<Txt>();
  const eventCursor       = createRef<Circle>();

  // ── Refs — QUERY 2026 ──────────────────────────────────────────────────────
  const queryDot   = createRef<Circle>();
  const queryLabel = createRef<Txt>();

  // Positions vignette A
  const clientAY = (clientIndex: number) =>
    stageY() + (clientIndex - 1) * vH() * 0.13;
  // Positions C10K
  const c10kBarX = () => -vW() * 0.10;
  const c10kBarY = (barIndex: number) =>
    stageY() + vH() * 0.15 - barIndex * vH() * 0.027;
  // Positions event loop
  const eventClientY = (clientIndex: number) =>
    stageY() + [-0.135, -0.045, 0.045, 0.135][clientIndex] * vH();

  // ── Scene tree ─────────────────────────────────────────────────────────────
  view.add(<>
    {/* ══ Rails ═══════════════════════════════════════════════════════════ */}
    <Line key="proto-rail" ref={protoRail}
      points={() => [[railLeftX(), protoRailY()], [railRightX(), protoRailY()]]}
      stroke={PALETTE.dsRose} lineWidth={2}
      end={0} opacity={0}
    />
    <Line key="impl-rail" ref={implRail}
      points={() => [[railLeftX(), implRailY()], [railRightX(), implRailY()]]}
      stroke={PALETTE.amber} lineWidth={2}
      end={0} opacity={0}
    />
    <Txt key="proto-rail-label" ref={protoRailLabel}
      text="PROTOCOLE"
      fill={PALETTE.dsRose}
      fontSize={() => vW() * 0.011}
      fontFamily={'JetBrains Mono, DM Mono, monospace'}
      x={() => -vW() * 0.44} y={protoRailY}
      opacity={0}
    />
    <Txt key="impl-rail-label" ref={implRailLabel}
      text="IMPLÉMENTATION"
      fill={PALETTE.amber}
      fontSize={() => vW() * 0.011}
      fontFamily={'JetBrains Mono, DM Mono, monospace'}
      x={() => -vW() * 0.44} y={implRailY}
      opacity={0}
    />
    <Txt key="year-1991" ref={year1991Label}
      text="1991"
      fill={PALETTE.ghost}
      fontSize={() => vW() * 0.012}
      fontFamily={'JetBrains Mono, DM Mono, monospace'}
      x={() => yearX(1991)} y={() => implRailY() + vH() * 0.05}
      opacity={0}
    />
    <Txt key="year-2026" ref={year2026Label}
      text="2026"
      fill={PALETTE.ghost}
      fontSize={() => vW() * 0.012}
      fontFamily={'JetBrains Mono, DM Mono, monospace'}
      x={() => yearX(2026)} y={() => implRailY() + vH() * 0.05}
      opacity={0}
    />
    <Circle key="proto-dot-1991" ref={protoDot1991}
      size={() => vW() * 0.012}
      fill={PALETTE.dsRose}
      x={() => yearX(1991)} y={protoRailY}
      opacity={0}
    />
    <Circle key="impl-dot-1991" ref={implDot1991}
      size={() => vW() * 0.012}
      fill={PALETTE.amber}
      x={() => yearX(1991)} y={implRailY}
      opacity={0}
    />
    <Line key="link-top-half" ref={linkTopHalf}
      x={() => yearX(1991)}
      y={() => protoRailY() + linkGap() * 0.25}
      points={() => [[0, -linkGap() * 0.25], [0, linkGap() * 0.25]]}
      stroke={PALETTE.cream} lineWidth={2}
      end={0} opacity={0}
    />
    <Line key="link-bottom-half" ref={linkBottomHalf}
      x={() => yearX(1991)}
      y={() => protoRailY() + linkGap() * 0.75}
      points={() => [[0, -linkGap() * 0.25], [0, linkGap() * 0.25]]}
      stroke={PALETTE.cream} lineWidth={2}
      end={0} opacity={0}
    />
    {milestoneYears.map((milestoneYear, milestoneIndex) => (
      <Circle key={`milestone-dot-${milestoneYear}`} ref={milestoneDots[milestoneIndex]}
        size={() => vW() * 0.009}
        fill={milestoneRails[milestoneIndex] === 'proto' ? PALETTE.dsRose : PALETTE.amber}
        x={() => yearX(milestoneYear)}
        y={() => milestoneRails[milestoneIndex] === 'proto' ? protoRailY() : implRailY()}
        opacity={0}
      />
    ))}
    {milestoneYears.map((milestoneYear, milestoneIndex) => (
      <Txt key={`milestone-label-${milestoneYear}`} ref={milestoneLabels[milestoneIndex]}
        text={`${milestoneYear}\n${milestoneNames[milestoneIndex]}`}
        textAlign={'center'}
        fill={PALETTE.ghost}
        fontSize={() => vW() * 0.010}
        fontFamily={'JetBrains Mono, DM Mono, monospace'}
        x={() => yearX(milestoneYear)}
        y={() => milestoneRails[milestoneIndex] === 'proto'
          ? protoRailY() - vH() * 0.06
          : implRailY() + vH() * 0.06}
        opacity={0}
      />
    ))}

    {/* ══ Vignette A : thread-per-connection ══════════════════════════════ */}
    <DiagramNode key="server-node" ref={serverNode}
      iconName="mdi:server"
      label="SERVEUR"
      color={PALETTE.amber}
      initialState="active"
      width={() => vW() * 0.11} height={() => vH() * 0.20}
      x={serverX} y={stageY}
      opacity={0}
    />
    {range(3).map(clientIndex => (
      <Icon key={`client-a-${clientIndex}`} ref={clientIconsA[clientIndex]}
        icon="mdi:monitor"
        size={() => vW() * 0.028}
        color={PALETTE.ghost}
        x={clientX} y={() => clientAY(clientIndex)}
        opacity={0}
      />
    ))}
    {range(3).map(clientIndex => (
      <ConnectionArrow key={`client-arrow-a-${clientIndex}`} ref={clientArrowsA[clientIndex]}
        from={() => [clientRightX(), clientAY(clientIndex)]}
        to={() => [serverLeftX(), stageY() + (clientIndex - 1) * vH() * 0.03]}
        stroke={PALETTE.amber}
        end={0} opacity={0}
      />
    ))}
    {range(3).map(threadIndex => (
      <Rect key={`thread-bar-a-${threadIndex}`} ref={threadBarsA[threadIndex]}
        width={() => vW() * 0.06} height={() => vH() * 0.032}
        fill={PALETTE.amber + '33'} stroke={PALETTE.amber} lineWidth={1.5}
        radius={() => vW() * 0.003}
        x={() => vW() * 0.315} y={() => stageY() + (threadIndex - 1) * vH() * 0.05}
        opacity={0}
      />
    ))}
    <Txt key="thread-column-label" ref={threadColumnLabel}
      text="threads"
      fill={PALETTE.ghost}
      fontSize={() => vW() * 0.011}
      fontFamily={'JetBrains Mono, DM Mono, monospace'}
      x={() => vW() * 0.315} y={() => stageY() - vH() * 0.13}
      opacity={0}
    />

    {/* ══ Vignette B : pages complexes ═════════════════════════════════════ */}
    <Icon key="client-b" ref={clientIconB}
      icon="mdi:monitor"
      size={() => vW() * 0.032}
      color={PALETTE.cream}
      x={clientX} y={stageY}
      opacity={0}
    />
    {range(3).map(resourceIndex => (
      <Icon key={`resource-${resourceIndex}`} ref={resourceIcons[resourceIndex]}
        icon={resourceIndex === 1 ? 'mdi:code-braces' : 'mdi:image-outline'}
        size={() => vW() * 0.022}
        color={PALETTE.ghost}
        x={serverLeftX} y={stageY}
        opacity={0}
      />
    ))}
    <ConnectionArrow key="handshake-out" ref={handshakeOutArrow}
      from={() => [clientRightX(), stageY() - vH() * 0.02]}
      to={() => [serverLeftX(), stageY() - vH() * 0.02]}
      stroke={PALETTE.amber} lineWidth={2} arrowSize={7} routing={0}
      end={0} opacity={0}
    />
    <ConnectionArrow key="handshake-back" ref={handshakeBackArrow}
      from={() => [serverLeftX(), stageY() + vH() * 0.02]}
      to={() => [clientRightX(), stageY() + vH() * 0.02]}
      stroke={PALETTE.amber} lineWidth={2} arrowSize={7} routing={0}
      end={0} opacity={0}
    />
    <Txt key="handshake-step-label" ref={handshakeStepLabel}
      text=""
      textAlign={'center'}
      fill={PALETTE.amber}
      fontSize={() => vW() * 0.0105}
      fontFamily={'JetBrains Mono, DM Mono, monospace'}
      fontWeight={700}
      x={() => (clientRightX() + serverLeftX()) / 2} y={stageY}
      opacity={0}
    />
    <Txt key="handshake-counter" ref={handshakeCounter}
      text="handshakes: 0"
      fill={PALETTE.ghost}
      fontSize={() => vW() * 0.010}
      fontFamily={'JetBrains Mono, DM Mono, monospace'}
      x={() => vW() * 0.30} y={() => stageY() - vH() * 0.16}
      opacity={0}
    />
    <Circle key="request-dot" ref={requestDot}
      size={() => vW() * 0.008}
      fill={PALETTE.amber}
      x={clientRightX} y={stageY}
      opacity={0}
    />

    {/* ══ Vignette C : keep-alive ═════════════════════════════════════════ */}
    <Line key="tcp-line" ref={tcpLine}
      points={() => [[clientRightX(), stageY()], [serverLeftX(), stageY()]]}
      stroke={PALETTE.amber} lineWidth={3}
      end={0} opacity={0}
    />
    <Packet key="get-packet" ref={getPacket}
      content="GET"
      color={PALETTE.amber}
      packetSize="sm"
      width={() => vW() * 0.042} height={() => vH() * 0.038}
      x={clientRightX} y={stageY}
      opacity={0}
    />

    {/* ══ C10K ════════════════════════════════════════════════════════════ */}
    {range(12).map(barIndex => (
      <Rect key={`c10k-bar-${barIndex}`} ref={c10kBars[barIndex]}
        width={() => vW() * 0.11} height={() => vH() * 0.020}
        fill={barIndex < 9 ? PALETTE.amber + '33' : PALETTE.dsRose + '33'}
        stroke={barIndex < 9 ? PALETTE.amber : PALETTE.dsRose}
        lineWidth={1}
        radius={() => vW() * 0.002}
        x={c10kBarX} y={() => c10kBarY(barIndex)}
        opacity={0}
      />
    ))}
    <Txt key="one-meg-label" ref={oneMegLabel}
      text="1 Mo"
      fill={PALETTE.ghost}
      fontSize={() => vW() * 0.011}
      fontFamily={'JetBrains Mono, DM Mono, monospace'}
      x={() => c10kBarX() + vW() * 0.095} y={() => c10kBarY(0)}
      opacity={0}
    />
    <Rect key="mem-gauge-shell" ref={memGaugeShell}
      width={() => vW() * 0.05} height={() => vH() * 0.32}
      fill={PALETTE.nodeBg} stroke={PALETTE.ghost} lineWidth={1.5}
      radius={() => vW() * 0.003}
      x={() => vW() * 0.14} y={stageY}
      opacity={0}
    />
    <Rect key="mem-gauge-fill" ref={memGaugeFill}
      width={() => vW() * 0.04} height={0}
      fill={PALETTE.amber}
      offset={[0, 1]}
      x={() => vW() * 0.14} y={() => stageY() + vH() * 0.155}
      opacity={0}
    />
    <Txt key="mem-label" ref={memLabel}
      text="MEM"
      fill={PALETTE.ghost}
      fontSize={() => vW() * 0.011}
      fontFamily={'JetBrains Mono, DM Mono, monospace'}
      x={() => vW() * 0.14} y={() => stageY() - vH() * 0.21}
      opacity={0}
    />

    {/* ══ Event loop (nginx / node) ═══════════════════════════════════════ */}
    {range(4).map(clientIndex => (
      <Icon key={`event-client-${clientIndex}`} ref={eventClientIcons[clientIndex]}
        icon="mdi:monitor"
        size={() => vW() * 0.024}
        color={PALETTE.ghost}
        x={() => -vW() * 0.30} y={() => eventClientY(clientIndex)}
        opacity={0}
      />
    ))}
    {range(4).map(lineIndex => (
      <Line key={`event-line-${lineIndex}`} ref={eventLines[lineIndex]}
        points={() => [
          [-vW() * 0.275, eventClientY(lineIndex)],
          [vW() * 0.095, stageY()],
        ]}
        stroke={PALETTE.ghost} lineWidth={1}
        end={0} opacity={0}
      />
    ))}
    <Rect key="single-thread-bar" ref={singleThreadBar}
      width={() => vW() * 0.11} height={() => vH() * 0.032}
      fill={PALETTE.amber + '33'} stroke={PALETTE.amber} lineWidth={1.5}
      radius={() => vW() * 0.003}
      x={() => vW() * 0.15} y={stageY}
      opacity={0}
    />
    <Txt key="single-thread-label" ref={singleThreadLabel}
      text="1 thread"
      fill={PALETTE.ghost}
      fontSize={() => vW() * 0.011}
      fontFamily={'JetBrains Mono, DM Mono, monospace'}
      x={() => vW() * 0.15} y={() => stageY() - vH() * 0.06}
      opacity={0}
    />
    <Circle key="event-cursor" ref={eventCursor}
      size={() => vW() * 0.012}
      fill={PALETTE.amber}
      shadowBlur={() => vW() * 0.008}
      shadowColor={PALETTE.amber}
      x={() => -vW() * 0.09} y={stageY}
      opacity={0}
    />

    {/* ══ QUERY · RFC 10008 ═══════════════════════════════════════════════ */}
    <Circle key="query-dot" ref={queryDot}
      size={() => vW() * 0.014}
      fill={PALETTE.dsGreen}
      shadowBlur={() => vW() * 0.012}
      shadowColor={PALETTE.dsGreen}
      x={() => yearX(2026)} y={protoRailY}
      opacity={0}
    />
    <Txt key="query-label" ref={queryLabel}
      text="QUERY · RFC 10008"
      fill={PALETTE.dsGreen}
      fontSize={() => vW() * 0.014}
      fontFamily={'JetBrains Mono, DM Mono, monospace'}
      fontWeight={700}
      x={() => yearX(2026) - vW() * 0.075} y={() => protoRailY() - vH() * 0.05}
      opacity={0}
    />
  </>);

  // ── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Trois allers-retours étiquetés SYN / SYN-ACK / ACK, en ambre — un préambule
   * qui doit se SENTIR lourd. `legDuration` contrôle le poids : ~0.3s pour un
   * handshake complet (vignette B, vignette C), plus court si besoin ailleurs.
   */
  const handshakeStepLabels = ['SYN', 'SYN-ACK', 'ACK'];
  function* miniHandshake(legDuration = 0.6) {
    for (let exchangeIndex = 0; exchangeIndex < 3; exchangeIndex++) {
      const pulseArrow = exchangeIndex % 2 === 0 ? handshakeOutArrow : handshakeBackArrow;
      const labelY = exchangeIndex % 2 === 0
        ? stageY() - vH() * 0.05
        : stageY() + vH() * 0.05;
      handshakeStepLabel().text(handshakeStepLabels[exchangeIndex]);
      handshakeStepLabel().position(new Vector2((clientRightX() + serverLeftX()) / 2, labelY));
      pulseArrow().opacity(1);
      yield* all(
        pulseArrow().end(1, legDuration, easeInOutCubic),
        handshakeStepLabel().opacity(1, legDuration * 0.5),
      );
      yield* waitFor(legDuration * 0.25);
      pulseArrow().opacity(0);
      pulseArrow().end(0);
      handshakeStepLabel().opacity(0);
    }
  }

  // ── ANIMATION ──────────────────────────────────────────────────────────────

  // 1 ─ Deux rails superposés
  yield* waitUntil('rails');
  protoRail().opacity(0.85);
  implRail().opacity(1);
  yield* all(
    protoRail().end(1, 1.6, easeInOutCubic),
    implRail().end(1, 1.6, easeInOutCubic),
  );
  yield* all(
    protoRailLabel().opacity(1, 0.8),
    implRailLabel().opacity(1, 0.8),
    year1991Label().opacity(1, 0.8),
    year2026Label().opacity(1, 0.8),
  );
  yield* waitFor(1);

  // 2 ─ 1991 : les deux points s'allument, un trait les relie… puis SE CASSE
  yield* waitUntil('lien-1991');
  yield* all(
    protoDot1991().opacity(1, 0.6),
    implDot1991().opacity(1, 0.6),
  );
  linkTopHalf().opacity(1);
  linkBottomHalf().opacity(1);
  yield* linkTopHalf().end(1, 0.5, easeOutCubic);
  yield* linkBottomHalf().end(1, 0.5, easeOutCubic);
  yield* waitFor(1.6);

  yield* waitUntil('rupture');
  yield* all(
    linkTopHalf().rotation(-24, 0.7, easeOutCubic),
    linkTopHalf().x(yearX(1991) - vW() * 0.010, 0.7, easeOutCubic),
    linkTopHalf().y(protoRailY() + linkGap() * 0.25 - vH() * 0.010, 0.7, easeOutCubic),
    linkBottomHalf().rotation(24, 0.7, easeOutCubic),
    linkBottomHalf().x(yearX(1991) + vW() * 0.010, 0.7, easeOutCubic),
    linkBottomHalf().y(protoRailY() + linkGap() * 0.75 + vH() * 0.010, 0.7, easeOutCubic),
  );
  yield* all(
    linkTopHalf().opacity(0.25, 1),
    linkBottomHalf().opacity(0.25, 1),
  );
  yield* waitFor(1);

  // 3a ─ Thread-per-connection : un thread par ligne client
  yield* waitUntil('thread-par-connexion');
  yield* serverNode().opacity(1, 0.9);
  yield* threadColumnLabel().opacity(1, 0.6);
  for (let clientIndex = 0; clientIndex < 3; clientIndex++) {
    yield* clientIconsA[clientIndex]().opacity(1, 0.5);
    clientArrowsA[clientIndex]().opacity(1);
    yield* clientArrowsA[clientIndex]().end(1, 0.6, easeInOutCubic);
    yield* threadBarsA[clientIndex]().opacity(1, 0.4);
    yield* waitFor(0.3);
  }
  yield* waitFor(2);

  // 3b ─ Pages complexes : chaque ressource re-déclenche un handshake
  yield* waitUntil('pages-complexes');
  yield* all(
    ...clientIconsA.map(iconRef => iconRef().opacity(0, 0.7)),
    ...clientArrowsA.map(arrowRef => arrowRef().opacity(0, 0.7)),
    ...threadBarsA.map(barRef => barRef().opacity(0, 0.7)),
    threadColumnLabel().opacity(0, 0.7),
  );
  yield* clientIconB().opacity(1, 0.6);
  handshakeCounter().text('handshakes: 0');
  yield* handshakeCounter().opacity(1, 0.6);
  for (let resourceIndex = 0; resourceIndex < 3; resourceIndex++) {
    // Long préambule répétitif — un handshake TCP complet avant la moindre requête.
    yield* miniHandshake(0.6);
    // … puis un échange minuscule : le GET part vite, une fois la voie ouverte.
    requestDot().position(new Vector2(clientRightX(), stageY()));
    requestDot().opacity(1);
    yield* requestDot().position(new Vector2(serverLeftX(), stageY()), 0.4);
    requestDot().opacity(0);
    // La ressource revient du serveur vers le client, en retour du GET — elle s'accumule dans la pile.
    const resourceRestY = stageY() + vH() * (0.10 + resourceIndex * 0.065);
    yield* resourceIcons[resourceIndex]().opacity(1, 0.15);
    yield* resourceIcons[resourceIndex]().position(new Vector2(clientX(), resourceRestY), 0.5, easeInOutCubic);
    yield* handshakeCounter().opacity(0, 0.24);
    handshakeCounter().text(`handshakes: ${resourceIndex + 1}`);
    yield* handshakeCounter().opacity(1, 0.24);
    yield* waitFor(0.3);
  }
  yield* waitFor(1.6);

  // 3c ─ Keep-alive 1997 : une seule ligne TCP persiste
  yield* waitUntil('keep-alive');
  yield* all(
    milestoneDots[0]().opacity(1, 0.6),
    milestoneLabels[0]().opacity(1, 0.7),
  );
  // UN SEUL handshake — même poids qu'en vignette B, mais une seule fois.
  yield* handshakeCounter().opacity(0, 0.4);
  handshakeCounter().text('handshakes: 0');
  yield* miniHandshake(0.6);
  handshakeCounter().text('handshakes: 1');
  yield* handshakeCounter().opacity(1, 0.4);
  tcpLine().opacity(1);
  yield* tcpLine().end(1, 1, easeInOutCubic);
  // La connexion reste ouverte : les GET s'enchaînent vite, presque sans pause.
  for (let tripIndex = 0; tripIndex < 3; tripIndex++) {
    getPacket().position(new Vector2(clientRightX() + vW() * 0.02, stageY()));
    yield* getPacket().opacity(1, 0.1);
    yield* getPacket().flyTo([serverLeftX() - vW() * 0.02, stageY()], 0.5);
    yield* getPacket().opacity(0, 0.1);
  }
  yield* waitFor(1.6);

  // 4 ─ C10K : les threads s'empilent, la mémoire sature
  yield* waitUntil('c10k');
  yield* all(
    clientIconB().opacity(0, 0.7),
    ...resourceIcons.map(iconRef => iconRef().opacity(0, 0.7)),
    tcpLine().opacity(0, 0.7),
    serverNode().opacity(0, 0.7),
    handshakeCounter().opacity(0, 0.7),
  );
  yield* all(
    milestoneDots[1]().opacity(1, 0.6),
    milestoneLabels[1]().opacity(1, 0.7),
  );
  yield* all(
    memGaugeShell().opacity(1, 0.7),
    memLabel().opacity(1, 0.7),
  );
  memGaugeFill().opacity(1);
  // Empilement fluide jusqu'à 9 threads
  for (let barIndex = 0; barIndex < 9; barIndex++) {
    yield* all(
      c10kBars[barIndex]().opacity(1, 0.18),
      memGaugeFill().height(vH() * 0.30 * ((barIndex + 1) / 12), 0.18),
    );
    if (barIndex === 0) yield* oneMegLabel().opacity(1, 0.4);
  }
  // Saturation : la jauge vire rose, les derniers threads aussi
  yield* memGaugeFill().fill(PALETTE.dsRose, 0.6);
  for (let barIndex = 9; barIndex < 12; barIndex++) {
    yield* all(
      c10kBars[barIndex]().opacity(1, 0.2),
      memGaugeFill().height(vH() * 0.30 * ((barIndex + 1) / 12), 0.2),
    );
  }
  yield* all(
    memGaugeShell().stroke(PALETTE.dsRose, 0.5),
    memGaugeFill().shadowColor(PALETTE.dsRose, 0.5),
    memGaugeFill().shadowBlur(vW() * 0.010, 0.5),
  );
  yield* waitFor(2.4);

  // 5 ─ nginx 2004 / Node 2009 : UN SEUL thread, un curseur qui saute
  yield* waitUntil('event-loop');
  yield* all(
    ...c10kBars.map(barRef => barRef().opacity(0, 0.7)),
    oneMegLabel().opacity(0, 0.7),
    memGaugeShell().opacity(0, 0.7),
    memGaugeFill().opacity(0, 0.7),
    memLabel().opacity(0, 0.7),
  );
  yield* all(
    milestoneDots[2]().opacity(1, 0.6),
    milestoneLabels[2]().opacity(1, 0.7),
    milestoneDots[3]().opacity(1, 0.6),
    milestoneLabels[3]().opacity(1, 0.7),
  );
  yield* all(
    singleThreadBar().opacity(1, 0.8),
    singleThreadLabel().opacity(1, 0.8),
  );
  yield* sequence(0.12,
    ...eventClientIcons.map(iconRef => iconRef().opacity(1, 0.5)),
  );
  for (const lineRef of eventLines) lineRef().opacity(1);
  yield* all(
    ...eventLines.map(lineRef => lineRef().end(1, 0.8, easeInOutCubic)),
  );
  // Le curseur saute de connexion en connexion
  yield* eventCursor().opacity(1, 0.4);
  for (let roundIndex = 0; roundIndex < 2; roundIndex++) {
    for (let lineIndex = 0; lineIndex < 4; lineIndex++) {
      const midX = (-vW() * 0.275 + vW() * 0.095) / 2;
      const midY = (eventClientY(lineIndex) + stageY()) / 2;
      yield* eventCursor().position(new Vector2(midX, midY), 0.28, easeOutCubic);
      yield* eventLines[lineIndex]().stroke(PALETTE.amber, 0.16);
      yield* eventLines[lineIndex]().stroke(PALETTE.ghost, 0.36);
    }
  }
  yield* waitFor(1.6);

  // 6 ─ Le rail protocole n'a pas bougé… puis 2026 : QUERY · RFC 10008
  yield* waitUntil('query-2026');
  yield* all(
    ...eventClientIcons.map(iconRef => iconRef().opacity(0, 0.8)),
    ...eventLines.map(lineRef => lineRef().opacity(0, 0.8)),
    singleThreadBar().opacity(0, 0.8),
    singleThreadLabel().opacity(0, 0.8),
    eventCursor().opacity(0, 0.8),
  );
  // Un battement : les deux rails seuls, l'un chargé d'histoire, l'autre plat.
  yield* waitFor(2);
  yield* queryDot().opacity(1, 0.6);
  yield* all(
    queryDot().scale(1.5, 0.5, easeOutCubic),
    queryLabel().opacity(1, 0.8),
  );
  yield* queryDot().scale(1, 0.7, easeInOutCubic);
  yield* waitFor(3);

  // ── Fade-out ───────────────────────────────────────────────────────────────
  yield* waitUntil('end');
  yield* all(
    protoRail().opacity(0, 1),
    implRail().opacity(0, 1),
    protoRailLabel().opacity(0, 1),
    implRailLabel().opacity(0, 1),
    year1991Label().opacity(0, 1),
    year2026Label().opacity(0, 1),
    protoDot1991().opacity(0, 1),
    implDot1991().opacity(0, 1),
    linkTopHalf().opacity(0, 1),
    linkBottomHalf().opacity(0, 1),
    ...milestoneDots.map(dotRef => dotRef().opacity(0, 1)),
    ...milestoneLabels.map(labelRef => labelRef().opacity(0, 1)),
    queryDot().opacity(0, 1),
    queryLabel().opacity(0, 1),
  );
  yield* waitFor(0.6);
});
