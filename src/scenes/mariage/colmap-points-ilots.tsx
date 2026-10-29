/**
 * colmap-points-ilots — Points saillants, correspondances, graphe… et l'échec de
 * la piste de danse (Ch. 4, JUMEAU).
 *
 * COLMAP ne retient que ce qui est reconnaissable d'une image à l'autre : une
 * verrière (dalles, barres) se couvre de points, un mur blanc presque pas. Les
 * mêmes points relient deux vues ; les images deviennent un graphe qui se
 * connecte en un bloc. Dans la salle sombre, le graphe se fragmente en îlots
 * qui ne se recollent jamais.
 *
 * Couleur active : vert. Rose pour tout ce qui échoue.
 * Nuages de points : PRNG déterministe (useRandom) pour la position des nœuds.
 *
 * Battements : points-saillants · correspondances · graphe · piste-de-danse
 */
import {makeScene2D, Grid, Layout, Rect, Circle, Line, Txt, Icon} from '@motion-canvas/2d';
import {
  createRef,
  createSignal,
  Reference,
  all,
  sequence,
  waitUntil,
  waitFor,
  easeInOutCubic,
  easeOutCubic,
  linear,
  useRandom,
} from '@motion-canvas/core';
import {ConnectionArrow} from '../../components';
import {PALETTE} from '../../theme';
import {sfx, sfxFill, sfxReset, sfxFlush} from '../../sfx';

