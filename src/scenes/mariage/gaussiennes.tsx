/**
 * gaussiennes — Une scène faite de taches floues (JUMEAU, ch. 4).
 *
 * 1. Une seule gaussienne : une ellipse floue. Ses cinq paramètres (position,
 *    taille, rotation, couleur, opacité) s'affichent et varient un par un.
 * 2. Des centaines d'ellipses se superposent et reconstituent peu à peu une
 *    silhouette de verrière (arche + barres + sol). PRNG à graine fixe : le
 *    rendu est identique à chaque exécution.
 * 3. L'entraînement : un GPU (RTX 3070), une horloge qui défile jusqu'à 7-8 h,
 *    un compteur qui monte jusqu'à 1 500 000.
 *
 * Couleur active : rose.
 *
 * Battements : ellipse · accumulation · entrainement
 */
import {makeScene2D, Grid, Layout, Rect, Txt, Line, Circle, Gradient} from '@motion-canvas/2d';
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
  Color,
  useRandom,
} from '@motion-canvas/core';
import {DiagramNode} from '../../components';
import {PALETTE} from '../../theme';
import {sfx, sfxFill, sfxReset, sfxFlush} from '../../sfx';

const MONO = 'JetBrains Mono, DM Mono, monospace';

/** Diamètre d'une gaussienne avant mise à l'échelle (fraction de vW). */
const SPLAT_SIZE = 0.05;
const BATCH_COUNT = 6;

