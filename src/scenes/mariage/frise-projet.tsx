/**
 * frise-projet — HOOK : 3 ans de fiançailles, puis 1 an de projet.
 *
 * Une frise horizontale. Trois ans gris où rien ne se passe (compteur de
 * tâches à 0), un point jaune « 13/09/2025 » qui tombe dessus, puis un an qui
 * file jusqu'à « 22/08/2026 » pendant que les tâches et les réunions
 * s'empilent de plus en plus vite. Tout se condense en une seule icône projet
 * face à l'anneau : `≟`.
 *
 * Couleur active : jaune. Le reste en secondary / ghost.
 *
 * Battements : fiancailles · salon · un-an · question
 */
import {makeScene2D, Circle, Grid, Icon, Line, Rect, Txt} from '@motion-canvas/2d';
import {
  all,
  createRef,
  createRefArray,
  createSignal,
  easeInCubic,
  easeInOutCubic,
  easeOutCubic,
  linear,
  waitFor,
  waitUntil,
} from '@motion-canvas/core';
import {PALETTE} from '../../theme';

/** ⚠ Valeur d'exemple : à remplacer par le vrai nombre de tâches Vikunja. */
const TASK_TOTAL = 240;
const MICRO_ICON_COUNT = 40;
const MICRO_ICON_ROWS = 5;
const MICRO_ICON_NAMES = [
  'mdi:check-circle-outline',
  'mdi:account-group',
  'mdi:format-list-checks',
];
const FONT_MONO = 'JetBrains Mono, DM Mono, monospace';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  view.fill(PALETTE.bg);

  // ── Géométrie de la frise (fractions de vW / vH) ───────────────────────────
  const friseY = () => vH() * 0.12;
  const ringStartX = () => vW() * -0.4;
  const greyEdges = [-0.33, -0.23, -0.13, -0.03];
  const salonX = () => vW() * greyEdges[3];
  const arriveeX = () => vW() * 0.33;
  const heartX = () => vW() * 0.38;
  const yearDuration = 1.1;
  const yellowDuration = 4.6;

  // Les icônes d'activité se densifient vers la fin de la frise (racine carrée).
  const microIconProgress = (iconIndex: number) =>
    Math.sqrt((iconIndex + 0.5) / MICRO_ICON_COUNT);
  const microIconX = (iconIndex: number) =>
    salonX() + (arriveeX() - salonX()) * microIconProgress(iconIndex);
  const microIconY = (iconIndex: number) => {
    const row = iconIndex % MICRO_ICON_ROWS;
    const jitter = (((iconIndex * 37) % 11) - 5) / 5;
    return friseY() - vH() * (0.07 + row * 0.055) + vH() * 0.012 * jitter;
  };

  // ── Signaux & refs ─────────────────────────────────────────────────────────
  const taskCount = createSignal(0);

  const gridRef = createRef<Grid>();
  const ringIcon = createRef<Icon>();
  const greySegments = createRefArray<Line>();
  const greyTicks = createRefArray<Rect>();
  const yearLabels = createRefArray<Txt>();
  const counterIcon = createRef<Icon>();
  const counterText = createRef<Txt>();
  const counterLabel = createRef<Txt>();
  const salonDot = createRef<Circle>();
  const salonRipple = createRef<Circle>();
  const salonLabel = createRef<Txt>();
  const yellowLine = createRef<Line>();
  const heartIcon = createRef<Icon>();
  const arriveeLabel = createRef<Txt>();
  const microIcons = createRefArray<Icon>();
  const projectIcon = createRef<Icon>();
  const questionSign = createRef<Txt>();

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

    {/* Trois ans gris : rien ne se passe */}
    {[0, 1, 2].map(yearIndex => (
      <Line
        key={`grey-segment-${yearIndex}`}
        ref={greySegments}
        points={() => [
          [vW() * greyEdges[yearIndex], friseY()],
          [vW() * greyEdges[yearIndex + 1], friseY()],
        ]}
        stroke={PALETTE.ghost}
        lineWidth={4}
        end={0}
        opacity={0}
      />
    ))}
    {greyEdges.map((edgeFraction, edgeIndex) => (
      <Rect
        key={`grey-tick-${edgeIndex}`}
        ref={greyTicks}
        width={() => vW() * 0.0025}
        height={() => vH() * 0.03}
        fill={PALETTE.ghost}
        x={() => vW() * edgeFraction}
        y={friseY}
        opacity={0}
      />
    ))}
    {['AN 1', 'AN 2', 'AN 3'].map((yearText, yearIndex) => (
      <Txt
        key={`year-label-${yearIndex}`}
        ref={yearLabels}
        text={yearText}
        fill={PALETTE.ghost}
        fontSize={() => vW() * 0.011}
        fontFamily={FONT_MONO}
        fontWeight={700}
        x={() => vW() * (greyEdges[yearIndex] + greyEdges[yearIndex + 1]) / 2}
        y={() => friseY() + vH() * 0.05}
        opacity={0}
      />
    ))}

    {/* Bague */}
    <Icon
      key="ring-icon"
      ref={ringIcon}
      icon="mdi:ring"
      color={PALETTE.cream}
      size={() => vW() * 0.05}
      x={ringStartX}
      y={friseY}
      opacity={0}
    />

    {/* Compteur de tâches */}
    <Icon
      key="counter-icon"
      ref={counterIcon}
      icon="mdi:check-circle-outline"
      color={PALETTE.ghost}
      size={() => vW() * 0.04}
      x={() => vW() * -0.25}
      y={() => vH() * -0.2}
      opacity={0}
    />
    <Txt
      key="counter-label"
      ref={counterLabel}
      text="# de tâches"
      fill={PALETTE.ghost}
      fontSize={() => vW() * 0.016}
      fontFamily={FONT_MONO}
      fontWeight={700}
      offset={[-1, 0]}
      x={() => vW() * -0.21}
      y={() => vH() * -0.29}
      opacity={0}
    />
    <Txt
      key="counter-text"
      ref={counterText}
      text={() => String(Math.round(taskCount()))}
      fill={PALETTE.ghost}
      fontSize={() => vW() * 0.075}
      fontFamily={FONT_MONO}
      fontWeight={700}
      offset={[-1, 0]}
      x={() => vW() * -0.21}
      y={() => vH() * -0.2}
      opacity={0}
    />

    {/* Le salon : coup de pied */}
    <Circle
      key="salon-ripple"
      ref={salonRipple}
      width={() => vW() * 0.016}
      height={() => vW() * 0.016}
      stroke={PALETTE.jaune}
      lineWidth={3}
      x={salonX}
      y={friseY}
      opacity={0}
    />
    <Circle
      key="salon-dot"
      ref={salonDot}
      width={() => vW() * 0.016}
      height={() => vW() * 0.016}
      fill={PALETTE.jaune}
      x={salonX}
      y={() => vH() * -0.45}
      opacity={0}
    />
    <Txt
      key="salon-label"
      ref={salonLabel}
      text="13/09/2025"
      fill={PALETTE.jaune}
      fontSize={() => vW() * 0.014}
      fontFamily={FONT_MONO}
      fontWeight={700}
      x={salonX}
      y={() => friseY() + vH() * 0.11}
      opacity={0}
    />

    {/* Un an : la frise jaune */}
    <Line
      key="yellow-line"
      ref={yellowLine}
      points={() => [[salonX(), friseY()], [arriveeX(), friseY()]]}
      stroke={PALETTE.jaune}
      lineWidth={6}
      end={0}
      opacity={0}
    />
    {Array.from({length: MICRO_ICON_COUNT}, (_, iconIndex) => (
      <Icon
        key={`micro-icon-${iconIndex}`}
        ref={microIcons}
        icon={MICRO_ICON_NAMES[iconIndex % MICRO_ICON_NAMES.length]}
        color={iconIndex % MICRO_ICON_NAMES.length === 0 ? PALETTE.jaune : PALETTE.secondary}
        size={() => vW() * 0.024}
        x={() => microIconX(iconIndex)}
        y={() => microIconY(iconIndex)}
        opacity={0}
      />
    ))}
    <Icon
      key="heart-icon"
      ref={heartIcon}
      icon="mdi:heart"
      color={PALETTE.jaune}
      size={() => vW() * 0.045}
      x={heartX}
      y={friseY}
      scale={0}
      opacity={0}
    />
    <Txt
      key="arrivee-label"
      ref={arriveeLabel}
      text="22/08/2026"
      fill={PALETTE.jaune}
      fontSize={() => vW() * 0.014}
      fontFamily={FONT_MONO}
      fontWeight={700}
      x={() => vW() * 0.35}
      y={() => friseY() + vH() * 0.11}
      opacity={0}
    />

    {/* Fin : une seule icône projet face à l'anneau */}
    <Txt
      key="question-sign"
      ref={questionSign}
      text="≟"
      fill={PALETTE.jaune}
      fontSize={() => vW() * 0.09}
      fontFamily={FONT_MONO}
      fontWeight={700}
      opacity={0}
    />
    <Icon
      key="project-icon"
      ref={projectIcon}
      icon="mdi:clipboard-check-outline"
      color={PALETTE.jaune}
      size={() => vW() * 0.09}
      x={() => vW() * 0.14}
      y={0}
      scale={0.3}
      opacity={0}
    />
  </>);

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Fait apparaître les icônes d'activité au passage du front jaune. */
  function* spawnMicroIcons() {
    let elapsed = 0;
    for (let iconIndex = 0; iconIndex < MICRO_ICON_COUNT; iconIndex++) {
      const spawnTime = microIconProgress(iconIndex) * yellowDuration;
      yield* waitFor(Math.max(0, spawnTime - elapsed));
      elapsed = spawnTime;
      microIcons[iconIndex].scale(0.4);
      yield microIcons[iconIndex].opacity(1, 0.18);
      yield microIcons[iconIndex].scale(1, 0.22, easeOutCubic);
    }
  }

  // ── ANIMATION ──────────────────────────────────────────────────────────────

  // 1. fiancailles — trois ans gris, compteur figé à 0
  yield* waitUntil('fiancailles');
  yield* all(
    gridRef().opacity(0.07, 0.8),
    ringIcon().opacity(1, 0.6),
    counterIcon().opacity(1, 0.6),
    counterText().opacity(1, 0.6),
    counterLabel().opacity(1, 0.6),
  );
  greyTicks[0].opacity(1);
  for (let yearIndex = 0; yearIndex < 3; yearIndex++) {
    greySegments[yearIndex].opacity(1);
    yield* all(
      greySegments[yearIndex].end(1, yearDuration, linear),
      greyTicks[yearIndex + 1].opacity(1, yearDuration),
      yearLabels[yearIndex].opacity(1, yearDuration * 0.6),
    );
  }

  // 2. salon — le point jaune tombe, le segment suivant va s'allumer
  yield* waitUntil('salon');
  salonDot().opacity(1);
  yield* salonDot().y(friseY(), 0.55, easeInCubic);
  salonRipple().scale(1);
  salonRipple().opacity(1);
  yield* all(
    salonRipple().scale(4, 0.6, easeOutCubic),
    salonRipple().opacity(0, 0.6),
    salonLabel().opacity(1, 0.5),
    counterText().fill(PALETTE.jaune, 0.4),
    counterLabel().fill(PALETTE.jaune, 0.4),
    counterIcon().color(PALETTE.jaune, 0.4),
  );

  // 3. un-an — la frise jaune file, tout s'empile de plus en plus vite
  yield* waitUntil('un-an');
  yellowLine().opacity(1);
  yield* all(
    yellowLine().end(1, yellowDuration, linear),
    taskCount(TASK_TOTAL, yellowDuration, easeInCubic),
    spawnMicroIcons(),
  );
  heartIcon().opacity(1);
  yield* all(
    heartIcon().scale(1, 0.5, easeOutCubic),
    arriveeLabel().opacity(1, 0.5),
  );
  yield* waitFor(0.6);

  // 4. question — tout se condense en une icône projet face à l'anneau
  yield* waitUntil('question');
  const projectTargetX = vW() * 0.14;
  yield* all(
    ...microIcons.map(microIcon => all(
      microIcon.x(projectTargetX, 1.0, easeInOutCubic),
      microIcon.y(0, 1.0, easeInOutCubic),
      microIcon.scale(0.3, 1.0, easeInOutCubic),
      microIcon.opacity(0, 1.0, easeInCubic),
    )),
    heartIcon().x(projectTargetX, 1.0, easeInOutCubic),
    heartIcon().y(0, 1.0, easeInOutCubic),
    heartIcon().opacity(0, 1.0, easeInCubic),
    ...greySegments.map(segment => segment.opacity(0, 0.7)),
    ...greyTicks.map(tick => tick.opacity(0, 0.7)),
    ...yearLabels.map(label => label.opacity(0, 0.7)),
    yellowLine().opacity(0, 0.7),
    salonDot().opacity(0, 0.7),
    salonLabel().opacity(0, 0.7),
    arriveeLabel().opacity(0, 0.7),
    counterIcon().opacity(0, 0.7),
    counterText().opacity(0, 0.7),
    counterLabel().opacity(0, 0.7),
    ringIcon().x(vW() * -0.14, 1.0, easeInOutCubic),
    ringIcon().y(0, 1.0, easeInOutCubic),
  );
  yield* all(
    projectIcon().opacity(1, 0.4),
    projectIcon().scale(1, 0.5, easeOutCubic),
    questionSign().opacity(1, 0.5),
  );
  yield* waitFor(1.2);
});