type MapUV = (u: number, v: number) => [number, number];

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  view.fill(PALETTE.bg);

  const FONT_MONO = 'JetBrains Mono, DM Mono, monospace';

  // ── Images « verrière » : coordonnées normalisées u, v ∈ [-0.5, 0.5] ───────
  const IMAGE_WIDTH = () => vW() * 0.3;
  const IMAGE_HEIGHT = () => vH() * 0.4;
  const IMAGE_A_X = -0.19;   // fraction de vW
  const IMAGE_B_X = 0.19;
  const IMAGE_Y = -0.05;     // fraction de vH

  const identityMap: MapUV = (u, v) => [u, v];
  // Seconde prise de vue : léger décalage + cisaillement
  const shiftedMap: MapUV = (u, v) => [0.95 * u + 0.06 + 0.05 * v, v + 0.03 * u];
  const localPoint = (mapUV: MapUV, u: number, v: number): [number, number] => {
    const [mappedU, mappedV] = mapUV(u, v);
    return [mappedU * IMAGE_WIDTH(), mappedV * IMAGE_HEIGHT()];
  };

  const ROOF_BARS = [-0.44, -0.34, -0.24, -0.14, -0.04];
  const MULLIONS = [-0.3, -0.1, 0.1, 0.3];
  const SLAB_ROWS = [0.04, 0.17, 0.32];
  const SLAB_COLS = [-0.4, -0.2, 0, 0.2, 0.4];
  const SALIENT_POINTS: [number, number][] = [
    ...ROOF_BARS.flatMap(v => MULLIONS.map(u => [u, v] as [number, number])),
    ...SLAB_ROWS.flatMap(v => SLAB_COLS.map(u => [u, v] as [number, number])),
  ];
  const salientIndices = SALIENT_POINTS.map((_, i) => i);

  const dotsA = salientIndices.map(() => createRef<Circle>());
  const dotsB = salientIndices.map(() => createRef<Circle>());
  const wallDots = [createRef<Circle>(), createRef<Circle>()];
  const WALL_POINTS: [number, number][] = [[0.18, 0.1], [0.24, 0.16]];

  /** Dessin d'une verrière (barres du toit + dalles) et de ses points saillants. */
  const verriereContent = (prefix: string, mapUV: MapUV, dotRefs: Reference<Circle>[]) => (<>
    {ROOF_BARS.map((v, barIndex) => (
      <Line key={`${prefix}-roof-bar-${barIndex}`}
        points={() => [localPoint(mapUV, -0.5, v), localPoint(mapUV, 0.5, v)]}
        stroke={'#3A4452'} lineWidth={3}
      />
    ))}
    {MULLIONS.map((u, mullionIndex) => (
      <Line key={`${prefix}-mullion-${mullionIndex}`}
        points={() => [localPoint(mapUV, u, -0.5), localPoint(mapUV, u, -0.04)]}
        stroke={'#3A4452'} lineWidth={3}
      />
    ))}
    {SLAB_ROWS.map((v, rowIndex) => (
      <Line key={`${prefix}-slab-row-${rowIndex}`}
        points={() => [localPoint(mapUV, -0.5, v), localPoint(mapUV, 0.5, v)]}
        stroke={'#2C343F'} lineWidth={2}
      />
    ))}
    {SLAB_COLS.map((u, colIndex) => (
      <Line key={`${prefix}-slab-col-${colIndex}`}
        points={() => [localPoint(mapUV, u, 0.04), localPoint(mapUV, u, 0.5)]}
        stroke={'#2C343F'} lineWidth={2}
      />
    ))}
    {SALIENT_POINTS.map(([u, v], pointIndex) => (
      <Circle key={`${prefix}-dot-${pointIndex}`} ref={dotRefs[pointIndex]}
        x={() => localPoint(mapUV, u, v)[0]}
        y={() => localPoint(mapUV, u, v)[1]}
        size={() => vW() * 0.009}
        fill={PALETTE.vert}
        stroke={PALETTE.bg}
        lineWidth={1}
        opacity={0}
      />
    ))}
  </>);

  // ── Graphe d'images ────────────────────────────────────────────────────────
  const random = useRandom(11);
  const GRID_COLS = 5;
  const GRID_ROWS = 3;
  const nodeIndices = Array.from({length: GRID_COLS * GRID_ROWS}, (_, i) => i);
  const nodeBase: [number, number][] = nodeIndices.map(nodeIndex => {
    const col = nodeIndex % GRID_COLS;
    const row = Math.floor(nodeIndex / GRID_COLS);
    return [
      (col - 2) * 0.15 + random.nextFloat(-0.015, 0.015),
      (row - 1) * 0.2 - 0.02 + random.nextFloat(-0.02, 0.02),
    ];
  });
  const NODE_FROM_IMAGE_A = 6;   // (ligne 1, col. 1)
  const NODE_FROM_IMAGE_B = 8;   // (ligne 1, col. 3)
  const nodePosition = (nodeIndex: number): [number, number] =>
    [vW() * nodeBase[nodeIndex][0], vH() * nodeBase[nodeIndex][1]];

  const edgePairs: [number, number][] = [];
  nodeIndices.forEach(nodeIndex => {
    const col = nodeIndex % GRID_COLS;
    const row = Math.floor(nodeIndex / GRID_COLS);
    if (col < GRID_COLS - 1) edgePairs.push([nodeIndex, nodeIndex + 1]);
    if (row < GRID_ROWS - 1) edgePairs.push([nodeIndex, nodeIndex + GRID_COLS]);
    if (col < GRID_COLS - 1 && row < GRID_ROWS - 1 && (col + row) % 2 === 0) {
      edgePairs.push([nodeIndex, nodeIndex + GRID_COLS + 1]);
    }
  });
  // Îlots : gauche-haut, gauche-bas, droite-haut, droite-bas
  const islandOf = (nodeIndex: number) => {
    const col = nodeIndex % GRID_COLS;
    const row = Math.floor(nodeIndex / GRID_COLS);
    return (col <= 1 ? 0 : 2) + (row <= 1 ? 0 : 1);
  };
  const ISLAND_OFFSETS: [number, number][] = [[-0.05, -0.05], [-0.05, 0.09], [0.05, -0.06], [0.05, 0.09]];

  const THUMB_WIDTH = () => vW() * 0.06;
  const THUMB_HEIGHT = () => vH() * 0.08;

  // ── Signaux de compteurs ───────────────────────────────────────────────────
  const countA = createSignal(0);
  const countWall = createSignal(0);
  const countMatches = createSignal(0);
  const gaugeProgress = createSignal(0);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const gridRef = createRef<Grid>();
  const imageA = createRef<Layout>();
  const imageB = createRef<Layout>();
  const imageWall = createRef<Layout>();
  const countALabel = createRef<Txt>();
  const countWallLabel = createRef<Txt>();
  const countMatchesLabel = createRef<Txt>();
  const matchLines = salientIndices.map(() => createRef<Line>());
  const edgeRefs = edgePairs.map(() => createRef<Line>());
  const nodeRefs = nodeIndices.map(() => createRef<Layout>());
  const nodeFrames = nodeIndices.map(() => createRef<Rect>());
  const dimOverlays = nodeIndices.map(() => createRef<Rect>());
  const hullRef = createRef<Rect>();
  const roomIcon = createRef<Icon>();
  const roomArrow = createRef<ConnectionArrow>();
  const attemptLines = [createRef<Line>(), createRef<Line>()];
  const gaugeOuter = createRef<Rect>();
  const gaugeInner = createRef<Rect>();
  const failIcon = createRef<Icon>();

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

    {/* ── Graphe (arêtes sous les nœuds) ───────────────────────────────── */}
    <Rect key="graph-hull" ref={hullRef}
      y={() => -vH() * 0.02}
      width={() => vW() * 0.78} height={() => vH() * 0.56}
      fill={PALETTE.vert + '10'}
      stroke={PALETTE.vert}
      lineWidth={2}
      lineDash={[10, 8]}
      radius={() => vW() * 0.01}
      opacity={0}
    />
    {edgePairs.map(([nodeA, nodeB], edgeIndex) => (
      <Line key={`graph-edge-${nodeA}-${nodeB}`} ref={edgeRefs[edgeIndex]}
        points={() => [nodeRefs[nodeA]().position(), nodeRefs[nodeB]().position()]}
        stroke={PALETTE.vert}
        lineWidth={2}
        end={0}
        opacity={0}
      />
    ))}
    {nodeIndices.map(nodeIndex => (
      <Layout key={`graph-node-${nodeIndex}`} ref={nodeRefs[nodeIndex]}
        position={() => nodePosition(nodeIndex)}
        opacity={0}
      >
        <Rect key={`graph-node-frame-${nodeIndex}`} ref={nodeFrames[nodeIndex]}
          width={THUMB_WIDTH} height={THUMB_HEIGHT}
          fill={'#141A22'}
          stroke={PALETTE.ghost}
          lineWidth={2}
          radius={() => vW() * 0.004}
        />
        <Icon key={`graph-node-icon-${nodeIndex}`}
          icon="mdi:image-outline"
          color={PALETTE.ghost}
          size={() => vW() * 0.02}
        />
        <Rect key={`graph-node-dim-${nodeIndex}`} ref={dimOverlays[nodeIndex]}
          width={THUMB_WIDTH} height={THUMB_HEIGHT}
          fill={'#05070A'}
          radius={() => vW() * 0.004}
          opacity={0}
        />
      </Layout>
    ))}

    <ConnectionArrow key="room-arrow" ref={roomArrow}
      from={() => [0, -vH() * 0.31]}
      to={() => [0, -vH() * 0.36]}
      stroke={PALETTE.vert}
      lineWidth={2}
      routing={0}
      opacity={0}
    />
    <Icon key="room-icon" ref={roomIcon}
      icon="mdi:cube-scan"
      color={PALETTE.vert}
      size={() => vW() * 0.05}
      y={() => -vH() * 0.42}
      opacity={0}
    />

    {/* ── Images : verrière A, verrière B (autre prise de vue), mur blanc ── */}
    <Layout key="image-a" ref={imageA}
      x={() => vW() * IMAGE_A_X} y={() => vH() * IMAGE_Y}
      opacity={0}
    >
      <Rect key="image-a-frame"
        width={IMAGE_WIDTH} height={IMAGE_HEIGHT}
        fill={'#141A22'} stroke={PALETTE.ghost} lineWidth={2}
        radius={() => vW() * 0.004}
        clip
      >
        {verriereContent('image-a', identityMap, dotsA)}
      </Rect>
    </Layout>

    <Layout key="image-b" ref={imageB}
      x={() => vW() * IMAGE_B_X} y={() => vH() * IMAGE_Y}
      opacity={0}
    >
      <Rect key="image-b-frame"
        width={IMAGE_WIDTH} height={IMAGE_HEIGHT}
        fill={'#141A22'} stroke={PALETTE.ghost} lineWidth={2}
        radius={() => vW() * 0.004}
        clip
      >
        {verriereContent('image-b', shiftedMap, dotsB)}
      </Rect>
    </Layout>

    <Layout key="image-wall" ref={imageWall}
      x={() => vW() * IMAGE_B_X} y={() => vH() * IMAGE_Y}
      opacity={0}
    >
      <Rect key="image-wall-frame"
        width={IMAGE_WIDTH} height={IMAGE_HEIGHT}
        fill={'#B9BCB7'} stroke={PALETTE.ghost} lineWidth={2}
        radius={() => vW() * 0.004}
        clip
      >
        <Rect key="wall-socket"
          x={() => IMAGE_WIDTH() * 0.21} y={() => IMAGE_HEIGHT() * 0.13}
          width={() => vW() * 0.02} height={() => vW() * 0.02}
          fill={'#A8ABA6'}
          radius={() => vW() * 0.002}
        />
        {WALL_POINTS.map(([u, v], pointIndex) => (
          <Circle key={`wall-dot-${pointIndex}`} ref={wallDots[pointIndex]}
            x={() => IMAGE_WIDTH() * u} y={() => IMAGE_HEIGHT() * v}
            size={() => vW() * 0.009}
            fill={PALETTE.vert}
            stroke={PALETTE.bg}
            lineWidth={1}
            opacity={0}
          />
        ))}
      </Rect>
    </Layout>

    {/* Compteurs de points */}
    <Txt key="count-a-label" ref={countALabel}
      text={() => `${Math.round(countA())}`}
      x={() => vW() * IMAGE_A_X} y={() => vH() * 0.2}
      fill={PALETTE.vert}
      fontFamily={FONT_MONO} fontWeight={700}
      fontSize={() => vW() * 0.026}
      opacity={0}
    />
    <Txt key="count-wall-label" ref={countWallLabel}
      text={() => `${Math.round(countWall())}`}
      x={() => vW() * IMAGE_B_X} y={() => vH() * 0.2}
      fill={PALETTE.rose}
      fontFamily={FONT_MONO} fontWeight={700}
      fontSize={() => vW() * 0.026}
      opacity={0}
    />

    {/* Correspondances entre les deux vues */}
    {SALIENT_POINTS.map(([u, v], pointIndex) => (
      <Line key={`match-line-${pointIndex}`} ref={matchLines[pointIndex]}
        points={() => {
          const fromLocal = localPoint(identityMap, u, v);
          const toLocal = localPoint(shiftedMap, u, v);
          return [
            [vW() * IMAGE_A_X + fromLocal[0], vH() * IMAGE_Y + fromLocal[1]],
            [vW() * IMAGE_B_X + toLocal[0], vH() * IMAGE_Y + toLocal[1]],
          ];
        }}
        stroke={PALETTE.vert}
        lineWidth={1}
        end={0}
        opacity={0.55}
      />
    ))}
    <Txt key="count-matches-label" ref={countMatchesLabel}
      text={() => `${Math.round(countMatches())}`}
      y={() => vH() * 0.24}
      fill={PALETTE.vert}
      fontFamily={FONT_MONO} fontWeight={700}
      fontSize={() => vW() * 0.034}
      opacity={0}
    />

    {/* Tentatives de recollage qui rebondissent */}
    <Line key="attempt-line-top" ref={attemptLines[0]}
      points={() => [nodeRefs[6]().position(), nodeRefs[7]().position()]}
      stroke={PALETTE.rose}
      lineWidth={3}
      lineDash={[10, 8]}
      end={0}
      opacity={0}
    />
    <Line key="attempt-line-bottom" ref={attemptLines[1]}
      points={() => [nodeRefs[11]().position(), nodeRefs[12]().position()]}
      stroke={PALETTE.rose}
      lineWidth={3}
      lineDash={[10, 8]}
      end={0}
      opacity={0}
    />

    {/* Indicateur de convergence */}
    <Rect key="gauge-outer" ref={gaugeOuter}
      y={() => vH() * 0.41}
      width={() => vW() * 0.3} height={() => vH() * 0.03}
      fill={'#00000000'}
      stroke={PALETTE.ghost}
      lineWidth={2}
      radius={() => vH() * 0.015}
      opacity={0}
    >
      <Rect key="gauge-inner" ref={gaugeInner}
        x={() => -vW() * 0.15}
        offset={[-1, 0]}
        width={() => vW() * 0.3 * gaugeProgress()}
        height={() => vH() * 0.03}
        fill={PALETTE.vert}
        radius={() => vH() * 0.015}
      />
    </Rect>
    <Icon key="fail-icon" ref={failIcon}
      icon="mdi:close-circle"
      color={PALETTE.rose}
      size={() => vW() * 0.035}
      x={() => vW() * 0.2} y={() => vH() * 0.41}
      opacity={0}
    />
  </>);

  // ── ANIMATION ──────────────────────────────────────────────────────────────

  // 1. Points saillants : la verrière en reçoit beaucoup, le mur blanc presque aucun
  sfxReset();
  yield* waitUntil('points-saillants');
  yield* all(
    gridRef().opacity(0.07, 1),
    imageA().opacity(1, 0.7),
    imageWall().opacity(1, 0.7),
  );
  sfxFill(0, 1, 1.6, {steps: 10});
  sfxFill(0, 0.3, 0.8, {steps: 10, volume: 0.7});
  yield* all(
    sequence(0.04, ...dotsA.map(dotRef => dotRef().opacity(1, 0.2))),
    countALabel().opacity(1, 0.3),
    countA(SALIENT_POINTS.length, 1.6, linear),
    sequence(0.5, ...wallDots.map(dotRef => dotRef().opacity(1, 0.2))),
    countWallLabel().opacity(1, 0.3),
    countWall(wallDots.length, 0.8, linear),
  );
  yield* waitFor(0.6);

  // 2. Correspondances : les mêmes points retrouvés d'une vue à l'autre
  yield* waitUntil('correspondances');
  yield* all(
    imageWall().opacity(0, 0.5),
    countWallLabel().opacity(0, 0.5),
    countALabel().opacity(0, 0.5),
  );
  yield* imageB().opacity(1, 0.5);
  yield* sequence(0.03, ...dotsB.map(dotRef => dotRef().opacity(1, 0.15)));
  sfxFill(0, 1, 2.4, {steps: 12, volume: 0.8});
  yield* all(
    sequence(0.045, ...matchLines.map(lineRef => lineRef().end(1, 0.5))),
    countMatchesLabel().opacity(1, 0.4),
    countMatches(412, 2.4, linear),
  );
  yield* waitFor(0.6);

  // 3. Graphe : images = nœuds, correspondances = arêtes, un seul bloc
  yield* waitUntil('graphe');
  const thumbScale = THUMB_WIDTH() / IMAGE_WIDTH();
  sfx('travel', 0.5);
  yield* all(
    ...matchLines.map(lineRef => lineRef().opacity(0, 0.4)),
    countMatchesLabel().opacity(0, 0.4),
    imageA().position(nodePosition(NODE_FROM_IMAGE_A), 1.2, easeInOutCubic),
    imageA().scale(thumbScale, 1.2, easeInOutCubic),
    imageB().position(nodePosition(NODE_FROM_IMAGE_B), 1.2, easeInOutCubic),
    imageB().scale(thumbScale, 1.2, easeInOutCubic),
  );
  yield* all(
    nodeRefs[NODE_FROM_IMAGE_A]().opacity(1, 0.3),
    nodeRefs[NODE_FROM_IMAGE_B]().opacity(1, 0.3),
    imageA().opacity(0, 0.3),
    imageB().opacity(0, 0.3),
  );
  yield* sequence(
    0.06,
    ...nodeIndices
      .filter(nodeIndex => nodeIndex !== NODE_FROM_IMAGE_A && nodeIndex !== NODE_FROM_IMAGE_B)
      .map(nodeIndex => nodeRefs[nodeIndex]().opacity(1, 0.3)),
  );
  edgeRefs.forEach(edgeRef => edgeRef().opacity(1));
  sfx('draw', 0.6);
  yield* sequence(0.05, ...edgeRefs.map(edgeRef => edgeRef().end(1, 0.45)));
  sfx('success', 0.7);
  yield* all(
    ...nodeFrames.map(frameRef => frameRef().stroke(PALETTE.vert, 0.5)),
    hullRef().opacity(1, 0.6),
  );
  roomArrow().opacity(1);
  sfx('emphasis', 0.6);
  yield* all(
    roomArrow().end(1, 0.4),
    roomIcon().opacity(1, 0.4),
    roomIcon().scale(1.25, 0.25).to(1, 0.25),
  );
  yield* waitFor(0.8);

  // 4. Piste de danse : peu de points, le graphe se fragmente en îlots
  yield* waitUntil('piste-de-danse');
  yield* all(
    hullRef().opacity(0, 0.5),
    roomIcon().opacity(0, 0.5),
    roomArrow().opacity(0, 0.5),
    ...dimOverlays.map(overlayRef => overlayRef().opacity(0.85, 0.8)),
    ...nodeFrames.map(frameRef => frameRef().stroke(PALETTE.ghost, 0.8)),
  );
  // Les arêtes entre îlots disparaissent, celles qui restent virent au rose
  sfx('swap', 0.6);
  yield* all(
    ...edgePairs.map(([nodeA, nodeB], edgeIndex) => (
      islandOf(nodeA) === islandOf(nodeB)
        ? edgeRefs[edgeIndex]().stroke(PALETTE.rose, 0.6)
        : all(
            edgeRefs[edgeIndex]().end(0, 0.6),
            edgeRefs[edgeIndex]().opacity(0, 0.6),
          )
    )),
  );
  sfx('travel', 0.5);
  yield* all(
    ...nodeIndices.map(nodeIndex => {
      const [offsetX, offsetY] = ISLAND_OFFSETS[islandOf(nodeIndex)];
      return nodeRefs[nodeIndex]().position(
        [vW() * (nodeBase[nodeIndex][0] + offsetX), vH() * (nodeBase[nodeIndex][1] + offsetY)],
        1.4, easeInOutCubic,
      );
    }),
    ...nodeFrames.map(frameRef => frameRef().stroke(PALETTE.rose, 1.4)),
  );
  // Deux tentatives de recollage : le lien part, rebondit, retombe
  for (const attemptRef of attemptLines) {
    attemptRef().opacity(1);
    sfx('draw', 0.5);
    yield* attemptRef().end(0.55, 0.6, easeOutCubic);
    yield* all(
      attemptRef().end(0, 0.35),
      attemptRef().opacity(0, 0.35),
    );
  }
  // L'indicateur de convergence monte… puis s'effondre
  yield* gaugeOuter().opacity(1, 0.4);
  sfxFill(0, 0.78, 1.6, {ease: easeInOutCubic, steps: 8});
  yield* gaugeProgress(0.78, 1.6, easeInOutCubic);
  sfx('warning', 0.8);
  yield* all(
    gaugeInner().fill(PALETTE.rose, 0.2),
    gaugeProgress(0.18, 0.5),
    failIcon().opacity(1, 0.3),
  );
  yield* waitFor(1.2);

  yield* all(
    gridRef().opacity(0, 0.6),
    ...nodeRefs.map(nodeRef => nodeRef().opacity(0, 0.6)),
    ...edgeRefs.map(edgeRef => edgeRef().opacity(0, 0.6)),
    gaugeOuter().opacity(0, 0.6),
    failIcon().opacity(0, 0.6),
  );
  sfxFlush('colmap-points-ilots');
});
