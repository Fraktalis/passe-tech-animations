/**
 * deux-options-3d — Deux façons de numériser la salle (JUMEAU, ch. 4).
 *
 * Une salle (serre), deux façons de la numériser :
 *   - gauche : télémètre laser + Blender — mesure d'un mur, puis les difficultés
 *     s'empilent (coin arrondi, sol en pierre, portes/fenêtres, toit à barres
 *     qui se multiplient) pendant que le chronomètre file ;
 *   - droite : téléphone → boîte « magique » → nuage 3D, badge « 2023 ».
 * La branche droite n'apparaît qu'une fois la première option terminée ; elle
 * s'allume alors et la gauche s'estompe.
 *
 * Couleur active : cyan. Le reste en secondary / ghost.
 *
 * Battements : fork · option-laser · option-splats · choix
 */
import {makeScene2D, Grid, Layout, Rect, Txt, Line, Circle} from '@motion-canvas/2d';
import {
  createRef,
  all,
  sequence,
  waitUntil,
  easeInOutCubic,
  easeOutCubic,
  linear,
  useRandom,
} from '@motion-canvas/core';
import {DiagramNode, ConnectionArrow} from '../../components';
import {PALETTE} from '../../theme';

const MONO = 'JetBrains Mono, DM Mono, monospace';

