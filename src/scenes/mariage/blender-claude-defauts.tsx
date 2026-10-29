/**
 * blender-claude-defauts — Les défauts d'un Blender piloté par Claude (Ch. 4, JUMEAU).
 *
 * Quatre défauts, montrés sans un mot : une copie parfaitement superposée qui
 * fait scintiller le rendu, un cadre de fenêtre posé au mauvais endroit du
 * nuage de points, un nettoyage de doublons à la main (heures → jours gagnés),
 * et des objets détaillés qui s'effondrent en parallélépipèdes gris.
 *
 * Couleur active : rose (défauts). Vert pour la correction manuelle.
 *
 * Battements : doublons · fenetres · nettoyage · low-poly
 */
import {makeScene2D, Grid, Layout, Rect, Circle, Line, Txt, Icon} from '@motion-canvas/2d';
import {
  createRef,
  Reference,
  all,
  sequence,
  waitUntil,
  waitFor,
  easeInOutCubic,
  easeOutBounce,
  easeOutCubic,
  useRandom,
} from '@motion-canvas/core';
import {DiagramNode, ConnectionArrow} from '../../components';
import {PALETTE} from '../../theme';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  view.fill(PALETTE.bg);

  const FONT_MONO = 'JetBrains Mono, DM Mono, monospace';

  // ── Viewport Blender ───────────────────────────────────────────────────────
  const VIEWPORT_X = 0.14;            // fraction de vW
  const VIEWPORT_WIDTH = () => vW() * 0.58;
  const VIEWPORT_HEIGHT = () => vH() * 0.62;

  // ── Table (vue de face) en « unités » proportionnelles à vW ────────────────
  const tableShapes = (
    prefix: string,
    unit: () => number,
    fill: string,
    stroke: string,
    topRef?: Reference<Rect>,
    dash: number[] = [],
  ) => (<>
    <Rect key={`${prefix}-leg-left`}
      x={() => -unit() * 9} y={() => unit() * 2.5}
      width={() => unit() * 1.2} height={() => unit() * 12}
      fill={fill} stroke={stroke} lineWidth={2} lineDash={dash}
    />
    <Rect key={`${prefix}-leg-right`}
      x={() => unit() * 9} y={() => unit() * 2.5}
      width={() => unit() * 1.2} height={() => unit() * 12}
      fill={fill} stroke={stroke} lineWidth={2} lineDash={dash}
    />
    <Rect key={`${prefix}-top`} ref={topRef}
      y={() => -unit() * 5}
      width={() => unit() * 22} height={() => unit() * 2.5}
      fill={fill} stroke={stroke} lineWidth={2} lineDash={dash}
    />
  </>);

  // Scène 1 : table + copie + scintillement
  const BIG_UNIT = () => vW() * 0.01;
  const STRIPE_COUNT = 16;
  const stripeIndices = Array.from({length: STRIPE_COUNT}, (_, i) => i);

  // Scène 2 : coupe du nuage de points d'une salle
  const random = useRandom(5);
  const SECTION_HALF_WIDTH = 0.3;       // fraction de vW
  const SECTION_HALF_HEIGHT = 0.2;      // fraction de vH
  const DOT_STEP = 0.008;               // fraction de vW
  const WINDOW_CENTERS = [-0.17, 0, 0.17];
  const WINDOW_HALF_WIDTH = 0.045;
  const inWindowGap = (x: number) =>
    WINDOW_CENTERS.some(center => Math.abs(x - center) < WINDOW_HALF_WIDTH);
  const wallDotPositions: [number, number][] = [];
  for (let x = -SECTION_HALF_WIDTH; x <= SECTION_HALF_WIDTH + 1e-6; x += DOT_STEP) {
    const jitterX = random.nextFloat(-0.0012, 0.0012);
    if (!inWindowGap(x)) {
      wallDotPositions.push([x + jitterX, -SECTION_HALF_HEIGHT + random.nextFloat(-0.002, 0.002)]);
    }
    wallDotPositions.push([x + jitterX, SECTION_HALF_HEIGHT + random.nextFloat(-0.002, 0.002)]);
  }
  for (let y = -SECTION_HALF_HEIGHT; y <= SECTION_HALF_HEIGHT + 1e-6; y += DOT_STEP / 0.5625) {
    wallDotPositions.push([-SECTION_HALF_WIDTH + random.nextFloat(-0.0012, 0.0012), y]);
    wallDotPositions.push([SECTION_HALF_WIDTH + random.nextFloat(-0.0012, 0.0012), y]);
  }
  const wallDotIndices = wallDotPositions.map((_, i) => i);
  const WRONG_FRAME_X = 0.05;           // pose ratée, à côté du trou

  // Scène 3 : grille de tables avec doublons
  const MINI_UNIT = () => vW() * 0.005;
  const GRID_COLS = 4;
  const GRID_ROWS = 2;
  const miniIndices = Array.from({length: GRID_COLS * GRID_ROWS}, (_, i) => i);
  const miniPosition = (miniIndex: number): [number, number] => {
    const col = miniIndex % GRID_COLS;
    const row = Math.floor(miniIndex / GRID_COLS);
    return [vW() * (col - 1.5) * 0.13, vH() * (-0.2 + row * 0.14)];
  };

  // Scène 4 : parallélépipède gris qui remplace un objet détaillé
  const ITEM_UNIT = () => vW() * 0.01;
  const cuboidShapes = (prefix: string, widthUnits: number, heightUnits: number, depthUnits: number) => (<>
    <Line key={`${prefix}-side`}
      points={() => {
        const u = ITEM_UNIT();
        return [
          [u * widthUnits / 2, -u * heightUnits / 2],
          [u * (widthUnits / 2 + depthUnits * 0.7), -u * (heightUnits / 2 + depthUnits * 0.5)],
          [u * (widthUnits / 2 + depthUnits * 0.7), u * (heightUnits / 2 - depthUnits * 0.5)],
          [u * widthUnits / 2, u * heightUnits / 2],
        ];
      }}
      closed fill={'#454B53'} stroke={'#2A2F36'} lineWidth={1}
    />
    <Line key={`${prefix}-top`}
      points={() => {
        const u = ITEM_UNIT();
        return [
          [-u * widthUnits / 2, -u * heightUnits / 2],
          [u * (-widthUnits / 2 + depthUnits * 0.7), -u * (heightUnits / 2 + depthUnits * 0.5)],
          [u * (widthUnits / 2 + depthUnits * 0.7), -u * (heightUnits / 2 + depthUnits * 0.5)],
          [u * widthUnits / 2, -u * heightUnits / 2],
        ];
      }}
      closed fill={'#7A828C'} stroke={'#2A2F36'} lineWidth={1}
    />
    <Rect key={`${prefix}-front`}
      width={() => ITEM_UNIT() * widthUnits} height={() => ITEM_UNIT() * heightUnits}
      fill={'#5B626B'} stroke={'#2A2F36'} lineWidth={1}
    />
  </>);
  const ITEM_X = [-0.17, 0, 0.17];      // couteau, fourchette, bougie

  // ── Refs ───────────────────────────────────────────────────────────────────
  const gridRef = createRef<Grid>();
  const viewportRef = createRef<Rect>();
  const claudeNode = createRef<DiagramNode>();
  const claudeArrow = createRef<ConnectionArrow>();

  const tableSceneGroup = createRef<Layout>();
  const tableCopy = createRef<Layout>();
  const stripes = stripeIndices.map(() => createRef<Rect>());
  const copyArrow = createRef<ConnectionArrow>();

  const sectionSceneGroup = createRef<Layout>();
  const sectionDots = wallDotIndices.map(() => createRef<Circle>());
  const windowFrame = createRef<Rect>();
  const handCursor = createRef<Icon>();

  const cleanupSceneGroup = createRef<Layout>();
  const miniGroups = miniIndices.map(() => createRef<Layout>());
  const miniTops = miniIndices.map(() => createRef<Rect>());
  const miniDuplicates = miniIndices.map(() => createRef<Layout>());
  const cleanupCursor = createRef<Icon>();
  const clockGroup = createRef<Layout>();
  const clockMinuteHand = createRef<Line>();
  const clockHourHand = createRef<Line>();
  const hoursLabel = createRef<Txt>();
  const daysLabel = createRef<Txt>();
  const gainArrow = createRef<ConnectionArrow>();

  const lowPolyGroup = createRef<Layout>();
  const itemDetails = ITEM_X.map(() => createRef<Layout>());
  const itemCuboids = ITEM_X.map(() => createRef<Layout>());

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

    <DiagramNode key="claude-node" ref={claudeNode}
      iconName="mdi:robot-outline"
      label="CLAUDE"
      color={PALETTE.rose}
      initialState="idle"
      width={() => vW() * 0.12} height={() => vH() * 0.22}
      x={() => -vW() * 0.33}
      opacity={0}
    />
    <ConnectionArrow key="claude-arrow" ref={claudeArrow}
      from={() => [-vW() * 0.265, 0]}
      to={() => [vW() * (VIEWPORT_X - 0.29) - vW() * 0.01, 0]}
      stroke={PALETTE.rose}
      lineWidth={2}
      routing={0}
      end={0}
      opacity={0}
    />

    {/* ── Viewport Blender ─────────────────────────────────────────────── */}
    <Rect key="blender-viewport" ref={viewportRef}
      x={() => vW() * VIEWPORT_X}
      width={VIEWPORT_WIDTH} height={VIEWPORT_HEIGHT}
      fill={'#0E1218'}
      stroke={PALETTE.ghost}
      lineWidth={2}
      radius={() => vW() * 0.006}
      clip
      opacity={0}
    >
      <Grid key="viewport-grid"
        width={VIEWPORT_WIDTH} height={VIEWPORT_HEIGHT}
        spacing={() => vW() * 0.03}
        stroke={PALETTE.ghost}
        lineWidth={1}
        opacity={0.15}
      />
      <Icon key="blender-logo"
        icon="logos:blender"
        size={() => vW() * 0.03}
        x={() => -vW() * 0.255} y={() => -vH() * 0.27}
      />

      {/* 1. Table + copie parfaitement superposée */}
      <Layout key="table-scene-group" ref={tableSceneGroup} opacity={0}>
        {tableShapes('table', BIG_UNIT, '#3A4452', PALETTE.cream)}
        <Layout key="table-copy" ref={tableCopy}
          x={() => vW() * 0.03} y={() => -vH() * 0.04}
          opacity={0}
        >
          {tableShapes('table-copy', BIG_UNIT, '#3A4452', PALETTE.rose, undefined, [10, 8])}
        </Layout>
        {stripeIndices.map(stripeIndex => (
          <Rect key={`zfight-stripe-${stripeIndex}`} ref={stripes[stripeIndex]}
            x={() => BIG_UNIT() * 22 * ((stripeIndex + 0.5) / STRIPE_COUNT - 0.5)}
            y={() => -BIG_UNIT() * 5}
            width={() => BIG_UNIT() * 22 / STRIPE_COUNT}
            height={() => BIG_UNIT() * 2.5}
            fill={'#00000000'}
          />
        ))}
      </Layout>

      {/* 2. Coupe du nuage de points */}
      <Layout key="section-scene-group" ref={sectionSceneGroup} opacity={0}>
        {wallDotIndices.map(dotIndex => (
          <Circle key={`section-dot-${dotIndex}`} ref={sectionDots[dotIndex]}
            x={() => vW() * wallDotPositions[dotIndex][0]}
            y={() => vH() * wallDotPositions[dotIndex][1]}
            size={() => vW() * 0.0042}
            fill={PALETTE.cream}
          />
        ))}
        <Rect key="window-frame" ref={windowFrame}
          x={() => vW() * WRONG_FRAME_X} y={() => -vH() * 0.7}
          width={() => vW() * 0.09} height={() => vH() * 0.034}
          fill={PALETTE.rose + '22'}
          stroke={PALETTE.rose}
          lineWidth={4}
          radius={() => vW() * 0.002}
        />
        <Icon key="hand-cursor" ref={handCursor}
          icon="mdi:cursor-pointer"
          color={PALETTE.cream}
          size={() => vW() * 0.035}
          x={() => vW() * (WRONG_FRAME_X + 0.015)} y={() => -vH() * 0.12}
          opacity={0}
        />
      </Layout>

      {/* 3. Nettoyage des doublons */}
      <Layout key="cleanup-scene-group" ref={cleanupSceneGroup} opacity={0}>
        {miniIndices.map(miniIndex => (
          <Layout key={`mini-table-${miniIndex}`} ref={miniGroups[miniIndex]}
            position={() => miniPosition(miniIndex)}
          >
            {tableShapes(`mini-${miniIndex}`, MINI_UNIT, '#000000', PALETTE.rose, miniTops[miniIndex])}
            <Layout key={`mini-duplicate-${miniIndex}`} ref={miniDuplicates[miniIndex]}
              x={() => vW() * 0.006} y={() => -vH() * 0.01}
            >
              {tableShapes(`mini-duplicate-${miniIndex}`, MINI_UNIT, '#00000000', PALETTE.rose, undefined, [6, 6])}
            </Layout>
          </Layout>
        ))}
        <Icon key="cleanup-cursor" ref={cleanupCursor}
          icon="mdi:cursor-pointer"
          color={PALETTE.cream}
          size={() => vW() * 0.03}
          x={() => vW() * 0.3} y={() => vH() * 0.2}
          opacity={0}
        />
        <Layout key="clock-group" ref={clockGroup} y={() => vH() * 0.2} opacity={0}>
          <Circle key="clock-face"
            x={() => -vW() * 0.1}
            size={() => vW() * 0.06}
            fill={'#00000000'}
            stroke={PALETTE.cream}
            lineWidth={3}
          />
          <Line key="clock-hour-hand" ref={clockHourHand}
            x={() => -vW() * 0.1}
            points={() => [[0, 0], [0, -vW() * 0.014]]}
            stroke={PALETTE.cream}
            lineWidth={3}
            lineCap={'round'}
          />
          <Line key="clock-minute-hand" ref={clockMinuteHand}
            x={() => -vW() * 0.1}
            points={() => [[0, 0], [0, -vW() * 0.023]]}
            stroke={PALETTE.rose}
            lineWidth={2}
            lineCap={'round'}
          />
          <Txt key="hours-label" ref={hoursLabel}
            text="heures"
            x={() => -vW() * 0.035}
            fill={PALETTE.rose}
            fontFamily={FONT_MONO} fontWeight={700}
            fontSize={() => vW() * 0.018}
            opacity={0}
          />
          <ConnectionArrow key="gain-arrow" ref={gainArrow}
            from={() => [vW() * 0.005, 0]}
            to={() => [vW() * 0.05, 0]}
            stroke={PALETTE.vert}
            lineWidth={2}
            routing={0}
            end={0}
            opacity={0}
          />
          <Txt key="days-label" ref={daysLabel}
            text="jours"
            x={() => vW() * 0.095}
            fill={PALETTE.vert}
            fontFamily={FONT_MONO} fontWeight={700}
            fontSize={() => vW() * 0.018}
            opacity={0}
          />
        </Layout>
      </Layout>

      {/* 4. Low-poly : couteau, fourchette, bougie */}
      <Layout key="low-poly-group" ref={lowPolyGroup} opacity={0}>
        {/* Couteau */}
        <Layout key="knife-detail" ref={itemDetails[0]} x={() => vW() * ITEM_X[0]}>
          <Line key="knife-blade"
            points={() => {
              const u = ITEM_UNIT();
              return [[0, -u * 14], [u * 2.2, -u * 9], [u * 2.2, u * 1], [-u * 1.2, u * 1], [-u * 1.2, -u * 8]];
            }}
            closed fill={'#C9D1D9'} stroke={PALETTE.cream} lineWidth={2}
          />
          <Rect key="knife-handle"
            y={() => ITEM_UNIT() * 6.5}
            width={() => ITEM_UNIT() * 2.8} height={() => ITEM_UNIT() * 8}
            fill={'#6B4A32'} stroke={PALETTE.cream} lineWidth={2}
            radius={() => ITEM_UNIT() * 1.2}
          />
          <Circle key="knife-rivet-top" y={() => ITEM_UNIT() * 4.5}
            size={() => ITEM_UNIT() * 0.7} fill={PALETTE.jaune} />
          <Circle key="knife-rivet-bottom" y={() => ITEM_UNIT() * 8.5}
            size={() => ITEM_UNIT() * 0.7} fill={PALETTE.jaune} />
        </Layout>
        <Layout key="knife-cuboid" ref={itemCuboids[0]} x={() => vW() * ITEM_X[0]} opacity={0}>
          {cuboidShapes('knife', 3.6, 22, 3)}
        </Layout>

        {/* Fourchette */}
        <Layout key="fork-detail" ref={itemDetails[1]} x={() => vW() * ITEM_X[1]}>
          <Rect key="fork-handle"
            y={() => ITEM_UNIT() * 5.5}
            width={() => ITEM_UNIT() * 2.2} height={() => ITEM_UNIT() * 11}
            fill={'#C9D1D9'} stroke={PALETTE.cream} lineWidth={2}
            radius={() => ITEM_UNIT() * 1}
          />
          <Rect key="fork-head"
            y={() => -ITEM_UNIT() * 1}
            width={() => ITEM_UNIT() * 9} height={() => ITEM_UNIT() * 2.4}
            fill={'#C9D1D9'} stroke={PALETTE.cream} lineWidth={2}
            radius={() => ITEM_UNIT() * 1}
          />
          {[-3.9, -1.3, 1.3, 3.9].map((tineX, tineIndex) => (
            <Rect key={`fork-tine-${tineIndex}`}
              x={() => ITEM_UNIT() * tineX} y={() => -ITEM_UNIT() * 5.5}
              width={() => ITEM_UNIT() * 1.2} height={() => ITEM_UNIT() * 7}
              fill={'#C9D1D9'} stroke={PALETTE.cream} lineWidth={2}
              radius={() => ITEM_UNIT() * 0.5}
            />
          ))}
        </Layout>
        <Layout key="fork-cuboid" ref={itemCuboids[1]} x={() => vW() * ITEM_X[1]} opacity={0}>
          {cuboidShapes('fork', 9, 17, 3)}
        </Layout>

        {/* Bougie */}
        <Layout key="candle-detail" ref={itemDetails[2]} x={() => vW() * ITEM_X[2]}>
          <Rect key="candle-body"
            y={() => ITEM_UNIT() * 2}
            width={() => ITEM_UNIT() * 5} height={() => ITEM_UNIT() * 14}
            fill={'#F0E6D2'} stroke={PALETTE.cream} lineWidth={2}
            radius={() => ITEM_UNIT() * 0.6}
          />
          <Rect key="candle-wick"
            y={() => -ITEM_UNIT() * 6}
            width={() => ITEM_UNIT() * 0.5} height={() => ITEM_UNIT() * 2}
            fill={PALETTE.ghost}
          />
          <Circle key="candle-flame"
            y={() => -ITEM_UNIT() * 9}
            width={() => ITEM_UNIT() * 2.4} height={() => ITEM_UNIT() * 4}
            fill={PALETTE.jaune}
            shadowColor={PALETTE.jaune}
            shadowBlur={() => vW() * 0.012}
          />
        </Layout>
        <Layout key="candle-cuboid" ref={itemCuboids[2]} x={() => vW() * ITEM_X[2]} opacity={0}>
          {cuboidShapes('candle', 5, 16, 3)}
        </Layout>
      </Layout>
    </Rect>

    <ConnectionArrow key="copy-arrow" ref={copyArrow}
      from={() => [-vW() * 0.265, -vH() * 0.06]}
      to={() => [vW() * (VIEWPORT_X - 0.1), -vH() * 0.06]}
      stroke={PALETTE.rose}
      lineWidth={2}
      dashed
      routing={0}
      end={0}
      opacity={0}
    />
  </>);

  // ── ANIMATION ──────────────────────────────────────────────────────────────

  // 1. Doublons : une copie parfaitement superposée fait scintiller le rendu
  yield* waitUntil('doublons');
  yield* all(
    gridRef().opacity(0.07, 1),
    viewportRef().opacity(1, 0.7),
    claudeNode().opacity(1, 0.7),
  );
  claudeArrow().opacity(1);
  yield* all(
    claudeArrow().end(1, 0.5),
    tableSceneGroup().opacity(1, 0.6),
  );
  yield* claudeNode().setState('active', 0.3);
  // La copie arrive légèrement décalée, puis est recalée au pixel près
  yield* tableCopy().opacity(1, 0.4);
  yield* tableCopy().position([0, 0], 1.2, easeInOutCubic);
  yield* waitFor(0.4);
  // Au rendu : scintillement (z-fighting) sur la table
  yield* all(
    viewportRef().stroke(PALETTE.rose, 0.3),
    tableCopy().opacity(0, 0.2),
  );
  for (let flickerRound = 0; flickerRound < 5; flickerRound++) {
    yield* all(
      ...stripes.map((stripeRef, stripeIndex) =>
        stripeRef().fill(stripeIndex % 2 === flickerRound % 2 ? '#000000' : '#00000000', 0.07)),
    );
  }
  yield* all(
    ...stripes.map(stripeRef => stripeRef().fill('#000000', 0.2)),
    claudeNode().setState('error', 0.2),
  );
  yield* waitFor(0.8);

  // 2. Fenêtres : le cadre tombe au mauvais endroit, recalé à la main
  yield* waitUntil('fenetres');
  yield* all(
    tableSceneGroup().opacity(0, 0.5),
    viewportRef().stroke(PALETTE.ghost, 0.5),
  );
  yield* sectionSceneGroup().opacity(1, 0.5);
  yield* windowFrame().y(-vH() * SECTION_HALF_HEIGHT, 1.1, easeOutBounce);
  yield* waitFor(0.5);
  yield* handCursor().opacity(1, 0.3);
  yield* all(
    windowFrame().x(0, 1, easeInOutCubic),
    handCursor().x(vW() * 0.015, 1, easeInOutCubic),
    windowFrame().stroke(PALETTE.vert, 1),
    windowFrame().fill(PALETTE.vert + '22', 1),
  );
  yield* handCursor().opacity(0, 0.3);
  yield* waitFor(0.4);

  // 3. Nettoyage : doublons supprimés à la main, le rendu redevient correct
  yield* waitUntil('nettoyage');
  yield* sectionSceneGroup().opacity(0, 0.5);
  yield* cleanupSceneGroup().opacity(1, 0.5);
  cleanupCursor().opacity(1);
  const removalDurations = [0.55, 0.45, 0.38, 0.3, 0.26, 0.22, 0.2, 0.18];
  for (const miniIndex of miniIndices) {
    const [miniX, miniY] = miniPosition(miniIndex);
    yield* cleanupCursor().position(
      [miniX + vW() * 0.03, miniY + vH() * 0.02],
      removalDurations[miniIndex],
      easeInOutCubic,
    );
    yield* all(
      miniDuplicates[miniIndex]().opacity(0, 0.15),
      miniTops[miniIndex]().fill('#3A4452', 0.2),
    );
  }
  yield* all(
    cleanupCursor().opacity(0, 0.3),
    claudeNode().setState('success', 0.3),
    viewportRef().stroke(PALETTE.vert, 0.3),
  );
  // Heures → jours gagnés
  yield* clockGroup().opacity(1, 0.4);
  yield* all(
    clockMinuteHand().rotation(360 * 6, 2.2, easeInOutCubic),
    clockHourHand().rotation(360, 2.2, easeInOutCubic),
    sequence(0.9, hoursLabel().opacity(1, 0.3)),
  );
  gainArrow().opacity(1);
  yield* gainArrow().end(1, 0.4);
  yield* daysLabel().opacity(1, 0.3);
  yield* daysLabel().scale(1.25, 0.2).to(1, 0.2);
  yield* waitFor(0.6);

  // 4. Low-poly : le détail s'effondre en parallélépipède gris
  yield* waitUntil('low-poly');
  yield* all(
    cleanupSceneGroup().opacity(0, 0.5),
    viewportRef().stroke(PALETTE.ghost, 0.5),
    claudeNode().setState('active', 0.3),
  );
  yield* lowPolyGroup().opacity(1, 0.5);
  yield* waitFor(0.5);
  yield* sequence(
    0.55,
    ...ITEM_X.map((_, itemIndex) => all(
      itemDetails[itemIndex]().opacity(0, 0.35),
      itemDetails[itemIndex]().scale(0.7, 0.35),
      itemCuboids[itemIndex]().scale(0.7, 0).to(1, 0.4, easeOutCubic),
      itemCuboids[itemIndex]().opacity(1, 0.3),
    )),
  );
  yield* claudeNode().setState('error', 0.2);
  yield* waitFor(1.5);

  yield* all(
    gridRef().opacity(0, 0.6),
    viewportRef().opacity(0, 0.6),
    claudeNode().opacity(0, 0.6),
    claudeArrow().opacity(0, 0.6),
  );
});
