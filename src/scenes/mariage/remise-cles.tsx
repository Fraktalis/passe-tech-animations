/**
 * remise-cles — Remise et retour des clés, hébergement par hébergement (DOCUMENTS).
 *
 * Deux tableaux (Hébergement A et B) : une ligne par logement, deux colonnes
 * « remises » / « rendues ». À l'arrivée, les cases se cochent une à une. Le
 * lendemain tout le monde part en même temps : les cases « rendues » se cochent
 * très vite — sauf une ligne, qui clignote en jaune avant de se cocher.
 *
 * Couleur active : vert. Jaune uniquement pour la ligne en retard.
 */
import {makeScene2D, Grid, Layout, Rect, Txt, Icon} from '@motion-canvas/2d';
import {
  createRef,
  all,
  sequence,
  waitUntil,
  waitFor,
  easeInOutCubic,
  easeOutCubic,
} from '@motion-canvas/core';
import {PALETTE} from '../../theme';

export default makeScene2D(function* (view) {
  const vW = () => view.width();
  const vH = () => view.height();

  view.fill(PALETTE.bg);

  const MONO = 'JetBrains Mono, DM Mono, monospace';
  const DISPLAY = 'Space Grotesk, sans-serif';

  // ── Données (fictives) ─────────────────────────────────────────────────────
  const lodgings = [
    {title: 'Hébergement A', rowCount: 5, centerX: -0.225},
    {title: 'Hébergement B', rowCount: 4, centerX: 0.225},
  ];
  const lateTableIndex = 1;
  const lateRowIndex = 2;

  // ── Géométrie ──────────────────────────────────────────────────────────────
  const cardWidth = () => vW() * 0.4;
  const cardHeight = () => vH() * 0.62;
  const cardY = () => vH() * 0.02;
  const titleY = () => -cardHeight() * 0.43;
  const headerY = () => -cardHeight() * 0.3;
  const rowY = (rowIndex: number) => vH() * (-0.1 + 0.085 * rowIndex);
  const labelX = () => -vW() * 0.17;
  const remiseX = () => vW() * 0.04;
  const renduX = () => vW() * 0.135;
  const cellSize = () => vW() * 0.02;

  // ── Refs ───────────────────────────────────────────────────────────────────
  const gridRef = createRef<Grid>();
  const cardRefs = lodgings.map(() => createRef<Rect>());
  const remiseBoxRefs = lodgings.map(lodging =>
    Array.from({length: lodging.rowCount}, () => createRef<Rect>()));
  const remiseCheckRefs = lodgings.map(lodging =>
    Array.from({length: lodging.rowCount}, () => createRef<Icon>()));
  const renduBoxRefs = lodgings.map(lodging =>
    Array.from({length: lodging.rowCount}, () => createRef<Rect>()));
  const renduCheckRefs = lodgings.map(lodging =>
    Array.from({length: lodging.rowCount}, () => createRef<Icon>()));
  const lateRowHighlight = createRef<Rect>();
  const nextDayTag = createRef<Rect>();

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

    {lodgings.map((lodging, tableIndex) => (
      <Rect key={`lodging-card-${tableIndex}`} ref={cardRefs[tableIndex]}
        width={cardWidth} height={cardHeight}
        x={() => vW() * lodging.centerX} y={cardY}
        fill={PALETTE.nodeBg}
        stroke={PALETTE.secondary + '66'}
        lineWidth={2}
        radius={() => vW() * 0.006}
        opacity={0}
      >
        <Txt key={`lodging-title-${tableIndex}`}
          text={lodging.title}
          fill={PALETTE.cream}
          fontSize={() => vW() * 0.018}
          fontFamily={DISPLAY}
          fontWeight={700}
          y={titleY}
        />
        <Txt key={`header-remises-${tableIndex}`}
          text="remises"
          fill={PALETTE.secondary}
          fontSize={() => vW() * 0.0105}
          fontFamily={MONO}
          x={remiseX} y={headerY}
        />
        <Txt key={`header-rendues-${tableIndex}`}
          text="rendues"
          fill={PALETTE.secondary}
          fontSize={() => vW() * 0.0105}
          fontFamily={MONO}
          x={renduX} y={headerY}
        />
        {Array.from({length: lodging.rowCount}, (unused, rowIndex) => (
          <Layout key={`row-${tableIndex}-${rowIndex}`}>
            <Txt key={`row-label-${tableIndex}-${rowIndex}`}
              text={`Logement ${rowIndex + 1}`}
              fill={PALETTE.cream}
              fontSize={() => vW() * 0.0115}
              fontFamily={MONO}
              offset={[-1, 0]}
              x={labelX} y={() => rowY(rowIndex)}
            />
            <Rect key={`remise-box-${tableIndex}-${rowIndex}`}
              ref={remiseBoxRefs[tableIndex][rowIndex]}
              width={cellSize} height={cellSize}
              x={remiseX} y={() => rowY(rowIndex)}
              fill={'#00000000'}
              stroke={PALETTE.ghost}
              lineWidth={2}
              radius={() => vW() * 0.003}
            />
            <Icon key={`remise-check-${tableIndex}-${rowIndex}`}
              ref={remiseCheckRefs[tableIndex][rowIndex]}
              icon="mdi:check"
              size={() => vW() * 0.016}
              color={PALETTE.vert}
              x={remiseX} y={() => rowY(rowIndex)}
              scale={0.3}
              opacity={0}
            />
            <Rect key={`rendu-box-${tableIndex}-${rowIndex}`}
              ref={renduBoxRefs[tableIndex][rowIndex]}
              width={cellSize} height={cellSize}
              x={renduX} y={() => rowY(rowIndex)}
              fill={'#00000000'}
              stroke={PALETTE.ghost}
              lineWidth={2}
              radius={() => vW() * 0.003}
            />
            <Icon key={`rendu-check-${tableIndex}-${rowIndex}`}
              ref={renduCheckRefs[tableIndex][rowIndex]}
              icon="mdi:check"
              size={() => vW() * 0.016}
              color={PALETTE.vert}
              x={renduX} y={() => rowY(rowIndex)}
              scale={0.3}
              opacity={0}
            />
          </Layout>
        ))}
        {tableIndex === lateTableIndex && (
          <Rect key="late-row-highlight" ref={lateRowHighlight}
            width={() => cardWidth() * 0.92} height={() => vH() * 0.065}
            x={0} y={() => rowY(lateRowIndex)}
            fill={PALETTE.jaune + '14'}
            stroke={PALETTE.jaune}
            lineWidth={2}
            radius={() => vW() * 0.004}
            opacity={0}
          />
        )}
      </Rect>
    ))}

    {/* Le lendemain */}
    <Rect key="next-day-tag" ref={nextDayTag}
      width={() => vW() * 0.09} height={() => vH() * 0.07}
      y={() => -vH() * 0.38}
      fill={PALETTE.nodeBg}
      stroke={PALETTE.vert}
      lineWidth={2}
      radius={() => vW() * 0.004}
      opacity={0}
    >
      <Icon key="next-day-icon"
        icon="mdi:weather-sunset-up"
        size={() => vW() * 0.02}
        color={PALETTE.vert}
        x={() => -vW() * 0.025}
      />
      <Txt key="next-day-text"
        text="J+1"
        fill={PALETTE.vert}
        fontSize={() => vW() * 0.014}
        fontFamily={MONO}
        fontWeight={700}
        x={() => vW() * 0.016}
      />
    </Rect>
  </>);

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Une case se coche : fond vert, coche qui pop. */
  function* checkCell(boxRef: typeof lateRowHighlight, checkRef: typeof remiseCheckRefs[0][0], duration: number) {
    yield* all(
      boxRef().fill(PALETTE.vert + '33', duration),
      boxRef().stroke(PALETTE.vert, duration),
      checkRef().opacity(1, duration),
      checkRef().scale(1, duration, easeOutCubic),
    );
  }

  // ── ANIMATION ──────────────────────────────────────────────────────────────

  // 1. Deux tableaux vides
  yield* waitUntil('tableau');
  yield* gridRef().opacity(0.07, 0.8);
  yield* sequence(0.3,
    ...cardRefs.map(cardRef => cardRef().opacity(1, 0.6)),
  );
  yield* waitFor(0.4);

  // 2. Arrivée : les clés sont remises, une par une
  yield* waitUntil('arrivee');
  const arrivalChecks = [];
  for (let tableIndex = 0; tableIndex < lodgings.length; tableIndex++) {
    for (let rowIndex = 0; rowIndex < lodgings[tableIndex].rowCount; rowIndex++) {
      arrivalChecks.push(
        checkCell(remiseBoxRefs[tableIndex][rowIndex], remiseCheckRefs[tableIndex][rowIndex], 0.3),
      );
    }
  }
  yield* sequence(0.22, ...arrivalChecks);
  yield* waitFor(0.4);

  // 3. Départ : tout le monde part en même temps, sauf une ligne
  yield* waitUntil('depart');
  yield* nextDayTag().opacity(1, 0.4);
  const departureChecks = [];
  for (let tableIndex = 0; tableIndex < lodgings.length; tableIndex++) {
    for (let rowIndex = 0; rowIndex < lodgings[tableIndex].rowCount; rowIndex++) {
      if (tableIndex === lateTableIndex && rowIndex === lateRowIndex) continue;
      departureChecks.push(
        checkCell(renduBoxRefs[tableIndex][rowIndex], renduCheckRefs[tableIndex][rowIndex], 0.2),
      );
    }
  }
  yield* sequence(0.05, ...departureChecks);
  yield* waitFor(0.5);
  // La ligne qui reste vide clignote, puis se coche
  for (let blinkIndex = 0; blinkIndex < 3; blinkIndex++) {
    yield* lateRowHighlight().opacity(1, 0.2, easeInOutCubic);
    yield* lateRowHighlight().opacity(0.2, 0.25, easeInOutCubic);
  }
  yield* lateRowHighlight().opacity(1, 0.2);
  yield* checkCell(
    renduBoxRefs[lateTableIndex][lateRowIndex],
    renduCheckRefs[lateTableIndex][lateRowIndex],
    0.4,
  );
  yield* lateRowHighlight().opacity(0, 0.5);
  yield* waitFor(1);
});