const formatDecimal = (value: number, digits = 2) => value.toFixed(digits).replace('.', ',');
const formatThousands = (value: number) =>
  Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  view.fill(PALETTE.bg);

  // ── Paramètres de la gaussienne isolée (signaux) ───────────────────────────
  const ellipseCenterX = createSignal(-0.2);   // fraction de vW
  const ellipseCenterY = createSignal(0);      // fraction de vW
  const ellipseScaleX = createSignal(1.4);
  const ellipseScaleY = createSignal(0.7);
  const ellipseAngle = createSignal(25);       // degrés
  const ellipseAlpha = createSignal(0.9);
  const ellipseColorMix = createSignal(0);     // 0 = rose, 1 = crème

  const ellipseColor = (alpha: number) =>
    Color.lerp(PALETTE.rose, PALETTE.cream, ellipseColorMix(), 'rgb').alpha(alpha);

  const singleEllipseGradient = new Gradient({
    type: 'radial',
    fromRadius: 0,
    toRadius: () => vW() * 0.1,
    stops: [
      {offset: 0,   color: () => ellipseColor(0.95)},
      {offset: 0.5, color: () => ellipseColor(0.4)},
      {offset: 1,   color: () => ellipseColor(0)},
    ],
  });

  // ── Le nuage : centaines d'ellipses déterministes ──────────────────────────
  const random = useRandom(3070, true);

  const splatColors = [PALETTE.rose, '#FF8FA8', PALETTE.cream, PALETTE.secondary];
  const splatGradients = splatColors.map(color => new Gradient({
    type: 'radial',
    fromRadius: 0,
    toRadius: () => vW() * SPLAT_SIZE / 2,
    stops: [
      {offset: 0,   color: color + 'E6'},
      {offset: 0.5, color: color + '66'},
      {offset: 1,   color: color + '00'},
    ],
  }));

  interface SplatSpec {
    targetX: number;       // fraction de vW
    targetY: number;       // fraction de vW
    targetAngle: number;   // degrés
    targetScaleX: number;
    targetScaleY: number;
    targetAlpha: number;
    startX: number;
    startY: number;
    startAngle: number;
    colorIndex: number;
    batchIndex: number;
  }

  const archCenterY = 0.115;   // fraction de vW (sol de la verrière)
  const archRadius = 0.2;
  const splatSpecs: SplatSpec[] = [];

  const pushSplat = (
    targetX: number, targetY: number, tangentAngle: number, colorChoices: number[],
  ) => {
    splatSpecs.push({
      targetX,
      targetY,
      targetAngle: tangentAngle,
      targetScaleX: random.nextFloat(0.45, 0.65),
      targetScaleY: random.nextFloat(0.18, 0.28),
      targetAlpha: random.nextFloat(0.5, 0.85),
      startX: random.nextFloat(-0.46, 0.46),
      startY: random.nextFloat(-0.2, 0.2),
      startAngle: random.nextFloat(-90, 90),
      colorIndex: colorChoices[random.nextInt(0, colorChoices.length)],
      batchIndex: random.nextInt(0, BATCH_COUNT),
    });
  };

  // Arche : demi-anneau
  for (let i = 0; i < 150; i++) {
    const theta = Math.PI + (i / 149) * Math.PI;
    const ringRadius = archRadius + random.nextFloat(-0.008, 0.008);
    pushSplat(
      Math.cos(theta) * ringRadius,
      archCenterY + Math.sin(theta) * ringRadius,
      (theta + Math.PI / 2) * 180 / Math.PI,
      [0, 0, 1],
    );
  }
  // Barres verticales de la verrière
  for (let barIndex = 0; barIndex < 7; barIndex++) {
    const barX = (barIndex - 3) * archRadius / 3.6;
    const barTop = archCenterY - Math.sqrt(archRadius * archRadius - barX * barX);
    for (let i = 0; i < 14; i++) {
      pushSplat(barX, archCenterY + (barTop - archCenterY) * (i / 13), 90, [1, 2]);
    }
  }
  // Sol
  for (let i = 0; i < 50; i++) {
    pushSplat(-archRadius + (i / 49) * archRadius * 2, archCenterY + 0.006, 0, [3, 3, 0]);
  }

  // ── Refs ───────────────────────────────────────────────────────────────────
  const gridRef = createRef<Grid>();
  const singleEllipse = createRef<Circle>();
  const positionMarker = createRef<Layout>();
  const parameterPanel = createRef<Layout>();
  const parameterNames = ['position', 'taille', 'rotation', 'couleur', 'opacité'];
  const parameterRowRefs = parameterNames.map(() => createRef<Rect>());
  const splatCloud = createRef<Layout>();
  const splatRefs = splatSpecs.map(() => createRef<Circle>());

  const trainingGroup = createRef<Layout>();
  const gpuNode = createRef<DiagramNode>();
  const trainingHours = createSignal(0);
  const splatCount = createSignal(0);

  const parameterRowY = (rowIndex: number) => vH() * (-0.2 + rowIndex * 0.1);

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

    {/* Nuage de gaussiennes (vide au départ) */}
    <Layout key="splat-cloud" ref={splatCloud}>
      {splatSpecs.map((spec, splatIndex) => (
        <Circle key={`splat-${splatIndex}`} ref={splatRefs[splatIndex]}
          size={() => vW() * SPLAT_SIZE}
          fill={splatGradients[spec.colorIndex]}
          x={() => vW() * spec.startX}
          y={() => vW() * spec.startY}
          rotation={spec.startAngle}
          scale={2.4}
          opacity={0}
        />
      ))}
    </Layout>

    {/* Gaussienne isolée */}
    <Circle key="single-ellipse" ref={singleEllipse}
      size={() => vW() * 0.2}
      fill={singleEllipseGradient}
      x={() => vW() * ellipseCenterX()}
      y={() => vW() * ellipseCenterY()}
      scale={() => [ellipseScaleX(), ellipseScaleY()]}
      rotation={ellipseAngle}
      opacity={0}
    />
    <Layout key="position-marker" ref={positionMarker}
      x={() => vW() * ellipseCenterX()}
      y={() => vW() * ellipseCenterY()}
      opacity={0}
    >
      <Line key="position-marker-horizontal"
        points={() => [[vW() * -0.008, 0], [vW() * 0.008, 0]]}
        stroke={PALETTE.cream}
        lineWidth={2}
      />
      <Line key="position-marker-vertical"
        points={() => [[0, vW() * -0.008], [0, vW() * 0.008]]}
        stroke={PALETTE.cream}
        lineWidth={2}
      />
    </Layout>

    {/* Panneau des paramètres */}
    <Layout key="parameter-panel" ref={parameterPanel}
      x={() => vW() * 0.25}
      opacity={0}
    >
      {parameterNames.map((parameterName, rowIndex) => (
        <Rect key={`parameter-row-${parameterName}`} ref={parameterRowRefs[rowIndex]}
          width={() => vW() * 0.27} height={() => vH() * 0.075}
          fill={PALETTE.bgCard}
          stroke={PALETTE.ghost}
          lineWidth={2}
          radius={() => vW() * 0.004}
          y={() => parameterRowY(rowIndex)}
        >
          <Txt key={`parameter-label-${parameterName}`}
            text={parameterName}
            fill={PALETTE.secondary}
            fontSize={() => vW() * 0.0135}
            fontFamily={MONO}
            offset={[-1, 0]}
            x={() => vW() * -0.125}
          />
        </Rect>
      ))}
      <Txt key="parameter-value-position"
        text={() => `${formatDecimal(ellipseCenterX())} ; ${formatDecimal(ellipseCenterY())}`}
        fill={PALETTE.cream}
        fontSize={() => vW() * 0.0135}
        fontFamily={MONO}
        fontWeight={700}
        offset={[1, 0]}
        x={() => vW() * 0.125} y={() => parameterRowY(0)}
      />
      <Txt key="parameter-value-size"
        text={() => `${formatDecimal(ellipseScaleX(), 1)} × ${formatDecimal(ellipseScaleY(), 1)}`}
        fill={PALETTE.cream}
        fontSize={() => vW() * 0.0135}
        fontFamily={MONO}
        fontWeight={700}
        offset={[1, 0]}
        x={() => vW() * 0.125} y={() => parameterRowY(1)}
      />
      <Txt key="parameter-value-rotation"
        text={() => `${Math.round(ellipseAngle())}°`}
        fill={PALETTE.cream}
        fontSize={() => vW() * 0.0135}
        fontFamily={MONO}
        fontWeight={700}
        offset={[1, 0]}
        x={() => vW() * 0.125} y={() => parameterRowY(2)}
      />
      <Rect key="parameter-value-color"
        width={() => vW() * 0.03} height={() => vH() * 0.04}
        fill={() => ellipseColor(1)}
        radius={() => vW() * 0.003}
        x={() => vW() * 0.11} y={() => parameterRowY(3)}
      />
      <Txt key="parameter-value-opacity"
        text={() => formatDecimal(ellipseAlpha())}
        fill={PALETTE.cream}
        fontSize={() => vW() * 0.0135}
        fontFamily={MONO}
        fontWeight={700}
        offset={[1, 0]}
        x={() => vW() * 0.125} y={() => parameterRowY(4)}
      />
    </Layout>

    {/* Entraînement : GPU, horloge, compteur */}
    <Layout key="training-group" ref={trainingGroup} opacity={0}>
      <DiagramNode key="gpu-node" ref={gpuNode}
        iconName="mdi:expansion-card"
        label="RTX 3070"
        color={PALETTE.rose}
        initialState="idle"
        width={() => vW() * 0.2} height={() => vH() * 0.24}
        x={() => vW() * 0.25} y={() => vH() * -0.22}
      />
      <Circle key="clock-face"
        size={() => vW() * 0.08}
        stroke={PALETTE.rose}
        lineWidth={3}
        x={() => vW() * 0.17} y={() => vH() * 0.08}
      >
        <Rect key="clock-hand"
          width={() => vW() * 0.002}
          height={() => vW() * 0.032}
          offset={[0, 1]}
          fill={PALETTE.rose}
          radius={() => vW() * 0.001}
          rotation={() => trainingHours() * 360}
        />
      </Circle>
      <Txt key="clock-hours"
        text={() => trainingHours() >= 7 ? '7-8 h' : `${Math.floor(trainingHours())} h`}
        fill={PALETTE.cream}
        fontSize={() => vW() * 0.03}
        fontFamily={MONO}
        fontWeight={700}
        x={() => vW() * 0.32} y={() => vH() * 0.08}
      />
      <Txt key="splat-counter"
        text={() => formatThousands(splatCount())}
        fill={PALETTE.rose}
        fontSize={() => vW() * 0.05}
        fontFamily={MONO}
        fontWeight={700}
        x={() => vW() * 0.25} y={() => vH() * 0.28}
      />
    </Layout>
  </>);

  // ── ANIMATION ──────────────────────────────────────────────────────────────

  // 1. Une seule gaussienne et ses cinq paramètres
  sfxReset();
  yield* waitUntil('ellipse');
  yield* gridRef().opacity(0.07, 0.8);
  yield* all(
    singleEllipse().opacity(ellipseAlpha(), 0.8),
    positionMarker().opacity(1, 0.8),
    parameterPanel().opacity(1, 0.8),
  );
  // Une fois visible, l'opacité de l'ellipse suit le paramètre
  singleEllipse().opacity(ellipseAlpha);

  const highlightRow = (rowIndex: number) => {
    sfx('tick', 0.9);
    return parameterRowRefs[rowIndex]().stroke(PALETTE.rose, 0.2);
  };
  const releaseRow = (rowIndex: number) => parameterRowRefs[rowIndex]().stroke(PALETTE.ghost, 0.3);

  yield* highlightRow(0);
  yield* all(
    ellipseCenterX(-0.14, 0.9, easeInOutCubic),
    ellipseCenterY(-0.05, 0.9, easeInOutCubic),
  );
  yield* releaseRow(0);
  yield* highlightRow(1);
  yield* all(
    ellipseScaleX(2.0, 0.9, easeInOutCubic),
    ellipseScaleY(0.45, 0.9, easeInOutCubic),
  );
  yield* releaseRow(1);
  yield* highlightRow(2);
  yield* ellipseAngle(-40, 0.9, easeInOutCubic);
  yield* releaseRow(2);
  yield* highlightRow(3);
  yield* ellipseColorMix(1, 0.9, easeInOutCubic);
  yield* releaseRow(3);
  yield* highlightRow(4);
  yield* ellipseAlpha(0.35, 0.5, easeInOutCubic);
  yield* ellipseAlpha(0.85, 0.5, easeInOutCubic);
  yield* releaseRow(4);

  // 2. Accumulation : des centaines d'ellipses reconstituent la verrière
  yield* waitUntil('accumulation');
  const batches = Array.from({length: BATCH_COUNT}, (_, batchIndex) =>
    splatSpecs
      .map((spec, splatIndex) => ({spec, splatIndex}))
      .filter(entry => entry.spec.batchIndex === batchIndex),
  );
  batches.forEach((_, batchIndex) => sfx('swap', 0.5, 0.45 * batchIndex));
  yield* all(
    singleEllipse().opacity(0, 0.6),
    positionMarker().opacity(0, 0.6),
    parameterPanel().opacity(0, 0.6),
    sequence(0.45, ...batches.map(batch => all(...batch.map(({spec, splatIndex}) => all(
      splatRefs[splatIndex]().position([vW() * spec.targetX, vW() * spec.targetY], 0.9, easeOutCubic),
      splatRefs[splatIndex]().rotation(spec.targetAngle, 0.9, easeOutCubic),
      splatRefs[splatIndex]().scale([spec.targetScaleX, spec.targetScaleY], 0.9, easeOutCubic),
      splatRefs[splatIndex]().opacity(spec.targetAlpha, 0.6),
    )))),
  ));
  yield* waitFor(0.5);

  // 3. Entraînement : GPU, horloge jusqu'à 7-8 h, compteur jusqu'à 1,5 M
  yield* waitUntil('entrainement');
  sfx('travel', 0.5);
  yield* all(
    splatCloud().position([vW() * -0.22, 0], 1, easeInOutCubic),
    splatCloud().scale(0.8, 1, easeInOutCubic),
    trainingGroup().opacity(1, 0.8),
  );
  sfx('activate');
  yield* gpuNode().setState('active', 0.3);
  sfxFill(0, 1, 4.5, {ease: easeOutCubic, steps: 14});
  sfx('success', 0.8, 4.5);
  yield* all(
    trainingHours(8, 4.5, linear),
    splatCount(1500000, 4.5, easeOutCubic),
    gpuNode().setState('highlighted', 0.6),
  );
  sfxFlush('gaussiennes');
});
