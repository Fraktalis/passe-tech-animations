/**
 * decision-orale — BASCULE : « On avait dit quoi déjà ? ».
 *
 * Une décision prise à l'oral s'envole en particules ; chacun repart avec sa
 * propre version, qui diverge ; six mois plus tard les deux versions se
 * heurtent. On rejoue : la décision est tapée dans un document commun que les
 * deux lisent — il reste net quand le compteur repasse à +6.
 *
 * Couleur active : rose (conflit) → vert (l'écrit tient).
 * Les deux mariés : icônes sans nom, Alex bleu, sa femme rose.
 *
 * Battements : oral · envol · deux-versions · six-mois · ecrits-restent
 */
import {makeScene2D, Circle, Grid, Icon, Rect, Txt} from '@motion-canvas/2d';
import {
  all,
  cancel,
  createRef,
  createRefArray,
  createSignal,
  easeInCubic,
  easeInOutCubic,
  easeOutBack,
  easeOutCubic,
  linear,
  loop,
  sequence,
  waitFor,
  waitUntil,
} from '@motion-canvas/core';
import {ConnectionArrow} from '../../components';
import {PALETTE} from '../../theme';

const FONT_MONO = 'JetBrains Mono, DM Mono, monospace';
const PARTICLE_COUNT = 14;
const DECISION_TEXT = '✓ décision';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  view.fill(PALETTE.bg);

  // ── Géométrie ──────────────────────────────────────────────────────────────
  const personX = 0.25;
  const personY = () => vH() * 0.2;
  const bubbleY = () => vH() * -0.1;
  const sharedBubbleY = () => vH() * -0.02;
  const personalBubbleWidth = () => vW() * 0.18;
  const personalBubbleHeight = () => vH() * 0.1;
  /** Position de repos des bulles personnelles (fraction de vW). */
  const restingFraction = 0.25;
  /** Position de choc : les bords internes se touchent presque. */
  const collisionFraction = 0.095;
  const bounceFraction = 0.125;

  // Particules : une grille 7 × 2 dans la bulle partagée, trajectoires déterministes.
  const particleStartX = (particleIndex: number) =>
    vW() * ((particleIndex % 7) - 3) * 0.028;
  const particleStartY = (particleIndex: number) =>
    sharedBubbleY() + vH() * (Math.floor(particleIndex / 7) - 0.5) * 0.045;
  const particleDriftX = (particleIndex: number) =>
    vW() * (((particleIndex * 53) % 9) - 4) * 0.012;
  const particleRise = (particleIndex: number) =>
    vH() * (0.3 + ((particleIndex * 29) % 7) * 0.03);

  // ── Signaux & refs ─────────────────────────────────────────────────────────
  const monthCount = createSignal(0);

  const gridRef = createRef<Grid>();
  const alexIcon = createRef<Icon>();
  const wifeIcon = createRef<Icon>();
  const sharedBubble = createRef<Rect>();
  const waveLeft = createRef<Icon>();
  const waveRight = createRef<Icon>();
  const particles = createRefArray<Circle>();
  const alexBubble = createRef<Rect>();
  const wifeBubble = createRef<Rect>();
  const monthText = createRef<Txt>();
  const conflictFlash = createRef<Circle>();
  const notEqualSign = createRef<Txt>();
  const documentCard = createRef<Rect>();
  const documentText = createRef<Txt>();
  const alexArrow = createRef<ConnectionArrow>();
  const wifeArrow = createRef<ConnectionArrow>();

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

    {/* Les deux mariés, face à face */}
    <Icon
      key="icon-alex"
      ref={alexIcon}
      icon="mdi:account"
      color={PALETTE.blue}
      size={() => vW() * 0.08}
      x={() => vW() * -personX}
      y={personY}
      opacity={0}
    />
    <Icon
      key="icon-wife"
      ref={wifeIcon}
      icon="mdi:account"
      color={PALETTE.rose}
      size={() => vW() * 0.08}
      x={() => vW() * personX}
      y={personY}
      opacity={0}
    />

    {/* Bulle de parole commune + ondes audio */}
    <Rect
      key="shared-bubble"
      ref={sharedBubble}
      width={() => vW() * 0.2}
      height={() => vH() * 0.12}
      radius={() => vW() * 0.012}
      fill={PALETTE.bgCard}
      stroke={PALETTE.cream}
      lineWidth={2}
      y={sharedBubbleY}
      scale={0.6}
      opacity={0}
    >
      <Txt
        key="shared-bubble-text"
        text={DECISION_TEXT}
        fill={PALETTE.cream}
        fontSize={() => vW() * 0.022}
        fontFamily={FONT_MONO}
        fontWeight={700}
      />
    </Rect>
    <Icon
      key="wave-left"
      ref={waveLeft}
      icon="mdi:waveform"
      color={PALETTE.secondary}
      size={() => vW() * 0.04}
      x={() => vW() * -0.15}
      y={sharedBubbleY}
      opacity={0}
    />
    <Icon
      key="wave-right"
      ref={waveRight}
      icon="mdi:waveform"
      color={PALETTE.secondary}
      size={() => vW() * 0.04}
      x={() => vW() * 0.15}
      y={sharedBubbleY}
      opacity={0}
    />

    {/* Particules de la bulle qui s'envole */}
    {Array.from({length: PARTICLE_COUNT}, (_, particleIndex) => (
      <Circle
        key={`particle-${particleIndex}`}
        ref={particles}
        width={() => vW() * 0.008}
        height={() => vW() * 0.008}
        fill={PALETTE.cream}
        x={() => particleStartX(particleIndex)}
        y={() => particleStartY(particleIndex)}
        opacity={0}
      />
    ))}

    {/* Une version par personne */}
    <Rect
      key="alex-bubble"
      ref={alexBubble}
      width={personalBubbleWidth}
      height={personalBubbleHeight}
      radius={() => vW() * 0.012}
      fill={PALETTE.bgCard}
      stroke={PALETTE.blue}
      lineWidth={2}
      x={() => vW() * -restingFraction}
      y={bubbleY}
      scale={0}
      opacity={0}
    >
      <Txt
        key="alex-bubble-text"
        text="80 invités"
        fill={PALETTE.blue}
        fontSize={() => vW() * 0.02}
        fontFamily={FONT_MONO}
        fontWeight={700}
      />
    </Rect>
    <Rect
      key="wife-bubble"
      ref={wifeBubble}
      width={personalBubbleWidth}
      height={personalBubbleHeight}
      radius={() => vW() * 0.012}
      fill={PALETTE.bgCard}
      stroke={PALETTE.rose}
      lineWidth={2}
      x={() => vW() * restingFraction}
      y={bubbleY}
      scale={0}
      opacity={0}
    >
      <Txt
        key="wife-bubble-text"
        text="120 invités"
        fill={PALETTE.rose}
        fontSize={() => vW() * 0.02}
        fontFamily={FONT_MONO}
        fontWeight={700}
      />
    </Rect>

    {/* Compteur de mois, choc, signe ≠ */}
    <Txt
      key="month-text"
      ref={monthText}
      text={() => `+${Math.round(monthCount())} mois`}
      fill={PALETTE.secondary}
      fontSize={() => vW() * 0.04}
      fontFamily={FONT_MONO}
      fontWeight={700}
      y={() => vH() * -0.33}
      opacity={0}
    />
    <Circle
      key="conflict-flash"
      ref={conflictFlash}
      width={() => vW() * 0.05}
      height={() => vW() * 0.05}
      fill={PALETTE.rose}
      y={bubbleY}
      scale={0.3}
      opacity={0}
    />
    <Txt
      key="not-equal-sign"
      ref={notEqualSign}
      text="≠"
      fill={PALETTE.rose}
      fontSize={() => vW() * 0.045}
      fontFamily={FONT_MONO}
      fontWeight={700}
      y={bubbleY}
      opacity={0}
    />

    {/* Le document commun */}
    <Rect
      key="document-card"
      ref={documentCard}
      width={() => vW() * 0.15}
      height={() => vH() * 0.3}
      radius={() => vW() * 0.008}
      fill={PALETTE.bgCard}
      stroke={PALETTE.cream}
      lineWidth={2}
      y={() => vH() * -0.02}
      opacity={0}
    >
      <Icon
        key="document-icon"
        icon="mdi:file-document-outline"
        color={PALETTE.cream}
        size={() => vW() * 0.05}
        y={() => vH() * -0.06}
      />
      <Txt
        key="document-text"
        ref={documentText}
        text=""
        fill={PALETTE.cream}
        fontSize={() => vW() * 0.015}
        fontFamily={FONT_MONO}
        fontWeight={700}
        y={() => vH() * 0.08}
      />
    </Rect>
    <ConnectionArrow
      key="alex-arrow"
      ref={alexArrow}
      from={() => [vW() * -(personX - 0.045), personY() - vH() * 0.07]}
      to={() => [vW() * -0.085, vH() * 0.04]}
      stroke={PALETTE.cream}
      routing={0}
      arrowSize={vW() * 0.007}
      end={0}
      opacity={0}
    />
    <ConnectionArrow
      key="wife-arrow"
      ref={wifeArrow}
      from={() => [vW() * (personX - 0.045), personY() - vH() * 0.07]}
      to={() => [vW() * 0.085, vH() * 0.04]}
      stroke={PALETTE.cream}
      routing={0}
      arrowSize={vW() * 0.007}
      end={0}
      opacity={0}
    />
  </>);

  // ── ANIMATION ──────────────────────────────────────────────────────────────

  // 1. oral — une décision commune, rendue en ondes audio
  yield* waitUntil('oral');
  yield* all(
    gridRef().opacity(0.07, 0.8),
    alexIcon().opacity(1, 0.6),
    wifeIcon().opacity(1, 0.6),
  );
  yield* all(
    sharedBubble().opacity(1, 0.4),
    sharedBubble().scale(1, 0.5, easeOutBack),
    waveLeft().opacity(1, 0.4),
    waveRight().opacity(1, 0.4),
  );
  const waveTask = yield loop(Infinity, function* () {
    yield* all(
      waveLeft().scale(1.3, 0.45, easeInOutCubic),
      waveRight().scale(1.3, 0.45, easeInOutCubic),
    );
    yield* all(
      waveLeft().scale(1, 0.45, easeInOutCubic),
      waveRight().scale(1, 0.45, easeInOutCubic),
    );
  });
  yield* waitFor(1.6);

  // 2. envol — la bulle se fragmente et disparaît vers le haut
  yield* waitUntil('envol');
  cancel(waveTask);
  yield* all(
    sharedBubble().opacity(0, 0.2),
    waveLeft().opacity(0, 0.4),
    waveRight().opacity(0, 0.4),
    ...particles.map(particle => particle.opacity(1, 0.2)),
  );
  yield* sequence(0.04,
    ...particles.map((particle, particleIndex) => all(
      particle.x(particleStartX(particleIndex) + particleDriftX(particleIndex), 1.6, easeOutCubic),
      particle.y(particleStartY(particleIndex) - particleRise(particleIndex), 1.6, easeOutCubic),
      particle.opacity(0, 1.6, easeInCubic),
    )),
  );

  // 3. deux-versions — chacun repart avec la sienne
  yield* waitUntil('deux-versions');
  alexBubble().opacity(1);
  wifeBubble().opacity(1);
  yield* all(
    alexBubble().scale(1, 0.5, easeOutBack),
    wifeBubble().scale(1, 0.5, easeOutBack),
  );
  yield* waitFor(0.8);

  // 4. six-mois — le temps passe, les deux versions se heurtent
  yield* waitUntil('six-mois');
  yield* monthText().opacity(1, 0.4);
  yield* all(
    monthCount(6, 3.2, linear),
    alexBubble().x(vW() * -collisionFraction, 3.2, easeInCubic),
    wifeBubble().x(vW() * collisionFraction, 3.2, easeInCubic),
  );
  conflictFlash().opacity(0.7);
  yield* all(
    conflictFlash().scale(7, 0.6, easeOutCubic),
    conflictFlash().opacity(0, 0.6),
    alexBubble().stroke(PALETTE.rose, 0.1),
    wifeBubble().stroke(PALETTE.rose, 0.1),
    alexBubble().lineWidth(5, 0.1),
    wifeBubble().lineWidth(5, 0.1),
    monthText().fill(PALETTE.rose, 0.2),
    alexBubble().x(vW() * -bounceFraction, 0.4, easeOutCubic),
    wifeBubble().x(vW() * bounceFraction, 0.4, easeOutCubic),
    notEqualSign().opacity(1, 0.4),
  );
  yield* waitFor(1.0);

  // 5. ecrits-restent — on rejoue : la décision est tapée dans un document commun
  yield* waitUntil('ecrits-restent');
  yield* all(
    alexBubble().opacity(0, 0.5),
    wifeBubble().opacity(0, 0.5),
    notEqualSign().opacity(0, 0.5),
    monthCount(0, 0.8, easeInOutCubic),
    monthText().fill(PALETTE.secondary, 0.5),
  );
  yield* documentCard().opacity(1, 0.5);
  for (let charCount = 1; charCount <= DECISION_TEXT.length; charCount++) {
    yield* documentText().text(DECISION_TEXT.substring(0, charCount), 0.07);
  }
  alexArrow().opacity(1);
  wifeArrow().opacity(1);
  yield* all(
    alexArrow().end(1, 0.6, easeInOutCubic),
    wifeArrow().end(1, 0.6, easeInOutCubic),
  );
  yield* waitFor(0.4);
  yield* all(
    monthCount(6, 3.2, linear),
    documentCard().stroke(PALETTE.vert, 1.2),
    documentText().fill(PALETTE.vert, 1.2),
    alexArrow().stroke(PALETTE.vert, 1.2),
    wifeArrow().stroke(PALETTE.vert, 1.2),
    monthText().fill(PALETTE.vert, 3.2),
  );
  yield* documentCard().scale(1.06, 0.3, easeOutCubic);
  yield* documentCard().scale(1, 0.3, easeOutCubic);
  yield* waitFor(1.2);
});
