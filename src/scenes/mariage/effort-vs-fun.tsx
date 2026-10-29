/**
 * effort-vs-fun — Le jumeau numérique : effort, gain, fun (LEÇON).
 *
 * Trois barres dans un cadre de graphique : l'effort s'empile en heures,
 * le gain reste minuscule, le fun dépasse le cadre et sort de l'écran.
 *
 * Battements : effort · gain · fun
 * Couleur active : jaune (le fun). Effort et gain restent en secondaire.
 */
import {makeScene2D, Grid, Layout, Rect, Txt, Icon} from '@motion-canvas/2d';
import {
  createRef,
  Reference,
  all,
  sequence,
  waitFor,
  waitUntil,
  easeInOutCubic,
  easeOutCubic,
  easeInCubic,
} from '@motion-canvas/core';
import {PALETTE} from '../../theme';

const MONO = 'JetBrains Mono, DM Mono, monospace';
const HOUR_BLOCK_COUNT = 14;

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  view.fill(PALETTE.bg);

  // ── Géométrie du graphique ─────────────────────────────────────────────────
  const baselineY     = () => +vH() * 0.27;
  const effortBarX    = () => -vW() * 0.18;
  const gainBarX      = () => 0;
  const funBarX       = () => +vW() * 0.18;
  const barWidth      = () => vW() * 0.1;
  const hourBlockStep = () => vH() * 0.038;
  const labelY        = () => baselineY() + vH() * 0.045;

  // ── Refs ───────────────────────────────────────────────────────────────────
  const gridRef      = createRef<Grid>();
  const cameraLayout = createRef<Layout>();
  const chartFrame   = createRef<Rect>();
  const gainBar      = createRef<Rect>();
  const funBar       = createRef<Rect>();
  const effortLabel  = createRef<Layout>();
  const gainLabel    = createRef<Layout>();
  const funLabel     = createRef<Layout>();
  const hourBlockRefs = Array.from({length: HOUR_BLOCK_COUNT}, () => createRef<Rect>());

  /** Étiquette sous une barre : icône + mot court. */
  const buildBarLabel = (
    keyPrefix: string,
    labelRef: Reference<Layout>,
    barX: () => number,
    iconName: string,
    text: string,
    color: string,
  ) => (
    <Layout
      key={keyPrefix}
      ref={labelRef}
      layout
      direction={'row'}
      alignItems={'center'}
      gap={() => vW() * 0.008}
      x={barX}
      y={labelY}
      opacity={0}
    >
      <Icon
        key={`${keyPrefix}-icon`}
        icon={iconName}
        color={color}
        size={() => vW() * 0.026}
      />
      <Txt
        key={`${keyPrefix}-text`}
        text={text}
        fill={color}
        fontSize={() => vW() * 0.02}
        fontFamily={MONO}
        fontWeight={700}
      />
    </Layout>
  );

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
      {/* Cadre du graphique + ligne de base */}
      <Rect key="chart-frame" ref={chartFrame}
        width={() => vW() * 0.62}
        height={() => vH() * 0.64}
        y={() => vH() * -0.01}
        fill={'#00000000'}
        stroke={PALETTE.ghost}
        lineWidth={2}
        radius={() => vW() * 0.006}
        opacity={0}
      />
      <Rect key="chart-baseline"
        width={() => vW() * 0.56}
        height={() => vH() * 0.004}
        y={baselineY}
        fill={PALETTE.secondary}
      />

      {/* Effort : les heures s'empilent */}
      {hourBlockRefs.map((hourBlockRef, blockIndex) => (
        <Rect
          key={`effort-hour-${blockIndex}`}
          ref={hourBlockRef}
          width={barWidth}
          height={() => hourBlockStep() * 0.85}
          x={effortBarX}
          y={() => baselineY() - hourBlockStep() * (blockIndex + 0.5) - vH() * 0.003}
          fill={PALETTE.secondary}
          radius={() => vW() * 0.002}
          scale={0.7}
          opacity={0}
        />
      ))}

      {/* Gain : une fine ligne */}
      <Rect key="gain-bar" ref={gainBar}
        offset={[0, 1]}
        width={barWidth}
        height={0}
        x={gainBarX}
        y={() => baselineY() - vH() * 0.003}
        fill={PALETTE.secondary}
        radius={() => vW() * 0.002}
      />

      {/* Fun : monte, traverse le cadre, sort de l'écran */}
      <Rect key="fun-bar" ref={funBar}
        offset={[0, 1]}
        width={barWidth}
        height={0}
        x={funBarX}
        y={() => baselineY() - vH() * 0.003}
        fill={PALETTE.jaune}
        shadowColor={PALETTE.jaune}
        shadowBlur={() => vW() * 0.02}
        radius={() => vW() * 0.002}
      />

      {buildBarLabel('effort-label', effortLabel, effortBarX, 'mdi:clock-outline', 'EFFORT', PALETTE.secondary)}
      {buildBarLabel('gain-label', gainLabel, gainBarX, 'mdi:chart-line', 'GAIN', PALETTE.secondary)}
      {buildBarLabel('fun-label', funLabel, funBarX, 'mdi:gamepad-variant', 'FUN', PALETTE.jaune)}
    </Layout>
  </>);

  // ── ANIMATION ──────────────────────────────────────────────────────────────
  yield* gridRef().opacity(0.07, 0.8);
  yield* chartFrame().opacity(1, 0.5);

  // 1. effort — les heures s'empilent très haut
  yield* waitUntil('effort');
  yield* effortLabel().opacity(1, 0.3);
  yield* sequence(0.12, ...hourBlockRefs.map(hourBlockRef =>
    all(
      hourBlockRef().opacity(1, 0.2),
      hourBlockRef().scale(1, 0.25, easeOutCubic),
    ),
  ));
  yield* waitFor(0.4);

  // 2. gain — une barre minuscule
  yield* waitUntil('gain');
  yield* gainLabel().opacity(1, 0.3);
  yield* gainBar().height(vH() * 0.03, 0.5, easeOutCubic);
  yield* waitFor(0.5);

  // 3. fun — dépasse le cadre, la caméra recule, la barre sort de l'écran
  yield* waitUntil('fun');
  yield* funLabel().opacity(1, 0.3);
  yield* funBar().height(vH() * 0.55, 1.2, easeOutCubic);
  yield* chartFrame().stroke(PALETTE.jaune, 0.3);
  const cameraScale = 0.4;
  yield* all(
    funBar().height(vH() * 3.5, 2.4, easeInCubic),
    cameraLayout().scale(cameraScale, 2.4, easeInOutCubic),
    cameraLayout().position([0, vH() * 0.19], 2.4, easeInOutCubic),
    chartFrame().height(vH() * 0.7, 2.4, easeInOutCubic),
  );
  yield* waitFor(0.6);
});
