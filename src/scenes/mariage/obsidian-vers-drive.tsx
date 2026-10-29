/**
 * obsidian-vers-drive — Du coffre Obsidian au Google Drive (CRISE).
 *
 * Deux ordinateurs distingués par la couleur de leur propriétaire (bleu / rose).
 * Sur le PC rose, Obsidian + Syncthing tournent mais le badge de compte est
 * celui du PC bleu. Édition simultanée → fichier en conflit. Les Markdown
 * glissent vers Google Drive, le plan existe en deux versions qui divergent,
 * puis les deux curseurs écrivent dans le Drive sans conflit.
 *
 * Battements : config · simultane · drive · deux-versions · bascule
 * Couleur active : rose (conflit) → vert (Drive, écriture partagée).
 */
import {makeScene2D, Circle, Grid, Layout, Rect, Txt, Icon} from '@motion-canvas/2d';
import {
  createRef,
  Reference,
  all,
  sequence,
  waitFor,
  waitUntil,
  easeInOutCubic,
  easeOutCubic,
} from '@motion-canvas/core';
import {DiagramNode} from '../../components';
import {PALETTE} from '../../theme';
import {sfx, sfxReset, sfxFlush} from '../../sfx';

const MONO = 'JetBrains Mono, DM Mono, monospace';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  view.fill(PALETTE.bg);

  // ── Géométrie commune ──────────────────────────────────────────────────────
  const pcBlueX   = () => -vW() * 0.32;
  const pcRoseX   = () => +vW() * 0.32;
  const pcY       = () => -vH() * 0.08;
  const planX     = () => 0;
  const planY     = () => -vH() * 0.08;
  const driveX    = () => 0;
  const driveY    = () => +vH() * 0.37;
  const driveCardY = () => +vH() * 0.12;
  const personY   = () => -vH() * 0.34;
  const appsY     = () => +vH() * 0.12;
  const badgeBlueX = () => pcBlueX() + vW() * 0.075;
  const badgeRoseX = () => pcRoseX() + vW() * 0.075;
  const badgeY    = () => pcY() - vH() * 0.125;

  // ── Refs ───────────────────────────────────────────────────────────────────
  const gridRef          = createRef<Grid>();
  const pcBlueNode       = createRef<DiagramNode>();
  const pcRoseNode       = createRef<DiagramNode>();
  const personBlueIcon   = createRef<Icon>();
  const personRoseIcon   = createRef<Icon>();
  const obsidianBlueIcon = createRef<Icon>();
  const obsidianRoseIcon = createRef<Icon>();
  const syncBlueIcon     = createRef<Icon>();
  const syncRoseIcon     = createRef<Icon>();
  const badgeBlue        = createRef<Circle>();
  const badgeRose        = createRef<Circle>();
  const mismatchRing     = createRef<Circle>();
  const cursorBlue       = createRef<Icon>();
  const cursorRose       = createRef<Icon>();
  const driveNode        = createRef<DiagramNode>();
  const planCard         = createRef<Rect>();
  const conflictCard     = createRef<Rect>();
  const driveCard        = createRef<Rect>();
  const planBars:     Reference<Rect>[] = [];
  const conflictBars: Reference<Rect>[] = [];
  const driveBars:    Reference<Rect>[] = [];
  const markdownFileRefs = [createRef<Rect>(), createRef<Rect>(), createRef<Rect>()];
  const markdownStartX = [() => pcBlueX(), () => 0, () => pcRoseX()];
  const markdownStartY = [() => appsY(), () => planY() + vH() * 0.1, () => appsY()];

  // ── Helpers de construction ────────────────────────────────────────────────
  /** Carte « plan.md » : libellé + trois barres de contenu (largeurs en fraction de vW). */
  const buildPlanCard = (
    keyPrefix: string,
    cardRef: Reference<Rect>,
    barRefs: Reference<Rect>[],
    barWidths: number[],
  ) => (
    <Rect
      key={keyPrefix}
      ref={cardRef}
      width={() => vW() * 0.085}
      height={() => vH() * 0.15}
      fill={PALETTE.bgCard}
      stroke={PALETTE.ghost}
      lineWidth={2}
      radius={() => vW() * 0.004}
      opacity={0}
    >
      <Txt
        key={`${keyPrefix}-label`}
        text="plan.md"
        fill={PALETTE.secondary}
        fontSize={() => vW() * 0.0105}
        fontFamily={MONO}
        fontWeight={700}
        y={() => vH() * -0.048}
      />
      {barWidths.map((barWidth, barIndex) => {
        const barRef = createRef<Rect>();
        barRefs.push(barRef);
        return (
          <Rect
            key={`${keyPrefix}-bar-${barIndex}`}
            ref={barRef}
            offset={[-1, 0]}
            width={() => vW() * barWidth}
            height={() => vH() * 0.012}
            x={() => vW() * -0.032}
            y={() => vH() * (-0.005 + barIndex * 0.03)}
            fill={PALETTE.ghost}
            radius={() => vW() * 0.001}
          />
        );
      })}
    </Rect>
  );

  /** Ordinateur : nœud + badge de compte (couleur du compte connecté). */
  const buildBadge = (
    keyPrefix: string,
    badgeRef: Reference<Circle>,
    badgeX: () => number,
    accountColor: string,
  ) => (
    <Circle
      key={keyPrefix}
      ref={badgeRef}
      size={() => vW() * 0.04}
      x={badgeX}
      y={badgeY}
      fill={PALETTE.bgCard}
      stroke={accountColor}
      lineWidth={3}
      opacity={0}
    >
      <Icon
        key={`${keyPrefix}-icon`}
        icon="mdi:account"
        color={accountColor}
        size={() => vW() * 0.026}
      />
    </Circle>
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

    {/* Ordinateur d'Alex (bleu) */}
    <DiagramNode key="pc-blue-node" ref={pcBlueNode}
      iconName="mdi:monitor"
      label="PC"
      color={PALETTE.blue}
      initialState="active"
      width={() => vW() * 0.17}
      height={() => vH() * 0.3}
      x={pcBlueX} y={pcY}
      opacity={0}
    />
    {/* Ordinateur de sa femme (rose) */}
    <DiagramNode key="pc-rose-node" ref={pcRoseNode}
      iconName="mdi:monitor"
      label="PC"
      color={PALETTE.rose}
      initialState="active"
      width={() => vW() * 0.17}
      height={() => vH() * 0.3}
      x={pcRoseX} y={pcY}
      opacity={0}
    />

    {/* Propriétaires */}
    <Icon key="person-blue-icon" ref={personBlueIcon}
      icon="mdi:account"
      color={PALETTE.blue}
      size={() => vW() * 0.055}
      x={pcBlueX} y={personY}
      opacity={0}
    />
    <Icon key="person-rose-icon" ref={personRoseIcon}
      icon="mdi:account"
      color={PALETTE.rose}
      size={() => vW() * 0.055}
      x={pcRoseX} y={personY}
      opacity={0}
    />

    {/* Applications installées : Obsidian + Syncthing */}
    <Icon key="obsidian-blue-icon" ref={obsidianBlueIcon}
      icon="logos:obsidian-icon"
      size={() => vW() * 0.04}
      x={() => pcBlueX() - vW() * 0.035} y={appsY}
      opacity={0}
    />
    <Icon key="sync-blue-icon" ref={syncBlueIcon}
      icon="simple-icons:syncthing"
      color={PALETTE.secondary}
      size={() => vW() * 0.036}
      x={() => pcBlueX() + vW() * 0.035} y={appsY}
      opacity={0}
    />
    <Icon key="obsidian-rose-icon" ref={obsidianRoseIcon}
      icon="logos:obsidian-icon"
      size={() => vW() * 0.04}
      x={() => pcRoseX() - vW() * 0.035} y={appsY}
      opacity={0}
    />
    <Icon key="sync-rose-icon" ref={syncRoseIcon}
      icon="simple-icons:syncthing"
      color={PALETTE.secondary}
      size={() => vW() * 0.036}
      x={() => pcRoseX() + vW() * 0.035} y={appsY}
      opacity={0}
    />

    {/* Badges de compte : le PC rose affiche le compte bleu */}
    {buildBadge('badge-blue', badgeBlue, badgeBlueX, PALETTE.blue)}
    {buildBadge('badge-rose', badgeRose, badgeRoseX, PALETTE.blue)}
    <Circle key="mismatch-ring" ref={mismatchRing}
      size={() => vW() * 0.065}
      x={badgeRoseX} y={badgeY}
      fill={'#00000000'}
      stroke={PALETTE.rose}
      lineWidth={3}
      opacity={0}
    />

    {/* Google Drive */}
    <DiagramNode key="drive-node" ref={driveNode}
      iconName="logos:google-drive"
      label="DRIVE"
      color={PALETTE.vert}
      initialState="idle"
      width={() => vW() * 0.16}
      height={() => vH() * 0.2}
      x={driveX} y={driveY}
      opacity={0}
    />

    {/* Les trois cartes « plan » : version locale, copie en conflit, version Drive */}
    <Layout key="plan-cards-origin" x={planX} y={planY}>
      {buildPlanCard('plan-card', planCard, planBars, [0.064, 0.05, 0.038])}
      {buildPlanCard('conflict-card', conflictCard, conflictBars, [0.064, 0.05, 0.038])}
    </Layout>
    <Layout key="drive-card-origin" x={driveX} y={driveCardY}>
      {buildPlanCard('drive-card', driveCard, driveBars, [0.064, 0.03, 0.056])}
    </Layout>

    {/* Fichiers Markdown en transit vers le Drive */}
    {markdownFileRefs.map((markdownFileRef, fileIndex) => (
      <Rect
        key={`markdown-file-${fileIndex}`}
        ref={markdownFileRef}
        width={() => vW() * 0.04}
        height={() => vH() * 0.06}
        x={markdownStartX[fileIndex]}
        y={markdownStartY[fileIndex]}
        fill={PALETTE.bgCard}
        stroke={PALETTE.vert}
        lineWidth={2}
        radius={() => vW() * 0.003}
        opacity={0}
      >
        <Txt
          key={`markdown-file-${fileIndex}-label`}
          text=".md"
          fill={PALETTE.vert}
          fontSize={() => vW() * 0.014}
          fontFamily={MONO}
          fontWeight={700}
        />
      </Rect>
    ))}

    {/* Curseurs d'édition */}
    <Icon key="cursor-blue" ref={cursorBlue}
      icon="mdi:cursor-default"
      color={PALETTE.blue}
      size={() => vW() * 0.04}
      x={pcBlueX} y={pcY}
      opacity={0}
    />
    <Icon key="cursor-rose" ref={cursorRose}
      icon="mdi:cursor-default"
      color={PALETTE.rose}
      size={() => vW() * 0.04}
      x={pcRoseX} y={pcY}
      opacity={0}
    />
  </>);

  // ── Helpers d'animation ────────────────────────────────────────────────────
  /** Les barres qui diffèrent entre la version locale et la version Drive clignotent en rose. */
  function* blinkDivergence() {
    const divergentBars = [planBars[1], planBars[2], driveBars[1], driveBars[2]];
    yield* all(...divergentBars.map(barRef => barRef().fill(PALETTE.rose, 0.25)));
    yield* all(...divergentBars.map(barRef => barRef().fill(PALETTE.ghost, 0.25)));
  }

  // ── ANIMATION ──────────────────────────────────────────────────────────────
  sfxReset();
  yield* gridRef().opacity(0.07, 0.8);

  // 1. config — Obsidian + Syncthing sur les deux PC ; le badge du PC rose est bleu
  yield* waitUntil('config');
  yield* sequence(0.2,
    all(pcBlueNode().opacity(1, 0.5), personBlueIcon().opacity(1, 0.5)),
    all(pcRoseNode().opacity(1, 0.5), personRoseIcon().opacity(1, 0.5)),
  );
  yield* sequence(0.1,
    obsidianBlueIcon().opacity(1, 0.3),
    syncBlueIcon().opacity(1, 0.3),
    obsidianRoseIcon().opacity(1, 0.3),
    syncRoseIcon().opacity(1, 0.3),
  );
  sfx('activate');
  yield* all(
    syncBlueIcon().rotation(360, 1.6, easeInOutCubic),
    syncRoseIcon().rotation(360, 1.6, easeInOutCubic),
    sequence(0.3, badgeBlue().opacity(1, 0.3), badgeRose().opacity(1, 0.3)),
  );
  mismatchRing().opacity(1);
  for (let pulse = 0; pulse < 2; pulse++) {
    if (pulse === 0) sfx('emphasis', 0.7);
    yield* all(mismatchRing().scale(1.35, 0.35), mismatchRing().opacity(0.3, 0.35));
    yield* all(mismatchRing().scale(1, 0.3), mismatchRing().opacity(1, 0.3));
  }

  // 2. simultane — deux curseurs sur le même fichier → conflit
  yield* waitUntil('simultane');
  yield* all(mismatchRing().opacity(0, 0.3), planCard().opacity(1, 0.4));
  cursorBlue().opacity(1);
  cursorRose().opacity(1);
  sfx('travel', 0.4);
  yield* all(
    cursorBlue().position([planX() - vW() * 0.012, planY() + vH() * 0.012], 0.9, easeInOutCubic),
    cursorRose().position([planX() + vW() * 0.012, planY() + vH() * 0.012], 0.9, easeInOutCubic),
  );
  for (let shake = 0; shake < 3; shake++) {
    yield* planCard().x(vW() * 0.006, 0.06);
    yield* planCard().x(vW() * -0.006, 0.06);
  }
  yield* planCard().x(0, 0.06);
  conflictCard().opacity(1);
  sfx('failure', 0.8);
  yield* all(
    conflictCard().x(vW() * 0.075, 0.5, easeOutCubic),
    conflictCard().y(vH() * 0.04, 0.5, easeOutCubic),
    planCard().stroke(PALETTE.rose, 0.3),
    conflictCard().stroke(PALETTE.rose, 0.3),
  );
  yield* waitFor(0.6);

  // 3. drive — les Markdown glissent vers Google Drive
  yield* waitUntil('drive');
  yield* all(
    conflictCard().opacity(0, 0.4),
    planCard().stroke(PALETTE.ghost, 0.4),
    cursorBlue().opacity(0, 0.4),
    cursorRose().opacity(0, 0.4),
    driveNode().opacity(1, 0.5),
  );
  // la séquence démarre 0.5 s plus tard (fondu du Drive) : départ à 0.3·i, arrivée 0.9 s après
  markdownFileRefs.forEach((_, fileIndex) => {
    sfx('travel', 0.5, 0.5 + 0.3 * fileIndex);
  });
  sfx('activate', 1, 0.5 + 0.6 + 0.9);
  yield* sequence(0.3, ...markdownFileRefs.map((markdownFileRef) =>
    all(
      markdownFileRef().opacity(1, 0.2),
      markdownFileRef().position([driveX(), driveY()], 0.9, easeInOutCubic),
      markdownFileRef().scale(0.4, 0.9, easeInOutCubic),
    ),
  ));
  yield* all(
    ...markdownFileRefs.map(markdownFileRef => markdownFileRef().opacity(0, 0.2)),
    driveNode().setState('active', 0.3),
  );

  // 4. deux-versions — le même plan à deux endroits, contenus qui divergent
  yield* waitUntil('deux-versions');
  driveCard().position([0, driveY() - driveCardY()]);
  yield* all(
    driveCard().opacity(1, 0.3),
    driveCard().position([0, 0], 0.7, easeInOutCubic),
  );
  sfx('emphasis', 0.7);
  yield* blinkDivergence();
  yield* blinkDivergence();

  // 5. bascule — Obsidian s'estompe, les deux curseurs écrivent dans le Drive
  yield* waitUntil('bascule');
  const driveCardWorldY = driveCardY();
  cursorBlue().position([pcBlueX(), pcY()]);
  cursorRose().position([pcRoseX(), pcY()]);
  yield* all(
    planCard().opacity(0.2, 0.5),
    obsidianBlueIcon().opacity(0.25, 0.5),
    obsidianRoseIcon().opacity(0.25, 0.5),
    syncBlueIcon().opacity(0.25, 0.5),
    syncRoseIcon().opacity(0.25, 0.5),
    cursorBlue().opacity(1, 0.4),
    cursorRose().opacity(1, 0.4),
  );
  sfx('travel', 0.4);
  yield* all(
    cursorBlue().position([driveX() - vW() * 0.03, driveCardWorldY + vH() * 0.025], 0.9, easeInOutCubic),
    cursorRose().position([driveX() - vW() * 0.03, driveCardWorldY + vH() * 0.055], 0.9, easeInOutCubic),
  );
  yield* all(
    driveBars[1]().fill(PALETTE.vert, 0.3),
    driveBars[2]().fill(PALETTE.vert, 0.3),
  );
  yield* driveBars[0]().fill(PALETTE.vert, 0.3);
  sfx('success');
  yield* all(
    driveCard().stroke(PALETTE.vert, 0.3),
    driveNode().setState('success', 0.3),
  );
  yield* waitFor(0.8);
  sfxFlush('obsidian-vers-drive');
});
