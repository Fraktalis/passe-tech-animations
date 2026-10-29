/**
 * parallaxe — Pourquoi deux vues suffisent à mesurer la profondeur (Ch. 4, JUMEAU).
 *
 * Vue par la vitre d'une voiture : la barrière défile très vite, les arbres plus
 * lentement, la lune reste immobile. Le décalage dépend de la distance. Vue de
 * dessus : un même point vu depuis deux positions donne deux rayons ; ils se
 * croisent, le point est fixé dans l'espace. Contre-exemple : deux vues au même
 * endroit, les rayons sont confondus, le point reste flou.
 *
 * Défilement = boucle (modulo sur la position), pilotée par un seul signal `scroll`.
 * Couleur active : jaune. Rose uniquement pour le contre-exemple.
 *
 * Battements : autoroute · mesure · deux-vues · immobile
 */
import {makeScene2D, Grid, Layout, Rect, Circle, Line, Icon} from '@motion-canvas/2d';
import {
  createRef,
  createSignal,
  all,
  sequence,
  waitUntil,
  waitFor,
  easeInOutCubic,
  easeInQuad,
  easeOutQuad,
  easeOutCubic,
  linear,
  loop,
  cancel,
  useRandom,
} from '@motion-canvas/core';
import {ConnectionArrow, Callout} from '../../components';
import {PALETTE} from '../../theme';
import {sfx, sfxReset, sfxFlush} from '../../sfx';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  view.fill(PALETTE.bg);

  // ── Vue par la vitre : trois plans qui défilent en boucle ──────────────────
  const BARRIER_COUNT = 8;
  const BARRIER_SPACING = 0.12;   // fraction de vW entre deux poteaux
  const BARRIER_SPEED = 1;        // plan proche : suit tout le défilement
  const TREE_COUNT = 5;
  const TREE_SPACING = 0.2;
  const TREE_SPEED = 0.25;        // plan moyen : quatre fois plus lent
  const MOON_X = 0.18;            // fond : vitesse nulle
  const MOON_Y = -0.16;

  const scroll = createSignal(0); // unités : fraction de vW parcourue au plan proche

  /** Ramène une position dans [-total/2, total/2) : c'est elle qui fait la boucle. */
  const wrapPosition = (value: number, total: number) =>
    ((value % total) + total) % total - total / 2;
  const layerPosition = (
    itemIndex: number, count: number, spacing: number, speed: number, scrollValue: number,
  ) => wrapPosition(itemIndex * spacing - scrollValue * speed, count * spacing);

  const random = useRandom(42);
  const treeScales = Array.from({length: TREE_COUNT}, () => random.nextFloat(0.8, 1.25));

  const barrierIndices = Array.from({length: BARRIER_COUNT}, (_, i) => i);
  const treeIndices = Array.from({length: TREE_COUNT}, (_, i) => i);

  // Rangées de mesure (y local à la fenêtre, fraction de vH)
  const BARRIER_ROW = 0.21;
  const TREE_ROW = -0.005;

  // Plan mesuré : mémorise où commence le glissement
  const measureStart = createSignal(0);
  const trackedBarrierX = createSignal(0);
  const trackedTreeX = createSignal(0);

  // ── Vue de dessus : caméras, point, rayons ─────────────────────────────────
  const CAMERA_Y = 0.3;
  const CAMERA_A_X = -0.14;
  const cameraBX = createSignal(CAMERA_A_X);
  const RAY_STRETCH = 1.18;       // le rayon dépasse un peu le point
  const POINTS: [number, number][] = [
    [0.05, -0.35],                 // point principal (mur du fond)
    [-0.26, -0.35], [-0.14, -0.35], [0.2, -0.35], [0.28, -0.35],
    [0.31, -0.27], [0.31, -0.17],
    [-0.31, -0.27], [-0.31, -0.17],
    [-0.02, -0.2],                 // pilier
  ];
  const pointIndices = POINTS.map((_, i) => i);

  const cameraAPosition = (): [number, number] => [vW() * CAMERA_A_X, vH() * CAMERA_Y];
  const cameraBPosition = (): [number, number] => [vW() * cameraBX(), vH() * CAMERA_Y];
  const pointPosition = (pointIndex: number): [number, number] =>
    [vW() * POINTS[pointIndex][0], vH() * POINTS[pointIndex][1]];
  const alongRay = (
    origin: [number, number], target: [number, number], stretch: number,
  ): [number, number] => [
    origin[0] + (target[0] - origin[0]) * stretch,
    origin[1] + (target[1] - origin[1]) * stretch,
  ];
  const frustumPoints = (cameraPosition: () => [number, number]) => (): [number, number][] => {
    const [cx, cy] = cameraPosition();
    const halfWidth = vW() * 0.05;
    const depth = vH() * 0.12;
    return [[cx, cy], [cx - halfWidth, cy - depth], [cx + halfWidth, cy - depth]];
  };

  const ambiguityT = createSignal(0.6);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const gridRef = createRef<Grid>();
  const windowGroup = createRef<Layout>();
  const barrierRing = createRef<Circle>();
  const treeRing = createRef<Circle>();
  const moonRing = createRef<Circle>();
  const barrierArrow = createRef<ConnectionArrow>();
  const treeArrow = createRef<ConnectionArrow>();
  const parallaxCallout = createRef<Callout>();
  const calloutArrow = createRef<ConnectionArrow>();

  const topdownGroup = createRef<Layout>();
  const roomOutline = createRef<Rect>();
  const phoneA = createRef<Icon>();
  const phoneB = createRef<Icon>();
  const walkPath = createRef<Line>();
  const frustumA = createRef<Line>();
  const frustumB = createRef<Line>();
  const raysA = pointIndices.map(() => createRef<Line>());
  const raysB = pointIndices.map(() => createRef<Line>());
  const pointDots = pointIndices.map(() => createRef<Circle>());
  const ambiguityDot = createRef<Circle>();
  const crossRing = createRef<Circle>();
  const smear = createRef<Line>();

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

    {/* ── Vitre de voiture ─────────────────────────────────────────────── */}
    <Layout key="window-group" ref={windowGroup} y={() => -vH() * 0.03} opacity={0}>
      <Rect key="window-glass"
        width={() => vW() * 0.7}
        height={() => vH() * 0.52}
        fill={'#0A0F18'}
        radius={() => vW() * 0.012}
        clip
      >
        <Circle key="moon"
          x={() => vW() * MOON_X} y={() => vH() * MOON_Y}
          size={() => vW() * 0.07}
          fill={PALETTE.cream}
          shadowColor={PALETTE.cream}
          shadowBlur={() => vW() * 0.03}
        />
        <Rect key="ground"
          y={() => vH() * 0.165}
          width={() => vW() * 0.7}
          height={() => vH() * 0.19}
          fill={'#10161E'}
        />
        {treeIndices.map(treeIndex => (
          <Layout key={`tree-${treeIndex}`}
            x={() => vW() * layerPosition(treeIndex, TREE_COUNT, TREE_SPACING, TREE_SPEED, scroll())}
            y={() => vH() * 0.045}
          >
            <Rect key={`tree-trunk-${treeIndex}`}
              width={() => vW() * 0.008}
              height={() => vH() * 0.06 * treeScales[treeIndex]}
              fill={'#1B222B'}
            />
            <Circle key={`tree-canopy-${treeIndex}`}
              y={() => -vH() * 0.05 * treeScales[treeIndex]}
              size={() => vW() * 0.06 * treeScales[treeIndex]}
              fill={'#18202A'}
              stroke={PALETTE.ghost}
              lineWidth={1}
            />
          </Layout>
        ))}
        <Rect key="barrier-rail-top"
          y={() => vH() * 0.13}
          width={() => vW() * 0.7} height={() => vH() * 0.012}
          fill={'#2A313A'}
        />
        <Rect key="barrier-rail-bottom"
          y={() => vH() * 0.18}
          width={() => vW() * 0.7} height={() => vH() * 0.012}
          fill={'#2A313A'}
        />
        {barrierIndices.map(postIndex => (
          <Rect key={`barrier-post-${postIndex}`}
            x={() => vW() * layerPosition(postIndex, BARRIER_COUNT, BARRIER_SPACING, BARRIER_SPEED, scroll())}
            y={() => vH() * 0.18}
            width={() => vW() * 0.014}
            height={() => vH() * 0.16}
            fill={'#2F3742'}
            stroke={PALETTE.secondary}
            lineWidth={1}
          />
        ))}
      </Rect>
      <Rect key="window-frame"
        width={() => vW() * 0.7}
        height={() => vH() * 0.52}
        fill={'#00000000'}
        stroke={PALETTE.ghost}
        lineWidth={3}
        radius={() => vW() * 0.012}
      />

      {/* Mesure du glissement — une flèche par plan */}
      <Circle key="barrier-ring" ref={barrierRing}
        x={() => vW() * trackedBarrierX()} y={() => vH() * BARRIER_ROW}
        size={() => vW() * 0.022}
        fill={'#00000000'} stroke={PALETTE.jaune} lineWidth={3}
        opacity={0}
      />
      <Circle key="tree-ring" ref={treeRing}
        x={() => vW() * trackedTreeX()} y={() => vH() * TREE_ROW}
        size={() => vW() * 0.022}
        fill={'#00000000'} stroke={PALETTE.jaune} lineWidth={3}
        opacity={0}
      />
      <Circle key="moon-ring" ref={moonRing}
        x={() => vW() * MOON_X} y={() => vH() * MOON_Y}
        size={() => vW() * 0.09}
        fill={'#00000000'} stroke={PALETTE.jaune} lineWidth={3}
        opacity={0}
      />
      <ConnectionArrow key="barrier-arrow" ref={barrierArrow}
        from={() => [vW() * trackedBarrierX(), vH() * BARRIER_ROW]}
        to={() => [
          vW() * (trackedBarrierX() - Math.max((scroll() - measureStart()) * BARRIER_SPEED, 0.01)),
          vH() * BARRIER_ROW,
        ]}
        stroke={PALETTE.jaune}
        lineWidth={3}
        routing={0}
        opacity={0}
      />
      <ConnectionArrow key="tree-arrow" ref={treeArrow}
        from={() => [vW() * trackedTreeX(), vH() * TREE_ROW]}
        to={() => [
          vW() * (trackedTreeX() - Math.max((scroll() - measureStart()) * TREE_SPEED, 0.01)),
          vH() * TREE_ROW,
        ]}
        stroke={PALETTE.jaune}
        lineWidth={3}
        routing={0}
        opacity={0}
      />
    </Layout>

    <Callout key="parallax-callout" ref={parallaxCallout}
      title="PARALLAXE"
      color={PALETTE.jaune}
      width={() => vW() * 0.17}
      height={() => vH() * 0.085}
      x={0} y={() => -vH() * 0.4}
      opacity={0}
    />
    <ConnectionArrow key="callout-arrow" ref={calloutArrow}
      from={() => [0, -vH() * 0.355]}
      to={() => [0, -vH() * 0.305]}
      stroke={PALETTE.jaune}
      lineWidth={1}
      routing={0}
      opacity={0}
    />

    {/* ── Vue de dessus ─────────────────────────────────────────────────── */}
    <Layout key="topdown-group" ref={topdownGroup} opacity={0}>
      <Rect key="room-outline" ref={roomOutline}
        y={() => -vH() * 0.2}
        width={() => vW() * 0.64} height={() => vH() * 0.3}
        fill={'#00000000'}
        stroke={PALETTE.ghost}
        lineWidth={2}
        radius={() => vW() * 0.004}
      />

      <Line key="walk-path" ref={walkPath}
        points={() => [cameraAPosition(), cameraBPosition()]}
        stroke={PALETTE.secondary}
        lineWidth={2}
        lineDash={[8, 8]}
        opacity={0}
      />

      {/* Rayons : un par caméra et par point */}
      {pointIndices.map(pointIndex => (
        <Line key={`ray-a-${pointIndex}`} ref={raysA[pointIndex]}
          points={() => [
            cameraAPosition(),
            alongRay(cameraAPosition(), pointPosition(pointIndex), RAY_STRETCH),
          ]}
          stroke={PALETTE.jaune}
          lineWidth={pointIndex === 0 ? 3 : 1}
          end={0}
          opacity={0}
        />
      ))}
      {pointIndices.map(pointIndex => (
        <Line key={`ray-b-${pointIndex}`} ref={raysB[pointIndex]}
          points={() => [
            cameraBPosition(),
            alongRay(cameraBPosition(), pointPosition(pointIndex), RAY_STRETCH),
          ]}
          stroke={PALETTE.jaune}
          lineWidth={pointIndex === 0 ? 3 : 1}
          end={0}
          opacity={0}
        />
      ))}

      {/* Points de la salle : gris tant qu'ils ne sont vus que d'un côté */}
      {pointIndices.map(pointIndex => (
        <Circle key={`point-dot-${pointIndex}`} ref={pointDots[pointIndex]}
          x={() => pointPosition(pointIndex)[0]}
          y={() => pointPosition(pointIndex)[1]}
          size={() => vW() * (pointIndex === 0 ? 0.016 : 0.011)}
          fill={PALETTE.secondary}
          opacity={pointIndex === 0 ? 1 : 0}
        />
      ))}

      <Circle key="ambiguity-dot" ref={ambiguityDot}
        x={() => alongRay(cameraAPosition(), pointPosition(0), ambiguityT())[0]}
        y={() => alongRay(cameraAPosition(), pointPosition(0), ambiguityT())[1]}
        size={() => vW() * 0.012}
        fill={PALETTE.jaune}
        opacity={0}
      />
      <Circle key="cross-ring" ref={crossRing}
        x={() => pointPosition(0)[0]} y={() => pointPosition(0)[1]}
        size={() => vW() * 0.03}
        fill={'#00000000'} stroke={PALETTE.jaune} lineWidth={3}
        opacity={0}
      />
      <Line key="smear" ref={smear}
        points={() => [
          alongRay(cameraAPosition(), pointPosition(0), 0.62),
          alongRay(cameraAPosition(), pointPosition(0), 1.14),
        ]}
        stroke={PALETTE.rose}
        lineWidth={() => vW() * 0.008}
        lineCap={'round'}
        shadowColor={PALETTE.rose}
        shadowBlur={() => vW() * 0.02}
        opacity={0}
      />

      {/* Pyramides de pose */}
      <Line key="frustum-a" ref={frustumA}
        points={frustumPoints(cameraAPosition)}
        closed
        fill={PALETTE.jaune + '22'}
        stroke={PALETTE.jaune}
        lineWidth={2}
        opacity={0}
      />
      <Line key="frustum-b" ref={frustumB}
        points={frustumPoints(cameraBPosition)}
        closed
        fill={PALETTE.jaune + '22'}
        stroke={PALETTE.jaune}
        lineWidth={2}
        opacity={0}
      />

      {/* Téléphone qui marche */}
      <Icon key="phone-a" ref={phoneA}
        icon="mdi:cellphone"
        color={PALETTE.cream}
        size={() => vW() * 0.03}
        x={() => cameraAPosition()[0]} y={() => cameraAPosition()[1] + vH() * 0.045}
        opacity={0}
      />
      <Icon key="phone-b" ref={phoneB}
        icon="mdi:cellphone"
        color={PALETTE.cream}
        size={() => vW() * 0.03}
        x={() => cameraBPosition()[0]} y={() => cameraBPosition()[1] + vH() * 0.045}
        opacity={0}
      />
    </Layout>
  </>);

  // ── ANIMATION ──────────────────────────────────────────────────────────────

  // 1. Autoroute : trois plans, trois vitesses
  sfxReset();
  yield* waitUntil('autoroute');
  yield* all(
    gridRef().opacity(0.07, 1),
    windowGroup().opacity(1, 0.8),
  );
  // Départ en douceur (vitesse finale 0,3 / s), puis régime constant en boucle.
  sfx('travel', 0.4);
  yield* scroll(0.18, 1.2, easeInQuad);
  const drive = yield loop(Infinity, function* () {
    yield* scroll(scroll() + 0.3, 1, linear);
  });

  // 2. Mesure : on fige, une flèche par plan
  yield* waitUntil('mesure');
  yield* waitFor(2); // laisse la boucle tourner un instant
  cancel(drive);
  yield* scroll(scroll() + 0.18, 1.2, easeOutQuad);
  measureStart(scroll());

  // Repère chaque plan sur l'élément le plus proche du point de mesure
  const nearestTo = (target: number, count: number, spacing: number, speed: number) =>
    Array.from({length: count}, (_, i) => layerPosition(i, count, spacing, speed, measureStart()))
      .reduce((best, x) => (Math.abs(x - target) < Math.abs(best - target) ? x : best));
  trackedBarrierX(nearestTo(0.25, BARRIER_COUNT, BARRIER_SPACING, BARRIER_SPEED));
  trackedTreeX(nearestTo(0.25, TREE_COUNT, TREE_SPACING, TREE_SPEED));

  yield* all(
    barrierRing().opacity(1, 0.3),
    treeRing().opacity(1, 0.3),
    moonRing().opacity(1, 0.3),
  );
  barrierArrow().opacity(1);
  treeArrow().opacity(1);
  sfx('draw', 0.6);
  // Même glissement imposé aux trois plans : seule la distance change la longueur.
  yield* scroll(measureStart() + 0.3, 2, easeInOutCubic);
  yield* waitFor(0.4);
  sfx('emphasis', 0.6);
  yield* all(
    parallaxCallout().opacity(1, 0.3),
    calloutArrow().opacity(1, 0.3),
  );
  yield* parallaxCallout().hold();
  yield* all(
    parallaxCallout().opacity(0, 0.3),
    calloutArrow().opacity(0, 0.3),
  );

  // 3. Deux vues : le même point depuis deux positions
  yield* waitUntil('deux-vues');
  yield* all(
    windowGroup().opacity(0, 0.5),
    topdownGroup().opacity(1, 0.6),
  );
  yield* all(
    phoneA().opacity(1, 0.4),
    roomOutline().stroke(PALETTE.secondary, 0.4),
  );
  // Rayon A : le point peut être n'importe où le long du rayon
  raysA[0]().opacity(1);
  sfx('draw', 0.6);
  yield* raysA[0]().end(1, 0.9, easeInOutCubic);
  ambiguityDot().opacity(1);
  yield* ambiguityT(1.05, 0.7, easeInOutCubic);
  yield* ambiguityT(0.45, 0.9, easeInOutCubic);
  yield* ambiguityDot().opacity(0, 0.25);
  // Le téléphone marche vers la seconde position
  phoneB().opacity(1);
  yield* all(
    phoneA().opacity(0.4, 0.3),
    walkPath().opacity(1, 0.3),
  );
  sfx('travel', 0.5);
  yield* cameraBX(0.14, 1.6, easeInOutCubic);
  // Rayon B : les deux rayons se croisent sur le point
  raysB[0]().opacity(1);
  sfx('draw', 0.6);
  yield* raysB[0]().end(1, 0.9, easeInOutCubic);
  pointDots[0]().fill(PALETTE.jaune);
  crossRing().opacity(1);
  sfx('success', 0.8);
  yield* all(
    crossRing().scale(2.4, 0.7, easeOutCubic),
    crossRing().opacity(0, 0.7),
    pointDots[0]().scale(1.5, 0.35).to(1, 0.35),
  );
  yield* waitFor(0.4);
  // Même opération sur plusieurs points : le nuage apparaît
  pointIndices.slice(1).forEach((_, i) => sfx('tick', 0.6, 0.18 * i));
  yield* sequence(
    0.18,
    ...pointIndices.slice(1).map(pointIndex => all(
      pointDots[pointIndex]().opacity(1, 0.2),
      raysA[pointIndex]().opacity(0.35, 0.1),
      raysB[pointIndex]().opacity(0.35, 0.1),
      raysA[pointIndex]().end(1, 0.45),
      raysB[pointIndex]().end(1, 0.45),
      pointDots[pointIndex]().fill(PALETTE.jaune, 0.5),
    )),
  );
  // Les caméras se positionnent d'elles-mêmes : pyramides de pose
  sfx('activate');
  yield* all(
    frustumA().opacity(1, 0.6),
    frustumB().opacity(1, 0.6),
    phoneA().opacity(0, 0.4),
    phoneB().opacity(0, 0.4),
  );

  // 4. Immobile : deux vues au même endroit, aucun croisement
  yield* waitUntil('immobile');
  yield* all(
    ...pointIndices.slice(1).flatMap(pointIndex => [
      pointDots[pointIndex]().opacity(0, 0.5),
      raysA[pointIndex]().opacity(0, 0.5),
      raysB[pointIndex]().opacity(0, 0.5),
    ]),
    walkPath().opacity(0, 0.4),
  );
  sfx('travel', 0.5);
  yield* cameraBX(CAMERA_A_X, 1.8, easeInOutCubic);
  sfx('failure', 0.8);
  yield* all(
    raysA[0]().stroke(PALETTE.rose, 0.4),
    raysB[0]().stroke(PALETTE.rose, 0.4),
    frustumA().stroke(PALETTE.rose, 0.4),
    frustumB().stroke(PALETTE.rose, 0.4),
    frustumA().fill(PALETTE.rose + '22', 0.4),
    frustumB().fill(PALETTE.rose + '22', 0.4),
    pointDots[0]().fill(PALETTE.rose, 0.4),
  );
  // Le point se brouille le long du rayon
  yield* all(
    smear().opacity(0.85, 0.6),
    pointDots[0]().opacity(0.4, 0.6),
  );
  yield* waitFor(1.5);

  yield* all(
    topdownGroup().opacity(0, 0.6),
    gridRef().opacity(0, 0.6),
  );
  sfxFlush('parallaxe');
});
