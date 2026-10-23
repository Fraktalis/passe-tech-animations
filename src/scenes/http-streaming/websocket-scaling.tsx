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
  Reference,
} from '@motion-canvas/core';
import {ConnectionArrow, DiagramNode} from '../../components';
import {PALETTE} from '../../theme';

/**
 * ACTE 2 — le load balancer perd sa méthode avec WebSocket.
 * Round-robin joyeux en HTTP, puis chaque client se soude à une instance :
 * l'événement du client A ne sort plus de l'instance 1. Solution : Redis
 * pub/sub relie les instances — cascade complète, puis scale-out radial
 * à 8 instances (clin d'œil One Million Checkboxes).
 */
export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  view.fill(PALETTE.bg);

  // ── Géométrie ──────────────────────────────────────────────────────────────
  const clientY    = () => -vH() * 0.42;
  const clientXs   = [-0.26, 0, 0.26];
  const clientX    = (clientIndex: number) => vW() * clientXs[clientIndex];
  const lbY        = () => -vH() * 0.26;
  const instanceY  = () => vH() * 0.04;
  const instanceXs = [-0.24, 0, 0.24];
  const instanceX  = (instanceIndex: number) => vW() * instanceXs[instanceIndex];
  const instanceTopY    = () => instanceY() - vH() * 0.085;
  const instanceBottomY = () => instanceY() + vH() * 0.085;
  const redisY     = () => vH() * 0.36;
  const redisTopY  = () => redisY() - vH() * 0.075;

  // Chemins des sockets persistants (contournent le LB par l'extérieur, à sa hauteur)
  const socketDetourXs = [-0.32, 0.18, 0.34];
  const socketPath = (socketIndex: number): [number, number][] => [
    [clientX(socketIndex), clientY() + vH() * 0.035],
    [vW() * socketDetourXs[socketIndex], lbY()],
    [instanceX(socketIndex), instanceTopY()],
  ];
  // Chemins instance → Redis
  const redisPath = (instanceIndex: number): [number, number][] => [
    [instanceX(instanceIndex), instanceBottomY()],
    [vW() * [-0.035, 0, 0.035][instanceIndex], redisTopY()],
  ];

  // Scale-out radial
  const scaleOutCenterY = () => vH() * 0.02;
  const miniAngle = (miniIndex: number) => ((-90 + miniIndex * 45) * Math.PI) / 180;
  const miniX = (miniIndex: number) => Math.cos(miniAngle(miniIndex)) * vW() * 0.27;
  const miniY = (miniIndex: number) =>
    scaleOutCenterY() + Math.sin(miniAngle(miniIndex)) * vH() * 0.33;

  // ── Refs ───────────────────────────────────────────────────────────────────
  const lbNode      = createRef<DiagramNode>();
  const clientIcons   = range(3).map(() => createRef<Icon>());
  const clientLetters = range(3).map(() => createRef<Txt>());
  const checkboxes    = range(3).map(() => createRef<Rect>());
  const checkmarks    = range(3).map(() => createRef<Txt>());
  const questionMarks = range(2).map(() => createRef<Txt>());  // clients B et C
  const lbArrows      = range(3).map(() => createRef<ConnectionArrow>());
  const instanceNodes = range(3).map(() => createRef<DiagramNode>());
  const requestDot    = createRef<Circle>();
  const socketLines   = range(3).map(() => createRef<Line>());
  const eventDotA     = createRef<Circle>();
  const eventDotB     = createRef<Circle>();
  const relayDotLeft  = createRef<Circle>();
  const relayDotRight = createRef<Circle>();
  const redisNode     = createRef<DiagramNode>();
  const redisLines    = range(3).map(() => createRef<Line>());
  const miniNodes     = range(8).map(() => createRef<DiagramNode>());
  const miniLines     = range(8).map(() => createRef<Line>());

  // ── Scene tree ─────────────────────────────────────────────────────────────
  view.add(<>
    {/* ══ Topologie : LB + 3 instances + clients ══════════════════════════ */}
    <DiagramNode key="lb-node" ref={lbNode}
      iconName="mdi:call-split"
      label="LB"
      sublabel="round-robin"
      color={PALETTE.secondary}
      initialState="active"
      width={() => vW() * 0.12} height={() => vH() * 0.15}
      x={0} y={lbY}
      opacity={0}
    />
    {range(3).map(clientIndex => (
      <Icon key={`client-${clientIndex}`} ref={clientIcons[clientIndex]}
        icon="mdi:monitor"
        size={() => vW() * 0.026}
        color={PALETTE.cyan}
        x={() => clientX(clientIndex)} y={clientY}
        opacity={0}
      />
    ))}
    {range(3).map(clientIndex => (
      <Txt key={`client-letter-${clientIndex}`} ref={clientLetters[clientIndex]}
        text={['A', 'B', 'C'][clientIndex]}
        fill={PALETTE.ghost}
        fontSize={() => vW() * 0.012}
        fontFamily={'JetBrains Mono, DM Mono, monospace'}
        x={() => clientX(clientIndex) - vW() * 0.030} y={clientY}
        opacity={0}
      />
    ))}
    {range(3).map(clientIndex => (
      <Rect key={`checkbox-${clientIndex}`} ref={checkboxes[clientIndex]}
        width={() => vW() * 0.016} height={() => vW() * 0.016}
        fill={PALETTE.nodeBg} stroke={PALETTE.ghost} lineWidth={1.5}
        radius={() => vW() * 0.002}
        x={() => clientX(clientIndex) + vW() * 0.038} y={clientY}
        opacity={0}
      >
        <Txt key={`checkmark-${clientIndex}`} ref={checkmarks[clientIndex]}
          text="✓"
          fill={PALETTE.dsGreen}
          fontSize={() => vW() * 0.012}
          fontFamily={'JetBrains Mono, DM Mono, monospace'}
          opacity={0}
        />
      </Rect>
    ))}
    {range(2).map(ghostIndex => (
      <Txt key={`question-mark-${ghostIndex}`} ref={questionMarks[ghostIndex]}
        text="?"
        fill={PALETTE.dsRose}
        fontSize={() => vW() * 0.020}
        fontFamily={'JetBrains Mono, DM Mono, monospace'}
        fontWeight={700}
        x={() => clientX(ghostIndex + 1) + vW() * 0.038}
        y={() => clientY() - vH() * 0.055}
        opacity={0}
      />
    ))}
    {range(3).map(instanceIndex => (
      <ConnectionArrow key={`lb-arrow-${instanceIndex}`} ref={lbArrows[instanceIndex]}
        from={() => [instanceX(instanceIndex) * 0.15, lbY() + vH() * 0.075]}
        to={() => [instanceX(instanceIndex), instanceTopY()]}
        stroke={PALETTE.ghost}
        end={0} opacity={0}
      />
    ))}
    {range(3).map(instanceIndex => (
      <DiagramNode key={`instance-${instanceIndex}`} ref={instanceNodes[instanceIndex]}
        iconName="mdi:server"
        label={`S${instanceIndex + 1}`}
        color={PALETTE.secondary}
        initialState="idle"
        width={() => vW() * 0.10} height={() => vH() * 0.17}
        x={() => instanceX(instanceIndex)} y={instanceY}
        opacity={0}
      />
    ))}

    {/* ══ Flux ════════════════════════════════════════════════════════════ */}
    <Circle key="request-dot" ref={requestDot}
      size={() => vW() * 0.009}
      fill={PALETTE.cyan}
      opacity={0}
    />
    {range(3).map(socketIndex => (
      <Line key={`socket-${socketIndex}`} ref={socketLines[socketIndex]}
        points={() => socketPath(socketIndex)}
        radius={() => vW() * 0.02}
        stroke={PALETTE.cyan} lineWidth={2.5}
        lineDash={() => [vW() * 0.008, vW() * 0.006]}
        end={0} opacity={0}
      />
    ))}
    <Circle key="event-dot-a" ref={eventDotA}
      size={() => vW() * 0.009}
      fill={PALETTE.cyan}
      shadowBlur={() => vW() * 0.006}
      shadowColor={PALETTE.cyan}
      opacity={0}
    />
    <Circle key="event-dot-b" ref={eventDotB}
      size={() => vW() * 0.009}
      fill={PALETTE.cyan}
      shadowBlur={() => vW() * 0.006}
      shadowColor={PALETTE.cyan}
      opacity={0}
    />
    <Circle key="relay-dot-left" ref={relayDotLeft}
      size={() => vW() * 0.009}
      fill={PALETTE.amber}
      shadowBlur={() => vW() * 0.006}
      shadowColor={PALETTE.amber}
      opacity={0}
    />
    <Circle key="relay-dot-right" ref={relayDotRight}
      size={() => vW() * 0.009}
      fill={PALETTE.amber}
      shadowBlur={() => vW() * 0.006}
      shadowColor={PALETTE.amber}
      opacity={0}
    />

    {/* ══ Redis pub/sub ═══════════════════════════════════════════════════ */}
    {range(3).map(instanceIndex => (
      <Line key={`redis-line-${instanceIndex}`} ref={redisLines[instanceIndex]}
        points={() => redisPath(instanceIndex)}
        stroke={PALETTE.amber} lineWidth={2}
        end={0} opacity={0}
      />
    ))}
    <DiagramNode key="redis-node" ref={redisNode}
      iconName="mdi:database"
      label="REDIS / NATS"
      sublabel="pub/sub"
      color={PALETTE.amber}
      initialState="active"
      width={() => vW() * 0.16} height={() => vH() * 0.15}
      x={0} y={redisY}
      opacity={0}
    />

    {/* ══ Scale-out radial : 8 instances ══════════════════════════════════ */}
    {range(8).map(miniIndex => (
      <Line key={`mini-line-${miniIndex}`} ref={miniLines[miniIndex]}
        points={() => [
          [
            Math.cos(miniAngle(miniIndex)) * vW() * 0.08,
            scaleOutCenterY() + Math.sin(miniAngle(miniIndex)) * vH() * 0.11,
          ],
          [
            Math.cos(miniAngle(miniIndex)) * vW() * 0.21,
            scaleOutCenterY() + Math.sin(miniAngle(miniIndex)) * vH() * 0.26,
          ],
        ]}
        stroke={PALETTE.amber + '55'} lineWidth={1.5}
        end={0} opacity={0}
      />
    ))}
    {range(8).map(miniIndex => (
      <DiagramNode key={`mini-instance-${miniIndex}`} ref={miniNodes[miniIndex]}
        iconName="mdi:server"
        label={`S${miniIndex + 1}`}
        color={PALETTE.secondary}
        initialState="idle"
        width={() => vW() * 0.065} height={() => vH() * 0.12}
        x={() => miniX(miniIndex)} y={() => miniY(miniIndex)}
        opacity={0}
      />
    ))}
  </>);

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Déplace un point lumineux le long d'une liste de points (durées ∝ longueurs). */
  function* travelDot(
    dotRef: Reference<Circle>,
    pathPoints: [number, number][],
    totalDuration: number,
  ) {
    const segmentLengths: number[] = [];
    let totalLength = 0;
    for (let pointIndex = 1; pointIndex < pathPoints.length; pointIndex++) {
      const deltaX = pathPoints[pointIndex][0] - pathPoints[pointIndex - 1][0];
      const deltaY = pathPoints[pointIndex][1] - pathPoints[pointIndex - 1][1];
      const segmentLength = Math.hypot(deltaX, deltaY);
      segmentLengths.push(segmentLength);
      totalLength += segmentLength;
    }
    dotRef().position(new Vector2(pathPoints[0][0], pathPoints[0][1]));
    yield* dotRef().opacity(1, 0.16);
    for (let pointIndex = 1; pointIndex < pathPoints.length; pointIndex++) {
      yield* dotRef().position(
        new Vector2(pathPoints[pointIndex][0], pathPoints[pointIndex][1]),
        totalDuration * (segmentLengths[pointIndex - 1] / totalLength),
      );
    }
    yield* dotRef().opacity(0, 0.16);
  }

  /** Pulse bref d'une instance. */
  function* pulseInstance(instanceRef: Reference<DiagramNode>) {
    yield* instanceRef().setState('active', 0.3);
    yield* instanceRef().setState('idle', 0.7);
  }

  // ── ANIMATION ──────────────────────────────────────────────────────────────

  // 1 ─ Topologie : LB, instances, clients
  yield* waitUntil('topologie');
  yield* lbNode().opacity(1, 0.9);
  yield* sequence(0.2,
    ...instanceNodes.map(nodeRef => nodeRef().opacity(1, 0.7)),
  );
  for (const arrowRef of lbArrows) arrowRef().opacity(1);
  yield* all(
    ...lbArrows.map(arrowRef => arrowRef().end(1, 0.8, easeInOutCubic)),
  );
  yield* sequence(0.16,
    ...range(3).map(clientIndex => all(
      clientIcons[clientIndex]().opacity(1, 0.6),
      clientLetters[clientIndex]().opacity(1, 0.6),
      checkboxes[clientIndex]().opacity(1, 0.6),
    )),
  );
  yield* waitFor(1);

  // 2 ─ Round-robin HTTP : les requêtes atterrissent n'importe où
  yield* waitUntil('round-robin');
  for (let requestIndex = 0; requestIndex < 3; requestIndex++) {
    yield* travelDot(requestDot, [
      [clientX(requestIndex), clientY() + vH() * 0.035],
      [0, lbY()],
      [instanceX(requestIndex), instanceTopY()],
    ], 1.2);
    yield* pulseInstance(instanceNodes[requestIndex]);
  }
  yield* waitFor(1.2);

  // 3 ─ WebSocket : chaque client se SOUDE à une instance, le LB décroche
  yield* waitUntil('websocket');
  for (let socketIndex = 0; socketIndex < 3; socketIndex++) {
    socketLines[socketIndex]().opacity(1);
    yield* socketLines[socketIndex]().end(1, 0.9, easeInOutCubic);
  }
  yield* all(
    lbNode().opacity(0.3, 1),
    ...lbArrows.map(arrowRef => arrowRef().opacity(0.15, 1)),
  );
  yield* waitFor(1);

  // 4 ─ Client A coche une case → seul S1 diffuse ; B et C ne voient rien
  yield* waitUntil('case-cochee');
  yield* all(
    checkmarks[0]().opacity(1, 0.5),
    checkboxes[0]().stroke(PALETTE.dsGreen, 0.5),
  );
  yield* travelDot(eventDotA, socketPath(0), 1.1);
  yield* pulseInstance(instanceNodes[0]);
  yield* travelDot(eventDotA, [...socketPath(0)].reverse(), 1.1);

  yield* waitUntil('echec-diffusion');
  yield* all(
    ...questionMarks.map(markRef => markRef().opacity(1, 0.7)),
    checkboxes[1]().stroke(PALETTE.dsRose, 0.7),
    checkboxes[2]().stroke(PALETTE.dsRose, 0.7),
  );
  yield* waitFor(2);

  // 5 ─ Redis pub/sub : le canal commun entre instances
  yield* waitUntil('redis');
  yield* redisNode().opacity(1, 0.9);
  for (const lineRef of redisLines) lineRef().opacity(1);
  yield* sequence(0.2,
    ...redisLines.map(lineRef => lineRef().end(1, 0.8, easeInOutCubic)),
  );
  yield* waitFor(0.8);

  // L'événement de A remonte : S1 → Redis → S2 + S3 → clients B et C
  yield* waitUntil('diffusion-complete');
  yield* travelDot(eventDotA, socketPath(0), 1);
  yield* pulseInstance(instanceNodes[0]);
  yield* travelDot(relayDotLeft, redisPath(0), 0.8);
  yield* redisNode().setState('highlighted', 0.3);
  yield* all(
    travelDot(relayDotLeft, [...redisPath(1)].reverse(), 0.8),
    travelDot(relayDotRight, [...redisPath(2)].reverse(), 0.8),
  );
  yield* all(
    pulseInstance(instanceNodes[1]),
    pulseInstance(instanceNodes[2]),
    redisNode().setState('active', 0.7),
  );
  yield* all(
    travelDot(eventDotA, [...socketPath(1)].reverse(), 1),
    travelDot(eventDotB, [...socketPath(2)].reverse(), 1),
  );
  yield* all(
    checkmarks[1]().opacity(1, 0.5),
    checkmarks[2]().opacity(1, 0.5),
    checkboxes[1]().stroke(PALETTE.dsGreen, 0.5),
    checkboxes[2]().stroke(PALETTE.dsGreen, 0.5),
    ...questionMarks.map(markRef => markRef().opacity(0, 0.7)),
  );
  yield* waitFor(2.4);

  // 6 ─ Scale-out : 8 instances autour de Redis, le flux circule
  yield* waitUntil('scale-out');
  yield* all(
    lbNode().opacity(0, 1),
    ...lbArrows.map(arrowRef => arrowRef().opacity(0, 1)),
    ...clientIcons.map(iconRef => iconRef().opacity(0, 1)),
    ...clientLetters.map(letterRef => letterRef().opacity(0, 1)),
    ...checkboxes.map(boxRef => boxRef().opacity(0, 1)),
    ...socketLines.map(lineRef => lineRef().opacity(0, 1)),
    ...instanceNodes.map(nodeRef => nodeRef().opacity(0, 1)),
    ...redisLines.map(lineRef => lineRef().opacity(0, 1)),
  );
  yield* redisNode().y(scaleOutCenterY(), 1.2, easeInOutCubic);
  for (const lineRef of miniLines) lineRef().opacity(1);
  yield* sequence(0.12,
    ...range(8).map(miniIndex => all(
      miniNodes[miniIndex]().opacity(1, 0.6),
      miniLines[miniIndex]().end(1, 0.6, easeOutCubic),
    )),
  );
  // Le flux continue : une instance publie, Redis diffuse à toutes
  for (const sourceIndex of [2, 6]) {
    yield* miniLines[sourceIndex]().stroke(PALETTE.amber, 0.3);
    yield* redisNode().setState('highlighted', 0.24);
    yield* all(
      ...miniLines.map(lineRef => lineRef().stroke(PALETTE.amber, 0.3)),
    );
    yield* all(
      ...miniLines.map(lineRef => lineRef().stroke(PALETTE.amber + '55', 0.8)),
      redisNode().setState('active', 0.8),
    );
    yield* waitFor(0.6);
  }
  yield* waitFor(2);

  // ── Fade-out ───────────────────────────────────────────────────────────────
  yield* waitUntil('end');
  yield* all(
    redisNode().opacity(0, 1),
    ...miniNodes.map(nodeRef => nodeRef().opacity(0, 1)),
    ...miniLines.map(lineRef => lineRef().opacity(0, 1)),
  );
  yield* waitFor(0.6);
});