/** Projection orthographique d'un point 3D (rotation yaw puis pitch). */
function projectPoint(x: number, y: number, z: number): {screenX: number; screenY: number; depth: number} {
  const yaw = 0.7;
  const pitch = 0.45;
  const rotatedX = x * Math.cos(yaw) + z * Math.sin(yaw);
  const rotatedZ = -x * Math.sin(yaw) + z * Math.cos(yaw);
  const screenY = y * Math.cos(pitch) - rotatedZ * Math.sin(pitch);
  const depth = y * Math.sin(pitch) + rotatedZ * Math.cos(pitch);
  return {screenX: rotatedX, screenY, depth};
}

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  view.fill(PALETTE.bg);

  // ── Géométrie commune ──────────────────────────────────────────────────────
  const branchOffsetX = 0.25; // centre de chaque branche, en fraction de vW
  const headY = () => vH() * -0.12;
  const headWidth = () => vW() * 0.2;
  const headHeight = () => vH() * 0.16;
  const contentCenterY = 0.21; // en fraction de vH
  const clockRadius = () => vW() * 0.024;

  // ── Données déterministes ──────────────────────────────────────────────────
  const random = useRandom(2023, true);

  // Nuage 3D : coin de pièce (sol + deux murs)
  const cloudPoints = Array.from({length: 80}, () => {
    const faceChoice = random.nextInt(0, 3);
    const u = random.nextFloat(-1, 1);
    const v = random.nextFloat(-1, 1);
    const [x, y, z] = faceChoice === 0 ? [u, 1, v] : faceChoice === 1 ? [-1, u, v] : [u, v, -1];
    return projectPoint(x, y, z);
  });

  // Sol en pierre : 9 dalles irrégulières
  const stoneTiles = Array.from({length: 9}, (_, tileIndex) => ({
    column: tileIndex % 3,
    row: Math.floor(tileIndex / 3),
    scaleX: random.nextFloat(0.65, 1),
    scaleY: random.nextFloat(0.65, 1),
  }));

  // Toit : 12 barres, 3 visibles d'emblée
  const roofBarIndices = Array.from({length: 12}, (_, barIndex) => barIndex);
  const initialRoofBars = [2, 6, 10];

  // ── Refs ───────────────────────────────────────────────────────────────────
  const gridRef = createRef<Grid>();
  const leftBranch = createRef<Layout>();
  const rightBranch = createRef<Layout>();
  const originNode = createRef<DiagramNode>();
  const leftEdge = createRef<ConnectionArrow>();
  const rightEdge = createRef<ConnectionArrow>();
  const leftHead = createRef<DiagramNode>();
  const rightHead = createRef<DiagramNode>();

  const leftClockFace = createRef<Circle>();
  const leftClockHand = createRef<Rect>();
  const rightClockFace = createRef<Circle>();
  const rightClockHand = createRef<Rect>();

  const laserDemo = createRef<Layout>();
  const laserDevice = createRef<Rect>();
  const laserWall = createRef<Rect>();
  const laserBeam = createRef<Line>();
  const laserImpact = createRef<Circle>();
  const dimensionLine = createRef<Line>();
  const dimensionLabel = createRef<Txt>();

  const vignetteRefs = [0, 1, 2, 3].map(() => createRef<Rect>());
  const roofBarRefs = roofBarIndices.map(() => createRef<Line>());

  const phoneNode = createRef<DiagramNode>();
  const magicNode = createRef<DiagramNode>();
  const phoneToMagicArrow = createRef<ConnectionArrow>();
  const magicToCloudArrow = createRef<ConnectionArrow>();
  const cloudGroup = createRef<Layout>();
  const cloudDotRefs = cloudPoints.map(() => createRef<Circle>());
  const yearBadge = createRef<Rect>();

  // ── Positions des vignettes (branche gauche) ───────────────────────────────
  const vignettePosition = (vignetteIndex: number): [number, number] => [
    vW() * (-branchOffsetX + (vignetteIndex % 2 === 0 ? -0.082 : 0.082)),
    vH() * (vignetteIndex < 2 ? 0.09 : 0.31),
  ];

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

    {/* ── Branche gauche : télémètre + Blender ── */}
    <Layout key="left-branch" ref={leftBranch}>
      <ConnectionArrow key="left-edge" ref={leftEdge}
        from={() => [vW() * -0.02, vH() * -0.28]}
        to={() => [vW() * -branchOffsetX, headY() - headHeight() / 2]}
        routingAxis={'vertical'}
        stroke={PALETTE.secondary}
        end={0}
        opacity={0}
      />
      <DiagramNode key="left-head" ref={leftHead}
        iconName="mdi:ruler"
        label="Télémètre + Blender"
        color={PALETTE.cyan}
        initialState="idle"
        width={headWidth} height={headHeight}
        x={() => vW() * -branchOffsetX} y={headY}
        opacity={0}
      />

      {/* Chronomètre qui file */}
      <Circle key="left-clock-face" ref={leftClockFace}
        size={() => clockRadius() * 2}
        stroke={PALETTE.cyan}
        lineWidth={3}
        x={() => vW() * -0.41} y={headY}
        opacity={0}
      >
        <Rect key="left-clock-hand" ref={leftClockHand}
          width={() => vW() * 0.0015}
          height={() => clockRadius() * 0.8}
          offset={[0, 1]}
          fill={PALETTE.cyan}
          radius={() => vW() * 0.001}
        />
      </Circle>

      {/* Mesure d'un mur au laser */}
      <Layout key="laser-demo" ref={laserDemo}>
        <Rect key="laser-device" ref={laserDevice}
          width={() => vW() * 0.03} height={() => vW() * 0.018}
          stroke={PALETTE.cyan} lineWidth={3}
          radius={() => vW() * 0.003}
          x={() => vW() * -0.4} y={() => vH() * contentCenterY}
          opacity={0}
        />
        <Rect key="laser-wall" ref={laserWall}
          width={() => vW() * 0.012} height={() => vH() * 0.22}
          fill={PALETTE.secondary + '88'}
          x={() => vW() * -0.1} y={() => vH() * contentCenterY}
          opacity={0}
        />
        <Line key="laser-beam" ref={laserBeam}
          points={() => [
            [vW() * -0.384, vH() * contentCenterY],
            [vW() * -0.106, vH() * contentCenterY],
          ]}
          stroke={PALETTE.cyan}
          lineWidth={3}
          end={0}
          opacity={0}
        />
        <Circle key="laser-impact" ref={laserImpact}
          size={() => vW() * 0.012}
          fill={PALETTE.cyan}
          x={() => vW() * -0.106} y={() => vH() * contentCenterY}
          opacity={0}
        />
        <Line key="dimension-line" ref={dimensionLine}
          points={() => [
            [vW() * -0.4, vH() * 0.34],
            [vW() * -0.1, vH() * 0.34],
          ]}
          stroke={PALETTE.cream}
          lineWidth={2}
          startArrow
          endArrow
          arrowSize={8}
          end={0}
          opacity={0}
        />
        <Txt key="dimension-label" ref={dimensionLabel}
          text="4,52 m"
          fill={PALETTE.cream}
          fontSize={() => vW() * 0.016}
          fontFamily={MONO}
          fontWeight={700}
          x={() => vW() * -0.25} y={() => vH() * 0.395}
          opacity={0}
        />
      </Layout>

      {/* Vignette 1 : coin arrondi */}
      <Rect key="vignette-rounded-corner" ref={vignetteRefs[0]}
        width={() => vW() * 0.14} height={() => vH() * 0.19}
        fill={PALETTE.nodeBg}
        stroke={PALETTE.secondary}
        lineWidth={2}
        radius={() => vW() * 0.004}
        x={() => vignettePosition(0)[0]} y={() => vignettePosition(0)[1]}
        opacity={0}
      >
        <Rect key="rounded-corner-shape"
          width={() => vW() * 0.07} height={() => vH() * 0.11}
          stroke={PALETTE.cyan}
          lineWidth={3}
          radius={() => [0, 0, vW() * 0.04, 0]}
        />
      </Rect>

      {/* Vignette 2 : sol en pierre */}
      <Rect key="vignette-stone-floor" ref={vignetteRefs[1]}
        width={() => vW() * 0.14} height={() => vH() * 0.19}
        fill={PALETTE.nodeBg}
        stroke={PALETTE.secondary}
        lineWidth={2}
        radius={() => vW() * 0.004}
        x={() => vignettePosition(1)[0]} y={() => vignettePosition(1)[1]}
        opacity={0}
      >
        {stoneTiles.map((tile, tileIndex) => (
          <Rect key={`stone-tile-${tileIndex}`}
            width={() => vW() * 0.022 * tile.scaleX}
            height={() => vW() * 0.022 * tile.scaleY}
            x={() => (tile.column - 1) * vW() * 0.027}
            y={() => (tile.row - 1) * vW() * 0.027}
            fill={PALETTE.secondary + '44'}
            stroke={PALETTE.secondary}
            lineWidth={2}
            radius={() => vW() * 0.002}
          />
        ))}
      </Rect>

      {/* Vignette 3 : portes et fenêtres */}
      <Rect key="vignette-doors-windows" ref={vignetteRefs[2]}
        width={() => vW() * 0.14} height={() => vH() * 0.19}
        fill={PALETTE.nodeBg}
        stroke={PALETTE.secondary}
        lineWidth={2}
        radius={() => vW() * 0.004}
        x={() => vignettePosition(2)[0]} y={() => vignettePosition(2)[1]}
        opacity={0}
      >
        <Rect key="door-shape"
          width={() => vW() * 0.03} height={() => vW() * 0.06}
          x={() => vW() * -0.03}
          stroke={PALETTE.cyan}
          lineWidth={3}
        />
        <Rect key="window-shape"
          width={() => vW() * 0.036} height={() => vW() * 0.036}
          x={() => vW() * 0.03} y={() => vW() * -0.006}
          stroke={PALETTE.cyan}
          lineWidth={3}
        />
        <Line key="window-cross-vertical"
          points={() => [[vW() * 0.03, vW() * -0.024], [vW() * 0.03, vW() * 0.012]]}
          stroke={PALETTE.cyan}
          lineWidth={2}
        />
        <Line key="window-cross-horizontal"
          points={() => [[vW() * 0.012, vW() * -0.006], [vW() * 0.048, vW() * -0.006]]}
          stroke={PALETTE.cyan}
          lineWidth={2}
        />
      </Rect>

      {/* Vignette 4 : toit à barres parallèles */}
      <Rect key="vignette-roof-bars" ref={vignetteRefs[3]}
        width={() => vW() * 0.14} height={() => vH() * 0.19}
        fill={PALETTE.nodeBg}
        stroke={PALETTE.secondary}
        lineWidth={2}
        radius={() => vW() * 0.004}
        x={() => vignettePosition(3)[0]} y={() => vignettePosition(3)[1]}
        opacity={0}
      >
        <Rect key="roof-frame"
          width={() => vW() * 0.11} height={() => vH() * 0.12}
          stroke={PALETTE.cyan}
          lineWidth={3}
        />
        {roofBarIndices.map(barIndex => (
          <Line key={`roof-bar-${barIndex}`} ref={roofBarRefs[barIndex]}
            points={() => {
              const barX = (barIndex - 5.5) * vW() * 0.0085;
              return [[barX, vH() * -0.06], [barX, vH() * 0.06]];
            }}
            stroke={PALETTE.cyan}
            lineWidth={2}
            opacity={initialRoofBars.includes(barIndex) ? 1 : 0}
          />
        ))}
      </Rect>
    </Layout>

    {/* ── Branche droite : Gaussian Splats ── */}
    <Layout key="right-branch" ref={rightBranch}>
      <ConnectionArrow key="right-edge" ref={rightEdge}
        from={() => [vW() * 0.02, vH() * -0.28]}
        to={() => [vW() * branchOffsetX, headY() - headHeight() / 2]}
        routingAxis={'vertical'}
        stroke={PALETTE.secondary}
        end={0}
        opacity={0}
      />
      <DiagramNode key="right-head" ref={rightHead}
        iconName="mdi:cube-scan"
        label="Gaussian Splats"
        color={PALETTE.cyan}
        initialState="idle"
        width={headWidth} height={headHeight}
        x={() => vW() * branchOffsetX} y={headY}
        opacity={0}
      />

      <Circle key="right-clock-face" ref={rightClockFace}
        size={() => clockRadius() * 2}
        stroke={PALETTE.cyan}
        lineWidth={3}
        x={() => vW() * 0.41} y={headY}
        opacity={0}
      >
        <Rect key="right-clock-hand" ref={rightClockHand}
          width={() => vW() * 0.0015}
          height={() => clockRadius() * 0.8}
          offset={[0, 1]}
          fill={PALETTE.cyan}
          radius={() => vW() * 0.001}
        />
      </Circle>

      <DiagramNode key="phone-node" ref={phoneNode}
        iconName="mdi:cellphone"
        label="Téléphone"
        color={PALETTE.cyan}
        initialState="idle"
        width={() => vW() * 0.09} height={() => vH() * 0.2}
        x={() => vW() * 0.085} y={() => vH() * contentCenterY}
        opacity={0}
      />
      <ConnectionArrow key="phone-to-magic-arrow" ref={phoneToMagicArrow}
        from={() => [vW() * 0.135, vH() * contentCenterY]}
        to={() => [vW() * 0.185, vH() * contentCenterY]}
        routing={0}
        stroke={PALETTE.cyan}
        end={0}
        opacity={0}
      />
      <DiagramNode key="magic-node" ref={magicNode}
        iconName="mdi:auto-fix"
        label="?"
        color={PALETTE.cyan}
        initialState="idle"
        width={() => vW() * 0.09} height={() => vH() * 0.2}
        x={() => vW() * 0.235} y={() => vH() * contentCenterY}
        opacity={0}
      />
      <ConnectionArrow key="magic-to-cloud-arrow" ref={magicToCloudArrow}
        from={() => [vW() * 0.285, vH() * contentCenterY]}
        to={() => [vW() * 0.335, vH() * contentCenterY]}
        routing={0}
        stroke={PALETTE.cyan}
        end={0}
        opacity={0}
      />

      {/* Nuage de points 3D */}
      <Layout key="cloud-group" ref={cloudGroup}
        x={() => vW() * 0.395} y={() => vH() * contentCenterY}
      >
        {cloudPoints.map((point, pointIndex) => (
          <Circle key={`cloud-dot-${pointIndex}`} ref={cloudDotRefs[pointIndex]}
            size={() => vW() * (0.0035 + 0.0015 * point.depth)}
            fill={PALETTE.cyan}
            x={() => point.screenX * vW() * 0.03}
            y={() => point.screenY * vW() * 0.03}
            opacity={0}
          />
        ))}
      </Layout>

      <Rect key="year-badge" ref={yearBadge}
        width={() => vW() * 0.065} height={() => vH() * 0.055}
        stroke={PALETTE.cyan}
        fill={PALETTE.cyan + '22'}
        lineWidth={2}
        radius={() => vW() * 0.01}
        x={() => vW() * 0.395} y={() => vH() * 0.4}
        opacity={0}
      >
        <Txt key="year-badge-label"
          text="2023"
          fill={PALETTE.cyan}
          fontSize={() => vW() * 0.016}
          fontFamily={MONO}
          fontWeight={700}
        />
      </Rect>
    </Layout>

    {/* ── Origine : la salle ── */}
    <DiagramNode key="origin-node" ref={originNode}
      iconName="mdi:greenhouse"
      label="SALLE"
      color={PALETTE.cyan}
      initialState="active"
      width={() => vW() * 0.11} height={() => vH() * 0.18}
      x={0} y={() => vH() * -0.37}
      opacity={0}
    />
  </>);

  // ── ANIMATION ──────────────────────────────────────────────────────────────

  // 1. Deux branches partent de la salle
  yield* waitUntil('fork');
  yield* gridRef().opacity(0.07, 0.8);
  yield* originNode().opacity(1, 0.6);
  leftEdge().opacity(1);
  yield* leftEdge().end(1, 0.6, easeInOutCubic);
  yield* leftHead().opacity(1, 0.5);
  yield* leftClockFace().opacity(1, 0.4);

  // 2. Branche gauche : le laser mesure un mur, puis les difficultés s'empilent
  yield* waitUntil('option-laser');
  yield* all(laserDevice().opacity(1, 0.3), laserWall().opacity(1, 0.3));
  laserBeam().opacity(1);
  yield* laserBeam().end(1, 0.5, easeOutCubic);
  yield* laserImpact().opacity(1, 0.15);
  dimensionLine().opacity(1);
  yield* all(
    dimensionLine().end(1, 0.5, easeInOutCubic),
    dimensionLabel().opacity(1, 0.5),
  );
  yield* laserDemo().opacity(0, 0.5);

  // Le chronomètre file pendant que les vignettes s'empilent
  const leftClockSpin = leftClockHand().rotation(360 * 8, 6, linear);
  yield* all(
    leftClockSpin,
    (function* () {
      yield* sequence(0.35, ...vignetteRefs.map(vignette => vignette().opacity(1, 0.4)));
      yield* sequence(0.1, ...roofBarRefs
        .filter((_, barIndex) => !initialRoofBars.includes(barIndex))
        .map(roofBar => roofBar().opacity(1, 0.2)));
    })(),
  );

  // 3. Branche droite : téléphone → boîte magique → nuage 3D
  yield* waitUntil('option-splats');
  rightEdge().opacity(1);
  yield* rightEdge().end(1, 0.6, easeInOutCubic);
  yield* rightHead().opacity(1, 0.5);
  yield* rightClockFace().opacity(1, 0.4);
  yield* all(
    rightClockHand().rotation(36, 3, easeInOutCubic),
    (function* () {
      yield* phoneNode().opacity(1, 0.4);
      phoneToMagicArrow().opacity(1);
      yield* phoneToMagicArrow().end(1, 0.4, easeInOutCubic);
      yield* all(
        magicNode().opacity(1, 0.4),
        magicNode().setState('active', 0.4),
      );
      magicToCloudArrow().opacity(1);
      yield* magicToCloudArrow().end(1, 0.4, easeInOutCubic);
      yield* sequence(0.012, ...cloudDotRefs.map(dot => dot().opacity(0.9, 0.25)));
      yield* yearBadge().opacity(1, 0.4);
    })(),
  );

  // 4. Le choix : la droite s'allume, la gauche s'estompe
  yield* waitUntil('choix');
  yield* all(
    rightHead().setState('highlighted', 0.5),
    rightEdge().stroke(PALETTE.cyan, 0.5),
    leftBranch().opacity(0.15, 0.8),
  );
});
